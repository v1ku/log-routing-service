const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const app = express();

// Middleware
app.use(morgan('dev')); // logging
app.use(bodyParser.json()); // for parsing application/json

let logs = [];
let logFileName = 'logs1.txt';
if (!fs.existsSync(logFileName)){
    fs.writeFileSync(logFileName, ''); // Create the file
}

// Create a connection pool to the MySQL database.
const pool = mysql.createPool({
    connectionLimit : 10,
    host     : process.env.DB_HOST, // use environment variable here
    user     : 'root',      // replace with your mysql username
    password : 'password',  // replace with your mysql password
    database : 'logs'       // replace with your database name
});

app.post('/log', (req, res) => {
    const logData = req.body;
    const size = Buffer.byteLength(JSON.stringify(logData), 'utf8') + 1; // +1 for newline

    if(fs.existsSync(logFileName)){
        const stats = fs.statSync(logFileName);
        const fileSizeInBytes = stats["size"];

        // If adding this log will exceed 10MB, write existing logs to current file and start a new one
        if(fileSizeInBytes + size > 10 * 1024 * 1024) {
            if(logs.length){
                writeLogsToDb(logs);
                const dataToWrite = JSON.stringify(logs);
                fs.appendFileSync(logFileName, dataToWrite);
                logs = [];
            }
            // Start a new file
            const match = logFileName.match(/(\d+)/);
            logFileName = 'logs' + (parseInt(match ? match[0] : "0") + 1) + '.txt';
            while(fs.existsSync(logFileName)){
                const match = logFileName.match(/(\d+)/);
                logFileName = 'logs' + (parseInt(match ? match[0] : "0") + 1) + '.txt';
            }
            // Create the new file immediately after setting its name
            fs.writeFileSync(logFileName, '');
        }
    }
    logs.push(logData);
    res.status(200).json({
        status: 'success',
        message: 'Log data received'
    });
});

let transactionInProgress = false;
let writeTimer;

const writeToFile = async () => {
    if (logs.length && !transactionInProgress) {
        transactionInProgress = true;
        pool.getConnection((err, connection) => {
            if(err) {
                console.error("Error getting DB connection:", err);
                transactionInProgress = false;
                return;
            }
            connection.beginTransaction(err => {
                if (err) {
                    console.error("Error beginning transaction:", err);
                    connection.release();
                    transactionInProgress = false;
                    return;
                }
                writeLogsToDb(connection, logs, (err, results) => {
                    if (err) {
                        return connection.rollback(() => {
                            console.error("Error inserting logs, rolling back:", err);
                            connection.release();
                            transactionInProgress = false;
                        });
                    }
                    const dataToWrite = JSON.stringify(logs);
                    fs.appendFileSync(logFileName, dataToWrite);
                    logs = [];
                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => {
                                console.error("Error committing transaction, rolling back:", err);
                            });
                        }
                        console.log("Transaction complete");

                        // Only unlink the file if the commit was successful
                        if (!err && fs.existsSync(logFileName)){
                            fs.unlinkSync(logFileName);
                        }
                    });
                    connection.release();
                    transactionInProgress = false;
                });
            });
        });
    }
    
    const stats = fs.statSync(logFileName);
    const fileSizeInBytes = stats["size"];
    
    // Restart timer if file size is less than 10MB
    if (fileSizeInBytes < 10 * 1024 * 1024) {
        writeTimer = setTimeout(writeToFile, 30000);
    }
}

// Function to write a batch of logs to the database
const writeLogsToDb = (connection, logs, callback) => {
    let values = logs.map(log => [log.id, log.unix_ts, log.user_id, log.event_name]);
    connection.query('INSERT INTO log (id, unix_ts, user_id, event_name) VALUES ?', [values], callback);
}

// Start the write timer immediately
writeTimer = setTimeout(writeToFile, 30000);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

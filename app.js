const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');

const app = express();

// Middleware
app.use(morgan('dev')); // logging
app.use(bodyParser.json()); // for parsing application/json

let logs = [];

app.post('/log', (req, res) => {
    const logData = req.body;
    logs.push(logData);
    res.status(200).json({
        status: 'success',
        message: 'Log data received'
    });
});

let writeTimer;

const writeToFile = () => {
    if(logs.length){
        const dataToWrite = JSON.stringify(logs) + '\n';
        logs = [];
        fs.appendFileSync('logs.txt', dataToWrite);
    }
    
    const stats = fs.statSync('logs.txt');
    const fileSizeInBytes = stats["size"];
    
    // Restart timer if file size is less than 10MB
    if (fileSizeInBytes < 10 * 1024 * 1024) {
        writeTimer = setTimeout(writeToFile, 30000);
    }
}

// Start the write timer immediately
writeTimer = setTimeout(writeToFile, 30000);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

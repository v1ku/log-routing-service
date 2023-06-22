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

setInterval(() => {
    if(logs.length){
        const dataToWrite = logs.join('\n');
        logs = [];
        fs.appendFileSync('logs.txt', dataToWrite);
    }
}, 30000); // runs every 30 seconds

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

const axios = require('axios');

const sendLogRequest = async () => {
    const logData = {
        id: Math.floor(Math.random() * 10000),
        unix_ts: Math.floor(Date.now() / 1000),
        user_id: Math.floor(Math.random() * 10000),
        event_name: Math.random() > 0.5 ? "login" : "logout"
    };

    try {
        const res = await axios.post('http://172.28.0.3:3000/log', logData);
        console.log(`Status: ${res.status}`);
        console.log('Body: ', res.data);
    } catch (err) {
        console.error(err);
    }
};

setInterval(sendLogRequest, 1); // Send a request every 1ms for approximately 1000 req/sec

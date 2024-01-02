require('dotenv').config();
const listenPort = process.argv.length === 2 ? 5025 : 5325;
const hostname = 'app.fusaion.ai'
const privateKeyPath = `/etc/letsencrypt/live/qdrant.fusaion.ai/privkey.pem`;
const fullchainPath = `/etc/letsencrypt/live/qdrant.fusaion.ai/fullchain.pem`;

const express = require('express');
const https = require('https');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.static('public'));
app.use(express.json({limit: '200mb'})); 
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

const httpsServer = https.createServer({
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(fullchainPath),
  }, app);
  

httpsServer.listen(listenPort, '0.0.0.0', () => {
    console.log(`HTTPS Server running on port ${listenPort}`);
});
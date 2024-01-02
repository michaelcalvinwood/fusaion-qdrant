require('dotenv').config();
const listenPort = process.argv.length === 2 ? 5025 : 5325;
const hostname = 'app.fusaion.ai'
const privateKeyPath = `/etc/letsencrypt/live/qdrant.fusaion.ai/privkey.pem`;
const fullchainPath = `/etc/letsencrypt/live/qdrant.fusaion.ai/fullchain.pem`;

const express = require('express');
const https = require('https');
const cors = require('cors');
const fs = require('fs');

const qdrant = require('./utils/qdrant');

const secretKey = process.env.QDRANT_KEY;

const app = express();
app.use(express.static('public'));
app.use(express.json({limit: '200mb'})); 
app.use(cors());

const handleCreateCollection = async (req, res) => {
    const { key, collectionName, diskBased } = req.body;
    if (key !== secretKey) return res.status(401).json('unauthorized');
    if (!collectionName) return res.status(400).json('bad command');

    const result = qdrant.createOpenAICollection(collectionName, diskBased ? true : false);
    if (result !== false) return res.status(200).json(result);
    return res.status(500).json('internal server error');
}


app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.post('/createCollection', (req, res) => handleCreateCollection(req, res));

const httpsServer = https.createServer({
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(fullchainPath),
  }, app);
  

httpsServer.listen(listenPort, '0.0.0.0', () => {
    console.log(`HTTPS Server running on port ${listenPort}`);
});
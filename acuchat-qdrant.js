require('dotenv').config();
const listenPort = process.argv.length === 2 ? 5025 : 5325;
const privateKeyPath = `/etc/letsencrypt/live/qdrant.acuchat.ai/privkey.pem`;
const fullchainPath = `/etc/letsencrypt/live/qdrant.acuchat.ai/fullchain.pem`;

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

const swrapper = async (req, res, handler) => {
    try {
        const { key } = req.body;
        if (!key) return res.status(400).json('bad command');
        if (key !== secretKey) return res.status(401).json('unauthorized');
        await handler(req, res);
    } catch (err) {
        console.error(err);
        return res.status(500).json('internal server error');
    }
}

const hwrapper = async (req, res, handler) => {
    try {
        await handler(req, res);
    } catch (err) {
        console.error(err);
        return res.status(500).json('internal server error');
    }
}

const handleCreateCollection = async (req, res) => {
    let { key, collectionName, diskBased } = req.body;
    if (key !== secretKey) return res.status(401).json('unauthorized');
    if (!collectionName) return res.status(400).json('bad command');
    if (typeof diskBased === 'undefined') diskBased = true;
    const result = await qdrant.createOpenAICollection(collectionName, diskBased ? true : false);
    if (result !== false) return res.status(200).json(result);
    return res.status(500).json('internal server error');
}

const handleCollectionInfo = async (req, res) => {
    const { key, collectionName } = req.body;
    if (!collectionName) return res.status(400).json('bad command');
    if (key !== secretKey) return res.status(401).json('unauthorized');

    const result = await qdrant.collectionInfo(collectionName);
    return res.status(200).json(result);
}

const handleDeleteCollection = async (req, res) => {
    const { key, collectionName } = req.body;
    if (!collectionName) return res.status(400).json('bad command');
    if (key !== secretKey) return res.status(401).json('unauthorized');

    const result = await qdrant.deleteCollection(collectionName);
    return res.status(200).json(result);
}

const handleDeleteContent = async (req, res) => {
    const { collectionName, contentId } = req.body;
    if (!contentId || !collectionName) return res.status(400).json('bad command');
    


    const result = await qdrant.deleteCollection(collectionName);
    return res.status(200).json(result);
}

const handleAddOpenAIPoint = async (req, res) => {
    console.log(req.body);
    const { openAIKey, collectionName, pointId, content, payload, key } = req.body;
    if (key !== secretKey) return res.status(401).json('unauthorized');
    if (!openAIKey || !collectionName || !pointId || !content) return res.status(400).json('bad command');

    const result = await qdrant.addOpenAIPoint(openAIKey, collectionName, pointId, content, payload ? payload : false);
    return res.status(200).json(result);
}

const handleGetContentPoints = async (req, res) => {
    const { collectionName, contentId } = req.body;

    if (!collectionName || !contentId ) return res.status(400).json('Bad command');
    return await qdrant.getContentPoints(collectionName, contentId);
}

const handleQuery = async (req, res) => {
    const { openAIKey, query, collectionName, key } = req.body;
    if (!query || ! collectionName || !key ) return res.status(400).json('bad command');
    if (key !== secretKey) return res.status(401).json('unauthorized');

    const num = req.body.num ? req.body.num : 5;

    const result = await qdrant.getOpenAIContexts(openAIKey, collectionName, query, num);

    return res.status(200).json(result);
}

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.post('/createCollection', (req, res) => hwrapper(req, res, handleCreateCollection));
app.post('/collectionInfo', (req, res) => hwrapper(req, res, handleCollectionInfo));
app.post('/deleteCollection', (req, res) => hwrapper(req, res, handleDeleteCollection));
app.post('/deleteContent', (req, res) => swrapper(req, res, handleDeleteContent));
app.post('/addOpenAIPoint', (req, res) => hwrapper(req, res, handleAddOpenAIPoint));
app.post('/query', (req, res) => hwrapper(req, res, handleQuery));
app.post('/getContentPoints', (req, res) => swrapper(req, res, handleGetContentPoints));

const httpsServer = https.createServer({
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(fullchainPath),
  }, app);
  

httpsServer.listen(listenPort, '0.0.0.0', () => {
    console.log(`HTTPS Server running on port ${listenPort}`);
});
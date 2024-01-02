require ('dotenv').config();
const axios = require('axios');
const { Configuration, OpenAIApi } = require("openai");
const { v4: uuidv4 } = require('uuid');
const openai = require('./openai');

exports.createCollection = async (collectionName, size, onDiskPayload = false, distance = 'Cosine') => {
    const request = {
        url: `http://127.0.0.1:6333/collections/${collectionName}`,
        method: 'put',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            "Access-Control-Allow-Origin": "*",
        },
        data: {
            vectors: {
                size,
                distance
            }
        }
    }

    //console.log('onDiskPayload', onDiskPayload);

    if (onDiskPayload) request.data.on_disk_payload = true;
        
    try {
        const response = await axios(request);
        console.log(response.data);   
    } catch(err) {
        
        if (err.response && err.response.data) {
            console.log(err.response.data);
            return err.response.data;
        }
        console.error(err);
        return false;
    }
}

exports.createOpenAICollection = async (collectionName, diskBased = false) => {
    return await this.createCollection(collectionName, 1536, diskBased);
}

exports.collectionInfo = async (collectionName) => {
    const request = {
        url: `http://127.0.0.1:6333/collections/${collectionName}`,
        method: 'get'
    }

    return axios(request);
}

exports.deleteCollection = async (collectionName) => {
    const request = {
        url: `http://127.0.0.1:6333/collections/${collectionName}`,
        method: 'DELETE'
    }

    return axios(request);
}

exports.addPoint = async (collectionName, point) => {
    //console.log('addPoint', host, port, collectionName, point);

    const { id, vector, payload } = point;

    //console.log('vector', vector);
    
    const request = {
        url: `http://127.0.0.1:6333/collections/${collectionName}/points`,
        method: 'put',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            "Access-Control-Allow-Origin": "*",
        },
        data: {
            points: [
                {
                    id, vector

                }
            ]
        }
    }

    if (payload) request.data.points[0].payload = payload;

    return axios(request);
}

exports.addOpenAIPoint = async (openAiKey, collectionName, pointId, content, payload = false) => {
    console.log('qdrant addOpenAIPoint content', content);
    let vector = await openai.getEmbedding(openAiKey, content);

    console.log('Embedding Vector', vector);

    if (vector === false) return false;

    if (payload) {
        await this.addPoint(collectionName, 
            {
                id: pointId, 
                vector, 
                payload
            }
        );
    } else {
        await this.addPoint(collectionName, 
            {
                id: pointId, 
                vector, 
            }
        );
    }

    return vector;
}

exports.getOpenAIContexts = async (openAIKey, collectionName, query, limit = 3) => {

    const vector = await openai.getEmbedding(openAIKey, query);
 
    console.log('vector.length', vector.length)

    const request = {
        url: `http://127.0.0.1:6333/collections/${collectionName}/points/search`,
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            "Access-Control-Allow-Origin": "*",
        },
        data: {
            vector,
            limit,
            "with_payload": true
        }
    }

    let response;

    try {
        response = await axios(request);
        //console.log(response.data);
        const results = response.data.result;
        const contextIds = [];
        for (let i = 0; i < results.length; ++i) {
            contextIds.push(results[i].id);
        }
        return contextIds;
    } catch (err) {
        console.error(err);
        return [];
    }
}
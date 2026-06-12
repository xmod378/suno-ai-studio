const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-target-url'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const targetUrl = event.headers['x-target-url'];
    if (!targetUrl) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Header x-target-url tidak ditemukan.' }) };
    }

    const apiHeaders = { 'Content-Type': 'application/json' };
    if (event.headers['authorization']) apiHeaders['authorization'] = event.headers['authorization'];
    if (event.headers['x-api-key']) apiHeaders['x-api-key'] = event.headers['x-api-key'];
    if (event.headers['token']) apiHeaders['token'] = event.headers['token'];

    try {
        const fetchOptions = {
            method: event.httpMethod,
            headers: apiHeaders
        };

        if (event.httpMethod === 'POST') {
            fetchOptions.body = event.body;
        }

        const apiResponse = await fetch(targetUrl, fetchOptions);
        const resData = await apiResponse.json();

        return {
            statusCode: apiResponse.status,
            headers,
            body: JSON.stringify(resData)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Backend Netlify Proxy Error: ' + error.message })
        };
    }
};
const https = require('https');

exports.handler = async function (event, context) {
    // Header wajib CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-target-url, token'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const targetUrl = event.headers['x-target-url'] || event.headers['X-Target-Url'];
    if (!targetUrl) {
        return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Backend Error: Header x-target-url tidak ditemukan.' }) 
        };
    }

    return new Promise((resolve) => {
        const forwardHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (HP-Mobile-Client)'
        };

        // Otomatis membaca token dari frontend (Netlify memaksa semua header menjadi lowercase)
        if (event.headers['authorization']) forwardHeaders['Authorization'] = event.headers['authorization'];
        if (event.headers['x-api-key']) forwardHeaders['x-api-key'] = event.headers['x-api-key'];
        if (event.headers['token']) forwardHeaders['token'] = event.headers['token'];

        const options = {
            method: event.httpMethod,
            headers: forwardHeaders
        };

        // Menembak server target menggunakan enkripsi HTTPS murni bawaan Node.js
        const req = https.request(targetUrl, options, (res) => {
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers,
                    body: rawData
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Koneksi Proxy Putus: ' + err.message })
            });
        });

        // Jika ada bodi data JSON (POST Request), kirimkan ke server tujuan
        if (event.httpMethod === 'POST' && event.body) {
            req.write(event.body);
        }
        req.end();
    });
};
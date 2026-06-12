exports.handler = async function (event, context) {
    // Header wajib CORS agar Frontend HP kamu diizinkan mengambil data
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-target-url, token'
    };

    // Respon cepat untuk browser (Preflight Request)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Ambil URL tujuan Suno AI yang dikirim oleh Frontend
    const targetUrl = event.headers['x-target-url'] || event.headers['X-Target-Url'];
    if (!targetUrl) {
        return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ error: 'Backend Error: Header x-target-url tidak ditemukan.' }) 
        };
    }

    // Salin API Key yang dikirim dari LocalStorage HP kamu
    const apiHeaders = { 'Content-Type': 'application/json' };
    
    // Cek semua kemungkinan variasi penulisan header API Key
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    const apiKeyHeader = event.headers['x-api-key'] || event.headers['X-Api-Key'];
    const tokenHeader = event.headers['token'] || event.headers['Token'];

    if (authHeader) apiHeaders['Authorization'] = authHeader;
    if (apiKeyHeader) apiHeaders['x-api-key'] = apiKeyHeader;
    if (tokenHeader) apiHeaders['token'] = tokenHeader;

    try {
        const fetchOptions = {
            method: event.httpMethod,
            headers: apiHeaders
        };

        // Jika kirim data (POST), teruskan datanya ke Suno AI
        if (event.httpMethod === 'POST' && event.body) {
            fetchOptions.body = event.body;
        }

        // Tembak langsung server-to-server menggunakan global fetch bawaan Netlify
        const apiResponse = await fetch(targetUrl, fetchOptions);
        
        // Ambil teks respon mentah dari Suno AI
        const resText = await apiResponse.text();
        
        let resData;
        try {
            resData = JSON.parse(resText);
        } catch (e) {
            // Jika server Suno tidak mengembalikan JSON (misal maintenance/down)
            resData = { message: resText };
        }

        return {
            statusCode: apiResponse.status,
            headers,
            body: JSON.stringify(resData)
        };
        
    } catch (error) {
        // Jika eror ini muncul, berarti ada masalah jaringan antara Netlify ke server Suno AI tersebut
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Netlify Proxy Gagal Menghubungi Suno AI: ' + error.message })
        };
    }
};
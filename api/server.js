require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const UNSPLASH_BASE_URL = 'https://api.unsplash.com';
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

const client = axios.create({
    baseURL: UNSPLASH_BASE_URL,
    headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`
    }
});

app.get('/api/search/photos', async (req, res) => {
    try {
        const { query, page = 1, per_page = 12, orientation } = req.query;

        const response = await client.get('/search/photos', {
            params: { query, page, per_page, orientation }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            message: 'Error searching photos',
            detail: error.response?.data || error.message
        });
    }
});

app.get('/api/photos/:id', async (req, res) => {
    try {
        const response = await client.get(`/photos/${req.params.id}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching photo details',
            detail: error.response?.data || error.message
        });
    }
});

app.post('/api/photos/:id/download', async (req, res) => {
    try {
        const photoResponse = await client.get(`/photos/${req.params.id}`);
        const downloadLocation = photoResponse.data?.links?.download_location;

        if (!downloadLocation) {
            return res.status(400).json({ message: 'Download location not found' });
        }

        const trackingResponse = await axios.get(downloadLocation, {
            headers: {
                Authorization: `Client-ID ${ACCESS_KEY}`
            }
        });

        res.json({
            message: 'Download tracked successfully',
            result: trackingResponse.data
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error tracking download',
            detail: error.response?.data || error.message
        });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`API running on port ${process.env.PORT || 3000}`);
});
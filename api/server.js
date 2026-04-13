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

function buildResizedUnsplashUrl(rawUrl, width) {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== 'https:') {
        throw new Error('Only https URLs are allowed');
    }

    if (parsed.hostname !== 'images.unsplash.com') {
        throw new Error('Only images.unsplash.com URLs are allowed');
    }

    const w = Number(width);
    if (!Number.isFinite(w) || w <= 0) {
        throw new Error('Invalid width');
    }

    // Keep existing Unsplash params like ixid / ixlib
    parsed.searchParams.set('w', String(Math.round(w)));
    parsed.searchParams.set('fit', 'max');
    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('q', '80');

    // Do NOT set height if you want proportional scaling
    parsed.searchParams.delete('h');

    return parsed.toString();
}

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

app.get('/api/images/resize', async (req, res) => {
    try {
        const { rawUrl, width } = req.query;

        if (!rawUrl || !width) {
            return res.status(400).json({
                message: 'rawUrl and width are required'
            });
        }

        const resizedUrl = buildResizedUnsplashUrl(rawUrl, width);

        const response = await axios.get(resizedUrl, {
            responseType: 'stream'
        });

        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }

        if (response.headers['cache-control']) {
            res.setHeader('Cache-Control', response.headers['cache-control']);
        }

        response.data.pipe(res);
    } catch (error) {
        res.status(400).json({
            message: 'Error proxying resized image',
            detail: error.response?.data || error.message
        });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`API running on port ${process.env.PORT || 3000}`);
});
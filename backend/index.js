require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();

// Connection to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('An error occurred', err));

// OAuth Route
app.get('/auth/github', (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=http://localhost:5000/auth/github/callback`;
    res.redirect(url);
});

// Callback Route
app.get('/auth/github/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const response = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            },
            {
                headers: {
                    accept: 'application/json',
                }
            }
        );
        const accessToken = response.data.access_token;
        res.send(`Logged in! Token: ${accessToken}`);
    } catch (error) {
        res.status(500).send('Error during auth');
    }
});

// Get Github Stats
app.get('/api/stats', async (req, res) => {
    const accessToken = req.query.token;
    try {
        const userRes = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
        });
        const username = userRes.data.login;
        const eventsRes = await axios.get(`https://api.github.com/users/${username}/events`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
        });
        const commits = eventsRes.data
            .filter(event => event.type === 'PushEvent')
            .slice(0,30)
            .map(event => ({
                date: event.creates_at,
                repo: event.repo.name,
            }));
        const prs = eventsRes.data
            .filter(event => event.type === 'PullRequestEvent')
            .slice(0,30)
            .map(event => ({
                date: event.creates_at,
                action: event.payload.action,
                repo: event.repo.name,
            }));
        res.json({ commits, prs });
    } catch (error) {
        res.status(500).send('Error fetching stats', error);
    }
});

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
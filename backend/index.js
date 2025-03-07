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

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
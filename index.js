const fs = require('fs');
const ytdl = require('ytdl-core');
const express = require('express');
const app = express();

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.post('/mp3', async (req, res) => {
    let url = req.query.url;

    await ytdl(url, 'audioonly').pipe(fs.createWriteStream(`./downloads/download.mp3`));

    res.sendFile('./downloads/download.mp3');
});

app.post('/mp4', async (req, res) => {
    let url = req.query.url;

    await ytdl(url).pipe(fs.createWriteStream(`./downloads/download.mp4`));

    res.sendFile('./downloads/download.mp4');
});

app.listen('4040');
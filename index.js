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

    await ytdl(url, { quality: 'audioonly' }).pipe(fs.createWriteStream(`./downloads/download.mp3`));
});

app.post('/mp4', async (req, res) => {
    console.log(req.query);
    let url = req.query.url;

    await ytdl(url).pipe(fs.createWriteStream(`./downloads/download.mp4`));

    //res.sendFile('./downloads/download.mp4', {root: __dirname});
});

app.get('/dlmp3', (req, res) => {
    res.sendFile('./downloads/download.mp3', {root: __dirname});
})
app.get('/dlmp4', (req, res) => {
    res.sendFile('./downloads/download.mp4', {root: __dirname});
})

app.listen('4040');
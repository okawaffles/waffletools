const fs = require('fs');
const ytdl = require('ytdl-core');
const express = require('express');
const fmd = require('formidable');
const app = express();

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.post('/ytdl/mp3', (req, res) => {
    let url = req.query.url;

    ytdl(url, { filter: 'audioonly' }).pipe(fs.createWriteStream(`./downloads/download.mp3`).on('finish', () => {
        res.sendFile('./downloads/download.mp3', {root:__dirname});
        res.end();
    }));
});

app.listen('4040');
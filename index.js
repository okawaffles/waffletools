const fs = require('fs');
const ytdl = require('ytdl-core');
const express = require('express');
const fmd = require('formidable');
const app = express();

app.set('view engine', 'ejs')
app.use('/assets', express.static('./views/assets'))

app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.get('/ytdl', (req, res) => {
    res.render('ytdl.ejs');
});

app.post('/ytdl', (req, res) => {
    let form = new fmd.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) return;

        if (fields.include_video) {
            ytdl(fields.link).pipe(fs.createWriteStream(`./downloads/download.mp4`).on('finish', () => {
                res.send(fs.readFileSync('./downloads/download.mp4'));
                res.end();
            }));
        } else {
            ytdl(fields.link, { filter: 'audioonly' }).pipe(fs.createWriteStream(`./downloads/download.mp3`).on('finish', () => {
                res.send(fs.readFileSync('./downloads/download.mp3'));
                res.end();
            }));
        }
    })
});

app.listen('4040', () => {
    console.log('ready!');
});
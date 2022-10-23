const fs = require('fs');
const ytdl = require('ytdl-core');
const express = require('express');
const fmd = require('formidable');
const { env } = require('process');
const app = express();

// for high quality video downloading
const cp = require('child_process');
const readline = require('readline');
const ffmpeg = require('ffmpeg-static');


// express
app.set('view engine', 'ejs')
app.use('/assets', express.static('./views/assets'))

app.get('/', (req, res) => {
    res.render('index.ejs');
});
app.get('/ytdl', (req, res) => {
    res.render('ytdl.ejs');
});

// change to post /download.mp3 && download.mp4

app.post('/ytdl', (req, res) => {
    let form = new fmd.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) return;

        if (fields.include_video) {
            WT_Download(fields.link, res);
        } else {
            ytdl(fields.link, { filter: 'audioonly', quality: 'highestaudio' }).pipe(fs.createWriteStream(`./downloads/download.mp3`).on('finish', () => {
                let file = fs.readFileSync('./downloads/download.mp3');
                res.send(file);
            }));
        }
    })
});

app.listen('4040', () => {
    console.log('ready!');
});


// high quality video downloading:
// i took this from the ytdl example
function WT_Download(ref, res) {
    try { fs.rmSync('./downloads/download.mp4'); } catch(e) { console.log('skipped delete'); }
    const tracker = {
        start: Date.now(),
        audio: { downloaded: 0, total: Infinity },
        video: { downloaded: 0, total: Infinity },
        merged: { frame: 0, speed: '0x', fps: 0 },
    };

    const audio = ytdl(ref, { quality: 'highestaudio' })
        .on('progress', (_, downloaded, total) => {
            tracker.audio = { downloaded, total };
        });
    const video = ytdl(ref, { quality: 'highestvideo' })
        .on('progress', (_, downloaded, total) => {
            tracker.video = { downloaded, total };
        });


    // Prepare the progress bar (likely to remove)
    let progressbarHandle = null;
    const progressbarInterval = 1000;
    const showProgress = () => {
        readline.cursorTo(process.stdout, 0);
        const toMB = i => (i / 1024 / 1024).toFixed(2);

        process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
        process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

        process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
        process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

        process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
        process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

        process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
        readline.moveCursor(process.stdout, 0, -3);
    };

    // Start the ffmpeg child process
    const ffmpegProcess = cp.spawn(ffmpeg, [
        // Remove ffmpeg's console spamming
        '-loglevel', '8', '-hide_banner',
        // Redirect/Enable progress messages
        '-progress', 'pipe:3',
        // Set inputs
        '-i', 'pipe:4',
        '-i', 'pipe:5',
        // Map audio & video from streams
        '-map', '0:a',
        '-map', '1:v',
        // Keep encoding
        '-c:v', 'copy',
        // Define output file
        './downloads/download.mp4',
    ], {
        windowsHide: true,
        stdio: [
            /* Standard: stdin, stdout, stderr */
            'inherit', 'inherit', 'inherit',
            /* Custom: pipe:3, pipe:4, pipe:5 */
            'pipe', 'pipe', 'pipe',
        ],
    });
    ffmpegProcess.on('close', () => {
        console.log('done');
        // Cleanup
        process.stdout.write('\n\n\n\n');
        clearInterval(progressbarHandle);

        let file = fs.readFileSync('./downloads/download.mp4');
        res.send(file);
        res.end();
    });

    // Link streams
    // FFmpeg creates the transformer streams and we just have to insert / read data
    ffmpegProcess.stdio[3].on('data', chunk => {
        // Start the progress bar
        if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
        // Parse the param=value list returned by ffmpeg
        const lines = chunk.toString().trim().split('\n');
        const args = {};
        for (const l of lines) {
            const [key, value] = l.split('=');
            args[key.trim()] = value.trim();
        }
        tracker.merged = args;
    });
    audio.pipe(ffmpegProcess.stdio[4]);
    video.pipe(ffmpegProcess.stdio[5]);
}
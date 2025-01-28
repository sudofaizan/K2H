const fs = require("fs");
const WebSocket = require("ws");
const { PassThrough } = require("stream");
const ffmpeg = require("fluent-ffmpeg");
const http = require("http");
const path = require("path");

// WebSocket Server code

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  const rawStream = fs.createWriteStream("temp/raw.webm"); // Save raw WebSocket data
  const audioStream = new PassThrough();

  // FFmpeg to convert audio to WAV and suppress noise
  ffmpeg(audioStream)
    .inputFormat("webm") // Input format is WebM
    .audioFilters("afftdn") // Suppress noise using FFmpeg's 'afftdn' filter
    .audioCodec("pcm_s16le") // Encode as WAV format
    .format("wav") // Output WAV format
    .on("start", (cmd) => console.log("FFmpeg command:", cmd))
    .on("error", (err) => console.error("FFmpeg error:", err.message))
    .on("end", () => console.log("Audio conversion to WAV finished"))
    .pipe(fs.createWriteStream("temp/output.wav")); // Save the WAV output


  ws.on("message", (data) => {
    console.log("Received data chunk size:", data.length);
    rawStream.write(data); // Save raw data
    audioStream.write(data); // Send data to FFmpeg
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    rawStream.end();
    audioStream.end();
  });
});

console.log("WebSocket server running on ws://localhost:8080");



//This below code is to serve HTML files.

const PORT = 80;

const server = http.createServer((req, res) => {
    if (req.url === "/" || req.url === "/index.html") {
        const filePath = path.join(__dirname, "public/index.html");
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Internal Server Error");
            } else {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
    }
});

server.listen(PORT, () => {
    console.log(`webserver is running on http://localhost:${PORT}`);
});
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    process.exit();
  });
  
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  process.exit();
});
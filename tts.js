const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS Polly
AWS.config.update({ region: 'us-east-1' }); // Replace with your region
const polly = new AWS.Polly();

// Read text from a file
const filePath = 'temp/op.txt'; // Replace with your text file path
const text = fs.readFileSync(filePath, 'utf8'); // Read file contents as a string

// Polly parameters
const params = {
    OutputFormat: 'mp3', // You can use 'mp3', 'ogg_vorbis', or 'pcm'
    Text: text,          // Use the file's text content here
    VoiceId: 'Kevin',    // Kevin male voice
    Engine: 'neural'     // Use the neural engine
};

// Generate speech
polly.synthesizeSpeech(params, (err, data) => {
    if (err) {
        console.error("Error:", err);
    } else if (data && data.AudioStream instanceof Buffer) {
        fs.writeFileSync('temp/output.mp3', data.AudioStream); // Save audio to file
        console.log('Audio file saved as output.mp3');
    }
});
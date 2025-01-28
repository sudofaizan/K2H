const { TranscribeStreamingClient, StartStreamTranscriptionCommand } = require("@aws-sdk/client-transcribe-streaming");
const fs = require("fs");
const { PassThrough } = require("stream");

// Constants
const REGION = "us-west-2"; // Replace with your AWS region
const SAMPLE_RATE = 48000;
const LANGUAGE_CODE = "en-IN"; // Replace with your desired language code
const AUDIO_FILE_PATH = "temp/output.wav"; // Replace with your audio file path

// Initialize Transcribe Streaming Client
const transcribeClient = new TranscribeStreamingClient({ region: REGION });

// Function to stream audio and handle transcription
async function transcribeAudio() {
  const audioStream = new PassThrough();

  // Read audio file and pipe to PassThrough stream
  fs.createReadStream(AUDIO_FILE_PATH).pipe(audioStream);

  const command = new StartStreamTranscriptionCommand({
    LanguageCode: LANGUAGE_CODE,
    MediaSampleRateHertz: SAMPLE_RATE,
    MediaEncoding: "pcm",
    AudioStream: (async function* () {
      for await (const chunk of audioStream) {
        yield { AudioEvent: { AudioChunk: chunk } };
      }
    })(),
  });

  try {
    const response = await transcribeClient.send(command);

    for await (const event of response.TranscriptResultStream) {
      if (event.TranscriptEvent) {
        const results = event.TranscriptEvent.Transcript.Results;
        for (const result of results) {
          if (result.Alternatives && result.Alternatives.length > 0) {
            console.log("Transcript:", result.Alternatives[0].Transcript);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error during transcription:", error);
  }
}

transcribeAudio();

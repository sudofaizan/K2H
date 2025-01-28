const { TranscribeStreamingClient, StartStreamTranscriptionCommand } = require("@aws-sdk/client-transcribe-streaming");
const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
const fs = require("fs");
const { PassThrough } = require("stream");

// Constants
const REGION = "us-west-2"; // Replace with your AWS region
const SAMPLE_RATE = 48000;
const LANGUAGE_CODE = "en-IN"; // Replace with your desired language code
const AUDIO_FILE_PATH = "temp/output.wav"; // Replace with your audio file path
const OUTPUT_TEXT_FILE = "temp/transcribed_text.txt";
const OUTPUT_AUDIO_FILE = "temp/output.mp3";
const VOICE_ID = "Kevin"; // Replace with your desired Polly voice

// Initialize Transcribe Streaming Client
const transcribeClient = new TranscribeStreamingClient({ region: REGION });

// Initialize Polly Client
const pollyClient = new PollyClient({ region: REGION });

// Function to transcribe audio and convert text to speech
async function transcribeAndConvert() {
  const audioStream = new PassThrough();

  // Read audio file and pipe to PassThrough stream
  fs.createReadStream(AUDIO_FILE_PATH).pipe(audioStream);

  const transcribeCommand = new StartStreamTranscriptionCommand({
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
    const response = await transcribeClient.send(transcribeCommand);
    let fullTranscription = "";

    for await (const event of response.TranscriptResultStream) {
      if (event.TranscriptEvent) {
        const results = event.TranscriptEvent.Transcript.Results;
        for (const result of results) {
          if (result.Alternatives && result.Alternatives.length > 0) {
            const transcript = result.Alternatives[0].Transcript;
            fullTranscription += transcript + " ";
            console.log("Transcript:", transcript);
          }
        }
      }
    }

    // Save the full transcription to a text file
    fs.writeFileSync(OUTPUT_TEXT_FILE, fullTranscription.trim());
    console.log(`Transcription saved to ${OUTPUT_TEXT_FILE}`);

    // Convert the transcribed text to speech using Polly
    const pollyCommand = new SynthesizeSpeechCommand({
      OutputFormat: "mp3",
      Text: fullTranscription,
      VoiceId: VOICE_ID,
      Engine: "neural",
    });

    const pollyResponse = await pollyClient.send(pollyCommand);

    if (pollyResponse.AudioStream instanceof Buffer) {
      fs.writeFileSync(OUTPUT_AUDIO_FILE, pollyResponse.AudioStream);
      console.log(`Audio file saved as ${OUTPUT_AUDIO_FILE}`);
    }
  } catch (error) {
    console.error("Error during transcription or speech synthesis:", error);
  }
}

transcribeAndConvert();

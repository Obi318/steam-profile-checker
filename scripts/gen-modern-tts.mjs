import gTTS from 'gtts';
import fs from 'node:fs';

const text = "Ever get rolled in Arc Raiders and something just feels off? Grab their profile and check it on SteamChecker dot io. It gives a trust score based on things like account age and bans. You can instantly know if they were legit or a sketchy account.";
const out = 'assets/ad/build/final/narration-modern.mp3';

await new Promise((resolve, reject) => {
  const tts = new gTTS(text, 'en');
  tts.save(out, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

if (!fs.existsSync(out)) throw new Error('TTS output missing');
console.log('Generated narration-modern.mp3');

import { ttsSave } from 'edge-tts';

const text = "Ever get rolled in Arc Raiders and something just feels off? Grab their profile and check it on SteamChecker dot io. It gives a trust score based on things like account age and bans. You can instantly know if they were legit or a sketchy account.";

await ttsSave(text, 'assets/ad/build/final/narration-neural.mp3', {
  voice: 'en-US-GuyNeural',
  rate: '+3%',
  pitch: '+0Hz',
  volume: '+0%'
});

console.log('Generated narration-neural.mp3');

let audioContext: AudioContext | null = null;
let alarmTimer: number | null = null;

function getAudioContext() {
  audioContext ??= new AudioContext();
  return audioContext;
}

export function unlockUrgentAudio() {
  const context = getAudioContext();
  if (context.state === 'suspended') void context.resume();
}

export function playUrgentAlarm() {
  unlockUrgentAudio();
  if (alarmTimer !== null) return;
  let count = 0;
  const beep = () => {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(count % 2 === 0 ? 880 : 660, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
    count += 1;
    if (count >= 10) {
      alarmTimer = null;
      return;
    }
    alarmTimer = window.setTimeout(beep, 360);
  };
  beep();
}
/**
 * Notification sound utility
 * Plays a notification sound when called
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize audio context (required for web audio)
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a notification sound using Web Audio API
 * This creates a pleasant notification tone without requiring external files
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    
    // Create oscillator for the tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure the sound - a pleasant notification tone
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime); // First tone at 800Hz
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1); // Second tone at 1000Hz
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01); // Quick attack
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1); // Sustain
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); // Decay
    
    // Play the sound
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
    
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

/**
 * Play a two-tone notification sound (more attention-grabbing)
 */
export function playAlertSound() {
  try {
    const ctx = getAudioContext();
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.value = 800;
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain1.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);
    
    // Second tone (slightly delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.type = 'sine';
    osc2.frequency.value = 1000;
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.16);
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.35);
    
  } catch (error) {
    console.error('Error playing alert sound:', error);
  }
}

/**
 * Notification sound utility
 * Plays a notification sound when called using HTML5 Audio
 */

/**
 * Play a notification sound using HTML5 Audio
 * Simple implementation that works reliably
 */
export function playNotificationSound() {
  try {
    // Create a new audio element each time for reliability
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.6;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Notification sound played successfully');
        })
        .catch(error => {
          console.error('❌ Error playing notification sound:', error);
          if (error.name === 'NotAllowedError') {
            console.warn('⚠️ Audio playback blocked by browser. User interaction required first.');
          }
        });
    }
  } catch (error) {
    console.error('❌ Error creating notification sound:', error);
  }
}

/**
 * Play an alert sound (same as notification)
 */
export function playAlertSound() {
  playNotificationSound();
}

/**
 * Initialize audio (no longer needed but kept for compatibility)
 */
export function initializeAudio() {
  console.log('Audio initialization called (no-op)');
}

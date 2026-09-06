// Simple student-level inactivity timer.
// 15 minutes without mouse / keyboard / touch -> call onTimeout once.
export function startInactivityTimer(onTimeout) {
  const waitTime = 15 * 60 * 1000; // 15 minutes
  let timerId = null;

  function clearOldTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function resetTimer() {
    clearOldTimer();
    timerId = setTimeout(function () {
      onTimeout();
    }, waitTime);
  }

  // Any activity restarts the 15 minute countdown
  const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  for (let i = 0; i < events.length; i++) {
    document.addEventListener(events[i], resetTimer);
  }

  resetTimer();
}

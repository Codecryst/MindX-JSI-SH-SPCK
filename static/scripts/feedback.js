// Feedback page script
// Handles feedback submission without authentication

// Import Firebase services and functions from our config file
import {
  db,
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from './firebase-config.js';

// Get the HTML elements from the page
const form = document.getElementById('feedbackForm');
const messageBox = document.getElementById('messageBox');
const severityInput = document.getElementById('severity');
const severityValue = document.getElementById('severityValue');

// Update severity display when slider changes
severityInput.addEventListener('input', function () {
  severityValue.textContent = severityInput.value;
});

// Small helper to show a message
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = 'message-box show ' + type;
}

// Find the next available feedback number (uid_1, uid_2, etc.)
async function getNextFeedbackNumber() {
  const snapshot = await getDocs(collection(db, 'feedback'));
  let maxNum = 0;
  snapshot.forEach(function (doc) {
    const match = doc.id.match(/^uid_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return maxNum + 1;
}

// Handle form submission
form.addEventListener('submit', async function (event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  const severity = parseInt(severityInput.value, 10);

  if (title === '' || content === '') {
    showMessage('Please fill in title and details.', 'error');
    return;
  }

  try {
    const nextNum = await getNextFeedbackNumber();
    const docName = 'uid_' + nextNum;

    await setDoc(doc(db, 'feedback', docName), {
      email: email,
      title: title,
      content: content,
      severity: severity,
      createdAt: serverTimestamp(),
    });

    showMessage('Feedback submitted! Thank you.', 'success');
    form.reset();
    severityValue.textContent = '5';
    severityInput.value = '5';
  } catch (error) {
    console.log(error.code, error.message);
    showMessage('Failed to submit feedback: ' + error.message, 'error');
  }
});
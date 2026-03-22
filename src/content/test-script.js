// Minimal test script
console.log('[TEST-SCRIPT] This is a test content script - if you see this, content scripts CAN load');
console.error('[TEST-SCRIPT] ERROR test message');
console.warn('[TEST-SCRIPT] WARN test message');

// Try to send a message to the background
try {
  chrome.runtime.sendMessage(
    { type: 'TEST', data: { message: 'Test from content script' } },
    (response) => {
      console.log('[TEST-SCRIPT] Got response from background:', response);
    }
  );
} catch (error) {
  console.error('[TEST-SCRIPT] Error sending message:', error);
}

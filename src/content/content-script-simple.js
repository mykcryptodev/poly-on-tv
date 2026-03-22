/**
 * Simple content script that injects the iframe widget
 * All widget logic is now in the iframe
 */

console.log('[ContentScript] Starting iframe injection...');

// Wait for document to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectWidget);
} else {
  injectWidget();
}

function injectWidget() {
  console.log('[ContentScript] Injecting iframe widget...');

  try {
    // Create a transparent container that won't interfere with page
    const container = document.createElement('div');
    container.id = 'polymarket-iframe-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483647;
      pointer-events: none;
      background: transparent;
    `;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'polymarket-widget-iframe';
    iframe.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      pointer-events: auto;
      z-index: 2147483647;
    `;
    iframe.src = chrome.runtime.getURL('src/content/iframe-widget.html');

    container.appendChild(iframe);
    document.documentElement.appendChild(container);

    console.log('[ContentScript] Setting up message listener...');
    // Listen for messages from iframe
    const messageHandler = (event) => {
      console.log('[ContentScript] MESSAGE RECEIVED:', event);
      console.log('[ContentScript] Message data:', event.data);
      console.log('[ContentScript] Message type:', event.data?.type);
      if (event.data && event.data.type === 'REMOVE_WIDGET') {
        console.log('[ContentScript] Removing widget container!');
        container.remove();
        console.log('[ContentScript] Container removed');
      }
    };

    window.addEventListener('message', messageHandler, false);
    console.log('[ContentScript] Message listener attached');

    console.log('[ContentScript] Iframe injected successfully');
  } catch (error) {
    console.error('[ContentScript] Error injecting iframe:', error);
  }
}

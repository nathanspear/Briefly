// Content script for ChatGPT Page Researcher extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractPageContent') {
    const pageData = extractPageContent();
    sendResponse(pageData);
  }
});

// Function to extract content from the current page
function extractPageContent() {
  const title = document.title;
  const url = window.location.href;
  
  // Get main content, avoiding navigation and ads
  const contentSelectors = [
    'main',
    'article',
    '.content',
    '.post-content',
    '.entry-content',
    '.article-content',
    '#content',
    '.main-content',
    '.post',
    '.story',
    '.article-body'
  ];
  
  let mainContent = '';
  
  // Try to find main content area
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      mainContent = element.innerText;
      break;
    }
  }
  
  // If no main content found, get body text but exclude navigation and footer
  if (!mainContent) {
    // Clone the body and remove unwanted elements
    const bodyClone = document.body.cloneNode(true);
    
    // Remove common navigation and footer elements
    const unwantedSelectors = [
      'nav', 'header', 'footer', 'aside',
      '.navigation', '.nav', '.menu', '.sidebar',
      '.footer', '.header', '.ads', '.advertisement',
      '.social', '.share', '.comments', '.comment'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = bodyClone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    mainContent = bodyClone.innerText || '';
  }
  
  // Clean and limit the content
  mainContent = mainContent
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines with double newlines
    .trim();
  
  // Limit content length to avoid overwhelming ChatGPT
  if (mainContent.length > 3000) {
    mainContent = mainContent.substring(0, 3000) + '...';
  }
  
  // Get meta description if available
  const metaDescription = document.querySelector('meta[name="description"]');
  const description = metaDescription ? metaDescription.getAttribute('content') : '';
  
  return {
    title,
    url,
    content: mainContent,
    description: description
  };
}

// Check if we're on ChatGPT and handle prompt injection
if (window.location.hostname === 'chat.openai.com') {
  // Wait for page to load and check for stored prompt
  setTimeout(async () => {
    try {
      const tabId = await getCurrentTabId();
      const result = await chrome.storage.local.get(`prompt_${tabId}`);
      const prompt = result[`prompt_${tabId}`];
      
      if (prompt) {
        // Inject the prompt
        injectPromptToChatGPT(decodeURIComponent(prompt));
        
        // Clean up the stored prompt
        await chrome.storage.local.remove(`prompt_${tabId}`);
      }
    } catch (error) {
      console.error('Error handling ChatGPT prompt:', error);
    }
  }, 2000);
}

// Function to get current tab ID
async function getCurrentTabId() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({action: 'getCurrentTabId'}, (response) => {
      resolve(response.tabId);
    });
  });
}

// Function to inject prompt into ChatGPT
function injectPromptToChatGPT(prompt) {
  // Wait for ChatGPT to be ready
  const waitForChatGPT = setInterval(() => {
    const selectors = [
      'textarea[data-id="root"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      'textarea',
      '#prompt-textarea',
      '[contenteditable="true"]'
    ];
    
    let inputElement = null;
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.offsetHeight > 0) {
        inputElement = element;
        break;
      }
    }
    
    if (inputElement) {
      clearInterval(waitForChatGPT);
      
      // Set the prompt
      inputElement.value = prompt;
      inputElement.focus();
      
      // Trigger input events
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Try to automatically submit 
      setTimeout(() => {
        const submitButton = document.querySelector('button[data-testid="send-button"]') ||
                           document.querySelector('button[type="submit"]') ||
                           document.querySelector('button:last-child');
        
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
          console.log('Prompt submitted successfully!');
        }
      }, 3000);
    }
  }, 1000);
  
  // Stop trying after 30 seconds
  setTimeout(() => {
    clearInterval(waitForChatGPT);
  }, 30000);
} 
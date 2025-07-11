// Listen for the keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'research-page') {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        console.error('No active tab found');
        return;
      }
      
      // Extract only URL and basic page info from the current tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const title = document.title;
          const url = window.location.href;
          
          // Get meta description if available
          const metaDescription = document.querySelector('meta[name="description"]');
          const description = metaDescription ? metaDescription.getAttribute('content') : '';
          
          // Extract domain name for company identification
          const domain = new URL(url).hostname;
          
          return {
            title,
            url,
            domain,
            description: description
          };
        }
      });
      
      if (results && results[0] && results[0].result) {
        const pageData = results[0].result;
        console.log('Extracted page data:', pageData);
        
        // Create the research prompt
        const prompt = createResearchPrompt(pageData);
        
        // Open ChatGPT with the research prompt
        await openChatGPTWithPrompt(prompt);
      } else {
        console.error('Failed to extract page content');
        // Fallback: just open ChatGPT 4o
        await chrome.tabs.create({
          url: 'https://chat.openai.com/?model=gpt-4o'
        });
      }
    } catch (error) {
      console.error('Error in research-page command:', error);
      
      // Fallback: just open ChatGPT 4o if there's an error
      await chrome.tabs.create({
        url: 'https://chat.openai.com/?model=gpt-4o'
      });
    }
  }
});



// Function to create a research prompt
function createResearchPrompt(pageData) {
  const prompt = `Please conduct comprehensive company research for the following website:

**URL:** ${pageData.url}
**Domain:** ${pageData.domain}
**Company/Page Title:** ${pageData.title}
${pageData.description ? `**Description:** ${pageData.description}` : ''}

Please provide detailed research covering these key areas:

**1. Company Overview & Purpose**
- What does this company do, and why do they exist?
- What problem are they solving?
- Who are their primary customers?
- How do they differentiate themselves from competitors?

**2. Leadership & Founding Team**
- Who founded the company and when?
- Who runs the company today (CEO, key executives)?
- What is the leadership's background and vision?
- Have there been any major recent leadership changes?

**3. Financial Performance & Status**
- How is the company performing financially?
- Are they growing, profitable, or under financial pressure?
- Have they raised funding recently or undergone layoffs?
- What's their revenue model and business model?

**4. Cloud Strategy & Infrastructure**
- What's their cloud strategy and infrastructure footprint?
- Which cloud providers do they use (AWS, Azure, GCP)?
- How important is cloud asset management to their operations?
- Are they cloud-native or migrating to cloud?

**5. FinOps & Cost Optimization**
- How do they approach FinOps and cost optimization?
- Do they have dedicated FinOps tools or practices?
- Is cloud spend a strategic priority or a pain point?
- How do they manage technology costs?

**6. Security & Compliance**
- What's their stance on security operations and compliance?
- How are security responsibilities structured (CISO, DevSecOps)?
- Have they faced any recent breaches or security audits?
- What compliance frameworks do they follow?

**7. Strategic Direction & Future**
- Where are they headed, and what's driving their roadmap?
- What trends or pressures are shaping their strategy (AI, cost, regulation)?
- Are they expanding, launching new products, or entering new markets?
- What are their key strategic initiatives?

Please provide specific, actionable insights based on publicly available information about this company.`;

  return encodeURIComponent(prompt);
}

// Function to open ChatGPT with the research prompt
async function openChatGPTWithPrompt(prompt) {
  // Create a new tab with ChatGPT 4o
  const chatGPTTab = await chrome.tabs.create({
    url: 'https://chat.openai.com/?model=gpt-4o'
  });
  
  // Store the prompt to be used when ChatGPT loads
  await chrome.storage.local.set({
    [`prompt_${chatGPTTab.id}`]: prompt
  });
  
  // Wait a bit for ChatGPT to load, then inject the prompt
  setTimeout(async () => {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: chatGPTTab.id },
        function: injectPrompt,
        args: [prompt]
      });
    } catch (error) {
      console.error('Error injecting prompt:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(decodeURIComponent(prompt));
        console.log('Prompt copied to clipboard as fallback');
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
      }
    }
  }, 5000);
}

// Function to inject the prompt into ChatGPT
function injectPrompt(prompt) {
  const decodedPrompt = decodeURIComponent(prompt);
  console.log('Attempting to inject prompt:', decodedPrompt.substring(0, 100) + '...');
  
  // Wait for ChatGPT to load and try multiple times
  let attempts = 0;
  const maxAttempts = 10;
  
  const tryInject = () => {
    attempts++;
    console.log(`Injection attempt ${attempts}/${maxAttempts}`);
    
    // Try to find the textarea for ChatGPT input
    const selectors = [
      'textarea[data-id="root"]',
      'textarea[placeholder*="message"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="ChatGPT"]',
      'textarea',
      '#prompt-textarea',
      '[contenteditable="true"]'
    ];
    
    let inputElement = null;
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element && element.offsetHeight > 0 && !element.disabled) {
          inputElement = element;
          console.log('Found input element:', selector);
          break;
        }
      }
      if (inputElement) break;
    }
    
    if (inputElement) {
      // Clear existing content and set the prompt
      inputElement.value = '';
      inputElement.textContent = '';
      
      // Set the prompt
      if (inputElement.tagName === 'TEXTAREA') {
        inputElement.value = decodedPrompt;
      } else {
        inputElement.textContent = decodedPrompt;
      }
      
      // Focus and trigger events
      inputElement.focus();
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      inputElement.dispatchEvent(new Event('keyup', { bubbles: true }));
      
      console.log('Prompt injected successfully, waiting 3 seconds before submitting...');
      
      // Wait 3 seconds then automatically submit
      setTimeout(() => {
        console.log('Attempting to submit the prompt...');
        
        // Try to find and click the submit button
        const submitSelectors = [
          'button[data-testid="send-button"]',
          'button[type="submit"]',
          'button[aria-label*="Send"]',
          'button[title*="Send"]',
          'svg[data-testid="send-button"]',
          'button:has(svg[data-testid="send-button"])',
          'button[data-testid="fruitjuice-send-button"]'
        ];
        
        let submitButton = null;
        
        for (const selector of submitSelectors) {
          try {
            const button = document.querySelector(selector);
            if (button && !button.disabled && button.offsetHeight > 0) {
              submitButton = button;
              console.log('Found submit button:', selector);
              break;
            }
          } catch (e) {
            // Continue to next selector if this one fails
          }
        }
        
        if (submitButton) {
          submitButton.click();
          console.log('Prompt submitted successfully!');
        } else {
          // Fallback: Try Enter key press
          console.log('Submit button not found, trying Enter key...');
          inputElement.focus();
          
          // Create and dispatch Enter key event
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            keyCode: 13,
            code: 'Enter',
            which: 13,
            bubbles: true,
            cancelable: true
          });
          
          inputElement.dispatchEvent(enterEvent);
          
          // Also try keyup event
          const enterEventUp = new KeyboardEvent('keyup', {
            key: 'Enter',
            keyCode: 13,
            code: 'Enter',
            which: 13,
            bubbles: true,
            cancelable: true
          });
          
          inputElement.dispatchEvent(enterEventUp);
          console.log('Enter key event dispatched');
        }
      }, 3000);
      
      return true;
    } else {
      console.log('Input element not found, trying again...');
      
      if (attempts < maxAttempts) {
        setTimeout(tryInject, 1000);
      } else {
        console.log('Max attempts reached, copying to clipboard as fallback');
        // Copy to clipboard as fallback
        navigator.clipboard.writeText(decodedPrompt).then(() => {
          console.log('Prompt copied to clipboard - paste it into ChatGPT');
          alert('ChatGPT research prompt copied to clipboard! Please paste it into the chat.');
        }).catch(err => {
          console.error('Failed to copy prompt to clipboard:', err);
          alert('Failed to inject prompt. Please manually copy the research prompt from the console.');
        });
      }
    }
  };
  
  // Start trying after a short delay
  setTimeout(tryInject, 1000);
} 
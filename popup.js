// Popup script for ChatGPT Page Researcher extension

document.addEventListener('DOMContentLoaded', function() {
    const researchButton = document.getElementById('research-current-page');
    const openChatGPTButton = document.getElementById('open-chatgpt');
    const statusDiv = document.getElementById('status');
    
    // Handle research current page button
    researchButton.addEventListener('click', async function() {
        try {
            statusDiv.textContent = 'Extracting page content...';
            researchButton.disabled = true;
            
            // Get the current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            
            // Extract page content from the current tab
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractPageContent
            });
            
            if (results && results[0]) {
                const pageData = results[0].result;
                
                statusDiv.textContent = 'Opening ChatGPT...';
                
                // Create the research prompt
                const prompt = createResearchPrompt(pageData);
                
                // Open ChatGPT with the research prompt
                await openChatGPTWithPrompt(prompt);
                
                statusDiv.textContent = 'Research prompt sent to ChatGPT!';
                
                // Close the popup after a short delay
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                throw new Error('Could not extract page content');
            }
        } catch (error) {
            console.error('Error researching page:', error);
            statusDiv.textContent = 'Error: ' + error.message;
            
            // Fallback: just open ChatGPT 4o
            await chrome.tabs.create({
                url: 'https://chat.openai.com/?model=gpt-4o'
            });
        } finally {
            researchButton.disabled = false;
        }
    });
    
    // Handle open ChatGPT button
    openChatGPTButton.addEventListener('click', async function() {
        try {
            statusDiv.textContent = 'Opening ChatGPT...';
            
            await chrome.tabs.create({
                url: 'https://chat.openai.com/?model=gpt-4o'
            });
            
            statusDiv.textContent = 'ChatGPT opened!';
            
            // Close the popup after a short delay
            setTimeout(() => {
                window.close();
            }, 1000);
        } catch (error) {
            console.error('Error opening ChatGPT:', error);
            statusDiv.textContent = 'Error opening ChatGPT';
        }
    });
});

// Function to extract basic page info (URL only)
function extractPageContent() {
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
        }
    }, 3000);
}

// Function to inject the prompt into ChatGPT
function injectPrompt(prompt) {
    const decodedPrompt = decodeURIComponent(prompt);
    
    // Try to find the textarea for ChatGPT input
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
        // Clear existing content and set the prompt
        inputElement.value = decodedPrompt;
        inputElement.focus();
        
        // Trigger input event to notify ChatGPT of the change
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        // If we can't find the input, copy to clipboard as fallback
        navigator.clipboard.writeText(decodedPrompt).then(() => {
            console.log('Prompt copied to clipboard - paste it into ChatGPT');
        }).catch(err => {
            console.error('Failed to copy prompt to clipboard:', err);
        });
    }
} 
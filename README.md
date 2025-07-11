# ChatGPT Company Researcher Chrome Extension

🏢 **Instantly research any company with ChatGPT 4o using a simple keyboard shortcut!**

## Features

- **Quick Company Research**: Press `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows/Linux) to instantly research any company
- **ChatGPT 4o Integration**: Automatically opens ChatGPT 4o with structured company research prompts
- **Comprehensive Business Analysis**: Generates detailed research covering 7 key areas:
  - Company overview, purpose, and market position
  - Leadership team and founding story
  - Financial performance and business model
  - Cloud strategy and infrastructure footprint
  - FinOps and cost optimization approach
  - Security operations and compliance stance
  - Strategic direction and future roadmap
- **URL-Based Research**: Uses only the company URL (no page content scraping)
- **Beautiful Interface**: Clean, modern popup with gradient design
- **Fallback Options**: If automatic prompt injection fails, content is copied to clipboard

## Installation

### Method 1: Developer Mode (Recommended)

1. **Download the extension files**:
   - Clone or download this repository
   - Make sure you have all the files: `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js`

2. **Open Chrome Extensions page**:
   - Go to `chrome://extensions/`
   - Or: Chrome Menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the extension**:
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

5. **Pin the extension** (optional):
   - Click the puzzle piece icon in the Chrome toolbar
   - Pin the "ChatGPT Page Researcher" extension for easy access

### Method 2: Chrome Web Store
*Coming soon! This extension will be submitted to the Chrome Web Store.*

## Usage

### Keyboard Shortcut (Recommended)
1. Navigate to any company website you want to research
2. Press `Cmd+Shift+L` (Mac) or `Ctrl+Shift+L` (Windows/Linux)
3. The extension will:
   - Extract the company URL and basic page info
   - Open a new tab with ChatGPT 4o
   - Automatically fill in a comprehensive company research prompt
   - Focus the input field so you can immediately send the message

### Using the Extension Popup
1. Click the extension icon in the Chrome toolbar
2. Click "Research This Company" to analyze the current company website
3. Or click "Open ChatGPT" to simply open ChatGPT 4o without content

### Manual Research
If automatic prompt injection doesn't work:
1. The content will be copied to your clipboard
2. Simply paste it into ChatGPT manually

## Keyboard Shortcuts

- **Mac**: `Command + Shift + L`
- **Windows/Linux**: `Ctrl + Shift + L`

*Note: You can customize the keyboard shortcut in Chrome's extensions settings.*

## How It Works

1. **URL Analysis**: The extension extracts key information from company websites:
   - Company URL and domain name
   - Page title and meta description
   - Basic page information (no content scraping)

2. **Company Research Prompt**: Creates a structured research prompt covering 7 key business areas:
   - Company overview and market position
   - Leadership team and founding story
   - Financial performance and business model
   - Cloud strategy and infrastructure
   - FinOps and cost optimization
   - Security operations and compliance
   - Strategic direction and future plans

3. **ChatGPT 4o Integration**: Opens ChatGPT 4o and attempts to automatically inject the comprehensive company research prompt

## Customization

### Modifying the Research Prompt
You can customize the research prompt by editing the `createResearchPrompt` function in `background.js` and `popup.js`.

### Adding New Content Selectors
To improve content extraction for specific websites, add new selectors to the `contentSelectors` array in the content extraction functions.

### Changing the Keyboard Shortcut
1. Go to `chrome://extensions/shortcuts`
2. Find "ChatGPT Page Researcher"
3. Click the edit icon and set your preferred shortcut

## Troubleshooting

### The keyboard shortcut doesn't work
- Make sure the extension is enabled
- Check that no other extension is using the same shortcut
- Try refreshing the page and using the shortcut again

### Content isn't being extracted properly
- The extension works best on article pages and content-heavy sites
- Some websites may have unusual structures that aren't recognized
- Try using the popup interface as an alternative

### ChatGPT prompt isn't being injected
- This can happen if ChatGPT's interface has changed
- The prompt will be copied to your clipboard as a fallback
- Simply paste it into ChatGPT manually

### Extension doesn't work on certain pages
- The extension requires permissions to access page content
- Some pages (like Chrome's internal pages) cannot be accessed by extensions
- Make sure you're on a regular website (http:// or https://)

## Privacy & Security

- **No Data Collection**: This extension does not collect, store, or transmit any personal data
- **Local Processing**: All content extraction happens locally on your device
- **No External Servers**: The extension only communicates with ChatGPT directly
- **Open Source**: All code is available for review in this repository

## Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Make sure you're using the latest version of the extension

---

**Enjoy researching with ChatGPT! 🚀** 
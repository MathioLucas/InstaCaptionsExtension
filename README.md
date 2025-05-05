# Instagram Caption Generator Chrome Extension

A Chrome extension that helps Instagram creators generate optimized captions, hashtags, and alt text for their posts using AI.

## Features

- 🖼️ **Image Analysis**: Automatically analyzes uploaded images to generate relevant captions
- ✍️ **Custom Captions**: Generate captions based on your own prompts and ideas
- 🎭 **Multiple Tones**: Choose from various tones including professional, casual, funny, and more
- #️⃣ **Hashtag Suggestions**: Get relevant and trending hashtags for your content
- ♿ **Accessibility**: Generate descriptive alt text for better accessibility

## Installation

### Local Development

1. Clone this repository:
   ```
   git clone https://github.com/your-username/instagram-caption-generator.git
   ```

2. Navigate to `chrome://extensions/` in Chrome

3. Enable "Developer mode" in the top-right corner

4. Click "Load unpacked" and select the `instagram-caption-generator` directory

### From Chrome Web Store

*(Coming soon)*

## Usage

1. Go to Instagram and start creating a new post

2. After uploading your image(s), you'll see the Caption Generator UI above the caption field

3. Click "Generate Caption" to automatically create a caption based on your image

4. Alternatively, provide a prompt describing what you want in your caption

5. Select your preferred tone from the dropdown menu

6. Choose how many hashtags you want

7. Click "Apply" to add the generated caption and hashtags to your post

## Server Setup

This extension relies on a server component to securely process API requests. To set up your own server:

1. Create a new directory for the server:
   ```
   mkdir instagram-caption-generator-server
   cd instagram-caption-generator-server
   ```

2. Copy the `server.js` and `package.json` files into this directory

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

5. Deploy to serverless platform (Vercel, Netlify, etc.)

6. Update the proxy URL in the extension's settings to point to your deployed server

## Configuration

You can configure the extension through the popup settings:

- **API Key**: Optionally provide your own OpenAI API key
- **Proxy Server**: Toggle between using the shared proxy or direct API access
- **Default Tone**: Set your preferred default tone for captions
- **Hashtag Count**: Set the default number of hashtags to generate

## Development

### Project Structure

```
instagram-caption-generator/
├── manifest.json        # Chrome extension manifest
├── background.js        # Background service worker
├── content.js           # Content script for Instagram integration
├── popup/               # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── assets/              # Static assets
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── styles.css
└── lib/                 # Utility libraries
    ├── openai.js        # OpenAI API handling
    └── instagram-dom.js # Instagram DOM interactions
```

### Building for Production

1. Ensure all files have the correct production settings and API endpoints

2. Create a ZIP file of the entire directory (excluding any development files like `.git`, etc.)

3. Submit to the Chrome Web Store

## Privacy

This extension:
- Only activates on Instagram's website
- Only accesses images you explicitly upload to Instagram
- Sends image data to OpenAI's API for analysis (via the proxy server)
- Does not collect any personal data
- Does not store your images or generated captions anywhere except locally


## Support

For issues, feature requests, or questions, please [open an issue](https://github.com/your-username/instagram-caption-generator/issues) on GitHub.

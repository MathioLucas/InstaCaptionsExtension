// This is a server-side proxy implementation using Node.js and Express
// It can be deployed to services like Vercel, Netlify Functions, or AWS Lambda

// server.js
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();

// Apply middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Trending hashtags by category (this would ideally be updated regularly)
const trendingHashtags = {
  travel: ['wanderlust', 'travelgram', 'exploremore', 'travelinspo', 'travelphotography'],
  food: ['foodie', 'foodporn', 'instafood', 'foodstagram', 'eeeeeats'],
  fashion: ['ootd', 'fashionista', 'styleinspo', 'fashiongram', 'lookoftheday'],
  fitness: ['fitfam', 'workout', 'fitness', 'gym', 'fitnessmotivation'],
  beauty: ['makeuplover', 'skincare', 'beautycare', 'glam', 'beautytips'],
  lifestyle: ['lifestyle', 'dailylife', 'instagood', 'photooftheday', 'lifeisbeautiful'],
  business: ['entrepreneur', 'smallbusiness', 'business', 'success', 'motivation'],
  technology: ['tech', 'innovation', 'digital', 'programming', 'developer'],
  art: ['artist', 'artwork', 'creative', 'instaart', 'artistsoninstagram'],
  nature: ['nature', 'outdoors', 'naturephotography', 'mountains', 'oceanviews']
};

// Helper function to detect potential category based on prompt and image analysis
function detectCategory(analysisResult) {
  // This is a simplified implementation that would be more sophisticated in production
  const content = analysisResult.toLowerCase();
  
  for (const [category, _] of Object.entries(trendingHashtags)) {
    if (content.includes(category)) {
      return category;
    }
  }
  
  // Default category if none detected
  return 'lifestyle';
}

// Helper function to get trending hashtags based on category
function getRelevantTrendingHashtags(category, count = 3) {
  const hashtags = trendingHashtags[category] || trendingHashtags.lifestyle;
  // Return a random selection from the category
  return hashtags.sort(() => 0.5 - Math.random()).slice(0, count);
}

// API endpoint for caption generation
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, imageData, hashtagCount = 5 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Prepare messages for OpenAI API
    const messages = [
      { role: 'system', content: 'You are an expert Instagram caption writer who helps creators craft engaging, on-brand captions with relevant hashtags.' },
      { role: 'user', content: [] }
    ];
    
    // Add text prompt
    messages[1].content.push({
      type: 'text',
      text: prompt
    });
    
    // Add image if provided
    if (imageData) {
      messages[1].content.push({
        type: 'image_url',
        image_url: {
          url: imageData,
          detail: 'low' // Use low detail to save tokens
        }
      });
    }
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: 'gpt-4-vision-preview',
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
    });
    
    const rawResponse = completion.data.choices[0].message.content;
    
    // Process and format the response
    // This would ideally have better parsing logic for the AI response
    let result;
    try {
      // Try to parse as JSON
      result = JSON.parse(rawResponse);
    } catch (e) {
      // If it's not valid JSON, process the text response
      const lines = rawResponse.split('\n');
      let caption = '';
      let hashtags = [];
      let altText = '';
      
      // Simple parsing - look for sections in the response
      let currentSection = 'caption';
      
      for (const line of lines) {
        if (line.toLowerCase().includes('caption:')) {
          currentSection = 'caption';
          caption = line.replace(/caption:/i, '').trim();
        } else if (line.toLowerCase().includes('hashtags:')) {
          currentSection = 'hashtags';
          const hashtagLine = line.replace(/hashtags:/i, '').trim();
          hashtags = hashtagLine.split(/\s+/).map(tag => tag.replace(/^#/, ''));
        } else if (line.toLowerCase().includes('alt text:') || line.toLowerCase().includes('alt-text:')) {
          currentSection = 'altText';
          altText = line.replace(/alt[- ]text:/i, '').trim();
        } else {
          // Add content to current section
          if (currentSection === 'caption') {
            caption += ' ' + line.trim();
          } else if (currentSection === 'hashtags') {
            const tags = line.trim().split(/\s+/).map(tag => tag.replace(/^#/, ''));
            hashtags = [...hashtags, ...tags];
          } else if (currentSection === 'altText') {
            altText += ' ' + line.trim();
          }
        }
      }
      
      // Clean up
      caption = caption.trim();
      hashtags = hashtags.filter(tag => tag);
      altText = altText.trim();
      
      result = { caption, hashtags, altText };
    }
    
    // Enhance hashtags with trending ones if needed
    if (result.hashtags.length < hashtagCount) {
      const category = detectCategory(result.caption + ' ' + result.altText);
      const trendingTags = getRelevantTrendingHashtags(category, hashtagCount - result.hashtags.length);
      result.hashtags = [...result.hashtags, ...trendingTags];
    }
    
    // Limit to requested hashtag count
    result.hashtags = result.hashtags.slice(0, hashtagCount);
    
    // Return the formatted response
    res.json(result);
    
  } catch (error) {
    console.error('Error generating caption:', error);
    res.status(500).json({ 
      error: 'Error generating caption', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for serverless functions
module.exports = app;





[build]
  functions = "functions"

// functions/api.js (for Netlify Functions)
const serverless = require('serverless-http');
const app = require('../server');

module.exports.handler = serverless(app);
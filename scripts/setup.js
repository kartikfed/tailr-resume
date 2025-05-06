/**
 * Setup script for AI Spec Assistant
 * 
 * This script helps set up the project by:
 * 1. Creating necessary directories if they don't exist
 * 2. Creating the required configuration files
 * 3. Providing instructions for next steps
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚙️ Setting up AI Spec Assistant...');

// Create directories if they don't exist
const ensureDirectoryExists = (dirPath) => {
  const fullPath = path.join(__dirname, '..', dirPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
};

// Directories to ensure exist
const directories = [
  'backend/src/api/routes',
  'backend/src/mcp',
  'backend/src/tools',
  'frontend/src/components',
  'frontend/src/services',
  'scripts'
];

directories.forEach(ensureDirectoryExists);

// Check for .env file and create if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file...');
  
  const envContent = `# API Keys (remember to never commit this file!)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Configuration
PORT=3000
NODE_ENV=development
VITE_API_URL=http://localhost:3000/api
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('⚠️ Remember to add your Anthropic API key to the .env file!');
}

console.log(`
✅ Basic setup complete!

Next steps:

1. Install dependencies by running these commands:
   cd backend && npm install
   cd frontend && npm install
   cd .. && npm install

2. Make sure you've added your Anthropic API key to the .env file

3. Run the development server:
   npm run dev

The backend will be available at: http://localhost:3000
The frontend will be available at: http://localhost:5173
`);
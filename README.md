# AI Spec Assistant

An AI-powered tool that converts vague product requests into structured specifications using Claude and Model Context Protocol (MCP).

## Features

- Accept natural language prompts to generate product specs
- Upload supporting files (existing specs, feedback, documentation)
- AI-powered intent parsing and context referencing using Claude
- Structured PRD output with standardized sections

## Architecture

The project is built with a modern web architecture:

- **Frontend**: React with Chakra UI for a clean, responsive interface
- **Backend**: Node.js/Express API server
- **AI Integration**: Claude API with Model Context Protocol (MCP)
- **Tool Integration**: Specialized tools for context search, file analysis, and PRD generation

## Quick Start

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Anthropic API key for Claude

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-spec-assistant.git
   cd ai-spec-assistant
   ```

2. Run the setup script:
   ```
   npm run setup
   ```

3. Add your Anthropic API key to the `.env` file:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000/api](http://localhost:3000/api)

## Usage

1. **Enter a product request**: Type a natural language description of the feature you want to specify (e.g., "Create a spec for adding PDF export to our reporting feature")

2. **Upload context files** (optional): Add any relevant documents like existing specs, user feedback, or technical documentation

3. **Review the generated specification**: The AI will analyze your request and context files to generate a structured PRD

4. **Export or refine**: Copy the spec or continue the conversation to refine the details

## Development Guide

### Project Structure

```
ai-spec-assistant/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── api/             # API routes
│   │   ├── mcp/             # MCP integration
│   │   ├── tools/           # Tool implementations
│   │   └── server.js        # Main Express server
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API integration
│   │   └── App.jsx          # Main application
├── scripts/                 # Utility scripts
└── .env                     # Environment variables
```

### Key Technologies

- **Frontend**: React, Chakra UI, Axios, Vite
- **Backend**: Node.js, Express, Anthropic SDK
- **AI**: Claude with Model Context Protocol (MCP)

### Running in Development Mode

To start both the frontend and backend in development mode:

```
npm run dev
```

To start only the backend:

```
npm run start:backend
```

To start only the frontend:

```
npm run start:frontend
```

## MCP Architecture

The AI Spec Assistant uses Model Context Protocol (MCP) to connect Claude with specialized tools:

1. **searchContext**: Searches through uploaded documents for relevant information
2. **generatePRDSection**: Creates structured sections of the PRD
3. **analyzeFile**: Extracts and summarizes information from uploaded files

## License

MIT
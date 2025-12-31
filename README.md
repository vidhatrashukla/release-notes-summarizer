# Release Notes Summarizer

A web application that helps generate professional release messages for internal applications using AI.

## Features

- Generate structured release notes from ticket details
- Support for multiple version types (Backend, Frontend, Mobile, Native)
- Customizable release timing and downtime settings
- Professional formatting with AI-powered content generation
- One-click copy to clipboard

## Setup

### Prerequisites

- Node.js 16+ installed
- An Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

4. Add your Anthropic API key to the `.env` file:
   ```
   VITE_ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Deployment to GitHub Pages

1. Update the `homepage` field in `package.json` with your GitHub username:
   ```json
   "homepage": "https://YOUR_USERNAME.github.io/release-notes-summarizer"
   ```

2. Update the `base` field in `vite.config.ts`:
   ```typescript
   base: '/release-notes-summarizer/'
   ```

3. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

**Important Note on API Keys**:
- The `.env` file is NOT deployed to GitHub Pages for security reasons
- You'll need to set up your API key as a GitHub Secret and configure your deployment accordingly
- Alternatively, consider using a backend proxy to avoid exposing API keys in the frontend

## Usage

1. Fill in the version numbers for different components (optional)
2. Enter the release date and time (required)
3. Select downtime duration if applicable
4. Paste ticket details describing the changes
5. Click "Generate Release Message"
6. Copy the generated message and share with your team

## Technology Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Anthropic Claude API

## Created By

[vidhatrashukla](https://github.com/vidhatrashukla)

## License

MIT

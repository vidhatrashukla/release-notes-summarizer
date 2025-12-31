# Release Notes Summarizer

A web application that helps generate professional release messages for internal applications using AI.

## Features

- Generate structured release notes from ticket details
- Support for multiple version types (Backend, Frontend, Mobile, Native)
- Customizable release timing and downtime settings
- Professional formatting with AI-powered content generation
- One-click copy to clipboard
- **Uses FREE Groq API** with Llama 3.3 70B model

## Setup

### Prerequisites

- Node.js 16+ installed
- A free Groq API key ([get one here](https://console.groq.com))

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Get a FREE Groq API key:
   - Go to [console.groq.com](https://console.groq.com)
   - Sign up for a free account
   - Create an API key

4. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

5. Add your Groq API key to the `.env` file:
   ```
   VITE_GROQ_API_KEY=your_actual_api_key_here
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

**Setting up GitHub Secrets**:
1. Go to your repository settings: `https://github.com/YOUR_USERNAME/release-notes-summarizer/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `VITE_GROQ_API_KEY`
4. Value: (paste your free Groq API key from console.groq.com)
5. Click **Add secret**

The GitHub Actions workflow will automatically use this secret when building and deploying.

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
- Groq API (FREE) with Llama 3.3 70B model

## Why Groq?

Groq offers a completely FREE API with access to powerful models like Llama 3.3 70B. It's:
- Fast and reliable
- No credit card required
- Generous free tier
- Perfect for personal projects and internal tools

## Created By

[vidhatrashukla](https://github.com/vidhatrashukla)

## License

MIT

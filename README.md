# StarterJam

A simple starter template for collaborative applications with Durable Objects from Cloudflare.

## Quick Start

1. **Setup your project:**
   Update the wrangler.json file with your vars and details for your app.

   Copy .env.example to .env and update the values as needed.

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start development:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## Configuration

The application uses environment variables for configuration. The setup script will guide you through configuring:

### Environment Variables

- `VITE_API_BASE_URL` - Base URL for API endpoints
- `VITE_WS_BASE_URL` - WebSocket base URL for real-time connections
- `VITE_APP_NAME` - Application name (used for branding)
- `VITE_GITHUB_REPO` - URL of the GitHub repository for the project
- `VITE_ENVIRONMENT` - Environment identifier (development/staging/production)

### Environment Files

- `.env` - Main environment configuration
- `.env.local` - Local development overrides (created automatically for development)
- `.env.example` - Template for production/staging environments
- `.env.local.example` - Template for local development

**Note:** Remember to add `.env` and `.env.local` to your `.gitignore` file to keep your configuration secure.

## Customization

- Replace all instances of `starterjam` in the code with your desired project name
- Update the application name in your environment configuration
- Modify the configuration in `src/config/index.ts` if you need additional settings

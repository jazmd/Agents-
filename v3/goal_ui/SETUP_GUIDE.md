# Setup Guide for GOAP Research Assistant

This guide will help you set up the GOAP Research Assistant template in your own environment.

## Table of Contents
1. [Lovable Cloud Setup (Recommended)](#lovable-cloud-setup)
2. [Manual Self-Hosted Setup](#manual-self-hosted-setup)
3. [Configuration Guide](#configuration-guide)
4. [Troubleshooting](#troubleshooting)

---

## Lovable Cloud Setup (Recommended)

### Step 1: Get the Code
```bash
# Use this repository as a template on GitHub
# or fork it to your account
git clone https://github.com/your-username/goap-research-assistant.git
```

### Step 2: Import to Lovable
1. Go to [lovable.dev](https://lovable.dev)
2. Sign in with GitHub
3. Click "New Project"
4. Choose "Import from GitHub"
5. Select your forked repository
6. Lovable will automatically:
   - Set up Supabase backend
   - Deploy edge functions
   - Configure environment variables
   - Enable Lovable AI

### Step 3: You're Done! 🎉
Your app is now live with all features working.

**What Lovable Cloud provides automatically:**
- ✅ Supabase project and database
- ✅ Edge function deployment
- ✅ Environment variable configuration
- ✅ LOVABLE_API_KEY for AI features
- ✅ Real-time preview
- ✅ Custom domain support
- ✅ Automatic deployments

---

## Manual Self-Hosted Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Lovable account (for AI API key)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/goap-research-assistant.git
cd goap-research-assistant

# Install dependencies
npm install
# or
bun install
```

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be provisioned
5. Note your Project URL and API keys

### Step 3: Configure Environment Variables

```bash
# Copy example environment file
cp example.env .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

Fill in these values from Supabase Dashboard → Settings → API:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=xxxxx
```

### Step 4: Deploy Edge Functions

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (use project ID from dashboard)
supabase link --project-ref your-project-id

# Deploy all edge functions
supabase functions deploy research-step
supabase functions deploy generate-research-goal
supabase functions deploy generate-action-items
```

### Step 5: Configure Lovable API Key

1. **Get Lovable API Key:**
   - Go to [lovable.dev/settings](https://lovable.dev/settings)
   - Navigate to "API Keys" or "Cloud" section
   - Copy your LOVABLE_API_KEY

2. **Add to Supabase:**
   - Go to Supabase Dashboard → Project Settings → Edge Functions
   - Click on "Secrets" or "Environment Variables"
   - Add secret:
     ```
     Name: LOVABLE_API_KEY
     Value: [paste your key]
     ```

### Step 6: Run Locally

```bash
# Start development server
npm run dev

# Or with Bun
bun run dev
```

Your app should now be running at `http://localhost:8080`

---

## Configuration Guide

### Widget Customization

Click "Create Widget" button to customize:
- **Colors**: Primary, accent, background, text
- **Typography**: Font family, sizes
- **Layout**: Border radius, spacing, compact mode
- **Branding**: Title, description, brand name
- **AI Model**: Choose between Gemini variants

### Advanced Research Settings

Click "Advanced" in the goal input area:

#### 1. Research Guidance Tab
- **Focus Areas**: Topics to emphasize (e.g., "quantum algorithms")
- **Exclude Topics**: Topics to avoid (e.g., "theoretical only")
- **Depth**: Surface (quick), Moderate (standard), Deep (comprehensive)
- **Perspective**: Technical, Business, Academic, Practical
- **Timeframe**: Recent, Current Year, Past Year, etc.

#### 2. GOAP Configuration Tab
- **Execution Mode**: 
  - Focused: Direct action execution
  - Closed: Single-domain planning
  - Open: Creative problem solving
- **Enable Replanning**: Auto-adjust on failures
- **Cost Optimization**: Optimize action costs
- **Parallel Execution**: Run agents in parallel

#### 3. AI Prompts Tab
Customize AI behavior:
- **System Prompt**: Core AI instructions
- **Search Query Template**: Web search format
- **Analysis Prompt**: Document analysis guide
- **Synthesis Prompt**: Knowledge synthesis guide

#### 4. Parameters Tab
Fine-tune research:
- **Max Sources**: Number of findings per step
- **Min Confidence**: Minimum confidence threshold (%)
- **Max Steps**: Maximum research steps
- **Parallel Agents**: Concurrent agents
- **Timeout**: Max execution time (seconds)

#### 5. Actions Tab
Control action behavior:
- **Max Action Cost**: Limit action complexity
- **Enable Fallbacks**: Use backup strategies
- **Validate Preconditions**: Check requirements
- **Track Effects**: Monitor state changes

#### 6. Filters Tab
Source filtering:
- **Date Range**: past-year, past-2-years, all-time
- **Source Types**: academic, technical, industry
- **Languages**: en, es, fr, etc.
- **Exclude Domains**: Block specific websites

---

## Troubleshooting

### Edge Functions Not Working

**Problem**: "Failed to generate research data" error

**Solutions:**
1. Check edge function deployment:
   ```bash
   supabase functions list
   ```

2. Verify LOVABLE_API_KEY is set:
   ```bash
   supabase secrets list
   ```

3. Check function logs:
   ```bash
   supabase functions logs research-step
   ```

### AI Generation Fails

**Problem**: 429 Rate Limit or 402 Payment Required

**Solutions:**
1. Check Lovable Cloud credits at [lovable.dev/settings](https://lovable.dev/settings)
2. Add credits or upgrade plan
3. Reduce request frequency

### Environment Variables Not Loading

**Problem**: App shows connection errors

**Solutions:**
1. Verify `.env` file exists and is in project root
2. Restart development server after changing .env
3. Check variable names match exactly (VITE_ prefix required)
4. Clear browser cache and hard reload

### Supabase Connection Issues

**Problem**: "Failed to connect to Supabase"

**Solutions:**
1. Verify VITE_SUPABASE_URL is correct
2. Check VITE_SUPABASE_PUBLISHABLE_KEY is valid
3. Ensure Supabase project is active (not paused)
4. Check network/firewall settings

### Build Fails

**Problem**: Build errors during `npm run build`

**Solutions:**
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Check TypeScript errors:
   ```bash
   npm run type-check
   ```

3. Update dependencies:
   ```bash
   npm update
   ```

---

## Getting Help

- **Documentation**: [Lovable Docs](https://docs.lovable.dev)
- **Community**: [Lovable Discord](https://discord.gg/lovable)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **GitHub Issues**: Report bugs and request features

---

## Next Steps

1. ✅ Complete setup following this guide
2. 🎨 Customize widget appearance
3. ⚙️ Configure advanced research settings
4. 🧪 Test with different research goals
5. 🚀 Deploy to production
6. 📊 Monitor usage and performance

Enjoy your GOAP Research Assistant! 🎉

# GOAP Research Assistant Template

AI-powered research planning system using Goal-Oriented Action Planning (GOAP) with dynamic agent coordination, multi-step reasoning, and intelligent workflow generation.

## 🚀 Features

- **AI-Powered Research Planning**: Automatically generates optimal research workflows using GOAP algorithms
- **Multi-Agent Coordination**: Specialized agents for different research steps (analysis, web search, document processing, synthesis)
- **Real-time Google Search Integration**: Grounded research with actual web results and citations
- **Customizable Research Parameters**: Deep configuration for prompts, filters, depth, perspective, and more
- **Category-Based Goal Generation**: AI generates research goals for Finance, Business, Marketing, Medical, Education, Coding, Technical, and AI/ML
- **Beautiful UI**: Responsive design with customizable color schemes and animations
- **Edge Functions**: Serverless backend with Supabase for AI processing

## 📋 Prerequisites

- Node.js 18+ and npm/bun
- Supabase account (for backend/database)
- Lovable Cloud account OR manual Supabase setup

## 🛠️ Quick Start

### Option 1: Use with Lovable Cloud (Recommended)

1. **Fork/Clone this repository**
   ```bash
   git clone https://github.com/your-username/goap-research-assistant.git
   cd goap-research-assistant
   ```

2. **Import to Lovable**
   - Go to [Lovable](https://lovable.dev)
   - Create new project
   - Connect to your GitHub repository
   - Lovable Cloud will auto-configure environment variables and edge functions

3. **Done!** The app will be live with all features working.

### Option 2: Manual Setup (Self-Hosting)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/goap-research-assistant.git
   cd goap-research-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy `example.env` to `.env`
   - Fill in your Supabase credentials from Project Settings → API

4. **Deploy Edge Functions**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref your-project-id

   # Deploy all edge functions
   supabase functions deploy research-step
   supabase functions deploy generate-research-goal
   supabase functions deploy generate-action-items
   ```

5. **Configure Secrets**
   
   In Supabase Dashboard → Project Settings → Edge Functions → Secrets, add:
   ```
   LOVABLE_API_KEY=your-lovable-api-key
   ```
   
   Get your Lovable API key from [Lovable Cloud settings](https://lovable.dev/settings)

6. **Run locally**
   ```bash
   npm run dev
   ```

## 🎯 Usage

### Basic Research Flow

1. **Enter a research goal** or click a category button (Finance, Business, Marketing, etc.) to AI-generate goals
2. **Customize settings** (optional) by clicking "Advanced Settings"
3. **Generate Plan** - GOAP system creates optimal research workflow
4. **Watch execution** - AI agents execute research steps with real-time updates
5. **Review results** - Tabbed report with Direct Answer, Key Findings, Methodology, and Next Steps

### Advanced Configuration

Click "Advanced Settings" to customize:

- **Research Guidance**: Focus areas, exclude topics, depth (surface/moderate/deep), perspective
- **GOAP Config**: Execution mode, replanning, cost optimization, parallel execution
- **AI Prompts**: Custom system prompts, search templates, analysis prompts
- **Parameters**: Max sources, min confidence, max steps, timeout
- **Actions**: Max action cost, fallbacks, precondition validation
- **Filters**: Date range, source types, languages, excluded domains

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Components**: Modular UI components in `src/components/`
- **Pages**: Main application logic in `src/pages/Index.tsx`
- **GOAP Planner**: Core planning logic in `src/lib/goapPlanner.ts`

### Backend (Supabase Edge Functions)
- **research-step**: Executes individual research steps with AI
- **generate-research-goal**: AI-generates research goals by category
- **generate-action-items**: Creates actionable recommendations from research

### Key Technologies
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **Supabase** for backend/database
- **Lovable AI Gateway** for AI models (Gemini 2.5 Flash)
- **Google Search Grounding** for real-time web research

## 📁 Project Structure

```
.
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── AgentStep.tsx   # Research step display
│   │   ├── GoalInput.tsx   # Goal input with AI generation
│   │   ├── ResearchReportModal.tsx
│   │   └── ReviseResearchForm.tsx  # Advanced settings
│   ├── lib/
│   │   └── goapPlanner.ts  # GOAP algorithm implementation
│   └── pages/
│       └── Index.tsx       # Main application
├── supabase/
│   ├── functions/          # Edge functions
│   │   ├── research-step/
│   │   ├── generate-research-goal/
│   │   └── generate-action-items/
│   └── config.toml         # Supabase configuration
├── example.env             # Environment variables template
└── README.md
```

## 🎨 Customization

### Widget Customization

Click "Create Widget" to customize:
- Primary/accent colors
- Background colors
- Card styling
- Typography
- Animations
- Branding

### Research Configuration

Advanced settings allow you to:
- Set custom AI prompts
- Define focus areas and exclusions
- Adjust research depth and perspective
- Configure source filtering
- Set confidence thresholds
- Enable/disable GOAP features

## 🔑 Environment Variables

Required variables (auto-configured in Lovable Cloud):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

Edge Function secrets (set in Supabase Dashboard):
```env
LOVABLE_API_KEY=your-lovable-api-key
```

## 📊 AI Models

This template uses Lovable AI Gateway with:
- **google/gemini-2.5-flash** (default) - Fast, balanced AI model
- **google/gemini-2.5-pro** - Highest quality reasoning
- **google/gemini-2.5-flash-lite** - Fastest, most economical

All Gemini models are **currently FREE** until Oct 13, 2025.

## 🚢 Deployment

### Lovable Cloud (Easiest)
- Auto-deployed on every change
- Custom domain support
- Built-in CDN and SSL

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this template for any purpose.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [Shadcn UI](https://ui.shadcn.com)
- Powered by [Supabase](https://supabase.com)
- AI via [Lovable AI Gateway](https://docs.lovable.dev/features/ai)

## 📞 Support

- Documentation: [Lovable Docs](https://docs.lovable.dev)
- Community: [Lovable Discord](https://discord.gg/lovable)
- Issues: [GitHub Issues](https://github.com/your-username/goap-research-assistant/issues)

---

**Made with ❤️ using Lovable**

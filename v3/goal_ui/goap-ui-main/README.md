# Goalie-UI

<div align="center">

![Goalie-UI Logo](https://img.shields.io/badge/Goalie-UI-8B5CF6?style=for-the-badge&logo=react&logoColor=white)

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Latest-000000?style=flat-square&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**A beautiful, extensible UI library for Goal-Oriented Action Planning (GOAP) interfaces**

[Demo](https://lovable.dev/projects/598e2f1d-b876-4347-bb4f-379bdab134b0) · [Documentation](#usage) · [Components](#components)

</div>

---

## 🎯 Introduction

**Goalie-UI** is a comprehensive React component library designed specifically for building Goal-Oriented Action Planning (GOAP) interfaces. It provides a complete set of pre-built, customizable components that enable developers to create intelligent, AI-powered research and planning applications with beautiful, responsive UIs.

Built on modern web technologies including React, TypeScript, and Tailwind CSS, Goalie-UI offers everything you need to implement sophisticated multi-agent systems, research workflows, and goal-driven interfaces—from simple goal inputs to complex research report modals.

### Why Goalie-UI?

- 🎨 **Beautiful by Default**: Professionally designed components with dark mode support
- 🧩 **Highly Composable**: Mix and match components to build complex interfaces
- ⚡ **Performance Optimized**: Built with modern React patterns and best practices
- 🎭 **Fully Customizable**: Extensive theming system with semantic tokens
- 📱 **Responsive**: Mobile-first design that works on all devices
- 🔧 **TypeScript First**: Full type safety and excellent developer experience
- 🤖 **AI-Ready**: Built-in support for AI agents and research workflows

---

## ✨ Features

### Core Components

- **Goal Input System**: Intuitive interface for defining goals with customizable parameters
- **Agent Step Visualization**: Real-time display of agent execution steps with status indicators
- **Research Report Modal**: Comprehensive modal for displaying research results with tabs for summary, findings, methodology, citations, and insights
- **Widget Customizer**: Flexible component for customizing UI elements with live preview
- **GOAP Planner**: Built-in Goal-Oriented Action Planning algorithm implementation

### Design System

- **Semantic Color Tokens**: HSL-based theming system for consistent, accessible colors
- **Component Variants**: Multiple style variants for buttons, badges, cards, and more
- **Dark Mode**: Seamless dark/light mode switching with system preference detection
- **Responsive Grid System**: Mobile-first responsive layouts
- **Animation System**: Smooth transitions and micro-interactions

### UI Components Library

Built on shadcn/ui with extensive customizations:
- Accordion, Alert Dialog, Avatar, Badge
- Button, Calendar, Card, Carousel, Chart
- Checkbox, Collapsible, Command Menu
- Context Menu, Dialog, Drawer, Dropdown
- Form, Input, Label, Progress, Select
- Separator, Sheet, Sidebar, Skeleton
- Slider, Switch, Tabs, Textarea, Toast
- Tooltip, and more...

---

## 🚀 Usage

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd goalie-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

### Basic Example

```tsx
import { useState } from 'react';
import { GoalInput } from '@/components/GoalInput';
import { AgentStep } from '@/components/AgentStep';
import { ResearchReportModal } from '@/components/ResearchReportModal';

function App() {
  const [goal, setGoal] = useState('');
  const [steps, setSteps] = useState([]);
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="container mx-auto p-4">
      <GoalInput
        value={goal}
        onChange={setGoal}
        onSubmit={() => {
          // Handle goal submission
        }}
      />
      
      {steps.map((step, index) => (
        <AgentStep
          key={index}
          step={step}
          index={index}
        />
      ))}
      
      <ResearchReportModal
        open={showReport}
        onOpenChange={setShowReport}
        goal={goal}
        steps={steps}
      />
    </div>
  );
}
```

### Theming

Customize the design system by modifying `src/index.css`:

```css
:root {
  --primary: 263 70% 50%;
  --secondary: 220 14% 96%;
  --accent: 142 76% 36%;
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  /* ... more tokens */
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  /* ... more tokens */
}
```

### Using the GOAP Planner

```tsx
import { createPlan, type WorldState, type Action } from '@/lib/goapPlanner';

const worldState: WorldState = {
  hasData: false,
  isAnalyzed: false,
  reportReady: false,
};

const goalState: WorldState = {
  reportReady: true,
};

const actions: Action[] = [
  {
    name: 'Gather Data',
    preconditions: {},
    effects: { hasData: true },
    cost: 1,
  },
  {
    name: 'Analyze Data',
    preconditions: { hasData: true },
    effects: { isAnalyzed: true },
    cost: 2,
  },
  {
    name: 'Generate Report',
    preconditions: { isAnalyzed: true },
    effects: { reportReady: true },
    cost: 1,
  },
];

const plan = createPlan(worldState, goalState, actions);
console.log(plan); // ['Gather Data', 'Analyze Data', 'Generate Report']
```

---

## 🧩 Components

### GoalInput
Input component for defining research goals and objectives with customizable styling and validation.

**Props:**
- `value: string` - Current goal text
- `onChange: (value: string) => void` - Change handler
- `onSubmit: () => void` - Submit handler
- `placeholder?: string` - Optional placeholder text

### AgentStep
Displays individual agent execution steps with status indicators, progress, and results.

**Props:**
- `step: AgentStepData` - Step data including status, agent name, and results
- `index: number` - Step index for numbering
- `accentColor?: string` - Optional accent color override

### ResearchReportModal
Comprehensive modal for displaying research results with multiple tabs and rich formatting.

**Props:**
- `open: boolean` - Modal open state
- `onOpenChange: (open: boolean) => void` - Open state change handler
- `goal: string` - Research goal
- `steps: AgentStepData[]` - Array of agent steps
- `primaryColor?: string` - Primary theme color
- `accentColor?: string` - Accent theme color

### WidgetCustomizer
Flexible component for customizing UI elements with real-time preview.

**Props:**
- `title?: string` - Widget title
- `description?: string` - Widget description
- `children: ReactNode` - Customizable content

---

## 🛠️ Tech Stack

- **React 18.3** - UI framework
- **TypeScript 5.x** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **shadcn/ui** - Component primitives
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Supabase** - Backend and database (via Lovable Cloud)
- **TanStack Query** - Data fetching and caching

---

## 📦 Project Structure

```
goalie-ui/
├── src/
│   ├── components/
│   │   ├── ui/                 # Base UI components (shadcn)
│   │   ├── AgentStep.tsx       # Agent step visualization
│   │   ├── GoalInput.tsx       # Goal input component
│   │   ├── ResearchReportModal.tsx  # Research report modal
│   │   └── WidgetCustomizer.tsx     # Widget customization
│   ├── lib/
│   │   ├── goapPlanner.ts      # GOAP algorithm implementation
│   │   └── utils.ts            # Utility functions
│   ├── pages/
│   │   ├── Index.tsx           # Main page
│   │   └── NotFound.tsx        # 404 page
│   ├── integrations/
│   │   └── supabase/           # Supabase integration
│   ├── index.css               # Global styles and design tokens
│   └── main.tsx                # Application entry point
├── supabase/
│   ├── functions/              # Edge functions
│   └── config.toml             # Supabase configuration
├── public/                     # Static assets
└── tailwind.config.ts          # Tailwind configuration
```

---

## 🎨 Design Principles

1. **Semantic First**: Use semantic color tokens, not hardcoded colors
2. **Responsive Always**: Mobile-first, responsive by default
3. **Accessible**: WCAG 2.1 AA compliant components
4. **Performant**: Optimized rendering and minimal re-renders
5. **Composable**: Small, focused components that work together
6. **Themeable**: Easy customization through design tokens

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Documentation**: [Lovable Docs](https://docs.lovable.dev/)
- **Demo**: [Live Demo](https://lovable.dev/projects/598e2f1d-b876-4347-bb4f-379bdab134b0)
- **shadcn/ui**: [Component Documentation](https://ui.shadcn.com/)
- **Tailwind CSS**: [Documentation](https://tailwindcss.com/)

---

<div align="center">

**Built with ❤️ using [Lovable](https://lovable.dev)**

[![Lovable](https://img.shields.io/badge/Built%20with-Lovable-FF6B9D?style=for-the-badge)](https://lovable.dev)

</div>

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code, ExternalLink, Network, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const content = {
  headline: "Ruflo GOAP Research UI",
  subheadline:
    "A clean, opinionated interface for goal-driven research workflows—planning, execution, and live swarm monitoring.",
  bullets: [
    "Create goals and get a step-by-step research plan (GOAP-style).",
    "Run research steps via Supabase Edge Functions (Gemini-backed).",
    "Monitor real swarm status from your local `ruflo` CLI.",
  ],
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">ruflo</span>
            <Badge variant="secondary" className="ml-1">
              v3
            </Badge>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/agents">
              <Button variant="ghost" size="sm" className="gap-2">
                <Code className="h-4 w-4" />
                Agents
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="ghost" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Demo
              </Button>
            </Link>
            <Link to="/goap">
              <Button size="sm" className="gap-2">
                Open App
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm bg-background">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Simple landing page (based on your reference style)</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{content.headline}</h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">{content.subheadline}</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/goap">
                <Button className="gap-2">
                  Launch GOAP UI <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/agents">
                <Button variant="outline" className="gap-2">
                  View Live Activity <Code className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {content.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/80 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">What you get</CardTitle>
                <CardDescription>Quick overview of the connected stack.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Network className="h-4 w-4 text-primary" />
                    Swarm Monitor
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    `/agents` reads real-time status from local `ruflo` CLI.
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Shield className="h-4 w-4 text-primary" />
                    Edge Functions
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Supabase functions generate goals, configs, steps, and action items.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Next steps</CardTitle>
                <CardDescription>Start simple. Iterate fast.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>
                  1) Open the app and create a goal → <span className="text-foreground">GOAP will plan</span>.
                </div>
                <div>
                  2) Run steps → <span className="text-foreground">Edge Functions will respond</span>.
                </div>
                <div>
                  3) Spawn agents / tasks → <span className="text-foreground">watch live activity</span>.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-14">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open the GOAP UI</CardTitle>
              <CardDescription>The main interface is now at `/goap`.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Link to="/goap">
                <Button className="gap-2">
                  Go to GOAP UI <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" className="gap-2">
                  Widget demo <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/agents">
                <Button variant="outline" className="gap-2">
                  Swarm dashboard <Code className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 max-w-6xl text-sm text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>Built in `v3/goal_ui`.</span>
          <span>Local: `http://localhost:8080/`</span>
        </div>
      </footer>
    </div>
  );
}


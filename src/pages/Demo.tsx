import { useState } from "react";
import { Link as RouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Code,
  Copy,
  Download,
  Eye,
  Settings,
  Palette,
  Zap,
} from "lucide-react";

export default function Demo() {
  const [selectedColor, setSelectedColor] = useState("#8b5cf6");
  const [copied, setCopied] = useState(false);

  const widgetCode = `<!-- RuFlo Research Widget -->
<div id="ruflo-widget"></div>
<script src="https://goal.ruv.io/widget.js"></script>
<script>
  RufloResearchWidget.init({
    containerId: 'ruflo-widget',
    primaryColor: '${selectedColor}',
    theme: 'dark'
  });
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colors = [
    { name: "Violet", value: "#8b5cf6" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Emerald", value: "#10b981" },
    { name: "Rose", value: "#f43f5e" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Cyan", value: "#06b6d4" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(139, 92, 246, 0.05) 25%, rgba(139, 92, 246, 0.05) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, 0.05) 75%, rgba(139, 92, 246, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(139, 92, 246, 0.05) 25%, rgba(139, 92, 246, 0.05) 26%, transparent 27%, transparent 74%, rgba(139, 92, 246, 0.05) 75%, rgba(139, 92, 246, 0.05) 76%, transparent 77%, transparent)`,
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800/50 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RouterLink href="/">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Research
                </Button>
              </RouterLink>
              <div className="h-6 w-px bg-gray-700/50"></div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-400" />
                <h1 className="text-xl font-bold text-white">Widget Demo</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Customization */}
            <div className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-violet-400" />
                  Customize Widget
                </h2>

                <div className="space-y-4">
                  {/* Color Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block">
                      Primary Color
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColor(color.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedColor === color.value
                              ? "border-white"
                              : "border-gray-700/50 hover:border-gray-600"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          <span className="text-xs font-medium text-white">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block">
                      Theme
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-3 rounded-lg border-2 border-white bg-gray-800 text-white text-sm font-medium">
                        Dark
                      </button>
                      <button className="p-3 rounded-lg border-2 border-gray-700/50 hover:border-gray-600 bg-gray-900 text-gray-300 text-sm font-medium">
                        Light
                      </button>
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block">
                      Widget Size
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Small", "Medium", "Large"].map((size) => (
                        <button
                          key={size}
                          className="p-3 rounded-lg border-2 border-gray-700/50 hover:border-gray-600 bg-gray-900 text-gray-300 text-sm font-medium transition-all"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Code Block */}
              <Card className="bg-gray-900/50 border-gray-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5 text-violet-400" />
                  Installation Code
                </h3>
                <div className="relative">
                  <pre className="bg-gray-800/50 border border-gray-700/50 rounded p-4 text-xs text-gray-300 overflow-x-auto">
                    <code>{widgetCode}</code>
                  </pre>
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 border-gray-600/50 hover:bg-gray-800/50"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </Card>

              {/* Download Options */}
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download Widget
                </Button>
                <Button variant="outline" className="border-gray-600/50 hover:bg-gray-800/50">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-violet-400" />
                  Live Preview
                </h2>

                {/* Widget Preview Frame */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6 min-h-96 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div
                      className="w-12 h-12 rounded-full mx-auto"
                      style={{ backgroundColor: selectedColor }}
                    ></div>
                    <p className="text-gray-400">Widget preview will appear here</p>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                </div>
              </Card>

              {/* Documentation */}
              <Card className="bg-gray-900/50 border-gray-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-violet-400" />
                  Documentation
                </h3>
                <Tabs defaultValue="api" className="space-y-4">
                  <TabsList className="bg-gray-800/50 border border-gray-700/50">
                    <TabsTrigger value="api" className="data-[state=active]:bg-violet-600">
                      API
                    </TabsTrigger>
                    <TabsTrigger value="examples" className="data-[state=active]:bg-violet-600">
                      Examples
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="api" className="space-y-2 text-sm text-gray-300">
                    <div>
                      <p className="font-medium text-white mb-1">init(options)</p>
                      <p className="text-gray-400">Initialize the widget with custom options</p>
                    </div>
                    <div>
                      <p className="font-medium text-white mb-1">setGoal(goal)</p>
                      <p className="text-gray-400">Set the research goal programmatically</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="examples" className="space-y-2 text-sm text-gray-300">
                    <p>See our GitHub repository for more examples and use cases.</p>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm mt-12">
          <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
            <p>
              RuFlo Research · Created with{" "}
              <span className="text-red-500">❤️</span> by{" "}
              <a href="https://ruv.io" className="text-violet-400 hover:text-violet-300">
                ruv.io
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { 
  ArrowRight, 
  Code, 
  Network, 
  Sparkles, 
  Brain, 
  Globe, 
  Shield, 
  Cpu,
  Briefcase,
  Target,
  BarChart,
  Users,
  Layers,
  ChevronRight,
  Target as GoalIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

const rufloCapabilities = [
  {
    title: "Multi-Agent Swarms",
    description: "Orchestrate 100+ specialized agents across machines and teams with zero-trust federation.",
    icon: Users,
    color: "#8B5CF6"
  },
  {
    title: "Self-Learning Memory",
    description: "Persistent AgentDB with HNSW indexing for 150x faster pattern retrieval and cross-session recall.",
    icon: Brain,
    color: "#06B6D4"
  },
  {
    title: "GOAP A* Planning",
    description: "Decompose high-level goals into executable plans using state-space search and adaptive replanning.",
    icon: GoalIcon,
    color: "#F59E0B"
  },
  {
    title: "Agent Federation",
    description: "Zero-trust protocol for agents to discover, authenticate, and collaborate across organizations.",
    icon: Globe,
    color: "#10B981"
  },
  {
    title: "Neural Optimization",
    description: "Self-improving local model layer using SONA patterns and ReasoningBank trajectory learning.",
    icon: Cpu,
    color: "#EF4444"
  }
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [heroEmblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 3000, stopOnInteraction: false })]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#2A2A3C] font-sans selection:bg-blue-100">
      <Navbar />

      {/* Hero Section - Personal Profile */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#8b5cf615_0%,transparent_100%)]" />
        <div className="container mx-auto px-6 max-w-7xl relative">
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-top-10 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-bold tracking-[0.2em] uppercase border border-blue-600/20">
              <Sparkles className="w-3.5 h-3.5" />
              Product Leader & Innovation Architect
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 mb-2 leading-[0.9]">
                Faidhi Fahmi
              </h1>
              <div className="h-2 w-24 bg-blue-600 mx-auto rounded-full" />
            </div>
            
            <p className="text-xl md:text-3xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-light italic">
              Scaling innovation through <span className="text-slate-900 font-medium not-italic">autonomous AI systems</span> and data-driven product strategies.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-6">
              {[
                { icon: Briefcase, text: "CEO @ iLyF" },
                { icon: Target, text: "Founder Institute SEA '22" },
                { icon: BarChart, text: "8+ Years in Startup Ecosystem" }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-slate-200/60 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <item.icon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700 tracking-tight">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="pt-8 flex gap-4">
              <Link to="/goap">
                <Button className="rounded-full px-10 h-14 text-base font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white">
                  Launch GOAPsimplified
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a 
                href="https://www.linkedin.com/in/faidhifahmi/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="rounded-full px-10 h-14 text-base font-bold border-2 transition-all hover:bg-slate-50 active:scale-95">
                  Connect on LinkedIn
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                Building products that feel <span className="text-blue-600 underline decoration-blue-100 underline-offset-8">inevitable</span>.
              </h2>
              <div className="space-y-4">
                <p className="text-lg text-slate-600 leading-relaxed">
                  With over 8 years in the startup ecosystem, I've dedicated my career to bridging the gap between complex technology and real-world impact. As the CEO of iLyF and a graduate of the Founder Institute, I focus on scaling innovation through data-driven strategies and autonomous AI systems.
                </p>
                <p className="text-lg text-slate-600 leading-relaxed">
                  My approach combines rigorous product management with a deep understanding of AI orchestration—creating systems like faidhifahmi that don't just execute, but learn and evolve.
                </p>
              </div>
              <div className="flex gap-10 pt-4 border-t border-slate-50">
                <div>
                  <div className="text-3xl font-bold text-slate-900">8+</div>
                  <div className="text-xs text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Years Exp</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">100+</div>
                  <div className="text-xs text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Agents Built</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">2022</div>
                  <div className="text-xs text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">FI Graduate</div>
                </div>
              </div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative aspect-square rounded-[2.5rem] bg-slate-100 overflow-hidden border border-slate-200 shadow-2xl">
                <div className="embla w-full h-full" ref={heroEmblaRef}>
                  <div className="embla__container h-full">
                    {[
                      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
                      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
                      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800",
                      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800"
                    ].map((imgUrl, i) => (
                      <div key={i} className="embla__slide w-full h-full flex-[0_0_100%] relative">
                        <img 
                          src={imgUrl} 
                          alt="Building products" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Grid */}
      <section className="py-24 bg-[#F8FAFC]">
        <div className="container mx-auto px-6 max-w-7xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase mb-4">
            Domain Focus
          </div>
          <h2 className="text-4xl font-bold text-slate-900">Core Expertise</h2>
        </div>
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Expertise", title: "Product Strategy", desc: "Scaling products from zero to millions of users with a focus on core value and unit economics.", icon: Layers },
              { label: "Focus", title: "Agentic AI", desc: "Architecting autonomous systems that solve complex, multi-step problems using GOAP and LLMs.", icon: Brain },
              { label: "Engine", title: "Data Analytics", desc: "Transforming raw data into actionable insights that drive growth and product innovation.", icon: BarChart },
              { label: "Culture", title: "Leadership", desc: "Building high-performance teams and fostering a culture of rapid experimentation and excellence.", icon: Users },
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold tracking-widest text-blue-600 uppercase mb-2">{item.label}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RuFlo Showcase Carousel Section */}
      <section id="ruflo-section" className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-widest uppercase">
                Featured Project
              </div>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">GOAPsimplified Platform</h2>
              <p className="text-slate-500 max-w-2xl leading-relaxed">
                I love experimenting and creating stuff to make people's lives easier. My current experimentation project is GOAPsimplified—an autonomous research engine powered by Goal-Oriented Action Planning (GOAP) and high-density agent swarms.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={scrollPrev} variant="outline" size="icon" className="rounded-full w-12 h-12">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
              <Button onClick={scrollNext} variant="outline" size="icon" className="rounded-full w-12 h-12">
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Link to="/goap">
                <Button className="h-12 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white gap-2 ml-4">
                  Open App
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="embla overflow-hidden rounded-[2.5rem]" ref={emblaRef}>
            <div className="embla__container flex gap-6">
              {rufloCapabilities.map((cap, i) => (
                <div key={i} className="embla__slide flex-[0_0_85%] md:flex-[0_0_33%] min-w-0">
                  <div className="h-full p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-black/5"
                      style={{ backgroundColor: `${cap.color}15`, color: cap.color }}
                    >
                      <cap.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">{cap.title}</h3>
                    <p className="text-slate-500 leading-relaxed font-medium">
                      {cap.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-[#F8FAFC] border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Network className="h-6 w-6 text-blue-600" />
                <span className="font-bold tracking-tight text-2xl text-slate-900 uppercase">Faidhi Fahmi</span>
              </div>
              <p className="text-slate-500 max-w-xs font-medium">
                CEO @ iLyF | Founder Institute SEA '22 | Product & AI Leader
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-12 text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">
              <a href="https://faidhifahmi.my" target="_blank" className="hover:text-blue-600 transition-colors">Personal Site</a>
              <a href="https://www.linkedin.com/in/faidhifahmi/" target="_blank" className="hover:text-blue-600 transition-colors">LinkedIn</a>
              <Link to="/goap" className="hover:text-blue-600 transition-colors">faidhifahmi OS</Link>
            </div>
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-slate-400 text-xs font-bold tracking-widest uppercase">
              © {new Date().getFullYear()} Faidhi Fahmi • Built with faidhifahmi OS
            </div>
            <div className="flex items-center gap-4 grayscale opacity-40">
              <div className="text-[10px] font-bold tracking-widest text-slate-900">POWERED BY</div>
              <Network className="h-4 w-4" />
              <span className="font-bold text-xs">RUFLO PLATFORM</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import {
  Activity, ArrowLeft, ArrowUpRight, Check, Clipboard, Code2, Command,
  Expand, Gauge, Heart, Menu, MonitorDot, Pause, Play,
  RotateCcw, Search, Settings2, Shuffle, Sparkles, X,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories, defaultValues, experiments, getExperiment } from "@/data/experiments";
import type { ControlValues, Experiment } from "@/types/experiment";

type PageMode = "home" | "gallery" | "collections" | "playground" | "about" | "case-study" | "detail";
type MotionMode = "system" | "full" | "reduced";

const ParticleScene = dynamic(() => import("@/features/lab/ParticleScene"), { ssr: false, loading: () => <div className="text-xs text-white/35">Loading realtime scene…</div> });

const presets: Record<string, Record<string, number>> = {
  Soft: { speed: 0.45, intensity: 18, spring: 0.35, scale: 1.04, blur: 4, noise: 22 },
  Medium: { speed: 0.8, intensity: 36, spring: 0.55, scale: 1.12, blur: 8, noise: 45 },
  Heavy: { speed: 1.35, intensity: 62, spring: 0.72, scale: 1.28, blur: 14, noise: 68 },
};

function useStoredList(key: string) {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => { try { setItems(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { setItems([]); } }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);
  const toggle = (value: string) => setItems((current) => {
    const next = current.includes(value) ? current.filter((item) => item !== value) : [value, ...current];
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  });
  return [items, toggle] as const;
}

export function LabClient({ mode, slug }: { mode: PageMode; slug?: string }) {
  const router = useRouter();
  const [motionMode, setMotionMode] = useState<MotionMode>("system");
  const [quality, setQuality] = useState("Auto");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const systemReduced = useReducedMotion();
  const reduced = motionMode === "reduced" || (motionMode === "system" && systemReduced);
  const experiment = slug ? getExperiment(slug) : undefined;

  useEffect(() => {
    const stored = localStorage.getItem("motion-lab-motion") as MotionMode | null;
    const timer = window.setTimeout(() => { if (stored) setMotionMode(stored); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const context = gsap.context(() => {
      gsap.fromTo(".lab-kicker", { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: .6, stagger: .04, ease: "power2.out" });
    });
    return () => context.revert();
  }, [mode, reduced]);

  useEffect(() => {
    type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
    type ModelContext = { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch {} };
    register({ name: "list_motion_experiments", title: "List motion experiments", description: "List the available Motion Lab experiments with categories and difficulty.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => ({ experiments: experiments.map(({ slug, title, category, difficulty }) => ({ slug, title, category, difficulty })) }) });
    register({ name: "open_motion_experiment", title: "Open motion experiment", description: "Open one experiment by its exact slug in the visible Motion Lab interface.", inputSchema: { type: "object", properties: { slug: { type: "string", enum: experiments.map((item) => item.slug) } }, required: ["slug"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input) => { const selected = typeof input === "object" && input && "slug" in input ? getExperiment(String((input as { slug: unknown }).slug)) : undefined; if (!selected) throw new Error("Unknown experiment slug"); router.push(`/experiments/${selected.slug}`); return { opened: selected.slug }; } });
    return () => lifecycle.abort();
  }, [router]);

  const saveMotionMode = (value: MotionMode) => {
    setMotionMode(value);
    localStorage.setItem("motion-lab-motion", value);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Header mode={mode} onSettings={() => setSettingsOpen(true)} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        {mode === "home" && <Home reduced={Boolean(reduced)} />}
        {mode === "gallery" && <Gallery />}
        {mode === "collections" && <Collections />}
        {mode === "playground" && <Playground initial={experiment ?? experiments[0]} reduced={Boolean(reduced)} />}
        {mode === "about" && <About />}
        {mode === "case-study" && <CaseStudy />}
        {mode === "detail" && experiment && <ExperimentDetail experiment={experiment} reduced={Boolean(reduced)} />}
        {mode === "detail" && !experiment && <NotFoundPanel />}
      </main>
      <Footer />
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="border-white/10 bg-[#111210] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-normal">Lab settings</DialogTitle>
            <DialogDescription className="text-white/55">Tune motion and rendering for this device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-7 pt-4">
            <div>
              <div className="mb-3 flex items-center justify-between"><span className="text-sm">Motion</span><Activity className="size-4 text-primary" /></div>
              <div className="grid grid-cols-3 gap-2">
                {(["system", "full", "reduced"] as MotionMode[]).map((item) => (
                  <button key={item} onClick={() => saveMotionMode(item)} className={`rounded-full border px-3 py-2 text-xs capitalize transition ${motionMode === item ? "border-primary bg-primary text-black" : "border-white/12 hover:border-white/30"}`}>{item}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between"><span className="text-sm">Performance</span><Gauge className="size-4 text-primary" /></div>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="w-full border-white/12 bg-white/5"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Auto">Auto</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
              </Select>
            </div>
            <SettingToggle title="Pause continuous effects" description="Stops ambient loops while keeping controls usable." />
            <SettingToggle title="Disable custom cursor" description="Motion Lab only uses enhanced cursors inside selected stages." defaultChecked />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Header({ mode, onSettings, menuOpen, setMenuOpen }: { mode: PageMode; onSettings: () => void; menuOpen: boolean; setMenuOpen: (value: boolean) => void }) {
  const nav = [["Experiments", "/experiments", "gallery"], ["Collections", "/collections", "collections"], ["Playground", "/playground", "playground"], ["About", "/about", "about"]] as const;
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-4 sm:px-7 lg:px-10">
        <Link href="/" className="group flex items-center gap-3" aria-label="Motion Lab home">
          <span className="relative grid size-8 place-items-center rounded-full border border-white/20 text-[10px] font-bold"><span className="absolute size-2 rounded-full bg-primary transition-transform duration-500 group-hover:translate-x-2.5" />O</span>
          <span className="text-[13px] font-semibold leading-[0.9] tracking-[0.14em]">MOTION<br />LAB</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {nav.map(([label, href, key]) => <Link key={href} href={href} className={`text-sm transition hover:text-primary ${mode === key ? "text-primary" : "text-white/58"}`}>{label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={onSettings} className="grid size-9 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-white/30 hover:text-white" aria-label="Open settings"><Settings2 className="size-4" /></button>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hidden h-9 items-center gap-2 rounded-full border border-white/10 px-4 text-xs font-medium transition hover:border-primary hover:text-primary sm:flex"><Code2 className="size-4" />Source</a>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-9 place-items-center md:hidden" aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </div>
      <AnimatePresence>{menuOpen && <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/8 bg-background px-5 md:hidden"><div className="grid gap-1 py-4">{nav.map(([label, href]) => <Link key={href} href={href} className="rounded-xl px-3 py-3 text-lg hover:bg-white/5">{label}</Link>)}</div></motion.nav>}</AnimatePresence>
    </header>
  );
}

function Home({ reduced }: { reduced: boolean }) {
  return (
    <>
      <section className="relative min-h-[calc(100svh-64px)] overflow-hidden border-b border-white/8">
        <HeroField reduced={reduced} />
        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-64px)] max-w-[1480px] content-between px-4 py-8 sm:px-7 lg:px-10 lg:py-12">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/45"><span>Experimental motion<br />for the modern web</span><span className="hidden text-right sm:block">React · GSAP · WebGL<br />15 live studies</span></div>
          <motion.div initial={reduced ? false : { opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: [.2, .8, .2, 1] }}>
            <h1 className="font-display text-[clamp(4.6rem,15vw,14rem)] font-normal leading-[0.72] tracking-[-0.07em]">THE WEB<br /><span className="ml-[8vw] text-primary">SHOULD</span> MOVE.</h1>
          </motion.div>
          <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <p className="max-w-xl text-base leading-relaxed text-white/58 sm:text-lg">A curated collection of interactive experiments built with React, GSAP, Framer Motion and WebGL.</p>
            <div className="flex flex-wrap gap-3"><Button asChild className="h-12 rounded-full bg-primary px-6 text-black hover:bg-primary/85"><Link href="/experiments">Explore experiments</Link></Button><Button asChild variant="outline" className="h-12 rounded-full border-white/16 bg-black/10 px-6 text-white hover:bg-white/8"><Link href="/playground">Open playground</Link></Button></div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1480px] px-4 py-20 sm:px-7 lg:px-10 lg:py-28">
        <SectionIntro index="01" eyebrow="Selected studies" title="Built to be touched." copy="Every study is a working system: open it, tune it, inspect the decisions, then take the pattern with you." />
        <div className="mt-12 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{experiments.filter((e) => e.featured).slice(0, 8).map((experiment, index) => <ExperimentCard key={experiment.slug} experiment={experiment} index={index} />)}</div>
      </section>
      <section className="border-y border-white/8 bg-[#0e0f0d]">
        <div className="mx-auto max-w-[1480px] px-4 py-20 sm:px-7 lg:px-10">
          <SectionIntro index="02" eyebrow="Collections" title="One motion language. Different forces." copy="Explore intentional systems for cursor, type, scroll, interface physics and real-time graphics." />
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/8 bg-white/8 md:grid-cols-3">{collectionData.slice(0, 3).map((item) => <CollectionCard key={item.title} {...item} />)}</div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1480px] gap-12 px-4 py-24 sm:px-7 lg:grid-cols-[1fr_1.5fr] lg:px-10 lg:py-36">
        <div><span className="lab-kicker">Principle 03</span><h2 className="mt-5 font-display text-5xl font-normal tracking-[-0.04em] sm:text-7xl">Motion is a design material.</h2></div>
        <div className="grid gap-px rounded-3xl border border-white/8 bg-white/8 sm:grid-cols-2">{[["Communicate", "Motion should make state and hierarchy easier to understand."], ["Feel physical", "Weight, resistance and inertia turn input into something believable."], ["Stay fast", "Performance is part of the visual design, not a final checklist."], ["Practice restraint", "A quiet interface makes the meaningful movement more powerful."]].map(([title, copy], i) => <div key={title} className="bg-background p-7 sm:p-9"><span className="text-xs text-primary">0{i + 1}</span><h3 className="mt-12 text-2xl">{title}</h3><p className="mt-3 text-sm leading-relaxed text-white/48">{copy}</p></div>)}</div>
      </section>
    </>
  );
}

function HeroField({ reduced }: { reduced: boolean }) {
  const [position, setPosition] = useState({ x: 50, y: 45 });
  return <div className="pointer-events-auto absolute inset-0" onPointerMove={(event) => { if (!reduced) { const r = event.currentTarget.getBoundingClientRect(); setPosition({ x: ((event.clientX - r.left) / r.width) * 100, y: ((event.clientY - r.top) / r.height) * 100 }); } }}>
    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize: "5vw 5vw" }} />
    <motion.div animate={{ left: `${position.x}%`, top: `${position.y}%` }} transition={{ type: "spring", stiffness: 40, damping: 18 }} className="absolute size-[44vw] min-h-80 min-w-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-[90px]" style={{ background: "radial-gradient(circle, #d7ff45 0%, #6c7d1f 28%, transparent 68%)" }} />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(128,108,255,.14),transparent_28%),linear-gradient(to_bottom,transparent_55%,#090a08_100%)]" />
  </div>;
}

function SectionIntro({ index, eyebrow, title, copy }: { index: string; eyebrow: string; title: string; copy: string }) {
  return <div className="grid gap-8 border-t border-white/12 pt-5 md:grid-cols-[1fr_2fr]"><div className="lab-kicker"><span>{index}</span> {eyebrow}</div><div><h2 className="font-display text-4xl font-normal tracking-[-0.035em] sm:text-6xl">{title}</h2><p className="mt-5 max-w-2xl text-base leading-relaxed text-white/48">{copy}</p></div></div>;
}

function Gallery() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [sort, setSort] = useState("Featured");
  const [favorites, toggleFavorite] = useStoredList("motion-lab-favorites");
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    const result = experiments.filter((e) => (category === "All" || e.category === category) && [e.title, e.short, e.category, ...e.technologies].join(" ").toLowerCase().includes(normalized));
    return [...result].sort((a, b) => sort === "Alphabetical" ? a.title.localeCompare(b.title) : sort === "Difficulty" ? a.difficulty.localeCompare(b.difficulty) : Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [query, category, sort]);
  return <div className="mx-auto min-h-screen max-w-[1480px] px-4 py-12 sm:px-7 lg:px-10 lg:py-20">
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]"><div><span className="lab-kicker">Experiment index · {experiments.length}</span><h1 className="mt-5 font-display text-6xl tracking-[-.055em] sm:text-8xl">Find a force.<br /><span className="text-white/30">Make it yours.</span></h1></div><p className="self-end text-base leading-relaxed text-white/48">Filter by discipline, open a live study, and tune its motion system in real time. Every experiment includes controls, code and performance notes.</p></div>
    <div className="sticky top-16 z-30 -mx-4 mt-14 border-y border-white/8 bg-background/90 px-4 py-4 backdrop-blur-xl sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/36" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search experiments..." className="h-11 rounded-full border-white/12 bg-white/4 pl-11" /></div>
        <div className="scrollbar-none flex gap-2 overflow-x-auto">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs transition ${category === item ? "border-primary bg-primary text-black" : "border-white/10 text-white/55 hover:border-white/30"}`}>{item}</button>)}</div>
        <Select value={sort} onValueChange={setSort}><SelectTrigger className="w-full rounded-full border-white/12 bg-white/4 xl:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Featured">Featured</SelectItem><SelectItem value="Alphabetical">Alphabetical</SelectItem><SelectItem value="Difficulty">Difficulty</SelectItem></SelectContent></Select>
      </div>
    </div>
    <div className="mt-8 flex items-center justify-between text-xs uppercase tracking-[.15em] text-white/38"><span>{filtered.length} results</span><span>{favorites.length} saved</span></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((experiment, index) => <ExperimentCard key={experiment.slug} experiment={experiment} index={index} favorite={favorites.includes(experiment.slug)} onFavorite={() => toggleFavorite(experiment.slug)} />)}</div>
    {!filtered.length && <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-white/15"><div className="text-center"><Sparkles className="mx-auto size-6 text-primary" /><h2 className="mt-4 text-2xl">No signal found</h2><p className="mt-2 text-sm text-white/45">Try another phrase or category.</p></div></div>}
  </div>;
}

function ExperimentCard({ experiment, favorite, onFavorite }: { experiment: Experiment; index: number; favorite?: boolean; onFavorite?: () => void }) {
  return <article className="group relative overflow-hidden rounded-[22px] border border-white/9 bg-[#111210] transition duration-500 hover:-translate-y-1 hover:border-white/22">
    <Link href={`/experiments/${experiment.slug}`} className="block" aria-label={`Open ${experiment.title}`}>
      <div className="relative aspect-[4/3] overflow-hidden border-b border-white/8 bg-[#0a0b09]"><MiniVisual experiment={experiment} /><div className="absolute left-4 top-4 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[.15em] text-white/65 backdrop-blur">{String(experiment.id).padStart(2, "0")}</div><ArrowUpRight className="absolute right-4 top-4 size-5 translate-y-2 text-white/30 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100" /></div>
      <div className="p-5"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-medium tracking-[-.02em]">{experiment.title}</h2><span className="size-2 rounded-full" style={{ backgroundColor: experiment.accent }} /></div><p className="mt-2 min-h-10 text-sm leading-relaxed text-white/45">{experiment.short}</p><div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-[11px] uppercase tracking-[.12em] text-white/35"><span>{experiment.category}</span><span>{experiment.performance} cost</span></div></div>
    </Link>
    {onFavorite && <button onClick={(event) => { event.preventDefault(); onFavorite(); }} className="absolute bottom-[86px] right-4 z-10 grid size-8 place-items-center rounded-full border border-white/10 bg-black/50" aria-label={favorite ? "Remove from favorites" : "Add to favorites"}><Heart className={`size-4 ${favorite ? "fill-primary text-primary" : "text-white/50"}`} /></button>}
  </article>;
}

function MiniVisual({ experiment }: { experiment: Experiment }) {
  const shapes = Array.from({ length: 18 });
  return <div className={`mini-visual mini-${experiment.slug}`} style={{ "--accent": experiment.accent } as React.CSSProperties}>
    {experiment.slug === "magnetic-button" && <span className="mini-button">ENTER FIELD</span>}
    {experiment.slug === "cursor-blob" && <span className="mini-blob" />}
    {experiment.slug === "cursor-image-reveal" && <><span className="mini-city">OSAKA</span><span className="mini-photo" /></>}
    {experiment.slug === "liquid-typography" && <span className="mini-type">LIQUID</span>}
    {experiment.slug === "split-text-reveal" && <div className="mini-split">{"REVEAL".split("").map((l, i) => <span key={i} style={{ animationDelay: `${i * 70}ms` }}>{l}</span>)}</div>}
    {experiment.slug === "velocity-marquee" && <div className="mini-marquee">MOTION · VELOCITY · MOTION · VELOCITY ·</div>}
    {experiment.slug === "scroll-stack-cards" && <div className="mini-stack">{[1,2,3].map(i => <span key={i} style={{ transform: `translateY(${i * 13}px) rotate(${(i - 2) * 4}deg)` }} />)}</div>}
    {experiment.slug === "infinite-gallery" && <div className="mini-gallery">{[1,2,3,4,5,6].map(i => <span key={i}>{String(i).padStart(2,"0")}</span>)}</div>}
    {experiment.slug === "image-distortion" && <span className="mini-distort" />}
    {experiment.slug === "3d-tilt-card" && <span className="mini-card"><i>DEPTH</i></span>}
    {experiment.slug === "particle-logo" && <div className="mini-particles">{shapes.map((_, i) => <i key={i} />)}<b>M</b></div>}
    {experiment.slug === "shader-gradient" && <span className="mini-shader" />}
    {experiment.slug === "card-expansion" && <div className="mini-expand"><span /><span /><span /></div>}
    {experiment.slug === "page-transition" && <div className="mini-transition"><span>01</span><i /></div>}
    {experiment.slug === "drag-physics" && <span className="mini-drag">DRAG</span>}
  </div>;
}

function ExperimentDetail({ experiment, reduced }: { experiment: Experiment; reduced: boolean }) {
  const [values, setValues] = useState<ControlValues>(() => defaultValues(experiment));
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState("");
  useEffect(() => { try { localStorage.setItem("motion-lab-recent", JSON.stringify([experiment.slug, ...JSON.parse(localStorage.getItem("motion-lab-recent") ?? "[]").filter((x: string) => x !== experiment.slug)].slice(0, 5))); } catch {} }, [experiment.slug]);
  const reset = () => setValues(defaultValues(experiment));
  const copy = async (label: string, value: string) => { await navigator.clipboard?.writeText(value); setCopied(label); setTimeout(() => setCopied(""), 1500); };
  const randomize = () => setValues(Object.fromEntries(experiment.controls.map((control) => [control.key, Number((control.min + Math.random() * (control.max - control.min)).toFixed(2))])));
  return <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-7 lg:px-10 lg:py-12">
    <Link href="/experiments" className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"><ArrowLeft className="size-4" />All experiments</Link>
    <div className="mt-8 grid gap-7 border-b border-white/8 pb-10 lg:grid-cols-[1.4fr_1fr] lg:items-end"><div><div className="flex flex-wrap gap-2"><Pill>{experiment.category}</Pill><Pill>{experiment.difficulty}</Pill><Pill>{experiment.performance} cost</Pill></div><h1 className="mt-5 font-display text-6xl leading-[.9] tracking-[-.055em] sm:text-8xl">{experiment.title}</h1></div><p className="text-lg leading-relaxed text-white/52">{experiment.description}</p></div>
    <div className="mt-8 grid min-h-[680px] gap-3 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="relative overflow-hidden rounded-3xl border border-white/9 bg-[#111210]"><div className="absolute left-5 top-5 z-10 flex items-center gap-2"><span className="flex items-center gap-2 rounded-full border border-white/12 bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[.14em] backdrop-blur"><span className={`size-1.5 rounded-full ${paused ? "bg-orange-400" : "bg-primary animate-pulse"}`} />Live preview</span></div><div className="absolute right-4 top-4 z-10 flex gap-2"><StageButton label={paused ? "Resume" : "Pause"} onClick={() => setPaused(!paused)} icon={paused ? <Play /> : <Pause />} /><StageButton label="Fullscreen" onClick={() => setFullscreen(true)} icon={<Expand />} /></div><ExperimentStage experiment={experiment} values={values} paused={paused || reduced} /></div>
      <ControlPanel experiment={experiment} values={values} setValues={setValues} reset={reset} randomize={randomize} onCopy={() => copy("settings", JSON.stringify({ experiment: experiment.slug, values }, null, 2))} copied={copied === "settings"} />
    </div>
    <div className="mt-20 grid gap-12 lg:grid-cols-[1fr_1.65fr]"><div><span className="lab-kicker">How it works</span><h2 className="mt-5 font-display text-5xl tracking-[-.04em]">Intent, translated into force.</h2></div><div className="grid gap-8 sm:grid-cols-2"><Info title="Signal">Pointer or scroll position is normalized into a stable input range.</Info><Info title="Motion">Values are interpolated and passed through a spring so movement keeps continuity.</Info><Info title="Performance">Updates stay on transform and opacity where possible; continuous loops can pause offscreen.</Info><Info title="Accessibility">Reduced motion preserves the state change while removing spatial intensity.</Info></div></div>
    <CodeViewer experiment={experiment} values={values} onCopy={(code) => copy("code", code)} copied={copied === "code"} />
    <div className="mt-20 border-t border-white/8 pt-8"><span className="lab-kicker">Related studies</span><div className="mt-6 grid gap-3 md:grid-cols-3">{experiments.filter((item) => item.category === experiment.category && item.slug !== experiment.slug).concat(experiments.filter((item) => item.category !== experiment.category)).slice(0, 3).map((item, index) => <ExperimentCard key={item.slug} experiment={item} index={index} />)}</div></div>
    <Dialog open={fullscreen} onOpenChange={setFullscreen}><DialogContent className="h-[92svh] max-w-[95vw] overflow-hidden border-white/10 bg-[#090a08] p-0 text-white"><DialogHeader className="sr-only"><DialogTitle>{experiment.title} fullscreen preview</DialogTitle><DialogDescription>Interactive fullscreen preview.</DialogDescription></DialogHeader><div className="absolute left-5 top-5 z-20"><Pill>{experiment.title}</Pill></div><button onClick={() => setFullscreen(false)} className="absolute right-5 top-5 z-20 grid size-10 place-items-center rounded-full border border-white/15 bg-black/40" aria-label="Close fullscreen"><X /></button><ExperimentStage experiment={experiment} values={values} paused={paused || reduced} /></DialogContent></Dialog>
  </div>;
}

function ControlPanel({ experiment, values, setValues, reset, randomize, onCopy, copied }: { experiment: Experiment; values: ControlValues; setValues: (value: ControlValues) => void; reset: () => void; randomize: () => void; onCopy: () => void; copied: boolean }) {
  const applyPreset = (name: keyof typeof presets) => setValues({ ...values, ...Object.fromEntries(Object.entries(presets[name]).filter(([key]) => experiment.controls.some((control) => control.key === key))) });
  return <aside className="rounded-3xl border border-white/9 bg-[#111210] p-5 sm:p-6"><div className="flex items-center justify-between"><div><span className="lab-kicker">Controls</span><h2 className="mt-1 text-xl">Tune the force</h2></div><Command className="size-5 text-white/25" /></div><div className="mt-7 space-y-7">{experiment.controls.map((control) => <label key={control.key} className="block"><span className="mb-3 flex items-center justify-between text-sm"><span className="text-white/72">{control.label}</span><output className="font-mono text-xs text-primary">{values[control.key]}{control.unit}</output></span><Slider min={control.min} max={control.max} step={control.step} value={[values[control.key]]} onValueChange={(next) => setValues({ ...values, [control.key]: next[0] })} aria-label={control.label} /></label>)}</div><div className="mt-8"><span className="text-[10px] uppercase tracking-[.15em] text-white/35">Presets</span><div className="mt-3 grid grid-cols-3 gap-2">{Object.keys(presets).map((name) => <button key={name} onClick={() => applyPreset(name as keyof typeof presets)} className="rounded-xl border border-white/9 px-2 py-2.5 text-xs text-white/55 transition hover:border-primary hover:text-primary">{name}</button>)}</div></div><div className="mt-6 grid grid-cols-2 gap-2"><Button variant="outline" onClick={reset} className="border-white/10 bg-transparent text-white hover:bg-white/6"><RotateCcw className="size-4" />Reset</Button><Button variant="outline" onClick={randomize} className="border-white/10 bg-transparent text-white hover:bg-white/6"><Shuffle className="size-4" />Randomize</Button></div><Button onClick={onCopy} className="mt-2 w-full bg-primary text-black hover:bg-primary/85">{copied ? <Check /> : <Clipboard />} {copied ? "Copied" : "Copy settings"}</Button><div className="mt-6 flex items-center justify-between border-t border-white/8 pt-5 text-xs text-white/35"><span className="flex items-center gap-2"><MonitorDot className="size-4" />60 FPS</span><span>{experiment.mobile}</span></div></aside>;
}

function ExperimentStage({ experiment, values, paused }: { experiment: Experiment; values: ControlValues; paused: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0, px: 50, py: 50 });
  const [expanded, setExpanded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const onMove = (event: React.PointerEvent<HTMLDivElement>) => { const r = event.currentTarget.getBoundingClientRect(); const x = ((event.clientX - r.left) / r.width) * 2 - 1; const y = ((event.clientY - r.top) / r.height) * 2 - 1; setPointer({ x, y, px: (x + 1) * 50, py: (y + 1) * 50 }); };
  const intensity = values.intensity ?? 32;
  return <div ref={ref} onPointerMove={onMove} className={`stage stage-${experiment.slug} ${paused ? "stage-paused" : ""}`} style={{ "--accent": experiment.accent, "--px": `${pointer.px}%`, "--py": `${pointer.py}%`, "--speed": `${1.8 / (values.speed ?? .8)}s`, "--intensity": intensity / 100, "--blur": `${values.blur ?? 8}px` } as React.CSSProperties}>
    {experiment.slug === "magnetic-button" && <motion.button animate={{ x: paused ? 0 : pointer.x * intensity, y: paused ? 0 : pointer.y * intensity, scale: values.scale ?? 1.12 }} transition={{ type: "spring", stiffness: 180 * (values.spring ?? .55), damping: 14 }} className="magnetic-button">ENTER THE FIELD<span /></motion.button>}
    {experiment.slug === "cursor-blob" && <><motion.div animate={{ x: paused ? 0 : pointer.x * 180, y: paused ? 0 : pointer.y * 140, scaleX: 1 + Math.abs(pointer.x) * .28, scaleY: 1 - Math.abs(pointer.x) * .12, rotate: pointer.x * 28 }} transition={{ type: "spring", stiffness: 65, damping: 14 }} className="cursor-blob" style={{ width: values.size, height: values.size, filter: `blur(${values.blur}px)` }} /><span className="stage-caption">MOVE SLOW / MOVE FAST</span></>}
    {experiment.slug === "cursor-image-reveal" && <div className="city-list">{["TOKYO", "OSAKA", "KYOTO", "SAPPORO"].map((city, index) => <motion.span key={city} whileHover={{ x: 24, color: experiment.accent }}><small>0{index + 1}</small>{city}</motion.span>)}<motion.i animate={{ x: pointer.x * 90, y: pointer.y * 70, rotate: pointer.x * (values.rotation ?? 8), scale: values.scale ?? 1.1 }} /></div>}
    {experiment.slug === "liquid-typography" && <motion.div animate={{ skewX: paused ? 0 : pointer.x * 10, scaleX: 1 + Math.abs(pointer.x) * intensity / 250 }} transition={{ type: "spring", stiffness: 55, damping: 12 }} className="liquid-type" style={{ filter: `blur(${values.blur ?? 4}px) contrast(${1.3 + intensity / 100})` }}>LIQUID<br /><i>MOTION</i></motion.div>}
    {experiment.slug === "split-text-reveal" && <div className="split-stage" onPointerEnter={(event) => event.currentTarget.classList.remove("replay")} onClick={(event) => { event.currentTarget.classList.add("replay"); setTimeout(() => event.currentTarget.classList.remove("replay"), 30); }}>{"INTENTIONAL".split("").map((letter, index) => <span key={index} style={{ animationDelay: `${index * (values.stagger ?? 6) * 10}ms`, transform: `translateY(${values.distance ?? 28}px) rotate(${values.rotation ?? 8}deg)` }}>{letter}</span>)}<small>CLICK TO REPLAY</small></div>}
    {experiment.slug === "velocity-marquee" && <div className="marquee-stage" style={{ gap: values.gap }}><div>MOTION HAS WEIGHT · VELOCITY HAS MEANING · MOTION HAS WEIGHT · VELOCITY HAS MEANING ·</div><div>MOTION HAS WEIGHT · VELOCITY HAS MEANING · MOTION HAS WEIGHT · VELOCITY HAS MEANING ·</div></div>}
    {experiment.slug === "scroll-stack-cards" && <div className="stack-stage">{["SIGNAL", "FORCE", "RESPONSE"].map((item, i) => <motion.div key={item} style={{ top: `${18 + i * (values.gap ?? 12)}%`, rotate: `${(i - 1) * (values.rotation ?? 4)}deg`, zIndex: i }} whileHover={{ y: -22 }}><span>0{i + 1}</span><b>{item}</b></motion.div>)}</div>}
    {experiment.slug === "infinite-gallery" && <motion.div drag dragElastic={.18} dragMomentum={!paused} className="infinite-stage">{Array.from({ length: 9 }).map((_, i) => <div key={i} style={{ background: `hsl(${70 + i * 24} 70% ${32 + (i % 3) * 8}%)` }}><span>{String(i + 1).padStart(2, "0")}</span></div>)}</motion.div>}
    {experiment.slug === "image-distortion" && <motion.div animate={{ rotateX: pointer.y * 8, rotateY: pointer.x * -8, skewX: pointer.x * intensity / 7 }} className="distortion-stage"><div style={{ transform: `scale(${1.06 + intensity / 500})`, filter: `saturate(${1 + (values.noise ?? 5) / 10})` }} /><span>PROCEDURAL<br />FIELD</span></motion.div>}
    {experiment.slug === "3d-tilt-card" && <div className="tilt-wrap" style={{ perspective: values.perspective }}><motion.div animate={{ rotateX: paused ? 0 : pointer.y * -(values.tilt ?? 14), rotateY: paused ? 0 : pointer.x * (values.tilt ?? 14) }} transition={{ type: "spring", stiffness: 120, damping: 18 }} className="tilt-stage"><span className="tilt-index">ML—10</span><b>MOTION<br />HAS DEPTH</b><i style={{ background: `radial-gradient(circle at ${pointer.px}% ${pointer.py}%, rgba(255,255,255,${(values.glare ?? 36) / 100}), transparent 35%)` }} /><em style={{ transform: `translateZ(${values.depth ?? 32}px)` }}>TILT / LIGHT / LAYERS</em></motion.div></div>}
    {experiment.slug === "particle-logo" && <div className="particle-stage"><ParticleScene speed={paused ? 0 : values.spring ?? .55} pointerX={pointer.x} pointerY={pointer.y} /><strong>MOTION</strong></div>}
    {experiment.slug === "shader-gradient" && <div className="shader-stage" style={{ filter: `contrast(${1 + intensity / 100}) saturate(${1.1 + (values.noise ?? 4) / 10})` }}><i /><b>REAL‑TIME<br />COLOR FIELD</b><span>GLSL / NOISE / 60FPS</span></div>}
    {experiment.slug === "card-expansion" && <div className="expand-stage"><AnimatePresence mode="wait">{!expanded ? <motion.button layoutId="expand-card" onClick={() => setExpanded(true)} className="expand-card"><span>01</span><b>OPEN STUDY</b><ArrowUpRight /></motion.button> : <motion.div layoutId="expand-card" className="expanded-card" style={{ borderRadius: values.radius }}><button onClick={() => setExpanded(false)}><X /></button><span>SHARED LAYOUT</span><b>One surface.<br />Two states.</b></motion.div>}</AnimatePresence></div>}
    {experiment.slug === "page-transition" && <div className="transition-stage"><button onClick={() => { setTransitioning(true); setTimeout(() => setTransitioning(false), 1500); }}>TRIGGER TRANSITION</button><AnimatePresence>{transitioning && <motion.div initial={{ scaleY: 0, transformOrigin: "bottom" }} animate={{ scaleY: 1 }} exit={{ scaleY: 0, transformOrigin: "top" }} transition={{ duration: .55 }} className="transition-curtain"><motion.b initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .35 }}>MOTION LAB</motion.b></motion.div>}</AnimatePresence></div>}
    {experiment.slug === "drag-physics" && <div className="drag-stage"><motion.div drag dragConstraints={ref} dragElastic={(values.spring ?? .55) * .5} dragMomentum={!paused} whileDrag={{ scale: values.scale ?? 1.1, cursor: "grabbing" }}><span>DRAG</span><i /></motion.div><small>THROW ME AGAINST THE BOUNDS</small></div>}
  </div>;
}

function CodeViewer({ experiment, values, onCopy, copied }: { experiment: Experiment; values: ControlValues; onCopy: (code: string) => void; copied: boolean }) {
  const code = `import { motion } from "framer-motion";\n\nexport function ${experiment.title.replace(/\s/g, "")}() {\n  const config = ${JSON.stringify(values, null, 2)};\n\n  return (\n    <motion.div\n      data-experiment="${experiment.slug}"\n      transition={{ type: "spring", stiffness: 180 }}\n    >\n      Motion should feel intentional.\n    </motion.div>\n  );\n}`;
  return <section className="mt-20 overflow-hidden rounded-3xl border border-white/9 bg-[#0e0f0d]"><div className="flex items-center justify-between border-b border-white/8 px-5 py-4"><div className="flex items-center gap-3"><Code2 className="size-4 text-primary" /><span className="text-sm">Implementation</span></div><button onClick={() => onCopy(code)} className="flex items-center gap-2 text-xs text-white/45 hover:text-white">{copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}{copied ? "Copied" : "Copy code"}</button></div><Tabs defaultValue="react"><TabsList className="mx-5 mt-4 bg-white/5"><TabsTrigger value="react">React</TabsTrigger><TabsTrigger value="css">CSS</TabsTrigger><TabsTrigger value="config">Config</TabsTrigger></TabsList><TabsContent value="react"><CodeBlock code={code} /></TabsContent><TabsContent value="css"><CodeBlock code={`.${experiment.slug} {\n  will-change: transform;\n  contain: layout paint;\n  transition: transform var(--motion-fast);\n}`} /></TabsContent><TabsContent value="config"><CodeBlock code={JSON.stringify({ slug: experiment.slug, controls: experiment.controls }, null, 2)} /></TabsContent></Tabs></section>;
}

function CodeBlock({ code }: { code: string }) { return <pre className="scrollbar-thin max-h-[430px] overflow-auto p-6 font-mono text-[13px] leading-7 text-white/70"><code>{code.split("\n").map((line, index) => <span key={index} className="block"><i className="mr-6 inline-block w-5 select-none text-right not-italic text-white/20">{index + 1}</i>{line}</span>)}</code></pre>; }

function Playground({ initial, reduced }: { initial: Experiment; reduced: boolean }) {
  const [selected, setSelected] = useState(initial);
  const [values, setValues] = useState<ControlValues>(() => defaultValues(initial));
  const [copied, setCopied] = useState(false);
  const choose = (slug: string) => { const next = getExperiment(slug) ?? initial; setSelected(next); setValues(defaultValues(next)); history.replaceState(null, "", `/playground?experiment=${slug}`); };
  return <div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-7 lg:px-10"><div className="flex flex-col gap-6 border-b border-white/8 pb-8 lg:flex-row lg:items-end lg:justify-between"><div><span className="lab-kicker">Universal playground</span><h1 className="mt-4 font-display text-6xl tracking-[-.05em] sm:text-8xl">Tune the system.</h1></div><Select value={selected.slug} onValueChange={choose}><SelectTrigger className="h-12 w-full rounded-full border-white/12 bg-white/5 px-5 lg:w-72"><SelectValue /></SelectTrigger><SelectContent>{experiments.map((item) => <SelectItem key={item.slug} value={item.slug}>{item.title}</SelectItem>)}</SelectContent></Select></div><div className="mt-7 grid gap-3 xl:grid-cols-[minmax(0,1fr)_350px]"><div className="min-h-[650px] overflow-hidden rounded-3xl border border-white/9 bg-[#111210]"><ExperimentStage experiment={selected} values={values} paused={reduced} /></div><ControlPanel experiment={selected} values={values} setValues={setValues} reset={() => setValues(defaultValues(selected))} randomize={() => setValues(Object.fromEntries(selected.controls.map((c) => [c.key, Number((c.min + Math.random() * (c.max - c.min)).toFixed(2))])))} onCopy={async () => { await navigator.clipboard?.writeText(JSON.stringify(values, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1200); }} copied={copied} /></div><div className="mt-6 rounded-2xl border border-white/8 bg-[#111210] p-5"><div className="flex items-center justify-between"><span className="lab-kicker">Generated config</span><span className="font-mono text-xs text-primary">live</span></div><pre className="mt-4 overflow-x-auto font-mono text-sm leading-7 text-white/55">{JSON.stringify({ experiment: selected.slug, ...values }, null, 2)}</pre></div></div>;
}

const collectionData = [
  { title: "Cursor systems", count: 3, color: "#d7ff45", tags: "Magnetism · Lag · Reveal" },
  { title: "Type in motion", count: 3, color: "#c7a8ff", tags: "Split · Liquid · Velocity" },
  { title: "Realtime graphics", count: 3, color: "#33d6c6", tags: "Particles · Shader · Distortion" },
  { title: "Interface physics", count: 4, color: "#ff9b71", tags: "Drag · Expand · Transition" },
];
function Collections() { return <div className="mx-auto min-h-screen max-w-[1480px] px-4 py-16 sm:px-7 lg:px-10 lg:py-24"><SectionIntro index="01" eyebrow="Curated paths" title="Study motion by behavior." copy="Focused collections connect patterns across implementation techniques, from pointer math to shader uniforms." /><div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/8 bg-white/8 md:grid-cols-2">{collectionData.map((item) => <CollectionCard key={item.title} {...item} />)}</div></div>; }
function CollectionCard({ title, count, color, tags }: { title: string; count: number; color: string; tags: string }) { return <Link href={`/experiments?collection=${encodeURIComponent(title)}`} className="group min-h-72 bg-background p-7 transition hover:bg-white/[.035] sm:p-10"><div className="flex items-center justify-between"><span className="size-3 rounded-full" style={{ background: color }} /><span className="text-xs text-white/35">{String(count).padStart(2,"0")} experiments</span></div><h3 className="mt-20 font-display text-4xl tracking-[-.04em] sm:text-5xl">{title}</h3><div className="mt-5 flex items-center justify-between gap-4 border-t border-white/8 pt-4 text-xs text-white/40"><span>{tags}</span><ArrowUpRight className="size-4 transition group-hover:-translate-y-1 group-hover:translate-x-1" /></div></Link>; }

function About() { return <div className="mx-auto max-w-[1480px] px-4 py-16 sm:px-7 lg:px-10 lg:py-24"><div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]"><div><span className="lab-kicker">About Motion Lab</span><h1 className="mt-5 font-display text-6xl leading-[.86] tracking-[-.06em] sm:text-9xl">Motion should feel intentional.</h1></div><p className="self-end text-lg leading-relaxed text-white/52">Motion Lab is a working archive of interaction systems for the modern web. It exists to explore how timing, physics, typography and realtime graphics can make an interface clearer—and more memorable.</p></div><div className="mt-24 grid gap-px rounded-3xl border border-white/8 bg-white/8 md:grid-cols-2">{[["01", "Motion should communicate", "Animation explains change, hierarchy and consequence."], ["02", "Interaction should feel physical", "Digital objects can carry weight, resistance and momentum."], ["03", "Performance is part of design", "A beautiful effect at 20 FPS is a broken effect."], ["04", "Restraint matters", "Not everything should move all the time."]].map(([index, title, copy]) => <div key={index} className="bg-background p-8 sm:p-11"><span className="text-xs text-primary">{index}</span><h2 className="mt-12 text-2xl">{title}</h2><p className="mt-3 max-w-md leading-relaxed text-white/45">{copy}</p></div>)}</div><div className="mt-24 grid gap-10 border-t border-white/8 pt-10 lg:grid-cols-3"><div><span className="lab-kicker">Stack</span><p className="mt-5 text-2xl">React · TypeScript · GSAP · Framer Motion · Three.js · WebGL</p></div><div><span className="lab-kicker">System</span><p className="mt-5 text-2xl">Declarative controls · shared motion tokens · reusable stages</p></div><div><span className="lab-kicker">Guarantees</span><p className="mt-5 text-2xl">Reduced motion · touch support · pause controls · fallbacks</p></div></div></div>; }

function CaseStudy() { const rows = [["Problem", "Most animation demos isolate a trick from the product decisions that make it useful."], ["Concept", "A curated lab where every effect is interactive, configurable and readable."], ["Interaction system", "Pointer and scroll signals are normalized once, then composed with springs and motion tokens."], ["WebGL architecture", "Heavy scenes are isolated, quality-aware and designed to pause outside the viewport."], ["Accessibility", "A global motion policy and local pause controls preserve access without removing meaning."], ["Lessons", "The strongest motion emerges from clear constraints—not from adding more effects."]]; return <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-7 lg:py-24"><span className="lab-kicker">Case study · Building Motion Lab</span><h1 className="mt-6 font-display text-6xl tracking-[-.055em] sm:text-9xl">A system for controlled experimentation.</h1><div className="mt-20">{rows.map(([title, copy], index) => <section key={title} className="grid gap-5 border-t border-white/10 py-10 md:grid-cols-[120px_1fr_1.5fr]"><span className="text-xs text-primary">{String(index + 1).padStart(2,"0")}</span><h2 className="text-2xl">{title}</h2><p className="max-w-xl leading-relaxed text-white/48">{copy}</p></section>)}</div></div>; }

function SettingToggle({ title, description, defaultChecked }: { title: string; description: string; defaultChecked?: boolean }) { const [checked, setChecked] = useState(defaultChecked); return <div className="flex items-center justify-between gap-4"><div><p className="text-sm">{title}</p><p className="mt-1 text-xs leading-relaxed text-white/40">{description}</p></div><Switch checked={checked} onCheckedChange={setChecked} /></div>; }
function StageButton({ label, onClick, icon }: { label: string; onClick: () => void; icon: React.ReactNode }) { return <button onClick={onClick} className="grid size-9 place-items-center rounded-full border border-white/12 bg-black/45 text-white/65 backdrop-blur transition hover:text-white" aria-label={label}>{<span className="[&_svg]:size-4">{icon}</span>}</button>; }
function Pill({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-white/12 bg-white/[.035] px-3 py-1.5 text-[10px] uppercase tracking-[.13em] text-white/55">{children}</span>; }
function Info({ title, children }: { title: string; children: React.ReactNode }) { return <div className="border-t border-white/10 pt-4"><h3 className="text-sm text-primary">{title}</h3><p className="mt-3 text-sm leading-relaxed text-white/45">{children}</p></div>; }
function NotFoundPanel() { return <div className="grid min-h-[70vh] place-items-center px-4 text-center"><div><div className="font-display text-[18vw] leading-none text-primary">404</div><h1 className="text-2xl">This experiment escaped the lab.</h1><Button asChild className="mt-6 rounded-full bg-primary text-black"><Link href="/experiments">Back to Lab</Link></Button></div></div>; }
function Footer() { return <footer className="border-t border-white/8"><div className="mx-auto grid max-w-[1480px] gap-10 px-4 py-14 sm:px-7 md:grid-cols-[1.5fr_1fr_1fr] lg:px-10"><div><div className="text-[13px] font-semibold leading-[.9] tracking-[.14em]">MOTION<br />LAB</div><p className="mt-5 max-w-sm text-sm leading-relaxed text-white/38">Experimental motion for the modern web. Built with React, GSAP and Three.js.</p></div><div className="grid gap-2 text-sm text-white/48"><Link href="/experiments">Experiments</Link><Link href="/collections">Collections</Link><Link href="/playground">Playground</Link></div><div className="grid gap-2 text-sm text-white/48"><Link href="/about">About</Link><Link href="/case-study">Case study</Link><a href="https://github.com">GitHub</a></div></div><div className="mx-auto flex max-w-[1480px] justify-between border-t border-white/8 px-4 py-5 text-[10px] uppercase tracking-[.15em] text-white/25 sm:px-7 lg:px-10"><span>© 2026 Motion Lab</span><span>Move with intent</span></div></footer>; }

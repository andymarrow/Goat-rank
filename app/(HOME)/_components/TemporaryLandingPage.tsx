"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Film,
  Smartphone,
  UserCheck,
  Coffee,
  Sparkles,
  Users,
  BarChart2,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe,
  TrendingUp,
  MessageSquare,
  Flame,
  Check,
  ChevronRight,
} from "lucide-react";

// Sample interactive polls data
interface DemoPoll {
  id: string;
  category: string;
  question: string;
  optionA: { name: string; votes: number; image?: string; color: string };
  optionB: { name: string; votes: number; image?: string; color: string };
  totalVotes: number;
}

const DEMO_POLLS: Record<string, DemoPoll> = {
  sports: {
    id: "sports-1",
    category: "Sports",
    question: "Who is the All-Time Football GOAT?",
    optionA: { name: "Lionel Messi", votes: 4120, color: "#3B82F6" },
    optionB: { name: "Cristiano Ronaldo", votes: 3850, color: "#EF4444" },
    totalVotes: 7970,
  },
  entertainment: {
    id: "ent-1",
    category: "Entertainment",
    question: "Which Cinematic Universe reigns supreme?",
    optionA: { name: "Marvel Cinematic (MCU)", votes: 5430, color: "#E11D48" },
    optionB: { name: "DC Extended Universe", votes: 2190, color: "#6366F1" },
    totalVotes: 7620,
  },
  products: {
    id: "prod-1",
    category: "Products",
    question: "Primary Daily Mobile Ecosystem?",
    optionA: { name: "Apple iOS", votes: 6890, color: "#8B5CF6" },
    optionB: { name: "Android OS", votes: 4120, color: "#10B981" },
    totalVotes: 11010,
  },
  public_figures: {
    id: "fig-1",
    category: "Public Figures",
    question: "Most Visionary Tech Pioneer of our era?",
    optionA: { name: "Elon Musk", votes: 3410, color: "#F59E0B" },
    optionB: { name: "Jensen Huang", votes: 3980, color: "#84CC16" },
    totalVotes: 7390,
  },
  everyday: {
    id: "day-1",
    category: "Everyday Topics",
    question: "Ultimate Morning Productivity Fuel?",
    optionA: { name: "Espresso Coffee", votes: 5920, color: "#D97706" },
    optionB: { name: "Ceremonial Matcha", votes: 3110, color: "#059669" },
    totalVotes: 9030,
  },
};

// Group breakdown sample data for demonstration
const GROUP_BREAKDOWNS = [
  {
    group: "Overall Community",
    messi: 52,
    ronaldo: 48,
    sampleSize: "7,970 votes",
  },
  {
    group: "Gen-Z Voters (18-24)",
    messi: 58,
    ronaldo: 42,
    sampleSize: "2,410 votes",
  },
  {
    group: "Millennials (25-40)",
    messi: 49,
    ronaldo: 51,
    sampleSize: "3,820 votes",
  },
  {
    group: "European Region",
    messi: 46,
    ronaldo: 54,
    sampleSize: "1,740 votes",
  },
];

export default function TemporaryLandingPage() {
  const [activeCategory, setActiveCategory] = useState<string>("sports");
  const [userVotes, setUserVotes] = useState<Record<string, "A" | "B">>({});
  const [pollStates, setPollStates] = useState(DEMO_POLLS);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const handleVote = (catKey: string, choice: "A" | "B") => {
    if (userVotes[catKey]) return; // already voted in this session

    setUserVotes((prev) => ({ ...prev, [catKey]: choice }));
    setPollStates((prev) => {
      const current = prev[catKey];
      if (!current) return prev;
      const isA = choice === "A";
      return {
        ...prev,
        [catKey]: {
          ...current,
          totalVotes: current.totalVotes + 1,
          optionA: {
            ...current.optionA,
            votes: isA ? current.optionA.votes + 1 : current.optionA.votes,
          },
          optionB: {
            ...current.optionB,
            votes: !isA ? current.optionB.votes + 1 : current.optionB.votes,
          },
        },
      };
    });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setEmailSubmitted(true);
  };

  const currentPoll = pollStates[activeCategory] || pollStates.sports;
  const pctA = Math.round((currentPoll.optionA.votes / currentPoll.totalVotes) * 100);
  const pctB = 100 - pctA;

  return (
    <div className="w-full flex flex-col items-center gap-16 pb-24 text-foreground font-sans selection:bg-primary selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="w-full pt-4 flex flex-col items-center text-center gap-8 relative">
        <div className="absolute inset-0 -z-10 pointer-events-none tex-grid" />
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs sm:text-sm font-semibold tracking-wide"
        >
          <Sparkles className="w-4 h-4" />
          <span>Social Opinion & Preference Engine</span>
        </motion.div>

        {/* Main Title & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl flex flex-col gap-4"
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-foreground">
            Discover & Collect <br className="hidden sm:inline" />
            What People <span className="text-primary italic">Really</span> Think
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            <strong className="text-foreground font-semibold">GoatRank</strong> is a social platform for discovering and collecting people&apos;s opinions on a wide range of topics—from everyday choices to grand debates.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2"
        >
          <a
            href="#interactive-demo"
            className="px-6 py-3.5 rounded-xl bg-primary text-white font-bold text-sm sm:text-base shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 pressable"
          >
            <span>Explore Public Opinions</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#community-waitlist"
            className="px-6 py-3.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm sm:text-base hover:bg-muted/50 hover:border-primary/40 transition-all flex items-center gap-2"
          >
            <span>Join Early Access</span>
          </a>
        </motion.div>

        {/* Live Interactive Hero Showcase */}
        <motion.div
          id="interactive-demo"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full max-w-3xl mt-6 rounded-2xl bg-card border border-border/80 p-5 sm:p-7 shadow-2xl relative overflow-hidden text-left"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-4 mb-5 flex-wrap">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary animate-pulse" />
              <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                Live Interactive Comparison
              </span>
            </div>

            {/* Category Selector Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
              {[
                { id: "sports", label: "Sports ⚽" },
                { id: "entertainment", label: "Entertainment 🎬" },
                { id: "products", label: "Products 📱" },
                { id: "public_figures", label: "Figures 🌟" },
                { id: "everyday", label: "Everyday ☕" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCategory === tab.id
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question & Vote Cards */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-primary/10 text-primary uppercase">
                Category: {currentPoll.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {currentPoll.totalVotes.toLocaleString()} responses collected
              </span>
            </div>

            <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
              {currentPoll.question}
            </h3>

            {/* Voting Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Option A */}
              <button
                onClick={() => handleVote(activeCategory, "A")}
                disabled={Boolean(userVotes[activeCategory])}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  userVotes[activeCategory] === "A"
                    ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/30"
                    : "border-border bg-background hover:border-primary/50 hover:bg-muted/20"
                }`}
              >
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="font-bold text-base sm:text-lg group-hover:text-primary transition-colors">
                    {currentPoll.optionA.name}
                  </span>
                  {userVotes[activeCategory] === "A" && (
                    <span className="bg-primary text-white p-1 rounded-full text-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between text-xs text-muted-foreground relative z-10">
                  <span>{currentPoll.optionA.votes.toLocaleString()} votes</span>
                  <span className="font-extrabold text-sm text-foreground">{pctA}%</span>
                </div>
                {/* Visual Progress Bar */}
                <div
                  className="absolute bottom-0 left-0 top-0 bg-primary/15 transition-all duration-700 ease-out"
                  style={{ width: `${pctA}%` }}
                />
              </button>

              {/* Option B */}
              <button
                onClick={() => handleVote(activeCategory, "B")}
                disabled={Boolean(userVotes[activeCategory])}
                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  userVotes[activeCategory] === "B"
                    ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/30"
                    : "border-border bg-background hover:border-primary/50 hover:bg-muted/20"
                }`}
              >
                <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="font-bold text-base sm:text-lg group-hover:text-primary transition-colors">
                    {currentPoll.optionB.name}
                  </span>
                  {userVotes[activeCategory] === "B" && (
                    <span className="bg-primary text-white p-1 rounded-full text-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between text-xs text-muted-foreground relative z-10">
                  <span>{currentPoll.optionB.votes.toLocaleString()} votes</span>
                  <span className="font-extrabold text-sm text-foreground">{pctB}%</span>
                </div>
                {/* Visual Progress Bar */}
                <div
                  className="absolute bottom-0 left-0 top-0 bg-primary/15 transition-all duration-700 ease-out"
                  style={{ width: `${pctB}%` }}
                />
              </button>
            </div>

            {/* Hint / Feedback */}
            <p className="text-xs text-center text-muted-foreground pt-1 italic">
              {userVotes[activeCategory]
                ? "✨ Thanks for sharing your preference! Your vote has been added to the live tally."
                : "💡 Click either option above to cast your vote and see live community preferences."}
            </p>
          </div>
        </motion.div>
      </section>

      {/* 2. SECTION: EXPLORE A WIDE RANGE OF TOPICS */}
      <section className="w-full max-w-5xl flex flex-col items-center gap-10">
        <div className="text-center flex flex-col gap-3 max-w-2xl">
          <div className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Globe className="w-4 h-4" />
            <span>Versatile Topics & Comparisons</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Browse Questions & Head-to-Head Comparisons
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Users can browse questions and comparisons about sports, entertainment, products, public figures, and everyday topics, and share their preferences and opinions.
          </p>
        </div>

        {/* 5 Topic Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-2 gap-5 w-full">
          {[
            {
              icon: Trophy,
              title: "Sports",
              tagline: "GOAT debates, team match-ups, legendary plays & player rankings.",
              color: "from-blue-500/10 to-indigo-500/5",
              borderColor: "border-blue-500/20",
              sample: "Messi vs Ronaldo • Jordan vs LeBron",
            },
            {
              icon: Film,
              title: "Entertainment",
              tagline: "Movies, series, albums, video games, and pop culture showdowns.",
              color: "from-pink-500/10 to-rose-500/5",
              borderColor: "border-pink-500/20",
              sample: "Marvel vs DC • Breaking Bad vs Sopranos",
            },
            {
              icon: Smartphone,
              title: "Products & Tech",
              tagline: "Smartphones, EV brands, software tools, and consumer electronics.",
              color: "from-purple-500/10 to-violet-500/5",
              borderColor: "border-purple-500/20",
              sample: "iOS vs Android • Mac vs PC",
            },
            {
              icon: UserCheck,
              title: "Public Figures",
              tagline: "Thought leaders, creators, athletes, innovators, and icons.",
              color: "from-amber-500/10 to-yellow-500/5",
              borderColor: "border-amber-500/20",
              sample: "Tech Founders • Top Creators",
            },
            {
              icon: Coffee,
              title: "Everyday Topics",
              tagline: "Daily habits, lifestyle choices, food battles, and routine preferences.",
              color: "from-emerald-500/10 to-teal-500/5",
              borderColor: "border-emerald-500/20",
              sample: "Coffee vs Tea • WFH vs Office",
            },
          ].map((cat, idx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`p-6 rounded-2xl bg-card border ${cat.borderColor} bg-gradient-to-br ${cat.color} flex flex-col justify-between gap-4 hover:border-primary/50 transition-all hover:-translate-y-1 shadow-sm`}
            >
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-primary shadow-sm">
                  <cat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">{cat.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {cat.tagline}
                </p>
              </div>

              <div className="pt-3 border-t border-border/40 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>{cat.sample}</span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. SECTION: ORGANIZED COMMUNITY PERSPECTIVES */}
      <section className="w-full max-w-5xl rounded-3xl bg-card border border-border p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-5">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <BarChart2 className="w-4 h-4" />
              <span>Structured Opinion Analytics</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-snug">
              See How Different Groups Think About Any Topic
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              The platform organizes community responses so users can easily see how different groups of people think about a particular topic. <strong className="text-foreground font-semibold">GoatRank</strong> is designed to make it simple and engaging to explore public opinions and discover different perspectives.
            </p>

            <ul className="flex flex-col gap-3 pt-2">
              {[
                "Segmented Community Breakdown (Demographics, Regions, Groups)",
                "Real-time sentiment tracking with transparent vote counts",
                "Discover surprising consensus and friendly rivalries",
              ].map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Group Breakdown Widget */}
          <div className="p-5 sm:p-6 rounded-2xl bg-background border border-border flex flex-col gap-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                  Group Insight Explorer
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">Demo Topic: Messi vs Ronaldo</span>
            </div>

            {/* Filter buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-muted/30 p-1.5 rounded-xl text-xs">
              {GROUP_BREAKDOWNS.map((item, idx) => (
                <button
                  key={item.group}
                  onClick={() => setActiveGroupIndex(idx)}
                  className={`py-1.5 px-2 rounded-lg font-semibold truncate transition-all ${
                    activeGroupIndex === idx
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.group.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Active Group Details */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-foreground">
                  {GROUP_BREAKDOWNS[activeGroupIndex].group}
                </span>
                <span className="text-muted-foreground font-mono">
                  {GROUP_BREAKDOWNS[activeGroupIndex].sampleSize}
                </span>
              </div>

              {/* Progress split */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-blue-500">Messi ({GROUP_BREAKDOWNS[activeGroupIndex].messi}%)</span>
                  <span className="text-red-500">Ronaldo ({GROUP_BREAKDOWNS[activeGroupIndex].ronaldo}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${GROUP_BREAKDOWNS[activeGroupIndex].messi}%` }}
                  />
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${GROUP_BREAKDOWNS[activeGroupIndex].ronaldo}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: CORE GOAL & VISION */}
      <section className="w-full max-w-4xl text-center flex flex-col items-center gap-6 py-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
          <Zap className="w-7 h-7" />
        </div>

        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Our Core Mission
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-snug">
            A Simple Community-Driven Collection of Opinions
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            The goal is to create a simple community-driven collection of opinions and preferences around topics people care about.
          </p>
        </div>

        {/* Feature 3-Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full pt-4 text-left">
          {[
            {
              num: "01",
              title: "Discover Topics",
              desc: "Explore daily comparisons, trending questions, and community rankings across diverse domains.",
            },
            {
              num: "02",
              title: "Share Preferences",
              desc: "Express your choices simply, add optional testimonials, and vote on what matters to you.",
            },
            {
              num: "03",
              title: "Uncover Consensus",
              desc: "See how opinions group together, identify trends, and appreciate diverse community perspectives.",
            },
          ].map((step) => (
            <div key={step.num} className="p-5 rounded-2xl bg-card border border-border flex flex-col gap-2.5">
              <span className="text-2xl font-black text-primary font-mono">{step.num}</span>
              <h3 className="text-lg font-bold">{step.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. COMMUNITY WAITLIST / EARLY ACCESS */}
      <section id="community-waitlist" className="w-full max-w-3xl rounded-3xl bg-gradient-to-b from-primary/15 via-card to-card border border-primary/30 p-8 sm:p-12 text-center flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col gap-3 max-w-lg">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Be Part of GoatRank
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Join our community to start creating topics, sharing your opinions, and exploring collective perspectives.
          </p>
        </div>

        {!emailSubmitted ? (
          <form onSubmit={handleEmailSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              required
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shrink-0 pressable shadow-lg shadow-primary/20"
            >
              Get Early Access
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>You&apos;re on the list! We&apos;ll notify you as new topic collections launch.</span>
          </motion.div>
        )}

        <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-primary" /> Community Driven
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-primary" /> Open Perspectives
          </span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full max-w-5xl pt-10 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">GOAT Rank</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/arena" className="hover:text-primary transition-colors underline font-medium">
            Switch to Battle Arena Page
          </Link>
        </div>
      </footer>
    </div>
  );
}

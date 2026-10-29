import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  Mic, 
  FileText, 
  BrainCircuit, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Candidate Evaluation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight md:leading-[1.15] mb-6">
            Master Technical Interviews with{' '}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200 bg-clip-text text-transparent">
              Real-Time AI Competency Analytics
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Experience realistic technical interviews across Java, Python, Full Stack, Frontend, Backend, and SQL. 
            Receive immediate objective scoring on technical accuracy, relevance, completeness, clarity, and text-based linguistic cadence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 group transition-all"
            >
              <span>Start Free Mock Interview</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors"
            >
              Sign in with Google
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Designed for Comprehensive Technical Assessment
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Combining browser speech processing, Python NLP microservice intelligence, and enterprise Java Spring Boot persistence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-sky-500/40 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-5 text-sky-400">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2.5">Voice & Text Interaction</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Listen to questions read aloud with speech synthesis. Answer via microphone with live speech-to-text recognition or type your answer with full editing control.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2.5">4-Dimensional Technical Rubric</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Weighted scoring breakdown: Technical Accuracy (40%), Relevance (25%), Completeness (20%), and Clarity (15%), ensuring calibrated feedback.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2.5">Persistent Progress Tracking</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Every interview question, candidate response, sentiment indicator, and evaluation is securely stored in MySQL. Track your progress across roles and difficulties over time.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">Simple 4-Step Process</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How The Platform Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Choose Role & Level', desc: 'Select from Java, Python, Full Stack, Frontend, Backend, or SQL with Beginner to Advanced difficulty.' },
              { step: '02', title: 'Choose Input Mode', desc: 'Engage with voice questions and microphone speech-to-text, or classic focused typing mode.' },
              { step: '03', title: 'Answer & Evaluate', desc: 'Submit questions one at a time. The Python microservice analyzes semantic depth and linguistic clarity.' },
              { step: '04', title: 'Actionable Report', desc: 'Review overall scores, key strengths, missing architecture concepts, and tailored practice tips.' },
            ].map((s, idx) => (
              <div key={idx} className="relative p-5 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-3xl font-extrabold text-sky-500/30 mb-2">{s.step}</div>
                <div className="font-semibold text-white text-base mb-1.5">{s.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ready Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-sky-950/60 via-indigo-950/60 to-slate-900 border border-sky-500/20 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to Practice Your Next Technical Interview?</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-8">
            Create an account or sign in with Google in seconds. Practice with verified questions and build real interview confidence.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-sky-500 hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/25"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

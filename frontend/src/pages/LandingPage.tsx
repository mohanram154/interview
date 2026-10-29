import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  HelpCircle, 
  Mic, 
  BrainCircuit, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Award
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-gradient-to-b from-violet-50/70 via-white to-white">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>AI-Driven Technical Assessment Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight md:leading-[1.15] mb-6">
            Master Technical Interviews with{' '}
            <span className="text-violet-600">
              Interactive MCQ & Competency Analytics
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed font-normal">
            Take objective 15–20 multiple-choice technical assessments across Java, Python, Full Stack, Frontend, Backend, and SQL. 
            Receive instant scoring, detailed explanations, category breakdowns, and performance analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 group transition-all"
            >
              <span>Start MCQ Interview</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-violet-50 border border-gray-200 transition-colors shadow-xs"
            >
              Sign in with Google
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-600" />
              <span>15–20 Questions per Round</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-600" />
              <span>Beginner, Intermediate & Advanced</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-600" />
              <span>Instant Verified Explanations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Engineered for Rigorous Technical Evaluation
          </h2>
          <p className="text-gray-600 text-sm max-w-2xl mx-auto">
            Combining multiple-choice question mastery, Java Spring Boot persistence, and Python NLP intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-5 text-violet-600">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">15–20 MCQ Round</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Answer 15 or 20 curated technical questions with 4 selectable options. Features question navigation, mark-for-review, and autosaving of progress.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-5 text-violet-600">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Objective Scoring</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Deterministic backend evaluation with no negative marking: 1 mark per correct answer, transparent percentage calculation, and verified answer keys.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-5 text-violet-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Persistent History & Reports</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Review completed sessions anytime. View full answer explanations, question difficulty distributions, and personalized improvement areas.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-200 bg-violet-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">Seamless Experience</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How The Platform Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Select Domain', desc: 'Choose from Java, Python, Full Stack, Frontend, Backend, or SQL.' },
              { step: '02', title: 'Configure Round', desc: 'Select Beginner, Intermediate, or Advanced level with 15 or 20 questions.' },
              { step: '03', title: 'Answer & Review', desc: 'Select options, mark questions for review, and navigate freely between questions.' },
              { step: '04', title: 'Instant Scorecard', desc: 'Submit to unlock total score %, correct answers, and comprehensive explanations.' },
            ].map((s, idx) => (
              <div key={idx} className="relative p-5 rounded-xl bg-white border border-gray-200 shadow-xs">
                <div className="text-3xl font-extrabold text-violet-300 mb-2">{s.step}</div>
                <div className="font-semibold text-gray-900 text-base mb-1.5">{s.title}</div>
                <div className="text-xs text-gray-600 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-violet-600 text-white shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Benchmark Your Technical Knowledge?</h2>
          <p className="text-violet-100 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Sign in with your Google account or email in seconds. Start your mock interview round and identify your focus topics.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-violet-700 bg-white hover:bg-violet-50 transition-colors shadow-md"
          >
            <span>Get Started Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

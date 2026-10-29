import React from 'react';
import { Bot, ShieldAlert, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                <Bot className="w-4 h-4 text-sky-400" />
              </div>
              <span className="font-semibold text-slate-200">SmartInterview AI Platform</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Automated Candidate Interview Sentiment Analytics and Technical Competency Evaluation System. Built with Java 21, Spring Boot, MySQL, Python FastAPI, and React.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-slate-200 font-semibold mb-2">Technical Core</div>
            <div>Spring Boot 3 REST API & JPA</div>
            <div>Python FastAPI & NLP Microservice</div>
            <div>MySQL 8 Relational Database & Flyway</div>
            <div>Web Speech API (Synthesis & Recognition)</div>
          </div>

          <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>AI Ethics & Practice Advisory</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Evaluations and text sentiment metrics are AI-assisted practice estimations designed for skill benchmarking. They do not constitute certified hiring decisions or psychological assessments.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-3">
          <div>© {new Date().getFullYear()} SmartInterview Platform. Computer Science Engineering Capstone.</div>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
            <span>for Full-Stack & AI Excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

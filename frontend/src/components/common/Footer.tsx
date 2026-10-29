import React from 'react';
import { Bot, ShieldAlert, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-violet-50/60 border-t border-gray-200 text-gray-600 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">SmartInterview AI Platform</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              Automated Candidate Interview Sentiment Analytics and Technical Competency Evaluation System. Engineered with Java 21, Spring Boot, MySQL, Python FastAPI, and React.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-gray-900 font-semibold mb-2">Technical Core</div>
            <div className="text-gray-600">Spring Boot 3 REST API & JPA</div>
            <div className="text-gray-600">Python FastAPI & NLP Microservice</div>
            <div className="text-gray-600">MySQL 8 Relational Database & Flyway</div>
            <div className="text-gray-600">Interactive Multiple-Choice Round (15–20 MCQs)</div>
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-200 shadow-xs text-xs text-gray-600">
            <div className="flex items-center gap-1.5 text-violet-700 font-semibold mb-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-violet-600" />
              <span>Assessment & Practice Advisory</span>
            </div>
            <p className="text-[11px] leading-relaxed text-gray-500">
              Evaluations, objective MCQ scorings, and sentiment indicators are engineered for technical practice, performance benchmarking, and continuous candidate improvement.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-3">
          <div>© {new Date().getFullYear()} SmartInterview Platform. Computer Science Engineering Project.</div>
          <div className="flex items-center gap-1 text-gray-500">
            <span>Engineered with</span>
            <Heart className="w-3.5 h-3.5 text-violet-600 inline fill-violet-600" />
            <span>in White & Violet SaaS Design</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

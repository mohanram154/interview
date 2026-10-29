import React from 'react';
import { AssessmentSession } from '../../types/assessment';
import { 
  FileText, 
  HelpCircle, 
  Video, 
  Award, 
  CheckCircle2, 
  Lock, 
  Briefcase 
} from 'lucide-react';

interface AssessmentStageStepperProps {
  session?: AssessmentSession | null;
  activeStage?: 'ROLE_SELECTION' | 'RESUME_EVALUATION' | 'MCQ_ASSESSMENT' | 'VIDEO_INTERVIEW' | 'FINAL_REPORT';
  onNavigateStage?: (stage: string) => void;
}

export const AssessmentStageStepper: React.FC<AssessmentStageStepperProps> = ({
  session,
  activeStage = 'RESUME_EVALUATION',
  onNavigateStage
}) => {
  const steps = [
    {
      id: 'ROLE_SELECTION',
      title: '1. Select Role',
      shortTitle: 'Role',
      icon: Briefcase,
      isCompleted: true,
      isUnlocked: true,
      score: null,
      statusLabel: 'Configured'
    },
    {
      id: 'RESUME_EVALUATION',
      title: '2. Resume Round',
      shortTitle: 'Resume',
      icon: FileText,
      isCompleted: session?.resumeStageStatus === 'COMPLETED',
      isUnlocked: true, // Stage 1 is always unlocked for an assessment
      score: session?.resumeScore,
      statusLabel: session?.resumeStageStatus === 'COMPLETED' 
        ? `${session.resumeScore}% Score` 
        : activeStage === 'RESUME_EVALUATION' ? 'Current Round' : 'Accessible'
    },
    {
      id: 'MCQ_ASSESSMENT',
      title: '3. MCQ Assessment',
      shortTitle: 'MCQ Round',
      icon: HelpCircle,
      isCompleted: session?.mcqStageStatus === 'COMPLETED',
      isUnlocked: Boolean(session?.mcqUnlocked),
      score: session?.mcqScore,
      statusLabel: session?.mcqStageStatus === 'COMPLETED'
        ? `${session.mcqScore}% Score`
        : session?.mcqUnlocked
        ? activeStage === 'MCQ_ASSESSMENT' ? 'Current Round' : 'Unlocked'
        : 'Locked (Requires Resume)'
    },
    {
      id: 'VIDEO_INTERVIEW',
      title: '4. AI Video Interview',
      shortTitle: 'Video Round',
      icon: Video,
      isCompleted: session?.videoStageStatus === 'COMPLETED',
      isUnlocked: Boolean(session?.videoUnlocked),
      score: session?.videoScore,
      statusLabel: session?.videoStageStatus === 'COMPLETED'
        ? `${session.videoScore}% Score`
        : session?.videoUnlocked
        ? activeStage === 'VIDEO_INTERVIEW' ? 'Current Round' : 'Unlocked'
        : 'Locked (Requires MCQ)'
    },
    {
      id: 'FINAL_REPORT',
      title: '5. Combined Report',
      shortTitle: 'Final Report',
      icon: Award,
      isCompleted: session?.sessionStatus === 'COMPLETED',
      isUnlocked: Boolean(session?.finalReportUnlocked),
      score: session?.finalCompositeScore,
      statusLabel: session?.finalReportUnlocked
        ? `${session?.finalCompositeScore}% Final`
        : 'Locked (Requires All Rounds)'
    }
  ];

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
            Strict Sequential Assessment Pipeline
          </span>
          <h3 className="text-sm font-bold text-gray-900 mt-1">
            {session?.jobRoleName ? `${session.jobRoleName} • ${session.difficulty} Tier` : 'Candidate Assessment Progression'}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 font-medium">Stage Gating: </span>
          <span className="text-xs font-bold text-gray-800">
            {session?.currentStage === 'COMPLETED' ? 'All 3 Rounds Complete' :
             session?.currentStage === 'VIDEO_INTERVIEW' ? 'Round 3 of 3' :
             session?.currentStage === 'MCQ_ASSESSMENT' ? 'Round 2 of 3' : 'Round 1 of 3'}
          </span>
        </div>
      </div>

      {/* Stepper Progress Bar & Icons */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = activeStage === s.id;
          const canClick = s.isUnlocked && onNavigateStage;

          let badgeStyle = 'bg-gray-100 text-gray-400 border-gray-200';
          if (s.isCompleted) {
            badgeStyle = 'bg-emerald-600 text-white shadow-xs';
          } else if (isActive) {
            badgeStyle = 'bg-violet-600 text-white shadow-md ring-4 ring-violet-100';
          } else if (s.isUnlocked) {
            badgeStyle = 'bg-violet-50 text-violet-700 border border-violet-200';
          }

          return (
            <div 
              key={s.id} 
              className={`flex flex-col items-center text-center transition-all ${
                canClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
              }`}
              onClick={() => canClick && onNavigateStage && onNavigateStage(s.id)}
            >
              {/* Node Icon Circle */}
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold transition-all relative ${badgeStyle}`}>
                {s.isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : !s.isUnlocked ? (
                  <Lock className="w-4 h-4 text-gray-400" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}

                {/* Score Pill Overlay */}
                {s.score != null && (
                  <span className="absolute -top-1.5 -right-2 bg-violet-800 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white">
                    {s.score}%
                  </span>
                )}
              </div>

              {/* Title & Status */}
              <div className="mt-2">
                <div className={`text-xs font-bold leading-tight ${isActive ? 'text-violet-700' : s.isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                  <span className="hidden sm:inline">{s.title}</span>
                  <span className="sm:hidden">{s.shortTitle}</span>
                </div>
                <div className={`text-[10px] mt-0.5 leading-snug font-medium ${
                  s.isCompleted ? 'text-emerald-600 font-semibold' :
                  !s.isUnlocked ? 'text-gray-400' :
                  isActive ? 'text-violet-600 font-semibold' : 'text-gray-500'
                }`}>
                  {s.statusLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

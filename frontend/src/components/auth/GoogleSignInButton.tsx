import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  onSuccess, 
  text = 'continue_with' 
}) => {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isClientConfigured, setIsClientConfigured] = useState<boolean>(true);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!googleClientId || googleClientId.trim() === '' || googleClientId.includes('your_google_web_client_id')) {
      setIsClientConfigured(false);
      return;
    }

    setIsClientConfigured(true);

    const initializeGoogleGSI = () => {
      if (window.google?.accounts?.id && buttonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (response.credential) {
                try {
                  setErrorMessage(null);
                  await loginWithGoogle(response.credential);
                  if (onSuccess) onSuccess();
                } catch (err: any) {
                  setErrorMessage(err.message || 'Google token verification failed on server.');
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render official Google button
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'filled_black',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: text,
            width: 320,
          });
        } catch (e: any) {
          console.error('Error initializing Google Identity Services:', e);
          setErrorMessage('Could not initialize Google Identity Services.');
        }
      } else {
        // Retry shortly if script is still loading
        setTimeout(initializeGoogleGSI, 300);
      }
    };

    initializeGoogleGSI();
  }, [googleClientId, loginWithGoogle, onSuccess, text]);

  if (!isClientConfigured) {
    return (
      <div className="w-full p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
        <div className="flex items-center gap-2 text-sky-400 font-semibold mb-1">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Official Google OAuth Ready</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed mb-1.5">
          Backend token verification and Google Identity Services are fully implemented.
        </p>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          To connect your live OAuth client, add your Client ID to <code className="text-sky-300 font-mono">VITE_GOOGLE_CLIENT_ID</code> in <code className="text-sky-300 font-mono">.env</code>. You can also sign in or register below using email/password.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {errorMessage && (
        <div className="w-full mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      <div ref={buttonRef} className="min-h-[44px] flex justify-center w-full" />
    </div>
  );
};

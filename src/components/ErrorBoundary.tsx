import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      
      // Try to parse Firestore error info if it's JSON
      try {
        if (errorMessage.startsWith('{')) {
          const parsed = JSON.parse(errorMessage);
          if (parsed.error) {
            errorMessage = parsed.error;
          }
        }
      } catch (e) {
        // Ignore parse errors
      }

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-zinc-100">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/20 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <h1 className="text-xl font-bold">Application Error</h1>
            </div>
            <p className="text-zinc-300 mb-4">
              We encountered a problem while running the application.
            </p>
            <div className="bg-zinc-950 p-4 rounded-lg border border-white/5 overflow-auto">
              <code className="text-sm text-red-400 font-mono">
                {errorMessage}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Application Notice</h3>
              <p className="text-xs text-zinc-500 mt-1">
                An unexpected interface issue was recovered. Your data and session remain safe.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <a
                href="/dashboard"
                className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

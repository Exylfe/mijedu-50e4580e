import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
            <span className="text-4xl">🔄</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            Don't worry — your data is safe. Tap below to refresh.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-6 py-3 rounded-full text-sm font-medium text-primary-foreground shadow-lg"
            style={{ background: 'var(--gradient-primary)' }}
          >
            Try Again
          </button>
          {this.state.error && (
            <p className="mt-4 text-xs text-muted-foreground/60 max-w-xs truncate">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

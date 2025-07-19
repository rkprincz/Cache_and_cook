import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can log error to a service here
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-2">An unexpected error occurred. Please try again or contact support.</p>
            <pre className="text-xs text-gray-400 mt-4">{String(this.state.error)}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

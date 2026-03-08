import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#111318] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-[#93000A] rounded-full flex items-center justify-center mb-6">
            <AlertOctagon size={40} className="text-[#FFB4AB]" />
          </div>
          <h1 className="text-3xl font-bold text-[#E3E3E3] mb-4">
            System Error
          </h1>
          <p className="text-[#C4C7C5] max-w-md mb-2">
            An unexpected error occurred. Please try reloading.
          </p>
          <p className="text-[#8E918F] text-sm font-mono max-w-lg mb-8 break-all">
            {this.state.error?.message}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-[#A8C7FA] text-[#062E6F] rounded-full font-bold hover:bg-[#D3E3FD] transition-colors"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

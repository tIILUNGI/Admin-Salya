import React from 'react';
import { AlertTriangle } from 'lucide-react';

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro capturado pelo Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 text-red-600 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Erro Encontrado</h1>
            <p className="text-slate-600 text-center mb-6">
              Desculpe, ocorreu um erro inesperado. A página pode não estar carregada corretamente.
            </p>
            <details className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <summary className="cursor-pointer font-semibold text-slate-700 mb-2">Detalhes do Erro</summary>
              <pre className="text-xs text-slate-600 overflow-auto max-h-40 whitespace-pre-wrap">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

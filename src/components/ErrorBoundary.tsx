import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    console.error('Erro capturado pelo Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = typeof this.state.error === 'object' && this.state.error !== null
        ? (this.state.error.message || JSON.stringify(this.state.error))
        : String(this.state.error || 'Erro desconhecido');

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-rose-100 text-rose-600 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 text-center mb-2">Erro ao carregar página</h1>
            <p className="text-slate-500 text-center text-xs mb-6">
              Ocorreu um erro inesperado no painel. Por favor tente recarregar ou consulte os detalhes abaixo.
            </p>
            <details className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <summary className="cursor-pointer font-semibold text-slate-700 mb-2">Detalhes do Erro</summary>
              <pre className="text-[11px] text-slate-600 overflow-auto max-h-40 whitespace-pre-wrap font-mono">
                {errorMessage}
              </pre>
            </details>
            <button
              onClick={() => {
                localStorage.removeItem('admin_token');
                window.location.href = '/login';
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              Reiniciar Sessão & Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * 라우트/훅 내부의 처리되지 않은 예외로 전체가 하얀 화면이 되는 것을 막습니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[admin]', error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-page" style={{ padding: 24, maxWidth: 560 }}>
          <h1 style={{ fontSize: 20 }}>화면을 불러오지 못했습니다</h1>
          <p className="muted" style={{ lineHeight: 1.5 }}>
            처리되지 않은 오류가 발생했습니다. <strong>API(기본 4000)</strong>가 한 개만 떠 있는지, 터미널에{' '}
            <code>EADDRINUSE</code> 가 없는지 확인한 뒤 새로고침해 주세요.
          </p>
          <pre
            style={{
              overflow: 'auto',
              fontSize: 12,
              padding: 12,
              background: 'var(--panel, #f4f4f5)',
              borderRadius: 8,
            }}
          >
            {this.state.error.message}
          </pre>
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

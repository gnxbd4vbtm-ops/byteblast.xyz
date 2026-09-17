'use client';

import { useEffect, useState } from 'react';

export function SettingsAuth({ initialAuthenticated }: { initialAuthenticated: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuthenticated);
  const [email, setEmail] = useState('admin@byteblast.xyz');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('admin@byteblast.xyz');
  const [resetPassword, setResetPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset');
    if (token) {
      setResetToken(token);
      setShowReset(true);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setResetMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/settings/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? 'Authentication failed.');
        setIsSubmitting(false);
        return;
      }

      setIsAuthenticated(true);
      setPassword('');
    } catch {
      setError('Unable to authenticate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setResetMessage('');
    setIsResetting(true);

    try {
      const response = await fetch('/api/settings/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? 'Unable to send reset email.');
        setIsResetting(false);
        return;
      }

      setResetMessage('A reset link has been sent to the admin email.');
      setResetEmail('admin@byteblast.xyz');
    } catch {
      setError('Unable to send reset email. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setResetMessage('');
    setIsResetting(true);

    try {
      const response = await fetch('/api/settings/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: resetPassword }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? 'Unable to reset password.');
        setIsResetting(false);
        return;
      }

      setResetMessage('Password updated. You can now sign in with the new password.');
      setResetPassword('');
      setResetToken('');
      window.history.replaceState({}, '', '/settings');
      setShowReset(false);
    } catch {
      setError('Unable to reset password. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/settings/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="container section narrow-page">
        <p className="eyebrow">Private access</p>
        <h1>Settings portal</h1>

        {!showReset ? (
          <form className="card auth-card" onSubmit={handleSubmit}>
            <label htmlFor="settings-email">Admin email</label>
            <input
              id="settings-email"
              type="email"
              value={email}
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@byteblast.xyz"
              required
            />

            <label htmlFor="settings-password">Password</label>
            <input
              id="settings-password"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />

            {error ? <p className="form-error">{error}</p> : null}
            {resetMessage ? <p className="form-success">{resetMessage}</p> : null}

            <button className="button primary" type="submit" disabled={isSubmitting || !email.trim() || !password.trim()}>
              {isSubmitting ? 'Authenticating…' : 'Access settings'}
            </button>

            <button className="button secondary" type="button" onClick={() => setShowReset(true)}>
              Forgot password
            </button>
          </form>
        ) : (
          <div className="card auth-card">
            {resetToken ? (
              <form onSubmit={handleResetConfirm}>
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  placeholder="Enter a new password"
                  required
                />
                {error ? <p className="form-error">{error}</p> : null}
                {resetMessage ? <p className="form-success">{resetMessage}</p> : null}
                <button className="button primary" type="submit" disabled={isResetting || !resetPassword.trim()}>
                  {isResetting ? 'Updating…' : 'Update password'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetRequest}>
                <label htmlFor="reset-email">Admin email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  placeholder="admin@byteblast.xyz"
                  required
                />
                {error ? <p className="form-error">{error}</p> : null}
                {resetMessage ? <p className="form-success">{resetMessage}</p> : null}
                <button className="button primary" type="submit" disabled={isResetting || !resetEmail.trim()}>
                  {isResetting ? 'Sending…' : 'Send reset link'}
                </button>
                <button className="button secondary" type="button" onClick={() => setShowReset(false)}>
                  Back to login
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container section narrow-page">
      <p className="eyebrow">Private</p>
      <h1>Private configuration dashboard</h1>

      <div className="card info-card">
        <h2>Session active</h2>
        <p>This area is restricted to authorized access only. Use it for private configuration and maintenance settings.</p>
        <div className="card-actions">
          <button className="button secondary" type="button" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </div>
  );
}

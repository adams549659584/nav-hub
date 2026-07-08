import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { login } from '../utils/api';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      onSuccess();
      onClose();
      setPassword('');
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content glass-card login-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="drawer-header">
          <div className="header-title">
            <Icons.Lock size={18} />
            <span>管理员登录</span>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose}>
            <Icons.X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="glass-input"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <input
            className="glass-input"
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p style={{ color: '#fca5a5', fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" className="glass-btn primary" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
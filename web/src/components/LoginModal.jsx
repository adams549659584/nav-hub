import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { login } from '../utils/api';
import PasswordInput from './PasswordInput';

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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card login-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header login-modal-header">
          <div className="login-header-left">
            <Icons.Lock size={18} className="login-header-icon" />
            <h3>管理员登录</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="关闭" aria-label="关闭">
            <Icons.X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="login-username">用户名</label>
            <input
              id="login-username"
              className="glass-input"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">密码</label>
            <PasswordInput
              id="login-password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="glass-btn cancel-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="glass-btn save-btn" disabled={loading}>
              {loading ? '登录中…' : '登录'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .modal-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: white;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: color 0.2s, transform 0.2s, background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
        }

        .modal-close-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.08);
          transform: rotate(90deg);
        }

        .modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
        }

        .login-error {
          color: #fca5a5;
          font-size: 13px;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 4px;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.08) !important;
        }

        .save-btn {
          background: rgba(59, 130, 246, 0.85) !important;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-modal-content {
          width: 360px;
          max-width: min(360px, calc(100vw - 24px));
          max-height: min(80dvh, calc(100dvh - 24px));
          overflow-y: auto;
        }

        .login-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .login-header-icon {
          color: rgba(255, 255, 255, 0.85);
          flex-shrink: 0;
        }

        .login-modal-header h3 {
          margin: 0;
        }

        .modal-close-btn {
          width: 32px;
          height: 32px;
        }

        @media (max-width: 768px) {
          .modal-overlay {
            padding: 0;
            align-items: stretch;
            justify-content: stretch;
          }

          .login-modal-content.modal-content,
          .modal-content.login-modal-content {
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            max-height: none !important;
            border-radius: 0 !important;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            display: flex;
            flex-direction: column;
          }

          .login-modal-header {
            flex-shrink: 0;
            padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 14px;
            min-height: 52px;
          }

          .login-modal-content .modal-form {
            flex: 1;
            justify-content: center;
            padding: 24px 16px calc(24px + env(safe-area-inset-bottom, 0px));
          }

          .login-modal-content .modal-actions {
            margin-top: 8px;
            padding-top: 0;
          }

          .login-modal-content .modal-actions .glass-btn {
            flex: 1;
            justify-content: center;
            min-height: 44px;
          }
        }


      `}</style>
    </div>
  );
}

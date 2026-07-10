import React, { useState } from 'react';
import * as Icons from 'lucide-react';

/** 带显示/隐藏切换的密码输入框 */
export default function PasswordInput({
  id,
  className = 'glass-input',
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  disabled,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        id={id}
        className={`${className} password-input-field`.trim()}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={visible ? '隐藏密码' : '显示密码'}
        aria-label={visible ? '隐藏密码' : '显示密码'}
      >
        {visible ? <Icons.EyeOff size={15} /> : <Icons.Eye size={15} />}
      </button>
      <style>{`
        .password-input-wrap {
          position: relative;
          display: block;
          width: 100%;
        }

        .password-input-wrap .password-input-field {
          width: 100%;
          padding-right: 38px !important;
          box-sizing: border-box;
        }

        /* 隐藏 Edge/IE 等浏览器自带「显示密码」眼睛，避免与自定义按钮叠成两个 */
        .password-input-wrap .password-input-field::-ms-reveal,
        .password-input-wrap .password-input-field::-ms-clear {
          display: none;
          width: 0;
          height: 0;
        }

        .password-input-wrap .password-input-field::-webkit-credentials-auto-fill-button {
          visibility: hidden;
          pointer-events: none;
          position: absolute;
          right: 0;
        }

        .password-input-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: rgba(255, 255, 255, 0.45);
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
          z-index: 1;
        }

        .password-input-toggle:hover {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}

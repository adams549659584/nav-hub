import React from 'react';
import * as Icons from 'lucide-react';

/**
 * 统一风格的确认弹窗（删除等危险操作）
 */
export default function ConfirmModal({
  isOpen,
  title = '确认操作',
  message,
  confirmText = '删除',
  cancelText = '取消',
  danger = true,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-content glass-card confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            {danger ? (
              <Icons.AlertTriangle
                size={16}
                style={{ marginRight: 8, verticalAlign: '-2px', color: '#fca5a5' }}
              />
            ) : (
              <Icons.HelpCircle
                size={16}
                style={{ marginRight: 8, verticalAlign: '-2px', opacity: 0.8 }}
              />
            )}
            {title}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose} title="关闭">
            <Icons.X size={18} />
          </button>
        </div>

        <div className="confirm-body">
          <p className="confirm-message">{message}</p>
          <div className="modal-actions">
            <button type="button" className="glass-btn cancel-btn" onClick={onClose}>
              {cancelText}
            </button>
            <button
              type="button"
              className={`glass-btn ${danger ? 'danger-btn' : 'save-btn'}`}
              onClick={() => {
                onConfirm?.();
                onClose?.();
              }}
              autoFocus
            >
              {confirmText}
            </button>
          </div>
        </div>

        <style>{`
          .confirm-modal {
            width: 400px;
          }

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
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            transition: color 0.2s, background 0.2s, transform 0.2s;
          }

          .modal-close-btn:hover {
            color: white;
            background: rgba(255, 255, 255, 0.08);
            transform: rotate(90deg);
          }

          .confirm-body {
            padding: 22px 24px 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .confirm-message {
            margin: 0;
            font-size: 13.5px;
            line-height: 1.55;
            color: rgba(255, 255, 255, 0.72);
            white-space: pre-wrap;
          }

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .cancel-btn {
            background: rgba(255, 255, 255, 0.08) !important;
          }

          .save-btn {
            background: rgba(59, 130, 246, 0.85) !important;
          }

          .danger-btn {
            background: rgba(239, 68, 68, 0.85) !important;
            border-color: rgba(239, 68, 68, 0.45) !important;
          }

          .danger-btn:hover {
            background: rgba(239, 68, 68, 0.95) !important;
          }
        `}</style>
      </div>
    </div>
  );
}

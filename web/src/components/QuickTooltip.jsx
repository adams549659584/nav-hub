import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * 即时悬停提示（替代原生 title，避免浏览器 ~1s 延迟）
 *
 * 用法：
 * <QuickTooltip content="关闭">
 *   <button>...</button>
 * </QuickTooltip>
 */
export default function QuickTooltip({
  content,
  children,
  side = 'left', // left | right | top | bottom
  delay = 0,
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tipRef = useRef(null);
  const timerRef = useRef(null);
  const tipId = useId();

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = () => {
    clearTimer();
    if (delay > 0) {
      timerRef.current = setTimeout(() => setVisible(true), delay);
    } else {
      setVisible(true);
    }
  };

  const hide = () => {
    clearTimer();
    setVisible(false);
  };

  useLayoutEffect(() => {
    if (!visible || !triggerRef.current) return;

    const update = () => {
      const el = triggerRef.current;
      const tip = tipRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const tw = tip?.offsetWidth || 0;
      const th = tip?.offsetHeight || 0;
      const gap = 8;
      let top = 0;
      let left = 0;

      switch (side) {
        case 'right':
          top = r.top + r.height / 2 - th / 2;
          left = r.right + gap;
          break;
        case 'top':
          top = r.top - th - gap;
          left = r.left + r.width / 2 - tw / 2;
          break;
        case 'bottom':
          top = r.bottom + gap;
          left = r.left + r.width / 2 - tw / 2;
          break;
        case 'left':
        default:
          top = r.top + r.height / 2 - th / 2;
          left = r.left - tw - gap;
          break;
      }

      // 视口夹紧
      const pad = 6;
      top = Math.max(pad, Math.min(top, window.innerHeight - th - pad));
      left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
      setCoords({ top, left });
    };

    update();
    // 二次测量：tip 挂载后有真实宽高
    requestAnimationFrame(update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [visible, side, content]);

  // 给唯一子元素挂 ref / 事件
  const child = React.Children.only(children);
  const trigger = React.cloneElement(child, {
    ref: (node) => {
      triggerRef.current = node;
      const { ref } = child;
      if (typeof ref === 'function') ref(node);
      else if (ref && typeof ref === 'object') ref.current = node;
    },
    onMouseEnter: (e) => {
      child.props.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e) => {
      child.props.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e) => {
      child.props.onFocus?.(e);
      show();
    },
    onBlur: (e) => {
      child.props.onBlur?.(e);
      hide();
    },
    'aria-describedby': visible && content ? tipId : child.props['aria-describedby'],
  });

  if (!content) return trigger;

  return (
    <>
      {trigger}
      {visible &&
        createPortal(
          <div
            ref={tipRef}
            id={tipId}
            role="tooltip"
            className={`quick-tooltip side-${side}`}
            style={{ top: coords.top, left: coords.left }}
          >
            {content}
            <span className="quick-tooltip-arrow" aria-hidden />
            <style>{`
              .quick-tooltip {
                position: fixed;
                z-index: 400;
                max-width: min(240px, 70vw);
                padding: 6px 10px;
                border-radius: 8px;
                background: rgba(15, 18, 28, 0.94);
                border: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                color: rgba(255, 255, 255, 0.92);
                font-size: 12px;
                font-weight: 500;
                line-height: 1.35;
                white-space: nowrap;
                overflow: visible;
                pointer-events: none;
                animation: quickTipIn 0.1s ease;
              }

              .quick-tooltip-arrow {
                position: absolute;
                width: 8px;
                height: 8px;
                background: rgba(15, 18, 28, 0.94);
                border: 1px solid rgba(255, 255, 255, 0.12);
                transform: rotate(45deg);
                pointer-events: none;
              }

              /* 提示在触发器右侧 → 箭头在左侧指向触发器 */
              .quick-tooltip.side-right .quick-tooltip-arrow {
                left: -5px;
                top: 50%;
                margin-top: -4px;
                border-right: none;
                border-top: none;
              }

              /* 提示在左侧 → 箭头在右侧 */
              .quick-tooltip.side-left .quick-tooltip-arrow {
                right: -5px;
                top: 50%;
                margin-top: -4px;
                border-left: none;
                border-bottom: none;
              }

              /* 提示在上方 → 箭头在底部 */
              .quick-tooltip.side-top .quick-tooltip-arrow {
                bottom: -5px;
                left: 50%;
                margin-left: -4px;
                border-left: none;
                border-top: none;
              }

              /* 提示在下方 → 箭头在顶部 */
              .quick-tooltip.side-bottom .quick-tooltip-arrow {
                top: -5px;
                left: 50%;
                margin-left: -4px;
                border-right: none;
                border-bottom: none;
              }

              @keyframes quickTipIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
          </div>,
          document.body
        )}
    </>
  );
}

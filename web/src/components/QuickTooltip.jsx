import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ARROW = 6;
const GAP = 8;
const PAD = 6;

/**
 * 即时悬停提示（替代原生 title）
 *
 * side:
 * - 'auto'（默认）：按触发器位置自动选边，避免贴边被挤
 * - 'left' | 'right' | 'top' | 'bottom'：强制方向
 */
export default function QuickTooltip({
  content,
  children,
  side = 'auto',
  delay = 0,
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [resolvedSide, setResolvedSide] = useState(
    side === 'auto' ? 'top' : side
  );
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

    const place = (preferred, r, tw, th) => {
      let top = 0;
      let left = 0;
      switch (preferred) {
        case 'right':
          top = r.top + r.height / 2 - th / 2;
          left = r.right + GAP;
          break;
        case 'left':
          top = r.top + r.height / 2 - th / 2;
          left = r.left - tw - GAP;
          break;
        case 'bottom':
          top = r.bottom + GAP;
          left = r.left + r.width / 2 - tw / 2;
          break;
        case 'top':
        default:
          top = r.top - th - GAP;
          left = r.left + r.width / 2 - tw / 2;
          break;
      }
      return { top, left };
    };

    const fits = (preferred, r, tw, th) => {
      const { top, left } = place(preferred, r, tw, th);
      return (
        left >= PAD &&
        top >= PAD &&
        left + tw <= window.innerWidth - PAD &&
        top + th <= window.innerHeight - PAD
      );
    };

    const pickSide = (r, tw, th) => {
      if (side !== 'auto') return side;

      // 贴右缘 → 优先左侧；贴左缘 → 优先右侧；其余上/下
      const spaceRight = window.innerWidth - r.right;
      const spaceLeft = r.left;
      const spaceTop = r.top;
      const spaceBottom = window.innerHeight - r.bottom;

      const order = [];
      if (spaceRight < tw + GAP + 24 || spaceRight < spaceLeft) {
        order.push('left', 'top', 'bottom', 'right');
      } else if (spaceLeft < tw + GAP + 24) {
        order.push('right', 'top', 'bottom', 'left');
      } else if (spaceTop > spaceBottom) {
        order.push('top', 'bottom', 'left', 'right');
      } else {
        order.push('bottom', 'top', 'left', 'right');
      }

      for (const s of order) {
        if (fits(s, r, tw, th)) return s;
      }
      // 都不够：选空间最大的边
      const spaces = [
        ['left', spaceLeft],
        ['right', spaceRight],
        ['top', spaceTop],
        ['bottom', spaceBottom],
      ];
      spaces.sort((a, b) => b[1] - a[1]);
      return spaces[0][0];
    };

    const update = () => {
      const el = triggerRef.current;
      const tip = tipRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const tw = tip?.offsetWidth || 80;
      const th = tip?.offsetHeight || 28;
      const chosen = pickSide(r, tw, th);
      let { top, left } = place(chosen, r, tw, th);

      top = Math.max(PAD, Math.min(top, window.innerHeight - th - PAD));
      left = Math.max(PAD, Math.min(left, window.innerWidth - tw - PAD));

      setResolvedSide(chosen);
      setCoords({ top, left });
    };

    update();
    requestAnimationFrame(update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [visible, side, content]);

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
    'aria-describedby':
      visible && content ? tipId : child.props['aria-describedby'],
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
            className={`quick-tooltip side-${resolvedSide}`}
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

              .quick-tooltip.side-right .quick-tooltip-arrow {
                left: -5px;
                top: 50%;
                margin-top: -4px;
                border-right: none;
                border-top: none;
              }

              .quick-tooltip.side-left .quick-tooltip-arrow {
                right: -5px;
                top: 50%;
                margin-top: -4px;
                border-left: none;
                border-bottom: none;
              }

              .quick-tooltip.side-top .quick-tooltip-arrow {
                bottom: -5px;
                left: 50%;
                margin-left: -4px;
                border-left: none;
                border-top: none;
              }

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

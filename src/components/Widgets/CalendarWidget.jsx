import React, { useState, useEffect } from 'react';
import solarLunar from 'solarlunar';

export default function CalendarWidget({ sizeX = 2, sizeY = 2, isHeader = false }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHoursMinutes = (date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return { hh, mm };
  };

  const formatSeconds = (date) => {
    return String(date.getSeconds()).padStart(2, '0');
  };

  const formatFullDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayOfWeek = dayNames[date.getDay()];
    return `${year}年${month}月${day}日 ${dayOfWeek}`;
  };

  const getLunarDateSimple = (date) => {
    try {
      const lunar = solarLunar.solar2lunar(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      return `${lunar.monthCn}${lunar.dayCn}`;
    } catch (e) {
      return '';
    }
  };

  const { hh, mm } = formatHoursMinutes(time);
  const ss = formatSeconds(time);

  // --- RENDERING HEADER TOP CLOCK ---
  if (isHeader) {
    return (
      <div className="centered-clock-header">
        <div className="clock-display-header">
          <span className="time-hours-header">{hh}</span>
          <span className="time-colon-header">:</span>
          <span className="time-minutes-header">{mm}</span>
          <span className="time-colon-header">:</span>
          <span className="time-seconds-header">{ss}</span>
        </div>
        <div className="date-display-header">
          <span className="date-text-header">{formatFullDate(time)}</span>
          <span className="lunar-text-header">农历 {getLunarDateSimple(time)}</span>
        </div>

        <style>{`
          .centered-clock-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            margin-top: 24px;
            margin-bottom: -16px;
            color: #ffffff;
            text-shadow: 0 4px 16px rgba(0, 0, 0, 0.45), 0 2px 4px rgba(0, 0, 0, 0.2);
            animation: fadeIn 0.4s ease;
            user-select: none;
            z-index: 25;
          }

          .clock-display-header {
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 200; /* Thin modern look */
          }

          .time-hours-header,
          .time-minutes-header,
          .time-seconds-header {
            font-size: 72px;
            line-height: 1;
            letter-spacing: -1px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }

          .time-colon-header {
            font-size: 64px;
            line-height: 1;
            margin: 0 2px;
            opacity: 0.8;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }

          .colon-active {
            opacity: 0.9;
          }

          .colon-inactive {
            opacity: 0.3;
          }

          .date-display-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            font-size: 13.5px;
            font-weight: 400;
            opacity: 0.95;
          }

          .lunar-text-header {
            opacity: 0.65;
            font-size: 12px;
            border-left: 1px solid rgba(255, 255, 255, 0.3);
            padding-left: 8px;
          }
        `}</style>
      </div>
    );
  }

  // --- RENDERING GRID CARD CLOCK (FALLBACK) ---
  
  // 1x1 Mini Clock Card
  if (sizeX === 1 && sizeY === 1) {
    const dayNamesSimple = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = dayNamesSimple[time.getDay()];
    return (
      <div className="calendar-widget-grid size-1x1 glass-card flex-center-col" title={formatFullDate(time)}>
        <span className="clock-1x1">{hh}:{mm}</span>
        <span className="date-1x1">周{weekday} • {time.getDate()}日</span>
        <style>{`
          .clock-1x1 {
            font-size: 14px;
            font-weight: bold;
            font-family: monospace;
          }
          .date-1x1 {
            font-size: 8px;
            color: rgba(255,255,255,0.5);
            margin-top: 2px;
          }
        `}</style>
      </div>
    );
  }

  // 2x1 Horizontal clock badge
  if (sizeX === 2 && sizeY === 1) {
    return (
      <div className="calendar-widget-grid size-2x1 glass-card">
        <div className="clock-main-2x1">
          <span className="time-val-2x1">{hh}:{mm}</span>
          <span className="time-sec-2x1">{seconds}</span>
        </div>
        <div className="date-text-2x1">
          <span>{formatFullDate(time)}</span>
          <span className="lunar-label-2x1">农历 {getLunarDateSimple(time)}</span>
        </div>
        <style>{`
          .calendar-widget-grid.size-2x1 {
            height: 100%;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .clock-main-2x1 {
            display: flex;
            align-items: baseline;
            font-family: monospace;
            color: white;
          }

          .time-val-2x1 {
            font-size: 26px;
            font-weight: 500;
          }

          .time-sec-2x1 {
            font-size: 11px;
            margin-left: 3px;
            opacity: 0.6;
            width: 14px;
          }

          .date-text-2x1 {
            display: flex;
            flex-direction: column;
            text-align: right;
            font-size: 10.5px;
            color: white;
            gap: 2px;
          }

          .lunar-label-2x1 {
            font-size: 9px;
            color: rgba(255,255,255,0.45);
          }
        `}</style>
      </div>
    );
  }

  // 2x2 Square Clock Card
  return (
    <div className="calendar-widget-grid size-2x2 glass-card flex-center-col">
      <div className="clock-dial">
        <span className="clock-time-2x2">{hh}:{mm}</span>
        <span className="clock-sec-2x2">{seconds}</span>
      </div>
      <div className="clock-details-2x2">
        <span className="clock-date-2x2">{formatFullDate(time)}</span>
        <span className="clock-lunar-2x2">农历 {getLunarDateSimple(time)}</span>
      </div>
      <style>{`
        .calendar-widget-grid.size-2x2 {
          height: 100%;
          padding: 16px;
          justify-content: space-between;
        }

        .clock-dial {
          display: flex;
          align-items: baseline;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 200;
          margin-top: 10px;
        }

        .clock-time-2x2 {
          font-size: 42px;
          line-height: 1;
        }

        .clock-sec-2x2 {
          font-size: 13px;
          margin-left: 4px;
          opacity: 0.6;
          font-weight: 400;
          width: 16px;
          text-align: left;
        }

        .clock-details-2x2 {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 100%;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 10px;
          margin-bottom: 4px;
        }

        .clock-date-2x2 {
          font-size: 11.5px;
          font-weight: 500;
          color: white;
        }

        .clock-lunar-2x2 {
          font-size: 10px;
          color: rgba(255,255,255,0.45);
        }
      `}</style>
    </div>
  );
}

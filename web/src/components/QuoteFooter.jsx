import React, { useState } from 'react';

const QUOTES = [
  {
    en: "The only way to do great work is to love what you do.",
    zh: "成就伟大事业的唯一方法就是热爱你的工作。",
    author: "Steve Jobs"
  },
  {
    en: "Strive not to be a success, but rather to be of value.",
    zh: "不要为成功而努力，要为做一个有价值的人而努力。",
    author: "Albert Einstein"
  },
  {
    en: "Stay hungry, stay foolish.",
    zh: "求知若饥，虚心若愚。",
    author: "Whole Earth Catalog"
  },
  {
    en: "Code is like humor. When you have to explain it, it’s bad.",
    zh: "代码就像幽默。当你必须解释它时，它就糟了。",
    author: "Cory House"
  },
  {
    en: "Simplicity is the ultimate sophistication.",
    zh: "简约是极致的复杂。",
    author: "Leonardo da Vinci"
  },
  {
    en: "Talk is cheap. Show me the code.",
    zh: "空谈无益，给我看代码。",
    author: "Linus Torvalds"
  }
];

export default function QuoteFooter() {
  const [index, setIndex] = useState(() => {
    const day = new Date().getDate();
    return day % QUOTES.length;
  });

  const nextQuote = () => {
    setIndex((prev) => (prev + 1) % QUOTES.length);
  };

  const quote = QUOTES[index];

  return (
    <div className="quote-footer-container clickable" onClick={nextQuote} title="点击切换每日一言">
      <p className="quote-en-text">"{quote.en}"</p>
      <p className="quote-zh-text">{quote.zh} — {quote.author}</p>

      <style>{`
        .quote-footer-container {
          margin-top: auto;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #ffffff;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
          text-align: center;
          padding: 10px 24px;
          cursor: pointer;
          user-select: none;
          max-width: 800px;
          align-self: center;
          animation: fadeIn 0.4s ease;
        }

        .quote-en-text {
          font-size: 13.5px;
          font-style: italic;
          font-weight: 300;
          opacity: 0.95;
          line-height: 1.4;
        }

        .quote-zh-text {
          font-size: 12px;
          font-weight: 400;
          opacity: 0.65;
          line-height: 1.4;
        }

        .quote-footer-container:hover .quote-en-text {
          opacity: 1;
        }
        .quote-footer-container:hover .quote-zh-text {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}

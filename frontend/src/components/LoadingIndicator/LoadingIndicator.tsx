import React, { useState, useEffect, useRef } from 'react';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  loadingMessage: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ loadingMessage }) => {
  const [textWidth, setTextWidth] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.offsetWidth);
    }
  }, [loadingMessage]);

  return (
    <div className="progress-container">
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      
      <div className="runner-container" style={{ width: textWidth ? `${textWidth}px` : 'auto' }}>
        <div className="speed-lines">
          <div className="speed-line"></div>
          <div className="speed-line"></div>
          <div className="speed-line"></div>
        </div>
        
        <div className="businessman">
          <div className="head">
            <div className="hair">
              <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
                <path d="M150 40 c-10 -8 -30 -15 -50 -20 c-40 -10 -80 -5 -100 10 c-15 10 -25 25 -20 35 c5 10 20 15 40 20 c30 8 60 5 80 0 c25 -6 45 -15 50 -25 c8 -15 5 -25 0 -20 z" fill="#522F17"/>
                <path d="M140 35 c-8 -5 -25 -8 -40 -10 c-20 -3 -40 0 -50 5 c-8 4 -12 10 -8 15 c4 5 15 8 30 10 c20 3 35 2 45 0 c15 -3 25 -8 28 -12 c5 -8 2 -12 -5 -8 z" fill="#6b3e23"/>
              </svg>
            </div>
          </div>
          <div className="body">
            <div className="shoulder-line"></div>
            <div className="shirt"></div>
            <div className="bow-tie"></div>
            <div className="lapel left"></div>
            <div className="lapel right"></div>
            <div className="arms">
              <div className="arm left">
                <div className="hand"></div>
              </div>
              <div className="arm right">
                <div className="hand"></div>
              </div>
            </div>
          </div>
          <div className="legs">
            <div className="leg left">
              <div className="shoe"></div>
            </div>
            <div className="leg right">
              <div className="shoe"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="progress-text" ref={textRef}>
        {loadingMessage}<span className="loading-dots">...</span>
      </div>
    </div>
  );
};

export default LoadingIndicator;
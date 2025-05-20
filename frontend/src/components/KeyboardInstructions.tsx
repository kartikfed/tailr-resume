import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@chakra-ui/icons';

const PURPLE_BG = '#8f3fff';
const KEY_DARK = '#23213a';
const KEY_TOP = '#2d2950';
const KEY_LABEL = '#e0e6ff';
const KEY_ACCENT = '#ff5c8a';
const INSTRUCTION_COLOR = '#fff';

const keyStyles = {
  boxShadow: '0 4px 16px rgba(30, 0, 60, 0.25)',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  margin: '1rem',
  minWidth: '72px',
  minHeight: '72px',
  background: `linear-gradient(180deg, ${KEY_TOP} 70%, ${KEY_DARK} 100%)`,
  position: 'relative' as const,
};

const labelStyles = {
  color: KEY_LABEL,
  fontWeight: 700,
  fontSize: '2rem',
  letterSpacing: '0.1em',
  textShadow: '0 2px 8px #0008',
  marginBottom: '0.5rem',
};

const spaceLabelStyles = {
  ...labelStyles,
  fontSize: '1.2rem',
  padding: '0 2.5rem',
};

const instructionStyles = {
  color: INSTRUCTION_COLOR,
  fontSize: '1rem',
  marginTop: '0.25rem',
  textAlign: 'center' as const,
  fontWeight: 500,
  opacity: 0.92,
};

const arrowKeyStyles = {
  ...keyStyles,
  minWidth: '56px',
  minHeight: '56px',
  padding: 0,
};

const SMALL_LABEL_STYLE = {
  color: INSTRUCTION_COLOR,
  fontSize: '0.85rem',
  marginTop: '0.25rem',
  textAlign: 'center' as const,
  fontWeight: 500,
  opacity: 0.92,
  minWidth: '70px',
};

const PURPLE_BORDER = '#8f3fff';

const KeyboardInstructions: React.FC = () => {
  const [open, setOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState('0px');

  useEffect(() => {
    if (open && contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight + 'px');
    } else {
      setMaxHeight('0px');
    }
  }, [open]);

  return (
    <div style={{ width: 'auto', background: 'transparent', marginBottom: '0.5rem' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'none',
          border: 'none',
          color: '#e0e6ff',
          fontWeight: 700,
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '0.5rem',
          outline: 'none',
        }}
        aria-expanded={open}
        aria-label="Toggle keyboard shortcuts"
      >
        Keyboard Shortcuts
        <span style={{
          display: 'inline-block',
          transition: 'transform 0.2s',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
          marginLeft: '0.5rem',
        }}>
          <ChevronDownIcon boxSize={5} />
        </span>
      </button>
      <div
        style={{
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s',
          maxHeight,
          opacity: open ? 1 : 0,
        }}
        ref={contentRef}
        aria-hidden={!open}
      >
        <div
          style={{
            width: 'auto',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            transform: 'scale(0.8)',
            transformOrigin: 'top left',
            paddingTop: '0.2rem',
          }}
        >
          {/* Main keys group (R and Space) */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* R Key */}
              <div style={keyStyles as React.CSSProperties}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ marginBottom: 0 }}>
                  <rect x="2" y="2" width="52" height="52" rx="10" fill={KEY_TOP} stroke={PURPLE_BORDER} strokeWidth="2" />
                  <text x="50%" y="60%" textAnchor="middle" fill={KEY_LABEL} fontSize="2.2rem" fontWeight="bold" fontFamily="inherit">R</text>
                </svg>
              </div>
              <span style={SMALL_LABEL_STYLE}>Revise</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Space Key */}
              <div style={{ ...keyStyles, minWidth: '160px', minHeight: '56px', flexDirection: 'column' }}>
                <svg width="140" height="56" viewBox="0 0 140 56" style={{ marginBottom: 0 }}>
                  <rect x="2" y="2" width="136" height="52" rx="12" fill={KEY_TOP} stroke={PURPLE_BORDER} strokeWidth="2" />
                  <text x="50%" y="60%" textAnchor="middle" fill={KEY_LABEL} fontSize="1.6rem" fontWeight="bold" fontFamily="inherit">SPACE</text>
                </svg>
              </div>
              <span style={SMALL_LABEL_STYLE}>Next bullet</span>
            </div>
          </div>
          {/* Arrow keys group (stacked vertically) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', marginLeft: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Up Arrow Key */}
              <div style={arrowKeyStyles as React.CSSProperties}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ marginBottom: 0 }}>
                  <rect x="2" y="2" width="52" height="52" rx="10" fill={KEY_TOP} stroke={PURPLE_BORDER} strokeWidth="2" />
                  <polygon points="28,16 38,32 18,32" fill={KEY_LABEL} />
                </svg>
              </div>
              <span style={SMALL_LABEL_STYLE}>Previous bullet</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Down Arrow Key */}
              <div style={arrowKeyStyles as React.CSSProperties}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ marginBottom: 0 }}>
                  <rect x="2" y="2" width="52" height="52" rx="10" fill={KEY_TOP} stroke={PURPLE_BORDER} strokeWidth="2" />
                  <polygon points="18,24 38,24 28,40" fill={KEY_LABEL} />
                </svg>
              </div>
              <span style={SMALL_LABEL_STYLE}>Next bullet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardInstructions; 
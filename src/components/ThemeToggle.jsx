import React from 'react';
import { useTheme } from '../context/ThemeContext';
import lightMode from '/light-mode.png';
import darkMode from '/dark-mode.png';
const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            style={{
                width: 40, height: 40,
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--txt-1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                flexShrink: 0,
            }}
            onMouseEnter={e => {

                e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {

                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            {isDark ? <img style={{ width: 20, height: 20 }} src={lightMode} alt="light mode" /> : <img style={{ width: 20, height: 20 }} src={darkMode} alt="dark mode" />}
        </button>
    );
};

export default ThemeToggle;

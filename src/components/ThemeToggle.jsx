import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';
import lightMode from '/light-mode.png';
import darkMode from '/dark-mode.png';
import nightMode from '/night-mode.png';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const isDark = theme === 'dark';
    const isHomePage = location.pathname === '/';

    return (
        <button
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'light' : (isHomePage ? 'dark' : 'night')} mode`}
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
            {isDark ? (
                <img style={{ width: 20, height: 20 }} src={lightMode} alt="light mode" />
            ) : (
                <img 
                    style={{ width: 20, height: 20 }} 
                    src={isHomePage ? darkMode : nightMode} 
                    alt={isHomePage ? "dark mode" : "night mode"} 
                />
            )}
        </button>
    );
};

export default ThemeToggle;

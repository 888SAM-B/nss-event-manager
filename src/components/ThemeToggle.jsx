import React from 'react';
import { useTheme } from '../context/ThemeContext';
import lightModeIcon from '/light-mode.png';
import darkModeIcon from '/night-mode.png';


const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="btn btn-secondary theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
            }}
        >
            {theme === 'dark' ? (
                <img src={lightModeIcon} alt="Light Mode" style={{ width: '24px', height: '24px' }} />
            ) : (
                <img src={darkModeIcon} alt="Dark Mode" style={{ width: '24px', height: '24px' }} />
            )}
        </button>
    );
};

export default ThemeToggle;

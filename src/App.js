import React, { useState } from 'react';
import './App.css';
import Chatbot from './Chatbot';

function App() {
    const [darkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    return (
        <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
            <header className="App-header">
                <h1 className='main-heading'>AI Chatbot Application</h1>
                <button onClick={toggleDarkMode} className="toggle-button">
                    {darkMode ? <img src='/lightmode.jpg' alt='lightmode'/> : <img src='/darkmode.jpg' alt='darkmode' />}
                </button>
            </header>
            <main className="App-main">
                <Chatbot />
            </main>
        </div>
    );
}

export default App;
import React from 'react';
import './App.css';
import SetApiKey from './SetApiKey';
import Chatbot from './Chatbot';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>AI Chatbot Application</h1>
            </header>
            <main className="App-main">
                <Chatbot />
                <SetApiKey />
            </main>
        </div>
    );
}

export default App;

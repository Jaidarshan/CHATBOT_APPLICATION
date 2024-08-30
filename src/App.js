import React from 'react';
import './App.css';
import Chatbot from './Chatbot'; // No need to import SetApiKey separately

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>AI Chatbot Application</h1>
            </header>
            <main className="App-main">
                <Chatbot />
            </main>
        </div>
    );
}

export default App;

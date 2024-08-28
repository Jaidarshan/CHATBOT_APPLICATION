import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const Chatbot = () => {
    const [prompt, setPrompt] = useState('');
    const [conversation, setConversation] = useState([]);
    const [error, setError] = useState('');

    const handleInputChange = (event) => {
        setPrompt(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }

        try {
            setConversation(prev => [...prev, { type: 'user', text: prompt }]);
            const res = await axios.post('http://localhost:5000/api/chat', { prompt });
            const responseText = res.data.response;
            setConversation(prev => [...prev, { type: 'bot', text: responseText }]);
            setPrompt('');
        } catch (err) {
            setError(err.response ? err.response.data.error : 'Error sending prompt');
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-history">
                {conversation.map((entry, index) => (
                    <div key={index} className={`chat-entry ${entry.type}`}>
                        <strong>{entry.type === 'user' ? 'You' : 'Bot'}:</strong>
                        <div className="chat-message">
                            {entry.type === 'bot' ? (
                                <ReactMarkdown>{entry.text}</ReactMarkdown>
                            ) : (
                                <p>{entry.text}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <textarea
                    placeholder="Enter your prompt here..."
                    value={prompt}
                    onChange={handleInputChange}
                    className="chat-input"
                />
                <button type="submit" className="send-button">Send</button>
            </form>

            {error && <p className="error-message"><strong>Error:</strong> {error}</p>}
        </div>
    );
};

export default Chatbot;

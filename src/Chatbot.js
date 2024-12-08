import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import SetApiKey from './SetApiKey'; // Import the SetApiKey component

const Chatbot = () => {
    const [prompt, setPrompt] = useState('');
    const [conversation, setConversation] = useState([]);
    const [error, setError] = useState('');
    const [showScrollButton, setShowScrollButton] = useState(false);

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
            
        } catch (err) {
            setError(err.response ? err.response.data.error : 'Error sending prompt');
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevents the default newline character from being inserted
            handleSubmit(event); // Calls the submit function
            setPrompt('');
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const chatHistory = document.querySelector('.chat-history');
            const scrollThreshold = chatHistory.scrollHeight - chatHistory.clientHeight - 50; // Adjust based on your needs
            if (chatHistory.scrollTop < scrollThreshold) {
                setShowScrollButton(true);
            } else {
                setShowScrollButton(false);
            }
        };

        const chatHistory = document.querySelector('.chat-history');
        chatHistory.addEventListener('scroll', handleScroll);

        return () => {
            chatHistory.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const scrollToBottom = () => {
        const chatHistory = document.querySelector('.chat-history');
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    return (
        <div className="chat-container">
            <div className="chat-history">
                {conversation.length === 0 ? (
                    <div className="chat-placeholder">
                        <p>Welcome! Start the conversation by typing your question in the box below.</p>
                    </div>
                ) : (
                    conversation.map((entry, index) => (
                        <div key={index} className={`chat-entry ${entry.type}`}>
                            <div className="chat-message">
                                {entry.type === 'bot' ? (
                                    <ReactMarkdown>{entry.text}</ReactMarkdown>
                                ) : (
                                    <p>{entry.text}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showScrollButton && (
                <button className="scroll-down-button" onClick={scrollToBottom}>
                    ↓
                </button>
            )}

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <SetApiKey /> 
                <textarea
                    placeholder="Enter your prompt here..."
                    value={prompt}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="chat-input"
                />
                <button type="submit" className="send-button">
                    <img src="/send_icon_white.png" alt="Send" className="send-icon" />
                </button>
            </form>

            {error && <p className="error-message"><strong>Error:</strong> {error}</p>}
        </div>
    );
};

export default Chatbot;

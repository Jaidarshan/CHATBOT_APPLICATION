import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import SetApiKey from './SetApiKey';

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
            const response = res.data;

            if (response.image_url) {
                setConversation(prev => [...prev, { type: 'bot', imageUrl: response.image_url }]);
            } else {
                setConversation(prev => [...prev, { type: 'bot', text: response.response }]);
            }

        } catch (err) {
            setError(err.response ? err.response.data.error : 'Error sending prompt');
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
            setPrompt('');
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const chatHistory = document.querySelector('.chat-history');
            if (chatHistory.scrollTop < chatHistory.scrollHeight - chatHistory.clientHeight - 50) {
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
                                    entry.imageUrl ? (
                                        <div className="image-container">
                                            <img src={entry.imageUrl} alt="A generated illustration" className="generated-image" />
                                        </div>

                                    ) : (
                                        <ReactMarkdown>{entry.text}</ReactMarkdown>
                                    )
                                ) : (
                                    <p>{entry.text}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}

                <button
                    className={`scroll-down-button ${showScrollButton ? 'visible' : ''}`}
                    onClick={scrollToBottom}
                >
                    <img src='/downarraowicon.jpg' alt='Scroll down' width='24px' />
                </button>
            </div>

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
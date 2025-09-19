import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import SetApiKey from './SetApiKey';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

function formatAsTextLine(line) {
  const trimmed = line.trim();

  if (/^#{1,6}\s/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.length > 0 && trimmed.length < 40 && !trimmed.endsWith(':')) {
    return `### ${trimmed}`;
  }

  if (trimmed.endsWith(':') && trimmed.length > 1) {
    const headingText = trimmed.slice(0, -1);
    return `#### ${headingText}`;
  }

  if (/^[-*+]\s+/.test(trimmed)) {
    return '- ' + trimmed.replace(/^[-*+]\s+/, '');
  }
  if (/^\d+\.\s+/.test(trimmed)) {
    return '- ' + trimmed.replace(/^\d+\.\s+/, '');
  }

  return trimmed;
}

function formatResponse(text) {
  const lines = text.split('\n');
  let inFence = false;
  const processed = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      processed.push(line); 
    } else if (inFence) {
      processed.push(line);
    } else {
      processed.push(formatAsTextLine(line));
    }
  }

  if (inFence) {
    processed.push('```');
  }

  return processed.join('\n\n');
}

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      console.log('Code copied to clipboard!');
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="code-block-container">
      <button className="copy-button" onClick={handleCopy}>
        {copied ? (
          <>
            <img src="/copied.jpg" alt="copied" width="20px" /> Copied
          </>
        ) : (
          <>
            <img src="/copy.jpg" alt="copy" width="20px" /> Copy
          </>
        )}
      </button>
      <SyntaxHighlighter
        style={tomorrow}
        language={match ? match[1] : ''}
        PreTag="div"
        customStyle={{ lineHeight: '1.2', margin: 0 }}
        {...props}
      >
        {codeText}
      </SyntaxHighlighter>
    </div>
  );
};

const Chatbot = ({ darkMode }) => {
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);

  const speakText = (text) => {
    if (currentlySpeaking === text) {
      window.speechSynthesis.cancel();
      setCurrentlySpeaking(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setCurrentlySpeaking(null);
      };
      window.speechSynthesis.speak(utterance);
      setCurrentlySpeaking(text);
    }
  };

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
      const additionalInstruction =
        'Use Markdown headings for each section and if your response have code surround your code in triple backticks. ';
      const modifiedPrompt = `${prompt}\n\n${additionalInstruction}`;

      const updatedConversation = [...conversation, { type: 'user', text: prompt }];
      setConversation(updatedConversation);

      const res = await axios.post('http://localhost:5000/api/chat', { 
        prompt: modifiedPrompt,
        history: conversation 
      });
      
      const response = res.data;

      if (response.image_url) {
        setConversation((prev) => [
          ...prev,
          { type: 'bot', imageUrl: response.image_url },
        ]);
      } else {
        setConversation((prev) => [
          ...prev,
          { type: 'bot', text: response.response },
        ]);
      }
    } catch (err) {
      setError(err.response ? err.response.data.error : 'Error sending prompt');
      setConversation(prev => prev.slice(0, -1)); 
    } finally {
      setPrompt('');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleImageClick = (imageUrl) => {
    setModalImage(imageUrl);
  };

  const closeModal = () => {
    setModalImage(null);
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
            <p>
              Welcome! Start the conversation by typing your question in the box below.
              <br />
              You can also generate images by starting your prompt with "generate image of ..."
            </p>
          </div>
        ) : (
          conversation.map((entry, index) => (
            <div key={index} className={`chat-entry ${entry.type}`}>
              <div className="chat-message">
                {entry.type === 'bot' ? (
                  entry.imageUrl ? (
                    <div className="image-container">
                      <img
                        src={entry.imageUrl}
                        alt="Generated illustration"
                        className="generated-image"
                        onClick={() => handleImageClick(entry.imageUrl)}
                      />
                      <a
                        href={entry.imageUrl}
                        download="generated_image.jpg"
                        className="download-link"
                      >
                        <img src="/download.jpg" alt="download button" width="24px" />
                      </a>
                    </div>
                  ) : (
                    <div>
                      <ReactMarkdown components={{ code: CodeBlock }}>
                        {formatResponse(entry.text)}
                      </ReactMarkdown>
                      <button
                        className="speak-button"
                        style={{ marginTop: '10px' }}
                        onClick={() => speakText(entry.text)}
                      >
                        {currentlySpeaking === entry.text ?
                          <img src={darkMode ? '/stopwhite.jpg' : '/stopblack.jpg'} alt='stop' width='25px' />
                          :
                          <img src={darkMode ? '/texttospeechwhite.jpg' : '/texttospeechblack.jpg'} alt='speak' width='20px' />
                        }
                      </button>
                    </div>
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
          <img
            src={darkMode ? '/downarrowwhite.jpg' : '/downarraowicon.jpg'}
            alt="Scroll down"
            width="24px"
          />
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

      {error && (
        <p className="error-message">
          <strong>Error:</strong> {error}
        </p>
      )}

      {modalImage && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeModal}>X</button>
            <img src={modalImage} alt="Full view" className="full-image" />
            <a href={modalImage} download="generated_image.jpg" className="download-button">
              <img src="/download.jpg" alt="download button" width="32px" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

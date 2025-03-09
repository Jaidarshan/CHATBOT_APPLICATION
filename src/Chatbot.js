// Chatbot.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import SetApiKey from './SetApiKey';

/**
 * Formats a single line of normal text (outside code fences) into headings, bullets, etc.
 * (Optional – you can remove heading detection if you like.)
 */
function formatAsTextLine(line) {
  const trimmed = line.trim();

  // If line starts with '#' => treat it as a heading
  if (/^#{1,6}\s/.test(trimmed)) {
    return trimmed;
  }

  // Short lines => H3 heading
  if (trimmed.length > 0 && trimmed.length < 40 && !trimmed.endsWith(':')) {
    return `### ${trimmed}`;
  }

  // Lines ending with ':' => subheading (H4)
  if (trimmed.endsWith(':') && trimmed.length > 1) {
    const headingText = trimmed.slice(0, -1);
    return `#### ${headingText}`;
  }

  // Bullet points
  if (/^[-*+]\s+/.test(trimmed)) {
    return '- ' + trimmed.replace(/^[-*+]\s+/, '');
  }
  if (/^\d+\.\s+/.test(trimmed)) {
    return '- ' + trimmed.replace(/^\d+\.\s+/, '');
  }

  // Otherwise, return line as-is
  return trimmed;
}

/**
 * If the text includes triple backticks, parse them literally as code fences.
 * Outside code fences, apply heading/bullet formatting.
 * If there are no triple backticks at all, treat everything as normal text.
 */
function formatResponse(text) {
  const lines = text.split('\n');
  let inFence = false;
  const processed = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Toggle code fence if we see ```
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      processed.push(line); // Keep the fence line exactly
    } else if (inFence) {
      // Inside code fence, keep lines verbatim
      processed.push(line);
    } else {
      // Outside code fence, apply heading/bullet formatting
      processed.push(formatAsTextLine(line));
    }
  }

  // If we ended in a fence (missing closing ```), close it
  if (inFence) {
    processed.push('```');
  }

  // Join with double newlines so ReactMarkdown interprets paragraphs/lists
  return processed.join('\n\n');
}

/**
 * Custom code block renderer that shows a "Copy" button for multi‐line code blocks.
 * Inline code (e.g., `variable`) will NOT display the button.
 */
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  // For inline code (single backticks), just render normally
  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // For multi-line code blocks (triple backticks)
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      console.log('Code copied to clipboard!');
      // Optionally, show a toast or alert here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="code-block-container">
      <button className="copy-button" onClick={handleCopy}>
        Copy
      </button>
      <pre className={className} {...props}>
        <code>{children}</code>
      </pre>
    </div>
  );
};

const Chatbot = ({ darkMode }) => {
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [modalImage, setModalImage] = useState(null);

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
      // Append the additional instruction to the user's prompt.
      const modifiedPrompt = `${prompt}\n\n Use Markdown headings for each section and surround your code in triple backticks.`;
  
      // Add user's message to the conversation (you can show the original prompt)
      setConversation((prev) => [...prev, { type: 'user', text: prompt }]);
  
      // Send the modified prompt to your backend
      const res = await axios.post('http://localhost:5000/api/chat', { prompt: modifiedPrompt });
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
      if (
        chatHistory.scrollTop <
        chatHistory.scrollHeight - chatHistory.clientHeight - 50
      ) {
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
              Welcome! Start the conversation by typing your question in the box
              below.<br />
              You can also generate images by starting your prompt with
              "generate image of ..."
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
                        <img
                          src="/download.jpg"
                          alt="download button"
                          width="24px"
                        />
                      </a>
                    </div>
                  ) : (
                    // Render text with ReactMarkdown + code copy button
                    <ReactMarkdown
                      components={{
                        code: CodeBlock, // Our custom code renderer
                      }}
                    >
                      {formatResponse(entry.text)}
                    </ReactMarkdown>
                  )
                ) : (
                  // If it's the user's message
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
            <button className="close-button" onClick={closeModal}>
              X
            </button>
            <img src={modalImage} alt="Full view" className="full-image" />
            <a
              href={modalImage}
              download="generated_image.jpg"
              className="download-button"
            >
              <img
                src="/download.jpg"
                alt="download button"
                width="32px"
              />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;

// Chatbot.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import SetApiKey from './SetApiKey';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
 * Custom code block renderer that shows a "Copy" button for multi‑line code blocks.
 * Inline code (e.g. `variable`) will NOT display the button.
 */
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const codeText = String(children).replace(/\n$/, '');
  // Extract language from className (e.g., language-js)
  const match = /language-(\w+)/.exec(className || '');

  // For inline code, render normally
  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  // Multi-line code block: show syntax highlighting and Copy button
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      console.log('Code copied to clipboard!');
      // Optionally, display a toast notification here.
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="code-block-container">
      <button className="copy-button" onClick={handleCopy}>Copy</button>
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
      // Append additional instruction so Gemini returns Markdown formatted text.
      const additionalInstruction = "Use Markdown headings for each section and if your response have code surround your code in triple backticks. ";
      const modifiedPrompt = `${prompt}\n\n${additionalInstruction}`;

      // Show the user's original prompt in the conversation.
      setConversation((prev) => [...prev, { type: 'user', text: prompt }]);

      // Send the modified prompt to your Flask backend.
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
                    <ReactMarkdown components={{ code: CodeBlock }}>
                      {formatResponse(entry.text)}
                    </ReactMarkdown>
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

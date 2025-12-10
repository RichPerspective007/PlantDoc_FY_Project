import React, { useState, useRef, useEffect } from 'react';
import './PlantDoc.css';

export default function PlantDocChatbot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m PlantDoc 🌿. Upload a photo of your plant or use voice to describe the issue, and I\'ll help diagnose any problems!' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10
    }));
    setParticles(newParticles);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target.result;
      
      setMessages(prev => [...prev, {
        role: 'user',
        content: 'Image uploaded',
        image: imageData
      }]);

      setIsLoading(true);
      
      try {
        const base64Data = imageData.split(',')[1];
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: file.type,
                      data: base64Data
                    }
                  },
                  {
                    type: "text",
                    text: "You are PlantDoc, a plant disease diagnosis expert. Analyze this plant image and provide: 1) Plant identification if possible, 2) Any visible diseases or issues, 3) Recommended treatment. Be concise and helpful."
                  }
                ]
              }
            ]
          })
        });

        const data = await response.json();
        const assistantMessage = data.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n');

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: assistantMessage
        }]);
      } catch (error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I had trouble analyzing that image. Please try again.'
        }]);
      }
      
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const toggleVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;// sppechhhh dekhbi 
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are PlantDoc, a friendly plant disease diagnosis expert. The user says: "${userMessage}". Provide helpful advice about plant care, diseases, or issues. Be concise and practical.`
            }
          ]
        })
      });

      const data = await response.json();
      const assistantMessage = data.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }

    setIsLoading(false);
  };

  return (
    <div className="plantdoc-container">
      {/* Animated Background Particles */}
      <div className="particles-container">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          >
            🍃
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <div className="logo-glow"></div>
              <div className="logo">✨</div>
            </div>
            <div className="header-text">
              <h1 className="title">PlantDoc</h1>
              <p className="subtitle">
                <span className="status-dot"></span>
                Your AI Plant Health Assistant
              </p>
            </div>
          </div>
          <div className="status-badge">
            🌱 Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-wrapper ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
              {msg.image && (
                <div className="image-container">
                  <img src={msg.image} alt="Uploaded plant" className="uploaded-image" />
                  <div className="image-overlay"></div>
                </div>
              )}
              <p className="message-text">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper assistant-message">
            <div className="message assistant">
              <div className="loading-container">
                <div className="spinner"></div>
                <div className="loading-dots">
                  <div className="dot" style={{animationDelay: '0s'}}></div>
                  <div className="dot" style={{animationDelay: '0.2s'}}></div>
                  <div className="dot" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-container">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="file-input"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="icon-button camera-button"
            title="Upload plant image"
          >
            📷
          </button>

          <button
            onClick={toggleVoiceRecognition}
            disabled={isLoading}
            className={`icon-button mic-button ${isRecording ? 'recording' : ''}`}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            🎤
          </button>

          <div className="text-input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your plant issue..."
              disabled={isLoading}
              className="text-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="send-button"
              title="Send message"
            >
              ➤
            </button>
          </div>
        </div>
        
        <div className="footer-text">
          
          
        </div>
      </div>
    </div>
  );
}
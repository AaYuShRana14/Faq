import React, { useState, useEffect } from 'react';
import './FaqList.css';
const FaqPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaqs();
  }, [language]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/faqs?lang=${language}`);
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      const data = await response.json();
      setFaqs(data);
      setError('');
    } catch (err) {
      setError('Failed to load FAQs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <select 
          value={language} 
          onChange={handleLanguageChange}
          className="language-selector"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="bn">Bengali</option>
        </select>
      </div>

      {loading && (
        <div className="loading-message">Loading FAQs...</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.id} className="faq-item">
            <summary className="faq-question">
              {faq.question}
            </summary>
            <div className="faq-answer">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>

      {!loading && !error && faqs.length === 0 && (
        <div className="no-faqs-message">
          No FAQs available in this language.
        </div>
      )}
    </div>
  );
};

export default FaqPage;
import React, { useState, useEffect } from 'react';
import '../../components/Styles/Faqs.css';
import Axios from 'axios';

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [faq, setFaq] = useState([]);

  useEffect(() => {
    fetchFAQ();
  }, []);

  const fetchFAQ = () => {
    Axios.get('http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/faq')
      .then((response) => {
        setFaq(response.data);
      })
      .catch((error) => {
        console.error('Error fetching FAQ data:', error);
      });
  };

  const toggleActiveIndex = (index) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <div className="faq-container">
      <h1 className="greenify">
        <span className="green">Green</span>
        <span className="ify">iFy</span>
      </h1>
      <h2 className="faq-text">Frequently Asked Questions</h2>
      <div className="faq-list">
      <div>
      
    </div>

    <div>
    {faq.map((item, index) => (
          <div className="faq-item" key={item.id}>
            <div className="faq-question" onClick={() => toggleActiveIndex(index)}>
              <span className="faq-question-text">{item.question}</span>
              <span className="faq-toggle">{activeIndex === index ? '-' : '+'}</span>
            </div>
            <div className={`faq-answer ${activeIndex === index ? 'active' : ''}`}>
              <p className="faq-answer-text">{item.answer}</p>
            </div>
          </div>
        ))}
        </div>
        
      </div>
    </div>
  );
};

export default FAQ;
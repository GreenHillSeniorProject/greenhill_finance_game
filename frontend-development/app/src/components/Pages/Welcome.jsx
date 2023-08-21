import React from 'react';
import '../../components/Styles/Welcome.css';
import cciLogo from './images/du_cci_logo.png';
import ghillLogo from './images/ghill_log.png';
import { Link } from 'react-router-dom';
import Footer from './Footer';



const Welcome = () => {
  return (
    <div className="welcome-container">
      <h1 className="greenify">
        <span className="green">Green</span>
        <span className="ify">iFy</span>
      </h1>
      <h2 className="welcome-text">Welcome!</h2>
      <div className="buttons-container">
      <Link to="/signup" className="welcome-button">Register &rarr;</Link>
      <Link to="/signin" className="welcome-button">Sign in &rarr;</Link>
      <Link to="/faq" className="welcome-button">Learn more &rarr;</Link>
      </div>
      <p className="presented-by">
        <span className="green">Presented</span>
        <span className="ify"> By</span>
      </p>
      <div className="images-container">
        <img src={cciLogo} alt="cci" className="image" />
        <img src={ghillLogo} alt="ghill" className="image" />
      </div>
    </div>
  );
};

export default Welcome;

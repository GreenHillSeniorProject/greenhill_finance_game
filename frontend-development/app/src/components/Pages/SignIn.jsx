import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import '../../components/Styles/SignIn.css';
import cciLogo from './images/du_cci_logo.png';
import ghillLogo from './images/ghill_log.png';
import Axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignIn = () => {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const login = async () => {
    try {
      const response = await Axios.post('http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/signin', {email: email, password: password});
      localStorage.setItem('token', response.data.token);
      navigate(`/homepage`);
    } catch (error) {
      console.error('Error signing in: ', error);
    }
/*       .then((res) => res.data)
      .then((obj) => navigate(`/homepage/${obj.token}`))
      .catch((error) => {
        console.error('Error logging in:', error);
        setErrorMessage('Invalid email or password');
      }); */
  };

  return (
    <div className="signin-container">
      <h1 className="greenify">
        <span className="green">Green</span>
        <span className="ify">iFy</span>
      </h1>
      <h2 className="signin-text">Sign In</h2>
      <form className="signin-form">
        <div className="input-container">
          <input type="email" placeholder="Corporate Email" className="form-input" onChange={(e) => {setEmail(e.target.value)}}/>
          <div className="info-icon">&#9432;</div>
        </div>
        <div className="input-container">
          <input
            type={passwordVisible ? 'text' : 'password'}
            placeholder="Password"
            className="form-input"
            onChange={(e) => {setPassword(e.target.value)}}
          />
          <div className="eye-icon" onClick={togglePasswordVisibility}>
            {passwordVisible ? <FiEyeOff /> : <FiEye />}
          </div>
        </div>
        <div className="remember-me-container">
          <input type="checkbox" id="remember-me" className="remember-me-checkbox" />
          <label htmlFor="remember-me" className="remember-me-label">Remember me</label>
          <span className="forgot-password">Forgot password?</span>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </form>
      <button className="login-button" onClick={login}>Login</button>
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

export default SignIn;

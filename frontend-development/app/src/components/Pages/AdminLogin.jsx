import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/AdminLogin.css';
import { Icon } from 'react-icons-kit'
import { eyeOff } from 'react-icons-kit/feather/eyeOff'
import { eye } from 'react-icons-kit/feather/eye'

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Fetch logic here
    // The following is placeholder logic
    const response = await fetch('http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      // Handle successful login here
      navigate('/admin-home');
    } else {
      setError('Wrong email or password');
      setPassword('');
    }
  };

  return (
    <div className="form-container">
      <div className="admin-login">
        <div className="form-content">
          <h1 className="form-title">Admin Login</h1>
          <div className="form">
            <form onSubmit={handleSubmit}>
              <input 
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />

              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button">
                  <span onClick={togglePasswordVisibility}>
                    {showPassword ? <Icon icon={eyeOff} size={20}/> : <Icon icon={eye} size={20}/>}
                  </span>
                </button>
              </div>
            </form>
          </div>
          <div className="checkbox-container">
              <input 
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={toggleRememberMe}
              />
              <label htmlFor="remember-me">Remember Me</label>
              {/* Add functionality to this link */}
          </div>
          <div className="forgot-password-link">
            <a className="forgot-password-link" href="/forgot-password">Forgot Password?</a>
          </div>
            {error && <p className="error">{error}</p>}
            <button type="submit">Login</button>
          </div>    
        </div>
      </div>
  );
};

export default AdminLogin;

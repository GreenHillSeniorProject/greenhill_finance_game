import React, { useState } from 'react';
import Icon from 'react-icons-kit';
import { eyeOff } from 'react-icons-kit/feather/eyeOff'
import { eye } from 'react-icons-kit/feather/eye'
import '../Styles/AdminRegistration.css';

const AdminRegistration = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1'); // default country code
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Fetch logic here
    // The following is placeholder logic
    const response = await fetch('http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, phone }),
    });

    if (response.ok) {
      setMessage('Admin registered');
      setMessageColor('green');
    } else {
      setMessage('Registration failed');
      setMessageColor('red');
    }
  };

  return (
    <div className="admin-registration">
      <div className="admin-registration-box">
        <div className="admin-registration-text">
          <h1>Admin Registration</h1>
          <p>Register an account for an admin.</p>
        </div>
        <div className="admin-registration-form">
          <form onSubmit={handleSubmit}>
          <div className="register-names">
            <div className="first-name-container">
              <input 
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div className="last-name-container">
              <input 
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="email-container">
            <input 
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="password-container">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="password-button" type="button" onClick={togglePasswordVisibility}>
              {/* replace the following with an icon */}
              {showPassword ? <Icon icon={eyeOff} size={20}/> : <Icon icon={eye} size={20}/>}
            </button>
          </div>
          <div className="phone-container">
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)}>
              {/* Populate this with your list of country codes */}
              <option value="+1">+1</option>
              <option value="+44">+44</option>
            </select>
              <input 
                name="phone"
                type="text"
                placeholder="Phone Number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
          </div>
          {message && <p className={`message ${messageColor}`}>{message}</p>}
          <button type="submit">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminRegistration;

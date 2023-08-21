import React, { useState } from 'react';
import Icon from 'react-icons-kit';
import { eyeOff } from 'react-icons-kit/feather/eyeOff'
import { eye } from 'react-icons-kit/feather/eye'
import '../Styles/AdminEdit.css';

const AdminEdit = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
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
    const response = await fetch('http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, firstName, lastName, phone }),
    });

    if (response.ok) {
      setMessage('Changes Saved');
      setMessageColor('green');
    } else {
      setMessage('Saving Failed');
      setMessageColor('red');
    }
  };

  return (
    <div className="admin-edit">
      <div className="admin-edit-box">
        <div className="admin-edit-text">
          <h1>Edit Admin Account</h1>
          <p>Edit your account information.</p>
        </div>
        <div className="admin-edit-form">
          <form onSubmit={handleSubmit}>
          <div className="names-container">
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
          <button type="submit">Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminEdit;

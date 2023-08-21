import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import '../../components/Styles/SignUp.css';
import { useMutation } from 'react-query';
import Axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [firstnameSignUp, setFirstNameSignUp] = useState('');
  const [lastnameSignUp, setLastNameSignUp] = useState('');
  const [usernameSignUp, setUsernameSignUp] = useState('');
  const [invitationcodeSignUp, setInvitationCodeSignUp] = useState('');
  const [emailSignUp, setEmailSignUp] = useState('');
  const [phonenumberSignUp, setPhoneNumberSignUp] = useState('');
  const [passwordSignUp, setPasswordSignUp] = useState('');
  const [requiredFieldsFilled, setRequiredFieldsFilled] = useState(true); // State variable for required fields
  const navigate = useNavigate(); // Get the history object

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const { mutate: signUpMutation } = useMutation(
    (data) => Axios.post('http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/signup', data),
    {
      
      onSuccess: (response) => {
        console.log(response);
        /* // Store the token in local storage
        localStorage.setItem('token', response.data.token);
  
        // Redirect to personalized page
        // Properly URL-encode the token before navigating
        const encodedToken = encodeURIComponent(response.data.token);
        navigate(`/homepage/${encodedToken}`); */
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if any required field is empty
    if (
      !firstnameSignUp ||
      !lastnameSignUp ||
      !usernameSignUp ||
      !emailSignUp ||
      !passwordSignUp
    ) {
      setRequiredFieldsFilled(false); // Set requiredFieldsFilled to false if any field is empty
      return; // Prevent form submission if there's an error
    }

    signUpMutation({
      first_name: firstnameSignUp,
      last_name: lastnameSignUp,
      username: usernameSignUp,
      invitation_code: invitationcodeSignUp,
      email: emailSignUp,
      phone_number: phonenumberSignUp,
      password: passwordSignUp,
    });

    navigate('/signin');
  };

  return (
    <div className="signup-container">
      <h1 className="greenify">
        <span className="green">Green</span>
        <span className="ify">iFy</span>
      </h1>
      <h2 className="signup-text">Sign Up</h2>
      <form className="signup-form" onSubmit={handleSubmit}>

        <input type="text" placeholder="First Name" className="form-input" onChange={(e) => { setFirstNameSignUp(e.target.value) }} />
        <input type="text" placeholder="Last Name" className="form-input" onChange={(e) => { setLastNameSignUp(e.target.value) }} />
        <input type="text" placeholder="Username" className="form-input" onChange={(e) => { setUsernameSignUp(e.target.value) }} />
        <input type="text" placeholder="Invitation Code" className="form-input" onChange={(e) => { setInvitationCodeSignUp(e.target.value) }}/>
        <div className="input-container">
          <input type="email" placeholder="Corporate Email" className="form-input" onChange={(e) => { setEmailSignUp(e.target.value) }} />
          <div className="info-icon">&#9432;</div>
          <div className="tooltip">
            Data is collected and used for bj egehgke g
          </div>
        </div>
        <div className="input-container">
          <input type="text" placeholder="Phone Number" className="form-input" onChange={(e) => { setPhoneNumberSignUp(e.target.value) }}/>
          <div className="info-icon">&#9432;</div>
          <div className="tooltip">
            Data is collected and used for bj egehgke g
          </div>
        </div>
        <div className="input-container">
          <input
            type={passwordVisible ? 'text' : 'password'}
            placeholder="Password"
            className="form-input"
            onChange={(e) => { setPasswordSignUp(e.target.value) }} />
          <div className="eye-icon" onClick={togglePasswordVisibility}>
            {passwordVisible ? <FiEyeOff /> : <FiEye />}
          </div>
        </div>
      </form>
      {!requiredFieldsFilled && (
          <p className="error-message">Please fill in all the required fields.</p>
        )}
      <button className="create-account-button" onClick={handleSubmit}>Create Account</button>
    </div>
  );
};

export default SignUp;

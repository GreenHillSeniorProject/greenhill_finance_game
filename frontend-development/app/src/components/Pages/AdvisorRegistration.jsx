import React from 'react';
import '../../components/Styles/AdvisorRegistration.css';
import Footer from '../../components/Pages/Footer.jsx'

const AdvisorRegistration = () => {
  const handleGenerateInvite = (event) => {
    event.preventDefault();
    console.log("Generate Invite button clicked");
  };

  const handleStopInvites = () => {
      //PUT LOGIC HEREE
    console.log("Stop Invites button clicked");
  };

  return (
    <div className="advisor-registration">
      <div className="header">
        <span className="menu">☰</span>
      </div>
      <h2 className="invite-text">Invite New <br/><span>Advisor</span></h2>
      <p className="description">Invite a financial Professional To <br/><span>Participate</span></p>
      <input type="text" id="fname" placeholder="First Name" maxLength="50"/>
      <input type="text" id="lname" placeholder="Last Name" maxLength="50"/>
      <input type="email" id="email" placeholder="Email" maxLength="320"/>
      <button className="generate-button" onClick={handleGenerateInvite}>Generate Invite</button>
      <button className="stop-button" onClick={handleStopInvites}>Stop Invites Site Wide</button>
      <div> <Footer />  </div>
    </div>

   
  );
}
export default AdvisorRegistration;

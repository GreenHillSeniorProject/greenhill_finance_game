import React, { useState } from 'react';
import '../Styles/InviteAdvisor.css';
import { useMutation } from 'react-query';
import Axios from 'axios';

const InviteAdvisor = ({ tokens }) => {
  const [fname, setFirstNameInvite] = useState('');
  const [lname, setLastNameInvite] = useState('');
  const [input_email, setEmailInvite] = useState('');
  const [data, setData] = useState('');
  

  const handleInvite = (event) => {
    event.preventDefault();
    const fetchData = async () => {
      const result = await Axios.get('http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/invite-mailto', {
        params: {
          first_name: fname,
          last_name: lname,
          email: input_email
        }
      });  
      setData(result.data);
    };
    fetchData();
    window.open(data, "_blank", "noreferrer");
  };

  return (
    <div className="container">
      <div className="invite-advisor">
        <h2 className="center-text">Invite a New User</h2>
        <div className="tokens">
          <span>{tokens}</span> <span>Tokens Remaining</span>
        </div>
        <input id="fname" type="text" placeholder="First Name" onChange={(e) => { setFirstNameInvite(e.target.value) }} />
        <input id="lname" type="text" placeholder="Last Name" onChange={(e) => { setLastNameInvite(e.target.value) }}/>
        <input id="email" type="email" placeholder="Email" onChange={(e) => { setEmailInvite(e.target.value) }}/>
        <button onClick={handleInvite}>Send Invite</button>
      </div>
    </div>
  );
}

export default InviteAdvisor;

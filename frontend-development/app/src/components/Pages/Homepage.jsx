import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Styles/Homepage.css';
import CurrentGameTable from './CurrentGameTable.jsx';
import PastGameTable from './PastGamesTable.jsx';
import UserStats from './UserStats.jsx';

const Homepage = () => {
  const [user, setUser] = useState(null);
  // const [notification, setNotification] = useState('');
  const [dayDelta, setDayDelta] = useState('');
  const [weekDelta, setWeekDelta] = useState('');
  const [userData, setUserData] = useState(null);
  const [prevGameData, setPrevGameData] = useState(null);
  const [stats, setStats] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Get the token from local storage
    const token = localStorage.getItem('token');
    fetch(`http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/homepage`, {
      headers: {
        Authorization: `Bearer ${token}` // Include the token in the Authorization header
      }
    })
        .then((response) => {
          response.json()
              .then((d) => {
                console.log(d);
                setUser(d.user);
                // setNotification(data.notification);
                // setDayDelta(data.dayDelta);
                // setWeekDelta(data.weekDelta);
                let i = 1;
                d.currGameUsers.forEach(element => {
                  element.rank = i++;
                });
                setUserData(d.currGameUsers);
                setPrevGameData(d.pastGames);
                // setStats(data.stats);
              });
        })
        .catch((error) => console.error('Error fetching user data: ', error));
    }, [userId]);

  function handleNavigation() {
    navigate(`/portfolio`);
  }


  const handleLogout = () => {
    logoutUser();
  };

  const logoutUser = async () => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const response = await fetch('http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          // Token invalidated successfully on the server
          localStorage.removeItem('token');
          navigate('/signin'); // Redirect to login page
        } else {
          console.error('Logout failed:', response.statusText);
        }
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
  };

  return (
    <div className="homepage">
      <h1>Welcome, {user ? user.first_name
      : "Loading..."}!</h1>
      {/* <p>{notification}</p> */}

      {/* <div className="delta-container">
        <div>Day Delta: <span className="lime">{dayDelta}</span></div>
        <div>Week Delta: <span className="lime">{weekDelta}</span></div>
      </div> */}
      <button onClick={handleNavigation}>
        View Portfolio
      </button>
      <button onClick={handleLogout}>
        Logout
      </button>
      
      {userData ? <CurrentGameTable className="component-margin" data={userData} />  
      : <div>Loading Current Game!</div>}
      {prevGameData ? <PastGameTable className="component-margin" data={prevGameData}/>
      : <div>Loading Prev Games!</div>}
       
      {/* <UserStats className="component-margin" data={stats} /> */}
    </div>
  );
};

export default Homepage;
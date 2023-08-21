import React from 'react';
import '../Styles/UserStats.css';

const UserStats = (props) => {
  return (
    <div className="user-stats">
      <h1 className="center-text">Stats</h1>
      <h2>Average Rank: {props.avg_rank}</h2>
      <h2>First Places: {props.first}</h2>
      <h2>Second Places: {props.second}</h2>
      <h2>Third Places: {props.third}</h2>
      <h2>Last Places: {props.last}</h2>
      {/*<h3>Trophies</h3>
       <div className="trophies">
        {trophies.map((trophy, index) => (
          <img key={index} src={trophy.image} alt={trophy.name} />
        ))}
      </div> */}
    </div>
  );
}

export default UserStats;
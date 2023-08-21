import '../Styles/CurrentGameTable.css';
import React, { useState, useEffect } from 'react';

const CurrentGameTable = (props) => {
  const [data, setData] = useState(
    [{
      rank : "No",
      username : "data",
      portfolioValue : "Available"
    }]
  );

  useEffect(() => {
    if (props !== null) {
      setData(props.data);
    }
  }, []);
  

  return (
    <div>
      <h2>Current Game</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Portfolio Value</th>
            {/* <th>IMG</th> */}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.rank}</td>
              <td>{row.username}</td>
              <td>{row.portfolio_value}</td>
              {/* <td>
                <img src={row.img} alt="Avatar" />
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CurrentGameTable;

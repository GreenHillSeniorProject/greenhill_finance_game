import React, { useState, useEffect } from 'react';
import '../Styles/PastGamesTable.css';

const PastGamesTable = (props) => {
  const [data, setData] = useState(
    [{
      gameName : "No",
      sponsor : "data",
      gameType : "Available"
    }]
  );

  useEffect(() => {
    if (props !== null) {
      setData(props.data);
    }
  }, []);

  return (
    <div>
      <h2>Past Games</h2>
      <table>
        <thead>
          <tr>
            <th>Game Name</th>
            <th>Sponsor</th>
            <th>Game Type</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.game_name}</td>
              <td>{row.sponsor}</td>
              <td>{row.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PastGamesTable;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/AdminHome.css';

const AdminHome = () => {
  const navigate = useNavigate();

  const tiles = [
    { title: 'Create Game', content: 'Create a new game for advisers to play in.' },                                // 0
    { title: 'Manage Users', content: 'Manually select users to perform actions on adviser accounts.' },            // 1
    { title: 'Manage Games', content: 'Change settings and manage active users.' },                                 // 2
    { title: 'Edit Account', content: 'A place to edit your admin account.' },                                      // 3
    { title: 'Register Admin', content: 'Register a new Admin account.' },                                          // 4
    { title: 'Invite an Adviser', content: 'Invite new financial advisers to participate in FGF competitions.' },   // 5
  ];

  const routes = [
    "/create-game",
    "/manage-users",
    "/manage-games",
    "/admin-edit",
    "/admin-register",
    "/admin-invite"
  ];

  const handleTileClick = (index) => {
    // add routing logic here
    console.log(`Tile ${index + 1} clicked.`);
    // For example, to navigate to '/create-game' when the 'Create Game' tile is clicked:
    // if (tiles[index].title === 'Create Game') history.push('/create-game');
    navigate(routes[index]);
  }

  return (
    <div className="admin-home">
      <h1><span className="green">Hello</span> <span className="white">Admin</span></h1>
      <div className="tiles">
        {tiles.map((tile, index) => (
          <div className="tile" key={index} onClick={() => handleTileClick(index)}>
            <div className="tile-title">{tile.title}</div>
            <div className="tile-content">{tile.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminHome;

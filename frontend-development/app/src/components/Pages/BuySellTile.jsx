import React from 'react';
import './Styles/BuySellTile.css';

const BuySellTile = ({ ticker, title, price, delta, about, type, port_val, cash_val }) => {

  const handleBuyByShare = (event) => {
    event.preventDefault();
    const amount = document.getElementById('buyAmount').value;
    fetch('</PATH/TO/BUY/STOCK>', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
  };

  const handleBuyByCash = (event) => {
    event.preventDefault();
    const amount = document.getElementById('buyAmount').value;
    fetch('</PATH/TO/BUY/CASH>', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
  };

  const handleSellByShare = (event) => {
    event.preventDefault();
    const amount = document.getElementById('sellAmount').value;
    fetch('<PATH/TO/SELL/SHARE>', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
  };

  const handleSellByCash = (event) => {
    event.preventDefault();
    const amount = document.getElementById('sellAmount').value;
    fetch('/PATH/TO/SELL/CASH', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
  };

  return (
    <div className="buy-sell">
      <h1 className="center-text">{ticker}</h1>
      <h2>{title}</h2>
      <div>
        <span>{price}</span> <span>({delta})</span>
      </div>
      <h3>About</h3>
      <p>{about}</p>
      <h3>Type</h3>
      <p>{type}</p>

      <input id="buyAmount" type="number" placeholder="Enter Purchase Amount" />
      <button onClick={handleBuyByShare}>Purchase by Share</button>
      <button onClick={handleBuyByCash}>Purchase by $ Amount</button>

      <input id="sellAmount" type="number" placeholder="Enter Sell Amount" />
      <button onClick={handleSellByShare}>Sell by Share</button>
      <button onClick={handleSellByCash}>Sell by $ Amount</button>

      <div className="portfolio">
        <label>Net Portfolio Value: </label><span>{port_val}</span>
        <label>Available Cash: </label><span>{cash_val}</span>
      </div>
    </div>
  );
}

export default BuySellTile;

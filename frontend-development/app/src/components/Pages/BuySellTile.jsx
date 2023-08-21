import React from 'react';
import '../Styles/BuySellTile.css';

const BuySellTile = ({ ticker, title, quantity, price, about, port_val, cash_val, handleBuyByShare, handleBuyByCash, handleSellByShare, handleSellByCash }) => {
  
  const handleAmount = (event, handlerFunction) => {
    event.preventDefault();
    const amount = document.getElementById('amount').value;
    handlerFunction(amount);
  };


  return (
    <div className="buy-sell">
      <h1 className="stock-title">{title}</h1>
      <h2 className="ticker-title">Ticker: <span style={{color:'white'}}>{ticker}</span></h2>
      <h2 className="price-title">Current Price: <span style={{color:'white'}}>${price}</span></h2>
      <h2 className="about-title">About</h2>
      <p>{about}</p>

      <div className="action-section">
        <div className="share-buttons">
          <button class="buy-button" onClick={() => handleBuyByShare(5)}>Buy by Share</button>
          <input id="quantity-amount" name="share-quantity" type="number" placeholder="Enter Quantity Amount" />
          <button class="sell-button" onClick={() => handleSellByShare(6)}>Sell by Share</button>
        </div>

        <div className="dollar-buttons">
          <button class="buy-button" onClick={() => handleBuyByCash(12)}>Buy by $ Amount</button>
          <input id="dollar-amount" name="dollar-amount" type="number" placeholder="Enter Dollar Amount" />
          <button class="sell-button" onClick={() => handleSellByCash(13)}>Sell by $ Amount</button>
          {/* <button class="sell-button" onClick={(e) => handleAmount(e, handleSellByCash)}>Sell by $ Amount</button> */}
        </div>
      </div>

      <div className="current-portfolio-values-section">
        <div className="current-portfolio-box">
          <div>
            <label>{ticker}</label>
          </div>
          <div>
            <label>Quantity:  </label>
            <label className="value">{quantity}</label>
          </div>
          <div>
            <label>Current Portfolio Value: </label>
            <label className="value">${port_val}</label>
          </div>
          <div>
            <label>Available Cash: </label>
            <label className="value">${cash_val}</label>
          </div>
        </div>
      </div>
      
      
    </div>
  );
}

export default BuySellTile;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../../components/Styles/Portfolio.css';
import BuySellTile from './BuySellTile';

const Portfolio = () => {
  const [data, setData] = useState({});
  const { portfolioId } = useParams();
  
  {/* props for the current user's total portfolio values */}
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [availableCash, setAvailableCash] = useState(0);

  {/* localStockValues is an array of stock objects */}
  const [localStockValues, setLocalStockValues] = useState([]);

  {/* determines whether or not to show the buy sell tile for a given stock */}
  const [showBuySellTile, setShowBuySell] = useState(false);
  
  {/* fills values needed to pass to the current buy sell tile */}
  const [currentBuySellTile, setCurrentBuySellTile] = useState([]);

    
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('http://ec2-3-80-87-201.compute-1.amazonaws.com:3001/portfolio', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
  
      switch (res.status) {
        case 400:
          console.log('Bad Request');
          break;
        case 403:
          console.log('Forbidden');
          break;
        case 500:
          console.log('Server Error');
          break;
        default:
          setData(data);
          setPortfolioValue(data.portfolioValues?.portfolio_value || 0);
          setAvailableCash(data.portfolioValues?.cash_value || 0);
          setLocalStockValues(data.stocks || []);
      }
    };
  
    fetchData();
  }, [portfolioId]);
  

  
  const onQuantityMinus = (ticker) => {
    const pos = localStockValues.map(e => e.ticker).indexOf(ticker);
    localStockValues[pos].shares--;
    const newCash =  parseInt(availableCash) + parseInt(localStockValues[pos].price);
    const newPortfolioValue = parseInt(portfolioValue) - parseInt(localStockValues[pos].price);
    setPortfolioValue(newPortfolioValue);
    setAvailableCash(newCash);
  }

  const onQuantityPlus = (ticker) => {
    const pos = localStockValues.map(e => e.ticker).indexOf(ticker);
    localStockValues[pos].shares++;
    const newCash =  parseInt(availableCash) - parseInt(localStockValues[pos].price);
    const newPortfolioValue = parseInt(portfolioValue) + parseInt(localStockValues[pos].price);
    setPortfolioValue(newPortfolioValue.toFixed(2));
    setAvailableCash(newCash.toFixed(2));
  }

  const setShowBuySellTile = (ticker) => {
    
    const pos = localStockValues.map(e => e.ticker).indexOf(ticker);
    
    //resets the current BuySellTile so that a new one can be created
    currentBuySellTile.length = 0;
    console.log(localStockValues);
    //update the current buySellTile array
    setCurrentBuySellTile(
      [
        ...currentBuySellTile,
        {
          curTicker: localStockValues[pos].ticker,
          description: localStockValues[pos].description,
          shares: localStockValues[pos].shares,
          price: localStockValues[pos].price,
        }
      ]
    );
    
    //finally, display the tile
    setShowBuySell(!showBuySellTile);
    console.log(currentBuySellTile.length)
  }

  function handleUpdate()
  {
    console.log('update being handled, this needs to be a post');
    //will need to create a  json string here lol 
  }

  //handles buying stocks by a specific quantity of shares  
  const handleBuyByShare = (amount) => {
    console.log('calling handleBuyByShare from portfolio.jsx with ' + amount + ' shares');
  }

  //handles selling stocks by a specific quantity of shares
  const handleSellByShare = (amount) => {
    console.log('calling handleSellByShare from portfolio.jsx with ' + amount + ' shares');
  }

  //handles buying stocks from a specified dollar amount
  const handleBuyByCash = (amount) => {
    console.log('calling handleBuyByCash from portfolio.jsx with ' + amount + 'shares');
  }

  //handles selling stocks worth a specified dollar amount
   const handleSellByCash = (amount) => {
    console.log('calling handleSellByCash from portfolio.jsx with ' + amount + 'shares');
  }







  // Check if data is available and not empty for initial render
  // TODO: add more logic for - and + / prevent negative stocks
  const isDataAvailable = Object.keys(data).length > 0;

  return (
    <div className="portfolio">
      {isDataAvailable ? (
        <>
          <h1>Portfolio</h1>
          <div className="info">
            <div>
              <label>Current Portfolio Value</label>
              <label className="value">${portfolioValue}</label>
            </div>
            <div>
              <label>Available Cash</label>
              <label className="value">${availableCash}</label>
            </div>
          </div>

          {/* Search bar functionality to be implemented */}
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Price per Share</th>
                <th>Total Market Value</th>
                <th>Shares</th>
              </tr>
            </thead>
            <tbody>
              {localStockValues &&
                localStockValues.map((stock) => (
                  <tr key={stock.ticker}>
                    <td>{stock.ticker}</td>
                    <td>{stock.price}</td>
                    <td>{(stock.price * stock.shares).toFixed(2)}</td>
                    <td>
                      <button className ="subtract-button" onClick={() => onQuantityMinus(stock.ticker)}>-</button>
                      {stock.shares}
                      <button className ="add-button" onClick={() => onQuantityPlus(stock.ticker)}>+</button>
                      <button className ="open-buy-sell-tile-button" onClick={() => setShowBuySellTile(stock.ticker)}>Buy / Sell</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        <div>
                  { showBuySellTile ? <div class="buy-sell-tile">
                                        <BuySellTile
                                          ticker={currentBuySellTile[0].curTicker}
                                          //we don't have a title route yet?
                                          title="fakeTitle"
                                          quantity={currentBuySellTile[0].shares}
                                          price={currentBuySellTile[0].price}
                                          about={currentBuySellTile[0].description}
                                          port_val={portfolioValue}
                                          cash_val={availableCash}
                                          handleBuyByShare={handleBuyByShare}
                                          handleSellByShare={handleSellByShare}
                                          handleBuyByCash={handleBuyByCash}
                                          handleSellByCash={handleSellByCash}
                                          />
                                        <button className ="close-buy-sell-tile-button" onClick={() => setShowBuySell(!showBuySellTile)}>Close</button>
                                      </div>
                                      : null}
        </div>
        {/* this button will eventually POST the new portfolio data to the db */}
        <button className ="updateButton" onClick={handleUpdate}> Update </button>
        </>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default Portfolio;
import React from 'react';
import { FaBars } from 'react-icons/fa';
import '../../components/Styles/SPStocksStats.css';
import Footer from './Footer';

const SPStockStats = () => {
  return (
    <div className="stock-stats-container">
      <header>
        <FaBars size={30} color="#ffffff" className="hamburger-icon" />
        <div className="stock-stats-header">
          <h1 className="green-hill">GreenHill</h1>
          <h2 className="investment-reporting">Investment Reporting</h2>
        </div>
      </header>
      <main>
        <h3 className="stock-name">Stock Name</h3>
        <div className="stock-info">
          <p>Ticker: XYZ</p>
          <p>Price per share: $XXX</p>
          <p>Stock name: Example Stock</p>
          <p>
            Stock description: Lorem ipsum dolor sit amet, consectetur
            adipiscing elit. Duis interdum dolor ac orci.
          </p>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default SPStockStats;

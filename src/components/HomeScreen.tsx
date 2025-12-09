import React from 'react';
import cwTechnicaLogo from '../assets/C&WTechnicaLogo.png';
import './HomeScreen.css';

interface HomeScreenProps {
  onNavigateToLeases: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToLeases }) => {
  return (
    <div className="home-screen">
      <header className="home-header">
        <img src={cwTechnicaLogo} alt="C&W Technica Logo" className="home-header-logo" />
      </header>
      <div className="home-content">
        <h1>Accounting Schedule</h1>
        <div className="tool-buttons-grid">
          <button className="tool-button" onClick={onNavigateToLeases}>
            Leases
          </button>
          <button className="tool-button disabled" disabled>
            Fixed Assets
          </button>
          <button className="tool-button disabled" disabled>
            Prepayments
          </button>
          <button className="tool-button disabled" disabled>
            Bonds Register
          </button>
          <button className="tool-button disabled" disabled>
            Royalty & Corp. Fee
          </button>
          <button className="tool-button disabled" disabled>
            Dividend
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;

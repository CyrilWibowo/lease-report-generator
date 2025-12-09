import React from 'react';
import './HomeScreen.css';

interface HomeScreenProps {
  onNavigateToLeases: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToLeases }) => {
  return (
    <div className="home-screen">
      <div className="home-content">
        <h1>Accounting Schedule</h1>
        <div className="tool-buttons">
          <button className="tool-button" onClick={onNavigateToLeases}>
            Lease Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;

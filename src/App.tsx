import React, { useState, useEffect } from 'react';
import { Lease } from './types/Lease';
import Dashboard from './components/Dashboard';
import AddLeaseModal from './components/AddLeaseModal';
import rimexLogo from './assets/rimexLogo.png';
import './App.css';

function App() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const savedLeases = localStorage.getItem('leases');
    if (savedLeases) {
      setLeases(JSON.parse(savedLeases));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('leases', JSON.stringify(leases));
  }, [leases]);

  const handleAddLease = (newLease: Lease) => {
    setLeases([...leases, newLease]);
    setIsModalOpen(false);
  };

  const propertyLeases = leases.filter(lease => lease.type === 'Property');
  const motorVehicleLeases = leases.filter(lease => lease.type === 'Motor Vehicle');

  return (
    <div className="App">
      <header className="App-header">
        <img src={rimexLogo} alt="Rimex Logo" className="header-logo" />
        <button className="add-card-button" onClick={() => setIsModalOpen(true)}>
          Add Card
        </button>
      </header>

      <Dashboard
        propertyLeases={propertyLeases}
        motorVehicleLeases={motorVehicleLeases}
      />

      {isModalOpen && (
        <AddLeaseModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddLease}
        />
      )}
    </div>
  );
}

export default App;
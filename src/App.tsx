// App.tsx
import React, { useState, useEffect } from 'react';
import { Lease, PropertyLease, MotorVehicleLease } from './types/Lease';
import Dashboard from './components/Dashboard';
import AddLeaseModal from './components/AddLeaseModal';
import { loadLeases, addLease, updateLease, deleteLease } from './utils/dataStorage';
import rimexLogo from './assets/rimexLogo.png';
import './App.css';

function App() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const initLeases = async () => {
      const loaded = await loadLeases();
      setLeases(loaded);
    };
    initLeases();
  }, []);

  const handleAddLease = async (newLease: Lease) => {
    const updatedLeases = await addLease(newLease);
    setLeases(updatedLeases);
    setIsModalOpen(false);
  };

  const handleUpdateLease = async (updatedLease: Lease) => {
    const updatedLeases = await updateLease(updatedLease);
    setLeases(updatedLeases);
  };

  const handleDeleteLease = async (leaseId: string) => {
    const updatedLeases = await deleteLease(leaseId);
    setLeases(updatedLeases);
  };

  const propertyLeases = leases.filter((lease): lease is PropertyLease => lease.type === 'Property');
  const motorVehicleLeases = leases.filter((lease): lease is MotorVehicleLease => lease.type === 'Motor Vehicle');

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
        onUpdateLease={handleUpdateLease}
        onDeleteLease={handleDeleteLease}
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
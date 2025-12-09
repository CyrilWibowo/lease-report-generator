import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import './OpeningBalanceModal.css';

interface OpeningBalanceModalProps {
  onClose: () => void;
}

const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({ onClose }) => {
  const handleAddOpeningBalance = () => {
    // TODO: Implement add opening balance functionality
  };

  return (
    <div className="opening-balance-overlay" onClick={onClose}>
      <div className="opening-balance-content" onClick={(e) => e.stopPropagation()}>
        <div className="opening-balance-header">
          <h2 className="opening-balance-title">Manage Opening Balance</h2>
          <button className="opening-balance-close-button" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="opening-balance-actions">
          <button className="add-opening-balance-button" onClick={handleAddOpeningBalance}>
            Add Opening Balance
          </button>
        </div>

        <div className="opening-balance-table-container">
          <table className="opening-balance-table">
            <thead>
              <tr>
                <th>Opening Date</th>
                <th>New Lease / Extension</th>
                <th>Right to Use Assets</th>
                <th>Acc. Depr Right to Use Assets</th>
                <th>Lease Liability - Current</th>
                <th>Lease Liability - Non-Current</th>
                <th>Depreciation Expense</th>
                <th>Interest Expense Rent</th>
                <th>Rent Expense</th>
              </tr>
            </thead>
            <tbody>
              {/* Table is empty initially */}
            </tbody>
          </table>
        </div>

        <div className="opening-balance-footer">
          <button className="opening-balance-cancel-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpeningBalanceModal;

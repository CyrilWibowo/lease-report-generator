import React, { useState } from 'react';
import { Lease } from '../types/Lease';
import { generateExcelFromLeases } from '../utils/excelGenerator';
import './Dashboard.css';

interface DashboardProps {
  propertyLeases: Lease[];
  motorVehicleLeases: Lease[];
}

const Dashboard: React.FC<DashboardProps> = ({
  propertyLeases,
  motorVehicleLeases
}) => {
  const [hoveredLease, setHoveredLease] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const emptyRows = 10;

  const calculateCommittedYears = (lease: Lease): number => {
    if (lease.commencementDate && lease.expiryDate) {
      const start = new Date(lease.commencementDate);
      const end = new Date(lease.expiryDate);
      const yearsDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
      const optionsYears = parseInt(lease.options) || 0;
      const total = Math.floor(yearsDiff + optionsYears);
      return total > 0 ? total : 0;
    }
    return 0;
  };

  const renderIncrementMethodsTooltip = (lease: Lease) => {
    const committedYears = calculateCommittedYears(lease);
    if (committedYears <= 1) return null;

    return (
      <div
        className="tooltip"
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`
        }}
      >
        <div className="tooltip-header">Increment Methods</div>
        {Array.from({ length: committedYears - 1 }, (_, i) => i + 2).map((year) => {
          const method = lease.incrementMethods[year];

          return (
            <div key={year} className="tooltip-row">
              <strong>Year {year}:</strong> {method || 'Not set'}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTableRows = (leases: Lease[], type: 'Property' | 'Motor Vehicle') => {
    const rows = [];
    const displayNameKey = type === 'Property' ? 'propertyAddress' : 'description';

    const handleMouseEnter = (lease: Lease, event: React.MouseEvent<HTMLTableCellElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left,
        y: rect.bottom + 8
      });
      setHoveredLease(lease.id);
    };

    for (let i = 0; i < Math.max(emptyRows, leases.length); i++) {
      const lease = leases[i];
      const committedYears = lease ? calculateCommittedYears(lease) : 0;

      rows.push(
        <tr key={i}>
          <td>{lease ? lease[displayNameKey] : ''}</td>
          <td>{lease ? lease.commencementDate : ''}</td>
          <td>{lease ? lease.expiryDate : ''}</td>
          <td>{lease ? lease.options : ''}</td>
          <td
            className={lease ? 'committed-years-cell' : ''}
            onMouseEnter={(e) => lease && handleMouseEnter(lease, e)}
            onMouseLeave={() => setHoveredLease(null)}
          >
            {lease && committedYears}
          </td>
          <td>{lease ? lease.originalAnnualRent : ''}</td>
          <td>{lease ? lease.rbaCpiRate : ''}</td>
          <td>{lease ? lease.fixedIncrementRate : ''}</td>
          <td>{lease ? lease.borrowingRate : ''}</td>
          <td>
            {lease && (
              <button
                className="download-btn"
                onClick={() => generateExcelFromLeases(lease)}
              >
                Download
              </button>
            )}
          </td>
        </tr>
      );
    }
    return rows;
  };

  return (
    <div className="dashboard-container">
      {hoveredLease && propertyLeases.find(l => l.id === hoveredLease) &&
        renderIncrementMethodsTooltip(propertyLeases.find(l => l.id === hoveredLease)!)}
      {hoveredLease && motorVehicleLeases.find(l => l.id === hoveredLease) &&
        renderIncrementMethodsTooltip(motorVehicleLeases.find(l => l.id === hoveredLease)!)}

      <div className="table-section">
        <h2>Property Leases</h2>
        <div className="table-wrapper">
          <table className="lease-table">
            <thead>
              <tr>
                <th>Property Address</th>
                <th>Commencement Date</th>
                <th>Expiry Date</th>
                <th>Options</th>
                <th>Total Committed Years</th>
                <th>Original Annual Rent</th>
                <th>RBA CPI Rate</th>
                <th>Fixed Increment Rate</th>
                <th>Borrowing Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(propertyLeases, 'Property')}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-section">
        <h2>Motor Vehicle Leases</h2>
        <div className="table-wrapper">
          <table className="lease-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Commencement Date</th>
                <th>Expiry Date</th>
                <th>Options</th>
                <th>Total Committed Years</th>
                <th>Original Annual Rent</th>
                <th>RBA CPI Rate</th>
                <th>Fixed Increment Rate</th>
                <th>Borrowing Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(motorVehicleLeases, 'Motor Vehicle')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
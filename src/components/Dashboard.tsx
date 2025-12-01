// components/Dashboard.tsx
import React, { useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import { Lease, PropertyLease, MotorVehicleLease } from '../types/Lease';
import { generateExcelFromLeases } from '../utils/excelGenerator';
import { generateExcelFromMotorVehicleLeases } from '../utils/motorVehicleExcelGenerator';
import EditLeaseModal from './EditLeaseModal';
import ToXLSXModal, { XLSXGenerationParams } from './ToXLSXModal';
import './Dashboard.css';
import { formatCurrency, formatDate, getYearDiff } from '../utils/helper';

interface DashboardProps {
  propertyLeases: PropertyLease[];
  motorVehicleLeases: MotorVehicleLease[];
  onUpdateLease: (lease: Lease) => void;
  onDeleteLease: (leaseId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  propertyLeases,
  motorVehicleLeases,
  onUpdateLease,
  onDeleteLease
}) => {
  const [hoveredLease, setHoveredLease] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [xlsxModalLease, setXlsxModalLease] = useState<PropertyLease | MotorVehicleLease | null>(null);
  const emptyRows = 10;

  const calculateCommittedYears = (lease: Lease): number => {
    if (lease.type === 'Property') {
      const propertyLease = lease as PropertyLease;
      if (propertyLease.commencementDate && propertyLease.expiryDate) {
        const start = new Date(propertyLease.commencementDate);
        const end = new Date(propertyLease.expiryDate);
        const yearsDiff = getYearDiff(start, end);
        const optionsYears = parseInt(propertyLease.options) || 0;
        const total = Math.floor(yearsDiff + optionsYears);
        return total > 0 ? total : 0;
      }
    } else {
      const mvLease = lease as MotorVehicleLease;
      if (mvLease.deliveryDate && mvLease.expiryDate) {
        const start = new Date(mvLease.deliveryDate);
        const end = new Date(mvLease.expiryDate);
        const yearsDiff = getYearDiff(start, end);
        return Math.floor(yearsDiff) > 0 ? Math.floor(yearsDiff) : 0;
      }
    }
    return 0;
  };

  const handleGenerateExcel = (lease: PropertyLease | MotorVehicleLease, params: XLSXGenerationParams) => {
    if (lease.type === 'Property') {
      generateExcelFromLeases(lease as PropertyLease, params);
    } else {
      generateExcelFromMotorVehicleLeases(lease as MotorVehicleLease, params);
    }
  };

  const renderIncrementMethodsTooltip = (lease: Lease) => {
    const committedYears = calculateCommittedYears(lease);
    if (committedYears < 1) return null;

    // Only show tooltip for Property leases
    if (lease.type !== 'Property') return null;

    return (
      <div
        className="tooltip"
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`
        }}
      >
        <div className="tooltip-header">Increment Methods</div>
        {Array.from({ length: committedYears }, (_, i) => i + 1).map((year) => {
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

  const renderPropertyTableRows = () => {
    const rows = [];

    const handleMouseEnter = (lease: PropertyLease, event: React.MouseEvent<HTMLTableCellElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left,
        y: rect.bottom + 8
      });
      setHoveredLease(lease.id);
    };

    for (let i = 0; i < Math.max(emptyRows, propertyLeases.length); i++) {
      const lease = propertyLeases[i];
      const committedYears = lease ? calculateCommittedYears(lease) : 0;

      rows.push(
        <tr key={i}>
          <td>{lease ? lease.lessor : ''}</td>
          <td>{lease ? lease.propertyAddress : ''}</td>
          <td>{lease ? formatDate(lease.commencementDate) : ''}</td>
          <td>{lease ? formatDate(lease.expiryDate) : ''}</td>
          <td>{lease ? `${lease.options} years` : ''}</td>
          <td
            className={lease ? 'committed-years-cell' : ''}
            onMouseEnter={(e) => lease && handleMouseEnter(lease, e)}
            onMouseLeave={() => setHoveredLease(null)}
          >
            {lease && `${committedYears} years`}
          </td>
          <td>{lease ? formatCurrency(lease.annualRent) : ''}</td>
          <td>{lease ? `${lease.rbaCpiRate}%` : ''}</td>
          <td>{lease ? `${lease.borrowingRate}%` : ''}</td>
          <td>{lease ? `${lease.fixedIncrementRate}%` : ''}</td>
          <td>
            {lease && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="download-btn"
                  onClick={() => setXlsxModalLease(lease)}
                >
                  .xlxs
                </button>
                <button
                  className="edit-btn"
                  onClick={() => setEditingLease(lease)}
                  title="Edit lease"
                >
                  <SettingsIcon />
                </button>
              </div>
            )}
          </td>
        </tr>
      );
    }
    return rows;
  };

  const renderMotorVehicleTableRows = () => {
    const rows = [];

    for (let i = 0; i < Math.max(emptyRows, motorVehicleLeases.length); i++) {
      const lease = motorVehicleLeases[i];
      const leasePeriod = lease ? calculateCommittedYears(lease) : 0;

      rows.push(
        <tr key={i}>
          <td>{lease ? lease.lessor : ''}</td>
          <td>{lease ? lease.description : ''}</td>
          <td>{lease ? lease.vinSerialNo : ''}</td>
          <td>{lease ? lease.regoNo : ''}</td>
          <td>{lease ? formatDate(lease.deliveryDate) : ''}</td>
          <td>{lease ? formatDate(lease.expiryDate) : ''}</td>
          <td>{lease && `${leasePeriod} years`}</td>
          <td>{lease ? formatCurrency(lease.annualRent) : ''}</td>
          <td>{lease ? `${lease.borrowingRate}%` : ''}</td>
          <td>
            {lease && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="download-btn"
                  onClick={() => setXlsxModalLease(lease)}
                >
                  .xlxs
                </button>
                <button
                  className="edit-btn"
                  onClick={() => setEditingLease(lease)}
                  title="Edit lease"
                >
                  <SettingsIcon />
                </button>
              </div>
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
                <th>Lessor</th>
                <th>Property Address</th>
                <th>Commencement Date</th>
                <th>Expiry Date</th>
                <th>Options</th>
                <th>Total Committed Years</th>
                <th>Annual Rent (exc. GST)</th>
                <th>RBA CPI Rate</th>
                <th>Borrowing Rate</th>
                <th>Fixed Increment Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {renderPropertyTableRows()}
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
                <th>Lessor</th>
                <th>Description</th>
                <th>VIN/Serial No.</th>
                <th>Rego No.</th>
                <th>Delivery Date</th>
                <th>Expiry Date</th>
                <th>Lease Period</th>
                <th>Annual Rent (exc. GST)</th>
                <th>Borrowing Rate</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {renderMotorVehicleTableRows()}
            </tbody>
          </table>
        </div>
      </div>

      {editingLease && (
        <EditLeaseModal
          lease={editingLease}
          onClose={() => setEditingLease(null)}
          onSave={onUpdateLease}
          onDelete={onDeleteLease}
        />
      )}

      {xlsxModalLease && (
        <ToXLSXModal
          onClose={() => setXlsxModalLease(null)}
          onGenerate={(params) => handleGenerateExcel(xlsxModalLease, params)}
        />
      )}
    </div>
  );
};

export default Dashboard;
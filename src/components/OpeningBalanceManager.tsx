import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { PropertyLease, MotorVehicleLease, OpeningBalance } from '../types/Lease';
import './OpeningBalanceManager.css';

interface OpeningBalanceManagerProps {
  type: 'Property' | 'Motor Vehicle';
  propertyLeases: PropertyLease[];
  motorVehicleLeases: MotorVehicleLease[];
  onClose: () => void;
  onSave: (updatedLeases: (PropertyLease | MotorVehicleLease)[]) => void;
}

interface EditableOpeningBalance {
  leaseId: string;
  leaseIdentifier: string; // Property Address or Rego No
  lessor: string;
  isNewLeaseExtension: boolean;
  rightToUseAssets: number;
  accDeprRightToUseAssets: number;
  leaseLiabilityCurrent: number;
  leaseLiabilityNonCurrent: number;
  depreciationExpense: number;
  interestExpenseRent: number;
  rentExpense: number;
}

const OpeningBalanceManager: React.FC<OpeningBalanceManagerProps> = ({
  type,
  propertyLeases,
  motorVehicleLeases,
  onClose,
  onSave
}) => {
  const [editableData, setEditableData] = useState<EditableOpeningBalance[]>([]);

  useEffect(() => {
    const leases = type === 'Property' ? propertyLeases : motorVehicleLeases;
    const data: EditableOpeningBalance[] = leases.map((lease) => {
      const existingBalance = lease.openingBalances?.[0] || {
        isNewLeaseExtension: false,
        rightToUseAssets: 0,
        accDeprRightToUseAssets: 0,
        leaseLiabilityCurrent: 0,
        leaseLiabilityNonCurrent: 0,
        depreciationExpense: 0,
        interestExpenseRent: 0,
        rentExpense: 0
      };

      return {
        leaseId: lease.leaseId,
        leaseIdentifier: type === 'Property'
          ? (lease as PropertyLease).propertyAddress
          : (lease as MotorVehicleLease).regoNo,
        lessor: lease.lessor,
        isNewLeaseExtension: existingBalance.isNewLeaseExtension,
        rightToUseAssets: existingBalance.rightToUseAssets,
        accDeprRightToUseAssets: existingBalance.accDeprRightToUseAssets,
        leaseLiabilityCurrent: existingBalance.leaseLiabilityCurrent,
        leaseLiabilityNonCurrent: existingBalance.leaseLiabilityNonCurrent,
        depreciationExpense: existingBalance.depreciationExpense,
        interestExpenseRent: existingBalance.interestExpenseRent,
        rentExpense: existingBalance.rentExpense
      };
    });
    setEditableData(data);
  }, [type, propertyLeases, motorVehicleLeases]);

  const handleCheckboxChange = (index: number) => {
    const newData = [...editableData];
    newData[index].isNewLeaseExtension = !newData[index].isNewLeaseExtension;
    setEditableData(newData);
  };

  const handleNumberChange = (index: number, field: keyof EditableOpeningBalance, value: string) => {
    const newData = [...editableData];
    const numValue = value === '' ? 0 : parseFloat(value);
    (newData[index] as any)[field] = isNaN(numValue) ? 0 : numValue;
    setEditableData(newData);
  };

  const handleSave = () => {
    const leases = type === 'Property' ? propertyLeases : motorVehicleLeases;
    const updatedLeases = leases.map((lease) => {
      const editedData = editableData.find(d => d.leaseId === lease.id);
      if (!editedData) return lease;

      const existingBalances = lease.openingBalances || [];
      const newBalance: OpeningBalance = {
        id: existingBalances[0]?.id || crypto.randomUUID(),
        openingDate: existingBalances[0]?.openingDate || new Date().toISOString().split('T')[0],
        isNewLeaseExtension: editedData.isNewLeaseExtension,
        rightToUseAssets: editedData.rightToUseAssets,
        accDeprRightToUseAssets: editedData.accDeprRightToUseAssets,
        leaseLiabilityCurrent: editedData.leaseLiabilityCurrent,
        leaseLiabilityNonCurrent: editedData.leaseLiabilityNonCurrent,
        depreciationExpense: editedData.depreciationExpense,
        interestExpenseRent: editedData.interestExpenseRent,
        rentExpense: editedData.rentExpense
      };

      return {
        ...lease,
        openingBalances: [newBalance, ...existingBalances.slice(1)]
      };
    });

    onSave(updatedLeases);
    onClose();
  };

  const title = type === 'Property'
    ? 'Manage Property Opening Balances'
    : 'Manage Motor Vehicle Opening Balances';

  const identifierLabel = type === 'Property' ? 'Property Address' : 'Rego No';

  return (
    <div className="ob-manager-overlay" onClick={onClose}>
      <div className="ob-manager-content" onClick={(e) => e.stopPropagation()}>
        <div className="ob-manager-header">
          <h2 className="ob-manager-title">{title}</h2>
          <button className="ob-manager-close-button" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="ob-manager-table-container">
          <table className="ob-manager-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lessor</th>
                <th>{identifierLabel}</th>
                <th>New Lease / Extension</th>
                <th>Right to Use Assets</th>
                <th>Acc. Depr Right to Use Assets</th>
                <th>Lease Liability - Current</th>
                <th>Lease Liability - Non-Current</th>
                <th>Depreciation Expense</th>
                <th>Interest Expense Rent</th>
                <th>{type === 'Property' ? 'Rent Expense' : 'Vehicle Expense'}</th>
              </tr>
            </thead>
            <tbody>
              {editableData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="ob-manager-empty">
                    No {type.toLowerCase()} leases found
                  </td>
                </tr>
              ) : (
                editableData.map((row, index) => (
                  <tr key={row.leaseId}>
                    <td className="ob-manager-cell-readonly">{row.leaseId.substring(0, 8)}</td>
                    <td className="ob-manager-cell-readonly">{row.lessor}</td>
                    <td className="ob-manager-cell-readonly">{row.leaseIdentifier}</td>
                    <td className="ob-manager-cell-checkbox">
                      <input
                        type="checkbox"
                        checked={row.isNewLeaseExtension}
                        onChange={() => handleCheckboxChange(index)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="ob-manager-input"
                        value={row.rightToUseAssets || ''}
                        onChange={(e) => handleNumberChange(index, 'rightToUseAssets', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="ob-manager-input"
                        value={row.accDeprRightToUseAssets || ''}
                        onChange={(e) => handleNumberChange(index, 'accDeprRightToUseAssets', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="ob-manager-input"
                        value={row.leaseLiabilityCurrent || ''}
                        onChange={(e) => handleNumberChange(index, 'leaseLiabilityCurrent', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="ob-manager-input"
                        value={row.leaseLiabilityNonCurrent || ''}
                        onChange={(e) => handleNumberChange(index, 'leaseLiabilityNonCurrent', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="ob-manager-input"
                        value={row.depreciationExpense || ''}
                        onChange={(e) => handleNumberChange(index, 'depreciationExpense', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="ob-manager-input"
                        value={row.interestExpenseRent || ''}
                        onChange={(e) => handleNumberChange(index, 'interestExpenseRent', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="ob-manager-input"
                        value={row.rentExpense || ''}
                        onChange={(e) => handleNumberChange(index, 'rentExpense', e.target.value)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ob-manager-actions">
          <button className="ob-manager-cancel-button" onClick={onClose}>Cancel</button>
          <button className="ob-manager-save-button" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default OpeningBalanceManager;

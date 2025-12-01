import * as XLSX from 'xlsx';
import { PropertyLease } from '../types/Lease';
import { PaymentRow } from './excelHelper';
import { generatePaymentRows } from './leasePaymentsSheetGenerator';

interface CashFlowRow {
  paymentDate: Date;
  baseRent: number;
  other: string;
  parking: string;
  totalCashFlows: number;
  leaseComponent: number;
}

interface RightOfUseAssetRow {
  date: string;
  period: number;
  assetBeginning: number;
  depreciation: number;
  assetEnding: number;
}

interface LeaseLiabilityRow {
  period: string;
  liabilityBeginning: number;
  payment: number;
  interestExpense: number;
  liabilityEnding: number;
}

export const generatePVCalculation = (lease: PropertyLease): XLSX.WorkSheet => {
  // Get all payment rows from the lease payments logic
  const allPaymentRows = generatePaymentRows(lease);

  // Constants
  const ALLOCATION_TO_LEASE_COMPONENT = 1;
  const OTHER = 0;
  const PARKING = 0;
  const PAYMENT_TIMING = 'Beginning';

  // Get first date for the header
  const firstDate = allPaymentRows[0]?.paymentDate;
  const formattedFirstDate = firstDate ? formatDate(firstDate) : '';

  // Calculate lease component values for PV calculation
  const leaseComponentValues = allPaymentRows.map(row => {
    const baseRent = row.amount;
    const totalCashFlows = baseRent + OTHER + PARKING;
    return totalCashFlows * ALLOCATION_TO_LEASE_COMPONENT;
  });

  // Calculate Present Value
  const borrowingRate = parseFloat(lease.borrowingRate) / 100;
  const monthlyRate = borrowingRate / 12;
  const presentValue = calculatePresentValue(leaseComponentValues, monthlyRate, PAYMENT_TIMING);

  // Generate cash flows table
  const cashFlowRows = generateCashFlowsOfFutureLeasePayment(
    allPaymentRows,
    OTHER,
    PARKING,
    ALLOCATION_TO_LEASE_COMPONENT
  );

  // Generate right of use asset table
  const rightOfUseAssetRows = generateRightOfUseAsset(
    allPaymentRows,
    presentValue,
    cashFlowRows
  );

  // Generate lease liability table
  const leaseLiabilityRows = generateLeaseLiability(
    allPaymentRows,
    presentValue,
    cashFlowRows,
    borrowingRate,
    PAYMENT_TIMING
  );

  // Build the data array with header
  const data: any[][] = [
    [lease.propertyAddress],
    [`Present Value at ${formattedFirstDate}:`, presentValue],
    ['Rate:', `${lease.borrowingRate}%`],
    ['Payments made at beginning or end of period:', PAYMENT_TIMING],
    ['Allocation to Lease Component:', ALLOCATION_TO_LEASE_COMPONENT],
    [],
    ['Cash Flows of Future Lease Payment', '', '', '', '', '', '', 'Right of Use Asset', '', '', '', '', '', 'Lease Liability'],
    [],
    ['Payment Date', 'Base Rent', 'Other', 'Parking', 'Total Cash Flows', 'Lease Component', '', 'Date', 'Period', 'Asset - Beginning', 'Depreciation', 'Asset - Ending', '', 'Period', 'Liability - Beginning', 'Payment', 'Interest Expense', 'Liability - Ending']
  ];

  // Add data rows (all three tables side by side)
  for (let i = 0; i < Math.max(cashFlowRows.length, rightOfUseAssetRows.length, leaseLiabilityRows.length); i++) {
    const row: any[] = [];

    // Cash flow columns
    if (i < cashFlowRows.length) {
      const cf = cashFlowRows[i];
      row.push(cf.paymentDate, cf.baseRent, cf.other, cf.parking, cf.totalCashFlows, cf.leaseComponent);
    } else {
      row.push('', '', '', '', '', '');
    }

    // Empty column separator
    row.push('');

    // Right of use asset columns
    if (i < rightOfUseAssetRows.length) {
      const rua = rightOfUseAssetRows[i];
      row.push(rua.date, rua.period, rua.assetBeginning, rua.depreciation, rua.assetEnding);
    } else {
      row.push('', '', '', '', '');
    }

    // Empty column separator
    row.push('');

    // Lease liability columns
    if (i < leaseLiabilityRows.length) {
      const ll = leaseLiabilityRows[i];
      row.push(ll.period, ll.liabilityBeginning, ll.payment, ll.interestExpense, ll.liabilityEnding);
    } else {
      row.push('', '', '', '', '');
    }

    data.push(row);
  }

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Format the worksheet
  formatPVWorksheet(worksheet, cashFlowRows.length, rightOfUseAssetRows.length, leaseLiabilityRows.length);

  return worksheet;
};

const generateCashFlowsOfFutureLeasePayment = (
  filteredRows: PaymentRow[],
  other: number,
  parking: number,
  allocationToLeaseComponent: number
): CashFlowRow[] => {
  return filteredRows.map(row => {
    const baseRent = row.amount;
    const totalCashFlows = baseRent + other + parking;
    const leaseComponent = totalCashFlows * allocationToLeaseComponent;

    return {
      paymentDate: new Date(row.paymentDate),
      baseRent,
      other: '-',
      parking: '-',
      totalCashFlows,
      leaseComponent
    };
  });
};

const generateRightOfUseAsset = (
  filteredRows: PaymentRow[],
  presentValue: number,
  cashFlowRows: CashFlowRow[]
): RightOfUseAssetRow[] => {
  const rows: RightOfUseAssetRow[] = [];

  // Count non-zero base rent rows for depreciation calculation
  const nonZeroBaseRentCount = cashFlowRows.filter(cf => cf.baseRent > 0).length;

  let previousDepreciation = 0;

  filteredRows.forEach((row, index) => {
    const period = index + 1;

    // Asset Beginning: first row is present value, subsequent rows are previous asset ending
    const assetBeginning = index === 0
      ? presentValue
      : rows[index - 1].assetEnding;

    // Calculate Depreciation (negative value)
    let depreciation: number;
    if (index === 0) {
      // First row: -J10/COUNTIF($B$10:$B$179,">0")
      depreciation = (-assetBeginning / nonZeroBaseRentCount);
    } else {
      // Subsequent rows: IF(I11>=COUNTIF($B$10:$B$179,">0"),-L10,$K$10)
      if (period >= nonZeroBaseRentCount) {
        depreciation = (-rows[index - 1].assetEnding);
      } else {
        depreciation = previousDepreciation;
      }
    }

    previousDepreciation = depreciation;

    // Asset Ending: Asset Beginning + Depreciation (depreciation is negative)
    const assetEnding = assetBeginning + depreciation;

    rows.push({
      date: formatDateShort(row.paymentDate),
      period,
      assetBeginning,
      depreciation,
      assetEnding
    });
  });

  return rows;
};

const generateLeaseLiability = (
  filteredRows: PaymentRow[],
  presentValue: number,
  cashFlowRows: CashFlowRow[],
  borrowingRate: number,
  paymentTiming: string
): LeaseLiabilityRow[] => {
  const rows: LeaseLiabilityRow[] = [];

  filteredRows.forEach((row, index) => {
    const period = formatDateShort(row.paymentDate);

    // Liability Beginning: first row is present value, subsequent rows are previous liability ending
    const liabilityBeginning = index === 0
      ? presentValue
      : rows[index - 1].liabilityEnding;

    // Payment: Total Cash Flows from corresponding row (negative value)
    const payment = (-cashFlowRows[index].totalCashFlows);

    // Interest Expense: IF($F$4="Beginning",SUM(O10:P10)*$F$3/12,O10*$F$3/12)
    let interestExpense: number;
    if (paymentTiming === 'Beginning') {
      interestExpense = (liabilityBeginning + payment) * borrowingRate / 12;
    } else {
      interestExpense = (liabilityBeginning * borrowingRate) / 12;
    }

    // Liability Ending: Liability Beginning + Payment + Interest Expense (payment is negative)
    const liabilityEnding = liabilityBeginning + payment + interestExpense;

    rows.push({
      period,
      liabilityBeginning,
      payment,
      interestExpense,
      liabilityEnding
    });
  });

  return rows;
};

const calculatePresentValue = (
  cashFlows: number[],
  monthlyRate: number,
  paymentTiming: string
): number => {
  let npv = 0;

  if (paymentTiming === 'Beginning') {
    // First payment is at time 0 (not discounted)
    npv = cashFlows[0];
    // Remaining payments discounted from period 1 onwards
    for (let i = 1; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + monthlyRate, i);
    }
  } else {
    // All payments discounted from period 1 onwards
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + monthlyRate, i + 1);
    }
  }

  return Math.round(npv * 100) / 100;
};

const formatDate = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const formatDateShort = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${month}-${year}`;
};

const formatPVWorksheet = (worksheet: XLSX.WorkSheet, cashFlowRowCount: number, assetRowCount: number, liabilityRowCount: number) => {
  // Set column widths
  worksheet['!cols'] = [
    { wch: 40 },  // Column A (Property Address / Payment Date)
    { wch: 15 },  // Column B (PV Value / Base Rent)
    { wch: 10 },  // Column C (Other)
    { wch: 10 },  // Column D (Parking)
    { wch: 15 },  // Column E (Total Cash Flows)
    { wch: 17 },  // Column F (Lease Component)
    { wch: 6 },   // Column G (Separator)
    { wch: 16 },  // Column H (Date)
    { wch: 10 },  // Column I (Period)
    { wch: 17 },  // Column J (Asset - Beginning)
    { wch: 15 },  // Column K (Depreciation)
    { wch: 17 },  // Column L (Asset - Ending)
    { wch: 6 },   // Column M (Separator)
    { wch: 12 },  // Column N (Period)
    { wch: 17 },  // Column O (Liability - Beginning)
    { wch: 15 },  // Column P (Payment)
    { wch: 17 },  // Column Q (Interest Expense)
    { wch: 17 }   // Column R (Liability - Ending)
  ];

  // Format Present Value in header (row 1, column B - cell B2)
  const pvCell = XLSX.utils.encode_cell({ r: 1, c: 1 });
  if (worksheet[pvCell] && typeof worksheet[pvCell].v === 'number') {
    worksheet[pvCell].z = '#,##0.00';
  }

  const dataStartRow = 9;

  // Format dates in column A (Payment Date)
  for (let row = dataStartRow; row < dataStartRow + cashFlowRowCount; row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].z = 'dd/mm/yyyy';
    }
  }

  // Format currency columns in Cash Flows table (Base Rent, Total Cash Flows, Lease Component)
  const cashFlowCurrencyColumns = [1, 4, 5]; // B, E, F
  for (let row = dataStartRow; row < dataStartRow + cashFlowRowCount; row++) {
    cashFlowCurrencyColumns.forEach(col => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (worksheet[cellAddress] && typeof worksheet[cellAddress].v === 'number') {
        worksheet[cellAddress].z = '#,##0.00';
      }
    });
  }

  // Format currency columns in Right of Use Asset table
  // Asset - Beginning, Depreciation, and Asset - Ending with standard currency format
  const assetCurrencyColumns = [9, 10, 11]; // J, K, L
  for (let row = dataStartRow; row < dataStartRow + assetRowCount; row++) {
    assetCurrencyColumns.forEach(col => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (worksheet[cellAddress] && typeof worksheet[cellAddress].v === 'number') {
        worksheet[cellAddress].z = '#,##0.00';
      }
    });
  }

  // Format currency columns in Lease Liability table
  // All columns with standard currency format
  const liabilityCurrencyColumns = [14, 15, 16, 17]; // O, P, Q, R
  for (let row = dataStartRow; row < dataStartRow + liabilityRowCount; row++) {
    liabilityCurrencyColumns.forEach(col => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (worksheet[cellAddress] && typeof worksheet[cellAddress].v === 'number') {
        worksheet[cellAddress].z = '#,##0.00';
      }
    });
  }
};
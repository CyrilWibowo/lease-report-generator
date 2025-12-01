import * as XLSX from 'xlsx';
import { MotorVehicleLease } from '../types/Lease';
import { XLSXGenerationParams } from '../components/ToXLSXModal';
import { PaymentRow, calculateXNPV } from './excelHelper';
import { formatWorksheet } from './styleExcel';
import { formatCurrency2 } from './helper';
import { generatePVCalculation } from './PVCalculationSheetGenerator';

export const generateExcelFromMotorVehicleLeases = (lease: MotorVehicleLease, params: XLSXGenerationParams) => {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, generateMotorVehicleLeasePayments(lease), "Lease Payments");
  XLSX.utils.book_append_sheet(workbook, generateMotorVehiclePVCalculation(lease, params), "PV Calculation");

  XLSX.writeFile(workbook, `${lease.description}_${lease.regoNo}.xlsx`);
};

export const generateMotorVehicleLeasePayments = (lease: MotorVehicleLease): XLSX.WorkSheet => {
  const rows = generateMotorVehiclePaymentRows(lease);

  // Calculate values for header
  const originalAnnualRent = parseFloat(lease.annualRent);
  const originalMonthlyPayment = Math.round((originalAnnualRent / 12) * 100) / 100;
  const xnpv = calculateXNPV(lease, rows);

  // Create data array for worksheet with header section
  const data: any[][] = [
    ['Description:', lease.description],
    ['VIN/Serial No.:', lease.vinSerialNo],
    ['Rego No.:', lease.regoNo],
    ['Delivery Date:', lease.deliveryDate],
    ['Expiry Date:', lease.expiryDate],
    ['Original Annual Rent:', formatCurrency2(originalAnnualRent)],
    ['Original Monthly Payment:', formatCurrency2(originalMonthlyPayment)],
    [],
    ['Borrowing Rate:', `${lease.borrowingRate}%`],
    ['NPV:', formatCurrency2(xnpv)],
    [],
    [],
    ['Payment', 'Lease Year', 'Payment Date', 'Amount', 'Note']
  ];

  rows.forEach((row, i) => {
    data.push([row.payment, row.leaseYear, row.paymentDate, row.amount, row.note]);
  });

  // Add total row
  data.push([]);
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  data.push(['', '', 'TOTAL:', totalAmount, '']);

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  formatWorksheet(worksheet, rows);

  return worksheet;
};

export const generateMotorVehiclePaymentRows = (lease: MotorVehicleLease): PaymentRow[] => {
  const rows: PaymentRow[] = [];

  const deliveryDate = new Date(lease.deliveryDate);
  const expiryDate = new Date(lease.expiryDate);

  const originalMonthlyPayment = Math.round((parseFloat(lease.annualRent) / 12) * 100) / 100;
  let currentAmount = originalMonthlyPayment;
  let currentDate = new Date(deliveryDate);

  let paymentCounter = 1;
  let leaseYear = 1;
  let monthsInCurrentYear = 0;

  while (currentDate < expiryDate) {
    // Check if we're starting a new lease year (every 12 months)
    if (monthsInCurrentYear === 12) {
      leaseYear++;
      monthsInCurrentYear = 0;
    }

    rows.push({
      payment: paymentCounter,
      leaseYear: leaseYear,
      paymentDate: new Date(currentDate),
      amount: currentAmount,
      note: '' // No increment methods for motor vehicles
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    paymentCounter++;
    monthsInCurrentYear++;
  }

  return rows;
};

export const generateMotorVehiclePVCalculation = (lease: MotorVehicleLease, params: XLSXGenerationParams): XLSX.WorkSheet => {
  // Convert MotorVehicleLease to PropertyLease-like structure for reusing the PV calculation logic
  const tempLease = {
    ...lease,
    type: 'Property' as const,
    propertyAddress: `${lease.description} - ${lease.regoNo}`,
    commencementDate: lease.deliveryDate,
    expiryDate: lease.expiryDate,
    options: '0',
    fixedIncrementRate: '0',
    rbaCpiRate: '0'
  };

  // Generate the standard PV calculation worksheet
  const worksheet = generatePVCalculation(tempLease, params);

  // Update the header to be motor vehicle specific
  const headerData: any[][] = [
    [`${lease.description} - ${lease.regoNo}`],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    [],
    ['Cash Flows of Future Lease Payment', '', '', '', '', '', '', 'Right of Use Asset', '', '', '', '', '', 'Lease Liability', '', '', '', '', '', '', '']
  ];

  // Get the existing data from the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const existingData: any[][] = [];

  for (let R = 0; R <= range.e.r; R++) {
    const row: any[] = [];
    for (let C = 0; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      row.push(cell ? cell.v : '');
    }
    existingData.push(row);
  }

  // Replace first few rows with motor vehicle header
  existingData[0] = [`${lease.description} - ${lease.regoNo}`];

  // Get the present value from row 1 (index 1)
  const presentValue = existingData[1][1];

  existingData[1] = ['Description:', lease.description];
  existingData[2] = ['VIN/Serial No.:', lease.vinSerialNo];
  existingData[3] = ['Rego No.:', lease.regoNo];
  existingData[4] = [`Present Value:`, presentValue];
  existingData[5] = ['Rate:', `${lease.borrowingRate}%`];
  existingData[6] = ['Payments made at beginning or end of period:', params.paymentTiming];
  existingData[7] = ['Allocation to Lease Component:', params.allocationToLeaseComponent];

  // Create new worksheet with updated data
  const newWorksheet = XLSX.utils.aoa_to_sheet(existingData);

  // Copy over the column widths and formatting
  newWorksheet['!cols'] = worksheet['!cols'];

  // Copy over cell formatting
  for (let R = 0; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (worksheet[cellAddress] && newWorksheet[cellAddress]) {
        newWorksheet[cellAddress].z = worksheet[cellAddress].z;
        newWorksheet[cellAddress].t = worksheet[cellAddress].t;
      }
    }
  }

  return newWorksheet;
};
import * as XLSX from 'xlsx';
import { Lease } from '../types/Lease';
import { formatWorksheet } from './styleExcel';
import { PaymentRow } from './excelHelper';
import { generatePaymentRows } from './excelHelper';

export const generateExcelFromLeases = (lease: Lease) => {
  const workbook = XLSX.utils.book_new();
  const rows = generatePaymentRows(lease);
  const worksheet = createWorksheet(lease, rows);
  let fileName = "output.xlsx";

  if (lease.propertyAddress) {
    fileName = `${lease.propertyAddress}.xlsx`
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, "Lease Payements");
  XLSX.writeFile(workbook, fileName);
};

const createWorksheet = (lease: Lease, rows: PaymentRow[]): XLSX.WorkSheet => {
  // Create data array for worksheet
  const data: any[][] = [
    ['Payment', 'Lease Year', 'Payment Date', 'Amount', 'Note']
  ];

  const firstDate = rows[0].paymentDate;
  const rate = parseFloat(lease.borrowingRate) / 100;
  let xnpv = 0;

  rows.forEach((row, i) => {
    data.push([
      row.payment,
      row.leaseYear,
      row.paymentDate,
      row.amount,
      row.note
    ]);

    const daysDiff = (Date.UTC(row.paymentDate.getFullYear(), row.paymentDate.getMonth(), row.paymentDate.getDate()) -
                  Date.UTC(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate())) /
                 (1000 * 60 * 60 * 24);
    const yearsDiff = daysDiff / 365;
    xnpv += row.amount / Math.pow(1 + rate, yearsDiff);
  });

  // Add total row
  data.push([]);
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  data.push(['', '', 'TOTAL:', totalAmount, '']);

  // Add npv row
  data.push(['', '', 'NPV:', xnpv, '']);

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  formatWorksheet(worksheet, rows);


  return worksheet;
};
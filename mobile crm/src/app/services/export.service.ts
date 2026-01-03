import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Purchase, Sale, Expense } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  exportPurchases(purchases: Purchase[]) {
    const doc = new jsPDF();
    doc.text('Purchase Management Report', 14, 20);

    const tableData = purchases.map(p => [
      p.date,
      p.supplier,
      `${p.deviceBrand} ${p.deviceModel || ''}`,
      p.partName,
      p.unitPrice,
      p.totalAmount
    ]);

    autoTable(doc, {
      head: [['Date', 'Supplier', 'Device', 'Part', 'Cost', 'Total']],
      body: tableData,
      startY: 30
    });

    doc.save(`Purchases_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  exportSales(sales: Sale[]) {
    const doc = new jsPDF();
    doc.text('Sales Management Report', 14, 20);

    const tableData = sales.map(s => [
      s.date,
      s.customer,
      `${s.deviceBrand} ${s.deviceModel || ''}`,
      s.partName,
      s.totalAmount,
      s.profit
    ]);

    autoTable(doc, {
      head: [['Date', 'Customer', 'Device', 'Part', 'Price', 'Profit']],
      body: tableData,
      startY: 30
    });

    doc.save(`Sales_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  exportExpenses(expenses: Expense[]) {
    const doc = new jsPDF();
    doc.text('Expense Management Report', 14, 20);

    const tableData = expenses.map(e => [
      e.date,
      e.category,
      e.description,
      e.vendor || '-',
      e.amount
    ]);

    autoTable(doc, {
      head: [['Date', 'Category', 'Description', 'Vendor', 'Amount']],
      body: tableData,
      startY: 30
    });

    doc.save(`Expenses_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}

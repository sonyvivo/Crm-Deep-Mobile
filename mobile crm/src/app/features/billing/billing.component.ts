import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Customer, Invoice, InvoiceItem } from '../../models';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

import { DEVICE_BRANDS, MOBILE_MODELS, REPAIR_PROBLEMS, SPARE_PARTS } from '../../core/constants/mobile-data';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent], // Used in template
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingComponent implements OnInit, OnDestroy {
  private sub: Subscription = new Subscription();
  invoices: Invoice[] = [];
  customers: Customer[] = [];

  // UI State
  viewMode: string = 'list';
  showCustomerResults = false;
  isConfirmOpen = false;
  invoiceToDeleteId = '';

  // Search
  customerSearchTerm = '';
  filteredCustomers: Customer[] = [];

  // Editing Object
  currentInvoice: Invoice = this.getEmptyInvoice();

  // Device Dropdown Options (Ported from HTML)
  deviceTypes = ['iPhone Repair', 'Android Repair', 'Windows Laptop', 'MacBook Repair', 'iPad Repair', 'Accessories'];
  deviceBrands = DEVICE_BRANDS;
  mobileModels = MOBILE_MODELS;
  repairProblems = REPAIR_PROBLEMS;
  spareParts = SPARE_PARTS; // Added

  // Common Services for Dropdown
  commonServices = [
    'Screen Replacement',
    'Battery Replacement',
    'Charging Port Repair',
    'Charging Jack Replacement',
    'Software Flashing / Unlocking',
    'Water Damage Repair',
    'Motherboard Repair',
    'Speaker / Ringer Replacement',
    'Mic Replacement',
    'Camera Glass Replacement',
    'Back Glass Replacement',
    'Display Flex Bonding',
    'Tempered Glass',
    'Mobile Cover / Case',
    'Data Recovery',
    'System Update'
  ];

  // Search & Filter
  searchQuery = '';
  filterStatus = 'All Statuses';
  filteredInvoices: Invoice[] = [];
  paymentStatuses = ['All Statuses', 'Cash', 'Google Pay', 'PhonePe', 'Paytm', 'Card', 'Pending', 'Partially Paid'];

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.sub.add(this.dataService.invoices$.subscribe((data: Invoice[]) => {
      this.invoices = data;
      this.applyFilter();
    }));
    this.sub.add(this.dataService.customers$.subscribe((data: Customer[]) => this.customers = data));

    // Init ID and Date
    this.generateInvoiceNumber();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    this.currentInvoice.date = `${year}-${month}-${day}T${hours}:${mins}`;
  }

  ngOnInit() {
    // Check for action=new query param to auto-open new invoice
    this.sub.add(this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openNewInvoice();
        // Clear the query param after handling
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
      // Handle customer data for quick action from Customers page
      if (params['customerName'] || params['customerMobile']) {
        this.openNewInvoice();
        this.currentInvoice.customerName = params['customerName'] || '';
        this.currentInvoice.customerMobile = params['customerMobile'] || '';
        this.currentInvoice.customerAddress = params['customerAddress'] || '';
        // Clear the query params after handling
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
    }));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  getEmptyInvoice(): Invoice {
    return {
      id: '',
      date: '',
      customerName: '',
      customerMobile: '',
      customerAddress: '',
      deviceType: '',
      deviceBrand: '',
      deviceModel: '',
      deviceImei: '',
      deviceIssues: '',
      deviceAccessories: '',
      items: [],
      subtotal: 0,
      taxPercent: 0,
      discount: 0,
      totalAmount: 0,
      paymentStatus: 'Cash',
      amountPaid: 0,
      balanceDue: 0,
      warrantyInfo: 'Screen replacement has 3 months warranty. Other repairs have 1 month warranty.',
      technicianNotes: ''
    };
  }

  generateInvoiceNumber() {
    try {
      const year = new Date().getFullYear();
      let max = 0;
      if (this.invoices && Array.isArray(this.invoices)) {
        this.invoices.forEach(inv => {
          if (inv && inv.id && inv.id.includes(`INV-${year}-`)) {
            const parts = inv.id.split('-');
            if (parts.length >= 3) {
              const num = parseInt(parts[2]);
              if (!isNaN(num) && num > max) max = num;
            }
          }
        });
      }
      this.currentInvoice.id = `INV-${year}-${(max + 1).toString().padStart(4, '0')}`;
    } catch (e) {
      console.error('Error generating invoice number', e);
      // Fallback
      this.currentInvoice.id = `INV-${new Date().getTime()}`;
    }
  }

  // --- Customer Search ---
  onCustomerSearch() {
    if (!this.customerSearchTerm || this.customerSearchTerm.length < 2) {
      this.showCustomerResults = false;
      return;
    }
    try {
      const term = this.customerSearchTerm.toLowerCase();
      this.filteredCustomers = this.customers.filter(c =>
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.mobile && c.mobile.includes(term))
      );
      this.showCustomerResults = this.filteredCustomers.length > 0;
    } catch (e) {
      console.error('Search Error', e);
    }
  }

  // ... (selectCustomer skipped as it looks safe)

  // --- Items Management ---
  // ...

  // --- Actions ---

  setView(mode: string) {
    console.log('Setting view to:', mode);
    this.viewMode = mode;
  }

  openNewInvoice() {
    console.log('Opening New Invoice Clicked');
    try {
      this.resetForm();
      this.setView('form');
    } catch (e) {
      console.error('Error opening new invoice', e);
      alert('Error opening invoice: ' + e);
    }
  }

  selectCustomer(cust: Customer) {
    this.currentInvoice.customerName = cust.name;
    this.currentInvoice.customerMobile = cust.mobile || '';
    if (cust.address) this.currentInvoice.customerAddress = cust.address;

    this.customerSearchTerm = '';
    this.showCustomerResults = false;
  }

  // --- Items Management ---
  addItem() {
    this.currentInvoice.items.push({
      type: 'service',
      description: '',
      quantity: 1,
      price: 0,
      warranty: 'No Warranty',
      total: 0
    });
  }

  removeItem(index: number) {
    this.currentInvoice.items.splice(index, 1);
    this.calculateTotals();
  }

  // --- Calculations ---
  calculateRowTotal(item: InvoiceItem) {
    item.total = (item.quantity || 0) * (item.price || 0);
    this.calculateTotals();
  }

  calculateTotals() {
    this.currentInvoice.subtotal = this.currentInvoice.items.reduce((sum: number, item: InvoiceItem) => sum + item.total, 0);

    const taxAmount = this.currentInvoice.subtotal * (this.currentInvoice.taxPercent / 100);
    const total = this.currentInvoice.subtotal + taxAmount - this.currentInvoice.discount;

    this.currentInvoice.totalAmount = Math.max(0, total); // Ensure not negative
    this.calculateBalance();
  }

  calculateBalance() {
    if (this.currentInvoice.paymentStatus !== 'Pending') {
      this.currentInvoice.amountPaid = this.currentInvoice.totalAmount;
    }
    this.currentInvoice.balanceDue = this.currentInvoice.totalAmount - this.currentInvoice.amountPaid;
  }

  onPaymentStatusChange() {
    if (this.currentInvoice.paymentStatus !== 'Pending') {
      this.currentInvoice.amountPaid = this.currentInvoice.totalAmount;
    } else {
      this.currentInvoice.amountPaid = 0;
    }
    this.calculateBalance();
  }



  editInvoice(inv: Invoice) {
    this.currentInvoice = JSON.parse(JSON.stringify(inv)); // Deep copy
    this.setView('form');
  }

  togglePreview() {
    if (this.viewMode === 'form') {
      this.setView('preview');
    } else {
      this.setView('form');
    }
  }

  saveInvoice() {
    if (this.currentInvoice.customerMobile && !/^\d{10}$/.test(this.currentInvoice.customerMobile)) {
      alert('Mobile Number must be 10 digits.');
      return;
    }
    // Basic Validation
    if (!this.currentInvoice.customerName || !this.currentInvoice.items.length) {
      alert('Please fill Customer Name and at least one Item.');
      return;
    }

    // Check if existing ID - handled by data service logic usually, 
    // but here we manually set ID. If ID exists in list, update.
    const exists = this.invoices.find(i => i.id === this.currentInvoice.id);
    if (exists) {
      this.dataService.updateInvoice(this.currentInvoice);
    } else {
      this.dataService.addInvoice(this.currentInvoice);
    }

    alert('Invoice Saved Successfully!');
    this.setView('list');
    this.resetForm();
  }

  deleteInvoice(id: string) {
    this.invoiceToDeleteId = id;
    this.isConfirmOpen = true;
  }

  confirmDelete() {
    if (this.invoiceToDeleteId) {
      this.dataService.deleteInvoice(this.invoiceToDeleteId);
      this.invoiceToDeleteId = '';
    }
    this.isConfirmOpen = false;
  }

  resetForm() {
    this.currentInvoice = this.getEmptyInvoice();
    this.generateInvoiceNumber();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    this.currentInvoice.date = `${year}-${month}-${day}T${hours}:${mins}`;
    this.customerSearchTerm = '';
  }

  printInvoice() {
    window.print();
  }

  printInvoiceDirect(inv: Invoice) {
    this.currentInvoice = JSON.parse(JSON.stringify(inv)); // Deep copy to fill preview
    this.viewMode = 'preview'; // Switch to preview
    // Small timeout to allow view to render before printing
    setTimeout(() => {
      window.print();
    }, 500);
  }

  shareOnWhatsApp(inv: Invoice) {
    const shopName = "DeepMobile Repairing";
    const total = inv.totalAmount;
    const date = new Date(inv.date).toLocaleDateString();

    let message = `*INVOICE from ${shopName}*\n\n`;
    message += `Invoice No: ${inv.id}\n`;
    message += `Date: ${date}\n`;
    message += `Customer: ${inv.customerName}\n`;
    message += `------------------------\n`;
    inv.items.forEach((item: InvoiceItem) => {
      message += `${item.description} x ${item.quantity} = ₹${item.total}\n`;
    });
    message += `------------------------\n`;
    message += `*Total Amount: ₹${total}*\n`;
    message += `Balance Due: ₹${inv.balanceDue}\n\n`;
    message += `Thank you for your business!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${inv.customerMobile}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  }

  downloadPdf() {
    // Placeholder
    alert('PDF Download not yet implemented. Use Print -> Save as PDF.');
  }

  applyFilter() {
    this.filteredInvoices = this.invoices.filter(inv => {
      const q = this.searchQuery.toLowerCase();
      const matchesSearch = !this.searchQuery ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
        (inv.customerMobile && inv.customerMobile.includes(q)) ||
        (inv.id && inv.id.toLowerCase().includes(q));

      const matchesStatus = this.filterStatus === 'All Statuses' || inv.paymentStatus === this.filterStatus;

      return matchesSearch && matchesStatus;
    });
    // Sort by Date Descending
    this.filteredInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  resetFilters() {
    this.searchQuery = '';
    this.filterStatus = 'All Statuses';
    this.applyFilter();
  }
}

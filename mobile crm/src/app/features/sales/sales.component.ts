import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ExportService } from '../../services/export.service';
import { AuthService } from '../../services/auth.service';
import { Sale, Customer } from '../../models';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subscription } from 'rxjs';
import { REPAIR_PROBLEMS, DEVICE_BRANDS, SPARE_PARTS, MOBILE_MODELS } from '../../core/constants/mobile-data';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit, OnDestroy {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  customers: Customer[] = [];
  privacyMode = true;

  // Filters
  selectedYear = new Date().getFullYear();
  selectedMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  filterMonth = `${this.selectedYear}-${this.selectedMonth}`;

  filterStatus = ''; // Added
  filterDateFrom = '';
  filterDateTo = '';
  filterCustomer = '';

  // Dropdown Options
  months = [
    { value: '01', name: 'January' },
    { value: '02', name: 'February' },
    { value: '03', name: 'March' },
    { value: '04', name: 'April' },
    { value: '05', name: 'May' },
    { value: '06', name: 'June' },
    { value: '07', name: 'July' },
    { value: '08', name: 'August' },
    { value: '09', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];

  repairProblems = REPAIR_PROBLEMS;
  deviceBrands = DEVICE_BRANDS;
  spareParts = SPARE_PARTS;
  mobileModels = MOBILE_MODELS;

  years: number[] = [];

  // UI State
  viewMode: 'list' | 'form' = 'list';
  editingSale: Sale = this.getEmptySale();

  // Customer Search
  customerSearchTerm = '';
  filteredCustomers: Customer[] = [];
  showCustomerResults = false;

  // Confirm State
  isConfirmOpen = false;
  deleteId: string | null = null;

  private sub: Subscription = new Subscription();

  constructor(
    private dataService: DataService,
    private exportService: ExportService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Generate years dynamically (2024 to Current + 1)
    const currentYear = new Date().getFullYear();
    for (let y = 2024; y <= currentYear + 1; y++) {
      this.years.push(y);
    }
  }

  ngOnInit() {
    this.sub.add(this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.filterStatus = params['status'];
        this.resetFilters(true); // Keep status, reset others
      }
      // Check for action=new query param to auto-open new sale form
      if (params['action'] === 'new') {
        this.openNewSale();
        // Clear the query param after handling
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
      // Handle customer data for quick action from Customers page
      if (params['customerName'] || params['customerMobile']) {
        this.openNewSale();
        this.editingSale.customer = params['customerName'] || '';
        this.editingSale.customerMobile = params['customerMobile'] || '';
        // Clear the query params after handling
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
    }));

    this.sub.add(this.dataService.sales$.subscribe(data => {
      this.sales = data;
      this.applyFilters();
    }));
    this.sub.add(this.dataService.customers$.subscribe(data => this.customers = data));
    this.sub.add(this.authService.privacyMode$.subscribe(mode => this.privacyMode = mode));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  getEmptySale(): Sale {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return {
      id: '',
      date: `${year}-${month}-${day}`,
      customer: '',
      deviceBrand: '',
      partName: '',
      unitPrice: 0,
      purchaseCost: 0,
      profit: 0,
      totalAmount: 0,
      paymentMode: 'Cash'
    };
  }

  onFilterChange() {
    this.filterMonth = `${this.selectedYear}-${this.selectedMonth}`;
    this.applyFilters();
  }

  applyFilters() {
    let temp = [...this.sales];
    if (this.filterMonth) temp = temp.filter(s => s.date.startsWith(this.filterMonth));
    if (this.filterDateFrom) temp = temp.filter(s => s.date >= this.filterDateFrom);
    if (this.filterDateTo) temp = temp.filter(s => s.date <= this.filterDateTo);
    if (this.filterCustomer) temp = temp.filter(s => s.customer.toLowerCase().includes(this.filterCustomer.toLowerCase()));

    if (this.filterStatus) {
      if (this.filterStatus === 'Pending') temp = temp.filter(s => s.paymentMode === 'Pending');
      if (this.filterStatus === 'Paid') temp = temp.filter(s => s.paymentMode !== 'Pending');
      if (this.filterStatus === 'Cash') temp = temp.filter(s => s.paymentMode === 'Cash');
      if (this.filterStatus === 'Online') temp = temp.filter(s => s.paymentMode === 'Online');
    }

    // Sort Newest First
    temp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.filteredSales = temp;
  }

  resetFilters(keepStatus = false) {
    this.selectedYear = new Date().getFullYear();
    this.selectedMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

    if (!keepStatus) {
      this.filterStatus = '';
      this.onFilterChange(); // Resets month
    } else {
      // If keeping status (e.g. Pending), clear month so we see ALL pending, not just current month
      this.filterMonth = '';
    }

    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterCustomer = '';
    this.applyFilters();
  }

  filterByCustomer(name: string) {
    this.filterCustomer = name;
    this.filterMonth = ''; // Clear month to show full history
    this.applyFilters();
  }

  // --- Customer Search Logic ---
  onCustomerSearch() {
    if (this.customerSearchTerm.length < 2) {
      this.showCustomerResults = false;
      return;
    }
    const term = this.customerSearchTerm.toLowerCase();
    this.filteredCustomers = this.customers.filter(c =>
      c.name.toLowerCase().includes(term) || (c.mobile || '').includes(term)
    );
    this.showCustomerResults = this.filteredCustomers.length > 0;
  }

  selectCustomer(cust: Customer) {
    this.editingSale.customer = cust.name;
    this.editingSale.customerMobile = cust.mobile || '';
    // this.editingSale.customerAddress = cust.address; // Sale model might not have address, strictly name/mobile usually suffices

    this.customerSearchTerm = '';
    this.showCustomerResults = false;
  }

  // --- View Management ---
  openNewSale() {
    this.editingSale = this.getEmptySale();
    this.customerSearchTerm = '';
    this.viewMode = 'form';
  }

  editSale(s: Sale) {
    this.editingSale = JSON.parse(JSON.stringify(s));
    this.viewMode = 'form';
  }

  backToList() {
    this.viewMode = 'list';
  }

  calculateFinancials() {
    const price = Number(this.editingSale.unitPrice) || 0;
    const cost = Number(this.editingSale.purchaseCost) || 0;
    this.editingSale.totalAmount = price;
    this.editingSale.profit = price - cost;
  }

  saveSale() {
    if (this.editingSale.customerMobile && !/^\d{10}$/.test(this.editingSale.customerMobile)) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!this.editingSale.date || !this.editingSale.customer || !this.editingSale.partName) {
      alert('Please fill all required fields: Date, Customer, Part Name');
      return;
    }

    this.calculateFinancials();

    if (this.editingSale.id) {
      this.dataService.updateSale(this.editingSale);
    } else {
      this.dataService.addSale(this.editingSale);

      // Auto-add customer if new?
      // For now, let's assume loose coupling like original.
    }
    this.backToList();
  }

  deleteSale(id: string) {
    this.deleteId = id;
    this.isConfirmOpen = true;
  }

  confirmDelete() {
    if (this.deleteId) {
      this.dataService.deleteSale(this.deleteId);
      this.deleteId = null;
    }
    this.isConfirmOpen = false;
  }

  exportPDF() {
    this.exportService.exportSales(this.filteredSales);
  }

  formatCurrency(val: number | string, respectPrivacy = true) {
    if (respectPrivacy && this.privacyMode) {
      return '****';
    }
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    return '₹' + (numVal || 0).toFixed(2);
  }
}

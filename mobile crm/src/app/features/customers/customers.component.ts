import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Customer, Sale, JobSheet, Invoice } from '../../models';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  searchQuery = '';

  // View Mode
  viewMode: 'list' | 'detail' = 'list';
  selectedCustomer: Customer | null = null;

  // Related Records for Selected Customer
  customerSales: Sale[] = [];
  customerJobSheets: JobSheet[] = [];
  customerInvoices: Invoice[] = [];

  // All data references
  private allSales: Sale[] = [];
  private allJobSheets: JobSheet[] = [];
  private allInvoices: Invoice[] = [];

  // Modal State
  isModalOpen = false;
  editingCustomer: Customer = this.getEmptyCustomer();

  // Confirm State
  isConfirmOpen = false;
  deleteId: string | null = null;

  private sub: Subscription = new Subscription();

  constructor(private dataService: DataService, private router: Router) { }

  ngOnInit() {
    this.sub.add(this.dataService.customers$.subscribe(data => {
      this.customers = data;
      this.applyFilter();
    }));
    // Subscribe to all data for customer records
    this.sub.add(this.dataService.sales$.subscribe(data => this.allSales = data));
    this.sub.add(this.dataService.jobSheets$.subscribe(data => this.allJobSheets = data));
    this.sub.add(this.dataService.invoices$.subscribe(data => this.allInvoices = data));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  getEmptyCustomer(): Customer {
    return {
      id: '',
      name: '',
      mobile: '',
      address: '',
      notes: ''
    };
  }

  applyFilter() {
    if (!this.searchQuery) {
      this.filteredCustomers = [...this.customers].reverse(); // Show recent first
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredCustomers = this.customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.mobile && c.mobile.includes(q))
      );
    }
  }

  // View customer details with all related records
  viewCustomerDetails(customer: Customer) {
    this.selectedCustomer = customer;
    const customerName = customer.name?.toLowerCase().trim() || '';
    const customerMobile = customer.mobile?.trim() || '';

    // Find all sales for this customer
    // Match by both name AND mobile if mobile exists, otherwise just by name
    this.customerSales = this.allSales.filter(s => {
      const saleName = s.customer?.toLowerCase().trim() || '';
      const saleMobile = s.customerMobile?.trim() || '';

      // If customer has mobile, match by mobile (most reliable)
      if (customerMobile && saleMobile && customerMobile === saleMobile) {
        return true;
      }
      // Match by exact name if names are not empty
      if (customerName && saleName && customerName === saleName) {
        return true;
      }
      return false;
    });

    // Find all job sheets for this customer
    this.customerJobSheets = this.allJobSheets.filter(j => {
      const jobName = j.customerName?.toLowerCase().trim() || '';
      const jobMobile = j.customerMobile?.trim() || '';

      if (customerMobile && jobMobile && customerMobile === jobMobile) {
        return true;
      }
      if (customerName && jobName && customerName === jobName) {
        return true;
      }
      return false;
    });

    // Find all invoices for this customer
    this.customerInvoices = this.allInvoices.filter(i => {
      const invName = i.customerName?.toLowerCase().trim() || '';
      const invMobile = i.customerMobile?.trim() || '';

      if (customerMobile && invMobile && customerMobile === invMobile) {
        return true;
      }
      if (customerName && invName && customerName === invName) {
        return true;
      }
      return false;
    });

    this.viewMode = 'detail';
  }

  backToList() {
    this.viewMode = 'list';
    this.selectedCustomer = null;
  }

  openAddModal() {
    this.editingCustomer = this.getEmptyCustomer();
    this.isModalOpen = true;
  }

  openEditModal(c: Customer) {
    this.editingCustomer = JSON.parse(JSON.stringify(c));
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveCustomer() {
    if (this.editingCustomer.mobile && !/^\d{10}$/.test(this.editingCustomer.mobile)) {
      alert('Mobile Number must be 10 digits.');
      return;
    }
    if (!this.editingCustomer.name) return;

    if (this.editingCustomer.id) {
      this.dataService.updateCustomer(this.editingCustomer);
    } else {
      this.dataService.addCustomer(this.editingCustomer);
    }
    this.closeModal();
  }

  deleteCustomer(id: string) {
    this.deleteId = id;
    this.isConfirmOpen = true;
  }

  confirmDelete() {
    if (this.deleteId) {
      this.dataService.deleteCustomer(this.deleteId);
      this.deleteId = null;
    }
    this.isConfirmOpen = false;
  }

  // Helper to get status color
  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Pending': 'badge-warning',
      'Diagnosing': 'badge-info',
      'Waiting for Approval': 'badge-secondary',
      'Ready': 'badge-success',
      'Delivered': 'badge-primary',
      'Cancelled': 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  }

  // Quick Actions - Navigate to create new records for this customer
  addNewSale(customer: Customer) {
    // Navigate to Sales page with customer data
    this.router.navigate(['/sales'], {
      queryParams: {
        customerName: customer.name,
        customerMobile: customer.mobile
      }
    });
  }

  addNewInvoice(customer: Customer) {
    // Navigate to Billing page with customer data
    this.router.navigate(['/billing'], {
      queryParams: {
        customerName: customer.name,
        customerMobile: customer.mobile,
        customerAddress: customer.address
      }
    });
  }

  addNewJobSheet(customer: Customer) {
    // Navigate to Job Sheets page with customer data
    this.router.navigate(['/job-sheets'], {
      queryParams: {
        customerName: customer.name,
        customerMobile: customer.mobile,
        customerAddress: customer.address
      }
    });
  }
}


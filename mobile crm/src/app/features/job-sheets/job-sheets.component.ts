import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ExportService } from '../../services/export.service';
import { JobSheet, Customer } from '../../models';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

import { DEVICE_BRANDS, DEVICE_MODELS } from '../../shared/data/device-data';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-job-sheets',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './job-sheets.component.html',
  styleUrls: ['./job-sheets.component.css']
})
export class JobSheetsComponent implements OnInit, OnDestroy {
  private sub: Subscription = new Subscription();
  jobSheets: JobSheet[] = [];
  customers: Customer[] = [];
  filteredJobs: JobSheet[] = [];

  // Device Data
  brands = DEVICE_BRANDS;
  availableModels: string[] = [];

  // Customer Search
  customerSearchTerm = '';
  filteredCustomers: Customer[] = [];
  showCustomerResults = false;

  // Filter Variables
  filterStatus = '';
  filterSearch = '';

  // View State
  viewMode: 'list' | 'form' | 'preview' = 'list';
  isConfirmOpen = false;
  jobToDeleteMsId = '';
  printJobData: JobSheet | null = null;

  // Add Customer Modal
  isAddCustomerModalOpen = false;
  newCustomer: Customer = { id: '', name: '', mobile: '', address: '', notes: '' };

  // Pattern Lock Grid (3x3)
  patternPoints = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  activePattern: number[] = [];

  // Fault Options
  faultOptions = [
    'Display', 'Battery', 'Charging Port', 'Motherboard',
    'Software', 'Water Damage', 'Dead Set', 'Speaker',
    'Mic', 'Camera', 'Buttons', 'Network', 'Other'
  ];

  // Validation Errors State
  validationErrors: { [key: string]: boolean } = {};

  // Editing Object
  editingJob: JobSheet = this.getEmptyJob();

  constructor(
    private dataService: DataService,
    private exportService: ExportService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.sub.add(this.dataService.jobSheets$.subscribe(data => {
      this.jobSheets = data || [];
      this.applyFilters();
    }));
    this.sub.add(this.dataService.customers$.subscribe(data => this.customers = data || []));
  }

  ngOnInit() {
    // Check for action=new query param to auto-open add modal
    this.sub.add(this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openAddModal();
        // Clear the query param after handling
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
      // Handle customer data for quick action from Customers page
      if (params['customerName'] || params['customerMobile']) {
        this.openAddModal();
        this.editingJob.customerName = params['customerName'] || '';
        this.editingJob.customerMobile = params['customerMobile'] || '';
        this.editingJob.customerAddress = params['customerAddress'] || '';
        // Clear the query params after handling
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
    }));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  getEmptyJob(): JobSheet {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    return {
      id: '',
      date: `${year}-${month}-${day}T${hours}:${mins}`,
      status: 'Pending',
      customerName: '',
      customerMobile: '',
      serviceType: 'Walk-in',
      jobType: 'New',
      priority: 'Regular',
      deviceBrand: '',
      deviceModel: '',
      imei: '',
      faultCategory: [], // Multi-select array

      estimatedCost: 0,
      advancePayment: 0,
      pendingAmount: 0,
      createdAt: '',
      updatedAt: ''
    };
  }

  // --- Device Logic ---
  onBrandChange() {
    // Reset model if brand changes? Maybe not, just update list.
    // If brand is in our list, use its models. Else empty.
    const selectedBrand = this.editingJob.deviceBrand;
    if (DEVICE_MODELS[selectedBrand]) {
      this.availableModels = DEVICE_MODELS[selectedBrand];
    } else {
      this.availableModels = [];
    }
  }

  // --- Pattern Lock Logic ---
  togglePatternPoint(point: number) {
    if (this.activePattern.includes(point)) {
      // Remove if already selected (simple toggle) - or should it be sequential?
      // For simplicity in a CRM form, clicking points to sequence them is easier.
      // Let's go with: clicking adds to sequence. clicking again removes.
      this.activePattern = this.activePattern.filter(p => p !== point);
    } else {
      this.activePattern.push(point);
    }
    this.editingJob.lockCode = this.activePattern.join('-');
  }

  isPointActive(point: number): boolean {
    return this.activePattern.includes(point);
  }

  resetPattern() {
    this.activePattern = [];
    this.editingJob.lockCode = '';
  }

  // --- Fault Selection Logic ---
  toggleFault(fault: string) {
    const index = this.editingJob.faultCategory.indexOf(fault);
    if (index > -1) {
      this.editingJob.faultCategory.splice(index, 1);
    } else {
      this.editingJob.faultCategory.push(fault);
    }
  }

  isFaultSelected(fault: string): boolean {
    return this.editingJob.faultCategory.includes(fault);
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
    this.editingJob.customerName = cust.name;
    this.editingJob.customerMobile = cust.mobile || '';
    if (cust.address) this.editingJob.customerAddress = cust.address;
    if (cust.mobile) this.editingJob.customerAltMobile = ''; // Reset or keep? Usually reset or ignored.

    this.customerSearchTerm = '';
    this.showCustomerResults = false;
  }

  addNewCustomer() {
    this.newCustomer = { id: '', name: '', mobile: '', address: '', notes: '' };
    this.isAddCustomerModalOpen = true;
  }

  closeAddCustomerModal() {
    this.isAddCustomerModalOpen = false;
  }

  saveNewCustomer() {
    if (!this.newCustomer.name) {
      alert('Name is required');
      return;
    }
    if (this.newCustomer.mobile && !/^\d{10}$/.test(this.newCustomer.mobile)) {
      alert('Mobile number must be 10 digits');
      return;
    }

    // Check for duplicate mobile
    const exists = this.customers.find(c => c.mobile === this.newCustomer.mobile);
    if (exists) {
      alert('Customer with this mobile number already exists!');
      return;
    }

    this.dataService.addCustomer(this.newCustomer);

    // Select the newly created customer
    // The dataService updates customers$ which updates this.customers
    // We need to find the added customer. Since addCustomer generates ID if missing, let's find by mobile/name
    // Or simpler: just populate editingJob with the data we just entered

    this.editingJob.customerName = this.newCustomer.name;
    this.editingJob.customerMobile = this.newCustomer.mobile || '';
    this.editingJob.customerAddress = this.newCustomer.address || '';

    this.customerSearchTerm = '';
    this.showCustomerResults = false;
    this.isAddCustomerModalOpen = false;
  }

  // --- CRUD ---
  openAddModal() {
    this.editingJob = this.getEmptyJob();
    this.editingJob.date = new Date().toISOString().substring(0, 16); // DateTime-local format
    this.resetPattern();
    this.availableModels = []; // Reset models
    this.viewMode = 'form';
  }

  openEditModal(job: JobSheet) {
    this.editingJob = JSON.parse(JSON.stringify(job)); // Deep copy

    // Initialize models based on existing brand
    this.onBrandChange();

    // Legacy Support: Convert string fault to array if needed
    if (typeof this.editingJob.faultCategory === 'string') {
      const val = this.editingJob.faultCategory as string;
      this.editingJob.faultCategory = val ? [val] : [];
    }
    // Ensure it's an array (handling null/undefined)
    if (!Array.isArray(this.editingJob.faultCategory)) {
      this.editingJob.faultCategory = [];
    }

    // Parse pattern
    if (this.editingJob.lockType === 'Pattern' && this.editingJob.lockCode) {
      this.activePattern = this.editingJob.lockCode.split('-').map(Number);
    } else {
      this.resetPattern();
    }
    this.viewMode = 'form';
  }

  saveJob() {
    // Required Field Validation - Set validationErrors
    this.validationErrors = {};
    if (!this.editingJob.customerName?.trim()) this.validationErrors['customerName'] = true;
    if (!this.editingJob.customerMobile?.trim()) this.validationErrors['customerMobile'] = true;
    if (!this.editingJob.deviceBrand?.trim()) this.validationErrors['deviceBrand'] = true;
    if (!this.editingJob.deviceModel?.trim()) this.validationErrors['deviceModel'] = true;
    if (!this.editingJob.serviceType) this.validationErrors['serviceType'] = true;
    if (!this.editingJob.jobType) this.validationErrors['jobType'] = true;
    if (!this.editingJob.priority) this.validationErrors['priority'] = true;

    if (Object.keys(this.validationErrors).length > 0) {
      // Don't show alert, just highlight the fields
      return;
    }

    if (this.editingJob.customerMobile && !/^\d{10}$/.test(this.editingJob.customerMobile)) {
      alert('Mobile Number must be 10 digits.');
      return;
    }
    if (this.editingJob.customerAltMobile && !/^\d{10}$/.test(this.editingJob.customerAltMobile)) {
      alert('Alt. Mobile Number must be 10 digits.');
      return;
    }
    this.calculatePending();
    if (this.editingJob.lockType === 'Pattern') {
      this.editingJob.lockCode = this.activePattern.join('-');
    }

    if (this.editingJob.id && !this.editingJob.id.startsWith('DM-')) {
      // Existing but valid ID? Actually if it has ID it's an update
      // The generateID is handled in Service for new items (empty ID)
      this.dataService.updateJobSheet(this.editingJob);
    } else if (this.editingJob.id) {
      this.dataService.updateJobSheet(this.editingJob);
    } else {
      this.dataService.addJobSheet(this.editingJob);
    }
    this.viewMode = 'list';
  }

  updateJobStatus(job: JobSheet) {
    this.dataService.updateJobSheet(job);
  }

  saveAndPrint() {
    this.saveJob();
    // Wait a tick for ID generation if new
    setTimeout(() => {
      // Find the job we just saved (most recent)
      const latest = this.jobSheets[0];
      this.printJob(latest);
    }, 100);
  }

  saveAndWhatsApp() {
    this.saveJob();
    setTimeout(() => {
      const latest = this.jobSheets[0];
      this.sendWhatsApp(latest);
    }, 100);
  }

  deleteJob(id: string) {
    this.jobToDeleteMsId = id;
    this.isConfirmOpen = true;
  }

  confirmDelete() {
    if (this.jobToDeleteMsId) {
      this.dataService.deleteJobSheet(this.jobToDeleteMsId);
      this.jobToDeleteMsId = '';
      this.isConfirmOpen = false;
    }
  }

  closeModal() {
    this.viewMode = 'list';
  }

  // --- Calculations ---
  calculatePending() {
    this.editingJob.pendingAmount = this.editingJob.estimatedCost - this.editingJob.advancePayment;
  }

  printJob(job: JobSheet) {
    this.printJobData = job;
    this.viewMode = 'preview';
    // Small timeout to let view render then print
    setTimeout(() => {
      window.print();
    }, 500);
  }

  backToList() {
    this.viewMode = 'list';
    this.printJobData = null;
  }

  validateNumberInput(event: any) {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }
  }

  sendWhatsApp(job: JobSheet) {
    // Handle array of faults
    let faults = '';
    if (Array.isArray(job.faultCategory)) {
      faults = job.faultCategory.join(', ');
    } else {
      faults = job.faultCategory || '';
    }

    const dateStr = new Date(job.date).toLocaleDateString();

    // Format:
    // *Deep Mobile Repair*
    // Job Sheet: {id}
    // Customer: {name}
    // Date: {date}
    // Device: {brand} {model}
    // Problem: {faults}
    // Status: {status}

    const msg = `*Deep Mobile Repair*\nJob Sheet: ${job.id}\nCustomer: ${job.customerName}\nDate: ${dateStr}\nDevice: ${job.deviceBrand} ${job.deviceModel}\nProblem: ${faults}\nStatus: ${job.status}\nEst. Cost: ₹${job.estimatedCost}\n\nTrack your repair status with us.`;

    const url = `https://wa.me/91${job.customerMobile}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  // Navigate to Billing with job sheet data pre-filled
  createInvoiceFromJob(job: JobSheet) {
    // Handle array of faults
    let faults = '';
    if (Array.isArray(job.faultCategory)) {
      faults = job.faultCategory.join(', ');
    } else {
      faults = job.faultCategory || '';
    }

    this.router.navigate(['/billing'], {
      queryParams: {
        action: 'new',
        customerName: job.customerName,
        customerMobile: job.customerMobile,
        customerAddress: job.customerAddress || '',
        deviceBrand: job.deviceBrand,
        deviceModel: job.deviceModel,
        deviceImei: job.imei || '',
        deviceIssues: faults,
        jobSheetId: job.id
      }
    });
  }

  // --- Filtering ---
  applyFilters() {
    this.filteredJobs = this.jobSheets.filter(j => {
      const matchStatus = this.filterStatus ? j.status === this.filterStatus : true;
      const search = this.filterSearch.toLowerCase();
      const matchSearch = j.customerName?.toLowerCase().includes(search) ||
        j.customerMobile?.includes(search) ||
        j.id.toLowerCase().includes(search);
      return matchStatus && matchSearch;
    });
  }

  resetFilters() {
    this.filterStatus = '';
    this.filterSearch = '';
    this.applyFilters();
  }
}

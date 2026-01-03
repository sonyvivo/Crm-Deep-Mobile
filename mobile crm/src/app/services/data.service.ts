import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, firstValueFrom } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Purchase, Sale, Expense, Customer, JobSheet, Invoice } from '../models';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private apiUrl = environment.apiUrl;

  private purchasesSubject = new BehaviorSubject<Purchase[]>([]);
  private salesSubject = new BehaviorSubject<Sale[]>([]);
  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  private customersSubject = new BehaviorSubject<Customer[]>([]);
  private jobSheetsSubject = new BehaviorSubject<JobSheet[]>([]);
  private invoicesSubject = new BehaviorSubject<Invoice[]>([]);
  private suppliersSubject = new BehaviorSubject<string[]>([]);

  purchases$ = this.purchasesSubject.asObservable();
  sales$ = this.salesSubject.asObservable();
  expenses$ = this.expensesSubject.asObservable();
  customers$ = this.customersSubject.asObservable();
  jobSheets$ = this.jobSheetsSubject.asObservable();
  invoices$ = this.invoicesSubject.asObservable();
  suppliers$ = this.suppliersSubject.asObservable();

  private isDataLoaded = false;

  constructor(private http: HttpClient, private injector: Injector) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Load all data from API
  async loadAllData(): Promise<void> {
    if (this.isDataLoaded) return;

    try {
      const headers = this.getHeaders();

      // Load all data in parallel
      const [customers, suppliers, purchases, sales, expenses, jobSheets, invoices] = await Promise.all([
        firstValueFrom(this.http.get<ApiResponse<Customer[]>>(`${this.apiUrl}/customers`, { headers }).pipe(
          map(res => res.data || []), catchError(() => of([]))
        )),
        firstValueFrom(this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/suppliers`, { headers }).pipe(
          map(res => res.data || []), catchError(() => of([]))
        )),
        firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/purchases`, { headers }).pipe(
          map(res => this.mapPurchases(res.data || [])), catchError(() => of([]))
        )),
        firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/sales`, { headers }).pipe(
          map(res => this.mapSales(res.data || [])), catchError(() => of([]))
        )),
        firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/expenses`, { headers }).pipe(
          map(res => this.mapExpenses(res.data || [])), catchError(() => of([]))
        )),
        firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/jobsheets`, { headers }).pipe(
          map(res => this.mapJobSheets(res.data || [])), catchError(() => of([]))
        )),
        firstValueFrom(this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/invoices`, { headers }).pipe(
          map(res => this.mapInvoices(res.data || [])), catchError(() => of([]))
        ))
      ]);

      this.customersSubject.next(customers);
      this.suppliersSubject.next(suppliers);
      this.purchasesSubject.next(purchases);
      this.salesSubject.next(sales);
      this.expensesSubject.next(expenses);
      this.jobSheetsSubject.next(jobSheets);
      this.invoicesSubject.next(invoices);

      this.isDataLoaded = true;
      console.log('✅ All data loaded from API');
    } catch (error) {
      console.error('Failed to load data from API:', error);
    }
  }

  // Map snake_case from API to camelCase for frontend
  private mapPurchases(data: any[]): Purchase[] {
    return data.map(p => ({
      id: p.id,
      date: p.date,
      supplier: p.supplier,
      deviceBrand: p.device_brand,
      deviceModel: p.device_model,
      partName: p.part_name,
      partNameOther: p.part_name_other,
      unitPrice: parseFloat(p.unit_price) || 0,
      totalAmount: parseFloat(p.total_amount) || 0,
      notes: p.notes
    }));
  }

  private mapSales(data: any[]): Sale[] {
    return data.map(s => ({
      id: s.id,
      date: s.date,
      customer: s.customer,
      customerMobile: s.customer_mobile,
      deviceBrand: s.device_brand,
      deviceModel: s.device_model,
      problem: s.problem,
      partName: s.part_name,
      partNameOther: s.part_name_other,
      unitPrice: parseFloat(s.unit_price) || 0,
      purchaseCost: parseFloat(s.purchase_cost) || 0,
      profit: parseFloat(s.profit) || 0,
      totalAmount: parseFloat(s.total_amount) || 0,
      notes: s.notes,
      paymentMode: s.payment_mode,
      pendingAmount: parseFloat(s.pending_amount) || 0
    }));
  }

  private mapExpenses(data: any[]): Expense[] {
    return data.map(e => ({
      id: e.id,
      date: e.date,
      category: e.category,
      description: e.description,
      vendor: e.vendor,
      amount: parseFloat(e.amount) || 0,
      paymentMode: e.payment_mode,
      receipt: e.receipt,
      receiptNumber: e.receipt_number,
      notes: e.notes
    }));
  }

  private mapJobSheets(data: any[]): JobSheet[] {
    return data.map(j => ({
      id: j.id,
      date: j.date,
      status: j.status,
      customerName: j.customer_name,
      customerMobile: j.customer_mobile,
      customerAltMobile: j.customer_alt_mobile,
      customerAddress: j.customer_address,
      serviceType: j.service_type,
      jobType: j.job_type,
      priority: j.priority,
      deviceBrand: j.device_brand,
      deviceModel: j.device_model,
      imei: j.imei,
      color: j.color,
      lockType: j.lock_type,
      lockCode: j.lock_code,
      faultCategory: j.fault_category || [],
      customerRemark: j.customer_remark,
      technicianNote: j.technician_note,
      scratches: j.scratches,
      dents: j.dents,
      backGlassBroken: j.back_glass_broken,
      bentFrame: j.bent_frame,
      accessoriesRec: j.accessories_rec || [],
      estimatedCost: parseFloat(j.estimated_cost) || 0,
      advancePayment: parseFloat(j.advance_payment) || 0,
      pendingAmount: parseFloat(j.pending_amount) || 0,
      createdAt: j.created_at,
      updatedAt: j.updated_at
    }));
  }

  private mapInvoices(data: any[]): Invoice[] {
    return data.map(inv => ({
      id: inv.id,
      date: inv.date,
      customerName: inv.customer_name,
      customerMobile: inv.customer_mobile,
      customerAddress: inv.customer_address,
      deviceType: inv.device_type,
      deviceBrand: inv.device_brand,
      deviceModel: inv.device_model,
      deviceImei: inv.device_imei,
      deviceIssues: inv.device_issues,
      deviceAccessories: inv.device_accessories,
      items: inv.items || [],
      subtotal: parseFloat(inv.subtotal) || 0,
      taxPercent: parseFloat(inv.tax_percent) || 0,
      discount: parseFloat(inv.discount) || 0,
      totalAmount: parseFloat(inv.total_amount) || 0,
      paymentStatus: inv.payment_status,
      amountPaid: parseFloat(inv.amount_paid) || 0,
      balanceDue: parseFloat(inv.balance_due) || 0,
      warrantyInfo: inv.warranty_info,
      technicianNotes: inv.technician_notes
    }));
  }

  // --- Suppliers ---
  getSuppliersValue() { return this.suppliersSubject.value; }

  async addSupplier(name: string) {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/suppliers`, { name }, { headers: this.getHeaders() }));
      const current = this.suppliersSubject.value;
      if (!current.includes(name)) {
        this.suppliersSubject.next([...current, name].sort());
      }
    } catch (error) {
      console.error('Failed to add supplier:', error);
    }
  }

  async deleteSupplier(name: string) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/suppliers/${encodeURIComponent(name)}`, { headers: this.getHeaders() }));
      this.suppliersSubject.next(this.suppliersSubject.value.filter(s => s !== name));
    } catch (error) {
      console.error('Failed to delete supplier:', error);
    }
  }

  // --- Purchases ---
  getPurchasesValue() { return this.purchasesSubject.value; }

  async addPurchase(p: Purchase) {
    p.id = p.id || this.generateId('PUR', this.purchasesSubject.value);
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/purchases`, p, { headers: this.getHeaders() }));
      this.purchasesSubject.next([p, ...this.purchasesSubject.value]);
    } catch (error) {
      console.error('Failed to add purchase:', error);
    }
  }

  async updatePurchase(p: Purchase) {
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/purchases/${p.id}`, p, { headers: this.getHeaders() }));
      const current = this.purchasesSubject.value;
      const index = current.findIndex(x => x.id === p.id);
      if (index !== -1) {
        current[index] = p;
        this.purchasesSubject.next([...current]);
      }
    } catch (error) {
      console.error('Failed to update purchase:', error);
    }
  }

  async deletePurchase(id: string) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/purchases/${id}`, { headers: this.getHeaders() }));
      this.purchasesSubject.next(this.purchasesSubject.value.filter(x => x.id !== id));
    } catch (error) {
      console.error('Failed to delete purchase:', error);
    }
  }

  // --- Sales ---
  getSalesValue() { return this.salesSubject.value; }

  async addSale(s: Sale) {
    s.id = s.id || this.generateId('SAL', this.salesSubject.value);

    // Auto-create customer if not exists
    const existingCustomer = this.customersSubject.value.find(c =>
      c.name.toLowerCase() === (s.customer || '').toLowerCase() &&
      c.mobile === (s.customerMobile || '')
    );
    if (!existingCustomer && s.customer) {
      await this.addCustomer({
        id: '',
        name: s.customer,
        mobile: s.customerMobile || '',
        notes: 'Auto-created from Sale'
      });
    }

    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/sales`, s, { headers: this.getHeaders() }));
      this.salesSubject.next([s, ...this.salesSubject.value]);
    } catch (error) {
      console.error('Failed to add sale:', error);
    }
  }

  async updateSale(s: Sale) {
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/sales/${s.id}`, s, { headers: this.getHeaders() }));
      const current = this.salesSubject.value;
      const index = current.findIndex(x => x.id === s.id);
      if (index !== -1) {
        current[index] = s;
        this.salesSubject.next([...current]);
      }
    } catch (error) {
      console.error('Failed to update sale:', error);
    }
  }

  async deleteSale(id: string) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/sales/${id}`, { headers: this.getHeaders() }));
      this.salesSubject.next(this.salesSubject.value.filter(x => x.id !== id));
    } catch (error) {
      console.error('Failed to delete sale:', error);
    }
  }

  // --- Expenses ---
  getExpensesValue() { return this.expensesSubject.value; }

  async addExpense(e: Expense) {
    e.id = e.id || this.generateId('EXP', this.expensesSubject.value);
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/expenses`, e, { headers: this.getHeaders() }));
      this.expensesSubject.next([e, ...this.expensesSubject.value]);
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  }

  async updateExpense(e: Expense) {
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/expenses/${e.id}`, e, { headers: this.getHeaders() }));
      const current = this.expensesSubject.value;
      const index = current.findIndex(x => x.id === e.id);
      if (index !== -1) {
        current[index] = e;
        this.expensesSubject.next([...current]);
      }
    } catch (error) {
      console.error('Failed to update expense:', error);
    }
  }

  async deleteExpense(id: string) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/expenses/${id}`, { headers: this.getHeaders() }));
      this.expensesSubject.next(this.expensesSubject.value.filter(x => x.id !== id));
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  }

  // --- Customers ---
  getCustomersValue() { return this.customersSubject.value; }

  async addCustomer(c: Customer) {
    c.id = c.id || this.generateId('CUST', this.customersSubject.value);
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/customers`, c, { headers: this.getHeaders() }));
      this.customersSubject.next([...this.customersSubject.value, c]);
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  }

  async updateCustomer(c: Customer) {
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/customers/${c.id}`, c, { headers: this.getHeaders() }));
      const current = this.customersSubject.value;
      const index = current.findIndex(x => x.id === c.id);
      if (index !== -1) {
        current[index] = c;
        this.customersSubject.next([...current]);
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  }

  async deleteCustomer(id: string) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/customers/${id}`, { headers: this.getHeaders() }));
      this.customersSubject.next(this.customersSubject.value.filter(x => x.id !== id));
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  }

  // --- Job Sheets ---
  getJobSheetsValue() { return this.jobSheetsSubject.value; }

  async addJobSheet(j: JobSheet) {
    j.id = j.id || this.generateJobId(this.jobSheetsSubject.value);
    j.createdAt = new Date().toISOString();
    j.updatedAt = new Date().toISOString();

    // Auto-create customer if not exists
    const existingCustomer = this.customersSubject.value.find(c =>
      c.name.toLowerCase() === j.customerName.toLowerCase() &&
      c.mobile === j.customerMobile
    );
    if (!existingCustomer) {
      await this.addCustomer({
        id: '',
        name: j.customerName,
        mobile: j.customerMobile,
        address: j.customerAddress || '',
        notes: 'Auto-created from Job Sheet'
      });
    }

    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/jobsheets`, j, { headers: this.getHeaders() }));
      this.jobSheetsSubject.next([j, ...this.jobSheetsSubject.value]);
    } catch (error) {
      console.error('Failed to add job sheet:', error);
    }
  }

  async updateJobSheet(j: JobSheet) {
    j.updatedAt = new Date().toISOString();
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/jobsheets/${j.id}`, j, { headers: this.getHeaders() }));
      const current = this.jobSheetsSubject.value;
      const index = current.findIndex(x => x.id === j.id);
      if (index !== -1) {
        current[index] = j;
        this.jobSheetsSubject.next([...current]);
      }
    } catch (error) {
      console.error('Failed to update job sheet:', error);
    }
  }

  async deleteJobSheet(id: string) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/jobsheets/${id}`, { headers: this.getHeaders() }));
      this.jobSheetsSubject.next(this.jobSheetsSubject.value.filter(x => x.id !== id));
    } catch (error) {
      console.error('Failed to delete job sheet:', error);
    }
  }

  // --- Invoices ---
  getInvoicesValue() { return this.invoicesSubject.value; }

  async addInvoice(inv: Invoice) {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/invoices`, inv, { headers: this.getHeaders() }));
      this.invoicesSubject.next([inv, ...this.invoicesSubject.value]);
    } catch (error) {
      console.error('Failed to add invoice:', error);
    }
  }

  async updateInvoice(inv: Invoice) {
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/invoices/${inv.id}`, inv, { headers: this.getHeaders() }));
      const current = this.invoicesSubject.value;
      const index = current.findIndex(x => x.id === inv.id);
      if (index !== -1) {
        current[index] = inv;
        this.invoicesSubject.next([...current]);
      }
    } catch (error) {
      console.error('Failed to update invoice:', error);
    }
  }

  async deleteInvoice(id: string) {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/invoices/${id}`, { headers: this.getHeaders() }));
      this.invoicesSubject.next(this.invoicesSubject.value.filter(x => x.id !== id));
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  }

  // --- Utils ---
  private generateId(prefix: string, arr: any[]): string {
    let max = 1000;
    arr.forEach(i => {
      if (i.id && i.id.startsWith(prefix)) {
        const parts = i.id.split('-');
        const n = parseInt(parts[1]);
        if (!isNaN(n) && n >= max) max = n + 1;
      }
    });
    return `${prefix}-${max}`;
  }

  private generateJobId(arr: JobSheet[]): string {
    let max = 1000;
    arr.forEach(j => {
      if (j.id && j.id.startsWith('DM-')) {
        const parts = j.id.split('-');
        const n = parseInt(parts[1]);
        if (!isNaN(n) && n >= max) max = n + 1;
      }
    });
    return `DM-${max}`;
  }

  // --- Export Data (for backup) ---
  exportData() {
    const data = {
      purchases: this.purchasesSubject.value,
      sales: this.salesSubject.value,
      expenses: this.expensesSubject.value,
      customers: this.customersSubject.value,
      jobSheets: this.jobSheetsSubject.value,
      invoices: this.invoicesSubject.value,
      suppliers: this.suppliersSubject.value,
      appPin: localStorage.getItem('appPin')
    };
    return JSON.stringify(data);
  }

  // Reset data loaded flag (call on logout)
  resetDataLoaded() {
    this.isDataLoaded = false;
    this.purchasesSubject.next([]);
    this.salesSubject.next([]);
    this.expensesSubject.next([]);
    this.customersSubject.next([]);
    this.jobSheetsSubject.next([]);
    this.invoicesSubject.next([]);
    this.suppliersSubject.next([]);
  }

  // --- Import Data (for restore from backup) ---
  importData(json: string): boolean {
    try {
      const data = JSON.parse(json);

      // Update subjects with imported data
      if (data.purchases) this.purchasesSubject.next(data.purchases);
      if (data.sales) this.salesSubject.next(data.sales);
      if (data.expenses) this.expensesSubject.next(data.expenses);
      if (data.customers) this.customersSubject.next(data.customers);
      if (data.jobSheets) this.jobSheetsSubject.next(data.jobSheets);
      if (data.invoices) this.invoicesSubject.next(data.invoices);
      if (data.suppliers) this.suppliersSubject.next(data.suppliers);
      if (data.appPin) localStorage.setItem('appPin', data.appPin);

      // Note: This only updates frontend cache. Data is not synced to backend.
      // For full restore, user should re-upload to backend.
      console.log('Data imported to frontend cache');
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  // --- Clear All Data ---
  clearAllData() {
    this.purchasesSubject.next([]);
    this.salesSubject.next([]);
    this.expensesSubject.next([]);
    this.customersSubject.next([]);
    this.jobSheetsSubject.next([]);
    this.invoicesSubject.next([]);
    this.suppliersSubject.next([]);
    console.log('All data cleared from frontend cache');
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ExportService } from '../../services/export.service';
import { Expense } from '../../models';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit, OnDestroy {
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];

  // Date Filters
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
  years: number[] = [];
  selectedMonth = '';
  selectedYear = 2025;

  // Filters
  filterMonth = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterCategory = '';
  filterSearch = '';

  // Summary State
  totalThisMonth = 0;
  totalThisYear = 0;
  toolsExpenses = 0;
  petrolExpenses = 0;

  // View State
  viewMode: 'list' | 'form' = 'list';
  editingExpense: Expense = this.getEmptyExpense();

  // Confirm State
  isConfirmOpen = false;
  deleteId: string | null = null;

  private sub: Subscription = new Subscription();

  constructor(
    private dataService: DataService,
    private exportService: ExportService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    // Check for action=new query param to auto-open new expense form
    this.sub.add(this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openAddExpense();
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
    }));

    this.sub.add(this.dataService.expenses$.subscribe(data => {
      this.expenses = data;
      this.applyFilters();
      this.calculateSummary();
    }));

    // Init Date Filters
    const now = new Date();
    this.selectedMonth = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedYear = now.getFullYear();

    // Years
    for (let i = this.selectedYear; i >= 2024; i--) {
      this.years.push(i);
    }
    this.onFilterChange();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  getEmptyExpense(): Expense {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return {
      id: '',
      date: `${year}-${month}-${day}`,
      category: '',
      description: '',
      amount: 0,
      paymentMode: 'Cash',
      receipt: 'No'
    };
  }

  applyFilters() {
    let temp = [...this.expenses];
    if (this.filterMonth) temp = temp.filter(e => e.date.startsWith(this.filterMonth));
    if (this.filterDateFrom) temp = temp.filter(e => e.date >= this.filterDateFrom);
    if (this.filterDateTo) temp = temp.filter(e => e.date <= this.filterDateTo);
    if (this.filterCategory) temp = temp.filter(e => e.category === this.filterCategory);
    if (this.filterSearch) {
      const s = this.filterSearch.toLowerCase();
      temp = temp.filter(e => e.description.toLowerCase().includes(s) || (e.vendor && e.vendor.toLowerCase().includes(s)));
    }

    // Sort Newest First
    temp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.filteredExpenses = temp;
  }

  calculateSummary() {
    // Use selected filter values or default to current date if not set
    const targetMonth = this.filterMonth || new Date().toISOString().substring(0, 7);
    const targetYear = this.selectedYear ? this.selectedYear.toString() : new Date().getFullYear().toString();

    this.totalThisMonth = this.expenses
      .filter(e => e.date.startsWith(targetMonth))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    this.totalThisYear = this.expenses
      .filter(e => e.date.startsWith(targetYear))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    this.toolsExpenses = this.expenses
      .filter(e => e.category === 'Tools & Equipment' && e.date.startsWith(targetYear))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    this.petrolExpenses = this.expenses
      .filter(e => e.category === 'Petrol & Transportation' && e.date.startsWith(targetYear))
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  resetFilters() {
    // Reset to current month
    const now = new Date();
    this.selectedMonth = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedYear = now.getFullYear();
    this.onFilterChange();

    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterCategory = '';
    this.filterSearch = '';
  }

  onFilterChange() {
    this.filterMonth = `${this.selectedYear}-${this.selectedMonth}`;
    // console.log('Filter Month:', this.filterMonth);
    this.applyFilters();
    this.calculateSummary();
  }

  openAddExpense() {
    this.editingExpense = this.getEmptyExpense();
    this.viewMode = 'form';
  }

  openEditExpense(e: Expense) {
    this.editingExpense = JSON.parse(JSON.stringify(e));
    this.viewMode = 'form';
  }

  cancelEdit() {
    this.viewMode = 'list';
  }

  saveExpense() {
    if (!this.editingExpense.date || !this.editingExpense.category || !this.editingExpense.description) return;

    if (this.editingExpense.id) {
      this.dataService.updateExpense(this.editingExpense);
    } else {
      this.dataService.addExpense(this.editingExpense);
    }
    this.cancelEdit();
  }

  deleteExpense(id: string) {
    this.deleteId = id;
    this.isConfirmOpen = true;
  }

  confirmDelete() {
    if (this.deleteId) {
      this.dataService.deleteExpense(this.deleteId);
      this.deleteId = null;
    }
    this.isConfirmOpen = false;
  }

  exportPDF() {
    this.exportService.exportExpenses(this.filteredExpenses);
  }

  // Helpers
  getCategoryClass(category: string) {
    const classes: { [key: string]: string } = {
      'Tools & Equipment': 'category-tools',
      'Petrol & Transportation': 'category-petrol',
      'Shop Rent': 'category-rent',
      'Utilities': 'category-utilities',
      'Marketing': 'category-marketing',
      'Other': 'category-other'
    };
    return classes[category] || 'badge-secondary';
  }

  getPaymentBadgeClass(mode: string) {
    const classes: { [key: string]: string } = {
      'Cash': 'badge-success',
      'Online': 'badge-info',
      'Card': 'badge-warning',
      'Cheque': 'badge-dark'
    };
    return classes[mode] || 'badge-secondary';
  }
}

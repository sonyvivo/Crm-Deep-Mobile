import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ExportService } from '../../services/export.service';
import { AuthService } from '../../services/auth.service';
import { Purchase } from '../../models';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { Subscription } from 'rxjs';
import { SPARE_PARTS, DEVICE_BRANDS, MOBILE_MODELS } from '../../core/constants/mobile-data';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './purchases.component.html',
  styleUrls: ['./purchases.component.css']
})
export class PurchasesComponent implements OnInit, OnDestroy {
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  privacyMode = true;

  viewMode: 'group' | 'list' | 'form' = 'group';
  supplierStats: { name: string, count: number, total: number }[] = [];
  suppliersList: string[] = [];

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

  // Dropdowns
  deviceBrands = DEVICE_BRANDS; // Updated to match Sales
  modelsList = MOBILE_MODELS; // Added
  spareParts = SPARE_PARTS;

  // Filters
  filterMonth = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterSupplier = '';

  // Modal State
  isModalOpen = false;
  editingPurchase: Purchase = this.getEmptyPurchase();

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
  ) { }

  ngOnInit() {
    // Check for action=new query param to auto-open new purchase form
    this.sub.add(this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openNewPurchase();
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
    }));

    this.sub.add(this.dataService.purchases$.subscribe(data => {
      this.purchases = data;
      this.applyFilters();
    }));
    this.sub.add(this.authService.privacyMode$.subscribe(mode => this.privacyMode = mode));
    this.sub.add(this.dataService.suppliers$.subscribe(s => this.suppliersList = s));

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

  getEmptyPurchase(): Purchase {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return {
      id: '',
      date: `${year}-${month}-${day}`,
      supplier: '',
      deviceBrand: '',
      partName: '',
      unitPrice: 0,
      totalAmount: 0
    };
  }

  applyFilters() {
    let temp = [...this.purchases];
    if (this.filterMonth) temp = temp.filter(p => p.date.startsWith(this.filterMonth));
    if (this.filterDateFrom) temp = temp.filter(p => p.date >= this.filterDateFrom);
    if (this.filterDateTo) temp = temp.filter(p => p.date <= this.filterDateTo);

    // In 'group' mode, we might want to filter the underlying data first, then group.
    // If filterSupplier is set (e.g. from search), we filter the list.
    if (this.filterSupplier && this.viewMode === 'list') {
      temp = temp.filter(p => p.supplier.toLowerCase().includes(this.filterSupplier.toLowerCase()));
    } else if (this.filterSupplier && this.viewMode === 'group') {
      // Optional: Filter the groups by name?
      // For now, let's keep it simple. If in group mode, we group whatever is in date range.
    }

    // Sort Newest First
    temp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.filteredPurchases = temp;
    this.calculateSupplierStats();
  }

  calculateSupplierStats() {
    const stats: { [key: string]: { count: number, total: number } } = {};

    this.filteredPurchases.forEach(p => {
      const name = p.supplier || 'Unknown';
      if (!stats[name]) {
        stats[name] = { count: 0, total: 0 };
      }
      stats[name].count++;
      stats[name].total += (p.totalAmount || 0);
    });

    this.supplierStats = Object.keys(stats).map(name => ({
      name,
      count: stats[name].count,
      total: stats[name].total
    })).sort((a, b) => b.total - a.total); // Sort by highest spend
  }

  selectSupplier(name: string) {
    this.filterSupplier = name;
    this.viewMode = 'list';
    this.applyFilters(); // This will filter filteredPurchases by the selected name
  }

  backToGroups() {
    this.filterSupplier = '';
    this.viewMode = 'group';
    this.applyFilters();
  }

  resetFilters() {
    // Reset to current month
    const now = new Date();
    this.selectedMonth = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedYear = now.getFullYear();
    this.onFilterChange();

    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.backToGroups();
  }

  onFilterChange() {
    this.filterMonth = `${this.selectedYear}-${this.selectedMonth}`;
    this.applyFilters();
  }

  openNewPurchase() {
    this.editingPurchase = this.getEmptyPurchase();
    // Pre-fill supplier if selected
    if (this.filterSupplier) {
      this.editingPurchase.supplier = this.filterSupplier;
    }
    this.viewMode = 'form';
  }

  editPurchase(p: Purchase) {
    this.editingPurchase = JSON.parse(JSON.stringify(p)); // Deep copy
    this.viewMode = 'form';
  }

  cancelEdit() {
    if (this.filterSupplier) {
      this.viewMode = 'list';
    } else {
      this.viewMode = 'group';
    }
  }

  calculateTotal() {
    // Determine total amount logic (if quantity existed, but here just unit price seems to be total in original)
    // Original: totalAmount was just input, but UI had Unit Price. Let's assume quantity is 1 or manual entry.
    // In original HTML: "Unit Price" and "Total" were inputs. Total was readonly? 
    // Wait, original JS for purchase: id=purchaseTotalAmount readonly disabled.
    // It seems Total = Unit Price * Quantity? But there is no Quantity field in original HTML form!
    // Line 1194: Unit Price (id=purchaseUnitPrice). Line 1195: Total (id=purchaseTotalAmount).
    // Original JS doesn't show calculation logic in view_file. 
    // Assuming Quantity is 1 strictly or Total = UnitPrice. 
    // Let's implement Total = UnitPrice for now to match exactly, or make editable if needed.
    // Actually, usually Total = Unit Price.
    this.editingPurchase.totalAmount = this.editingPurchase.unitPrice;
  }

  savePurchase() {
    if (!this.editingPurchase.date || !this.editingPurchase.supplier || !this.editingPurchase.partName) return;

    this.calculateTotal(); // Ensure consistency

    if (this.editingPurchase.id) {
      this.dataService.updatePurchase(this.editingPurchase);
    } else {
      this.dataService.addPurchase(this.editingPurchase);
    }
    this.cancelEdit();
  }

  deletePurchase(id: string) {
    this.deleteId = id;
    this.isConfirmOpen = true;
  }

  confirmDelete() {
    if (this.deleteId) {
      this.dataService.deletePurchase(this.deleteId);
      this.deleteId = null;
    }
    this.isConfirmOpen = false;
  }

  exportPDF() {
    this.exportService.exportPurchases(this.filteredPurchases);
  }

  formatCurrency(val: number) {
    return '₹' + (val || 0).toFixed(2);
  }
}

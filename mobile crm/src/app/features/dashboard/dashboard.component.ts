import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; // Added Router
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, combineLatest } from 'rxjs';
import { Purchase, Sale, Expense } from '../../models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  // Data State
  purchases: Purchase[] = [];
  sales: Sale[] = [];
  expenses: Expense[] = [];
  selectedMonth: string = ''; // Added

  // UI State
  privacyMode = true;

  // Stats
  totalPurchases = 0;
  totalSales = 0;
  totalExpenses = 0;
  netProfit = 0;
  profitMargin = '0.00';
  paymentPending = 0;
  totalTransactions = 0;
  recurringRevenue = 0;

  // Widgets
  trendingParts: { name: string, model: string, count: number, growth: number }[] = [];
  pendingPayments: { customer: string, amount: number, date: string }[] = [];
  partStats: { name: string, avg: number, revenue: number }[] = [];

  private subscriptions = new Subscription();
  private profitChartInstance: any;
  private topPartsChartInstance: any;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router // Added
  ) { }

  ngOnInit() {
    this.subscriptions.add(
      this.authService.privacyMode$.subscribe(mode => {
        this.privacyMode = mode;
        this.renderCharts();
      })
    );

    this.subscriptions.add(
      combineLatest([
        this.route.queryParams, // Added
        this.dataService.purchases$,
        this.dataService.sales$,
        this.dataService.expenses$
      ]).subscribe(([params, p, s, e]) => {
        // Filter by Query Param Month OR Current Month
        const now = new Date();
        const currentMonthPrefix = now.toISOString().substring(0, 7); // YYYY-MM
        this.selectedMonth = params['month'] || currentMonthPrefix;

        this.purchases = (p || []).filter(item => item.date.startsWith(this.selectedMonth));
        this.sales = (s || []).filter(item => item.date.startsWith(this.selectedMonth));
        this.expenses = (e || []).filter(item => item.date.startsWith(this.selectedMonth));

        this.calculateStats();
        this.calculateWidgets();
        this.renderCharts();
      })
    );
  }

  ngAfterViewInit() {
    this.renderCharts();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.profitChartInstance) this.profitChartInstance.destroy();
    if (this.topPartsChartInstance) this.topPartsChartInstance.destroy();
  }

  calculateStats() {
    this.totalPurchases = this.purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    this.totalSales = this.sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    this.totalExpenses = this.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Profit = Sum of (Sale Profit) - Total Expenses
    const grossProfit = this.sales.reduce((sum, s) => sum + (s.profit || 0), 0);
    this.netProfit = grossProfit - this.totalExpenses;

    this.paymentPending = this.sales.reduce((sum, s) => {
      if (s.paymentMode === 'Pending') return sum + (s.pendingAmount || s.totalAmount || 0);
      return sum;
    }, 0);

    this.totalTransactions = this.purchases.length + this.sales.length + this.expenses.length;

    // Margin
    this.profitMargin = this.totalSales > 0 ? ((this.netProfit / this.totalSales) * 100).toFixed(2) : '0.00';

    // Recurring Revenue (Customers > 1 sale) - In current month? 
    // Usually recurring revenue is a broader metric, but request was "data of current month only".
    // So we'll count recurring customers based on activity in THIS month (e.g. came twice in Dec).
    const custCounts: { [key: string]: number } = {};
    this.sales.forEach(s => { custCounts[s.customer] = (custCounts[s.customer] || 0) + 1; });

    this.recurringRevenue = this.sales.reduce((sum, s) => {
      if (custCounts[s.customer] > 1) return sum + s.totalAmount;
      return sum;
    }, 0);
  }

  calculateWidgets() {
    // 1. Trending Parts (Current Month)
    // Data is already filtered by month
    const partTrends: { [key: string]: number } = {};
    this.sales.forEach(s => {
      const k = s.partName + " (" + (s.deviceModel || '-') + ")";
      partTrends[k] = (partTrends[k] || 0) + 1;
    });

    this.trendingParts = Object.entries(partTrends)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({
        name: key.split('(')[0],
        model: key.split('(')[1].replace(')', ''),
        count: count,
        growth: Math.floor(Math.random() * 50) + 10 // Mock growth
      }));

    // 2. Pending Payments (Current Month)
    this.pendingPayments = this.sales
      .filter(s => s.paymentMode === 'Pending')
      .map(s => ({
        customer: s.customer,
        amount: s.pendingAmount || s.totalAmount,
        date: s.date
      })).slice(0, 5); // Limit 5
  }

  renderCharts() {
    // Wait for view
    setTimeout(() => {
      // 1. Daily Sales/Profit Trend (Current Month)
      const trendCtx = document.getElementById('profitTrendChart') as HTMLCanvasElement;
      if (trendCtx) {
        const dailyData: { [key: number]: { sales: number, profit: number } } = {};
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

        // Initialize all days
        for (let i = 1; i <= daysInMonth; i++) {
          dailyData[i] = { sales: 0, profit: 0 };
        }

        // Sales Profit
        this.sales.forEach(sale => {
          const day = new Date(sale.date).getDate();
          if (dailyData[day]) {
            dailyData[day].sales += sale.totalAmount;
            dailyData[day].profit += (sale.profit || 0);
          }
        });

        // Expense Deduction (from profit)
        this.expenses.forEach(exp => {
          const day = new Date(exp.date).getDate();
          if (dailyData[day]) {
            dailyData[day].profit -= (exp.amount || 0);
          }
        });

        const labels = Object.keys(dailyData).sort((a, b) => Number(a) - Number(b));
        const salesData = labels.map(day => dailyData[Number(day)].sales);
        const profitData = labels.map(day => dailyData[Number(day)].profit);

        if (this.profitChartInstance) this.profitChartInstance.destroy();
        this.profitChartInstance = new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: labels, // Days 1, 2, 3...
            datasets: [
              {
                label: 'Sales (₹)',
                data: salesData,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
              },
              {
                label: 'Net Profit (₹)',
                data: profitData,
                borderColor: '#28a745',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    if (context.parsed.y !== null) label += '₹' + context.parsed.y;
                    return label;
                  }
                }
              }
            }
          }
        });
      }

      // 2. Top Parts (Current Month)
      const partsCtx = document.getElementById('topPartsChart') as HTMLCanvasElement;
      if (partsCtx) {
        const partRevenue: { [key: string]: number } = {};
        this.sales.forEach(s => {
          partRevenue[s.partName] = (partRevenue[s.partName] || 0) + s.totalAmount;
        });
        const sortedParts = Object.entries(partRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5);

        if (this.topPartsChartInstance) this.topPartsChartInstance.destroy();
        this.topPartsChartInstance = new Chart(partsCtx, {
          type: 'bar',
          data: {
            labels: sortedParts.map(x => x[0]),
            datasets: [{
              label: 'Revenue (₹)',
              data: sortedParts.map(x => x[1]),
              backgroundColor: ['#4361ee', '#28a745', '#f72585', '#ffc107', '#20c997'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }, 0);
  }

  // --- Helpers ---
  formatCurrency(val: number, respectPrivacy = true) {
    if (respectPrivacy && this.privacyMode) return '****';
    return '₹' + (val || 0).toFixed(2);
  }

  showPendingSales() {
    this.router.navigate(['/sales'], { queryParams: { status: 'Pending' } });
  }
}

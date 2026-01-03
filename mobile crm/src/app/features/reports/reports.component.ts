import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Subscription, combineLatest } from 'rxjs';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {
  privacyMode = true;
  monthlyData: any[] = [];

  private sub = new Subscription();

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private router: Router
  ) { }



  viewMonth(month: string) {
    this.router.navigate(['/dashboard'], { queryParams: { month: month } });
  }

  ngOnInit() {
    this.sub.add(this.authService.privacyMode$.subscribe(mode => this.privacyMode = mode));

    this.sub.add(combineLatest([
      this.dataService.purchases$,
      this.dataService.sales$,
      this.dataService.expenses$
    ]).subscribe(([purchases, sales, expenses]) => {
      this.generateMonthlyReport(purchases, sales, expenses);
    }));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  generateMonthlyReport(purchases: any[], sales: any[], expenses: any[]) {
    const data: { [key: string]: any } = {};

    // Sales & Profit
    sales.forEach(s => {
      const m = s.date.substring(0, 7);
      if (!data[m]) data[m] = this.getEmptyMonthData(m);
      data[m].sales += s.totalAmount;
      data[m].grossProfit += (s.profit || 0);
      data[m].transactions++;
    });

    // Purchases
    purchases.forEach(p => {
      const m = p.date.substring(0, 7);
      if (!data[m]) data[m] = this.getEmptyMonthData(m);
      data[m].purchases += p.totalAmount;
    });

    // Expenses
    expenses.forEach(e => {
      const m = e.date.substring(0, 7);
      if (!data[m]) data[m] = this.getEmptyMonthData(m);
      data[m].expenses += e.amount;
    });

    // Calculate Net Profit
    this.monthlyData = Object.values(data).map((d: any) => {
      d.netProfit = d.grossProfit - d.expenses;
      return d;
    }).sort((a: any, b: any) => b.month.localeCompare(a.month)); // Newest first
  }

  getEmptyMonthData(monthKey: string) {
    return {
      month: monthKey,
      sales: 0,
      purchases: 0,
      expenses: 0,
      grossProfit: 0,
      netProfit: 0,
      transactions: 0
    };
  }

  formatCurrency(val: number) {
    return this.privacyMode ? '****' : '₹' + (val || 0).toFixed(2);
  }
}

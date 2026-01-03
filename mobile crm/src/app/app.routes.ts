import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PurchasesComponent } from './features/purchases/purchases.component';
import { SalesComponent } from './features/sales/sales.component';
import { ExpensesComponent } from './features/expenses/expenses.component';
import { CustomersComponent } from './features/customers/customers.component';
import { ReportsComponent } from './features/reports/reports.component';
import { SettingsComponent } from './features/settings/settings.component';
import { JobSheetsComponent } from './features/job-sheets/job-sheets.component';
import { BillingComponent } from './features/billing/billing.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'billing', component: BillingComponent },
            { path: 'job-sheets', component: JobSheetsComponent },
            { path: 'purchases', component: PurchasesComponent },
            { path: 'sales', component: SalesComponent },
            { path: 'expenses', component: ExpensesComponent },
            { path: 'customers', component: CustomersComponent },
            { path: 'reports', component: ReportsComponent },
            { path: 'settings', component: SettingsComponent }
        ]
    },
    { path: '**', redirectTo: 'dashboard' }
];



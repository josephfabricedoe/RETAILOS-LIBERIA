# RetailOS Liberia 🇱🇷
### Independent Multi-Tenant SaaS Retail Platform & Cloud POS for West African Businesses

**RetailOS Liberia** is a full-featured, scalable, multi-tenant retail operating system engineered specifically to overcome the real-world operational realities of retail businesses in Liberia and West Africa.

---

## 🌟 Key Platform Capabilities

1. **Multi-Tenant Architecture (Option B Subcollections):**
   - Stores are provisioned under `/businesses/{businessId}/...`.
   - Guaranteed tenant isolation with zero cross-store data leakage.
   - Separate product inventories, showroom stock, storeroom warehouses, staff PIN rosters, cash drawer reconciliations, and customer debt ledgers.

2. **Master Super-Admin Dashboard:**
   - Platform founders **Joseph Doe** (`josephfabricedoe@gmail.com`) and **Malydia Jasay** (`jambeautystorelib@gmail.com`) have master clearance.
   - Track total active stores, MRR (Monthly Recurring Revenue in USD and LRD), GMV platform sales, and subscription statuses.
   - 1-Click Store Workspace Impersonation: Seamlessly enter any client store to assist with setup, troubleshooting, or audits, and return to the master dashboard with one click.
   - Fast Store Provisioning Wizard: Generate new tenant accounts in under 30 seconds.

3. **Liberian Dual-Currency Engine (USD & LRD):**
   - Instant dual-currency price computation at checkout and in inventory.
   - Real-time exchange rate switcher ($1 USD = X LRD).
   - Cash drawer reconciliation tracking physical USD notes and LRD banknotes simultaneously.
   - Native support for Liberian mobile money: **Lonestar MTN MoMo** and **Orange Money**.

4. **Shared Kiosk Terminal with 4-Digit PIN Security:**
   - 1 single physical laptop, tablet, or phone counter register can be shared by the entire store team.
   - Cashiers unlock the register with their personal 4-digit PIN.
   - Automatic morning attendance punch logged to Firestore upon first PIN unlock of the day.

5. **Showroom vs. Storeroom Inventory Management:**
   - Distinguishes between items physically displayed in the retail showroom and back-office storeroom reserves.
   - 1-click stock transfers between storeroom and sales counter.
   - In-transit purchase pipelines with lead-time tracking for overseas orders arriving from China, USA, or Ghana.

6. **Direct 58mm Bluetooth ESC/POS Printing:**
   - Driverless printing to portable Bluetooth thermal receipt printers via Web Bluetooth.
   - Supports customer receipts, daily Z-Reports, and shift handovers.

7. **Direct WhatsApp Marketing & Customer Credit Tabs:**
   - Broadcast promotions and restock announcements to targeted customer segments (VIPs, Debtors, All).
   - Store credit tab ledger with one-click WhatsApp payment reminders with calculated balances.
   - Public Customer Catalog (`/?store=slug#catalog`) for direct WhatsApp ordering.

---

## 🚀 Getting Started

### Development Server
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

### Running Offline & PWA
The application is preconfigured with Vite PWA and Workbox. It installs as a native application on Android, iOS, Windows, and macOS, with full IndexedDB offline caching.

---

## 🔒 Super-Admin Access
Log in with either:
- `josephfabricedoe@gmail.com`
- `jambeautystorelib@gmail.com`

When logged in with either address, the platform automatically grants `superadmin` clearance, enabling the **Master Super-Admin Hub** to manage all client businesses across Liberia.

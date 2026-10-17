# VaultPay

Premium liquid-glass digital wallet — a **frontend-only demo**. No real money, bank connection, authentication or encryption exists. All balances and transfers are simulations on sample data.

## Logo
`logo.svg` — a "V" on a glass-sheen violet→mint squircle, with a coin/keyhole dot. Used in the sidebar, mobile header, balance card and as the favicon (all point to this one file; the "VaultPay" wordmark is live text so it follows the theme).

## Features
Dashboard (hide/show balance, 30-day income/expenses/net with trends, recent transactions, spending doughnut) · Transactions (search, type/status filters, sort, load-more, detail modal, copy reference) · Transfer (send / receive / add money with validation → review → confirm, double-submit guard) · Payment methods (add, set default, remove with confirmation) · Analytics (doughnut + bar, week/month/year) · Notifications (read, read-all, delete, unread filter, badge) · Settings (name/email, theme, hide balances, reset).

## Structure
```
VaultPay/
├── index.html
├── logo.svg
├── pages/  transactions · transfer · payment-methods · analytics · notifications · settings (.html)
├── styles/style.css
├── scripts/script.js
└── readme.md
```
Page HTML files are thin shells; `script.js` renders the shared sidebar/header and each page from `data-page`.

## Run
```
cd VaultPay
python3 -m http.server 8000    # open http://localhost:8000
```
or VS Code Live Server. Needs internet only for Chart.js and the Inter font (CDN); icons are inline SVG.

## Themes & data
`data-theme="dark|light"` on `<html>`; saved in `vp_theme`, system preference on first visit. Demo data lives in `localStorage` key `vaultpay_v1` (not secure — never store real financial data). Restore sample data: Settings → Reset demo data.

## Limitations
Simulations only. Not implemented: payment-method editing, date-range filter, password/2FA/session UI, currency selector, QR code (placeholder), line chart, card tilt effect. USD only. Not verified across browsers/breakpoints.

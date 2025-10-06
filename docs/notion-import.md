# Etsy → Notion Export Workflow

This guide explains how to transform Etsy CSV exports into Notion-ready tables using the `tools/etsy_to_notion.py` helper script.

## 1. Prerequisites

- Python 3.9+ installed locally (the script uses only standard-library modules).
- Three Etsy CSV exports placed at the project root (default names shown below):
  - `EtsySoldOrders2025.csv`
  - `EtsyDirectCheckoutPayments2025.csv`
  - `EtsyDeposits2025.csv`

If your files are named differently or live elsewhere, you can override the defaults via CLI flags.

## 2. Generate the Notion-ready datasets

From the repository root run:

```bash
python3 tools/etsy_to_notion.py \
  --orders EtsySoldOrders2025.csv \
  --payments EtsyDirectCheckoutPayments2025.csv \
  --deposits EtsyDeposits2025.csv \
  --output-dir notion_exports \
  --verbose
```

Key flags:

- `--year`: filter the order export to a single sales year (e.g. `--year 2025`).
- `--no-summary`: skip the summary JSON file if you only need CSVs.
- `--output-dir`: choose an alternate destination for the generated files.

The script produces four artefacts inside `notion_exports/`:

| File | Description |
| ---- | ----------- |
| `orders.csv` | One row per sold-order line, enriched with payout, shipping, and lag metrics. |
| `payments.csv` | Raw Etsy Direct Checkout payments normalised for reporting. |
| `deposits.csv` | Bank deposits with ISO week/month/quarter groupings. |
| `summary.json` | High-level totals to help reconcile revenue, payouts, and deposits. |

## 3. Import into Notion

1. Create three databases in Notion (Orders, Payments, Deposits).
2. Use **⋯ → Merge with CSV** inside each database and drop the corresponding file.
3. After import, convert the following properties as needed:
   - `sale_date`, `order_date`, `funds_available_on`, `deposit_date` → **Date**.
   - Monetary columns → **Number** (enable the `$` currency format).
   - Boolean columns like `gift_card_used` → **Checkbox** (Notion will auto-detect `TRUE`/`FALSE`).
4. Establish relations:
   - Link Orders ↔ Payments via `order_id`.
   - (Optional) Add rollups to compute payment totals per order or reconcile deposits.
5. Build saved views, e.g. “Orders awaiting shipment” using the `ship_lag_days` column.

## 4. Troubleshooting

- **Missing payments**: rows with `payment_found = FALSE` indicate orders with no matching payout record. Confirm the `Order ID` exists in the payments export.
- **Unicode / emoji names**: the script writes UTF-8 CSV files; Notion imports them without extra configuration.
- **Re-running for future exports**: the script is idempotent—rerun it whenever you download fresh Etsy data. Old files in the output directory will be overwritten.

Feel free to adjust column selections or add new derived metrics inside `tools/etsy_to_notion.py` to align with future reporting needs.

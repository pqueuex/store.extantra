#!/usr/bin/env python3
"""Utilities for converting Etsy export CSVs into Notion-friendly tables.

This script ingests three Etsy CSV exports (Sold Orders, Direct Checkout
Payments, and Deposits), normalises and enriches the data, then emits
Notion-ready CSV files plus a JSON summary.

Example usage:
    python tools/etsy_to_notion.py \
        --orders EtsySoldOrders2025.csv \
        --payments EtsyDirectCheckoutPayments2025.csv \
        --deposits EtsyDeposits2025.csv \
        --output-dir notion_exports
"""
from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence

ORDER_DATE_FORMATS: Sequence[str] = ("%m/%d/%y", "%m/%d/%Y")
PAYMENT_DATE_FORMATS: Sequence[str] = ("%m/%d/%Y", "%m/%d/%y")
DEPOSIT_DATE_FORMATS: Sequence[str] = ("%B %d, %Y", "%b %d, %Y")
DECIMAL_ZERO = Decimal("0.00")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Normalise Etsy exports into Notion-ready CSVs. "
            "Defaults assume files live in the project root."
        )
    )
    parser.add_argument(
        "--orders",
        default="EtsySoldOrders2025.csv",
        help="Path to the Etsy Sold Orders export CSV.",
    )
    parser.add_argument(
        "--payments",
        default="EtsyDirectCheckoutPayments2025.csv",
        help="Path to the Etsy Direct Checkout Payments export CSV.",
    )
    parser.add_argument(
        "--deposits",
        default="EtsyDeposits2025.csv",
        help="Path to the Etsy Deposits export CSV.",
    )
    parser.add_argument(
        "--output-dir",
        default="notion_exports",
        help="Directory for the Notion-ready CSV outputs.",
    )
    parser.add_argument(
        "--summary-json",
        default="summary.json",
        help="File name (within output dir) for the summary JSON blob.",
    )
    parser.add_argument(
        "--year",
        type=int,
        help="Optional sales year filter (applies to Sale Date).",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging during processing.",
    )
    parser.add_argument(
        "--no-summary",
        action="store_true",
        help="Skip writing the JSON summary file.",
    )
    return parser.parse_args()


def log(message: str, *, verbose: bool = True) -> None:
    if verbose:
        print(message)


def read_csv(path: Path) -> Iterable[Dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            yield {key.strip(): (value.strip() if value is not None else "") for key, value in row.items()}


def parse_decimal(value: Optional[str], *, allow_empty: bool = True) -> Optional[Decimal]:
    if value is None:
        return None if allow_empty else DECIMAL_ZERO
    text = value.strip()
    if text == "":
        return None if allow_empty else DECIMAL_ZERO
    normalised = text.replace(",", "")
    try:
        return Decimal(normalised)
    except InvalidOperation:
        return None


def decimal_or_zero(value: Optional[Decimal]) -> Decimal:
    return value if value is not None else DECIMAL_ZERO


def format_decimal(value: Optional[Decimal]) -> str:
    if value is None:
        return ""
    return f"{value.quantize(Decimal('0.01'))}"


def parse_date(text: Optional[str], formats: Sequence[str]) -> Optional[date]:
    if text is None:
        return None
    candidate = text.strip()
    if not candidate:
        return None
    for fmt in formats:
        try:
            return datetime.strptime(candidate, fmt).date()
        except ValueError:
            continue
    return None


def iso_or_blank(value: Optional[date]) -> str:
    return value.isoformat() if value else ""


def parse_int(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    cleaned = value.strip()
    if cleaned == "":
        return None
    try:
        return int(float(cleaned))
    except ValueError:
        return None


def days_between(start: Optional[date], end: Optional[date]) -> Optional[int]:
    if start is None or end is None:
        return None
    return (end - start).days


@dataclass
class PaymentRecord:
    payment_id: str
    order_id: str
    order_date: Optional[date]
    funds_available_on: Optional[date]
    status: str
    gross_amount: Decimal
    fees: Decimal
    net_amount: Decimal
    posted_gross: Optional[Decimal]
    posted_fees: Optional[Decimal]
    posted_net: Optional[Decimal]
    adjusted_gross: Optional[Decimal]
    adjusted_fees: Optional[Decimal]
    adjusted_net: Optional[Decimal]
    currency: str
    listing_amount: Optional[Decimal]
    listing_currency: str
    exchange_rate: Optional[Decimal]
    gift_card_applied: bool
    buyer_name: str
    buyer_username: str
    payment_type: str
    refund_amount: Decimal

    def to_row(self) -> Dict[str, str]:
        return {
            "payment_id": self.payment_id,
            "order_id": self.order_id,
            "order_date": iso_or_blank(self.order_date),
            "funds_available_on": iso_or_blank(self.funds_available_on),
            "status": self.status,
            "buyer_name": self.buyer_name,
            "buyer_username": self.buyer_username,
            "payment_type": self.payment_type,
            "gross_amount": format_decimal(self.gross_amount),
            "fees": format_decimal(self.fees),
            "net_amount": format_decimal(self.net_amount),
            "posted_gross": format_decimal(self.posted_gross),
            "posted_fees": format_decimal(self.posted_fees),
            "posted_net": format_decimal(self.posted_net),
            "adjusted_gross": format_decimal(self.adjusted_gross),
            "adjusted_fees": format_decimal(self.adjusted_fees),
            "adjusted_net": format_decimal(self.adjusted_net),
            "gift_card_applied": "TRUE" if self.gift_card_applied else "FALSE",
            "refund_amount": format_decimal(self.refund_amount),
            "currency": self.currency,
            "listing_amount": format_decimal(self.listing_amount),
            "listing_currency": self.listing_currency,
            "exchange_rate": format_decimal(self.exchange_rate),
        }


def load_payments(path: Path, *, verbose: bool = False) -> List[PaymentRecord]:
    payments: List[PaymentRecord] = []
    for row in read_csv(path):
        order_id = row.get("Order ID", "")
        payment_id = row.get("Payment ID", "")
        if not order_id or not payment_id:
            continue
        payment = PaymentRecord(
            payment_id=payment_id,
            order_id=order_id,
            order_date=parse_date(row.get("Order Date"), PAYMENT_DATE_FORMATS),
            funds_available_on=parse_date(row.get("Funds Available"), PAYMENT_DATE_FORMATS),
            status=row.get("Status", "").upper(),
            gross_amount=decimal_or_zero(parse_decimal(row.get("Gross Amount"), allow_empty=False)),
            fees=decimal_or_zero(parse_decimal(row.get("Fees"), allow_empty=False)),
            net_amount=decimal_or_zero(parse_decimal(row.get("Net Amount"), allow_empty=False)),
            posted_gross=parse_decimal(row.get("Posted Gross")),
            posted_fees=parse_decimal(row.get("Posted Fees")),
            posted_net=parse_decimal(row.get("Posted Net")),
            adjusted_gross=parse_decimal(row.get("Adjusted Gross")),
            adjusted_fees=parse_decimal(row.get("Adjusted Fees")),
            adjusted_net=parse_decimal(row.get("Adjusted Net")),
            currency=row.get("Currency", "USD"),
            listing_amount=parse_decimal(row.get("Listing Amount")),
            listing_currency=row.get("Listing Currency", "USD"),
            exchange_rate=parse_decimal(row.get("Exchange Rate")),
            gift_card_applied=row.get("Gift Card Applied?", "").strip().lower() == "yes",
            buyer_name=row.get("Buyer Name", row.get("Buyer", "")),
            buyer_username=row.get("Buyer Username", row.get("Buyer", "")),
            payment_type=row.get("Payment Type", ""),
            refund_amount=decimal_or_zero(parse_decimal(row.get("Refund Amount"))),
        )
        payments.append(payment)
    log(f"Loaded {len(payments)} payments from {path}", verbose=verbose)
    return payments


def build_payment_index(payments: Iterable[PaymentRecord]) -> Dict[str, Dict[str, object]]:
    index: Dict[str, Dict[str, object]] = defaultdict(lambda: {
        "payments": [],
        "gross_total": DECIMAL_ZERO,
        "fees_total": DECIMAL_ZERO,
        "net_total": DECIMAL_ZERO,
        "adjusted_gross_total": DECIMAL_ZERO,
        "adjusted_fees_total": DECIMAL_ZERO,
        "adjusted_net_total": DECIMAL_ZERO,
        "refund_total": DECIMAL_ZERO,
        "funds_available": None,
        "statuses": set(),
        "gift_card": False,
        "payment_ids": [],
    })

    for payment in payments:
        bucket = index[payment.order_id]
        bucket["payments"].append(payment)
        bucket["gross_total"] += payment.gross_amount
        bucket["fees_total"] += payment.fees
        bucket["net_total"] += payment.net_amount
        if payment.adjusted_gross is not None:
            bucket["adjusted_gross_total"] += payment.adjusted_gross
        if payment.adjusted_fees is not None:
            bucket["adjusted_fees_total"] += payment.adjusted_fees
        if payment.adjusted_net is not None:
            bucket["adjusted_net_total"] += payment.adjusted_net
        bucket["refund_total"] += payment.refund_amount
        if payment.funds_available_on:
            current = bucket["funds_available"]
            if current is None or payment.funds_available_on < current:
                bucket["funds_available"] = payment.funds_available_on
        if payment.status:
            bucket["statuses"].add(payment.status)
        bucket["gift_card"] = bucket["gift_card"] or payment.gift_card_applied
        bucket["payment_ids"].append(payment.payment_id)

    return index


def load_orders(path: Path, payment_index: Dict[str, Dict[str, object]], *, year_filter: Optional[int] = None, verbose: bool = False) -> List[Dict[str, str]]:
    orders: List[Dict[str, str]] = []
    skipped_for_year = 0
    for row in read_csv(path):
        order_id = row.get("Order ID", "")
        if not order_id:
            continue
        sale_date = parse_date(row.get("Sale Date"), ORDER_DATE_FORMATS)
        if year_filter and sale_date and sale_date.year != year_filter:
            skipped_for_year += 1
            continue
        date_shipped = parse_date(row.get("Date Shipped"), ORDER_DATE_FORMATS)
        payments = payment_index.get(order_id)
        funds_available = payments.get("funds_available") if payments else None
        payout_lag = days_between(sale_date, funds_available)
        ship_lag = days_between(sale_date, date_shipped)
        number_of_items = parse_int(row.get("Number of Items")) or 0
        card_processing_fees = parse_decimal(row.get("Card Processing Fees"))

        order_row = {
            "order_id": order_id,
            "sale_date": iso_or_blank(sale_date),
            "status": row.get("Status", ""),
            "buyer_name": row.get("Full Name", row.get("Buyer", "")),
            "buyer_username": row.get("Buyer User ID", row.get("Buyer", "")),
            "payment_method": row.get("Payment Method", ""),
            "payment_type": row.get("Payment Type", ""),
            "order_type": row.get("Order Type", ""),
            "number_of_items": str(number_of_items),
            "order_value": format_decimal(parse_decimal(row.get("Order Value"))),
            "order_total": format_decimal(parse_decimal(row.get("Order Total"))),
            "order_net": format_decimal(parse_decimal(row.get("Order Net"))),
            "adjusted_order_total": format_decimal(parse_decimal(row.get("Adjusted Order Total"))),
            "adjusted_card_processing_fees": format_decimal(parse_decimal(row.get("Adjusted Card Processing Fees"))),
            "adjusted_net_order_amount": format_decimal(parse_decimal(row.get("Adjusted Net Order Amount"))),
            "discount_amount": format_decimal(parse_decimal(row.get("Discount Amount"))),
            "shipping_discount": format_decimal(parse_decimal(row.get("Shipping Discount"))),
            "shipping_amount": format_decimal(parse_decimal(row.get("Shipping"))),
            "sales_tax": format_decimal(parse_decimal(row.get("Sales Tax"))),
            "card_processing_fees": format_decimal(card_processing_fees),
            "coupon_code": row.get("Coupon Code", ""),
            "coupon_details": row.get("Coupon Details", ""),
            "date_shipped": iso_or_blank(date_shipped),
            "ship_city": row.get("Ship City", ""),
            "ship_state": row.get("Ship State", ""),
            "ship_zipcode": row.get("Ship Zipcode", ""),
            "ship_country": row.get("Ship Country", ""),
            "street_1": row.get("Street 1", ""),
            "street_2": row.get("Street 2", ""),
            "sku": row.get("SKU", ""),
            "funds_available_on": iso_or_blank(funds_available),
            "payout_lag_days": str(payout_lag) if payout_lag is not None else "",
            "ship_lag_days": str(ship_lag) if ship_lag is not None else "",
            "gift_card_used": "TRUE" if payments and payments.get("gift_card") else "FALSE",
            "payment_count": str(len(payments["payments"]) if payments else 0),
            "payment_ids": "; ".join(payments["payment_ids"]) if payments else "",
            "payment_status": " | ".join(sorted(payments["statuses"])) if payments else "",
            "payment_gross": format_decimal(payments["gross_total"]) if payments else "",
            "payment_fees": format_decimal(payments["fees_total"]) if payments else "",
            "payment_net": format_decimal(payments["net_total"]) if payments else "",
            "payment_adjusted_gross": format_decimal(payments["adjusted_gross_total"]) if payments else "",
            "payment_adjusted_fees": format_decimal(payments["adjusted_fees_total"]) if payments else "",
            "payment_adjusted_net": format_decimal(payments["adjusted_net_total"]) if payments else "",
            "refund_total": format_decimal(payments["refund_total"]) if payments else "",
            "payment_found": "TRUE" if payments else "FALSE",
        }
        orders.append(order_row)
    if skipped_for_year:
        log(f"Skipped {skipped_for_year} orders outside year filter", verbose=verbose)
    log(f"Loaded {len(orders)} orders from {path}", verbose=verbose)
    return orders


def load_deposits(path: Path, *, verbose: bool = False) -> List[Dict[str, str]]:
    deposits: List[Dict[str, str]] = []
    for row in read_csv(path):
        deposit_date = parse_date(row.get("Date"), DEPOSIT_DATE_FORMATS)
        amount = parse_decimal(row.get("Amount"), allow_empty=False)
        if deposit_date is None or amount is None:
            continue
        iso_date = iso_or_blank(deposit_date)
        week_number = deposit_date.isocalendar().week
        month_label = f"{deposit_date.year}-{deposit_date.month:02d}"
        quarter = (deposit_date.month - 1) // 3 + 1
        deposit_row = {
            "deposit_date": iso_date,
            "amount": format_decimal(amount),
            "currency": row.get("Currency", "USD"),
            "status": row.get("Status", ""),
            "bank_account_last4": row.get("Bank Account Ending Digits", ""),
            "iso_week": f"{deposit_date.year}-W{week_number:02d}",
            "month": month_label,
            "quarter": f"{deposit_date.year}-Q{quarter}",
        }
        deposits.append(deposit_row)
    log(f"Loaded {len(deposits)} deposits from {path}", verbose=verbose)
    return deposits


def write_csv(path: Path, fieldnames: Sequence[str], rows: Iterable[Dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def compute_summary(orders: List[Dict[str, str]], payments: List[PaymentRecord], deposits: List[Dict[str, str]]) -> Dict[str, object]:
    def sum_decimal(values: Iterable[str]) -> Decimal:
        total = DECIMAL_ZERO
        for text in values:
            if not text:
                continue
            try:
                total += Decimal(text)
            except InvalidOperation:
                continue
        return total

    orders_total = sum_decimal(order["order_total"] for order in orders)
    orders_net = sum_decimal(order["order_net"] for order in orders)

    payments_summary = {
        "count": len(payments),
        "gross": str(sum(payment.gross_amount for payment in payments)),
        "fees": str(sum(payment.fees for payment in payments)),
        "net": str(sum(payment.net_amount for payment in payments)),
        "refunds": str(sum(payment.refund_amount for payment in payments)),
    }

    deposits_total = sum_decimal(deposit["amount"] for deposit in deposits)

    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

    return {
        "generated_at": generated_at,
        "orders": {
            "count": len(orders),
            "order_total": str(orders_total),
            "order_net": str(orders_net),
        },
        "payments": payments_summary,
        "deposits": {
            "count": len(deposits),
            "amount": str(deposits_total),
        },
        "net_minus_deposits": str((orders_net - deposits_total) if orders_net else Decimal("0")),
    }


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir)

    orders_path = Path(args.orders)
    payments_path = Path(args.payments)
    deposits_path = Path(args.deposits)

    verbose = args.verbose

    log("Parsing payments…", verbose=verbose)
    payments = load_payments(payments_path, verbose=verbose)
    payment_index = build_payment_index(payments)

    log("Parsing orders…", verbose=verbose)
    orders = load_orders(orders_path, payment_index, year_filter=args.year, verbose=verbose)

    log("Parsing deposits…", verbose=verbose)
    deposits = load_deposits(deposits_path, verbose=verbose)

    orders_csv_path = output_dir / "orders.csv"
    payments_csv_path = output_dir / "payments.csv"
    deposits_csv_path = output_dir / "deposits.csv"

    log(f"Writing orders to {orders_csv_path}")
    order_fields = [
        "order_id",
        "sale_date",
        "status",
        "buyer_name",
        "buyer_username",
        "payment_method",
        "payment_type",
        "order_type",
        "number_of_items",
        "order_value",
        "order_total",
        "order_net",
        "adjusted_order_total",
        "adjusted_card_processing_fees",
        "adjusted_net_order_amount",
        "discount_amount",
        "shipping_discount",
        "shipping_amount",
        "sales_tax",
        "card_processing_fees",
        "coupon_code",
        "coupon_details",
        "date_shipped",
        "ship_lag_days",
        "street_1",
        "street_2",
        "ship_city",
        "ship_state",
        "ship_zipcode",
        "ship_country",
        "sku",
        "funds_available_on",
        "payout_lag_days",
        "gift_card_used",
        "payment_found",
        "payment_count",
        "payment_ids",
        "payment_status",
        "payment_gross",
        "payment_fees",
        "payment_net",
        "payment_adjusted_gross",
        "payment_adjusted_fees",
        "payment_adjusted_net",
        "refund_total",
    ]
    write_csv(orders_csv_path, order_fields, orders)

    log(f"Writing payments to {payments_csv_path}")
    payment_rows = [payment.to_row() for payment in payments]
    payment_fields = (
        list(payment_rows[0].keys())
        if payment_rows
        else [
            "payment_id",
            "order_id",
            "order_date",
            "funds_available_on",
            "status",
            "buyer_name",
            "buyer_username",
            "payment_type",
            "gross_amount",
            "fees",
            "net_amount",
            "posted_gross",
            "posted_fees",
            "posted_net",
            "adjusted_gross",
            "adjusted_fees",
            "adjusted_net",
            "gift_card_applied",
            "refund_amount",
            "currency",
            "listing_amount",
            "listing_currency",
            "exchange_rate",
        ]
    )
    write_csv(payments_csv_path, payment_fields, payment_rows)

    log(f"Writing deposits to {deposits_csv_path}")
    deposit_fields = [
        "deposit_date",
        "amount",
        "currency",
        "status",
        "bank_account_last4",
        "iso_week",
        "month",
        "quarter",
    ]
    write_csv(deposits_csv_path, deposit_fields, deposits)

    if not args.no_summary:
        summary = compute_summary(orders, payments, deposits)
        summary_path = output_dir / args.summary_json
        log(f"Writing summary to {summary_path}")
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    log("Done.")


if __name__ == "__main__":
    main()

# RideSplit 🚗

A simple expense-sharing application for three friends — Varun, Yashasvi, and Vrishank — to track daily college transportation expenses and split costs equally.

## Features
- Monthly calendar (23rd to 23rd billing cycle).
- Record daily vehicle usage using short codes.
- Support multiple vehicles on the same day.
- Automatically calculate individual expenses.
- Calculate equal contributions and payment settlements.
- Check total expenses spent until the current date.
- View monthly expense summaries.
- Export expense reports as CSV.
- Persistent storage of previous billing cycles.

## Vehicle Codes

| Code | Vehicle | Cost |
|---|---|---:|
| VC | Varun's Car | ₹315 |
| YC | Yashasvi's Car | ₹330 |
| VRC | Vrishank's Car | ₹330 |
| VB | Varun's Bike | ₹150 |
| YB | Yashasvi's Bike | ₹150 |
| VRB | Vrishank's Bike | ₹150 |

## Expense Calculation

Total Expense = Sum of all vehicle expenses.

Equal Contribution = Total Expense / 3.

The application calculates who owes money and who should receive money to ensure equal contributions.

## Tech Stack
- React.js
- JavaScript
- HTML & CSS
- LocalStorage

## Purpose

To make daily transportation expense tracking simple, transparent, and hassle-free among three friends.

**Built for Varun, Yashasvi & Vrishank.**

# Mintbook — Personal Finance Tracker

A responsive browser app built with HTML, CSS, and JavaScript. No build step, backend, API keys, or paid services required.

## Features

- Add, edit, and delete income and expenses
- Monthly summaries, category breakdowns, and spending budgets
- Search and filter transactions
- Local browser storage and validated JSON backup import/export
- Responsive layout and keyboard-accessible forms

Amounts use USD and integer cents to avoid rounding errors.

## Run locally

From this folder, with Python 3 installed:

```sh
python3 -m http.server 3000 --bind 0.0.0.0
```

Open http://localhost:3000. Use an HTTP server instead of opening index.html directly because the app uses JavaScript modules.

## Test

With Node.js 20 or newer, run `npm test`. No npm dependencies need installing.

## Data and privacy

Records stay in localStorage for the current browser and site address. This is a single-user app without sign-in, synchronization, or encryption. Clearing site data removes records. Export backups regularly and store them privately. Import replaces all records after confirmation. Google Fonts supplies typography; system fonts work offline. Multiple tabs must reload after another tab changes data.

## Publish a website

Host this folder on GitHub Pages, Netlify, or any static host. For GitHub Pages, publish the repository root from the desired branch in Settings → Pages, then visit `/personal-finance-tracker/` on the resulting site. Uploading code to GitHub does not automatically enable Pages.

## Files

- `index.html` — dashboard and form
- `style.css` — responsive layout
- `app.js` — UI and persistence
- `finance.js` — financial validation and calculations
- `finance.test.js` — data integrity tests

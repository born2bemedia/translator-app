# Translation Editor

A Next.js application for editing translations in a JSON file while maintaining its structure.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure the `en.json` file is in the root directory of the project.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- View all translations in a hierarchical structure
- Edit translations while maintaining the JSON structure
- Automatic saving of changes
- Modern UI with Tailwind CSS

## Project Structure

- `src/app/page.tsx` - Main page component with translation editing interface
- `src/app/api/translations/route.ts` - API routes for reading and writing translations
- `en.json` - Translation file 
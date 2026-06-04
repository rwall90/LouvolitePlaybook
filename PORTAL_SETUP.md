# Playbook Portal Setup

This project is now a Next.js portal/wiki app with:

- password-based member and admin login for the MVP
- Supabase-backed wiki pages
- admin page editing with draft/published status
- internal/client/everyone audience labels
- a Notion Markdown export importer

## Environment variables

Create `.env.local` for local development:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=choose-a-long-admin-password
MEMBER_PASSWORD=choose-a-member-password
```

## Supabase

Run `supabase/schema.sql` in the Supabase SQL editor. The app uses the service
role key only from server-side code.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Import a Notion export

Export Notion as **Markdown & CSV**, unzip it, then run:

```bash
npm run import:notion -- /absolute/path/to/unzipped-notion-export
```

Imported pages are created as `draft` and `internal` by default so an admin can
review, assign the right audience, then publish.

## Auth upgrade path

The current password role login is intentionally simple. When the portal shape
is right, replace it with Clerk, Auth0, or Supabase Auth and map authenticated
users to roles/organisations in Postgres.

## Notion API import

For better Notion fidelity than Markdown export, create a read-only Notion
integration and add it to the source playbook page.

Add these Vercel environment variables:

```text
NOTION_TOKEN=your-read-only-internal-integration-secret
NOTION_PAGE_ID=your-root-playbook-page-id
```

You can use `NOTION_PAGE_URL` instead of `NOTION_PAGE_ID`; the app will parse
the page id from the URL.

Run this in Supabase SQL Editor before the first API import:

```text
supabase/notion-blocks-migration.sql
```

Then sign in as admin and click **Import from Notion** on `/admin`. The importer
reads Notion only; it does not write back to Notion.

# Chuni Data

Data of chuni.

## Usage

Public access supabase configuration listed below.

```ini
SUPABASE_URL=https://czjtvowsyvdmnilbttoh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6anR2b3dzeXZkbW5pbGJ0dG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODkzNDM1MDIsImV4cCI6MjAwNDkxOTUwMn0.Xs8RYEtg9SO4TprNzfG-4hxBsl77myXwf5TbCoDgYs8
```

Database structure: refer to [src/types.ts](./src/types.ts)

Jackets: url like [https://czjtvowsyvdmnilbttoh.supabase.co/storage/v1/object/public/jacket/webp/3.webp](https://czjtvowsyvdmnilbttoh.supabase.co/storage/v1/object/public/jacket/webp/3.webp) or [https://czjtvowsyvdmnilbttoh.supabase.co/storage/v1/object/public/jacket/jpg/3.jpg](https://czjtvowsyvdmnilbttoh.supabase.co/storage/v1/object/public/jacket/jpg/3.jpg) (only this two format)

## About this repo

Scripts to update data.

Running:
```sh
pnpm tsx src/main.ts
```

## Why open source?

It's my freedom.

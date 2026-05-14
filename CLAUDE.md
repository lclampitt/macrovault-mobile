# MacroVault Mobile - Claude Code Conventions

## CRITICAL: Working Directory

- Always work in the main project root, NEVER in `.claude/worktrees/`
- Do not create git worktrees for any task
- If isolation is needed, use git branches in the main project directory
- Verify working directory with `pwd` before making changes

## Project Structure

- This is an Expo + React Native + TypeScript project
- Uses Expo Router (file-based routing)
- Project structure is FLAT under `app/` (no `(tabs)` folder unless explicitly added)
- Default screen is `app/index.tsx`

## Conventions

- All colors come from `constants/Colors.ts` - never hardcode hex values in components
- Supabase client lives at `lib/supabase.ts` - import from there for all data fetching
- Brand: dark theme only, background `#0f1117`, accent teal `#1D9E75`
- Match MacroVault web app design unless explicitly told otherwise

## What NOT To Do

- Do not run `npx expo start` (the user has it running)
- Do not commit changes (the user reviews and commits)
- Do not create worktrees
- Do not run destructive npm scripts like `reset-project`
- Do not modify `.env` (the user manages keys)
- Do not install dependencies without explicit instruction

## When Uncertain

Stop and ask. Do not improvise architectural decisions.

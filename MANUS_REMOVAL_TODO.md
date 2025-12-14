# Manus Dependency Removal - TODO List

## Phase 1: Remove Manus Plugins
- [x] Remove `vite-plugin-manus-runtime` from package.json
- [x] Clean up vite.config.ts (remove Manus hosts and plugin)
- [x] Remove Manus-specific imports from client code

## Phase 2: Replace OAuth System
- [x] Create simple JWT-based auth system
- [x] Create new auth file (server/_core/auth-simple.ts)
- [x] Update server/_core/context.ts
- [x] Update server/_core/index.ts
- [x] Update environment variables documentation

## Phase 3: Handle Optional Manus Features
- [x] Disable/comment out AI integration (server/_core/llm.ts)
- [x] Disable/comment out Manus notification system
- [ ] Note: Data API not found (may not exist)

## Phase 4: Testing & Documentation
- [x] Create deployment guide (DEPLOYMENT_GUIDE.md)
- [x] Document required environment variables
- [x] Create README for external hosting
- [ ] Test authentication flow (requires user testing)

## Progress: 13/14 tasks completed ✅

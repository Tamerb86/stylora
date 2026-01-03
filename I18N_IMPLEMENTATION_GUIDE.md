# Internationalization (i18n) Implementation Guide

## Project Status

### ✅ Completed (Infrastructure & Foundation)
- i18n framework fully configured (i18next + react-i18next)
- 4 languages supported: Norwegian (no), English (en), Arabic (ar), Ukrainian (uk)
- RTL (Right-to-Left) support for Arabic language
- Language switcher component functional
- Translation persistence via localStorage
- Norwegian set as default/fallback language
- Security scan passed - no vulnerabilities

### ✅ Fully Migrated Components
1. **WalkInQueue** (`client/src/components/WalkInQueue.tsx`)
   - 36+ strings migrated
   - All UI elements use `t()` function
   - Serves as reference implementation

### 🔄 Partially Complete
2. **POS** (`client/src/pages/POS.tsx`)
   - Hook added, awaiting string migration
   - Translations exist in JSON

### ⏳ Remaining Work
- **Components**: 113 of 114 need migration (~99%)
- **Estimated strings**: ~2,000+ across all components
- **Estimated effort**: 40-80 hours

## Implementation Steps (For Each Component)

### Step 1: Add Imports
```tsx
import { useTranslation } from "react-i18next";
```

### Step 2: Initialize Hook
```tsx
export default function MyComponent() {
  const { t } = useTranslation();
  // ... rest of component
}
```

### Step 3: Find All Hard-Coded Strings
Use grep to identify strings:
```bash
grep -n '"[A-ZÆØÅa-zæøå]' path/to/component.tsx
```

### Step 4: Create Translation Keys
Organize by namespace and feature:
```json
{
  "customers": {
    "title": "Customers",
    "addCustomer": "Add Customer",
    "editCustomer": "Edit Customer",
    "deleteConfirm": "Are you sure you want to delete {name}?"
  }
}
```

### Step 5: Replace Strings
```tsx
// Before
<h1>Customers</h1>
<Button>Add Customer</Button>
toast.success("Customer added successfully!");

// After
<h1>{t("customers.title")}</h1>
<Button>{t("customers.addCustomer")}</Button>
toast.success(t("customers.addSuccess"));
```

### Step 6: Handle Variables
For strings with dynamic content:
```tsx
// Before
`Are you sure you want to delete ${customerName}?`

// After
t("customers.deleteConfirm", { name: customerName })

// In JSON:
"deleteConfirm": "Are you sure you want to delete {name}?"
```

### Step 7: Add to All 4 Language Files
Every key must exist in:
- `client/src/i18n/locales/no.json` (Norwegian)
- `client/src/i18n/locales/en.json` (English)
- `client/src/i18n/locales/ar.json` (Arabic)
- `client/src/i18n/locales/uk.json` (Ukrainian)

### Step 8: Test
```bash
# Build
npm run check

# Test in browser
# - Switch between languages
# - Verify RTL layout for Arabic
# - Check for missing translation warnings
```

## Translation Key Naming Convention

### Structure
```
{namespace}.{feature}.{element}
```

### Examples
```
common.save
common.cancel
common.delete

customers.title
customers.addCustomer
customers.editCustomer
customers.list.empty
customers.list.loading

errors.required
errors.invalidEmail
errors.passwordMismatch

messages.saveSuccess
messages.saveError
messages.deleteConfirm
```

### Best Practices
1. **Use descriptive names**: `addCustomer` not `add`
2. **Group related keys**: Use nested objects
3. **Avoid duplication**: Use specific keys for different contexts
4. **Keep keys short but clear**: Balance brevity with clarity
5. **Use camelCase**: For consistency

## Current Translation Structure

### Existing Namespaces
```
common          - Shared UI elements (save, cancel, etc.)
nav             - Navigation menu items
dashboard       - Dashboard page
walkInQueue     - Walk-in queue management
pos             - Point of sale system
onboarding      - Initial setup wizard
welcome         - Welcome messages
contact_us      - Contact information
language_switch - Language switcher
```

### Needed Namespaces (Examples)
```
customers      - Customer management
employees      - Employee management
services       - Service management
products       - Product management
appointments   - Appointment booking/management
orders         - Order processing
reports        - Reports & analytics
settings       - Settings pages
auth           - Authentication (login, signup, etc.)
errors         - Error messages
messages       - Success/info messages
```

## Priority Order for Migration

### Phase 1: High-Value Features (Have Translations)
1. ✅ WalkInQueue (DONE)
2. POS (39 strings, translations exist)
3. Dashboard (partially done, complete remaining)
4. Onboarding (partially done, complete remaining)

### Phase 2: Core User-Facing (Need Translation Keys)
5. Appointments (47 strings)
6. Customers
7. Employees
8. Services
9. Products
10. Orders (40 strings)
11. Reports (46 strings)

### Phase 3: Settings & Configuration
12. Settings pages
13. Payment Providers (36 strings)
14. Print Settings (26 strings)
15. SMS Settings (25 strings)
16. Domain Settings (25 strings)

### Phase 4: Public Pages
17. Login/Signup/Auth
18. PublicBooking
19. Home page
20. Terms (44 strings)
21. Privacy (59 strings)

### Phase 5: Admin & Advanced
22. SaasAdmin pages (44-48 strings each)
23. Analytics & Financial reports
24. Communications & Bulk messaging
25. Remaining components

## Common Patterns

### Toast Messages
```tsx
// Success
toast.success(t("messages.saveSuccess"));

// Error
toast.error(t("messages.saveError"));

// With variable
toast.success(t("messages.customerAdded", { name }));
```

### Form Labels
```tsx
<Label htmlFor="name">{t("customers.form.name")}</Label>
<Label htmlFor="email">{t("customers.form.email")}</Label>
```

### Button Text
```tsx
<Button>{t("common.save")}</Button>
<Button variant="destructive">{t("common.delete")}</Button>
```

### Dialog Titles
```tsx
<DialogTitle>{t("customers.dialogs.addTitle")}</DialogTitle>
<DialogDescription>{t("customers.dialogs.addDescription")}</DialogDescription>
```

### Placeholders
```tsx
<Input placeholder={t("customers.form.namePlaceholder")} />
<Select>
  <SelectValue placeholder={t("common.select")} />
</Select>
```

### Confirmation Messages
```tsx
if (confirm(t("customers.confirmDelete", { name }))) {
  // delete
}
```

## RTL Support (Already Implemented)

The App component automatically handles RTL:
```tsx
// In App.tsx
useEffect(() => {
  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = i18n.language;
}, [i18n.language]);
```

No additional work needed per component!

## Testing Checklist

For each migrated component:
- [ ] All visible text uses `t()` function
- [ ] No hard-coded strings remain
- [ ] Translation keys exist in all 4 language files
- [ ] TypeScript compiles without errors
- [ ] Component renders in all 4 languages
- [ ] Arabic displays RTL correctly
- [ ] Variables interpolate correctly
- [ ] Toast messages appear in correct language

## Troubleshooting

### Issue: Key shows instead of translation
**Cause**: Translation key missing or misspelled
**Fix**: Check key name and add to all JSON files

### Issue: Component shows English when Norwegian selected
**Cause**: Missing translation in no.json
**Fix**: Add translation to no.json file

### Issue: Arabic not displaying RTL
**Cause**: RTL support already implemented globally
**Fix**: No action needed, works automatically

### Issue: TypeScript error on `t()` call
**Cause**: `useTranslation` hook not imported/initialized
**Fix**: Add import and hook as shown in Step 1-2

## Tools & Resources

### Analysis Script
Located at: `/tmp/extract_strings.py`
```bash
python3 /tmp/extract_strings.py
```
Shows which files need i18n and string counts.

### Find Strings in File
```bash
grep -n '"[A-ZÆØÅa-zæøå]' filename.tsx | grep -v "className\|import"
```

### Check Current Progress
```bash
# Count files with i18n
grep -r "useTranslation" client/src --include="*.tsx" | wc -l

# Count files without i18n
find client/src -name "*.tsx" | wc -l
```

### Validate JSON Files
```bash
# Check for syntax errors
jq . client/src/i18n/locales/no.json
jq . client/src/i18n/locales/en.json
jq . client/src/i18n/locales/ar.json
jq . client/src/i18n/locales/uk.json
```

## Reference Implementation

See `client/src/components/WalkInQueue.tsx` for a complete example:
- All strings migrated
- Proper use of `t()` function
- Variable interpolation
- Toast messages
- Form labels
- Button text
- Dialog content
- Confirmation messages

## Documentation Links

- **i18next**: https://www.i18next.com/
- **react-i18next**: https://react.i18next.com/
- **Translation Config**: `client/src/i18n/config.ts`
- **Translation Files**: `client/src/i18n/locales/`

## Quick Start for Next Developer

1. Pick a component from the priority list
2. Run analysis script to see string count
3. Add `useTranslation` import and hook
4. Create namespace in JSON files if needed
5. Extract all strings and create translation keys
6. Replace strings with `t()` calls
7. Test in all 4 languages
8. Commit and move to next component

## Notes

- Norwegian (no) is business language, use it as reference
- Keep translations concise and professional
- Arabic translations should use formal language
- Test RTL layout carefully for Arabic
- Use consistent terminology across application
- Don't translate:
  - Code/technical terms (API, UUID, JSON, etc.)
  - Brand names
  - Email addresses
  - URLs (unless localized)
  - Numbers/dates (handled by i18n automatically)

## Success Criteria

Implementation complete when:
- [ ] All 114 components use `useTranslation`
- [ ] No hard-coded visible strings remain
- [ ] All translation keys in all 4 language files
- [ ] Application builds without errors
- [ ] Language switching works on all pages
- [ ] Arabic displays RTL correctly
- [ ] Norwegian is default/fallback language
- [ ] No missing translation warnings in console

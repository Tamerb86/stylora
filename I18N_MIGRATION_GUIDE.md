# i18n Migration Guide

## Quick Start Examples

### Basic Translation

```tsx
// Before
<Button>Save Changes</Button>
<h1>Customer Details</h1>
<p>Loading...</p>

// After
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <>
      <Button>{t('common.save')}</Button>
      <h1>{t('customers.details')}</h1>
      <p>{t('common.loading')}</p>
    </>
  );
}
```

### With Interpolation

```tsx
// Translation keys
{
  "customers": {
    "greeting": "Velkommen, {name}!",
    "orderCount": "Du har {count} ordre"
  }
}

// Usage
<h1>{t('customers.greeting', { name: customer.name })}</h1>
<p>{t('customers.orderCount', { count: orders.length })}</p>
```

### Validation Messages

```tsx
// Translation keys
{
  "forms": {
    "required": "{field} er påkrevd",
    "minLength": "{field} må være minst {min} tegn",
    "emailInvalid": "Ugyldig e-postadresse"
  }
}

// Usage in zod schema
const schema = z.object({
  email: z
    .string()
    .min(1, t('forms.required', { field: t('common.email') }))
    .email(t('forms.emailInvalid')),
  name: z
    .string()
    .min(2, t('forms.minLength', { field: t('common.name'), min: 2 })),
});
```

### Toast Notifications

```tsx
// Translation keys
{
  "toasts": {
    "customerAdded": "Kunde lagt til!",
    "customerUpdated": "Kunde oppdatert!",
    "error": "Noe gikk galt: {message}"
  }
}

// Usage
import { toast } from 'sonner';

// Success
toast.success(t('toasts.customerAdded'));

// Error with details
toast.error(t('toasts.error', { message: error.message }));
```

### Dialog/Modal Content

```tsx
// Translation keys
{
  "dialogs": {
    "deleteCustomer": {
      "title": "Slett kunde",
      "description": "Er du sikker på at du vil slette {name}? Denne handlingen kan ikke angres.",
      "confirm": "Ja, slett",
      "cancel": "Avbryt"
    }
  }
}

// Usage
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        {t('dialogs.deleteCustomer.title')}
      </AlertDialogTitle>
      <AlertDialogDescription>
        {t('dialogs.deleteCustomer.description', { name: customer.name })}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>
        {t('dialogs.deleteCustomer.cancel')}
      </AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        {t('dialogs.deleteCustomer.confirm')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Select/Dropdown Options

```tsx
// Translation keys
{
  "customers": {
    "status": {
      "active": "Aktiv",
      "inactive": "Inaktiv",
      "pending": "Ventende"
    }
  }
}

// Usage
<Select>
  <SelectTrigger>
    <SelectValue placeholder={t('common.select')} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="active">
      {t('customers.status.active')}
    </SelectItem>
    <SelectItem value="inactive">
      {t('customers.status.inactive')}
    </SelectItem>
    <SelectItem value="pending">
      {t('customers.status.pending')}
    </SelectItem>
  </SelectContent>
</Select>
```

### Table Headers

```tsx
// Translation keys
{
  "customers": {
    "table": {
      "name": "Navn",
      "email": "E-post",
      "phone": "Telefon",
      "lastVisit": "Siste besøk",
      "actions": "Handlinger"
    }
  }
}

// Usage
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>{t('customers.table.name')}</TableHead>
      <TableHead>{t('customers.table.email')}</TableHead>
      <TableHead>{t('customers.table.phone')}</TableHead>
      <TableHead>{t('customers.table.lastVisit')}</TableHead>
      <TableHead>{t('customers.table.actions')}</TableHead>
    </TableRow>
  </TableHeader>
  {/* ... */}
</Table>
```

### Empty States

```tsx
// Translation keys
{
  "customers": {
    "empty": {
      "title": "Ingen kunder ennå",
      "description": "Kom i gang ved å legge til din første kunde",
      "action": "Legg til kunde"
    }
  }
}

// Usage
{customers.length === 0 ? (
  <div className="text-center py-12">
    <h3 className="text-lg font-semibold">
      {t('customers.empty.title')}
    </h3>
    <p className="text-muted-foreground mt-2">
      {t('customers.empty.description')}
    </p>
    <Button className="mt-4" onClick={handleAdd}>
      {t('customers.empty.action')}
    </Button>
  </div>
) : (
  <CustomersList customers={customers} />
)}
```

### Form Labels with React Hook Form

```tsx
// Translation keys
{
  "forms": {
    "labels": {
      "firstName": "Fornavn",
      "lastName": "Etternavn",
      "email": "E-post",
      "phone": "Telefonnummer"
    },
    "placeholders": {
      "firstName": "Skriv inn fornavn",
      "email": "din@epost.no"
    }
  }
}

// Usage
<form>
  <div>
    <Label htmlFor="firstName">
      {t('forms.labels.firstName')}
    </Label>
    <Input
      id="firstName"
      placeholder={t('forms.placeholders.firstName')}
      {...register('firstName')}
    />
    {errors.firstName && (
      <p className="text-red-500 text-sm mt-1">
        {errors.firstName.message}
      </p>
    )}
  </div>
</form>
```

### Dynamic Menu Items

```tsx
// Translation keys stored in component
const getMenuItems = (t: (key: string) => string) => [
  {
    label: t('nav.dashboard'),
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: t('nav.customers'),
    icon: Users,
    path: '/customers',
  },
];

// Usage in component
function Navigation() {
  const { t } = useTranslation();
  const menuItems = getMenuItems(t);
  
  return (
    <nav>
      {menuItems.map(item => (
        <Link key={item.path} to={item.path}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
```

## Migration Workflow

### Step 1: Identify Strings
```bash
# Find all hardcoded strings in a file
grep -n '"[A-Z][a-z]' client/src/pages/Customers.tsx
```

### Step 2: Add to Norwegian (Source)
```json
// client/src/i18n/locales/no.json
{
  "customers": {
    "title": "Kunder",
    "addNew": "Legg til kunde",
    "edit": "Rediger kunde",
    "delete": "Slett kunde",
    "search": "Søk etter kunder...",
    "filters": {
      "all": "Alle",
      "active": "Aktive",
      "inactive": "Inaktive"
    }
  }
}
```

### Step 3: Translate to English
```json
// client/src/i18n/locales/en.json
{
  "customers": {
    "title": "Customers",
    "addNew": "Add Customer",
    "edit": "Edit Customer",
    "delete": "Delete Customer",
    "search": "Search customers...",
    "filters": {
      "all": "All",
      "active": "Active",
      "inactive": "Inactive"
    }
  }
}
```

### Step 4: Translate to Arabic (RTL)
```json
// client/src/i18n/locales/ar.json
{
  "customers": {
    "title": "العملاء",
    "addNew": "إضافة عميل",
    "edit": "تحرير العميل",
    "delete": "حذف العميل",
    "search": "البحث عن العملاء...",
    "filters": {
      "all": "الكل",
      "active": "نشط",
      "inactive": "غير نشط"
    }
  }
}
```

### Step 5: Translate to Ukrainian
```json
// client/src/i18n/locales/uk.json
{
  "customers": {
    "title": "Клієнти",
    "addNew": "Додати клієнта",
    "edit": "Редагувати клієнта",
    "delete": "Видалити клієнта",
    "search": "Пошук клієнтів...",
    "filters": {
      "all": "Всі",
      "active": "Активні",
      "inactive": "Неактивні"
    }
  }
}
```

### Step 6: Update Component
```tsx
import { useTranslation } from 'react-i18next';

export function Customers() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('customers.title')}</h1>
      <Button onClick={handleAdd}>
        {t('customers.addNew')}
      </Button>
      {/* ... rest of component ... */}
    </div>
  );
}
```

## Common Patterns

### Loading States
```tsx
{isLoading ? (
  <p>{t('common.loading')}</p>
) : (
  <Content />
)}
```

### Error States
```tsx
{error && (
  <Alert variant="destructive">
    {t('errors.generic', { message: error.message })}
  </Alert>
)}
```

### Confirmation Dialogs
```tsx
const confirmed = window.confirm(
  t('dialogs.confirmDelete', { name: item.name })
);
```

### Status Badges
```tsx
<Badge variant={status}>
  {t(`common.status.${status}`)}
</Badge>
```

## Best Practices

1. **Use Semantic Keys**: `customers.addNew` not `button1`
2. **Group Related Keys**: Keep all customer strings under `customers.*`
3. **Avoid Concatenation**: Use interpolation instead
   ```tsx
   // Bad
   {t('welcome') + ' ' + user.name}
   
   // Good
   {t('welcome', { name: user.name })}
   ```

4. **Handle Missing Keys**: Provide fallback
   ```tsx
   {t('some.key', 'Fallback text')}
   ```

5. **Keep Keys Consistent**: Use same structure across languages
6. **Test RTL**: Always check Arabic layout
7. **Use Namespaces**: Organize large translation files
   ```tsx
   const { t } = useTranslation('customers');
   t('addNew'); // from customers namespace
   ```

## Tools & Commands

```bash
# Check for hardcoded strings
npm run check:i18n

# Build project
npm run build

# Type check
npm run check

# Test locally
npm run dev
```

## Troubleshooting

### Translation Not Showing
1. Check key exists in JSON file
2. Verify JSON file is valid (no trailing commas)
3. Check console for i18n errors
4. Ensure component imports `useTranslation`

### RTL Layout Issues
1. Verify `document.documentElement.dir` is set
2. Check CSS for hardcoded `left/right` instead of `start/end`
3. Test sidebar behavior in Arabic mode

### Build Errors
1. Validate all JSON files: `node -e "JSON.parse(require('fs').readFileSync('file.json'))"`
2. Check for TypeScript errors: `npm run check`

# Dashboard Stat Cards - Root Cause Analysis

## Current State
Looking at the screenshot, I can see the stat cards are displaying correctly:
- 4 cards in a row: "Dagens avtaler", "Ventende", "Dagens omsetning", "Totalt kunder"
- Each card shows: icon (top right), title, value, and description
- No visible text overlap in the current view

## Potential Issues Identified

### 1. **Structural Problem: Using Custom Divs Instead of Semantic Components**
The stat cards are currently built with custom divs instead of using the Card component from shadcn/ui. This creates several issues:
- Inconsistent styling with the rest of the application
- Manual management of borders, padding, and spacing
- Complex gradient overlay system that adds unnecessary layers
- Harder to maintain and update

### 2. **Complex Layering with Absolute Positioning**
```tsx
<div className="relative border-2 rounded-xl...">
  <div className="absolute inset-0 bg-gradient-to-br..."></div>  // Background layer
  <div className="relative p-6 space-y-3">...</div>              // Content layer
</div>
```
This creates:
- Z-index complexity
- Potential rendering issues
- Harder to debug layout problems

### 3. **Flex Layout Without Proper Constraints**
The header section uses:
```tsx
<div className="flex items-start justify-between gap-2">
  <h3 className="text-sm font-medium text-card-foreground leading-tight flex-1 min-w-0">
  <div className="p-2 rounded-lg bg-gradient-to-br... shrink-0 flex-none">
```

While this works, it's overly complex with redundant classes (`shrink-0` and `flex-none` do the same thing).

### 4. **Responsive Font Sizing Issues**
The value uses: `text-2xl sm:text-3xl` which can cause layout shifts on different screen sizes.

### 5. **Lack of Consistent Spacing System**
- Header uses `space-y-3`
- Content uses `space-y-1`
- Card padding is `p-6`
These values are arbitrary and not part of a consistent design system.

## Root Cause
The **fundamental issue** is that the stat cards are over-engineered with:
1. Custom div structure instead of using shadcn/ui Card components
2. Complex absolute positioning for gradients
3. Redundant CSS classes
4. Inconsistent spacing values

## Recommended Solution
**Rebuild stat cards using shadcn/ui Card component** with:
1. Clean, semantic HTML structure
2. Proper use of Card, CardHeader, CardContent components
3. Simplified gradient system (background only, no overlay)
4. Consistent spacing from design tokens
5. Proper flex constraints without redundancy
6. Better responsive behavior

This will make the code:
- More maintainable
- Consistent with the rest of the app
- Easier to debug
- More accessible
- Better performing

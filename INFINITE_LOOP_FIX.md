# Fix: Maximum Update Depth Exceeded Error

## Problem Description

When clicking the "Preview and Publish" button on the product creation page, React threw the following error:

```
Uncaught Error: Maximum update depth exceeded. This can happen when a component 
repeatedly calls setState inside componentWillUpdate or componentDidUpdate. 
React limits the number of nested updates to prevent infinite loops.
```

The error trace pointed to `compose-refs.tsx`, which is a utility used by UI components like Dialog, Tooltip, Popover, etc.

## Root Cause

The issue was in `/apps/web/app/dashboard/products/[productId]/preview-publish/page.tsx` at lines 1176-1249.

The `useEffect` hook had an **infinite loop pattern**:

```javascript
// BEFORE (BROKEN):
useEffect(() => {
  if (formData) {
    // ... code that calls setPermissions()
    setPermissions(defaultPermissions)
  }
}, [formData, permissions])  // ❌ permissions in dependency array
```

**Why this caused an infinite loop:**

1. The effect depends on `permissions` in the dependency array
2. Inside the effect, it calls `setPermissions()`  
3. When `permissions` state changes, the effect runs again
4. This triggers another `setPermissions()` call
5. Infinite loop → React exceeds maximum update depth

Additionally, the effect checking `Object.keys(permissions).length === 0` was trying to guard against re-initialization, but because `permissions` was in the dependencies, it would still re-run whenever permissions changed.

## Solution

The fix involved **TWO separate issues** that both contributed to the error:

---

## Issue #1: Infinite Loop in useEffect (PRIMARY CAUSE)

### Changes Made:

#### 1. Added a ref to track initialization

```javascript
// Track if we've initialized permissions to prevent re-initialization
const permissionsInitialized = useRef(false)
```

### 2. Removed `permissions` from dependency array

```javascript
// AFTER (FIXED):
useEffect(() => {
  // Only initialize once when formData is available
  if (!formData || permissionsInitialized.current) return
  
  const formDataAny = formData as any
  
  // Load saved permissions from product_data
  if (formDataAny.field_permissions && typeof formDataAny.field_permissions === 'object') {
    setPermissions(formDataAny.field_permissions)
    permissionsInitialized.current = true  // ✅ Mark as initialized
    return
  }
  
  // ... initialize default permissions ...
  
  setPermissions(defaultPermissions)
  permissionsInitialized.current = true  // ✅ Mark as initialized
}, [formData])  // ✅ Only depend on formData
```

### 3. Fixed similar issue in document metadata effect

The document metadata `useEffect` had a similar pattern where `documentMetadata` was in the dependency array while the effect was calling `setDocumentMetadata()`. This was also fixed by removing `documentMetadata` from the dependencies.

```javascript
// BEFORE (POTENTIAL ISSUE):
useEffect(() => {
  // ... code that calls setDocumentMetadata()
}, [formData, documentMetadata])  // ❌ documentMetadata in dependencies

// AFTER (FIXED):
useEffect(() => {
  // ... code that calls setDocumentMetadata()
}, [formData])  // ✅ Only depend on formData
```

---

## Issue #2: Nested TooltipProvider (SECONDARY CAUSE)

### Root Cause

There was a **nested `TooltipProvider`** issue that can also trigger the `compose-refs` error:

1. The `RestrictedFieldDisplay` component wrapped its content in `<TooltipProvider>`
2. The `RealPagePreview` component ALSO wrapped everything in `<TooltipProvider>`
3. `RealPagePreview` uses multiple `RestrictedFieldDisplay` components inside it
4. This created nested `TooltipProvider` components

**Why this is problematic:**

React's Tooltip components use ref forwarding and composition internally. When you nest `TooltipProvider` components, it can cause issues with the ref composition chain, especially when combined with other state update issues. The `compose-refs.tsx` error in the stack trace was pointing to this.

### Fix

Removed the `TooltipProvider` wrapper from `RestrictedFieldDisplay` since `RealPagePreview` already provides the context:

```javascript
// BEFORE (NESTED - PROBLEMATIC):
function RestrictedFieldDisplay({ ... }) {
  return (
    <TooltipProvider>  // ❌ Nested provider
      <Tooltip>
        {/* ... */}
      </Tooltip>
    </TooltipProvider>
  )
}

// In RealPagePreview:
<TooltipProvider>  // ❌ Already has a provider
  <RestrictedFieldDisplay />  // Creates nested provider
</TooltipProvider>

// AFTER (FIXED):
function RestrictedFieldDisplay({ ... }) {
  return (
    <Tooltip>  // ✅ Uses parent provider
      {/* ... */}
    </Tooltip>
  )
}

// In RealPagePreview:
<TooltipProvider>  // ✅ Single provider for all tooltips
  <RestrictedFieldDisplay />  // Uses parent provider
</TooltipProvider>
```

## Testing

After applying both fixes:
- ✅ No linter errors
- ✅ The effect only runs once when `formData` changes
- ✅ The `permissionsInitialized` ref prevents re-initialization
- ✅ No nested `TooltipProvider` components
- ✅ No more infinite loop or compose-refs errors

## Files Modified

- `/apps/web/app/dashboard/products/[productId]/preview-publish/page.tsx`
  - Added `useRef` import
  - Added `permissionsInitialized` ref
  - Fixed permissions initialization `useEffect` (removed `permissions` from dependencies)
  - Fixed document metadata `useEffect` (removed `documentMetadata` from dependencies)
  - Removed `TooltipProvider` wrapper from `RestrictedFieldDisplay` component to prevent nesting

## Key Learnings

1. **Never include state in useEffect dependencies if you're setting that same state inside the effect** unless you have proper guards to prevent infinite loops.

2. **Use refs to track initialization status** when you want to initialize state only once based on props/data changes.

3. **Avoid nesting Context Providers** (like `TooltipProvider`, `ThemeProvider`, etc.):
   - Only one provider should exist at the top level
   - Child components should consume the context, not create new providers
   - Nested providers can cause ref composition issues and unexpected behavior

4. **React's "Maximum update depth exceeded" error** often indicates:
   - A `useEffect` with a state in its dependencies that it also sets
   - A component setting state during render
   - Infinite recursion in state updates
   - Nested context providers causing re-render loops

5. **The `compose-refs` error** in the stack trace was pointing to the Tooltip nesting issue:
   - When you see `compose-refs` in the error, check for nested Providers or ref forwarding issues
   - The error appears in the ref composition utility because that's where React manages refs across component boundaries
   - The actual cause can be either state loops OR nested providers that mess with the ref chain


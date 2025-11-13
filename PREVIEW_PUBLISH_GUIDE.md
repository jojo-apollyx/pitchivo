# Preview & Publish Page - Visual Guide

## 🎨 UI Layout

### Desktop View (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Header (sticky, backdrop blur)                                           │
│ ← Back    Product Name: Collagen Peptide      [Ready to Publish]        │
└──────────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────┐
│ 👁️ Preview as: [Merchant View] [Email Visitor] [After RFQ]              │
└──────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────┬─────────────────────────────────────┐
│ PRODUCT PREVIEW (66%)              │ SIDEBAR (33%)                       │
│                                    │                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Product Information                │ Permission Overview                 │
│ ─────────────────────────────────  │ ─────────────────────────────────  │
│ Product Name         [🌐 ✉️ 🧾]   │ 🌐 Public         15 fields        │
│ Collagen Peptide                   │ ✉️ After Click    8 fields         │
│ ───────────────────────────────    │ 🧾 After RFQ      5 fields         │
│ Category             [🌐 ✉️ 🧾]   │                                     │
│ Protein & Peptides                 │ [Set All to Public]                │
│ ───────────────────────────────    │ [Set All to After RFQ]             │
│ CAS Number           [🌐 ✉️ 🧾]   │                                     │
│ 9007-34-5       ✉️ Email access    │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ───────────────────────────────    │ Channel Links                       │
│ Origin Country       [🌐 ✉️ 🧾]   │ ─────────────────────────────────  │
│ China                              │ Email Default  ?ch=email     [✅]   │
│ ───────────────────────────────    │ QR Booth      ?ch=expo       [✅]   │
│ Manufacturer         [🌐 ✉️ 🧾]   │ LinkedIn      ?ch=linkedin   [✅]   │
│ ABC Biotech                        │                                     │
│ ───────────────────────────────    │ [➕ Add Channel]  [📷 QR Codes]    │
│                                    │                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Technical Specifications           │ Auto Optimization                   │
│ ─────────────────────────────────  │ ─────────────────────────────────  │
│ Appearance           [🌐 ✉️ 🧾]   │ ☑️ Auto AIO Optimize               │
│ White powder                       │ Automatically optimize for SEO &   │
│ ───────────────────────────────    │ channel tracking                    │
│ pH                   [🌐 ✉️ 🧾]   │                                     │
│ 5.0-7.0                            │                                     │
│                                    │                                     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │                                     │
│ Pricing & MOQ                      │                                     │
│ ─────────────────────────────────  │                                     │
│ Price & Lead Time    [🌐 ✉️ 🧾]   │                                     │
│ [...] 🧾 RFQ required              │                                     │
└────────────────────────────────────┴─────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────────┐
│ Footer (fixed, backdrop blur)                                            │
│ 15 public • 8 after click • 5 after RFQ   [🚀 Publish Product & Generate│
│                                                Links]                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mobile View (<1024px)

```
┌─────────────────────────┐
│ Header (sticky)         │
│ ← Back                  │
│ Collagen Peptide        │
│ [Ready to Publish]      │
└─────────────────────────┘
┌─────────────────────────┐
│ 👁️ Preview as:          │
│ [Merchant View]         │
│ [Email Visitor]         │
│ [After RFQ]             │
└─────────────────────────┘
┌─────────────────────────┐
│ Product Information     │
├─────────────────────────┤
│ Product Name            │
│ [🌐][✉️][🧾]            │
│ Collagen Peptide        │
├─────────────────────────┤
│ Category                │
│ [🌐][✉️][🧾]            │
│ Protein & Peptides      │
├─────────────────────────┤
│ CAS Number              │
│ [🌐][✉️][🧾]            │
│ 9007-34-5               │
│ ✉️ Email access         │
└─────────────────────────┘
┌─────────────────────────┐
│ Technical Specs         │
├─────────────────────────┤
│ Appearance              │
│ [🌐][✉️][🧾]            │
│ White powder            │
└─────────────────────────┘
┌─────────────────────────┐
│ Permission Overview     │
├─────────────────────────┤
│ 🌐 Public: 15 fields    │
│ ✉️ After Click: 8       │
│ 🧾 After RFQ: 5         │
├─────────────────────────┤
│ [Set All to Public]     │
│ [Set All to After RFQ]  │
└─────────────────────────┘
┌─────────────────────────┐
│ Channel Links           │
├─────────────────────────┤
│ Email Default [✅]      │
│ ?ch=email               │
├─────────────────────────┤
│ QR Booth [✅]           │
│ ?ch=expo                │
├─────────────────────────┤
│ [➕ Add Channel]        │
│ [📷 QR Codes]           │
└─────────────────────────┘
┌─────────────────────────┐
│ Footer (fixed)          │
│ [🚀 Publish Product &   │
│  Generate Links]        │
└─────────────────────────┘
```

## 🎯 Permission Widget States

### Default State (Public Selected)
```
┌────────────────────────────────┐
│ [🌐 Public] [✉️][🧾]           │
│   Active      Inactive          │
└────────────────────────────────┘
```

### After Click Selected
```
┌────────────────────────────────┐
│ [🌐][✉️ After Click][🧾]       │
│      Inactive  Active           │
└────────────────────────────────┘
```

### After RFQ Selected
```
┌────────────────────────────────┐
│ [🌐][✉️][🧾 After RFQ]         │
│      Inactive     Active        │
└────────────────────────────────┘
```

## 🔄 View Mode Simulation

### Merchant View (Default)
- **All fields visible** with full opacity
- **Permission widgets enabled** for editing
- No field masking

### Email Visitor View
- **Public fields**: Full opacity ✅
- **After Click fields**: Full opacity ✅
- **After RFQ fields**: Reduced opacity (40%) + Badge "🧾 RFQ required"
- **Permission widgets disabled** (view only)

### After RFQ View
- **All fields visible** with full opacity ✅
- Simulates buyer who submitted RFQ
- **Permission widgets disabled** (view only)

## 🎨 Color Coding

### Permission Levels
```
🌐 Public        → Primary color (bg-primary)
✉️ After Click   → Primary color (bg-primary)
🧾 After RFQ     → Primary color (bg-primary)
```

### Status Badges
```
[Ready to Publish]  → Accent color (bg-accent/10, border-accent/30)
[✅ Email access]   → Success green
[🧾 RFQ required]   → Muted gray (border-border/50)
```

## 📱 Responsive Breakpoints

| Screen Size | Layout | Columns | Spacing |
|------------|--------|---------|---------|
| < 640px    | Mobile | 1       | px-4, gap-3 |
| 640px-1024px | Tablet | 1     | px-6, gap-4 |
| ≥ 1024px   | Desktop | 3 (2+1) | px-8, gap-6 |

## 🧪 Testing Instructions

### Test Case 1: Navigation Flow
1. Go to `/dashboard/products/create`
2. Fill in product name: "Test Product"
3. Click **"Next: Preview & Publish"** button
4. ✅ Should redirect to `/dashboard/products/{productId}/preview-publish`
5. ✅ Should show "Ready to Publish" badge
6. ✅ Should display product preview

### Test Case 2: Permission Widget Interaction
1. Locate a field (e.g., "CAS Number")
2. Click **🌐 Public** → Widget should be active (bg-primary)
3. Click **✉️ After Click** → Widget should switch to active
4. Click **🧾 After RFQ** → Widget should switch to active
5. ✅ Permission stats in sidebar should update in real-time

### Test Case 3: View Mode Switcher
1. Click **"Email Visitor"** button
2. ✅ Fields with "After RFQ" permission should become opaque (40%)
3. ✅ Badge "🧾 RFQ required" should appear on hidden fields
4. ✅ Permission widgets should be disabled
5. Click **"Merchant View"** to return to normal

### Test Case 4: Bulk Permission Actions
1. Click **"Set All to Public"** button
2. ✅ All permission widgets should switch to Public
3. ✅ Sidebar stats should show "28 public, 0 after click, 0 after RFQ"
4. Click **"Set All to After RFQ"**
5. ✅ All widgets should switch to After RFQ
6. ✅ Toast notification should appear

### Test Case 5: Add Custom Channel
1. Scroll to "Channel Links" section
2. Click **"➕ Add Channel"** button
3. Input field should appear
4. Type "Twitter" and press Enter
5. ✅ New channel should appear: "Twitter ?ch=twitter [✅]"
6. ✅ Toast: "Channel 'Twitter' added"

### Test Case 6: Final Publish
1. Review all field permissions
2. Click **"🚀 Publish Product & Generate Links"** button
3. ✅ Loading state: "Publishing..." with spinner
4. ✅ Success toast: "✅ Product published successfully! Links and QR codes generated."
5. ✅ Should redirect to `/dashboard/products`
6. ✅ Product status should be "published" in database

### Test Case 7: Mobile Responsiveness
1. Resize browser to < 640px
2. ✅ Layout should stack vertically
3. ✅ Permission widgets should show icons only
4. ✅ Sidebar should appear below product preview
5. ✅ Publish button should be full-width at bottom

## 🐛 Edge Cases to Test

### Edge Case 1: No Product Data
- **URL**: `/dashboard/products/invalid-id/preview-publish`
- **Expected**: Error message "Product not found" + Back button

### Edge Case 2: Empty Fields
- **Scenario**: Product with many empty fields
- **Expected**: Fields show "-" placeholder, still have permission widgets

### Edge Case 3: Long Product Name
- **Scenario**: Product name > 50 characters
- **Expected**: Name should wrap or truncate with ellipsis on mobile

### Edge Case 4: Duplicate Channel Names
- **Scenario**: Try to add "Email" channel (already exists)
- **Expected**: Should allow (different slug: "email_1")

### Edge Case 5: Back Navigation
- **Action**: Click back arrow in header
- **Expected**: Return to `/dashboard/products/create?productId={id}`
- **Data**: Form data should persist (not lost)

## 🎯 User Experience Goals

### Performance
- ⚡ **Load Time**: < 1 second for product data fetch
- ⚡ **Permission Change**: Instant UI update (< 50ms)
- ⚡ **View Mode Switch**: Instant visual feedback

### Accessibility
- ♿ **Keyboard Navigation**: Tab through all widgets
- ♿ **Touch Targets**: 44px minimum (mobile)
- ♿ **Screen Readers**: Proper ARIA labels on widgets

### Visual Feedback
- ✨ **Active States**: Clear visual distinction
- ✨ **Hover Effects**: Subtle scale (1.02) and shadow
- ✨ **Loading States**: Spinner + disabled buttons
- ✨ **Success/Error**: Toast notifications with icons

## 📊 Analytics Events (Future)

```javascript
// Track permission changes
analytics.track('permission_changed', {
  field: 'cas_number',
  old_level: 'public',
  new_level: 'after_click',
  product_id: 'abc123'
})

// Track channel additions
analytics.track('channel_added', {
  channel_name: 'Twitter',
  channel_slug: 'twitter',
  product_id: 'abc123'
})

// Track view mode switches
analytics.track('view_mode_changed', {
  old_mode: 'merchant',
  new_mode: 'email_visitor',
  product_id: 'abc123'
})

// Track publish
analytics.track('product_published', {
  product_id: 'abc123',
  permissions: {
    public: 15,
    after_click: 8,
    after_rfq: 5
  },
  channels: 4
})
```

## 🔐 Security Considerations

1. **Permission Validation**: Server-side validation of permission levels
2. **Product Ownership**: Ensure user owns the product before allowing publish
3. **Channel Parameters**: Sanitize channel names to prevent XSS
4. **API Rate Limiting**: Prevent spam publishing

## 🚀 Deployment Checklist

- [ ] Test on Chrome, Safari, Firefox, Edge
- [ ] Test on iOS Safari (mobile)
- [ ] Test on Android Chrome (mobile)
- [ ] Verify all toast notifications work
- [ ] Verify routing works correctly
- [ ] Test with slow network (3G throttling)
- [ ] Test with large product data (> 100 fields)
- [ ] Verify database updates correctly
- [ ] Check console for errors
- [ ] Verify design matches DESIGN_SYSTEM.md

---

**Last Updated**: November 2025  
**Page**: `/dashboard/products/[productId]/preview-publish`  
**Status**: ✅ Ready for Testing


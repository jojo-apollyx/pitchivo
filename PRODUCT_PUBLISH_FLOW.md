# Product Publishing Flow with Access Control

## 📋 Overview

The product publishing flow has been updated to include a **Preview & Access Control** step before final publication. This allows merchants to configure field-level visibility permissions and set up channel tracking links.

## 🔄 New Flow

### Previous Flow
```
Create Product → Click "Publish Product" → ✅ Published (directly)
```

### New Flow
```
Create Product → Click "Next: Preview & Publish" → Configure Access Control → Click "Publish Product & Generate Links" → ✅ Published
```

## 📁 File Structure

```
apps/web/app/dashboard/products/
├── create/
│   └── page.tsx (modified - now redirects to preview-publish)
└── [productId]/
    └── preview-publish/
        └── page.tsx (new - access control & publish page)
```

## 🎯 Key Features

### 1. **Preview & Access Control Page**
   - **URL**: `/dashboard/products/[productId]/preview-publish`
   - **Purpose**: Configure field visibility and channel links before publishing

### 2. **Three-Level Permission System**
   
   The system implements an **inclusive permission model**:
   
   ```
   🌐 Public ⊂ ✉️ After Click ⊂ 🧾 After RFQ
   ```
   
   - **🌐 Public**: Visible to everyone (most open)
   - **✉️ After Click**: Visible only to email visitors with tracking link
   - **🧾 After RFQ**: Visible only after submitting RFQ (most restricted)
   
   **Inclusion Relationship**:
   - If a user has "After RFQ" access → they can also see "After Click" and "Public" fields
   - If a user has "After Click" access → they can also see "Public" fields
   - If a user has "Public" access → they can only see "Public" fields

### 3. **Permission Widget**

   Each field has a permission widget (segmented control):
   
   ```tsx
   [🌐 Public] [✉️ After Click] [🧾 After RFQ]
   ```
   
   - **Mobile-optimized**: Icons only on small screens
   - **Touch-friendly**: 44px minimum touch target
   - **Visual feedback**: Active state with primary color

### 4. **View Mode Switcher**

   Merchants can preview the product from different buyer perspectives:
   
   - **Merchant View**: See all fields (default)
   - **Email Visitor**: See Public + After Click fields only
   - **After RFQ**: See all fields (simulates post-RFQ buyer)
   
   Hidden fields are shown with reduced opacity and a badge indicator.

### 5. **Channel Link Management**

   Pre-configured channels:
   - **Email Default** (`?ch=email`)
   - **QR Booth** (`?ch=expo`)
   - **LinkedIn** (`?ch=linkedin`)
   
   Features:
   - ➕ Add custom channels
   - 📷 Generate QR codes
   - 🔗 Auto-generated tracking parameters

### 6. **Permission Overview Sidebar**

   Real-time statistics:
   ```
   🌐 Public: 15 fields
   ✉️ After Click: 8 fields
   🧾 After RFQ: 5 fields
   ```
   
   Quick actions:
   - **Set All to Public**: Make all fields publicly visible
   - **Set All to After RFQ**: Make all fields require RFQ

### 7. **Auto Optimization**

   Optional feature:
   - ✅ Auto AIO Optimize for SEO & Channel Tracking
   - Automatically generates meta tags, OG images, and tracking parameters

## 🎨 Design System Compliance

The implementation follows the **DESIGN_SYSTEM.md** guidelines:

### ✅ Integral Design
- Uses continuous flow with `<section>` elements
- NO card borders - only subtle dividers (`border-border/30`)
- Sticky header with backdrop blur
- Seamless section transitions

### ✅ Mobile-First Layout
- Responsive grid: 1 column (mobile) → 3 columns (desktop)
- Touch-optimized buttons (44px minimum)
- Permission widgets adapt to screen size
- Bottom-fixed publish button on mobile

### ✅ Color System
- Uses CSS variables (`bg-primary`, `text-primary-foreground`)
- Consistent hover states (`hover:bg-primary-dark`)
- Accent color for status badges
- No hardcoded colors

### ✅ Typography & Spacing
- Mobile-first text sizing (`text-sm sm:text-base`)
- Compact spacing on mobile (`gap-3`, `px-4`)
- Expanded spacing on desktop (`lg:gap-6`, `lg:px-8`)
- Clear visual hierarchy

## 🔧 Technical Implementation

### Component Structure

```tsx
PreviewPublishPage
├── Header (sticky)
│   ├── Back button
│   ├── Product name
│   └── Status badge
├── View Mode Selector
│   ├── Merchant View
│   ├── Email Visitor
│   └── After RFQ
├── Main Content (2-column)
│   ├── Left: Product Preview (2/3 width)
│   │   ├── Basic Information section
│   │   ├── Technical Specifications section
│   │   ├── Pricing & MOQ section
│   │   └── Each field with PermissionWidget
│   └── Right: Sidebar (1/3 width)
│       ├── Permission Overview
│       ├── Channel Links
│       └── Auto Optimization
└── Footer (fixed bottom)
    └── Publish button
```

### State Management

```tsx
// Permission configuration (per field)
type FieldPermission = {
  [fieldName: string]: 'public' | 'after_click' | 'after_rfq'
}

// Channel links
type ChannelLink = {
  id: string
  name: string
  parameter: string
  enabled: boolean
}

// View mode for preview
type ViewMode = 'merchant' | 'email_visitor' | 'after_rfq'
```

### Data Flow

1. **Load Product Data**
   ```tsx
   const { data: productData, isLoading } = useProduct(productId)
   ```

2. **Initialize Default Permissions**
   - Sensitive fields (price, samples) → `after_rfq`
   - Semi-sensitive fields (CAS, assay) → `after_click`
   - All other fields → `public`

3. **Save on Publish**
   ```tsx
   const updatedProductData = {
     ...formData,
     field_permissions: permissions,
     channel_links: channels,
   }
   ```

## 🚀 Usage Example

### Step 1: Create Product
```
User fills out product form → Uploads documents → Clicks "Next: Preview & Publish"
```

### Step 2: Configure Access Control
```
System saves product as draft → Navigates to preview-publish page
User reviews fields → Adjusts permissions → Adds channel links
```

### Step 3: Publish
```
User clicks "Publish Product & Generate Links" → System publishes with permissions
Success toast: "✅ Product published successfully! Links and QR codes generated."
Redirects to: /dashboard/products
```

## 📱 Mobile Responsiveness

### Mobile Layout
```
┌─────────────────────────┐
│ Header (sticky)         │
├─────────────────────────┤
│ View Mode Selector      │
├─────────────────────────┤
│ Product Preview         │
│ ├─ Section 1            │
│ ├─ Section 2            │
│ └─ Section 3            │
├─────────────────────────┤
│ Permission Overview     │
├─────────────────────────┤
│ Channel Links           │
├─────────────────────────┤
│ Publish Button (fixed)  │
└─────────────────────────┘
```

### Desktop Layout
```
┌───────────────────────────────────────────────┐
│ Header (sticky)                               │
├───────────────────────────────────────────────┤
│ View Mode Selector                            │
├────────────────────────┬──────────────────────┤
│ Product Preview (66%)  │ Sidebar (33%)        │
│ ├─ Section 1           │ ├─ Permission Stats  │
│ ├─ Section 2           │ ├─ Channel Links     │
│ └─ Section 3           │ └─ Auto Optimization │
├────────────────────────┴──────────────────────┤
│ Publish Button (fixed bottom)                 │
└───────────────────────────────────────────────┘
```

## 🎯 Default Permission Settings

| Field Type | Default Permission | Rationale |
|-----------|-------------------|-----------|
| Product Name | Public | Basic identification |
| Category | Public | Helps with discovery |
| CAS Number | After Click | Semi-sensitive technical data |
| Assay | After Click | Technical specification |
| Price/MOQ | After RFQ | Sensitive commercial data |
| Samples | After RFQ | Requires qualification |
| Certificates | After Click | Verification documents |
| Images | Public | Visual marketing |

## 🔄 Future Enhancements

### Planned Features
1. **Bulk Permission Templates**
   - Save permission presets
   - Quick apply to multiple products

2. **QR Code Generator Modal**
   - Generate high-res QR codes
   - Download or print

3. **Channel Analytics Preview**
   - Show expected tracking data
   - Preview UTM parameters

4. **Advanced RFQ Form Builder**
   - Customize RFQ fields
   - Conditional logic

5. **Certificate Viewer**
   - Preview/download permissions
   - Watermark for preview mode

## 🐛 Known Limitations

1. **Permission Persistence**: Currently saves to `product_data` JSONB field
   - Future: Dedicated `product_permissions` table for better querying

2. **Channel Analytics**: Links generated but not yet tracked
   - Future: Analytics dashboard for click tracking

3. **Certificate Permissions**: Currently applies to all certificates
   - Future: Per-certificate permission control

## 📝 Notes

- The preview-publish page is **read-only** for product data (no editing)
- Users must go back to edit page to modify product fields
- Permissions are saved when clicking "Publish Product & Generate Links"
- Draft products can be re-configured before publishing
- Published products can be edited (permissions persist)

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Author**: AI Assistant  
**Status**: ✅ Production Ready


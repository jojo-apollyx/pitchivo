# Preview & Publish Page Redesign

## Problem
Current naming is confusing:
- "after_click" - What does this mean?
- "after_rfq" - Too technical
- Channels and access levels are mixed together
- Not clear what links to copy/paste

## Solution: Better Naming & Organization

### New Access Level Names

| Old Name | New User-Facing Name | Icon | Description |
|----------|---------------------|------|-------------|
| `public` | **Browse Mode** | 👀 | Anyone can see basic info (like window shopping) |
| `after_click` | **Link Access** | 🔗 | People with your marketing links see more details |
| `after_rfq` | **Full Access** | ✅ | After requesting quote, see everything + downloads |

### New Page Organization

```
┌─────────────────────────────────────────────────────────────┐
│  PREVIEW & PUBLISH                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Left Side (2/3):                                          │
│  ┌──────────────────────────────────────┐                 │
│  │ Preview                               │                 │
│  │ [Switch: Edit | Browse | Link | Full]│                 │
│  │                                       │                 │
│  │ Product display with actual          │                 │
│  │ blurred fields based on mode         │                 │
│  └──────────────────────────────────────┘                 │
│                                                             │
│  Right Side (1/3):                                         │
│  ┌──────────────────────────────────────┐                 │
│  │ 📋 SHARING LINKS                      │                 │
│  ├──────────────────────────────────────┤                 │
│  │                                       │                 │
│  │ 👀 BROWSE MODE (Public)              │                 │
│  │ Anyone can view basic info            │                 │
│  │ [Copy Public Link]                    │                 │
│  │                                       │                 │
│  ├──────────────────────────────────────┤                 │
│  │                                       │                 │
│  │ 🔗 LINK ACCESS (Marketing)            │                 │
│  │ Share via email, social, QR           │                 │
│  │                                       │                 │
│  │ 📧 Email Campaign                     │                 │
│  │    [Generate & Copy Link] [QR]        │                 │
│  │                                       │                 │
│  │ 💼 LinkedIn Post                      │                 │
│  │    [Generate & Copy Link] [QR]        │                 │
│  │                                       │                 │
│  │ 🎪 Trade Show QR                      │                 │
│  │    [Generate & Copy Link] [QR]        │                 │
│  │                                       │                 │
│  │ ➕ Add Channel                        │                 │
│  │                                       │                 │
│  ├──────────────────────────────────────┤                 │
│  │                                       │                 │
│  │ ✅ FULL ACCESS                        │                 │
│  │ Automatically given after RFQ         │                 │
│  │ 📝 Shows how it works                 │                 │
│  │                                       │                 │
│  └──────────────────────────────────────┘                 │
│                                                             │
│  [Publish Product]                                         │
└─────────────────────────────────────────────────────────────┘
```

### Link Examples

**1. Public Browse Link:**
```
https://yoursite.com/products/vitamin-c
→ Shows: Product name, description, image
→ Hidden: Price, contact info, downloads (blurred with 🔒)
```

**2. Email Campaign Link:**
```
https://yoursite.com/products/vitamin-c?token=abc123xyz...
→ Shows: All public info PLUS price, MOQ, contact form
→ Hidden: Internal costs, downloads (blurred with 🔒)
→ Can submit RFQ to upgrade to Full Access
```

**3. Full Access (After RFQ):**
```
https://yoursite.com/products/vitamin-c?token=xyz789def...
→ Shows: EVERYTHING
→ Downloads enabled
→ Given automatically after submitting RFQ
```

## UI Flow

### When Merchant Visits Page:

1. **Left side shows preview** - Switch between modes to see exactly what users see
2. **Right side shows sharing options**:
   - Public link (always available, copy anytime)
   - Marketing channels (click to generate secure link)
   - Full access explanation (auto-granted after RFQ)

### When Merchant Clicks "Generate & Copy Link":

1. Shows loading spinner
2. API generates secure token
3. Copies link to clipboard
4. Shows success toast
5. Link appears in channel (can copy again)

### Clear Visual Hierarchy:

```
👀 BROWSE MODE
├─ Public Link (no token)
└─ Anyone can access

🔗 LINK ACCESS  
├─ Email Campaign (token: 90 days)
├─ LinkedIn Post (token: 90 days)
├─ Trade Show QR (token: 14 days)
└─ Custom channels...

✅ FULL ACCESS
├─ Auto-granted after RFQ
└─ Token: 30 days
```

## Implementation Plan

1. Update access level labels throughout
2. Reorganize sidebar into 3 clear sections
3. Add descriptive text for each section
4. Show token expiration info
5. Make preview match exactly what users see
6. Add icon indicators for access levels

## User Benefits

✅ **Clearer naming** - "Link Access" vs confusing "after_click"
✅ **Organized by purpose** - Browse, Marketing, Full Access
✅ **Real copyable links** - Works when pasted in new browser
✅ **Visual indicators** - Icons show access level at a glance
✅ **Accurate preview** - Left side matches exactly what users see


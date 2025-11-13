# Quick Start Testing Guide

## 🚀 Test the New Feature in 5 Minutes

### Step 1: Start the Development Server

```bash
cd /Users/therealjojo/PycharmProjects/pitchivo
npm run dev
```

Wait for server to start, then open: **http://localhost:3000**

---

### Step 2: Navigate to Product Creation

1. Login to dashboard
2. Go to: **Dashboard → Products → Create New Product**
3. Or direct URL: `http://localhost:3000/dashboard/products/create`

---

### Step 3: Create a Test Product

**Fill in minimum required fields:**
```
Product Name: Test Collagen Peptide
Category: Protein & Peptides
Origin Country: China
CAS Number: 9007-34-5
Assay: ≥90%
```

**Click**: `Upload` (optional) or skip

**Click**: `Next: Preview & Publish` button (bottom right)

---

### Step 4: You Should See Preview Page ✅

**URL should change to:**
```
/dashboard/products/[some-id]/preview-publish
```

**You should see:**
- ✅ Header: "Test Collagen Peptide" with "Ready to Publish" badge
- ✅ View Mode Selector: [Merchant View] [Email Visitor] [After RFQ]
- ✅ Product fields with permission widgets: [🌐] [✉️] [🧾]
- ✅ Sidebar: Permission Overview (field counts)
- ✅ Sidebar: Channel Links (Email, QR, LinkedIn)
- ✅ Bottom: "🚀 Publish Product & Generate Links" button

---

### Step 5: Test Permission Widget

1. Find "CAS Number" field
2. Click the **✉️ After Click** button
3. ✅ Button should turn primary color (blue/green)
4. ✅ Sidebar stats should update: "After Click: 9 fields"

---

### Step 6: Test View Mode Switcher

1. Click **"Email Visitor"** button (top section)
2. ✅ Fields with "After RFQ" permission should fade (40% opacity)
3. ✅ Badge "🧾 RFQ required" should appear next to those fields
4. ✅ Permission widgets should be disabled (grayed out)

Click **"Merchant View"** to return to normal

---

### Step 7: Test Bulk Actions

1. In sidebar, click **"Set All to Public"**
2. ✅ Toast notification: "All fields set to Public"
3. ✅ All permission widgets should show 🌐 as active
4. ✅ Sidebar stats: "Public: 28 fields"

---

### Step 8: Add Custom Channel

1. In "Channel Links" section, click **"➕ Add Channel"**
2. Input field should appear
3. Type: `Twitter`
4. Press **Enter** or click **"Add"**
5. ✅ New channel appears: "Twitter ?ch=twitter [✅]"
6. ✅ Toast: "Channel 'Twitter' added"

---

### Step 9: Publish Product

1. Review permissions (all should be Public from Step 7)
2. Click **"🚀 Publish Product & Generate Links"** (bottom button)
3. ✅ Button shows "Publishing..." with spinner
4. ✅ Toast: "✅ Product published successfully! Links and QR codes generated."
5. ✅ Redirects to: `/dashboard/products`
6. ✅ Product appears in list with status "Published"

---

### Step 10: Verify Mobile Responsiveness

1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select: **iPhone 12 Pro** or **Pixel 5**
4. Go back to preview page: Click Edit on the published product
5. Then click "Next: Preview & Publish" again

**You should see:**
- ✅ Vertical stacked layout
- ✅ Permission widgets show icons only
- ✅ Sidebar sections stack below product preview
- ✅ Bottom publish button is full-width
- ✅ All touch targets are 44px minimum

---

## 🎯 Expected Results Summary

| Test | Expected Result | Status |
|------|----------------|--------|
| Create product | Redirects to preview page | ⬜ |
| Product data loads | All fields visible with data | ⬜ |
| Permission widgets | Clickable and update state | ⬜ |
| View mode switch | Fields mask/unmask correctly | ⬜ |
| Sidebar stats | Update in real-time | ⬜ |
| Bulk actions | All widgets change + toast | ⬜ |
| Add channel | New channel appears + toast | ⬜ |
| Publish | Success toast + redirect | ⬜ |
| Mobile layout | Vertical stack + full-width | ⬜ |

---

## 🐛 Troubleshooting

### Problem: "Product not found" error
**Solution**: Product wasn't saved. Go back and ensure product has a product_id.

```bash
# Check database for products
# In your database tool:
SELECT product_id, product_name, status FROM products ORDER BY created_at DESC LIMIT 5;
```

### Problem: Permission widgets not working
**Solution**: Make sure you're in "Merchant View" mode (not Email/RFQ view)

### Problem: Page won't load
**Solution**: Check console for errors

```bash
# Terminal 1: Server logs
npm run dev

# Browser Console (F12): Check for errors
```

### Problem: TypeScript errors in editor
**Solution**: Restart TypeScript server

```bash
# In VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

## 📸 Screenshots to Verify

Take screenshots of these states:

1. **Preview Page Load** (desktop)
   - Full page with product preview + sidebar

2. **Permission Widget Active**
   - Close-up of widget with "After Click" selected

3. **Email Visitor View**
   - Fields with 40% opacity and badges

4. **Sidebar Stats**
   - Permission overview with field counts

5. **Channel Links**
   - All channels including custom Twitter channel

6. **Mobile View**
   - Full vertical stacked layout

7. **Published Product**
   - Products list showing published status

---

## ✅ Success Checklist

After completing all 10 steps, you should be able to check all these:

- [ ] Preview page loads without errors
- [ ] All product fields are displayed
- [ ] Permission widgets are clickable and change state
- [ ] Sidebar stats update in real-time
- [ ] View mode switcher works (fields mask/unmask)
- [ ] Bulk actions work (Set All to Public/RFQ)
- [ ] Can add custom channel
- [ ] Publish button works and redirects
- [ ] Product status changes to "published" in database
- [ ] Mobile layout works (vertical stack)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Toast notifications appear correctly

---

## 🎬 Video Recording Suggestion

Consider recording a screen video of the flow:
1. Create product (30 seconds)
2. Navigate to preview (5 seconds)
3. Change permissions (20 seconds)
4. Switch view modes (15 seconds)
5. Add channel (10 seconds)
6. Publish (10 seconds)
7. View in products list (10 seconds)

**Total time**: ~2 minutes

---

## 🔄 Reset Test Data

If you need to test again:

```sql
-- Delete test product (replace ID)
DELETE FROM products WHERE product_name LIKE 'Test%';

-- Or update status back to draft
UPDATE products 
SET status = 'draft' 
WHERE product_name LIKE 'Test%';
```

---

## 📞 Get Help

If something doesn't work:

1. Check browser console (F12)
2. Check server logs (terminal running `npm run dev`)
3. Check the implementation summary: `IMPLEMENTATION_SUMMARY.md`
4. Check the detailed guide: `PREVIEW_PUBLISH_GUIDE.md`

---

## 🎉 Next Steps After Testing

Once all tests pass:

1. ✅ Mark all checkboxes above
2. ✅ Commit changes to git
3. ✅ Deploy to staging
4. ✅ Test on staging
5. ✅ Deploy to production

---

**Test Duration**: 5-10 minutes  
**Complexity**: Easy  
**Prerequisites**: Running dev server, logged in user  
**Status**: Ready to Test 🚀


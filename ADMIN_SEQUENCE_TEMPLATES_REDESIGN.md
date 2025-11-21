# Admin Sequence Templates UI Redesign

## Overview

The admin sequence templates interface has been completely redesigned to provide a more user-friendly experience for managing global sequence templates and selecting default sequences for new campaigns.

## Key Changes

### 1. **Two-Column Layout**

The new UI features a split-view design:

#### Left Panel: All Sequence Templates
- Lists all available sequence templates organized by template name
- Shows key information: sequence number, delay days, subject, and preview
- Each template displays a checkmark (✓) if it's already in the defaults
- Quick actions: Add to defaults (→), Edit, Delete

#### Right Panel: Default Sequences
- Shows selected default sequences in order
- Sequence numbers are automatically assigned based on selection order (1, 2, 3...)
- Drag-and-drop reordering with visual feedback
- Easy removal with X button on hover
- Auto-saves changes when sequences are added, removed, or reordered

### 2. **Collapsible Placeholder Guidance**

The placeholder guidance now uses significantly less space:
- Collapsed by default with a clickable header
- Organized into two columns when expanded:
  - **Pitchivo Placeholders**: Product-specific variables with tooltips
  - **Smartlead Merge Tags**: Native Smartlead variables
- Interactive tooltips for detailed information
- Takes up ~80% less vertical space when collapsed

### 3. **Improved Visual Hierarchy**

- Color-coded sections for better clarity
- Badge system for quick information scanning
- Green checkmarks indicate templates already in defaults
- Hover effects and transitions for better interactivity
- Icons for better visual communication

### 4. **New Default Sequences System**

#### Database Schema
```sql
-- New table: admin_default_sequences
-- Stores an ordered array of template IDs
CREATE TABLE admin_default_sequences (
  id INTEGER PRIMARY KEY DEFAULT 1,
  template_ids UUID[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Key Features:
- Select sequences from **any template** (not limited to one template name)
- Order is preserved and determines sequence numbering
- Automatically applied to new campaigns
- Real-time updates with auto-save

### 5. **Enhanced User Experience**

#### Selection Flow:
1. Browse all available sequence templates in the left panel
2. Click the arrow (→) button to add a sequence to defaults
3. Sequences appear in the right panel with auto-assigned numbers
4. Drag to reorder using the grip handle
5. Hover and click X to remove

#### Visual Feedback:
- Checkmarks show which templates are in defaults
- Grip handle appears on hover for drag-and-drop
- Border colors indicate interactive elements
- Smooth animations for all interactions
- Toast notifications for success/error states

## Technical Implementation

### Frontend Components

#### GlobalSequenceTemplatesTab.tsx
- State management for templates and defaults
- Drag-and-drop functionality for reordering
- Auto-save on any change
- Collapsible UI components
- Tooltip integration

### Backend APIs

#### GET /api/admin/sequence-templates/defaults
Returns the ordered list of default sequence templates.

#### POST /api/admin/sequence-templates/defaults
```json
{
  "defaults": ["uuid1", "uuid2", "uuid3"]
}
```
Updates the ordered list of default sequences.

### Campaign Creation Integration

The campaign creation API has been updated to:
1. Fetch admin's default sequences from `admin_default_sequences`
2. Load templates in the correct order
3. Apply them to new campaigns automatically
4. Replace placeholders with campaign-specific data

## Migration Required

Run the migration to create the new table:
```bash
npx supabase db reset --yes
# or
npx supabase db push
```

Migration file: `supabase/migrations/20251122000003_create_admin_default_sequences.sql`

## Usage Instructions

### For Admins

1. **Navigate to Admin Panel** → Campaigns → Sequence Templates tab

2. **Create Templates** (if needed):
   - Click "New Template" button
   - Fill in template name, subject, body, delay
   - Use placeholders: `{{product_url}}`, `{{product_name}}`, etc.
   - Save

3. **Select Default Sequences**:
   - Browse templates in the left panel
   - Click the → arrow button to add to defaults
   - Selected sequences appear in the right panel

4. **Arrange Order**:
   - Drag sequences in the right panel to reorder
   - Sequence numbers update automatically
   - Changes save immediately

5. **Remove Sequences**:
   - Hover over a default sequence
   - Click the X button that appears
   - Sequence is removed immediately

### For Developers

The system now supports:
- Multiple default sequences from different templates
- Custom ordering independent of template structure
- Real-time updates without page refresh
- Backward compatibility with existing templates

## Benefits

### Space Efficiency
- Placeholder guidance takes 80% less space when collapsed
- Two-column layout uses screen real estate efficiently
- Compact card design with expandable details

### User Experience
- Intuitive drag-and-drop interface
- Visual feedback for all actions
- Clear indication of selection state
- Auto-save prevents data loss
- Tooltips provide context without clutter

### Flexibility
- Mix sequences from any templates
- Custom ordering for any workflow
- Easy to modify without confusion
- Scales well with many templates

### Performance
- Optimistic UI updates
- Minimal API calls
- Efficient state management
- Smooth animations

## Components Added

1. **Collapsible Component** (`components/ui/collapsible.tsx`)
   - Radix UI primitive wrapper
   - Used for expandable placeholder guidance

2. **API Route** (`app/api/admin/sequence-templates/defaults/route.ts`)
   - GET: Fetch default sequences
   - POST: Update default sequences

3. **Migration** (`supabase/migrations/20251122000003_create_admin_default_sequences.sql`)
   - Creates admin_default_sequences table
   - Single-row configuration table

## Future Enhancements

Potential improvements:
- Preview how sequences will look in campaigns
- Bulk operations (select all from template)
- Search/filter in template list
- Import/export default configurations
- Template usage statistics
- Sequence A/B testing setup

## Screenshots

### Before (Issues):
- ❌ Large placeholder guidance taking entire screen
- ❌ Only one template could be selected as default
- ❌ No visual indication of selection state
- ❌ Difficult to understand template structure

### After (Improvements):
- ✅ Compact collapsible placeholder guidance
- ✅ Select any number of sequences from any templates
- ✅ Clear two-column layout with visual indicators
- ✅ Drag-and-drop reordering
- ✅ Real-time updates with auto-save
- ✅ Mobile-responsive design

## Testing Checklist

- [ ] Create multiple sequence templates
- [ ] Add sequences to defaults from different templates
- [ ] Reorder default sequences via drag-and-drop
- [ ] Remove sequences from defaults
- [ ] Verify auto-save functionality
- [ ] Test collapsible placeholder section
- [ ] Create new campaign and verify defaults are applied
- [ ] Check mobile responsiveness
- [ ] Verify tooltip functionality
- [ ] Test with many templates (>10)

## Notes

- The migration must be run before using the new features
- Old campaigns with `default_template_name` will continue to work
- The new system is separate from campaign-specific sequence overrides
- Changes take effect immediately for new campaigns only


# UI Review Follow-ups

Items that could not be completed in USM-593 and need dedicated tasks.

## 1. Orders: no detail page
**Issue:** `/admin/orders` has no detail page (`/admin/orders/[id]`), so the row-click
navigation pattern cannot be applied.
**Next task:** Create `AdminOrderDetailPage` with full order info, video/audio media
preview, status history, and client/creator details. Apply row-click once detail page exists.

## 2. Moderation: no detail page
**Issue:** `/admin/moderation` has no detail page for individual reports, so row-click
cannot be applied.
**Next task:** Either create a dedicated `/admin/moderation/[id]` detail page, or add
an inline expand-row pattern to show full report details without navigation.

## 3. Creator tier/flag labels in code
**Status:** Moved to i18n (adminCreators namespace) in USM-593.

## 4. WCAG AA contrast — manual verification recommended
**Issue:** Light-mode `--color-muted: #6B5A8A` on `--color-bg: #F4F0FF` and
`--color-card: #EDE6FF` may approach borderline AA ratio for small text (<= 14px).
**Next task:** Run automated contrast audit (axe-core or similar) on all admin pages
and fix any failures for body text < 18px.

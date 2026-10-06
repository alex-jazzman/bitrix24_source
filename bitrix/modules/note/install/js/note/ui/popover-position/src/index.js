// Shared by every popover of the document surfaces — the activity line's own widgets as well as the
// backlinks list, which lives in an extension of its own. Kept apart from either so neither has to
// depend on the other for it.
export { positionPopoverUnderTrigger, keepPopoverAnchored } from './popover-position';

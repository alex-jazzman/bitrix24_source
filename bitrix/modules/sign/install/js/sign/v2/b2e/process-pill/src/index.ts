import { ProcessPill } from './process-pill';

// The row of the views belongs to crm and the create button of sign builds no script of its own, so the
// section has nowhere to call the pill from: loading the extension is the mount itself (Q-3).
ProcessPill.mount();

export { ProcessPill };

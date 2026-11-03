import { BX } from './internal/global';
import { addCustomEvent, browser, ready } from '../core-compatibility';
import { DoNothing } from './events';

/**
 * Assembly point of the legacy layer: the single re-export point of every symbol it publishes.
 *
 * The modules export their symbols and this file re-exports them. Nothing writes into the global
 * `BX` by hand any more, bar the two exceptions named below: the layer is built with
 * `namespace: 'BX'`, so chef hands rollup `format: 'iife'`, `name: 'BX'`, `extend: true`, and
 * every export is written into `BX` for us. The re-export order is the order the blocks had in
 * `src/old/core.js`, because it is still the evaluation order of the modules.
 *
 * **Those writes land at the very end of the bundle**, in one `exports.*` block after every
 * statement below. A symbol read at load time therefore cannot be published by export - it would
 * be read before the block runs. Two symbols are in that position and stay assignments:
 * `BX.CHint` in `hint.ts` (read by the menu subscriptions here, and carrying 35 members written
 * onto it at load time - see the note there) and `BX.proxy_context` in `delegate.ts`, which is
 * live state rather than a value. Where a load-time reader is inside the layer itself the fix is
 * an import instead, which is why `DoNothing` is imported above rather than read off `BX`.
 *
 * The start of the layer in the assembled bundle is recognised by the first statement the layer
 * executes - `const MSLEFT = 1;` from `const.ts`, which is why `const.ts` comes first. Moving it
 * moves that marker, and the position check of ORD-01 goes with it.
 *
 * Below the re-exports are the load-time actions of SFX-01. They come after every import, and
 * they have to: the menu subscriptions reach the hint's statics, and the browser-class call
 * reaches the modern kernel. The `pagehide` subscription that drains the garbage collectors is
 * the sixth action, and it does not appear here - it lives in `delegate.ts` next to the registry
 * it drains, which MOD-01 forbids splitting from it.
 */

export { MSLEFT, MSMIDDLE, MSRIGHT, AM_PM_UPPER, AM_PM_LOWER, AM_PM_NONE } from './const';
export { ext, extend, is_subclass_of, merge, mergeEx } from './inherit';
export { util } from './util';
export { prop } from './prop';
export {
	firstChild, lastChild, previousSibling, nextSibling, findChildrenByClassName,
	findChildByClassName, findChildren, findChild, findParent, findNextSibling, findPreviousSibling,
	checkNode, findFormElements, isParentForNode, clearNodeCache, createFragment, isNodeInDom,
	isNodeHidden,
} from './dom-traverse';
export {
	delegate, delegateLater, proxy, defer, defer_proxy, once, bindDelegate, delegateEvent, garbage,
} from './delegate';
export {
	getEventButton, CaptureEvents, CaptureEventsGet, fireEvent, getWheelData, False, DoNothing,
	denyEvent, allowEvent, fixEventPageXY, fixEventPageX, fixEventPageY, PreventDefault,
	eventReturnFalse, eventCancelBubble, bindDebouncedChange, getEventTarget,
} from './events';
export {
	setOpacity, show, hide, toggle, GetDocElement, scrollTop, scrollLeft, hide_object, is_relative,
	is_float, is_fixed, width, height, align, scrollToNode, styleIEPropertyName,
} from './dom-style';
export {
	focus, hoverEvents, hoverEventsHover, hoverEventsHout, focusEvents, focusEventsFocus,
	focusEventsBlur, setUnselectable, setSelectable, getCaretPosition, setCaretPosition,
} from './focus';
export {
	setJSList, getJSList, setCSSList, getCSSList, getJSPath, getCSSPath, getCDNPath, loadScript,
	loadCSS, load, reload, clearCache,
} from './assets';
export { showWait, closeWait } from './wait';
export { isAmPmMode, formatDate, formatName, getNumMonth, parseDate } from './date';
export { processHTML, parseJSON, evalPack, evalGlobal, template } from './html';
export { hint, hint_replace } from './hint';
export { DataStorage, data } from './data-storage';
export { validation } from './validation';
export { convert } from './convert';
export { selectUtils } from './select-utils';
export { bitrix_sessid, submit } from './misc';

// SFX-01 #1 and 2: the hint hides itself while a menu is open and comes back when it closes
(addCustomEvent as any)('onMenuOpen', (BX as any).CHint.handleMenuOpen);
(addCustomEvent as any)('onMenuClose', (BX as any).CHint.handleMenuClose);

// SFX-01 #4: set an empty ready handler.
//
// The source spelled this `BX(BX.DoNothing)`: passing a function to the `BX(...)` resolver makes
// it call `BX.ready(fn)`. That detour cannot be kept here. The resolver opens by reading
// `window.BX.type.isNotEmptyString(node)`, and at this point in the graph the kernel has not run
// its tail `exports.*` block yet, so `BX.type` does not exist and the call throws - measured:
// `Cannot read properties of undefined (reading 'isNotEmptyString')`, which is exactly what the
// resolver does with an unpublished namespace. `ready` is imported directly instead: same effect,
// no dependency on publication order.
ready(DoNothing);

// SFX-01 #5 in the source pinned the global after every assignment: `window.BX = BX`. That was a
// no-op there - the file received `window.BX` as its argument and handed the very same object
// back. Here it would be destructive: the layer is a module of the kernel's graph, so it captures
// `window.BX` while the kernel is still being evaluated, long before the tail `exports.*` block
// publishes `type`, `ready` and the rest. Re-assigning that early snapshot would roll the global
// back to a bare function and send every later publication into an object nothing points at.
// The whole bundle is one iife over `this.BX`, so the layer already writes into the same object
// the kernel does and no pinning is needed.

// SFX-01 #6: write the browser classes onto the root element
browser.addGlobalClass();

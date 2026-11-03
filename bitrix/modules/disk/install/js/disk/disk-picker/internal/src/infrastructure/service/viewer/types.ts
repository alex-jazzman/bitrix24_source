import { type ViewerAttributesEntry } from '../file-picker/types';

// The part of the page viewer singleton the picker drives. Only the adapter
// implements it; the feature layer depends on this contract and never on
// BX.UI.Viewer, which also makes the whole open scenario stubbable.
export type ViewerAdapter = {
	// Loads ui.viewer once; a failed load is not cached.
	ensureLoaded: () => Promise<void>,
	// Builds the detached node the viewer reads one item from.
	buildNode: (entry: ViewerAttributesEntry, title: string) => HTMLElement,
	// A separate item opens on its own (a unified link opens a browser tab) and
	// never takes part in the arrow navigation of a set.
	isSeparate: (node: HTMLElement) => boolean,
	// Loads everything the set needs and hands back the call that shows it full screen over
	// the page. Nothing is shown until that call is made, so the wait can still be abandoned.
	prepare: (nodes: HTMLElement[]) => Promise<(index: number) => void>,
	// Asks for the tab of a separate item. The promise ends with the asking; a tab the
	// browser refused afterwards is reported to onFailure.
	openSeparate: (node: HTMLElement, onFailure: () => void) => Promise<void>,
	// Subscribes to the viewer close event; returns the unsubscribe function.
	onClose: (callback: () => void) => () => void,
};

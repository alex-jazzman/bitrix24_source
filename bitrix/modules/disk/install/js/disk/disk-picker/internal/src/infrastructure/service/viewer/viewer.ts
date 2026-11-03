import { Reflection, Runtime } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';

import { type ViewerAttributesEntry } from '../file-picker/types';

import { type ViewerAdapter } from './types';

const VIEWER_EXTENSION = 'ui.viewer';
const CLOSE_EVENT = 'BX.UI.Viewer.Controller:onClose';
const TITLE_ATTRIBUTE = 'data-title';

// The subset of BX.UI.Viewer.Controller the picker uses.
type ViewerController = {
	collectExtensionsForItems: (nodes: HTMLElement[]) => string[],
	isSeparateItem: (node: HTMLElement) => unknown,
	loadExtensions: (extensions: string[]) => Promise<unknown>,
	setItems: (items: ViewerItem[]) => Promise<unknown>,
	open: (index: number) => void,
	openSeparate: (index: number) => void,
};

// The subset of BX.UI.Viewer.Item the picker uses. `load()` is idempotent: it hands
// back the promise of the load already running, which is how the outcome of a load
// the controller started for itself is read here.
type ViewerItem = {
	load: () => Promise<unknown>,
};

// A value built in another window fails the instanceof of this one: its prototype
// chain ends in the Object of the window it was built in.
function belongsToThisWindow(value: object): boolean
{
	return value instanceof Object;
}

function getController(): ViewerController
{
	// The singleton is a lazy accessor on BX.UI.Viewer; reading it before the
	// extension is loaded is what this guard reports.
	const controller = Reflection.getClass('BX.UI.Viewer.Instance') as ViewerController | null;
	if (!controller)
	{
		throw new Error('DiskPicker: ui.viewer is not available');
	}

	// Inside a frame that accessor hands out the controller of the top window, while
	// the item builder and the close event of this adapter stay in this one: that
	// controller would show the file and never report the close, leaving the session
	// of the picker open for good. The preview is refused instead.
	if (!belongsToThisWindow(controller))
	{
		throw new Error('DiskPicker: ui.viewer runs in another window');
	}

	return controller;
}

function buildItem(node: HTMLElement): ViewerItem
{
	const build = Reflection.getClass('BX.UI.Viewer.buildItemByNode') as ((node: HTMLElement) => ViewerItem) | null;
	if (!build)
	{
		throw new Error('DiskPicker: ui.viewer is not available');
	}

	return build(node);
}

class PageViewerAdapter
{
	#loading: Promise<void> | null = null;

	ensureLoaded(): Promise<void>
	{
		if (this.#loading === null)
		{
			this.#loading = Runtime.loadExtension(VIEWER_EXTENSION)
				.then(() => {})
				.catch((error: unknown) => {
					this.#loading = null;

					throw error;
				});
		}

		return this.#loading;
	}

	// Server-built attributes are opaque strings put on a detached node one by one;
	// nothing is ever concatenated into markup. The title comes from the picker item,
	// so it overwrites whatever data-title the attribute map carried.
	buildNode(entry: ViewerAttributesEntry, title: string): HTMLElement
	{
		const node = document.createElement('span');
		Object.entries(entry.attributes).forEach(([name, value]) => {
			node.setAttribute(name, value);
		});
		node.setAttribute(TITLE_ATTRIBUTE, title);

		return node;
	}

	// The viewer's own rule, asked of the viewer itself: the picker and the viewer never
	// disagree about the mode an item opens in.
	isSeparate(node: HTMLElement): boolean
	{
		return Boolean(getController().isSeparateItem(node));
	}

	// The viewer keeps the page body as its base container, so it registers in the same
	// z-index stack as the picker popup and brings itself to the front of it.
	async prepare(nodes: HTMLElement[]): Promise<(index: number) => void>
	{
		const controller = getController();

		await controller.loadExtensions(controller.collectExtensionsForItems(nodes));
		await controller.setItems(nodes.map((node) => buildItem(node)));

		return (index: number): void => {
			controller.open(index);
		};
	}

	// A separate item shows no container of its own: asking the browser for its tab is the
	// load of the item, and the controller swallows that load whichever way it ends. The
	// picker takes the failed one - a tab a blocker refused - off the promise of the item
	// itself, which `load()` hands back for the load already running. It is reported and
	// never awaited: an item that opens a panel of its own leaves that promise pending.
	async openSeparate(node: HTMLElement, onFailure: () => void): Promise<void>
	{
		const controller = getController();

		// The item class of a unified link comes with the extension of the item: building it
		// before the load is what makes every such preview fail, so the order of prepare()
		// holds here too.
		await controller.loadExtensions(controller.collectExtensionsForItems([node]));
		const item = buildItem(node);
		await controller.setItems([item]);
		controller.openSeparate(0);
		void item.load().catch(onFailure);
	}

	onClose(callback: () => void): () => void
	{
		const handler = (event: BaseEvent): void => {
			const [controller] = event.getCompatData() ?? [];
			if (controller !== undefined && controller !== getController())
			{
				return;
			}

			callback();
		};

		EventEmitter.subscribe(CLOSE_EVENT, handler);

		return (): void => {
			EventEmitter.unsubscribe(CLOSE_EVENT, handler);
		};
	}
}

// The page viewer is a singleton, and so is its adapter.
export const viewerAdapter: ViewerAdapter = new PageViewerAdapter();

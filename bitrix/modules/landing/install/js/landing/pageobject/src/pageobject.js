import {Type, Cache} from 'main.core';

/**
 * @memberOf BX.Landing
 */
export class PageObject
{
	static cache = new Cache.MemoryCache();
	static instance = null;
	store = {};

	static getInstance(): PageObject
	{
		if (Type.isNil(PageObject.instance))
		{
			PageObject.instance = new PageObject();
		}

		return PageObject.instance;
	}

	static getRootWindow(): Window
	{
		return this.cache.remember('rootWindow', () => {
			const topWindow = window.top;
			const directFrames = PageObject.#getSameOriginFrames(topWindow);
			const directRoot = directFrames.find((frame) => PageObject.#hasEditorFrame(frame));
			if (directRoot)
			{
				return directRoot;
			}

			if (PageObject.#hasEditorFrame(topWindow))
			{
				return topWindow;
			}

			// The editor may live deeper, e.g. the group page opened by a direct link
			let frames = directFrames;
			while (frames.length > 0)
			{
				frames = frames.flatMap((frame) => PageObject.#getSameOriginFrames(frame));
				const nestedRoot = frames.find((frame) => PageObject.#hasEditorFrame(frame));
				if (nestedRoot)
				{
					return nestedRoot;
				}
			}

			return topWindow;
		});
	}

	/**
	 * Child frames of the window, from the last to the first; cross-origin ones are skipped with their subtree.
	 */
	static #getSameOriginFrames(parentWindow: Window): Array<Window>
	{
		const result = [];
		const frames = parentWindow.frames;
		for (let i = frames.length - 1; i >= 0; i--)
		{
			try
			{
				if (frames[i].document)
				{
					result.push(frames[i]);
				}
			}
			catch
			{
				// cross-origin frame
			}
		}

		return result;
	}

	static #hasEditorFrame(win: Window): boolean
	{
		try
		{
			return Boolean(win.document.body && win.document.body.querySelector('.landing-ui-view'));
		}
		catch
		{
			return false;
		}
	}

	static getEditorWindow(): ?Window
	{
		return this.cache.remember('editorWindow', () => {
			const rootWindow = this.getRootWindow();
			const rootDocument = rootWindow.document;
			const editorFrame: HTMLIFrameElement = rootDocument.querySelector('.landing-ui-view');

			if (editorFrame && editorFrame.contentWindow)
			{
				return editorFrame.contentWindow;
			}

			return null;
		});
	}

	static getTopPanel(): ?HTMLDivElement
	{
		return this.cache.remember('topPanel', () => {
			return this.getRootWindow().document.querySelector('.landing-ui-panel-top');
		});
	}

	static getEditPanelContent(): ?HTMLDivElement
	{
		return this.cache.remember('editPanel', () => {
			return this.getRootWindow()
				.document
				.querySelector(
					'.landing-ui-panel-content.landing-ui-panel-content-edit .landing-ui-panel-content-body-content'
				);
		});
	}

	static getStylePanelContent(): ?HTMLDivElement
	{
		return this.cache.remember('stylePanel', () => {
			return this.getRootWindow()
				.document
				.querySelector(
					'.landing-ui-panel-content.landing-ui-panel-style .landing-ui-panel-content-body-content'
				);
		});
	}

	static getBlocks(): BX.Landing.Collection.BlockCollection
	{
		return this.getRootWindow().BX.Landing.Block.storage;
	}

	/**
	 * @deprecated
	 * @see PageObject.getTopPanel()
	 * @return {Promise}
	 */
	top(): ?HTMLDivElement
	{
		return new Promise(((resolve, reject) => {
			if (!this.store.topPanel)
			{
				this.store.topPanel = PageObject.getTopPanel();
			}

			if (this.store.topPanel)
			{
				resolve(this.store.topPanel);
				return;
			}

			reject(new Error('Top panel unavailable'));
			console.warn('Top panel unavailable');
		}));
	}

	/**
	 * @deprecated
	 * @see BX.Landing.UI.Panel.StylePanel.getInstance()
	 * @return {Promise}
	 */
	design(): Promise<any>
	{
		return Promise.resolve(BX.Landing.UI.Panel.StylePanel.getInstance());
	}

	/**
	 * @deprecated
	 * @see BX.Landing.UI.Panel.ContentEdit.getInstance()
	 * @return {Promise}
	 */
	content(): Promise<any>
	{
		return Promise.resolve(BX.Landing.UI.Panel.ContentEdit.getInstance());
	}

	/**
	 * @deprecated
	 * @see BX.Landing.UI.Panel.EditorPanel.getInstance()
	 * @return {Promise}
	 */
	inlineEditor(): Promise<any>
	{
		return Promise.resolve(BX.Landing.UI.Panel.EditorPanel.getInstance());
	}

	/**
	 * @deprecated
	 * @see PageObject.getEditorWindow()
	 * @return {Promise}
	 */
	view(): HTMLIFrameElement
	{
		return new Promise((resolve, reject) => {
			if (!this.store.view)
			{
				const rootWindow = PageObject.getRootWindow();
				this.store.view = rootWindow.document.querySelector('.landing-ui-view');
			}

			if (this.store.view)
			{
				resolve(this.store.view);
				return;
			}

			reject(new Error('View iframe unavailable'));
			console.warn('View iframe unavailable');
		});
	}

	/**
	 * @deprecated
	 * @see BX.Landing.Block.storage
	 * @return {Promise}
	 */
	blocks(): Promise<Array<BX.Landing.Block>>
	{
		return Promise.resolve(PageObject.getRootWindow().BX.Landing.Block.storage);
	}
}

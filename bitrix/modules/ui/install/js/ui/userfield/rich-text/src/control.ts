import { Dom, Event, Reflection, Runtime, Type } from 'main.core';

const INPUT_SELECTOR = '.ui-field-rich-text__input';
const CONTAINER_SELECTOR = '.ui-field-rich-text__editor';
const EDITABLE_SELECTOR = '.ui-text-editor-editable';
const ITEM_SELECTOR = '.ui-field-rich-text-item';
const USER_TYPE_ID = 'rich_text';
const READY_FLAG = 'richTextReady';
const EDITOR_MIN_HEIGHT = 100;

type CopilotConfig = {
	copilotOptions: Record<string, unknown>,
	triggerBySpace?: boolean,
};

type EditorConfig = {
	toolbar: string[],
	copilot: CopilotConfig | null,
	placeholder: string,
	inputName: string,
};

type EditorOptions = {
	toolbar: string[],
	placeholder: string,
	minHeight: number,
	copilot?: CopilotConfig,
};

type EditorInstance = {
	renderTo: (container: HTMLElement) => void,
	setText: (text: string) => void,
	getText: () => string,
	subscribe: (event: string, handler: () => void) => void,
};

type CloneHandlerInstance = { getClone: (node: HTMLElement) => HTMLElement };
type CloneHandlerConstructor = new () => CloneHandlerInstance;
type PrototypeSource = { prototype: object };

type UfFactory = { setTypeHandler: (type: string, handler: CloneHandlerConstructor) => void };
type UfNamespace = { Factory?: UfFactory, BaseType?: PrototypeSource };

type TextEditorExports = {
	RichText: new (options: EditorOptions) => EditorInstance,
};

const initialized: WeakSet<HTMLTextAreaElement> = new WeakSet();
const observedWraps: WeakSet<HTMLElement> = new WeakSet();

export class RichTextControl
{
	static #libraryPromise: Promise<TextEditorExports> | null = null;

	static loadLibrary(): Promise<TextEditorExports>
	{
		RichTextControl.#libraryPromise ??= Runtime.loadExtension('ui.text-editor')
			.then((exports: unknown): TextEditorExports => exports as TextEditorExports);

		return RichTextControl.#libraryPromise;
	}

	static createEditor: (options: EditorOptions) => Promise<EditorInstance> = async (options: EditorOptions): Promise<EditorInstance> => {
		const { RichText } = await RichTextControl.loadLibrary();

		return new RichText(options);
	};

	#textarea: HTMLTextAreaElement;
	#container: HTMLElement | null;
	#editor: EditorInstance | null = null;

	constructor(textarea: HTMLTextAreaElement)
	{
		this.#textarea = textarea;
		this.#container = textarea.parentElement
			? textarea.parentElement.querySelector(CONTAINER_SELECTOR) as HTMLElement | null
			: null;
	}

	async init(): Promise<boolean>
	{
		const config = this.#readConfig();
		if (config === null || !Type.isElementNode(this.#container))
		{
			return false;
		}

		const options: EditorOptions = {
			toolbar: Type.isArray(config.toolbar) ? config.toolbar : [],
			placeholder: Type.isStringFilled(config.placeholder) ? config.placeholder : '',
			minHeight: EDITOR_MIN_HEIGHT,
		};

		if (Type.isPlainObject(config.copilot))
		{
			options.copilot = config.copilot;
		}

		const editor = await RichTextControl.createEditor(options);
		this.#editor = editor;
		Dom.clean(this.#container);
		editor.renderTo(this.#container);

		if (Type.isStringFilled(options.placeholder))
		{
			const editable = this.#container.querySelector(EDITABLE_SELECTOR);
			if (Type.isElementNode(editable))
			{
				editable.setAttribute('aria-label', options.placeholder);
			}
		}

		if (Type.isStringFilled(this.#textarea.value))
		{
			editor.setText(this.#textarea.value);
		}

		Dom.style(this.#textarea, 'display', 'none');
		this.#textarea.dataset[READY_FLAG] = 'true';

		this.#bindSync(editor);

		return true;
	}

	#readConfig(): EditorConfig | null
	{
		const raw = this.#textarea.dataset.config;
		if (!Type.isStringFilled(raw))
		{
			return null;
		}

		try
		{
			const parsed = JSON.parse(raw);

			return Type.isPlainObject(parsed) ? parsed as EditorConfig : null;
		}
		catch (error)
		{
			return null;
		}
	}

	#bindSync(editor: EditorInstance): void
	{
		editor.subscribe('onChange', this.#sync);

		const form = this.#textarea.closest('form');
		if (Type.isElementNode(form))
		{
			Event.bind(form, 'submit', this.#sync);
		}
	}

	#sync = (): void => {
		if (this.#editor)
		{
			this.#textarea.value = this.#editor.getText();
			this.#textarea.dispatchEvent(new window.Event('change', { bubbles: true, cancelable: true }));
		}
	};

	static boot(): void
	{
		RichTextControl.#registerCloneHandler();
		RichTextControl.#initExisting(document);
	}

	static initWrap(wrap: HTMLElement): Promise<void>
	{
		if (!Type.isElementNode(wrap))
		{
			return Promise.resolve();
		}

		RichTextControl.#registerCloneHandler();
		RichTextControl.#observeWrap(wrap);

		return RichTextControl.#initExisting(wrap);
	}

	static initField(textarea: HTMLTextAreaElement): Promise<boolean>
	{
		if (initialized.has(textarea))
		{
			return Promise.resolve(false);
		}

		initialized.add(textarea);

		try
		{
			return new RichTextControl(textarea).init().catch((): boolean => false);
		}
		catch (error)
		{
			return Promise.resolve(false);
		}
	}

	static #initExisting(root: Document | HTMLElement): Promise<void>
	{
		const jobs: Promise<boolean>[] = [];
		root.querySelectorAll(INPUT_SELECTOR).forEach((input: Element): void => {
			if (input instanceof HTMLTextAreaElement)
			{
				jobs.push(RichTextControl.initField(input));
			}
		});

		return Promise.all(jobs).then((): void => {});
	}

	static #observeWrap(wrap: HTMLElement): void
	{
		if (observedWraps.has(wrap))
		{
			return;
		}

		observedWraps.add(wrap);

		const observer = new MutationObserver((mutations: MutationRecord[]): void => {
			mutations.forEach((mutation: MutationRecord): void => {
				mutation.addedNodes.forEach((node: Node): void => {
					if (!Type.isElementNode(node))
					{
						return;
					}

					if (node instanceof HTMLTextAreaElement && node.matches(INPUT_SELECTOR))
					{
						RichTextControl.initField(node);
					}

					node.querySelectorAll(INPUT_SELECTOR).forEach((input: Element): void => {
						if (input instanceof HTMLTextAreaElement)
						{
							RichTextControl.initField(input);
						}
					});
				});
			});
		});

		observer.observe(wrap, { childList: true, subtree: true });
	}

	static #registerCloneHandler(): void
	{
		const namespace = Reflection.getClass('BX.Main.UF') as UfNamespace | null;
		const factory = namespace ? namespace.Factory : null;
		const baseType = namespace ? namespace.BaseType : null;
		if (!factory || !Type.isFunction(factory.setTypeHandler) || !Type.isFunction(baseType))
		{
			return;
		}

		factory.setTypeHandler(USER_TYPE_ID, RichTextControl.#createCloneHandler(baseType));
	}

	static #createCloneHandler(baseType: PrototypeSource): CloneHandlerConstructor
	{
		const CloneHandler = function(): void {};
		CloneHandler.prototype = Object.create(baseType.prototype);
		CloneHandler.prototype.constructor = CloneHandler;
		CloneHandler.prototype.getClone = function(node: HTMLElement): HTMLElement {
			const item = Type.isElementNode(node) ? node.closest(ITEM_SELECTOR) : null;
			const source = item || node;
			const clone = source.cloneNode(true) as HTMLElement;

			const textarea = clone.querySelector(INPUT_SELECTOR);
			if (textarea instanceof HTMLTextAreaElement)
			{
				textarea.value = '';
				Dom.style(textarea, 'display', null);
				delete textarea.dataset[READY_FLAG];
			}

			const container = clone.querySelector(CONTAINER_SELECTOR);
			if (Type.isElementNode(container))
			{
				Dom.clean(container);
			}

			return clone;
		};

		return CloneHandler as unknown as CloneHandlerConstructor;
	}
}

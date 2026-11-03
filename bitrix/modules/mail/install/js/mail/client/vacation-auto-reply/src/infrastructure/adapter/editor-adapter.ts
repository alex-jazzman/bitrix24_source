import { Dom, Event as CoreEvent, Loc, Reflection, Type } from 'main.core';
import { FocusKeys, FocusZone } from 'ui.a11y';

import {
	SignatureEditor,
} from 'mail.signature.editor';

import { type SignatureTransport } from '../../transport';

const EXISTING_SETTING_ID = 1;
const LOCKED_CLASS = '--locked';
type SliderMessage = {
	eventId: string,
	idKey: string,
};

const DEFAULT_SLIDER_MESSAGE: SliderMessage = {
	eventId: 'mail-vacation-auto-reply',
	idKey: 'mailboxId',
};

type HtmlEditorToolbar = {
	DisableWysiwygButtons(disabled: boolean): void,
};

type HtmlEditorInstance = {
	GetContent(): string,
	SetContent(content: string, parse: boolean): void,
	Focus(): void,
	GetViewMode?: () => string,
	toolbar?: HtmlEditorToolbar,
};

type HtmlEditorManager = {
	Get(id: string): HtmlEditorInstance | false | null,
};

type EditorLocation = {
	parent: Node,
	nextSibling: ChildNode | null,
};

type AttributeSnapshot = {
	ariaDisabled: string | null,
	locked: boolean,
};

type ControlAttributeSnapshot = {
	tabIndex: string | null,
	readonly: string | null,
};

type ToolbarAttributeSnapshot = {
	role: string | null,
	ariaLabel: string | null,
};

type ToolbarControlAttributeSnapshot = {
	role: string | null,
	tabIndex: string | null,
	ariaLabel: string | null,
	ariaDisabled: string | null,
	ariaHasPopup: string | null,
};

const TOOLBAR_CONTROL_SELECTOR = '.bxhtmled-top-bar-btn, .bxhtmled-top-bar-select';
const TOOLBAR_MENU_CONTROL_SELECTOR = '.bxhtmled-top-bar-select';
const TOOLBAR_DISABLED_CLASS = 'bxhtmled-button-disabled';
const TOOLBAR_CONTROL_LABEL_MESSAGES = new Map([
	['.bxhtmled-button-fontsize', 'FontSizeTitle'],
]);

export type EditorAdapterOptions = {
	editorInstanceId: string,
	editorNode: HTMLElement,
	host: HTMLElement,
	alertContainer: HTMLElement,
	toolbarLabel: string,
	transport: SignatureTransport,
	signatureId?: number,
	sliderMessage?: SliderMessage,
};

export class EditorAdapter
{
	#editorInstanceId: string;
	#editorNode: HTMLElement;
	#alertContainer: HTMLElement;
	#editor: SignatureEditor | null = null;
	#initialLocation: EditorLocation | null;
	#initialAttributes: AttributeSnapshot;
	#controlAttributes: Map<HTMLElement, ControlAttributeSnapshot> = new Map();
	#toolbar: HTMLElement | null = null;
	#toolbarAttributes: ToolbarAttributeSnapshot | null = null;
	#toolbarControlAttributes: Map<HTMLElement, ToolbarControlAttributeSnapshot> = new Map();
	#toolbarFocusZone: FocusZone | null = null;
	#toolbarObserver: MutationObserver | null = null;
	#disabled: boolean = false;
	#destroyed: boolean = false;

	constructor(options: EditorAdapterOptions)
	{
		this.#editorInstanceId = options.editorInstanceId;
		this.#editorNode = options.editorNode;
		this.#alertContainer = options.alertContainer;
		this.#initialLocation = this.#captureLocation(this.#editorNode);
		this.#initialAttributes = {
			ariaDisabled: this.#editorNode.getAttribute('aria-disabled'),
			locked: Dom.hasClass(this.#editorNode, LOCKED_CLASS),
		};

		Dom.append(this.#editorNode, options.host);
		this.#editor = new SignatureEditor({
			editorInstanceId: this.#editorInstanceId,
			signatureId: options.signatureId ?? EXISTING_SETTING_ID,
			alertContainer: this.#alertContainer,
			transport: options.transport,
			sliderMessage: options.sliderMessage ?? DEFAULT_SLIDER_MESSAGE,
		});
		this.#setupToolbarAccessibility(options.toolbarLabel);
	}

	setBody(body: string | null | undefined): boolean
	{
		const editor = this.#getEditor();
		if (editor === null || this.#destroyed)
		{
			return false;
		}

		editor.SetContent(String(body ?? ''), true);
		this.#applyEditorLock();

		return true;
	}

	getBody(): string
	{
		return this.#requireEditor().GetContent();
	}

	save(): void
	{
		this.#editor?.save();
	}

	showError(text: string): void
	{
		this.#editor?.showError(text);
	}

	clearError(): void
	{
		this.#editor?.clearError();
	}

	focus(): boolean
	{
		const editor = this.#getEditor();
		if (editor === null || this.#destroyed)
		{
			return false;
		}

		// Focus does not cross into a nested frame from the parent document: the frame takes it
		// first, and only then the editor puts the caret where it belongs.
		if (editor.GetViewMode?.() !== 'code')
		{
			this.#editorNode.querySelector<HTMLIFrameElement>('iframe')?.contentWindow?.focus();
		}

		editor.Focus();

		return true;
	}

	getControls(): HTMLElement[]
	{
		return this.#getEditorControls();
	}

	setDisabled(disabled: boolean): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#disabled = disabled;
		this.#applyEditorLock();
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#destroyToolbarAccessibility();
		this.#editor?.destroy();
		this.#editor = null;
		Dom.clean(this.#alertContainer);
		this.#restoreEditorLock();
		this.#restoreLocation();
	}

	#captureLocation(node: HTMLElement): EditorLocation | null
	{
		if (node.parentNode === null)
		{
			return null;
		}

		return {
			parent: node.parentNode,
			nextSibling: node.nextSibling,
		};
	}

	#applyEditorLock(): void
	{
		Dom.attr(
			this.#editorNode,
			'aria-disabled',
			this.#disabled ? 'true' : this.#initialAttributes.ariaDisabled,
		);

		if (this.#disabled || this.#initialAttributes.locked)
		{
			Dom.addClass(this.#editorNode, LOCKED_CLASS);
		}
		else
		{
			Dom.removeClass(this.#editorNode, LOCKED_CLASS);
		}

		this.#getEditorControls().forEach((control: HTMLElement): void => {
			this.#applyControlLock(control);
		});
		this.#applyToolbarLock();
		this.#syncToolbarControls();
	}

	#restoreEditorLock(): void
	{
		this.#disabled = false;
		Dom.attr(this.#editorNode, 'aria-disabled', this.#initialAttributes.ariaDisabled);

		if (this.#initialAttributes.locked)
		{
			Dom.addClass(this.#editorNode, LOCKED_CLASS);
		}
		else
		{
			Dom.removeClass(this.#editorNode, LOCKED_CLASS);
		}

		this.#getEditorControls().forEach((control: HTMLElement): void => {
			this.#restoreControlLock(control);
		});
		this.#applyToolbarLock();
		this.#syncToolbarControls();
		this.#controlAttributes.clear();
	}

	#setupToolbarAccessibility(label: string): void
	{
		const toolbar = this.#editorNode.querySelector<HTMLElement>('.bxhtmled-toolbar');
		if (toolbar === null)
		{
			return;
		}

		this.#toolbar = toolbar;
		this.#toolbarAttributes = {
			role: toolbar.getAttribute('role'),
			ariaLabel: toolbar.getAttribute('aria-label'),
		};
		Dom.attr(toolbar, {
			role: 'toolbar',
			'aria-label': label,
		});
		this.#syncToolbarControls();

		this.#toolbarFocusZone = new FocusZone(toolbar, {
			bindKeys: FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd,
			focusInStrategy: 'previous',
			focusOutBehavior: 'wrap',
			focusableElementFilter: (element: HTMLElement): boolean => {
				return element.matches(TOOLBAR_CONTROL_SELECTOR)
					&& element.getAttribute('aria-disabled') !== 'true'
				;
			},
		});
		this.#toolbarFocusZone.activate();

		this.#toolbarObserver = new MutationObserver((): void => {
			this.#syncToolbarControls();
			this.#toolbarFocusZone?.refreshElements();
		});
		this.#toolbarObserver.observe(toolbar, {
			attributes: true,
			attributeFilter: ['class', 'hidden', 'style', 'title'],
			childList: true,
			subtree: true,
		});
	}

	#syncToolbarControls(): void
	{
		if (this.#toolbar === null)
		{
			return;
		}

		this.#toolbarControlAttributes.forEach((attributes, control: HTMLElement): void => {
			if (!this.#toolbar?.contains(control))
			{
				CoreEvent.unbind(control, 'keydown', this.#handleToolbarControlKeyDown);
				this.#toolbarControlAttributes.delete(control);
			}
		});

		this.#toolbar.querySelectorAll<HTMLElement>(TOOLBAR_CONTROL_SELECTOR).forEach(
			(control: HTMLElement): void => {
				if (!this.#toolbarControlAttributes.has(control))
				{
					this.#toolbarControlAttributes.set(control, {
						role: control.getAttribute('role'),
						tabIndex: control.getAttribute('tabindex'),
						ariaLabel: control.getAttribute('aria-label'),
						ariaDisabled: control.getAttribute('aria-disabled'),
						ariaHasPopup: control.getAttribute('aria-haspopup'),
					});
					CoreEvent.bind(control, 'keydown', this.#handleToolbarControlKeyDown);
				}

				const label = this.#resolveToolbarControlLabel(control);
				const disabled = Dom.hasClass(control, TOOLBAR_DISABLED_CLASS);
				Dom.attr(control, {
					role: 'button',
					tabindex: disabled ? '-1' : '0',
					'aria-label': label,
					'aria-disabled': disabled ? 'true' : null,
					'aria-haspopup': control.matches(TOOLBAR_MENU_CONTROL_SELECTOR) ? 'menu' : null,
				});
			},
		);
	}

	#resolveToolbarControlLabel(control: HTMLElement): string
	{
		const title = control.getAttribute('title')?.trim() ?? '';
		const text = control.textContent?.trim() ?? '';
		if (title !== '' || text !== '')
		{
			return title || text;
		}

		for (const [selector, messageCode] of TOOLBAR_CONTROL_LABEL_MESSAGES)
		{
			if (control.matches(selector))
			{
				return Loc.getMessage(messageCode) ?? '';
			}
		}

		return '';
	}

	#destroyToolbarAccessibility(): void
	{
		this.#toolbarObserver?.disconnect();
		this.#toolbarObserver = null;
		this.#toolbarFocusZone?.deactivate();
		this.#toolbarFocusZone = null;

		this.#toolbarControlAttributes.forEach((attributes, control: HTMLElement): void => {
			CoreEvent.unbind(control, 'keydown', this.#handleToolbarControlKeyDown);
			Dom.attr(control, {
				role: attributes.role,
				tabindex: attributes.tabIndex,
				'aria-label': attributes.ariaLabel,
				'aria-disabled': attributes.ariaDisabled,
				'aria-haspopup': attributes.ariaHasPopup,
			});
		});
		this.#toolbarControlAttributes.clear();

		if (this.#toolbar !== null && this.#toolbarAttributes !== null)
		{
			Dom.attr(this.#toolbar, {
				role: this.#toolbarAttributes.role,
				'aria-label': this.#toolbarAttributes.ariaLabel,
			});
		}
		this.#toolbar = null;
		this.#toolbarAttributes = null;
	}

	#handleToolbarControlKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'Enter' && event.key !== ' ')
		{
			return;
		}

		const control = event.currentTarget as HTMLElement | null;
		if (control === null || control.getAttribute('aria-disabled') === 'true')
		{
			return;
		}

		event.preventDefault();
		control.click();
	};

	#applyControlLock(control: HTMLElement): void
	{
		if (!this.#controlAttributes.has(control))
		{
			this.#controlAttributes.set(control, {
				tabIndex: control.getAttribute('tabindex'),
				readonly: control.getAttribute('readonly'),
			});
		}

		if (this.#disabled)
		{
			Dom.attr(control, 'tabindex', '-1');
			this.#setTextareaReadonly(control, 'readonly');

			return;
		}

		this.#restoreControlLock(control);
	}

	#restoreControlLock(control: HTMLElement): void
	{
		const attributes = this.#controlAttributes.get(control);
		if (attributes === undefined)
		{
			return;
		}

		Dom.attr(control, 'tabindex', attributes.tabIndex);
		this.#setTextareaReadonly(control, attributes.readonly);
	}

	#setTextareaReadonly(control: HTMLElement, value: string | null): void
	{
		if (control.tagName !== 'TEXTAREA')
		{
			return;
		}

		Dom.attr(control, 'readonly', value);
	}

	#applyToolbarLock(): void
	{
		const editor = this.#getEditor();
		if (
			editor === null
			|| editor.toolbar === undefined
			|| !Type.isFunction(editor.toolbar.DisableWysiwygButtons)
		)
		{
			return;
		}

		const disabledByMode = editor.GetViewMode?.() === 'code';
		editor.toolbar.DisableWysiwygButtons(this.#disabled || disabledByMode);
	}

	#getEditorControls(): HTMLElement[]
	{
		return [...this.#editorNode.querySelectorAll<HTMLElement>('iframe, textarea')];
	}

	#restoreLocation(): void
	{
		if (this.#initialLocation === null)
		{
			return;
		}

		const { parent, nextSibling } = this.#initialLocation;
		if (nextSibling !== null && nextSibling.parentNode === parent)
		{
			Dom.insertBefore(this.#editorNode, nextSibling as HTMLElement);

			return;
		}

		Dom.append(this.#editorNode, parent as HTMLElement);
	}

	#getEditor(): HtmlEditorInstance | null
	{
		const manager = Reflection.getClass('BXHtmlEditor') as unknown as HtmlEditorManager | null;
		const editor = manager?.Get(this.#editorInstanceId) ?? null;

		return editor === false ? null : editor;
	}

	#requireEditor(): HtmlEditorInstance
	{
		const editor = this.#getEditor();
		if (editor === null)
		{
			throw new Error(`HTML editor ${this.#editorInstanceId} is not initialized`);
		}

		return editor;
	}
}

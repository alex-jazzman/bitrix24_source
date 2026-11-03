import { Tag, Type, Dom, Text } from 'main.core';
import { effect, type ReadonlySignal } from 'ui.lexical.extension';
import { ToolbarItem } from './toolbar-item';

/**
 * @memberof BX.UI.TextEditor
 */
export class Button extends ToolbarItem
{
	#format: string | null = null;
	#blockType: string | null = null;
	#active: boolean = false;
	#disabled: boolean = false;
	#disableInsideUnformatted = false;
	#disableCallback: Function | null = null;
	#container: HTMLButtonElement | null = null;
	#disabledSource: ReadonlySignal<boolean> | null = null;
	#disposers: Array<() => void> = [];

	setContent(content: string | HTMLElement)
	{
		if (Type.isString(content))
		{
			this.getContainer().innerHTML = content;
		}
		else if (Type.isElementNode(content))
		{
			this.getContainer().append(content);
		}
	}

	setIcon(icon: string): void
	{
		this.setContent(`<span class="ui-icon-set --${Text.encode(icon)}"></span>`);
	}

	setFormat(format: string)
	{
		this.#format = format;
		this.#markAsToggle();
	}

	getFormat(): string | null
	{
		return this.#format;
	}

	setBlockType(type: string)
	{
		this.#blockType = type;
		this.#markAsToggle();
	}

	getBlockType(): string | null
	{
		return this.#blockType;
	}

	/**
	 * The tooltip doubles as the accessible name: the button holds a single icon and has no other
	 * source of a name. Both attributes are written with setAttribute, so the value must not be
	 * HTML-encoded — a screen reader would otherwise read out "&amp;" instead of "&".
	 */
	setTooltip(tooltip: string | null)
	{
		if (Type.isStringFilled(tooltip))
		{
			Dom.attr(this.getContainer(), 'title', tooltip);
			Dom.attr(this.getContainer(), 'aria-label', tooltip);
		}
		else if (tooltip === null)
		{
			Dom.attr(this.getContainer(), 'title', null);
			Dom.attr(this.getContainer(), 'aria-label', null);
		}
	}

	/**
	 * The kind of surface the button opens: 'dialog', 'menu', 'listbox' and so on. No aria-expanded
	 * goes with it — an open dialog is not an expanded state of the button itself.
	 */
	setHasPopup(type: string | null): void
	{
		Dom.attr(this.getContainer(), 'aria-haspopup', type);
	}

	// for a button that expands something in place; a button that opens a popup takes setHasPopup
	setExpanded(expanded: boolean): void
	{
		Dom.attr(this.getContainer(), 'aria-expanded', expanded ? 'true' : 'false');
	}

	disableInsideUnformatted(): void
	{
		this.#disableInsideUnformatted = true;
	}

	enableInsideUnformatted(): void
	{
		this.#disableInsideUnformatted = false;
	}

	shouldDisableInsideUnformatted(): boolean
	{
		return this.#disableInsideUnformatted;
	}

	setActive(active: boolean = true): void
	{
		if (active === this.#active)
		{
			return;
		}

		this.#active = active;
		if (active)
		{
			Dom.addClass(this.getContainer(), '--active');
		}
		else
		{
			Dom.removeClass(this.getContainer(), '--active');
		}

		if (this.#isToggle())
		{
			Dom.attr(this.getContainer(), 'aria-pressed', active ? 'true' : 'false');
		}
	}

	isActive(): boolean
	{
		return this.#active;
	}

	setDisabled(disabled: boolean = true): void
	{
		if (disabled === this.#disabled)
		{
			return;
		}

		this.#disabled = disabled;
		// the native property rather than Dom.attr: it yields disabled="" instead of
		// disabled="true" and takes the button out of the tab order for free
		this.getContainer().disabled = disabled;
	}

	disable(): void
	{
		this.setDisabled(true);
	}

	enable(): void
	{
		this.setDisabled(false);
	}

	isDisabled(): boolean
	{
		return this.#disabled;
	}

	hasOwnDisableCallback(): boolean
	{
		return this.#disableCallback !== null;
	}

	setDisableCallback(fn: Function): void
	{
		if (Type.isFunction(fn))
		{
			this.#disableCallback = fn;
		}
	}

	invokeDisableCallback(): boolean
	{
		return this.#disableCallback!();
	}

	/**
	 * Hands the disabled state over to a signal. From now on the button reports itself as reactive
	 * and the toolbar binds no source of its own over it: two writers on one attribute would fight
	 * each other.
	 */
	bindDisabled(source: ReadonlySignal<boolean>): void
	{
		this.#disabledSource = source;
		this.#disposers.push(effect((): void => {
			this.setDisabled(source.value);
		}));
	}

	hasReactiveDisabled(): boolean
	{
		return this.#disabledSource !== null;
	}

	getDisabledSignal(): ReadonlySignal<boolean> | null
	{
		return this.#disabledSource;
	}

	/**
	 * Binds the pressed state to a signal. The caller is responsible for folding the disabled
	 * state in: a disabled button never reads as active.
	 */
	bindActive(source: ReadonlySignal<boolean>): void
	{
		this.#disposers.push(effect((): void => {
			this.setActive(source.value);
		}));
	}

	destroy(): void
	{
		this.#disposers.forEach((dispose: () => void): void => {
			dispose();
		});
		this.#disposers = [];
	}

	getContainer(): HTMLButtonElement
	{
		if (this.#container === null)
		{
			this.#container = Tag.render<HTMLButtonElement>`
				<button
					type="button"
					class="ui-text-editor-toolbar-button"
					onclick="${this.#handleClick.bind(this)}"
				>
				</button>
			`;
		}

		return this.#container!;
	}

	render(): HTMLElement
	{
		return this.getContainer();
	}

	#handleClick(): void
	{
		this.emit('onClick');
	}

	/**
	 * A toggle is a button that reflects the state of the selection — a format or a block type.
	 * Only those need aria-pressed: plain commands like undo have no pressed state.
	 */
	#isToggle(): boolean
	{
		return this.#format !== null || this.#blockType !== null;
	}

	#markAsToggle(): void
	{
		Dom.attr(this.getContainer(), 'aria-pressed', this.#active ? 'true' : 'false');
	}
}

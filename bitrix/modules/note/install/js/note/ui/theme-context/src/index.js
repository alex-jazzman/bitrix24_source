import { Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';
import './styles/theme-context.css';

export const NoteTheme = Object.freeze({
	LIGHT: 'light',
	DARK: 'dark',
});

const DESIGN_CONTEXT_CLASS = Object.freeze({
	[NoteTheme.LIGHT]: '--ui-context-content-light',
	[NoteTheme.DARK]: '--ui-context-content-dark',
});

const NOTE_THEME_EVENT = 'BX.Note.ThemeContext:changed';

let currentTheme: string = NoteTheme.LIGHT;

function normalize(theme: mixed): string
{
	return theme === NoteTheme.DARK ? NoteTheme.DARK : NoteTheme.LIGHT;
}

export const NoteThemeContext = {
	EVENT_CHANGED: NOTE_THEME_EVENT,

	set(theme: string): void
	{
		const next = normalize(theme);
		if (next === currentTheme)
		{
			return;
		}

		currentTheme = next;
		EventEmitter.emit(NOTE_THEME_EVENT, { theme: next });
	},

	get(): string
	{
		return currentTheme;
	},

	getDesignSystemContext(): string
	{
		return DESIGN_CONTEXT_CLASS[currentTheme] ?? DESIGN_CONTEXT_CLASS[NoteTheme.LIGHT];
	},

	resolveDesignSystemContext(theme: string): string
	{
		return DESIGN_CONTEXT_CLASS[normalize(theme)];
	},

	subscribe(handler: (event: Object) => void): () => void
	{
		EventEmitter.subscribe(NOTE_THEME_EVENT, handler);

		return () => EventEmitter.unsubscribe(NOTE_THEME_EVENT, handler);
	},

	/**
	 * Theme a `ui.system.dialog` popup. Call from inside `events.onShow` with the dialog's
	 * content node — finds the rendered `.popup-window` and keeps the design-system context
	 * class in sync with the active note theme until the dialog hides.
	 *
	 * @param dialog Dialog instance (must expose `.subscribe`).
	 * @param contentNode The DOM node that was passed as `content` to the Dialog.
	 * @param options.extraClass Additional class to add to the popup-window (for scoped styling).
	 */
	themeDialog(dialog: Object, contentNode: HTMLElement, options?: { extraClass?: string }): void
	{
		if (!dialog || !contentNode)
		{
			return;
		}

		let popupEl: HTMLElement | null = null;
		let unsubscribeTheme: (() => void) | null = null;

		const apply = (theme: string): void => {
			if (!popupEl)
			{
				return;
			}
			Dom.removeClass(popupEl, DESIGN_CONTEXT_CLASS[NoteTheme.LIGHT]);
			Dom.removeClass(popupEl, DESIGN_CONTEXT_CLASS[NoteTheme.DARK]);
			Dom.addClass(popupEl, DESIGN_CONTEXT_CLASS[normalize(theme)]);
		};

		const onShow = (): void => {
			popupEl = contentNode.closest?.('.popup-window') ?? null;
			if (!popupEl)
			{
				return;
			}
			if (options?.extraClass)
			{
				Dom.addClass(popupEl, options.extraClass);
			}
			apply(currentTheme);
			unsubscribeTheme = this.subscribe(({ data }) => apply(data?.theme));
		};

		const onHide = (): void => {
			unsubscribeTheme?.();
			unsubscribeTheme = null;
			popupEl = null;
		};

		dialog.subscribe?.('onShow', onShow);
		dialog.subscribe?.('onAfterHide', onHide);
	},

	/**
	 * Apply the active design-system context class to a `ui.entity-selector`
	 * TagSelector. The selector hardcodes `--ui-context-content-light` on its
	 * outer container; call this AFTER `new TagSelector(...)` but BEFORE
	 * `selector.renderTo(...)` so the swap happens before the element joins
	 * the DOM — avoids a one-frame white flash on dark theme. Also subscribes
	 * to live theme changes.
	 */
	applyToTagSelector(selector: Object): void
	{
		if (!selector || typeof selector.getOuterContainer !== 'function')
		{
			return;
		}

		const apply = (theme: string): void => {
			const outer = selector.getOuterContainer();
			if (!outer)
			{
				return;
			}
			Dom.removeClass(outer, DESIGN_CONTEXT_CLASS[NoteTheme.LIGHT]);
			Dom.removeClass(outer, DESIGN_CONTEXT_CLASS[NoteTheme.DARK]);
			Dom.addClass(outer, DESIGN_CONTEXT_CLASS[normalize(theme)]);
		};

		apply(currentTheme);
		this.subscribe(({ data }) => apply(data?.theme));
	},

	/**
	 * Theme an `ui.entity-selector` Dialog (the dropdown popup with tabs/search).
	 * The selector's outer popup-window is created lazily on first open, so the
	 * design-system context class is (re)applied every onShow and removed on hide.
	 *
	 * @param entitySelectorDialog Dialog instance from `selector.getDialog()` or
	 *                             from `new Dialog(...)` of `ui.entity-selector`.
	 */
	themeEntitySelector(entitySelectorDialog: Object): void
	{
		if (!entitySelectorDialog || typeof entitySelectorDialog.subscribe !== 'function')
		{
			return;
		}

		let unsubscribeTheme: (() => void) | null = null;

		const getPopupEl = (): HTMLElement | null => {
			const popup = typeof entitySelectorDialog.getPopup === 'function'
				? entitySelectorDialog.getPopup()
				: null
			;

			return popup && typeof popup.getPopupContainer === 'function'
				? popup.getPopupContainer()
				: null
			;
		};

		const apply = (theme: string): void => {
			const popupEl = getPopupEl();
			if (!popupEl)
			{
				return;
			}
			Dom.removeClass(popupEl, DESIGN_CONTEXT_CLASS[NoteTheme.LIGHT]);
			Dom.removeClass(popupEl, DESIGN_CONTEXT_CLASS[NoteTheme.DARK]);
			Dom.addClass(popupEl, DESIGN_CONTEXT_CLASS[normalize(theme)]);
		};

		const onShow = (): void => {
			apply(currentTheme);
			if (unsubscribeTheme === null)
			{
				unsubscribeTheme = this.subscribe(({ data }) => apply(data?.theme));
			}
		};

		const onHide = (): void => {
			unsubscribeTheme?.();
			unsubscribeTheme = null;
		};

		entitySelectorDialog.subscribe('onShow', onShow);
		entitySelectorDialog.subscribe('onHide', onHide);
	},
};

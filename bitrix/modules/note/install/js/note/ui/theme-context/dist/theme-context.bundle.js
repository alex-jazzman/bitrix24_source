/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	const NoteTheme = Object.freeze({
		LIGHT: 'light',
		DARK: 'dark'
	});
	const DESIGN_CONTEXT_CLASS = Object.freeze({
		[NoteTheme.LIGHT]: '--ui-context-content-light',
		[NoteTheme.DARK]: '--ui-context-content-dark'
	});
	const NOTE_THEME_EVENT = 'BX.Note.ThemeContext:changed';
	let currentTheme = NoteTheme.LIGHT;
	function normalize(theme) {
		return theme === NoteTheme.DARK ? NoteTheme.DARK : NoteTheme.LIGHT;
	}
	const NoteThemeContext = {
		EVENT_CHANGED: NOTE_THEME_EVENT,
		set(theme) {
			const next = normalize(theme);
			if (next === currentTheme) {
				return;
			}
			currentTheme = next;
			main_core_events.EventEmitter.emit(NOTE_THEME_EVENT, {
				theme: next
			});
		},
		get() {
			return currentTheme;
		},
		getDesignSystemContext() {
			return DESIGN_CONTEXT_CLASS[currentTheme] ?? DESIGN_CONTEXT_CLASS[NoteTheme.LIGHT];
		},
		resolveDesignSystemContext(theme) {
			return DESIGN_CONTEXT_CLASS[normalize(theme)];
		},
		subscribe(handler) {
			main_core_events.EventEmitter.subscribe(NOTE_THEME_EVENT, handler);
			return () => main_core_events.EventEmitter.unsubscribe(NOTE_THEME_EVENT, handler);
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
		themeDialog(dialog, contentNode, options) {
			if (!dialog || !contentNode) {
				return;
			}
			let popupEl = null;
			let unsubscribeTheme = null;
			const apply = theme => {
				if (!popupEl) {
					return;
				}
				main_core.Dom.removeClass(popupEl, DESIGN_CONTEXT_CLASS[NoteTheme.LIGHT]);
				main_core.Dom.removeClass(popupEl, DESIGN_CONTEXT_CLASS[NoteTheme.DARK]);
				main_core.Dom.addClass(popupEl, DESIGN_CONTEXT_CLASS[normalize(theme)]);
			};
			const onShow = () => {
				popupEl = contentNode.closest?.('.popup-window') ?? null;
				if (!popupEl) {
					return;
				}
				if (options?.extraClass) {
					main_core.Dom.addClass(popupEl, options.extraClass);
				}
				apply(currentTheme);
				unsubscribeTheme = this.subscribe(({
					data
				}) => apply(data?.theme));
			};
			const onHide = () => {
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
		applyToTagSelector(selector) {
			if (!selector || typeof selector.getOuterContainer !== 'function') {
				return;
			}
			const apply = theme => {
				const outer = selector.getOuterContainer();
				if (!outer) {
					return;
				}
				main_core.Dom.removeClass(outer, DESIGN_CONTEXT_CLASS[NoteTheme.LIGHT]);
				main_core.Dom.removeClass(outer, DESIGN_CONTEXT_CLASS[NoteTheme.DARK]);
				main_core.Dom.addClass(outer, DESIGN_CONTEXT_CLASS[normalize(theme)]);
			};
			apply(currentTheme);
			this.subscribe(({
				data
			}) => apply(data?.theme));
		},
		/**
		 * Theme an `ui.entity-selector` Dialog (the dropdown popup with tabs/search).
		 * The selector's outer popup-window is created lazily on first open, so the
		 * design-system context class is (re)applied every onShow and removed on hide.
		 *
		 * @param entitySelectorDialog Dialog instance from `selector.getDialog()` or
		 *                             from `new Dialog(...)` of `ui.entity-selector`.
		 */
		themeEntitySelector(entitySelectorDialog) {
			if (!entitySelectorDialog || typeof entitySelectorDialog.subscribe !== 'function') {
				return;
			}
			let unsubscribeTheme = null;
			const getPopupEl = () => {
				const popup = typeof entitySelectorDialog.getPopup === 'function' ? entitySelectorDialog.getPopup() : null;
				return popup && typeof popup.getPopupContainer === 'function' ? popup.getPopupContainer() : null;
			};
			const apply = theme => {
				const popupEl = getPopupEl();
				if (!popupEl) {
					return;
				}
				main_core.Dom.removeClass(popupEl, DESIGN_CONTEXT_CLASS[NoteTheme.LIGHT]);
				main_core.Dom.removeClass(popupEl, DESIGN_CONTEXT_CLASS[NoteTheme.DARK]);
				main_core.Dom.addClass(popupEl, DESIGN_CONTEXT_CLASS[normalize(theme)]);
			};
			const onShow = () => {
				apply(currentTheme);
				if (unsubscribeTheme === null) {
					unsubscribeTheme = this.subscribe(({
						data
					}) => apply(data?.theme));
				}
			};
			const onHide = () => {
				unsubscribeTheme?.();
				unsubscribeTheme = null;
			};
			entitySelectorDialog.subscribe('onShow', onShow);
			entitySelectorDialog.subscribe('onHide', onHide);
		}
	};

	exports.NoteTheme = NoteTheme;
	exports.NoteThemeContext = NoteThemeContext;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, BX, BX.Event);
//# sourceMappingURL=theme-context.bundle.js.map

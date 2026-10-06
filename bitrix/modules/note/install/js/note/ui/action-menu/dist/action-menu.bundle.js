/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, main_core, main_popup, note_ui_themeContext, ui_iconSet_api_vue, ui_vue3) {
	'use strict';

	const POPUP_CLASS = 'note-action-menu';
	class ActionMenuService {
		#menu = null;
		#openKey = '';
		#popupClass;
		#additionalClassName;
		constructor(options = {}) {
			this.#popupClass = main_core.Type.isStringFilled(options?.popupClass) ? options.popupClass : POPUP_CLASS;
			this.#additionalClassName = main_core.Type.isStringFilled(options?.additionalClassName) ? options.additionalClassName : '';
		}
		destroy() {
			this.#openKey = '';
			if (this.#menu) {
				this.#menu.destroy();
				this.#menu = null;
			}
		}
		open(items, bindElement, options = {}) {
			if (!Array.isArray(items) || items.length === 0 || !bindElement) {
				return;
			}
			const key = main_core.Type.isStringFilled(options?.key) ? String(options.key) : '';
			if (key !== '' && this.#openKey === key) {
				this.destroy();
				return;
			}
			this.destroy();
			this.#openKey = key;
			const popupClass = main_core.Type.isStringFilled(options?.popupClass) ? options.popupClass : this.#popupClass;
			const additionalClassName = main_core.Type.isStringFilled(options?.additionalClassName) ? options.additionalClassName : this.#additionalClassName;
			const menuItems = items.map(item => this.#prepareItem(item, popupClass));
			const menuId = `${popupClass}-${main_core.Text.getRandom()}`;
			const targetContainer = options?.targetContainer ?? document.body;
			const className = additionalClassName === '' ? popupClass : `${popupClass} ${additionalClassName}`;
			this.#menu = main_popup.MenuManager.create(menuId, bindElement, menuItems, {
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				offsetTop: main_core.Type.isNumber(options?.offsetTop) ? options.offsetTop : 9,
				className,
				targetContainer,
				designSystemContext: note_ui_themeContext.NoteThemeContext.getDesignSystemContext(),
				events: {
					onPopupClose: () => {
						this.#openKey = '';
						this.#menu = null;
					}
				}
			});
			this.#menu?.show();
		}
		#prepareItem(item, popupClass) {
			const text = String(item?.text ?? '');
			const iconModifier = String(item?.iconModifier ?? '');
			const iconColor = main_core.Type.isStringFilled(item?.iconColor) ? String(item.iconColor) : '';
			const iconElement = item?.iconElement instanceof HTMLElement ? item.iconElement : null;
			const danger = Boolean(item?.danger);
			const onClick = main_core.Type.isFunction(item?.onClick) ? item.onClick : () => {};
			const testId = main_core.Type.isStringFilled(item?.testId) ? String(item.testId) : '';
			const baseClass = `${popupClass}-item`;
			const className = danger ? `${baseClass} ${baseClass}--danger` : baseClass;
			return {
				html: this.#renderItem(text, iconModifier, iconColor, iconElement, popupClass, testId),
				className,
				onclick: () => {
					this.destroy();
					onClick();
				}
			};
		}
		#renderItem(text, iconModifier, iconColor, iconElement, popupClass, testId) {
			const safeText = String(text || '');
			const iconNode = iconElement ?? this.#renderIconSetIcon(iconModifier, iconColor, popupClass);
			// Identity for tests: an item is otherwise reachable only by its icon modifier
			// or its localised label, both of which drift.
			const row = main_core.Tag.render`
			<span class="${popupClass}-row">
				<span class="${popupClass}-text">${safeText}</span>
				${iconNode}
			</span>
		`;
			if (testId !== '') {
				row.dataset.testid = testId;
			}
			return row;
		}
		#renderIconSetIcon(iconModifier, iconColor, popupClass) {
			const iconClass = iconModifier ? `ui-icon-set --${iconModifier} ${popupClass}-icon` : '';
			const iconStyle = iconColor ? `--ui-icon-set__icon-color: ${iconColor};` : '';
			return main_core.Tag.render`<span class="${iconClass}" style="${iconStyle}"></span>`;
		}
	}

	const ActionMenuButton = {
		name: 'NoteActionMenuButton',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			items: {
				type: Array,
				default: null
			},
			getItems: {
				type: Function,
				default: null
			},
			menuKey: {
				type: [String, Number],
				default: ''
			},
			popupClass: {
				type: String,
				default: 'note-action-menu'
			},
			size: {
				type: Number,
				default: 24
			},
			iconName: {
				type: String,
				default: ''
			},
			ariaLabel: {
				type: String,
				default: ''
			}
		},
		emits: ['open', 'close'],
		computed: {
			triggerIcon() {
				return main_core.Type.isStringFilled(this.iconName) ? this.iconName : ui_iconSet_api_vue.Outline.MORE_L;
			},
			triggerLabel() {
				if (main_core.Type.isStringFilled(this.ariaLabel)) {
					return this.ariaLabel;
				}
				return main_core.Loc.getMessage('NOTE_ACTION_MENU_TRIGGER_LABEL') || '';
			}
		},
		created() {
			this.service = ui_vue3.markRaw(new ActionMenuService({
				popupClass: this.popupClass
			}));
		},
		beforeUnmount() {
			this.service?.destroy?.();
			this.service = null;
		},
		methods: {
			onClick(event) {
				event?.stopPropagation?.();
				const target = event?.currentTarget;
				if (!(target instanceof HTMLElement)) {
					return;
				}
				const items = main_core.Type.isFunction(this.getItems) ? this.getItems() : this.items;
				if (!Array.isArray(items) || items.length === 0) {
					return;
				}
				this.service?.open(items, target, {
					key: String(this.menuKey || ''),
					popupClass: this.popupClass
				});
				this.$emit('open');
			}
		},
		// language=Vue
		template: `
		<button
			type="button"
			class="note-action-menu-trigger"
			:aria-label="triggerLabel"
			@click="onClick"
		>
			<BIcon :name="triggerIcon" :size="size" />
		</button>
	`
	};

	exports.ActionMenuButton = ActionMenuButton;
	exports.ActionMenuService = ActionMenuService;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, BX, BX.Main, BX.Note.Ui, BX.UI.IconSet, BX.Vue3);
//# sourceMappingURL=action-menu.bundle.js.map

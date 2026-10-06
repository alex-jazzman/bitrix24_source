/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_events, ui_entitySelector) {
	'use strict';

	const activationKeys = new Set(['Enter', ' ']);
	class SignDropdown extends main_core_events.EventEmitter {
		events = {
			onSelect: 'onSelect'
		};
		#dom;
		#selector;
		#selectedItemId = '';
		#selectedItemCaption = '';
		#isOnSelectEventEnabled = true;
		constructor(dialogOptions) {
			super();
			this.setEventNamespace('BX.V2.B2e.SignDropdown');
			const {
				className,
				withCaption,
				isEnableSearch,
				width,
				height
			} = dialogOptions;
			const titleNode = withCaption ? main_core.Tag.render`
				<div class="sign-b2e-dropdown__text">
					<span class="sign-b2e-dropdown__text_title"></span>
					<span class="sign-b2e-dropdown__text_caption"></span>
				</div>
			` : main_core.Tag.render`<span class="sign-b2e-dropdown__text"></span>`;
			this.#dom = main_core.Tag.render`
			<div
				class="sign-b2e-dropdown"
				role="button"
				tabindex="0"
				aria-haspopup="dialog"
				aria-expanded="false"
				data-test-id="sign-b2e-dropdown-trigger"
			>
				${titleNode}
				<span class="sign-b2e-dropdown__btn"></span>
			</div>
		`;
			main_core.Event.bind(this.#dom, 'click', () => this.#showSelector());
			main_core.Event.bind(this.#dom, 'keydown', event => this.#handleKeydown(event));
			this.#selector = new ui_entitySelector.Dialog({
				targetNode: this.#dom,
				width: width ?? 500,
				height: height ?? 350,
				showAvatars: false,
				dropdownMode: true,
				multiple: false,
				enableSearch: isEnableSearch ?? true,
				hideOnSelect: true,
				events: {
					onShow: () => this.#setExpanded(true),
					onHide: () => this.#setExpanded(false),
					'Item:OnSelect': ({
						data
					}) => this.#onSelect(data.item)
				},
				...dialogOptions
			});
			if (className) {
				const container = this.#selector.getContainer();
				main_core.Dom.addClass(container, className);
			}
		}
		addItem(item) {
			this.#selector.addItem(item);
		}
		addItems(items) {
			items.forEach(item => this.#selector.addItem(item));
		}
		removeItems() {
			this.#selector.removeItems();
		}
		selectFirstItem() {
			const [firstItem] = this.#selector.getItems();
			if (!main_core.Type.isUndefined(firstItem)) {
				firstItem.select();
			}
		}
		selectItem(id) {
			const items = this.#selector.getItems();
			const foundItem = items.find(item => item.id === id);
			if (!foundItem) {
				return;
			}
			foundItem.select();
		}

		/**
		 * Without events
		 */
		setItemSelected(id) {
			this.#isOnSelectEventEnabled = false;
			this.selectItem(id);
			this.#isOnSelectEventEnabled = true;
		}
		getLayout() {
			return this.#dom;
		}
		getSelectedId() {
			return this.#selectedItemId;
		}
		getSelectedCaption() {
			return this.#selectedItemCaption;
		}
		show() {
			main_core.Dom.style(this.#dom, {
				display: 'flex'
			});
		}
		hide() {
			main_core.Dom.style(this.#dom, {
				display: 'none'
			});
		}
		#showSelector() {
			this.#setExpanded(true);
			this.#selector.show();
		}
		#handleKeydown(event) {
			if (!activationKeys.has(event.key)) {
				return;
			}
			event.preventDefault();
			this.#showSelector();
		}
		#setExpanded(expanded) {
			main_core.Dom.attr(this.#dom, 'aria-expanded', expanded ? 'true' : 'false');
		}
		#onSelect(item) {
			this.#setItemSelected(item);
			if (this.#isOnSelectEventEnabled === false) {
				return;
			}
			this.emit(this.events.onSelect, {
				item
			});
		}
		#setItemSelected(item) {
			this.#selectedItemId = item.id;
			const {
				title,
				caption
			} = item;
			const {
				firstElementChild: titleNode
			} = this.#dom;
			if (!caption) {
				titleNode.textContent = title;
				titleNode.title = title;
				return;
			}
			this.#selectedItemCaption = caption.text;
			titleNode.title = `${title} ${caption}`;
			titleNode.firstElementChild.textContent = title;
			titleNode.lastElementChild.textContent = caption;
		}
	}

	exports.SignDropdown = SignDropdown;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Event, BX.UI.EntitySelector);
//# sourceMappingURL=sign-dropdown.bundle.js.map

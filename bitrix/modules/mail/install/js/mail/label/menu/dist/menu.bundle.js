/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Label = this.BX.Mail.Label || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_iconSet_api_core) {
	'use strict';

	const ACTIVE_CLASS = 'mail-menu-directory-item--active';
	const COUNTER_HIDDEN_CLASS = 'ui-sidepanel-menu-link-text-counter-hidden';
	class LabelMenuItem {
		#id;
		#element;
		#itemElement;
		#link;
		#counterElement;
		#onSelect;
		constructor(label, onSelect) {
			this.#id = label.id;
			this.#onSelect = onSelect;
			this.#element = this.#render(label);
			this.#itemElement = this.#element.querySelector('.ui-sidepanel-menu-item');
			this.#link = this.#element.querySelector('.ui-sidepanel-menu-link');
			this.#counterElement = this.#element.querySelector('.ui-sidepanel-menu-link-text-counter');
			main_core.Event.bind(this.#itemElement, 'click', this.#handleClick);
			main_core.Event.bind(this.#itemElement, 'keydown', this.#handleKeydown);
			this.setCount(label.unread);
		}
		getId() {
			return this.#id;
		}
		getElement() {
			return this.#element;
		}
		setCount(unread) {
			this.#counterElement.textContent = String(unread);
			if (unread > 0) {
				main_core.Dom.removeClass(this.#counterElement, COUNTER_HIDDEN_CLASS);
			} else {
				main_core.Dom.addClass(this.#counterElement, COUNTER_HIDDEN_CLASS);
			}
		}
		setActive(isActive) {
			if (isActive) {
				main_core.Dom.addClass(this.#itemElement, ACTIVE_CLASS);
				main_core.Dom.attr(this.#link, 'aria-current', 'true');
			} else {
				main_core.Dom.removeClass(this.#itemElement, ACTIVE_CLASS);
				main_core.Dom.attr(this.#link, 'aria-current', null);
			}
		}
		#render(label) {
			const name = main_core.Text.encode(label.name);
			return main_core.Tag.render`
			<div class="mail-menu-directory-item-container" title="${name}">
				<li tabindex="0" class="ui-sidepanel-menu-item ui-sidepanel-menu-counter-white">
					<a
						class="ui-sidepanel-menu-link mail-menu-directory-link"
						data-testid="mail_label-menu__item"
						data-label-id="${this.#id}"
					>
						<div class="ui-sidepanel-menu-link-text">
							<span class="ui-icon-set --o-sale-tag mail-menu-directory-item-icon" aria-hidden="true"></span>
							<span class="ui-sidepanel-menu-link-text-item">${name}</span>
						</div>
						<span class="ui-sidepanel-menu-link-text-counter" aria-hidden="true"></span>
					</a>
				</li>
			</div>
		`;
		}
		#handleClick = () => {
			this.#onSelect(this.#id);
		};
		#handleKeydown = event => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				this.#onSelect(this.#id);
			}
		};
	}

	function createSectionDivider() {
		return main_core.Tag.render`<div class="mail-favorites-menu-separator mail-favorites-menu-separator--leading"></div>`;
	}

	const PULL_COMMAND_COUNTERS_UPDATED = 'labelCountersUpdated';
	class LabelsMenu {
		#container;
		#onSelect;
		#onCreate;
		#labels;
		#items = new Map();
		#activeLabelId = null;
		#root = null;
		#bodyElement = null;
		constructor(options) {
			this.#container = options.container;
			this.#labels = options.labels ?? [];
			this.#onSelect = options.onSelect;
			this.#onCreate = options.onCreate ?? null;
			main_core_events.EventEmitter.subscribe('onPullEvent-mail', this.#handlePullEvent);
		}
		render() {
			if (this.#root) {
				return this.#root;
			}
			const root = main_core.Tag.render`
			<div class="mail-label-menu" data-testid="mail_label-menu">
				${this.#renderDivider()}
			</div>
		`;
			this.#root = root;
			this.#renderBody();
			main_core.Dom.append(root, this.#container);
			return root;
		}
		setLabels(labels) {
			this.#labels = labels;
			this.#renderBody();
		}
		updateCounters(counters) {
			for (const [id, unread] of Object.entries(counters)) {
				const labelId = Number(id);
				const item = this.#items.get(labelId);
				if (item) {
					item.setCount(unread);
				}
				const label = this.#labels.find(candidate => candidate.id === labelId);
				if (label) {
					label.unread = unread;
				}
			}
		}
		setActive(labelId) {
			this.#activeLabelId = labelId;
			for (const [id, item] of this.#items) {
				item.setActive(id === labelId);
			}
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe('onPullEvent-mail', this.#handlePullEvent);
			main_core.Dom.remove(this.#root);
			this.#root = null;
			this.#bodyElement = null;
			this.#items.clear();
		}
		#renderBody() {
			if (!this.#root) {
				return;
			}
			main_core.Dom.remove(this.#bodyElement);
			this.#bodyElement = null;
			this.#items.clear();
			this.#bodyElement = this.#labels.length > 0 ? this.#renderList() : this.#renderEmptyState();
			if (this.#bodyElement) {
				main_core.Dom.append(this.#bodyElement, this.#root);
			}
		}
		#renderList() {
			const list = main_core.Tag.render`<ul class="ui-mail-left-directory-menu mail-label-menu__list" aria-label="${main_core.Loc.getMessage('MAIL_LABEL_MENU_TITLE') ?? ''}"></ul>`;
			for (const label of this.#labels) {
				const item = new LabelMenuItem(label, this.#onSelect);
				item.setActive(label.id === this.#activeLabelId);
				this.#items.set(label.id, item);
				main_core.Dom.append(item.getElement(), list);
			}
			return list;
		}
		#renderEmptyState() {
			const onCreate = this.#onCreate;
			if (!onCreate) {
				return null;
			}
			const createButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('MAIL_LABEL_MENU_CREATE') ?? '',
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
				icon: ui_iconSet_api_core.Outline.PLUS_M,
				collapsedIcon: ui_buttons.ButtonIcon.ADD,
				wide: true,
				dataset: {
					testid: 'mail-label-menu-empty-create'
				}
			});
			const buttonNode = createButton.render();
			main_core.Event.bind(buttonNode, 'click', () => onCreate());
			return main_core.Tag.render`
			<div class="mail-label-menu__empty">
				${buttonNode}
			</div>
		`;
		}
		#renderDivider() {
			return createSectionDivider();
		}
		#handlePullEvent = event => {
			const data = event.getData();
			const command = data?.[0];
			const params = data?.[1];
			if (command === PULL_COMMAND_COUNTERS_UPDATED && main_core.Type.isPlainObject(params) && main_core.Type.isPlainObject(params.counters)) {
				this.updateCounters(params.counters);
			}
		};
	}

	exports.LabelsMenu = LabelsMenu;

})(this.BX.Mail.Label.Menu = this.BX.Mail.Label.Menu || {}, BX, BX.Event, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=menu.bundle.js.map

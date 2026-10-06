/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Label = this.BX.Mail.Label || {};
(function (exports, main_core, ui_entitySelector, ui_a11y, ui_notification, mail_label_core) {
	'use strict';

	const LABEL_ENTITY_ID = 'mail-label';
	const LABEL_TAB_ID = 'labels';
	function buildSelectorItems(labels, selectedLabelIds) {
		return labels.map(label => ({
			id: label.id,
			entityId: LABEL_ENTITY_ID,
			title: label.name,
			tabs: [LABEL_TAB_ID],
			selected: selectedLabelIds.has(label.id)
		}));
	}

	const LABELS_SLIDER_URL = '/mail/labels';
	const sharedCollections = new Map();
	const sharedPromises = new Map();
	let dialogCounter = 0;
	let cacheGeneration = 0;
	function scopeKey(mailboxId) {
		return mailboxId === null ? 'all' : String(mailboxId);
	}
	function loadSharedLabels(mailboxId) {
		const key = scopeKey(mailboxId);
		const cached = sharedCollections.get(key);
		if (cached) {
			return Promise.resolve(cached);
		}
		let promise = sharedPromises.get(key);
		if (!promise) {
			const requestedGeneration = cacheGeneration;
			promise = mail_label_core.apiClient.list(mailboxId).then(labels => {
				const collection = new mail_label_core.LabelCollection(labels);
				if (requestedGeneration === cacheGeneration) {
					sharedCollections.set(key, collection);
				}
				return collection;
			}).finally(() => {
				sharedPromises.delete(key);
			});
			sharedPromises.set(key, promise);
		}
		return promise;
	}
	function invalidateSharedLabels() {
		cacheGeneration++;
		sharedCollections.clear();
		sharedPromises.clear();
	}
	class AssignMenu {
		#bindElement;
		#messageIds;
		#currentLabelIds;
		#selectedLabelIds = new Set();
		#mailboxId;
		#onChange;
		#onShow;
		#onClose;
		#dialog = null;
		#labels = [];
		#toggleQueue = new Map();
		constructor(options) {
			this.#bindElement = options.bindElement;
			this.#messageIds = options.messageIds;
			this.#currentLabelIds = options.currentLabelIds;
			this.#mailboxId = options.mailboxId ?? null;
			this.#onChange = options.onChange ?? null;
			this.#onShow = options.onShow ?? null;
			this.#onClose = options.onClose ?? null;
		}
		static show(options) {
			return new this(options).#open();
		}
		#open() {
			return Promise.all([loadSharedLabels(this.#mailboxId), Promise.resolve(this.#currentLabelIds)]).then(([collection, currentLabelIds]) => {
				this.#labels = collection.getAll();
				this.#selectedLabelIds = new Set(currentLabelIds);
				this.#dialog = new ui_entitySelector.Dialog({
					id: `mail-label-selector-${++dialogCounter}`,
					targetNode: this.#bindElement,
					multiple: true,
					enableSearch: true,
					compactView: false,
					cacheable: false,
					autoHide: true,
					width: 350,
					tabs: [{
						id: LABEL_TAB_ID,
						title: main_core.Loc.getMessage('MAIL_LABEL_ASSIGN_MENU_TITLE') ?? ''
					}],
					recentTabOptions: {
						id: 'recents',
						visible: false,
						stub: false
					},
					items: buildSelectorItems(this.#labels, this.#selectedLabelIds),
					footer: this.#buildCreateFooter(),
					popupOptions: {
						focusTrap: true
					},
					events: {
						'Item:onSelect': event => this.#handleToggle(event, true),
						'Item:onDeselect': event => this.#handleToggle(event, false),
						onShow: () => this.#handleShow(),
						onHide: () => this.#handleHide()
					}
				});
				this.#dialog.show();
			}).catch(() => {
				this.#notifyError();
			});
		}
		#handleToggle(event, assigned) {
			const item = event.getData().item;
			const labelId = Number(item.getId());
			const title = this.#labels.find(label => label.id === labelId)?.name ?? '';
			this.#applyState(labelId, assigned);
			const pending = this.#toggleQueue.get(labelId) ?? Promise.resolve();
			const request = pending.then(() => assigned ? mail_label_core.apiClient.assign([labelId], this.#messageIds) : mail_label_core.apiClient.unassign([labelId], this.#messageIds)).then(() => {
				this.#announceToggle(title, assigned);
				this.#onChange?.({
					labelId,
					assigned
				});
			}).catch(() => {
				this.#applyState(labelId, !assigned);
				this.#revertItem(item, !assigned);
				this.#notifyError();
			}).finally(() => {
				if (this.#toggleQueue.get(labelId) === request) {
					this.#toggleQueue.delete(labelId);
				}
			});
			this.#toggleQueue.set(labelId, request);
		}
		#applyState(labelId, isSelected) {
			if (isSelected) {
				this.#selectedLabelIds.add(labelId);
			} else {
				this.#selectedLabelIds.delete(labelId);
			}
		}
		#revertItem(item, isSelected) {
			if (isSelected) {
				item.select({
					emitEvents: false
				});
			} else {
				item.deselect({
					emitEvents: false
				});
			}
		}
		#buildCreateFooter() {
			const footer = main_core.Tag.render`
			<a
				class="ui-selector-footer-link ui-selector-footer-link-add"
				role="button"
				tabindex="0"
				data-testid="mail-label-selector-create"
			>${main_core.Text.encode(main_core.Loc.getMessage('MAIL_LABEL_ASSIGN_MENU_CREATE') ?? '')}</a>
		`;
			main_core.Event.bind(footer, 'click', () => this.#openCreateSlider());
			main_core.Event.bind(footer, 'keydown', event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					this.#openCreateSlider();
				}
			});
			return footer;
		}
		#handleShow() {
			main_core.Event.bind(window, 'blur', this.#handleWindowBlur);
			this.#onShow?.();
		}
		#handleWindowBlur = () => {
			const active = document.activeElement;
			if (active && active.tagName === 'IFRAME') {
				this.#dialog?.hide();
			}
		};
		#handleHide() {
			main_core.Event.unbind(window, 'blur', this.#handleWindowBlur);
			this.#onClose?.();
			this.#dialog?.destroy();
			this.#dialog = null;
		}
		#announceToggle(title, assigned) {
			const phraseId = assigned ? 'MAIL_LABEL_ASSIGN_MENU_ANNOUNCE_ASSIGNED' : 'MAIL_LABEL_ASSIGN_MENU_ANNOUNCE_UNASSIGNED';
			ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage(phraseId, {
				'#TITLE#': title
			}) ?? '');
		}
		#openCreateSlider() {
			this.#dialog?.hide();
			if (!BX.SidePanel) {
				return;
			}
			BX.SidePanel.Instance.open(`${LABELS_SLIDER_URL}?form=y`, {
				width: 680,
				cacheable: false,
				events: {
					onClose: () => {
						invalidateSharedLabels();
					}
				}
			});
		}
		#notifyError() {
			const message = main_core.Loc.getMessage('MAIL_LABEL_ASSIGN_MENU_ERROR') ?? '';
			BX.UI.Notification.Center.notify({
				content: message,
				position: 'top-right',
				autoHideDelay: 3000
			});
			ui_a11y.LiveAnnouncer.announce(message, 'assertive');
		}
	}

	exports.AssignMenu = AssignMenu;
	exports.invalidateSharedLabels = invalidateSharedLabels;

})(this.BX.Mail.Label.AssignMenu = this.BX.Mail.Label.AssignMenu || {}, BX, BX.UI.EntitySelector, BX.UI.Accessibility, BX.UI.Notification, BX.Mail.Label.Core);
//# sourceMappingURL=assign-menu.bundle.js.map

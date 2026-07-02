/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ui_buttons, ui_entitySelector, ui_notification, main_core) {
	'use strict';

	class Binder {
		#parentEntityId;
		#parentEntityTypeId;
		#childEntityTypeId;
		#gridId;
		constructor(parentEntityTypeId, parentEntityId, childEntityTypeId, gridId) {
			// eslint-disable-next-line no-param-reassign
			parentEntityTypeId = main_core.Text.toInteger(parentEntityTypeId);
			if (parentEntityTypeId > 0) {
				this.#parentEntityTypeId = parentEntityTypeId;
			}

			// eslint-disable-next-line no-param-reassign
			parentEntityId = main_core.Text.toInteger(parentEntityId);
			if (parentEntityId > 0) {
				this.#parentEntityId = parentEntityId;
			}

			// eslint-disable-next-line no-param-reassign
			childEntityTypeId = main_core.Text.toInteger(childEntityTypeId);
			if (childEntityTypeId > 0) {
				this.#childEntityTypeId = childEntityTypeId;
			}
			this.#gridId = gridId;
		}
		getId() {
			return `relation-${this.#parentEntityTypeId}-${this.#parentEntityId}-${this.#childEntityTypeId}`;
		}
		getParentEntityId() {
			return this.#parentEntityId ?? null;
		}
		getParenEntityTypeId() {
			return this.#parentEntityTypeId ?? null;
		}
		getChildEntityTypeId() {
			return this.#childEntityTypeId ?? null;
		}
		async bind(selectedIds) {
			const data = {
				parentEntityTypeId: this.#parentEntityTypeId,
				parentEntityId: this.#parentEntityId,
				childEntityTypeId: this.#childEntityTypeId,
				selectedIds
			};

			// eslint-disable-next-line no-async-promise-executor
			return new Promise(async (resolve, reject) => {
				main_core.ajax.runAction('crm.controller.item.relation.update', {
					data
				}).then(response => {
					resolve(response);
					this.refreshLayout();
				}).catch(response => {
					if (response.errors) {
						response.errors.forEach(({
							message
						}) => {
							this.showError(message);
						});
					}
				});
			});
		}
		showError(message) {
			ui_notification.UI.Notification.Center.notify({
				content: message,
				autoHideDelay: 5000
			});
		}
		refreshLayout() {
			BX.Main.gridManager.getInstanceById(this.#gridId).reload();
		}
	}

	class EntitySelector {
		#dialogProp = null;
		#binder;
		#target;
		constructor(binder, target = null) {
			if (binder instanceof Binder) {
				this.#binder = binder;
			}
			if (main_core.Type.isDomNode(target) || main_core.Type.isNil(target)) {
				this.#target = target;
			}
			if (!this.#binder) {
				console.error('Invalid constructor params:', {
					binder: binder
				});
				throw new Error('Invalid constructor params');
			}
		}
		get #dialog() {
			if (this.#dialogProp) {
				return this.#dialogProp;
			}
			const applyButton = new ui_buttons.ApplyButton({
				color: ui_buttons.ButtonColor.SUCCESS,
				onclick: () => {
					void this.hide();
					this.#linking();
				}
			});
			const cancelButton = new ui_buttons.CancelButton({
				onclick: () => {
					void this.hide();
				}
			});
			const childEntityTypeName = BX.CrmEntityType.resolveName(this.#binder.getChildEntityTypeId());
			this.#dialogProp = new ui_entitySelector.Dialog({
				targetNode: this.#target,
				enableSearch: true,
				context: `crm.binder.entity-selector.for-${childEntityTypeName}`,
				entities: [{
					id: childEntityTypeName.startsWith(BX.CrmEntityType.dynamicTypeNamePrefix) ? 'DYNAMIC' : childEntityTypeName,
					dynamicLoad: true,
					dynamicSearch: true,
					options: {
						entityTypeId: this.#binder.getChildEntityTypeId(),
						sourceTypeId: this.#binder.getParenEntityTypeId(),
						notLinkedOnly: true,
						withoutRecentItems: true,
						withoutGlobalRecentItems: true
					}
				}],
				footer: [applyButton.render(), cancelButton.render()],
				footerOptions: {
					containerStyles: {
						display: 'flex',
						'justify-content': 'center'
					}
				},
				tagSelectorOptions: {
					textBoxWidth: 565 // same as default dialog width
				}
			});

			// this.#dialogProp.subscribe('Item:onSelect', this.#handleItemSelect.bind(this));

			return this.#dialogProp;
		}
		#linking() {
			const data = [];
			if (this.#dialog.getSelectedItems().length === 0) {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('ENTITY_BINDER_ITEMS_NOT_SELECTED'),
					autoHideDelay: 5000
				});
				return;
			}
			this.#dialog.getSelectedItems().forEach(item => {
				data.push(item.getId());
			});
			this.#binder.bind(data);
		}
		show() {
			return new Promise(resolve => {
				this.#dialog.subscribeOnce('onShow', resolve);
				this.#dialog.show();
			});
		}
		hide() {
			return new Promise(resolve => {
				this.#dialog.subscribeOnce('onHide', resolve);
				this.#dialog.hide();
			});
		}
		destroy() {
			return new Promise(resolve => {
				this.#dialog.destroy();
				resolve();
			});
		}
	}

	let instance = null;
	class Manager {
		#binders = {};
		static get Instance() {
			if (instance === null) {
				instance = new Manager();
			}
			return instance;
		}
		initializeBinder(parentEntityTypeId, parentEntityId, childEntityTypeId, gridId) {
			const binder = new Binder(parentEntityTypeId, parentEntityId, childEntityTypeId, gridId);
			this.#binders[binder.getId()] = binder;
			return binder;
		}
		getBinder(binderId) {
			return this.#binders[binderId];
		}
		createRelatedSelector(binderId, target = null) {
			const binder = this.getBinder(binderId);
			if (!binder) {
				console.error('Binder with given id not found', binderId, this);
				return null;
			}
			if (!binder.getParenEntityTypeId() || !binder.getParentEntityId() || !binder.getChildEntityTypeId()) {
				console.error('Not well configured binder', binderId, binder);
				return null;
			}
			return new EntitySelector(binder, document.getElementById(target));
		}
	}

	exports.Binder = Binder;
	exports.EntitySelector = EntitySelector;
	exports.Manager = Manager;

})(this.BX.Crm.Binder = this.BX.Crm.Binder || {}, BX.UI, BX.UI.EntitySelector, BX, BX);
//# sourceMappingURL=binder.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_popup, tasks_v2_core, tasks_v2_const, tasks_v2_lib_entitySelectorDialog) {
	'use strict';

	let dialog = null;
	const usersDialog = new class {
		#ids;
		#selectableIds;
		#onSelect;
		#onDeselect;
		#onClose;
		#isMultiple = true;
		#withAngle;
		#enableSearch;
		#hidePromise;
		async show(params) {
			if (dialog?.isOpen() && dialog.getTargetNode() !== params.targetNode) {
				this.#hidePromise = new Resolvable();
				await this.#hidePromise;
			}
			if (this.#shouldRecreateDialog(params)) {
				dialog.destroy();
				dialog = null;
			}
			this.#ids = params.ids;
			this.#selectableIds = params.selectableIds;
			this.#onClose = params.onClose;
			this.#onSelect = params.onSelect;
			this.#onDeselect = params.onDeselect;
			this.#withAngle = params.withAngle ?? true;
			this.#isMultiple = params.isMultiple ?? true;
			this.#enableSearch = params.enableSearch ?? true;
			dialog ??= this.#createDialog();
			this.#fillDialog(this.#ids);
			dialog.selectItemsByIds(this.#items);
			this.#setSelectableByIds();
			dialog.showTo(params.targetNode);
		}
		getDialog() {
			return dialog;
		}
		#shouldRecreateDialog(params) {
			if (dialog === null) {
				return false;
			}
			return this.#isMultiple !== (params.isMultiple ?? true) || this.#enableSearch !== (params.enableSearch ?? true) || this.#withAngle !== (params.withAngle ?? true);
		}
		#createDialog() {
			const restrictions = tasks_v2_core.Core.getParams().restrictions;
			return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
				context: 'tasks-card',
				enableSearch: this.#enableSearch,
				entities: [{
					id: tasks_v2_const.EntitySelectorEntity.User,
					options: {
						emailUsers: true,
						inviteGuestLink: true,
						analyticsSource: 'tasks',
						lockGuestLink: !restrictions.mailUserIntegration.available,
						lockGuestLinkFeatureId: restrictions.mailUserIntegration.featureId
					}
				}, {
					id: tasks_v2_const.EntitySelectorEntity.Department
				}],
				preselectedItems: this.#items,
				events: {
					'Item:onSelect': event => {
						const {
							item
						} = event.getData();
						if (this.#onSelect) {
							this.#onSelect(item.getId());
						}
						if (this.#isMultiple) {
							return;
						}
						dialog.selectItemsByIds(this.#mapIdsToItemIds([item.getId()]));
						dialog.hide();
					},
					'Item:onDeselect': event => {
						if (this.#onDeselect) {
							const {
								item
							} = event.getData();
							this.#onDeselect(item.getId());
						}
					},
					onLoad: () => {
						this.#fillStore();
						this.#setSelectableByIds();
					},
					onHide: () => this.#hidePromise?.resolve()
				},
				popupOptions: {
					events: {
						onShow: baseEvent => {
							const popup = baseEvent.getTarget();
							if (!this.#withAngle) {
								popup.setAngle(false);
								popup.setOffset({
									offsetLeft: 0
								});
								return;
							}
							const popupWidth = popup.getPopupContainer().offsetWidth;
							const targetNodeWidth = 10;
							const offsetLeft = targetNodeWidth - popupWidth / 2;
							const angleShift = main_popup.Popup.getOption('angleLeftOffset') - main_popup.Popup.getOption('angleMinTop');
							popup.setAngle({
								offset: popupWidth / 2 - angleShift
							});
							popup.setOffset({
								offsetLeft: offsetLeft + main_popup.Popup.getOption('angleLeftOffset')
							});
						},
						onClose: () => {
							this.#fillStore();
							const items = dialog.getSelectedItems();
							const ids = items.map(item => item.getId());
							this.#onClose?.(ids, items);
						}
					}
				}
			});
		}
		#fillDialog(ids) {
			if (!dialog || !dialog.isLoaded()) {
				return;
			}
			const itemIds = new Set(dialog.getItems().map(it => it.getId()));
			ids.filter(id => !itemIds.has(id)).forEach(id => {
				const user = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Users}/getById`](id);
				dialog.addItem({
					id,
					entityId: tasks_v2_const.EntitySelectorEntity.User,
					entityType: user.type,
					title: user.name,
					avatar: user.image,
					tabs: ['recents']
				});
			});
		}
		#fillStore() {
			const users = dialog.getSelectedItems().map(item => ({
				id: item.getId(),
				name: item.getTitle(),
				image: item.getAvatar(),
				type: item.getEntityType()
			}));
			void tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, users);
		}
		#setSelectableByIds() {
			const selectableIds = dialog.getItems().map(item => item.getId());
			const unselectableIds = this.#ids.filter(id => this.#selectableIds && !this.#selectableIds?.has(id));
			dialog.setSelectableByIds({
				selectable: this.#mapIdsToItemIds(selectableIds),
				unselectable: this.#mapIdsToItemIds(unselectableIds)
			});
		}
		get #items() {
			return this.#mapIdsToItemIds(this.#ids);
		}
		#mapIdsToItemIds(ids) {
			return ids.map(id => [tasks_v2_const.EntitySelectorEntity.User, id]);
		}
	}();
	function Resolvable() {
		let resolve = null;
		const promise = new Promise(res => {
			resolve = res;
		});
		promise.resolve = resolve;
		return promise;
	}

	exports.usersDialog = usersDialog;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX.Main, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib);
//# sourceMappingURL=user-selector-dialog.bundle.js.map

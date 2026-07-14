/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, ui_entitySelector, socialnetwork_v2_const) {
	'use strict';

	class UsersSelector {
		constructor(options) {
			this.options = options;
			this.selector = this.createSelector();
			this.container = null;
		}
		createSelector() {
			const dialogOptions = {
				context: this.options.context,
				width: 390,
				height: 340,
				compactView: true,
				enableSearch: true,
				cacheable: true,
				showAvatars: true,
				popupOptions: {
					targetContainer: this.options.targetContainer
				},
				entities: this.#getEntities(),
				preselectedItems: this.getPreselectedItems(),
				events: {
					'Item:onSelect': event => {
						const item = event.getData().item;
						this.options.onSelect?.(item.getId(), item);
					},
					'Item:onDeselect': event => {
						const item = event.getData().item;
						this.options.onDeselect?.(item.getId(), item);
					}
				}
			};
			const tagSelectionOptions = {
				showAddButton: true,
				multiple: this.options.multiple,
				textBoxWidth: 'auto',
				showCreateButton: false,
				dialogOptions
			};
			return new ui_entitySelector.TagSelector(tagSelectionOptions);
		}
		#getEntities() {
			const entities = [{
				id: socialnetwork_v2_const.EntitySelectorEntity.User,
				dynamicLoad: true,
				dynamicSearch: true
			}];
			const optionsEntities = this.options.entities || [];
			if (optionsEntities.includes(socialnetwork_v2_const.EntitySelectorEntity.Department)) {
				entities.push({
					id: socialnetwork_v2_const.EntitySelectorEntity.Department,
					options: {
						selectMode: 'usersAndDepartments',
						allowFlatDepartments: true,
						allowSelectRootDepartment: true
					}
				});
			}
			if (optionsEntities.includes(socialnetwork_v2_const.EntitySelectorEntity.Group)) {
				entities.push({
					id: socialnetwork_v2_const.EntitySelectorEntity.Project,
					itemOptions: {
						default: {
							entityType: socialnetwork_v2_const.EntitySelectorEntity.Group,
							link: '',
							linkTitle: ''
						}
					}
				});
			}
			return entities;
		}
		getPreselectedItems() {
			if (this.options.preselectedItems?.length > 0) {
				return this.options.preselectedItems;
			}
			return this.normalizePreselectedIds().map(id => [socialnetwork_v2_const.EntitySelectorEntity.User, id]);
		}
		normalizePreselectedIds() {
			const {
				preselectedIds
			} = this.options;
			if (Array.isArray(preselectedIds)) {
				return preselectedIds;
			}
			return [preselectedIds];
		}
		renderTo(container) {
			this.container = container;
			this.selector.renderTo(container);
		}
		destroy() {
			this.selector.getDialog()?.destroy();
			this.selector = null;
			if (this.container) {
				this.container.innerHTML = '';
			}
			this.container = null;
		}
	}

	exports.UsersSelector = UsersSelector;

})(this.BX.Socialnetwork.V2.Components.Selectors = this.BX.Socialnetwork.V2.Components.Selectors || {}, BX.UI.EntitySelector, BX.Socialnetwork.V2);
//# sourceMappingURL=users-selector.bundle.js.map

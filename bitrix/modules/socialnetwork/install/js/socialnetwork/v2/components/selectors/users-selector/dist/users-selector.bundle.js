/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, main_core, ui_entitySelector, socialnetwork_v2_const) {
	'use strict';

	// humanresources StructureAction the org structure provider checks before it offers a node
	const STRUCTURE_VIEW_ACTION = 'view';
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
				entities: UsersSelector.getEntities(this.options),
				preselectedItems: this.getPreselectedItems(),
				selectedItems: this.options.selectedItems,
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
			const selector = new ui_entitySelector.TagSelector(tagSelectionOptions);
			if (main_core.Type.isStringFilled(this.options.controlId)) {
				selector.getAddButtonLink().id = this.options.controlId;
			}
			if (main_core.Type.isStringFilled(this.options.ariaLabelledBy)) {
				const addButtonLabelledBy = main_core.Type.isStringFilled(this.options.controlId) ? `${this.options.controlId} ${this.options.ariaLabelledBy}` : this.options.ariaLabelledBy;
				main_core.Dom.attr(selector.getAddButtonLink(), 'aria-labelledby', addButtonLabelledBy);
				main_core.Dom.attr(selector.getTextBox(), 'aria-labelledby', this.options.ariaLabelledBy);
			}
			return selector;
		}
		static getEntities(options) {
			const entities = [{
				id: socialnetwork_v2_const.EntitySelectorEntity.User,
				dynamicLoad: true,
				dynamicSearch: true,
				...(options.intranetUsersOnly === true ? {
					options: {
						intranetUsersOnly: true
					}
				} : {})
			}];
			const requestedEntities = options.entities || [];
			if (requestedEntities.includes(socialnetwork_v2_const.EntitySelectorEntity.Department)) {
				entities.push({
					id: socialnetwork_v2_const.EntitySelectorEntity.Department,
					options: {
						selectMode: 'usersAndDepartments',
						allowFlatDepartments: true,
						allowSelectRootDepartment: true
					}
				});
			}
			if (requestedEntities.includes(socialnetwork_v2_const.EntitySelectorEntity.StructureNode) && options.isTeamsAvailable === true) {
				entities.push({
					id: socialnetwork_v2_const.EntitySelectorEntity.StructureNode,
					options: {
						includedNodeEntityTypes: [socialnetwork_v2_const.StructureNodeEntityType.Team],
						// without it the provider builds the tree with no access filter at all
						restricted: STRUCTURE_VIEW_ACTION,
						// own tabs keep teams and departments in separate trees
						useMultipleTabs: true,
						selectMode: 'usersAndDepartments',
						allowFlatDepartments: true,
						visual: {
							avatarMode: 'node',
							tagStyle: 'none'
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
			if (main_core.Type.isNil(preselectedIds)) {
				return [];
			}
			return [preselectedIds];
		}
		renderTo(container) {
			this.container = container;
			this.selector.renderTo(container);
			this.bindFieldLabel();
		}

		// the tag selector names its input after its own search placeholder, so an outer field label has to take over
		bindFieldLabel() {
			const textBox = this.selector.getTextBox();
			if (main_core.Type.isStringFilled(this.options.inputId)) {
				main_core.Dom.attr(textBox, 'id', this.options.inputId);
			}
			if (main_core.Type.isStringFilled(this.options.inputLabel)) {
				main_core.Dom.attr(textBox, 'aria-label', this.options.inputLabel);
			}
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

})(this.BX.Socialnetwork.V2.Components.Selectors = this.BX.Socialnetwork.V2.Components.Selectors || {}, BX, BX.UI.EntitySelector, BX.Socialnetwork.V2);
//# sourceMappingURL=users-selector.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_entitySelector, main_core_events) {
	'use strict';

	class EntityType {
		static DEPARTMENT = 'department';
		static GROUP = 'group';
		static EXTRANET = 'extranet';
		static COLLAB = 'collab';
	}

	class DepartmentControl extends main_core_events.EventEmitter {
		#tagSelector;
		#rootDepartment;
		#departmentList;
		#title;
		#description;
		#entitiesType;
		#groupOptions;
		#preselectedItems;
		#addButtonCaption;
		#dialogOptions;
		#id;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Intranet.DepartmentControl');
			this.#rootDepartment = main_core.Type.isNil(options?.rootDepartment) ? null : options?.rootDepartment;
			this.#departmentList = main_core.Type.isArray(options?.departmentList) ? options?.departmentList : [];
			this.#title = options.title ?? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_LABEL');
			this.#description = options.description ?? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION');
			this.#entitiesType = main_core.Type.isArray(options.entitiesType) ? options.entitiesType : [EntityType.DEPARTMENT];
			this.#groupOptions = main_core.Type.isObject(options.groupOptions) ? options.groupOptions : {};
			this.#preselectedItems = main_core.Type.isArray(options.preselectedItems) ? options.preselectedItems : [];
			this.#addButtonCaption = main_core.Type.isStringFilled(options.addButtonCaption) ? options.addButtonCaption : null;
			this.#dialogOptions = main_core.Type.isObject(options.dialogOptions) ? options.dialogOptions : {};
			this.#tagSelector = this.#initTagSelector(options);
			this.#id = main_core.Type.isStringFilled(options.id) ? options.id : BX.Text.getRandom(5);
		}
		#initTagSelector(options) {
			return new ui_entitySelector.TagSelector({
				tagTextColor: '#1E8D36',
				tagBgColor: '#D4FDB0',
				items: this.getDefaultItems(),
				addButtonCaptionMore: this.#addButtonCaption,
				events: {
					onBeforeTagRemove: event => {
						const selector = event.getTarget();
						const {
							tag
						} = event.getData();
						if (selector.getTags().length === 1 && this.#isRootItem(tag)) {
							event.preventDefault();
						}
					},
					onAfterTagAdd: this.onAfterTagChange.bind(this),
					onAfterTagRemove: this.onAfterTagChange.bind(this)
				},
				dialogOptions: {
					...this.#dialogOptions,
					preselectedItems: this.#preselectedItems,
					context: 'INVITATION_STRUCTURE',
					width: 350,
					enableSearch: true,
					multiple: true,
					entities: this.#getDialogOptionsEntities(),
					events: {
						'Item:onBeforeDeselect': event => {
							const dialog = event.getTarget();
							const selectedItems = dialog.getSelectedItems();
							if (selectedItems.length === 1 && this.#isRootItem(selectedItems[0])) {
								event.preventDefault();
							}
						},
						'Item:onDeselect': event => {
							const dialog = event.getTarget();
							const selectedItems = dialog.getSelectedItems();
							if (selectedItems.length <= 0) {
								const item = dialog.getItem(['structure-node', options?.rootDepartment?.id]);
								item?.select();
							}
						},
						onLoad: event => {
							const dialog = event.getTarget();
							dialog.selectTab('structure-departments-tab');
						}
					}
				}
			});
		}
		#getDialogOptionsEntities() {
			const result = [];
			if (this.#entitiesType.includes(EntityType.DEPARTMENT)) {
				result.push({
					id: 'structure-node',
					options: {
						selectMode: 'departmentsOnly',
						restricted: 'inviteUser'
					}
				});
			}
			const withGroups = this.#entitiesType.includes(EntityType.GROUP);
			const withExtranetGroups = this.#entitiesType.includes(EntityType.EXTRANET);
			const withCollabs = this.#entitiesType.includes(EntityType.COLLAB);
			if (withGroups || withExtranetGroups || withCollabs) {
				const options = this.#groupOptions;
				if (withExtranetGroups && !withGroups) {
					options.extranet = true;
				} else if (!withExtranetGroups && withGroups) {
					options.extranet = false;
				}
				if (!withCollabs) {
					options['!type'] = ['collab'];
				}
				result.push({
					id: 'project',
					options
				});
			}
			return result;
		}
		getDefaultItems() {
			let items = [];
			if (main_core.Type.isArray(this.#departmentList) && this.#departmentList.length > 0) {
				items = this.#departmentList.map(department => {
					return {
						id: parseInt(department.id, 10),
						avatar: '/bitrix/js/humanresources/entity-selector/src/images/company.svg',
						entityId: 'structure-node',
						textColor: '#006E7C',
						bgColor: '#DDF6F9',
						title: department.name,
						customData: {
							accessCode: department.accessCode
						}
					};
				});
			} else if (!main_core.Type.isNil(this.#rootDepartment)) {
				const rootDep = {
					id: parseInt(this.#rootDepartment.id, 10),
					avatar: '/bitrix/js/humanresources/entity-selector/src/images/company.svg',
					entityId: 'structure-node',
					textColor: '#006E7C',
					bgColor: '#DDF6F9',
					title: this.#rootDepartment.name,
					customData: {
						accessCode: this.#rootDepartment.accessCode
					}
				};
				items.push(rootDep);
			}
			return items;
		}
		reset() {
			this.#tagSelector.removeTags();
			this.getDefaultItems().forEach(item => {
				this.#tagSelector.addTag(item);
			});
		}
		#isRootItem(item) {
			const itemId = main_core.Type.isNil(item?.id) ? null : parseInt(item?.id, 10);
			const rootId = main_core.Type.isNil(this.#rootDepartment?.id) ? null : parseInt(this.#rootDepartment?.id, 10);
			return !main_core.Type.isNil(itemId) && !main_core.Type.isNil(rootId) && itemId === rootId;
		}
		renderTo(container) {
			main_core.Dom.append(this.render(), container);
		}
		getValues() {
			const tagSelectorItems = this.#tagSelector.getDialog().getSelectedItems();
			const collection = [];
			tagSelectorItems.filter(item => item?.entityId === 'structure-node').forEach(item => {
				const departmentId = parseInt(item?.id, 10);
				if (departmentId > 0) {
					collection.push(departmentId);
				}
			});
			return collection;
		}
		getGroupValues() {
			const tagSelectorItems = this.#tagSelector.getDialog().getSelectedItems();
			const collection = [];
			tagSelectorItems.filter(item => item?.entityId === 'project').forEach(item => {
				const groupId = parseInt(item?.id, 10);
				if (groupId > 0) {
					collection.push(groupId);
				}
			});
			return collection;
		}
		getAllValues() {
			const tagSelectorItems = this.#tagSelector.getDialog().getSelectedItems();
			const entitiesMap = Object.fromEntries(Object.getOwnPropertyNames(EntityType).map(key => EntityType[key]).map(value => [value, []]));
			tagSelectorItems.forEach(item => {
				const itemId = parseInt(item?.id, 10);
				const itemType = this.#getEntityType(item);
				if (itemId > 0 && itemType) {
					entitiesMap[itemType].push(itemId);
				}
			});
			return entitiesMap;
		}
		#getEntityType(entity) {
			if (entity.entityId === 'structure-node') {
				return EntityType.DEPARTMENT;
			}
			if (entity.entityId === 'project') {
				switch (entity.entityType ?? '') {
					case 'collab':
						return EntityType.COLLAB;
					case 'extranet':
						return EntityType.EXTRANET;
					case 'group':
					case 'project':
						return EntityType.GROUP;
					default:
						return null;
				}
			}
			return null;
		}
		render() {
			const title = main_core.Tag.render`<label class="department-control__dialog-title">${this.#title}</label>`;
			const description = main_core.Tag.render`<div class="department-control__dialog-description">${this.#description}</div>`;
			const fieldContainer = main_core.Tag.render`<div></div>`;
			this.#tagSelector.renderTo(fieldContainer);
			return main_core.Tag.render`<div data-test-id="${this.#id}">${title}${description}${fieldContainer}</div>`;
		}
		onAfterTagChange(event) {
			const selector = event.getTarget();
			this.emit('onChange', {
				tags: selector.getTags()
			});
		}
	}

	exports.DepartmentControl = DepartmentControl;
	exports.EntityType = EntityType;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.UI.EntitySelector, BX.Event);
//# sourceMappingURL=department-control.bundle.js.map

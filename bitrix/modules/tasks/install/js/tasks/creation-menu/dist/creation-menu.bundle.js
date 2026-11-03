/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup) {
	'use strict';

	class Delimiter {
		static create() {
			return {
				tabId: CreationMenu.MENU_ID,
				delimiter: true
			};
		}
	}

	class Task {
		static create(link = '') {
			return {
				tabId: CreationMenu.MENU_ID,
				text: main_core.Loc.getMessage('TASKS_CREATION_MENU_CREATE_TASK'),
				href: link,
				onclick: (event, menuItem) => {
					menuItem.getMenuWindow().close();
				}
			};
		}
	}

	class Loading {
		static ID = 'loading';
		static create() {
			return {
				id: Loading.ID,
				text: main_core.Loc.getMessage('TASKS_CREATION_MENU_LOAD_TEMPLATE_LIST')
			};
		}
	}

	class TaskByTemplate {
		static create(link = '') {
			return {
				tabId: CreationMenu.MENU_ID,
				text: main_core.Loc.getMessage('TASKS_CREATION_MENU_CREATE_TASK_BY_TEMPLATE'),
				cacheable: true,
				items: [Loading.create()],
				events: {
					onSubMenuShow: event => {
						const item = new TaskByTemplate();
						item.getTemplates().then(response => {
							if (this.isTemplateListLoaded) {
								return;
							}
							this.isTemplateListLoaded = true;
							item.addSubItems(event.getTarget(), response, link);
						}, () => {
							this.isTemplateListLoaded = true;
							item.addError(event.getTarget());
						});
					}
				}
			};
		}
		getTemplates() {
			return main_core.ajax.runComponentAction('bitrix:tasks.templates.list', 'getList', {
				mode: 'class',
				data: {
					select: ['ID', 'TITLE'],
					order: {
						ID: 'DESC'
					},
					filter: {
						ZOMBIE: 'N'
					}
				}
			});
		}
		addSubItems(menuItem, response, link) {
			if (response.data.length > 0) {
				response.data.forEach(item => {
					menuItem.getSubMenu().addMenuItem({
						text: BX.util.htmlspecialchars(item.TITLE),
						href: link + '&TEMPLATE=' + item.ID,
						onclick: function () {
							menuItem.getMenuWindow().close();
						}
					});
				});
			} else {
				menuItem.getSubMenu().addMenuItem({
					text: main_core.Loc.getMessage('TASKS_CREATION_MENU_EMPTY_TEMPLATE_LIST')
				});
			}
			this.removeLoading(menuItem);
		}
		addError(menuItem) {
			menuItem.getSubMenu().addMenuItem({
				text: main_core.Loc.getMessage('TASKS_CREATION_MENU_ERROR_LOAD_TEMPLATE_LIST')
			});
			this.removeLoading(menuItem);
		}
		removeLoading(menuItem) {
			menuItem.getSubMenu().removeMenuItem(Loading.ID);
		}
	}

	class TemplateList {
		static create(link = '') {
			return {
				tabId: CreationMenu.MENU_ID,
				text: main_core.Loc.getMessage('TASKS_CREATION_MENU_TEMPLATE_LIST'),
				href: link,
				target: '_top'
			};
		}
	}

	class CreationMenu {
		static MENU_ID = 'tasks-creation-menu';
		static toggle(options) {
			const creationMenu = main_popup.MenuManager.getMenuById(CreationMenu.MENU_ID);
			if (creationMenu) {
				creationMenu.toggle();
			} else {
				new this(options).createMenu().toggle();
			}
		}
		constructor(options) {
			this.bindElement = options.bindElement;
			this.createTaskLink = options.createTaskLink;
			this.templatesListLink = options.templatesListLink;
		}
		createMenu() {
			this.menu = main_popup.MenuManager.create({
				id: CreationMenu.MENU_ID,
				bindElement: this.bindElement,
				closeByEsc: true,
				items: this.getCreationItems()
			});
			return this.menu;
		}
		getCreationItems() {
			const createLink = main_core.Uri.addParam(this.createTaskLink, {
				ta_sec: 'space',
				ta_el: 'create_button'
			});
			return [Task.create(createLink), TaskByTemplate.create(createLink), Delimiter.create(), TemplateList.create(this.templatesListLink)];
		}
	}

	exports.CreationMenu = CreationMenu;

})(this.BX.Tasks = this.BX.Tasks || {}, BX, BX.Main);
//# sourceMappingURL=creation-menu.bundle.js.map

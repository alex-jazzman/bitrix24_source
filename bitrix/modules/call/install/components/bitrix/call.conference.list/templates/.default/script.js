/* eslint-disable */
(function (main_core, main_core_events, main_popup, ui_dialogs_messagebox, im_lib_clipboard) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Messenger.PhpComponent');
	const Utils = main_core.Reflection.getClass('BX.Messenger.v2.Lib.Utils');
	class ConferenceList {
		constructor(params) {
			this.pathToAdd = params.pathToAdd;
			this.pathToEdit = params.pathToEdit;
			this.pathToList = params.pathToList;
			this.sliderWidth = params.sliderWidth || 800;
			this.gridId = params.gridId;
			this.gridManager = main_core.Reflection.getClass('top.BX.Main.gridManager');
			this.init();
		}
		init() {
			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('Grid::updated', () => {
				this.bindGridEvents();
			});
			this.bindCreateButtonEvents();
			this.bindGridEvents();
		}
		bindCreateButtonEvents() {
			const emptyListCreateButton = document.querySelector('.im-conference-list-empty-button');
			if (emptyListCreateButton) {
				main_core.Event.bind(emptyListCreateButton, 'click', () => {
					this.openCreateSlider();
				});
			}
			const panelCreateButton = document.querySelector('.im-conference-list-panel-button-create');
			main_core.Event.bind(panelCreateButton, 'click', () => {
				this.openCreateSlider();
			});
		}
		bindGridEvents() {
			//grid rows
			this.rows = document.querySelectorAll('.main-grid-row');
			this.rows.forEach(row => {
				const conferenceId = row.getAttribute('data-conference-id');
				const chatId = row.getAttribute('data-chat-id');
				const publicLink = row.getAttribute('data-public-link');
				!!row.getAttribute('data-conference-finished');

				//start button
				const startButton = row.querySelector('.im-conference-list-controls-button-start');
				main_core.Event.bind(startButton, 'click', async event => {
					event.preventDefault();
					const code = Utils.conference.getCodeByOptions({
						link: startButton.dataset.conferenceLink
					});
					window.BX.Messenger.Public.openConference({
						code
					});
				});

				//more button
				const moreButton = row.querySelector('.im-conference-list-controls-button-more');
				main_core.Event.bind(moreButton, 'click', event => {
					event.preventDefault();
					this.openContextMenu({
						buttonNode: moreButton,
						conferenceId,
						chatId
					});
				});

				//copy link button
				const copyButton = row.querySelector('.im-conference-list-controls-button-copy');
				main_core.Event.bind(copyButton, 'click', event => {
					event.preventDefault();
					this.copyLink(publicLink);
				});

				//chat name link
				const chatNameLink = row.querySelector('.im-conference-list-chat-name-link');
				main_core.Event.bind(chatNameLink, 'click', event => {
					event.preventDefault();
					this.openEditSlider(conferenceId);
				});
			});
		}
		openCreateSlider() {
			this.openSlider(this.pathToAdd);
		}
		openEditSlider(conferenceId) {
			const pathToEdit = this.pathToEdit.replace('#id#', conferenceId);
			this.openSlider(pathToEdit);
		}
		openSlider(path) {
			this.closeContextMenu();
			if (main_core.Reflection.getClass('BX.SidePanel')) {
				BX.SidePanel.Instance.open(path, {
					width: this.sliderWidth,
					cacheable: false
				});
			}
		}
		copyLink(link) {
			im_lib_clipboard.Clipboard.copy(link);
			if (main_core.Reflection.getClass('BX.UI.Notification.Center')) {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CONFERENCE_LIST_NOTIFICATION_LINK_COPIED')
				});
			}
		}
		openContextMenu({
			buttonNode,
			conferenceId,
			chatId
		}) {
			main_core.ajax.runComponentAction('bitrix:call.conference.list', "getAllowedOperations", {
				mode: 'ajax',
				data: {
					conferenceId
				}
			}).then(({
				data: {
					delete: canDelete,
					edit: canEdit
				}
			}) => {
				if (main_core.Type.isDomNode(buttonNode)) {
					const menuItems = [{
						text: main_core.Loc.getMessage('CONFERENCE_LIST_CONTEXT_MENU_CHAT'),
						onclick: () => {
							this.openChat(chatId);
						}
					}];
					if (canEdit) {
						menuItems.push({
							text: main_core.Loc.getMessage('CONFERENCE_LIST_CONTEXT_MENU_EDIT'),
							onclick: () => {
								this.openEditSlider(conferenceId);
							}
						});
					}
					if (canDelete) {
						menuItems.push({
							text: main_core.Loc.getMessage('CONFERENCE_LIST_CONTEXT_MENU_DELETE'),
							className: 'im-conference-list-context-menu-item-delete menu-popup-no-icon',
							onclick: () => {
								this.deleteAction(conferenceId);
							}
						});
					}
					this.menu = new main_popup.Menu({
						bindElement: buttonNode,
						items: menuItems,
						events: {
							onPopupClose: function () {
								this.destroy();
							}
						}
					});
					this.menu.show();
				}
			}).catch(response => {
				console.error(response);
			});
		}
		closeContextMenu() {
			if (this.menu) {
				this.menu.close();
			}
		}
		openChat(chatId) {
			this.closeContextMenu();
			if (main_core.Reflection.getClass('BXIM.openMessenger')) {
				BXIM.openMessenger('chat' + chatId);
			}
		}
		deleteAction(conferenceId) {
			this.closeContextMenu();
			main_core.ajax.runComponentAction('bitrix:call.conference.list', "deleteConference", {
				mode: 'ajax',
				data: {
					conferenceId
				}
			}).then(response => {
				this.onSuccessfulDelete(response);
			}).catch(response => {
				this.onFailedDelete(response);
			});
		}
		onSuccessfulDelete(response) {
			if (response.data['LAST_ROW'] === true) {
				top.window.location = this.pathToList;
				return true;
			}
			if (this.gridManager) {
				this.gridManager.reload(this.gridId);
			}
		}
		onFailedDelete(response) {
			ui_dialogs_messagebox.MessageBox.alert(response["errors"][0].message);
		}
	}
	namespace.ConferenceList = ConferenceList;

})(BX, BX.Event, BX.Main, BX.UI.Dialogs, BX.Messenger.Lib);
//# sourceMappingURL=script.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, main_core, main_core_events, main_popup, ui_buttons, ui_notification, ui_dialogs_messagebox, main_loader) {
	'use strict';

	class CreateFolderPopup extends main_core_events.EventEmitter {
		#initialTitle;
		#placeholder;
		#createButtonText;
		#saveButtonText;
		#cancelButtonText;
		#emptyTitleNotification;
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Sign.V2.Grid.Components.Folder.CreateFolderPopup');
			this.#initialTitle = options.initialTitle ?? null;
			this.#placeholder = options.placeholder ?? main_core.Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_INPUT_PLACEHOLDER') ?? '';
			this.#createButtonText = options.createButtonText ?? main_core.Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_CREATE_BUTTON') ?? '';
			this.#saveButtonText = options.saveButtonText ?? main_core.Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_SAVE_BUTTON') ?? '';
			this.#cancelButtonText = options.cancelButtonText ?? main_core.Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_CANCEL_BUTTON') ?? '';
			this.#emptyTitleNotification = options.emptyTitleNotification ?? main_core.Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_TITLE_NOT_EMPTY') ?? '';
		}
		show() {
			const uniqueId = `folderNameInput_${Date.now()}`;
			const initialTitle = this.#initialTitle;
			let popup = null;
			const handleSubmit = () => {
				const input = document.getElementById(uniqueId);
				if (!(input instanceof HTMLInputElement)) {
					return;
				}
				const title = input.value.trim();
				if (title !== '') {
					this.emit('submit', {
						title
					});
					popup?.close();
					return;
				}
				ui_notification.Center.notify({
					content: this.#emptyTitleNotification
				});
			};
			popup = new main_popup.Popup({
				id: `folderNamePopup_${uniqueId}`,
				cacheable: false,
				className: 'sign-folder-popup',
				content: `
				<div class="sign-folder-popup__content">
					<span class="sign-folder-popup__icon"></span>
					<div class="sign-folder-popup__input-container">
						<input
							type="text"
							id="${uniqueId}"
							class="ui-ctl-element"
							placeholder="${main_core.Text.encode(this.#placeholder)}"
							value="${initialTitle === null ? '' : main_core.Text.encode(initialTitle)}"
						>
					</div>
				</div>
			`,
				buttons: [new ui_buttons.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED,
					size: ui_buttons.ButtonSize.LARGE,
					collapsedIcon: ui_buttons.ButtonIcon.ADD_FOLDER,
					text: initialTitle === null ? this.#createButtonText : this.#saveButtonText,
					onclick: () => {
						handleSubmit();
						return true;
					}
				}), new ui_buttons.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.PLAIN,
					size: ui_buttons.ButtonSize.LARGE,
					collapsedIcon: ui_buttons.ButtonIcon.CANCEL,
					text: this.#cancelButtonText,
					onclick: () => {
						popup?.close();
						return true;
					}
				})],
				draggable: true,
				overlay: true,
				width: 500,
				height: 420,
				events: {
					onPopupShow: () => {
						if (popup === null) {
							return;
						}
						main_core.Dom.style(popup.getPopupContainer(), 'backgroundColor', 'rgba(255, 255, 255)');
						const input = document.getElementById(uniqueId);
						if (!(input instanceof HTMLInputElement)) {
							return;
						}
						input.focus();
						input.setSelectionRange(input.value.length, input.value.length);
						main_core.Event.bind(input, 'keydown', event => {
							if (event.key === 'Enter') {
								event.preventDefault();
								handleSubmit();
							}
						});
					}
				}
			});
			popup.show();
		}
	}

	class DeleteConfirmationPopup {
		#options;
		constructor(options) {
			this.#options = options;
		}
		show() {
			ui_dialogs_messagebox.MessageBox.show({
				title: this.#options.title,
				message: this.#renderMessage(),
				modal: true,
				buttons: [new ui_buttons.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED_ALERT,
					size: ui_buttons.ButtonSize.LARGE,
					collapsedIcon: ui_buttons.ButtonIcon.REMOVE,
					text: this.#options.confirmButtonText,
					dataset: {
						testid: 'sign-folder-delete-confirmation-confirm-button'
					},
					onclick: async baseButton => {
						const button = baseButton;
						button.setWaiting(true);
						try {
							await this.#options.onConfirm();
							button.getContext().close();
						} catch {
							button.setWaiting(false);
						}
					}
				}), new ui_buttons.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.PLAIN,
					size: ui_buttons.ButtonSize.LARGE,
					collapsedIcon: ui_buttons.ButtonIcon.CANCEL,
					text: this.#options.cancelButtonText,
					dataset: {
						testid: 'sign-folder-delete-confirmation-cancel-button'
					},
					onclick: baseButton => {
						baseButton.getContext().close();
						return true;
					}
				})]
			});
		}
		#renderMessage() {
			return main_core.Tag.render`
			<div
				class="sign-folder-delete-confirmation__message"
				data-test-id="sign-folder-delete-confirmation"
			>
				<span>${main_core.Text.encode(this.#options.message)}</span>
			</div>
		`;
		}
	}

	const LOAD_LIMIT = 50;
	class FolderSelectionPopup extends main_core_events.EventEmitter {
		#loadFolders;
		#rootItemTitle;
		#offset = 0;
		#total = 0;
		#hasMore = true;
		#loading = false;
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Sign.V2.Grid.Components.Folder.FolderSelectionPopup');
			this.#loadFolders = options.loadFolders ?? (() => Promise.resolve([]));
			this.#rootItemTitle = options.rootItemTitle ?? main_core.Loc.getMessage('SIGN_V2_GRID_COMPONENTS_FOLDER_SELECTION_ROOT_ITEM') ?? '';
		}
		show() {
			this.#offset = 0;
			this.#total = 0;
			this.#hasMore = true;
			this.#loading = false;
			const folderList = this.#createFolderListContainer();
			const rootFolderData = {
				title: this.#rootItemTitle,
				id: 0
			};
			const rootFolder = this.#createFolderItem(rootFolderData);
			main_core.Dom.addClass(rootFolder, 'sign-folder-selection__item--selected');
			main_core.Dom.append(rootFolder, folderList);
			this.#emitFolderSelected(rootFolderData);
			const subFolderContainer = this.#createSubFolderContainer();
			main_core.Dom.append(subFolderContainer, folderList);
			main_core.Event.bind(folderList, 'scroll', () => {
				const remainingHeight = folderList.scrollHeight - folderList.scrollTop - folderList.clientHeight;
				if (remainingHeight <= 64) {
					void this.#loadFolderItems(folderList, subFolderContainer);
				}
			});
			void this.#loadFolderItems(folderList, subFolderContainer);
			return folderList;
		}
		#createFolderListContainer() {
			return main_core.Tag.render`
			<div
				class="sign-folder-selection"
				data-test-id="sign-folder-selection"
				aria-busy="true"
			></div>
		`;
		}
		#createSubFolderContainer() {
			return main_core.Tag.render`<div class="sign-folder-selection__children"></div>`;
		}
		#createLoaderContainer() {
			return main_core.Tag.render`
			<div
				class="sign-folder-selection__loader"
				data-test-id="sign-folder-selection-loader"
			></div>
		`;
		}
		async #loadFolderItems(folderList, subFolderContainer) {
			if (this.#loading || !this.#hasMore) {
				return;
			}
			this.#loading = true;
			const loaderContainer = this.#createLoaderContainer();
			main_core.Dom.append(loaderContainer, folderList);
			main_core.Dom.attr(folderList, 'aria-busy', 'true');
			const loader = new main_loader.Loader({
				target: loaderContainer,
				size: 48,
				mode: 'inline'
			});
			void loader.show();
			try {
				const response = await this.#loadFolders(LOAD_LIMIT, this.#offset);
				const page = Array.isArray(response) ? {
					folders: response,
					total: response.length,
					nextOffset: response.length
				} : response;
				const folders = Array.isArray(page?.folders) ? page.folders : [];
				const fragment = document.createDocumentFragment();
				folders.forEach(folder => {
					fragment.append(this.#createFolderItem(folder));
				});
				subFolderContainer.append(fragment);
				const previousOffset = this.#offset;
				this.#total = Number.isInteger(page?.total) ? page.total : folders.length;
				this.#offset = Number.isInteger(page?.nextOffset) ? page.nextOffset : previousOffset + folders.length;
				this.#hasMore = this.#offset > previousOffset && this.#offset < this.#total;
			} catch {
				this.#hasMore = false;
				this.emit('loadError');
			} finally {
				loader.destroy();
				loaderContainer.remove();
				main_core.Dom.attr(folderList, 'aria-busy', 'false');
				this.#loading = false;
			}
		}
		#createFolderItem(folder) {
			const listItem = main_core.Tag.render`
			<div class="sign-folder-selection__item" data-test-id="sign-folder-selection-item">
				<span class="sign-folder-selection__icon"></span>
				<span>${main_core.Text.encode(folder.title)}</span>
			</div>
		`;
			main_core.Event.bind(listItem, 'click', event => {
				event.stopPropagation();
				this.#selectAndHighlightFolder(listItem, folder);
			});
			return listItem;
		}
		#selectAndHighlightFolder(selectedItem, folder) {
			const folderList = selectedItem.closest('.sign-folder-selection');
			if (folderList === null) {
				return;
			}
			folderList.querySelectorAll('.sign-folder-selection__item').forEach(child => {
				main_core.Dom.removeClass(child, 'sign-folder-selection__item--selected');
			});
			main_core.Dom.addClass(selectedItem, 'sign-folder-selection__item--selected');
			this.#emitFolderSelected(folder);
		}
		#emitFolderSelected(folder) {
			this.emit('folderSelected', {
				folderId: folder.id
			});
		}
	}

	exports.CreateFolderPopup = CreateFolderPopup;
	exports.DeleteConfirmationPopup = DeleteConfirmationPopup;
	exports.FolderSelectionPopup = FolderSelectionPopup;

})(this.BX.Sign.V2.Grid.Components = this.BX.Sign.V2.Grid.Components || {}, BX, BX.Event, BX.Main, BX.UI, BX.UI.Notification, BX.UI.Dialogs, BX);
//# sourceMappingURL=folder.bundle.js.map

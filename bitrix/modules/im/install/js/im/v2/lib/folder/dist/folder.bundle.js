/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_feature, im_v2_lib_layout, im_v2_lib_notifier, main_core, main_core_events, ui_system_dialog, ui_buttons) {
	'use strict';

	const getFolderLimits = () => im_v2_application_core.Core.getApplicationData().folderLimits;
	const LayoutByRecentType = {
		[im_v2_const.RecentType.default]: im_v2_const.Layout.chat,
		[im_v2_const.RecentType.taskComments]: im_v2_const.Layout.taskComments,
		[im_v2_const.RecentType.copilot]: im_v2_const.Layout.copilot,
		[im_v2_const.RecentType.openChannel]: im_v2_const.Layout.channel,
		[im_v2_const.RecentType.collab]: im_v2_const.Layout.collab
	};
	const FolderManager = {
		getMaxFolders() {
			return getFolderLimits().maxFolders;
		},
		getMaxChatsPerFolder() {
			return getFolderLimits().maxChatsPerFolder;
		},
		getMaxTitleLength() {
			return getFolderLimits().maxTitleLength;
		},
		isFolderLimitReached() {
			const personalFolderCount = im_v2_application_core.Core.getStore().getters['recent/folders/getPersonalCount'];
			return personalFolderCount === this.getMaxFolders();
		},
		startCreation() {
			if (this.isFolderLimitReached()) {
				im_v2_lib_notifier.Notifier.folder.onFolderLimitError(this.getMaxFolders());
				return;
			}
			void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
				name: im_v2_const.Layout.createFolder
			});
		},
		handleOpenedFolder(folderId) {
			const layoutManager = im_v2_lib_layout.LayoutManager.getInstance();
			const {
				name: layoutName,
				params: layoutParams
			} = layoutManager.getLayout();
			const isFolderOpened = layoutName === im_v2_const.Layout.folder && layoutParams.folderId === folderId;
			if (isFolderOpened) {
				void layoutManager.setLayout({
					name: im_v2_const.Layout.chat
				});
			}
		},
		getLayoutByFolderCode(folderCode) {
			if (folderCode === im_v2_const.RecentType.openlines) {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.openLinesV2) ? im_v2_const.Layout.openlinesV2 : im_v2_const.Layout.openlines;
			}
			return LayoutByRecentType[folderCode] ?? im_v2_const.Layout.chat;
		},
		getPersonalFolderLayout(folderId) {
			return {
				name: im_v2_const.Layout.folder,
				params: {
					folderId
				}
			};
		},
		openPersonalFolder(folderId) {
			void im_v2_lib_layout.LayoutManager.getInstance().setLayout(this.getPersonalFolderLayout(folderId));
		},
		getInitialLayout() {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatFoldersWebAvailable)) {
				return null;
			}
			const [firstFolder] = im_v2_application_core.Core.getStore().getters['recent/folders/getList'];
			if (!firstFolder) {
				return null;
			}
			if (firstFolder.type === im_v2_const.FolderType.personal) {
				return this.getPersonalFolderLayout(firstFolder.id);
			}
			return {
				name: this.getLayoutByFolderCode(firstFolder.code)
			};
		}
	};

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.Folder.DeletePopup';
	class FolderDeletePopup extends main_core_events.EventEmitter {
		static events = {
			onConfirm: 'onConfirm',
			onCancel: 'onCancel'
		};
		#dialog;
		#confirmed = false;
		constructor() {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.#initDialog();
		}
		show() {
			this.#dialog.show();
		}
		#hide() {
			this.#dialog.hide();
		}
		#initDialog() {
			const params = {
				title: main_core.Loc.getMessage('IM_LIB_FOLDER_DELETE_POPUP_TITLE'),
				closeByEsc: true,
				content: this.#getContainer(),
				centerButtons: [this.#getConfirmButton(), this.#getCancelButton()],
				events: {
					onHide: () => this.#onPopupHide()
				}
			};
			this.#dialog = new ui_system_dialog.Dialog(params);
		}
		#getContainer() {
			return main_core.Tag.render`
			<div class="bx-im-folder-delete-popup__container bx-im-messenger__scope" data-testid="folder-delete-popup">
				<div class="bx-im-folder-delete-popup__text">
					${main_core.Loc.getMessage('IM_LIB_FOLDER_DELETE_POPUP_TEXT')}
				</div>
			</div>
		`;
		}
		#getConfirmButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('IM_LIB_FOLDER_DELETE_POPUP_CONFIRM'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED_ALERT,
				size: ui_buttons.ButtonSize.LARGE,
				wide: true,
				dataset: {
					testid: 'folder-delete-popup-confirm-btn'
				},
				onclick: () => {
					this.#confirmed = true;
					this.emit(FolderDeletePopup.events.onConfirm);
					this.#hide();
				}
			});
		}
		#getCancelButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('IM_LIB_FOLDER_DELETE_POPUP_CANCEL'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.LARGE,
				wide: true,
				dataset: {
					testid: 'folder-delete-popup-cancel-btn'
				},
				onclick: () => this.#hide()
			});
		}
		#onPopupHide() {
			if (this.#confirmed) {
				return;
			}
			this.emit(FolderDeletePopup.events.onCancel);
		}
	}

	exports.FolderDeletePopup = FolderDeletePopup;
	exports.FolderManager = FolderManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Event, BX.UI.System, BX.UI);
//# sourceMappingURL=folder.bundle.js.map

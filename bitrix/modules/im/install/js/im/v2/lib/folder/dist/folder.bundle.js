/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_const, im_v2_lib_analytics, im_v2_lib_feature, im_v2_lib_layout, im_v2_lib_notifier, ui_iconSet_api_core, main_core_events, ui_system_dialog, ui_buttons) {
	'use strict';

	// The single place where a folder code is bound to a glyph. Every glyph is taken from the Solid set,
	// which is loaded by the surfaces that draw it: most consumers of this library never ask for an icon.
	const IconBySystemFolderCode = {
		// `all` and `default` share a glyph and never stand side by side: the server shows exactly one of
		// the pair, `default` only while the composite folder of all the chats is off.
		[im_v2_const.SystemFolderCode.all]: ui_iconSet_api_core.Solid.HOME,
		[im_v2_const.SystemFolderCode.default]: ui_iconSet_api_core.Solid.HOME,
		[im_v2_const.SystemFolderCode.tasksTask]: ui_iconSet_api_core.Solid.TASK,
		[im_v2_const.SystemFolderCode.tasksTaskRoot]: ui_iconSet_api_core.Solid.TASK,
		[im_v2_const.SystemFolderCode.copilot]: ui_iconSet_api_core.Solid.BITRIX_GPT,
		[im_v2_const.SystemFolderCode.channel]: ui_iconSet_api_core.Solid.SPEAKER,
		[im_v2_const.SystemFolderCode.openChannel]: ui_iconSet_api_core.Solid.SPEAKER,
		[im_v2_const.SystemFolderCode.collab]: ui_iconSet_api_core.Solid.COLLAB,
		[im_v2_const.SystemFolderCode.openlines]: ui_iconSet_api_core.Solid.OPEN_CHANNELS,
		[im_v2_const.SystemFolderCode.vibecodeApp]: ui_iconSet_api_core.Solid.VIBECODE
	};

	// An unknown code is not an error: the showcase registry of the server may grow earlier than the client.
	const DefaultIcon = ui_iconSet_api_core.Solid.FOLDER;
	const getIconByFolderCode = folderCode => {
		// The code arrives with the answer of the server and no allowlist of the model stands on the way, so
		// the map is asked only about the keys it owns: a name every object inherits - `constructor`,
		// `toString` - would otherwise answer with a member of the prototype, and `??` would let it through.
		if (!Object.hasOwn(IconBySystemFolderCode, folderCode)) {
			return DefaultIcon;
		}
		return IconBySystemFolderCode[folderCode];
	};

	const getFolderLimits = () => im_v2_application_core.Core.getApplicationData().folders.limits;
	const LayoutBySystemFolderCode = {
		[im_v2_const.SystemFolderCode.default]: im_v2_const.Layout.chat,
		[im_v2_const.SystemFolderCode.tasksTask]: im_v2_const.Layout.taskComments,
		[im_v2_const.SystemFolderCode.copilot]: im_v2_const.Layout.copilot,
		[im_v2_const.SystemFolderCode.openChannel]: im_v2_const.Layout.channel,
		[im_v2_const.SystemFolderCode.collab]: im_v2_const.Layout.collab,
		[im_v2_const.SystemFolderCode.vibecodeApp]: im_v2_const.Layout.vibecodeApp
	};

	// Layouts that belong to folders as such and open straight as a folder layout. The remaining system
	// folders (copilot, channels, task chats, collabs) are navigation menu items with a section layout of
	// their own. The list is closed and manual: a new folder layout is added here on purpose.
	const FolderLayouts = new Set([im_v2_const.Layout.folder, im_v2_const.Layout.folderAll]);
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
		// Snapshot of the server rule, already in web chat type values: the client neither copies nor
		// extends it. An empty snapshot closes everything instead of opening everything - the check here is
		// a hint of the interface, and the server refuses a forbidden composition on its own anyway.
		getAllowedChatTypes() {
			const {
				folders
			} = im_v2_application_core.Core.getApplicationData();
			return main_core.Type.isArrayFilled(folders.allowedTypes) ? folders.allowedTypes : [];
		},
		// Compare only with chat.type of the chats model: the raw REST type of a one-to-one dialog is
		// 'private', which the web ChatType enum does not have. ChatTypeItem names the meaning of the value
		// and does not close the set: the extended chat type comes from the pair "literal + ENTITY_TYPE",
		// and an unregistered pair makes the ENTITY_TYPE itself the extended type
		// (TypeRegistry::getFallback), so chats of applications, bots and external integrations carry a
		// type outside the enum and simply find no match here.
		canChatBeInFolder(chatType) {
			return this.getAllowedChatTypes().includes(chatType);
		},
		isFolderLimitReached() {
			const personalFolderCount = im_v2_application_core.Core.getStore().getters['recent/folders/getPersonalCount'];
			return personalFolderCount === this.getMaxFolders();
		},
		startCreation() {
			if (this.isFolderLimitReached()) {
				im_v2_lib_analytics.Analytics.getInstance().folder.onFolderLimitException();
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
				void layoutManager.setLayout(this.getDefaultLayout() ?? {
					name: im_v2_const.Layout.chat
				});
			}
		},
		// Codes left without a layout on purpose: `all` leaves earlier through the composite branch, and
		// `chat` / `channel` / `tasksTaskRoot` are member folders the server marks invisible.
		getLayoutByFolderCode(folderCode) {
			if (folderCode === im_v2_const.SystemFolderCode.openlines) {
				return im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.openLinesV2) ? im_v2_const.Layout.openlinesV2 : im_v2_const.Layout.openlines;
			}
			return LayoutBySystemFolderCode[folderCode] ?? null;
		},
		getPersonalFolderLayout(folderId) {
			return {
				name: im_v2_const.Layout.folder,
				params: {
					folderId
				}
			};
		},
		// Single resolver for any folder. Layout params carry the folder id only for personal folders:
		// there are many of them under one layout name, and the id is what tells them apart. Every other
		// folder owns its layout name alone and needs no discriminator.
		// No layout for the folder code means the folder has no section of its own - nothing to open.
		getFolderLayout(folder) {
			if (folder.type === im_v2_const.FolderType.personal) {
				return this.getPersonalFolderLayout(folder.id);
			}
			if (im_v2_application_core.Core.getStore().getters['recent/folders/isComposite'](folder.id)) {
				return {
					name: im_v2_const.Layout.folderAll
				};
			}
			const layoutName = this.getLayoutByFolderCode(folder.code);
			return layoutName ? {
				name: layoutName
			} : null;
		},
		isFolderLayout(layoutName) {
			return FolderLayouts.has(layoutName);
		},
		openPersonalFolder(folderId) {
			void im_v2_lib_layout.LayoutManager.getInstance().setLayout(this.getPersonalFolderLayout(folderId));
		},
		// The layout of the user's main place, asked by every entry that sends the user back and not only
		// by the start of the session. No rule (folders feature off or nothing visible) means null, and the
		// caller keeps today's behavior.
		getDefaultLayout() {
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isChatFoldersWebAvailable)) {
				return null;
			}

			// Invisible member folders take no part in navigation, so the default folder is the first
			// visible one and not the first one of the registry.
			const [firstFolder] = im_v2_application_core.Core.getStore().getters['recent/folders/getVisibleList'];
			if (!firstFolder) {
				return null;
			}
			return this.getFolderLayout(firstFolder);
		},
		// The place where a plain chat lives now, asked by every entry that opens one. Unlike the default
		// layout above, this one always answers: the result goes straight into setLayout and the call sites
		// keep no fallback of their own. It never looks at the current layout - the only question it
		// answers is where a plain chat is shown.
		getRegularChatsLayout() {
			const allFolder = im_v2_application_core.Core.getStore().getters['recent/folders/getByCode'](im_v2_const.SystemFolderCode.all);
			// The composition of the All folder belongs to the server, so a folder left without one
			// resolves to nothing - the answer is then the same as with no folder at all.
			const folderLayout = allFolder ? this.getFolderLayout(allFolder) : null;
			return folderLayout ?? {
				name: im_v2_const.Layout.chat
			};
		},
		// The glyph of a folder, drawn by the source rows of the composition screen; the tile of the folder bar
		// paints its own by a CSS modifier. The table binding a code to a glyph is large enough to live in a
		// file of its own, and the manager keeps it behind one entry.
		getFolderIcon(folderCode) {
			return getIconByFolderCode(folderCode);
		},
		// The only entry to the composition screen of the composite folder, so the layout name stays here and
		// not in the surfaces that open it. The screen finds the folder by its code on its own - the caller has
		// nothing to pass, and the right to open is decided by the caller, not here.
		openAllFolderSettings() {
			void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
				name: im_v2_const.Layout.folderAllSettings
			});
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

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.UI.IconSet, BX.Event, BX.UI.System, BX.UI);
//# sourceMappingURL=folder.bundle.js.map

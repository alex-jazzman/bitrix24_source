/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_lib_notifier, im_v2_const, im_v2_lib_rest, main_core, main_core_events, ui_system_dialog, ui_buttons) {
	'use strict';

	const MESSAGE_ACCESS_ERROR_CODES = new Set([im_v2_const.ErrorCode.chat.accessDenied, im_v2_const.ErrorCode.chat.notFound, im_v2_const.ErrorCode.message.notFound, im_v2_const.ErrorCode.message.accessDenied, im_v2_const.ErrorCode.message.accessDeniedByTariff]);
	const AccessService = {
		async checkMessageAccess(messageId) {
			const payload = {
				data: {
					messageId
				}
			};
			try {
				await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2AccessCheck, payload);
			} catch (errors) {
				return handleMessageAccessError(errors);
			}
			return Promise.resolve({
				hasAccess: true
			});
		},
		async checkChatAccessByUserIds(dialogId, userIds) {
			const payload = {
				data: {
					dialogId,
					userIds
				}
			};
			if (userIds.length === 0) {
				return true;
			}
			try {
				const {
					usersNotInChat
				} = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2ChatMemberCheckMembership, payload);
				return usersNotInChat.length === 0;
			} catch (errors) {
				console.error('AccessService: error checking chat access', errors);
				throw errors;
			}
		}
	};
	const handleMessageAccessError = errors => {
		const [error] = errors;
		if (MESSAGE_ACCESS_ERROR_CODES.has(error.code)) {
			return {
				hasAccess: false,
				errorCode: error.code
			};
		}
		console.error('AccessService: error checking message access', error.code);

		// we need to handle all types of errors on this stage
		// but for now we let user through in case of unknown error
		return {
			hasAccess: true
		};
	};

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Lib.Access.ParentAccessPopup';
	class ParentAccessPopup extends main_core_events.EventEmitter {
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
				title: main_core.Loc.getMessage('IM_LIB_ACCESS_PARENT_CHAT_ACCESS_TITLE'),
				closeByEsc: false,
				closeByClickOutside: false,
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
			<div class="bx-im-parent-access-popup__container bx-im-messenger__scope">
				<div class="bx-im-parent-access-popup__text">
					${main_core.Loc.getMessage('IM_LIB_ACCESS_PARENT_CHAT_ACCESS_TEXT')}
				</div>
				<div class="bx-im-parent-access-popup__image"></div>
			</div>
		`;
		}
		#getConfirmButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('IM_LIB_ACCESS_PARENT_CHAT_ACCESS_CONFIRM'),
				useAirDesign: true,
				size: ui_buttons.ButtonSize.LARGE,
				wide: true,
				onclick: () => {
					this.#confirmed = true;
					this.emit(ParentAccessPopup.events.onConfirm);
					this.#hide();
				}
			});
		}
		#getCancelButton() {
			return new ui_buttons.Button({
				text: main_core.Loc.getMessage('IM_LIB_ACCESS_PARENT_CHAT_ACCESS_CANCEL'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.LARGE,
				wide: true,
				onclick: () => this.#hide()
			});
		}
		#onPopupHide() {
			if (this.#confirmed) {
				return;
			}
			this.emit(ParentAccessPopup.events.onCancel);
		}
	}

	const ChatAccessManager = {
		canAddUsers(dialogId, userIds) {
			const parentChat = im_v2_application_core.Core.getStore().getters['chats/getParent'](dialogId);
			if (!parentChat || !addsMembersToParent(dialogId)) {
				return true;
			}
			return this.canAddUsersToParent(parentChat.dialogId, userIds);
		},
		async canAddUsersToParent(parentDialogId, userIds) {
			try {
				const everyoneHasParentAccess = await AccessService.checkChatAccessByUserIds(parentDialogId, userIds);
				if (!everyoneHasParentAccess) {
					return this.askForParentAccess();
				}
				return true;
			} catch {
				im_v2_lib_notifier.Notifier.onDefaultError();
				return false;
			}
		},
		askForParentAccess() {
			let promiseResolver = null;
			const promise = new Promise(resolve => {
				promiseResolver = resolve;
			});
			const parentAccessPopup = new ParentAccessPopup();
			parentAccessPopup.subscribeOnce(ParentAccessPopup.events.onConfirm, () => promiseResolver(true));
			parentAccessPopup.subscribeOnce(ParentAccessPopup.events.onCancel, () => promiseResolver(false));
			parentAccessPopup.show();
			return promise;
		}
	};
	const addsMembersToParent = dialogId => {
		const TYPES_ADDING_MEMBERS_TO_PARENT = new Set([im_v2_const.ChatType.chat, im_v2_const.ChatType.copilot]);
		const {
			type
		} = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
		return TYPES_ADDING_MEMBERS_TO_PARENT.has(type);
	};

	const MessageAccessManager = {
		checkMessageAccess(messageId) {
			return AccessService.checkMessageAccess(messageId);
		}
	};

	exports.ChatAccessManager = ChatAccessManager;
	exports.MessageAccessManager = MessageAccessManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX, BX.Event, BX.UI.System, BX.UI);
//# sourceMappingURL=access.bundle.js.map

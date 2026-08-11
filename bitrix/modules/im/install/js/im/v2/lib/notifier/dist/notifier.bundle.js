/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_const, ui_notification, im_public, im_v2_lib_collab) {
	'use strict';

	const showNotification = (text, params) => {
		BX.UI.Notification.Center.notify({
			content: text,
			...params
		});
	};

	const extractRestErrorCode = error => {
		const {
			ex: {
				error: errorCode
			}
		} = error;
		return errorCode;
	};

	const ChatNotifier = {
		handleLoadError(error) {
			// eslint-disable-next-line unicorn/prefer-switch
			if (error.code === im_v2_const.ErrorCode.chat.notFound) {
				this.onNotFoundError();
			} else if (error.code === im_v2_const.ErrorCode.chat.accessDenied) {
				this.onAccessDeniedError();
			} else if (error.code === im_v2_const.ErrorCode.message.notFound) {
				this.onContextMessageNotFoundError();
			}
		},
		handleLeaveError(error) {
			const errorCode = extractRestErrorCode(error);
			const NotificationTextByErrorCode = {
				[im_v2_const.ErrorCode.user.invitedFromStructure]: main_core.Loc.getMessage('IM_NOTIFIER_LEAVE_CHAT_STRUCTURE_ERROR'),
				default: main_core.Loc.getMessage('IM_NOTIFIER_LEAVE_CHAT_ERROR')
			};
			const notificationText = NotificationTextByErrorCode[errorCode] ?? NotificationTextByErrorCode.default;
			showNotification(notificationText);
		},
		handleUserKickError(error) {
			const errorCode = extractRestErrorCode(error);
			const NotificationTextByErrorCode = {
				[im_v2_const.ErrorCode.user.invitedFromStructure]: main_core.Loc.getMessage('IM_NOTIFIER_KICK_CHAT_STRUCTURE_ERROR'),
				default: main_core.Loc.getMessage('IM_NOTIFIER_KICK_CHAT_ERROR')
			};
			const notificationText = NotificationTextByErrorCode[errorCode] ?? NotificationTextByErrorCode.default;
			showNotification(notificationText);
		},
		onNotFoundError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CHAT_ACCESS_ERROR'));
		},
		onAccessDeniedError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CHAT_ACCESS_ERROR'));
		},
		onContextMessageNotFoundError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CONTEXT_MESSAGE_NOT_FOUND_ERROR'));
		},
		handleCreateError(error) {
			const errorCode = extractRestErrorCode(error);
			const NotificationTextByErrorCode = {
				CALL_MODULE_NOT_INSTALLED: main_core.Loc.getMessage('IM_NOTIFIER_CONFERENCE_MODULE_NOT_INSTALLED_ERROR'),
				default: main_core.Loc.getMessage('IM_NOTIFIER_CHAT_CREATE_ERROR')
			};
			const notificationText = NotificationTextByErrorCode[errorCode] ?? NotificationTextByErrorCode.default;
			showNotification(notificationText);
		},
		onUpdateError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CHAT_UPDATE_ERROR'));
		},
		onDeleteError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CHAT_DELETE_ERROR'));
		},
		onRenameError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CHAT_RENAME_ERROR'));
		},
		onMessagesPinLimitError(pinLimit) {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGES_PIN_LIMIT_ERROR', {
				'#MAX_PINS#': pinLimit
			}));
		},
		handleUserAddComplete(chatType) {
			const NotificationTextByChatType = {
				[im_v2_const.ChatType.taskComments]: main_core.Loc.getMessage('IM_NOTIFIER_TASK_COMMENTS_USER_ADD_COMPLETE'),
				default: main_core.Loc.getMessage('IM_NOTIFIER_CHAT_USER_ADD_COMPLETE')
			};
			const notificationText = NotificationTextByChatType[chatType] ?? NotificationTextByChatType.default;
			showNotification(notificationText);
		},
		handleUserAddError(chatType) {
			const NotificationTextByChatType = {
				[im_v2_const.ChatType.taskComments]: main_core.Loc.getMessage('IM_NOTIFIER_TASK_COMMENTS_USER_ADD_ERROR'),
				default: main_core.Loc.getMessage('IM_NOTIFIER_CHAT_USER_ADD_ERROR')
			};
			const notificationText = NotificationTextByChatType[chatType] ?? NotificationTextByChatType.default;
			showNotification(notificationText);
		},
		onCopyIdComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CHAT_COPY_ID_COMPLETE'));
		}
	};

	const MessageNotifier = {
		onCopyComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_COPY_COMPLETE'));
		},
		onCopyLinkComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_LINK_COPY_COMPLETE'));
		},
		onAddToFavoriteComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_FAVORITE_ADD_COMPLETE'));
		},
		onForwardComplete(messagesIds, dialogId) {
			const text = messagesIds.length > 1 ? main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_NOTES_SEVERAL_MESSAGES_COMPLETE') : main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_NOTES_COMPLETE');
			const openChatAction = {
				title: main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_FORWARD_NOTES_OPEN_COMPLETE'),
				events: {
					click: () => im_public.Messenger.openChat(dialogId)
				}
			};
			showNotification(text, {
				actions: [openChatAction]
			});
		},
		handleLoadContextError(error) {
			if (error.code === im_v2_const.ErrorCode.message.notFound) {
				this.onNotFoundError();
			}
		},
		onNotFoundError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CONTEXT_MESSAGE_NOT_FOUND_ERROR'));
		},
		onSelectLimitError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_SELECT_LIMIT_ERROR'));
		}
	};

	const CollabErrorCode = {
		emptyName: 'name',
		duplicateName: 'ERROR_GROUP_NAME_EXISTS',
		urlInName: 'ERROR_NAME_CONTAINS_URL',
		tasksNotEmpty: 'TASKS_NOT_EMPTY',
		diskNotEmpty: 'DISK_NOT_EMPTY',
		calendarNotEmpty: 'CALENDAR_NOT_EMPTY'
	};
	const NotEmptyCollabErrorCodes = new Set([CollabErrorCode.tasksNotEmpty, CollabErrorCode.diskNotEmpty, CollabErrorCode.calendarNotEmpty]);
	const CollabNotifier = {
		onBeforeDelete() {
			showNotification(im_v2_lib_collab.CollabManager.getBeforeDeleteText());
		},
		onUpdateLinkComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_LINK_UPDATE_COMPLETE'));
		},
		handleDeleteError(error) {
			if (NotEmptyCollabErrorCodes.has(error.code)) {
				showNotification(im_v2_lib_collab.CollabManager.getNotEmptyDeleteErrorText());
				return;
			}
			showNotification(im_v2_lib_collab.CollabManager.getDeleteErrorText());
		},
		onLeaveError() {
			showNotification(im_v2_lib_collab.CollabManager.getLeaveErrorText());
		},
		onKickUserError() {
			showNotification(im_v2_lib_collab.CollabManager.getKickErrorText());
		},
		onCollaberNotAcceptInvitation() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_COLLAB_COLLABER_NOT_ACCEPT_INVITATION'));
		},
		onCopyLinkError() {
			showNotification(im_v2_lib_collab.CollabManager.getCopyLinkError());
		},
		handleCreateError(error) {
			const NotificationTextByErrorCode = {
				[CollabErrorCode.emptyName]: main_core.Loc.getMessage('IM_NOTIFIER_COLLAB_EMPTY_NAME_ERROR'),
				[CollabErrorCode.duplicateName]: main_core.Loc.getMessage('IM_NOTIFIER_COLLAB_DUPLICATE_NAME_ERROR'),
				[CollabErrorCode.urlInName]: main_core.Loc.getMessage('IM_NOTIFIER_COLLAB_URL_IN_NAME_ERROR'),
				default: main_core.Loc.getMessage('IM_NOTIFIER_CHAT_CREATE_ERROR')
			};
			const notificationText = NotificationTextByErrorCode[error.code] ?? NotificationTextByErrorCode.default;
			showNotification(notificationText);
		},
		handleUpdateError(error) {
			const NotificationTextByErrorCode = {
				[CollabErrorCode.emptyName]: main_core.Loc.getMessage('IM_NOTIFIER_COLLAB_EMPTY_NAME_ERROR'),
				[CollabErrorCode.duplicateName]: main_core.Loc.getMessage('IM_NOTIFIER_COLLAB_DUPLICATE_NAME_ERROR'),
				[CollabErrorCode.urlInName]: main_core.Loc.getMessage('IM_NOTIFIER_COLLAB_URL_IN_NAME_ERROR'),
				default: main_core.Loc.getMessage('IM_NOTIFIER_CHAT_UPDATE_ERROR')
			};
			const notificationText = NotificationTextByErrorCode[error.code] ?? NotificationTextByErrorCode.default;
			showNotification(notificationText);
		}
	};

	const FileNotifier = {
		onDiskSaveComplete(isSingleFile = true) {
			if (isSingleFile) {
				showNotification(main_core.Loc.getMessage('IM_NOTIFIER_FILE_DISK_SAVE_COMPLETE'));
				return;
			}
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_FILES_DISK_SAVE_COMPLETE'));
		},
		onCopyComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_FILE_COPY_COMPLETE'));
		},
		handleUploadError(error) {
			if (error.getCode() === im_v2_const.ErrorCode.file.maxFileSize) {
				showNotification(`${error.getMessage()}<br>${error.getDescription()}`);
			}
		}
	};

	const InviteNotifier = {
		onResendComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_INVITE_RESEND_COMPLETE'), {
				autoHideDelay: 2000
			});
		},
		onCancelComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_INVITE_CANCEL_COMPLETE'), {
				autoHideDelay: 2000
			});
		},
		onPartialError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_INVITE_PARTIAL_ERROR'));
		}
	};

	const ConferenceNotifier = {
		onCopyLinkComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CONFERENCE_LINK_COPY_COMPLETE'));
		},
		onPasswordError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_CONFERENCE_PASSWORD_ERROR'));
		}
	};

	const StickerNotifier = {
		handleLimits(error) {
			if (error.code === im_v2_const.ErrorCode.sticker.maxStickers) {
				this.onAddStickerError();
			} else if (error.code === im_v2_const.ErrorCode.sticker.maxPacks) {
				this.onAddPackError();
			}
		},
		onLinkPackComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_LINK_COMPLETE'));
		},
		onLinkPackError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_LINK_ERROR'));
		},
		onAddStickerError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKERS_LIMIT_ERROR'));
		},
		onAddPackError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_LIMIT_ERROR'));
		},
		onCreatePackComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_CREATE_COMPLETE'));
		},
		onUpdatePackComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_UPDATE_COMPLETE'));
		},
		onRemovePackComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_REMOVE_COMPLETE'));
		}
	};

	const SupportNotifier = {
		onVoteClosedError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_VOTE_CLOSED_ERROR'));
		}
	};

	const SpeechNotifier = {
		onRecognitionError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_AUDIO_INPUT_ERROR'));
		}
	};

	const CallNotifier = {
		onBackgroundFileSizeError(payload) {
			const {
				fileName,
				fileSizeLimit
			} = payload;
			const phrase = main_core.Loc.getMessage('IM_NOTIFIER_CALL_BACKGROUND_FILE_SIZE_ERROR', {
				'#LIMIT#': fileSizeLimit,
				'#FILE_NAME#': fileName
			});
			showNotification(phrase);
		},
		onBackgroundUnsupportedError(fileName) {
			const phrase = main_core.Loc.getMessage('IM_NOTIFIER_CALL_BACKGROUND_FILE_UNSUPPORTED_ERROR', {
				'#FILE_NAME#': fileName
			});
			showNotification(phrase);
		}
	};

	const RecentErrorCodes = {
		maxPinned: 'MAX_PINNED_CHATS_ERROR'
	};
	const MAX_PINS = 45;
	const RecentNotifier = {
		handlePinError(error) {
			const maxPinnedMessage = main_core.Loc.getMessage('IM_NOTIFIER_RECENT_PIN_LIMIT_ERROR', {
				'#MAX_PINS#': MAX_PINS
			});
			const NotificationTextByErrorCode = {
				[RecentErrorCodes.maxPinned]: maxPinnedMessage,
				default: main_core.Loc.getMessage('IM_NOTIFIER_RECENT_PIN_DEFAULT_ERROR')
			};
			const notificationText = NotificationTextByErrorCode[error.code] ?? NotificationTextByErrorCode.default;
			showNotification(notificationText);
		},
		onUnpinError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_RECENT_UNPIN_DEFAULT_ERROR'));
		}
	};

	const NotificationNotifier = {
		onSubscribeComplete(type) {
			const phrase = main_core.Loc.getMessage('IM_NOTIFIER_SUBSCRIBE_COMPLETE', {
				'#TYPE#': type
			});
			showNotification(phrase);
		},
		onUnsubscribeComplete(type, callback) {
			const params = {
				autoHideDelay: 5000,
				actions: [{
					title: main_core.Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_UNSUBSCRIBE_CANCEL'),
					events: {
						click: callback
					}
				}]
			};
			const phrase = main_core.Loc.getMessage('IM_NOTIFIER_UNSUBSCRIBE_COMPLETE', {
				'#TYPE#': type
			});
			showNotification(phrase, params);
		}
	};

	const SharedLinkNotifier = {
		onCopyIndividualLinkComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_SHARED_LINK_COPY_INDIVIDUAL_COMPLETE'));
		},
		onClickInvalidLinkError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CLICK_INVALID_ERROR'));
		},
		onChangeLinkComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CHANGE_COMPLETE'));
		},
		onChangeLinkError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_SHARED_LINK_CHANGE_ERROR'));
		}
	};

	const Notifier = {
		chat: ChatNotifier,
		message: MessageNotifier,
		collab: CollabNotifier,
		file: FileNotifier,
		invite: InviteNotifier,
		conference: ConferenceNotifier,
		support: SupportNotifier,
		speech: SpeechNotifier,
		call: CallNotifier,
		recent: RecentNotifier,
		sharedLink: SharedLinkNotifier,
		notification: NotificationNotifier,
		sticker: StickerNotifier,
		onCopyTextComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_TEXT_COPY_COMPLETE'));
		},
		onCopyLinkComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_LINK_COPY_COMPLETE'));
		},
		onDefaultError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_DEFAULT_ERROR'));
		},
		onCopyLinkError() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_LINK_COPY_ERROR'));
		},
		onUpdateLinkComplete() {
			showNotification(main_core.Loc.getMessage('IM_NOTIFIER_LINK_UPDATE_COMPLETE'));
		}
	};

	exports.Notifier = Notifier;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Const, BX.UI.Notification, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=notifier.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_lib_utils, main_core_events, ui_vue3_vuex, im_v2_const, im_v2_lib_layout, im_v2_application_core, im_v2_lib_logger, im_v2_lib_user, im_v2_model, im_v2_lib_message, im_v2_lib_userStatus, im_v2_lib_recent) {
	'use strict';

	const isNumberOrString = target => {
		return main_core.Type.isNumber(target) || main_core.Type.isString(target);
	};
	const convertToString = target => {
		return target.toString();
	};
	const convertToNumber = target => {
		return Number.parseInt(target, 10);
	};
	const convertToDate = target => {
		return im_v2_lib_utils.Utils.date.cast(target, false);
	};
	const SNAKE_CASE_REGEXP = /(_[\da-z])/gi;
	const convertObjectKeysToCamelCase = targetObject => {
		const resultObject = {};
		Object.entries(targetObject).forEach(([key, value]) => {
			const newKey = prepareKey(key);
			if (main_core.Type.isPlainObject(value)) {
				resultObject[newKey] = convertObjectKeysToCamelCase(value);
				return;
			}
			if (main_core.Type.isArray(value)) {
				resultObject[newKey] = convertArrayItemsKeysToCamelCase(value);
				return;
			}
			resultObject[newKey] = value;
		});
		return resultObject;
	};
	const prepareKey = rawKey => {
		let key = rawKey;
		if (key.search(SNAKE_CASE_REGEXP) !== -1) {
			key = key.toLowerCase();
		}
		return main_core.Text.toCamelCase(key);
	};
	const convertArrayItemsKeysToCamelCase = targetArray => {
		return targetArray.map(arrayItem => {
			if (!main_core.Type.isPlainObject(arrayItem)) {
				return arrayItem;
			}
			return convertObjectKeysToCamelCase(arrayItem);
		});
	};

	const prepareDraft = draft => {
		if (!draft.text || draft.text === '') {
			return {
				text: '',
				date: null
			};
		}
		return {
			text: draft.text,
			date: new Date()
		};
	};
	const prepareInvitation = invited => {
		if (main_core.Type.isPlainObject(invited)) {
			return {
				isActive: true,
				originator: invited.originatorId,
				canResend: invited.canResend
			};
		}
		return {
			isActive: false,
			originator: 0,
			canResend: false
		};
	};

	const formatFieldsWithConfig = (fields, config) => {
		const resultObject = {};
		const rawFields = convertObjectKeysToCamelCase(fields);
		config.forEach(fieldConfig => {
			const {
				fieldName,
				targetFieldName,
				checkFunction,
				formatFunction
			} = fieldConfig;

			// check if field exists
			const foundFieldName = getValidFieldName(rawFields, fieldName);
			if (!foundFieldName) {
				return;
			}

			// validate value
			if (!isFieldValueValid(rawFields[foundFieldName], checkFunction)) {
				return;
			}

			// format value
			resultObject[targetFieldName] = formatFieldValue({
				fieldValue: rawFields[foundFieldName],
				formatFunction,
				currentResult: resultObject,
				rawFields: fields
			});
		});
		return resultObject;
	};
	const getValidFieldName = (fields, fieldName) => {
		let fieldNameList = fieldName;
		if (main_core.Type.isStringFilled(fieldNameList)) {
			fieldNameList = [fieldNameList];
		}
		for (const singleField of fieldNameList) {
			if (!main_core.Type.isUndefined(fields[singleField])) {
				return singleField;
			}
		}
		return null;
	};
	const isFieldValueValid = (field, checkFunction) => {
		let checkFunctionList = checkFunction;
		if (main_core.Type.isUndefined(checkFunctionList)) {
			return true;
		}
		if (main_core.Type.isFunction(checkFunctionList)) {
			checkFunctionList = [checkFunctionList];
		}
		return checkFunctionList.some(singleFunction => singleFunction(field));
	};
	const formatFieldValue = params => {
		const {
			fieldValue,
			formatFunction,
			currentResult,
			rawFields
		} = params;
		if (main_core.Type.isUndefined(formatFunction)) {
			return fieldValue;
		}
		return formatFunction(fieldValue, currentResult, rawFields);
	};

	const SortWeight = {
		tasks: 2600,
		calendar: 2500,
		im: 2400,
		blog: 2300,
		vote: 2200,
		main: 2100,
		socialnetwork: 2000,
		bizproc: 1900,
		rpa: 1800,
		lists: 1700,
		mail: 1600,
		crm: 1500,
		sender: 1400,
		booking: 1300,
		voximplant: 1200,
		imopenlines: 1100,
		timeman: 1000,
		disk: 900,
		bitrix24: 800,
		sign: 700,
		biconnector: 600,
		rest: 500,
		intranet: 400,
		photogallery: 300,
		wiki: 200,
		forum: 100
	};
	const prepareNotificationSettings = target => {
		const result = {};
		const sortedTarget = sortNotificationSettingsBlock(target);
		sortedTarget.forEach(block => {
			const preparedItems = {};
			block.notices.forEach(item => {
				preparedItems[item.id] = item;
			});
			result[block.id] = {
				id: block.id,
				label: block.label,
				items: preparedItems
			};
		});
		return result;
	};
	const sortNotificationSettingsBlock = target => {
		return [...target].sort((a, b) => {
			const weightA = SortWeight[a.id] ?? 0;
			const weightB = SortWeight[b.id] ?? 0;
			return weightB - weightA;
		});
	};

	const settingsFieldsConfig = [{
		fieldName: im_v2_const.Settings.notification.enableSound,
		targetFieldName: im_v2_const.Settings.notification.enableSound,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.notification.enableAutoRead,
		targetFieldName: im_v2_const.Settings.notification.enableAutoRead,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.notification.mode,
		targetFieldName: im_v2_const.Settings.notification.mode,
		checkFunction: main_core.Type.isString
	}, {
		fieldName: im_v2_const.Settings.notification.enableWeb,
		targetFieldName: im_v2_const.Settings.notification.enableWeb,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.notification.enableMail,
		targetFieldName: im_v2_const.Settings.notification.enableMail,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.notification.enablePush,
		targetFieldName: im_v2_const.Settings.notification.enablePush,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'notifications',
		targetFieldName: 'notifications',
		checkFunction: main_core.Type.isArray,
		formatFunction: prepareNotificationSettings
	}, {
		fieldName: im_v2_const.Settings.message.bigSmiles,
		targetFieldName: im_v2_const.Settings.message.bigSmiles,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.appearance.background,
		targetFieldName: im_v2_const.Settings.appearance.background,
		checkFunction: main_core.Type.isString
	}, {
		fieldName: im_v2_const.Settings.appearance.alignment,
		targetFieldName: im_v2_const.Settings.appearance.alignment,
		checkFunction: main_core.Type.isString
	}, {
		fieldName: im_v2_const.Settings.recent.showBirthday,
		targetFieldName: im_v2_const.Settings.recent.showBirthday,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.recent.showInvited,
		targetFieldName: im_v2_const.Settings.recent.showInvited,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.recent.showLastMessage,
		targetFieldName: im_v2_const.Settings.recent.showLastMessage,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.hotkey.sendByEnter,
		targetFieldName: im_v2_const.Settings.hotkey.sendByEnter,
		checkFunction: main_core.Type.isString,
		formatFunction: target => {
			return target === '1';
		}
	}, {
		fieldName: im_v2_const.Settings.hotkey.sendByEnter,
		targetFieldName: im_v2_const.Settings.hotkey.sendByEnter,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.desktop.enableRedirect,
		targetFieldName: im_v2_const.Settings.desktop.enableRedirect,
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: im_v2_const.Settings.user.status,
		targetFieldName: im_v2_const.Settings.user.status,
		checkFunction: main_core.Type.isString
	}];

	/* eslint-disable no-param-reassign */
	class SettingsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				[im_v2_const.Settings.appearance.background]: 'azure',
				[im_v2_const.Settings.appearance.alignment]: im_v2_const.DialogAlignment.left,
				[im_v2_const.Settings.notification.enableSound]: true,
				[im_v2_const.Settings.notification.enableAutoRead]: true,
				[im_v2_const.Settings.notification.mode]: im_v2_const.NotificationSettingsMode.simple,
				[im_v2_const.Settings.notification.enableWeb]: true,
				[im_v2_const.Settings.notification.enableMail]: true,
				[im_v2_const.Settings.notification.enablePush]: true,
				notifications: {},
				[im_v2_const.Settings.message.bigSmiles]: true,
				[im_v2_const.Settings.recent.showBirthday]: true,
				[im_v2_const.Settings.recent.showInvited]: true,
				[im_v2_const.Settings.recent.showLastMessage]: true,
				[im_v2_const.Settings.desktop.enableRedirect]: true
			};
		}
		getGetters() {
			return {
				/** @function application/settings/get */
				get: state => key => {
					return state[key];
				}
			};
		}
		getActions() {
			return {
				/** @function application/settings/set */
				set: (store, payload) => {
					store.commit('set', this.formatFields(payload));
				},
				/** @function application/settings/setNotificationOption */
				setNotificationOption: (store, payload) => {
					store.commit('setNotificationOption', payload);
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					Object.entries(payload).forEach(([key, value]) => {
						state[key] = value;
					});
				},
				setNotificationOption: (state, payload) => {
					const {
						moduleId,
						optionName,
						type,
						value
					} = payload;
					const moduleOptions = state.notifications[moduleId];
					if (!moduleOptions?.items?.[optionName]) {
						return;
					}
					moduleOptions.items[optionName][type] = value;
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, settingsFieldsConfig);
		}
	}

	const tariffRestrictionsFieldsConfig = [{
		fieldName: 'fullChatHistory',
		targetFieldName: 'fullChatHistory',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => formatFieldsWithConfig(target, tariffFullChatHistoryFieldsConfig)
	}, {
		fieldName: 'collab',
		targetFieldName: 'collabV2',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => formatFieldsWithConfig(target, tariffCollabFieldsConfig)
	}];
	const tariffFullChatHistoryFieldsConfig = [{
		fieldName: 'isAvailable',
		targetFieldName: 'isAvailable',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'limitDays',
		targetFieldName: 'limitDays',
		checkFunction: main_core.Type.isNumber
	}];
	const tariffCollabFieldsConfig = [{
		fieldName: 'isAvailable',
		targetFieldName: 'isAvailable',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'isCopyAvailable',
		targetFieldName: 'isCopyAvailable',
		checkFunction: main_core.Type.isBoolean
	}];

	/* eslint-disable no-param-reassign */
	class TariffRestrictionsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				fullChatHistory: {
					isAvailable: true,
					limitDays: null
				},
				collabV2: {
					isAvailable: true,
					isCopyAvailable: true
				}
			};
		}
		getGetters() {
			return {
				/** @function application/tariffRestrictions/get */
				get: state => {
					return state;
				},
				/** @function application/tariffRestrictions/isHistoryAvailable */
				isHistoryAvailable: state => {
					return state.fullChatHistory?.isAvailable ?? false;
				},
				/** @function application/tariffRestrictions/isCollabV2Available */
				isCollabV2Available: state => {
					return state.collabV2.isAvailable;
				},
				/** @function application/tariffRestrictions/isCollabV2CopyAvailable */
				isCollabV2CopyAvailable: state => {
					return state.collabV2.isCopyAvailable;
				}
			};
		}
		getActions() {
			return {
				/** @function application/tariffRestrictions/set */
				set: (store, payload) => {
					store.commit('set', this.formatFields(payload));
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					Object.entries(payload).forEach(([key, value]) => {
						state[key] = value;
					});
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, tariffRestrictionsFieldsConfig);
		}
	}

	class ApplicationModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'application';
		}
		getNestedModules() {
			return {
				settings: SettingsModel,
				tariffRestrictions: TariffRestrictionsModel
			};
		}
		getState() {
			return {
				layout: {
					name: im_v2_const.Layout.chat,
					entityId: '',
					contextId: 0,
					params: {}
				}
			};
		}
		getGetters() {
			return {
				/** @function application/getLayout */
				getLayout: state => {
					return state.layout;
				},
				/** @function application/isChatOpen */
				isChatOpen: state => dialogId => {
					if (!im_v2_lib_layout.LayoutManager.getInstance().isChatLayout(state.layout.name)) {
						return false;
					}
					return state.layout.entityId === dialogId.toString();
				},
				isLinesChatOpen: state => dialogId => {
					if (state.layout.name !== im_v2_const.Layout.openlines && state.layout.name !== im_v2_const.Layout.openlinesV2) {
						return false;
					}
					return state.layout.entityId === dialogId.toString();
				},
				/** @function application/areNotificationsOpen */
				areNotificationsOpen: state => {
					return state.layout.name === im_v2_const.Layout.notification;
				}
			};
		}
		getActions() {
			return {
				/** @function application/setLayout */
				setLayout: (store, payload) => {
					const {
						name,
						entityId = '',
						contextId = 0,
						params = {}
					} = payload;
					if (!main_core.Type.isStringFilled(name)) {
						return;
					}
					const previousLayout = {
						...store.state.layout
					};
					const newLayout = {
						name: this.validateLayout(name),
						entityId,
						contextId,
						params
					};
					if (this.#isSameLayout(previousLayout, newLayout)) {
						newLayout.params = {
							...previousLayout.params,
							...newLayout.params
						};
					}
					main_core_events.EventEmitter.emit(im_v2_const.EventType.layout.onLayoutChange, {
						from: previousLayout,
						to: newLayout
					});
					if (this.#isSameLayoutPayload(previousLayout, newLayout)) {
						return;
					}
					store.commit('updateLayout', {
						layout: newLayout
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				updateLayout: (state, payload) => {
					state.layout = {
						...state.layout,
						...payload.layout
					};
				}
			};
		}
		validateLayout(name) {
			if (!im_v2_lib_layout.LayoutManager.getInstance().isValidLayout(name)) {
				return im_v2_const.Layout.chat;
			}
			return name;
		}
		#isSameLayoutPayload(previousLayout, newLayout) {
			return this.#isSameLayout(previousLayout, newLayout) && previousLayout.entityId === newLayout.entityId && JSON.stringify(previousLayout.params) === JSON.stringify(newLayout.params);
		}
		#isSameLayout(previousLayout, newLayout) {
			return previousLayout.name === newLayout.name;
		}
	}

	const prepareComponentId = componentId => {
		const supportedComponents = Object.values(im_v2_const.MessageComponent);
		if (!supportedComponents.includes(componentId)) {
			return im_v2_const.MessageComponent.unsupported;
		}
		return componentId;
	};
	const prepareAuthorId = (target, currentResult, rawFields) => {
		if (main_core.Type.isString(rawFields.system) && rawFields.system === 'Y') {
			return 0;
		}
		if (main_core.Type.isBoolean(rawFields.isSystem) && rawFields.isSystem === true) {
			return 0;
		}
		return convertToNumber(target);
	};
	const prepareKeyboard = rawKeyboardButtons => {
		return rawKeyboardButtons.map(rawButton => {
			return {
				...rawButton,
				block: rawButton.block === 'Y',
				disabled: rawButton.disabled === 'Y',
				vote: rawButton.vote === 'Y',
				wait: rawButton.wait === 'Y'
			};
		});
	};

	const messageFieldsConfig = [{
		fieldName: ['id', 'temporaryId'],
		targetFieldName: 'id',
		checkFunction: [main_core.Type.isNumber, im_v2_lib_message.MessageManager.isTempMessage]
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'date',
		targetFieldName: 'date',
		checkFunction: [main_core.Type.isString, main_core.Type.isDate],
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'text',
		targetFieldName: 'text',
		checkFunction: isNumberOrString,
		formatFunction: convertToString
	}, {
		fieldName: ['senderId', 'authorId'],
		targetFieldName: 'authorId',
		checkFunction: isNumberOrString,
		formatFunction: prepareAuthorId
	}, {
		fieldName: 'sending',
		targetFieldName: 'sending',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'unread',
		targetFieldName: 'unread',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'viewed',
		targetFieldName: 'viewed',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'viewedByOthers',
		targetFieldName: 'viewedByOthers',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'error',
		targetFieldName: 'error',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'componentId',
		targetFieldName: 'componentId',
		checkFunction: target => {
			return main_core.Type.isString(target) && target !== '';
		},
		formatFunction: prepareComponentId
	}, {
		fieldName: 'componentParams',
		targetFieldName: 'componentParams',
		checkFunction: main_core.Type.isPlainObject
	}, {
		fieldName: ['files', 'fileId'],
		targetFieldName: 'files',
		checkFunction: main_core.Type.isArray
	}, {
		fieldName: 'attach',
		targetFieldName: 'attach',
		checkFunction: [main_core.Type.isArray, main_core.Type.isBoolean, main_core.Type.isString]
	}, {
		fieldName: 'keyboard',
		targetFieldName: 'keyboard',
		checkFunction: main_core.Type.isArray,
		formatFunction: prepareKeyboard
	}, {
		fieldName: 'keyboard',
		targetFieldName: 'keyboard',
		checkFunction: target => target === 'N',
		formatFunction: () => []
	}, {
		fieldName: 'isEdited',
		targetFieldName: 'isEdited',
		checkFunction: main_core.Type.isString,
		formatFunction: target => target === 'Y'
	}, {
		fieldName: 'isEdited',
		targetFieldName: 'isEdited',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'isDeleted',
		targetFieldName: 'isDeleted',
		checkFunction: main_core.Type.isString,
		formatFunction: target => target === 'Y'
	}, {
		fieldName: 'isDeleted',
		targetFieldName: 'isDeleted',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'replyId',
		targetFieldName: 'replyId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'forward',
		targetFieldName: 'forward',
		checkFunction: main_core.Type.isPlainObject
	}];

	function isAnchorsEqual(anchor1, anchor2) {
		return anchor1.messageId === anchor2.messageId && anchor1.type === anchor2.type && anchor1.fromUserId === anchor2.fromUserId;
	}
	function isAnchorWithTypeFromCurrentChat(anchor, anchorType, chatId) {
		return anchor.chatId === chatId && anchor.type === anchorType;
	}

	class AnchorsModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'anchors';
		}
		getState() {
			return {
				anchors: []
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getGetters() {
			return {
				/** @function messages/anchors/getChatMessageIdsWithAnchors */
				getChatMessageIdsWithAnchors: state => chatId => {
					return [...state.anchors].filter(anchor => {
						return anchor.chatId === chatId;
					}).map(anchor => anchor.messageId);
				},
				/** @function messages/anchors/isMessageHasAnchors */
				isMessageHasAnchors: state => messageId => {
					return state.anchors.some(anchor => {
						return anchor.messageId === messageId;
					});
				},
				/** @function messages/anchors/isChatHasAnchors */
				isChatHasAnchors: state => chatId => {
					return state.anchors.some(anchor => {
						return anchor.chatId === chatId;
					});
				},
				/** @function messages/anchors/isChatHasAnchorsWithType */
				isChatHasAnchorsWithType: state => (chatId, anchorType) => {
					return state.anchors.some(anchor => {
						return isAnchorWithTypeFromCurrentChat(anchor, anchorType, chatId);
					});
				},
				/** @function messages/anchors/getCounterInChatByType */
				getCounterInChatByType: state => (chatId, anchorType) => {
					const chatAnchors = state.anchors.filter(anchor => {
						return isAnchorWithTypeFromCurrentChat(anchor, anchorType, chatId);
					});
					return new Set(chatAnchors.map(chatAnchor => chatAnchor.messageId)).size;
				},
				/** @function messages/anchors/getNextMessageIdWithAnchorType */
				getNextMessageIdWithAnchorType: state => (chatId, anchorType) => {
					const anchors = state.anchors.filter(anchor => {
						return isAnchorWithTypeFromCurrentChat(anchor, anchorType, chatId);
					}).sort((anchorOne, anchorTwo) => anchorOne.messageId - anchorTwo.messageId);
					return anchors.at(0)?.messageId;
				},
				/** @function messages/anchors/getAnchorsByChatType */
				getAnchorsByChatType: state => chatType => {
					return state.anchors.filter(anchor => {
						const {
							type
						} = im_v2_application_core.Core.getStore().getters['chats/getByChatId'](anchor.chatId, true);
						return type === chatType;
					});
				}
			};
		}
		getActions() {
			return {
				/** @function messages/anchors/setAnchors */
				setAnchors: (store, payload) => {
					if (main_core.Type.isPlainObject(payload) === false) {
						return;
					}
					store.commit('setAnchors', {
						anchors: payload.anchors
					});
				},
				/** @function messages/anchors/addAnchor */
				addAnchor: (store, payload) => {
					if (main_core.Type.isPlainObject(payload) === false) {
						return;
					}
					const equalAnchor = store.state.anchors.find(anchor => {
						return isAnchorsEqual(anchor, payload.anchor);
					});
					if (!equalAnchor) {
						store.commit('addAnchor', payload);
					}
				},
				/** @function messages/anchors/removeAnchor */
				removeAnchor: (store, payload) => {
					if (main_core.Type.isPlainObject(payload) === false) {
						return;
					}
					store.commit('removeAnchor', payload);
				},
				/** @function messages/anchors/removeUserAnchorsFromMessage */
				removeUserAnchorsFromMessage: (store, messageId) => {
					store.state.anchors.forEach(anchor => {
						if (anchor.messageId === messageId) {
							store.commit('removeAnchor', {
								anchor
							});
						}
					});
				},
				/** @function messages/anchors/removeChatAnchors */
				removeChatAnchors: (store, chatId) => {
					store.commit('removeChatAnchors', chatId);
				},
				/** @function messages/anchors/removeAllAnchorsByRecentType */
				removeAllAnchorsByRecentType: (store, payload) => {
					store.commit('removeAllAnchorsByRecentType', payload);
				},
				/** @function messages/anchors/removeAllAnchors */
				removeAllAnchors: store => {
					store.commit('removeAllAnchors');
				}
			};
		}
		getMutations() {
			return {
				setAnchors: (state, payload) => {
					// eslint-disable-next-line no-param-reassign
					state.anchors = [...payload.anchors];
				},
				addAnchor: (state, payload) => {
					state.anchors.push(payload.anchor);
				},
				removeAnchor: (state, payload) => {
					const removedAnchorIndex = state.anchors.findIndex(anchor => {
						return isAnchorsEqual(anchor, payload.anchor);
					});
					if (removedAnchorIndex > -1) {
						state.anchors.splice(removedAnchorIndex, 1);
					}
				},
				removeChatAnchors: (state, chatId) => {
					// eslint-disable-next-line no-param-reassign
					state.anchors = state.anchors.filter(anchor => {
						return anchor.chatId !== chatId;
					});
				},
				removeAllAnchorsByRecentType: (state, payload) => {
					const {
						recentType,
						parentChatId
					} = payload;
					if (parentChatId === im_v2_const.ParentChatScope.all) {
						// eslint-disable-next-line no-param-reassign
						state.anchors = state.anchors.filter(anchor => {
							return !anchor.recentSections.includes(recentType);
						});
						return;
					}

					// eslint-disable-next-line no-param-reassign
					state.anchors = state.anchors.filter(anchor => {
						return anchor.parentChatId !== parentChatId || !anchor.recentSections.includes(recentType);
					});
				},
				removeAllAnchors: state => {
					// eslint-disable-next-line no-param-reassign
					state.anchors = [];
				}
			};
		}
	}

	const commentFieldsConfig = [{
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'lastUserIds',
		targetFieldName: 'lastUserIds',
		checkFunction: main_core.Type.isArray
	}, {
		fieldName: 'messageCount',
		targetFieldName: 'messageCount',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'isUserSubscribed',
		targetFieldName: 'isUserSubscribed',
		checkFunction: main_core.Type.isBoolean
	}];

	const LAST_USERS_TO_SHOW = 3;
	class CommentsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {},
				layout: {
					opened: false,
					channelDialogId: '',
					postId: 0
				}
			};
		}
		getElementState() {
			return {
				chatId: 0,
				lastUserIds: [],
				messageCount: 0,
				messageId: 0,
				isUserSubscribed: false
			};
		}
		getGetters() {
			return {
				/** @function messages/comments/getByMessageId */
				getByMessageId: state => messageId => {
					return state.collection[messageId] ?? this.getElementState();
				},
				/** @function messages/comments/getMessageIdByChatId */
				getMessageIdByChatId: state => chatId => {
					const collection = Object.values(state.collection);
					const foundItem = collection.find(item => {
						return item.chatId === chatId;
					});
					return foundItem?.messageId;
				},
				/** @function messages/comments/isUserSubscribed */
				isUserSubscribed: state => messageId => {
					const element = state.collection[messageId];
					if (!element && this.#isMessageAuthor(messageId)) {
						return true;
					}
					return element?.isUserSubscribed ?? false;
				},
				/** @function messages/comments/areOpened */
				areOpened: state => {
					return state.layout.opened;
				},
				/** @function messages/comments/areOpenedForChannel */
				areOpenedForChannel: state => channelDialogId => {
					return state.layout.channelDialogId === channelDialogId;
				},
				/** @function messages/comments/areOpenedForChannelPost */
				areOpenedForChannelPost: state => postId => {
					return state.layout.postId === postId;
				},
				/** @function messages/comments/getOpenedChannelId */
				getOpenedChannelId: state => {
					return state.layout.channelDialogId ?? '';
				}
			};
		}
		getActions() {
			return {
				/** @function messages/comments/set */
				set: (store, rawPayload) => {
					let payload = rawPayload;
					if (!payload) {
						return;
					}
					if (!Array.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					payload = payload.map(item => {
						const currentItem = store.state.collection[item.messageId];
						if (currentItem) {
							return {
								...currentItem,
								...this.#formatFields(item)
							};
						}
						return {
							...this.getElementState(),
							isUserSubscribed: this.#isMessageAuthor(item.messageId),
							...this.#formatFields(item)
						};
					});
					store.commit('set', payload);
				},
				/** @function messages/comments/setLastUser */
				setLastUser: (store, payload) => {
					const {
						messageId,
						newUserId
					} = payload;
					const currentItem = store.state.collection[messageId];
					if (!currentItem || newUserId === 0) {
						return;
					}
					store.commit('setLastUser', payload);
				},
				/** @function messages/comments/subscribe */
				subscribe: (store, messageId) => {
					im_v2_application_core.Core.getStore().dispatch('messages/comments/set', {
						messageId,
						isUserSubscribed: true
					});
				},
				/** @function messages/comments/unsubscribe */
				unsubscribe: (store, messageId) => {
					im_v2_application_core.Core.getStore().dispatch('messages/comments/set', {
						messageId,
						isUserSubscribed: false
					});
				},
				/** @function messages/comments/setOpened */
				setOpened: (store, payload) => {
					store.commit('setOpened', payload);
				},
				/** @function messages/comments/setClosed */
				setClosed: store => {
					store.commit('setClosed');
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				set: (state, payload) => {
					payload.forEach(item => {
						state.collection[item.messageId] = item;
					});
				},
				setLastUser: (state, payload) => {
					const {
						messageId,
						newUserId
					} = payload;
					const {
						lastUserIds: currentUsers
					} = state.collection[messageId];
					if (currentUsers.includes(newUserId)) {
						return;
					}
					if (currentUsers.length < LAST_USERS_TO_SHOW) {
						currentUsers.unshift(newUserId);
						return;
					}
					currentUsers.pop();
					currentUsers.unshift(newUserId);
				},
				setOpened: (state, payload) => {
					const {
						channelDialogId,
						commentsPostId
					} = payload;
					state.layout = {
						opened: true,
						channelDialogId,
						postId: commentsPostId
					};
				},
				setClosed: state => {
					state.layout = {
						opened: false,
						channelDialogId: '',
						commentsPostId: 0
					};
				}
			};
		}
		#formatFields(fields) {
			return im_v2_model.formatFieldsWithConfig(fields, commentFieldsConfig);
		}
		#isMessageAuthor(messageId) {
			const message = im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
			return message?.authorId === im_v2_application_core.Core.getUserId();
		}
	}

	const prepareSources = (target, config) => {
		const result = {};
		for (const [key, value] of Object.entries(target)) {
			if (main_core.Type.isPlainObject(value)) {
				result[key] = im_v2_model.formatFieldsWithConfig(value, config);
			}
		}
		return result;
	};

	const builderFieldsConfig = [{
		fieldName: 'config',
		targetFieldName: 'config',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => formatFieldsWithConfig(target, configFieldsConfig)
	}, {
		fieldName: 'elements',
		targetFieldName: 'elements',
		checkFunction: main_core.Type.isArray,
		formatFunction: target => {
			return target.map(block => formatFieldsWithConfig(block, blocksBuilderFieldsConfig));
		}
	}];
	const configFieldsConfig = [{
		fieldName: 'background',
		targetFieldName: 'background',
		checkFunction: main_core.Type.isString
	}];
	const blocksBuilderFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: isNumberOrString
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'text',
		targetFieldName: 'text',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'color',
		targetFieldName: 'color',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'size',
		targetFieldName: 'size',
		checkFunction: isNumberOrString
	}, {
		fieldName: 'imageUrl',
		targetFieldName: 'imageUrl',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'icon',
		targetFieldName: 'icon',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => formatFieldsWithConfig(target, iconFieldsConfig)
	}, {
		fieldName: 'status',
		targetFieldName: 'status',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'elements',
		targetFieldName: 'elements',
		checkFunction: main_core.Type.isArray,
		formatFunction: target => {
			return target.map(block => formatFieldsWithConfig(block, blocksBuilderFieldsConfig));
		}
	}, {
		fieldName: 'sources',
		targetFieldName: 'sources',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => prepareSources(target, sourceItemFieldsConfig)
	}, {
		fieldName: 'fold',
		targetFieldName: 'fold',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => formatFieldsWithConfig(target, foldFieldsConfig)
	}, {
		fieldName: 'buttons',
		targetFieldName: 'buttons',
		checkFunction: main_core.Type.isArray,
		formatFunction: target => {
			return target.map(row => row.map(button => {
				return formatFieldsWithConfig(button, buttonFieldsConfig);
			}));
		}
	}, {
		fieldName: 'rows',
		targetFieldName: 'rows',
		checkFunction: main_core.Type.isArray,
		formatFunction: row => {
			return row.map(column => {
				return column.map(block => formatFieldsWithConfig(block, blocksBuilderFieldsConfig));
			});
		}
	}, {
		fieldName: 'fileIds',
		targetFieldName: 'fileIds',
		checkFunction: main_core.Type.isArray
	}];
	const iconFieldsConfig = [{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'color',
		targetFieldName: 'color',
		checkFunction: main_core.Type.isString
	}];
	const buttonFieldsConfig = [{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'url',
		targetFieldName: 'url',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'design',
		targetFieldName: 'design',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'actionId',
		targetFieldName: 'actionId',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'actionParams',
		targetFieldName: 'actionParams',
		checkFunction: main_core.Type.isPlainObject
	}];
	const sourceItemFieldsConfig = [{
		fieldName: 'url',
		targetFieldName: 'url',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'metaData',
		targetFieldName: 'metaData',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => formatFieldsWithConfig(target, sourceMetaDataFieldsConfig)
	}];
	const sourceMetaDataFieldsConfig = [{
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'description',
		targetFieldName: 'description',
		checkFunction: main_core.Type.isString
	}];
	const foldFieldsConfig = [{
		fieldName: 'isOpened',
		targetFieldName: 'isOpened',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: main_core.Type.isString
	}];

	class MessageBuilderModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'messageBuilder';
		}
		getState() {
			return {
				builderCollection: new Map(),
				blockCollection: new Map()
			};
		}
		getBuilderElementState() {
			return {
				background: null
			};
		}
		getBlockElementState() {
			return {
				id: '',
				type: '',
				text: ''
			};
		}
		getGetters() {
			return {
				/** @function messages/builder/hasBlocks */
				hasBlocks: state => messageId => {
					return main_core.Type.isArrayFilled(state.blockCollection.get(messageId));
				},
				/** @function messages/builder/getBlocks */
				getBlocks: state => messageId => {
					return state.blockCollection.get(messageId) ?? [];
				},
				/** @function messages/builder/getParams */
				getParams: state => messageId => {
					return state.builderCollection.get(messageId) ?? {
						background: null
					};
				},
				/** @function messages/builder/forceBackground */
				forceBackground: state => messageId => {
					const params = state.builderCollection.get(messageId);
					return params?.background === im_v2_const.MessageBuilderBackgroundPlainToken;
				}
			};
		}
		getActions() {
			return {
				/** @function messages/builder/set */
				set: (store, rawMessages) => {
					const messages = main_core.Type.isArray(rawMessages) ? rawMessages : [rawMessages];
					const builderMessages = messages.filter(message => message.block);
					builderMessages.forEach(builderMessage => {
						const {
							id: messageId,
							block
						} = builderMessage;
						const preparedBuilder = this.#formatFields(block);
						const {
							elements,
							config
						} = preparedBuilder;
						store.commit('addBuilder', {
							messageId,
							params: {
								...this.getBuilderElementState(),
								...config
							}
						});
						const preparedBlocks = elements.map(element => {
							return {
								...this.getBlockElementState(),
								...element
							};
						});
						store.commit('addBlocks', {
							messageId,
							blocks: preparedBlocks
						});
					});
				},
				/** @function messages/builder/appendBlock */
				appendBlock: (store, payload) => {
					const {
						messageId,
						block
					} = payload;
					const preparedBlock = this.#formatBlock(block);
					store.commit('appendBlock', {
						messageId,
						block: preparedBlock
					});
				},
				/** @function messages/builder/updateBlock */
				updateBlock: (store, payload) => {
					const {
						messageId,
						blockId,
						block
					} = payload;
					const preparedBlock = this.#formatBlock(block);
					store.commit('updateBlock', {
						messageId,
						blockId,
						block: preparedBlock
					});
				},
				/** @function messages/builder/deleteBlock */
				deleteBlock: (store, payload) => {
					const {
						messageId,
						blockId
					} = payload;
					store.commit('deleteBlock', {
						messageId,
						blockId
					});
				},
				/** @function messages/builder/updateWithId */
				updateWithId: (store, payload) => {
					const {
						oldId,
						newId
					} = payload;
					if (!store.state.blockCollection.has(oldId) && !store.state.builderCollection.has(oldId)) {
						return;
					}
					store.commit('updateWithId', {
						oldId,
						newId
					});
				}
			};
		}
		getMutations() {
			return {
				addBuilder: (state, payload) => {
					const {
						messageId,
						params
					} = payload;
					state.builderCollection.set(messageId, params);
				},
				addBlocks: (state, payload) => {
					const {
						messageId,
						blocks
					} = payload;
					state.blockCollection.set(messageId, blocks);
				},
				appendBlock: (state, payload) => {
					const {
						messageId,
						block
					} = payload;
					const blocks = state.blockCollection.get(messageId) ?? [];
					blocks.push(block);
					state.blockCollection.set(messageId, blocks);
				},
				updateBlock: (state, payload) => {
					const {
						messageId,
						blockId,
						block
					} = payload;
					const blocks = state.blockCollection.get(messageId);
					if (!blocks) {
						return;
					}
					const index = blocks.findIndex(item => item.id === blockId);
					if (index === -1) {
						return;
					}
					blocks.splice(index, 1, block);
				},
				deleteBlock: (state, payload) => {
					const {
						messageId,
						blockId
					} = payload;
					const blocks = state.blockCollection.get(messageId);
					if (!blocks) {
						return;
					}
					const filtered = blocks.filter(item => item.id !== blockId);
					state.blockCollection.set(messageId, filtered);
				},
				updateWithId: (state, payload) => {
					const {
						oldId,
						newId
					} = payload;
					if (state.blockCollection.has(oldId)) {
						state.blockCollection.set(newId, state.blockCollection.get(oldId));
						state.blockCollection.delete(oldId);
					}
					if (state.builderCollection.has(oldId)) {
						state.builderCollection.set(newId, state.builderCollection.get(oldId));
						state.builderCollection.delete(oldId);
					}
				}
			};
		}
		#formatFields(item) {
			return im_v2_model.formatFieldsWithConfig(item, builderFieldsConfig);
		}
		#formatBlock(block) {
			return {
				...this.getBlockElementState(),
				...im_v2_model.formatFieldsWithConfig(block, blocksBuilderFieldsConfig)
			};
		}
	}

	class PinModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getGetters() {
			return {
				getPinned: state => chatId => {
					if (!state.collection[chatId]) {
						return [];
					}
					const result = [];
					[...state.collection[chatId]].forEach(pinnedMessageId => {
						const message = im_v2_application_core.Core.getStore().getters['messages/getById'](pinnedMessageId);
						if (message) {
							result.push(message);
						}
					});
					return result;
				},
				isPinned: state => payload => {
					const {
						chatId,
						messageId
					} = payload;
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].has(messageId);
				}
			};
		}
		getActions() {
			return {
				setPinned: (store, payload) => {
					const {
						chatId,
						pinnedMessages
					} = payload;
					if (pinnedMessages.length === 0) {
						return;
					}
					store.commit('setPinned', {
						chatId,
						pinnedMessageIds: pinnedMessages
					});
				},
				set: (store, payload) => {
					store.commit('set', payload);
				},
				add: (store, payload) => {
					store.commit('add', payload);
				},
				delete: (store, payload) => {
					store.commit('delete', payload);
				}
			};
		}
		getMutations() {
			return {
				setPinned: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Messages/pin model: setPinned mutation', payload);
					const {
						chatId,
						pinnedMessageIds
					} = payload;
					state.collection[chatId] = new Set(pinnedMessageIds.reverse());
				},
				add: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Messages/pin model: add pin mutation', payload);
					const {
						chatId,
						messageId
					} = payload;
					if (!state.collection[chatId]) {
						state.collection[chatId] = new Set();
					}
					state.collection[chatId].add(messageId);
				},
				delete: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Messages/pin model: delete pin mutation', payload);
					const {
						chatId,
						messageId
					} = payload;
					if (!state.collection[chatId]) {
						return;
					}
					state.collection[chatId].delete(messageId);
				}
			};
		}
	}

	const USERS_TO_SHOW = 5;
	class ReactionsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				reactionCounters: {},
				reactionUsers: {},
				ownReactions: new Set()
			};
		}
		getGetters() {
			return {
				/** @function messages/reactions/getByMessageId */
				getByMessageId: state => messageId => {
					return state.collection[messageId];
				}
			};
		}
		getActions() {
			return {
				/** @function messages/reactions/set */
				set: (store, payload) => {
					store.commit('set', this.prepareSetPayload(payload));
				},
				/** @function messages/reactions/setReaction */
				setReaction: (store, payload) => {
					store.commit('setReaction', payload);
				},
				/** @function messages/reactions/removeReaction */
				removeReaction: (store, payload) => {
					if (!store.state.collection[payload.messageId]) {
						return;
					}
					store.commit('removeReaction', payload);
				},
				/** @function messages/reactions/clearCollection */
				clearCollection: store => {
					store.commit('clearCollection');
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				set: (state, payload) => {
					payload.forEach(item => {
						const currentItem = state.collection[item.messageId];
						const currentOwnReactions = currentItem ? currentItem.ownReactions : [];
						const newOwnReactions = item.ownReactions ?? [];
						const preparedOwnReactions = new Set([...newOwnReactions, ...currentOwnReactions]);
						if (item.ownReactionsToRemove) {
							item.ownReactionsToRemove.forEach(reactionToRemove => {
								preparedOwnReactions.delete(reactionToRemove);
							});
						}
						state.collection[item.messageId] = {
							reactionCounters: item.reactionCounters,
							reactionUsers: item.reactionUsers,
							ownReactions: preparedOwnReactions
						};
					});
				},
				setReaction: (state, payload) => {
					const {
						messageId,
						userId,
						reaction
					} = payload;
					if (!state.collection[messageId]) {
						state.collection[messageId] = this.getElementState();
					}
					const reactions = state.collection[messageId];
					if (im_v2_application_core.Core.getUserId() === userId) {
						reactions.ownReactions.add(reaction);
					}
					if (!reactions.reactionCounters[reaction]) {
						reactions.reactionCounters[reaction] = 0;
					}
					const currentReactionCounter = reactions.reactionCounters[reaction];
					const newReactionCounter = currentReactionCounter + 1;
					if (newReactionCounter <= USERS_TO_SHOW) {
						this.addUserToReaction(reactions, payload);
					}
					reactions.reactionCounters[reaction] = newReactionCounter;
				},
				removeReaction: (state, payload) => {
					const {
						messageId,
						userId,
						reaction
					} = payload;
					const reactions = state.collection[messageId];
					if (im_v2_application_core.Core.getUserId() === userId) {
						reactions.ownReactions.delete(reaction);
					}
					reactions.reactionUsers[reaction]?.delete(userId);
					reactions.reactionCounters[reaction]--;
					if (reactions.reactionCounters[reaction] === 0) {
						delete reactions.reactionCounters[reaction];
					}
				},
				clearCollection: state => {
					state.collection = {};
				}
			};
		}
		addUserToReaction(reactions, payload) {
			const {
				userId,
				reaction
			} = payload;
			if (!reactions.reactionUsers[reaction]) {
				reactions.reactionUsers[reaction] = new Set();
			}
			reactions.reactionUsers[reaction].add(userId);
		}
		prepareSetPayload(payload) {
			return payload.map(item => {
				const reactionUsers = {};
				Object.entries(item.reactionUsers).forEach(([reaction, users]) => {
					reactionUsers[reaction] = new Set(users);
				});
				return {
					...item,
					reactionUsers
				};
			});
		}
	}

	class SelectModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getGetters() {
			return {
				/** @function messages/select/getCollection */
				getCollection: state => dialogId => {
					if (!state.collection[dialogId]) {
						return null;
					}
					const preparedCollection = [...state.collection[dialogId]];
					const filteredMessageIds = preparedCollection.filter(messageId => {
						return im_v2_application_core.Core.getStore().getters['messages/isExists'](messageId);
					});
					return new Set(filteredMessageIds);
				},
				/** @function messages/select/isBulkActionsModeActive */
				isBulkActionsModeActive: state => dialogId => {
					return Boolean(state.collection[dialogId]);
				},
				/** @function messages/select/isMessageSelected */
				isMessageSelected: state => (messageId, dialogId) => {
					if (!state.collection[dialogId]) {
						return false;
					}
					return state.collection[dialogId].has(messageId);
				}
			};
		}
		getActions() {
			return {
				/** @function messages/select/enableBulkMode */
				enableBulkMode: (store, payload) => {
					const {
						messageId,
						dialogId
					} = payload;
					if (store.state.collection[dialogId]) {
						return;
					}
					store.commit('enableBulkMode', {
						messageId,
						dialogId
					});
				},
				/** @function messages/select/disableBulkMode */
				disableBulkMode: (store, payload) => {
					const {
						dialogId
					} = payload;
					if (!store.state.collection[dialogId]) {
						return;
					}
					store.commit('disableBulkMode', {
						dialogId
					});
				},
				/** @function messages/select/toggleMessageSelection */
				toggleMessageSelection: (store, payload) => {
					const {
						messageId,
						dialogId
					} = payload;
					if (!store.state.collection[dialogId]) {
						return;
					}
					store.commit('toggleMessageSelection', {
						messageId,
						dialogId
					});
				},
				/** @function messages/select/clearCollection */
				clearCollection: store => {
					store.commit('clearCollection');
				}
			};
		}
		getMutations() {
			return {
				enableBulkMode: (state, payload) => {
					const {
						messageId,
						dialogId
					} = payload;

					// eslint-disable-next-line no-param-reassign
					state.collection[dialogId] = new Set();
					state.collection[dialogId].add(messageId);
				},
				disableBulkMode: (state, payload) => {
					const {
						dialogId
					} = payload;

					// eslint-disable-next-line no-param-reassign
					delete state.collection[dialogId];
				},
				toggleMessageSelection: (state, payload) => {
					const {
						messageId,
						dialogId
					} = payload;
					if (state.collection[dialogId].has(messageId)) {
						state.collection[dialogId].delete(messageId);
						return;
					}
					state.collection[dialogId].add(messageId);
				},
				clearCollection: state => {
					// eslint-disable-next-line no-param-reassign
					state.collection = {};
				}
			};
		}
	}

	let MessagesModel$1 = class MessagesModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'messages';
		}
		getNestedModules() {
			return {
				pin: PinModel,
				reactions: ReactionsModel,
				comments: CommentsModel,
				select: SelectModel,
				anchors: AnchorsModel,
				builder: MessageBuilderModel
			};
		}
		getState() {
			return {
				collection: {},
				chatCollection: {},
				loadingMessages: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				chatId: 0,
				authorId: 0,
				replyId: 0,
				date: new Date(),
				text: '',
				files: [],
				attach: [],
				keyboard: [],
				unread: false,
				viewed: true,
				viewedByOthers: false,
				sending: false,
				error: false,
				componentId: im_v2_const.MessageComponent.default,
				componentParams: {},
				forward: {
					id: '',
					userId: 0
				},
				isEdited: false,
				isDeleted: false
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getGetters() {
			return {
				/** @function messages/getByChatId */
				getByChatId: (state, getters) => chatId => {
					if (!state.chatCollection[chatId]) {
						return [];
					}
					const fakeFirstMessage = {
						id: this.#makeFakePreviousSiblingId(chatId)
					};
					const firstLoadingMessages = this.#findNextLoadingMessages(fakeFirstMessage, getters);
					return [...state.chatCollection[chatId]].map(messageId => {
						return state.collection[messageId];
					}).sort(this.#sortCollection).reduce((acc, message) => {
						acc.push(message, ...this.#findNextLoadingMessages(message, getters));
						return acc;
					}, [...firstLoadingMessages]);
				},
				/** @function messages/getById */
				getById: state => id => {
					return state.collection[id];
				},
				/** @function messages/getByIdList */
				getByIdList: state => idList => {
					const result = [];
					idList.forEach(id => {
						if (state.collection[id]) {
							result.push(state.collection[id]);
						}
					});
					return result;
				},
				/** @function messages/hasMessage */
				hasMessage: state => ({
					chatId,
					messageId
				}) => {
					if (!state.chatCollection[chatId]) {
						return false;
					}
					return state.chatCollection[chatId].has(messageId);
				},
				/** @function messages/isForward */
				isForward: state => id => {
					const message = state.collection[id];
					if (!message) {
						return false;
					}
					return main_core.Type.isStringFilled(message.forward.id);
				},
				/** @function messages/isVideoNote */
				isVideoNote: (state, getters) => id => {
					const message = state.collection[id];
					if (!message) {
						return false;
					}
					return getters.getMessageFiles(id).some(file => file.isVideoNote);
				},
				/** @function messages/isExists */
				isExists: state => id => {
					const message = state.collection[id];
					return message && !message.isDeleted;
				},
				/** @function messages/isInChatCollection */
				isInChatCollection: state => payload => {
					const {
						messageId
					} = payload;
					const message = state.collection[messageId];
					if (!message) {
						return false;
					}
					const {
						chatId
					} = message;
					return state.chatCollection[chatId]?.has(messageId);
				},
				/** @function messages/getFirstId */
				getFirstId: state => chatId => {
					if (!state.chatCollection[chatId]) {
						return 0;
					}
					return this.#findLowestMessageId(state, chatId);
				},
				/** @function messages/getLastId */
				getLastId: state => chatId => {
					if (!state.chatCollection[chatId]) {
						return 0;
					}
					return this.#findMaxMessageId(state, chatId);
				},
				/** @function messages/getLastOwnMessageId */
				getLastOwnMessageId: state => chatId => {
					if (!state.chatCollection[chatId]) {
						return 0;
					}
					return this.#findLastOwnMessageId(state, chatId);
				},
				/** @function messages/getFirstUnread */
				getFirstUnread: state => chatId => {
					if (!state.chatCollection[chatId]) {
						return 0;
					}
					return this.#findFirstUnread(state, chatId);
				},
				/** @function messages/getChatUnreadMessages */
				getChatUnreadMessages: state => chatId => {
					if (!state.chatCollection[chatId]) {
						return [];
					}
					const messages = [...state.chatCollection[chatId]].map(messageId => {
						return state.collection[messageId];
					});
					return messages.filter(message => {
						return message.unread === true;
					});
				},
				/** @function messages/getMessageFiles */
				getMessageFiles: state => payload => {
					const messageId = payload;
					if (!state.collection[messageId]) {
						return [];
					}
					return state.collection[messageId].files.map(fileId => {
						return this.store.getters['files/get'](fileId, true);
					});
				},
				/** @function messages/getMessageType */
				getMessageType: state => messageId => {
					const message = state.collection[messageId];
					if (!message) {
						return null;
					}
					const currentUserId = im_v2_application_core.Core.getUserId();
					if (message.authorId === 0) {
						return im_v2_const.MessageType.system;
					}
					if (message.authorId === currentUserId) {
						return im_v2_const.MessageType.self;
					}
					return im_v2_const.MessageType.opponent;
				},
				/** @function messages/getPreviousMessage */
				getPreviousMessage: state => payload => {
					const {
						messageId,
						chatId
					} = payload;
					const message = state.collection[messageId];
					if (!message) {
						return null;
					}
					const chatCollection = [...state.chatCollection[chatId]];
					const initialMessageIndex = chatCollection.indexOf(messageId);
					const desiredMessageId = chatCollection[initialMessageIndex - 1];
					if (!desiredMessageId) {
						return null;
					}
					return state.collection[desiredMessageId];
				},
				/** @function messages/findPreviousMessageId */
				findPreviousMessageId: (state, getters) => payload => {
					const chatCollection = getters.getByChatId(payload.chatId);
					const currentMessageIndex = chatCollection.findIndex(message => {
						return message.id === payload.messageId;
					});
					if (currentMessageIndex > 0) {
						return chatCollection[currentMessageIndex - 1].id;
					}

					// Nothing precedes the message: anchor to the same fake id getByChatId starts the loading
					// chain from, otherwise a re-anchored loading message stays in the store but leaves the feed
					return this.#makeFakePreviousSiblingId(payload.chatId);
				},
				/** @function messages/findLastChatMessageId */
				findLastChatMessageId: (state, getters) => chatId => {
					const lastMessage = getters.getByChatId(chatId).pop();
					if (lastMessage) {
						return lastMessage.id;
					}
					return null;
				},
				/** @function messages/hasLoadingMessageByPreviousSiblingId */
				hasLoadingMessageByPreviousSiblingId: state => messageId => {
					return Boolean(state.loadingMessages[messageId]);
				},
				/** @function messages/getLoadingMessageByPreviousSiblingId */
				getLoadingMessageByPreviousSiblingId: state => messageId => {
					return state.loadingMessages[messageId] ?? null;
				},
				/** @function messages/getLoadingMessageByMessageId */
				getLoadingMessageByMessageId: state => messageId => {
					const message = Object.values(state.loadingMessages).find(currentMessage => {
						return currentMessage.id === messageId;
					});
					if (message) {
						return message;
					}
					return null;
				},
				/** @function messages/hasLoadingMessageByMessageId */
				hasLoadingMessageByMessageId: (state, getters) => messageId => {
					return getters.getLoadingMessageByMessageId(messageId) !== null;
				},
				/** @function messages/isRealMessage */
				isRealMessage: () => messageId => {
					return !im_v2_lib_message.MessageManager.isTempMessage(messageId);
				}
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getActions() {
			return {
				/** @function messages/setChatCollection */
				setChatCollection: (store, payload) => {
					let {
						messages,
						clearCollection
					} = payload;
					clearCollection = clearCollection ?? false;
					if (!Array.isArray(messages) && main_core.Type.isPlainObject(messages)) {
						messages = [messages];
					}
					messages = messages.map(message => {
						return this.#prepareMessage(store, message);
					});
					const chatId = messages[0]?.chatId;
					if (chatId && clearCollection) {
						store.commit('clearCollection', {
							chatId
						});
					}
					store.commit('store', {
						messages
					});
					store.commit('setChatCollection', {
						messages
					});
					this.store.dispatch('copilot/chats/checkMessagesForAiContent', {
						messages
					});
				},
				/** @function messages/store */
				store: (store, payload) => {
					let preparedMessages = payload;
					if (main_core.Type.isPlainObject(payload)) {
						preparedMessages = [payload];
					}
					preparedMessages = preparedMessages.map(message => {
						return this.#prepareMessage(store, message);
					});
					if (preparedMessages.length === 0) {
						return;
					}
					store.commit('store', {
						messages: preparedMessages
					});
					this.store.dispatch('copilot/chats/checkMessagesForAiContent', {
						messages: preparedMessages
					});
				},
				/** @function messages/add */
				add: (store, payload) => {
					const message = {
						...this.getElementState(),
						...this.#formatFields(payload)
					};
					store.commit('store', {
						messages: [message]
					});
					store.commit('setChatCollection', {
						messages: [message]
					});
					this.store.dispatch('copilot/chats/checkMessagesForAiContent', {
						messages: [message]
					});
					return message.id;
				},
				/** @function messages/updateWithId */
				updateWithId: (store, payload) => {
					const {
						id,
						fields
					} = payload;
					if (!store.state.collection[id]) {
						return;
					}
					store.commit('updateWithId', {
						id,
						fields: this.#formatFields(fields)
					});
				},
				/** @function messages/update */
				update: (store, payload) => {
					const {
						id,
						fields
					} = payload;
					const currentMessage = store.state.collection[id];
					if (!currentMessage) {
						return;
					}
					store.commit('update', {
						id,
						fields: {
							...currentMessage,
							...this.#formatFields(fields)
						}
					});
				},
				/** @function messages/readMessages */
				readMessages: (store, payload) => {
					const {
						chatId,
						messageIds,
						exact = false
					} = payload;
					if (!store.state.chatCollection[chatId]) {
						return 0;
					}
					const chatMessages = [...store.state.chatCollection[chatId]].map(messageId => {
						return store.state.collection[messageId];
					});
					let messagesToReadCount = 0;
					// exact (Feed->IM exact read): clear unread for EXACTLY the given messages,
					// no sweep up to max(ID) — other unread (including human messages) stays untouched.
					// Without the flag — prior behavior (range up to max), graceful degradation for old backend.
					const exactIds = exact ? new Set(messageIds) : null;
					const maxMessageId = exact ? null : this.#getMaxMessageId(messageIds);
					const messageIdsToView = messageIds;
					const messageIdsToRead = [];
					chatMessages.forEach(chatMessage => {
						if (!chatMessage.unread) {
							return;
						}
						const shouldRead = exact ? exactIds.has(chatMessage.id) : chatMessage.id <= maxMessageId;
						if (shouldRead) {
							messagesToReadCount++;
							messageIdsToRead.push(chatMessage.id);
						}
					});
					store.commit('readMessages', {
						messageIdsToRead,
						messageIdsToView
					});
					return messagesToReadCount;
				},
				/** @function messages/setViewedByOthers */
				setViewedByOthers: (store, payload) => {
					const {
						ids
					} = payload;
					store.commit('setViewedByOthers', {
						ids
					});
				},
				/** @function messages/delete */
				delete: (store, payload) => {
					const {
						id
					} = payload;
					if (!store.state.collection[id]) {
						// the collection entry can already be renamed away by updateWithId while the loading
						// message is still there - it must not outlive its own deletion
						if (store.getters.hasLoadingMessageByMessageId(id)) {
							store.commit('deleteLoadingMessageByMessageId', {
								messageId: id
							});
						}
						return;
					}
					if (store.getters.hasLoadingMessageByPreviousSiblingId(id)) {
						const currentMessage = store.state.collection[id];
						const newPreviousMessageId = store.getters.findPreviousMessageId({
							messageId: currentMessage.id,
							chatId: currentMessage.chatId
						});
						store.commit('updateLoadingMessagePreviousSiblingId', {
							oldId: currentMessage.id,
							newId: newPreviousMessageId
						});
					}
					if (store.getters.hasLoadingMessageByMessageId(id)) {
						store.commit('deleteLoadingMessageByMessageId', {
							messageId: id
						});
					}
					store.commit('delete', {
						id
					});
				},
				/** @function messages/clearChatCollection */
				clearChatCollection: (store, payload) => {
					const {
						chatId
					} = payload;
					store.commit('clearCollection', {
						chatId
					});
				},
				/** @function messages/deleteAttach */
				deleteAttach: (store, payload) => {
					const {
						messageId,
						attachId
					} = payload;
					const message = store.state.collection[messageId];
					if (!message || !main_core.Type.isArray(message.attach)) {
						return;
					}
					const attach = message.attach.filter(attachItem => {
						return attachId !== attachItem.id;
					});
					store.commit('update', {
						id: messageId,
						fields: {
							...message,
							...this.#formatFields({
								attach
							})
						}
					});
				},
				/** @function messages/addLoadingMessage */
				addLoadingMessage: (store, payload) => {
					const message = {
						...this.getElementState(),
						...this.#formatFields(payload.message)
					};
					store.commit('store', {
						messages: [message]
					});
					if (!store.state.chatCollection[message.chatId]) {
						store.commit('initChatCollection', {
							chatId: message.chatId
						});
					}
					const previousSiblingId = (() => {
						const id = store.getters.findLastChatMessageId(message.chatId);
						if (main_core.Type.isNull(id)) {
							return this.#makeFakePreviousSiblingId(message.chatId);
						}
						return id;
					})();
					store.commit('addLoadingMessage', {
						message,
						previousSiblingId
					});
				},
				/** @function messages/deleteLoadingMessageByMessageId */
				deleteLoadingMessageByMessageId: (store, payload) => {
					store.commit('deleteLoadingMessageByMessageId', {
						...payload
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		// eslint-disable-next-line max-lines-per-function
		getMutations() {
			return {
				setChatCollection: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Messages model: setChatCollection mutation', payload);
					payload.messages.forEach(message => {
						if (!state.chatCollection[message.chatId]) {
							state.chatCollection[message.chatId] = new Set();
						}
						state.chatCollection[message.chatId].add(message.id);
					});
				},
				initChatCollection: (state, payload) => {
					if (!state.chatCollection[payload.chatId]) {
						state.chatCollection[payload.chatId] = new Set();
					}
				},
				store: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Messages model: store mutation', payload);
					payload.messages.forEach(message => {
						state.collection[message.id] = message;
					});
				},
				updateWithId: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Messages model: updateWithId mutation', payload);
					const {
						id,
						fields
					} = payload;
					const currentMessage = {
						...state.collection[id]
					};
					delete state.collection[id];
					state.collection[fields.id] = {
						...currentMessage,
						...fields,
						sending: false
					};
					if (state.chatCollection[currentMessage.chatId].has(id)) {
						state.chatCollection[currentMessage.chatId].delete(id);
						state.chatCollection[currentMessage.chatId].add(fields.id);
					}
				},
				update: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Messages model: update mutation', payload);
					const {
						id,
						fields
					} = payload;
					state.collection[id] = {
						...state.collection[id],
						...fields
					};
				},
				delete: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Messages model: delete mutation', payload);
					const {
						id
					} = payload;
					const {
						chatId
					} = state.collection[id];
					state.chatCollection[chatId]?.delete(id);
					delete state.collection[id];
				},
				clearCollection: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Messages model: clear collection mutation', payload.chatId);
					state.chatCollection[payload.chatId] = new Set();
				},
				readMessages: (state, payload) => {
					const {
						messageIdsToRead,
						messageIdsToView
					} = payload;
					messageIdsToRead.forEach(messageId => {
						const message = state.collection[messageId];
						if (!message) {
							return;
						}
						message.unread = false;
					});
					messageIdsToView.forEach(messageId => {
						const message = state.collection[messageId];
						if (!message) {
							return;
						}
						message.viewed = true;
					});
				},
				setViewedByOthers: (state, payload) => {
					const {
						ids
					} = payload;
					ids.forEach(id => {
						const message = state.collection[id];
						if (!message) {
							return;
						}
						const isOwnMessage = message.authorId === im_v2_application_core.Core.getUserId();
						if (!isOwnMessage || message.viewedByOthers) {
							return;
						}
						message.viewedByOthers = true;
					});
				},
				addLoadingMessage: (state, payload) => {
					const {
						message,
						previousSiblingId
					} = payload;
					state.loadingMessages[previousSiblingId] = message;
				},
				deleteLoadingMessageByMessageId: (state, payload) => {
					const entries = Object.entries(state.loadingMessages);
					const entry = entries.find(([, message]) => {
						return message.id === payload.messageId;
					});
					if (entry) {
						const [previousSiblingId] = entry;
						delete state.loadingMessages[previousSiblingId];
					}
				},
				updateLoadingMessagePreviousSiblingId: (state, payload) => {
					const {
						oldId,
						newId
					} = payload;
					const loadingMessage = state.loadingMessages[oldId];
					if (loadingMessage) {
						delete state.loadingMessages[oldId];
						state.loadingMessages[newId] = loadingMessage;
					}
				}
			};
		}
		#findNextLoadingMessages(message, getters) {
			if (getters.hasLoadingMessageByPreviousSiblingId(message.id)) {
				const loadingMessage = getters.getLoadingMessageByPreviousSiblingId(message.id);
				return [loadingMessage, ...this.#findNextLoadingMessages(loadingMessage, getters)];
			}
			return [];
		}

		// Merge with the stored message when it exists: partial payloads (e.g. a recent preview built
		// without read fields) must not reset unread/viewed of a live message to the element defaults.
		#prepareMessage(store, message) {
			const currentMessage = store.state.collection[message.id];
			if (currentMessage) {
				return {
					...currentMessage,
					...this.#formatFields(message)
				};
			}
			return {
				...this.getElementState(),
				...this.#formatFields(message)
			};
		}
		#formatFields(rawFields) {
			const messageParams = main_core.Type.isPlainObject(rawFields.params) ? rawFields.params : {};
			const fields = {
				...rawFields,
				...messageParams
			};
			const formattedFields = im_v2_model.formatFieldsWithConfig(fields, messageFieldsConfig);
			if (this.#needToSwapAuthorId(formattedFields, messageParams)) {
				formattedFields.authorId = this.#prepareSwapAuthorId(formattedFields, messageParams);
			}
			return formattedFields;
		}
		#needToSwapAuthorId(formattedFields, messageParams) {
			const {
				NAME: name,
				USER_ID: userId
			} = messageParams;
			return Boolean(name && userId && formattedFields.authorId);
		}
		#prepareSwapAuthorId(formattedFields, messageParams) {
			const {
				NAME: authorName,
				USER_ID: userId,
				AVATAR: avatar
			} = messageParams;
			const originalAuthorId = formattedFields.authorId;
			const fakeAuthorId = convertToNumber(userId);
			const userManager = new im_v2_lib_user.UserManager();
			const networkId = `${im_v2_const.UserIdNetworkPrefix}-${originalAuthorId}-${fakeAuthorId}`;
			void userManager.setUsersToModel({
				networkId,
				name: authorName,
				avatar: avatar ?? ''
			});
			return networkId;
		}
		#getMaxMessageId(messageIds) {
			let maxMessageId = 0;
			messageIds.forEach(messageId => {
				if (maxMessageId < messageId) {
					maxMessageId = messageId;
				}
			});
			return maxMessageId;
		}
		#findLowestMessageId(state, chatId) {
			let firstId = null;
			const messages = [...state.chatCollection[chatId]];
			for (const messageId of messages) {
				const element = state.collection[messageId];
				if (!firstId) {
					firstId = element.id;
				}
				if (im_v2_lib_message.MessageManager.isTempMessage(element.id)) {
					continue;
				}
				if (element.id < firstId) {
					firstId = element.id;
				}
			}
			return firstId;
		}
		#findMaxMessageId(state, chatId) {
			let lastId = 0;
			const messages = [...state.chatCollection[chatId]];
			for (const messageId of messages) {
				const element = state.collection[messageId];
				if (im_v2_lib_message.MessageManager.isTempMessage(element.id)) {
					continue;
				}
				if (element.id > lastId) {
					lastId = element.id;
				}
			}
			return lastId;
		}
		#findLastOwnMessageId(state, chatId) {
			let lastOwnMessageId = 0;
			const messages = [...state.chatCollection[chatId]].sort((a, z) => z - a);
			for (const messageId of messages) {
				const element = state.collection[messageId];
				if (im_v2_lib_message.MessageManager.isTempMessage(element.id)) {
					continue;
				}
				if (element.authorId === im_v2_application_core.Core.getUserId()) {
					lastOwnMessageId = element.id;
					break;
				}
			}
			return lastOwnMessageId;
		}
		#findFirstUnread(state, chatId) {
			let resultId = 0;
			for (const messageId of state.chatCollection[chatId]) {
				const message = state.collection[messageId];
				if (message.unread) {
					resultId = messageId;
					break;
				}
			}
			return resultId;
		}
		#sortCollection(a, b) {
			if (im_v2_lib_utils.Utils.text.isUuidV4(a.id) && !im_v2_lib_utils.Utils.text.isUuidV4(b.id)) {
				return 1;
			}
			if (!im_v2_lib_utils.Utils.text.isUuidV4(a.id) && im_v2_lib_utils.Utils.text.isUuidV4(b.id)) {
				return -1;
			}
			if (im_v2_lib_utils.Utils.text.isUuidV4(a.id) && im_v2_lib_utils.Utils.text.isUuidV4(b.id)) {
				return a.date.getTime() - b.date.getTime();
			}
			return a.id - b.id;
		}
		#makeFakePreviousSiblingId(chatId) {
			return `${chatId}/-1`;
		}
	};

	const prepareManagerList = managerList => {
		const result = [];
		managerList.forEach(rawUserId => {
			const userId = Number.parseInt(rawUserId, 10);
			if (userId > 0) {
				result.push(userId);
			}
		});
		return result;
	};
	const prepareChatName = chatName => {
		return main_core.Text.decode(chatName.toString());
	};
	const prepareAvatar$1 = avatar => {
		let result = '';
		if (!avatar || avatar.endsWith('/js/im/images/blank.gif')) {
			result = '';
		} else if (avatar.startsWith('http')) {
			result = avatar;
		} else {
			result = im_v2_application_core.Core.getHost() + avatar;
		}
		if (result) {
			result = encodeURI(result);
		}
		return result;
	};
	const prepareMuteStatus = muteList => {
		if (main_core.Type.isArray(muteList)) {
			return muteList.includes(im_v2_application_core.Core.getUserId());
		}
		if (main_core.Type.isPlainObject(muteList)) {
			const currentUserEntry = muteList[im_v2_application_core.Core.getUserId()];
			return currentUserEntry === true;
		}
		return false;
	};
	const prepareLastMessageViews = rawLastMessageViews => {
		const {
			countOfViewers,
			firstViewers: rawFirstViewers = [],
			messageId
		} = rawLastMessageViews;
		let firstViewer = null;
		for (const rawFirstViewer of rawFirstViewers) {
			if (rawFirstViewer.userId === im_v2_application_core.Core.getUserId()) {
				continue;
			}
			firstViewer = {
				userId: rawFirstViewer.userId,
				userName: rawFirstViewer.userName,
				date: im_v2_lib_utils.Utils.date.cast(rawFirstViewer.date)
			};
			break;
		}
		if (countOfViewers > 0 && !firstViewer) {
			throw new Error('Chats model: no first viewer for message');
		}
		return {
			countOfViewers,
			firstViewer,
			messageId
		};
	};

	const chatFieldsConfig$1 = [{
		fieldName: 'dialogId',
		targetFieldName: 'dialogId',
		checkFunction: isNumberOrString,
		formatFunction: convertToString
	}, {
		fieldName: ['id', 'chatId'],
		targetFieldName: 'chatId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'quoteId',
		targetFieldName: 'quoteId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'userCounter',
		targetFieldName: 'userCounter',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'guestCount',
		targetFieldName: 'guestCount',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'lastId',
		targetFieldName: 'lastReadId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'markedId',
		targetFieldName: 'markedId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'lastMessageId',
		targetFieldName: 'lastMessageId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'lastMessageViews',
		targetFieldName: 'lastMessageViews',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: prepareLastMessageViews
	}, {
		fieldName: 'hasPrevPage',
		targetFieldName: 'hasPrevPage',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'hasNextPage',
		targetFieldName: 'hasNextPage',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'savedPositionMessageId',
		targetFieldName: 'savedPositionMessageId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: ['title', 'name'],
		targetFieldName: 'name',
		checkFunction: isNumberOrString,
		formatFunction: prepareChatName
	}, {
		fieldName: ['owner', 'ownerId'],
		targetFieldName: 'ownerId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'avatar',
		targetFieldName: 'avatar',
		checkFunction: main_core.Type.isString,
		formatFunction: prepareAvatar$1
	}, {
		fieldName: 'color',
		targetFieldName: 'color',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'extranet',
		targetFieldName: 'extranet',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'containsCollaber',
		targetFieldName: 'containsCollaber',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'entityLink',
		targetFieldName: 'entityLink',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => {
			return im_v2_model.formatFieldsWithConfig(target, chatEntityFieldsConfig);
		}
	}, {
		fieldName: 'dateCreate',
		targetFieldName: 'dateCreate',
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'public',
		targetFieldName: 'public',
		checkFunction: main_core.Type.isPlainObject
	}, {
		fieldName: 'inputActionList',
		targetFieldName: 'inputActionList',
		checkFunction: main_core.Type.isPlainObject
	}, {
		fieldName: 'managerList',
		targetFieldName: 'managerList',
		checkFunction: main_core.Type.isArray,
		formatFunction: prepareManagerList
	}, {
		fieldName: 'muteList',
		targetFieldName: 'isMuted',
		checkFunction: [main_core.Type.isArray, main_core.Type.isPlainObject],
		formatFunction: prepareMuteStatus
	}, {
		fieldName: 'isMuted',
		targetFieldName: 'isMuted',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'inited',
		targetFieldName: 'inited',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'loading',
		targetFieldName: 'loading',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'description',
		targetFieldName: 'description',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'diskFolderId',
		targetFieldName: 'diskFolderId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'role',
		targetFieldName: 'role',
		checkFunction: main_core.Type.isString,
		formatFunction: target => target.toLowerCase()
	}, {
		fieldName: 'permissions',
		targetFieldName: 'permissions',
		checkFunction: main_core.Type.isPlainObject
	},
	// Phase 0 (task 718250): superadmin project chat access. REST-only field (absent in pull).
	{
		fieldName: 'hasManageCapability',
		targetFieldName: 'hasManageCapability',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'tariffRestrictions',
		targetFieldName: 'tariffRestrictions',
		checkFunction: main_core.Type.isPlainObject
	}, {
		fieldName: 'parentChatId',
		targetFieldName: 'parentChatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'backgroundId',
		targetFieldName: 'backgroundId',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'textFieldEnabled',
		targetFieldName: 'isTextareaEnabled',
		checkFunction: main_core.Type.isBoolean
	}];
	const chatEntityFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'url',
		targetFieldName: 'url',
		checkFunction: main_core.Type.isString
	}];

	const autoDeleteFieldsConfig = [{
		fieldName: 'delay',
		targetFieldName: 'delay',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber
	}];

	class AutoDeleteModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: new Map()
			};
		}
		getGetters() {
			return {
				/** @function chats/autoDelete/isEnabled */
				isEnabled: state => chatId => {
					return state.collection.has(chatId) ?? false;
				},
				/** @function chats/autoDelete/getDelay */
				getDelay: state => chatId => {
					return state.collection.get(chatId) ?? im_v2_const.AutoDeleteDelay.Off;
				}
			};
		}
		getActions() {
			return {
				/** @function chats/autoDelete/set */
				set: (store, rawPayload) => {
					let payload = rawPayload;
					if (!Array.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					payload.forEach(element => {
						const formattedElement = this.#formatFields(element);
						const {
							delay
						} = formattedElement;
						if (delay === im_v2_const.AutoDeleteDelay.Off) {
							store.commit('delete', formattedElement);
							return;
						}
						store.commit('set', formattedElement);
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				set: (state, payload) => {
					const {
						chatId,
						delay
					} = payload;
					state.collection.set(chatId, delay);
				},
				delete: (state, payload) => {
					const {
						chatId
					} = payload;
					state.collection.delete(chatId);
				}
			};
		}
		#formatFields(fields) {
			return im_v2_model.formatFieldsWithConfig(fields, autoDeleteFieldsConfig);
		}
	}

	const collabFieldsConfig = [{
		fieldName: 'collabId',
		targetFieldName: 'collabId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'guestCount',
		targetFieldName: 'guestCount',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'entities',
		targetFieldName: 'entities',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => im_v2_model.formatFieldsWithConfig(target, collabEntitiesFieldConfig)
	}];
	const collabEntitiesFieldConfig = [{
		fieldName: 'tasks',
		targetFieldName: 'tasks',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => im_v2_model.formatFieldsWithConfig(target, collabEntityFieldConfig)
	}, {
		fieldName: 'files',
		targetFieldName: 'files',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => im_v2_model.formatFieldsWithConfig(target, collabEntityFieldConfig)
	}, {
		fieldName: 'calendar',
		targetFieldName: 'calendar',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => im_v2_model.formatFieldsWithConfig(target, collabEntityFieldConfig)
	}];
	const collabEntityFieldConfig = [{
		fieldName: 'counter',
		targetFieldName: 'counter',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'url',
		targetFieldName: 'url',
		checkFunction: main_core.Type.isStringFilled
	}];

	class CollabsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				collabId: 0,
				guestCount: 0,
				entities: {
					tasks: {
						counter: 0,
						url: ''
					},
					files: {
						counter: 0,
						url: ''
					},
					calendar: {
						counter: 0,
						url: ''
					}
				}
			};
		}
		getGetters() {
			return {
				/** @function chats/collabs/getByChatId */
				getByChatId: state => chatId => {
					return state.collection[chatId] ?? this.getElementState();
				}
			};
		}
		getActions() {
			return {
				/** @function chats/collabs/set */
				set: (store, payload) => {
					const {
						chatId,
						collabInfo
					} = payload;
					if (!main_core.Type.isPlainObject(collabInfo)) {
						return;
					}
					store.commit('set', {
						chatId,
						collabInfo: this.#formatFields(collabInfo)
					});
				},
				/** @function chats/collabs/setCounter */
				setCounter: (store, payload) => {
					const {
						chatId,
						entity,
						counter
					} = payload;
					const state = store.state;
					const currentRecord = state.collection[chatId];
					if (!currentRecord || !currentRecord.entities[entity]) {
						return;
					}
					store.commit('setCounter', {
						chatId,
						entity,
						counter
					});
				},
				/** @function chats/collabs/setGuestCount */
				setGuestCount: (store, payload) => {
					const {
						chatId,
						guestCount
					} = payload;
					const state = store.state;
					const currentRecord = state.collection[chatId];
					if (!currentRecord) {
						return;
					}
					store.commit('setGuestCount', {
						chatId,
						guestCount
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				set: (state, payload) => {
					const {
						chatId,
						collabInfo
					} = payload;
					state.collection[chatId] = collabInfo;
				},
				setCounter: (state, payload) => {
					const {
						chatId,
						entity,
						counter
					} = payload;
					const currentRecord = state.collection[chatId];
					currentRecord.entities[entity].counter = counter;
				},
				setGuestCount: (state, payload) => {
					const {
						chatId,
						guestCount
					} = payload;
					const currentRecord = state.collection[chatId];
					currentRecord.guestCount = guestCount;
				}
			};
		}
		#formatFields(fields) {
			return im_v2_model.formatFieldsWithConfig(fields, collabFieldsConfig);
		}
	}

	/* eslint-disable no-param-reassign */
	class InputActionsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getGetters() {
			return {
				/** @function chats/inputActions/getByDialogId */
				getByDialogId: state => dialogId => {
					const chatActionList = state.collection[dialogId];
					if (!chatActionList || chatActionList.length === 0) {
						return null;
					}
					return chatActionList;
				},
				/** @function chats/inputActions/isChatActive */
				isChatActive: state => dialogId => {
					const chatActionList = state.collection[dialogId];
					if (!chatActionList) {
						return false;
					}
					return chatActionList.length > 0;
				},
				/** @function chats/inputActions/isActionActive */
				isActionActive: state => payload => {
					const {
						dialogId,
						userId
					} = payload;
					if (!state.collection[dialogId]) {
						return false;
					}
					const chatActionList = state.collection[dialogId];
					return this.isAlreadyActive(chatActionList, userId);
				}
			};
		}
		getActions() {
			return {
				/** @function chats/inputActions/start */
				start: (store, payload) => {
					const {
						dialogId,
						userId
					} = payload;
					if (!store.state.collection[dialogId]) {
						store.commit('initCollection', dialogId);
					}
					const chatActionList = store.state.collection[dialogId];
					const isAlreadyActive = this.isAlreadyActive(chatActionList, userId);
					if (isAlreadyActive) {
						return;
					}
					store.commit('start', payload);
				},
				/** @function chats/inputActions/stop */
				stop: (store, payload) => {
					const {
						dialogId,
						userId
					} = payload;
					const chatActionList = store.state.collection[dialogId];
					if (!chatActionList) {
						return;
					}
					const isAlreadyActive = this.isAlreadyActive(chatActionList, userId);
					if (!isAlreadyActive) {
						return;
					}
					store.commit('stop', payload);
				}
			};
		}
		getMutations() {
			return {
				start: (state, payload) => {
					const {
						dialogId,
						type,
						userId,
						userName,
						duration,
						statusMessageCode
					} = payload;
					const chatActionList = state.collection[dialogId];
					chatActionList.push({
						type,
						userId,
						userName,
						duration,
						statusMessageCode
					});
				},
				stop: (state, payload) => {
					const {
						dialogId,
						userId
					} = payload;
					const chatActionList = state.collection[dialogId];
					state.collection[dialogId] = chatActionList.filter(userRecord => {
						return userRecord.userId !== userId;
					});
				},
				initCollection: (state, dialogId) => {
					state.collection[dialogId] = [];
				}
			};
		}
		isAlreadyActive(list, userId) {
			return list.some(userRecord => userRecord.userId === userId);
		}
	}

	/* eslint-disable no-param-reassign */
	let ChatsModel$1 = class ChatsModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'chats';
		}
		getNestedModules() {
			return {
				collabs: CollabsModel,
				inputActions: InputActionsModel,
				autoDelete: AutoDeleteModel
			};
		}
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				dialogId: '0',
				chatId: 0,
				type: im_v2_const.ChatType.chat,
				name: '',
				description: '',
				avatar: '',
				color: im_v2_const.Color.base,
				extranet: false,
				containsCollaber: false,
				userCounter: 0,
				guestCount: 0,
				lastReadId: 0,
				markedId: 0,
				lastMessageId: 0,
				lastMessageViews: {
					countOfViewers: 0,
					firstViewer: null,
					messageId: 0
				},
				savedPositionMessageId: 0,
				managerList: [],
				inputActionList: {},
				isMuted: false,
				quoteId: 0,
				ownerId: 0,
				entityLink: {},
				dateCreate: null,
				public: {
					code: '',
					link: ''
				},
				inited: false,
				loading: false,
				hasPrevPage: false,
				hasNextPage: false,
				diskFolderId: 0,
				role: im_v2_const.UserRole.member,
				permissions: {
					manageUi: im_v2_const.UserRole.none,
					manageSettings: im_v2_const.UserRole.none,
					manageUsersAdd: im_v2_const.UserRole.none,
					manageUsersDelete: im_v2_const.UserRole.none,
					manageMessages: im_v2_const.UserRole.member,
					manageGuestInvites: im_v2_const.UserRole.none,
					manageDelete: im_v2_const.UserRole.none
				},
				// Phase 0 (task 718250): superadmin project chat access
				hasManageCapability: false,
				tariffRestrictions: {
					isHistoryLimitExceeded: false
				},
				parentChatId: 0,
				backgroundId: '',
				isTextareaEnabled: true
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getGetters() {
			return {
				/** @function chats/get */
				get: state => (dialogId, getBlank = false) => {
					const collectionItem = state.collection[dialogId];
					if (!collectionItem && getBlank) {
						return this.getElementState();
					}
					if (!collectionItem && !getBlank) {
						return null;
					}
					return collectionItem;
				},
				/** @function chats/getByChatId */
				getByChatId: state => (chatId, getBlank = false) => {
					const preparedChatId = Number.parseInt(chatId, 10);
					const chat = Object.values(state.collection).find(item => {
						return item.chatId === preparedChatId;
					});
					if (!chat && getBlank) {
						return this.getElementState();
					}
					return chat;
				},
				/** @function chats/getQuoteId */
				getQuoteId: state => dialogId => {
					const collectionItem = state.collection[dialogId];
					if (!collectionItem) {
						return 0;
					}
					return collectionItem.quoteId;
				},
				/** @function chats/getLastReadId */
				getLastReadId: state => dialogId => {
					const collectionItem = state.collection[dialogId];
					if (!collectionItem) {
						return 0;
					}
					const {
						lastReadId
					} = collectionItem;
					const lastReadIdMessage = im_v2_application_core.Core.getStore().getters['messages/getById'](lastReadId);
					if (!lastReadIdMessage) {
						return 0;
					}
					return lastReadId;
				},
				/** @function chats/getInitialMessageId */
				getInitialMessageId: state => dialogId => {
					const collectionItem = state.collection[dialogId];
					if (!collectionItem) {
						return 0;
					}
					const {
						lastReadId,
						markedId
					} = collectionItem;
					if (markedId === 0) {
						return lastReadId;
					}
					return Math.min(lastReadId, markedId);
				},
				/** @function chats/getBackgroundId */
				getBackgroundId: state => dialogId => {
					const collectionItem = state.collection[dialogId];
					if (!collectionItem) {
						return '';
					}
					return collectionItem.backgroundId;
				},
				/** @function chats/getCollectionByParentChatId */
				getCollectionByParentChatId: state => parentChatId => {
					if (parentChatId === im_v2_const.ParentChatScope.all) {
						return Object.values(state.collection);
					}
					return Object.values(state.collection).filter(item => {
						return item.parentChatId === parentChatId;
					});
				},
				/** @function chats/getParent */
				getParent: () => dialogId => {
					const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
					if (!chat || chat.parentChatId === 0) {
						return null;
					}
					return im_v2_application_core.Core.getStore().getters['chats/getByChatId'](chat.parentChatId);
				},
				/** @function chats/isUser */
				isUser: state => dialogId => {
					const collectionItem = state.collection[dialogId];
					if (!collectionItem) {
						return false;
					}
					return collectionItem.type === im_v2_const.ChatType.user;
				},
				/** @function chats/isSupport */
				isSupport: state => dialogId => {
					const collectionItem = state.collection[dialogId];
					if (!collectionItem) {
						return false;
					}
					return collectionItem.type === im_v2_const.ChatType.support24Question;
				},
				/** @function chats/isSelfChat */
				isSelfChat: () => dialogId => {
					return im_v2_application_core.Core.getUserId().toString() === dialogId;
				}
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getActions() {
			return {
				/** @function chats/set */
				set: (store, rawPayload) => {
					let payload = rawPayload;
					if (!Array.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					payload.map(element => {
						return this.formatFields(element);
					}).forEach(element => {
						const existingItem = store.state.collection[element.dialogId];
						if (existingItem) {
							store.commit('update', {
								dialogId: element.dialogId,
								fields: element
							});
						} else {
							store.commit('add', {
								dialogId: element.dialogId,
								fields: {
									...this.getElementState(),
									...element
								}
							});
						}
					});
				},
				/** @function chats/add */
				add: (store, rawPayload) => {
					let payload = rawPayload;
					if (!Array.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					payload.map(element => {
						return this.formatFields(element);
					}).forEach(element => {
						const existingItem = store.state.collection[element.dialogId];
						if (!existingItem) {
							store.commit('add', {
								dialogId: element.dialogId,
								fields: {
									...this.getElementState(),
									...element
								}
							});
						}
					});
				},
				/** @function chats/update */
				update: (store, payload) => {
					const existingItem = store.state.collection[payload.dialogId];
					if (!existingItem) {
						return;
					}
					store.commit('update', {
						dialogId: payload.dialogId,
						fields: this.formatFields(payload.fields)
					});
				},
				/** @function chats/delete */
				delete: (store, payload) => {
					const existingItem = store.state.collection[payload.dialogId];
					if (!existingItem) {
						return;
					}
					store.commit('delete', {
						dialogId: payload.dialogId
					});
				},
				/** @function chats/clearMarkedChatsByRecentType */
				clearMarkedChatsByRecentType: (store, payload) => {
					store.commit('clearMarkedChatsByRecentType', payload);
				},
				/** @function chats/clearMarkedChats */
				clearMarkedChats: store => {
					store.commit('clearMarkedChats');
				},
				/** @function chats/mute */
				mute: (store, payload) => {
					const existingItem = store.state.collection[payload.dialogId];
					if (!existingItem) {
						return;
					}
					this.store.dispatch('counters/setMuteStatus', {
						chatId: existingItem.chatId,
						status: true
					});
					store.commit('update', {
						actionName: 'mute',
						dialogId: payload.dialogId,
						fields: this.formatFields({
							isMuted: true
						})
					});
				},
				/** @function chats/unmute */
				unmute: (store, payload) => {
					const existingItem = store.state.collection[payload.dialogId];
					if (!existingItem) {
						return;
					}
					this.store.dispatch('counters/setMuteStatus', {
						chatId: existingItem.chatId,
						status: false
					});
					store.commit('update', {
						actionName: 'unmute',
						dialogId: payload.dialogId,
						fields: this.formatFields({
							isMuted: false
						})
					});
				},
				/** @function chats/setLastMessageViews */
				setLastMessageViews: (store, payload) => {
					const {
						dialogId,
						fields: {
							userId,
							userName,
							date,
							messageId
						}
					} = payload;
					const existingItem = store.state.collection[dialogId];
					if (!existingItem) {
						return;
					}
					const newLastMessageViews = {
						countOfViewers: 1,
						messageId,
						firstViewer: {
							userId,
							userName,
							date: im_v2_lib_utils.Utils.date.cast(date)
						}
					};
					store.commit('update', {
						actionName: 'setLastMessageViews',
						dialogId,
						fields: {
							lastMessageViews: newLastMessageViews
						}
					});
				},
				/** @function chats/clearLastMessageViews */
				clearLastMessageViews: (store, payload) => {
					const existingItem = store.state.collection[payload.dialogId];
					if (!existingItem) {
						return;
					}
					const {
						lastMessageViews: defaultLastMessageViews
					} = this.getElementState();
					store.commit('update', {
						actionName: 'clearLastMessageViews',
						dialogId: payload.dialogId,
						fields: {
							lastMessageViews: defaultLastMessageViews
						}
					});
				},
				/** @function chats/incrementLastMessageViews */
				incrementLastMessageViews: (store, payload) => {
					const existingItem = store.state.collection[payload.dialogId];
					if (!existingItem) {
						return;
					}
					const newCounter = existingItem.lastMessageViews.countOfViewers + 1;
					store.commit('update', {
						actionName: 'incrementLastMessageViews',
						dialogId: payload.dialogId,
						fields: {
							lastMessageViews: {
								...existingItem.lastMessageViews,
								countOfViewers: newCounter
							}
						}
					});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					state.collection[payload.dialogId] = payload.fields;
				},
				update: (state, payload) => {
					const existingItem = state.collection[payload.dialogId];
					const updatedItem = {
						...existingItem,
						...payload.fields
					};
					// permissions must be merged deeply: a partial update missing some keys
					// (e.g. manageGuestInvites/manageSettings) must not overwrite the whole object
					if (existingItem?.permissions && payload.fields.permissions) {
						updatedItem.permissions = {
							...existingItem.permissions,
							...payload.fields.permissions
						};
					}
					state.collection[payload.dialogId] = updatedItem;
				},
				delete: (state, payload) => {
					delete state.collection[payload.dialogId];
				},
				clearMarkedChatsByRecentType: (state, payload) => {
					const {
						recentType,
						parentChatId
					} = payload;
					const items = this.store.getters['chats/getCollectionByParentChatId'](parentChatId);
					items.forEach(item => {
						const recentSections = im_v2_application_core.Core.getStore().getters['counters/getRecentSectionsByChatId'](item.chatId);
						if (!recentSections.includes(recentType)) {
							return;
						}
						state.collection[item.dialogId].markedId = 0;
					});
				},
				clearMarkedChats: state => {
					Object.values(state.collection).forEach(chat => {
						const {
							dialogId
						} = chat;
						state.collection[dialogId].markedId = 0;
					});
				}
			};
		}
		formatFields(rawFields) {
			return im_v2_model.formatFieldsWithConfig(rawFields, chatFieldsConfig$1);
		}
	};

	const prepareAvatar = avatar => {
		let result = '';
		if (!avatar || avatar.endsWith('/js/im/images/blank.gif')) {
			result = '';
		} else if (avatar.startsWith('http')) {
			result = avatar;
		} else {
			result = im_v2_application_core.Core.getHost() + avatar;
		}
		if (result) {
			result = encodeURI(result);
		}
		return result;
	};
	const prepareDepartments = departments => {
		const result = [];
		departments.forEach(rawDepartmentId => {
			const departmentId = Number.parseInt(rawDepartmentId, 10);
			if (departmentId > 0) {
				result.push(departmentId);
			}
		});
		return result;
	};
	const preparePhones = phones => {
		const result = {};
		if (main_core.Type.isStringFilled(phones.workPhone) || main_core.Type.isNumber(phones.workPhone)) {
			result.workPhone = phones.workPhone.toString();
		}
		if (main_core.Type.isStringFilled(phones.personalMobile) || main_core.Type.isNumber(phones.personalMobile)) {
			result.personalMobile = phones.personalMobile.toString();
		}
		if (main_core.Type.isStringFilled(phones.personalPhone) || main_core.Type.isNumber(phones.personalPhone)) {
			result.personalPhone = phones.personalPhone.toString();
		}
		if (main_core.Type.isStringFilled(phones.innerPhone) || main_core.Type.isNumber(phones.innerPhone)) {
			result.innerPhone = phones.innerPhone.toString();
		}
		return result;
	};

	const userFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'networkId',
		targetFieldName: 'id',
		checkFunction: im_v2_lib_utils.Utils.user.isNetworkUserId
	}, {
		fieldName: 'firstName',
		targetFieldName: 'firstName',
		checkFunction: main_core.Type.isString,
		formatFunction: main_core.Text.decode
	}, {
		fieldName: 'lastName',
		targetFieldName: 'lastName',
		checkFunction: main_core.Type.isString,
		formatFunction: main_core.Text.decode
	}, {
		fieldName: 'name',
		targetFieldName: 'name',
		checkFunction: main_core.Type.isString,
		formatFunction: main_core.Text.decode
	}, {
		fieldName: 'color',
		targetFieldName: 'color',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'avatar',
		targetFieldName: 'avatar',
		checkFunction: main_core.Type.isString,
		formatFunction: prepareAvatar
	}, {
		fieldName: 'workPosition',
		targetFieldName: 'workPosition',
		checkFunction: main_core.Type.isString,
		formatFunction: main_core.Text.decode
	}, {
		fieldName: 'gender',
		targetFieldName: 'gender',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'birthday',
		targetFieldName: 'birthday',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'isBirthday',
		targetFieldName: 'isBirthday',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'network',
		targetFieldName: 'network',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'connector',
		targetFieldName: 'connector',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'externalAuthId',
		targetFieldName: 'externalAuthId',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'status',
		targetFieldName: 'status',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'idle',
		targetFieldName: 'idle',
		formatFunction: convertToDate
	}, {
		fieldName: 'lastActivityDate',
		targetFieldName: 'lastActivityDate',
		formatFunction: convertToDate
	}, {
		fieldName: 'mobileLastDate',
		targetFieldName: 'mobileLastDate',
		formatFunction: convertToDate
	}, {
		fieldName: 'absent',
		targetFieldName: 'absent',
		formatFunction: convertToDate
	}, {
		fieldName: 'isAbsent',
		targetFieldName: 'isAbsent',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'departments',
		targetFieldName: 'departments',
		checkFunction: main_core.Type.isArray,
		formatFunction: prepareDepartments
	}, {
		fieldName: 'phones',
		targetFieldName: 'phones',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: preparePhones
	}, {
		fieldName: 'email',
		targetFieldName: 'email',
		checkFunction: main_core.Type.isStringFilled
	}, {
		fieldName: 'website',
		targetFieldName: 'website',
		checkFunction: main_core.Type.isStringFilled
	}];
	const botFieldsConfig = [{
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'code',
		targetFieldName: 'code',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'isHidden',
		targetFieldName: 'isHidden',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'isSupportOpenline',
		targetFieldName: 'isHidden',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'isHuman',
		targetFieldName: 'isHidden',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'backgroundId',
		targetFieldName: 'backgroundId',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'reactionsEnabled',
		targetFieldName: 'reactionsEnabled',
		checkFunction: main_core.Type.isBoolean
	}];

	class BotsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				code: '',
				type: im_v2_const.BotType.bot,
				isHidden: false,
				isSupportOpenline: false,
				isHuman: false,
				backgroundId: '',
				reactionsEnabled: false
			};
		}
		getGetters() {
			return {
				/** @function users/bots/getByUserId */
				getByUserId: state => userId => {
					return state.collection[userId];
				},
				/** @function users/bots/isNetwork */
				isNetwork: state => userId => {
					return state.collection[userId]?.type === im_v2_const.BotType.network;
				},
				/** @function users/bots/isSupport */
				isSupport: state => userId => {
					return state.collection[userId]?.type === im_v2_const.BotType.support24;
				},
				/** @function users/bots/isAiAssistant */
				isAiAssistant: state => userId => {
					return state.collection[userId]?.code === im_v2_const.BotCode.aiAssistant;
				},
				/** @function users/bots/getCopilotBotDialogId */
				getCopilotBotDialogId: state => {
					for (const [userId, bot] of Object.entries(state.collection)) {
						if (bot.code === im_v2_const.BotCode.copilot) {
							return userId;
						}
					}
					return null;
				},
				/** @function users/bots/isCopilot */
				isCopilot: (state, getters) => userId => {
					const copilotUserId = Number(getters.getCopilotBotDialogId);
					return copilotUserId === Number.parseInt(userId, 10);
				},
				/** @function users/bots/getBackgroundId */
				getBackgroundId: state => dialogId => {
					if (!state.collection[dialogId]) {
						return '';
					}
					return state.collection[dialogId].backgroundId;
				}
			};
		}
		getActions() {
			return {
				/** @function users/bots/set */
				set: (store, payload) => {
					const {
						userId,
						botData
					} = payload;
					if (!botData) {
						return;
					}
					store.commit('set', {
						userId,
						botData: {
							...this.getElementState(),
							...this.formatFields(botData)
						}
					});
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					const {
						userId,
						botData
					} = payload;
					// eslint-disable-next-line no-param-reassign
					state.collection[userId] = botData;
				}
			};
		}
		formatFields(fields) {
			const result = convertObjectKeysToCamelCase(fields);
			if (result.type === im_v2_const.RawBotType.human) {
				result.type = im_v2_const.BotType.bot;
				result.isHuman = true;
			}
			const TYPES_MAPPED_TO_DEFAULT_BOT = [im_v2_const.RawBotType.openline, im_v2_const.RawBotType.supervisor, im_v2_const.RawBotType.personal];
			if (TYPES_MAPPED_TO_DEFAULT_BOT.includes(result.type)) {
				result.type = im_v2_const.BotType.bot;
			}
			return im_v2_model.formatFieldsWithConfig(result, botFieldsConfig);
		}
	}

	const UserPositionByType = {
		[im_v2_const.UserType.bot]: main_core.Loc.getMessage('IM_MODEL_USERS_CHAT_BOT'),
		[im_v2_const.UserType.collaber]: main_core.Loc.getMessage('IM_MODEL_USERS_COLLABER'),
		[im_v2_const.UserType.guest]: main_core.Loc.getMessage('IM_MODEL_USERS_COLLABER'),
		default: main_core.Loc.getMessage('IM_MODEL_USERS_DEFAULT_NAME')
	};
	class UsersModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'users';
		}
		getNestedModules() {
			return {
				bots: BotsModel
			};
		}
		getState() {
			return {
				collection: {},
				absentList: [],
				absentCheckInterval: null,
				isCurrentUserAdmin: false
			};
		}
		getElementState(params = {}) {
			const {
				id = 0
			} = params;
			return {
				id,
				name: '',
				firstName: '',
				lastName: '',
				avatar: '',
				color: im_v2_const.Color.base,
				workPosition: '',
				gender: 'M',
				type: im_v2_const.UserType.user,
				network: false,
				connector: false,
				externalAuthId: 'default',
				status: '',
				idle: false,
				lastActivityDate: false,
				mobileLastDate: false,
				birthday: false,
				isBirthday: false,
				absent: false,
				isAbsent: false,
				departments: [],
				phones: {
					workPhone: '',
					personalMobile: '',
					personalPhone: '',
					innerPhone: ''
				},
				email: '',
				website: ''
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getGetters() {
			return {
				/** @function users/get */
				get: state => (userId, getTemporary = false) => {
					const user = state.collection[userId];
					if (!getTemporary && !user) {
						return null;
					}
					if (getTemporary && !user) {
						return this.getElementState({
							id: userId
						});
					}
					return user;
				},
				/** @function users/getBlank */
				getBlank: () => params => {
					return this.getElementState(params);
				},
				/** @function users/getList */
				getList: state => userList => {
					const result = [];
					if (!Array.isArray(userList)) {
						return null;
					}
					userList.forEach(id => {
						if (state.collection[id]) {
							result.push(state.collection[id]);
						} else {
							result.push(this.getElementState({
								id
							}));
						}
					});
					return result;
				},
				/** @function users/hasBirthday */
				hasBirthday: state => rawUserId => {
					const userId = Number.parseInt(rawUserId, 10);
					const user = state.collection[userId];
					if (userId <= 0 || !user) {
						return false;
					}
					return user.isBirthday;
				},
				/** @function users/hasVacation */
				hasVacation: state => rawUserId => {
					const userId = Number.parseInt(rawUserId, 10);
					const user = state.collection[userId];
					if (userId <= 0 || !user) {
						return false;
					}
					return user.isAbsent;
				},
				/** @function users/getLastOnline */
				getLastOnline: state => rawUserId => {
					const userId = Number.parseInt(rawUserId, 10);
					const user = state.collection[userId];
					if (userId <= 0 || !user) {
						return '';
					}
					return im_v2_lib_utils.Utils.user.getLastDateText(user);
				},
				/** @function users/getPosition */
				getPosition: state => rawUserId => {
					const userId = Number.parseInt(rawUserId, 10);
					const user = state.collection[userId];
					const isSupportBot = im_v2_application_core.Core.getStore().getters['users/bots/isSupport'](userId);
					if (userId <= 0 || !user || isSupportBot) {
						return '';
					}
					if (user.workPosition) {
						return user.workPosition;
					}
					return UserPositionByType[user.type] ?? UserPositionByType.default;
				},
				/** @function users/isCurrentUserAdmin */
				isCurrentUserAdmin: state => {
					return state.isCurrentUserAdmin;
				},
				/** @function users/isGuest */
				isGuest: state => userId => {
					return state.collection[userId]?.type === im_v2_const.UserType.guest;
				}
			};
		}
		getActions() {
			return {
				/** @function users/set */
				set: (store, rawPayload) => {
					let payload = rawPayload;
					if (!Array.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					payload.map(user => {
						return this.formatFields(user);
					}).forEach(user => {
						const existingUser = store.state.collection[user.id];
						if (existingUser) {
							store.commit('update', {
								id: user.id,
								fields: user
							});
						} else {
							store.commit('add', {
								id: user.id,
								fields: {
									...this.getElementState(),
									...user
								}
							});
						}
					});
				},
				/** @function users/add */
				add: (store, rawPayload) => {
					let payload = rawPayload;
					if (!Array.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					payload.map(user => {
						return this.formatFields(user);
					}).forEach(user => {
						const existingUser = store.state.collection[user.id];
						if (!existingUser) {
							store.commit('add', {
								id: user.id,
								fields: {
									...this.getElementState(),
									...user
								}
							});
						}
					});
				},
				/** @function users/update */
				update: (store, rawPayload) => {
					const payload = rawPayload;
					payload.id = Number.parseInt(payload.id, 10);
					const user = store.state.collection[payload.id];
					if (!user) {
						return;
					}
					const fields = {
						...payload.fields,
						id: payload.id
					};
					store.commit('update', {
						id: payload.id,
						fields: this.formatFields(fields)
					});
				},
				/** @function users/delete */
				delete: (store, payload) => {
					store.commit('delete', payload.id);
				},
				/** @function users/setStatus */
				setStatus: (store, payload) => {
					store.commit('update', {
						id: im_v2_application_core.Core.getUserId(),
						fields: this.formatFields(payload)
					});
				},
				/** @function users/setCurrentUserAdminStatus */
				setCurrentUserAdminStatus: (store, isAdmin) => {
					store.commit('setCurrentUserAdminStatus', isAdmin);
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					// eslint-disable-next-line no-param-reassign
					state.collection[payload.id] = payload.fields;
					im_v2_lib_userStatus.UserStatusManager.getInstance().onUserUpdate(payload.fields);
				},
				update: (state, payload) => {
					// eslint-disable-next-line no-param-reassign
					state.collection[payload.id] = {
						...state.collection[payload.id],
						...payload.fields
					};
					im_v2_lib_userStatus.UserStatusManager.getInstance().onUserUpdate(payload.fields);
				},
				delete: (state, payload) => {
					// eslint-disable-next-line no-param-reassign
					delete state.collection[payload.id];
				},
				setCurrentUserAdminStatus: (state, isAdmin) => {
					// eslint-disable-next-line no-param-reassign
					state.isCurrentUserAdmin = isAdmin;
				}
			};
		}
		formatFields(fields) {
			const preparedFields = im_v2_model.formatFieldsWithConfig(fields, userFieldsConfig);
			const isBot = preparedFields.type === im_v2_const.UserType.bot;
			if (isBot) {
				im_v2_application_core.Core.getStore().dispatch('users/bots/set', {
					userId: preparedFields.id,
					botData: fields.botData || fields.bot_data
				});
			}
			return preparedFields;
		}
		addToAbsentList(id) {
			const state = this.store.state.users;
			if (!state.absentList.includes(id)) {
				state.absentList.push(id);
			}
		}
		startAbsentCheckInterval() {
			const state = this.store.state.users;
			if (state.absentCheckInterval) {
				return;
			}
			const TIME_TO_NEXT_DAY = 1000 * 60 * 60 * 24;
			state.absentCheckInterval = setTimeout(() => {
				setInterval(() => {
					state.absentList.forEach(userId => {
						const user = state.collection[userId];
						if (!user) {
							return;
						}
						const currentTime = Date.now();
						const absentEnd = new Date(user.absent).getTime();
						if (absentEnd <= currentTime) {
							state.absentList = state.absentList.filter(element => {
								return element !== userId;
							});
							user.isAbsent = false;
						}
					});
				}, TIME_TO_NEXT_DAY);
			}, im_v2_lib_utils.Utils.date.getTimeToNextMidnight());
		}
	}

	const prepareIconType = file => {
		const extension = file.extension.toString();
		if (file.type === 'image') {
			return 'img';
		}
		if (file.type === 'video') {
			return 'mov';
		}
		return im_v2_lib_utils.Utils.file.getIconTypeByExtension(extension);
	};
	const prepareImage = image => {
		let result = {
			width: 0,
			height: 0
		};
		if (main_core.Type.isString(image.width) || main_core.Type.isNumber(image.width)) {
			result.width = Number.parseInt(image.width, 10);
		}
		if (main_core.Type.isString(image.height) || main_core.Type.isNumber(image.height)) {
			result.height = Number.parseInt(image.height, 10);
		}
		if (result.width <= 0 || result.height <= 0) {
			result = false;
		}
		return result;
	};
	const prepareUrl = url => {
		if (!url || url.startsWith('http') || url.startsWith('bx') || url.startsWith('file') || url.startsWith('blob')) {
			return url;
		}
		return im_v2_application_core.Core.getHost() + url;
	};

	const fileFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: isNumberOrString
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'date',
		targetFieldName: 'date',
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'extension',
		targetFieldName: 'icon',
		checkFunction: main_core.Type.isString,
		formatFunction: (target, currentResult, rawFields) => {
			return prepareIconType(rawFields);
		}
	}, {
		fieldName: 'name',
		targetFieldName: 'name',
		checkFunction: isNumberOrString,
		formatFunction: convertToString
	}, {
		fieldName: 'size',
		targetFieldName: 'size',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'image',
		targetFieldName: 'image',
		checkFunction: [main_core.Type.isPlainObject, main_core.Type.isBoolean],
		formatFunction: target => {
			if (main_core.Type.isBoolean(target)) {
				return target;
			}
			return prepareImage(target);
		}
	}, {
		fieldName: 'status',
		targetFieldName: 'status',
		checkFunction: [main_core.Type.isString, file => !main_core.Type.isUndefined(im_v2_const.FileStatus[file.status])]
	}, {
		fieldName: 'progress',
		targetFieldName: 'progress',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'isVideoNote',
		targetFieldName: 'isVideoNote',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'authorId',
		targetFieldName: 'authorId',
		checkFunction: isNumberOrString,
		formatFunction: convertToNumber
	}, {
		fieldName: 'authorName',
		targetFieldName: 'authorName',
		checkFunction: isNumberOrString,
		formatFunction: convertToString
	}, {
		fieldName: 'urlPreview',
		targetFieldName: 'urlPreview',
		checkFunction: main_core.Type.isString,
		formatFunction: prepareUrl
	}, {
		fieldName: 'urlDownload',
		targetFieldName: 'urlDownload',
		checkFunction: main_core.Type.isString,
		formatFunction: prepareUrl
	}, {
		fieldName: 'urlShow',
		targetFieldName: 'urlShow',
		checkFunction: main_core.Type.isString,
		formatFunction: prepareUrl
	}, {
		fieldName: 'viewerAttrs',
		targetFieldName: 'viewerAttrs',
		checkFunction: main_core.Type.isPlainObject
	}, {
		fieldName: 'isTranscribable',
		targetFieldName: 'isTranscribable',
		checkFunction: main_core.Type.isBoolean
	}];

	let FilesModel$1 = class FilesModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'files';
		}
		getState() {
			return {
				collection: {},
				temporaryFilesMap: new Map(),
				transcriptions: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				chatId: 0,
				name: 'File is deleted',
				date: new Date(),
				type: 'file',
				extension: '',
				icon: 'empty',
				isTranscribable: false,
				size: 0,
				image: null,
				status: im_v2_const.FileStatus.done,
				progress: 100,
				authorId: 0,
				authorName: '',
				urlPreview: '',
				urlShow: '',
				urlDownload: '',
				viewerAttrs: null,
				isVideoNote: false
			};
		}
		getGetters() {
			return {
				/** @function files/get */
				get: (state, getters) => (fileId, getTemporary = false) => {
					if (!fileId) {
						return null;
					}
					if (!getTemporary && !state.collection[fileId]) {
						return null;
					}
					const file = state.collection[fileId];
					const hasMappedTemporaryFile = getters.hasMappedTemporaryFile({
						serverFileId: fileId
					});
					if (file && hasMappedTemporaryFile) {
						const temporaryFile = getters.getMappedTemporaryFile({
							serverFileId: fileId
						});
						return {
							...file,
							urlPreview: temporaryFile.urlPreview,
							urlShow: temporaryFile.urlShow
						};
					}
					return file;
				},
				/** @function files/isInCollection */
				isInCollection: state => payload => {
					const {
						fileId
					} = payload;
					return Boolean(state.collection[fileId]);
				},
				/** @function files/hasMappedTemporaryFile */
				hasMappedTemporaryFile: state => payload => {
					if (state.temporaryFilesMap.has(payload.serverFileId)) {
						const temporaryFileId = state.temporaryFilesMap.get(payload.serverFileId);
						return Object.hasOwn(state.collection, temporaryFileId);
					}
					return false;
				},
				/** @function files/getMappedTemporaryFile */
				getMappedTemporaryFile: state => payload => {
					const {
						serverFileId
					} = payload;
					if (state.temporaryFilesMap.has(serverFileId)) {
						const temporaryFileId = state.temporaryFilesMap.get(serverFileId);
						return state.collection[temporaryFileId];
					}
					return null;
				},
				/** @function files/getTranscription */
				getTranscription: state => fileId => {
					return state.transcriptions[fileId] || null;
				}
			};
		}
		getActions() {
			return {
				/** @function files/add */
				add: (store, payload) => {
					const preparedFile = {
						...this.getElementState(),
						...this.formatFields(payload)
					};
					store.commit('add', {
						files: [preparedFile]
					});
				},
				/** @function files/set */
				set: (store, ...payload) => {
					const files = payload.flat().map(file => {
						return {
							...this.getElementState(),
							...this.formatFields(file)
						};
					});
					store.commit('add', {
						files
					});
				},
				/** @function files/update */
				update: (store, payload) => {
					const {
						id,
						fields
					} = payload;
					const existingItem = store.state.collection[id];
					if (!existingItem) {
						return false;
					}
					store.commit('update', {
						id,
						fields: this.formatFields(fields)
					});
					return true;
				},
				/** @function files/updateWithId */
				updateWithId: (store, payload) => {
					const {
						id,
						fields
					} = payload;
					if (!store.state.collection[id]) {
						return;
					}
					store.commit('updateWithId', {
						id,
						fields: this.formatFields(fields)
					});
				},
				/** @function files/delete */
				delete: (store, payload) => {
					const {
						id
					} = payload;
					if (!store.state.collection[id]) {
						return;
					}
					store.commit('delete', {
						id
					});
				},
				/** @function files/setTemporaryFileMapping */
				setTemporaryFileMapping: (store, payload) => {
					store.commit('setTemporaryFileMapping', payload);
				},
				/** @function files/setTranscription */
				setTranscription: (store, payload) => {
					const {
						fileId,
						status,
						transcriptText,
						errorCode
					} = payload;
					store.commit('setTranscription', {
						fileId,
						status,
						transcriptText,
						errorCode
					});
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				add: (state, payload) => {
					payload.files.forEach(file => {
						state.collection[file.id] = file;
					});
				},
				update: (state, payload) => {
					Object.entries(payload.fields).forEach(([key, value]) => {
						state.collection[payload.id][key] = value;
					});
				},
				updateWithId: (state, payload) => {
					const {
						id,
						fields
					} = payload;
					const currentFile = {
						...state.collection[id]
					};
					delete state.collection[id];
					state.collection[fields.id] = {
						...currentFile,
						...fields
					};
				},
				delete: (state, payload) => {
					im_v2_lib_logger.Logger.warn('Files model: delete mutation', payload);
					const {
						id
					} = payload;
					delete state.collection[id];
				},
				setTemporaryFileMapping: (state, payload) => {
					state.temporaryFilesMap.set(payload.serverFileId, payload.temporaryFileId);
				},
				setTranscription: (state, payload) => {
					state.transcriptions[payload.fileId] = {
						status: payload.status,
						transcriptText: payload.transcriptText,
						errorCode: payload.errorCode
					};
				}
			};
		}
		formatFields(rawFields) {
			return im_v2_model.formatFieldsWithConfig(rawFields, fileFieldsConfig);
		}
	};

	const recentFieldsConfig = [{
		fieldName: ['id', 'dialogId'],
		targetFieldName: 'dialogId',
		checkFunction: isNumberOrString,
		formatFunction: convertToString
	}, {
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: isNumberOrString
	}, {
		fieldName: 'ownMessageId',
		targetFieldName: 'ownMessageId',
		checkFunction: isNumberOrString
	}, {
		fieldName: 'draft',
		targetFieldName: 'draft',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: prepareDraft
	}, {
		fieldName: 'invited',
		targetFieldName: 'invitation',
		checkFunction: [main_core.Type.isPlainObject, main_core.Type.isBoolean],
		formatFunction: prepareInvitation
	}, {
		fieldName: 'pinned',
		targetFieldName: 'pinned',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'liked',
		targetFieldName: 'liked',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: ['defaultUserRecord', 'isFakeElement'],
		targetFieldName: 'isFakeElement',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'isBirthdayPlaceholder',
		targetFieldName: 'isBirthdayPlaceholder',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: ['dateLastActivity', 'lastActivityDate'],
		targetFieldName: 'lastActivityDate',
		checkFunction: [main_core.Type.isString, main_core.Type.isDate],
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}];

	class CallsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				dialogId: 0,
				name: '',
				call: {},
				state: im_v2_const.RecentCallStatus.waiting
			};
		}
		getGetters() {
			return {
				get: state => {
					return Object.values(state.collection);
				},
				getCallByDialog: state => dialogId => {
					return state.collection[dialogId];
				},
				hasActiveCall: state => dialogId => {
					if (main_core.Type.isUndefined(dialogId)) {
						const activeCall = Object.values(state.collection).find(item => {
							return item.state === im_v2_const.RecentCallStatus.joined;
						});
						return Boolean(activeCall);
					}
					const existingCall = Object.values(state.collection).find(item => {
						return item.dialogId === dialogId;
					});
					if (!existingCall) {
						return false;
					}
					return existingCall.state === im_v2_const.RecentCallStatus.joined;
				}
			};
		}
		getActions() {
			return {
				addActiveCall: (store, payload) => {
					const existingCall = Object.values(store.state.collection).find(item => {
						return item.dialogId === payload.dialogId || item.call.uuid === payload.call.uuid;
					});
					if (existingCall) {
						store.commit('updateActiveCall', {
							dialogId: existingCall.dialogId,
							fields: this.validateActiveCall(payload)
						});
						return true;
					}
					store.commit('addActiveCall', this.prepareActiveCall(payload));
				},
				updateActiveCall: (store, payload) => {
					const existingCall = store.state.collection[payload.dialogId];
					if (!existingCall) {
						return;
					}
					store.commit('updateActiveCall', {
						dialogId: existingCall.dialogId,
						fields: this.validateActiveCall(payload.fields)
					});
				},
				deleteActiveCall: (store, payload) => {
					const existingCall = store.state.collection[payload.dialogId];
					if (!existingCall) {
						return;
					}
					store.commit('deleteActiveCall', {
						dialogId: existingCall.dialogId
					});
				}
			};
		}
		getMutations() {
			return {
				addActiveCall: (state, payload) => {
					state.collection[payload.dialogId] = payload;
				},
				updateActiveCall: (state, payload) => {
					state.collection[payload.dialogId] = {
						...state.collection[payload.dialogId],
						...payload.fields
					};
				},
				deleteActiveCall: (state, payload) => {
					delete state.collection[payload.dialogId];
				}
			};
		}
		prepareActiveCall(call) {
			return {
				...this.getElementState(),
				...this.validateActiveCall(call)
			};
		}
		validateActiveCall(fields) {
			const result = {};
			if (main_core.Type.isStringFilled(fields.dialogId) || main_core.Type.isNumber(fields.dialogId)) {
				result.dialogId = fields.dialogId;
			}
			if (main_core.Type.isStringFilled(fields.name)) {
				result.name = fields.name;
			}
			if (main_core.Type.isObjectLike(fields.call)) {
				result.call = fields.call;
				if (fields.call?.associatedEntity?.avatar === '/bitrix/js/im/images/blank.gif') {
					result.call.associatedEntity.avatar = '';
				}
			}
			if (im_v2_const.RecentCallStatus[fields.state]) {
				result.state = fields.state;
			}
			return result;
		}
	}

	const isValidFolderType = type => Boolean(im_v2_const.FolderType[type]);
	const isValidRecentType = type => Object.values(im_v2_const.RecentType).includes(type);
	const folderFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'sort',
		targetFieldName: 'sort',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: isValidFolderType
	}, {
		fieldName: 'code',
		targetFieldName: 'code',
		checkFunction: isValidRecentType
	}, {
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: main_core.Type.isStringFilled
	}, {
		fieldName: 'displaysNestedInRoot',
		targetFieldName: 'displaysNestedInRoot',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'definition',
		targetFieldName: 'definition',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => im_v2_model.formatFieldsWithConfig(target, folderDefinitionFieldConfig)
	}];
	const isValidChat = chat => {
		return main_core.Type.isPlainObject(chat) && main_core.Type.isNumber(chat.chatId) && main_core.Type.isStringFilled(chat.dialogId);
	};
	const folderDefinitionFieldConfig = [{
		fieldName: 'recentSection',
		targetFieldName: 'recentSection',
		checkFunction: isValidRecentType
	}, {
		fieldName: 'chats',
		targetFieldName: 'chats',
		checkFunction: main_core.Type.isArray,
		formatFunction: chats => chats.filter(isValidChat)
	}];

	class FoldersModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getGetters() {
			return {
				/** @function recent/folders/getList */
				getList: state => {
					return Object.values(state.collection).sort((a, b) => a.sort - b.sort || a.id - b.id);
				},
				/** @function recent/folders/getById */
				getById: state => folderId => {
					return state.collection[folderId];
				},
				/** @function recent/folders/getPersonalCount */
				getPersonalCount: state => {
					return Object.values(state.collection).filter(folder => folder.type === im_v2_const.FolderType.personal).length;
				}
			};
		}
		getActions() {
			return {
				/** @function recent/folders/set */
				set: (store, payload) => {
					if (!main_core.Type.isArray(payload)) {
						return;
					}
					const preparedList = payload.map(folder => this.#formatFields(folder));
					store.commit('set', preparedList);
				},
				/** @function recent/folders/add */
				add: (store, payload) => {
					store.commit('add', this.#formatFields(payload));
				},
				/** @function recent/folders/update */
				update: (store, payload) => {
					const existingItem = store.state.collection[payload.id];
					if (!existingItem) {
						return;
					}
					store.commit('update', this.#formatFields(payload));
				},
				/** @function recent/folders/delete */
				delete: (store, payload) => {
					const existingItem = store.state.collection[payload.id];
					if (!existingItem) {
						return;
					}
					store.commit('delete', payload);
				},
				/** @function recent/folders/sort */
				sort: (store, payload) => {
					if (!main_core.Type.isArray(payload)) {
						return;
					}
					const orderedIds = payload.filter(folderId => store.state.collection[folderId]);
					store.commit('sort', orderedIds);
				},
				/** @function recent/folders/addChats */
				addChats: (store, payload) => {
					const folder = store.state.collection[payload.folderId];
					if (!folder || folder.type !== im_v2_const.FolderType.personal || !main_core.Type.isArray(payload.chats)) {
						return;
					}
					store.commit('addChats', payload);
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getMutations() {
			return {
				set: (state, payload) => {
					payload.forEach(folder => {
						state.collection[folder.id] = folder;
					});
				},
				add: (state, payload) => {
					state.collection[payload.id] = payload;
				},
				update: (state, payload) => {
					state.collection[payload.id] = {
						...state.collection[payload.id],
						...payload
					};
				},
				delete: (state, payload) => {
					delete state.collection[payload.id];
				},
				sort: (state, payload) => {
					payload.forEach((folderId, index) => {
						state.collection[folderId].sort = index;
					});
				},
				addChats: (state, payload) => {
					const folder = state.collection[payload.folderId];
					const existingChatIds = new Set(folder.definition.chats.map(chat => chat.chatId));
					const newChats = payload.chats.filter(chat => !existingChatIds.has(chat.chatId));
					folder.definition = {
						...folder.definition,
						chats: [...folder.definition.chats, ...newChats]
					};
				}
			};
		}
		#formatFields(fields) {
			return im_v2_model.formatFieldsWithConfig(fields, folderFieldsConfig);
		}
	}

	const HIDE_EXCLUDED_SECTIONS = [im_v2_const.RecentType.openChannel];
	class RecentModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'recent';
		}
		getNestedModules() {
			return {
				calls: CallsModel,
				folders: FoldersModel
			};
		}
		getState() {
			return {
				collection: {},
				recentIndex: {},
				unreadIndex: {},
				hiddenChats: new Set()
			};
		}
		getElementState() {
			return {
				dialogId: '0',
				messageId: 0,
				ownMessageId: 0,
				draft: {
					text: '',
					date: null
				},
				pinned: false,
				liked: false,
				invitation: {
					isActive: false,
					originator: 0,
					canResend: false
				},
				isFakeElement: false,
				isBirthdayPlaceholder: false,
				lastActivityDate: null
			};
		}
		getGetters() {
			return {
				/** @function recent/getCollection */
				getCollection: state => payload => {
					const {
						type,
						unread = false,
						parentChatId = im_v2_const.ParentChatScope.topLevel
					} = payload;
					const index = unread ? state.unreadIndex : state.recentIndex;
					const parentGroup = index[parentChatId];
					if (!parentGroup) {
						return [];
					}
					const typeGroup = parentGroup[type];
					if (!typeGroup) {
						return [];
					}
					return [...typeGroup].filter(dialogId => this.store.getters['chats/get'](dialogId) && state.collection[dialogId]).map(dialogId => state.collection[dialogId]);
				},
				/** @function recent/getUnreadCollection */
				getUnreadCollection: () => payload => {
					return this.store.getters['recent/getCollection']({
						...payload,
						unread: true
					});
				},
				/** @function recent/getSortedCollection */
				getSortedCollection: () => payload => {
					const collection = this.store.getters['recent/getCollection'](payload);
					return [...collection].sort(this.#compareByDate);
				},
				/** @function recent/getSortedUnreadCollection */
				getSortedUnreadCollection: () => payload => {
					return this.store.getters['recent/getSortedCollection']({
						...payload,
						unread: true
					});
				},
				/** @function recent/getCollectionByIds */
				getCollectionByIds: state => dialogIds => {
					const collection = dialogIds.map(dialogId => state.collection[dialogId]).filter(item => Boolean(item) && !state.hiddenChats.has(item.dialogId));
					return [...collection].sort(this.#compareByDate);
				},
				/** @function recent/get */
				get: state => dialogId => {
					if (!state.collection[dialogId]) {
						return null;
					}
					return state.collection[dialogId];
				},
				/** @function recent/getMessage */
				getMessage: state => dialogId => {
					const element = state.collection[dialogId];
					if (!element) {
						return null;
					}
					return this.#getMessage(element.messageId);
				},
				/** @function recent/getOwnMessage */
				getOwnMessage: state => dialogId => {
					const element = state.collection[dialogId];
					if (!element) {
						return null;
					}
					return this.#getMessage(element.ownMessageId);
				},
				/** @function recent/hasInCollection */
				hasInCollection: state => payload => {
					const {
						dialogId,
						type,
						parentChatId = im_v2_const.ParentChatScope.topLevel
					} = payload;
					const parentGroup = state.recentIndex[parentChatId];
					if (!parentGroup) {
						return false;
					}
					const typeGroup = parentGroup[type];
					if (!typeGroup) {
						return false;
					}
					return typeGroup.has(dialogId);
				}
			};
		}

		/* eslint-disable no-param-reassign */
		/* eslint-disable-next-line max-lines-per-function */
		getActions() {
			return {
				/** @function recent/setCollection */
				setCollection: async (store, payload) => {
					const {
						type,
						items,
						unread = false,
						parentChatId = im_v2_const.ParentChatScope.topLevel
					} = payload;
					const itemIds = await im_v2_application_core.Core.getStore().dispatch('recent/set', items);
					const setPayload = {
						parentChatId,
						type,
						itemIds,
						unread
					};
					store.commit('setIndex', setPayload);
					const needToAddRootItem = im_v2_lib_recent.RecentManager.isTypeWithNestedChats(type) && parentChatId > 0;
					if (needToAddRootItem) {
						store.commit('setIndex', {
							...setPayload,
							parentChatId: im_v2_const.ParentChatScope.topLevel
						});
					}
					this.#restoreHiddenOnReappear(store, type, itemIds);
				},
				/** @function recent/setUnreadCollection */
				setUnreadCollection: async (store, payload) => {
					void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
						...payload,
						unread: true
					});
				},
				/** @function recent/clearCollection */
				clearCollection: async (store, payload) => {
					const {
						type,
						unread = false,
						parentChatId = im_v2_const.ParentChatScope.topLevel
					} = payload;
					store.commit('clearCollection', {
						parentChatId,
						type,
						unread
					});
				},
				/** @function recent/clearUnreadCollection */
				clearUnreadCollection: async (store, payload) => {
					void im_v2_application_core.Core.getStore().dispatch('recent/clearCollection', {
						...payload,
						unread: true
					});
				},
				/** @function recent/clearByDialogId */
				clearByDialogId: async (store, payload) => {
					const {
						dialogId,
						type,
						unread = false,
						parentChatId = im_v2_const.ParentChatScope.topLevel
					} = payload;
					store.commit('clearByDialogId', {
						dialogId,
						type,
						unread,
						parentChatId
					});
					const needToClearRootItem = im_v2_lib_recent.RecentManager.isTypeWithNestedChats(type) && parentChatId > 0;
					if (needToClearRootItem) {
						store.commit('clearByDialogId', {
							dialogId,
							type,
							unread,
							parentChatId: im_v2_const.ParentChatScope.topLevel
						});
					}
				},
				/** @function recent/set */
				set: (store, payload) => {
					if (!main_core.Type.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					const itemsToUpdate = [];
					const itemsToAdd = [];
					for (const rawElement of payload) {
						const element = this.#formatFields(rawElement);
						const existingItem = store.state.collection[element.dialogId];
						if (existingItem) {
							itemsToUpdate.push({
								dialogId: existingItem.dialogId,
								fields: element
							});
							continue;
						}
						itemsToAdd.push({
							...this.getElementState(),
							...element
						});
					}
					store.commit('add', itemsToAdd);
					store.commit('update', itemsToUpdate);
					return [...itemsToAdd, ...itemsToUpdate].map(item => item.dialogId);
				},
				/** @function recent/update */
				update: (store, payload) => {
					const {
						dialogId,
						fields
					} = payload;
					const existingItem = store.state.collection[dialogId];
					if (!existingItem) {
						return;
					}
					store.commit('update', {
						dialogId,
						fields: this.#formatFields(fields)
					});
				},
				/** @function recent/pin */
				pin: (store, payload) => {
					const {
						dialogId,
						action
					} = payload;
					const existingItem = store.state.collection[dialogId];
					if (!existingItem) {
						return;
					}
					store.commit('update', {
						dialogId,
						fields: {
							pinned: action
						}
					});
				},
				/** @function recent/like */
				like: (store, payload) => {
					const {
						dialogId,
						messageId,
						liked
					} = payload;
					const existingItem = store.state.collection[dialogId];
					if (!existingItem) {
						return;
					}
					const isLastMessage = existingItem.messageId === Number.parseInt(messageId, 10);
					const isExactMessageLiked = !main_core.Type.isUndefined(messageId) && liked === true;
					if (isExactMessageLiked && !isLastMessage) {
						return;
					}
					store.commit('update', {
						dialogId,
						fields: {
							liked: liked === true
						}
					});
				},
				/** @function recent/setDraft */
				setDraft: (store, payload) => {
					const {
						dialogId,
						text,
						addFakeItems = true
					} = payload;
					const isRemovingDraft = !main_core.Type.isStringFilled(text);
					if (isRemovingDraft && this.#shouldDeleteItemWithDraft(payload)) {
						void im_v2_application_core.Core.getStore().dispatch('recent/hide', {
							dialogId
						});
						return;
					}
					const hasRecentItem = im_v2_application_core.Core.getStore().getters['recent/hasInCollection']({
						dialogId,
						type: im_v2_const.RecentType.default
					});
					const needsFakeItem = !hasRecentItem && !isRemovingDraft;
					if (needsFakeItem && addFakeItems) {
						this.#handleFakeItemWithDraft(payload, store);
					}
					const existingItem = store.state.collection[dialogId];
					if (!existingItem) {
						return;
					}
					void im_v2_application_core.Core.getStore().dispatch('recent/update', {
						dialogId,
						fields: {
							draft: {
								text: text.toString()
							}
						}
					});
				},
				/** @function recent/hide */
				hide: (store, payload) => {
					const {
						dialogId
					} = payload;
					const existingItem = store.state.collection[dialogId];
					if (!existingItem) {
						return;
					}
					store.commit('removeFromCollections', {
						dialogId
					});
					store.commit('setHiddenStatus', {
						ids: [existingItem.dialogId],
						hidden: true
					});
				},
				/** @function recent/setHiddenStatus */
				setHiddenStatus: (store, payload) => {
					store.commit('setHiddenStatus', payload);
				},
				/** @function recent/delete */
				delete: (store, payload) => {
					const {
						dialogId
					} = payload;
					const existingItem = store.state.collection[dialogId];
					if (!existingItem) {
						return;
					}
					store.commit('delete', {
						dialogId
					});
				}
			};
		}
		getMutations() {
			return {
				setIndex: (state, payload) => {
					const {
						parentChatId,
						type,
						itemIds,
						unread
					} = payload;
					const index = unread ? state.unreadIndex : state.recentIndex;
					if (!index[parentChatId]) {
						index[parentChatId] = {};
					}
					const parentGroup = index[parentChatId];
					if (!parentGroup[type]) {
						parentGroup[type] = new Set();
					}
					const typeGroup = parentGroup[type];
					itemIds.forEach(dialogId => {
						typeGroup.add(dialogId);
					});
				},
				clearCollection: (state, payload) => {
					const {
						parentChatId,
						type,
						unread
					} = payload;
					const index = unread ? state.unreadIndex : state.recentIndex;
					delete index[parentChatId]?.[type];
				},
				clearByDialogId: (state, payload) => {
					const {
						parentChatId,
						type,
						dialogId,
						unread
					} = payload;
					const index = unread ? state.unreadIndex : state.recentIndex;
					index[parentChatId]?.[type]?.delete(dialogId);
				},
				add: (state, payload) => {
					if (!main_core.Type.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					payload.forEach(item => {
						state.collection[item.dialogId] = item;
					});
				},
				update: (state, payload) => {
					if (!main_core.Type.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					payload.forEach(({
						dialogId,
						fields
					}) => {
						if (!this.#shouldApplyUpdate(dialogId, fields)) {
							return;
						}
						const currentElement = state.collection[dialogId];
						state.collection[dialogId] = {
							...currentElement,
							...fields
						};
					});
				},
				setHiddenStatus: (state, payload) => {
					const {
						ids,
						hidden
					} = payload;
					ids.forEach(dialogId => {
						if (hidden) {
							state.hiddenChats.add(dialogId);
						} else {
							state.hiddenChats.delete(dialogId);
						}
					});
				},
				removeFromCollections: (state, payload) => {
					const {
						dialogId
					} = payload;
					const collections = this.#getAllCollections(state, HIDE_EXCLUDED_SECTIONS);
					collections.forEach(idSet => idSet.delete(dialogId));
				},
				delete: (state, payload) => {
					const {
						dialogId
					} = payload;
					delete state.collection[dialogId];
				}
			};
		}
		#formatFields(rawFields) {
			const options = main_core.Type.isPlainObject(rawFields.options) ? rawFields.options : {};
			const fields = {
				...rawFields,
				...options
			};
			return formatFieldsWithConfig(fields, recentFieldsConfig);
		}
		#shouldApplyUpdate(dialogId, fields) {
			// if we already got chat - we should not update it with fake user chat
			// (unless it's an accepted invitation or fake user with real message)
			const hasRecentItem = im_v2_application_core.Core.getStore().getters['recent/hasInCollection']({
				dialogId,
				type: im_v2_const.RecentType.default
			});
			if (!hasRecentItem) {
				return true;
			}
			const isFakeElement = fields.isFakeElement && im_v2_lib_message.MessageManager.isTempMessage(fields.messageId);
			if (!isFakeElement) {
				return true;
			}
			return Boolean(fields.invitation);
		}
		#restoreHiddenOnReappear(store, type, itemIds) {
			if (HIDE_EXCLUDED_SECTIONS.includes(type)) {
				return;
			}
			store.commit('setHiddenStatus', {
				ids: itemIds,
				hidden: false
			});
		}
		#getAllCollections(state, excludeTypes = []) {
			const result = [];
			const trees = [state.recentIndex, state.unreadIndex];
			trees.forEach(indexTree => {
				Object.values(indexTree).forEach(parentGroup => {
					Object.entries(parentGroup).forEach(([recentType, idSet]) => {
						if (excludeTypes.includes(recentType)) {
							return;
						}
						result.push(idSet);
					});
				});
			});
			return result;
		}
		#getMessage(messageId) {
			return im_v2_application_core.Core.getStore().getters['messages/getById'](messageId);
		}
		#handleFakeItemWithDraft(payload) {
			const recentItem = {
				...this.getElementState(),
				...this.#prepareFakeItemWithDraft(payload)
			};
			void im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
				type: im_v2_const.RecentType.default,
				items: [recentItem]
			});
		}
		#prepareFakeItemWithDraft(payload) {
			const messageId = this.#createFakeMessageForDraft(payload.dialogId);
			return this.#formatFields({
				dialogId: payload.dialogId.toString(),
				draft: {
					text: payload.text.toString()
				},
				messageId
			});
		}
		#createFakeMessageForDraft(dialogId) {
			const messageId = `${im_v2_const.FakeDraftMessagePrefix}-${dialogId}`;
			void im_v2_application_core.Core.getStore().dispatch('messages/store', {
				id: messageId,
				date: new Date()
			});
			return messageId;
		}
		#shouldDeleteItemWithDraft(payload) {
			const existingItem = im_v2_application_core.Core.getStore().getters['recent/get'](payload.dialogId);
			return existingItem && !main_core.Type.isStringFilled(payload.text) && existingItem.messageId.toString().startsWith(im_v2_const.FakeDraftMessagePrefix);
		}
		#compareByDate(a, b) {
			const dateA = im_v2_lib_recent.RecentManager.getSortDate(a.dialogId);
			const dateB = im_v2_lib_recent.RecentManager.getSortDate(b.dialogId);
			if (dateA?.getTime() === dateB?.getTime()) {
				return a.dialogId > b.dialogId ? 1 : -1;
			}
			return dateB - dateA;
		}
	}

	class NotificationsModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'notifications';
		}
		getState() {
			return {
				collection: new Map(),
				searchCollection: new Map(),
				unreadCounter: 0
			};
		}
		getElementState() {
			return {
				id: 0,
				authorId: 0,
				date: new Date(),
				title: '',
				text: '',
				params: {},
				replaces: [],
				notifyButtons: [],
				sectionCode: im_v2_const.NotificationTypesCodes.simple,
				read: false,
				settingName: 'im|default',
				moduleId: ''
			};
		}
		getGetters() {
			return {
				getSortedCollection: state => {
					return [...state.collection.values()].sort(this.sortByType);
				},
				getSearchResultCollection: state => {
					return [...state.searchCollection.values()].sort(this.sortByType);
				},
				getConfirmsCount: state => {
					return [...state.collection.values()].filter(notification => {
						return notification.sectionCode === im_v2_const.NotificationTypesCodes.confirm;
					}).length;
				},
				getById: state => notificationId => {
					if (main_core.Type.isString(notificationId)) {
						notificationId = Number.parseInt(notificationId, 10);
					}
					const existingItem = state.collection.get(notificationId);
					if (!existingItem) {
						return false;
					}
					return existingItem;
				},
				getSearchItemById: state => notificationId => {
					if (main_core.Type.isString(notificationId)) {
						const id = Number.parseInt(notificationId, 10);
						const existingItem = state.searchCollection.get(id);
						return existingItem ?? null;
					}
					const existingItem = state.searchCollection.get(notificationId);
					return existingItem ?? null;
				},
				getCounter: state => {
					return state.unreadCounter;
				}
			};
		}
		getActions() {
			return {
				initialSet: (store, payload) => {
					if (main_core.Type.isNumber(payload.total_unread_count)) {
						store.commit('setCounter', payload.total_unread_count);
					}
					if (!main_core.Type.isArrayFilled(payload.notifications)) {
						return;
					}
					const itemsToUpdate = [];
					const itemsToAdd = [];
					const currentUserId = im_v2_application_core.Core.getUserId();
					payload.notifications.map(element => {
						return NotificationsModel.validate(element, currentUserId);
					}).forEach(element => {
						const existingItem = store.state.collection.get(element.id);
						if (existingItem) {
							itemsToUpdate.push({
								id: existingItem.id,
								fields: {
									...element
								}
							});
						} else {
							itemsToAdd.push({
								...this.getElementState(),
								...element
							});
						}
					});
					if (itemsToAdd.length > 0) {
						store.commit('add', itemsToAdd);
					}
					if (itemsToUpdate.length > 0) {
						store.commit('update', itemsToUpdate);
					}
				},
				set: (store, payload) => {
					if (!Array.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					const itemsToUpdate = [];
					const itemsToAdd = [];
					const currentUserId = im_v2_application_core.Core.getUserId();
					payload.map(element => {
						return NotificationsModel.validate(element, currentUserId);
					}).forEach(element => {
						const existingItem = store.state.collection.get(element.id);
						if (existingItem) {
							itemsToUpdate.push({
								id: existingItem.id,
								fields: {
									...element
								}
							});
						} else {
							itemsToAdd.push({
								...this.getElementState(),
								...element
							});
						}
					});
					if (itemsToAdd.length > 0) {
						store.commit('add', itemsToAdd);
					}
					if (itemsToUpdate.length > 0) {
						store.commit('update', itemsToUpdate);
					}
				},
				setSearchResult: (store, payload) => {
					const itemsToUpdate = [];
					const itemsToAdd = [];
					let {
						notifications
					} = payload;
					const skipValidation = !!payload.skipValidation;
					if (!skipValidation) {
						const currentUserId = im_v2_application_core.Core.getUserId();
						notifications = notifications.map(element => {
							return NotificationsModel.validate(element, currentUserId);
						});
					}
					notifications.forEach(element => {
						const existingItem = store.state.searchCollection.get(element.id);
						if (existingItem) {
							itemsToUpdate.push({
								id: existingItem.id,
								fields: {
									...element
								}
							});
						} else {
							itemsToAdd.push({
								...this.getElementState(),
								...element
							});
						}
					});
					if (itemsToAdd.length > 0) {
						store.commit('addSearchResult', itemsToAdd);
					}
					if (itemsToUpdate.length > 0) {
						store.commit('updateSearchResult', itemsToUpdate);
					}
				},
				read: (store, payload) => {
					payload.ids.forEach(notificationId => {
						const existingItem = store.state.collection.get(notificationId);
						if (!existingItem || existingItem.read === payload.read) {
							return false;
						}
						if (payload.read) {
							store.commit('decreaseCounter');
						} else {
							store.commit('increaseCounter');
						}
						store.commit('read', {
							id: existingItem.id,
							read: payload.read
						});
					});
				},
				readAllSimple: (store, payload = {}) => {
					const excludeIds = payload.excludeIds || [];
					const excludeIdsSet = new Set(excludeIds);
					const idsToMarkAsRead = [];
					store.state.collection.forEach(item => {
						if (!item.read && item.sectionCode === im_v2_const.NotificationTypesCodes.simple && !excludeIdsSet.has(item.id)) {
							idsToMarkAsRead.push(item.id);
						}
					});
					if (idsToMarkAsRead.length > 0) {
						store.commit('markAsRead', idsToMarkAsRead);
					}
				},
				delete: (store, payload) => {
					const existingItem = store.state.collection.get(payload.id);
					if (!existingItem) {
						return;
					}
					if (existingItem.read === false) {
						store.commit('decreaseCounter');
					}
					store.commit('delete', {
						id: existingItem.id
					});
				},
				deleteFromSearch: (store, payload) => {
					const existingItem = store.state.searchCollection.get(payload.id);
					if (!existingItem) {
						return;
					}
					store.commit('delete', {
						id: existingItem.id
					});
				},
				clearSearchResult: store => {
					store.commit('clearSearchResult');
				},
				setCounter: (store, payload) => {
					store.commit('setCounter', payload);
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					payload.forEach(item => {
						state.collection.set(item.id, item);
					});
				},
				addSearchResult: (state, payload) => {
					payload.forEach(item => {
						state.searchCollection.set(item.id, item);
					});
				},
				update: (state, payload) => {
					payload.forEach(item => {
						state.collection.set(item.id, {
							...state.collection.get(item.id),
							...item.fields
						});
					});
				},
				updateSearchResult: (state, payload) => {
					payload.forEach(item => {
						state.searchCollection.set(item.id, {
							...state.searchCollection.get(item.id),
							...item.fields
						});
					});
				},
				delete: (state, payload) => {
					state.collection.delete(payload.id);
					state.searchCollection.delete(payload.id);
				},
				read: (state, payload) => {
					state.collection.set(payload.id, {
						...state.collection.get(payload.id),
						read: payload.read
					});
					state.searchCollection.set(payload.id, {
						...state.collection.get(payload.id),
						read: payload.read
					});
				},
				readAll: state => {
					[...state.collection.values()].forEach(item => {
						if (!item.read) {
							item.read = true;
						}
					});
				},
				markAsRead: (state, payload) => {
					payload.forEach(id => {
						const item = state.collection.get(id);
						if (item) {
							item.read = true;
							const searchItem = state.searchCollection.get(id);
							if (searchItem) {
								searchItem.read = true;
							}
						}
					});
				},
				setCounter: (state, payload) => {
					state.unreadCounter = Number.parseInt(payload, 10);
				},
				decreaseCounter: state => {
					if (state.unreadCounter > 0) {
						state.unreadCounter--;
					}
				},
				increaseCounter: state => {
					state.unreadCounter++;
				},
				clearSearchResult: state => {
					state.searchCollection.clear();
				}
			};
		}
		static validate(fields) {
			const result = {};
			if (main_core.Type.isString(fields.id) || main_core.Type.isNumber(fields.id)) {
				result.id = fields.id;
			}
			if (main_core.Type.isNumber(fields.author_id)) {
				result.authorId = fields.author_id;
			} else if (main_core.Type.isNumber(fields.userId)) {
				result.authorId = fields.userId;
			}
			if (!main_core.Type.isNil(fields.date)) {
				result.date = im_v2_lib_utils.Utils.date.cast(fields.date);
			}
			if (main_core.Type.isString(fields.notify_title)) {
				result.title = fields.notify_title;
			} else if (main_core.Type.isString(fields.title)) {
				result.title = fields.title;
			}
			if (main_core.Type.isString(fields.text) || main_core.Type.isNumber(fields.text)) {
				result.text = main_core.Text.decode(fields.text.toString());
			}
			if (main_core.Type.isObjectLike(fields.params)) {
				result.params = convertObjectKeysToCamelCase(fields.params);
			}
			if (main_core.Type.isArray(fields.replaces)) {
				result.replaces = fields.replaces;
			}
			if (!main_core.Type.isNil(fields.notify_buttons)) {
				result.notifyButtons = JSON.parse(fields.notify_buttons);
			} else if (!main_core.Type.isNil(fields.buttons)) {
				result.notifyButtons = fields.buttons.map(button => {
					return {
						COMMAND: 'notifyConfirm',
						COMMAND_PARAMS: `${result.id}|${button.VALUE}`,
						TEXT: `${button.TITLE}`,
						TYPE: 'BUTTON',
						DISPLAY: 'LINE',
						BG_COLOR: button.VALUE === 'Y' ? '#8bc84b' : '#ef4b57',
						TEXT_COLOR: '#fff'
					};
				});
			}
			if (fields.notify_type === im_v2_const.NotificationTypesCodes.confirm || fields.type === im_v2_const.NotificationTypesCodes.confirm) {
				result.sectionCode = im_v2_const.NotificationTypesCodes.confirm;
			} else {
				result.sectionCode = im_v2_const.NotificationTypesCodes.simple;
			}
			if (!main_core.Type.isNil(fields.notify_read)) {
				result.read = fields.notify_read === 'Y';
			} else if (!main_core.Type.isNil(fields.read)) {
				result.read = fields.read === 'Y';
			}
			if (main_core.Type.isString(fields.setting_name)) {
				result.settingName = fields.setting_name;
			} else if (main_core.Type.isString(fields.settingName)) {
				result.settingName = fields.settingName;
			}
			if (main_core.Type.isString(fields.notify_module)) {
				result.moduleId = fields.notify_module;
			}
			return result;
		}
		sortByType(a, b) {
			if (a.sectionCode === im_v2_const.NotificationTypesCodes.confirm && b.sectionCode !== im_v2_const.NotificationTypesCodes.confirm) {
				return -1;
			} else if (a.sectionCode !== im_v2_const.NotificationTypesCodes.confirm && b.sectionCode === im_v2_const.NotificationTypesCodes.confirm) {
				return 1;
			} else {
				return b.id - a.id;
			}
		}
	}

	const sidebarLinksFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'authorId',
		targetFieldName: 'authorId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'url',
		targetFieldName: 'source',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => {
			return target.source ?? '';
		}
	}, {
		fieldName: 'dateCreate',
		targetFieldName: 'date',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'url',
		targetFieldName: 'richData',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => {
			return formatFieldsWithConfig(target.richData, richDataFieldsConfig);
		}
	}];
	const richDataFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'description',
		targetFieldName: 'description',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'link',
		targetFieldName: 'link',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'name',
		targetFieldName: 'name',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'previewUrl',
		targetFieldName: 'previewUrl',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}];

	/* eslint-disable no-param-reassign */
	class LinksModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {},
				collectionSearch: {},
				counters: {},
				historyLimitExceededCollection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				messageId: 0,
				chatId: 0,
				authorId: 0,
				source: '',
				date: new Date(),
				richData: {
					id: null,
					description: null,
					link: null,
					name: null,
					previewUrl: null,
					type: null
				}
			};
		}
		getChatState() {
			return {
				items: new Map(),
				hasNextPage: true
			};
		}
		getGetters() {
			return {
				/** @function sidebar/links/get */
				get: state => chatId => {
					if (!state.collection[chatId]) {
						return [];
					}
					return [...state.collection[chatId].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/links/getSize */
				getSize: state => chatId => {
					if (!state.collection[chatId]) {
						return 0;
					}
					return state.collection[chatId].items.size;
				},
				/** @function sidebar/links/getCounter */
				getCounter: state => chatId => {
					if (!state.counters[chatId]) {
						return 0;
					}
					return state.counters[chatId];
				},
				/** @function sidebar/links/hasNextPage */
				hasNextPage: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].hasNextPage;
				},
				/** @function sidebar/links/hasNextPageSearch */
				hasNextPageSearch: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return false;
					}
					return state.collectionSearch[chatId].hasNextPage;
				},
				/** @function sidebar/links/getSearchResultCollectionSize */
				getSearchResultCollectionSize: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return 0;
					}
					return state.collectionSearch[chatId].items.size;
				},
				/** @function sidebar/links/getSearchResultCollection */
				getSearchResultCollection: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return [];
					}
					return [...state.collectionSearch[chatId].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/links/isHistoryLimitExceeded */
				isHistoryLimitExceeded: state => chatId => {
					const isAvailable = im_v2_application_core.Core.getStore().getters['application/tariffRestrictions/isHistoryAvailable'];
					if (isAvailable) {
						return false;
					}
					return state.historyLimitExceededCollection[chatId] ?? false;
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/links/setCounter */
				setCounter: (store, payload) => {
					if (!main_core.Type.isNumber(payload.counter) || !main_core.Type.isNumber(payload.chatId)) {
						return;
					}
					store.commit('setCounter', payload);
				},
				/** @function sidebar/links/set */
				set: (store, payload) => {
					const {
						chatId,
						links,
						hasNextPage,
						isHistoryLimitExceeded = false
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					store.commit('setHasNextPage', {
						chatId,
						hasNextPage
					});
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
					links.forEach(link => {
						const preparedLink = {
							...this.getElementState(),
							...this.formatFields(link)
						};
						store.commit('add', {
							chatId,
							link: preparedLink
						});
					});
				},
				/** @function sidebar/links/setSearch */
				setSearch: (store, payload) => {
					const {
						chatId,
						links,
						hasNextPage,
						isHistoryLimitExceeded = false
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					store.commit('setHasNextPageSearch', {
						chatId,
						hasNextPage
					});
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
					links.forEach(link => {
						const preparedLink = {
							...this.getElementState(),
							...this.formatFields(link)
						};
						store.commit('addSearch', {
							chatId,
							link: preparedLink
						});
					});
				},
				/** @function sidebar/links/clearSearch */
				clearSearch: store => {
					store.commit('clearSearch', {});
				},
				/** @function sidebar/links/delete */
				delete: (store, payload) => {
					const {
						chatId,
						id
					} = payload;
					if (!main_core.Type.isNumber(id) || !main_core.Type.isNumber(chatId)) {
						return;
					}
					if (!store.state.collection[chatId] || !store.state.collection[chatId].items.has(id)) {
						return;
					}
					store.commit('delete', {
						chatId,
						id
					});
				}
			};
		}
		getMutations() {
			return {
				setHasNextPage: (state, payload) => {
					const {
						chatId,
						hasNextPage
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].hasNextPage = hasNextPage;
				},
				setHasNextPageSearch: (state, payload) => {
					const {
						chatId,
						hasNextPage
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].hasNextPage = hasNextPage;
				},
				setHistoryLimitExceeded: (state, payload) => {
					const {
						chatId,
						isHistoryLimitExceeded
					} = payload;
					if (state.historyLimitExceededCollection[chatId] && !isHistoryLimitExceeded) {
						return;
					}
					state.historyLimitExceededCollection[chatId] = isHistoryLimitExceeded;
				},
				setCounter: (state, payload) => {
					const {
						chatId,
						counter
					} = payload;
					state.counters[chatId] = counter;
				},
				add: (state, payload) => {
					const {
						chatId,
						link
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].items.set(link.id, link);
				},
				addSearch: (state, payload) => {
					const {
						chatId,
						link
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].items.set(link.id, link);
				},
				clearSearch: state => {
					state.collectionSearch = {};
				},
				delete: (state, payload) => {
					const {
						chatId,
						id
					} = payload;
					const hasCollectionSearch = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (hasCollectionSearch) {
						state.collectionSearch[chatId].items.delete(id);
					}
					state.collection[chatId].items.delete(id);
					state.counters[chatId]--;
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, sidebarLinksFieldsConfig);
		}
	}

	const sidebarFavoritesFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'authorId',
		targetFieldName: 'authorId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'dateCreate',
		targetFieldName: 'date',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}];

	/* eslint-disable no-param-reassign */
	class FavoritesModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {},
				counters: {},
				collectionSearch: {},
				historyLimitExceededCollection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				messageId: 0,
				chatId: 0,
				authorId: 0,
				date: new Date()
			};
		}
		getChatState() {
			return {
				items: new Map(),
				hasNextPage: true,
				lastId: 0
			};
		}
		getGetters() {
			return {
				/** @function sidebar/favorites/get */
				get: state => chatId => {
					if (!state.collection[chatId]) {
						return [];
					}
					return [...state.collection[chatId].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/favorites/getSize */
				getSize: state => chatId => {
					if (!state.collection[chatId]) {
						return 0;
					}
					return state.collection[chatId].items.size;
				},
				/** @function sidebar/favorites/getCounter */
				getCounter: state => chatId => {
					if (state.counters[chatId]) {
						return state.counters[chatId];
					}
					return 0;
				},
				/** @function sidebar/favorites/isFavoriteMessage */
				isFavoriteMessage: state => (chatId, messageId) => {
					if (!state.collection[chatId]) {
						return false;
					}
					const chatFavorites = Object.fromEntries(state.collection[chatId].items);
					const targetMessage = Object.values(chatFavorites).find(element => element.messageId === messageId);
					return Boolean(targetMessage);
				},
				/** @function sidebar/favorites/hasNextPage */
				hasNextPage: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].hasNextPage;
				},
				/** @function sidebar/favorites/getLastId */
				getLastId: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].lastId;
				},
				/** @function sidebar/favorites/getSearchResultCollectionLastId */
				getSearchResultCollectionLastId: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return 0;
					}
					return state.collectionSearch[chatId].lastId;
				},
				/** @function sidebar/favorites/hasNextPageSearch */
				hasNextPageSearch: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return false;
					}
					return state.collectionSearch[chatId].hasNextPage;
				},
				/** @function sidebar/favorites/getSearchResultCollection */
				getSearchResultCollection: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return [];
					}
					return [...state.collectionSearch[chatId].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/favorites/isHistoryLimitExceeded */
				isHistoryLimitExceeded: state => chatId => {
					const isAvailable = im_v2_application_core.Core.getStore().getters['application/tariffRestrictions/isHistoryAvailable'];
					if (isAvailable) {
						return false;
					}
					return state.historyLimitExceededCollection[chatId] ?? false;
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/favorites/setCounter */
				setCounter: (store, payload) => {
					if (!main_core.Type.isNumber(payload.counter) || !main_core.Type.isNumber(payload.chatId)) {
						return;
					}
					store.commit('setCounter', payload);
				},
				/** @function sidebar/favorites/set */
				set: (store, payload) => {
					if (main_core.Type.isNumber(payload.favorites)) {
						payload.favorites = [payload.favorites];
					}
					const {
						chatId,
						favorites,
						hasNextPage,
						lastId,
						isHistoryLimitExceeded = false
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
					store.commit('setHasNextPage', {
						chatId,
						hasNextPage
					});
					store.commit('setLastId', {
						chatId,
						lastId
					});
					favorites.forEach(favorite => {
						const preparedFavoriteMessage = {
							...this.getElementState(),
							...this.formatFields(favorite)
						};
						store.commit('add', {
							chatId,
							favorite: preparedFavoriteMessage
						});
					});
				},
				/** @function sidebar/favorites/delete */
				delete: (store, payload) => {
					const {
						chatId,
						id
					} = payload;
					if (!main_core.Type.isNumber(id) || !main_core.Type.isNumber(chatId)) {
						return;
					}
					if (!store.state.collection[chatId] || !store.state.collection[chatId].items.has(id)) {
						return;
					}
					store.commit('delete', {
						chatId,
						id
					});
				},
				/** @function sidebar/favorites/deleteByMessageId */
				deleteByMessageId: (store, payload) => {
					const {
						chatId,
						messageId
					} = payload;
					if (!store.state.collection[chatId]) {
						return;
					}
					const chatCollection = store.state.collection[chatId].items;
					let targetLinkId = null;
					for (const [linkId, linkObject] of chatCollection) {
						if (linkObject.messageId === messageId) {
							targetLinkId = linkId;
							break;
						}
					}
					if (!targetLinkId) {
						return;
					}
					store.commit('delete', {
						chatId,
						id: targetLinkId
					});
				},
				/** @function sidebar/favorites/setSearch */
				setSearch: (store, payload) => {
					const {
						chatId,
						favorites,
						hasNextPage,
						lastId,
						isHistoryLimitExceeded = false
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
					store.commit('setHasNextPageSearch', {
						chatId,
						hasNextPage
					});
					store.commit('setLastIdSearch', {
						chatId,
						lastId
					});
					favorites.forEach(favorite => {
						const preparedFavoriteMessage = {
							...this.getElementState(),
							...this.formatFields(favorite)
						};
						store.commit('addSearch', {
							chatId,
							favorite: preparedFavoriteMessage
						});
					});
				},
				/** @function sidebar/favorites/clearSearch */
				clearSearch: store => {
					store.commit('clearSearch', {});
				}
			};
		}
		getMutations() {
			return {
				setHasNextPage: (state, payload) => {
					const {
						chatId,
						hasNextPage
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].hasNextPage = hasNextPage;
				},
				setHasNextPageSearch: (state, payload) => {
					const {
						chatId,
						hasNextPage
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].hasNextPage = hasNextPage;
				},
				setCounter: (state, payload) => {
					const {
						chatId,
						counter
					} = payload;
					state.counters[chatId] = counter;
				},
				setLastId: (state, payload) => {
					const {
						chatId,
						lastId
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].lastId = lastId;
				},
				add: (state, payload) => {
					const {
						chatId,
						favorite
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].items.set(favorite.id, favorite);
				},
				addSearch: (state, payload) => {
					const {
						chatId,
						favorite
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].items.set(favorite.id, favorite);
				},
				clearSearch: state => {
					state.collectionSearch = {};
				},
				setLastIdSearch: (state, payload) => {
					const {
						chatId,
						lastId
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].lastId = lastId;
				},
				delete: (state, payload) => {
					const {
						chatId,
						id
					} = payload;
					const hasCollectionSearch = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (hasCollectionSearch) {
						state.collectionSearch[chatId].items.delete(id);
					}
					state.collection[chatId].items.delete(id);
					state.counters[chatId]--;
				},
				setHistoryLimitExceeded: (state, payload) => {
					const {
						chatId,
						isHistoryLimitExceeded
					} = payload;
					if (state.historyLimitExceededCollection[chatId] && !isHistoryLimitExceeded) {
						return;
					}
					state.historyLimitExceededCollection[chatId] = isHistoryLimitExceeded;
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, sidebarFavoritesFieldsConfig);
		}
	}

	/* eslint-disable no-param-reassign */
	class MembersModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getChatState() {
			return {
				users: new Set(),
				hasNextPage: true,
				nextCursor: null,
				inited: false
			};
		}
		getGetters() {
			return {
				/** @function sidebar/members/get */
				get: state => chatId => {
					if (!state.collection[chatId]) {
						return [];
					}
					return [...state.collection[chatId].users];
				},
				/** @function sidebar/members/getSize */
				getSize: state => chatId => {
					if (!state.collection[chatId]) {
						return 0;
					}
					return state.collection[chatId].users.size;
				},
				/** @function sidebar/members/hasNextPage */
				hasNextPage: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].hasNextPage;
				},
				/** @function sidebar/members/getNextCursor */
				getNextCursor: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].nextCursor;
				},
				/** @function sidebar/members/getInited */
				getInited: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].inited;
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/members/set */
				set: (store, payload) => {
					const {
						chatId,
						users,
						hasNextPage,
						nextCursor
					} = payload;
					if (!main_core.Type.isNil(hasNextPage)) {
						store.commit('setHasNextPage', {
							chatId,
							hasNextPage
						});
					}
					store.commit('setInited', {
						chatId,
						inited: true
					});
					if (users.length > 0) {
						store.commit('set', {
							chatId,
							users
						});
					}
				},
				/** @function sidebar/members/setNextCursor */
				setNextCursor: (store, payload) => {
					store.commit('setNextCursor', payload);
				},
				/** @function sidebar/members/delete */
				delete: (store, payload) => {
					const {
						chatId,
						userId
					} = payload;
					if (!main_core.Type.isNumber(chatId) || !main_core.Type.isNumber(userId)) {
						return;
					}
					if (!store.state.collection[chatId]) {
						return;
					}
					store.commit('delete', {
						userId,
						chatId
					});
				},
				/** @function sidebar/members/reset */
				reset: (store, payload) => {
					const {
						chatId
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					if (!store.state.collection[chatId]) {
						return;
					}
					store.commit('reset', {
						chatId
					});
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					const {
						chatId,
						users
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					users.forEach(id => {
						state.collection[chatId].users.add(id);
					});
				},
				setHasNextPage: (state, payload) => {
					const {
						chatId,
						hasNextPage
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].hasNextPage = hasNextPage;
				},
				setNextCursor: (state, payload) => {
					const {
						chatId,
						nextCursor
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].nextCursor = nextCursor;
				},
				setInited: (state, payload) => {
					const {
						chatId,
						inited
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].inited = inited;
				},
				delete: (state, payload) => {
					const {
						chatId,
						userId
					} = payload;
					state.collection[chatId].users.delete(userId);
				},
				reset: (state, payload) => {
					const {
						chatId
					} = payload;
					state.collection[chatId] = this.getChatState();
				}
			};
		}
	}

	/* eslint-disable no-param-reassign */
	class MessageSearchModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				historyLimitExceededCollection: {}
			};
		}
		getGetters() {
			return {
				/** @function sidebar/messageSearch/isHistoryLimitExceeded */
				isHistoryLimitExceeded: state => chatId => {
					const isAvailable = im_v2_application_core.Core.getStore().getters['application/tariffRestrictions/isHistoryAvailable'];
					if (isAvailable) {
						return false;
					}
					return state.historyLimitExceededCollection[chatId] ?? false;
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/messageSearch/setHistoryLimitExceeded */
				setHistoryLimitExceeded: (store, payload) => {
					const {
						chatId,
						isHistoryLimitExceeded = false
					} = payload;
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
				}
			};
		}
		getMutations() {
			return {
				setHistoryLimitExceeded: (state, payload) => {
					const {
						chatId,
						isHistoryLimitExceeded
					} = payload;
					if (state.historyLimitExceededCollection[chatId] && !isHistoryLimitExceeded) {
						return;
					}
					state.historyLimitExceededCollection[chatId] = isHistoryLimitExceeded;
				}
			};
		}
	}

	const sidebarTaskFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'authorId',
		targetFieldName: 'authorId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'dateCreate',
		targetFieldName: 'date',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'task',
		targetFieldName: 'task',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => {
			return formatFieldsWithConfig(target, taskFieldsConfig);
		}
	}];
	const taskFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'creatorId',
		targetFieldName: 'creatorId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'responsibleId',
		targetFieldName: 'responsibleId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'statusTitle',
		targetFieldName: 'statusTitle',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'deadline',
		targetFieldName: 'deadline',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'state',
		targetFieldName: 'state',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'color',
		targetFieldName: 'color',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'source',
		targetFieldName: 'source',
		checkFunction: main_core.Type.isString
	}];

	/* eslint-disable no-param-reassign */
	class TasksModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {},
				collectionSearch: {},
				historyLimitExceededCollection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				messageId: 0,
				chatId: 0,
				authorId: 0,
				date: new Date(),
				task: {
					id: 0,
					title: '',
					creatorId: 0,
					responsibleId: 0,
					status: 0,
					statusTitle: '',
					deadline: new Date(),
					state: '',
					color: '',
					source: ''
				}
			};
		}
		getChatState() {
			return {
				items: new Map(),
				hasNextPage: true,
				lastId: 0
			};
		}
		getGetters() {
			return {
				/** @function sidebar/tasks/get */
				get: state => chatId => {
					if (!state.collection[chatId]) {
						return [];
					}
					return [...state.collection[chatId].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/tasks/getSearchResultCollection */
				getSearchResultCollection: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return [];
					}
					return [...state.collectionSearch[chatId].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/tasks/getSize */
				getSize: state => chatId => {
					if (!state.collection[chatId]) {
						return 0;
					}
					return state.collection[chatId].items.size;
				},
				/** @function sidebar/tasks/hasNextPage */
				hasNextPage: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].hasNextPage;
				},
				/** @function sidebar/tasks/getLastId */
				getLastId: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].lastId;
				},
				/** @function sidebar/tasks/getSearchResultCollectionLastId */
				getSearchResultCollectionLastId: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return false;
					}
					return state.collectionSearch[chatId].lastId;
				},
				/** @function sidebar/tasks/isHistoryLimitExceeded */
				isHistoryLimitExceeded: state => chatId => {
					const isAvailable = im_v2_application_core.Core.getStore().getters['application/tariffRestrictions/isHistoryAvailable'];
					if (isAvailable) {
						return false;
					}
					return state.historyLimitExceededCollection[chatId] ?? false;
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/tasks/set */
				set: (store, payload) => {
					const {
						chatId,
						tasks,
						hasNextPage,
						lastId,
						isHistoryLimitExceeded = false
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
					if (!main_core.Type.isNil(hasNextPage)) {
						store.commit('setHasNextPage', {
							chatId,
							hasNextPage
						});
					}
					if (!main_core.Type.isNil(lastId)) {
						store.commit('setLastId', {
							chatId,
							lastId
						});
					}
					tasks.forEach(task => {
						const preparedTask = {
							...this.getElementState(),
							...this.formatFields(task)
						};
						store.commit('add', {
							chatId,
							task: preparedTask
						});
					});
				},
				/** @function sidebar/tasks/clearSearch */
				clearSearch: store => {
					store.commit('clearSearch', {});
				},
				/** @function sidebar/tasks/setSearch */
				setSearch: (store, payload) => {
					const {
						chatId,
						tasks,
						hasNextPage,
						lastId,
						isHistoryLimitExceeded = false
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
					if (!main_core.Type.isNil(hasNextPage)) {
						store.commit('setHasNextPageSearch', {
							chatId,
							hasNextPage
						});
					}
					if (!main_core.Type.isNil(lastId)) {
						store.commit('setLastIdSearch', {
							chatId,
							lastId
						});
					}
					tasks.forEach(task => {
						const preparedTask = {
							...this.getElementState(),
							...this.formatFields(task)
						};
						store.commit('addSearch', {
							chatId,
							task: preparedTask
						});
					});
				},
				/** @function sidebar/tasks/delete */
				delete: (store, payload) => {
					const {
						chatId,
						id
					} = payload;
					if (!main_core.Type.isNumber(chatId) || !main_core.Type.isNumber(id)) {
						return;
					}
					if (!store.state.collection[chatId]) {
						return;
					}
					store.commit('delete', {
						id,
						chatId
					});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					const {
						chatId,
						task
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].items.set(task.id, task);
				},
				addSearch: (state, payload) => {
					const {
						chatId,
						task
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].items.set(task.id, task);
				},
				delete: (state, payload) => {
					const {
						id,
						chatId
					} = payload;
					const hasCollectionSearch = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (hasCollectionSearch) {
						state.collectionSearch[chatId].items.delete(id);
					}
					state.collection[chatId].items.delete(id);
				},
				setHasNextPage: (state, payload) => {
					const {
						chatId,
						hasNextPage
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].hasNextPage = hasNextPage;
				},
				setHasNextPageSearch: (state, payload) => {
					const {
						chatId,
						hasNextPage
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].hasNextPage = hasNextPage;
				},
				setLastId: (state, payload) => {
					const {
						chatId,
						lastId
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].lastId = lastId;
				},
				setLastIdSearch: (state, payload) => {
					const {
						chatId,
						lastId
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].lastId = lastId;
				},
				clearSearch: state => {
					state.collectionSearch = {};
				},
				setHistoryLimitExceeded: (state, payload) => {
					const {
						chatId,
						isHistoryLimitExceeded
					} = payload;
					if (state.historyLimitExceededCollection[chatId] && !isHistoryLimitExceeded) {
						return;
					}
					state.historyLimitExceededCollection[chatId] = isHistoryLimitExceeded;
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, sidebarTaskFieldsConfig);
		}
	}

	const sidebarMeetingFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'authorId',
		targetFieldName: 'authorId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'dateCreate',
		targetFieldName: 'date',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'calendar',
		targetFieldName: 'meeting',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => {
			return formatFieldsWithConfig(target, meetingFieldsConfig);
		}
	}];
	const meetingFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'dateFrom',
		targetFieldName: 'dateFrom',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'dateTo',
		targetFieldName: 'dateTo',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'source',
		targetFieldName: 'source',
		checkFunction: main_core.Type.isString
	}];

	/* eslint-disable no-param-reassign */
	class MeetingsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {},
				collectionSearch: {},
				historyLimitExceededCollection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				messageId: 0,
				chatId: 0,
				authorId: 0,
				date: new Date(),
				meeting: {
					id: 0,
					title: '',
					dateFrom: new Date(),
					dateTo: new Date(),
					source: ''
				}
			};
		}
		getChatState() {
			return {
				items: new Map(),
				hasNextPage: true,
				lastId: 0
			};
		}
		getGetters() {
			return {
				/** @function sidebar/meetings/get */
				get: state => chatId => {
					if (!state.collection[chatId]) {
						return [];
					}
					return [...state.collection[chatId].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/meetings/getSearchResultCollection */
				getSearchResultCollection: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return [];
					}
					return [...state.collectionSearch[chatId].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/meetings/getSize */
				getSize: state => chatId => {
					if (!state.collection[chatId]) {
						return 0;
					}
					return state.collection[chatId].items.size;
				},
				/** @function sidebar/meetings/hasNextPage */
				hasNextPage: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].hasNextPage;
				},
				/** @function sidebar/meetings/getLastId */
				getLastId: state => chatId => {
					if (!state.collection[chatId]) {
						return false;
					}
					return state.collection[chatId].lastId;
				},
				/** @function sidebar/meetings/getSearchResultCollectionLastId */
				getSearchResultCollectionLastId: state => chatId => {
					if (!state.collectionSearch[chatId]) {
						return false;
					}
					return state.collectionSearch[chatId].lastId;
				},
				/** @function sidebar/meetings/isHistoryLimitExceeded */
				isHistoryLimitExceeded: state => chatId => {
					const isAvailable = im_v2_application_core.Core.getStore().getters['application/tariffRestrictions/isHistoryAvailable'];
					if (isAvailable) {
						return false;
					}
					return state.historyLimitExceededCollection[chatId] ?? false;
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/meetings/set */
				set: (store, payload) => {
					const {
						chatId,
						meetings,
						hasNextPage,
						lastId,
						isHistoryLimitExceeded = false
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
					if (!main_core.Type.isNil(hasNextPage)) {
						store.commit('setHasNextPage', {
							chatId,
							hasNextPage
						});
					}
					if (!main_core.Type.isNil(lastId)) {
						store.commit('setLastId', {
							chatId,
							lastId
						});
					}
					meetings.forEach(meeting => {
						const preparedMeeting = {
							...this.getElementState(),
							...this.formatFields(meeting)
						};
						store.commit('add', {
							chatId,
							meeting: preparedMeeting
						});
					});
				},
				/** @function sidebar/meetings/setSearch */
				setSearch: (store, payload) => {
					const {
						chatId,
						meetings,
						hasNextPage,
						lastId,
						isHistoryLimitExceeded = false
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
					if (!main_core.Type.isNil(hasNextPage)) {
						store.commit('setHasNextPageSearch', {
							chatId,
							hasNextPage
						});
					}
					if (!main_core.Type.isNil(lastId)) {
						store.commit('setLastIdSearch', {
							chatId,
							lastId
						});
					}
					meetings.forEach(meeting => {
						const preparedMeeting = {
							...this.getElementState(),
							...this.formatFields(meeting)
						};
						store.commit('addSearch', {
							chatId,
							meeting: preparedMeeting
						});
					});
				},
				/** @function sidebar/meetings/delete */
				delete: (store, payload) => {
					const {
						chatId,
						id
					} = payload;
					if (!main_core.Type.isNumber(chatId) || !main_core.Type.isNumber(id)) {
						return;
					}
					if (!store.state.collection[chatId]) {
						return;
					}
					store.commit('delete', {
						id,
						chatId
					});
				},
				/** @function sidebar/meetings/clearSearch */
				clearSearch: store => {
					store.commit('clearSearch', {});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					const {
						chatId,
						meeting
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].items.set(meeting.id, meeting);
				},
				addSearch: (state, payload) => {
					const {
						chatId,
						meeting
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].items.set(meeting.id, meeting);
				},
				delete: (state, payload) => {
					const {
						id,
						chatId
					} = payload;
					const hasCollectionSearch = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (hasCollectionSearch) {
						state.collectionSearch[chatId].items.delete(id);
					}
					state.collection[chatId].items.delete(id);
				},
				setHasNextPage: (state, payload) => {
					const {
						chatId,
						hasNextPage
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].hasNextPage = hasNextPage;
				},
				setHasNextPageSearch: (state, payload) => {
					const {
						chatId,
						hasNextPage
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].hasNextPage = hasNextPage;
				},
				setLastId: (state, payload) => {
					const {
						chatId,
						lastId
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collection[chatId]);
					if (!hasCollection) {
						state.collection[chatId] = this.getChatState();
					}
					state.collection[chatId].lastId = lastId;
				},
				setLastIdSearch: (state, payload) => {
					const {
						chatId,
						lastId
					} = payload;
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId]);
					if (!hasCollection) {
						state.collectionSearch[chatId] = this.getChatState();
					}
					state.collectionSearch[chatId].lastId = lastId;
				},
				clearSearch: state => {
					state.collectionSearch = {};
				},
				setHistoryLimitExceeded: (state, payload) => {
					const {
						chatId,
						isHistoryLimitExceeded
					} = payload;
					if (state.historyLimitExceededCollection[chatId] && !isHistoryLimitExceeded) {
						return;
					}
					state.historyLimitExceededCollection[chatId] = isHistoryLimitExceeded;
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, sidebarMeetingFieldsConfig);
		}
	}

	const sidebarFilesFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'authorId',
		targetFieldName: 'authorId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: ['dateCreate', 'date'],
		targetFieldName: 'date',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: ['fileId', 'id'],
		targetFieldName: 'fileId',
		checkFunction: main_core.Type.isNumber
	}];

	/* eslint-disable no-param-reassign */
	class FilesModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {},
				collectionSearch: {},
				historyLimitExceededCollection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				messageId: 0,
				chatId: 0,
				authorId: 0,
				date: new Date(),
				fileId: 0
			};
		}
		getChatState() {
			return {
				items: new Map(),
				hasNextPage: true,
				lastId: 0
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getGetters() {
			return {
				/** @function sidebar/files/get */
				get: state => (chatId, group) => {
					if (!state.collection[chatId] || !state.collection[chatId][group]) {
						return [];
					}
					return [...state.collection[chatId][group].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/files/getSearchResultCollection */
				getSearchResultCollection: state => (chatId, group) => {
					if (!state.collectionSearch[chatId] || !state.collectionSearch[chatId][group]) {
						return [];
					}
					return [...state.collectionSearch[chatId][group].items.values()].sort((a, b) => b.id - a.id);
				},
				/** @function sidebar/files/getLatest */
				getLatest: (state, getters, rootState, rootGetters) => chatId => {
					if (!state.collection[chatId]) {
						return [];
					}
					let media = [];
					let audio = [];
					let files = [];
					let briefs = [];
					if (state.collection[chatId][im_v2_const.SidebarFileGroups.media]) {
						media = [...state.collection[chatId][im_v2_const.SidebarFileGroups.media].items.values()];
					}
					if (state.collection[chatId][im_v2_const.SidebarFileGroups.audio]) {
						audio = [...state.collection[chatId][im_v2_const.SidebarFileGroups.audio].items.values()];
					}
					if (state.collection[chatId][im_v2_const.SidebarFileGroups.file]) {
						files = [...state.collection[chatId][im_v2_const.SidebarFileGroups.file].items.values()];
					}
					if (state.collection[chatId][im_v2_const.SidebarFileGroups.brief]) {
						briefs = [...state.collection[chatId][im_v2_const.SidebarFileGroups.brief].items.values()];
					}
					const sortedFlatCollection = [media, audio, files, briefs].flat().sort((a, b) => b.id - a.id);
					return this.getTopThreeCompletedFiles(sortedFlatCollection, rootGetters);
				},
				/** @function sidebar/files/getLatestUnsorted */
				getLatestUnsorted: (state, getters, rootState, rootGetters) => chatId => {
					if (!state.collection[chatId]) {
						return [];
					}
					let unsorted = [];
					if (state.collection[chatId][im_v2_const.SidebarFileGroups.fileUnsorted]) {
						unsorted = [...state.collection[chatId][im_v2_const.SidebarFileGroups.fileUnsorted].items.values()];
					}
					const sortedCollection = unsorted.sort((a, b) => b.id - a.id);
					return this.getTopThreeCompletedFiles(sortedCollection, rootGetters);
				},
				/** @function sidebar/files/getSize */
				getSize: state => (chatId, group) => {
					if (!state.collection[chatId] || !state.collection[chatId][group]) {
						return 0;
					}
					return state.collection[chatId][group].items.size;
				},
				/** @function sidebar/files/hasNextPage */
				hasNextPage: state => (chatId, group) => {
					if (!state.collection[chatId] || !state.collection[chatId][group]) {
						return false;
					}
					return state.collection[chatId][group].hasNextPage;
				},
				/** @function sidebar/files/hasNextPageSearch */
				hasNextPageSearch: state => (chatId, group) => {
					if (!state.collectionSearch[chatId] || !state.collectionSearch[chatId][group]) {
						return false;
					}
					return state.collectionSearch[chatId][group].hasNextPage;
				},
				/** @function sidebar/files/getLastId */
				getLastId: state => (chatId, group) => {
					if (!state.collection[chatId] || !state.collection[chatId][group]) {
						return false;
					}
					return state.collection[chatId][group].lastId;
				},
				/** @function sidebar/files/getSearchResultCollectionLastId */
				getSearchResultCollectionLastId: state => (chatId, group) => {
					if (!state.collectionSearch[chatId] || !state.collectionSearch[chatId][group]) {
						return false;
					}
					return state.collectionSearch[chatId][group].lastId;
				},
				/** @function sidebar/files/isHistoryLimitExceeded */
				isHistoryLimitExceeded: state => chatId => {
					const isAvailable = im_v2_application_core.Core.getStore().getters['application/tariffRestrictions/isHistoryAvailable'];
					if (isAvailable) {
						return false;
					}
					return state.historyLimitExceededCollection[chatId] ?? false;
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/files/set */
				set: (store, payload) => {
					const {
						chatId,
						files,
						group
					} = payload;
					if (!main_core.Type.isArrayFilled(files) || !main_core.Type.isNumber(chatId)) {
						return;
					}
					files.forEach(file => {
						const preparedFile = {
							...this.getElementState(),
							...this.formatFields(file)
						};
						store.commit('add', {
							chatId,
							group,
							file: preparedFile
						});
					});
				},
				/** @function sidebar/files/setSearch */
				setSearch: (store, payload) => {
					const {
						chatId,
						files,
						group
					} = payload;
					if (!main_core.Type.isArrayFilled(files) || !main_core.Type.isNumber(chatId)) {
						return;
					}
					files.forEach(file => {
						const preparedFile = {
							...this.getElementState(),
							...this.formatFields(file)
						};
						store.commit('addSearch', {
							chatId,
							group,
							file: preparedFile
						});
					});
				},
				/** @function sidebar/files/delete */
				delete: (store, payload) => {
					const {
						chatId,
						id
					} = payload;
					if (!main_core.Type.isNumber(id) || !main_core.Type.isNumber(chatId)) {
						return;
					}
					if (!store.state.collection[chatId]) {
						return;
					}
					store.commit('delete', {
						chatId,
						id
					});
				},
				/** @function sidebar/files/setHasNextPage */
				setHasNextPage: (store, payload) => {
					const {
						chatId,
						group,
						hasNextPage
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					if (!store.state.collection[chatId]) {
						return;
					}
					store.commit('setHasNextPage', {
						chatId,
						group,
						hasNextPage
					});
				},
				/** @function sidebar/files/setHasNextPageSearch */
				setHasNextPageSearch: (store, payload) => {
					const {
						chatId,
						group,
						hasNextPage
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					if (!store.state.collectionSearch[chatId]) {
						return;
					}
					store.commit('setHasNextPageSearch', {
						chatId,
						group,
						hasNextPage
					});
				},
				/** @function sidebar/files/setLastId */
				setLastId: (store, payload) => {
					const {
						chatId,
						group,
						lastId
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					if (!store.state.collection[chatId]) {
						return;
					}
					store.commit('setLastId', {
						chatId,
						group,
						lastId
					});
				},
				/** @function sidebar/files/setLastIdSearch */
				setLastIdSearch: (store, payload) => {
					const {
						chatId,
						group,
						lastId
					} = payload;
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					if (!store.state.collectionSearch[chatId]) {
						return;
					}
					store.commit('setLastIdSearch', {
						chatId,
						group,
						lastId
					});
				},
				/** @function sidebar/files/clearSearch */
				clearSearch: store => {
					store.commit('clearSearch', {});
				},
				/** @function sidebar/files/setHistoryLimitExceeded */
				setHistoryLimitExceeded: (store, payload) => {
					const {
						chatId,
						isHistoryLimitExceeded = false
					} = payload;
					store.commit('setHistoryLimitExceeded', {
						chatId,
						isHistoryLimitExceeded
					});
				}
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getMutations() {
			return {
				add: (state, payload) => {
					const {
						chatId,
						file,
						group
					} = payload;
					if (!state.collection[chatId]) {
						state.collection[chatId] = {};
					}
					if (!state.collection[chatId][group]) {
						state.collection[chatId][group] = this.getChatState();
					}
					state.collection[chatId][group].items.set(file.id, file);
				},
				addSearch: (state, payload) => {
					const {
						chatId,
						file,
						group
					} = payload;
					if (!state.collectionSearch[chatId]) {
						state.collectionSearch[chatId] = {};
					}
					if (!state.collectionSearch[chatId][group]) {
						state.collectionSearch[chatId][group] = this.getChatState();
					}
					state.collectionSearch[chatId][group].items.set(file.id, file);
				},
				delete: (state, payload) => {
					const {
						chatId,
						id
					} = payload;
					const hasCollectionSearch = !main_core.Type.isNil(state.collectionSearch[chatId]);
					Object.values(im_v2_const.SidebarFileGroups).forEach(group => {
						if (state.collection[chatId][group] && state.collection[chatId][group].items.has(id)) {
							state.collection[chatId][group].items.delete(id);
							if (hasCollectionSearch) {
								state.collectionSearch[chatId][group].items.delete(id);
							}
						}
					});
				},
				setHasNextPage: (state, payload) => {
					const {
						chatId,
						group,
						hasNextPage
					} = payload;
					if (!state.collection[chatId]) {
						state.collection[chatId] = {};
					}
					const hasCollection = !main_core.Type.isNil(state.collection[chatId][group]);
					if (!hasCollection) {
						state.collection[chatId][group] = this.getChatState();
					}
					state.collection[chatId][group].hasNextPage = hasNextPage;
				},
				setHasNextPageSearch: (state, payload) => {
					const {
						chatId,
						group,
						hasNextPage
					} = payload;
					if (!state.collectionSearch[chatId]) {
						state.collectionSearch[chatId] = {};
					}
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId][group]);
					if (!hasCollection) {
						state.collectionSearch[chatId][group] = this.getChatState();
					}
					state.collectionSearch[chatId][group].hasNextPage = hasNextPage;
				},
				setLastId: (state, payload) => {
					const {
						chatId,
						group,
						lastId
					} = payload;
					if (!state.collection[chatId]) {
						state.collection[chatId] = {};
					}
					const hasCollection = !main_core.Type.isNil(state.collection[chatId][group]);
					if (!hasCollection) {
						state.collection[chatId][group] = this.getChatState();
					}
					state.collection[chatId][group].lastId = lastId;
				},
				setLastIdSearch: (state, payload) => {
					const {
						chatId,
						group,
						lastId
					} = payload;
					if (!state.collectionSearch[chatId]) {
						state.collectionSearch[chatId] = {};
					}
					const hasCollection = !main_core.Type.isNil(state.collectionSearch[chatId][group]);
					if (!hasCollection) {
						state.collectionSearch[chatId][group] = this.getChatState();
					}
					state.collectionSearch[chatId][group].lastId = lastId;
				},
				clearSearch: state => {
					state.collectionSearch = {};
				},
				setHistoryLimitExceeded: (state, payload) => {
					const {
						chatId,
						isHistoryLimitExceeded
					} = payload;
					if (state.historyLimitExceededCollection[chatId] && !isHistoryLimitExceeded) {
						return;
					}
					state.historyLimitExceededCollection[chatId] = isHistoryLimitExceeded;
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, sidebarFilesFieldsConfig);
		}
		getTopThreeCompletedFiles(collection, rootGetters) {
			return collection.filter(sidebarFile => {
				const file = rootGetters['files/get'](sidebarFile.fileId, true);
				return file.progress === 100;
			}).slice(0, 3);
		}
	}

	const sidebarMultidialogFieldsConfig = [{
		fieldName: 'dialogId',
		targetFieldName: 'dialogId',
		checkFunction: main_core.Type.String
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'openSessionsLimit',
		targetFieldName: 'openSessionsLimit',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'status',
		targetFieldName: 'status',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'dateMessage',
		targetFieldName: 'date',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}];

	/* eslint-disable no-param-reassign */
	class MultidialogModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				isInited: false,
				isInitedDetail: false,
				chatsCount: 0,
				unreadChats: new Set(),
				openSessionsLimit: 0,
				multidialogs: {}
			};
		}
		getElementState() {
			return {
				dialogId: '',
				chatId: 0,
				status: '',
				date: new Date()
			};
		}
		getGetters() {
			return {
				/** @function sidebar/multidialog/isInited */
				isInited: ({
					isInited
				}) => {
					return isInited;
				},
				/** @function sidebar/multidialog/isInitedDetail */
				isInitedDetail: ({
					isInitedDetail
				}) => {
					return isInitedDetail;
				},
				/** @function sidebar/multidialog/getOpenSessionsLimit */
				getOpenSessionsLimit: ({
					openSessionsLimit
				}) => {
					return openSessionsLimit;
				},
				/** @function sidebar/multidialog/getChatsCount */
				getChatsCount: ({
					chatsCount
				}) => {
					return chatsCount;
				},
				/** @function sidebar/multidialog/getTotalChatCounter */
				getTotalChatCounter: ({
					unreadChats
				}) => {
					return im_v2_application_core.Core.getStore().getters['counters/getTotalCounterByIds']([...unreadChats]);
				},
				/** @function sidebar/multidialog/get */
				get: ({
					multidialogs
				}) => chatId => {
					return multidialogs[chatId];
				},
				/** @function sidebar/multidialog/isSupport */
				isSupport: () => dialogId => {
					const isSupportBot = im_v2_application_core.Core.getStore().getters['users/bots/isSupport'](dialogId);
					const isSupportChat = im_v2_application_core.Core.getStore().getters['chats/isSupport'](dialogId);
					return isSupportChat || isSupportBot;
				},
				/** @function sidebar/multidialog/hasNextPage */
				hasNextPage: ({
					chatsCount,
					multidialogs
				}) => {
					return chatsCount > Object.keys(multidialogs).length;
				},
				/** @function sidebar/multidialog/getNumberMultidialogs */
				getNumberMultidialogs: ({
					multidialogs
				}) => {
					return Object.keys(multidialogs).length;
				},
				/** @function sidebar/multidialog/getMultidialogsByStatus */
				getMultidialogsByStatus: ({
					multidialogs
				}) => status => {
					return Object.values(multidialogs).filter(multidialog => status.includes(multidialog.status));
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/multidialog/setInited */
				setInited: (store, isInited) => {
					store.commit('setInited', isInited);
				},
				/** @function sidebar/multidialog/setInitedDetail */
				setInitedDetail: (store, isInitedDetail) => {
					store.commit('setInitedDetail', isInitedDetail);
				},
				/** @function sidebar/multidialog/addMultidialogs */
				addMultidialogs: (store, multidialogs) => {
					if (!main_core.Type.isArray(multidialogs)) {
						return;
					}
					multidialogs.forEach(multidialog => {
						const preparedTicket = {
							...this.getElementState(),
							...this.formatFields(multidialog)
						};
						store.commit('addMultidialog', preparedTicket);
					});
				},
				/** @function sidebar/multidialog/setOpenSessionsLimit */
				setOpenSessionsLimit: (store, openSessionsLimit) => {
					if (main_core.Type.isNumber(openSessionsLimit)) {
						store.commit('setOpenSessionsLimit', openSessionsLimit);
					}
				},
				/** @function sidebar/multidialog/setChatsCount */
				setChatsCount: (store, chatsCount) => {
					if (main_core.Type.isNumber(chatsCount)) {
						store.commit('setChatsCount', chatsCount);
					}
				},
				/** @function sidebar/multidialog/setUnreadChats */
				setUnreadChats: (store, unreadChats) => {
					if (main_core.Type.isArray(unreadChats)) {
						store.commit('setUnreadChats', unreadChats);
					}
				},
				/** @function sidebar/multidialog/set */
				set: (store, payload) => {
					const {
						unreadChats,
						multidialogs,
						chatsCount,
						openSessionsLimit
					} = payload;
					store.dispatch('setUnreadChats', unreadChats);
					store.dispatch('setChatsCount', chatsCount);
					store.dispatch('setOpenSessionsLimit', openSessionsLimit);
					store.dispatch('addMultidialogs', multidialogs);
				},
				/** @function sidebar/multidialog/deleteUnreadChats */
				deleteUnreadChats: (store, chatId) => {
					store.commit('deleteUnreadChats', chatId);
				}
			};
		}
		getMutations() {
			return {
				/** @function sidebar/multidialog/setInited */
				setInited: (state, isInited) => {
					state.isInited = isInited;
				},
				/** @function sidebar/multidialog/setInitedDetail */
				setInitedDetail: (state, isInitedDetail) => {
					state.isInitedDetail = isInitedDetail;
				},
				addMultidialog: (state, multidialog) => {
					state.multidialogs[multidialog.chatId] = multidialog;
				},
				setChatsCount: (state, chatsCount) => {
					state.chatsCount = chatsCount;
				},
				setOpenSessionsLimit: (state, openSessionsLimit) => {
					state.openSessionsLimit = openSessionsLimit;
				},
				setUnreadChats: (state, unreadChats) => {
					unreadChats.forEach(chatId => {
						state.unreadChats.add(chatId);
					});
				},
				deleteUnreadChats: ({
					unreadChats
				}, chatId) => {
					unreadChats.delete(chatId);
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, sidebarMultidialogFieldsConfig);
		}
	}

	const sidebarSharedLinkFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'code',
		targetFieldName: 'code',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'dateCreate',
		targetFieldName: 'dateCreate',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'dateExpire',
		targetFieldName: 'dateExpire',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_lib_utils.Utils.date.cast
	}, {
		fieldName: 'entityId',
		targetFieldName: 'entityId',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'entityType',
		targetFieldName: 'entityType',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'requireApproval',
		targetFieldName: 'requireApproval',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'url',
		targetFieldName: 'url',
		checkFunction: main_core.Type.isString
	}];

	const EntityType = {
		chat: 'chat',
		guestChat: 'guest_chat'
	};
	class SharedLinkModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				code: '',
				dateCreate: new Date(),
				dateExpire: null,
				entityId: '',
				entityType: '',
				requireApproval: false,
				type: '',
				url: ''
			};
		}
		getGetters() {
			return {
				/** @function sidebar/sharedLink/getChatInviteLink */
				getChatInviteLink: state => chatId => {
					const entityId = chatId.toString();
					return Object.values(state.collection).find(link => {
						return link.entityId === entityId && link.entityType === EntityType.chat;
					});
				},
				/** @function sidebar/sharedLink/getGuestInviteLink */
				getGuestInviteLink: state => chatId => {
					const entityId = chatId.toString();
					return Object.values(state.collection).find(link => {
						return link.entityId === entityId && link.entityType === EntityType.guestChat;
					});
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/sharedLink/set */
				set: (store, rawPayload) => {
					let payload = rawPayload;
					if (!Array.isArray(payload) && main_core.Type.isPlainObject(payload)) {
						payload = [payload];
					}
					const preparedLink = payload.map(link => {
						return this.formatFields(link);
					});
					preparedLink.forEach(link => {
						const existingLink = store.state.collection[link.id];
						if (existingLink) {
							store.commit('update', {
								id: link.id,
								fields: link
							});
							return;
						}
						store.commit('add', {
							id: link.id,
							fields: {
								...this.getElementState(),
								...link
							}
						});
					});
				},
				/** @function sidebar/sharedLink/regenerate */
				regenerate: (store, payload) => {
					const {
						newLink
					} = payload;
					const chatId = Number(newLink.entityId);
					const getterByEntityType = {
						[EntityType.guestChat]: 'sidebar/sharedLink/getGuestInviteLink',
						[EntityType.chat]: 'sidebar/sharedLink/getChatInviteLink'
					};
					const currentLink = im_v2_application_core.Core.getStore().getters[getterByEntityType[newLink.entityType]](chatId);
					void im_v2_application_core.Core.getStore().dispatch('sidebar/sharedLink/set', newLink);
					if (currentLink && currentLink.id !== newLink.id) {
						store.commit('delete', {
							id: currentLink.id
						});
					}
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					// eslint-disable-next-line no-param-reassign
					state.collection[payload.id] = payload.fields;
				},
				update: (state, payload) => {
					// eslint-disable-next-line no-param-reassign
					state.collection[payload.id] = {
						...state.collection[payload.id],
						...payload.fields
					};
				},
				delete: (state, payload) => {
					// eslint-disable-next-line no-param-reassign
					delete state.collection[payload.id];
				}
			};
		}
		formatFields(fields) {
			return im_v2_model.formatFieldsWithConfig(fields, sidebarSharedLinkFieldsConfig);
		}
	}

	/* eslint-disable no-param-reassign */
	class SidebarModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'sidebar';
		}
		getNestedModules() {
			return {
				members: MembersModel,
				links: LinksModel,
				favorites: FavoritesModel,
				tasks: TasksModel,
				meetings: MeetingsModel,
				files: FilesModel,
				multidialog: MultidialogModel,
				messageSearch: MessageSearchModel,
				sharedLink: SharedLinkModel
			};
		}
		getState() {
			return {
				initedList: new Set(),
				isFilesMigrated: false,
				isLinksMigrated: false
			};
		}
		getGetters() {
			return {
				/** @function sidebar/isInited */
				isInited: state => chatId => {
					return state.initedList.has(chatId);
				},
				/** @function sidebar/hasHistoryLimit */
				hasHistoryLimit: () => chatId => {
					const limitsByPanel = ['sidebar/links/isHistoryLimitExceeded', 'sidebar/files/isHistoryLimitExceeded', 'sidebar/favorites/isHistoryLimitExceeded', 'sidebar/meetings/isHistoryLimitExceeded', 'sidebar/tasks/isHistoryLimitExceeded', 'sidebar/messageSearch/isHistoryLimitExceeded'].map(getterName => im_v2_application_core.Core.getStore().getters[getterName](chatId));
					return limitsByPanel.some(hasLimit => hasLimit);
				}
			};
		}
		getActions() {
			return {
				/** @function sidebar/setInited */
				setInited: (store, chatId) => {
					if (!main_core.Type.isNumber(chatId)) {
						return;
					}
					store.commit('setInited', chatId);
				},
				/** @function sidebar/setFilesMigrated */
				setFilesMigrated: (store, value) => {
					if (!main_core.Type.isBoolean(value)) {
						return;
					}
					store.commit('setFilesMigrated', value);
				},
				/** @function sidebar/setLinksMigrated */
				setLinksMigrated: (store, value) => {
					if (!main_core.Type.isBoolean(value)) {
						return;
					}
					store.commit('setLinksMigrated', value);
				}
			};
		}
		getMutations() {
			return {
				setInited: (state, chatId) => {
					state.initedList.add(chatId);
				},
				setFilesMigrated: (state, payload) => {
					state.isFilesMigrated = payload;
				},
				setLinksMigrated: (state, payload) => {
					state.isLinksMigrated = payload;
				}
			};
		}
	}

	class MarketModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'market';
		}
		getState() {
			return {
				collection: new Map(),
				placementCollection: {
					[im_v2_const.PlacementType.contextMenu]: new Set(),
					[im_v2_const.PlacementType.navigation]: new Set(),
					[im_v2_const.PlacementType.textarea]: new Set(),
					[im_v2_const.PlacementType.sidebar]: new Set(),
					[im_v2_const.PlacementType.smilesSelector]: new Set()
				}
			};
		}
		getElementState() {
			return {
				id: 0,
				title: '',
				options: {
					role: '',
					extranet: '',
					context: null,
					width: null,
					height: null,
					color: null,
					iconName: null
				},
				placement: '',
				order: 0,
				loadConfiguration: {
					ID: 0,
					PLACEMENT: '',
					PLACEMENT_ID: 0
				}
			};
		}
		getGetters() {
			return {
				getByPlacement: state => placement => {
					const appIds = [...state.placementCollection[placement].values()];
					return appIds.map(id => {
						return state.collection.get(id);
					});
				},
				getById: state => id => {
					return state.collection.get(id);
				}
			};
		}
		getActions() {
			return {
				set: (store, payload) => {
					const {
						items
					} = payload;
					items.forEach(item => {
						store.commit('setPlacementCollection', {
							placement: item.placement,
							id: item.id
						});
						store.commit('setCollection', item);
					});
				}
			};
		}
		getMutations() {
			return {
				setPlacementCollection: (state, payload) => {
					state.placementCollection[payload.placement].add(payload.id);
				},
				setCollection: (state, payload) => {
					state.collection.set(payload.id, {
						...this.getElementState(),
						...this.#validate(payload)
					});
				}
			};
		}
		#validate(app) {
			const result = {};
			if (main_core.Type.isNumber(app.id) || main_core.Type.isStringFilled(app.id)) {
				result.id = app.id.toString();
			}
			if (main_core.Type.isString(app.title)) {
				result.title = app.title;
			}
			result.options = this.#validateOptions(app.options);
			if (main_core.Type.isString(app.placement)) {
				result.placement = app.placement;
			}
			if (main_core.Type.isNumber(app.order)) {
				result.order = app.order;
			}
			result.loadConfiguration = this.#validateLoadConfiguration(app.loadConfiguration);
			return result;
		}
		#validateOptions(options) {
			const result = {
				context: null,
				width: null,
				height: null,
				color: null,
				iconName: null
			};
			if (!main_core.Type.isPlainObject(options)) {
				return result;
			}
			if (main_core.Type.isArrayFilled(options.context)) {
				result.context = options.context;
			}
			if (main_core.Type.isNumber(options.width)) {
				result.width = options.width;
			}
			if (main_core.Type.isNumber(options.height)) {
				result.height = options.height;
			}
			if (main_core.Type.isStringFilled(options.color)) {
				result.color = options.color;
			}
			if (main_core.Type.isStringFilled(options.iconName)) {
				result.iconName = options.iconName;
			}
			return result;
		}
		#validateLoadConfiguration(configuration) {
			const result = {
				ID: 0,
				PLACEMENT: '',
				PLACEMENT_ID: 0
			};
			if (!main_core.Type.isPlainObject(configuration)) {
				return result;
			}
			if (main_core.Type.isNumber(configuration.ID)) {
				result.ID = configuration.ID;
			}
			if (main_core.Type.isStringFilled(configuration.PLACEMENT)) {
				result.PLACEMENT = configuration.PLACEMENT;
			}
			if (main_core.Type.isNumber(configuration.PLACEMENT_ID)) {
				result.PLACEMENT_ID = configuration.PLACEMENT_ID;
			}
			return result;
		}
	}

	const counterFieldsConfig = [{
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'parentChatId',
		targetFieldName: 'parentChatId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'counter',
		targetFieldName: 'counter',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'isMarkedAsUnread',
		targetFieldName: 'isMarkedAsUnread',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'isMuted',
		targetFieldName: 'isMuted',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'recentSections',
		targetFieldName: 'recentSections',
		checkFunction: main_core.Type.isArray
	}];

	// noinspection UnnecessaryLocalVariableJS
	class CountersModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'counters';
		}
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				chatId: 0,
				parentChatId: 0,
				counter: 0,
				isMarkedAsUnread: false,
				isMuted: false,
				recentSections: []
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getGetters() {
			return {
				/** @function counters/getTotalChatCounter */
				getTotalChatCounter: (state, getters) => {
					return getters.getCounterByRecentType(im_v2_const.RecentType.default);
				},
				/** @function counters/getTotalCopilotCounter */
				getTotalCopilotCounter: (state, getters) => {
					return getters.getCounterByRecentType(im_v2_const.RecentType.copilot);
				},
				/** @function counters/getTotalCollabCounter */
				getTotalCollabCounter: (state, getters) => {
					return getters.getCounterByRecentType(im_v2_const.RecentType.collab);
				},
				/** @function counters/getTotalTaskCounter */
				getTotalTaskCounter: (state, getters) => {
					return getters.getCounterByRecentType(im_v2_const.RecentType.taskComments);
				},
				/** @function counters/getTotalLinesCounter */
				getTotalLinesCounter: (state, getters) => {
					return getters.getCounterByRecentType(im_v2_const.RecentType.openlines);
				},
				/** @function counters/getRecentSectionsByChatId */
				getRecentSectionsByChatId: state => chatId => {
					const counterItem = state.collection[chatId];
					if (!counterItem) {
						return [];
					}
					return counterItem.recentSections;
				},
				/** @function counters/getCounterByRecentType */
				getCounterByRecentType: state => recentType => {
					let totalCount = 0;
					const collection = state.collection;
					const shouldCheckParentMute = !im_v2_lib_recent.RecentManager.isTypeWithNestedChats(recentType);
					for (const counterItem of Object.values(collection)) {
						if (!this.#shouldCountByRecentType({
							collection,
							counterItem,
							recentType
						})) {
							continue;
						}
						if (this.#isMuted(counterItem)) {
							continue;
						}
						if (shouldCheckParentMute && this.#isParentMuted(state.collection, counterItem)) {
							continue;
						}
						totalCount += this.#resolveCounter(counterItem);
					}
					return totalCount;
				},
				/** @function counters/getTotalCounterByIds */
				getTotalCounterByIds: state => chatIds => {
					let totalCount = 0;
					for (const chatId of chatIds) {
						const counterItem = state.collection[chatId];
						if (!counterItem) {
							continue;
						}
						if (this.#isMuted(counterItem) || this.#isParentMuted(state.collection, counterItem)) {
							continue;
						}
						totalCount += this.#resolveCounter(counterItem);
					}
					return totalCount;
				},
				/** @function counters/getTotalCounterByIdsWithChildren */
				getTotalCounterByIdsWithChildren: state => chatIds => {
					let totalCount = 0;
					for (const chatId of chatIds) {
						const counterItem = state.collection[chatId];
						if (!counterItem) {
							continue;
						}
						if (this.#isMuted(counterItem) || this.#isParentMuted(state.collection, counterItem)) {
							continue;
						}
						totalCount += this.#resolveCounter(counterItem) + this.#sumChildrenCounter(state.collection, chatId);
					}
					return totalCount;
				},
				/** @function counters/getChildrenTotalCounter */
				getChildrenTotalCounter: state => (parentChatId, recentType) => {
					return this.#sumChildrenCounter(state.collection, parentChatId, recentType);
				},
				/** @function counters/getChildrenIdsWithCounter */
				getChildrenIdsWithCounter: state => parentChatId => {
					if (parentChatId === 0) {
						return [];
					}
					const childrenIdsWithCounter = [];
					for (const counterItem of Object.values(state.collection)) {
						const hasRequiredParent = counterItem.parentChatId === parentChatId;
						if (!hasRequiredParent || counterItem.counter === 0) {
							continue;
						}
						childrenIdsWithCounter.push(counterItem.chatId);
					}
					return childrenIdsWithCounter;
				},
				/** @function counters/getCounterByChatId */
				getCounterByChatId: state => chatId => {
					const counterItem = state.collection[chatId];
					if (!counterItem) {
						return 0;
					}
					return counterItem.counter;
				},
				/** @function counters/getUnreadStatus */
				getUnreadStatus: state => chatId => {
					const counterItem = state.collection[chatId];
					if (!counterItem) {
						return false;
					}
					return counterItem.isMarkedAsUnread;
				}
			};
		}

		/* eslint-disable no-param-reassign */
		getActions() {
			return {
				/** @function counters/setCounters */
				setCounters: (store, payload) => {
					if (!main_core.Type.isArray(payload)) {
						return;
					}
					const preparedItems = payload.map(counterItem => {
						const preparedItem = this.#formatFields(counterItem);
						const existingItem = store.state.collection[counterItem.chatId];
						if (existingItem) {
							return {
								...existingItem,
								...preparedItem
							};
						}
						return {
							...this.getElementState(),
							...preparedItem
						};
					});
					store.commit('setCounters', preparedItems);
				},
				/** @function counters/setCounter */
				setCounter: (store, payload) => {
					const {
						chatId
					} = payload;
					const existingItem = store.state.collection[chatId];
					if (!existingItem) {
						return;
					}
					store.commit('setCounter', payload);
				},
				/** @function counters/setUnreadStatus */
				setUnreadStatus: (store, payload) => {
					const {
						chatId
					} = payload;
					const existingItem = store.state.collection[chatId];
					if (!existingItem) {
						return;
					}
					store.commit('setUnreadStatus', payload);
				},
				/** @function counters/setMuteStatus */
				setMuteStatus: (store, payload) => {
					const {
						chatId
					} = payload;
					const existingItem = store.state.collection[chatId];
					if (!existingItem) {
						return;
					}
					store.commit('setMuteStatus', payload);
				},
				/** @function counters/clearByRecentType */
				clearByRecentType: (store, payload) => {
					const {
						recentType,
						parentChatId
					} = payload;
					const collection = store.state.collection;
					const idsToDelete = [];
					for (const counterItem of Object.values(collection)) {
						if (!this.#shouldClearByRecentType({
							collection,
							counterItem,
							recentType,
							parentChatId
						})) {
							continue;
						}
						idsToDelete.push(counterItem.chatId);
					}
					for (const chatId of idsToDelete) {
						store.commit('delete', chatId);
					}
				},
				/** @function counters/clearById */
				clearById: (store, payload) => {
					const {
						chatId
					} = payload;
					const collection = store.state.collection;
					store.commit('delete', chatId);
					for (const counterItem of Object.values(collection)) {
						const hasRequiredParent = counterItem.parentChatId === chatId;
						if (!hasRequiredParent) {
							continue;
						}
						store.commit('delete', counterItem.chatId);
					}
				},
				/** @function counters/clearByParentId */
				clearByParentId: (store, payload) => {
					const {
						parentChatId
					} = payload;
					const collection = store.state.collection;
					for (const counterItem of Object.values(collection)) {
						const hasRequiredParent = counterItem.parentChatId === parentChatId;
						if (!hasRequiredParent) {
							continue;
						}
						store.commit('delete', counterItem.chatId);
					}
				},
				/** @function counters/clear */
				clear: store => {
					store.commit('clearCollection');
				}
			};
		}
		getMutations() {
			return {
				setCounters: (state, payload) => {
					payload.forEach(counterItem => {
						state.collection[counterItem.chatId] = counterItem;
					});
				},
				setCounter: (state, payload) => {
					const {
						chatId,
						counter
					} = payload;
					const existingItem = state.collection[chatId];
					existingItem.counter = counter;
				},
				setUnreadStatus: (state, payload) => {
					const {
						chatId,
						status
					} = payload;
					const existingItem = state.collection[chatId];
					existingItem.isMarkedAsUnread = status;
				},
				setMuteStatus: (state, payload) => {
					const {
						chatId,
						status
					} = payload;
					const existingItem = state.collection[chatId];
					existingItem.isMuted = status;
				},
				delete: (state, chatId) => {
					delete state.collection[chatId];
				},
				clearCollection: state => {
					state.collection = {};
				}
			};
		}
		#shouldCountByRecentType(params) {
			const {
				collection,
				counterItem,
				recentType
			} = params;

			// chat's parent has section
			if (this.#hasParentRecentType({
				collection,
				counterItem,
				recentType
			})) {
				return true;
			}
			const isNestedChat = counterItem.parentChatId > 0;
			if (isNestedChat) {
				const shouldUseChildrenCounter = im_v2_lib_recent.RecentManager.isTypeWithNestedChats(recentType);

				// nested chat has its own section - only for specific recent types
				return shouldUseChildrenCounter && this.#hasRecentType(counterItem, recentType);
			}
			return this.#hasRecentType(counterItem, recentType);
		}
		#shouldClearByRecentType(params) {
			const {
				collection,
				counterItem,
				recentType,
				parentChatId
			} = params;

			// chat's parent has section
			if (this.#hasParentRecentType({
				collection,
				counterItem,
				recentType
			})) {
				return true;
			}
			const isAllScope = parentChatId === im_v2_const.ParentChatScope.all;
			const matchesParentScope = isAllScope || parentChatId === counterItem.parentChatId;
			if (!matchesParentScope) {
				return false;
			}
			return this.#hasRecentType(counterItem, recentType);
		}
		#hasRecentType(counterItem, recentType) {
			return counterItem.recentSections.includes(recentType);
		}
		#hasParentRecentType(params) {
			const {
				counterItem,
				collection,
				recentType
			} = params;
			const parentChatId = counterItem.parentChatId;
			const parentChat = collection[parentChatId];
			if (parentChatId === 0 || !parentChat) {
				return false;
			}
			return parentChat.recentSections.includes(recentType);
		}
		#isMuted(counterItem) {
			return counterItem.isMuted;
		}
		#isParentMuted(collection, counterItem) {
			const parent = collection[counterItem.parentChatId];
			if (!parent) {
				return false;
			}
			return parent.isMuted;
		}
		#sumChildrenCounter(collection, parentChatId, recentType) {
			if (parentChatId === 0) {
				return 0;
			}
			let totalCount = 0;
			for (const counterItem of Object.values(collection)) {
				if (recentType && !this.#hasRecentType(counterItem, recentType)) {
					continue;
				}
				if (counterItem.parentChatId !== parentChatId) {
					continue;
				}
				if (this.#isMuted(counterItem)) {
					continue;
				}
				totalCount += this.#resolveCounter(counterItem);
			}
			return totalCount;
		}
		#resolveCounter(counterItem) {
			if (counterItem.counter > 0) {
				return counterItem.counter;
			}
			if (counterItem.isMarkedAsUnread) {
				return 1;
			}
			return 0;
		}
		#formatFields(counterItem) {
			return im_v2_model.formatFieldsWithConfig(counterItem, counterFieldsConfig);
		}
	}

	const copilotFieldsConfig = [{
		fieldName: 'code',
		targetFieldName: 'code',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'default',
		targetFieldName: 'default',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'recommended',
		targetFieldName: 'recommended',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'supportsReasoning',
		targetFieldName: 'supportsReasoning',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'name',
		targetFieldName: 'name',
		checkFunction: main_core.Type.isString
	}];

	const chatFieldsConfig = [{
		fieldName: 'dialogId',
		targetFieldName: 'dialogId',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'role',
		targetFieldName: 'role',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'engine',
		targetFieldName: 'aiModel',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'titleIsCustom',
		targetFieldName: 'titleIsCustom',
		checkFunction: main_core.Type.isBoolean
	}];

	const AI_MODEL_DEFAULT_NAME = 'none';

	/* eslint-disable no-param-reassign */
	class ChatsModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {},
				aiContentDialogs: {}
			};
		}
		getElementState() {
			return {
				dialogId: '',
				role: '',
				aiModel: '',
				titleIsCustom: false,
				reasoningEnabled: false,
				forceSearchEnabled: false,
				agentModeEnabled: false,
				mcpAuth: null
			};
		}
		getGetters() {
			return {
				/** @function copilot/chats/getRole */
				getRole: state => dialogId => {
					const chat = state.collection[dialogId];
					if (!chat) {
						return null;
					}
					return im_v2_application_core.Core.getStore().getters['copilot/roles/getByCode'](chat.role);
				},
				/** @function copilot/chats/getRoleAvatar */
				getRoleAvatar: (state, getters) => dialogId => {
					const role = getters.getRole(dialogId);
					if (!role) {
						return '';
					}
					return im_v2_application_core.Core.getStore().getters['copilot/roles/getAvatar'](role.code);
				},
				/** @function copilot/chats/getAIModel */
				getAIModel: state => dialogId => {
					const chat = state.collection[dialogId];
					if (!chat) {
						return null;
					}
					const aiModelList = im_v2_application_core.Core.getStore().getters['copilot/getAIModels'];
					const currentAiModel = aiModelList.find(aiModel => aiModel.code === chat.aiModel);
					return currentAiModel ?? AI_MODEL_DEFAULT_NAME;
				},
				/** @function copilot/chats/titleIsCustom */
				titleIsCustom: state => dialogId => {
					const chat = state.collection[dialogId];
					if (!chat) {
						return false;
					}
					return state.collection[dialogId].titleIsCustom;
				},
				/** @function copilot/chats/isReasoningEnabled */
				isReasoningEnabled: state => dialogId => {
					const chat = state.collection[dialogId];
					if (!chat) {
						return false;
					}
					return state.collection[dialogId].reasoningEnabled;
				},
				/** @function copilot/chats/isForceSearchEnabled */
				isForceSearchEnabled: state => dialogId => {
					const chat = state.collection[dialogId];
					if (!chat) {
						return false;
					}
					return state.collection[dialogId].forceSearchEnabled;
				},
				/** @function copilot/chats/isAgentModeEnabled */
				isAgentModeEnabled: state => dialogId => {
					const chat = state.collection[dialogId];
					if (!chat) {
						return false;
					}
					return state.collection[dialogId].agentModeEnabled;
				},
				/** @function copilot/chats/getMcpAuth */
				getMcpAuth: state => dialogId => {
					const chat = state.collection[dialogId];
					if (!chat) {
						return null;
					}
					return chat.mcpAuth;
				},
				/** @function copilot/chats/isTempChat */
				isTempChat: () => dialogId => {
					return im_v2_lib_utils.Utils.dialog.isTempAiAssistantDialogId(dialogId);
				},
				/** @function copilot/chats/hasAiGeneratedContent */
				hasAiGeneratedContent: state => dialogId => {
					if (state.aiContentDialogs[dialogId]) {
						return true;
					}
					const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
					return dialog?.type === im_v2_const.ChatType.copilot;
				}
			};
		}

		// eslint-disable-next-line max-lines-per-function
		getActions() {
			return {
				/** @function copilot/chats/set */
				set: (store, payload) => {
					if (!payload) {
						return;
					}
					const chatsToAdd = main_core.Type.isArrayFilled(payload) ? payload : [payload];
					const preparedChats = chatsToAdd.map(chat => {
						return this.formatFields(chat);
					});
					preparedChats.forEach(chat => {
						const existingItem = store.state.collection[chat.dialogId];
						if (existingItem) {
							store.commit('update', {
								dialogId: chat.dialogId,
								fields: chat
							});
							return;
						}
						store.commit('add', {
							dialogId: chat.dialogId,
							fields: {
								...this.getElementState(),
								...chat
							}
						});
					});
				},
				/** @function copilot/chats/updateModel */
				updateModel: (store, payload) => {
					if (!payload || !store.state.collection[payload.dialogId]) {
						return;
					}
					store.commit('updateModel', payload);
				},
				/** @function copilot/chats/setTitleIsCustom */
				setTitleIsCustom: (store, payload) => {
					if (!payload || !store.state.collection[payload.dialogId]) {
						return;
					}
					store.commit('setTitleIsCustom', payload);
				},
				/** @function copilot/chats/toggleReasoning */
				toggleReasoning: (store, dialogId) => {
					if (!store.state.collection[dialogId]) {
						return;
					}
					store.commit('toggleReasoning', dialogId);
				},
				/** @function copilot/chats/toggleForceSearch */
				toggleForceSearch: (store, dialogId) => {
					if (!store.state.collection[dialogId]) {
						return;
					}
					store.commit('toggleForceSearch', dialogId);
				},
				/** @function copilot/chats/toggleAgentMode */
				toggleAgentMode: (store, dialogId) => {
					if (!store.state.collection[dialogId]) {
						return;
					}
					store.commit('toggleAgentMode', dialogId);
				},
				/** @function copilot/chats/setMcpAuth */
				setMcpAuth: (store, payload) => {
					if (!store.state.collection[payload.dialogId]) {
						return;
					}
					store.commit('setMcpAuth', payload);
				},
				/** @function copilot/chats/clearMcpAuth */
				clearMcpAuth: (store, dialogId) => {
					if (!store.state.collection[dialogId]) {
						return;
					}
					store.commit('clearMcpAuth', dialogId);
				},
				/** @function copilot/chats/delete */
				delete: (store, dialogId) => {
					if (!store.state.collection[dialogId]) {
						return;
					}
					store.commit('delete', dialogId);
				},
				/** @function copilot/chats/migrate */
				migrate: (store, payload) => {
					const {
						fromDialogId,
						toDialogId
					} = payload;
					const source = store.state.collection[fromDialogId];
					if (!source || fromDialogId === toDialogId) {
						return;
					}
					const userFields = {
						forceSearchEnabled: source.forceSearchEnabled,
						agentModeEnabled: source.agentModeEnabled,
						mcpAuth: source.mcpAuth
					};
					const target = store.state.collection[toDialogId];
					if (target) {
						store.commit('update', {
							dialogId: toDialogId,
							fields: userFields
						});
					} else {
						store.commit('add', {
							dialogId: toDialogId,
							fields: {
								...this.getElementState(),
								...userFields,
								dialogId: toDialogId,
								role: source.role
							}
						});
					}
					store.commit('delete', fromDialogId);
				},
				/** @function copilot/chats/checkMessagesForAiContent */
				checkMessagesForAiContent: (store, payload) => {
					const {
						messages
					} = payload;
					if (!Array.isArray(messages) || messages.length === 0) {
						return;
					}
					const rootStore = im_v2_application_core.Core.getStore();
					if (!rootStore.getters['users/bots/getCopilotBotDialogId']) {
						return;
					}
					const isCopilot = rootStore.getters['users/bots/isCopilot'];
					const dialogByChatId = new Map();
					const resolveDialog = chatId => {
						if (!dialogByChatId.has(chatId)) {
							dialogByChatId.set(chatId, rootStore.getters['chats/getByChatId'](chatId));
						}
						return dialogByChatId.get(chatId);
					};
					const processedChatIds = new Set();
					const dialogIdsToMark = [];
					for (const message of messages) {
						const chatId = message?.chatId;
						if (!chatId || processedChatIds.has(chatId)) {
							continue;
						}
						const dialog = resolveDialog(chatId);
						if (!dialog || store.state.aiContentDialogs[dialog.dialogId]) {
							processedChatIds.add(chatId);
							continue;
						}
						if (!isCopilot(message.authorId)) {
							continue;
						}
						dialogIdsToMark.push(dialog.dialogId);
						processedChatIds.add(chatId);
					}
					if (dialogIdsToMark.length > 0) {
						store.commit('markHasAiContent', {
							dialogIds: dialogIdsToMark
						});
					}
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					const {
						dialogId,
						fields
					} = payload;
					state.collection[dialogId] = fields;
				},
				update: (state, payload) => {
					const {
						dialogId,
						fields
					} = payload;
					state.collection[dialogId] = {
						...state.collection[dialogId],
						...fields
					};
				},
				updateModel: (state, payload) => {
					const {
						dialogId,
						aiModel
					} = payload;
					state.collection[dialogId].aiModel = aiModel;
				},
				setTitleIsCustom: (state, payload) => {
					state.collection[payload.dialogId].titleIsCustom = payload.titleIsCustom;
				},
				toggleReasoning: (state, dialogId) => {
					state.collection[dialogId].reasoningEnabled = !state.collection[dialogId].reasoningEnabled;
				},
				toggleForceSearch: (state, dialogId) => {
					state.collection[dialogId].forceSearchEnabled = !state.collection[dialogId].forceSearchEnabled;
				},
				toggleAgentMode: (state, dialogId) => {
					state.collection[dialogId].agentModeEnabled = !state.collection[dialogId].agentModeEnabled;
				},
				setMcpAuth: (state, payload) => {
					state.collection[payload.dialogId].mcpAuth = payload.mcpAuth;
				},
				clearMcpAuth: (state, dialogId) => {
					state.collection[dialogId].mcpAuth = null;
				},
				delete: (state, dialogId) => {
					delete state.collection[dialogId];
				},
				markHasAiContent: (state, payload) => {
					for (const dialogId of payload.dialogIds) {
						state.aiContentDialogs[dialogId] = true;
					}
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, chatFieldsConfig);
		}
	}

	const messagesFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'role',
		targetFieldName: 'roleCode',
		checkFunction: main_core.Type.isString
	}];

	/* eslint-disable no-param-reassign */
	class MessagesModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				roleCode: '',
				prompts: []
			};
		}
		getGetters() {
			return {
				/** @function copilot/messages/getRole */
				getRole: state => messageId => {
					const message = state.collection[messageId];
					if (!message) {
						return im_v2_application_core.Core.getStore().getters['copilot/roles/getDefault'];
					}
					return im_v2_application_core.Core.getStore().getters['copilot/roles/getByCode'](message.roleCode);
				},
				/** @function copilot/messages/getPrompts */
				getPrompts: state => messageId => {
					const message = state.collection[messageId];
					if (!message) {
						return [];
					}

					// снапшот, снятый на момент приёма (см. action add); фолбэк на живую
					// роль, если снапшот пуст (роли ещё не подъехали к моменту add)
					if (main_core.Type.isArrayFilled(message.prompts)) {
						return message.prompts;
					}
					return im_v2_application_core.Core.getStore().getters['copilot/roles/getPrompts'](message.roleCode);
				},
				getAvatar: (state, getters) => messageId => {
					const role = getters.getRole(messageId);
					if (!role) {
						return '';
					}
					return im_v2_application_core.Core.getStore().getters['copilot/roles/getAvatar'](role.code);
				}
			};
		}
		getActions() {
			return {
				/** @function copilot/messages/add */
				add: (store, payload) => {
					if (!main_core.Type.isArrayFilled(payload)) {
						return;
					}
					payload.forEach(message => {
						const preparedMessage = {
							...this.getElementState(),
							...this.formatFields(message)
						};
						// снапшот промптов роли на момент приёма: фиксируем набор из этого же
						// ответа, чтобы позднейшая перезапись глобальной роли (при заходе в
						// проектный чат) не протекала в баннер этого сообщения
						preparedMessage.prompts = im_v2_application_core.Core.getStore().getters['copilot/roles/getPrompts'](preparedMessage.roleCode);
						store.commit('add', preparedMessage);
					});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					state.collection[payload.id] = payload;
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, messagesFieldsConfig);
		}
	}

	const rolesFieldsConfig = [{
		fieldName: 'avatar',
		targetFieldName: 'avatar',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: target => {
			return im_v2_model.formatFieldsWithConfig(target, avatarFieldsConfig);
		}
	}, {
		fieldName: 'code',
		targetFieldName: 'code',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: ['desc', 'description'],
		targetFieldName: 'desc',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'name',
		targetFieldName: 'name',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'default',
		targetFieldName: 'default',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'prompts',
		targetFieldName: 'prompts',
		checkFunction: main_core.Type.isArray,
		formatFunction: target => {
			return target.map(prompt => {
				return im_v2_model.formatFieldsWithConfig(prompt, promptsFieldsConfig);
			});
		}
	}];
	const promptsFieldsConfig = [{
		fieldName: 'code',
		targetFieldName: 'code',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'promptType',
		targetFieldName: 'promptType',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'text',
		targetFieldName: 'text',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'title',
		targetFieldName: 'title',
		checkFunction: main_core.Type.isString
	}];
	const avatarFieldsConfig = [{
		fieldName: 'small',
		targetFieldName: 'small',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'medium',
		targetFieldName: 'medium',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'large',
		targetFieldName: 'large',
		checkFunction: main_core.Type.isString
	}];

	const AvatarSizes = Object.freeze({
		S: 'small',
		M: 'medium',
		L: 'large'
	});

	/* eslint-disable no-param-reassign */
	class RolesModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				roles: {}
			};
		}
		getElementState() {
			return {
				code: '',
				name: '',
				desc: '',
				default: false,
				avatar: {
					small: '',
					medium: '',
					large: ''
				},
				prompts: []
			};
		}
		getGetters() {
			return {
				/** @function copilot/roles/get */
				get: state => () => {
					return Object.values(state.roles);
				},
				/** @function copilot/roles/getByCode */
				getByCode: (state, getters) => code => {
					return state.roles[code] ?? getters.getDefault;
				},
				/** @function copilot/roles/getPrompts */
				getPrompts: (state, getters) => roleCode => {
					if (!state.roles[roleCode]) {
						return getters.getDefault?.prompts ?? [];
					}
					return state.roles[roleCode].prompts;
				},
				/** @function copilot/roles/getDefault */
				getDefault: state => {
					return Object.values(state.roles).find(role => role.default);
				},
				/** @function copilot/roles/getDefaultAvatar */
				getDefaultAvatar: (state, getters) => (size = 'M') => {
					const avatarSize = AvatarSizes[size];
					return getters.getDefault?.avatar[avatarSize] ?? '';
				},
				/** @function copilot/roles/getAvatar */
				getAvatar: (state, getters) => (roleCode, size = 'M') => {
					const avatarSize = AvatarSizes[size];
					if (!state.roles[roleCode]) {
						return getters.getDefault?.avatar[avatarSize] ?? '';
					}
					return state.roles[roleCode].avatar[avatarSize];
				}
			};
		}
		getActions() {
			return {
				/** @function copilot/roles/add */
				add: (store, payload) => {
					const roles = Object.values(payload);
					if (!main_core.Type.isArrayFilled(roles)) {
						return;
					}
					roles.forEach(role => {
						const preparedRole = {
							...this.getElementState(),
							...this.formatFields(role)
						};
						store.commit('add', preparedRole);
					});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					state.roles[payload.code] = payload;
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, rolesFieldsConfig);
		}
	}

	const ALLOWED_VOTE_VALUES = new Set(['like', 'dislike']);
	const votesFieldsConfig = [{
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: value => main_core.Type.isNumber(value) && value > 0
	}, {
		fieldName: 'value',
		targetFieldName: 'value',
		checkFunction: value => main_core.Type.isString(value) && ALLOWED_VOTE_VALUES.has(value)
	}];

	/* eslint-disable no-param-reassign */
	class VotesModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				messageId: 0,
				value: 'like'
			};
		}
		getGetters() {
			return {
				/** @function copilot/votes/getValue */
				getValue: state => messageId => {
					return state.collection[messageId]?.value ?? null;
				}
			};
		}
		getActions() {
			return {
				/** @function copilot/votes/set */
				set: (store, payload) => {
					const preparedVote = this.formatFields(payload);
					if (main_core.Type.isUndefined(preparedVote.messageId) || main_core.Type.isUndefined(preparedVote.value)) {
						return;
					}
					store.commit('set', preparedVote);
				},
				/** @function copilot/votes/delete */
				delete: (store, messageId) => {
					if (!main_core.Type.isNumber(messageId) || !store.state.collection[messageId]) {
						return;
					}
					store.commit('delete', messageId);
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					state.collection[payload.messageId] = payload;
				},
				delete: (state, messageId) => {
					delete state.collection[messageId];
				}
			};
		}
		formatFields(fields) {
			return im_v2_model.formatFieldsWithConfig(fields, votesFieldsConfig);
		}
	}

	/* eslint-disable no-param-reassign */
	class CopilotModel extends ui_vue3_vuex.BuilderModel {
		getNestedModules() {
			return {
				roles: RolesModel,
				messages: MessagesModel,
				chats: ChatsModel,
				votes: VotesModel
			};
		}
		getName() {
			return 'copilot';
		}
		getState() {
			return {
				aiProvider: '',
				availableAIModels: {},
				name: '',
				agentName: '',
				widgetDialogId: '',
				suggests: []
			};
		}
		getGetters() {
			return {
				/** @function copilot/getProvider */
				getProvider: state => {
					return state.aiProvider;
				},
				/** @function copilot/getAIModels */
				getAIModels: state => {
					return Object.values(state.availableAIModels);
				},
				/** @function copilot/getDefaultModelName */
				getDefaultModelName: state => {
					const allModels = Object.values(state.availableAIModels);
					if (allModels.length === 0) {
						return '';
					}
					const defaultModel = allModels.find(model => model.default === true);
					if (!defaultModel) {
						return '';
					}
					return defaultModel.name;
				},
				/** @function copilot/isReasoningAvailableInModel */
				isReasoningAvailableInModel: state => code => {
					return Boolean(state.availableAIModels[code]?.supportsReasoning);
				},
				/** @function copilot/getName */
				getName: state => {
					return state.name;
				},
				/** @function copilot/getAgentName */
				getAgentName: state => {
					return state.agentName;
				},
				/** @function copilot/isChatOpenedInWidget */
				isChatOpenedInWidget: state => dialogId => {
					return state.widgetDialogId !== '' && state.widgetDialogId === dialogId;
				},
				/** @function copilot/getSuggests */
				getSuggests: state => {
					return state.suggests;
				}
			};
		}
		getActions() {
			return {
				/** @function copilot/setProvider */
				setProvider: (store, payload) => {
					if (!main_core.Type.isStringFilled(payload)) {
						return;
					}
					store.commit('setProvider', payload);
				},
				/** @function copilot/setAvailableAIModels */
				setAvailableAIModels: (store, payload) => {
					if (!main_core.Type.isArrayFilled(payload)) {
						return;
					}
					payload.forEach(model => {
						store.commit('setAvailableAIModel', this.formatFields(model));
					});
				},
				/** @function copilot/setName */
				setName: (store, payload) => {
					if (!main_core.Type.isStringFilled(payload)) {
						return;
					}
					store.commit('setName', payload);
				},
				/** @function copilot/setAgentName */
				setAgentName: (store, payload) => {
					if (!main_core.Type.isStringFilled(payload)) {
						return;
					}
					store.commit('setAgentName', payload);
				},
				/** @function copilot/setWidgetDialogId */
				setWidgetDialogId: (store, payload) => {
					store.commit('setWidgetDialogId', payload ?? '');
				},
				/** @function copilot/setSuggests */
				setSuggests: (store, payload) => {
					if (!main_core.Type.isArray(payload)) {
						return;
					}
					store.commit('setSuggests', payload);
				}
			};
		}
		getMutations() {
			return {
				setProvider: (state, payload) => {
					state.aiProvider = payload;
				},
				setAvailableAIModel: (state, payload) => {
					state.availableAIModels[payload.code] = payload;
				},
				setName: (state, payload) => {
					state.name = payload;
				},
				setAgentName: (state, payload) => {
					state.agentName = payload;
				},
				setWidgetDialogId: (state, payload) => {
					state.widgetDialogId = payload;
				},
				setSuggests: (state, payload) => {
					state.suggests = payload;
				}
			};
		}
		formatFields(fields) {
			return formatFieldsWithConfig(fields, copilotFieldsConfig);
		}
	}

	/* eslint-disable no-param-reassign */
	class AiAssistantModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'aiAssistant';
		}
		getState() {
			return {
				mcpAuthId: null
			};
		}
		getGetters() {
			return {
				/** @function aiAssistant/getMcpAuthId */
				getMcpAuthId: state => {
					return state.mcpAuthId;
				}
			};
		}
		getActions() {
			return {
				/** @function aiAssistant/setMcpAuthId */
				setMcpAuthId: (store, mcpAuthId) => {
					store.commit('setMcpAuthId', mcpAuthId);
				}
			};
		}
		getMutations() {
			return {
				setMcpAuthId: (state, mcpAuthId) => {
					state.mcpAuthId = mcpAuthId;
				}
			};
		}
	}

	const stickerFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'packId',
		targetFieldName: 'packId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'packType',
		targetFieldName: 'packType',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'uri',
		targetFieldName: 'uri',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'width',
		targetFieldName: 'width',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'height',
		targetFieldName: 'height',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'sort',
		targetFieldName: 'sort',
		checkFunction: main_core.Type.isNumber
	}];

	const recentStickerConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'packId',
		targetFieldName: 'packId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'packType',
		targetFieldName: 'packType',
		checkFunction: main_core.Type.isString
	}];

	const RECENT_LIMIT = 12;

	/* eslint-disable no-param-reassign */
	class RecentStickersModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: []
			};
		}
		getElementState() {
			return {
				id: 0,
				packId: 0,
				packType: ''
			};
		}
		getGetters() {
			return {
				/** @function stickers/recent/get */
				get: (state, getters, rootState, rootGetters) => {
					return state.collection.map(recentSticker => {
						return rootGetters['stickers/get']({
							id: recentSticker.id,
							packId: recentSticker.packId,
							packType: recentSticker.packType
						});
					}).filter(sticker => Boolean(sticker));
				}
			};
		}
		getActions() {
			return {
				/** @function stickers/recent/set */
				set: (store, payload) => {
					payload.forEach(sticker => {
						const preparedRecentSticker = this.#formatFields(sticker);
						store.commit('add', {
							...this.getElementState(),
							...preparedRecentSticker
						});
					});
				},
				/** @function stickers/recent/update */
				update: (store, payload) => {
					const preparedRecentSticker = this.#formatFields(payload);
					store.commit('update', {
						...this.getElementState(),
						...preparedRecentSticker
					});
				},
				/** @function stickers/recent/clear */
				clear: store => {
					store.commit('clear');
				},
				/** @function stickers/recent/delete */
				delete: (store, payload) => {
					store.commit('delete', payload);
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					state.collection.push(payload);
					this.#applyLimit(state);
				},
				update: (state, payload) => {
					state.collection = state.collection.filter(sticker => {
						return !this.#isEqual(sticker, payload);
					});
					state.collection.unshift(payload);
					this.#applyLimit(state);
				},
				clear: state => {
					state.collection = [];
				},
				delete: (state, payload) => {
					state.collection = state.collection.filter(sticker => {
						return !this.#isEqual(sticker, payload);
					});
				}
			};
		}
		#formatFields(sticker) {
			return formatFieldsWithConfig(sticker, recentStickerConfig);
		}
		#applyLimit(state) {
			if (state.collection.length > RECENT_LIMIT) {
				state.collection = state.collection.slice(0, RECENT_LIMIT);
			}
		}
		#isEqual(firstSticker, secondSticker) {
			return firstSticker.id === secondSticker.id && firstSticker.packId === secondSticker.packId && firstSticker.packType === secondSticker.packType;
		}
	}

	const stickerMessagesConfig = [{
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: isNumberOrString
	}, {
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'packId',
		targetFieldName: 'packId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'packType',
		targetFieldName: 'packType',
		checkFunction: main_core.Type.isString
	}];

	/* eslint-disable no-param-reassign */
	class StickerMessagesModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: new Map()
			};
		}
		getElementState() {
			return {
				id: 0,
				packId: 0,
				packType: ''
			};
		}
		getGetters() {
			return {
				/** @function stickers/messages/isSticker */
				isSticker: state => messageId => {
					return state.collection.has(messageId);
				},
				/** @function stickers/messages/getStickerByMessageId */
				getStickerByMessageId: state => messageId => {
					return state.collection.get(messageId);
				}
			};
		}
		getActions() {
			return {
				/** @function stickers/messages/set */
				set: (store, payload) => {
					payload.forEach(message => {
						const preparedStickerMessage = this.#formatFields(message);
						store.commit('add', {
							...this.getElementState(),
							...preparedStickerMessage
						});
					});
				},
				/** @function stickers/messages/updateWithId */
				updateWithId: (store, payload) => {
					const {
						oldId,
						newId
					} = payload;
					const tempMessageStickerIdentifier = store.state.collection.get(oldId);
					tempMessageStickerIdentifier.messageId = newId;
					store.commit('delete', oldId);
					store.commit('add', tempMessageStickerIdentifier);
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					const messageId = payload.messageId;
					delete payload.messageId;
					state.collection.set(messageId, payload);
				},
				delete: (state, payload) => {
					state.collection.delete(payload);
				}
			};
		}
		#formatFields(stickerMessage) {
			return im_v2_model.formatFieldsWithConfig(stickerMessage, stickerMessagesConfig);
		}
	}

	const packFieldsConfig = [{
		fieldName: 'id',
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'authorId',
		targetFieldName: 'authorId',
		checkFunction: main_core.Type.isNumber
	}, {
		fieldName: 'name',
		targetFieldName: 'name',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'type',
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString
	}, {
		fieldName: 'isAdded',
		targetFieldName: 'isAdded',
		checkFunction: main_core.Type.isBoolean
	}];

	/* eslint-disable no-param-reassign */
	class PacksModel extends ui_vue3_vuex.BuilderModel {
		getState() {
			return {
				collection: new Map(),
				sortedKeys: []
			};
		}
		getElementState() {
			return {
				id: 0,
				key: '',
				type: '',
				name: '',
				authorId: null,
				isAdded: false
			};
		}
		getGetters() {
			return {
				/** @function stickers/packs/get */
				get: state => {
					const orderMap = new Map(state.sortedKeys.map((key, index) => [key, index]));
					return [...state.collection.values()].filter(pack => pack.isAdded).sort((first, second) => {
						const firstPackOrder = orderMap.get(first.key) ?? Infinity;
						const secondPackOrder = orderMap.get(second.key) ?? Infinity;
						return firstPackOrder - secondPackOrder;
					});
				},
				/** @function stickers/packs/getByIdentifier */
				getByIdentifier: state => ({
					id,
					type
				}) => {
					const packKey = this.#getPackKey({
						id,
						type
					});
					return state.collection.get(packKey);
				},
				/** @function stickers/packs/hasPack */
				hasPack: state => ({
					id,
					type
				}) => {
					const packKey = this.#getPackKey({
						id,
						type
					});
					return state.collection.has(packKey);
				}
			};
		}
		getActions() {
			return {
				/** @function stickers/packs/set */
				set: (store, payload) => {
					payload.forEach(pack => {
						const preparedPack = this.#formatFields(pack);
						const packKey = this.#getPackKey(preparedPack);
						store.commit('add', {
							key: packKey,
							pack: {
								...this.getElementState(),
								...preparedPack,
								key: packKey
							}
						});
					});
				},
				/** @function stickers/packs/link */
				link: (store, payload) => {
					const packKey = this.#getPackKey(payload);
					store.commit('update', {
						key: packKey,
						fields: {
							isAdded: true
						}
					});
				},
				/** @function stickers/packs/rename */
				rename: (store, payload) => {
					if (!main_core.Type.isStringFilled(payload.name)) {
						return;
					}
					const packKey = this.#getPackKey(payload);
					store.commit('update', {
						key: packKey,
						fields: {
							name: payload.name
						}
					});
				},
				/** @function stickers/packs/unlink */
				unlink: (store, payload) => {
					const packKey = this.#getPackKey(payload);
					store.commit('update', {
						key: packKey,
						fields: {
							isAdded: false
						}
					});
				},
				/** @function stickers/packs/addSortOrder */
				addSortOrder: (store, payload) => {
					const keys = payload.map(item => this.#getPackKey(item));
					store.commit('addSortOrder', keys);
				},
				/** @function stickers/packs/delete */
				delete: (store, payload) => {
					const packKey = this.#getPackKey(payload);
					store.commit('delete', {
						key: packKey
					});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					const {
						key,
						pack
					} = payload;
					state.collection.set(key, pack);
				},
				delete: (state, payload) => {
					state.collection.delete(payload.key);
					state.sortedKeys = state.sortedKeys.filter(key => key !== payload.key);
				},
				addSortOrder: (state, keys) => {
					const existingKeys = new Set(state.sortedKeys);
					const newKeys = keys.filter(key => !existingKeys.has(key));
					state.sortedKeys = [...state.sortedKeys, ...newKeys];
				},
				update: (state, payload) => {
					const pack = state.collection.get(payload.key);
					if (!pack) {
						return;
					}
					state.collection.set(payload.key, {
						...pack,
						...payload.fields
					});
				}
			};
		}
		#formatFields(pack) {
			return im_v2_model.formatFieldsWithConfig(pack, packFieldsConfig);
		}
		#getPackKey({
			id,
			type
		}) {
			return `${id}:${type}`;
		}
	}

	/* eslint-disable no-param-reassign */
	class StickersModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'stickers';
		}
		getNestedModules() {
			return {
				packs: PacksModel,
				recent: RecentStickersModel,
				messages: StickerMessagesModel
			};
		}
		getState() {
			return {
				collection: new Map()
			};
		}
		getElementState() {
			return {
				id: 0,
				packId: 0,
				packType: '',
				type: im_v2_const.StickerType.image,
				uri: '',
				width: 0,
				height: 0,
				sort: 0
			};
		}
		getGetters() {
			return {
				/** @function stickers/get */
				get: state => ({
					id,
					packId,
					packType
				}) => {
					const stickerKey = this.#getStickerKey({
						id,
						packId,
						packType
					});
					return state.collection.get(stickerKey);
				},
				/** @function stickers/getByPack */
				getByPack: state => ({
					id,
					type
				}) => {
					return [...state.collection.values()].filter(sticker => {
						return sticker.packId === id && sticker.packType === type;
					}).sort((sticker1, sticker2) => sticker1.sort - sticker2.sort);
				},
				/** @function stickers/getPackCover */
				getPackCover: (state, getters) => ({
					id,
					type
				}) => {
					const packsStickers = getters.getByPack({
						id,
						type
					});
					if (packsStickers.length > 0) {
						return packsStickers[0].uri;
					}
					return '';
				}
			};
		}
		getActions() {
			return {
				/** @function stickers/set */
				set: (store, payload) => {
					payload.forEach(sticker => {
						const preparedSticker = this.#formatFields(sticker);
						const stickerKey = this.#getStickerKey(preparedSticker);
						store.commit('add', {
							key: stickerKey,
							sticker: {
								...this.getElementState(),
								...preparedSticker
							}
						});
					});
				},
				/** @function stickers/delete */
				delete: (store, payload) => {
					const {
						ids,
						packId,
						packType
					} = payload;
					ids.forEach(id => {
						const stickerKey = this.#getStickerKey({
							id,
							packId,
							packType
						});
						store.commit('delete', stickerKey);
					});
				},
				/** @function stickers/deleteByPack */
				deleteByPack: (store, payload) => {
					const {
						id: packId,
						type: packType
					} = payload;
					[...store.state.collection.values()].forEach(sticker => {
						if (sticker.packId !== packId || sticker.packType !== packType) {
							return;
						}
						const {
							id
						} = sticker;
						const stickerKey = this.#getStickerKey({
							id,
							packId,
							packType
						});
						store.commit('delete', stickerKey);
					});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					const {
						key,
						sticker
					} = payload;
					state.collection.set(key, sticker);
				},
				delete: (state, key) => {
					state.collection.delete(key);
				}
			};
		}
		#formatFields(rawSticker) {
			return formatFieldsWithConfig(rawSticker, stickerFieldsConfig);
		}
		#getStickerKey({
			id,
			packId,
			packType
		}) {
			return `${packId}:${packType}:${id}`;
		}
	}

	exports.AiAssistantModel = AiAssistantModel;
	exports.ApplicationModel = ApplicationModel;
	exports.ChatsModel = ChatsModel$1;
	exports.CopilotModel = CopilotModel;
	exports.CountersModel = CountersModel;
	exports.FilesModel = FilesModel$1;
	exports.MarketModel = MarketModel;
	exports.MessagesModel = MessagesModel$1;
	exports.NotificationsModel = NotificationsModel;
	exports.RecentModel = RecentModel;
	exports.SidebarModel = SidebarModel;
	exports.StickersModel = StickersModel;
	exports.UsersModel = UsersModel;
	exports.convertObjectKeysToCamelCase = convertObjectKeysToCamelCase;
	exports.convertToNumber = convertToNumber;
	exports.convertToString = convertToString;
	exports.formatFieldsWithConfig = formatFieldsWithConfig;
	exports.isNumberOrString = isNumberOrString;
	exports.prepareDraft = prepareDraft;
	exports.prepareInvitation = prepareInvitation;

})(this.BX.Messenger.v2.Model = this.BX.Messenger.v2.Model || {}, BX, BX.Messenger.v2.Lib, BX.Event, BX.Vue3.Vuex, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Model, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map

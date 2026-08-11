/* eslint-disable */
(function (main_polyfill_customevent, pull_component_status, ui_vue_components_smiles, im_component_dialog, im_component_textarea, im_view_quotepanel, imopenlines_component_message, imopenlines_component_form, im_lib_cookie, ui_vue_vuex, im_lib_utils, rest_client, im_provider_rest, im_lib_localstorage, main_md5, main_date, pull_client, ui_vue, ui_vue_components_crm_form, im_controller, im_const, im_lib_logger, main_core_events, main_core_minimal, im_eventHandler, im_lib_uploader, main_core) {
	'use strict';

	/**
	 * Bitrix OpenLines widget
	 * Widget constants
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	function GetObjectValues(source) {
		const destination = [];
		for (let value in source) {
			if (source.hasOwnProperty(value)) {
				destination.push(source[value]);
			}
		}
		return destination;
	}

	/* region 01. Constants */

	const VoteType = Object.freeze({
		none: 'none',
		like: 'like',
		dislike: 'dislike'
	});
	const LanguageType = Object.freeze({
		russian: 'ru',
		ukraine: 'ua',
		world: 'en'
	});
	const FormType = Object.freeze({
		none: 'none',
		like: 'like',
		smile: 'smile',
		consent: 'consent',
		welcome: 'welcome',
		offline: 'offline',
		history: 'history'
	});
	const LocationType = Object.freeze({
		topLeft: 1,
		topMiddle: 2,
		topBottom: 3,
		bottomLeft: 6,
		bottomMiddle: 5,
		bottomRight: 4
	});
	const LocationStyle = Object.freeze({
		1: 'top-left',
		2: 'top-center',
		3: 'top-right',
		6: 'bottom-left',
		5: 'bottom-center',
		4: 'bottom-right'
	});
	const WidgetBaseSize = Object.freeze({
		width: 435,
		height: 557
	});
	const WidgetMinimumSize = Object.freeze({
		width: 340,
		height: 435
	});
	const SubscriptionType = Object.freeze({
		configLoaded: 'configLoaded',
		widgetOpen: 'widgetOpen',
		widgetClose: 'widgetClose',
		sessionStart: 'sessionStart',
		sessionOperatorChange: 'sessionOperatorChange',
		sessionFinish: 'sessionFinish',
		operatorMessage: 'operatorMessage',
		userForm: 'userForm',
		userMessage: 'userMessage',
		userFile: 'userFile',
		userVote: 'userVote',
		every: 'every'
	});
	const SubscriptionTypeCheck = GetObjectValues(SubscriptionType);
	const RestMethod = Object.freeze({
		widgetUserRegister: 'imopenlines.widget.user.register',
		widgetChatCreate: 'imopenlines.widget.chat.create',
		widgetConfigGet: 'imopenlines.widget.config.get',
		widgetDialogGet: 'imopenlines.widget.dialog.get',
		widgetDialogList: 'imopenlines.widget.dialog.list',
		widgetUserGet: 'imopenlines.widget.user.get',
		widgetUserConsentApply: 'imopenlines.widget.user.consent.apply',
		widgetVoteSend: 'imopenlines.widget.vote.send',
		widgetActionSend: 'imopenlines.widget.action.send',
		pullServerTime: 'server.time',
		pullConfigGet: 'pull.config.get'
	});
	GetObjectValues(RestMethod);
	const RestAuth = Object.freeze({
		guest: 'guest'
	});
	const SessionStatus = Object.freeze({
		new: 0,
		skip: 5,
		answer: 10,
		client: 20,
		clientAfterOperator: 25,
		operator: 40,
		waitClient: 50,
		close: 60,
		spam: 65,
		duplicate: 69,
		silentlyClose: 75
	});
	const WidgetEventType = Object.freeze({
		showForm: 'IMOL.Widget:showForm',
		hideForm: 'IMOL.Widget:hideForm',
		processMessagesToSendQueue: 'IMOL.Widget:processMessagesToSendQueue',
		requestData: 'IMOL.Widget:requestData',
		showConsent: 'IMOL.Widget:showConsent',
		acceptConsent: 'IMOL.Widget:acceptConsent',
		consentAccepted: 'IMOL.Widget:consentAccepted',
		declineConsent: 'IMOL.Widget:declineConsent',
		consentDeclined: 'IMOL.Widget:consentDeclined',
		sendDialogVote: 'IMOL.Widget:sendDialogVote',
		createSession: 'IMOL.Widget:createSession',
		openSession: 'IMOL.Widget:openSession'
	});

	/**
	 * Bitrix OpenLines widget
	 * Widget model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	class WidgetModel extends ui_vue_vuex.VuexBuilderModel {
		/**
		 * @inheritDoc
		 */
		getName() {
			return 'widget';
		}
		getState() {
			return {
				common: {
					configId: 0,
					configName: '',
					host: this.getVariable('common.host', location.protocol + '//' + location.host),
					pageMode: this.getVariable('common.pageMode', false),
					copyright: this.getVariable('common.copyright', true),
					copyrightUrl: this.getVariable('common.copyrightUrl', 'https://bitrix24.com'),
					location: this.getVariable('common.location', LocationType.bottomRight),
					styles: {
						backgroundColor: this.getVariable('styles.backgroundColor', '#17a3ea'),
						iconColor: this.getVariable('styles.iconColor', '#ffffff')
					},
					vote: {
						enable: false,
						beforeFinish: true,
						messageText: this.getVariable('vote.messageText', ''),
						messageLike: this.getVariable('vote.messageLike', ''),
						messageDislike: this.getVariable('vote.messageDislike', '')
					},
					textMessages: {
						bxLivechatOnlineLine1: this.getVariable('textMessages.bxLivechatOnlineLine1', ''),
						bxLivechatOnlineLine2: this.getVariable('textMessages.bxLivechatOnlineLine2', ''),
						bxLivechatOffline: this.getVariable('textMessages.bxLivechatOffline', ''),
						bxLivechatTitle: ''
					},
					online: false,
					operators: [],
					connectors: [],
					showForm: FormType.none,
					showed: false,
					reopen: false,
					dragged: false,
					textareaHeight: 0,
					widgetHeight: 0,
					widgetWidth: 0,
					showConsent: false,
					consentUrl: '',
					dialogStart: false,
					watchTyping: false,
					showSessionId: false,
					isCreateSessionMode: false,
					crmFormsSettings: {
						useWelcomeForm: false,
						welcomeFormId: 0,
						welcomeFormSec: '',
						welcomeFormDelay: false,
						welcomeFormFilled: false,
						successText: '',
						errorText: ''
					}
				},
				dialog: {
					sessionId: 0,
					sessionClose: true,
					sessionStatus: 0,
					userVote: VoteType.none,
					closeVote: false,
					userConsent: false,
					operatorChatId: 0,
					operator: {
						id: 0,
						name: '',
						firstName: '',
						lastName: '',
						workPosition: '',
						avatar: '',
						online: false
					}
				},
				user: {
					id: -1,
					hash: '',
					name: '',
					firstName: '',
					lastName: '',
					avatar: '',
					email: '',
					phone: '',
					www: '',
					gender: 'M',
					position: ''
				}
			};
		}
		getStateSaveException() {
			return {
				common: {
					host: null,
					pageMode: null,
					copyright: null,
					copyrightUrl: null,
					styles: null,
					dragged: null,
					showed: null,
					showConsent: null,
					showForm: null
				}
			};
		}
		getMutations() {
			return {
				common: (state, payload) => {
					if (typeof payload.configId === 'number') {
						state.common.configId = payload.configId;
					}
					if (typeof payload.configName === 'string') {
						state.common.configName = payload.configName;
					}
					if (typeof payload.online === 'boolean') {
						state.common.online = payload.online;
					}
					if (im_lib_utils.Utils.types.isPlainObject(payload.vote)) {
						if (typeof payload.vote.enable === 'boolean') {
							state.common.vote.enable = payload.vote.enable;
						}
						if (typeof payload.vote.beforeFinish === 'boolean') {
							state.common.vote.beforeFinish = payload.vote.beforeFinish;
						}
						if (typeof payload.vote.messageText === 'string') {
							state.common.vote.messageText = payload.vote.messageText;
						}
						if (typeof payload.vote.messageLike === 'string') {
							state.common.vote.messageLike = payload.vote.messageLike;
						}
						if (typeof payload.vote.messageDislike === 'string') {
							state.common.vote.messageDislike = payload.vote.messageDislike;
						}
					}
					if (im_lib_utils.Utils.types.isPlainObject(payload.textMessages)) {
						if (typeof payload.textMessages.bxLivechatOnlineLine1 === 'string' && payload.textMessages.bxLivechatOnlineLine1 !== '') {
							state.common.textMessages.bxLivechatOnlineLine1 = payload.textMessages.bxLivechatOnlineLine1;
						}
						if (typeof payload.textMessages.bxLivechatOnlineLine2 === 'string' && payload.textMessages.bxLivechatOnlineLine2 !== '') {
							state.common.textMessages.bxLivechatOnlineLine2 = payload.textMessages.bxLivechatOnlineLine2;
						}
						if (typeof payload.textMessages.bxLivechatOffline === 'string' && payload.textMessages.bxLivechatOffline !== '') {
							state.common.textMessages.bxLivechatOffline = payload.textMessages.bxLivechatOffline;
						}
						if (typeof payload.textMessages.bxLivechatTitle === 'string' && payload.textMessages.bxLivechatTitle !== '') {
							state.common.textMessages.bxLivechatTitle = payload.textMessages.bxLivechatTitle;
						}
					}
					if (typeof payload.dragged === 'boolean') {
						state.common.dragged = payload.dragged;
					}
					if (typeof payload.textareaHeight === 'number') {
						state.common.textareaHeight = payload.textareaHeight;
					}
					if (typeof payload.widgetHeight === 'number') {
						state.common.widgetHeight = payload.widgetHeight;
					}
					if (typeof payload.widgetWidth === 'number') {
						state.common.widgetWidth = payload.widgetWidth;
					}
					if (typeof payload.showConsent === 'boolean') {
						state.common.showConsent = payload.showConsent;
					}
					if (typeof payload.consentUrl === 'string') {
						state.common.consentUrl = payload.consentUrl;
					}
					if (typeof payload.showed === 'boolean') {
						state.common.showed = payload.showed;
						payload.reopen = im_lib_utils.Utils.device.isMobile() ? false : payload.showed;
					}
					if (typeof payload.reopen === 'boolean') {
						state.common.reopen = payload.reopen;
					}
					if (typeof payload.copyright === 'boolean') {
						state.common.copyright = payload.copyright;
					}
					if (typeof payload.dialogStart === 'boolean') {
						state.common.dialogStart = payload.dialogStart;
					}
					if (typeof payload.watchTyping === 'boolean') {
						state.common.watchTyping = payload.watchTyping;
					}
					if (typeof payload.showSessionId === 'boolean') {
						state.common.showSessionId = payload.showSessionId;
					}
					if (payload.operators instanceof Array) {
						state.common.operators = payload.operators;
					}
					if (payload.connectors instanceof Array) {
						state.common.connectors = payload.connectors;
					}
					if (typeof payload.showForm === 'string' && typeof FormType[payload.showForm] !== 'undefined') {
						if (payload.showForm === FormType.like && !!state.dialog.closeVote) {
							payload.showForm = FormType.none;
						}
						state.common.showForm = payload.showForm;
					}
					if (typeof payload.location === 'number' && typeof LocationStyle[payload.location] !== 'undefined') {
						if (state.common.location !== payload.location) {
							state.common.widgetHeight = 0;
							state.common.widgetWidth = 0;
							state.common.location = payload.location;
						}
					}
					if (im_lib_utils.Utils.types.isPlainObject(payload.crmFormsSettings)) {
						if (typeof payload.crmFormsSettings.useWelcomeForm === 'string') {
							state.common.crmFormsSettings.useWelcomeForm = payload.crmFormsSettings.useWelcomeForm === 'Y';
						}
						if (typeof payload.crmFormsSettings.welcomeFormId === 'string') {
							state.common.crmFormsSettings.welcomeFormId = payload.crmFormsSettings.welcomeFormId;
						}
						if (typeof payload.crmFormsSettings.welcomeFormSec === 'string') {
							state.common.crmFormsSettings.welcomeFormSec = payload.crmFormsSettings.welcomeFormSec;
						}
						if (typeof payload.crmFormsSettings.welcomeFormDelay === 'string') {
							state.common.crmFormsSettings.welcomeFormDelay = payload.crmFormsSettings.welcomeFormDelay === 'Y';
						}
						if (typeof payload.crmFormsSettings.successText === 'string' && payload.crmFormsSettings.successText !== '') {
							state.common.crmFormsSettings.successText = payload.crmFormsSettings.successText;
						}
						if (typeof payload.crmFormsSettings.errorText === 'string' && payload.crmFormsSettings.errorText !== '') {
							state.common.crmFormsSettings.errorText = payload.crmFormsSettings.errorText;
						}
					}
					if (typeof payload.isCreateSessionMode === 'boolean') {
						state.common.isCreateSessionMode = payload.isCreateSessionMode;
					}
					if (this.isSaveNeeded({
						common: payload
					})) {
						this.saveState(state);
					}
				},
				dialog: (state, payload) => {
					if (typeof payload.sessionId === 'number') {
						state.dialog.sessionId = payload.sessionId;
					}
					if (typeof payload.sessionClose === 'boolean') {
						state.dialog.sessionClose = payload.sessionClose;
					}
					if (typeof payload.sessionStatus === 'number') {
						state.dialog.sessionStatus = payload.sessionStatus;
					}
					if (typeof payload.userConsent === 'boolean') {
						state.dialog.userConsent = payload.userConsent;
					}
					if (typeof payload.userVote === 'string' && typeof payload.userVote !== 'undefined') {
						state.dialog.userVote = payload.userVote;
					}
					if (typeof payload.closeVote === 'boolean') {
						state.dialog.closeVote = payload.closeVote;
						if (!!payload.closeVote && state.common.showForm === FormType.like) {
							state.common.showForm = FormType.none;
						}
					}
					if (typeof payload.operatorChatId === 'number') {
						state.dialog.operatorChatId = payload.operatorChatId;
					}
					if (im_lib_utils.Utils.types.isPlainObject(payload.operator)) {
						if (typeof payload.operator.id === 'number') {
							state.dialog.operator.id = payload.operator.id;
						}
						if (typeof payload.operator.name === 'string' || typeof payload.operator.name === 'number') {
							state.dialog.operator.name = payload.operator.name.toString();
						}
						if (typeof payload.operator.lastName === 'string' || typeof payload.operator.lastName === 'number') {
							state.dialog.operator.lastName = payload.operator.lastName.toString();
						}
						if (typeof payload.operator.firstName === 'string' || typeof payload.operator.firstName === 'number') {
							state.dialog.operator.firstName = payload.operator.firstName.toString();
						}
						if (typeof payload.operator.workPosition === 'string' || typeof payload.operator.workPosition === 'number') {
							state.dialog.operator.workPosition = payload.operator.workPosition.toString();
						}
						if (typeof payload.operator.avatar === 'string') {
							if (!payload.operator.avatar || payload.operator.avatar.startsWith('http')) {
								state.dialog.operator.avatar = payload.operator.avatar;
							} else {
								state.dialog.operator.avatar = state.common.host + payload.operator.avatar;
							}
						}
						if (typeof payload.operator.online === 'boolean') {
							state.dialog.operator.online = payload.operator.online;
						}
					}
					if (this.isSaveNeeded({
						dialog: payload
					})) {
						this.saveState(state);
					}
				},
				user: (state, payload) => {
					if (typeof payload.id === 'number') {
						state.user.id = payload.id;
					}
					if (typeof payload.hash === 'string' && payload.hash !== state.user.hash) {
						state.user.hash = payload.hash;
						im_lib_cookie.Cookie.set(null, 'LIVECHAT_HASH', payload.hash, {
							expires: 365 * 86400,
							path: '/'
						});
					}
					if (typeof payload.name === 'string' || typeof payload.name === 'number') {
						state.user.name = payload.name.toString();
					}
					if (typeof payload.firstName === 'string' || typeof payload.firstName === 'number') {
						state.user.firstName = payload.firstName.toString();
					}
					if (typeof payload.lastName === 'string' || typeof payload.lastName === 'number') {
						state.user.lastName = payload.lastName.toString();
					}
					if (typeof payload.avatar === 'string') {
						state.user.avatar = payload.avatar;
					}
					if (typeof payload.email === 'string') {
						state.user.email = payload.email;
					}
					if (typeof payload.phone === 'string' || typeof payload.phone === 'number') {
						state.user.phone = payload.phone.toString();
					}
					if (typeof payload.www === 'string') {
						state.user.www = payload.www;
					}
					if (typeof payload.gender === 'string') {
						state.user.gender = payload.gender;
					}
					if (typeof payload.position === 'string') {
						state.user.position = payload.position;
					}
					if (this.isSaveNeeded({
						user: payload
					})) {
						this.saveState(state);
					}
				}
			};
		}
		getActions() {
			return {
				show: ({
					commit
				}) => {
					commit('common', {
						showed: true
					});
				},
				setVoteDateFinish: ({
					commit,
					dispatch,
					state
				}, payload) => {
					if (!payload) {
						clearTimeout(this.setVoteDateTimeout);
						commit('dialog', {
							closeVote: false
						});
						return true;
					}
					const totalDelay = new Date(payload).getTime() - new Date().getTime();
					const dayTimestamp = 10000;
					clearTimeout(this.setVoteDateTimeout);
					if (payload) {
						if (totalDelay && !state.dialog.closeVote) {
							commit('dialog', {
								closeVote: false
							});
						}
						var delay = totalDelay;
						if (totalDelay > dayTimestamp) {
							delay = dayTimestamp;
						}
						this.setVoteDateTimeout = setTimeout(function requestCloseVote() {
							delay = new Date(payload).getTime() - new Date().getTime();
							if (delay > 0) {
								if (delay > dayTimestamp) {
									delay = dayTimestamp;
								}
								setTimeout(requestCloseVote, delay);
							} else {
								commit('dialog', {
									closeVote: true
								});
							}
						}, delay);
					}
				}
			};
		}
	}

	/**
	 * Bitrix OpenLines widget
	 * Rest client (base on BX.RestClient)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	class WidgetRestClient {
		constructor(params) {
			this.queryAuthRestore = false;
			this.setAuthId(RestAuth.guest);
			this.restClient = new rest_client.RestClient({
				endpoint: params.endpoint,
				queryParams: this.queryParams,
				cors: true
			});
		}
		setAuthId(authId, customAuthId = '') {
			if (typeof this.queryParams !== 'object') {
				this.queryParams = {};
			}
			if (authId == RestAuth.guest || typeof authId === 'string' && authId.match(/^[a-f0-9]{32}$/)) {
				this.queryParams.livechat_auth_id = authId;
			} else {
				console.error(`%LiveChatRestClient.setAuthId: auth is not correct (%c${authId}%c)`, "color: black;", "font-weight: bold; color: red", "color: black");
				return false;
			}
			if (authId == RestAuth.guest && typeof customAuthId === 'string' && customAuthId.match(/^[a-f0-9]{32}$/)) {
				this.queryParams.livechat_custom_auth_id = customAuthId;
			}
			return true;
		}
		getAuthId() {
			if (typeof this.queryParams !== 'object') {
				this.queryParams = {};
			}
			return this.queryParams.livechat_auth_id || null;
		}
		callMethod(method, params, callback, sendCallback, logTag = null) {
			if (!logTag) {
				logTag = im_lib_utils.Utils.getLogTrackingParams({
					name: method
				});
			}
			const promise = new BX.Promise();

			// TODO: Callbacks methods will not work!
			this.restClient.callMethod(method, params, null, sendCallback, logTag).then(result => {
				this.queryAuthRestore = false;
				promise.fulfill(result);
			}).catch(result => {
				let error = result.error();
				if (error.ex.error == 'LIVECHAT_AUTH_WIDGET_USER') {
					this.setAuthId(error.ex.hash);
					if (method === RestMethod.widgetUserRegister) {
						console.warn(`BX.LiveChatRestClient: ${error.ex.error_description} (${error.ex.error})`);
						this.queryAuthRestore = false;
						promise.reject(result);
						return false;
					}
					if (!this.queryAuthRestore) {
						console.warn('BX.LiveChatRestClient: your auth-token has expired, send query with a new token');
						this.queryAuthRestore = true;
						this.restClient.callMethod(method, params, null, sendCallback, logTag).then(result => {
							this.queryAuthRestore = false;
							promise.fulfill(result);
						}).catch(result => {
							this.queryAuthRestore = false;
							promise.reject(result);
						});
						return false;
					}
				}
				this.queryAuthRestore = false;
				promise.reject(result);
			});
			return promise;
		}
		callBatch(calls, callback, bHaltOnError, sendCallback, logTag) {
			let resultCallback = result => {
				for (let method in calls) {
					if (!calls.hasOwnProperty(method)) {
						continue;
					}
					let error = result[method].error();
					if (error && error.ex.error == 'LIVECHAT_AUTH_WIDGET_USER') {
						this.setAuthId(error.ex.hash);
						if (method === RestMethod.widgetUserRegister) {
							console.warn(`BX.LiveChatRestClient: ${error.ex.error_description} (${error.ex.error})`);
							this.queryAuthRestore = false;
							callback(result);
							return false;
						}
						if (!this.queryAuthRestore) {
							console.warn('BX.LiveChatRestClient: your auth-token has expired, send query with a new token');
							this.queryAuthRestore = true;
							this.restClient.callBatch(calls, callback, bHaltOnError, sendCallback, logTag);
							return false;
						}
					}
				}
				this.queryAuthRestore = false;
				callback(result);
				return true;
			};
			return this.restClient.callBatch(calls, resultCallback, bHaltOnError, sendCallback, logTag);
		}
	}

	/**
	 * Bitrix OpenLines widget
	 * Widget Rest answers (Rest Answer Handler)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	class WidgetRestAnswerHandler extends im_provider_rest.BaseRestHandler {
		constructor(props = {}) {
			super(props);
			this.widget = props.widget;
		}
		handleImopenlinesWidgetConfigGetSuccess(data) {
			this.store.commit('widget/common', {
				configId: data.configId,
				configName: data.configName,
				vote: data.vote,
				textMessages: data.textMessages,
				operators: data.operators || [],
				online: data.online,
				consentUrl: data.consentUrl,
				connectors: data.connectors || [],
				watchTyping: data.watchTyping,
				showSessionId: data.showSessionId,
				crmFormsSettings: data.crmFormsSettings
			});
			this.store.commit('application/set', {
				disk: data.disk
			});
			this.widget.addLocalize(data.serverVariables);
			im_lib_localstorage.LocalStorage.set(this.widget.getSiteId(), 0, 'serverVariables', data.serverVariables || {});
		}
		handleImopenlinesWidgetUserRegisterSuccess(data) {
			this.widget.restClient.setAuthId(data.hash);
			let previousData = [];
			if (typeof this.store.state.messages.collection[this.controller.application.getChatId()] !== 'undefined') {
				previousData = this.store.state.messages.collection[this.controller.application.getChatId()];
			}
			this.store.commit('messages/initCollection', {
				chatId: data.chatId,
				messages: previousData
			});
			this.store.commit('dialogues/initCollection', {
				dialogId: data.dialogId,
				fields: {
					entityType: 'LIVECHAT',
					type: 'livechat'
				}
			});
			this.store.commit('application/set', {
				dialog: {
					chatId: data.chatId,
					dialogId: 'chat' + data.chatId
				}
			});
		}
		handleImopenlinesWidgetChatCreateSuccess(data) {
			this.widget.restClient.setAuthId(data.hash);
			this.store.commit('messages/initCollection', {
				chatId: data.chatId,
				messages: []
			});
			this.store.commit('dialogues/initCollection', {
				dialogId: data.dialogId,
				fields: {
					entityType: 'LIVECHAT',
					type: 'livechat'
				}
			});
			this.store.commit('application/set', {
				dialog: {
					chatId: data.chatId,
					dialogId: 'chat' + data.chatId
				}
			});
		}
		handleImopenlinesWidgetUserGetSuccess(data) {
			this.store.commit('widget/user', {
				id: data.id,
				hash: data.hash,
				name: data.name,
				firstName: data.firstName,
				lastName: data.lastName,
				phone: data.phone,
				avatar: data.avatar,
				email: data.email,
				www: data.www,
				gender: data.gender,
				position: data.position
			});
			this.store.dispatch('users/set', [{
				id: data.id,
				name: data.name,
				firstName: data.firstName,
				lastName: data.lastName,
				avatar: data.avatar,
				gender: data.gender,
				workPosition: data.position
			}]);
			this.store.commit('application/set', {
				common: {
					userId: data.id
				}
			});
		}
		handleImopenlinesWidgetDialogGetSuccess(data) {
			this.store.commit('messages/initCollection', {
				chatId: data.chatId
			});
			this.store.commit('widget/dialog', data);
			this.store.commit('application/set', {
				dialog: {
					chatId: data.chatId,
					dialogId: 'chat' + data.chatId,
					diskFolderId: data.diskFolderId
				}
			});
			this.store.dispatch('widget/setVoteDateFinish', data.dateCloseVote);
		}
		handleImDialogMessagesGetInitSuccess(data) {
			this.handleImDialogMessagesGetSuccess(data);
		}
		handleImDialogMessagesGetSuccess(data) {
			if (data.messages && data.messages.length > 0 && !this.widget.isDialogStart()) {
				this.store.commit('widget/common', {
					dialogStart: true
				});
				this.store.commit('widget/dialog', {
					userConsent: true
				});
			}
		}
		handleImMessageAddSuccess(messageId, message) {
			this.widget.sendEvent({
				type: SubscriptionType.userMessage,
				data: {
					id: messageId,
					text: message.text
				}
			});
		}
		handleImDiskFileCommitSuccess(result, message) {
			this.widget.sendEvent({
				type: SubscriptionType.userFile,
				data: {}
			});
		}
	}

	/**
	 * Bitrix OpenLines widget
	 * Widget pull commands (Pull Command Handler)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	class WidgetImPullCommandHandler {
		static create(params = {}) {
			return new this(params);
		}
		getModuleId() {
			return 'im';
		}
		constructor(params) {
			this.controller = params.controller;
			this.store = params.store;
			this.widget = params.widget;
		}
		handleMessageChat(params, extra, command) {
			if (params.message.senderId != this.controller.application.getUserId()) {
				this.widget.sendEvent({
					type: SubscriptionType.operatorMessage,
					data: params
				});
				if (!this.store.state.widget.common.showed && !this.widget.onceShowed) {
					this.widget.onceShowed = true;
					this.widget.open();
				}
			}
		}
	}
	class WidgetImopenlinesPullCommandHandler {
		static create(params = {}) {
			return new this(params);
		}
		constructor(params = {}) {
			this.controller = params.controller;
			this.store = params.store;
			this.widget = params.widget;
		}
		getModuleId() {
			return 'imopenlines';
		}
		handleSessionStart(params, extra, command) {
			this.store.commit('widget/dialog', {
				sessionId: params.sessionId,
				sessionClose: false,
				sessionStatus: 0,
				userVote: VoteType.none
			});
			this.store.dispatch('widget/setVoteDateFinish', '');
			this.widget.sendEvent({
				type: SubscriptionType.sessionStart,
				data: {
					sessionId: params.sessionId
				}
			});
		}
		handleSessionOperatorChange(params, extra, command) {
			this.store.commit('widget/dialog', {
				operator: params.operator,
				operatorChatId: params.operatorChatId
			});
			this.widget.sendEvent({
				type: SubscriptionType.sessionOperatorChange,
				data: {
					operator: params.operator
				}
			});
		}
		handleSessionStatus(params, extra, command) {
			this.store.commit('widget/dialog', {
				sessionId: params.sessionId,
				sessionStatus: params.sessionStatus,
				sessionClose: params.sessionClose
			});
			this.widget.sendEvent({
				type: SubscriptionType.sessionStatus,
				data: {
					sessionId: params.sessionId,
					sessionStatus: params.sessionStatus
				}
			});
			if (params.sessionClose) {
				this.widget.sendEvent({
					type: SubscriptionType.sessionFinish,
					data: {
						sessionId: params.sessionId,
						sessionStatus: params.sessionStatus
					}
				});
				if (!params.spam) {
					this.store.commit('widget/dialog', {
						operator: {
							name: '',
							firstName: '',
							lastName: '',
							workPosition: '',
							avatar: '',
							online: false
						}
					});
				}
			}
		}
		handleSessionDateCloseVote(params, extra, command) {
			this.store.dispatch('widget/setVoteDateFinish', params.dateCloseVote);
		}
	}

	/**
	 * Bitrix OpenLines widget
	 * Widget private interface (base class)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2020 Bitrix
	 */

	class Widget {
		/* region 01. Initialize and store data */
		params = null;
		template = null; // Vue instance
		rootNode = null;
		restClient = null;
		pullClient = null;
		ready = true; // true if there are no initialization errors
		inited = false; // true if all preparations are done
		offline = false; // true if Pull-client is offline
		widgetConfigRequest = null; // XHR-request from widget.config.get, can be aborted before completion

		// this block can be set from public config
		userRegisterData = {}; // user info
		customData = []; // additional info to send to server
		options = {
			checkSameDomain: true
		};
		subscribers = {}; // external event subscribers

		// fields from params
		code = ''; // livechat code
		host = '';
		language = '';
		copyright = true;
		copyrightUrl = '';
		buttonInstance = null; // widget button
		localize = null;
		pageMode = null; // fullscreen livechat mode options

		constructor(params = {}) {
			this.params = params;

			//TODO: remove
			this.messagesQueue = [];
			main_core_events.EventEmitter.subscribe(WidgetEventType.requestData, this.requestData.bind(this));
			main_core_events.EventEmitter.subscribe(WidgetEventType.createSession, this.createChat.bind(this));
			main_core_events.EventEmitter.subscribe(WidgetEventType.openSession, this.openSession.bind(this));
			this.initParams();
			this.initRestClient();
			this.initPullClient();
			this.initCore().then(() => {
				this.initWidget();
				this.initComplete();
			});
		}
		initParams() {
			this.rootNode = this.params.node || document.createElement('div');
			this.code = this.params.code || '';
			this.host = this.params.host || '';
			this.language = this.params.language || 'en';
			this.copyright = this.params.copyright !== false;
			this.copyrightUrl = this.copyright && this.params.copyrightUrl ? this.params.copyrightUrl : '';
			if (this.params.buttonInstance && typeof this.params.buttonInstance === 'object') {
				this.buttonInstance = this.params.buttonInstance;
			}
			if (this.params.pageMode && typeof this.params.pageMode === 'object') {
				this.pageMode = {
					useBitrixLocalize: this.params.pageMode.useBitrixLocalize === true,
					placeholder: document.querySelector(`#${this.params.pageMode.placeholder}`)
				};
			}
			const errors = this.checkRequiredFields();
			if (errors.length > 0) {
				errors.forEach(error => console.warn(error));
				this.ready = false;
			}
			this.setRootNode();
			this.localize = this.pageMode && this.pageMode.useBitrixLocalize ? window.BX.message : {};
			this.setLocalize();
		}
		initRestClient() {
			this.restClient = new WidgetRestClient({
				endpoint: `${this.host}/rest`
			});
		}
		initPullClient() {
			this.pullClient = new pull_client.PullClient({
				serverEnabled: true,
				userId: 0,
				siteId: this.getSiteId(),
				restClient: this.restClient,
				skipStorageInit: true,
				configTimestamp: 0,
				skipCheckRevision: true,
				getPublicListMethod: 'imopenlines.widget.operator.get'
			});
		}
		initCore() {
			this.controller = new im_controller.Controller({
				host: this.getHost(),
				siteId: this.getSiteId(),
				userId: 0,
				languageId: this.language,
				pull: {
					client: this.pullClient
				},
				rest: {
					client: this.restClient
				},
				localize: this.localize,
				vuexBuilder: {
					database: !im_lib_utils.Utils.browser.isIe(),
					databaseName: 'imol/widget',
					databaseType: ui_vue_vuex.VuexBuilder.DatabaseType.localStorage,
					models: [WidgetModel.create().setVariables(this.getWidgetVariables())]
				}
			});
			return this.controller.ready();
		}
		initWidget() {
			this.restClient.setAuthId(this.getRestAuthId());
			this.setModelData();
			// TODO: move from controller
			this.controller.application.setPrepareFilesBeforeSaveFunction(this.prepareFileData.bind(this));
			this.controller.addRestAnswerHandler(WidgetRestAnswerHandler.create({
				widget: this,
				store: this.controller.getStore(),
				controller: this.controller
			}));
		}

		// if start or open methods were called before core init - we will have appropriate flags
		// for full-page livechat we always call open
		initComplete() {
			window.dispatchEvent(new CustomEvent('onBitrixLiveChat', {
				detail: {
					widget: this,
					widgetCode: this.code,
					widgetHost: this.host
				}
			}));
			if (this.callStartFlag) {
				this.start();
			}
			if (this.pageMode || this.callOpenFlag) {
				this.open();
			}
		}

		// public method
		// initially called from imopenlines/lib/livechatmanager.php:16
		// if core is not ready yet - set flag and call start once again in this.initComplete()
		start() {
			if (!this.controller || !this.controller.getStore()) {
				this.callStartFlag = true;
				return true;
			}
			if (this.isSessionActive()) {
				this.requestWidgetData();
			}
			return true;
		}

		// public method
		// if core is not ready yet - set flag and call start once again in this.initComplete()
		// if not inited yet - request widget data
		open(params = {}) {
			if (!this.controller.getStore()) {
				this.callOpenFlag = true;
				return true;
			}
			if (!params.openFromButton && this.buttonInstance) {
				this.buttonInstance.wm.showById('openline_livechat');
			}
			const {
				error,
				stop
			} = this.checkForErrorsBeforeOpen();
			if (stop) {
				return false;
			}
			if (!error && !this.inited) {
				this.requestWidgetData();
			}
			this.attachTemplate();
		}
		requestWidgetData() {
			if (!this.ready) {
				console.error('LiveChatWidget.start: widget code or host is not specified');
				return false;
			}

			// if user is registered or we have its hash - proceed to getting chat and messages
			if (this.isUserReady() || this.isHashAvailable()) {
				this.requestData();
				this.inited = true;
				this.fireInitEvent();
				return true;
			}

			// if there is no info about user - we need to get config and wait for first message
			this.controller.restClient.callMethod(RestMethod.widgetConfigGet, {
				code: this.code
			}, xhr => {
				this.widgetConfigRequest = xhr;
			}).then(result => {
				this.widgetConfigRequest = null;
				this.clearError();
				this.controller.executeRestAnswer(RestMethod.widgetConfigGet, result);
				if (!this.inited) {
					this.inited = true;
					this.fireInitEvent();
				}
			}).catch(error => {
				this.widgetConfigRequest = null;
				this.setError(error.error().ex.error, error.error().ex.error_description);
			});
			if (this.isConfigDataLoaded()) {
				this.inited = true;
				this.fireInitEvent();
			}
		}

		// get all other info (dialog, chat, messages etc)
		requestData() {
			im_lib_logger.Logger.log('requesting data from widget');
			if (this.requestDataSend) {
				return true;
			}
			this.requestDataSend = true;

			// if there is uncompleted widget.config.get request - abort it (because we will do it anyway)
			if (this.widgetConfigRequest) {
				this.widgetConfigRequest.abort();
			}
			const callback = this.handleBatchRequestResult.bind(this);
			this.controller.restClient.callBatch(this.getDataRequestQuery(), callback, false, false, im_lib_utils.Utils.getLogTrackingParams({
				name: 'widget.init.config',
				dialog: this.controller.application.getDialogData()
			}));
		}
		createChat() {
			return new Promise((resolve, reject) => {
				this.controller.restClient.callBatch(this.getCreateChatRequestQuery(), result => {
					this.handleBatchCreateChatRequestResult(result).then(() => {
						resolve();
					});
				}, false, false);
			});
		}
		handleBatchRequestResult(response) {
			if (!response) {
				this.requestDataSend = false;
				this.setError('EMPTY_RESPONSE', 'Server returned an empty response.');
				return false;
			}
			this.handleConfigGet(response).then(() => this.handleUserGet(response)).then(() => this.handleChatGet(response)).then(() => this.handleDialogGet(response)).then(() => this.handleDialogMessagesGet(response)).then(() => this.handleUserRegister(response)).then(() => this.handlePullRequests(response)).catch(({
				code,
				description
			}) => {
				this.setError(code, description);
			}).finally(() => {
				this.requestDataSend = false;
			});
		}
		handleBatchCreateChatRequestResult(response) {
			if (!response) {
				this.requestDataSend = false;
				this.setError('EMPTY_RESPONSE', 'Server returned an empty response.');
				return false;
			}
			return this.handleChatCreate(response).then(() => this.handleChatGet(response)).then(() => this.handleDialogGet(response)).catch(({
				code,
				description
			}) => {
				this.setError(code, description);
			}).finally(() => {
				this.requestDataSend = false;
			});
		}
		handleBatchOpenSessionRequestResult(response) {
			if (!response) {
				this.requestDataSend = false;
				this.setError('EMPTY_RESPONSE', 'Server returned an empty response.');
				return false;
			}
			return this.handleChatGet(response).then(() => this.handleDialogGet(response)).then(() => this.handleDialogMessagesGet(response)).catch(({
				code,
				description
			}) => {
				this.setError(code, description);
			}).finally(() => {
				this.requestDataSend = false;
			});
		}
		getDataRequestQuery() {
			// always widget.config.get
			const query = {
				[RestMethod.widgetConfigGet]: [RestMethod.widgetConfigGet, {
					code: this.code
				}]
			};
			if (this.isUserRegistered()) {
				// widget.dialog.get
				query[RestMethod.widgetDialogGet] = [RestMethod.widgetDialogGet, {
					config_id: this.getConfigId(),
					trace_data: this.getCrmTraceData(),
					custom_data: this.getCustomData()
				}];

				// im.chat.get
				query[im_const.RestMethodHandler.imChatGet] = [im_const.RestMethod.imChatGet, {
					dialog_id: `$result[${RestMethod.widgetDialogGet}][dialogId]`
				}];

				// im.dialog.messages.get
				query[im_const.RestMethodHandler.imDialogMessagesGetInit] = [im_const.RestMethod.imDialogMessagesGet, {
					chat_id: `$result[${RestMethod.widgetDialogGet}][chatId]`,
					limit: this.controller.application.getRequestMessageLimit(),
					convert_text: 'Y'
				}];
			} else {
				// widget.user.register
				query[RestMethod.widgetUserRegister] = [RestMethod.widgetUserRegister, {
					config_id: `$result[${RestMethod.widgetConfigGet}][configId]`,
					...this.getUserRegisterFields()
				}];

				// im.chat.get
				query[im_const.RestMethodHandler.imChatGet] = [im_const.RestMethod.imChatGet, {
					dialog_id: `$result[${RestMethod.widgetUserRegister}][dialogId]`
				}];
				if (this.userRegisterData.hash || this.getUserHashCookie()) {
					// widget.dialog.get
					query[RestMethod.widgetDialogGet] = [RestMethod.widgetDialogGet, {
						config_id: `$result[${RestMethod.widgetConfigGet}][configId]`,
						trace_data: this.getCrmTraceData(),
						custom_data: this.getCustomData()
					}];

					// im.dialog.messages.get
					query[im_const.RestMethodHandler.imDialogMessagesGetInit] = [im_const.RestMethod.imDialogMessagesGet, {
						chat_id: `$result[${RestMethod.widgetDialogGet}][chatId]`,
						limit: this.controller.application.getRequestMessageLimit(),
						convert_text: 'Y'
					}];
				}
				if (this.isUserAgreeConsent()) {
					// widget.user.consent.apply
					query[RestMethod.widgetUserConsentApply] = [RestMethod.widgetUserConsentApply, {
						config_id: `$result[${RestMethod.widgetConfigGet}][configId]`,
						consent_url: location.href
					}];
				}
			}
			query[RestMethod.pullServerTime] = [RestMethod.pullServerTime, {}];
			query[RestMethod.pullConfigGet] = [RestMethod.pullConfigGet, {
				'CACHE': 'N'
			}];
			query[RestMethod.widgetUserGet] = [RestMethod.widgetUserGet, {}];
			return query;
		}
		getOpenSessionQuery(chatId) {
			// imopenlines.widget.dialog.get
			const query = {
				[RestMethod.widgetDialogGet]: [RestMethod.widgetDialogGet, {
					config_id: this.getConfigId(),
					chat_id: chatId
				}]
			};
			query[im_const.RestMethodHandler.imChatGet] = [im_const.RestMethod.imChatGet, {
				dialog_id: `chat${chatId}`
			}];

			// im.dialog.messages.get
			query[im_const.RestMethodHandler.imDialogMessagesGetInit] = [im_const.RestMethod.imDialogMessagesGet, {
				chat_id: chatId,
				limit: 50,
				convert_text: 'Y'
			}];
			return query;
		}
		getCreateChatRequestQuery() {
			const query = {};

			// widget.chat.register
			query[RestMethod.widgetChatCreate] = [RestMethod.widgetChatCreate, {
				config_id: this.getConfigId(),
				...this.getUserRegisterFields()
			}];

			// im.chat.get
			query[im_const.RestMethodHandler.imChatGet] = [im_const.RestMethod.imChatGet, {
				dialog_id: `$result[${RestMethod.widgetChatCreate}][dialogId]`
			}];

			// widget.dialog.get
			query[RestMethod.widgetDialogGet] = [RestMethod.widgetDialogGet, {
				config_id: this.getConfigId(),
				trace_data: this.getCrmTraceData(),
				custom_data: this.getCustomData()
			}];
			if (this.isUserAgreeConsent()) {
				// widget.user.consent.apply
				query[RestMethod.widgetUserConsentApply] = [RestMethod.widgetUserConsentApply, {
					config_id: this.getConfigId(),
					consent_url: location.href
				}];
			}
			query[RestMethod.pullServerTime] = [RestMethod.pullServerTime, {}];
			query[RestMethod.pullConfigGet] = [RestMethod.pullConfigGet, {
				'CACHE': 'N'
			}];
			query[RestMethod.widgetUserGet] = [RestMethod.widgetUserGet, {}];
			return query;
		}
		openSession(event) {
			const eventData = event.getData();
			return new Promise((resolve, reject) => {
				const dialog = this.controller.getStore().getters['dialogues/get'](eventData.session.dialogId);
				if (dialog) {
					this.controller.getStore().commit('application/set', {
						dialog: {
							chatId: eventData.session.chatId,
							dialogId: eventData.session.dialogId,
							diskFolderId: 0
						}
					});
					this.controller.getStore().commit('widget/common', {
						isCreateSessionMode: false
					});
					resolve();
					return;
				}
				this.controller.restClient.callBatch(this.getOpenSessionQuery(eventData.session.chatId), result => {
					this.handleBatchOpenSessionRequestResult(result).then(() => {
						this.controller.getStore().commit('widget/common', {
							isCreateSessionMode: false
						});
						resolve();
					});
				}, false, false);
			});
		}
		prepareFileData(files) {
			if (!Array.isArray(files)) {
				return files;
			}
			return files.map(file => {
				const hash = (window.md5 || main_md5.md5)(`${this.getUserId()}|${file.id}|${this.getUserHash()}`);
				const urlParam = `livechat_auth_id=${hash}&livechat_user_id=${this.getUserId()}`;
				if (file.urlPreview) {
					file.urlPreview = `${file.urlPreview}&${urlParam}`;
				}
				if (file.urlShow) {
					file.urlShow = `${file.urlShow}&${urlParam}`;
				}
				if (file.urlDownload) {
					file.urlDownload = `${file.urlDownload}&${urlParam}`;
				}
				return file;
			});
		}
		checkRequiredFields() {
			const errors = [];
			if (typeof this.code === 'string' && this.code.length <= 0) {
				errors.push(`LiveChatWidget.constructor: code is not correct (${this.code})`);
			}
			if (typeof this.host === 'string' && (this.host.length <= 0 || !this.host.startsWith('http'))) {
				errors.push(`LiveChatWidget.constructor: host is not correct (${this.host})`);
			}
			return errors;
		}
		setRootNode() {
			if (this.pageMode && this.pageMode.placeholder) {
				this.rootNode = this.pageMode.placeholder;
			} else if (document.body.firstChild) {
				document.body.insertBefore(this.rootNode, document.body.firstChild);
			} else {
				document.body.append(this.rootNode);
			}
		}
		setLocalize() {
			if (typeof this.params.localize === 'object') {
				this.addLocalize(this.params.localize);
			}
			const serverVariables = im_lib_localstorage.LocalStorage.get(this.getSiteId(), 0, 'serverVariables', false);
			if (serverVariables) {
				this.addLocalize(serverVariables);
			}
		}
		getWidgetVariables() {
			const variables = {
				common: {
					host: this.getHost(),
					pageMode: !!this.pageMode,
					copyright: this.copyright,
					copyrightUrl: this.copyrightUrl
				},
				vote: {
					messageText: this.getLocalize('BX_LIVECHAT_VOTE_TITLE'),
					messageLike: this.getLocalize('BX_LIVECHAT_VOTE_PLUS_TITLE'),
					messageDislike: this.getLocalize('BX_LIVECHAT_VOTE_MINUS_TITLE')
				},
				textMessages: {
					bxLivechatOnlineLine1: this.getLocalize('BX_LIVECHAT_ONLINE_LINE_1'),
					bxLivechatOnlineLine2: this.getLocalize('BX_LIVECHAT_ONLINE_LINE_2'),
					bxLivechatOffline: this.getLocalize('BX_LIVECHAT_OFFLINE')
				}
			};
			if (this.params.styles) {
				variables.styles = {};
				if (this.params.styles.backgroundColor) {
					variables.styles.backgroundColor = this.params.styles.backgroundColor;
				}
				if (this.params.styles.iconColor) {
					variables.styles.iconColor = this.params.styles.iconColor;
				}
			}
			return variables;
		}
		getRestAuthId() {
			return this.isUserRegistered() ? this.getUserHash() : RestAuth.guest;
		}
		setModelData() {
			if (this.params.location && LocationStyle[this.params.location]) {
				this.controller.getStore().commit('widget/common', {
					location: this.params.location
				});
			}
		}
		checkForErrorsBeforeOpen() {
			const result = {
				error: false,
				stop: false
			};
			if (!this.checkBrowserVersion()) {
				this.setError('OLD_BROWSER_LOCALIZED', this.localize.BX_LIVECHAT_OLD_BROWSER);
				result.error = true;
			} else if (im_lib_utils.Utils.versionCompare(ui_vue.Vue.version(), '2.1') < 0) {
				alert(this.localize.BX_LIVECHAT_OLD_VUE);
				console.error(`LiveChatWidget.error: OLD_VUE_VERSION (${this.localize.BX_LIVECHAT_OLD_VUE_DEV.replace('#CURRENT_VERSION#', ui_vue.Vue.version())})`);
				result.error = true;
				result.stop = true;
			} else if (this.isSameDomain()) {
				this.setError('LIVECHAT_SAME_DOMAIN', this.localize.BX_LIVECHAT_SAME_DOMAIN);
				result.error = true;
			}
			return result;
		}
		isSameDomain() {
			if (typeof BX === 'undefined' || !BX.isReady) {
				return false;
			}
			if (!this.options.checkSameDomain) {
				return false;
			}
			return this.host.lastIndexOf(`.${location.hostname}`) > -1;
		}
		checkBrowserVersion() {
			if (im_lib_utils.Utils.platform.isIos()) {
				let version = im_lib_utils.Utils.platform.getIosVersion();
				if (version && version <= 10) {
					return false;
				}
			}
			return true;
		}

		/* endregion 01. Initialize and store data */

		/* region 02. Push & Pull */

		startPullClient(config) {
			return new Promise((resolve, reject) => {
				if (!this.getUserId() || !this.getSiteId() || !this.restClient) {
					return reject({
						ex: {
							error: 'WIDGET_NOT_LOADED',
							error_description: 'Widget is not loaded.'
						}
					});
				}
				if (this.pullClientInited) {
					if (!this.pullClient.isConnected()) {
						this.pullClient.scheduleReconnect();
					}
					return resolve(true);
				}
				this.controller.userId = this.getUserId();
				this.pullClient.userId = this.getUserId();
				this.pullClient.configTimestamp = config ? config.server.config_timestamp : 0;
				this.pullClient.skipStorageInit = false;
				this.pullClient.storage = new pull_client.PullClient.StorageManager({
					userId: this.getUserId(),
					siteId: this.getSiteId()
				});
				this.pullClient.subscribe(new WidgetImPullCommandHandler({
					store: this.controller.getStore(),
					controller: this.controller,
					widget: this
				}));
				this.pullClient.subscribe(new WidgetImopenlinesPullCommandHandler({
					store: this.controller.getStore(),
					controller: this.controller,
					widget: this
				}));
				this.pullClient.subscribe({
					type: pull_client.PullClient.SubscriptionType.Status,
					callback: this.eventStatusInteraction.bind(this)
				});
				this.pullConnectedFirstTime = this.pullClient.subscribe({
					type: pull_client.PullClient.SubscriptionType.Status,
					callback: result => {
						if (result.status === pull_client.PullClient.PullStatus.Online) {
							resolve(true);
							this.pullConnectedFirstTime();
						}
					}
				});
				if (this.template) {
					this.template.$Bitrix.PullClient.set(this.pullClient);
				}
				this.pullClient.start({
					...config,
					skipReconnectToLastSession: true
				}).catch(() => {
					reject({
						ex: {
							error: 'PULL_CONNECTION_ERROR',
							error_description: 'Pull is not connected.'
						}
					});
				});
				this.pullClientInited = true;
			});
		}
		stopPullClient() {
			if (this.pullClient) {
				this.pullClient.stop(pull_client.PullClient.CloseReasons.MANUAL, 'Closed manually');
			}
		}
		recoverPullConnection() {
			// this.pullClient.session.mid = 0; // TODO specially for disable pull history, remove after recode im
			this.pullClient.restart(pull_client.PullClient.CloseReasons.MANUAL, 'Restart after click by connection status button.');
		}
		eventStatusInteraction(data) {
			if (data.status === pull_client.PullClient.PullStatus.Online) {
				this.onPullOnlineStatus();
			} else if (data.status === pull_client.PullClient.PullStatus.Offline) {
				this.pullRequestMessage = true;
				this.offline = true;
			}
		}
		onPullOnlineStatus() {
			this.offline = false;

			// if we go online after going offline - we need to request messages
			if (this.pullRequestMessage) {
				this.controller.pullBaseHandler.option.skip = true;
				im_lib_logger.Logger.warn('Requesting getDialogUnread after going online');
				main_core_events.EventEmitter.emitAsync(im_const.EventType.dialog.requestUnread, {
					chatId: this.controller.application.getChatId()
				}).then(() => {
					main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollOnStart, {
						chatId: this.controller.application.getChatId()
					});
					this.controller.pullBaseHandler.option.skip = false;
					main_core_events.EventEmitter.emit(WidgetEventType.processMessagesToSendQueue);
				}).catch(() => {
					this.controller.pullBaseHandler.option.skip = false;
				});
				this.pullRequestMessage = false;
			} else {
				main_core_events.EventEmitter.emit(im_const.EventType.dialog.readMessage);
				main_core_events.EventEmitter.emit(WidgetEventType.processMessagesToSendQueue);
			}
		}

		/* endregion 02. Push & Pull */

		/* region 03. Template engine */

		attachTemplate() {
			if (this.template) {
				this.controller.getStore().commit('widget/common', {
					showed: true
				});
				return true;
			}
			this.rootNode.innerHTML = '';
			this.rootNode.append(document.createElement('div'));
			const application = this;
			return this.controller.createVue(application, {
				el: this.rootNode.firstChild,
				template: '<bx-livechat/>',
				beforeCreate() {
					application.sendEvent({
						type: SubscriptionType.widgetOpen,
						data: {}
					});
					application.template = this;
					if (main_core_minimal.ZIndexManager !== undefined) {
						const stack = main_core_minimal.ZIndexManager.getOrAddStack(document.body);
						stack.setBaseIndex(1000000); // some big value
						this.$bitrix.Data.set('zIndexStack', stack);
					}
				},
				destroyed() {
					application.sendEvent({
						type: SubscriptionType.widgetClose,
						data: {}
					});
					application.template = null;
					application.templateAttached = false;
					application.rootNode.innerHTML = '';
				}
			}).then(() => {
				return new Promise((resolve, reject) => resolve());
			});
		}
		detachTemplate() {
			if (!this.template) {
				return true;
			}
			this.template.$destroy();
			return true;
		}

		// public method
		mutateTemplateComponent(id, params) {
			return ui_vue.Vue.mutateComponent(id, params);
		}

		/* endregion 03. Template engine */

		/* region 04. Widget interaction and utils */

		// public method
		close() {
			if (this.pageMode) {
				return false;
			}
			if (this.buttonInstance) {
				this.buttonInstance.onWidgetClose();
			}
			this.detachTemplate();
		}
		fireInitEvent() {
			if (this.initEventFired) {
				return true;
			}
			this.sendEvent({
				type: SubscriptionType.configLoaded,
				data: {}
			});
			if (this.controller.getStore().state.widget.common.reopen) {
				this.open();
			}
			this.initEventFired = true;
		}
		isUserRegistered() {
			return !!this.getUserHash();
		}
		isConfigDataLoaded() {
			return this.controller.getStore().state.widget.common.configId;
		}
		isChatLoaded() {
			return this.controller.getStore().state.application.dialog.chatId > 0;
		}
		isSessionActive() {
			return !this.controller.getStore().state.widget.dialog.sessionClose;
		}
		isUserAgreeConsent() {
			return this.controller.getStore().state.widget.dialog.userConsent;
		}
		getCrmTraceData() {
			let traceData = '';
			if (!this.buttonInstance) {
				return traceData;
			}
			if (typeof this.buttonInstance.getTrace !== 'function') {
				traceData = this.buttonInstance.getTrace();
			} else if (typeof this.buttonInstance.b24Tracker !== 'undefined' && typeof this.buttonInstance.b24Tracker.guest !== 'undefined') {
				traceData = this.buttonInstance.b24Tracker.guest.getTrace();
			}
			return traceData;
		}
		getCustomData() {
			let customData = [];
			if (this.customData.length > 0) {
				customData = this.customData;
			} else {
				customData = [{
					MESSAGE: this.localize.BX_LIVECHAT_EXTRA_SITE + ': [URL]' + location.href + '[/URL]'
				}];
			}
			return JSON.stringify(customData);
		}
		isUserLoaded() {
			return this.controller.getStore().state.widget.user.id > 0;
		}
		isUserReady() {
			return this.isConfigDataLoaded() && this.isUserRegistered();
		}
		isHashAvailable() {
			return !this.isUserRegistered() && (this.userRegisterData.hash || this.getUserHashCookie());
		}
		getSiteId() {
			return this.host.replace(/(http.?:\/\/)|([:.\\\/])/mg, "") + this.code;
		}
		getHost() {
			return this.host;
		}
		getConfigId() {
			return this.controller.getStore().state.widget.common.configId;
		}
		isDialogStart() {
			return this.controller.getStore().state.widget.common.dialogStart;
		}
		getChatId() {
			return this.controller.getStore().state.application.dialog.chatId;
		}
		getDialogId() {
			return this.controller.getStore().state.application.dialog.dialogId;
		}
		getDiskFolderId() {
			return this.controller.getStore().state.application.dialog.diskFolderId;
		}
		getDialogData(dialogId = this.getDialogId()) {
			return this.controller.getStore().state.dialogues.collection[dialogId];
		}
		getSessionId() {
			return this.controller.getStore().state.widget.dialog.sessionId;
		}
		isSessionClose() {
			return this.controller.getStore().state.widget.dialog.sessionClose;
		}
		getUserHash() {
			return this.controller.getStore().state.widget.user.hash;
		}
		getUserHashCookie() {
			let userHash = '';
			let cookie = im_lib_cookie.Cookie.get(null, 'LIVECHAT_HASH');
			if (typeof cookie === 'string' && cookie.match(/^[a-f0-9]{32}$/)) {
				userHash = cookie;
			} else {
				let cookie = im_lib_cookie.Cookie.get(this.getSiteId(), 'LIVECHAT_HASH');
				if (typeof cookie === 'string' && cookie.match(/^[a-f0-9]{32}$/)) {
					userHash = cookie;
				}
			}
			return userHash;
		}
		getUserId() {
			return this.controller.getStore().state.widget.user.id;
		}
		getUserData() {
			if (!this.controller || !this.controller.getStore()) {
				console.error('LiveChatWidget.getUserData: method can be called after fired event - onBitrixLiveChat');
				return false;
			}
			return this.controller.getStore().state.widget.user;
		}
		getUserRegisterFields() {
			return {
				'name': this.userRegisterData.name || '',
				'last_name': this.userRegisterData.lastName || '',
				'avatar': this.userRegisterData.avatar || '',
				'email': this.userRegisterData.email || '',
				'www': this.userRegisterData.www || '',
				'gender': this.userRegisterData.gender || '',
				'position': this.userRegisterData.position || '',
				'user_hash': this.userRegisterData.hash || this.getUserHashCookie() || '',
				'consent_url': this.controller.getStore().state.widget.common.consentUrl ? location.href : '',
				'trace_data': this.getCrmTraceData(),
				'custom_data': this.getCustomData()
			};
		}
		getWidgetLocationCode() {
			return LocationStyle[this.controller.getStore().state.widget.common.location];
		}

		// public method
		setUserRegisterData(params) {
			if (!this.controller || !this.controller.getStore()) {
				console.error('LiveChatWidget.getUserData: method can be called after fired event - onBitrixLiveChat');
				return false;
			}
			const validUserFields = ['hash', 'name', 'lastName', 'avatar', 'email', 'www', 'gender', 'position'];
			if (!im_lib_utils.Utils.types.isPlainObject(params)) {
				console.error(`%cLiveChatWidget.setUserData: params is not a object`, "color: black;");
				return false;
			}
			for (let field in this.userRegisterData) {
				if (!this.userRegisterData.hasOwnProperty(field)) {
					continue;
				}
				if (!params[field]) {
					delete this.userRegisterData[field];
				}
			}
			for (let field in params) {
				if (!params.hasOwnProperty(field)) {
					continue;
				}
				if (validUserFields.indexOf(field) === -1) {
					console.warn(`%cLiveChatWidget.setUserData: user field is not set, because you are trying to set an unknown field (%c${field}%c)`, "color: black;", "font-weight: bold; color: red", "color: black");
					continue;
				}
				this.userRegisterData[field] = params[field];
			}
			if (this.userRegisterData.hash && this.getUserHash() && this.userRegisterData.hash !== this.getUserHash()) {
				this.setNewAuthToken(this.userRegisterData.hash);
			}
		}
		setNewAuthToken(authToken = '') {
			this.controller.getStoreBuilder().clearModelState();
			im_lib_cookie.Cookie.set(null, 'LIVECHAT_HASH', '', {
				expires: 365 * 86400,
				path: '/'
			});
			this.controller.restClient.setAuthId(RestAuth.guest, authToken);
		}

		// public method
		setOption(name, value) {
			this.options[name] = value;
			return true;
		}

		// public method
		setCustomData(params) {
			if (!this.controller || !this.controller.getStore()) {
				console.error('LiveChatWidget.getUserData: method can be called after fired event - onBitrixLiveChat');
				return false;
			}
			let result = [];
			if (params instanceof Array) {
				params.forEach(element => {
					if (element && typeof element === 'object') {
						result.push(element);
					}
				});
				if (result.length <= 0) {
					console.error('LiveChatWidget.setCustomData: params is empty');
					return false;
				}
			} else {
				if (!params) {
					return false;
				}
				result = [{
					'MESSAGE': params
				}];
			}
			this.customData = this.customData.concat(result);
			return true;
		}
		setError(code = '', description = '') {
			console.error(`LiveChatWidget.error: ${code} (${description})`);
			let localizeDescription = '';
			if (code === 'LIVECHAT_AUTH_FAILED') {
				localizeDescription = this.getLocalize('BX_LIVECHAT_AUTH_FAILED').replace('#LINK_START#', '<a href="javascript:void();" onclick="location.reload()">').replace('#LINK_END#', '</a>');
				this.setNewAuthToken();
			} else if (code === 'LIVECHAT_AUTH_PORTAL_USER') {
				localizeDescription = this.getLocalize('BX_LIVECHAT_PORTAL_USER_NEW').replace('#LINK_START#', '<a href="' + this.host + '">').replace('#LINK_END#', '</a>');
			} else if (code === 'LIVECHAT_SAME_DOMAIN') {
				localizeDescription = this.getLocalize('BX_LIVECHAT_SAME_DOMAIN');
				let link = this.getLocalize('BX_LIVECHAT_SAME_DOMAIN_LINK');
				if (link) {
					localizeDescription += '<br><br><a href="' + link + '">' + this.getLocalize('BX_LIVECHAT_SAME_DOMAIN_MORE') + '</a>';
				}
			} else if (code.endsWith('LOCALIZED')) {
				localizeDescription = description;
			}
			this.controller.getStore().commit('application/set', {
				error: {
					active: true,
					code,
					description: localizeDescription
				}
			});
		}
		clearError() {
			this.controller.getStore().commit('application/set', {
				error: {
					active: false,
					code: '',
					description: ''
				}
			});
		}

		// public method
		subscribe(params) {
			if (!im_lib_utils.Utils.types.isPlainObject(params)) {
				console.error(`%cLiveChatWidget.subscribe: params is not a object`, "color: black;");
				return false;
			}
			if (!SubscriptionTypeCheck.includes(params.type)) {
				console.error(`%cLiveChatWidget.subscribe: subscription type is not correct (%c${params.type}%c)`, "color: black;", "font-weight: bold; color: red", "color: black");
				return false;
			}
			if (typeof params.callback !== 'function') {
				console.error(`%cLiveChatWidget.subscribe: callback is not a function (%c${typeof params.callback}%c)`, "color: black;", "font-weight: bold; color: red", "color: black");
				return false;
			}
			if (typeof this.subscribers[params.type] === 'undefined') {
				this.subscribers[params.type] = [];
			}
			this.subscribers[params.type].push(params.callback);
			return function () {
				this.subscribers[params.type] = this.subscribers[params.type].filter(function (element) {
					return element !== params.callback;
				});
			}.bind(this);
		}
		sendEvent(params) {
			params = params || {};
			if (!params.type) {
				return false;
			}
			if (typeof params.data !== 'object' || !params.data) {
				params.data = {};
			}
			if (this.subscribers[params.type] instanceof Array && this.subscribers[params.type].length > 0) {
				this.subscribers[params.type].forEach(callback => callback(params.data));
			}
			if (this.subscribers[SubscriptionType.every] instanceof Array && this.subscribers[SubscriptionType.every].length > 0) {
				this.subscribers[SubscriptionType.every].forEach(callback => callback({
					type: params.type,
					data: params.data
				}));
			}
			return true;
		}

		// public method
		addLocalize(phrases) {
			if (typeof phrases !== "object" || !phrases) {
				return false;
			}
			for (let name in phrases) {
				if (phrases.hasOwnProperty(name)) {
					this.localize[name] = phrases[name];
				}
			}
			return true;
		}
		getLocalize(name) {
			let phrase = '';
			if (typeof name === 'undefined') {
				return this.localize;
			} else if (typeof this.localize[name.toString()] === 'undefined') {
				console.warn(`LiveChatWidget.getLocalize: message with code '${name.toString()}' is undefined.`);
			} else {
				phrase = this.localize[name];
			}
			return phrase;
		}

		/* endregion 04. Widget interaction and utils */

		/* region 05. Rest batch handlers */
		handleConfigGet(response) {
			return new Promise((resolve, reject) => {
				const configGet = response[RestMethod.widgetConfigGet];
				if (configGet && configGet.error()) {
					return reject({
						code: configGet.error().ex.error,
						description: configGet.error().ex.error_description
					});
				}
				this.controller.executeRestAnswer(RestMethod.widgetConfigGet, configGet);
				resolve();
			});
		}
		handleUserGet(response) {
			return new Promise((resolve, reject) => {
				const userGetResult = response[RestMethod.widgetUserGet];
				if (userGetResult.error()) {
					return reject({
						code: userGetResult.error().ex.error,
						description: userGetResult.error().ex.error_description
					});
				}
				this.controller.executeRestAnswer(RestMethod.widgetUserGet, userGetResult);
				resolve();
			});
		}
		handleChatGet(response) {
			return new Promise((resolve, reject) => {
				const chatGetResult = response[im_const.RestMethodHandler.imChatGet];
				if (chatGetResult.error()) {
					return reject({
						code: chatGetResult.error().ex.error,
						description: chatGetResult.error().ex.error_description
					});
				}
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imChatGet, chatGetResult);
				resolve();
			});
		}
		handleDialogGet(response) {
			return new Promise((resolve, reject) => {
				const dialogGetResult = response[RestMethod.widgetDialogGet];
				if (!dialogGetResult) {
					return resolve();
				}
				if (dialogGetResult.error()) {
					return reject({
						code: dialogGetResult.error().ex.error,
						description: dialogGetResult.error().ex.error_description
					});
				}
				this.controller.executeRestAnswer(RestMethod.widgetDialogGet, dialogGetResult);
				resolve();
			});
		}
		handleDialogMessagesGet(response) {
			return new Promise((resolve, reject) => {
				const dialogMessagesGetResult = response[im_const.RestMethodHandler.imDialogMessagesGetInit];
				if (!dialogMessagesGetResult) {
					return resolve();
				}
				if (dialogMessagesGetResult.error()) {
					return reject({
						code: dialogMessagesGetResult.error().ex.error,
						description: dialogMessagesGetResult.error().ex.error_description
					});
				}
				this.controller.getStore().dispatch('dialogues/saveDialog', {
					dialogId: this.controller.application.getDialogId(),
					chatId: this.controller.application.getChatId()
				});
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imDialogMessagesGetInit, dialogMessagesGetResult);
				resolve();
			});
		}
		handleUserRegister(response) {
			return new Promise((resolve, reject) => {
				const userRegisterResult = response[RestMethod.widgetUserRegister];
				if (!userRegisterResult) {
					return resolve();
				}
				if (userRegisterResult.error()) {
					return reject({
						code: userRegisterResult.error().ex.error,
						description: userRegisterResult.error().ex.error_description
					});
				}
				this.controller.executeRestAnswer(RestMethod.widgetUserRegister, userRegisterResult);
				resolve();
			});
		}
		handleChatCreate(response) {
			return new Promise((resolve, reject) => {
				const chatCreateResult = response[RestMethod.widgetChatCreate];
				if (!chatCreateResult) {
					return resolve();
				}
				if (chatCreateResult.error()) {
					return reject({
						code: chatCreateResult.error().ex.error,
						description: chatCreateResult.error().ex.error_description
					});
				}
				this.controller.executeRestAnswer(RestMethod.widgetChatCreate, chatCreateResult);
				resolve();
			});
		}
		handlePullRequests(response) {
			return new Promise(resolve => {
				let timeShift = 0;
				const serverTimeResult = response[RestMethod.pullServerTime];
				if (serverTimeResult && !serverTimeResult.error()) {
					timeShift = Math.floor((Date.now() - new Date(serverTimeResult.data()).getTime()) / 1000);
				}
				let config = null;
				const pullConfigResult = response[RestMethod.pullConfigGet];
				if (pullConfigResult && !pullConfigResult.error()) {
					config = pullConfigResult.data();
					config.server.timeShift = timeShift;
				}
				this.startPullClient(config).then(() => {
					main_core_events.EventEmitter.emit(WidgetEventType.processMessagesToSendQueue);
				}).catch(error => {
					this.setError(error.ex.error, error.ex.error_description);
				}).finally(resolve);
			});
		}
		/* endregion 05. Rest batch handlers */
	}

	/**
	 * Bitrix OpenLines widget
	 * Widget public interface
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	class WidgetPublicManager {
		constructor(config) {
			this.developerInfo = 'Do not use private methods.';
			this.__privateMethods__ = new Widget(config);
			this.__createLegacyMethods();
		}
		open(params) {
			return this.__privateMethods__.open(params);
		}
		close() {
			return this.__privateMethods__.close();
		}
		showNotification(params) {
			return this.__privateMethods__.showNotification(params);
		}
		getUserData() {
			return this.__privateMethods__.getUserData();
		}
		setUserRegisterData(params) {
			return this.__privateMethods__.setUserRegisterData(params);
		}
		setCustomData(params) {
			return this.__privateMethods__.setCustomData(params);
		}
		mutateTemplateComponent(id, params) {
			return this.__privateMethods__.mutateTemplateComponent(id, params);
		}
		addLocalize(phrases) {
			return this.__privateMethods__.addLocalize(phrases);
		}

		/**
		 *
		 * @param params {Object}
		 * @returns {Function|Boolean} - Unsubscribe callback function or False
		 */
		subscribe(params) {
			return this.__privateMethods__.subscribe(params);
		}
		start() {
			return this.__privateMethods__.start();
		}
		__createLegacyMethods() {
			if (typeof window.BX.LiveChat === 'undefined') {
				let sourceHref = document.createElement('a');
				sourceHref.href = this.__privateMethods__.host;
				let sourceDomain = sourceHref.protocol + '//' + sourceHref.hostname + (sourceHref.port && sourceHref.port != '80' && sourceHref.port != '443' ? ":" + sourceHref.port : "");
				window.BX.LiveChat = {
					openLiveChat: () => {
						this.open({
							openFromButton: true
						});
					},
					closeLiveChat: () => {
						this.close();
					},
					addEventListener: (el, eventName, handler) => {
						if (eventName === 'message') {
							this.subscribe({
								type: SubscriptionType.userMessage,
								callback: function (event) {
									handler({
										origin: sourceDomain,
										data: JSON.stringify({
											action: 'sendMessage'
										}),
										event
									});
								}
							});
						} else {
							console.warn('Method BX.LiveChat.addEventListener is not supported, user new format for subscribe.');
						}
					},
					setCookie: () => {},
					getCookie: () => {},
					sourceDomain
				};
			}
			if (typeof window.BxLiveChatInit === 'function') {
				let config = window.BxLiveChatInit();
				if (config.user) {
					this.__privateMethods__.setUserRegisterData(config.user);
				}
				if (config.firstMessage) {
					this.__privateMethods__.setCustomData(config.firstMessage);
				}
			}
			if (window.BxLiveChatLoader instanceof Array) {
				window.BxLiveChatLoader.forEach(callback => callback());
			}
			return true;
		}
	}

	class WidgetSendMessageHandler extends im_eventHandler.SendMessageHandler {
		application = null;
		storedMessage = null;
		constructor($Bitrix) {
			super($Bitrix);
			this.application = $Bitrix.Application.get();
			this.onProcessQueueHandler = this.processQueue.bind(this);
			this.onConsentAcceptedHandler = this.onConsentAccepted.bind(this);
			this.onConsentDeclinedHandler = this.onConsentDeclined.bind(this);
			main_core_events.EventEmitter.subscribe(WidgetEventType.processMessagesToSendQueue, this.onProcessQueueHandler);
			main_core_events.EventEmitter.subscribe(WidgetEventType.consentAccepted, this.onConsentAcceptedHandler);
			main_core_events.EventEmitter.subscribe(WidgetEventType.consentDeclined, this.onConsentDeclinedHandler);
		}
		destroy() {
			super.destroy();
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.processMessagesToSendQueue, this.onProcessQueueHandler);
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.consentAccepted, this.onConsentAcceptedHandler);
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.consentDeclined, this.onConsentDeclinedHandler);
		}
		onSendMessage({
			data: event
		}) {
			event.focus = event.focus !== false;

			//hide smiles
			if (this.getWidgetData().common.showForm === FormType.smile) {
				main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
			}

			//show consent window if needed
			if (!this.getWidgetData().dialog.userConsent && this.getWidgetData().common.consentUrl) {
				if (event.text) {
					this.storedMessage = event.text;
				}
				main_core_events.EventEmitter.emit(WidgetEventType.showConsent);
				return false;
			}
			event.text = event.text ? event.text : this.storedMessage;
			if (!event.text && !event.file) {
				return false;
			}
			main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
			if (this.isCreateSessionMode()) {
				main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.stopWriting);
				main_core_events.EventEmitter.emitAsync(WidgetEventType.createSession).then(() => {
					this.store.commit('widget/common', {
						isCreateSessionMode: false
					});
					this.sendMessage(event.text, event.file);
				});
			} else {
				this.sendMessage(event.text, event.file);
			}
			if (event.focus) {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setFocus);
			}
			return true;
		}
		sendMessage(text = '', file = null) {
			if (!text && !file) {
				return false;
			}
			const quoteId = this.store.getters['dialogues/getQuoteId'](this.getDialogId());
			if (quoteId) {
				const quoteMessage = this.store.getters['messages/getMessage'](this.getChatId(), quoteId);
				if (quoteMessage) {
					text = this.getMessageTextWithQuote(quoteMessage, text);
					main_core_events.EventEmitter.emit(im_const.EventType.dialog.quotePanelClose);
				}
			}
			if (!this.controller.application.isUnreadMessagesLoaded()) {
				this.sendMessageToServer({
					id: 0,
					chatId: this.getChatId(),
					dialogId: this.getDialogId(),
					text,
					file
				});
				this.processQueue();
				return true;
			}
			const params = {};
			if (file) {
				params.FILE_ID = [file.id];
			}
			this.addMessageToModel({
				text,
				params,
				sending: !file
			}).then(messageId => {
				if (!this.isDialogStart()) {
					this.store.commit('widget/common', {
						dialogStart: true
					});
				}
				main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
					chatId: this.getChatId(),
					cancelIfScrollChange: true
				});
				this.addMessageToQueue({
					messageId,
					text,
					file
				});
				if (this.getChatId()) {
					this.processQueue();
				} else {
					main_core_events.EventEmitter.emit(WidgetEventType.requestData);
				}
			});
			return true;
		}
		onClickOnKeyboard({
			data: event
		}) {
			if (event.action === 'ACTION' && event.params.action === 'LIVECHAT') {
				const {
					dialogId,
					messageId,
					value
				} = event.params;
				const values = JSON.parse(value);
				const sessionId = Number.parseInt(values.SESSION_ID, 10);
				if (sessionId !== this.getSessionId() || this.isSessionClose()) {
					console.error('WidgetSendMessageHandler', this.loc['BX_LIVECHAT_ACTION_EXPIRED']);
					return false;
				}
				this.restClient.callMethod(RestMethod.widgetActionSend, {
					'MESSAGE_ID': messageId,
					'DIALOG_ID': dialogId,
					'ACTION_VALUE': value
				});
			}
			if (event.action === 'COMMAND') {
				const {
					dialogId,
					messageId,
					botId,
					command,
					params
				} = event.params;
				this.restClient.callMethod(im_const.RestMethod.imMessageCommand, {
					'MESSAGE_ID': messageId,
					'DIALOG_ID': dialogId,
					'BOT_ID': botId,
					'COMMAND': command,
					'COMMAND_PARAMS': params
				}).catch(error => console.error('WidgetSendMessageHandler: command processing error', error));
			}
		}
		getWidgetData() {
			return this.store.state.widget;
		}
		getChatId() {
			return this.store.state.application.dialog.chatId;
		}
		getDialogId() {
			return this.store.state.application.dialog.dialogId;
		}
		getUserId() {
			return this.store.state.widget.user.id;
		}
		getMessageTextWithQuote(quoteMessage, text) {
			let user = null;
			if (quoteMessage.authorId) {
				user = this.store.getters['users/get'](quoteMessage.authorId);
			}
			const files = this.store.getters['files/getList'](this.getChatId());
			const quoteDelimiter = '-'.repeat(54);
			const quoteTitle = user && user.name ? user.name : this.loc['BX_LIVECHAT_SYSTEM_MESSAGE'];
			const quoteDate = im_lib_utils.Utils.date.format(quoteMessage.date, null, this.loc);
			const quoteContent = im_lib_utils.Utils.text.quote(quoteMessage.text, quoteMessage.params, files, this.loc);
			const message = [];
			message.push(quoteDelimiter);
			message.push(`${quoteTitle} [${quoteDate}]`);
			message.push(quoteContent);
			message.push(quoteDelimiter);
			message.push(text);
			return message.join("\n");
		}
		addMessageToQueue({
			messageId,
			text,
			file
		}) {
			this.messagesToSend.push({
				id: messageId,
				chatId: this.getChatId(),
				dialogId: this.getDialogId(),
				text,
				file,
				sending: false
			});
		}
		addMessageToModel({
			text,
			params,
			sending
		}) {
			return this.store.dispatch('messages/add', {
				chatId: this.getChatId(),
				authorId: this.getUserId(),
				text,
				params,
				sending,
				id: this.generateUuidV4()
			});
		}
		generateUuidV4() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
				const r = Math.random() * 16 | 0;
				return (c === 'x' ? r : r & 0x3 | 0x8).toString(16);
			});
		}
		sendMessageToServer(message) {
			main_core_events.EventEmitter.emit(im_const.EventType.textarea.stopWriting);

			// first message, when we didn't have chat
			if (message.chatId === 0) {
				message.chatId = this.getChatId();
			}
			this.restClient.callMethod(im_const.RestMethod.imMessageAdd, {
				'TEMPLATE_ID': message.id,
				'CHAT_ID': message.chatId,
				'MESSAGE': message.text
			}, null, null, im_lib_utils.Utils.getLogTrackingParams({
				name: im_const.RestMethod.imMessageAdd,
				data: {
					timMessageType: 'text'
				},
				dialog: this.getDialogData()
			})).then(response => {
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imMessageAdd, response, message);
			}).catch(error => {
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imMessageAdd, error, message);
				im_lib_logger.Logger.warn('Error during sending message', error);
			});
			return true;
		}
		isDialogStart() {
			return this.store.state.widget.common.dialogStart;
		}
		isCreateSessionMode() {
			return this.store.state.widget.common.isCreateSessionMode;
		}
		getDialogData() {
			const dialogId = this.getDialogId();
			return this.store.state.dialogues.collection[dialogId];
		}
		getApplicationModel() {
			return this.store.state.application;
		}
		getSessionId() {
			return this.store.state.widget.dialog.sessionId;
		}
		isSessionClose() {
			return this.store.state.widget.dialog.sessionClose;
		}
		processQueue() {
			if (this.application.offline) {
				return false;
			}
			this.messagesToSend.filter(element => !element.sending).forEach(element => {
				this.deleteFromQueue(element.id);
				element.sending = true;
				if (element.file) {
					main_core_events.EventEmitter.emit(im_const.EventType.textarea.stopWriting);
					main_core_events.EventEmitter.emit(im_const.EventType.uploader.addMessageWithFile, element);
				} else {
					this.sendMessageToServer(element);
				}
			});
		}
		onConsentAccepted() {
			if (!this.storedMessage) {
				return;
			}
			const isFocusNeeded = this.getApplicationModel().device.type !== im_const.DeviceType.mobile;
			this.onSendMessage({
				data: {
					focus: isFocusNeeded
				}
			});
			this.storedMessage = '';
		}
		onConsentDeclined() {
			if (!this.storedMessage) {
				return;
			}
			main_core_events.EventEmitter.emit(im_const.EventType.textarea.insertText, {
				text: this.storedMessage,
				focus: this.getApplicationModel().device.type !== im_const.DeviceType.mobile
			});
			this.storedMessage = '';
		}
	}

	class WidgetTextareaHandler extends im_eventHandler.TextareaHandler {
		application = null;
		pullClient = null;
		constructor($Bitrix) {
			super($Bitrix);
			this.application = $Bitrix.Application.get();
			this.pullClient = $Bitrix.PullClient.get();
		}
		onAppButtonClick({
			data: event
		}) {
			if (event.appId === FormType.smile) {
				if (this.getWidgetModel().common.showForm === FormType.smile) {
					main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
				} else {
					main_core_events.EventEmitter.emit(WidgetEventType.showForm, {
						type: FormType.smile
					});
				}
			} else {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setFocus);
			}
		}
		onFocus() {
			if (this.getWidgetModel().common.copyright && this.getApplicationModel().device.type === im_const.DeviceType.mobile) {
				this.getWidgetModel().common.copyright = false;
			}
			if (im_lib_utils.Utils.device.isMobile()) {
				clearTimeout(this.onFocusScrollTimeout);
				this.onScrollHandler = this.onScroll.bind(this);
				this.onFocusScrollTimeout = setTimeout(() => {
					document.addEventListener('scroll', this.onScrollHandler);
				}, 1000);
			}
		}
		onBlur() {
			if (!this.getWidgetModel().common.copyright && this.getWidgetModel().common.copyright !== this.application.copyright) {
				this.getWidgetModel().common.copyright = this.application.copyright;
				setTimeout(() => {
					main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
						chatId: this.getChatId(),
						force: true
					});
				}, 100);
			}
			if (im_lib_utils.Utils.device.isMobile()) {
				clearTimeout(this.onFocusScrollTimeout);
				document.removeEventListener('scroll', this.onScrollHandler);
			}
		}

		// send typed client message to operator
		onKeyUp({
			data: event
		}) {
			if (this.canSendTypedText()) {
				const {
					sessionId
				} = this.getWidgetModel().dialog;
				const chatId = this.getChatId();
				const userId = this.getWidgetModel().user.id;
				const infoString = main_md5.md5(`${sessionId}/${chatId}/${userId}`);
				const operatorId = this.getWidgetModel().dialog.operator.id;
				const {
					operatorChatId
				} = this.getWidgetModel().dialog;
				this.pullClient.sendMessage([operatorId], 'imopenlines', 'linesMessageWrite', {
					text: event.text,
					infoString,
					operatorChatId: operatorChatId
				});
			}
		}
		canSendTypedText() {
			return this.getWidgetModel().common.watchTyping && this.getWidgetModel().dialog.sessionId && !this.getWidgetModel().dialog.sessionClose && this.getWidgetModel().dialog.operator.id && this.getWidgetModel().dialog.operatorChatId && this.pullClient.isPublishingEnabled();
		}
		onScroll() {
			clearTimeout(this.onScrollTimeout);
			this.onScrollTimeout = setTimeout(() => {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setBlur, true);
			}, 50);
		}
		getWidgetModel() {
			return this.store.state.widget;
		}
		getApplicationModel() {
			return this.store.state.application;
		}
	}

	class WidgetTextareaUploadHandler extends im_eventHandler.TextareaUploadHandler {
		storedFile = null;
		widgetApplication = null;
		constructor($Bitrix) {
			super($Bitrix);
			this.widgetApplication = $Bitrix.Application.get();
			this.onConsentAcceptedHandler = this.onConsentAccepted.bind(this);
			this.onConsentDeclinedHandler = this.onConsentDeclined.bind(this);
			main_core_events.EventEmitter.subscribe(WidgetEventType.consentAccepted, this.onConsentAcceptedHandler);
			main_core_events.EventEmitter.subscribe(WidgetEventType.consentDeclined, this.onConsentDeclinedHandler);
		}
		destroy() {
			super.destroy();
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.consentAccepted, this.onConsentAcceptedHandler);
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.consentDeclined, this.onConsentDeclinedHandler);
		}
		getUserId() {
			return this.controller.store.state.widget.user.id;
		}
		getUserHash() {
			return this.controller.store.state.widget.user.hash;
		}
		getHost() {
			return this.controller.store.state.widget.common.host;
		}
		addMessageWithFile(event) {
			const message = event.getData();
			if (!this.getDiskFolderId()) {
				this.requestDiskFolderId(message.chatId).then(() => {
					this.addMessageWithFile(event);
				}).catch(error => {
					im_lib_logger.Logger.error('addMessageWithFile error', error);
					return false;
				});
				return false;
			}
			this.uploader.senderOptions.customHeaders['Livechat-Dialog-Id'] = this.getDialogId();
			this.uploader.senderOptions.customHeaders['Livechat-Auth-Id'] = this.getUserHash();
			this.uploader.addTask({
				taskId: message.file.id,
				fileData: message.file.source.file,
				fileName: message.file.source.file.name,
				generateUniqueName: true,
				diskFolderId: this.getDiskFolderId(),
				previewBlob: message.file.previewBlob,
				chunkSize: this.widgetApplication.getLocalize('isCloud') ? im_lib_uploader.Uploader.CLOUD_MAX_CHUNK_SIZE : im_lib_uploader.Uploader.BOX_MIN_CHUNK_SIZE
			});
		}
		onTextareaFileSelected({
			data: event
		} = {}) {
			let fileInputEvent = null;
			if (event && event.fileChangeEvent && event.fileChangeEvent.target.files.length > 0) {
				fileInputEvent = event.fileChangeEvent;
			} else {
				fileInputEvent = this.storedFile;
			}
			if (!fileInputEvent) {
				return false;
			}
			if (!this.controller.store.state.widget.dialog.userConsent && this.controller.store.state.widget.common.consentUrl) {
				this.storedFile = event.fileChangeEvent;
				main_core_events.EventEmitter.emit(WidgetEventType.showConsent);
				return false;
			}
			this.uploadFile(fileInputEvent);
		}
		uploadFile(event) {
			if (!event) {
				return false;
			}
			if (!this.getChatId()) {
				main_core_events.EventEmitter.emit(WidgetEventType.requestData);
			}
			this.uploader.addFilesFromEvent(event);
		}
		onConsentAccepted() {
			if (!this.storedFile) {
				return;
			}
			this.onTextareaFileSelected();
			this.storedFile = '';
		}
		onConsentDeclined() {
			if (!this.storedFile) {
				return;
			}
			this.storedFile = '';
		}
		getUploaderSenderOptions() {
			return {
				host: this.getHost(),
				customHeaders: {
					'Livechat-Auth-Id': this.getUserHash()
				},
				actionUploadChunk: 'imopenlines.widget.disk.upload',
				actionCommitFile: 'imopenlines.widget.disk.commit',
				actionRollbackUpload: 'imopenlines.widget.disk.rollbackUpload'
			};
		}
	}

	class WidgetReadingHandler extends im_eventHandler.ReadingHandler {
		application = null;
		constructor($Bitrix) {
			super($Bitrix);
			this.application = $Bitrix.Application.get();
		}
		readMessage(messageId, skipTimer = false, skipAjax = false) {
			if (this.application.offline) {
				return false;
			}
			return super.readMessage(messageId, skipTimer, skipAjax);
		}
	}

	class WidgetResizeHandler extends main_core_events.EventEmitter {
		static events = {
			onSizeChange: 'onSizeChange',
			onStopResize: 'onStopResize'
		};
		isResizing = false;
		widgetLocation = null;
		availableWidth = null;
		availableHeight = null;
		constructor({
			widgetLocation,
			availableWidth,
			availableHeight,
			events
		}) {
			super();
			this.setEventNamespace('BX.IMOL.WidgetResizeHandler');
			this.subscribeToEvents(events);
			this.widgetLocation = widgetLocation;
			this.availableWidth = availableWidth;
			this.availableHeight = availableHeight;
		}
		subscribeToEvents(configEvents) {
			const events = main_core.Type.isObject(configEvents) ? configEvents : {};
			Object.entries(events).forEach(([name, callback]) => {
				if (main_core.Type.isFunction(callback)) {
					this.subscribe(name, callback);
				}
			});
		}
		startResize(event, currentHeight, currentWidth) {
			if (this.isResizing) {
				return false;
			}
			this.isResizing = true;
			event = event.changedTouches ? event.changedTouches[0] : event;
			this.cursorStartPointY = event.clientY;
			this.cursorStartPointX = event.clientX;
			this.heightStartPoint = currentHeight;
			this.widthStartPoint = currentWidth;
			this.addWidgetResizeEvents();
		}
		onContinueResize(event) {
			if (!this.isResizing) {
				return false;
			}
			event = event.changedTouches ? event.changedTouches[0] : event;
			this.cursorControlPointY = event.clientY;
			this.cursorControlPointX = event.clientX;
			const maxHeight = this.isBottomLocation() ? Math.min(this.heightStartPoint + this.cursorStartPointY - this.cursorControlPointY, this.availableHeight) : Math.min(this.heightStartPoint - this.cursorStartPointY + this.cursorControlPointY, this.availableHeight);
			const height = Math.max(maxHeight, WidgetMinimumSize.height);
			const maxWidth = this.isLeftLocation() ? Math.min(this.widthStartPoint - this.cursorStartPointX + this.cursorControlPointX, this.availableWidth) : Math.min(this.widthStartPoint + this.cursorStartPointX - this.cursorControlPointX, this.availableWidth);
			const width = Math.max(maxWidth, WidgetMinimumSize.width);
			this.emit(WidgetResizeHandler.events.onSizeChange, {
				newHeight: height,
				newWidth: width
			});
		}
		onStopResize() {
			if (!this.isResizing) {
				return false;
			}
			this.isResizing = false;
			this.removeWidgetResizeEvents();
			this.emit(WidgetResizeHandler.events.onStopResize);
		}
		setAvailableWidth(width) {
			this.availableWidth = width;
		}
		setAvailableHeight(height) {
			this.availableHeight = height;
		}
		addWidgetResizeEvents() {
			this.onContinueResizeHandler = this.onContinueResize.bind(this);
			this.onStopResizeHandler = this.onStopResize.bind(this);
			document.addEventListener('mousemove', this.onContinueResizeHandler);
			document.addEventListener('mouseup', this.onStopResizeHandler);
			document.addEventListener('mouseleave', this.onStopResizeHandler);
		}
		removeWidgetResizeEvents() {
			document.removeEventListener('mousemove', this.onContinueResizeHandler);
			document.removeEventListener('mouseup', this.onStopResizeHandler);
			document.removeEventListener('mouseleave', this.onStopResizeHandler);
		}
		isBottomLocation() {
			return [LocationType.bottomLeft, LocationType.bottomMiddle, LocationType.bottomRight].includes(this.widgetLocation);
		}
		isLeftLocation() {
			return [LocationType.bottomLeft, LocationType.topLeft, LocationType.topMiddle].includes(this.widgetLocation);
		}
		destroy() {
			this.removeWidgetResizeEvents();
		}
	}

	class WidgetConsentHandler {
		store = null;
		restClient = null;
		application = null;
		constructor($Bitrix) {
			this.store = $Bitrix.Data.get('controller').store;
			this.restClient = $Bitrix.RestClient.get();
			this.application = $Bitrix.Application.get();
			this.subscribeToEvents();
		}
		subscribeToEvents() {
			this.showConsentHandler = this.onShowConsent.bind(this);
			this.acceptConsentHandler = this.onAcceptConsent.bind(this);
			this.declineConsentHandler = this.onDeclineConsent.bind(this);
			main_core_events.EventEmitter.subscribe(WidgetEventType.showConsent, this.showConsentHandler);
			main_core_events.EventEmitter.subscribe(WidgetEventType.acceptConsent, this.acceptConsentHandler);
			main_core_events.EventEmitter.subscribe(WidgetEventType.declineConsent, this.declineConsentHandler);
		}
		onShowConsent() {
			this.showConsent();
		}
		onAcceptConsent() {
			this.acceptConsent();
		}
		onDeclineConsent() {
			this.declineConsent();
		}
		showConsent() {
			this.store.commit('widget/common', {
				showConsent: true
			});
		}
		hideConsent() {
			this.store.commit('widget/common', {
				showConsent: false
			});
		}
		acceptConsent() {
			this.hideConsent();
			this.sendConsentDecision(true);
			main_core_events.EventEmitter.emit(WidgetEventType.consentAccepted);
			if (this.getWidgetModel().common.showForm === FormType.none) {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setFocus);
			}
		}
		declineConsent() {
			main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
			this.hideConsent();
			this.sendConsentDecision(false);
			main_core_events.EventEmitter.emit(WidgetEventType.consentDeclined);
			if (this.getApplicationModel().device.type !== im_const.DeviceType.mobile) {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setFocus);
			}
		}
		sendConsentDecision(result) {
			this.store.commit('widget/dialog', {
				userConsent: result
			});
			if (result && this.application.isUserRegistered()) {
				this.restClient.callMethod(RestMethod.widgetUserConsentApply, {
					config_id: this.getWidgetModel().common.configId,
					consent_url: location.href
				});
			}
		}
		getWidgetModel() {
			return this.store.state.widget;
		}
		getApplicationModel() {
			return this.store.state.application;
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.showConsent, this.showConsentHandler);
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.acceptConsent, this.acceptConsentHandler);
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.declineConsent, this.declineConsentHandler);
		}
	}

	class WidgetFormHandler {
		store = null;
		application = null;
		restClient = null;
		constructor($Bitrix) {
			this.store = $Bitrix.Data.get('controller').store;
			this.restClient = $Bitrix.RestClient.get();
			this.application = $Bitrix.Application.get();
			this.showFormHandler = this.onShowForm.bind(this);
			this.hideFormHandler = this.onHideForm.bind(this);
			this.sendVoteHandler = this.onSendVote.bind(this);
			main_core_events.EventEmitter.subscribe(WidgetEventType.showForm, this.showFormHandler);
			main_core_events.EventEmitter.subscribe(WidgetEventType.hideForm, this.hideFormHandler);
			main_core_events.EventEmitter.subscribe(WidgetEventType.sendDialogVote, this.sendVoteHandler);
		}
		onShowForm({
			data: event
		}) {
			clearTimeout(this.showFormTimeout);
			if (event.type === FormType.like) {
				if (event.delayed) {
					this.showFormTimeout = setTimeout(() => {
						this.showLikeForm();
					}, 5000);
				} else {
					this.showLikeForm();
				}
			} else if (event.type === FormType.smile) {
				this.showSmiles();
			}
		}
		onHideForm() {
			this.hideForm();
		}
		onSendVote({
			data: {
				vote
			}
		}) {
			console.warn('VOTE', vote);
			this.sendVote(vote);
		}
		showLikeForm() {
			if (this.application.offline) {
				return false;
			}
			clearTimeout(this.showFormTimeout);
			if (!this.getWidgetModel().common.vote.enable) {
				return false;
			}
			if (this.getWidgetModel().dialog.sessionClose && this.getWidgetModel().dialog.userVote !== VoteType.none) {
				return false;
			}
			this.store.commit('widget/common', {
				showForm: FormType.like
			});
		}
		showSmiles() {
			this.store.commit('widget/common', {
				showForm: FormType.smile
			});
		}
		sendVote(vote) {
			const {
				sessionId
			} = this.getWidgetModel().dialog;
			if (!sessionId) {
				return false;
			}
			this.restClient.callMethod(RestMethod.widgetVoteSend, {
				'SESSION_ID': sessionId,
				'ACTION': vote
			}).catch(() => {
				this.store.commit('widget/dialog', {
					userVote: VoteType.none
				});
			});
			this.application.sendEvent({
				type: SubscriptionType.userVote,
				data: {
					vote
				}
			});
		}
		hideForm() {
			clearTimeout(this.showFormTimeout);
			if (this.getWidgetModel().common.showForm !== FormType.none) {
				this.store.commit('widget/common', {
					showForm: FormType.none
				});
			}
		}
		getWidgetModel() {
			return this.store.state.widget;
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.showForm, this.showFormHandler);
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.hideForm, this.hideFormHandler);
			main_core_events.EventEmitter.unsubscribe(WidgetEventType.sendDialogVote, this.sendVoteHandler);
		}
	}

	class WidgetReactionHandler extends im_eventHandler.ReactionHandler {
		onOpenMessageReactionList({
			data
		}) {
			im_lib_logger.Logger.warn('Reactions list is blocked for the widget', data);
		}
	}

	class WidgetHistoryHandler {
		store = null;
		application = null;
		constructor($Bitrix) {
			this.store = $Bitrix.Data.get('controller').store;
			this.application = $Bitrix.Application.get();
		}
		getHtmlHistory() {
			const chatId = this.getChatId();
			if (chatId <= 0) {
				console.error('WidgetHistoryHandler: Incorrect chatId value');
			}
			const config = {
				chatId: this.getChatId()
			};
			this.requestControllerAction('imopenlines.widget.history.download', config).then(this.handleRequest.bind(this)).then(this.downloadHistory.bind(this)).catch(error => console.error('WidgetHistoryHandler: fetch error.', error));
		}
		requestControllerAction(action, config) {
			const host = this.application.host ? this.application.host : '';
			const ajaxEndpoint = '/bitrix/services/main/ajax.php';
			const url = new URL(ajaxEndpoint, host);
			url.searchParams.set('action', action);
			const formData = new FormData();
			for (const key in config) {
				if (config.hasOwnProperty(key)) {
					formData.append(key, config[key]);
				}
			}
			return fetch(url, {
				method: 'POST',
				headers: {
					'Livechat-Auth-Id': this.getUserHash()
				},
				body: formData
			});
		}
		handleRequest(response) {
			const contentType = response.headers.get('Content-Type');
			if (contentType.startsWith('application/json')) {
				return response.json();
			}
			return response.blob();
		}
		downloadHistory(result) {
			if (result instanceof Blob) {
				const url = window.URL.createObjectURL(result);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${this.getChatId()}.html`;
				document.body.append(a);
				a.click();
				a.remove();
			} else if (result.hasOwnProperty('errors')) {
				console.error(`WidgetHistoryHandler: ${result.errors[0]}`);
			} else {
				console.error('WidgetHistoryHandler: unknown error.');
			}
		}
		getChatId() {
			return this.store.state.application.dialog.chatId;
		}
		getUserHash() {
			return this.store.state.widget.user.hash;
		}
		destroy() {
			//
		}
	}

	class WidgetDialogActionHandler extends im_eventHandler.DialogActionHandler {
		onClickOnDialog() {
			main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
		}
	}

	/**
	 * Bitrix OpenLines widget
	 * LiveChat base component (Vue component)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-livechat', {
		data() {
			return {
				// sizes
				widgetAvailableHeight: 0,
				widgetAvailableWidth: 0,
				widgetCurrentHeight: 0,
				widgetCurrentWidth: 0,
				widgetIsResizing: false,
				textareaHeight: 100,
				// welcome form
				welcomeFormFilled: false,
				// multi dialog
				startNewChatMode: false
			};
		},
		computed: {
			FormType: () => FormType,
			VoteType: () => VoteType,
			DeviceType: () => im_const.DeviceType,
			EventType: () => im_const.EventType,
			showTextarea() {
				if (this.widget.common.isCreateSessionMode) {
					return this.startNewChatMode;
				}
				const {
					crmFormsSettings
				} = this.widget.common;

				// show if we dont use welcome form
				if (!crmFormsSettings.useWelcomeForm || !crmFormsSettings.welcomeFormId) {
					return true;
				} else {
					// show if we use welcome form with delay, otherwise check if it was filled
					return crmFormsSettings.welcomeFormDelay ? true : this.welcomeFormFilled;
				}
			},
			// for welcome CRM-form before dialog start
			showWelcomeForm() {
				//we are using welcome form, it doesnt have delay and it was not already filled
				return this.widget.common.crmFormsSettings.useWelcomeForm && !this.widget.common.crmFormsSettings.welcomeFormDelay && this.widget.common.crmFormsSettings.welcomeFormId && !this.welcomeFormFilled;
			},
			textareaHeightStyle() {
				return {
					flex: `0 0 ${this.textareaHeight}px`
				};
			},
			textareaBottomMargin() {
				if (!this.widget.common.copyright && !this.isBottomLocation()) {
					return {
						marginBottom: '5px'
					};
				}
				return '';
			},
			widgetHeightStyle() {
				if (im_lib_utils.Utils.device.isMobile() || this.widget.common.pageMode) {
					return;
				}
				if (this.widgetAvailableHeight < WidgetBaseSize.height || this.widgetAvailableHeight < this.widgetCurrentHeight) {
					this.widgetCurrentHeight = Math.max(this.widgetAvailableHeight, WidgetMinimumSize.height);
				}
				return `${this.widgetCurrentHeight}px`;
			},
			widgetWidthStyle() {
				if (im_lib_utils.Utils.device.isMobile() || this.widget.common.pageMode) {
					return;
				}
				if (this.widgetAvailableWidth < WidgetBaseSize.width || this.widgetAvailableWidth < this.widgetCurrentWidth) {
					this.widgetCurrentWidth = Math.max(this.widgetAvailableWidth, WidgetMinimumSize.width);
				}
				return `${this.widgetCurrentWidth}px`;
			},
			userSelectStyle() {
				return this.widgetIsResizing ? 'none' : 'auto';
			},
			widgetMobileDisabled() {
				if (this.application.device.type !== im_const.DeviceType.mobile) {
					return false;
				}
				if (this.application.device.orientation !== im_const.DeviceOrientation.horizontal) {
					return false;
				}
				if (navigator.userAgent.toString().includes('iPhone')) {
					return true;
				} else {
					return typeof window.screen !== 'object' || window.screen.availHeight < 800;
				}
			},
			widgetPositionClass() {
				const className = [];
				if (this.widget.common.pageMode) {
					className.push('bx-livechat-page-mode');
				} else {
					className.push(`bx-livechat-position-${LocationStyle[this.widget.common.location]}`);
				}
				return className;
			},
			widgetLanguageClass() {
				const className = [];
				if (this.application.common.languageId === LanguageType.russian) {
					className.push('bx-livechat-logo-ru');
				} else if (this.application.common.languageId === LanguageType.ukraine) {
					className.push('bx-livechat-logo-ua');
				} else {
					className.push('bx-livechat-logo-en');
				}
				return className;
			},
			widgetPlatformClass() {
				const className = [];
				if (im_lib_utils.Utils.device.isMobile()) {
					className.push('bx-livechat-mobile');
				} else if (im_lib_utils.Utils.browser.isSafari()) {
					className.push('bx-livechat-browser-safari');
				} else if (im_lib_utils.Utils.browser.isIe()) {
					className.push('bx-livechat-browser-ie');
				}
				if (im_lib_utils.Utils.platform.isMac()) {
					className.push('bx-livechat-mac');
				} else {
					className.push('bx-livechat-custom-scroll');
				}
				return className;
			},
			widgetClassName() {
				const className = [];
				className.push(...this.widgetPositionClass, ...this.widgetLanguageClass, ...this.widgetPlatformClass);
				if (!this.widget.common.online) {
					className.push('bx-livechat-offline-state');
				}
				if (this.widget.common.dragged) {
					className.push('bx-livechat-drag-n-drop');
				}
				if (this.widget.common.dialogStart) {
					className.push('bx-livechat-chat-start');
				}
				if (this.widget.dialog.operator.name && !(this.application.device.type === im_const.DeviceType.mobile && this.application.device.orientation === im_const.DeviceOrientation.horizontal)) {
					className.push('bx-livechat-has-operator');
				}
				if (this.widget.common.styles.backgroundColor && im_lib_utils.Utils.isDarkColor(this.widget.common.styles.iconColor)) {
					className.push('bx-livechat-bright-header');
				}
				return className;
			},
			showMessageDialog() {
				return this.messageCollection.length > 0;
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_LIVECHAT_', this);
			},
			...ui_vue_vuex.Vuex.mapState({
				widget: state => state.widget,
				application: state => state.application,
				dialog: state => state.dialogues.collection[state.application.dialog.dialogId],
				messageCollection: state => state.messages.collection[state.application.dialog.chatId]
			})
		},
		created() {
			im_lib_logger.Logger.warn('Livechat component created');
			// we need to wait for initialization and widget opening to init logic handlers
			this.onCreated().then(() => {
				this.subscribeToEvents();
				this.initEventHandlers();
			});
		},
		mounted() {
			if (this.widget.user.id > 0) {
				this.welcomeFormFilled = true;
			}
			this.registerZIndex();
		},
		beforeDestroy() {
			this.unsubscribeEvents();
			this.destroyHandlers();
			this.unregisterZIndex();
		},
		methods: {
			// region initialization
			initEventHandlers() {
				this.sendMessageHandler = new WidgetSendMessageHandler(this.$Bitrix);
				this.textareaHandler = new WidgetTextareaHandler(this.$Bitrix);
				this.textareaUploadHandler = new WidgetTextareaUploadHandler(this.$Bitrix);
				this.readingHandler = new WidgetReadingHandler(this.$Bitrix);
				this.consentHandler = new WidgetConsentHandler(this.$Bitrix);
				this.formHandler = new WidgetFormHandler(this.$Bitrix);
				this.textareaDragHandler = this.getTextareaDragHandler();
				this.resizeHandler = this.getWidgetResizeHandler();
				this.reactionHandler = new WidgetReactionHandler(this.$Bitrix);
				this.historyHandler = new WidgetHistoryHandler(this.$Bitrix);
				this.dialogActionHandler = new WidgetDialogActionHandler(this.$Bitrix);
			},
			destroyHandlers() {
				this.sendMessageHandler.destroy();
				this.textareaHandler.destroy();
				this.textareaUploadHandler.destroy();
				this.readingHandler.destroy();
				this.consentHandler.destroy();
				this.formHandler.destroy();
				this.textareaDragHandler.destroy();
				this.resizeHandler.destroy();
				this.reactionHandler.destroy();
				this.historyHandler.destroy();
				this.dialogActionHandler.destroy();
			},
			subscribeToEvents() {
				document.addEventListener('keydown', this.onWindowKeyDown);
				if (!im_lib_utils.Utils.device.isMobile() && !this.widget.common.pageMode) {
					this.getAvailableSpaceFunc = im_lib_utils.Utils.throttle(this.getAvailableSpace, 50);
					window.addEventListener('resize', this.getAvailableSpaceFunc);
				}
			},
			unsubscribeEvents() {
				document.removeEventListener('keydown', this.onWindowKeyDown);
				if (!im_lib_utils.Utils.device.isMobile() && !this.widget.common.pageMode) {
					window.removeEventListener('resize', this.getAvailableSpaceFunc);
				}
			},
			initMobileEnv() {
				const metaTags = document.head.querySelectorAll('meta');
				const viewPortMetaSiteNode = [...metaTags].find(element => element.name === 'viewport');
				if (viewPortMetaSiteNode) {
					// save tag and remove it from DOM
					this.viewPortMetaSiteNode = viewPortMetaSiteNode;
					this.viewPortMetaSiteNode.remove();
				} else {
					this.createViewportMeta();
				}
				if (!this.viewPortMetaWidgetNode) {
					this.viewPortMetaWidgetNode = document.createElement('meta');
					this.viewPortMetaWidgetNode.setAttribute('name', 'viewport');
					this.viewPortMetaWidgetNode.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=0');
					document.head.append(this.viewPortMetaWidgetNode);
				}
				document.body.classList.add('bx-livechat-mobile-state');
				if (im_lib_utils.Utils.browser.isSafariBased()) {
					document.body.classList.add('bx-livechat-mobile-safari-based');
				}
				return new Promise(resolve => {
					setTimeout(() => {
						this.$store.dispatch('widget/show').then(resolve);
					}, 50);
				});
			},
			createViewportMeta() {
				let contentWidth = document.body.offsetWidth;
				if (contentWidth < window.innerWidth) {
					contentWidth = window.innerWidth;
				}
				if (contentWidth < 1024) {
					contentWidth = 1024;
				}
				this.viewPortMetaSiteNode = document.createElement('meta');
				this.viewPortMetaSiteNode.setAttribute('name', 'viewport');
				this.viewPortMetaSiteNode.setAttribute('content', `width=${contentWidth}, initial-scale=1.0, user-scalable=1`);
			},
			removeMobileEnv() {
				document.body.classList.remove('bx-livechat-mobile-state');
				if (im_lib_utils.Utils.browser.isSafariBased()) {
					document.body.classList.remove('bx-livechat-mobile-safari-based');
				}
				if (this.viewPortMetaWidgetNode) {
					this.viewPortMetaWidgetNode.remove();
					this.viewPortMetaWidgetNode = null;
				}
				if (this.viewPortMetaSiteNode) {
					document.head.append(this.viewPortMetaSiteNode);
					this.viewPortMetaSiteNode = null;
				}
			},
			onCreated() {
				return new Promise(resolve => {
					if (im_lib_utils.Utils.device.isMobile()) {
						this.initMobileEnv().then(resolve);
					} else {
						this.$store.dispatch('widget/show').then(() => {
							this.widgetCurrentHeight = WidgetBaseSize.height;
							this.widgetCurrentWidth = WidgetBaseSize.width;
							this.getAvailableSpace();

							// restore widget size from cache
							this.widgetCurrentHeight = this.widget.common.widgetHeight || this.widgetCurrentHeight;
							this.widgetCurrentWidth = this.widget.common.widgetWidth || this.widgetCurrentWidth;
							resolve();
						});
					}

					// restore textarea size from cache
					this.textareaHeight = this.widget.common.textareaHeight || this.textareaHeight;
					this.initCollections();
				});
			},
			initCollections() {
				this.$store.commit('files/initCollection', {
					chatId: this.getApplication().getChatId()
				});
				this.$store.commit('messages/initCollection', {
					chatId: this.getApplication().getChatId()
				});
				this.$store.commit('dialogues/initCollection', {
					dialogId: this.getApplication().getDialogId(),
					fields: {
						entityType: 'LIVECHAT',
						type: 'livechat'
					}
				});
			},
			// endregion initialization
			// region events
			onBeforeClose() {
				if (im_lib_utils.Utils.device.isMobile()) {
					this.removeMobileEnv();
				}
			},
			onAfterClose() {
				this.getApplication().close();
			},
			onOpenMenu() {
				this.historyHandler.getHtmlHistory();
			},
			onPullRequestConfig() {
				this.getApplication().recoverPullConnection();
			},
			onSmilesSelectSmile(event) {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.insertText, {
					text: event.text
				});
			},
			onSmilesSelectSet() {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setFocus);
			},
			onWidgetStartDrag(event) {
				this.resizeHandler.startResize(event, this.widgetCurrentHeight, this.widgetCurrentWidth);
				this.widgetIsResizing = true;
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setBlur, true);
			},
			onWindowKeyDown(event) {
				// not escape
				if (event.keyCode !== 27) {
					return;
				}

				// hide form
				if (this.widget.common.showForm !== FormType.none) {
					this.$store.commit('widget/common', {
						showForm: FormType.none
					});
				}
				// decline consent
				else if (this.widget.common.showConsent) {
					main_core_events.EventEmitter.emit(WidgetEventType.declineConsent);
				}
				// close widget
				else {
					this.close();
				}
				event.preventDefault();
				event.stopPropagation();
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setFocus);
			},
			onWelcomeFormSendSuccess() {
				this.welcomeFormFilled = true;
			},
			onWelcomeFormSendError(error) {
				console.error('onWelcomeFormSendError', error);
				this.welcomeFormFilled = true;
			},
			onTextareaStartDrag(event) {
				this.textareaDragHandler.onStartDrag(event, this.textareaHeight);
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setBlur, true);
			},
			openDialogList() {
				this.$store.commit('widget/common', {
					isCreateSessionMode: !this.widget.common.isCreateSessionMode
				});
				this.startNewChatMode = false;
			},
			onStartNewChat() {
				this.startNewChatMode = true;
			},
			// endregion events
			// region helpers
			getApplication() {
				return this.$Bitrix.Application.get();
			},
			close() {
				if (this.widget.common.pageMode) {
					return false;
				}
				this.onBeforeClose();
				this.$store.commit('widget/common', {
					showed: false
				});
			},
			// how much width and height we have for resizing
			getAvailableSpace() {
				const widgetMargin = 50;
				if (this.isBottomLocation()) {
					const bottomPosition = this.$refs.widgetWrapper.getBoundingClientRect().bottom;
					const widgetBottomMargin = window.innerHeight - bottomPosition;
					this.widgetAvailableHeight = window.innerHeight - widgetMargin - widgetBottomMargin;
				} else {
					const topPosition = this.$refs.widgetWrapper.getBoundingClientRect().top;
					this.widgetAvailableHeight = window.innerHeight - widgetMargin - topPosition;
				}
				this.widgetAvailableWidth = window.innerWidth - widgetMargin * 2;
				if (this.resizeHandler) {
					this.resizeHandler.setAvailableWidth(this.widgetAvailableWidth);
					this.resizeHandler.setAvailableHeight(this.widgetAvailableHeight);
				}
			},
			getTextareaDragHandler() {
				return new im_eventHandler.TextareaDragHandler({
					[im_eventHandler.TextareaDragHandler.events.onHeightChange]: ({
						data
					}) => {
						const {
							newHeight
						} = data;
						if (this.textareaHeight !== newHeight) {
							this.textareaHeight = newHeight;
						}
					},
					[im_eventHandler.TextareaDragHandler.events.onStopDrag]: () => {
						this.$store.commit('widget/common', {
							textareaHeight: this.textareaHeight
						});
						main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
							chatId: this.chatId,
							force: true
						});
					}
				});
			},
			getWidgetResizeHandler() {
				return new WidgetResizeHandler({
					widgetLocation: this.widget.common.location,
					availableWidth: this.widgetAvailableWidth,
					availableHeight: this.widgetAvailableHeight,
					events: {
						[WidgetResizeHandler.events.onSizeChange]: ({
							data
						}) => {
							const {
								newHeight,
								newWidth
							} = data;
							if (this.widgetCurrentHeight !== newHeight) {
								this.widgetCurrentHeight = newHeight;
							}
							if (this.widgetCurrentWidth !== newWidth) {
								this.widgetCurrentWidth = newWidth;
							}
						},
						[WidgetResizeHandler.events.onStopResize]: () => {
							this.widgetIsResizing = false;
							this.$store.commit('widget/common', {
								widgetHeight: this.widgetCurrentHeight,
								widgetWidth: this.widgetCurrentWidth
							});
						}
					}
				});
			},
			isBottomLocation() {
				return [LocationType.bottomLeft, LocationType.bottomMiddle, LocationType.bottomRight].includes(this.widget.common.location);
			},
			isPageMode() {
				return this.widget.common.pageMode;
			},
			registerZIndex() {
				this.zIndexStackInstance = this.$Bitrix.Data.get('zIndexStack');
				if (this.zIndexStackInstance && !!this.$refs.widgetWrapper) {
					this.zIndexStackInstance.register(this.$refs.widgetWrapper);
				}
			},
			unregisterZIndex() {
				if (this.zIndexStackInstance) {
					this.zIndexStackInstance.unregister(this.$refs.widgetWrapper);
				}
			}
			// endregion helpers
		},
		// language=Vue
		template: `
		<transition enter-active-class="bx-livechat-show" leave-active-class="bx-livechat-close" @after-leave="onAfterClose">
			<div
				:class="widgetClassName"
				v-if="widget.common.showed"
				:style="{height: widgetHeightStyle, width: widgetWidthStyle, userSelect: userSelectStyle}"
				class="bx-livechat-wrapper bx-livechat-show"
				ref="widgetWrapper"
			>
				<div class="bx-livechat-box">
					<div v-if="isBottomLocation() && !isPageMode()" class="bx-livechat-widget-resize-handle" @mousedown="onWidgetStartDrag"></div>
					<bx-livechat-head 
						:isWidgetDisabled="widgetMobileDisabled" 
						@openMenu="onOpenMenu" 
						@close="close"
						@openDialogList="openDialogList"
					/>
					<template v-if="widgetMobileDisabled">
						<bx-livechat-body-orientation-disabled/>
					</template>
					<template v-else-if="application.error.active">
						<bx-livechat-body-error/>
					</template>
					<template v-else-if="!widget.common.configId">
						<div class="bx-livechat-body" key="loading-body">
							<bx-livechat-body-loading/>
						</div>
					</template>
					<template v-else>
						<div v-show="!widget.common.dialogStart" class="bx-livechat-body" :class="{'bx-livechat-body-with-scroll': showWelcomeForm}" key="welcome-body">
							<bx-imopenlines-form
								v-show="showWelcomeForm"
								@formSendSuccess="onWelcomeFormSendSuccess"
								@formSendError="onWelcomeFormSendError"
							/>
							<template v-if="!showWelcomeForm">
								<bx-livechat-body-operators/>
								<keep-alive include="bx-livechat-smiles">
									<template v-if="widget.common.showForm === FormType.smile">
										<bx-livechat-smiles @selectSmile="onSmilesSelectSmile" @selectSet="onSmilesSelectSet"/>
									</template>
								</keep-alive>
							</template>
						</div>
						<template v-if="widget.common.dialogStart">
							<bx-pull-component-status :canReconnect="true" @reconnect="onPullRequestConfig"/>
							<div :class="['bx-livechat-body', {'bx-livechat-body-with-message': showMessageDialog}]" key="with-message">
								<template v-if="widget.common.isCreateSessionMode">
									<bx-livechat-dialogues-list @startNewChat="onStartNewChat"/>
								</template>
								<template v-else-if="showMessageDialog">
									<div class="bx-livechat-dialog">
										<bx-im-component-dialog
											:userId="application.common.userId"
											:dialogId="application.dialog.dialogId"
											:messageLimit="application.dialog.messageLimit"
											:enableReactions="true"
											:enableDateActions="false"
											:enableCreateContent="false"
											:enableGestureQuote="true"
											:enableGestureMenu="true"
											:showMessageAvatar="false"
											:showMessageMenu="false"
											:skipDataRequest="true"
											:showLoadingState="false"
											:showEmptyState="false"
										 />
									</div>
								</template>
								<template v-else>
									<bx-livechat-body-loading/>
								</template>

								<keep-alive include="bx-livechat-smiles">
									<template v-if="widget.common.showForm === FormType.like && widget.common.vote.enable">
										<bx-livechat-form-vote/>
									</template>
									<template v-else-if="widget.common.showForm === FormType.welcome">
										<bx-livechat-form-welcome/>
									</template>
									<template v-else-if="widget.common.showForm === FormType.offline">
										<bx-livechat-form-offline/>
									</template>
									<template v-else-if="widget.common.showForm === FormType.history">
										<bx-livechat-form-history/>
									</template>
									<template v-else-if="widget.common.showForm === FormType.smile">
										<bx-livechat-smiles @selectSmile="onSmilesSelectSmile" @selectSet="onSmilesSelectSet"/>
									</template>
								</keep-alive>
							</div>
						</template>
						<div v-if="showTextarea || startNewChatMode" class="bx-livechat-textarea" :style="[textareaHeightStyle, textareaBottomMargin]" ref="textarea">
							<div class="bx-livechat-textarea-resize-handle" @mousedown="onTextareaStartDrag" @touchstart="onTextareaStartDrag"></div>
							<bx-im-component-textarea
								:siteId="application.common.siteId"
								:userId="application.common.userId"
								:dialogId="application.dialog.dialogId"
								:writesEventLetter="3"
								:enableEdit="true"
								:enableCommand="false"
								:enableMention="false"
								:enableFile="application.disk.enabled"
								:autoFocus="application.device.type !== DeviceType.mobile"
								:styles="{button: {backgroundColor: widget.common.styles.backgroundColor, iconColor: widget.common.styles.iconColor}}"
							/>
						</div>
						<div v-if="!widget.common.copyright && !isBottomLocation" class="bx-livechat-nocopyright-resize-wrap" style="position: relative;">
							<div class="bx-livechat-widget-resize-handle" @mousedown="onWidgetStartDrag"></div>
						</div>
						<bx-livechat-form-consent />
						<template v-if="widget.common.copyright">
							<div class="bx-livechat-copyright">
								<template v-if="widget.common.copyrightUrl">
									<a class="bx-livechat-copyright-link" :href="widget.common.copyrightUrl" target="_blank">
										<span class="bx-livechat-logo-name">{{localize.BX_LIVECHAT_COPYRIGHT_TEXT}}</span>
										<span class="bx-livechat-logo-icon"></span>
									</a>
								</template>
								<template v-else>
									<span class="bx-livechat-logo-name">{{localize.BX_LIVECHAT_COPYRIGHT_TEXT}}</span>
									<span class="bx-livechat-logo-icon"></span>
								</template>
								<div v-if="!isBottomLocation() && !isPageMode()" class="bx-livechat-widget-resize-handle" @mousedown="onWidgetStartDrag"></div>
							</div>
						</template>
					</template>
				</div>
			</div>
		</transition>
	`
	});

	/**
	 * Bitrix OpenLines widget
	 * Body error component (Vue component)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-livechat-body-error', {
		computed: {
			...ui_vue_vuex.Vuex.mapState({
				application: state => state.application
			})
		},
		template: `
		<div class="bx-livechat-body" key="error-body">
			<div class="bx-livechat-warning-window">
				<div class="bx-livechat-warning-icon"></div>
				<template v-if="application.error.description"> 
					<div class="bx-livechat-help-title bx-livechat-help-title-sm bx-livechat-warning-msg" v-html="application.error.description"></div>
				</template> 
				<template v-else>
					<div class="bx-livechat-help-title bx-livechat-help-title-md bx-livechat-warning-msg">{{$Bitrix.Loc.getMessage('BX_LIVECHAT_ERROR_TITLE')}}</div>
					<div class="bx-livechat-help-title bx-livechat-help-title-sm bx-livechat-warning-msg">{{$Bitrix.Loc.getMessage('BX_LIVECHAT_ERROR_DESC')}}</div>
				</template> 
			</div>
		</div>
	`
	});

	/**
	 * Bitrix OpenLines widget
	 * Head component (Vue component)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-livechat-head', {
		/**
		 * @emits 'close'
		 * @emits 'like'
		 * @emits 'history'
		 */
		props: {
			isWidgetDisabled: {
				default: false
			}
		},
		data() {
			return {
				multiDialog: false // disabled because of beta status
			};
		},
		methods: {
			openDialogList() {
				main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
				this.$emit('openDialogList');
			},
			close(event) {
				this.$emit('close');
			},
			like() {
				main_core_events.EventEmitter.emit(WidgetEventType.showForm, {
					type: FormType.like
				});
			},
			openMenu(event) {
				this.$emit('openMenu', event);
			}
		},
		computed: {
			VoteType: () => VoteType,
			chatId() {
				if (this.application) {
					return this.application.dialog.chatId;
				}
			},
			customBackgroundStyle(state) {
				return state.widget.common.styles.backgroundColor ? 'background-color: ' + state.widget.common.styles.backgroundColor + '!important;' : '';
			},
			customBackgroundOnlineStyle(state) {
				return state.widget.common.styles.backgroundColor ? 'border-color: ' + state.widget.common.styles.backgroundColor + '!important;' : '';
			},
			showName(state) {
				return state.widget.dialog.operator.firstName || state.widget.dialog.operator.lastName;
			},
			voteActive(state) {
				if (!!state.widget.dialog.closeVote) {
					return false;
				}
				if (!state.widget.common.vote.beforeFinish && state.widget.dialog.sessionStatus < SessionStatus.waitClient) {
					return false;
				}
				if (!state.widget.dialog.sessionClose || state.widget.dialog.sessionClose && state.widget.dialog.userVote === VoteType.none) {
					return true;
				}
				if (state.widget.dialog.sessionClose && state.widget.dialog.userVote !== VoteType.none) {
					return true;
				}
				return false;
			},
			chatTitle(state) {
				return state.widget.common.textMessages.bxLivechatTitle || state.widget.common.configName || this.localize.BX_LIVECHAT_TITLE;
			},
			operatorName(state) {
				if (!this.showName) return '';
				return state.widget.dialog.operator.firstName ? state.widget.dialog.operator.firstName : state.widget.dialog.operator.name;
			},
			operatorDescription(state) {
				if (!this.showName) {
					return '';
				}
				const operatorPosition = state.widget.dialog.operator.workPosition ? state.widget.dialog.operator.workPosition : this.localize.BX_LIVECHAT_USER;
				if (state.widget.common.showSessionId && state.widget.dialog.sessionId >= 0) {
					return this.localize.BX_LIVECHAT_OPERATOR_POSITION_AND_SESSION_ID.replace("#POSITION#", operatorPosition).replace("#ID#", state.widget.dialog.sessionId);
				}
				return this.localize.BX_LIVECHAT_OPERATOR_POSITION_ONLY.replace("#POSITION#", operatorPosition);
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_LIVECHAT_', this);
			},
			ie11() {
				return main_core_minimal.Browser.isIE11();
			},
			...ui_vue_vuex.Vuex.mapState({
				widget: state => state.widget,
				application: state => state.application
			})
		},
		watch: {
			showName(value) {
				if (value) {
					setTimeout(() => {
						this.$root.$emit(im_const.EventType.dialog.scrollToBottom, {
							chatId: this.chatId
						});
					}, 300);
				}
			}
		},
		//language=Vue
		template: `
		<div class="bx-livechat-head-wrap">
			<template v-if="isWidgetDisabled">
				<div class="bx-livechat-head" :style="customBackgroundStyle">
					<div class="bx-livechat-title">{{chatTitle}}</div>
					<div class="bx-livechat-control-box">
						<button v-if="!widget.common.pageMode" class="bx-livechat-control-btn bx-livechat-control-btn-close" :title="localize.BX_LIVECHAT_CLOSE_BUTTON" @click="close"></button>
					</div>
				</div>	
			</template>
			<template v-else-if="application.error.active">
				<div class="bx-livechat-head" :style="customBackgroundStyle">
					<div class="bx-livechat-title">{{chatTitle}}</div>
					<div class="bx-livechat-control-box">
						<button v-if="!widget.common.pageMode" class="bx-livechat-control-btn bx-livechat-control-btn-close" :title="localize.BX_LIVECHAT_CLOSE_BUTTON" @click="close"></button>
					</div>
				</div>
			</template>
			<template v-else-if="!widget.common.configId">
				<div class="bx-livechat-head" :style="customBackgroundStyle">
					<div class="bx-livechat-title">{{chatTitle}}</div>
					<div class="bx-livechat-control-box">
						<button v-if="!widget.common.pageMode" class="bx-livechat-control-btn bx-livechat-control-btn-close" :title="localize.BX_LIVECHAT_CLOSE_BUTTON" @click="close"></button>
					</div>
				</div>
			</template>			
			<template v-else>
				<div class="bx-livechat-head" :style="customBackgroundStyle">
					<template v-if="!showName">
						<div class="bx-livechat-title">{{chatTitle}}</div>
					</template>
					<template v-else>
						<div class="bx-livechat-user bx-livechat-status-online">
							<template v-if="widget.dialog.operator.avatar">
								<div class="bx-livechat-user-icon" :style="'background-image: url('+encodeURI(widget.dialog.operator.avatar)+')'">
									<div v-if="widget.dialog.operator.online" class="bx-livechat-user-status" :style="customBackgroundOnlineStyle"></div>
								</div>
							</template>
							<template v-else>
								<div class="bx-livechat-user-icon">
									<div v-if="widget.dialog.operator.online" class="bx-livechat-user-status" :style="customBackgroundOnlineStyle"></div>
								</div>
							</template>
						</div>
						<div class="bx-livechat-user-info">
							<div class="bx-livechat-user-name">{{operatorName}}</div>
							<div class="bx-livechat-user-position">{{operatorDescription}}</div>							
						</div>
					</template>
					<div class="bx-livechat-control-box">
						<span class="bx-livechat-control-box-active" v-if="widget.common.dialogStart && widget.dialog.sessionId">
							<button v-if="widget.common.vote.enable && voteActive" :class="'bx-livechat-control-btn bx-livechat-control-btn-like bx-livechat-dialog-vote-'+(widget.dialog.userVote)" :title="localize.BX_LIVECHAT_VOTE_BUTTON" @click="like"></button>
							<button
								v-if="!ie11 && application.dialog.chatId > 0"
								class="bx-livechat-control-btn bx-livechat-control-btn-menu"
								@click="openMenu"
								:title="localize.BX_LIVECHAT_DOWNLOAD_HISTORY"
							></button>
							<button
								v-if="multiDialog && application.dialog.chatId > 0"
								class="bx-livechat-control-btn bx-livechat-control-btn-list"
								@click="openDialogList"
							></button>
						</span>	
						<button v-if="!widget.common.pageMode" class="bx-livechat-control-btn bx-livechat-control-btn-close" :title="localize.BX_LIVECHAT_CLOSE_BUTTON" @click="close"></button>
					</div>
				</div>
			</template>
		</div>
	`
	});

	/**
	 * Bitrix OpenLines widget
	 * Body loading component (Vue component)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-livechat-body-loading', {
		template: `
		<div class="bx-livechat-loading-window">
			<svg class="bx-livechat-loading-circular" viewBox="25 25 50 50">
				<circle class="bx-livechat-loading-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/>
				<circle class="bx-livechat-loading-inner-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/>
			</svg>
			<h3 class="bx-livechat-help-title bx-livechat-help-title-md bx-livechat-loading-msg">{{$Bitrix.Loc.getMessage('BX_LIVECHAT_LOADING')}}</h3>
		</div>
	`
	});

	/**
	 * Bitrix OpenLines widget
	 * Body operators component (Vue component)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-livechat-body-operators', {
		computed: {
			...ui_vue_vuex.Vuex.mapState({
				widget: state => state.widget
			})
		},
		template: `
		<div class="bx-livechat-help-container">
			<transition name="bx-livechat-animation-fade">
				<h2 v-if="widget.common.online" key="online" class="bx-livechat-help-title bx-livechat-help-title-lg">{{widget.common.textMessages.bxLivechatOnlineLine1}}<div class="bx-livechat-help-subtitle">{{widget.common.textMessages.bxLivechatOnlineLine2}}</div></h2>
				<h2 v-else key="offline" class="bx-livechat-help-title bx-livechat-help-title-sm">{{widget.common.textMessages.bxLivechatOffline}}</h2>
			</transition>	
			<div class="bx-livechat-help-user">
				<template v-for="operator in widget.common.operators">
					<div class="bx-livechat-user" :key="operator.id">
						<template v-if="operator.avatar">
							<div class="bx-livechat-user-icon" :style="'background-image: url('+encodeURI(operator.avatar)+')'"></div>
						</template>
						<template v-else>
							<div class="bx-livechat-user-icon"></div>
						</template>	
						<div class="bx-livechat-user-info">
							<div class="bx-livechat-user-name">{{operator.firstName? operator.firstName: operator.name}}</div>
						</div>
					</div>
				</template>	
			</div>
		</div>
	`
	});

	ui_vue.BitrixVue.component('bx-livechat-dialogues-list', {
		data() {
			return {
				newChatMode: false,
				sessionList: [],
				isLoading: false,
				pagesLoaded: 0,
				hasMoreItemsToLoad: true,
				itemsPerPage: 25
			};
		},
		computed: {
			...ui_vue_vuex.Vuex.mapState({
				dialogues: state => state.dialogues
			})
		},
		mounted() {
			this.requestDialogList();
		},
		methods: {
			requestDialogList(offset = 0) {
				this.isLoading = true;
				const requestParams = {
					'CONFIG_ID': this.$Bitrix.Application.get().getConfigId()
				};
				if (offset > 0) {
					requestParams['OFFSET'] = offset;
				}
				return this.$Bitrix.Application.get().controller.restClient.callMethod(RestMethod.widgetDialogList, requestParams).then(result => {
					if (result.data().length === 0 || result.data().length < this.itemsPerPage) {
						this.hasMoreItemsToLoad = false;
					}
					this.pagesLoaded++;
					this.isLoading = false;
					this.sessionList = [...this.sessionList, ...this.prepareSessionList(result.data())];
				}).catch(error => {
					console.warn('error', error);
				});
			},
			prepareSessionList(sessionList) {
				return Object.values(sessionList).map(dialog => {
					return {
						chatId: dialog.chatId,
						dialogId: dialog.dialogId,
						name: `Dialog #${dialog.sessionId}`
					};
				});
			},
			openSession(event) {
				main_core_events.EventEmitter.emit(WidgetEventType.openSession, event);
			},
			startNewChat(event) {
				this.newChatMode = true;
				this.$emit('startNewChat', event);
			},
			isOneScreenRemaining(event) {
				return event.target.scrollTop + event.target.clientHeight >= event.target.scrollHeight - event.target.clientHeight;
			},
			onScroll(event) {
				if (this.isOneScreenRemaining(event)) {
					if (this.isLoading || !this.hasMoreItemsToLoad) {
						return;
					}
					const offset = this.itemsPerPage * this.pagesLoaded;
					this.requestDialogList(offset);
				}
			}
		},
		// language=Vue
		template: `
	<div class="bx-livechat-help-container" style=" height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
		<div 
			style="margin-top: 25px;overflow-y: scroll;position:relative"
			:style="{marginBottom: newChatMode ? 0 : '10px'}"
			@scroll="onScroll"
		>
			<div
				v-for="session in sessionList"
				:key="session.chatId"
				class="bx-livechat-help-subtitle"
				@click="openSession({event: $event, session: session})"
				style="cursor: pointer; border: solid 1px black;border-radius: 10px;margin: 10px;padding: 5px;background-color: #0ae4ff">
				{{ session.name }}
			</div>
			<div v-if="isLoading" style="margin: 10px">Loading</div>
		</div>
		
		<div v-if="!newChatMode" style="margin-bottom: 10px;">
			<button 
				class="bx-livechat-btn" 
				style="background-color: rgb(23, 163, 234); border-radius: 5px;width: 150px;" 
				@click="startNewChat">
				Start new chat!
			</button>
		</div>
	</div>
	`
	});

	/**
	 * Bitrix OpenLines widget
	 * Body orientation disabled component (Vue component)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-livechat-body-orientation-disabled', {
		template: `
		<div class="bx-livechat-body" key="orientation-head">
			<div class="bx-livechat-mobile-orientation-box">
				<div class="bx-livechat-mobile-orientation-icon"></div>
				<div class="bx-livechat-mobile-orientation-text">{{$Bitrix.Loc.getMessage('BX_LIVECHAT_MOBILE_ROTATE')}}</div>
			</div>
		</div>
	`
	});

	/**
	 * Bitrix OpenLines widget
	 * Form consent component (Vue component)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-livechat-form-consent', {
		computed: {
			...ui_vue_vuex.Vuex.mapState({
				widget: state => state.widget
			})
		},
		methods: {
			agree() {
				main_core_events.EventEmitter.emit(WidgetEventType.acceptConsent);
			},
			disagree() {
				main_core_events.EventEmitter.emit(WidgetEventType.declineConsent);
			},
			onShow(element, done) {
				element.classList.add('bx-livechat-consent-window-show');
				done();
			},
			onHide(element, done) {
				element.classList.remove('bx-livechat-consent-window-show');
				element.classList.add('bx-livechat-consent-window-close');
				setTimeout(function () {
					done();
				}, 400);
			},
			onKeyDown(event) {
				if (event.keyCode == 9) {
					if (event.target === this.$refs.iframe) {
						if (event.shiftKey) {
							this.$refs.cancel.focus();
						} else {
							this.$refs.success.focus();
						}
					} else if (event.target === this.$refs.success) {
						if (event.shiftKey) {
							this.$refs.iframe.focus();
						} else {
							this.$refs.cancel.focus();
						}
					} else if (event.target === this.$refs.cancel) {
						if (event.shiftKey) {
							this.$refs.success.focus();
						} else {
							this.$refs.iframe.focus();
						}
					}
					event.preventDefault();
				} else if (event.keyCode == 39 || event.keyCode == 37) {
					if (event.target.nextElementSibling) {
						event.target.nextElementSibling.focus();
					} else if (event.target.previousElementSibling) {
						event.target.previousElementSibling.focus();
					}
					event.preventDefault();
				}
			}
		},
		directives: {
			focus: {
				inserted(element, params) {
					element.focus();
				}
			}
		},
		template: `
		<transition @enter="onShow" @leave="onHide">
			<template v-if="widget.common.showConsent && widget.common.consentUrl">
				<div class="bx-livechat-consent-window">
					<div class="bx-livechat-consent-window-title">{{$Bitrix.Loc.getMessage('BX_LIVECHAT_CONSENT_TITLE')}}</div>
					<div class="bx-livechat-consent-window-content">
						<iframe class="bx-livechat-consent-window-content-iframe" ref="iframe" frameborder="0" marginheight="0"  marginwidth="0" allowtransparency="allow-same-origin" seamless="true" :src="widget.common.consentUrl" @keydown="onKeyDown"></iframe>
					</div>								
					<div class="bx-livechat-consent-window-btn-box">
						<button class="bx-livechat-btn bx-livechat-btn-success" ref="success" @click="agree" @keydown="onKeyDown" v-focus>{{$Bitrix.Loc.getMessage('BX_LIVECHAT_CONSENT_AGREE')}}</button>
						<button class="bx-livechat-btn bx-livechat-btn-cancel" ref="cancel" @click="disagree" @keydown="onKeyDown">{{$Bitrix.Loc.getMessage('BX_LIVECHAT_CONSENT_DISAGREE')}}</button>
					</div>
				</div>
			</template>
		</transition>
	`
	});

	/**
	 * Bitrix OpenLines widget
	 * Form vote component (Vue component)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.BitrixVue.component('bx-livechat-form-vote', {
		computed: {
			VoteType: () => VoteType,
			...ui_vue_vuex.Vuex.mapState({
				widget: state => state.widget
			})
		},
		methods: {
			userVote(vote) {
				main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
				this.$store.commit('widget/dialog', {
					userVote: vote
				});
				main_core_events.EventEmitter.emit(WidgetEventType.sendDialogVote, {
					vote
				});
			},
			hideForm() {
				main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
			}
		},
		template: `
		<transition enter-active-class="bx-livechat-consent-window-show" leave-active-class="bx-livechat-form-close">
			<div class="bx-livechat-alert-box bx-livechat-form-rate-show" key="vote">
				<div class="bx-livechat-alert-close" :title="$Bitrix.Loc.getMessage('BX_LIVECHAT_VOTE_LATER')" @click="hideForm"></div>
				<div class="bx-livechat-alert-rate-box">
					<h4 class="bx-livechat-alert-title bx-livechat-alert-title-mdl">{{widget.common.vote.messageText}}</h4>
					<div class="bx-livechat-btn-box">
						<button class="bx-livechat-btn bx-livechat-btn-like" @click="userVote(VoteType.like)" :title="widget.common.vote.messageLike"></button>
						<button class="bx-livechat-btn bx-livechat-btn-dislike" @click="userVote(VoteType.dislike)" :title="widget.common.vote.messageDislike"></button>
					</div>
					<div class="bx-livechat-alert-later"><span class="bx-livechat-alert-later-btn" @click="hideForm">{{$Bitrix.Loc.getMessage('BX_LIVECHAT_VOTE_LATER')}}</span></div>
				</div>
			</div>
		</transition>	
	`
	});

	/**
	 * Bitrix OpenLines widget
	 * Smiles component (Vue component)
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	ui_vue.Vue.cloneComponent('bx-livechat-smiles', 'bx-smiles', {
		methods: {
			hideForm() {
				main_core_events.EventEmitter.emit(WidgetEventType.hideForm);
			}
		},
		template: `
		<transition enter-active-class="bx-livechat-consent-window-show" leave-active-class="bx-livechat-form-close">
			<div class="bx-livechat-alert-box bx-livechat-alert-box-zero-padding bx-livechat-form-show" key="vote">
				<div class="bx-livechat-alert-close" @click="hideForm"></div>
				<div class="bx-livechat-alert-smiles-box">
					#PARENT_TEMPLATE#
				</div>
			</div>
		</transition>
	`
	});

	/**
	 * Bitrix OpenLines widget
	 * Widget component & controller
	 *
	 * @package bitrix
	 * @subpackage imopenlines
	 * @copyright 2001-2019 Bitrix
	 */

	BX.LiveChatWidget = WidgetPublicManager;
	BX.LiveChatWidget.VoteType = VoteType;
	BX.LiveChatWidget.SubscriptionType = SubscriptionType;
	BX.LiveChatWidget.LocationStyle = LocationStyle;
	BX.LiveChatWidget.Cookie = im_lib_cookie.Cookie;
	window.dispatchEvent(new CustomEvent('onBitrixLiveChatSourceLoaded', {
		detail: {}
	}));

})(BX, window, window, BX.Messenger, window, BX, window, window, BX.Messenger.Lib, BX, BX.Messenger.Lib, BX, BX.Messenger.Provider.Rest, BX.Messenger.Lib, BX, BX.Main, BX, BX, BX.Ui.Vue.Components.Crm, BX.Messenger, BX.Messenger.Const, BX.Messenger.Lib, BX.Event, BX, BX.Messenger.EventHandler, BX.Messenger.Lib, BX);
//# sourceMappingURL=widget.bundle.js.map

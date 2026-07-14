/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, main_core_events, main_popup, pull_client, ui_buttons, disk_users, disk_sharingLegacyPopup, disk_externalLink, ui_iconSet_outline, disk_promoBoost, disk_onlyofficePromoActions, ui_dialogs_messagebox, main_core_cache) {
	'use strict';

	const ALLOWED_ATTEMPTS_TO_GET_USER_INFO = 3;
	const SECONDS_TO_ACTUALIZE_ONLINE = 25;
	class UserManager {
		userBoxNode = null;
		context = null;
		alreadySaidHi = false;
		constructor(options) {
			this.users = new BX.Disk.Users([]);
			this.badAttempts = new Map();
			this.context = options.context;
			this.userBoxNode = options.userBoxNode;
			this.alreadySaidHi = false;
			this.add(this.context.currentUser);
			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('onPullStatus', event => {
				if (event.getData()[0] === 'online') {
					this.handleWhenPullConnected();
				}
			});
		}
		handleWhenPullConnected() {
			if (!this.sentGreetings()) {
				this.sendHiToUsers();
				setInterval(this.actualizeOnline.bind(this), 1000 * SECONDS_TO_ACTUALIZE_ONLINE);
			}
		}
		actualizeOnline() {
			this.refineUsersByOnline();
			if (!this.sentGreetings()) {
				this.sendHiToUsers();
			} else {
				this.sendPingToUsers();
			}
		}
		sentGreetings() {
			return this.alreadySaidHi;
		}
		sendHiToUsers() {
			if (!pull_client.PULL.isConnected()) {
				return;
			}
			pull_client.PULL.sendMessageToChannels([this.context.object.publicChannel], 'disk', 'hiToDocument', {
				user: {
					id: this.context.currentUser.id,
					name: this.context.currentUser.name,
					avatar: this.#makeLinkAbsolute(this.context.currentUser.avatar)
				}
			});
			this.alreadySaidHi = true;
		}
		#makeLinkAbsolute(link) {
			if (link.includes('http://') || link.includes('https://')) {
				return link;
			}
			return document.location.origin + link;
		}
		sendWelcomeToUser() {
			if (!pull_client.PULL.isConnected()) {
				return;
			}
			pull_client.PULL.sendMessageToChannels([this.context.object.publicChannel], 'disk', 'welcomeToDocument', {
				user: {
					id: this.context.currentUser.id,
					name: this.context.currentUser.name,
					avatar: this.#makeLinkAbsolute(this.context.currentUser.avatar)
				}
			});
		}
		sendPingToUsers() {
			if (!pull_client.PULL.isConnected()) {
				return;
			}
			pull_client.PULL.sendMessageToChannels([this.context.object.publicChannel], 'disk', 'pingDocument', {
				fromUserId: this.context.currentUser.id,
				infoToken: this.context.currentUser.infoToken
			});
		}
		add(user) {
			if (!this.users.hasUser(user.id)) {
				this.users.addUser(user);
				console.log('Hi new user!', user.id);
			}
			this.updateOnline(user.id);
			this.renderBox();
		}
		updateOnline(userId) {
			if (this.users.hasUser(userId)) {
				this.users.getUser(userId).onlineAt = Date.now();
			}
		}
		getUserInfo(userId, infoToken) {
			if (this.badAttempts.get(userId) >= ALLOWED_ATTEMPTS_TO_GET_USER_INFO) {
				return new Promise((resolve, reject) => {
					reject({
						status: 'blocked'
					});
				});
			}
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction('bitrix:disk.file.editor-onlyoffice', 'getUserInfo', {
					mode: 'ajax',
					json: {
						documentSessionId: this.context.documentSession.id,
						documentSessionHash: this.context.documentSession.hash,
						userId: userId,
						infoToken: infoToken
					}
				}).then(response => {
					if (response.status === 'success') {
						this.badAttempts.delete(userId);
						resolve(response.data.user);
					}
				}, response => {
					const attempts = this.badAttempts.get(userId) || 0;
					this.badAttempts.set(userId, attempts + 1);
					console.log(this.badAttempts);
					reject(response);
				});
			});
		}
		has(userId) {
			return this.users.hasUser(userId);
		}
		remove(userId) {
			if (userId === this.context.currentUser.id) {
				return;
			}
			this.users.deleteUser(userId);
			this.renderBox();
		}
		refineUsersByOnline() {
			const secondsToOffline = 1000 * (SECONDS_TO_ACTUALIZE_ONLINE + 1) * 2;
			const now = Date.now();
			this.users.forEach(user => {
				if (now - user.onlineAt > secondsToOffline) {
					this.remove(user.id);
				}
			});
		}
		renderBox() {
			if (!this.userBoxNode.childElementCount) {
				this.userBoxNode.appendChild(this.users.getContainer());
			}
		}
	}

	class BaseCommandHandler {
		options = null;
		onlyOffice = null;
		userManager = null;
		constructor(commandOptions) {
			this.options = commandOptions;
			this.userManager = commandOptions.userManager;
			this.context = commandOptions.context;
			this.onlyOffice = commandOptions.onlyOffice;
		}
		getModuleId() {
			return 'disk';
		}
		getSubscriptionType() {
			return pull_client.PullClient.SubscriptionType.Server;
		}
		filterCurrentObject(handler) {
			return data => {
				if (this.context.object.id !== data.object.id) {
					return;
				}
				return handler(data);
			};
		}
		isCurrentUser(userId) {
			return this.context.currentUser.id === userId;
		}
	}

	class ClientCommandHandler extends BaseCommandHandler {
		getSubscriptionType() {
			return pull_client.PullClient.SubscriptionType.Client;
		}
		getMap() {
			return {
				exitDocument: this.handleExitDocument.bind(this),
				pingDocument: this.handlePingDocument.bind(this),
				hiToDocument: this.handleHiToDocument.bind(this),
				welcomeToDocument: this.handleWelcomeToDocument.bind(this)
			};
		}
		handleExitDocument(data) {
			console.log('exitDocument', data);
			const fromUserId = data.fromUserId;
			if (!this.isCurrentUser(fromUserId)) {
				this.userManager.remove(fromUserId);
			}
		}
		handleWelcomeToDocument(data) {
			console.log('handleWelcomeToDocument', data);
			this.processNewbieInDocument(data);
		}
		handleHiToDocument(data) {
			console.log('handleHiToDocument', data);
			const newbieAdded = this.processNewbieInDocument(data);
			if (newbieAdded) {
				//immediately send welcome to add actual online information for new user.
				this.userManager.sendWelcomeToUser();
			}
		}
		processNewbieInDocument(data) {
			const fromUserId = data.user.id;
			if (this.isCurrentUser(fromUserId)) {
				return false;
			}
			if (this.userManager.has(fromUserId)) {
				this.userManager.updateOnline(fromUserId);
				return false;
			}
			this.userManager.add(data.user);
			return true;
		}
		handlePingDocument(data) {
			console.log('handlePingDocument', data);
			const fromUserId = data.fromUserId;
			if (this.isCurrentUser(fromUserId)) {
				return;
			}
			if (this.userManager.has(fromUserId)) {
				this.userManager.updateOnline(fromUserId);
			} else {
				if (this.userManager.sentGreetings()) {
					this.userManager.getUserInfo(data.fromUserId, data.infoToken).then(userData => {
						this.userManager.add(userData);
					}, () => {});
				}
			}
		}
	}

	class ServerCommandHandler extends BaseCommandHandler {
		getMap() {
			return {
				onlyoffice: this.filterCurrentObject(this.handleSavedDocument.bind(this)),
				contentUpdated: this.filterCurrentObject(this.handleContentUpdated.bind(this))
			};
		}
		handleSavedDocument(data) {
			console.log('handleSavedDocument', data);
			if (data.documentSessionInfo.wasFinallySaved) {
				BX.UI.Notification.Center.notify({
					autoHide: false,
					content: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_SAVED_AFTER_IDLE')
				});
			}
		}
		handleContentUpdated(data) {
			console.log('handleContentUpdated', data);
			if (!data.object.updatedBy || this.isCurrentUser(data.object.updatedBy)) {
				return;
			}
			if (this.onlyOffice.wasDocumentChanged()) {
				this.userManager.getUserInfo(data.object.updatedBy, data.updatedBy.infoToken).then(userData => {
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_SAVED_WHILE_EDITING', {
							'#NAME#': main_core.Text.encode(data.object.name),
							'#USER_NAME#': main_core.Text.encode(userData.name)
						})
					});
				}, () => {});
			} else if (this.onlyOffice.isViewMode()) {
				this.userManager.getUserInfo(data.object.updatedBy, data.updatedBy.infoToken).then(userData => {
					let content = main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_VIEW_NON_ACTUAL_VERSION', {
						'#NAME#': main_core.Text.encode(data.object.name),
						'#USER_NAME#': main_core.Text.encode(userData.name)
					});
					content = main_core.Tag.render`<span>${content}</span>`;
					const refreshButton = content.querySelector('[data-refresh-btn]');
					if (refreshButton) {
						main_core.Tag.style(refreshButton)`
						cursor: pointer;
					`;
						refreshButton.addEventListener('click', this.#handleClickToRefreshEditor.bind(this));
					}
					BX.UI.Notification.Center.notify({
						content: content
					});
				}, () => {});
			}
		}
		#handleClickToRefreshEditor() {
			this.onlyOffice.reloadView();
		}
	}

	class CustomErrorControl {
		showWhenTooLarge(fileName, container, targetNode, linkToDownload, downloadSizeValue) {
			this.showCommonWarning({
				container: container,
				targetNode: targetNode,
				title: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_LARGE_FILE_TITLE'),
				description: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_LARGE_FILE_DESCR'),
				fileName: fileName,
				linkToDownload: linkToDownload,
				downloadSizeValue: downloadSizeValue
			});
		}
		showWhenNotFound(container, targetNode) {
			this.showCommonWarning({
				container: container,
				targetNode: targetNode,
				title: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_FILE_TITLE'),
				description: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_CUSTOM_ERROR_RIGHTS_OR_NOT_FOUND_DESCR')
			});
		}
		showCommonWarning(options) {
			const containerClass = 'disk-fe-office-warning--popup';
			let fileNameNode = '';
			if (options.fileName) {
				fileNameNode = main_core.Tag.render`<div class="disk-fe-office-warning-file-name">${main_core.Text.encode(options.fileName)}</div>`;
			}
			let downloadButtonNode = '';
			if (options.linkToDownload) {
				let downloadSize = '';
				if (options.downloadSizeValue) {
					downloadSize = options.downloadSizeValue;
				}
				const downloadButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_HEADER_BTN_DOWNLOAD'),
					round: true,
					noCaps: true,
					tag: ui_buttons.Button.Tag.LINK,
					link: options.linkToDownload,
					color: ui_buttons.AirButtonStyle.FILLED,
					className: '--air disk-fe-office-warning-btn',
					icon: ui_buttons.ButtonIcon.DOWNLOAD,
					iconPosition: 'left',
					size: ui_buttons.ButtonSize.LARGE,
					props: {
						target: '_blank'
					}
				});
				downloadButtonNode = downloadButton.render();
				downloadButton.setText(`${main_core.Loc.getMessage('DISK_FILE_EDITOR_ONLYOFFICE_HEADER_BTN_DOWNLOAD')} ${downloadSize}`);
			}
			const errorControl = main_core.Tag.render`
			<div class="disk-fe-office-warning-wrap">
				<div class="disk-fe-office-warning-overlay"></div>
				<div class="disk-fe-office-warning-box">
					<div class="disk-fe-office-warning-icon"></div>
					<div class="disk-fe-office-warning-title">${options.title}</div>				
					<div class="disk-fe-office-warning-desc">${options.description}</div>
					${fileNameNode}
					${downloadButtonNode}
				</div>
			</div>
		`;
			main_core.Dom.addClass(options.container, containerClass);
			main_core.Dom.prepend(errorControl, options.targetNode);
		}
	}

	const SECONDS_TO_MARK_AS_STILL_WORKING = 60;
	const cache = new main_core_cache.LocalStorageCache();
	class OnlyOffice {
		editor = null;
		editorJson = null;
		userBoxNode = null;
		editorNode = null;
		editorWrapperNode = null;
		targetNode = null;
		documentSession = null;
		linkToEdit = null;
		linkToView = null;
		linkToDownload = null;
		downloadSizeValue = null;
		pullConfig = null;
		pullUserConfig = null;
		editButton = null;
		setupSharingButton = null;
		documentWasChanged = false;
		dontEndCurrentDocumentSession = false;
		context = null;
		usersInDocument = null;
		sharingControlType = null;
		brokenDocumentOpened = false;
		sessionBoostOptions = null;
		unifiedLinkAccessOnly = false;
		promoShowImmediately = false;
		onlyOfficePromoActions = null;
		realtimeForceReloadTag = null;
		realtimeForceReloadCommand = null;
		autoForceReloadAfter = null;
		texts = null;
		userPullClient = null;
		constructor(editorOptions) {
			const options = main_core.Type.isPlainObject(editorOptions) ? editorOptions : {};
			this.pullConfig = options.pullConfig;
			this.pullUserConfig = options.pullUserConfig;
			this.documentSession = options.documentSession;
			this.linkToEdit = options.linkToEdit;
			this.linkToView = options.linkToView;
			this.linkToDownload = options.linkToDownload;
			this.downloadSizeValue = options.downloadSizeValue;
			this.targetNode = options.targetNode;
			this.userBoxNode = options.userBoxNode;
			this.editorNode = options.editorNode;
			this.editorWrapperNode = options.editorWrapperNode;
			this.editButton = ui_buttons.ButtonManager.createByUniqId(editorOptions.panelButtonUniqIds.edit);
			this.setupSharingButton = ui_buttons.ButtonManager.createByUniqId(editorOptions.panelButtonUniqIds.setupSharing);
			this.sharingControlType = editorOptions.sharingControlType;
			this.context = {
				currentUser: options.currentUser,
				documentSession: this.documentSession,
				object: options.object,
				attachedObject: options.attachedObject
			};
			this.context.object.publicChannel = options.publicChannel;
			this.usersInDocument = new UserManager({
				context: this.context,
				userBoxNode: this.userBoxNode
			});
			this.sessionBoostButton = disk_promoBoost.Factory.getSessionBoostButton(editorOptions.sessionBoostButtonContainerId);
			this.sessionBoostOptions = options.sessionBoostOptions;
			this.unifiedLinkAccessOnly = options.unifiedLinkAccessOnly;
			this.promoShowImmediately = options.promoShowImmediately;
			this.onlyOfficePromoActions = new disk_onlyofficePromoActions.OnlyOfficePromoActions();
			this.realtimeForceReloadTag = options.realtimeForceReloadTag;
			this.realtimeForceReloadCommand = options.realtimeForceReloadCommand;
			this.autoForceReloadAfter = options.autoForceReloadAfter || 300_000; // default is 5 minutes in ms
			this.texts = options.texts || {};
			this.initializeEditor(options.editorJson);
			const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (currentSlider) {
				currentSlider.getData().set('documentSession', this.documentSession);
			}
			this.loadDiskExtensionInTopWindow();
			this.initPull();
			this.bindEvents();
			if (this.isEditMode()) {
				this.registerTimerToTrackWork();
			}
			if (this.promoShowImmediately && this.onlyOfficePromoActions.shouldShow()) {
				this.onlyOfficePromoActions.show(this.editButton.getMainButton().button, true);
			}
			if (disk_promoBoost.Checker.isSessionBoostAvailable()) {
				this.sessionBoostButton.init();
				this.sessionBoostButton.setOverlayToWidget();
				if (this.isEditMode() && this.sessionBoostOptions?.shouldShowButtonWidgetInstantly) {
					this.showSessionBoostWidgetOnBoostButton();
					this.saveWidgetOnBoostButtonView();
				}
			}
		}
		registerTimerToTrackWork() {
			setInterval(this.#trackWork.bind(this), SECONDS_TO_MARK_AS_STILL_WORKING * 1000);
		}
		#trackWork() {
			main_core.ajax.runComponentAction('bitrix:disk.file.editor-onlyoffice', 'markAsStillWorkingSession', {
				mode: 'ajax',
				json: {
					documentSessionId: this.context.documentSession.id,
					documentSessionHash: this.context.documentSession.hash
				}
			}).then(responce => {});
		}
		initPull() {
			if (this.pullConfig) {
				BX.PULL = new pull_client.PullClient({
					skipStorageInit: true
				});
				BX.PULL.start(this.pullConfig);
			}
			if (this.pullUserConfig) {
				this.userPullClient = new pull_client.PullClient();
				this.userPullClient.start(this.pullUserConfig);
			}
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', this.handleSliderClose.bind(this));
			main_core_events.EventEmitter.subscribe(window, 'beforeunload', this.handleClose.bind(this));
			if (window.top !== window) {
				main_core_events.EventEmitter.subscribe(window, 'message', event => {
					if (event.data === 'closeIframe') {
						this.handleClose();
					}
				});
			}
			if (this.editorJson.document.permissions.edit === true && this.editButton) {
				if (Object.prototype.hasOwnProperty.call(this.editButton, 'mainButton')) {
					this.editButton.getMainButton().bindEvent('click', this.handleClickEditButton.bind(this));
					const menuWindow = this.editButton.getMenuWindow();
					const menuItems = main_core.Runtime.clone(menuWindow.getMenuItems());
					menuItems.forEach(menuItem => {
						const menuItemOptions = main_core.Runtime.clone(menuItem.options);
						menuItemOptions.onclick = this.handleClickEditSubItems.bind(this);
						menuWindow.removeMenuItem(menuItem.getId());
						menuWindow.addMenuItem(menuItemOptions);
					});
				} else {
					this.editButton.bindEvent('click', this.handleClickEditButton.bind(this));
				}
			}
			if (this.setupSharingButton) {
				main_core.Event.bind(this.setupSharingButton.getContainer(), 'click', this.handleClickSharingAccessPopup.bind(this));
			}
			pull_client.PULL.subscribe(new ClientCommandHandler({
				onlyOffice: this,
				context: this.context,
				userManager: this.usersInDocument
			}));
			pull_client.PULL.subscribe(new ServerCommandHandler({
				onlyOffice: this,
				context: this.context,
				userManager: this.usersInDocument
			}));
			if (this.userPullClient && this.realtimeForceReloadTag) {
				this.userPullClient.extendWatch(this.realtimeForceReloadTag);
				this.userPullClient.subscribe({
					type: BX.PullClient.SubscriptionType.Server,
					moduleId: 'disk',
					command: this.realtimeForceReloadCommand,
					callback: data => {
						const message = {
							regular: this.texts.forceReloadRegularServer,
							booster: this.texts.forceReloadBoosterServer
						}[data.newServersType] || this.texts.forceReloadUndefinedServer;
						const mb = new ui_dialogs_messagebox.MessageBox({
							message,
							modal: true,
							onOk: () => location.reload(),
							okCaption: this.texts.forceReloadPopupOkButton,
							buttons: ui_dialogs_messagebox.MessageBoxButtons.OK
						});
						mb.show();
						setTimeout(() => {
							location.reload();
						}, this.autoForceReloadAfter);
					}
				});
			}
		}
		initializeEditor(options) {
			if (!options) {
				return;
			}
			options.events = {
				...options.events,
				onDocumentStateChange: this.handleDocumentStateChange.bind(this),
				onDocumentReady: this.handleDocumentReady.bind(this),
				onMetaChange: this.handleMetaChange.bind(this),
				onInfo: this.handleInfo.bind(this),
				onWarning: this.handleWarning.bind(this),
				onError: this.handleError.bind(this),
				onRequestClose: this.handleRequestClose.bind(this)
			};
			if (options.document?.permissions?.rename) {
				options.events.onRequestRename = this.handleRequestRename.bind(this);
			}
			this.editorJson = options;
			this.editor = new DocsAPI.DocEditor(this.editorNode.id, options);
		}
		loadDiskExtensionInTopWindow() {
			if (window.top !== window && !BX.getClass('window.top.BX.Disk.endEditSession')) {
				top.BX.loadExt('disk');
			}
		}
		emitEventOnSaved() {
			const sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
			if (sliderByWindow) {
				BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onSaved', {
					documentSession: this.documentSession,
					object: this.context.object
				});
			}
			main_core_events.EventEmitter.emit('Disk.OnlyOffice:onSaved', {
				documentSession: this.documentSession,
				object: this.context.object
			});
		}
		emitEventOnClosed() {
			const sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
			let process = 'edit';
			if (sliderByWindow) {
				process = sliderByWindow.getData().get('process') || 'edit';
				BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onClosed', {
					documentSession: this.documentSession,
					object: this.context.object,
					process: process,
					documentWasChanged: this.documentWasChanged
				});
			}
			main_core_events.EventEmitter.emit('Disk.OnlyOffice:onClosed', {
				documentSession: this.documentSession,
				object: this.context.object,
				process: process,
				documentWasChanged: this.documentWasChanged
			});
		}
		handleClickEditButton() {
			if (this.onlyOfficePromoActions.shouldShow()) {
				this.onlyOfficePromoActions.show(this.editButton.getMainButton().button, true);
				BX.UI.Analytics.sendData({
					tool: 'docs',
					category: 'docs',
					event: 'oo_limit_edit',
					c_sub_section: 'old_element',
					c_element: 'view_mode',
					p3: this.context.object.docType,
					p4: `fileId_${this.context.object.id}`
				});
				return;
			}
			this.handleRequestEditRights();
		}
		showSessionBoostWidgetOnBoostButton() {
			this.sessionBoostButton.showWidget();
		}
		saveWidgetOnBoostButtonView() {
			if (this.sessionBoostOptions !== null) {
				const {
					category,
					name
				} = this.sessionBoostOptions.optionParamsToControlButtonWidgetDisplay;
				main_core.userOptions.save(category, name, null, Math.floor(Date.now() / 1000));
				main_core.userOptions.send(null);
			}
		}
		handleClickSharingAccessPopup() {
			const popupParams = {
				objectId: this.context.object.id,
				uniqueCode: this.context.object.uniqueCode ?? null
			};
			main_core.Runtime.loadExtension('disk.sharing-access-popup').then(({
				SharingPopupDialog
			}) => {
				const popup = new SharingPopupDialog();
				popup.open(popupParams);
			});
		}
		handleClickEditSubItems(event, menuItem) {
			const serviceCode = menuItem.getId();
			if (serviceCode === 'onlyoffice') {
				this.handleClickEditButton();
				return;
			}
			BX.Disk.Viewer.Actions.runActionEdit({
				name: this.context.object.name,
				objectId: this.context.object.id,
				attachedObjectId: this.context.attachedObject.id,
				serviceCode: serviceCode
			});
		}
		handleSaveButtonClick() {
			pull_client.PULL.subscribe({
				moduleId: 'disk',
				command: 'onlyoffice',
				callback: data => {
					if (data.hash === this.documentSession.hash) {
						this.emitEventOnSaved();
						window.BX.Disk.showModalWithStatusAction();
						BX.SidePanel.Instance.close();
					}
				}
			});
		}
		handleRequestClose() {
			const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (!currentSlider) {
				return;
			}
			currentSlider.getData().set('dontInvokeRequestClose', true);
			this.handleClose();
			currentSlider.close();
		}
		isDocumentReadyToEdit() {
			if (this.brokenDocumentOpened) {
				return false;
			}
			if (!this.caughtDocumentReady) {
				return false;
			}
			return true;
		}
		handleSliderClose(event) {
			const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (!currentSlider) {
				return;
			}
			const currentSliderData = currentSlider.getData();
			const uid = currentSliderData.get('uid');

			/** @type {BX.SidePanel.Event} */
			const [sliderEvent] = event.getData();
			if (sliderEvent.getSlider().getData().get('uid') !== uid) {
				return;
			}
			if (this.isViewMode() || !this.isDocumentReadyToEdit()) {
				this.handleClose();
				return;
			}
			if (this.editor.hasOwnProperty('requestClose')) {
				if (currentSliderData.get('dontInvokeRequestClose')) {
					return;
				}
				this.editor.requestClose();
				sliderEvent.denyAction();
			} else {
				this.handleClose();
			}
		}
		handleClose() {
			pull_client.PULL.sendMessageToChannels([this.context.object.publicChannel], 'disk', 'exitDocument', {
				fromUserId: this.context.currentUser.id
			});
			this.emitEventOnClosed();
			if (this.dontEndCurrentDocumentSession) {
				return;
			}
			top.BX.Disk.endEditSession({
				id: this.documentSession.id,
				hash: this.documentSession.hash,
				documentWasChanged: this.documentWasChanged
			});
		}
		handleDocumentStateChange(event) {
			if (!this.caughtDocumentReady || !this.caughtInfoEvent) {
				return;
			}
			if (Date.now() - Math.max(this.caughtDocumentReady, this.caughtInfoEvent) < 500) {
				return;
			}
			this.documentWasChanged = true;
		}
		wasDocumentChanged() {
			return this.documentWasChanged;
		}
		isEditMode() {
			return this.editorJson.editorConfig.mode === 'edit';
		}
		isViewMode() {
			return !this.isEditMode();
		}
		reloadView() {
			if (this.isViewMode()) {
				document.location = this.linkToView;
			}
		}
		handleInfo() {
			this.caughtInfoEvent = Date.now();
		}
		handleWarning(d) {
			console.log('onlyoffice warning:', d.data);
		}
		handleError(d) {
			console.log('onlyoffice error:', d.data);
			if (d.data.errorCode === -82) {
				this.brokenDocumentOpened = true;
				this.processBrokenDocument();
			} else if (d.data.errorCode === -84) {
				setTimeout(() => {
					new CustomErrorControl().showWhenTooLarge(this.context.object.name, this.getEditorWrapperNode(), this.getContainer(), this.linkToDownload, this.downloadSizeValue);
				}, 100);
			}
		}
		processBrokenDocument() {
			if (!this.context.documentSession.id || !this.brokenDocumentOpened) {
				return;
			}
			const key = `oo_broken_doc_${this.context.documentSession.id}`;
			const lastTime = cache.get(key);
			if (lastTime && Date.now() - lastTime < 1000 * 60) {
				return;
			}
			main_core.ajax.runAction('disk.api.onlyoffice.recoverSessionWithBrokenFile', {
				mode: 'ajax',
				json: {
					force: true,
					sessionId: this.documentSession.id,
					documentSessionHash: this.documentSession.hash
				}
			}).then(response => {
				if (response.status === 'success') {
					document.location.href = response.data.link;
				}
			});
			cache.set(key, Date.now());
		}
		handleRequestRename(event) {
			const newName = event.data;
			main_core.ajax.runAction('disk.api.onlyoffice.renameDocument', {
				mode: 'ajax',
				json: {
					documentSessionId: this.context.documentSession.id,
					documentSessionHash: this.context.documentSession.hash,
					newName: newName
				}
			});
		}
		handleMetaChange(event) {}
		handleDocumentReady() {
			this.caughtDocumentReady = Date.now();
		}
		handleRequestEditRights() {
			this.dontEndCurrentDocumentSession = true;
			let linkToEdit = BX.util.add_url_param('/bitrix/services/main/ajax.php', {
				action: 'disk.api.documentService.goToEdit',
				serviceCode: 'onlyoffice',
				documentSessionId: this.documentSession.id,
				documentSessionHash: this.documentSession.hash
			});
			if (this.linkToEdit) {
				linkToEdit = this.linkToEdit;
			}
			const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (!currentSlider) {
				window.location = linkToEdit;
				return;
			}
			let customLeftBoundary = currentSlider.getCustomLeftBoundary();
			currentSlider.close();
			BX.SidePanel.Instance.open(linkToEdit, {
				width: '100%',
				customLeftBoundary: customLeftBoundary,
				cacheable: false,
				allowChangeHistory: false,
				data: {
					documentEditor: true
				}
			});
		}
		getEditor() {
			return this.editor;
		}
		getEditorNode() {
			return this.editorNode;
		}
		getEditorWrapperNode() {
			return this.editorWrapperNode;
		}
		getContainer() {
			return this.targetNode;
		}
	}

	class Waiting {
		documentSession = null;
		object = null;
		unifiedLinkMode = false;
		constructor(waitingOptions) {
			const options = main_core.Type.isPlainObject(waitingOptions) ? waitingOptions : {};
			this.documentSession = options.documentSession;
			this.object = options.object;
			this.unifiedLinkMode = options.unifiedLinkMode;
			const loader = new BX.Loader({
				target: options.targetNode
			});
			loader.show();
			this.bindEvents();
			this.handleSavedDocument({});
		}
		bindEvents() {
			pull_client.PULL.subscribe({
				type: BX.PullClient.SubscriptionType.Server,
				moduleId: 'disk',
				command: 'onlyoffice',
				callback: this.handleSavedDocument.bind(this)
			});
		}
		handleSavedDocument(data) {
			console.log('handleSavedDocument', data);
			main_core.ajax.runAction('disk.api.onlyoffice.continueWithNewSession', {
				mode: 'ajax',
				json: {
					sessionId: this.documentSession.id,
					documentSessionHash: this.documentSession.hash
				}
			}).then(response => {
				if (response.status === 'success') {
					if (this.unifiedLinkMode) {
						window.location.reload();
					} else {
						document.location.href = response.data.documentSession.link;
					}
				}
			});
		}
	}

	exports.CustomErrorControl = CustomErrorControl;
	exports.OnlyOffice = OnlyOffice;
	exports.Waiting = Waiting;

})(this.BX.Disk.Editor = this.BX.Disk.Editor || {}, BX, BX.Event, BX.Main, BX, BX.UI, BX.Disk, BX.Disk.Sharing, BX.Disk, window, BX.Disk.PromoBoost, BX.Disk.OnlyOfficePromoActions, BX.UI.Dialogs, BX.Cache);
//# sourceMappingURL=script.js.map

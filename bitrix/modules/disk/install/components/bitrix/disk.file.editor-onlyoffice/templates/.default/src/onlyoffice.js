import { ajax as Ajax, Runtime, Type, userOptions } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { MenuItem } from 'main.popup';
import { PULL, PullClient } from 'pull.client';
import type { EditorOptions, DocumentSession, Context, SessionBoostOptions } from './types';
import { ButtonManager, Button, SplitButton } from 'ui.buttons';
import ClientCommandHandler from './client-command-handler';
import ServerCommandHandler from './server-command-handler';
import UserManager from './user-manager';
import { LegacyPopup, SharingControlType } from 'disk.sharing-legacy-popup';
import { ExternalLink, ExternalLinkForUnifiedLink } from 'disk.external-link';
import CustomErrorControl from './custom-error-controls';
import { Factory as PromoBoostFactory, Checker as PromoBoostChecker } from 'disk.promo-boost';
import { OnlyOfficePromoActions } from 'disk.onlyoffice-promo-actions';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

const SECONDS_TO_MARK_AS_STILL_WORKING = 60;

import { LocalStorageCache } from 'main.core.cache';
const cache = new LocalStorageCache();

export default class OnlyOffice
{
	editor: any = null;
	editorJson: any = null;
	userBoxNode: HTMLElement = null;
	editorNode: HTMLElement = null;
	editorWrapperNode: HTMLElement = null;
	targetNode: HTMLElement = null;
	documentSession: DocumentSession = null;
	linkToEdit: string = null;
	linkToView: string = null;
	linkToDownload: string = null;
	downloadSizeValue: string = null;
	pullConfig: any = null;
	pullUserConfig: any = null;
	editButton: SplitButton = null;
	setupSharingButton: Button = null;
	documentWasChanged: boolean = false;
	dontEndCurrentDocumentSession: boolean = false;
	context: Context = null;
	usersInDocument: UserManager = null;
	sharingControlType: ?SharingControlType = null;
	brokenDocumentOpened: boolean = false;
	sessionBoostOptions: ?SessionBoostOptions = null;
	unifiedLinkAccessOnly: boolean = false;
	promoShowImmediately: boolean = false;
	onlyOfficePromoActions: ?OnlyOfficePromoActions = null;
	realtimeForceReloadTag: ?string = null;
	realtimeForceReloadCommand: ?string = null;
	autoForceReloadAfter: int = null;
	texts: any = null;
	userPullClient: any = null;

	constructor(editorOptions: EditorOptions)
	{
		const options = Type.isPlainObject(editorOptions) ? editorOptions : {};

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
		this.editButton = ButtonManager.createByUniqId(editorOptions.panelButtonUniqIds.edit);
		this.setupSharingButton = ButtonManager.createByUniqId(editorOptions.panelButtonUniqIds.setupSharing);
		this.sharingControlType = editorOptions.sharingControlType;
		this.context = {
			currentUser: options.currentUser,
			documentSession: this.documentSession,
			object: options.object,
			attachedObject: options.attachedObject,
		};
		this.context.object.publicChannel = options.publicChannel;
		this.usersInDocument = new UserManager({
			context: this.context,
			userBoxNode: this.userBoxNode,
		});
		this.sessionBoostButton = PromoBoostFactory.getSessionBoostButton(editorOptions.sessionBoostButtonContainerId);
		this.sessionBoostOptions = options.sessionBoostOptions;
		this.unifiedLinkAccessOnly = options.unifiedLinkAccessOnly;
		this.promoShowImmediately = options.promoShowImmediately;
		this.onlyOfficePromoActions = new OnlyOfficePromoActions();
		this.realtimeForceReloadTag = options.realtimeForceReloadTag;
		this.realtimeForceReloadCommand = options.realtimeForceReloadCommand;
		this.autoForceReloadAfter = options.autoForceReloadAfter || 300_000; // default is 5 minutes in ms
		this.texts = options.texts || {};

		this.initializeEditor(options.editorJson);

		const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
		if (currentSlider)
		{
			currentSlider.getData().set('documentSession', this.documentSession);
		}

		this.loadDiskExtensionInTopWindow();

		this.initPull();
		this.bindEvents();
		if (this.isEditMode())
		{
			this.registerTimerToTrackWork();
		}

		if (this.promoShowImmediately && this.onlyOfficePromoActions.shouldShow())
		{
			this.onlyOfficePromoActions.show(this.editButton.getMainButton().button, true);
		}

		if (PromoBoostChecker.isSessionBoostAvailable())
		{
			this.sessionBoostButton.init();
			this.sessionBoostButton.setOverlayToWidget();

			if (this.isEditMode() && this.sessionBoostOptions?.shouldShowButtonWidgetInstantly)
			{
				this.showSessionBoostWidgetOnBoostButton();
				this.saveWidgetOnBoostButtonView();
			}
		}
	}

	registerTimerToTrackWork(): void
	{
		setInterval(this.#trackWork.bind(this), SECONDS_TO_MARK_AS_STILL_WORKING * 1000);
	}

	#trackWork(): void
	{
		Ajax.runComponentAction('bitrix:disk.file.editor-onlyoffice', 'markAsStillWorkingSession', {
			mode: 'ajax',
			json: {
				documentSessionId: this.context.documentSession.id,
				documentSessionHash: this.context.documentSession.hash,
			},
		}).then(responce => {});
	}

	initPull(): void
	{
		if (this.pullConfig)
		{
			BX.PULL = new PullClient({
				skipStorageInit: true,
			});
			BX.PULL.start(this.pullConfig);
		}

		if (this.pullUserConfig)
		{
			this.userPullClient = new PullClient();

			this.userPullClient.start(this.pullUserConfig);
		}
	}

	bindEvents(): void
	{
		EventEmitter.subscribe('SidePanel.Slider:onClose', this.handleSliderClose.bind(this));
		EventEmitter.subscribe(window, 'beforeunload', this.handleClose.bind(this));

		if (window.top !== window)
		{
			EventEmitter.subscribe(window, 'message', (event: MessageEvent) => {
				if (event.data === 'closeIframe')
				{
					this.handleClose();
				}
			});
		}

		if (this.editorJson.document.permissions.edit === true && this.editButton)
		{
			if (Object.prototype.hasOwnProperty.call(this.editButton, 'mainButton'))
			{
				this.editButton.getMainButton().bindEvent('click', this.handleClickEditButton.bind(this));

				const menuWindow = this.editButton.getMenuWindow();
				const menuItems = Runtime.clone(menuWindow.getMenuItems());

				menuItems.forEach((menuItem) => {
					const menuItemOptions = Runtime.clone(menuItem.options);
					menuItemOptions.onclick = this.handleClickEditSubItems.bind(this);

					menuWindow.removeMenuItem(menuItem.getId());
					menuWindow.addMenuItem(menuItemOptions);
				});
			}
			else
			{
				this.editButton.bindEvent('click', this.handleClickEditButton.bind(this));
			}
		}

		if (this.setupSharingButton)
		{
			const menuWindow = this.setupSharingButton.getMenuWindow();
			const extLinkOptions = menuWindow.getMenuItem('ext-link').options;
			extLinkOptions.onclick = this.handleClickSharingByExternalLink.bind(this);

			menuWindow.removeMenuItem('ext-link');
			menuWindow.addMenuItem(extLinkOptions);

			const sharingOptions = menuWindow.getMenuItem('sharing').options;
			sharingOptions.onclick = this.handleClickSharing.bind(this);

			menuWindow.removeMenuItem('sharing');
			menuWindow.addMenuItem(sharingOptions);
		}

		PULL.subscribe(new ClientCommandHandler({
			onlyOffice: this,
			context: this.context,
			userManager: this.usersInDocument,
		}));
		PULL.subscribe(new ServerCommandHandler({
			onlyOffice: this,
			context: this.context,
			userManager: this.usersInDocument,
		}));

		if (this.userPullClient && this.realtimeForceReloadTag)
		{
			this.userPullClient.extendWatch(this.realtimeForceReloadTag);

			this.userPullClient.subscribe({
				type: BX.PullClient.SubscriptionType.Server,
				moduleId: 'disk',
				command: this.realtimeForceReloadCommand,
				callback: data => {
					const message = {
						regular: this.texts.forceReloadRegularServer,
						booster: this.texts.forceReloadBoosterServer,
					}[data.newServersType] || this.texts.forceReloadUndefinedServer;

					const mb = new MessageBox({
						message,
						modal: true,
						onOk: () => location.reload(),
						okCaption: this.texts.forceReloadPopupOkButton,
						buttons: MessageBoxButtons.OK,
					});

					mb.show();

					setTimeout(() => {
						location.reload();
					}, this.autoForceReloadAfter);
				},
			});
		}
	}

	initializeEditor(options: any): void
	{
		if (!options)
		{
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
			onRequestClose: this.handleRequestClose.bind(this),
		};

		if (options.document?.permissions?.rename)
		{
			options.events.onRequestRename = this.handleRequestRename.bind(this);
		}

		this.editorJson = options;
		this.editor = new DocsAPI.DocEditor(this.editorNode.id, options);
	}

	loadDiskExtensionInTopWindow(): void
	{
		if (window.top !== window && !BX.getClass('window.top.BX.Disk.endEditSession'))
		{
			top.BX.loadExt('disk');
		}
	}

	emitEventOnSaved(): void
	{
		const sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
		if (sliderByWindow)
		{
			BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onSaved', {
				documentSession: this.documentSession,
				object: this.context.object,
			});
		}

		EventEmitter.emit('Disk.OnlyOffice:onSaved', {
			documentSession: this.documentSession,
			object: this.context.object,
		});
	}

	emitEventOnClosed(): void
	{
		const sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
		let process = 'edit';
		if (sliderByWindow)
		{
			process = sliderByWindow.getData().get('process') || 'edit';

			BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onClosed', {
				documentSession: this.documentSession,
				object: this.context.object,
				process: process,
			});
		}

		EventEmitter.emit('Disk.OnlyOffice:onClosed', {
			documentSession: this.documentSession,
			object: this.context.object,
			process: process,
		});
	}

	handleClickEditButton(): void
	{
		if (this.onlyOfficePromoActions.shouldShow())
		{
			this.onlyOfficePromoActions.show(this.editButton.getMainButton().button, true);

			BX.UI.Analytics.sendData({
				tool: 'docs',
				category: 'docs',
				event: 'oo_limit_edit',
				c_sub_section: 'old_element',
				c_element: 'view_mode',
				p3: this.context.object.docType,
			 	p4: `fileId_${this.context.object.id}`,
			});

			return;
		}

		this.handleRequestEditRights();
	}

	showSessionBoostWidgetOnBoostButton(): void
	{
		this.sessionBoostButton.showWidget();
	}

	saveWidgetOnBoostButtonView(): void
	{
		if (this.sessionBoostOptions !== null)
		{
			const { category, name } = this.sessionBoostOptions.optionParamsToControlButtonWidgetDisplay;
			userOptions.save(category, name, null, Math.floor(Date.now() / 1000));
			userOptions.send(null);
		}
	}

	handleClickSharing(): void
	{
		switch (this.sharingControlType)
		{
			case SharingControlType.WITH_CHANGE_RIGHTS:
				(new LegacyPopup()).showSharingDetailWithChangeRights({
					object: this.context.object,
				});
				break;
			case SharingControlType.WITH_SHARING:
				(new LegacyPopup()).showSharingDetailWithChangeRights({
					object: this.context.object,
				});
				break;
			case SharingControlType.WITHOUT_EDIT:
				(new LegacyPopup()).showSharingDetailWithoutEdit({
					object: this.context.object,
				});
				break;
			case SharingControlType.BLOCKED_BY_FEATURE:
				BX.UI.InfoHelper.show('limit_office_files_access_permissions');
				break;
			default:
				console.warn('Unknown sharingControlType', this.sharingControlType);
		}
	}

	handleClickSharingByExternalLink(event, menuItem: MenuItem): void
	{
		if (menuItem.dataset.shouldBlockExternalLinkFeature)
		{
			eval(menuItem.dataset.blockerExternalLinkFeature);

			return;
		}

		if (this.unifiedLinkAccessOnly)
		{
			ExternalLinkForUnifiedLink.showPopup(this.context.object.uniqueCode);
		}
		else
		{
			ExternalLink.showPopup(this.context.object.id);
		}
	}

	handleClickEditSubItems(event, menuItem: MenuItem): void
	{
		const serviceCode = menuItem.getId();

		if(serviceCode === 'onlyoffice')
		{
			this.handleClickEditButton();

			return;
		}

		BX.Disk.Viewer.Actions.runActionEdit({
			name: this.context.object.name,
			objectId: this.context.object.id,
			attachedObjectId: this.context.attachedObject.id,
			serviceCode: serviceCode,
		});
	}

	handleSaveButtonClick(): void
	{
		PULL.subscribe({
			moduleId: 'disk',
			command: 'onlyoffice',
			callback: (data) => {
				if (data.hash === this.documentSession.hash)
				{
					this.emitEventOnSaved();

					window.BX.Disk.showModalWithStatusAction();
					BX.SidePanel.Instance.close();
				}
			},
		});
	}

	handleRequestClose(): void
	{
		const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
		if (!currentSlider)
		{
			return;
		}

		currentSlider.getData().set('dontInvokeRequestClose', true);
		this.handleClose();
		currentSlider.close();
	}

	isDocumentReadyToEdit(): boolean
	{
		if (this.brokenDocumentOpened)
		{
			return false;
		}

		if (!this.caughtDocumentReady)
		{
			return false;
		}

		return true;
	}

	handleSliderClose(event: BaseEvent): void
	{
		const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
		if (!currentSlider)
		{
			return;
		}

		const currentSliderData = currentSlider.getData();
		const uid = currentSliderData.get('uid');

		/** @type {BX.SidePanel.Event} */
		const [sliderEvent] = event.getData();
		if (sliderEvent.getSlider().getData().get('uid') !== uid)
		{
			return;
		}

		if (this.isViewMode() || !this.isDocumentReadyToEdit())
		{
			this.handleClose();

			return;
		}

		if (this.editor.hasOwnProperty('requestClose'))
		{
			if (currentSliderData.get('dontInvokeRequestClose'))
			{
				return;
			}

			this.editor.requestClose();
			sliderEvent.denyAction();
		}
		else
		{
			this.handleClose();
		}
	}

	handleClose(): void
	{
		PULL.sendMessageToChannels([this.context.object.publicChannel], 'disk', 'exitDocument', {
			fromUserId: this.context.currentUser.id,
		});

		this.emitEventOnClosed();

		if (this.dontEndCurrentDocumentSession)
		{
			return;
		}

		top.BX.Disk.endEditSession({
			id: this.documentSession.id,
			hash: this.documentSession.hash,
			documentWasChanged: this.documentWasChanged,
		});
	}

	handleDocumentStateChange(event): void
	{
		if (!this.caughtDocumentReady || !this.caughtInfoEvent)
		{
			return;
		}

		if (Date.now() - Math.max(this.caughtDocumentReady, this.caughtInfoEvent) < 500)
		{
			return;
		}

		this.documentWasChanged = true;
	}

	wasDocumentChanged(): boolean
	{
		return this.documentWasChanged;
	}

	isEditMode(): boolean
	{
		return this.editorJson.editorConfig.mode === 'edit';
	}

	isViewMode(): boolean
	{
		return !this.isEditMode();
	}

	reloadView(): void
	{
		if (this.isViewMode())
		{
			document.location = this.linkToView;
		}
	}

	handleInfo(): void
	{
		this.caughtInfoEvent = Date.now();
	}

	handleWarning(d): void
	{
		console.log('onlyoffice warning:', d.data);
	}

	handleError(d): void
	{
		console.log('onlyoffice error:', d.data);

		if (d.data.errorCode === -82)
		{
			this.brokenDocumentOpened = true;
			this.processBrokenDocument();
		}
		else if (d.data.errorCode === -84)
		{
			setTimeout(() => {
				(new CustomErrorControl()).showWhenTooLarge(
					this.context.object.name,
					this.getEditorWrapperNode(),
					this.getContainer(),
					this.linkToDownload,
					this.downloadSizeValue,
				);
			}, 100);
		}
	}

	processBrokenDocument(): void
	{
		if (!this.context.documentSession.id || !this.brokenDocumentOpened)
		{
			return;
		}

		const key = `oo_broken_doc_${this.context.documentSession.id}`;
		const lastTime = cache.get(key);
		if (lastTime && Date.now() - lastTime < 1000 * 60)
		{
			return;
		}

		Ajax.runAction('disk.api.onlyoffice.recoverSessionWithBrokenFile', {
			mode: 'ajax',
			json: {
				force: true,
				sessionId: this.documentSession.id,
				documentSessionHash: this.documentSession.hash,
			},
		}).then((response) => {
			if (response.status === 'success')
			{
				document.location.href = response.data.link;
			}
		});

		cache.set(key, Date.now());
	}

	handleRequestRename(event): void
	{
		const newName = event.data;
		Ajax.runAction('disk.api.onlyoffice.renameDocument', {
			mode: 'ajax',
			json: {
				documentSessionId: this.context.documentSession.id,
				documentSessionHash: this.context.documentSession.hash,
				newName: newName,
			},
		});
	}

	handleMetaChange(event): void
	{}

	handleDocumentReady(): void
	{
		this.caughtDocumentReady = Date.now();
	}

	handleRequestEditRights(): void
	{
		this.dontEndCurrentDocumentSession = true;

		let linkToEdit = BX.util.add_url_param(
			'/bitrix/services/main/ajax.php',
			{
				action: 'disk.api.documentService.goToEdit',
				serviceCode: 'onlyoffice',
				documentSessionId: this.documentSession.id,
				documentSessionHash: this.documentSession.hash,
			},
		);

		if (this.linkToEdit)
		{
			linkToEdit = this.linkToEdit;
		}

		const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
		if (!currentSlider)
		{
			window.location = linkToEdit;

			return;
		}

		let customLeftBoundary = currentSlider.getCustomLeftBoundary();
		currentSlider.close();

		BX.SidePanel.Instance.open(
			linkToEdit, {
				width: '100%',
				customLeftBoundary: customLeftBoundary,
				cacheable: false,
				allowChangeHistory: false,
				data: {
					documentEditor: true,
				},
			});
	}

	getEditor()
	{
		return this.editor;
	}

	getEditorNode(): HTMLElement
	{
		return this.editorNode;
	}

	getEditorWrapperNode(): HTMLElement
	{
		return this.editorWrapperNode;
	}

	getContainer(): HTMLElement
	{
		return this.targetNode;
	}
}

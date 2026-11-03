import { ajax as Ajax, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { PULL, PullClient } from 'pull.client';
import type {
	EditorOptions,
	DocumentSession,
	Context,
	SessionBoostOptions,
	EditorWarningEvent,
} from './types';
import ServerCommandHandler from './server-command-handler';
import { ExternalLink, ExternalLinkForUnifiedLink } from 'disk.external-link';
import CustomErrorControl from './custom-error-controls';
import SaveAdapter from './save-adapter';
import SaveFailureWatch from './save-failure-watch';
import { BeforeStartEditEvent, DocumentHeader, PresenceChannel } from 'disk.document-header';
import type { PresenceConfig, SessionBoostContext } from 'disk.document-header';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

const SECONDS_TO_MARK_AS_STILL_WORKING = 60;

/** The component serving the presence requests of this shell. */
const COMPONENT_NAME = 'bitrix:disk.file.editor-onlyoffice';

/** The container of the boost button is rendered by the header itself, so its id belongs to the page. */
const BOOST_BUTTON_CONTAINER_ID = 'oo-editor-boost-button-container';

import { LocalStorageCache } from 'main.core.cache';
const cache = new LocalStorageCache();

export default class OnlyOffice
{
	editor: any = null;
	editorJson: any = null;
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
	documentWasChanged: boolean = false;
	dontEndCurrentDocumentSession: boolean = false;
	context: Context = null;
	brokenDocumentOpened: boolean = false;
	realtimeForceReloadTag: ?string = null;
	realtimeForceReloadCommand: ?string = null;
	autoForceReloadAfter: int = null;
	texts: any = null;
	userPullClient: any = null;
	saveAdapter: SaveAdapter = null;
	documentHeader: ?DocumentHeader = null;
	presenceConfig: ?PresenceConfig = null;
	presenceChannel: ?PresenceChannel = null;
	/** The interval of the signal of activity, kept so that a failure of saving can stop it. */
	trackWorkTimer: ?number = null;
	saveFailureWatch: ?SaveFailureWatch = null;
	#beforeStartEditHandler: ?Function = null;

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
		this.editorNode = options.editorNode;
		this.editorWrapperNode = options.editorWrapperNode;
		this.context = {
			currentUser: options.currentUser,
			documentSession: this.documentSession,
			object: options.object,
			attachedObject: options.attachedObject,
		};
		this.realtimeForceReloadTag = options.realtimeForceReloadTag;
		this.realtimeForceReloadCommand = options.realtimeForceReloadCommand;
		this.autoForceReloadAfter = options.autoForceReloadAfter || 300_000; // default is 5 minutes in ms
		this.texts = options.texts || {};
		this.presenceConfig = options.presenceConfig || null;
		this.saveAdapter = new SaveAdapter({
			showHint: (message: string, isFinal: boolean) => this.showSaveHint(message, isFinal),
		});

		this.mountDocumentHeader(options);
		this.initializeEditor(options.editorJson);

		const currentSlider = BX.SidePanel.Instance.getSliderByWindow(window);
		if (currentSlider)
		{
			currentSlider.getData().set('documentSession', this.documentSession);
		}

		this.loadDiskExtensionInTopWindow();

		this.initPull();
		this.bindEvents();
		this.watchSaveFailures();
		if (this.isEditMode())
		{
			this.registerTimerToTrackWork();
		}
	}

	/**
	 * The header of the opened document. It draws itself from the composition the server describes and
	 * asks the editor about saving through the adapter; the page has nothing to do after the mount.
	 * Until the shell of the page renders the container, the page simply works without a header.
	 */
	mountDocumentHeader(options: EditorOptions): void
	{
		if (!Type.isElementNode(options.headerContainerNode))
		{
			return;
		}

		this.documentHeader = new DocumentHeader(options.headerContainerNode, {
			documentSessionHash: this.documentSession.hash,
			adapter: this.getSaveAdapter(),
			boostContainerId: BOOST_BUTTON_CONTAINER_ID,
			logoUrl: Type.isString(options.logoUrl) ? options.logoUrl : '',
			editUrl: Type.isString(this.linkToEdit) ? this.linkToEdit : '',
			sessionBoost: mapSessionBoost(options.sessionBoostOptions),
			shouldShowPromoImmediately: options.promoShowImmediately === true,
			composition: options.headerComposition ?? null,
		});

		this.#beforeStartEditHandler = this.handleBeforeStartEdit.bind(this);
		EventEmitter.subscribe(BeforeStartEditEvent, this.#beforeStartEditHandler);
	}

	registerTimerToTrackWork(): void
	{
		if (this.trackWorkTimer)
		{
			return;
		}

		this.trackWorkTimer = setInterval(() => this.#trackWork(), SECONDS_TO_MARK_AS_STILL_WORKING * 1000);
	}

	stopTimerToTrackWork(): void
	{
		if (!this.trackWorkTimer)
		{
			return;
		}

		clearInterval(this.trackWorkTimer);
		this.trackWorkTimer = null;
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

		PULL.subscribe(new ServerCommandHandler({
			onlyOffice: this,
			context: this.context,
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
				documentWasChanged: this.documentWasChanged,
			});
		}

		EventEmitter.emit('Disk.OnlyOffice:onClosed', {
			documentSession: this.documentSession,
			object: this.context.object,
			process: process,
			documentWasChanged: this.documentWasChanged,
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
		this.presenceChannel?.stop();
		this.presenceChannel = null;

		this.documentHeader?.unmount();
		this.documentHeader = null;

		if (this.#beforeStartEditHandler)
		{
			EventEmitter.unsubscribe(BeforeStartEditEvent, this.#beforeStartEditHandler);
			this.#beforeStartEditHandler = null;
		}

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
		this.saveAdapter.handleDocumentStateChange(event);
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

	/** The editor reports a refused save (-331) and its own breakdown (-25) as warnings, never as errors. */
	handleWarning(d: EditorWarningEvent): void
	{
		console.log('onlyoffice warning:', d.data);

		this.saveAdapter.handleEditorWarning(d.data);
	}

	handleError(d): void
	{
		console.log('onlyoffice error:', d.data);

		this.saveAdapter.handleEditorError(d.data);

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

	/**
	 * What to do about a failure of saving: the indicator of the header keeps the state of the document
	 * in one short line, and the longer instruction beside it is told by a notification. The one about
	 * a breakdown of the editor waits for the user - nothing else will change after it.
	 */
	showSaveHint(message: string, isFinal: boolean): void
	{
		if (!Type.isStringFilled(message))
		{
			return;
		}

		BX.UI.Notification.Center.notify({
			content: message,
			autoHide: !isFinal,
		});
	}

	/** The signal of activity belongs to a page which still saves, so a failure of saving stops it. */
	watchSaveFailures(): void
	{
		this.saveFailureWatch = new SaveFailureWatch({
			adapter: this.saveAdapter,
			sessionId: this.context.documentSession.id,
			documentSessionHash: this.context.documentSession.hash,
			onFailure: () => this.stopTimerToTrackWork(),
			onRecovered: () => {
				if (this.isEditMode())
				{
					this.registerTimerToTrackWork();
				}
			},
		});
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
		this.startPresence();
	}

	/**
	 * The live roster of the header. It is opened after the document is ready, so the starting roster of
	 * the header is already answered by then and a live event never overtakes it. An opening the server
	 * gave no presence configuration to - a public external link among them - simply keeps no channel.
	 * The roster comes to the private channel of the user, which this page already listens to, so the
	 * header is given that client instead of opening a second connection to the same channel.
	 */
	startPresence(): void
	{
		if (this.presenceChannel !== null || this.presenceConfig?.enabled !== true)
		{
			return;
		}

		this.presenceChannel = new PresenceChannel(COMPONENT_NAME, this.userPullClient);
		void this.presenceChannel.start(this.presenceConfig);
	}

	/**
	 * The header opens the editing of the same object, and the session of the current view continues
	 * there: leaving the page for the editor must not close it.
	 */
	handleBeforeStartEdit(): void
	{
		this.dontEndCurrentDocumentSession = true;
	}

	getEditor()
	{
		return this.editor;
	}

	getSaveAdapter(): SaveAdapter
	{
		return this.saveAdapter;
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

/**
 * The scenario of the automatic show of the widget of the boosts, as the header expects it. The server
 * assigns it only to an editing session which may still see the widget; anything else means no scenario.
 */
function mapSessionBoost(options: ?SessionBoostOptions): ?SessionBoostContext
{
	const viewOption = options?.optionParamsToControlButtonWidgetDisplay;
	if (!Type.isPlainObject(viewOption))
	{
		return null;
	}

	return {
		shouldShowWidgetInstantly: options.shouldShowButtonWidgetInstantly === true,
		widgetViewOption: {
			category: viewOption.category,
			name: viewOption.name,
		},
	};
}

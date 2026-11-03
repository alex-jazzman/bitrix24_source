/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_vue3, ui_vue3_pinia, ui_analytics, ui_system_typography_vue, ui_iconSet_api_core, ui_iconSet_outline, ui_vue3_components_button, ui_a11y, ui_buttons, ui_iconSet_main, ui_notification, ui_notificationPanel, main_loader, ui_iconSet_api_vue, ui_vue3_directives_hint, main_core_events) {
	'use strict';

	const HeaderElement = Object.freeze({
		Logo: 'logo',
		Name: 'name',
		ContentWarning: 'contentWarning',
		Rename: 'rename',
		SaveStatus: 'saveStatus',
		Boost: 'boost',
		Edit: 'edit',
		Presence: 'presence',
		Access: 'access',
		CopyLink: 'copyLink',
		Download: 'download',
		Presentation: 'presentation'
	});

	const SaveStatusInjectionKey = 'diskDocumentHeaderSaveStatus';
	const EditorAdapterInjectionKey = 'diskDocumentHeaderEditorAdapter';
	const EditUrlInjectionKey = 'diskDocumentHeaderEditUrl';
	const ShowPromoImmediatelyInjectionKey = 'diskDocumentHeaderShowPromoImmediately';
	const NameAsPageHeadingInjectionKey = 'diskDocumentHeaderNameAsPageHeading';
	const PresentationAdapterInjectionKey = 'diskDocumentHeaderPresentationAdapter';

	const HeaderErrorCode = Object.freeze({
		NoDocumentSession: 'NO_DOCUMENT_SESSION'
	});

	const objectTypes = ['document', 'board'];
	const modes = ['view', 'edit'];
	const headerElements = Object.values(HeaderElement);
	function mapCompositionDtoToModel(response) {
		if (!main_core.Type.isPlainObject(response)) {
			return null;
		}
		const dto = response;
		const objectType = matchValue(objectTypes, dto.objectType);
		const mode = matchValue(modes, dto.mode);
		if (objectType === null || mode === null || !main_core.Type.isArray(dto.elements) || !main_core.Type.isPlainObject(dto.object)) {
			return null;
		}
		const object = asRecord(dto.object);
		const urls = asRecord(dto.urls);
		const access = asRecord(dto.access);
		return {
			elements: dto.elements.filter(isHeaderElement),
			objectType,
			mode,
			object: {
				id: main_core.Text.toInteger(object.id),
				name: readString(object, 'name'),
				uniqueCode: readString(object, 'uniqueCode'),
				extension: readString(object, 'extension')
			},
			urls: {
				unifiedLink: readString(urls, 'unifiedLink'),
				download: readString(urls, 'download')
			},
			access: {
				controlType: readString(access, 'controlType')
			},
			editors: mapEditors(dto.editors)
		};
	}
	function mapPresenceDtoToModel(response) {
		if (!main_core.Type.isPlainObject(response)) {
			return null;
		}
		const dto = asRecord(response);
		if (!main_core.Type.isArray(dto.participants)) {
			return null;
		}
		return {
			revision: main_core.Text.toInteger(dto.revision),
			participants: dto.participants.filter(item => main_core.Type.isPlainObject(item)).map(item => mapParticipant(asRecord(item))).filter(participant => participant.name !== '')
		};
	}
	function mapRenameDto(response) {
		if (!main_core.Type.isPlainObject(response)) {
			return null;
		}
		const dto = asRecord(response);
		const name = readString(dto, 'name');
		return name === '' ? null : {
			name,
			editorSynchronized: dto.editorSynchronized === true
		};
	}
	function mapParticipant(participant) {
		return {
			id: main_core.Text.toInteger(participant.id),
			name: readString(participant, 'name'),
			avatar: readString(participant, 'avatar'),
			isGuest: participant.isGuest === true
		};
	}
	function mapEditors(value) {
		if (!main_core.Type.isArray(value)) {
			return [];
		}
		return value.filter(item => main_core.Type.isPlainObject(item)).map(item => {
			const editor = asRecord(item);
			return {
				code: readString(editor, 'code'),
				name: readString(editor, 'name'),
				isDefault: editor.isDefault === true
			};
		});
	}
	function isHeaderElement(value) {
		return headerElements.includes(value);
	}
	function matchValue(allowed, value) {
		return allowed.find(item => item === value) ?? null;
	}
	function asRecord(value) {
		return main_core.Type.isPlainObject(value) ? value : {};
	}
	function readString(source, key) {
		const value = source[key];
		return main_core.Type.isString(value) ? value : '';
	}

	const HeaderServiceErrorCode = Object.freeze({
		Unexpected: 'UNEXPECTED',
		InvalidResponse: 'INVALID_RESPONSE'
	});
	class DocumentHeaderService {
		#actionPrefix = 'disk.api.documentHeader';
		async getComposition(documentSessionHash) {
			const request = {
				documentSessionHash
			};
			const response = await this.#runAction('getComposition', request);
			if (!response.success) {
				return response;
			}
			const composition = mapCompositionDtoToModel(response.data);
			return composition === null ? refuseInvalidResponse() : {
				success: true,
				data: composition
			};
		}
		async getPresence(documentSessionHash) {
			const request = {
				documentSessionHash
			};
			const response = await this.#runAction('getPresence', request);
			if (!response.success) {
				return response;
			}
			const roster = mapPresenceDtoToModel(response.data);
			return roster === null ? refuseInvalidResponse() : {
				success: true,
				data: roster
			};
		}
		async rename(documentSessionHash, newName) {
			const request = {
				documentSessionHash,
				newName
			};
			const response = await this.#runAction('rename', request);
			if (!response.success) {
				return response;
			}
			const renamed = mapRenameDto(response.data);
			return renamed === null ? refuseInvalidResponse() : {
				success: true,
				data: renamed
			};
		}
		async #runAction(action, data) {
			try {
				const response = await main_core.ajax.runAction(`${this.#actionPrefix}.${action}`, {
					data
				});
				return {
					success: true,
					data: response.data
				};
			} catch (rejection) {
				return {
					success: false,
					error: extractError(rejection)
				};
			}
		}
	}
	function refuseInvalidResponse() {
		return {
			success: false,
			error: {
				code: HeaderServiceErrorCode.InvalidResponse,
				message: ''
			}
		};
	}
	function extractError(rejection) {
		const errors = main_core.Type.isPlainObject(rejection) ? rejection.errors : null;
		if (!main_core.Type.isArrayFilled(errors)) {
			return {
				code: HeaderServiceErrorCode.Unexpected,
				message: ''
			};
		}
		const [error] = errors;
		return {
			code: main_core.Type.isNil(error.code) || error.code === '' ? HeaderServiceErrorCode.Unexpected : String(error.code),
			message: main_core.Type.isString(error.message) ? error.message : ''
		};
	}
	const documentHeaderService = new DocumentHeaderService();

	const useCompositionStore = ui_vue3_pinia.defineStore('diskDocumentHeaderComposition', {
		state: () => ({
			composition: null
		}),
		getters: {
			hasElement: state => element => {
				return state.composition?.elements.includes(element) ?? false;
			}
		},
		actions: {
			setComposition(composition) {
				this.composition = composition;
			},
			setObjectName(name) {
				if (this.composition !== null) {
					this.composition.object.name = name;
				}
			}
		}
	});

	const SessionBoundElements = new Set([HeaderElement.Rename, HeaderElement.Presence]);
	const NoSessionError$1 = {
		code: HeaderErrorCode.NoDocumentSession,
		message: ''
	};
	async function loadComposition(documentSessionHash) {
		if (!main_core.Type.isStringFilled(documentSessionHash)) {
			return {
				success: false,
				error: NoSessionError$1
			};
		}
		const result = await documentHeaderService.getComposition(documentSessionHash);
		if (!result.success) {
			return {
				success: false,
				error: result.error
			};
		}
		useCompositionStore().setComposition(result.data);
		return {
			success: true
		};
	}
	function applyComposition(response) {
		const composition = mapCompositionDtoToModel(response);
		if (composition === null) {
			return false;
		}
		useCompositionStore().setComposition(composition);
		return true;
	}
	function requiresDocumentSession(response) {
		const composition = mapCompositionDtoToModel(response);
		return composition === null || composition.elements.some(element => SessionBoundElements.has(element));
	}

	function toEditableName(storedName, extension) {
		const suffix = `.${extension}`;
		return extension !== '' && storedName.endsWith(suffix) ? storedName.slice(0, -suffix.length) : storedName;
	}
	function toStoredName(editedName, extension) {
		return editedName === '' || extension === '' ? editedName : `${editedName}.${extension}`;
	}

	const InvalidNameErrorCode = 'INVALID_NAME';
	const RenameRefusal = Object.freeze({
		InvalidName: 'invalidName',
		Refused: 'refused'
	});
	async function renameObject(documentSessionHash, newName) {
		if (!main_core.Type.isStringFilled(documentSessionHash)) {
			return {
				success: false,
				refusal: RenameRefusal.Refused,
				message: ''
			};
		}
		const store = useCompositionStore();
		const previousName = store.composition?.object.name ?? '';
		const extension = store.composition?.object.extension ?? '';
		const name = newName.trim();
		if (!main_core.Type.isStringFilled(name)) {
			return {
				success: false,
				refusal: RenameRefusal.InvalidName,
				message: main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_EMPTY_NAME_ERROR') ?? ''
			};
		}
		if (name === toEditableName(previousName, extension)) {
			return {
				success: true,
				name: previousName,
				editorSynchronized: true
			};
		}
		store.setObjectName(toStoredName(name, extension));
		const result = await documentHeaderService.rename(documentSessionHash, name);
		if (!result.success) {
			store.setObjectName(previousName);
			return refuse(result.error);
		}
		store.setObjectName(result.data.name);
		return {
			success: true,
			name: result.data.name,
			editorSynchronized: result.data.editorSynchronized
		};
	}
	function refuse(error) {
		return {
			success: false,
			refusal: error.code === InvalidNameErrorCode ? RenameRefusal.InvalidName : RenameRefusal.Refused,
			message: main_core.Type.isStringFilled(error.message) ? error.message : main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_ERROR') ?? ''
		};
	}

	async function showBoost(request) {
		const button = await loadButton(request.containerId);
		if (button === null || request.isCancelled()) {
			return;
		}
		button.init();
		button.setOverlayToWidget();
		const boost = request.sessionBoost;
		if (boost === null || !boost.shouldShowWidgetInstantly) {
			return;
		}
		button.showWidget();
		markWidgetShown(boost.widgetViewOption);
	}
	async function loadButton(containerId) {
		try {
			const extension = await main_core.Runtime.loadExtension('disk.promo-boost');
			return extension.Factory.getSessionBoostButton(containerId);
		} catch {
			return null;
		}
	}
	function markWidgetShown(option) {
		const {
			userOptions
		} = BX;
		userOptions.save(option.category, option.name, null, Math.floor(Date.now() / 1000));
		userOptions.send(null);
	}

	const PresencePullContract = Object.freeze({
		moduleId: 'disk',
		command: 'documentPresence'
	});
	const PresenceActionContract = Object.freeze({
		enter: 'presenceEnter',
		heartbeat: 'presenceHeartbeat',
		leave: 'presenceLeave'
	});

	const usePresenceStore = ui_vue3_pinia.defineStore('diskDocumentHeaderPresence', {
		state: () => ({
			participants: [],
			revision: 0,
			isAvailable: false,
			scope: ''
		}),
		getters: {
			guest: state => {
				return state.participants.find(participant => participant.isGuest) ?? null;
			}
		},
		actions: {
			setParticipants(participants) {
				this.participants = participants;
			},
			setRevision(revision) {
				this.revision = revision;
			},
			setAvailable(isAvailable) {
				this.isAvailable = isAvailable;
			},
			setScope(scope) {
				this.scope = scope;
			}
		}
	});

	const NoSessionError = {
		code: HeaderErrorCode.NoDocumentSession,
		message: ''
	};
	async function loadInitialPresence(documentSessionHash) {
		if (!main_core.Type.isStringFilled(documentSessionHash)) {
			return {
				success: false,
				error: NoSessionError
			};
		}
		const store = usePresenceStore();
		const result = await documentHeaderService.getPresence(documentSessionHash);
		if (!result.success) {
			store.setAvailable(false);
			return {
				success: false,
				error: result.error
			};
		}
		if (result.data.revision >= store.revision) {
			store.setParticipants(result.data.participants);
			store.setRevision(result.data.revision);
		}
		store.setAvailable(true);
		return {
			success: true
		};
	}
	function applyPresenceConfig(config) {
		const store = usePresenceStore();
		const isUsable = main_core.Type.isPlainObject(config) && config.enabled === true && config.moduleId === PresencePullContract.moduleId && config.command === PresencePullContract.command && main_core.Type.isStringFilled(config.scope);
		store.setScope(isUsable ? config.scope : '');
		return isUsable;
	}
	function syncPresenceFromPull(payload) {
		const roster = readRosterEvent(payload);
		if (roster === null) {
			return;
		}
		const store = usePresenceStore();
		if (store.scope === '' || roster.scope !== store.scope || roster.revision <= store.revision) {
			return;
		}
		const guest = store.guest;
		const named = roster.participants.filter(participant => participant.id > 0);
		store.setParticipants(guest === null ? named : [guest, ...named]);
		store.setRevision(roster.revision);
	}
	function readRosterEvent(payload) {
		if (!main_core.Type.isPlainObject(payload)) {
			return null;
		}
		const event = payload;
		if (!main_core.Type.isStringFilled(event.scope) || !isRevision(event.revision) || !main_core.Type.isArray(event.participants)) {
			return null;
		}
		const participants = [];
		for (const item of event.participants) {
			const participant = readParticipant(item);
			if (participant === null) {
				return null;
			}
			participants.push(participant);
		}
		return {
			scope: event.scope,
			revision: event.revision,
			participants
		};
	}
	function readParticipant(item) {
		if (!main_core.Type.isPlainObject(item)) {
			return null;
		}
		const participant = item;
		if (!main_core.Type.isNumber(participant.id) || !main_core.Type.isStringFilled(participant.name)) {
			return null;
		}
		const avatar = participant.avatar;
		if (!main_core.Type.isString(avatar) && !main_core.Type.isNil(avatar)) {
			return null;
		}
		return {
			id: participant.id,
			name: participant.name,
			avatar: main_core.Type.isString(avatar) ? avatar : '',
			isGuest: false
		};
	}
	function isRevision(value) {
		return main_core.Type.isNumber(value) && Number.isFinite(value) && value >= 0;
	}

	function reportTimeToActions(objectType) {
		const elapsed = Math.round(performance.now());
		ui_analytics.sendData({
			tool: 'docs',
			category: 'docs',
			event: 'header_time_to_actions',
			type: `objectType_${objectType}`,
			p1: `ms_${elapsed}`
		});
		return elapsed;
	}

	const HeaderTestId = Object.freeze({
		Root: 'disk-document-header',
		Logo: 'disk-document-header-logo',
		Name: 'disk-document-header-name',
		NameField: 'disk-document-header-name-field',
		NameSubmit: 'disk-document-header-name-submit',
		ContentWarning: 'disk-document-header-content-warning',
		SaveStatus: 'disk-document-header-save-status',
		SaveStatusRetry: 'disk-document-header-save-status-retry',
		Boost: 'disk-document-header-boost',
		Edit: 'disk-document-header-edit',
		EditMenu: 'disk-document-header-edit-menu',
		Presence: 'disk-document-header-presence',
		PresenceTrigger: 'disk-document-header-presence-trigger',
		PresenceAvatar: 'disk-document-header-presence-avatar',
		PresenceList: 'disk-document-header-presence-list',
		PresenceItem: 'disk-document-header-presence-item',
		Access: 'disk-document-header-access',
		CopyLink: 'disk-document-header-copy-link',
		Download: 'disk-document-header-download',
		Presentation: 'disk-document-header-presentation'
	});

	const HeaderWidthLevel = Object.freeze({
		Full: 'full',
		IconsOnly: 'iconsOnly',
		Essential: 'essential'
	});
	const CaptionsFitWidth = 960;
	const IconWordsFitWidth = 640;
	function resolveAdaptation(containerWidth) {
		const width = main_core.Type.isNumber(containerWidth) && containerWidth > 0
		? containerWidth : Number.POSITIVE_INFINITY;
		const showButtonCaptions = width > CaptionsFitWidth;
		const showIconWords = width > IconWordsFitWidth;
		return {
			level: resolveLevel(showButtonCaptions, showIconWords),
			showButtonCaptions,
			showEditCaption: showIconWords,
			showLogoName: showIconWords
		};
	}
	function observeContainerWidth(container, listener) {
		let currentLevel = null;
		const publish = width => {
			const adaptation = resolveAdaptation(width);
			if (adaptation.level === currentLevel) {
				return;
			}
			currentLevel = adaptation.level;
			listener(adaptation);
		};
		const observer = new ResizeObserver(entries => {
			entries.forEach(entry => publish(entry.contentRect.width));
		});
		observer.observe(container);
		publish(container.getBoundingClientRect().width);
		return () => observer.disconnect();
	}
	function resolveLevel(showButtonCaptions, showIconWords) {
		if (showButtonCaptions) {
			return HeaderWidthLevel.Full;
		}
		return showIconWords ? HeaderWidthLevel.IconsOnly : HeaderWidthLevel.Essential;
	}

	const ConfirmationLifetime = 2000;
	let refusalPanel$1 = null;
	async function copyLink(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return false;
		}
		const copied = await writeToClipboard(url);
		if (copied) {
			hideRefusalPanel$1();
			const confirmation = main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_LINK_COPIED') ?? '';
			ui_a11y.LiveAnnouncer.announce(confirmation);
			ui_notification.Center.notify({
				content: confirmation,
				autoHideDelay: ConfirmationLifetime,
				useAirDesign: true
			});
			return true;
		}
		showRefusalPanel$1(url);
		return false;
	}
	async function writeToClipboard(url) {
		if (window.isSecureContext && main_core.Type.isFunction(navigator.clipboard?.writeText)) {
			try {
				await navigator.clipboard.writeText(url);
				return true;
			} catch {
			}
		}
		const legacyClipboard = main_core.Reflection.getClass('BX.clipboard');
		return main_core.Type.isFunction(legacyClipboard?.copy) && legacyClipboard.copy(url) === true;
	}
	function showRefusalPanel$1(url) {
		hideRefusalPanel$1();
		const message = main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_COPY_LINK_ERROR') ?? '';
		ui_a11y.LiveAnnouncer.announce(message, 'assertive');
		const panel = new ui_notificationPanel.NotificationPanel({
			id: null,
			styleClass: '',
			content: message,
			backgroundColor: 'var(--ui-color-accent-main-alert)',
			textColor: 'var(--ui-color-base-white-fixed)',
			crossColor: 'var(--ui-color-base-white-fixed)',
			leftIcon: new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.WARNING_ALARM,
				color: 'var(--ui-color-base-white-fixed)'
			}),
			rightButtons: [new ui_buttons.Button({
				text: main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_RETRY_BUTTON') ?? '',
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				collapsedIcon: '',
				noCaps: true,
				round: true,
				onclick: () => copyLink(url)
			})],
			showCloseIcon: true,
			zIndex: null,
			events: null
		});
		panel.subscribe('onHide', () => {
			if (refusalPanel$1 === panel) {
				refusalPanel$1 = null;
			}
		});
		refusalPanel$1 = panel;
		panel.show();
	}
	function hideRefusalPanel$1() {
		if (refusalPanel$1 !== null) {
			refusalPanel$1.hide();
			refusalPanel$1 = null;
		}
	}

	async function loadMenu() {
		try {
			const extension = await main_core.Runtime.loadExtension('ui.system.menu.vue');
			return extension.BMenu;
		} catch {
			return null;
		}
	}
	async function loadPopover() {
		try {
			const [placement, vue] = await Promise.all([main_core.Runtime.loadExtension('ui.system.popover'), main_core.Runtime.loadExtension('ui.system.popover.vue')]);
			return {
				component: vue.BPopover,
				position: placement.PopoverPosition.Bottom,
				alignment: placement.PopoverAlignment.End
			};
		} catch {
			return null;
		}
	}
	async function loadInfoHelper() {
		try {
			const extension = await main_core.Runtime.loadExtension('ui.info-helper');
			return extension.InfoHelper ?? null;
		} catch {
			return null;
		}
	}
	async function loadAvatar() {
		try {
			const extension = await main_core.Runtime.loadExtension('ui.vue3.components.avatar');
			return extension.Avatar ?? null;
		} catch {
			return null;
		}
	}
	async function loadInput() {
		try {
			const extension = await main_core.Runtime.loadExtension('ui.system.input.vue');
			return {
				component: extension.BInput,
				size: extension.InputSize.Lg,
				design: extension.InputDesign.Naked
			};
		} catch {
			return null;
		}
	}

	const BLOCKED_BY_FEATURE = 'blocked-by-feature';
	const RestrictionSlider = Object.freeze({
		board: 'limit_office_share_file',
		document: 'limit_office_files_access_permissions'
	});
	let dialog = null;
	let opening = null;
	async function openAccess(composition) {
		if (composition.access.controlType === BLOCKED_BY_FEATURE) {
			await showRestriction$1(composition.objectType);
			return;
		}
		await openAccessPopup(composition.object.id, composition.object.uniqueCode);
	}
	async function showRestriction$1(objectType) {
		const infoHelper = await resolveInfoHelper();
		infoHelper?.show(RestrictionSlider[objectType]);
	}
	async function resolveInfoHelper() {
		const present = main_core.Reflection.getClass('top.BX.UI.InfoHelper') ?? main_core.Reflection.getClass('BX.UI.InfoHelper');
		return present ?? loadInfoHelper();
	}
	async function openAccessPopup(objectId, uniqueCode) {
		if (!main_core.Type.isNumber(objectId) || objectId <= 0) {
			return;
		}
		if (opening !== null) {
			await opening;
			return;
		}
		opening = openDialog(objectId, uniqueCode);
		try {
			await opening;
		} finally {
			opening = null;
		}
	}
	async function openDialog(objectId, uniqueCode) {
		try {
			const extension = await main_core.Runtime.loadExtension('disk.sharing-access-popup');
			dialog ??= new extension.SharingPopupDialog();
			await dialog.open({
				objectId,
				uniqueCode: main_core.Type.isStringFilled(uniqueCode) ? uniqueCode : null
			});
		} catch {
			dialog = null;
		}
	}

	class ButtonSpinner {
		#loader = null;
		showOver(target) {
			this.#loader ??= new main_loader.Loader({
				size: 20,
				color: 'var(--ui-color-accent-main-primary)',
				strokeWidth: 2
			});
			void this.#loader.show(target);
		}
		destroy() {
			this.#loader?.destroy();
			this.#loader = null;
		}
	}

	const AllowedLinkSchemes = new Set(['http:', 'https:']);
	function isFollowableUrl(url) {
		if (url.trim() === '') {
			return false;
		}
		try {
			return AllowedLinkSchemes.has(new URL(url, document.baseURI).protocol);
		} catch {
			return false;
		}
	}
	const ActionDescriptors = [{
		element: HeaderElement.Access,
		icon: ui_iconSet_api_core.Outline.THREE_PERSONS,
		phraseCode: 'DISK_DOCUMENT_HEADER_ACCESS_ACTION',
		testId: HeaderTestId.Access,
		hasCaption: true,
		run: composition => {
			return openAccess(composition);
		}
	}, {
		element: HeaderElement.CopyLink,
		icon: ui_iconSet_api_core.Outline.LINK,
		phraseCode: 'DISK_DOCUMENT_HEADER_COPY_LINK_ACTION',
		testId: HeaderTestId.CopyLink,
		hasCaption: false,
		run: composition => {
			void copyLink(composition.urls.unifiedLink);
		}
	}, {
		element: HeaderElement.Download,
		icon: ui_iconSet_api_core.Outline.DOWNLOAD,
		phraseCode: 'DISK_DOCUMENT_HEADER_DOWNLOAD_ACTION',
		testId: HeaderTestId.Download,
		hasCaption: true,
		linkUrl: composition => composition.urls.download
	}, {
		element: HeaderElement.Presentation,
		icon: ui_iconSet_api_core.Outline.EXPAND_M,
		phraseCode: 'DISK_DOCUMENT_HEADER_PRESENTATION_ACTION',
		testId: HeaderTestId.Presentation,
		hasCaption: false,
		isAvailable: context => context.presentationAdapter !== null,
		run: (composition, context) => {
			context.presentationAdapter?.enter();
		}
	}];
	const ActionBar = ui_vue3.defineComponent({
		name: 'DiskDocumentHeaderActionBar',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			showCaptions: {
				type: Boolean,
				default: true
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				presentationAdapter: ui_vue3.inject(PresentationAdapterInjectionKey, null)
			};
		},
		data() {
			return {
				waitingElement: null,
				spinner: null,
				isPresentationActive: false,
				unsubscribeFromPresentation: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useCompositionStore, ['composition', 'hasElement']),
			actionContext() {
				return {
					presentationAdapter: this.presentationAdapter
				};
			},
			actions() {
				const composition = this.composition;
				if (composition === null) {
					return [];
				}
				const actions = [];
				for (const descriptor of ActionDescriptors) {
					if (!this.hasElement(descriptor.element) || !(descriptor.isAvailable?.(this.actionContext) ?? true)) {
						continue;
					}
					const linkUrl = descriptor.linkUrl?.(composition);
					if (linkUrl !== undefined && !isFollowableUrl(linkUrl)) {
						continue;
					}
					actions.push(this.createAction(descriptor, composition, linkUrl ?? ''));
				}
				return actions;
			}
		},
		watch: {
			waitingElement() {
				this.syncButtonAttributes();
				this.syncSpinner();
			},
			isPresentationActive: {
				flush: 'sync',
				handler(isActive) {
					if (!isActive) {
						this.focusAction(HeaderElement.Presentation);
					}
				}
			}
		},
		mounted() {
			this.subscribeToPresentation();
			this.syncButtonAttributes();
			this.syncSpinner();
		},
		updated() {
			this.syncButtonAttributes();
			this.syncSpinner();
		},
		beforeUnmount() {
			this.unsubscribeFromPresentation?.();
			this.unsubscribeFromPresentation = null;
			this.destroySpinner();
		},
		methods: {
			subscribeToPresentation() {
				const adapter = this.presentationAdapter;
				if (adapter === null) {
					return;
				}
				this.isPresentationActive = adapter.isActive();
				this.unsubscribeFromPresentation = adapter.subscribeToState(isActive => {
					this.isPresentationActive = isActive;
				});
			},
			createAction(descriptor, composition, linkUrl) {
				const caption = main_core.Loc.getMessage(descriptor.phraseCode) ?? '';
				const {
					run
				} = descriptor;
				const context = this.actionContext;
				return {
					element: descriptor.element,
					icon: descriptor.icon,
					caption,
					text: descriptor.hasCaption && this.showCaptions ? caption : '',
					linkUrl,
					dataset: {
						headerAction: descriptor.element,
						testid: descriptor.testId
					},
					run: run === undefined ? null : () => run(composition, context)
				};
			},
			focusAction(element) {
				this.findActionNode(element)?.focus();
			},
			findActionNode(element) {
				const bar = this.$el;
				if (!(bar instanceof HTMLElement)) {
					return null;
				}
				const node = bar.querySelector(`[data-header-action="${element}"]`);
				return node instanceof HTMLElement ? node : null;
			},
			async handleAction(action) {
				if (action.run === null) {
					return;
				}
				if (this.waitingElement !== null) {
					return;
				}
				const work = action.run();
				if (!(work instanceof Promise)) {
					return;
				}
				this.waitingElement = action.element;
				try {
					await work;
				} finally {
					this.waitingElement = null;
				}
			},
			syncButtonAttributes() {
				this.actions.forEach(action => {
					const node = this.findActionNode(action.element);
					if (node === null) {
						return;
					}
					const isWaiting = action.element === this.waitingElement;
					main_core.Dom.attr(node, 'aria-label', action.caption);
					main_core.Dom.attr(node, 'download', action.linkUrl === '' ? null : '');
					main_core.Dom.attr(node, 'aria-busy', String(isWaiting));
					main_core.Dom.attr(node, 'aria-disabled', isWaiting ? 'true' : null);
				});
			},
			syncSpinner() {
				if (this.waitingElement === null) {
					this.destroySpinner();
					return;
				}
				const target = this.findActionNode(this.waitingElement);
				if (target === null) {
					return;
				}
				this.spinner ??= ui_vue3.markRaw(new ButtonSpinner());
				this.spinner.showOver(target);
			},
			destroySpinner() {
				this.spinner?.destroy();
				this.spinner = null;
			}
		},
		template: `
		<div v-if="actions.length > 0" class="disk-document-header-action-bar">
			<UiButton
				v-for="action in actions"
				:key="action.element"
				:text="action.text"
				:leftIcon="action.icon"
				:dataset="action.dataset"
				:link="action.linkUrl"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.OUTLINE"
				@click="handleAction(action)"
			/>
		</div>
	`
	});

	const BoostSlot = ui_vue3.defineComponent({
		name: 'DiskDocumentHeaderBoostSlot',
		props: {
			containerId: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				HeaderTestId
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useCompositionStore, ['hasElement']),
			isPresent() {
				return this.hasElement(HeaderElement.Boost);
			}
		},
		template: `
		<div
			v-if="isPresent"
			:id="containerId"
			class="disk-document-header-boost-slot"
			:data-testid="HeaderTestId.Boost"
		></div>
	`
	});

	function showHint(event) {
		dispatchHintEvent(event.currentTarget, 'mouseenter');
	}
	function hideHint(event) {
		dispatchHintEvent(event.currentTarget, 'mouseleave');
	}
	function dispatchHintEvent(target, eventName) {
		if (target instanceof HTMLElement) {
			target.dispatchEvent(new MouseEvent(eventName));
		}
	}

	const IconSize$1 = 24;
	const ContentWarning = ui_vue3.defineComponent({
		name: 'DiskDocumentHeaderContentWarning',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		setup() {
			return {
				HeaderTestId,
				IconSize: IconSize$1,
				WarningIcon: ui_iconSet_api_core.Outline.ALERT
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useCompositionStore, ['hasElement']),
			isPresent() {
				return this.hasElement(HeaderElement.ContentWarning);
			},
			warningText() {
				return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_CONTENT_WARNING') ?? '';
			},
			hintParams() {
				return {
					text: this.warningText,
					popupOptions: {
						zIndexOptions: {
							alwaysOnTop: true
						}
					}
				};
			}
		},
		methods: {
			showHint,
			hideHint
		},
		template: `
		<span
			v-if="isPresent"
			v-hint="hintParams"
			class="disk-document-header-content-warning"
			:data-testid="HeaderTestId.ContentWarning"
			role="img"
			tabindex="0"
			:aria-label="warningText"
			@focus="showHint"
			@blur="hideHint"
			@keydown.esc="hideHint"
		>
			<BIcon
				:name="WarningIcon"
				:size="IconSize"
				color="var(--ui-color-accent-main-warning)"
			/>
		</span>
	`
	});

	const PromoGateLoadLimit = 3000;
	async function loadPromoGate(analytics = null, limitMs = null) {
		try {
			const extension = await (limitMs === null ? loadPackage() : loadPackageWithin(limitMs));
			return extension === null ? null : new extension.OnlyOfficePromoActions(false, analytics);
		} catch {
			return null;
		}
	}
	async function loadPackageWithin(limitMs) {
		let giveUp = null;
		const expiration = new Promise(resolve => {
			giveUp = setTimeout(() => resolve(null), limitMs);
		});
		try {
			return await Promise.race([loadPackage(), expiration]);
		} finally {
			if (giveUp !== null) {
				clearTimeout(giveUp);
			}
		}
	}
	function loadPackage() {
		return main_core.Runtime.loadExtension('disk.onlyoffice-promo-actions');
	}

	async function showPromo(anchor) {
		if (anchor === null) {
			return;
		}
		const gate = await loadPromoGate();
		if (gate === null || !gate.shouldShow()) {
			return;
		}
		gate.show(anchor, true);
	}

	const BeforeStartEditEvent = 'Disk.DocumentHeader:onBeforeStartEdit';
	const ServerChosenEditor = 'onlyoffice';
	const AnalyticsDocumentTypes = {
		docx: 'doc',
		xlsx: 'sheet',
		pptx: 'pres'
	};
	async function startEdit(request) {
		if (request.editorCode !== '' && request.editorCode !== ServerChosenEditor) {
			return openInEditor(request.editorCode, request.composition);
		}
		const gate = await loadPromoGate(describeOpening(request.composition), PromoGateLoadLimit);
		if (request.isStillWanted !== undefined && !request.isStillWanted()) {
			return 'unavailable';
		}
		if (gate !== null && gate.shouldShow()) {
			showRestriction(gate, request);
			return 'refused';
		}
		return openEditor(request.editUrl) ? 'opened' : 'unavailable';
	}
	function showRestriction(gate, request) {
		gate.show(request.trigger, true);
		ui_analytics.sendData({
			tool: 'docs',
			category: 'docs',
			event: 'oo_limit_edit',
			...describeOpening(request.composition)
		});
	}
	function describeOpening(composition) {
		if (composition === null) {
			return {};
		}
		const {
			extension,
			id
		} = composition.object;
		return {
			c_sub_section: 'old_element',
			c_element: 'view_mode',
			p3: AnalyticsDocumentTypes[extension] ?? extension,
			p4: `fileId_${id}`
		};
	}
	function openEditor(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return false;
		}
		main_core_events.EventEmitter.emit(BeforeStartEditEvent);
		const sidePanel = main_core.Reflection.getClass('BX.SidePanel.Instance') ?? null;
		const slider = sidePanel === null ? null : sidePanel.getSliderByWindow(window);
		if (sidePanel === null || slider === null) {
			main_core.Page.redirect(url);
			return true;
		}
		const customLeftBoundary = slider.getCustomLeftBoundary();
		slider.close();
		sidePanel.open(url, {
			width: '100%',
			customLeftBoundary,
			cacheable: false,
			allowChangeHistory: false,
			data: {
				documentEditor: true
			}
		});
		return true;
	}
	async function openInEditor(serviceCode, composition) {
		if (composition === null) {
			return 'unavailable';
		}
		try {
			await main_core.Runtime.loadExtension('disk.viewer.actions');
			const actions = main_core.Reflection.getClass('BX.Disk.Viewer.Actions') ?? null;
			if (actions === null) {
				return 'unavailable';
			}
			actions.runActionEdit({
				objectId: composition.object.id,
				name: composition.object.name,
				serviceCode
			});
			return 'opened';
		} catch {
			return 'unavailable';
		}
	}

	const EditControl = 'edit';
	const EditorsControl = 'editors';
	const ReopenGuard = 250;
	const EditAction = ui_vue3.defineComponent({
		name: 'DiskDocumentHeaderEditAction',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			showCaption: {
				type: Boolean,
				default: true
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				EditControl,
				EditIcon: ui_iconSet_api_core.Outline.EDIT_L,
				EditorsControl,
				HeaderTestId,
				editUrl: ui_vue3.inject(EditUrlInjectionKey, ''),
				shouldShowPromoImmediately: ui_vue3.inject(ShowPromoImmediatelyInjectionKey, false)
			};
		},
		data() {
			return {
				isMenuOpen: false,
				anchor: null,
				closedAt: 0,
				menuComponent: null,
				isMenuLoading: false,
				spinner: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useCompositionStore, ['composition', 'hasElement']),
			isPresent() {
				return this.hasElement(HeaderElement.Edit);
			},
			editors() {
				return this.composition?.editors ?? [];
			},
			hasMenu() {
				return this.editors.length > 0;
			},
			caption() {
				return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_EDIT_ACTION') ?? '';
			},
			menuLabel() {
				return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_EDIT_MENU_ACTION') ?? '';
			},
			menuOptions() {
				return {
					bindElement: this.anchor,
					items: this.editors.map(editor => this.createMenuItem(editor))
				};
			}
		},
		mounted() {
			this.syncButtonAttributes();
			void this.showPromoOverButton();
		},
		updated() {
			this.syncButtonAttributes();
			this.syncSpinner();
		},
		beforeUnmount() {
			this.destroySpinner();
		},
		methods: {
			createMenuItem(editor) {
				return {
					id: editor.code,
					title: editor.name,
					onClick: () => {
						void this.startEditing(editor.code);
					}
				};
			},
			handleEdit() {
				void this.startEditing('');
			},
			showPromoOverButton() {
				if (!this.shouldShowPromoImmediately) {
					return Promise.resolve();
				}
				return showPromo(this.control(EditControl));
			},
			async toggleMenu() {
				const anchor = this.control(EditorsControl);
				if (anchor === null || performance.now() - this.closedAt < ReopenGuard || this.isMenuLoading) {
					return;
				}
				if (this.isMenuOpen) {
					this.isMenuOpen = false;
					return;
				}
				this.anchor = ui_vue3.markRaw(anchor);
				if (this.menuComponent === null) {
					this.isMenuLoading = true;
					this.syncSpinner();
					const component = await loadMenu();
					this.isMenuLoading = false;
					this.menuComponent = component === null ? null : ui_vue3.markRaw(component);
				}
				if (this.menuComponent !== null) {
					this.isMenuOpen = true;
				}
			},
			closeMenu() {
				this.isMenuOpen = false;
				this.closedAt = performance.now();
			},
			syncSpinner() {
				const control = this.control(EditorsControl);
				if (control === null) {
					return;
				}
				main_core.Dom.attr(control, 'aria-busy', String(this.isMenuLoading));
				if (this.isMenuLoading) {
					this.spinner ??= ui_vue3.markRaw(new ButtonSpinner());
					this.spinner.showOver(control);
					return;
				}
				this.destroySpinner();
			},
			destroySpinner() {
				this.spinner?.destroy();
				this.spinner = null;
			},
			async startEditing(editorCode) {
				const composition = this.composition;
				if (composition === null) {
					return;
				}
				await startEdit({
					editorCode,
					editUrl: this.editUrl,
					composition,
					trigger: this.control(EditControl)
				});
			},
			control(name) {
				const node = this.$el instanceof HTMLElement ? this.$el.querySelector(`[data-header-action="${name}"]`) : null;
				return node instanceof HTMLElement ? node : null;
			},
			syncButtonAttributes() {
				main_core.Dom.attr(this.control(EditControl), 'aria-label', this.caption);
				const editors = this.control(EditorsControl);
				main_core.Dom.attr(editors, 'aria-label', this.menuLabel);
				main_core.Dom.attr(editors, 'aria-haspopup', 'menu');
				main_core.Dom.attr(editors, 'aria-expanded', this.isMenuOpen ? 'true' : 'false');
			}
		},
		template: `
		<div v-if="isPresent" class="disk-document-header-edit-action">
			<UiButton
				:text="showCaption ? caption : ''"
				:leftIcon="EditIcon"
				:dataset="{ headerAction: EditControl, testid: HeaderTestId.Edit }"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.FILLED"
				:removeRightCorners="hasMenu"
				@click="handleEdit"
			/>
			<UiButton
				v-if="hasMenu"
				class="disk-document-header-edit-action__menu"
				:dataset="{ headerAction: EditorsControl, testid: HeaderTestId.EditMenu }"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.FILLED"
				removeLeftCorners
				dropdown
				@click="toggleMenu"
			/>
			<component :is="menuComponent" v-if="isMenuOpen" :options="menuOptions" @close="closeMenu"/>
		</div>
	`
	});

	const PencilSize = 20;
	const CheckSize = 24;
	const FieldSelector = '.disk-document-header-object-name__field';
	let refusalPanel = null;
	const ObjectName = ui_vue3.defineComponent({
		name: 'DiskDocumentHeaderObjectName',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextLg: ui_system_typography_vue.TextLg
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			documentSessionHash: {
				type: String,
				default: ''
			}
		},
		setup() {
			return {
				shouldRenderNameAsPageHeading: ui_vue3.inject(NameAsPageHeadingInjectionKey, false),
				HeaderTestId,
				CheckIcon: ui_iconSet_api_core.Outline.CHECK_L,
				CheckSize,
				PencilIcon: ui_iconSet_api_core.Outline.EDIT_L,
				PencilSize
			};
		},
		data() {
			return {
				draft: '',
				errorMessage: '',
				fieldWidth: 0,
				isEditing: false,
				isSaving: false,
				isShortened: false,
				unobserve: null,
				field: null,
				isFieldLoading: false,
				spinner: null,
				errorId: `disk-document-header-name-error-${main_core.Text.getRandom()}`
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useCompositionStore, ['composition', 'hasElement']),
			isPresent() {
				return this.hasElement(HeaderElement.Name);
			},
			canRename() {
				return this.hasElement(HeaderElement.Rename);
			},
			nameTag() {
				return this.shouldRenderNameAsPageHeading ? 'h1' : 'span';
			},
			triggerTag() {
				return this.shouldRenderNameAsPageHeading ? 'div' : 'span';
			},
			extension() {
				return this.composition?.object.extension ?? '';
			},
			displayName() {
				return toEditableName(this.composition?.object.name ?? '', this.extension);
			},
			triggerLabel() {
				return this.canRename ? main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_ACTION', {
					'#NAME#': this.displayName
				}) ?? '' : null;
			},
			fieldLabel() {
				return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_NAME_FIELD_LABEL') ?? '';
			},
			submitLabel() {
				return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_SUBMIT') ?? '';
			},
			measurementText() {
				return this.draft === '' ? '\u00a0' : this.draft;
			},
			hintParams() {
				return this.isShortened ? {
					text: this.displayName,
					popupOptions: {
						zIndexOptions: {
							alwaysOnTop: true
						}
					}
				} : null;
			}
		},
		watch: {
			draft() {
				this.errorMessage = '';
				void this.$nextTick(() => this.syncFieldWidth());
			},
			errorMessage() {
				void this.$nextTick(() => this.syncFieldError());
			},
			displayName() {
				void this.$nextTick(() => this.measureName());
			},
			isEditing() {
				void this.$nextTick(() => {
					this.measureName();
					this.syncFieldWidth();
				});
			}
		},
		mounted() {
			this.observeWidth();
		},
		beforeUnmount() {
			this.unobserve?.();
			this.unobserve = null;
			this.destroySpinner();
			hideRefusalPanel();
		},
		methods: {
			observeWidth() {
				if (!(this.$el instanceof HTMLElement)) {
					return;
				}
				const observer = new ResizeObserver(() => this.measureName());
				observer.observe(this.$el);
				this.unobserve = () => observer.disconnect();
			},
			measureName() {
				const node = resolveNode(this.$refs.text);
				this.isShortened = node !== null && node.scrollWidth > node.clientWidth;
			},
			syncFieldWidth() {
				const measure = resolveNode(this.$refs.fieldMeasure);
				if (measure !== null) {
					this.fieldWidth = Math.ceil(measure.getBoundingClientRect().width) + 2;
				}
			},
			async startRename() {
				if (!this.canRename || this.isEditing || this.isFieldLoading) {
					return;
				}
				if (this.field === null) {
					this.isFieldLoading = true;
					this.syncSpinner();
					const field = await loadInput();
					this.isFieldLoading = false;
					this.field = field === null ? null : ui_vue3.markRaw(field);
					this.syncSpinner();
				}
				if (this.field === null) {
					return;
				}
				this.draft = this.displayName;
				this.errorMessage = '';
				this.isEditing = true;
			},
			closeField() {
				const holdsFocus = this.holdsFocus();
				this.isEditing = false;
				this.errorMessage = '';
				if (holdsFocus) {
					void this.$nextTick(() => resolveNode(this.$refs.trigger)?.focus());
				}
			},
			holdsFocus() {
				const active = document.activeElement;
				return active === null || active === document.body || this.$el instanceof HTMLElement && this.$el.contains(active);
			},
			handleFieldBlur(event) {
				if (!this.isEditing) {
					return;
				}
				const nextTarget = event.relatedTarget;
				if (nextTarget instanceof Node && this.$el instanceof HTMLElement && this.$el.contains(nextTarget)) {
					return;
				}
				void this.submitRename();
			},
			async submitRename() {
				if (this.isSaving) {
					return;
				}
				this.isSaving = true;
				const result = await renameObject(this.documentSessionHash, this.draft);
				this.isSaving = false;
				if (result.success) {
					this.closeField();
					return;
				}
				if (result.refusal === RenameRefusal.InvalidName) {
					this.errorMessage = result.message;
					ui_a11y.LiveAnnouncer.announce(result.message, 'assertive');
					return;
				}
				showRefusalPanel(result.message);
			},
			syncFieldError() {
				const field = this.fieldNode();
				if (field === null) {
					return;
				}
				const input = field.querySelector('input, textarea');
				if (!(input instanceof HTMLElement)) {
					return;
				}
				const message = this.errorMessage === '' ? null : messageNode(field, this.errorMessage);
				if (message !== null) {
					main_core.Dom.attr(message, 'id', this.errorId);
				}
				main_core.Dom.attr(input, 'aria-invalid', this.errorMessage === '' ? null : 'true');
				main_core.Dom.attr(input, 'aria-describedby', message === null ? null : this.errorId);
				main_core.Dom.attr(input, 'aria-errormessage', message === null ? null : this.errorId);
			},
			fieldNode() {
				const node = this.$el instanceof HTMLElement ? this.$el.querySelector(FieldSelector) : null;
				return node instanceof HTMLElement ? node : null;
			},
			syncSpinner() {
				const trigger = resolveNode(this.$refs.trigger);
				if (trigger === null) {
					return;
				}
				main_core.Dom.attr(trigger, 'aria-busy', String(this.isFieldLoading));
				if (this.isFieldLoading) {
					this.spinner ??= ui_vue3.markRaw(new ButtonSpinner());
					this.spinner.showOver(trigger);
					return;
				}
				this.destroySpinner();
			},
			destroySpinner() {
				this.spinner?.destroy();
				this.spinner = null;
			},
			showHint,
			hideHint
		},
		template: `
		<div
			v-if="isPresent"
			class="disk-document-header-object-name"
			:class="{ '--editing': isEditing }"
		>
			<component
				:is="field?.component"
				v-if="isEditing"
				v-model="draft"
				class="disk-document-header-object-name__field"
				:data-testid="HeaderTestId.NameField"
				:style="{ width: fieldWidth + 'px' }"
				:size="field.size"
				:design="field.design"
				:error="errorMessage"
				:ariaLabel="fieldLabel"
				active
				@keydown.enter="submitRename"
				@keydown.esc="closeField"
				@blur="handleFieldBlur"
			/>
			<span
				v-if="isEditing"
				ref="fieldMeasure"
				aria-hidden="true"
				class="disk-document-header-object-name__measure"
			>{{ measurementText }}</span>
			<button
				v-if="isEditing"
				type="button"
				class="disk-document-header-object-name__submit"
				:data-testid="HeaderTestId.NameSubmit"
				:aria-label="submitLabel"
				:aria-busy="isSaving ? 'true' : 'false'"
				:aria-disabled="isSaving ? 'true' : null"
				@mousedown.prevent
				@click="submitRename"
			>
				<BIcon
					:name="CheckIcon"
					:size="CheckSize"
					color="var(--ui-color-accent-main-primary)"
				/>
			</button>
			<component
				:is="triggerTag"
				v-else
				ref="trigger"
				v-hint="hintParams"
				class="disk-document-header-object-name__trigger"
				:class="{ '--renamable': canRename }"
				:data-testid="HeaderTestId.Name"
				:tabindex="canRename ? 0 : null"
				:role="canRename ? 'button' : null"
				:aria-label="triggerLabel"
				@click="startRename"
				@keydown.enter="startRename"
				@keydown.space.prevent="startRename"
				@keydown.esc="hideHint"
				@focus="showHint"
				@blur="hideHint"
			>
				<TextLg
					ref="text"
					:tag="nameTag"
					class="disk-document-header-object-name__text"
					wrap="truncate"
				>{{ displayName }}</TextLg>
				<BIcon
					v-if="canRename"
					class="disk-document-header-object-name__pencil"
					:name="PencilIcon"
					:size="PencilSize"
				/>
			</component>
		</div>
	`
	});
	function resolveNode(reference) {
		const node = reference?.$el ?? reference;
		return node instanceof HTMLElement ? node : null;
	}
	function messageNode(field, message) {
		const drawn = [...field.querySelectorAll('*')].filter(node => node.childElementCount === 0 && (node.textContent ?? '').trim() === message).at(-1);
		return drawn instanceof HTMLElement ? drawn : null;
	}
	function showRefusalPanel(message) {
		hideRefusalPanel();
		const text = main_core.Type.isStringFilled(message) ? message : main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_RENAME_ERROR') ?? '';
		ui_a11y.LiveAnnouncer.announce(text, 'assertive');
		const panel = new ui_notificationPanel.NotificationPanel({
			id: null,
			styleClass: '',
			content: main_core.Text.encode(text),
			backgroundColor: 'var(--ui-color-accent-main-alert)',
			textColor: 'var(--ui-color-base-white-fixed)',
			crossColor: 'var(--ui-color-base-white-fixed)',
			leftIcon: new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.WARNING_ALARM,
				color: 'var(--ui-color-base-white-fixed)'
			}),
			rightButtons: [],
			showCloseIcon: true,
			zIndex: null,
			events: null
		});
		panel.subscribe('onHide', () => {
			if (refusalPanel === panel) {
				refusalPanel = null;
			}
		});
		refusalPanel = panel;
		panel.show();
	}
	function hideRefusalPanel() {
		if (refusalPanel !== null) {
			refusalPanel.hide();
			refusalPanel = null;
		}
	}

	const VisibleCount = 3;
	const StackAvatarSize = 28;
	const ListAvatarSize = 24;
	const ListOffset = 8;
	const ListSelector = '.disk-document-header-presence-list';
	const ListFocusFrames = 60;
	const AvatarAttempts = 3;
	const PresenceStack = ui_vue3.defineComponent({
		name: 'DiskDocumentHeaderPresenceStack',
		components: {
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		setup() {
			return {
				HeaderTestId,
				ListAvatarSize,
				StackAvatarSize
			};
		},
		data() {
			return {
				isOpen: false,
				anchor: null,
				closedAt: 0,
				popover: null,
				isPopoverLoading: false,
				avatar: null,
				isAvatarLoading: false,
				avatarAttempts: 0,
				spinner: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useCompositionStore, ['hasElement']),
			...ui_vue3_pinia.mapState(usePresenceStore, ['isAvailable', 'participants']),
			hasRoster() {
				return this.hasElement(HeaderElement.Presence) && this.isAvailable && this.participants.length > 0;
			},
			isPresent() {
				return this.hasRoster && this.avatar !== null;
			},
			isAwaited() {
				return this.hasRoster && this.avatar === null && this.avatarAttempts < AvatarAttempts;
			},
			visibleParticipants() {
				return this.participants.slice(0, VisibleCount);
			},
			hiddenCount() {
				return Math.max(this.participants.length - VisibleCount, 0);
			},
			triggerLabel() {
				return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_PRESENCE_ACTION') ?? '';
			},
			listLabel() {
				return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_PRESENCE_LIST') ?? '';
			},
			stackSizeStyle() {
				return {
					'--disk-document-header-presence-stack-avatar-size': `${StackAvatarSize}px`
				};
			},
			popoverOptions() {
				if (this.popover === null) {
					return null;
				}
				return {
					target: this.anchor,
					positioning: {
						position: this.popover.position,
						alignment: this.popover.alignment,
						offset: ListOffset
					}
				};
			}
		},
		watch: {
			hasRoster: {
				immediate: true,
				handler() {
					void this.loadFaces();
				}
			},
			participants: {
				handler() {
					void this.loadFaces();
				}
			}
		},
		beforeUnmount() {
			this.isOpen = false;
			this.destroySpinner();
		},
		methods: {
			async loadFaces() {
				if (!this.hasRoster || this.avatar !== null || this.isAvatarLoading) {
					return;
				}
				if (this.avatarAttempts >= AvatarAttempts) {
					return;
				}
				this.isAvatarLoading = true;
				const avatar = await loadAvatar();
				this.isAvatarLoading = false;
				this.avatarAttempts += 1;
				this.avatar = avatar === null ? null : ui_vue3.markRaw(avatar);
			},
			avatarOptions(participant, size) {
				return {
					size,
					userName: participant.name,
					userpicPath: participant.avatar
				};
			},
			async toggleList(event) {
				const trigger = this.$refs.trigger;
				if (event.timeStamp <= this.closedAt || !(trigger instanceof HTMLElement) || this.isPopoverLoading) {
					return;
				}
				if (this.isOpen) {
					this.hideList();
					return;
				}
				this.anchor = ui_vue3.markRaw(trigger);
				if (this.popover === null) {
					this.isPopoverLoading = true;
					this.syncSpinner(trigger);
					const popover = await loadPopover();
					this.isPopoverLoading = false;
					this.popover = popover === null ? null : ui_vue3.markRaw(popover);
					this.syncSpinner(trigger);
				}
				if (this.popover !== null) {
					this.isOpen = true;
					await this.$nextTick();
					await this.focusList();
				}
			},
			closeList() {
				this.hideList();
				this.closedAt = performance.now();
			},
			hideList() {
				const holdsFocus = this.listHoldsFocus();
				this.isOpen = false;
				if (holdsFocus && this.$refs.trigger instanceof HTMLElement) {
					ui_a11y.FocusNavigator.focusTarget(this.$refs.trigger);
				}
			},
			async focusList() {
				for (let frame = 0; frame < ListFocusFrames; frame++) {
					if (!this.isOpen || !this.focusWaitsOnStack()) {
						return;
					}
					const list = this.listNode();
					if (list !== null) {
						ui_a11y.FocusNavigator.focusContainer(list);
						if (this.listHoldsFocus()) {
							return;
						}
					}
					await nextFrame();
				}
			},
			focusWaitsOnStack() {
				const active = ui_a11y.FocusNavigator.getActiveElement();
				return active === null || active === document.body || active === this.$refs.trigger;
			},
			listHoldsFocus() {
				const list = this.listNode();
				const active = ui_a11y.FocusNavigator.getActiveElement();
				return list !== null && active !== null && list.contains(active);
			},
			listNode() {
				const node = document.querySelector(ListSelector);
				return node instanceof HTMLElement ? node : null;
			},
			syncSpinner(trigger) {
				main_core.Dom.attr(trigger, 'aria-busy', String(this.isPopoverLoading));
				if (this.isPopoverLoading) {
					this.spinner ??= ui_vue3.markRaw(new ButtonSpinner());
					this.spinner.showOver(trigger);
					return;
				}
				this.destroySpinner();
			},
			destroySpinner() {
				this.spinner?.destroy();
				this.spinner = null;
			}
		},
		template: `
		<div
			v-if="isPresent"
			class="disk-document-header-presence-stack"
			:style="stackSizeStyle"
			:data-testid="HeaderTestId.Presence"
		>
			<button
				ref="trigger"
				type="button"
				class="disk-document-header-presence-stack__trigger"
				:data-testid="HeaderTestId.PresenceTrigger"
				aria-haspopup="dialog"
				:aria-expanded="isOpen ? 'true' : 'false'"
				:aria-label="triggerLabel"
				@click="toggleList"
			>
				<component
					:is="avatar"
					v-for="participant in visibleParticipants"
					:key="participant.id"
					class="disk-document-header-presence-stack__avatar"
					:data-testid="HeaderTestId.PresenceAvatar"
					:options="avatarOptions(participant, StackAvatarSize)"
				/>
				<TextXs v-if="hiddenCount > 0" class="disk-document-header-presence-stack__counter" accent>
					+{{ hiddenCount }}
				</TextXs>
			</button>
			<component
				:is="popover?.component"
				v-if="isOpen"
				class="disk-document-header-presence-list"
				:data-testid="HeaderTestId.PresenceList"
				role="dialog"
				tabindex="-1"
				:aria-label="listLabel"
				:options="popoverOptions"
				@keydown.esc="closeList"
				@hide="closeList"
			>
				<div
					v-for="participant in participants"
					:key="participant.id"
					class="disk-document-header-presence-list__row"
					:data-testid="HeaderTestId.PresenceItem + '-' + participant.id"
				>
					<component :is="avatar" :options="avatarOptions(participant, ListAvatarSize)"/>
					<TextSm class="disk-document-header-presence-list__name">{{ participant.name }}</TextSm>
				</div>
			</component>
		</div>
		<div
			v-else-if="isAwaited"
			class="disk-document-header-presence-stack disk-document-header-presence-stack--awaited"
			:style="stackSizeStyle"
			aria-hidden="true"
		>
			<span
				v-for="participant in visibleParticipants"
				:key="participant.id"
				class="disk-document-header-presence-stack__avatar"
			></span>
			<TextXs v-if="hiddenCount > 0" class="disk-document-header-presence-stack__counter" accent>
				+{{ hiddenCount }}
			</TextXs>
		</div>
	`
	});
	function nextFrame() {
		return new Promise(resolve => {
			requestAnimationFrame(() => resolve());
		});
	}

	const IconSize = 18;
	const RetryControl = 'save-retry';
	const SaveStatusIndicator = ui_vue3.defineComponent({
		name: 'DiskDocumentHeaderSaveStatus',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextXs: ui_system_typography_vue.TextXs,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				HeaderTestId,
				IconSize,
				RetryControl,
				adapter: ui_vue3.inject(EditorAdapterInjectionKey, null),
				status: ui_vue3.inject(SaveStatusInjectionKey, {
					state: 'neutral'
				})
			};
		},
		data() {
			return {
				spinner: null,
				isRetrying: false,
				retrySpinner: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useCompositionStore, ['hasElement']),
			state() {
				return this.status.state;
			},
			isPresent() {
				return this.hasElement(HeaderElement.SaveStatus) && this.state !== 'neutral';
			},
			isSaving() {
				return this.state === 'saving';
			},
			isFailed() {
				return this.state === 'failed';
			},
			isAutosave() {
				return this.state === 'autosave';
			},
			icon() {
				return this.isFailed ? ui_iconSet_api_core.Main.WARNING_ALARM : ui_iconSet_api_core.Outline.CIRCLE_CHECK;
			},
			iconColor() {
				return this.isFailed ? 'var(--ui-color-accent-main-alert)' : 'var(--ui-color-accent-main-success)';
			},
			hasIcon() {
				return !this.isSaving;
			},
			message() {
				if (this.isSaving) {
					return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_SAVE_STATUS_SAVING') ?? '';
				}
				if (this.isAutosave) {
					return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_SAVE_STATUS_AUTOSAVE') ?? '';
				}
				if (!this.isFailed) {
					return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_SAVE_STATUS_SAVED') ?? '';
				}
				return main_core.Type.isStringFilled(this.status.errorMessage) ? this.status.errorMessage : main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_SAVE_STATUS_FAILED') ?? '';
			},
			canRetry() {
				return this.isFailed && this.adapter?.canRetrySave() === true;
			},
			retryCaption() {
				return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_RETRY_BUTTON') ?? '';
			}
		},
		watch: {
			state() {
				this.announceOutcome();
			}
		},
		mounted() {
			this.syncSpinner();
		},
		updated() {
			this.syncSpinner();
			this.syncRetrySpinner();
		},
		beforeUnmount() {
			this.spinner?.destroy();
			this.spinner = null;
			this.destroyRetrySpinner();
		},
		methods: {
			handleRetry() {
				void this.retry();
			},
			async retry() {
				if (this.isRetrying || this.adapter === null) {
					return;
				}
				this.isRetrying = true;
				this.syncRetrySpinner();
				try {
					await this.adapter.retrySave();
				} finally {
					this.isRetrying = false;
					this.syncRetrySpinner();
				}
			},
			syncRetrySpinner() {
				const control = this.$el instanceof HTMLElement ? this.$el.querySelector(`[data-header-action="${RetryControl}"]`) : null;
				if (!(control instanceof HTMLElement)) {
					this.destroyRetrySpinner();
					return;
				}
				main_core.Dom.attr(control, 'aria-busy', String(this.isRetrying));
				if (this.isRetrying) {
					this.retrySpinner ??= ui_vue3.markRaw(new ButtonSpinner());
					this.retrySpinner.showOver(control);
					return;
				}
				this.destroyRetrySpinner();
			},
			destroyRetrySpinner() {
				this.retrySpinner?.destroy();
				this.retrySpinner = null;
			},
			announceOutcome() {
				if (this.state === 'neutral' || this.isSaving || this.isAutosave) {
					return;
				}
				ui_a11y.LiveAnnouncer.announce(this.message, this.isFailed ? 'assertive' : 'polite');
			},
			syncSpinner() {
				const target = this.$refs.spinnerBox;
				if (!(target instanceof HTMLElement)) {
					this.spinner?.hide();
					return;
				}
				this.spinner ??= ui_vue3.markRaw(new main_loader.Loader({
					size: IconSize,
					mode: 'inline'
				}));
				this.spinner.show(target);
			}
		},
		template: `
		<div
			v-if="isPresent"
			class="disk-document-header-save-status"
			:class="{ '--failed': isFailed }"
			:data-testid="HeaderTestId.SaveStatus"
		>
			<div v-if="isSaving" ref="spinnerBox" class="disk-document-header-save-status__spinner"></div>
			<BIcon
				v-if="hasIcon"
				class="disk-document-header-save-status__icon"
				:name="icon"
				:color="iconColor"
				:size="IconSize"
			/>
			<TextXs class="disk-document-header-save-status__text">{{ message }}</TextXs>
			<UiButton
				v-if="canRetry"
				class="disk-document-header-save-status__retry"
				:text="retryCaption"
				:dataset="{ headerAction: RetryControl, testid: HeaderTestId.SaveStatusRetry }"
				:size="ButtonSize.EXTRA_SMALL"
				:style="AirButtonStyle.PLAIN_ACCENT"
				@click="handleRetry"
			/>
		</div>
	`
	});

	const Header = ui_vue3.defineComponent({
		name: 'DiskDocumentHeader',
		components: {
			ActionBar,
			BoostSlot,
			ContentWarning,
			EditAction,
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			ObjectName,
			PresenceStack,
			SaveStatusIndicator
		},
		props: {
			documentSessionHash: {
				type: String,
				default: ''
			},
			boostContainerId: {
				type: String,
				required: true
			},
			logoUrl: {
				type: String,
				default: ''
			}
		},
		setup() {
			return {
				HeaderTestId
			};
		},
		data() {
			return {
				adaptation: resolveAdaptation(0),
				unobserve: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(useCompositionStore, ['hasElement']),
			hasLogo() {
				return this.hasElement(HeaderElement.Logo);
			},
			logoTag() {
				return this.logoUrl === '' ? 'div' : 'a';
			},
			logoAttributes() {
				return this.logoUrl === '' ? {
					role: 'img'
				} : {
					href: this.logoUrl,
					target: '_blank',
					rel: 'noopener'
				};
			},
			logoLabel() {
				return main_core.Loc.getMessage('DISK_DOCUMENT_HEADER_LOGO_LABEL') ?? '';
			},
			isCompact() {
				return this.adaptation.level === HeaderWidthLevel.Essential;
			}
		},
		mounted() {
			if (this.$el instanceof HTMLElement) {
				this.unobserve = observeContainerWidth(this.$el, adaptation => {
					this.adaptation = adaptation;
				});
			}
		},
		beforeUnmount() {
			this.unobserve?.();
			this.unobserve = null;
		},
		template: `
		<div
			class="disk-document-header"
			:class="{ '--compact': isCompact }"
			:data-testid="HeaderTestId.Root"
		>
			<div class="disk-document-header__start">
				<template v-if="hasLogo">
					<component
						:is="logoTag"
						v-bind="logoAttributes"
						class="disk-document-header__logo"
						:data-testid="HeaderTestId.Logo"
						:aria-label="logoLabel"
					>
						<HeadlineMd
							v-if="adaptation.showLogoName"
							tag="span"
							class="disk-document-header__logo-name"
						>{{ logoLabel }}</HeadlineMd>
						<span class="disk-document-header__logo-clock" aria-hidden="true"></span>
					</component>
					<div class="disk-document-header__divider"></div>
				</template>
				<ObjectName :documentSessionHash="documentSessionHash"/>
				<ContentWarning/>
				<SaveStatusIndicator/>
			</div>
			<div class="disk-document-header__end">
				<BoostSlot :containerId="boostContainerId"/>
				<EditAction :showCaption="adaptation.showEditCaption"/>
				<PresenceStack/>
				<ActionBar :showCaptions="adaptation.showButtonCaptions"/>
			</div>
		</div>
	`
	});

	const App = ui_vue3.defineComponent({
		name: 'DiskDocumentHeaderApp',
		components: {
			Header
		},
		props: {
			documentSessionHash: {
				type: String,
				default: ''
			},
			boostContainerId: {
				type: String,
				required: true
			},
			logoUrl: {
				type: String,
				default: ''
			}
		},
		template: `
		<Header
			:documentSessionHash="documentSessionHash"
			:boostContainerId="boostContainerId"
			:logoUrl="logoUrl"
		/>
	`
	});

	const FailureEvent = Object.freeze({
		Mount: 'mount',
		Composition: 'composition'
	});
	class DocumentHeader {
		#container;
		#context;
		#pinia = null;
		#app = null;
		#unsubscribeFromAdapter = null;
		#saveStatus = ui_vue3.reactive({
			state: 'neutral'
		});
		#isUnmounted = false;
		constructor(container, context) {
			this.#container = container;
			this.#context = context;
			void this.#start();
		}
		unmount() {
			this.#isUnmounted = true;
			this.#unsubscribeFromAdapter?.();
			this.#unsubscribeFromAdapter = null;
			this.#app?.unmount();
			this.#app = null;
			this.#pinia = null;
		}
		async rename(newName) {
			if (this.#pinia === null) {
				return {
					success: false,
					refusal: RenameRefusal.Refused,
					message: ''
				};
			}
			ui_vue3_pinia.setActivePinia(this.#pinia);
			return renameObject(this.#context.documentSessionHash, newName);
		}
		async #start() {
			const problems = validateMountContext(this.#container, this.#context);
			if (problems.length > 0) {
				reportFailure(FailureEvent.Mount, `the mount context is not usable: ${problems.join(', ')}`);
				return;
			}
			const pinia = ui_vue3_pinia.createPinia();
			ui_vue3_pinia.setActivePinia(pinia);
			this.#pinia = pinia;
			if (!applyComposition(this.#context.composition)) {
				const loaded = await loadComposition(this.#context.documentSessionHash);
				if (!loaded.success) {
					reportFailure(FailureEvent.Composition, `${loaded.error.code} ${loaded.error.message}`.trim());
					return;
				}
				if (this.#isUnmounted) {
					return;
				}
			}
			const store = useCompositionStore();
			if (store.composition?.objectType === 'document') {
				this.#saveStatus.state = 'saved';
			}
			this.#subscribeToAdapter();
			this.#mount(pinia);
			reportTimeToActions(store.composition?.objectType ?? '');
			if (store.hasElement(HeaderElement.Presence)) {
				void loadInitialPresence(this.#context.documentSessionHash);
			}
			if (store.hasElement(HeaderElement.Boost)) {
				void showBoost({
					containerId: this.#context.boostContainerId,
					sessionBoost: this.#context.sessionBoost,
					isCancelled: () => this.#isUnmounted
				});
			}
		}
		#mount(pinia) {
			const app = ui_vue3.BitrixVue.createApp(App, {
				documentSessionHash: this.#context.documentSessionHash,
				boostContainerId: this.#context.boostContainerId,
				logoUrl: this.#context.logoUrl
			});
			app.use(pinia);
			app.provide(SaveStatusInjectionKey, this.#saveStatus);
			app.provide(EditorAdapterInjectionKey, this.#context.adapter);
			app.provide(EditUrlInjectionKey, this.#context.editUrl);
			app.provide(PresentationAdapterInjectionKey, this.#context.presentationAdapter ?? null);
			app.provide(ShowPromoImmediatelyInjectionKey, this.#context.shouldShowPromoImmediately);
			app.provide(NameAsPageHeadingInjectionKey, this.#context.shouldRenderNameAsPageHeading === true);
			app.mount(this.#container);
			this.#app = app;
		}
		#subscribeToAdapter() {
			const unsubscribe = this.#context.adapter.subscribeToSaveStatus(status => {
				const objectType = useCompositionStore().composition?.objectType;
				this.#saveStatus.state = status.state === 'neutral' && objectType === 'document' ? 'saved' : status.state;
				this.#saveStatus.errorMessage = status.errorMessage;
			});
			this.#unsubscribeFromAdapter = main_core.Type.isFunction(unsubscribe) ? unsubscribe : null;
		}
	}
	function validateMountContext(container, context) {
		if (!main_core.Type.isPlainObject(context)) {
			return ['context'];
		}
		const problems = [];
		if (!main_core.Type.isElementNode(container)) {
			problems.push('container');
		}
		if (requiresDocumentSession(context.composition) && !main_core.Type.isStringFilled(context.documentSessionHash)) {
			problems.push('documentSessionHash');
		}
		if (!isEditorAdapter(context.adapter)) {
			problems.push('adapter');
		}
		if (!main_core.Type.isStringFilled(context.boostContainerId)) {
			problems.push('boostContainerId');
		}
		if (!main_core.Type.isString(context.logoUrl)) {
			problems.push('logoUrl');
		}
		if (!main_core.Type.isString(context.editUrl)) {
			problems.push('editUrl');
		}
		if (context.sessionBoost !== null && !isSessionBoostContext(context.sessionBoost)) {
			problems.push('sessionBoost');
		}
		if (!main_core.Type.isBoolean(context.shouldShowPromoImmediately)) {
			problems.push('shouldShowPromoImmediately');
		}
		if (context.shouldRenderNameAsPageHeading !== undefined && !main_core.Type.isBoolean(context.shouldRenderNameAsPageHeading)) {
			problems.push('shouldRenderNameAsPageHeading');
		}
		if (context.presentationAdapter !== undefined && !isPresentationAdapter(context.presentationAdapter)) {
			problems.push('presentationAdapter');
		}
		return problems;
	}
	function isSessionBoostContext(boost) {
		return main_core.Type.isPlainObject(boost) && main_core.Type.isBoolean(boost.shouldShowWidgetInstantly) && main_core.Type.isPlainObject(boost.widgetViewOption) && main_core.Type.isStringFilled(boost.widgetViewOption.category) && main_core.Type.isStringFilled(boost.widgetViewOption.name);
	}
	function isEditorAdapter(adapter) {
		return main_core.Type.isObject(adapter) && main_core.Type.isFunction(adapter.subscribeToSaveStatus) && main_core.Type.isFunction(adapter.retrySave) && main_core.Type.isFunction(adapter.canRetrySave);
	}
	function isPresentationAdapter(adapter) {
		return main_core.Type.isObject(adapter) && main_core.Type.isFunction(adapter.enter) && main_core.Type.isFunction(adapter.exit) && main_core.Type.isFunction(adapter.subscribeToState) && main_core.Type.isFunction(adapter.isActive);
	}
	function reportFailure(event, detail) {
		console.error(`[disk.document-header] ${event} failed: ${detail}`);
	}

	async function loadPullClient() {
		try {
			const extension = await main_core.Runtime.loadExtension('pull.client');
			return extension.PullClient ?? null;
		} catch {
			return null;
		}
	}

	const StopReason = 'Document header presence stopped';
	const TerminalErrorCodes = ['ACCESS_DENIED', 'PRESENCE_CONTEXT_INVALID'];
	const MillisecondsInSecond = 1000;
	const RequestTimeoutMargin = 1;
	class PresencePullHandler {
		getModuleId() {
			return PresencePullContract.moduleId;
		}
		getMap() {
			return {
				[PresencePullContract.command]: this.#handleRoster
			};
		}
		#handleRoster = payload => {
			syncPresenceFromPull(payload);
		};
	}
	class PresenceChannel {
		#componentName;
		#pageClient;
		#config = null;
		#handler = new PresencePullHandler();
		#client = null;
		#transport = null;
		#ownsClient = false;
		#unsubscribe = null;
		#heartbeatTimer = null;
		#pageHideHandler = null;
		#isStopped = false;
		#isRegistered = false;
		#hasLeft = false;
		#request = null;
		constructor(componentName, pageClient = null) {
			this.#componentName = componentName;
			this.#pageClient = pageClient;
		}
		async start(config) {
			if (this.#config !== null || this.#isStopped || !describesLiveChannel(config) || !applyPresenceConfig(config)) {
				return false;
			}
			this.#config = config;
			this.#bindPageHide();
			this.#heartbeatTimer = setInterval(() => {
				void this.#beat();
			}, config.heartbeatInterval);
			return this.#connect();
		}
		stop() {
			if (this.#isStopped) {
				return;
			}
			this.#isStopped = true;
			if (this.#heartbeatTimer !== null) {
				clearInterval(this.#heartbeatTimer);
				this.#heartbeatTimer = null;
			}
			if (this.#pageHideHandler !== null) {
				window.removeEventListener('pagehide', this.#pageHideHandler);
				this.#pageHideHandler = null;
			}
			this.#disposeClient();
			this.#leave();
		}
		async #connect() {
			if (this.#isStopped || this.#client !== null) {
				return false;
			}
			if (this.#pageClient !== null) {
				this.#client = this.#pageClient;
				this.#unsubscribe = this.#pageClient.subscribe(this.#handler);
				await this.#register();
				return !this.#isStopped;
			}
			this.#transport ??= await loadPullClient();
			const PullClient = this.#transport;
			if (PullClient === null || this.#isStopped || this.#client !== null) {
				return false;
			}
			const client = new PullClient({
				skipStorageInit: true
			});
			this.#client = client;
			this.#ownsClient = true;
			this.#unsubscribe = client.subscribe(this.#handler);
			const started = await this.#startClient(client);
			if (this.#client !== client) {
				client.stop(PullClient.CloseReasons.MANUAL, StopReason);
				return false;
			}
			if (started !== true) {
				this.#disposeClient();
				return false;
			}
			await this.#register();
			return !this.#isStopped;
		}
		#startClient(client) {
			let timer = null;
			const connected = client.start(this.#config?.pullConfig).catch(() => false);
			const expired = new Promise(resolve => {
				timer = setTimeout(() => resolve(false), this.#requestTimeout() * MillisecondsInSecond);
			});
			return Promise.race([connected, expired]).then(started => {
				if (timer !== null) {
					clearTimeout(timer);
				}
				return started === true;
			});
		}
		async #beat() {
			if (this.#isStopped) {
				return;
			}
			if (this.#client === null) {
				await this.#connect();
				return;
			}
			await this.#register();
		}
		async #register() {
			const actions = this.#config?.actions;
			if (!actions) {
				return;
			}
			await this.#send(this.#isRegistered ? actions.heartbeat : actions.enter);
		}
		async #send(action) {
			if (this.#isStopped || this.#request !== null) {
				return;
			}
			if (action === this.#config?.actions.enter) {
				this.#isRegistered = true;
			}
			const request = this.#run(action);
			this.#request = request;
			try {
				await request;
			} finally {
				this.#request = null;
			}
		}
		async #run(action) {
			try {
				const response = await main_core.ajax.runComponentAction(this.#componentName, action, {
					mode: 'ajax',
					timeout: this.#requestTimeout(),
					json: {
						presenceContext: this.#config?.presenceContext,
						clientRevision: usePresenceStore().revision
					}
				});
				if (this.#isStopped) {
					return;
				}
				if (response.status === 'success') {
					syncPresenceFromPull(response.data);
					return;
				}
				this.#stopOnTerminalRefusal(response);
			} catch (error) {
				this.#stopOnTerminalRefusal(error);
			}
		}
		#requestTimeout() {
			const interval = Math.floor((this.#config?.heartbeatInterval ?? 0) / MillisecondsInSecond);
			return Math.max(RequestTimeoutMargin, interval - RequestTimeoutMargin);
		}
		#leave() {
			const action = this.#config?.actions.leave;
			if (!action || !this.#isRegistered || this.#hasLeft) {
				return;
			}
			this.#hasLeft = true;
			const send = () => {
				void main_core.ajax.runComponentAction(this.#componentName, action, {
					mode: 'ajax',
					json: {
						presenceContext: this.#config?.presenceContext,
						clientRevision: usePresenceStore().revision
					}
				}).catch(() => {});
			};
			const pending = this.#request;
			if (pending === null) {
				send();
			} else {
				pending.then(send, send);
			}
		}
		#stopOnTerminalRefusal(response) {
			if (hasTerminalError(response)) {
				this.stop();
			}
		}
		#disposeClient() {
			const unsubscribe = this.#unsubscribe;
			this.#unsubscribe = null;
			unsubscribe?.();
			const client = this.#client;
			const ownsClient = this.#ownsClient;
			this.#client = null;
			this.#ownsClient = false;
			if (ownsClient) {
				client?.stop(this.#transport?.CloseReasons.MANUAL, StopReason);
			}
		}
		#bindPageHide() {
			this.#pageHideHandler = () => this.stop();
			window.addEventListener('pagehide', this.#pageHideHandler);
		}
	}
	function describesLiveChannel(config) {
		if (!main_core.Type.isPlainObject(config) || !main_core.Type.isPlainObject(config.pullConfig)) {
			return false;
		}
		return main_core.Type.isStringFilled(config.presenceContext) && main_core.Type.isNumber(config.heartbeatInterval) && Number.isFinite(config.heartbeatInterval) && config.heartbeatInterval > 0 && main_core.Type.isPlainObject(config.actions) && config.actions.enter === PresenceActionContract.enter && config.actions.heartbeat === PresenceActionContract.heartbeat && config.actions.leave === PresenceActionContract.leave;
	}
	function hasTerminalError(response) {
		const container = response;
		let errors = [response];
		if (main_core.Type.isArray(container?.errors)) {
			errors = container?.errors;
		} else if (main_core.Type.isArray(response)) {
			errors = response;
		}
		return errors.some(error => TerminalErrorCodes.includes(error?.code ?? ''));
	}

	class FullscreenPresentation {
		#container;
		#isActive = false;
		#isNativeActive = false;
		#isRequestedByButton = false;
		#listeners = new Set();
		#fullscreenChangeHandler;
		#keyDownHandler;
		constructor(container) {
			this.#container = container;
			this.#fullscreenChangeHandler = () => this.#handleFullscreenChange();
			this.#keyDownHandler = event => this.#handleKeyDown(event);
			main_core.Event.bind(document, 'fullscreenchange', this.#fullscreenChangeHandler);
			main_core.Event.bind(document, 'keydown', this.#keyDownHandler);
		}
		enter() {
			if (this.#isActive || document.fullscreenElement) {
				return;
			}
			this.#isRequestedByButton = true;
			let request = null;
			if (main_core.Type.isFunction(this.#container.requestFullscreen)) {
				try {
					request = this.#container.requestFullscreen();
				} catch {
					request = null;
				}
			}
			this.#setActive(true);
			if (request instanceof Promise) {
				request.catch(() => {});
			}
		}
		exit() {
			if (!this.#isActive && document.fullscreenElement !== this.#container) {
				return;
			}
			this.#isRequestedByButton = false;
			if (document.fullscreenElement === this.#container && main_core.Type.isFunction(document.exitFullscreen)) {
				try {
					const request = document.exitFullscreen();
					if (request instanceof Promise) {
						request.catch(() => {});
					}
				} catch {
				}
				return;
			}
			this.#setActive(false);
		}
		isActive() {
			return this.#isActive;
		}
		subscribeToState(listener) {
			this.#listeners.add(listener);
			return () => {
				this.#listeners.delete(listener);
			};
		}
		destroy() {
			main_core.Event.unbind(document, 'fullscreenchange', this.#fullscreenChangeHandler);
			main_core.Event.unbind(document, 'keydown', this.#keyDownHandler);
			this.#listeners.clear();
		}
		#setActive(isActive) {
			if (this.#isActive === isActive) {
				return;
			}
			this.#isActive = isActive;
			this.#listeners.forEach(listener => listener(isActive));
		}
		#handleFullscreenChange() {
			if (document.fullscreenElement === this.#container) {
				this.#isNativeActive = true;
				this.#setActive(true);
				if (!this.#isRequestedByButton) {
					this.exit();
				}
				return;
			}
			if (this.#isNativeActive) {
				this.#isNativeActive = false;
				this.#isRequestedByButton = false;
				this.#setActive(false);
			}
		}
		#handleKeyDown(event) {
			if (event.key === 'Escape' && this.#isActive) {
				this.exit();
			}
		}
	}

	exports.ActionBar = ActionBar;
	exports.BeforeStartEditEvent = BeforeStartEditEvent;
	exports.BoostSlot = BoostSlot;
	exports.CaptionsFitWidth = CaptionsFitWidth;
	exports.ContentWarning = ContentWarning;
	exports.DocumentHeader = DocumentHeader;
	exports.EditAction = EditAction;
	exports.EditUrlInjectionKey = EditUrlInjectionKey;
	exports.EditorAdapterInjectionKey = EditorAdapterInjectionKey;
	exports.FullscreenPresentation = FullscreenPresentation;
	exports.Header = Header;
	exports.HeaderElement = HeaderElement;
	exports.HeaderServiceErrorCode = HeaderServiceErrorCode;
	exports.HeaderWidthLevel = HeaderWidthLevel;
	exports.IconWordsFitWidth = IconWordsFitWidth;
	exports.NameAsPageHeadingInjectionKey = NameAsPageHeadingInjectionKey;
	exports.ObjectName = ObjectName;
	exports.PresenceActionContract = PresenceActionContract;
	exports.PresenceChannel = PresenceChannel;
	exports.PresencePullContract = PresencePullContract;
	exports.PresenceStack = PresenceStack;
	exports.PresentationAdapterInjectionKey = PresentationAdapterInjectionKey;
	exports.RenameRefusal = RenameRefusal;
	exports.SaveStatusIndicator = SaveStatusIndicator;
	exports.SaveStatusInjectionKey = SaveStatusInjectionKey;
	exports.ServerChosenEditor = ServerChosenEditor;
	exports.ShowPromoImmediatelyInjectionKey = ShowPromoImmediatelyInjectionKey;
	exports.applyComposition = applyComposition;
	exports.applyPresenceConfig = applyPresenceConfig;
	exports.copyLink = copyLink;
	exports.documentHeaderService = documentHeaderService;
	exports.loadComposition = loadComposition;
	exports.loadInitialPresence = loadInitialPresence;
	exports.loadPromoGate = loadPromoGate;
	exports.mapCompositionDtoToModel = mapCompositionDtoToModel;
	exports.mapPresenceDtoToModel = mapPresenceDtoToModel;
	exports.mapRenameDto = mapRenameDto;
	exports.observeContainerWidth = observeContainerWidth;
	exports.openAccess = openAccess;
	exports.openAccessPopup = openAccessPopup;
	exports.renameObject = renameObject;
	exports.resolveAdaptation = resolveAdaptation;
	exports.showBoost = showBoost;
	exports.showPromo = showPromo;
	exports.startEdit = startEdit;
	exports.syncPresenceFromPull = syncPresenceFromPull;
	exports.useCompositionStore = useCompositionStore;
	exports.usePresenceStore = usePresenceStore;

})(this.BX.Disk = this.BX.Disk || {}, BX, BX.Vue3, BX.Vue3.Pinia, BX.UI.Analytics, BX.UI.System.Typography.Vue, BX.UI.IconSet, window, BX.Vue3.Components, BX.UI.Accessibility, BX.UI, window, BX.UI.Notification, BX.UI, BX, BX.UI.IconSet, BX.Vue3.Directives, BX.Event);
//# sourceMappingURL=document-header.bundle.js.map

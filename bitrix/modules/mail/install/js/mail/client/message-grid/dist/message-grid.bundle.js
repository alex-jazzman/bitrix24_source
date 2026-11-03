/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Client = this.BX.Mail.Client || {};
(function (exports, ui_vue3, ui_vue3_pinia, main_core, main_core_events, main_popup, ui_system_checkbox, ui_buttons, ui_designTokens, ui_fonts_opensans, ui_a11y, mail_favoritesFilterState) {
	'use strict';

	const GridMode = Object.freeze({
		Message: 'message',
		Draft: 'draft'
	});
	const TestId = Object.freeze({
		Root: 'mail-grid-root',
		DraftRoot: 'mail-draft-grid-root',
		Table: 'mail-grid-table',
		RowCheckbox: 'mail-grid-row-checkbox',
		RowActions: 'mail-grid-row-actions',
		CheckAll: 'mail-grid-check-all',
		MoreButton: 'mail-grid-more-button',
		PageError: 'mail-grid-page-error',
		SyncLoader: 'mail-grid-sync-loader',
		EmptyRow: 'mail-grid-empty-row',
		EmptyStub: 'mail-grid-empty-stub',
		TariffStub: 'mail-grid-tariff-stub',
		TariffButton: 'mail-grid-tariff-button',
		ScreenNotice: 'mail-grid-notice',
		ScreenNoticeItem: 'mail-grid-notice-item',
		ProjectionRow: 'mail-grid-projection-row',
		DraftRecipientsLink: 'mail-draft-list-recipients-link',
		DraftSubjectLink: 'mail-draft-list-subject-link',
		DraftEmpty: 'mail-draft-list-empty',
		UnseenDot: 'mail-list-unseen-dot',
		FavoriteButton: 'mail-list-favorite-btn',
		SenderLink: 'mail-list-sender-link',
		SubjectLink: 'mail-list-subject-link',
		AttachIcon: 'mail-list-attach-icon',
		Attachments: 'mail-list-attachments',
		AttachmentChip: 'mail-list-attachment-chip',
		AttachmentChipLoading: 'mail-list-attachment-chip-loading',
		AttachmentChipOpen: 'mail-list-attachment-chip-open',
		AttachmentChipType: 'mail-list-attachment-chip-type',
		AttachmentChipDownload: 'mail-list-attachment-chip-download',
		AttachmentsStack: 'mail-list-attachments-stack',
		AttachmentsMenu: 'mail-list-attachments-menu',
		AttachmentsMenuStatus: 'mail-list-attachments-menu-status',
		AttachmentsMenuList: 'mail-list-attachments-menu-list',
		AttachmentsMenuItemView: 'mail-list-attachments-menu-item-view',
		AttachmentsMenuItemIcon: 'mail-list-attachments-menu-item-icon',
		AttachmentsMenuItemDownload: 'mail-list-attachments-menu-item-download',
		AttachmentsMenuArchive: 'mail-list-attachments-menu-archive',
		AttachmentsMenuArchiveStatus: 'mail-list-attachments-menu-archive-status'
	});
	const DraftRowTestIdPrefix = 'mail-draft-list-item-';
	const DataRole = Object.freeze({
		GridContainer: 'mail-msg-list-grid',
		Favorite: 'mail-list-favorite',
		AttachmentChip: 'mail-list-attachment-chip',
		AttachmentsStack: 'mail-list-attachments-stack'
	});
	const Phrase = Object.freeze({
		ColumnFavorite: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_FAVORITE',
		ColumnFrom: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_FROM',
		ColumnSubject: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_SUBJECT',
		ColumnDate: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_DATE',
		ColumnCrmBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_CRM_BIND',
		ColumnTaskBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_TASK_BIND',
		ColumnChatBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_CHAT_BIND',
		ColumnPostBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_POST_BIND',
		ColumnMeetingBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_MEETING_BIND',
		AddressSeparator: 'MAIL_CLIENT_MESSAGE_GRID_ADDRESS_SEPARATOR',
		RowSelect: 'MAIL_CLIENT_MESSAGE_GRID_ROW_SELECT',
		RowActions: 'MAIL_CLIENT_MESSAGE_GRID_ROW_ACTIONS',
		DraftSelect: 'MAIL_CLIENT_MESSAGE_GRID_DRAFT_SELECT',
		DraftActions: 'MAIL_CLIENT_MESSAGE_GRID_DRAFT_ACTIONS',
		DraftNoRecipients: 'MAIL_CLIENT_MESSAGE_GRID_DRAFT_NO_RECIPIENTS',
		UnseenDotLabel: 'MAIL_CLIENT_MESSAGE_GRID_UNSEEN_DOT_LABEL',
		FavoriteLabel: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITE_LABEL',
		FavoriteAdded: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITE_ADDED',
		FavoriteRemoved: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITE_REMOVED',
		FavoriteError: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITE_ERROR',
		FavoritesShown: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITES_SHOWN',
		FavoritesEmpty: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITES_EMPTY',
		More: 'MAIL_CLIENT_MESSAGE_GRID_MORE',
		MoreLoading: 'MAIL_CLIENT_MESSAGE_GRID_MORE_LOADING',
		PageError: 'MAIL_CLIENT_MESSAGE_GRID_PAGE_ERROR',
		PageLimit: 'MAIL_CLIENT_MESSAGE_GRID_PAGE_LIMIT',
		NoData: 'MAIL_CLIENT_MESSAGE_GRID_NO_DATA',
		NoDataFiltered: 'MAIL_CLIENT_MESSAGE_GRID_NO_DATA_FILTERED',
		DraftEmpty: 'MAIL_CLIENT_MESSAGE_GRID_DRAFT_EMPTY',
		EmptyTitle: 'MAIL_CLIENT_MESSAGE_GRID_EMPTY_TITLE',
		EmptyTextFirst: 'MAIL_CLIENT_MESSAGE_GRID_EMPTY_TEXT_1',
		EmptyTextSecond: 'MAIL_CLIENT_MESSAGE_GRID_EMPTY_TEXT_2',
		TariffTitle: 'MAIL_CLIENT_MESSAGE_GRID_TARIFF_TITLE',
		TariffTextFirst: 'MAIL_CLIENT_MESSAGE_GRID_TARIFF_TEXT_1',
		TariffTextSecond: 'MAIL_CLIENT_MESSAGE_GRID_TARIFF_TEXT_2',
		TariffButton: 'MAIL_CLIENT_MESSAGE_GRID_TARIFF_BUTTON',
		SyncLoaderLabel: 'MAIL_CLIENT_MESSAGE_GRID_SYNC_LOADER_LABEL',
		AttachIconHint: 'MAIL_CLIENT_MESSAGE_GRID_ATTACH_ICON_HINT',
		AttachmentLoading: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENT_LOADING',
		AttachmentsMore: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_MORE',
		AttachmentsMoreLabel: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_MORE_LABEL',
		AttachmentsDownload: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_DOWNLOAD',
		AttachmentsDownloadFile: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_DOWNLOAD_FILE',
		AttachmentsListLoading: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_LIST_LOADING',
		AttachmentsListEmpty: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_LIST_EMPTY',
		AttachmentsListError: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_LIST_ERROR',
		ArchiveDownload: 'MAIL_CLIENT_MESSAGE_GRID_ARCHIVE_DOWNLOAD',
		ArchivePreparing: 'MAIL_CLIENT_MESSAGE_GRID_ARCHIVE_PREPARING',
		ArchiveError: 'MAIL_CLIENT_MESSAGE_GRID_ARCHIVE_ERROR'
	});
	const GridColumn = Object.freeze({
		Favorite: 'FAVORITE',
		From: 'FROM',
		Subject: 'SUBJECT',
		Date: 'DATE',
		CrmBind: 'CRM_BIND',
		TaskBind: 'TASK_BIND',
		ChatBind: 'CHAT_BIND',
		PostBind: 'POST_BIND',
		MeetingBind: 'MEETING_BIND'
	});
	const gridPagingKey = Symbol('mailMessageGridPaging');
	const gridSelectionKey = Symbol('mailMessageGridSelection');
	const GridEvent = Object.freeze({
		Updated: 'Grid::updated',
		ThereSelectedRows: 'Grid::thereSelectedRows',
		NoSelectedRows: 'Grid::noSelectedRows',
		AllRowsSelected: 'Grid::allRowsSelected',
		AllRowsUnselected: 'Grid::allRowsUnselected',
		ResetSelection: 'Mail::resetGridSelection',
		DirectoryChanged: 'Mail::directoryChanged',
		UndoSendCancelled: 'Mail.UndoSend:onCancelled',
		FavoritesChanged: 'BX.Mail.Favorites:onChange',
		FilterApplied: 'BX.Main.Filter:apply',
		PanelHidden: 'BX.UI.ActionPanel:hidePanel'
	});
	const CheckAllAttribute = 'data-mail-grid-check-all';
	const RowActionsMenuIdPrefix = 'main-grid-actions-menu-';
	const ScreenListManagerPath = 'BX.Mail.Client.Message.List.mail-client-list-manager';
	const MoveActionIdPrefix = ':move:';
	const UndoSendRowIdPrefix = 'undo-send-';
	const UndoSendPendingRowTestIdPrefix = 'mail-undo-send-pending-row-';
	const BindingKind = Object.freeze({
		Binding: 'binding',
		Action: 'action'
	});
	const AttachmentsView = Object.freeze({
		None: 'none',
		Paperclip: 'paperclip',
		Loading: 'loading',
		Chips: 'chips'
	});

	const ScrollStep = 8;
	const ScrollStepTime = 1000 / 60 / 2;
	const ScrollStartDelay = 100;
	const DocumentScrollDelay = 400;
	const ClassShow = 'show';
	const ClassFadeLeft = 'main-grid-fade-left';
	const ClassFadeRight = 'main-grid-fade-right';
	const TouchClass = 'bx-touch';
	class TableFader {
		#nodes = null;
		#touch = main_core.Dom.hasClass(document.documentElement, TouchClass);
		#scrollStartEvent = this.#touch ? 'touchstart' : 'mouseenter';
		#scrollEndEvent = this.#touch ? 'touchend' : 'mouseleave';
		#scrollTimer = 0;
		#scrollInterval = 0;
		#frame = 0;
		#windowHeight = 0;
		#bodyPosition = new DOMRect();
		#headPosition = new DOMRect();
		#lastTop = null;
		#lastHeight = null;
		#handleToggle = () => {
			this.#toggle();
		};
		#handleDocumentScroll = main_core.Runtime.debounce(() => this.#adjustEarOffset(false), DocumentScrollDelay);
		#handleScrollLeft = event => {
			this.#startScroll(event, -ScrollStep);
		};
		#handleScrollRight = event => {
			this.#startScroll(event, ScrollStep);
		};
		#handleStopScroll = () => {
			this.#stopScroll();
		};
		start(nodes) {
			this.#nodes = nodes;
			main_core.Event.bind(window, 'resize', this.#handleToggle);
			main_core.Event.bind(document, 'scroll', this.#handleDocumentScroll, {
				passive: true
			});
			main_core.Event.bind(nodes.container, 'scroll', this.#handleToggle, {
				passive: true
			});
			main_core.Event.bind(nodes.earLeft, this.#scrollStartEvent, this.#handleScrollLeft);
			main_core.Event.bind(nodes.earRight, this.#scrollStartEvent, this.#handleScrollRight);
			main_core.Event.bind(nodes.earLeft, this.#scrollEndEvent, this.#handleStopScroll);
			main_core.Event.bind(nodes.earRight, this.#scrollEndEvent, this.#handleStopScroll);
			main_core_events.EventEmitter.subscribe(GridEvent.Updated, this.#handleToggle);
			this.#toggle();
		}
		destroy() {
			const nodes = this.#nodes;
			if (!nodes) {
				return;
			}
			main_core.Event.unbind(window, 'resize', this.#handleToggle);
			main_core.Event.unbind(document, 'scroll', this.#handleDocumentScroll, {
				passive: true
			});
			main_core.Event.unbind(nodes.container, 'scroll', this.#handleToggle, {
				passive: true
			});
			main_core.Event.unbind(nodes.earLeft, this.#scrollStartEvent, this.#handleScrollLeft);
			main_core.Event.unbind(nodes.earRight, this.#scrollStartEvent, this.#handleScrollRight);
			main_core.Event.unbind(nodes.earLeft, this.#scrollEndEvent, this.#handleStopScroll);
			main_core.Event.unbind(nodes.earRight, this.#scrollEndEvent, this.#handleStopScroll);
			main_core_events.EventEmitter.unsubscribe(GridEvent.Updated, this.#handleToggle);
			this.#stopScroll();
			cancelAnimationFrame(this.#frame);
			this.#nodes = null;
		}
		#toggle() {
			const nodes = this.#nodes;
			if (!nodes) {
				return;
			}
			this.#adjustEarOffset(true);
			const scrolled = nodes.container.scrollLeft;
			const hasScroll = nodes.table.offsetWidth > nodes.container.clientWidth;
			const seenWidth = Math.round(scrolled + nodes.container.clientWidth);
			this.#toggleEar('left', hasScroll && scrolled > 0);
			this.#toggleEar('right', hasScroll && nodes.table.offsetWidth > seenWidth);
		}
		#toggleEar(side, show) {
			const nodes = this.#nodes;
			if (!nodes) {
				return;
			}
			const ear = side === 'left' ? nodes.earLeft : nodes.earRight;
			const fadeClass = side === 'left' ? ClassFadeLeft : ClassFadeRight;
			if (show) {
				main_core.Dom.addClass(nodes.fade, fadeClass);
				main_core.Dom.addClass(ear, ClassShow);
				return;
			}
			main_core.Dom.removeClass(nodes.fade, fadeClass);
			main_core.Dom.removeClass(ear, ClassShow);
		}
		#adjustEarOffset(measure) {
			const nodes = this.#nodes;
			if (!nodes) {
				return;
			}
			const body = nodes.table.tBodies[0];
			const head = nodes.table.tHead;
			if (!body || !head) {
				return;
			}
			if (measure) {
				this.#windowHeight = window.innerHeight;
				this.#bodyPosition = main_core.Dom.getPosition(body);
				this.#headPosition = main_core.Dom.getPosition(head);
			}
			const headHeight = this.#headPosition.height;
			let height = window.scrollY + this.#windowHeight - this.#bodyPosition.top;
			let top = window.scrollY - this.#bodyPosition.top;
			if (height > this.#bodyPosition.height) {
				height = this.#bodyPosition.height;
			}
			if (top < headHeight) {
				top = headHeight;
			} else {
				height -= top;
				height += headHeight;
			}
			cancelAnimationFrame(this.#frame);
			this.#frame = requestAnimationFrame(() => {
				if (top !== this.#lastTop) {
					const translate = `translate3d(0px, ${top}px, 0)`;
					main_core.Dom.style(nodes.earLeft, 'transform', translate);
					main_core.Dom.style(nodes.earRight, 'transform', translate);
				}
				if (height !== this.#lastHeight) {
					main_core.Dom.style(nodes.earLeft, 'height', `${height}px`);
					main_core.Dom.style(nodes.earRight, 'height', `${height}px`);
				}
				this.#lastTop = top;
				this.#lastHeight = height;
			});
		}
		#startScroll(event, step) {
			const container = this.#nodes?.container;
			if (!container) {
				return;
			}
			if (this.#touch) {
				event.preventDefault();
			}
			let offset = container.scrollLeft;
			this.#scrollTimer = window.setTimeout(() => {
				this.#scrollInterval = window.setInterval(() => {
					offset += step;
					container.scrollLeft = offset;
				}, ScrollStepTime);
			}, ScrollStartDelay);
		}
		#stopScroll() {
			window.clearTimeout(this.#scrollTimer);
			window.clearInterval(this.#scrollInterval);
		}
	}

	class TableStretcher {
		#nodes = null;
		#block = null;
		#handleScroll = () => {
			this.#holdBlockInFrame();
		};
		start(nodes) {
			this.#nodes = nodes;
			main_core.Event.bind(nodes.container, 'scroll', this.#handleScroll, {
				passive: true
			});
		}
		destroy() {
			const nodes = this.#nodes;
			if (!nodes) {
				return;
			}
			main_core.Event.unbind(nodes.container, 'scroll', this.#handleScroll, {
				passive: true
			});
			this.#nodes = null;
			this.#block = null;
		}
		stretch(block) {
			const nodes = this.#nodes;
			if (!nodes) {
				return;
			}
			this.#block = block;
			const place = main_core.Dom.getPosition(nodes.root);
			if (place.height === 0) {
				main_core.Dom.style(nodes.table, 'min-height', null);
				return;
			}
			const windowBottom = window.scrollY + window.innerHeight;
			const roomLeft = windowBottom - place.top - nodes.panels.offsetHeight - this.#paddingOffset();
			main_core.Dom.style(nodes.table, 'min-height', `${Math.max(0, roomLeft)}px`);
			main_core.Dom.style(block, 'width', `${nodes.root.offsetWidth}px`);
			this.#holdBlockInFrame();
		}
		release() {
			const nodes = this.#nodes;
			if (!nodes || !this.#block) {
				return;
			}
			main_core.Dom.style(nodes.table, 'min-height', null);
			main_core.Dom.style(this.#block, 'width', null);
			main_core.Dom.style(this.#block, 'transform', null);
			this.#block = null;
			main_core.Dom.style(nodes.table, 'height', '1px');
			requestAnimationFrame(() => {
				main_core.Dom.style(this.#nodes?.table, 'height', '1px');
			});
		}
		#holdBlockInFrame() {
			const nodes = this.#nodes;
			if (!nodes || !this.#block) {
				return;
			}
			main_core.Dom.style(this.#block, 'transform', `translate3d(${nodes.container.scrollLeft}px, 0px, 0)`);
		}
		#paddingOffset() {
			let offset = 0;
			let parent = this.#nodes?.root.parentElement ?? null;
			while (parent) {
				const style = getComputedStyle(parent);
				offset += (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);
				parent = parent.parentElement;
			}
			return offset;
		}
	}

	const MessageColumns = [{
		id: GridColumn.From,
		headClass: 'mail-msg-list-from-cell-head',
		phrase: Phrase.ColumnFrom,
		showName: false
	}, {
		id: GridColumn.Subject,
		headClass: 'mail-msg-list-subject-cell-head',
		phrase: Phrase.ColumnSubject,
		showName: false
	}, {
		id: GridColumn.Date,
		headClass: 'mail-msg-list-date-cell-head',
		phrase: Phrase.ColumnDate,
		showName: false
	}];
	const FavoriteColumn = {
		id: GridColumn.Favorite,
		headClass: 'mail-msg-list-favorite-cell-head',
		phrase: Phrase.ColumnFavorite,
		showName: true
	};
	const BindingColumns = [{
		id: GridColumn.CrmBind,
		headClass: 'mail-msg-list-crm-cell-head',
		phrase: Phrase.ColumnCrmBind,
		showName: false
	}, {
		id: GridColumn.TaskBind,
		headClass: 'mail-msg-list-task-cell-head',
		phrase: Phrase.ColumnTaskBind,
		showName: false
	}, {
		id: GridColumn.ChatBind,
		headClass: 'mail-msg-list-chat-cell-head',
		phrase: Phrase.ColumnChatBind,
		showName: false
	}, {
		id: GridColumn.PostBind,
		headClass: 'mail-msg-list-post-cell-head',
		phrase: Phrase.ColumnPostBind,
		showName: false
	}, {
		id: GridColumn.MeetingBind,
		headClass: 'mail-msg-list-meeting-cell-head',
		phrase: Phrase.ColumnMeetingBind,
		showName: false
	}];
	function resolveColumns(mode, listImprovementsEnabled) {
		if (mode === GridMode.Draft) {
			return MessageColumns;
		}
		return [...(listImprovementsEnabled ? [FavoriteColumn] : []), ...MessageColumns, ...BindingColumns];
	}

	function loc(phraseCode, replacements = {}) {
		return main_core.Loc.getMessage(phraseCode, replacements) ?? '';
	}
	function locPlural(phraseCode, count, replacements = {}) {
		return main_core.Loc.getMessagePlural(phraseCode, count, replacements) ?? '';
	}

	class ProtectedImage {
		#loads = new Map();
		#decoded = new Map();
		#pending = new Map();
		#controllers = new Set();
		#blobUrls = new Set();
		#generation = 0;
		load(url, cacheIdentity) {
			let address = null;
			try {
				address = new URL(url, window.location.href);
			} catch {
				return Promise.resolve(null);
			}
			if (address.origin !== window.location.origin || !['http:', 'https:'].includes(address.protocol)) {
				return Promise.resolve(null);
			}
			if (cacheIdentity && this.#decoded.has(cacheIdentity)) {
				return Promise.resolve(this.#decoded.get(cacheIdentity) ?? null);
			}
			const existing = this.#loads.get(url);
			if (existing) {
				return existing;
			}
			const generation = this.#generation;
			const previous = cacheIdentity ? this.#pending.get(cacheIdentity) : undefined;
			const load = (async () => {
				if (previous) {
					await previous;
				}
				if (generation !== this.#generation) {
					return null;
				}
				if (cacheIdentity && this.#decoded.has(cacheIdentity)) {
					return this.#decoded.get(cacheIdentity) ?? null;
				}
				const blobUrl = await this.#loadUrl(address.href, generation);
				if (blobUrl && cacheIdentity) {
					this.#decoded.set(cacheIdentity, blobUrl);
				}
				return blobUrl;
			})();
			this.#loads.set(url, load);
			if (cacheIdentity) {
				this.#pending.set(cacheIdentity, load);
				void load.then(() => {
					if (this.#pending.get(cacheIdentity) === load) {
						this.#pending.delete(cacheIdentity);
					}
				});
			}
			return load;
		}
		async #loadUrl(url, generation) {
			const controller = new AbortController();
			this.#controllers.add(controller);
			try {
				const response = await fetch(url, {
					credentials: 'same-origin',
					signal: controller.signal
				});
				const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
				if (!response.ok || contentType !== 'image/png') {
					return null;
				}
				const blob = await response.blob();
				if (controller.signal.aborted || generation !== this.#generation) {
					return null;
				}
				const blobUrl = URL.createObjectURL(blob);
				this.#blobUrls.add(blobUrl);
				try {
					const image = new Image();
					image.src = blobUrl;
					await image.decode();
				} catch {
					if (this.#blobUrls.delete(blobUrl)) {
						URL.revokeObjectURL(blobUrl);
					}
					return null;
				}
				return controller.signal.aborted || generation !== this.#generation ? null : blobUrl;
			} catch {
				return null;
			} finally {
				this.#controllers.delete(controller);
			}
		}
		retain(cacheIdentities) {
			this.#generation += 1;
			for (const controller of this.#controllers) {
				controller.abort();
			}
			this.#controllers.clear();
			const retainedUrls = new Set();
			for (const [identity, blobUrl] of this.#decoded) {
				if (cacheIdentities.has(identity)) {
					retainedUrls.add(blobUrl);
				} else {
					this.#decoded.delete(identity);
				}
			}
			for (const blobUrl of this.#blobUrls) {
				if (!retainedUrls.has(blobUrl)) {
					URL.revokeObjectURL(blobUrl);
				}
			}
			this.#blobUrls = retainedUrls;
			this.#loads.clear();
			this.#pending.clear();
		}
		clear() {
			this.retain(new Set());
		}
	}
	const resources = new WeakMap();
	function protectedImageFor(grid) {
		let resource = resources.get(grid);
		if (!resource) {
			resource = new ProtectedImage();
			resources.set(grid, resource);
		}
		return resource;
	}

	const IdPlaceholder$1 = '__MESSAGE_ID__';
	function buildMessageHref(template, messageId) {
		return template.replaceAll(IdPlaceholder$1, String(messageId));
	}

	const IdPlaceholder = '__ENTITY_ID__';
	const RowHrefTemplate = Object.freeze({
		TaskCreate: 'taskCreate',
		TaskView: 'taskView',
		PostCreate: 'postCreate',
		PostView: 'postView',
		CalendarEvent: 'calendarEvent'
	});
	const BoundTemplate = {
		task: RowHrefTemplate.TaskView,
		post: RowHrefTemplate.PostView,
		meeting: RowHrefTemplate.CalendarEvent
	};
	const CreateTemplate = {
		task: RowHrefTemplate.TaskCreate,
		post: RowHrefTemplate.PostCreate
	};
	function emptyRowHrefTemplates() {
		return {
			taskCreate: '',
			taskView: '',
			postCreate: '',
			postView: '',
			calendarEvent: ''
		};
	}
	function rowHrefTemplates(given = {}) {
		return {
			...emptyRowHrefTemplates(),
			...given
		};
	}
	function fillEntityId(template, entityId) {
		return template === '' ? '' : template.replaceAll(IdPlaceholder, entityId);
	}
	function encodeRfc3986(value) {
		return encodeURIComponent(value).replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
	}
	function fillParams(template, params) {
		if (template === '') {
			return '';
		}
		const query = Object.entries(params).map(([name, value]) => `${encodeRfc3986(name)}=${encodeRfc3986(String(value))}`).join('&');
		if (query === '') {
			return template;
		}
		return `${template}${template.includes('?') ? '&' : '?'}${query}`;
	}
	function fillBindingHrefs(bindings, templates) {
		bindings.forEach(binding => {
			const boundTemplate = BoundTemplate[binding.type ?? ''];
			const createTemplate = CreateTemplate[binding.type ?? ''];
			if (binding.bindId !== null && boundTemplate) {
				binding.bindHref = fillEntityId(templates[boundTemplate], binding.bindId) || null;
			}
			binding.createHref = binding.createParams && createTemplate ? fillParams(templates[createTemplate], binding.createParams) || null : null;
		});
	}
	function fillActionHrefs(actions, templates) {
		actions.forEach(action => {
			if (action.items) {
				fillActionHrefs(action.items, templates);
			}
			if (action.hrefTemplate) {
				action.href = fillParams(templates[action.hrefTemplate], action.hrefParams ?? {});
			}
		});
	}

	function appendHrefIds(accumulated, incoming) {
		if (accumulated.length === 0 || incoming.length === 0) {
			return [...accumulated, ...incoming];
		}
		const repeats = incoming[0] === accumulated[accumulated.length - 1];
		return [...accumulated, ...(repeats ? incoming.slice(1) : incoming)];
	}
	function pageRows(payload, messageHrefTemplate, hrefTemplates) {
		return payload.rows.map(row => {
			fillActionHrefs(row.actions, hrefTemplates);
			ui_vue3.markRaw(row.actions);
			if ('bindings' in row) {
				fillBindingHrefs(row.bindings, hrefTemplates);
				ui_vue3.markRaw(row.bindings);
				row.href.url = buildMessageHref(messageHrefTemplate, row.messageId);
			}
			return row;
		});
	}
	const useGridStore = ui_vue3_pinia.defineStore('mailMessageGrid', {
		state: () => ({
			mode: GridMode.Message,
			screen: null,
			folders: [],
			rows: [],
			projections: [],
			selectedIds: [],
			hiddenIds: [],
			stickyAll: false,
			restoreIds: [],
			page: 1,
			enableNextPage: false,
			hrefIds: [],
			filterApplied: false,
			messageHrefTemplate: '',
			hrefTemplates: emptyRowHrefTemplates(),
			total: null,
			loadingPage: false,
			pageFailed: false,
			pageSyncBlocked: false,
			pageLimitReached: false,
			reloadPending: false,
			syncing: false,
			stubArmed: false,
			faded: false,
			migrationLockedMailboxIds: []
		}),
		getters: {
			gridId(state) {
				return state.screen?.gridId ?? '';
			},
			isEmpty(state) {
				return state.rows.length === 0 && state.projections.length === 0;
			},
			nextPageOffered(state) {
				return state.enableNextPage && !state.pageLimitReached && state.rows.length > 0;
			},
			pageNoteDrawn(state) {
				return state.pageFailed || state.pageLimitReached;
			},
			footDrawn(state) {
				return this.nextPageOffered || this.pageNoteDrawn;
			},
			selectedIdSet(state) {
				return new Set(state.selectedIds);
			},
			migrationLockedMailboxIdSet(state) {
				return new Set(state.migrationLockedMailboxIds);
			},
			selectedRows(state) {
				const marked = this.selectedIdSet;
				return state.rows.filter(row => marked.has(row.id));
			},
			messageRows(state) {
				return state.mode === GridMode.Message ? state.rows : [];
			},
			draftRows(state) {
				return state.mode === GridMode.Draft ? state.rows : [];
			},
			pageSwapperHrefList(state) {
				return state.hrefIds.map(id => ({
					ID: id,
					HREF: buildMessageHref(state.messageHrefTemplate, id)
				}));
			}
		},
		actions: {
			initialize(mode, screen, page, 
			folders = [],
			messageHrefTemplate = '', 
			hrefTemplates = emptyRowHrefTemplates()) {
				this.mode = mode;
				this.screen = {
					...screen
				};
				this.folders = [...folders];
				this.messageHrefTemplate = messageHrefTemplate;
				this.hrefTemplates = {
					...hrefTemplates
				};
				this.setPage(page);
			},
			setPage(payload) {
				const rows = pageRows(payload, this.messageHrefTemplate, this.hrefTemplates);
				const retainedIdentities = new Set();
				if (this.mode === GridMode.Message) {
					for (const row of rows) {
						const avatar = row.sender.avatar;
						if (avatar.protected && avatar.src && avatar.cacheIdentity) {
							retainedIdentities.add(avatar.cacheIdentity);
						}
					}
				}
				protectedImageFor(this).retain(retainedIdentities);
				this.rows = rows;
				this.projections = [...(payload.projections ?? [])];
				this.selectedIds = [];
				this.hiddenIds = [];
				this.faded = false;
				if (!this.isEmpty) {
					this.syncing = false;
				}
				this.page = payload.page;
				this.enableNextPage = payload.enableNextPage;
				this.pageLimitReached = payload.pageLimitReached ?? false;
				this.hrefIds = [...(payload.hrefIds ?? [])];
				this.filterApplied = payload.filterApplied ?? false;
				this.total = payload.total ?? null;
			},
			setFavorite(rowId, isFavorite) {
				const row = this.rows.find(candidate => candidate.id === rowId);
				if (row) {
					row.isFavorite = isFavorite;
				}
			},
			appendPage(payload) {
				this.rows = [...this.rows, ...pageRows(payload, this.messageHrefTemplate, this.hrefTemplates)];
				this.page = payload.page;
				this.enableNextPage = payload.enableNextPage;
				this.pageLimitReached = payload.pageLimitReached ?? false;
				this.hrefIds = appendHrefIds(this.hrefIds, payload.hrefIds ?? []);
				this.filterApplied = payload.filterApplied ?? this.filterApplied;
				this.total = payload.total ?? this.total;
			},
			clearProtectedImages() {
				protectedImageFor(this).clear();
			},
			addProjection(row, prepend) {
				const kept = this.projections.filter(stored => stored.id !== row.id);
				this.projections = prepend ? [row, ...kept] : [...kept, row];
			},
			dropProjection(id) {
				this.projections = this.projections.filter(kept => kept.id !== id);
			},
			setSelection(ids) {
				this.selectedIds = [...ids];
			},
			setHiddenIds(ids) {
				this.hiddenIds = [...ids];
			},
			setStickyAll(on) {
				this.stickyAll = on;
			},
			setRestoreIds(ids) {
				this.restoreIds = [...ids];
			},
			setPageLoading(loading) {
				this.loadingPage = loading;
			},
			setPageFailed(failed) {
				this.pageFailed = failed;
				if (!failed) {
					this.pageSyncBlocked = false;
					this.pageLimitReached = false;
				}
			},
			setPageSyncBlocked(blocked) {
				this.pageSyncBlocked = blocked;
			},
			setPageLimitReached(reached) {
				this.pageLimitReached = reached;
			},
			setReloadPending(pending) {
				this.reloadPending = pending;
			},
			setSyncing(syncing) {
				this.syncing = syncing;
			},
			setMigrationLockedMailboxIds(ids) {
				this.migrationLockedMailboxIds = [...ids];
			},
			setListSection(section) {
				if (this.screen) {
					this.screen.listSection = section;
				}
			},
			setFaded(faded) {
				this.faded = faded;
			},
			armStub() {
				this.stubArmed = true;
			}
		}
	});

	function resolveGlobal(path) {
		return main_core.Reflection.getClass(path) ?? null;
	}

	function openDraft(draftId) {
		resolveGlobal(ScreenListManagerPath)?.openDraft(draftId);
	}

	const OwnControlSelector = ['a', '.main-grid-cell-checkbox', '.main-grid-cell-action', `[data-role="${DataRole.Favorite}"]`, `[data-role="${DataRole.AttachmentChip}"]`, `[data-role="${DataRole.AttachmentsStack}"]`].join(',');
	function marksRow(event) {
		if (event.target.closest(OwnControlSelector)) {
			return false;
		}
		return (window.getSelection()?.toString() ?? '').length === 0;
	}

	const MenuOffsetTop = 26;
	const MenuOffsetLeft = 30;
	const MenuAngleOffset = 8;
	const MenuItemSelector = '.menu-popup-item';
	const builtMenuIds = new Map();
	let listeningToRowsChange = false;
	function menuId(rowId) {
		return `${RowActionsMenuIdPrefix}${rowId}`;
	}
	function rememberMenu(gridId, id) {
		const built = builtMenuIds.get(gridId) ?? new Set();
		built.add(id);
		builtMenuIds.set(gridId, built);
	}
	function destroyMenusOf(gridId) {
		builtMenuIds.get(gridId)?.forEach(id => main_popup.MenuManager.destroy(id));
		builtMenuIds.delete(gridId);
	}
	function destroyEveryMenu() {
		builtMenuIds.forEach(built => {
			built.forEach(id => main_popup.MenuManager.destroy(id));
		});
		builtMenuIds.clear();
	}
	function listenToRowsChange() {
		if (listeningToRowsChange) {
			return;
		}
		listeningToRowsChange = true;
		main_core_events.EventEmitter.subscribe(GridEvent.Updated, event => {
			const [grid] = event.getCompatData() ?? [];
			if (grid && main_core.Type.isFunction(grid.getId)) {
				destroyMenusOf(grid.getId());
				return;
			}
			destroyEveryMenu();
		});
	}
	function isMoveAction(action) {
		return action.id.startsWith(MoveActionIdPrefix);
	}
	function resolveSubItems(action, folders) {
		if (isMoveAction(action)) {
			return folders;
		}
		return action.items?.map(item => toMenuItem(item, folders));
	}
	function withFolderSubmenus(actions, folders) {
		return actions.map(action => isMoveAction(action) ? {
			...action,
			items: folders
		} : action);
	}
	function toMenuItem(action, folders) {
		return {
			id: action.id,
			html: action.html,
			text: action.text,
			title: action.title,
			className: action.className,
			href: action.href,
			disabled: action.disabled,
			dataset: action.dataset,
			onclick: action.onclick,
			gridRowId: action.gridRowId,
			items: resolveSubItems(action, folders)
		};
	}
	function closeOnItemClick(menu) {
		main_core.Event.bind(menu.getMenuContainer(), 'click', event => {
			const item = event.target.closest(MenuItemSelector);
			if (!item || !item.dataset.preventCloseContextMenu) {
				menu.close();
			}
		});
	}
	function setExpanded(bindElement, expanded) {
		main_core.Dom.attr(bindElement, 'aria-expanded', expanded ? 'true' : 'false');
	}
	function createMenu(options) {
		const {
			height
		} = options.bindElement.getBoundingClientRect();
		const items = options.actions.map(action => toMenuItem(action, options.folders));
		const menu = main_popup.MenuManager.create(menuId(options.rowId), options.bindElement, items, {
			autoHide: true,
			offsetTop: -(height / 2 + MenuOffsetTop),
			offsetLeft: MenuOffsetLeft,
			angle: {
				position: 'left',
				offset: height / 2 - MenuAngleOffset
			},
			events: {
				onShow: () => setExpanded(options.bindElement, true),
				onClose: () => setExpanded(options.bindElement, false),
				onDestroy: () => setExpanded(options.bindElement, false)
			}
		});
		rememberMenu(options.gridId, menuId(options.rowId));
		closeOnItemClick(menu);
		listenToRowsChange();
		return menu;
	}
	function dropRowActionsMenus(gridId) {
		destroyMenusOf(gridId);
	}
	function getRowActionsMenu(rowId) {
		return main_popup.MenuManager.getMenuById(menuId(rowId));
	}
	function toggleRowActionsMenu(options) {
		const menu = getRowActionsMenu(options.rowId) ?? createMenu(options);
		if (menu.isShown()) {
			menu.close();
			return;
		}
		menu.show();
	}

	const RowActions = ui_vue3.defineComponent({
		name: 'MailMessageGridRowActions',
		props: {
			rowId: {
				type: String,
				required: true
			},
			actions: {
				type: Array,
				required: true
			}
		},
		setup() {
			return {
				grid: useGridStore(),
				testId: TestId.RowActions
			};
		},
		computed: {
			label() {
				return loc(this.grid.mode === GridMode.Draft ? Phrase.DraftActions : Phrase.RowActions);
			}
		},
		methods: {
			handleClick() {
				toggleRowActionsMenu({
					gridId: this.grid.gridId,
					rowId: this.rowId,
					actions: this.actions,
					folders: this.grid.folders,
					bindElement: this.$el
				});
			}
		},
		template: `
		<a
			href="#"
			class="main-grid-row-action-button"
			:data-testid="testId"
			:aria-label="label"
			aria-haspopup="true"
			aria-expanded="false"
			@click.prevent="handleClick"
		></a>
	`
	});

	const Checkbox = ui_system_checkbox.Vue.Checkbox;
	const LegacyCheckboxClass = 'main-grid-row-checkbox';
	const RowCheckbox = ui_vue3.defineComponent({
		name: 'MailMessageGridRowCheckbox',
		components: {
			Checkbox
		},
		props: {
			rowId: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				grid: useGridStore(),
				selection: ui_vue3.inject(gridSelectionKey),
				testId: TestId.RowCheckbox,
				legacyClass: LegacyCheckboxClass
			};
		},
		computed: {
			checked() {
				return this.grid.selectedIdSet.has(this.rowId);
			},
			label() {
				return loc(this.grid.mode === GridMode.Draft ? Phrase.DraftSelect : Phrase.RowSelect);
			}
		},
		methods: {
			handleChange() {
				this.selection?.toggleRow(this.rowId);
			}
		},
		template: `
		<Checkbox
			:modelValue="checked"
			:class="legacyClass"
			:data-testid="testId"
			:aria-label="label"
			@update:modelValue="handleChange"
		/>
	`
	});

	const DraftRow = ui_vue3.defineComponent({
		name: 'MailMessageGridDraftRow',
		components: {
			RowActions,
			RowCheckbox
		},
		props: {
			row: {
				type: Object,
				required: true
			},
			columns: {
				type: Array,
				required: true
			}
		},
		setup() {
			return {
				grid: useGridStore(),
				selection: ui_vue3.inject(gridSelectionKey),
				column: GridColumn,
				attachIconTestId: TestId.AttachIcon,
				recipientsTestId: TestId.DraftRecipientsLink,
				subjectTestId: TestId.DraftSubjectLink
			};
		},
		computed: {
			testId() {
				return `${DraftRowTestIdPrefix}${this.row.draftId}`;
			},
			selected() {
				return this.grid.selectedIdSet.has(this.row.id);
			},
			recipients() {
				return this.row.recipients.names.join(loc(Phrase.AddressSeparator));
			},
			noRecipients() {
				return loc(Phrase.DraftNoRecipients);
			},
			attachHint() {
				return loc(Phrase.AttachIconHint);
			}
		},
		methods: {
			handleClick(event) {
				if (marksRow(event)) {
					this.selection?.toggleRow(this.row.id);
				}
			},
			handleOpen() {
				openDraft(this.row.draftId);
			}
		},
		template: `
		<tr
			class="main-grid-row main-grid-row-body"
			:class="{ 'main-grid-row-checked': selected }"
			:data-id="row.id"
			:data-draft-id="row.draftId"
			:data-testid="testId"
			@click="handleClick"
		>
			<td class="main-grid-cell main-grid-cell-checkbox">
				<span class="main-grid-cell-content"><RowCheckbox :rowId="row.id"/></span>
			</td>
			<td class="main-grid-cell main-grid-cell-action">
				<span class="main-grid-cell-content">
					<RowActions v-if="row.actions.length > 0" :rowId="row.id" :actions="row.actions"/>
				</span>
			</td>
			<td
				v-for="head in columns"
				:key="head.id"
				class="main-grid-cell main-grid-cell-left"
				:data-column-id="head.id"
			>
				<div class="main-grid-cell-inner">
					<span class="main-grid-cell-content">
						<span
							v-if="head.id === column.From"
							class="mail-name-block mail-msg-list-cell-nowrap mail-msg-list-cell-flex"
						>
							<a class="mail-msg-from-title" :data-testid="recipientsTestId" @click="handleOpen"><span
								v-if="row.recipients.isEmpty"
								class="mail-draft-no-recipients"
							>{{ noRecipients }}</span><template v-else>{{ recipients }}</template></a>
						</span>
						<span
							v-else-if="head.id === column.Subject"
							class="mail-title-block mail-msg-list-cell-flex"
						>
							<a
								class="mail-msg-list-subject"
								:data-testid="subjectTestId"
								:title="row.subject"
								@click="handleOpen"
							>{{ row.subject }}</a>
							<span v-if="row.preview" class="mail-draft-body-preview"> &mdash; {{ row.preview }}</span>
							<span
								v-if="row.hasAttachments"
								class="mail-msg-list-attach-icon"
								role="img"
								:data-testid="attachIconTestId"
								:title="attachHint"
							></span>
						</span>
						<span v-else-if="head.id === column.Date" :title="row.date.title"><span
							class="mail-msg-date-title"
						>{{ row.date.short }}</span></span>
					</span>
				</div>
			</td>
			<td class="main-grid-cell"></td>
		</tr>
	`
	});

	function isListImprovementsEnabled() {
		return main_core.Loc.getMessage('MAIL_LIST_IMPROVEMENTS_ENABLED') === 'Y';
	}
	function isArchiveDownloadAvailable() {
		return main_core.Loc.getMessage('MAIL_LIST_ARCHIVE_DOWNLOAD_AVAILABLE') === 'Y';
	}
	function isMailboxAvailable() {
		return main_core.Loc.getMessage('MAILBOX_IS_SYNC_AVAILABILITY') === '1';
	}
	function isSyncStubOffered() {
		return main_core.Loc.getMessage('MAIL_MESSAGE_GRID_SYNC_STUB') === 'Y';
	}

	const ExpandLicenseUrl = '/settings/license_all.php';
	const EmptyStub = ui_vue3.defineComponent({
		name: 'MailMessageGridEmptyStub',
		setup() {
			return {
				screenAllowsMailbox: isMailboxAvailable(),
				grid: useGridStore()
			};
		},
		computed: {
			mailboxAvailable() {
				return this.screenAllowsMailbox && !this.grid.pageSyncBlocked;
			},
			testId() {
				return this.mailboxAvailable ? TestId.EmptyStub : TestId.TariffStub;
			},
			title() {
				return loc(this.mailboxAvailable ? Phrase.EmptyTitle : Phrase.TariffTitle);
			},
			paragraphs() {
				return this.mailboxAvailable ? [loc(Phrase.EmptyTextFirst), loc(Phrase.EmptyTextSecond)] : [loc(Phrase.TariffTextFirst), loc(Phrase.TariffTextSecond)];
			},
			buttonText() {
				return loc(Phrase.TariffButton);
			},
			buttonTestId() {
				return TestId.TariffButton;
			}
		},
		methods: {
			handleExpandClick() {
				window.open(ExpandLicenseUrl, '_blank');
			}
		},
		template: `
		<div class="mail-msg-list-grid-empty" :data-testid="testId">
			<div class="mail-msg-list-grid-empty-inner">
				<div class="mail-msg-list-grid-empty-title">{{ title }}</div>
				<p v-for="text in paragraphs" :key="text" class="mail-msg-list-grid-empty-text">{{ text }}</p>
			</div>
			<template v-if="!mailboxAvailable">
				<!-- what stands between the words and the button of the old stub, kept as it stands there -->
				<br>
				<button
					type="button"
					class="ui-btn ui-btn-round ui-btn-lg ui-btn-success"
					:data-testid="buttonTestId"
					@click="handleExpandClick"
				>{{ buttonText }}</button>
			</template>
		</div>
	`
	});

	function isDangerous(action) {
		return action.dataset?.migrationDangerous === true;
	}
	function rememberLockedMailboxes(registry, mailboxIds) {
		const ids = [...mailboxIds].map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0);
		const kept = registry.migrationLockedMailboxIds;
		const same = ids.length === kept.length && ids.every(id => kept.includes(id));
		if (same) {
			return false;
		}
		registry.setMigrationLockedMailboxIds(ids);
		return true;
	}
	function lockDangerousActions(actions) {
		return actions.map(action => isDangerous(action) ? {
			...action,
			disabled: true,
			onclick: undefined
		} : action);
	}

	function isFavoriteOffered(favoriteAvailable, listImprovementsEnabled) {
		return listImprovementsEnabled && favoriteAvailable;
	}

	const BindingCell = ui_vue3.defineComponent({
		name: 'MailMessageGridBindingCell',
		props: {
			binding: {
				type: Object,
				required: true
			},
			rowId: {
				type: String,
				required: true
			},
			messageId: {
				type: Number,
				required: true
			}
		},
		computed: {
			isAction() {
				return this.binding.kind === BindingKind.Action;
			},
			nodeClass() {
				return this.isAction ? ['mail-ui-action-data'] : ['mail-ui-binding-data', `js-bind-${this.messageId}`];
			},
			attributes() {
				const attrs = {
					'message-id': this.rowId,
					'message-simple-id': String(this.messageId)
				};
				if (this.binding.errorType !== null) {
					attrs['error-type'] = this.binding.errorType;
				}
				if (this.isAction) {
					attrs['action-type'] = BindingKind.Action;
					if (this.binding.actionId !== null) {
						attrs['action-id'] = this.binding.actionId;
					}
					return attrs;
				}
				if (this.binding.bindId !== null) {
					attrs['bind-id'] = this.binding.bindId;
				}
				if (this.binding.bindHref !== null) {
					attrs['bind-href'] = this.binding.bindHref;
				}
				if (this.binding.createHref !== null) {
					attrs['create-href'] = this.binding.createHref;
				}
				if (this.binding.type !== null) {
					attrs['bind-type'] = this.binding.type;
				}
				return attrs;
			}
		},
		template: `
		<span v-once :class="nodeClass" v-bind="attributes"></span>
	`
	});

	const DateCell = ui_vue3.defineComponent({
		name: 'MailMessageGridDateCell',
		props: {
			date: {
				type: Object,
				required: true
			},
			rowId: {
				type: String,
				required: true
			},
			unseen: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			cellClass() {
				return {
					'mail-msg-list-date-block': true,
					[`mail-msg-list-cell-${this.rowId}`]: true,
					'mail-msg-list-cell-unseen': this.unseen
				};
			}
		},
		template: `
		<span :class="cellClass" :title="date.title">
			<span class="mail-msg-date-title">{{ date.short }}</span>
		</span>
	`
	});

	const Action = 'mail.api.message.setFavoriteState';
	const transport$2 = main_core.ajax;
	const FavoriteApi = {
		async setState(rowId, isFavorite) {
			await transport$2.runAction(Action, {
				data: {
					id: rowId,
					isFavorite: isFavorite ? 'Y' : 'N'
				}
			});
		}
	};

	async function toggleFavorite(registry, rowId, isFavorite) {
		const target = !isFavorite;
		registry.setFavorite(rowId, target);
		ui_a11y.LiveAnnouncer.announce(loc(target ? Phrase.FavoriteAdded : Phrase.FavoriteRemoved));
		try {
			await FavoriteApi.setState(rowId, target);
			main_core_events.EventEmitter.emit(GridEvent.FavoritesChanged, {
				id: rowId,
				isFavorite: target
			});
		} catch {
			registry.setFavorite(rowId, isFavorite);
			ui_a11y.LiveAnnouncer.announce(loc(Phrase.FavoriteError));
		}
	}

	const FavoriteStar = ui_vue3.defineComponent({
		name: 'MailMessageGridFavoriteStar',
		props: {
			rowId: {
				type: String,
				required: true
			},
			isFavorite: {
				type: Boolean,
				required: true
			}
		},
		setup() {
			return {
				grid: useGridStore(),
				dataRole: DataRole.Favorite,
				testId: TestId.FavoriteButton
			};
		},
		computed: {
			label() {
				return loc(Phrase.FavoriteLabel);
			}
		},
		methods: {
			handleClick() {
				void toggleFavorite(this.grid, this.rowId, this.isFavorite);
			}
		},
		template: `
		<button
			type="button"
			class="mail-msg-list-favorite"
			:class="{ '--active': isFavorite }"
			:data-role="dataRole"
			:data-testid="testId"
			:data-favorite-id="rowId"
			:aria-pressed="isFavorite ? 'true' : 'false'"
			:aria-label="label"
			@click="handleClick"
			@keydown.space.prevent="handleClick"
		><span class="mail-msg-list-favorite__icon"></span></button>
	`
	});

	const OpenEvent = 'mail:openMessageForView';
	function getTopSidePanel() {
		const topBx = window.top?.BX;
		return topBx?.SidePanel ?? null;
	}
	function openMessage(messageId, href) {
		main_core_events.EventEmitter.emit(OpenEvent, new main_core_events.BaseEvent({
			compatData: [{
				id: String(messageId)
			}]
		}));
		getTopSidePanel()?.Instance?.open(href.url, href.sliderData);
	}

	function resolveInitialsFontSize(size) {
		const half = Math.floor(size / 2);
		return half - Math.abs(size % 2 - half % 2);
	}
	function encodeAvatarUrl(src) {
		return encodeURI(src).replaceAll("'", '%27');
	}
	const visibilityObservers = new WeakMap();
	function observeProtectedAvatar(resource, element, listener) {
		if (!globalThis.IntersectionObserver) {
			listener(true);
			return () => {};
		}
		let shared = visibilityObservers.get(resource);
		if (!shared) {
			const listeners = new Map();
			shared = {
				listeners,
				observer: new IntersectionObserver(entries => {
					for (const entry of entries) {
						listeners.get(entry.target)?.(entry.isIntersecting);
					}
				})
			};
			visibilityObservers.set(resource, shared);
		}
		shared.listeners.set(element, listener);
		shared.observer.observe(element);
		return () => {
			shared.listeners.delete(element);
			shared.observer.unobserve(element);
			if (shared.listeners.size === 0) {
				shared.observer.disconnect();
				visibilityObservers.delete(resource);
			}
		};
	}
	const SenderAvatar = ui_vue3.defineComponent({
		name: 'MailMessageGridSenderAvatar',
		props: {
			avatar: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				images: ui_vue3.markRaw(protectedImageFor(useGridStore()))
			};
		},
		data() {
			return {
				requestedAvatar: null,
				requestedSrc: null,
				requestedCacheIdentity: null,
				loadedSrc: null,
				imageFailed: false,
				requestId: 0,
				startedRequestId: -1,
				isMounted: false,
				isVisible: false,
				stopObserving: null
			};
		},
		computed: {
			displayAvatar() {
				if (this.avatar.protected) {
					if (this.loadedSrc && !this.imageFailed) {
						return {
							kind: 'image',
							size: this.avatar.size
						};
					}
					return this.avatar.fallback ?? {
						kind: 'default',
						size: this.avatar.size
					};
				}
				return this.avatar;
			},
			modifierClass() {
				return `--${this.displayAvatar.kind}`;
			},
			boxStyle() {
				const size = `${this.displayAvatar.size}px`;
				const style = {
					width: size,
					minWidth: size,
					height: size,
					minHeight: size,
					fontSize: `${resolveInitialsFontSize(this.displayAvatar.size)}px`,
					lineHeight: size
				};
				if (this.displayAvatar.kind === 'image' && this.displayAvatar.src) {
					style.backgroundImage = `url('${encodeAvatarUrl(this.displayAvatar.src)}')`;
					style.backgroundSize = `${size} ${size}`;
				}
				if (this.displayAvatar.kind === 'initials' && this.displayAvatar.color) {
					style.backgroundColor = this.displayAvatar.color;
				}
				return style;
			},
			initials() {
				return this.displayAvatar.kind === 'initials' ? this.displayAvatar.initials ?? '' : '';
			}
		},
		watch: {
			avatar: {
				immediate: true,
				deep: true,
				handler() {
					this.updateImage();
				}
			}
		},
		mounted() {
			this.isMounted = true;
			this.syncVisibility();
		},
		beforeUnmount() {
			this.isMounted = false;
			this.requestId += 1;
			this.stopObserving?.();
			this.stopObserving = null;
		},
		methods: {
			updateImage() {
				if (this.requestedAvatar === this.avatar && this.requestedSrc === this.avatar.src && this.requestedCacheIdentity === (this.avatar.cacheIdentity ?? null)) {
					return;
				}
				this.requestedAvatar = this.avatar;
				this.requestedSrc = this.avatar.src ?? null;
				this.requestedCacheIdentity = this.avatar.cacheIdentity ?? null;
				this.requestId += 1;
				this.loadedSrc = null;
				this.imageFailed = false;
				this.syncVisibility();
				if (this.isVisible) {
					void this.loadImage();
				}
			},
			syncVisibility() {
				if (!this.isMounted) {
					return;
				}
				if (!this.avatar.protected || !this.avatar.src) {
					this.stopObserving?.();
					this.stopObserving = null;
					this.isVisible = false;
					return;
				}
				if (!this.stopObserving) {
					this.stopObserving = observeProtectedAvatar(this.images, this.$el, visible => {
						if (!this.isMounted) {
							return;
						}
						this.isVisible = visible;
						if (visible) {
							void this.loadImage();
						}
					});
				}
			},
			async loadImage() {
				if (!this.isMounted || !this.isVisible || !this.avatar.protected || !this.avatar.src || this.startedRequestId === this.requestId) {
					return;
				}
				const requestId = this.requestId;
				this.startedRequestId = requestId;
				const src = this.avatar.src;
				const loadedSrc = await this.images.load(src, this.avatar.cacheIdentity);
				if (this.isMounted && requestId === this.requestId && this.avatar.src === src) {
					this.loadedSrc = loadedSrc;
				}
			},
			handleImageError() {
				this.imageFailed = true;
			}
		},
		template: `
		<span class="mail-message-grid-avatar" :class="modifierClass" :style="boxStyle" :data-testid="avatar.protected ? 'mail-list-sender-avatar-protected' : null">{{ initials }}<img
				v-if="avatar.protected && loadedSrc && !imageFailed"
				class="mail-message-grid-avatar__image"
				:src="loadedSrc"
				alt=""
				@error="handleImageError"
			></span>
	`
	});

	const SenderCell = ui_vue3.defineComponent({
		name: 'MailMessageGridSenderCell',
		components: {
			SenderAvatar
		},
		props: {
			row: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				dotTestId: TestId.UnseenDot,
				linkTestId: TestId.SenderLink
			};
		},
		computed: {
			cellClass() {
				return {
					'js-spam': this.row.isSpam,
					'mail-msg-list-sender-block': true,
					[`mail-msg-list-cell-${this.row.messageId}`]: true,
					'mail-msg-list-cell-nowrap': true,
					'mail-msg-list-cell-flex': true,
					'mail-msg-list-cell-unseen': this.row.unseen
				};
			},
			addresses() {
				return this.row.sender.addresses;
			},
			separator() {
				return loc(Phrase.AddressSeparator);
			},
			dotLabel() {
				return loc(Phrase.UnseenDotLabel);
			}
		},
		methods: {
			handleOpen() {
				openMessage(this.row.messageId, this.row.href);
			}
		},
		template: `
		<span :data-message-id="row.messageId" :class="cellClass">
			<span class="mail-msg-list-unseen-slot"><span
				class="mail-msg-list-unseen-dot"
				:data-testid="dotTestId"
			><span class="mail-msg-list-unseen-dot-label">{{ dotLabel }}</span></span></span>
			<SenderAvatar :avatar="row.sender.avatar"/>
			<template v-for="(address, index) in addresses" :key="index">
				<template v-if="index > 0">{{ separator }}</template>
				<a
					class="mail-msg-list-sender"
					:data-testid="linkTestId"
					:title="address.title"
					@click="handleOpen"
				>{{ address.text }}</a>
			</template>
		</span>
	`
	});

	const Nothing = {
		kind: AttachmentsView.None,
		restCount: 0
	};
	const Paperclip = {
		kind: AttachmentsView.Paperclip,
		restCount: 0
	};
	const Loading = {
		kind: AttachmentsView.Loading,
		restCount: 0
	};
	function resolveAttachments(facts) {
		if (!facts.listImprovementsEnabled) {
			return facts.hasAttachments ? Paperclip : Nothing;
		}
		if (facts.count !== null && facts.count > 0 && facts.iconCount > 0) {
			return {
				kind: AttachmentsView.Chips,
				restCount: Math.max(facts.count - facts.iconCount, 0)
			};
		}
		if (!facts.hasAttachments) {
			return Nothing;
		}
		return facts.count === null ? Loading : Paperclip;
	}
	const ViewerAttributePrefix = 'data-';
	function prepareViewerAttributes(attrs) {
		const prepared = {};
		if (!attrs) {
			return prepared;
		}
		Object.entries(attrs).forEach(([name, value]) => {
			if (!name.startsWith(ViewerAttributePrefix)) {
				return;
			}
			if (main_core.Type.isNil(value)) {
				prepared[name] = '';
				return;
			}
			if (main_core.Type.isString(value) || main_core.Type.isNumber(value) || main_core.Type.isBoolean(value)) {
				prepared[name] = main_core.Text.decode(String(value));
			}
		});
		return prepared;
	}

	let loading = null;
	let ready = false;
	async function loadInTopWindow() {
		try {
			if (window.top === window) {
				return;
			}
			const topBx = window.top?.BX;
			if (!topBx || main_core.Type.isObject(topBx.UI?.Viewer?.Instance) || !topBx.loadExt) {
				return;
			}
			await topBx.loadExt('ui.viewer');
		} catch {
		}
	}
	function prefetchViewer() {
		loading ??= main_core.Runtime.loadExtension('ui.viewer').then(loadInTopWindow).then(() => {
			ready = true;
		}).catch(() => {
		});
		return loading;
	}
	function openThroughViewer(event, link) {
		if (ready) {
			return;
		}
		event.preventDefault();
		void prefetchViewer().then(() => {
			if (ready && link.isConnected) {
				link.click();
			}
		});
	}

	const Component = 'bitrix:mail.client.message.list';
	const FallbackIcon = 'empty';
	const transport$1 = main_core.ajax;
	function mapFile(raw) {
		const file = main_core.Type.isObjectLike(raw) ? raw : {};
		const {
			name,
			size,
			url,
			viewerAttrs,
			icon
		} = file;
		return {
			name: main_core.Type.isStringFilled(name) ? name : '',
			size: main_core.Type.isStringFilled(size) ? size : '',
			url: main_core.Type.isStringFilled(url) ? url : null,
			viewerAttrs: main_core.Type.isObjectLike(viewerAttrs) ? viewerAttrs : null,
			icon: main_core.Type.isStringFilled(icon) ? icon : FallbackIcon
		};
	}
	const AttachmentApi = {
		async getFiles(messageId) {
			const response = await transport$1.runComponentAction(Component, 'getAttachments', {
				mode: 'class',
				data: {
					messageId
				}
			});
			const attachments = response.data?.attachments;
			return main_core.Type.isArray(attachments) ? attachments.map(raw => mapFile(raw)) : [];
		},
		async getArchiveUrl(messageId) {
			const response = await transport$1.runComponentAction(Component, 'getAttachmentsArchiveUrl', {
				mode: 'class',
				data: {
					messageId
				}
			});
			const data = response.data;
			const archiveUrl = data?.archiveUrl;
			return {
				available: data?.available === true,
				archiveUrl: main_core.Type.isStringFilled(archiveUrl) ? archiveUrl : null
			};
		}
	};

	const ArchiveMinFiles = 2;
	const PopupId$1 = 'mail-msg-list-attachments-popup';
	const SliderIgnoreAttribute$1 = 'data-slider-ignore-autobinding';
	const GridUpdatedEvent = 'Grid::updated';
	const StackSelector = `[data-role="${DataRole.AttachmentsStack}"]`;
	class AttachmentsPopupController {
		#popup = null;
		#messageId = null;
		#reposition = null;
		open(stack) {
			const messageId = stack.getAttribute('data-message-id');
			if (!main_core.Type.isStringFilled(messageId)) {
				return;
			}
			this.destroy();
			this.#messageId = messageId;
			const menu = main_core.Tag.render`
			<div class="mail-msg-list-attachments-menu" data-testid="${TestId.AttachmentsMenu}"></div>
		`;
			main_core.Dom.append(this.#renderStatus(), menu);
			main_core.Event.bind(menu, 'click', event => {
				if (event.target.closest('.mail-msg-list-attachments-menu__download')) {
					this.close();
				}
			});
			const angleOffsetLeft = Math.round(stack.getBoundingClientRect().width / 2);
			this.#popup = new main_popup.Popup({
				id: PopupId$1,
				bindElement: stack,
				content: menu,
				autoHide: true,
				closeByEsc: true,
				cacheable: false,
				angle: true,
				offsetLeft: angleOffsetLeft,
				padding: 0,
				className: 'mail-msg-list-attachments-popup',
				ariaLabel: stack.getAttribute('aria-label') ?? '',
				focusTrap: {
					initialFocus: ['first-tabbable', 'container'],
					restoreFocus: () => this.#getFocusTarget()
				},
				events: {
					onShow: () => {
						this.#setExpanded(true);
						this.#bindReposition();
					},
					onClose: () => {
						this.#setExpanded(false);
						this.#unbindReposition();
					},
					onDestroy: () => {
						this.#setExpanded(false);
						this.#unbindReposition();
						this.#popup = null;
					}
				}
			});
			main_core_events.EventEmitter.subscribe(GridUpdatedEvent, this.#handleGridUpdated);
			this.#popup.show();
			this.#setStatus(menu, loc(Phrase.AttachmentsListLoading));
			void this.#load(Number(messageId), menu);
		}
		close() {
			this.#popup?.close();
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe(GridUpdatedEvent, this.#handleGridUpdated);
			const popup = this.#popup;
			if (!popup) {
				return;
			}
			const content = popup.getContentContainer();
			if (content?.contains(document.activeElement)) {
				this.#getFocusTarget()?.focus({
					preventScroll: true
				});
			}
			popup.destroy();
			this.#popup = null;
		}
		#handleGridUpdated = () => {
			this.destroy();
		};
		async #load(messageId, menu) {
			try {
				const [files] = await Promise.all([AttachmentApi.getFiles(messageId), prefetchViewer()]);
				if (!menu.isConnected) {
					return;
				}
				if (files.length === 0) {
					this.#setStatus(menu, loc(Phrase.AttachmentsListEmpty));
					return;
				}
				this.#fill(menu, files);
			} catch {
				if (menu.isConnected) {
					this.#setStatus(menu, loc(Phrase.AttachmentsListError), true);
				}
			}
		}
		#fill(menu, files) {
			main_core.Dom.clean(menu);
			main_core.Dom.append(this.#renderList(files), menu);
			if (isArchiveDownloadAvailable() && files.length >= ArchiveMinFiles) {
				main_core.Dom.append(this.#renderArchiveFooter(), menu);
			}
			this.#popup?.adjustPosition();
			this.#focusFirst();
		}
		#focusFirst() {
			const focusTrap = this.#popup?.getFocusTrap();
			if (focusTrap?.contains(document.activeElement)) {
				focusTrap.focusFirst();
			}
		}
		#renderStatus() {
			return main_core.Tag.render`
			<div class="mail-msg-list-attachments-menu__status" role="status" aria-live="polite"
				data-testid="${TestId.AttachmentsMenuStatus}"></div>
		`;
		}
		#setStatus(menu, text, isError = false) {
			this.#writeStatus(menu, '.mail-msg-list-attachments-menu__status', text, isError);
		}
		#writeStatus(root, selector, text, isError) {
			const status = root?.querySelector(selector);
			if (!status) {
				return;
			}
			status.textContent = text;
			if (isError) {
				main_core.Dom.addClass(status, '--error');
			} else {
				main_core.Dom.removeClass(status, '--error');
			}
		}
		#renderList(files) {
			const downloadLabel = loc(Phrase.AttachmentsDownload);
			const list = main_core.Tag.render`
			<div class="mail-msg-list-attachments-menu__list" data-testid="${TestId.AttachmentsMenuList}"></div>
		`;
			files.forEach(file => {
				const row = main_core.Tag.render`<div class="mail-msg-list-attachments-menu__item"></div>`;
				const name = main_core.Tag.render`
				<a class="mail-msg-list-attachments-menu__name" data-testid="${TestId.AttachmentsMenuItemView}">
					<span class="mail-msg-list-attachments-menu__icon ui-icon ui-icon-file-${main_core.Text.encode(file.icon)}"
						data-testid="${TestId.AttachmentsMenuItemIcon}" aria-hidden="true"><i></i></span>
					<span class="mail-msg-list-attachments__name">${main_core.Text.encode(file.name)}</span>
					<span class="mail-msg-list-attachments__size">${main_core.Text.encode(file.size)}</span>
				</a>
			`;
				main_core.Dom.append(name, row);
				if (file.url !== null) {
					main_core.Dom.attr(name, 'href', file.url);
					main_core.Dom.attr(name, 'target', '_blank');
					main_core.Dom.attr(name, SliderIgnoreAttribute$1, 'true');
					this.#applyViewerAttributes(name, file.viewerAttrs);
					main_core.Dom.append(this.#renderDownload(file, downloadLabel), row);
				}
				main_core.Dom.append(row, list);
			});
			return list;
		}
		#renderDownload(file, downloadLabel) {
			const fileLabel = file.name === '' ? downloadLabel : loc(Phrase.AttachmentsDownloadFile, {
				'#NAME#': file.name
			});
			const download = main_core.Tag.render`
			<a class="mail-msg-list-attachments-menu__download"
				data-testid="${TestId.AttachmentsMenuItemDownload}"
				title="${main_core.Text.encode(downloadLabel)}" aria-label="${main_core.Text.encode(fileLabel)}"></a>
		`;
			main_core.Dom.attr(download, 'href', file.url);
			main_core.Dom.attr(download, 'download', '');
			main_core.Dom.attr(download, SliderIgnoreAttribute$1, 'true');
			return download;
		}
		#renderArchiveFooter() {
			const footer = main_core.Tag.render`<div class="mail-msg-list-attachments-menu__footer"></div>`;
			const button = main_core.Tag.render`
			<button type="button" class="mail-msg-list-attachments-menu__archive"
				data-testid="${TestId.AttachmentsMenuArchive}">
				<span class="mail-msg-list-attachments-menu__archive-icon" aria-hidden="true"></span>
				<span class="mail-msg-list-attachments-menu__archive-text">${main_core.Text.encode(loc(Phrase.ArchiveDownload))}</span>
			</button>
		`;
			const status = main_core.Tag.render`
			<span class="mail-msg-list-attachments-menu__archive-status" role="status" aria-live="polite"
				data-testid="${TestId.AttachmentsMenuArchiveStatus}"></span>
		`;
			main_core.Event.bind(button, 'click', () => {
				void this.#downloadArchive(button);
			});
			main_core.Dom.append(button, footer);
			main_core.Dom.append(status, footer);
			return footer;
		}
		async #downloadArchive(button) {
			const messageId = Number(this.#messageId);
			const hasMessageId = messageId > 0;
			if (button.getAttribute('aria-disabled') === 'true' || !hasMessageId) {
				return;
			}
			this.#setArchiveLoading(button, true);
			try {
				const archive = await AttachmentApi.getArchiveUrl(messageId);
				if (archive.available && archive.archiveUrl !== null) {
					this.#startDownload(archive.archiveUrl);
					this.#setArchiveLoading(button, false);
					return;
				}
				this.#hideArchiveButton(button);
			} catch {
				this.#setArchiveLoading(button, false);
				this.#setArchiveStatus(button, loc(Phrase.ArchiveError), true);
			}
		}
		#setArchiveStatus(button, text, isError = false) {
			this.#writeStatus(button.closest('.mail-msg-list-attachments-menu'), '.mail-msg-list-attachments-menu__archive-status', text, isError);
		}
		#setArchiveLoading(button, loading) {
			if (loading) {
				main_core.Dom.attr(button, 'aria-disabled', 'true');
				main_core.Dom.attr(button, 'aria-busy', 'true');
				main_core.Dom.addClass(button, '--loading');
				this.#setArchiveStatus(button, loc(Phrase.ArchivePreparing));
				return;
			}
			main_core.Dom.attr(button, 'aria-disabled', null);
			main_core.Dom.attr(button, 'aria-busy', null);
			main_core.Dom.removeClass(button, '--loading');
			this.#setArchiveStatus(button, '');
		}
		#hideArchiveButton(button) {
			this.#setArchiveLoading(button, false);
			const footer = button.closest('.mail-msg-list-attachments-menu__footer') ?? button;
			const menu = footer.closest('.mail-msg-list-attachments-menu');
			const firstFile = menu?.querySelector('.mail-msg-list-attachments-menu__name[href]');
			main_core.Dom.addClass(footer, '--hidden');
			(firstFile ?? this.#getFocusTarget())?.focus({
				preventScroll: true
			});
		}
		#startDownload(url) {
			const anchor = main_core.Tag.render`<a></a>`;
			main_core.Dom.attr(anchor, 'href', url);
			main_core.Dom.attr(anchor, 'download', '');
			main_core.Dom.style(anchor, 'display', 'none');
			main_core.Dom.append(anchor, document.body);
			anchor.click();
			main_core.Dom.remove(anchor);
		}
		#applyViewerAttributes(target, attrs) {
			Object.entries(prepareViewerAttributes(attrs)).forEach(([name, value]) => {
				main_core.Dom.attr(target, name, value);
			});
		}
		#findStack() {
			if (this.#messageId === null) {
				return null;
			}
			return document.querySelector(`${StackSelector}[data-message-id="${this.#messageId}"]`);
		}
		#setExpanded(expanded) {
			const stack = this.#findStack();
			if (stack) {
				main_core.Dom.attr(stack, 'aria-expanded', expanded ? 'true' : 'false');
			}
		}
		#getFocusTarget() {
			return this.#findStack() ?? this.#getGridFallback();
		}
		#getGridFallback() {
			const container = document.querySelector(`[data-role="${DataRole.GridContainer}"]`);
			if (container && !container.hasAttribute('tabindex')) {
				main_core.Dom.attr(container, 'tabindex', '-1');
			}
			return container;
		}
		#bindReposition() {
			if (this.#reposition) {
				return;
			}
			this.#reposition = () => {
				this.#popup?.adjustPosition();
			};
			main_core.Event.bind(document, 'scroll', this.#reposition, true);
		}
		#unbindReposition() {
			if (!this.#reposition) {
				return;
			}
			main_core.Event.unbind(document, 'scroll', this.#reposition, true);
			this.#reposition = null;
		}
	}
	const AttachmentsPopup = new AttachmentsPopupController();

	const SliderIgnoreAttribute = 'data-slider-ignore-autobinding';
	const AttachmentChips = ui_vue3.defineComponent({
		name: 'MailMessageGridAttachmentChips',
		props: {
			messageId: {
				type: Number,
				required: true
			},
			icons: {
				type: Array,
				default: () => []
			},
			restCount: {
				type: Number,
				default: 0
			},
			totalCount: {
				type: Number,
				default: 0
			},
			loading: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				blockTestId: TestId.Attachments,
				chipTestId: TestId.AttachmentChip,
				chipLoadingTestId: TestId.AttachmentChipLoading,
				chipTypeTestId: TestId.AttachmentChipType,
				chipDownloadTestId: TestId.AttachmentChipDownload,
				stackTestId: TestId.AttachmentsStack,
				chipRole: DataRole.AttachmentChip,
				stackRole: DataRole.AttachmentsStack
			};
		},
		computed: {
			loadingText() {
				return loc(Phrase.AttachmentLoading);
			},
			moreText() {
				return loc(Phrase.AttachmentsMore, {
					'#COUNT#': String(this.restCount)
				});
			},
			moreLabel() {
				const label = locPlural(Phrase.AttachmentsMoreLabel, this.totalCount, {
					'#MORE#': this.moreText,
					'#COUNT#': String(this.totalCount)
				});
				return label === '' ? this.moreText : label;
			},
			downloadTitle() {
				return loc(Phrase.AttachmentsDownload);
			},
			chips() {
				return this.icons.map(file => this.prepareChip(file));
			}
		},
		methods: {
			prepareChip(file) {
				return {
					file,
					tag: file.url === null ? 'span' : 'a',
					typeIconClass: `ui-icon ui-icon-file-${file.icon}`,
					attributes: this.chipAttributes(file),
					download: file.url === null ? null : this.downloadAttributes(file.url),
					downloadLabel: this.downloadLabel(file)
				};
			},
			chipAttributes(file) {
				if (file.url === null) {
					return {};
				}
				return {
					href: file.url,
					target: '_blank',
					rel: 'noopener',
					'data-role': this.chipRole,
					'data-testid': TestId.AttachmentChipOpen,
					[SliderIgnoreAttribute]: 'true',
					...prepareViewerAttributes(file.viewerAttrs)
				};
			},
			downloadLabel(file) {
				return file.name === '' ? this.downloadTitle : loc(Phrase.AttachmentsDownloadFile, {
					'#NAME#': file.name
				});
			},
			downloadAttributes(url) {
				return {
					href: url,
					download: '',
					[SliderIgnoreAttribute]: 'true'
				};
			},
			handleIntent(event) {
				if (event.target.closest(`[data-role="${this.chipRole}"]`)) {
					void prefetchViewer();
				}
			},
			handleClick(event) {
				const target = event.target;
				if (target.closest(`[data-role="${this.stackRole}"]`)) {
					return;
				}
				const link = target.closest(`[data-role="${this.chipRole}"]`);
				if (link) {
					openThroughViewer(event, link);
				}
			},
			handleStack(event) {
				event.preventDefault();
				AttachmentsPopup.open(event.currentTarget);
			}
		},
		template: `
		<div
			class="mail-msg-list-attachments"
			:data-testid="blockTestId"
			@pointerover="handleIntent"
			@focusin="handleIntent"
			@click="handleClick"
		>
			<span
				v-if="loading"
				class="mail-msg-list-attachment-chip --loading"
				:data-testid="chipLoadingTestId"
			>{{ loadingText }}</span>
			<template v-else>
				<span
					v-for="(chip, index) in chips"
					:key="index"
					class="mail-msg-list-attachment-chip"
					:data-testid="chipTestId"
				>
					<component
						:is="chip.tag"
						class="mail-msg-list-attachment-chip__open"
						v-bind="chip.attributes"
					>
						<span
							class="mail-msg-list-attachment-chip__type"
							:class="chip.typeIconClass"
							:data-testid="chipTypeTestId"
							aria-hidden="true"
						><i></i></span>
						<span class="mail-msg-list-attachment-chip__name" :title="chip.file.name">{{ chip.file.name }}</span>
						<span v-if="chip.file.size" class="mail-msg-list-attachment-chip__size">{{ chip.file.size }}</span>
					</component>
					<a
						v-if="chip.download"
						class="mail-msg-list-attachment-chip__download"
						:data-testid="chipDownloadTestId"
						v-bind="chip.download"
						:title="downloadTitle"
						:aria-label="chip.downloadLabel"
					><span class="mail-msg-list-attachment-chip__download-icon" aria-hidden="true"></span></a>
				</span>
				<button
					v-if="restCount > 0"
					type="button"
					class="mail-msg-list-attachment-chip --more"
					:data-message-id="messageId"
					:data-role="stackRole"
					:data-testid="stackTestId"
					:title="moreLabel"
					:aria-label="moreLabel"
					aria-haspopup="dialog"
					aria-expanded="false"
					@click="handleStack"
					@keydown.space.prevent="handleStack"
				>{{ moreText }}</button>
			</template>
		</div>
	`
	});

	const SubjectCell = ui_vue3.defineComponent({
		name: 'MailMessageGridSubjectCell',
		components: {
			AttachmentChips
		},
		props: {
			row: {
				type: Object,
				required: true
			},
			listImprovementsEnabled: {
				type: Boolean,
				required: true
			}
		},
		setup() {
			return {
				subjectTestId: TestId.SubjectLink,
				attachIconTestId: TestId.AttachIcon
			};
		},
		computed: {
			cellClass() {
				return {
					'mail-msg-list-subject-block': true,
					[`mail-msg-list-cell-${this.row.id}`]: true,
					'mail-msg-list-cell-old': this.row.isOld,
					'mail-msg-list-cell-unseen': this.row.unseen
				};
			},
			attachments() {
				return resolveAttachments({
					count: this.row.attachments === null ? null : this.row.attachments.count,
					iconCount: this.row.attachments?.icons.length ?? 0,
					hasAttachments: this.row.hasAttachments,
					listImprovementsEnabled: this.listImprovementsEnabled
				});
			},
			hasPaperclip() {
				return this.attachments.kind === AttachmentsView.Paperclip;
			},
			hasChips() {
				return this.attachments.kind === AttachmentsView.Chips;
			},
			isSummaryLoading() {
				return this.attachments.kind === AttachmentsView.Loading;
			},
			icons() {
				return this.row.attachments?.icons ?? [];
			},
			totalCount() {
				return this.row.attachments?.count ?? 0;
			},
			attachHint() {
				return loc(Phrase.AttachIconHint);
			}
		},
		methods: {
			handleOpen() {
				openMessage(this.row.messageId, this.row.href);
			}
		},
		template: `
		<div :class="cellClass">
			<a
				v-if="!hasPaperclip"
				class="mail-msg-list-subject"
				:data-testid="subjectTestId"
				:title="row.subject"
				@click="handleOpen"
			>{{ row.subject }}</a>
			<span v-else class="mail-msg-list-subject-line mail-msg-list-cell-flex">
				<a
					class="mail-msg-list-subject"
					:data-testid="subjectTestId"
					:title="row.subject"
					@click="handleOpen"
				>{{ row.subject }}</a>
				<span
					class="mail-msg-list-attach-icon"
					role="img"
					:data-testid="attachIconTestId"
					:title="attachHint"
				></span>
			</span>
			<AttachmentChips
				v-if="hasChips || isSummaryLoading"
				:messageId="row.messageId"
				:icons="icons"
				:restCount="attachments.restCount"
				:totalCount="totalCount"
				:loading="isSummaryLoading"
			/>
		</div>
	`
	});

	const MessageRow = ui_vue3.defineComponent({
		name: 'MailMessageGridMessageRow',
		components: {
			BindingCell,
			DateCell,
			FavoriteStar,
			RowActions,
			RowCheckbox,
			SenderCell,
			SubjectCell
		},
		props: {
			row: {
				type: Object,
				required: true
			},
			columns: {
				type: Array,
				required: true
			},
			listImprovementsEnabled: {
				type: Boolean,
				required: true
			}
		},
		setup() {
			return {
				grid: useGridStore(),
				selection: ui_vue3.inject(gridSelectionKey),
				column: GridColumn
			};
		},
		computed: {
			bindings() {
				const map = {};
				this.row.bindings.forEach(binding => {
					map[binding.column] = binding;
				});
				return map;
			},
			starOffered() {
				return isFavoriteOffered(this.row.favoriteAvailable, this.listImprovementsEnabled);
			},
			selected() {
				return this.grid.selectedIdSet.has(this.row.id);
			},
			hidden() {
				return this.grid.hiddenIds.includes(this.row.id);
			},
			migrationLocked() {
				return this.grid.migrationLockedMailboxIdSet.has(this.row.mailboxId);
			},
			actions() {
				return this.migrationLocked ? lockDangerousActions(this.row.actions) : this.row.actions;
			}
		},
		methods: {
			cellKey(head) {
				const binding = this.bindings[head.id];
				if (!binding) {
					return head.id;
				}
				return [head.id, binding.bindId, binding.bindHref, binding.createHref, binding.errorType].join('|');
			},
			handleClick(event) {
				if (marksRow(event)) {
					this.selection?.toggleRow(this.row.id);
				}
			}
		},
		template: `
		<tr
			class="main-grid-row main-grid-row-body"
			:class="{ 'main-grid-row-checked': selected, 'js-migration-disabled': migrationLocked }"
			:data-id="row.id"
			:data-mailbox-id="row.mailboxId"
			:unseen="row.unseen ? 'true' : 'false'"
			:new-message="row.isNew ? 'true' : 'false'"
			:style="hidden ? { display: 'none' } : null"
			@click="handleClick"
		>
			<td class="main-grid-cell main-grid-cell-checkbox">
				<span class="main-grid-cell-content"><RowCheckbox :rowId="row.id"/></span>
			</td>
			<td class="main-grid-cell main-grid-cell-action">
				<span class="main-grid-cell-content">
					<RowActions v-if="actions.length > 0" :rowId="row.id" :actions="actions"/>
				</span>
			</td>
			<td
				v-for="head in columns"
				:key="cellKey(head)"
				class="main-grid-cell main-grid-cell-left"
				:data-column-id="head.id"
			>
				<div class="main-grid-cell-inner">
					<span class="main-grid-cell-content">
						<span v-if="head.id === column.Favorite" class="mail-msg-list-status">
							<FavoriteStar v-if="starOffered" :rowId="row.id" :isFavorite="row.isFavorite"/>
						</span>
						<SenderCell v-else-if="head.id === column.From" :row="row"/>
						<SubjectCell
							v-else-if="head.id === column.Subject"
							:row="row"
							:listImprovementsEnabled="listImprovementsEnabled"
						/>
						<DateCell
							v-else-if="head.id === column.Date"
							:date="row.date"
							:rowId="row.id"
							:unseen="row.unseen"
						/>
						<BindingCell
							v-else-if="bindings[head.id]"
							:binding="bindings[head.id]"
							:rowId="row.id"
							:messageId="row.messageId"
						/>
					</span>
				</div>
			</td>
			<td class="main-grid-cell"></td>
		</tr>
	`
	});

	const MoreButton = ui_vue3.defineComponent({
		name: 'MailMessageGridMoreButton',
		setup() {
			return {
				grid: useGridStore(),
				paging: ui_vue3.inject(gridPagingKey),
				testId: TestId.MoreButton,
				errorTestId: TestId.PageError
			};
		},
		computed: {
			moreText() {
				return loc(Phrase.More);
			},
			loadingText() {
				return loc(Phrase.MoreLoading);
			},
			noteText() {
				if (this.grid.pageLimitReached) {
					return loc(Phrase.PageLimit);
				}
				return loc(this.grid.pageSyncBlocked ? Phrase.TariffTextFirst : Phrase.PageError);
			}
		},
		methods: {
			handleClick() {
				void this.paging?.loadNextPage();
			}
		},
		template: `
		<div v-if="grid.footDrawn" class="main-grid-more">
			<div v-if="grid.pageNoteDrawn" class="mail-message-grid__page-error" :data-testid="errorTestId">
				{{ noteText }}
			</div>
			<button
				v-if="grid.nextPageOffered"
				type="button"
				class="main-grid-more-btn"
				:class="{ load: grid.loadingPage }"
				:data-testid="testId"
				:disabled="grid.loadingPage"
				@click="handleClick"
			><span class="main-grid-more-text">{{ moreText }}</span><span
				class="main-grid-more-load-text"
			>{{ loadingText }}</span><span class="main-grid-more-icon"></span></button>
		</div>
	`
	});

	const CheckboxClass$1 = 'main-grid-row-checkbox';
	const ProjectionRow = ui_vue3.defineComponent({
		name: 'MailMessageGridProjectionRow',
		props: {
			row: {
				type: Object,
				required: true
			},
			columns: {
				type: Array,
				required: true
			}
		},
		setup() {
			return {
				checkboxClass: CheckboxClass$1,
				column: GridColumn,
				testId: TestId.ProjectionRow
			};
		},
		computed: {
			pendingTestId() {
				return `${UndoSendPendingRowTestIdPrefix}${this.row.operationId}`;
			},
			selectLabel() {
				return loc(Phrase.RowSelect);
			}
		},
		template: `
		<tr class="main-grid-row main-grid-row-body" :data-id="row.id" :data-testid="testId">
			<td class="main-grid-cell main-grid-cell-checkbox">
				<span class="main-grid-cell-content">
					<input
						type="checkbox"
						disabled
						data-disabled="1"
						:class="checkboxClass"
						:aria-label="selectLabel"
					/>
				</span>
			</td>
			<td class="main-grid-cell main-grid-cell-action">
				<span class="main-grid-cell-content"></span>
			</td>
			<td
				v-for="head in columns"
				:key="head.id"
				class="main-grid-cell main-grid-cell-left"
				:data-column-id="head.id"
			>
				<div class="main-grid-cell-inner">
					<span class="main-grid-cell-content">
						<span
							v-if="head.id === column.From"
							class="mail-name-block mail-msg-list-cell-nowrap mail-msg-list-cell-flex"
						>
							<span class="mail-msg-from-title">{{ row.sender }}</span>
						</span>
						<span
							v-else-if="head.id === column.Subject"
							class="mail-title-block mail-msg-list-cell-flex"
							:data-testid="pendingTestId"
							:data-undo-send-id="row.operationId"
							:data-undo-send-refresh-at="row.refreshAt"
						>
							<span class="mail-msg-list-subject">{{ row.subject }}</span>
							<span class="mail-undo-send-pending-status"> &mdash; {{ row.status }}</span>
						</span>
						<span
							v-else-if="head.id === column.Date && row.date.short"
							:title="row.date.title"
						><span class="mail-msg-date-title">{{ row.date.short }}</span></span>
					</span>
				</div>
			</td>
			<td class="main-grid-cell"></td>
		</tr>
	`
	});

	const EmptyRow = Object.freeze({
		None: 'none',
		Plain: 'plain',
		Draft: 'draft',
		Stub: 'stub'
	});
	const ServiceColumns = 3;
	const GridTable = ui_vue3.defineComponent({
		name: 'MailMessageGridTable',
		components: {
			DraftRow,
			EmptyStub,
			MessageRow,
			MoreButton,
			ProjectionRow
		},
		props: {
			mode: {
				type: String,
				required: true
			},
			listImprovementsEnabled: {
				type: Boolean,
				required: true
			}
		},
		setup() {
			return {
				grid: useGridStore(),
				fader: new TableFader(),
				stretcher: new TableStretcher(),
				tableTestId: TestId.Table,
				emptyRowTestId: TestId.EmptyRow,
				draftEmptyTestId: TestId.DraftEmpty
			};
		},
		computed: {
			columns() {
				return resolveColumns(this.mode, this.listImprovementsEnabled);
			},
			messageRows() {
				return this.grid.messageRows;
			},
			draftRows() {
				return this.grid.draftRows;
			},
			projectionRows() {
				return this.grid.projections;
			},
			emptyRow() {
				if (!this.grid.isEmpty) {
					return EmptyRow.None;
				}
				if (this.mode === GridMode.Draft) {
					return this.grid.total === 0 ? EmptyRow.Draft : EmptyRow.None;
				}
				return this.grid.stubArmed ? EmptyRow.Stub : EmptyRow.Plain;
			},
			emptyRowDrawn() {
				return this.emptyRow !== EmptyRow.None;
			},
			emptyText() {
				return loc(this.grid.filterApplied ? Phrase.NoDataFiltered : Phrase.NoData);
			},
			draftEmptyText() {
				return loc(Phrase.DraftEmpty);
			},
			emptyColspan() {
				return this.columns.length + ServiceColumns;
			}
		},
		mounted() {
			this.fader.start({
				fade: this.$refs.fade,
				container: this.$refs.container,
				table: this.$refs.table,
				earLeft: this.$refs.earLeft,
				earRight: this.$refs.earRight
			});
			this.stretcher.start({
				root: this.$refs.root,
				container: this.$refs.container,
				table: this.$refs.table,
				panels: this.$refs.panels
			});
			this.adjustEmptyTable();
		},
		updated() {
			this.adjustEmptyTable();
		},
		beforeUnmount() {
			this.fader.destroy();
			this.stretcher.destroy();
		},
		methods: {
			headTitle(head) {
				return head.showName ? loc(head.phrase) : '';
			},
			adjustEmptyTable() {
				const cell = this.$refs.emptyCell;
				const block = cell?.firstElementChild ?? null;
				if (block) {
					this.stretcher.stretch(block);
					return;
				}
				this.stretcher.release();
			}
		},
		template: `
		<div
			class="main-grid"
			:class="{ 'main-grid-empty-footer': !grid.footDrawn, 'main-grid-empty-stub': emptyRowDrawn }"
			ref="root"
		>
			<div class="main-grid-wrapper">
				<div class="main-grid-fade" ref="fade">
					<div class="main-grid-fade-shadow-left"></div>
					<div class="main-grid-fade-shadow-right"></div>
					<div class="main-grid-ear main-grid-ear-left" ref="earLeft"></div>
					<div class="main-grid-ear main-grid-ear-right" ref="earRight"></div>
					<div class="main-grid-container" ref="container">
						<table
							class="main-grid-table"
							:class="{ 'main-grid-table-fade': grid.faded }"
							:data-testid="tableTestId"
							ref="table"
						>
							<thead class="main-grid-header">
								<tr class="main-grid-row-head">
									<th class="main-grid-cell-head main-grid-cell-static main-grid-cell-checkbox">
										<span class="main-grid-cell-head-container"></span>
									</th>
									<th class="main-grid-cell-head main-grid-cell-static main-grid-cell-action"></th>
									<th
										v-for="head in columns"
										:key="head.id"
										class="main-grid-cell-head"
										:class="head.headClass"
									>
										<div class="main-grid-cell-inner">
											<span class="main-grid-cell-head-container">
												<span class="main-grid-head-title">{{ headTitle(head) }}</span>
											</span>
										</div>
									</th>
									<th class="main-grid-cell-head main-grid-cell-static main-grid-special-empty"></th>
								</tr>
							</thead>
							<tbody>
								<tr
									v-if="emptyRowDrawn"
									class="main-grid-row main-grid-row-empty main-grid-row-body"
								>
									<td class="main-grid-cell main-grid-cell-center" :colspan="emptyColspan" ref="emptyCell">
										<div v-if="emptyRow === 'draft'" class="mail-draft-list-empty" :data-testid="draftEmptyTestId">
											{{ draftEmptyText }}
										</div>
										<EmptyStub v-else-if="emptyRow === 'stub'"/>
										<div v-else class="main-grid-empty-block" :data-testid="emptyRowTestId">
											<div class="main-grid-empty-inner">
												<div class="main-grid-empty-image"></div>
												<div class="main-grid-empty-text">{{ emptyText }}</div>
											</div>
										</div>
									</td>
								</tr>
								<ProjectionRow
									v-for="row in projectionRows"
									:key="row.id"
									:row="row"
									:columns="columns"
								/>
								<MessageRow
									v-for="row in messageRows"
									:key="row.id"
									:row="row"
									:columns="columns"
									:listImprovementsEnabled="listImprovementsEnabled"
								/>
								<DraftRow
									v-for="row in draftRows"
									:key="row.id"
									:row="row"
									:columns="columns"
								/>
							</tbody>
						</table>
					</div>
				</div>
			</div>
			<div class="main-grid-bottom-panels" ref="panels">
				<MoreButton/>
			</div>
		</div>
	`
	});

	const LoaderImage = '/bitrix/images/mail/mail-loader.svg';
	const SyncLoader = ui_vue3.defineComponent({
		name: 'MailMessageGridSyncLoader',
		setup() {
			return {
				testId: TestId.SyncLoader,
				image: LoaderImage
			};
		},
		computed: {
			label() {
				return loc(Phrase.SyncLoaderLabel);
			}
		},
		template: `
		<div class="mail-message-grid__loader-area" role="status" :aria-label="label" :data-testid="testId">
			<div class="mail-msg-list-grid-loader mail-msg-list-grid-loader-animate">
				<div class="mail-msg-list-grid-loader-inner">
					<img :src="image" :alt="label">
				</div>
			</div>
		</div>
	`
	});

	const App = ui_vue3.defineComponent({
		name: 'MailMessageGridApp',
		components: {
			GridTable,
			SyncLoader
		},
		props: {
			mode: {
				type: String,
				required: true
			}
		},
		setup() {
			return {
				listImprovementsEnabled: isListImprovementsEnabled(),
				grid: useGridStore()
			};
		},
		computed: {
			modifierClass() {
				return `--${this.mode}`;
			},
			rootTestId() {
				return this.mode === GridMode.Draft ? TestId.DraftRoot : TestId.Root;
			}
		},
		beforeUnmount() {
			this.grid.clearProtectedImages();
		},
		template: `
		<div class="mail-message-grid" :class="modifierClass" :data-testid="rootTestId">
			<SyncLoader v-if="grid.syncing"/>
			<GridTable v-else :mode="mode" :listImprovementsEnabled="listImprovementsEnabled"/>
		</div>
	`
	});

	function applySectionFromUrl(registry, url) {
		if (registry.mode !== GridMode.Message || !isListImprovementsEnabled()) {
			return;
		}
		registry.setListSection(mail_favoritesFilterState.isFavoritesSectionUrl(url) ? mail_favoritesFilterState.FAVORITES_SECTION : null);
	}
	function announceFavoritesSection(registry) {
		if (registry.screen?.listSection !== mail_favoritesFilterState.FAVORITES_SECTION) {
			return;
		}
		const count = registry.rows.length;
		ui_a11y.LiveAnnouncer.announce(count > 0 ? locPlural(Phrase.FavoritesShown, count, {
			'#COUNT#': String(count)
		}) : loc(Phrase.FavoritesEmpty));
	}

	function hideRows(registry, ids) {
		registry.setHiddenIds([...new Set([...registry.hiddenIds, ...ids])]);
	}
	function shownRows(registry) {
		const hidden = new Set(registry.hiddenIds);
		return registry.rows.filter(row => !hidden.has(row.id));
	}

	function mapMessagePage(response) {
		const {
			rows,
			projections,
			enableNextPage,
			pageLimitReached,
			page,
			hrefIds,
			filterApplied
		} = response;
		return {
			rows,
			projections,
			enableNextPage,
			pageLimitReached,
			page,
			hrefIds,
			filterApplied
		};
	}
	function mapDraftPage(response) {
		const {
			rows,
			enableNextPage,
			pageLimitReached,
			page,
			total
		} = response;
		return {
			rows,
			enableNextPage,
			pageLimitReached,
			page,
			total
		};
	}

	const Controller = 'mail.api.messagelist';
	const transport = main_core.ajax;
	class MessageListApiError extends Error {
		errors;
		code;
		constructor(errors = []) {
			super(errors[0]?.message ?? 'Mail message list request failed.');
			this.name = 'MessageListApiError';
			this.errors = errors;
			this.code = errors[0]?.code === undefined ? null : String(errors[0].code);
		}
	}
	const SyncUnavailableCode = 'MAILBOX_SYNC_UNAVAILABLE';
	const PageOutOfRangeCode = 'PAGE_OUT_OF_RANGE';
	function isSyncUnavailable(reason) {
		return reason instanceof MessageListApiError && reason.code === SyncUnavailableCode;
	}
	function isPageOutOfRange(reason) {
		return reason instanceof MessageListApiError && reason.code === PageOutOfRangeCode;
	}
	function getErrors(reason) {
		if (!main_core.Type.isObjectLike(reason)) {
			return [];
		}
		const errors = reason.errors;
		return main_core.Type.isArray(errors) ? errors : [];
	}
	async function runAction(action, data) {
		try {
			const response = await transport.runAction(`${Controller}.${action}`, {
				method: 'POST',
				data
			});
			if (response.status === 'error' || response.data === undefined) {
				throw new MessageListApiError(response.errors);
			}
			return response.data;
		} catch (error) {
			throw new MessageListApiError(getErrors(error));
		}
	}
	function messageRequest(screen, page) {
		const data = {
			gridId: screen.gridId,
			filterId: screen.filterId,
			mailboxId: screen.mailboxId,
			page
		};
		if (screen.virtual) {
			data.virtual = screen.virtual;
		}
		if (screen.listSection) {
			data.listSection = screen.listSection;
		}
		return data;
	}
	function draftRequest(screen, page) {
		const {
			gridId,
			filterId,
			mailboxId
		} = screen;
		return {
			gridId,
			filterId,
			mailboxId,
			page
		};
	}
	const MessageListApi = {
		async getPage(screen, page) {
			return mapMessagePage(await runAction('getPage', messageRequest(screen, page)));
		},
		async getDraftPage(screen, page) {
			return mapDraftPage(await runAction('getDraftPage', draftRequest(screen, page)));
		},
		async getListPage(mode, screen, page) {
			return mode === GridMode.Draft ? MessageListApi.getDraftPage(screen, page) : MessageListApi.getPage(screen, page);
		}
	};

	async function loadNextPage(registry, announceUpdated) {
		if (registry.loadingPage || !registry.enableNextPage || registry.screen === null) {
			return;
		}
		const screen = registry.screen;
		const nextPage = registry.page + 1;
		registry.setPageFailed(false);
		registry.setPageLoading(true);
		try {
			registry.appendPage(await MessageListApi.getListPage(registry.mode, screen, nextPage));
			announceUpdated();
		} catch (error) {
			registry.setPageFailed(true);
			registry.setPageSyncBlocked(isSyncUnavailable(error));
			registry.setPageLimitReached(isPageOutOfRange(error));
		} finally {
			registry.setPageLoading(false);
		}
	}

	const StubLifetime = 15000;
	const lifetimeTimers = new WeakMap();
	function dropLifetimeCap(registry) {
		const timer = lifetimeTimers.get(registry);
		if (timer !== undefined) {
			clearTimeout(timer);
			lifetimeTimers.delete(registry);
		}
	}
	function showSyncLoader(registry) {
		dropLifetimeCap(registry);
		registry.setSyncing(true);
		lifetimeTimers.set(registry, setTimeout(() => {
			lifetimeTimers.delete(registry);
			registry.setSyncing(false);
		}, StubLifetime));
	}
	function armPrimarySyncStub(registry) {
		if (!registry.isEmpty) {
			return;
		}
		registry.armStub();
		showSyncLoader(registry);
	}

	async function reloadList(registry, announceUpdated) {
		if (registry.screen === null) {
			return;
		}
		if (registry.loadingPage) {
			registry.setReloadPending(true);
			return;
		}
		const screen = registry.screen;
		registry.setReloadPending(false);
		registry.setPageFailed(false);
		registry.setPageLoading(true);
		try {
			registry.setPage(await MessageListApi.getListPage(registry.mode, screen, 1));
			announceUpdated();
		} catch (error) {
			registry.setPageFailed(true);
			registry.setPageSyncBlocked(isSyncUnavailable(error));
		} finally {
			registry.setPageLoading(false);
		}
		await drainPendingReload(registry, announceUpdated);
	}
	async function drainPendingReload(registry, announceUpdated) {
		if (!registry.reloadPending) {
			return;
		}
		await reloadList(registry, announceUpdated);
	}

	function emitGridEvent(name, args = []) {
		main_core_events.EventEmitter.emit(name, new main_core_events.BaseEvent({
			data: args,
			compatData: args
		}), {
			useGlobalNaming: true
		});
	}

	function everyRowId(registry) {
		return shownRows(registry).map(row => row.id);
	}
	function selectedShownIds(registry) {
		const marked = new Set(registry.selectedIds);
		return everyRowId(registry).filter(id => marked.has(id));
	}
	function announceSelectionState(registry, grid) {
		if (registry.selectedIds.length > 0) {
			emitGridEvent(GridEvent.ThereSelectedRows, [grid]);
			return;
		}
		emitGridEvent(GridEvent.NoSelectedRows);
	}
	function isRowSelected(registry, rowId) {
		return registry.selectedIds.includes(rowId);
	}
	function isEverythingSelected(registry) {
		const shown = everyRowId(registry).length;
		return shown > 0 && selectedShownIds(registry).length === shown;
	}
	function toggleRow(registry, rowId) {
		registry.setSelection(isRowSelected(registry, rowId) ? registry.selectedIds.filter(id => id !== rowId) : [...registry.selectedIds, rowId]);
		registry.setStickyAll(false);
	}
	function toggleSelectAll(registry, on) {
		registry.setStickyAll(on);
		registry.setSelection(on ? everyRowId(registry) : []);
	}
	function announceSelectAll(grid, on) {
		emitGridEvent(on ? GridEvent.AllRowsSelected : GridEvent.AllRowsUnselected, [grid]);
	}
	function reapplyStickyAll(registry) {
		if (registry.stickyAll) {
			registry.setSelection(everyRowId(registry));
		}
	}
	function rememberSelection(registry) {
		registry.setRestoreIds([...registry.selectedIds]);
	}
	function restoreSelection(registry) {
		registry.setSelection(everyRowId(registry).filter(id => registry.restoreIds.includes(id)));
		registry.setRestoreIds([]);
		reapplyStickyAll(registry);
	}
	function announceRestoredSelection(registry, grid) {
		setTimeout(() => {
			if (registry.selectedIds.length > 0) {
				emitGridEvent(GridEvent.ThereSelectedRows, [grid]);
			}
		}, 0);
	}
	function resetSelection(registry) {
		clearSelection(registry);
		if (registry.mode === GridMode.Message) {
			emitGridEvent(GridEvent.ResetSelection);
		}
	}
	function clearSelection(registry) {
		registry.setSelection([]);
		registry.setStickyAll(false);
		registry.setRestoreIds([]);
	}

	function publishHrefListToSlider(registry) {
		const sidePanel = resolveGlobal('BX.SidePanel.Instance');
		const slider = sidePanel?.getTopSlider() ?? null;
		if (!sidePanel || slider === null || slider === sidePanel.getSliderByWindow(window)) {
			return;
		}
		const data = slider.getData();
		data.set('hrefList', registry.pageSwapperHrefList);
		data.set('enableNextPage', registry.enableNextPage);
	}

	const ScreenCellClass = Object.freeze({
		Sender: '.mail-msg-from-title',
		Subject: '.mail-msg-list-subject',
		Status: '.mail-undo-send-pending-status'
	});
	const ScreenMarker = Object.freeze({
		OperationId: '[data-undo-send-id]',
		RefreshAt: '[data-undo-send-refresh-at]'
	});
	const LeadingSeparator = /^[\s\u00A0]*[\u2014\u2013-]?[\s\u00A0]*/u;
	function textOf(cell, selector = '') {
		if (!main_core.Type.isDomNode(cell)) {
			return main_core.Type.isString(cell) ? cell.trim() : '';
		}
		const inner = selector === '' ? null : cell.querySelector(selector);
		return (inner?.textContent ?? cell.textContent ?? '').trim();
	}
	function numberOf(cell, marker, attribute) {
		if (!main_core.Type.isDomNode(cell)) {
			return 0;
		}
		const marked = cell.matches(marker) ? cell : cell.querySelector(marker);
		const value = Number(marked?.getAttribute(attribute));
		return Number.isFinite(value) ? value : 0;
	}
	function fromScreenCells(id, columns) {
		const subjectCell = columns[GridColumn.Subject];
		const operationId = numberOf(subjectCell, ScreenMarker.OperationId, 'data-undo-send-id');
		return {
			id,
			operationId: operationId > 0 ? operationId : Number(id.slice(UndoSendRowIdPrefix.length)) || 0,
			sender: textOf(columns[GridColumn.From], ScreenCellClass.Sender),
			subject: textOf(subjectCell, ScreenCellClass.Subject),
			status: textOf(subjectCell, ScreenCellClass.Status).replace(LeadingSeparator, ''),
			date: {
				short: textOf(columns[GridColumn.Date]),
				title: ''
			},
			refreshAt: numberOf(subjectCell, ScreenMarker.RefreshAt, 'data-undo-send-refresh-at')
		};
	}
	function addProjectionRow(registry, options) {
		const id = options.id;
		if (!main_core.Type.isStringFilled(id) && !main_core.Type.isNumber(id)) {
			throw new ReferenceError('id is not number or string');
		}
		registry.addProjection(fromScreenCells(String(id), {
			...options.columns
		}), options.append !== true);
	}
	function dropCancelledProjection(registry, data) {
		const operationId = Number(data?.operation?.operationId);
		if (Number.isInteger(operationId) && operationId > 0) {
			registry.dropProjection(`${UndoSendRowIdPrefix}${operationId}`);
		}
	}

	function resolveRegistry() {
		const main = main_core.Reflection.namespace('BX.Main');
		if (main.gridManager) {
			return main.gridManager;
		}
		const registry = {
			data: [],
			push(id, instance) {
				if (main_core.Type.isStringFilled(id) && instance && this.getById(id) === null) {
					this.data.push({
						id,
						instance,
						old: null
					});
				}
			},
			getById(id) {
				const found = this.data.filter(record => {
					return record.id === id || record.id.replace('main_grid_', '') === id;
				});
				return found.length === 1 ? found[0] : null;
			},
			getInstanceById(id) {
				return this.getById(id)?.instance ?? null;
			}
		};
		main.gridManager = registry;
		return registry;
	}
	function registerGrid(gridId, grid) {
		resolveRegistry().push(gridId, grid);
	}

	const CheckboxClass = 'main-grid-row-checkbox';
	class GridRowFacade {
		#row;
		#registry;
		#container;
		constructor(row, registry, container) {
			this.#row = row;
			this.#registry = registry;
			this.#container = container;
		}
		get node() {
			return this.#container.querySelector(`tr[data-id="${this.#row.id}"]`);
		}
		getNode() {
			return this.node;
		}
		getId() {
			return this.#row.id;
		}
		getCheckbox() {
			return this.node?.querySelector(`.${CheckboxClass}`) ?? null;
		}
		isShown() {
			const node = this.node;
			return node !== null && main_core.Dom.style(node, 'display') !== 'none';
		}
		getDataset() {
			const row = this.#row;
			return 'mailboxId' in row ? {
				mailboxId: String(row.mailboxId)
			} : {};
		}
		isSelected() {
			return this.#registry.selectedIds.includes(this.#row.id);
		}
		getActionsMenu() {
			return getRowActionsMenu(this.#row.id);
		}
	}

	class GridRowsFacade {
		#registry;
		#grid;
		#container;
		constructor(registry, grid, container) {
			this.#registry = registry;
			this.#grid = grid;
			this.#container = container;
		}
		getCountDisplayed() {
			return shownRows(this.#registry).length;
		}
		getBodyChild() {
			return this.#registry.rows.map(row => new GridRowFacade(row, this.#registry, this.#container));
		}
		getSelectedIds() {
			return [...this.#registry.selectedIds];
		}
		getSelected() {
			return this.#registry.selectedRows.map(row => new GridRowFacade(row, this.#registry, this.#container));
		}
		getById(id) {
			const row = this.#registry.rows.find(candidate => candidate.id === id);
			return row ? new GridRowFacade(row, this.#registry, this.#container) : null;
		}
		unselectAll() {
			this.#grid.clearSelection();
		}
	}

	class GridFacade {
		#gridId;
		#container;
		#registry;
		#panel = null;
		#actionPanel = null;
		#checkAllCheckbox = null;
		#baseUrl = '';
		constructor(options) {
			this.#gridId = options.gridId;
			this.#container = options.container;
			this.#registry = options.registry;
		}
		publish(asScreenGrid) {
			registerGrid(this.#gridId, this);
			if (asScreenGrid) {
				const home = main_core.Reflection.namespace('BX.Mail.Home');
				home.Grid = this;
			}
		}
		listenToScreen() {
			main_core_events.EventEmitter.subscribe(GridEvent.ResetSelection, () => {
				this.clearSelection();
			});
			main_core_events.EventEmitter.subscribe(GridEvent.DirectoryChanged, () => {
				this.clearSelection();
			});
			main_core_events.EventEmitter.subscribe(GridEvent.UndoSendCancelled, event => {
				dropCancelledProjection(this.#registry, event.getData() ?? {});
			});
		}
		getRealtime() {
			return {
				addRow: options => {
					addProjectionRow(this.#registry, options);
					this.announceUpdated();
				}
			};
		}
		announceUpdated() {
			void ui_vue3.nextTick(() => {
				emitGridEvent(GridEvent.Updated, [this]);
			});
		}
		getId() {
			return this.#gridId;
		}
		getContainer() {
			return this.#container;
		}
		getCountDisplayed() {
			return this.getRows().getCountDisplayed();
		}
		getMessageHrefList() {
			return this.#registry.pageSwapperHrefList;
		}
		hasNextPage() {
			return this.#registry.enableNextPage;
		}
		async loadNextPage() {
			await loadNextPage(this.#registry, () => {
				reapplyStickyAll(this.#registry);
				this.announceUpdated();
				this.#applyRowsChange();
				announceFavoritesSection(this.#registry);
				publishHrefListToSlider(this.#registry);
			});
			await drainPendingReload(this.#registry, () => this.#announceListReloaded());
		}
		get baseUrl() {
			return this.#baseUrl;
		}
		set baseUrl(url) {
			this.#baseUrl = url;
			applySectionFromUrl(this.#registry, url);
		}
		reloadTable(method, data, callback, url) {
			if (main_core.Type.isStringFilled(url)) {
				this.baseUrl = url;
			}
			this.#registry.setFaded(false);
			rememberSelection(this.#registry);
			void reloadList(this.#registry, () => {
				this.#announceListReloaded();
				callback?.();
			});
		}
		reload(url) {
			this.reloadTable('GET', {}, null, url);
		}
		tableFade() {
			this.#registry.setFaded(true);
		}
		setGridWrapper() {}
		setGridStub() {}
		enableLoadingMessagesStub() {
			showSyncLoader(this.#registry);
		}
		getSelectedIds() {
			return [...this.#registry.selectedIds];
		}
		hideRowByIds(ids) {
			hideRows(this.#registry, ids);
		}
		toggleRow(rowId) {
			toggleRow(this.#registry, rowId);
			this.#applySelectionChange();
			announceSelectionState(this.#registry, this);
		}
		toggleSelectAll(on) {
			toggleSelectAll(this.#registry, on);
			this.#applySelectionChange();
			announceSelectAll(this, on);
		}
		resetSelection() {
			resetSelection(this.#registry);
			this.#applySelectionChange();
		}
		resetGridSelection() {
			this.resetSelection();
		}
		clearSelection() {
			clearSelection(this.#registry);
			this.#applySelectionChange();
		}
		areAllRowsSelected() {
			return this.#registry.stickyAll;
		}
		setMigrationLocked(mailboxIds) {
			if (rememberLockedMailboxes(this.#registry, mailboxIds)) {
				dropRowActionsMenus(this.#gridId);
			}
		}
		setActionPanel(actionPanel) {
			this.#actionPanel = actionPanel;
			this.setPanel(actionPanel.getPanel());
			const node = actionPanel.getCheckAllNode();
			if (node) {
				this.setCheckboxNodeForCheckAll(node);
			}
			this.#applyRowsChange();
		}
		setPanel(panel) {
			this.#panel = panel;
		}
		getPanel() {
			return this.#panel;
		}
		hidePanel() {
			this.#panel?.hidePanel();
		}
		setCheckboxNodeForCheckAll(node) {
			this.#checkAllCheckbox = node;
		}
		getRows() {
			return new GridRowsFacade(this.#registry, this, this.#container);
		}
		getCheckAllCheckboxes() {
			const node = this.#checkAllCheckbox;
			return main_core.Type.isDomNode(node) ? [{
				getNode: () => node
			}] : [];
		}
		enableCheckAllCheckboxes() {
			this.#actionPanel?.setCheckAllEnabled(this.getCountDisplayed() > 0);
		}
		bindOnCheckAll() {
			this.#actionPanel?.mountCheckAllCheckbox();
		}
		adjustCheckAllCheckboxes() {
			const everything = isEverythingSelected(this.#registry);
			this.#actionPanel?.setCheckAllState(everything, !everything && selectedShownIds(this.#registry).length > 0);
		}
		#announceListReloaded() {
			restoreSelection(this.#registry);
			this.announceUpdated();
			this.#applyRowsChange();
			announceRestoredSelection(this.#registry, this);
			announceFavoritesSection(this.#registry);
		}
		#applyRowsChange() {
			this.enableCheckAllCheckboxes();
			this.#applySelectionChange();
		}
		#applySelectionChange() {
			this.adjustCheckAllCheckboxes();
			this.#actionPanel?.syncToSelection(this.#registry.selectedRows);
		}
	}

	const PanelMaxHeight = 56;
	const PanelClassName = 'mail-msg-list-action-panel';
	const ActiveCrmBindingSelector = '.mail-binding-crm.mail-ui-active';
	const UnseenCellSelector = '.mail-msg-list-cell-unseen';
	const ItemMenuId = 'ui-action-panel-item-popup-menu';
	const PanelItem = Object.freeze({
		Read: 'read',
		NotRead: 'notRead',
		Spam: 'spam',
		NotSpam: 'notSpam',
		AddToCrm: 'addToCrm',
		ExcludeFromCrm: 'excludeFromCrm'
	});
	function resolveFilter(filterId) {
		const manager = resolveGlobal('BX.Main.filterManager');
		return manager?.getById(filterId) ?? null;
	}
	class GridActionPanel {
		#options;
		#panel;
		#panelHolder;
		#checkAll = null;
		#currentFolderIsSpam = false;
		constructor(options, panel, panelHolder) {
			this.#options = options;
			this.#panel = panel;
			this.#panelHolder = panelHolder;
			if (this.#options.mode === GridMode.Message) {
				this.#leadPinning();
			}
			this.#readCurrentFolder();
			this.#panel.draw();
			this.#takePlace();
			this.mountCheckAllCheckbox();
			this.#bindResetWord();
			this.#listenToScreen();
		}
		getPanel() {
			return this.#panel;
		}
		getCheckAllNode() {
			return this.#panel.getPanelContainer().querySelector(`input[${CheckAllAttribute}]`);
		}
		syncToSelection(rows) {
			if (rows.length === 0) {
				this.#panel.hidePanel();
				return;
			}
			this.#panel.setTotalSelectedItems(rows.length);
			if (rows.length === 1) {
				const actions = withFolderSubmenus(rows[0].actions, this.#options.folders);
				this.#panel.buildPanelByItem({
					getActions: () => actions
				});
			} else {
				this.#panel.buildPanelByGroup();
			}
			this.#applyExclusivePairs(rows);
			this.#panel.showPanel();
		}
		mountCheckAllCheckbox() {
			if (this.#checkAll) {
				return this.#checkAll;
			}
			const label = main_core.Loc.getMessage('INTERFACE_MAIL_CHECK_ALL') ?? '';
			this.#checkAll = new ui_system_checkbox.Checkbox({
				size: ui_system_checkbox.CheckboxSize.Md,
				disabled: true,
				attributes: {
					[CheckAllAttribute]: this.#options.gridId,
					'data-testid': TestId.CheckAll,
					title: label,
					'aria-label': label
				},
				onChange: ({
					checked
				}) => this.#options.onSelectAll(checked)
			});
			const holder = main_core.Tag.render`<span class="mail-msg-list-check-all"></span>`;
			main_core.Dom.append(this.#checkAll.render(), holder);
			main_core.Dom.prepend(holder, this.#panel.getPanelContainer());
			return this.#checkAll;
		}
		setCheckAllState(checked, indeterminate) {
			this.#checkAll?.setIndeterminate(indeterminate);
			this.#checkAll?.setChecked(checked && !indeterminate);
		}
		setCheckAllEnabled(enabled) {
			this.#checkAll?.setDisabled(!enabled);
		}
		resetToNoSelection() {
			this.#dropItemHandlers();
			if (this.#options.mode !== GridMode.Message) {
				return;
			}
			this.#showItem(PanelItem.Read);
			this.#hideItem(PanelItem.NotRead);
			this.#showItem(PanelItem.Spam);
			this.#hideItem(PanelItem.NotSpam);
			this.#showItem(PanelItem.AddToCrm);
			this.#hideItem(PanelItem.ExcludeFromCrm);
			this.#announceLayoutChange();
		}
		#dropItemHandlers() {
			this.#panel.items.forEach(item => {
				item.layout.container?.removeAttribute('onclick');
			});
			const menus = resolveGlobal('BX.Main.MenuManager');
			menus?.getMenuById(ItemMenuId)?.close();
		}
		#takePlace() {
			if (this.#options.mode === GridMode.Draft) {
				main_core.Dom.append(this.#panel.getPanelContainer(), this.#panelHolder);
				return;
			}
			setTimeout(() => this.#panel.unfixPanel(), 0);
		}
		#leadPinning() {
			const panel = this.#panel;
			const fixPanel = panel.fixPanel.bind(panel);
			const unfixPanel = panel.unfixPanel.bind(panel);
			panel.fixPanel = () => {
				main_core.Dom.append(panel.getPanelContainer(), document.body);
				fixPanel();
			};
			panel.unfixPanel = () => {
				main_core.Dom.insertBefore(panel.getPanelContainer(), this.#options.gridContainer);
				unfixPanel();
			};
		}
		#bindResetWord() {
			const total = this.#panel.getPanelContainer().querySelector('[data-role="action-panel-total"]');
			if (main_core.Type.isDomNode(total)) {
				main_core.Event.bind(total, 'click', () => {
					this.#panel.setTotalSelectedItems(0);
					this.#options.onReset();
				});
			}
		}
		#listenToScreen() {
			main_core_events.EventEmitter.subscribe(GridEvent.PanelHidden, event => {
				const [panel] = event.getCompatData() ?? [];
				if (panel === this.#panel) {
					this.resetToNoSelection();
				}
			});
			main_core_events.EventEmitter.subscribe(GridEvent.FilterApplied, event => {
				const [filterId] = event.getCompatData() ?? [];
				if (filterId !== this.#options.filterId) {
					return;
				}
				this.#readCurrentFolder();
				this.resetToNoSelection();
			});
		}
		#readCurrentFolder() {
			const spamDir = this.#options.panel.spamDir;
			const filter = resolveFilter(this.#options.filterId);
			this.#currentFolderIsSpam = spamDir !== '' && filter !== null && (filter.getPreset().getCurrentPresetId() === 'spam' || filter.getFilterFieldsValues().DIR === spamDir);
		}
		#applyExclusivePairs(rows) {
			if (this.#options.mode !== GridMode.Message) {
				return;
			}
			const messages = rows;
			if (messages.every(row => row.isOld)) {
				this.#hideItem(PanelItem.Read);
				this.#hideItem(PanelItem.NotRead);
			} else if (messages.some(row => this.#isUnseen(row))) {
				this.#showItem(PanelItem.Read);
				this.#hideItem(PanelItem.NotRead);
			} else {
				this.#showItem(PanelItem.NotRead);
				this.#hideItem(PanelItem.Read);
			}
			if (this.#currentFolderIsSpam) {
				this.#showItem(PanelItem.NotSpam);
				this.#hideItem(PanelItem.Spam);
			} else {
				this.#showItem(PanelItem.Spam);
				this.#hideItem(PanelItem.NotSpam);
			}
			if (messages.length === 1) {
				this.#applyCrmPairByRow(messages[0]);
			} else {
				this.#applyCrmPairByDefault();
			}
			this.#announceLayoutChange();
		}
		#isUnseen(row) {
			return this.#options.gridContainer.querySelector(`tr[data-id="${row.id}"] ${UnseenCellSelector}`) !== null;
		}
		#applyCrmPairByRow(row) {
			const bound = this.#options.gridContainer.querySelector(`tr[data-id="${row.id}"] ${ActiveCrmBindingSelector}`) !== null;
			if (bound) {
				this.#showItem(PanelItem.ExcludeFromCrm);
				this.#hideItem(PanelItem.AddToCrm);
				return;
			}
			this.#applyCrmPairByDefault();
		}
		#applyCrmPairByDefault() {
			this.#showItem(PanelItem.AddToCrm);
			this.#hideItem(PanelItem.ExcludeFromCrm);
		}
		#showItem(id) {
			this.#panel.getItemById(id)?.showAsInlineBlock();
		}
		#hideItem(id) {
			this.#panel.getItemById(id)?.hide();
		}
		#announceLayoutChange() {
			window.dispatchEvent(new window.Event('resize', {
				bubbles: true,
				cancelable: true
			}));
		}
	}
	function createActionPanel(options) {
		const container = document.getElementById(options.panel.containerId);
		const PanelClass = resolveGlobal('BX.UI.ActionPanel');
		if (!container || !PanelClass) {
			return null;
		}
		const adapter = new GridActionPanel(options, new PanelClass({
			pinnedMode: true,
			autoHide: false,
			maxHeight: PanelMaxHeight,
			renderTo: container,
			className: PanelClassName,
			groupActions: options.panel.groupActions
		}), container);
		const panels = main_core.Reflection.namespace('BX.Mail.Home.GridActionPanels');
		panels[options.gridId] = adapter.getPanel();
		return adapter;
	}

	function reloadOnFilterApply(filterId, reload) {
		main_core_events.EventEmitter.subscribe(GridEvent.FilterApplied, event => {
			const [appliedFilterId] = event.getCompatData() ?? [];
			if (appliedFilterId === filterId) {
				reload();
			}
		});
	}

	const PopupId = 'mail-message-grid-screen-messages';
	const KnownKinds = new Set(['error', 'warning', 'info', 'success']);
	function resolveKind(type) {
		const kind = type.toLowerCase();
		return KnownKinds.has(kind) ? kind : 'info';
	}
	function renderMessage(message) {
		const item = main_core.Tag.render`
		<div class="mail-message-grid-messages__item --${resolveKind(message.TYPE)}"
			data-testid="${TestId.ScreenNoticeItem}"></div>
	`;
		if (message.TITLE) {
			main_core.Dom.append(main_core.Tag.render`<div class="mail-message-grid-messages__title">${main_core.Text.encode(message.TITLE)}</div>`, item);
		}
		if (message.TEXT) {
			main_core.Dom.append(main_core.Tag.render`<div class="mail-message-grid-messages__text">${main_core.Text.encode(message.TEXT)}</div>`, item);
		}
		return item;
	}
	function showScreenMessages(messages) {
		if (messages.length === 0) {
			return;
		}
		const content = main_core.Tag.render`
		<div class="mail-message-grid-messages" data-testid="${TestId.ScreenNotice}"></div>
	`;
		messages.forEach(message => {
			main_core.Dom.append(renderMessage(message), content);
		});
		new main_popup.Popup({
			id: PopupId,
			content,
			autoHide: true,
			closeByEsc: true,
			closeIcon: true,
			overlay: {
				opacity: 30
			},
			minWidth: 400,
			maxWidth: 800,
			cacheable: false,
			className: 'mail-message-grid-messages-popup'
		}).show();
	}

	class MessageGrid {
		#options;
		#application = null;
		constructor(options) {
			this.#options = options;
		}
		start() {
			if (this.#application) {
				return;
			}
			const container = document.getElementById(this.#options.containerId);
			if (!container) {
				return;
			}
			const {
				mode,
				screen,
				page,
				messages,
				panel,
				folders,
				messageHrefTemplate,
				hrefTemplates
			} = this.#options;
			const pinia = ui_vue3_pinia.createPinia();
			const registry = useGridStore(pinia);
			registry.initialize(mode, screen, page, folders ?? [], messageHrefTemplate ?? '', rowHrefTemplates(hrefTemplates));
			const isMessageList = mode === GridMode.Message;
			const facade = new GridFacade({
				gridId: screen.gridId,
				container,
				registry
			});
			facade.publish(isMessageList);
			if (isMessageList) {
				facade.listenToScreen();
			}
			reloadOnFilterApply(screen.filterId, () => facade.reloadTable());
			if (panel) {
				const actionPanel = createActionPanel({
					gridId: screen.gridId,
					mode,
					filterId: screen.filterId,
					panel,
					gridContainer: container,
					onSelectAll: on => facade.toggleSelectAll(on),
					onReset: () => facade.clearSelection(),
					folders: folders ?? []
				});
				if (actionPanel) {
					facade.setActionPanel(actionPanel);
				}
			}
			if (isMessageList && isSyncStubOffered()) {
				armPrimarySyncStub(registry);
			}
			this.#application = ui_vue3.BitrixVue.createApp(App, {
				mode
			});
			this.#application.use(pinia);
			this.#application.provide(gridPagingKey, facade);
			this.#application.provide(gridSelectionKey, facade);
			this.#application.mount(container);
			facade.announceUpdated();
			showScreenMessages(messages ?? []);
		}
	}

	exports.MessageGrid = MessageGrid;

})(this.BX.Mail.Client.MessageGrid = this.BX.Mail.Client.MessageGrid || {}, BX.Vue3, BX.Vue3.Pinia, BX, BX.Event, BX.Main, BX.UI.System.Checkbox, BX.UI, window, BX, BX.UI.Accessibility, BX.Mail);
//# sourceMappingURL=message-grid.bundle.js.map

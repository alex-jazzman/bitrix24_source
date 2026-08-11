import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Sidebar } from '../sidebar';
import Util from '../util';

const DOC_EDITOR_WIDTH = 961;
const DOC_TEMPLATE_WIDTH = 328;
const DOC_CREATED_EVENT = 'CallController::documentCreated';
const FILE_TYPE_DOCX = 'docx';
const FILE_TYPE_XLSX = 'xlsx';
const FILE_TYPE_PPTX = 'pptx';

const DocumentType = {
	Resume: 'resume',
	Blank: 'blank',
};

/**
 * Manages the collaborative document editor sidebar: opening, closing, width, and visibility.
 */
export class DocumentEditorService extends EventEmitter
{
	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {*} config.container
	 * @param {*} config.resizeObserver
	 * @param {*} config.messengerFacade
	 * @param {number} [config.minViewWidth=250] - minimum width of the call view when the editor sidebar is open
	 * @param {*} [config.callStore]
	 */
	constructor({ viewPort, container, resizeObserver, messengerFacade, minViewWidth = 250, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.DocumentEditorService');

		this.viewPort = viewPort;
		this.container = container;
		this.resizeObserver = resizeObserver;
		this.messengerFacade = messengerFacade;
		this.minViewWidth = minViewWidth;
		this.callStore = callStore ?? null;

		this.sidebar = null;
		this.docEditor = null;
		this.docEditorIframe = null;
		this.maxEditorWidth = DOC_TEMPLATE_WIDTH;
		this.docCreatedForCurrentCall = false;
		this.documentsMenu = null;
	}

	/**
	 * Shows the document selection context menu near the given element.
	 *
	 * @param {HTMLElement} bindElement
	 * @param {object} callContext - Call context data for menu item actions.
	 * @param {string} callContext.callId
	 * @param {string} callContext.callUuid
	 * @param {string} callContext.associatedEntityId
	 */
	showDocumentsMenu(bindElement, callContext)
	{
		if (this.documentsMenu)
		{
			this.documentsMenu.destroy();

			return;
		}

		const targetNodeWidth = bindElement ? bindElement.offsetWidth : 0;
		const resumesArticleCode = Util.getResumesArticleCode();
		const documentsArticleCode = Util.getDocumentsArticleCode();

		const menuItems = [];

		if (!this.viewPort.isFullScreen || !resumesArticleCode)
		{
			menuItems.push({
				text: Loc.getMessage('IM_M_CALL_MENU_CREATE_RESUME_MSGVER_2'),
				onclick: () => {
					this.documentsMenu.close();
					this.emit('DocumentEditorService::onDocumentMenuAction', { documentType: 'resume' });
					this.maybeShowDocumentEditor(
						{
							...callContext,
							type: DocumentType.Resume,
						},
						resumesArticleCode,
					);
				},
			});
		}

		if (!this.viewPort.isFullScreen || !documentsArticleCode)
		{
			menuItems.push({
				text: Loc.getMessage('IM_M_CALL_MENU_CREATE_FILE'),
				items: [
					{
						text: Loc.getMessage('IM_M_CALL_MENU_CREATE_FILE_DOC'),
						onclick: () => {
							this.documentsMenu.close();
							this.emit('DocumentEditorService::onDocumentMenuAction', { documentType: 'doc' });
							this.maybeShowDocumentEditor(
								{
									...callContext,
									type: DocumentType.Blank,
									typeFile: FILE_TYPE_DOCX,
								},
								documentsArticleCode,
							);
						},
					},
					{
						text: Loc.getMessage('IM_M_CALL_MENU_CREATE_FILE_XLS'),
						onclick: () => {
							this.documentsMenu.close();
							this.emit('DocumentEditorService::onDocumentMenuAction', { documentType: 'sheet' });
							this.maybeShowDocumentEditor(
								{
									...callContext,
									type: DocumentType.Blank,
									typeFile: FILE_TYPE_XLSX,
								},
								documentsArticleCode,
							);
						},
					},
					{
						text: Loc.getMessage('IM_M_CALL_MENU_CREATE_FILE_PPT'),
						onclick: () => {
							this.documentsMenu.close();
							this.emit('DocumentEditorService::onDocumentMenuAction', { documentType: 'presentation' });
							this.maybeShowDocumentEditor(
								{
									...callContext,
									type: DocumentType.Blank,
									typeFile: FILE_TYPE_PPTX,
								},
								documentsArticleCode,
							);
						},
					},
				],
			});
		}

		if (!this.viewPort.isFullScreen || !resumesArticleCode)
		{
			menuItems.push({
				text: Loc.getMessage('IM_M_CALL_MENU_OPEN_LAST_RESUME_MSGVER_2'),
				cacheable: true,
				items: [
					{
						id: 'loading',
						text: Loc.getMessage('IM_M_CALL_MENU_LOADING_RESUME_LIST'),
					},
				],
				events: {
					onSubMenuShow: (e) => this.buildPreviousResumesSubmenu(e.target, callContext?.callUuid),
				},
			});
		}

		const newStyleOptions = {
			className: 'bx-messenger-videocall-document-options-container',
			background: '#00428F',
			contentBackground: '#00428F',
			borderRadius: '6px',
			darkMode: true,
			contentBorderRadius: '6px',
		};

		this.documentsMenu = new BX.PopupMenuWindow({
			...newStyleOptions,
			angle: false,
			bindElement,
			targetContainer: this.container,
			offsetTop: -15,
			bindOptions: { position: 'top' },
			cacheable: false,
			subMenuOptions: {
				maxWidth: 450,
			},
			events: {
				onShow: (event) => {
					const popup = event.getTarget();
					popup.getPopupContainer().style.display = 'block';

					const offsetLeft = targetNodeWidth / 2 - popup.getPopupContainer().offsetWidth / 2;
					popup.setOffset({ offsetLeft: offsetLeft + 40, offsetTop: 0 });
					popup.setAngle({ offset: popup.getPopupContainer().offsetWidth / 2 - 17 });
				},
				onDestroy: () => (this.documentsMenu = null),
			},
			items: menuItems,
		});

		this.documentsMenu.show();
	}

	/**
	 * Opens the collaborative document editor with the given parameters.
	 *
	 * @param {object} params
	 * @param {string} params.type - Document type (resume or blank).
	 * @param {string} [params.typeFile] - File type for blank documents.
	 * @param {string} [params.callId] - Associated call identifier.
	 * @param {string} [params.callUuid] - Associated call UUID.
	 * @param {string} [params.associatedEntityId] - Associated dialog entity identifier.
	 * @param {boolean} [params.force] - Force reopen if editor is already open.
	 * @param {*} [params.viewerItem] - Item to view (for viewer mode).
	 */
	showDocumentEditor(params)
	{
		params = params || {};

		let openAnimation = true;

		if (this.sidebar)
		{
			if (params.force)
			{
				this.sidebar.close(false);
				this.sidebar.destroy();
				this.sidebar = null;
				openAnimation = false;
			}
			else
			{
				return;
			}
		}

		this.emit('DocumentEditorService::onOpen');
		this._createAndOpenSidebarWithIframe('about:blank', openAnimation);

		BX.loadExt('disk.onlyoffice-im-integration')
			.then(() => {
				const docEditor = new BX.Disk.OnlyOfficeImIntegration.CreateDocument({
					dialog: {
						id: params.associatedEntityId,
					},
					call: {
						uuid: params.callUuid,
					},
					delegate: {
						setMaxWidth: (maxWidth) => this.setMaxWidth(maxWidth),
						onDocumentCreated: () => this._onDocumentCreated(),
					},
					type: params.type,
					typeFile: params?.typeFile,
				});

				let promiseGetUrl;

				if (params.type === DocumentType.Resume)
				{
					promiseGetUrl = docEditor.getIframeUrlForTemplates();
				}
				else if (params.type === DocumentType.Blank)
				{
					promiseGetUrl = docEditor.getIframeUrlForCreate({
						typeFile: params.typeFile,
					});
				}
				else
				{
					promiseGetUrl = docEditor.getIframeUrl({
						viewerItem: params.viewerItem,
					});
				}

				promiseGetUrl
					.then((url) => {
						this.docEditorIframe.src = url;
					})
					.catch((e) => {
						console.error(e);
						this.closeDocumentEditor();
						alert(BX.message('IM_F_ERROR'));
					});

				this.docEditor = docEditor;
			})
			.catch((error) => {
				console.error(error);
				this.closeDocumentEditor();
				alert(BX.message('IM_F_ERROR'));
			});

		if (this.resizeObserver)
		{
			this.resizeObserver.observe(this.container);
		}
	}

	/**
	 * Closes the collaborative document editor.
	 *
	 * @returns {Promise}
	 */
	closeDocumentEditor()
	{
		return new Promise((resolve) => {
			if (this.docEditor && this.docEditorIframe)
			{
				this.docEditor.onCloseIframe(this.docEditorIframe);
			}

			if (this.container && this.resizeObserver)
			{
				this.resizeObserver.unobserve(this.container);
			}

			if (this.viewPort)
			{
				this.viewPort.removeMaxWidth();
			}

			if (!this.sidebar)
			{
				this.emit('DocumentEditorService::onClose', { needsContainerRemoval: !this.viewPort });

				return resolve();
			}

			const oldSidebar = this.sidebar;
			this.sidebar = null;

			oldSidebar.close().then(() => {
				this.docEditor = null;
				this.docEditorIframe = null;
				oldSidebar.destroy();
				this.maxEditorWidth = this.docCreatedForCurrentCall ? DOC_EDITOR_WIDTH : DOC_TEMPLATE_WIDTH;
				this.emit('DocumentEditorService::onClose', { needsContainerRemoval: !this.viewPort });
				resolve();
			});
		});
	}

	/**
	 * Opens the document editor if conditions are met (e.g. promo not shown).
	 *
	 * @param {object} params
	 * @param {string} articleCode
	 */
	maybeShowDocumentEditor(params, articleCode)
	{
		if (articleCode)
		{
			if (this.messengerFacade?.openHelpArticle)
			{
				this.messengerFacade.openHelpArticle(articleCode);
			}

			return;
		}

		this.showDocumentEditor(params);
	}

	/**
	 * Sets the maximum width available for the document editor sidebar.
	 *
	 * @param {number} maxWidth
	 */
	setMaxWidth(maxWidth)
	{
		if (maxWidth !== this.maxEditorWidth)
		{
			this.maxEditorWidth = maxWidth;
			this.emit('DocumentEditorService::onResize');
		}
	}

	/**
	 * Shows or hides the document editor sidebar without destroying it.
	 *
	 * @param {boolean} hidden
	 */
	toggleHidden(hidden)
	{
		if (!this.sidebar)
		{
			return;
		}

		this.sidebar.toggleHidden(hidden);

		if (!hidden)
		{
			this._onResize();
		}
	}

	/**
	 * Returns whether the document editor sidebar is currently open.
	 *
	 * @returns {boolean}
	 */
	hasSidebar()
	{
		return Boolean(this.sidebar);
	}

	/**
	 * Returns the document type string used for analytics tracking.
	 *
	 * @returns {string}
	 */
	getDocumentType()
	{
		if (this.docEditor?.options?.type === DocumentType.Resume)
		{
			return 'resume';
		}

		switch (this.docEditor?.options?.typeFile)
		{
			case FILE_TYPE_DOCX:
				return 'doc';
			case FILE_TYPE_XLSX:
				return 'sheet';
			case FILE_TYPE_PPTX:
				return 'presentation';
			default:
				return '';
		}
	}

	/**
	 * Marks that a document has been created for the current call (from a remote participant).
	 * Updates the maximum editor width accordingly.
	 */
	setDocumentCreated()
	{
		this.docCreatedForCurrentCall = true;
		this.maxEditorWidth = DOC_EDITOR_WIDTH;
	}

	/**
	 * Resets the document-created state when a call ends.
	 * Called by the controller when the current call is destroyed or the local user leaves.
	 */
	resetDocumentCreated()
	{
		this.docCreatedForCurrentCall = false;
	}

	/**
	 * Opens a document viewer by URL in the sidebar.
	 *
	 * @param {string} url
	 */
	viewDocumentByLink(url)
	{
		if (this.sidebar)
		{
			return;
		}

		this.maxEditorWidth = DOC_EDITOR_WIDTH;
		this.emit('DocumentEditorService::onOpen');
		this._createAndOpenSidebarWithIframe(url);
	}

	/**
	 * Releases all resources and event listeners held by this service.
	 */
	destroy()
	{
		this.callStore = null;

		this.closeDocumentEditor();

		if (this.documentsMenu)
		{
			this.documentsMenu.destroy();
			this.documentsMenu = null;
		}

		this.viewPort = null;
		this.container = null;
		this.resizeObserver = null;
		this.messengerFacade = null;
		this.docEditor = null;
		this.docEditorIframe = null;
		this.sidebar = null;
	}

	/**
	 * Recalculates and applies the split widths between the call view and the document editor sidebar.
	 */
	_onResize()
	{
		if (!this.sidebar || !this.viewPort)
		{
			return;
		}

		const result = this.findCallEditorWidth();
		this.viewPort.setMaxWidth(result.callWidth);
		this.sidebar.setWidth(result.editorWidth);
	}

	/**
	 * Calculates the optimal widths for the call view and document editor based on container width.
	 *
	 * @returns {{callWidth: number, editorWidth: number}}
	 */
	findCallEditorWidth()
	{
		const containerWidth = this.container.clientWidth;
		const editorWidth =	containerWidth < this.maxEditorWidth + this.minViewWidth
			? containerWidth - this.minViewWidth
			: this.maxEditorWidth;
		const callWidth = containerWidth - editorWidth;

		return { callWidth, editorWidth };
	}

	/**
	 * Builds the submenu of previously created resumes for a given call.
	 *
	 * @param {object} menuItem - The parent menu item whose submenu to populate.
	 * @param {string} callUuid - The UUID of the current call.
	 */
	buildPreviousResumesSubmenu(menuItem, callUuid)
	{
		BX.ajax
			.runAction('disk.api.integration.messengerCall.listResumesInChatByCall', {
				data: {
					callUuid,
				},
			})
			.then((response) => {
				const resumeList = response.data.resumes;

				if (resumeList.length > 0)
				{
					resumeList.forEach((resume) => {
						menuItem.getSubMenu().addMenuItem({
							id: resume.id,
							text: `${resume.object.createDate}: ${resume.object.name}`,
							onclick: () => {
								this.documentsMenu.close();
								this.emit('DocumentEditorService::onLastResumeOpen');
								this.viewDocumentByLink(resume.links.view);
							},
						});
					});
				}
				else
				{
					menuItem.getSubMenu().addMenuItem({
						id: 'nothing',
						text: BX.message('IM_M_CALL_MENU_NO_RESUME_MSGVER_2'),
						disabled: true,
					});
				}

				menuItem.getSubMenu().removeMenuItem('loading');
				menuItem.adjustSubMenu();
			});
	}

	/**
	 * Handles document creation: marks the call as having a document and notifies the controller.
	 */
	_onDocumentCreated()
	{
		this.docCreatedForCurrentCall = true;
		this.emit('DocumentEditorService::onDocumentCreated', { documentType: this.getDocumentType() });
	}

	/**
	 * Creates the sidebar DOM element and loads the iframe with the given URL.
	 *
	 * @param {string} url - The URL to load inside the iframe.
	 * @param {boolean} [animation] - Whether to animate the sidebar opening.
	 */
	_createAndOpenSidebarWithIframe(url, animation)
	{
		animation = animation === true;

		const result = this.findCallEditorWidth();

		this.viewPort.setMaxWidth(result.callWidth);
		this.sidebar = new Sidebar({
			container: this.container,
			width: result.editorWidth,
			events: {
				onCloseClicked: () => this.closeDocumentEditor(),
			},
		});
		this.sidebar.open(animation);

		const loader = new BX.Loader({
			target: this.sidebar.elements.contentContainer,
		});
		loader.show();

		const docEditorIframe = BX.create('iframe', {
			attrs: {
				src: url,
				frameborder: '0',
			},
			style: {
				display: 'none',
				border: '0',
				margin: '0',
				width: '100%',
				height: '100%',
			},
		});

		docEditorIframe.addEventListener(
			'load',
			() => {
				loader.destroy();
				docEditorIframe.style.display = 'block';
			},
			{ once: true },
		);

		docEditorIframe.addEventListener('error', (error) => {
			console.error(error);
			this.closeDocumentEditor();
			alert(BX.message('IM_F_ERROR'));
		});

		this.sidebar.elements.contentContainer.appendChild(docEditorIframe);
		this.docEditorIframe = docEditorIframe;
	}
}

import { Backend } from 'landing.backend';
import { Loc } from 'landing.loc';
import { Dom, Event } from 'main.core';
import { Popup } from 'main.popup';
import { MessageBox } from 'ui.dialogs.messagebox';

import { ExplorerUI, DataType, FolderType } from './ui';

import './explorer.css';

type ExplorerOptions = {
	type: string,
	siteId: number,
	folderId: ?number,
	startBreadCrumbs: ?Array<FolderType>
};

type ErrorType = {
	error: string,
	error_description: string
};

export class Explorer
{
	/** @var {Popup} */
	popupWindow = null;
	type: string;
	currentSiteId: number;
	currentFolderId: number;
	startBreadCrumbs: ?Array<FolderType>;
	#currentNode: ?HTMLElement = null;
	#statusRegion: ?HTMLElement = null;

	constructor(options: ExplorerOptions)
	{
		this.type = options.type;
		this.currentSiteId = options.siteId;
		this.currentFolderId = options.folderId;
		if (options.startBreadCrumbs)
		{
			this.startBreadCrumbs = options.startBreadCrumbs;
		}
		this.popupWindow = this.getPopupWindow();
	}

	getPopupWindow()
	{
		if (this.popupWindow === null)
		{
			this.popupWindow = new Popup({
				bindElement: null,
				className: 'ui-message-box landing-explorer--copy-page',
				content: null,
				titleBar: '&nbsp;',
				overlay: { opacity: 30 },
				closeIcon: false,
				contentBackground: 'transparent',
				padding: 0
			});
		}

		return this.popupWindow;
	}

	open()
	{
		this.popupWindow.setContent(
			ExplorerUI.getLoader()
		);
		this.popupWindow.show();
		this.#mountStatusRegion();
	}

	#mountStatusRegion()
	{
		if (this.#statusRegion === null)
		{
			this.#statusRegion = ExplorerUI.getLiveRegion();
		}
		const container = this.popupWindow.getPopupContainer();
		if (container && this.#statusRegion.parentElement !== container)
		{
			Dom.append(this.#statusRegion, container);
		}
	}

	#announce(message: string)
	{
		if (this.#statusRegion)
		{
			this.#statusRegion.textContent = message;
		}
	}

	errorAlert(errors: Array<ErrorType>)
	{
		MessageBox.show({
			message: errors[0].error_description,
			title: Loc.getMessage('LANDING_EXT_EXPLORER_ALERT_TITLE'),
			buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
			useAirDesign: true,
			onOk: (messageBox, button) => {
				button.setWaiting(false);
				messageBox.close();
				this.popupWindow.close();
			},
		});
	}

	setTitle(type: string, title: string)
	{
		this.popupWindow.setTitleBar(
			Loc.getMessage('LANDING_EXT_EXPLORER_TITLE_' + type.toUpperCase())
				.replace('#title#', title)
		);
	}

	setButtons(entityId: number, type: 'copy' | 'move' | 'moveFolder')
	{
		const typeUpper = type.toUpperCase();
		let action = null;
		let data = null;

		this.popupWindow.setButtons([
			ExplorerUI.getActionButton(
				(type === 'moveFolder')
				? Loc.getMessage('LANDING_EXT_EXPLORER_BUTTON_MOVE')
				: Loc.getMessage('LANDING_EXT_EXPLORER_BUTTON_' + typeUpper),
				() => {
					switch (type)
					{
						case 'copy':
							action = 'Landing::copy';
							data = {
								lid: entityId,
								toSiteId: this.currentSiteId,
								toFolderId: this.currentFolderId,
								skipSystem: true
							};
							break;
						case 'move':
							action = 'Landing::move';
							data = {
								lid: entityId,
								toSiteId: this.currentSiteId,
								toFolderId: this.currentFolderId
							};
							break;
						case 'moveFolder':
							action = 'Site::moveFolder';
							data = {
								folderId: entityId,
								toSiteId: this.currentSiteId,
								toFolderId: this.currentFolderId
							};
							break;
					}
					Backend.getInstance()
						.action(
							action,
							data,
							{
								site_id: this.currentSiteId,
								type: this.type
							},
						)
						.then(() => {
							const statusMessage = (type === 'copy')
								? Loc.getMessage('LANDING_EXT_EXPLORER_STATUS_COPIED')
								: Loc.getMessage('LANDING_EXT_EXPLORER_STATUS_MOVED');
							this.#announce(statusMessage);
							try
							{
								sessionStorage.setItem('landingExplorerStatus', statusMessage);
							}
							catch (e) {}
							this.popupWindow.setContent(
								ExplorerUI.getLoader()
							);
						})
						.then(() => {
							setTimeout(() => {
								window.location.reload();
							}, 500);
						})
						.catch(reason => {
							this.errorAlert(reason.result);
							//return Promise.reject(reason);
						})
				}
			),
			ExplorerUI.getCancelButton(() => {
				this.popupWindow.close();
			})
		]);
	}

	#loadBreadCrumbs(pos: number)
	{
		if (this.startBreadCrumbs[pos])
		{
			this.#loadFolders(
				this.currentSiteId,
				this.startBreadCrumbs[pos].PARENT_ID,
				() => {
					if (this.startBreadCrumbs[pos + 1])
					{
						this.#loadBreadCrumbs(pos + 1);
					}
					else
					{
						this.#clickFolder(this.startBreadCrumbs[pos].ID);
						this.#focusNode(this.#findItem(this.startBreadCrumbs[pos].ID, 'folderId'));
					}
				}
			);
		}
	}

	#loadSites()
	{
		Backend.getInstance()
			.action(
				'Site::getList',
				{
					params: {
						filter: {
							'=TYPE': this.type,
							'=SPECIAL': 'N'
						},
						order: {
							DATE_MODIFY: 'desc'
						}
					}
				},
				{
					type: this.type
				}
			)
			.then(result => {
				this.popupWindow.setContent(
					ExplorerUI.getSiteList(result, this.#clickSite.bind(this), this.type)
				);
				this.popupWindow.adjustPosition();
				this.#bindTreeKeyboard();
				this.#scrollToSite(this.currentSiteId);
				if (this.startBreadCrumbs.length > 0)
				{
					this.#selectSite(this.currentSiteId);
					this.#loadBreadCrumbs(0);
				}
				else
				{
					this.#clickSite(this.currentSiteId);
				}
				this.#focusInitialNode();
			});
	}

	#loadFolders(siteId: number, parentId: ?number, onLoad: ?() => {}, select: boolean = true)
	{
		Backend.getInstance()
			.action(
				'Site::getFolders',
				{
					siteId,
					filter: {
						PARENT_ID: parentId ? parentId : 0
					}
				},
				{
					site_id: siteId,
					type: this.type
				}
			)
			.then((result: Array<DataType>) => {
				const targetNode = (parentId > 0)
					? this.#findItem(parentId, 'folderId')
					: this.#findItem(siteId, 'siteId');
				if (targetNode)
				{
					targetNode.removeAttribute('data-explorer-loading');
				}
				if (result.length <= 0)
				{
					if (targetNode)
					{
						targetNode.removeAttribute('aria-expanded');
						targetNode.setAttribute('data-explorer-leaf', 'Y');
					}

					return;
				}
				const anchorItem = select
					? ((parentId > 0) ? this.#selectFolder(parentId) : this.#selectSite(siteId))
					: targetNode;
				if (!anchorItem)
				{
					return;
				}
				const setsize = result.length;
				result.reverse().map((item: DataType, reversedIndex: number) => {
					const posinset = setsize - reversedIndex;
					const folderExist = document.querySelector('.landing-site-selector-item[data-explorer-folderId="' + item.ID + '"]');
					if (!folderExist)
					{
						const depth = parseInt(Dom.attr(anchorItem, 'data-explorer-depth')) + 1;
						Dom.insertAfter(
							ExplorerUI.getFolderItem(item, depth, this.#clickFolder.bind(this), posinset, setsize),
							anchorItem
						);
					}
				});
				anchorItem.setAttribute('aria-expanded', 'true');
				this.#updateVisibility();
				if (onLoad)
				{
					onLoad();
				}
			})
			.catch(() => {
				// keep the node expandable on failure: clear the loading flag,
				// leave aria-expanded="false" and do not mark it a leaf so a repeated
				// keyboard expand (ArrowRight) can retry the load.
				const targetNode = (parentId > 0)
					? this.#findItem(parentId, 'folderId')
					: this.#findItem(siteId, 'siteId');
				targetNode?.removeAttribute('data-explorer-loading');
			});
	}

	#clickSite(siteId: number)
	{
		this.currentFolderId = 0;
		this.#setCurrentNode(this.#selectSite(siteId));
		this.#loadFolders(siteId);
	}

	#clickFolder(folderId: number)
	{
		this.#setCurrentNode(this.#selectFolder(folderId));
		this.#loadFolders(this.currentSiteId, folderId);
	}

	#selectSite(siteId: number): HTMLElement
	{
		this.currentSiteId = siteId;
		return this.#selectItem(siteId, 'siteId')
	}

	#selectFolder(folderId: number): HTMLElement
	{
		this.currentFolderId = folderId;
		return this.#selectItem(folderId, 'folderId')
	}

	#findItem(itemId: number, dataType: string): HTMLElement
	{
		return document.querySelector('.landing-site-selector-item[data-explorer-' + dataType + '="' + itemId + '"]');
	}

	#selectItem(itemId: number, dataType: string): HTMLElement
	{
		const currentSelect = document.querySelector('.landing-site-selector-item-selected');
		const newSelect = this.#findItem(itemId, dataType);
		if (currentSelect)
		{
			Dom.removeClass(currentSelect, 'landing-site-selector-item-selected');
			currentSelect.setAttribute('aria-selected', 'false');
		}
		if (newSelect)
		{
			Dom.addClass(newSelect, 'landing-site-selector-item-selected');
			newSelect.setAttribute('aria-selected', 'true');
		}

		return newSelect;
	}

	#scrollToSite(siteId: number)
	{
		const siteNode = document.querySelector('[data-explorer-siteId="' + siteId + '"]');
		if (siteNode)
		{
			// const posY = siteNode.getBoundingClientRect().y;
			// document.querySelector('.landing-site-selector-list').scrollTo(0, posY);
			siteNode.scrollIntoView(
				{
					behavior: 'smooth',
					block: 'nearest',
					inline: 'start'
				}
			);
		}
	}

	#getTree(): ?HTMLElement
	{
		return document.querySelector('.landing-site-selector-list');
	}

	#bindTreeKeyboard()
	{
		const tree = this.#getTree();
		if (tree)
		{
			Event.bind(tree, 'keydown', this.#handleTreeKeydown);
		}
	}

	#depthOf(node: HTMLElement): number
	{
		return parseInt(node.getAttribute('data-explorer-depth'), 10);
	}

	#isExpanded(node: HTMLElement): boolean
	{
		return node.getAttribute('aria-expanded') === 'true';
	}

	#firstChildOf(node: HTMLElement): ?HTMLElement
	{
		const next = node.nextElementSibling;
		if (next && this.#depthOf(next) === this.#depthOf(node) + 1)
		{
			return next;
		}

		return null;
	}

	#parentOf(node: HTMLElement): ?HTMLElement
	{
		const depth = this.#depthOf(node);
		if (depth <= 0)
		{
			return null;
		}
		let sibling = node.previousElementSibling;
		while (sibling)
		{
			if (this.#depthOf(sibling) === depth - 1)
			{
				return sibling;
			}
			sibling = sibling.previousElementSibling;
		}

		return null;
	}

	#siteIdOf(node: HTMLElement): number
	{
		let current = node;
		while (current && this.#depthOf(current) > 0)
		{
			current = this.#parentOf(current);
		}

		return current
			? parseInt(current.getAttribute('data-explorer-siteId'), 10)
			: this.currentSiteId;
	}

	#visibleTreeItems(): Array<HTMLElement>
	{
		const tree = this.#getTree();
		if (!tree)
		{
			return [];
		}

		return [...tree.querySelectorAll('.landing-site-selector-item')]
			.filter(node => !node.hasAttribute('hidden'));
	}

	#updateVisibility()
	{
		const tree = this.#getTree();
		if (!tree)
		{
			return;
		}
		let collapseDepth = null;
		tree.querySelectorAll('.landing-site-selector-item').forEach(node => {
			const depth = this.#depthOf(node);
			if (collapseDepth !== null && depth > collapseDepth)
			{
				node.setAttribute('hidden', '');

				return;
			}
			collapseDepth = null;
			node.removeAttribute('hidden');
			if (node.getAttribute('aria-expanded') === 'false')
			{
				collapseDepth = depth;
			}
		});
	}

	#setCurrentNode(node: ?HTMLElement)
	{
		if (!node)
		{
			return;
		}
		if (this.#currentNode && this.#currentNode !== node)
		{
			this.#currentNode.setAttribute('tabindex', '-1');
		}
		node.setAttribute('tabindex', '0');
		this.#currentNode = node;
	}

	#focusNode(node: ?HTMLElement)
	{
		if (!node)
		{
			return;
		}
		this.#setCurrentNode(node);
		node.focus();
	}

	#focusInitialNode()
	{
		const tree = this.#getTree();
		if (!tree)
		{
			return;
		}
		const selected = tree.querySelector('.landing-site-selector-item-selected');
		this.#focusNode(selected || this.#visibleTreeItems()[0]);
	}

	#expandNode(node: HTMLElement)
	{
		if (this.#firstChildOf(node))
		{
			node.setAttribute('aria-expanded', 'true');
			this.#updateVisibility();

			return;
		}
		if (node.getAttribute('data-explorer-leaf') === 'Y')
		{
			return;
		}
		if (node.getAttribute('data-explorer-loading') === 'Y')
		{
			return;
		}
		node.setAttribute('data-explorer-loading', 'Y');
		const folderId = node.getAttribute('data-explorer-folderId');
		if (folderId)
		{
			this.#loadFolders(this.#siteIdOf(node), parseInt(folderId, 10), null, false);
		}
		else
		{
			this.#loadFolders(parseInt(node.getAttribute('data-explorer-siteId'), 10), null, null, false);
		}
	}

	#collapseNode(node: HTMLElement)
	{
		node.setAttribute('aria-expanded', 'false');
		this.#updateVisibility();
	}

	#selectNode(node: HTMLElement)
	{
		const folderId = node.getAttribute('data-explorer-folderId');
		if (folderId)
		{
			this.#clickFolder(parseInt(folderId, 10));
		}
		else
		{
			this.#clickSite(parseInt(node.getAttribute('data-explorer-siteId'), 10));
		}
	}

	#handleTreeKeydown = (event: KeyboardEvent) => {
		const nodes = this.#visibleTreeItems();
		const index = nodes.indexOf(event.target);
		if (index < 0)
		{
			return;
		}
		const node = event.target;
		switch (event.key)
		{
			case 'ArrowDown':
				this.#focusNode(nodes[Math.min(index + 1, nodes.length - 1)]);
				break;
			case 'ArrowUp':
				this.#focusNode(nodes[Math.max(index - 1, 0)]);
				break;
			case 'Home':
				this.#focusNode(nodes[0]);
				break;
			case 'End':
				this.#focusNode(nodes[nodes.length - 1]);
				break;
			case 'ArrowRight':
				if (!this.#isExpanded(node))
				{
					this.#expandNode(node);
				}
				else
				{
					this.#focusNode(this.#firstChildOf(node));
				}
				break;
			case 'ArrowLeft':
				if (this.#isExpanded(node))
				{
					this.#collapseNode(node);
				}
				else
				{
					this.#focusNode(this.#parentOf(node));
				}
				break;
			case 'Enter':
			case ' ':
			case 'Spacebar':
				this.#selectNode(node);
				break;
			default:
				return;
		}
		event.preventDefault();
	};

	copy(landing: DataType)
	{
		this.setTitle('copy', landing.TITLE);
		this.setButtons(landing.ID, 'copy');
		this.open();
		this.#loadSites();
	}

	move(landing: DataType)
	{
		this.setTitle('move', landing.TITLE);
		this.setButtons(landing.ID, 'move');
		this.open();
		this.#loadSites();
	}

	moveFolder(folder: FolderType)
	{
		this.setTitle('move', folder.TITLE);
		this.setButtons(folder.ID, 'moveFolder');
		this.open();
		this.#loadSites();
	}
}

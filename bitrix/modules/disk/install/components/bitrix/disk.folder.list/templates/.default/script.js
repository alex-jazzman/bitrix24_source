BX.namespace('BX.Disk');
BX.Disk.FolderListClass = (function() {
	const FolderListClass = function(parameters)
	{
		this.layout = parameters.layout || {};
		this.errors = parameters.errors || [];
		this.showSearchNotice = parameters.showSearchNotice;
		this.information = parameters.information || '';

		this.currentFolder = parameters.currentFolder || {};
		this.gridId = parameters.gridId;
		this.isTrashMode = parameters.isTrashMode;
		this.actionPanel = parameters.actionPanel || {};
		this.actionPanel.key = String(this.actionPanel.key || '');
		this.filterValueToSkipSearchUnderLinks = parameters.filterValueToSkipSearchUnderLinks || {};
		this.filterId = parameters.filterId;
		this.searchSessionId = 0;
		this.activeSearchSession = null;

		if (BX.Main.gridManager)
		{
			this.commonGrid = new BX.Disk.Model.FolderList.CommonGrid({
				instance: BX.Main.gridManager.getById(this.gridId).instance,
			});
		}
		else
		{
			this.commonGrid = new BX.Disk.Model.FolderList.CommonGrid({
				instance: BX.Main.tileGridManager.getById(this.gridId).instance,
			});
		}

		this.filter = BX.Main.filterManager.getById(this.filterId);

		this.relativePath = parameters.relativePath;
		this.gridShowTreeButton = BX(parameters.gridShowTreeButton);
		this.rootObject = parameters.rootObject || {};
		this.storage = parameters.storage || {};
		this.storage.manage = this.storage.manage || {};
		this.enabledModZip = parameters.enabledModZip || false;
		this.enabledExternalLink = parameters.enabledExternalLink;
		this.enabledObjectLock = parameters.enabledObjectLock;
		this.getFilesCountAndSize = parameters.getFilesCountAndSize || {};
		this.cacheExternalLinks = {};
		this.createBlankFileUrl = parameters.createBlankFileUrl;
		this.renameBlankFileUrl = parameters.renameBlankFileUrl;
		this.defaultService = parameters.defaultService;
		this.defaultServiceLabel = parameters.defaultServiceLabel;

		this.isUserCollaber = parameters.isUserCollaber;
		this.collaberTourOnAddButtonId = parameters.collaberTourOnAddButtonId;
		this.isCollaberTourOnAddButtonViewed = parameters.isCollaberTourOnAddButtonViewed;
		this.readonlyCollabFolderStateCookieName = parameters.readonlyCollabFolderStateCookieName;

		this.sortFields = parameters.sortFields;
		this.sort = parameters.sort;

		this.actionGroupButton = parameters.actionGroupButton || 'move';
		this.isBitrix24 = parameters.isBitrix24 || false;

		this.destFormName = parameters.destFormName || 'folder-list-destFormName';

		this.ajaxUrl = '/bitrix/components/bitrix/disk.folder.list/ajax.php';
		this.baseGridPageUrl = document.location.toString();

		BX.Disk.Page.changeFolder({
			id: this.currentFolder.id,
			name: this.currentFolder.name,
		});

		BX.Disk.Page.changeStorage(this.storage);

		this.setEvents();
		this.subscribeToActionPanel();

		if (this.shouldUseHistory())
		{
			window.history.replaceState(
				{
					disk: true,
					folder: {
						id: this.currentFolder.id,
					},
				},
				null,
				this.baseGridPageUrl,
			);
		}

		this.workWithLocationHash();
		this.processCommand();

		if (this.errors.length > 0)

		
    { this.showErrors();
		}

		if (this.information.length > 0)

		
    { this.showInformation();
		}

		if (!this.currentFolder.canAdd)
		{
			this.setInactiveStateToCreateItemsButton();
		}

		if (this.needRunFilterUnderLinks())
		{
			this.rerunFilter();
		}

		this.analytics = parameters.analytics || null;

		const showFile = parameters.showFile ?? null;

		if (typeof showFile === 'object' && showFile !== null)
		{
			const showFileNode = document.getElementById('showFile');

			if (showFileNode)
			{
				showFileNode.click();
			}
		}
	};

	FolderListClass.prototype.openSharingPopup = function(params)
	{
		params = params || {};

		const object = params.object || {};
		if (!object.id)
		{
			console.error('FolderListClass.openSharingPopup: object.id is required');

			return;
		}

		BX.Runtime.loadExtension('disk.sharing-access-popup')
			.then(({ SharingPopupDialog }) => {
				const popup = new SharingPopupDialog();
				popup.open({
					objectId: object.id,
				});
			})
			.catch((error) => {
				console.error('Failed to open disk.sharing-access-popup', error);
			});
	};

	FolderListClass.prototype.rerunFilter = function()
	{
		const fakePromise = new BX.Promise();
		this.onFilterApply(this.filter.getParam('FILTER_ID'), {}, this.filter, fakePromise);
		fakePromise.fulfill();
	};

	FolderListClass.prototype.showInformation = function()
	{
		BX.Disk.showModalWithStatusAction({ status: 'success', message: this.information });
	};

	FolderListClass.prototype.showErrors = function()
	{
		BX.Disk.showModalWithStatusAction({ status: 'error', errors: this.errors });
	};

	FolderListClass.prototype.onHashChange = function()
	{
		const matches = document.location.hash.match(/hl-(\d+)/g);
		if (matches)
		{
			const command = (document.location.hash.match(/!([A-Za-z]+)/g) || []).pop();
			for (const i in matches)
			{
				if (!matches.hasOwnProperty(i))
				{
					continue;
				}
				const hl = matches[i];
				const number = hl.match(/hl-(\d+)/);
				if (number && number[1])
				{
					if (this.commonGrid.getItemById(number[1]))
					{
						this.commonGrid.scrollTo(number[1]);
						this.commonGrid.selectItemById(number[1]);
						this.runCommandOnObjectId(command, number[1]);
					}
					else if (command // we didn't find object on current page. May be it will be shown after reload :)
						&& window.BXIM && BXIM.isOpenNotify())
					{
						document.location.reload();
						BXIM.closeMessenger();
					}
				}
			}

			if (window.BXIM && BXIM.isOpenNotify())
			{
				BXIM.closeMessenger();
			}
		}
	};

	FolderListClass.prototype.processCommand = function()
	{
		if (BX.Disk.getUrlParameter('cmd') === 'openSliderBp' && this.storage.bpListLink)
		{
			const currentUrl = new URL(window.location.href);
			const params = new URLSearchParams(currentUrl.search);
			params.delete('cmd');
			currentUrl.search = params.toString();
			window.history.replaceState(null, null, currentUrl.toString());

			this.openSlider(this.storage.bpListLink);
		}
	};

	FolderListClass.prototype.shouldUseHistory = function()
	{
		return top === window;
	};

	FolderListClass.prototype.workWithLocationHash = function()
	{
		setTimeout(BX.delegate(function() {
			this.onHashChange();
		}, this), 350);
	};

	FolderListClass.prototype.setEvents = function()
	{
		BX.bind(this.getFilesCountAndSize.button, 'click', BX.proxy(this.onClickGetFilesCountAndSizeButtonButton, this));
		BX.bind(window, 'hashchange', BX.proxy(this.onHashChange, this));
		BX.bindDelegate(this.commonGrid.getContainer(), 'click', { className: 'js-disk-grid-open-folder' }, this.openGridFolder.bind(this));
		BX.bind(this.sort.layout.label, 'click', this.showGridSortingMenu.bind(this));

		for (let i = 0; i < this.layout.changeViewButtons.length; ++i)
		{
			BX.bind(BX(this.layout.changeViewButtons[i]), 'click', this.changeView.bind(this));
		}

		BX.addCustomEvent('SidePanel.Slider:onMessage', this.onSliderMessage.bind(this));
		BX.addCustomEvent('Disk.OnlyOffice:onSaved', this.handleDocumentSaved.bind(this));

		BX.bind(window, 'popstate', this.onPopState.bind(this));

		BX.addCustomEvent('onIframeElementLoadDataToView', BX.proxy(this.onIframeElementLoadDataToView, this));
		BX.addCustomEvent('onBeforeElementShow', BX.proxy(this.onBeforeElementShow, this));

		BX.addCustomEvent('onCreateExtendedFolder', BX.proxy(this.onCreateExtendedFolder, this));

		BX.addCustomEvent('Grid::beforeRequest', this.onBeforeGridRequest.bind(this));
		BX.addCustomEvent('BX.TileGrid.Grid:beforeReload', this.onBeforeGridRequest.bind(this));
		if (this.commonGrid.isGrid())
		{
			BX.addCustomEvent(this.commonGrid.getContainer(), 'Grid::optionsChanged', this.onGridOptionsChanged.bind(this));
		}
		BX.addCustomEvent('Grid::updated', this.onGridUpdated.bind(this));
		BX.addCustomEvent('BX.Main.Filter:beforeApply', this.onBeforeFilterApply.bind(this));
		BX.addCustomEvent('BX.Main.Filter:apply', this.onFilterApply.bind(this));

		BX.addCustomEvent('onPopupFileUploadClose', this.onPopupFileUploadClose.bind(this));

		if (this.isTrashMode)
		{
			BX.addCustomEvent('onStepperProgress', this.onStepperHasBeenFinished.bind(this));
			BX.addCustomEvent('onStepperHasBeenFinished', this.onStepperHasBeenFinished.bind(this));
		}

		BX.addCustomEvent('Disk.Page:onChangeFolder', this.onChangeFolder.bind(this));
		BX.addCustomEvent('Disk.TileItem.Item:onItemDblClick', this.onItemDblClick.bind(this));
		BX.addCustomEvent('Disk.TileItem.Item:onItemEnter', this.onItemDblClick.bind(this));
		BX.addCustomEvent('Disk.TileItem.Item:onTitleClick', this.handleTitleClickOnTileItem.bind(this));
		BX.addCustomEvent('Disk.Breadcrumbs:onClickBreadcrumb', this.handleClickOnBreadcrumb.bind(this));
		BX.addCustomEvent(this.commonGrid.instance, 'TileGrid.Grid:onItemRemove', this.handleItemRemoveByTileGrid.bind(this));
		BX.addCustomEvent(this.commonGrid.instance, 'TileGrid.Grid:onItemMove', this.onItemMove.bind(this));

		BX.addCustomEvent('Disk:onChangeDocumentService', this.onChangeDocumentService.bind(this));
	};

	FolderListClass.prototype.getCurrentActionPanel = function()
	{
		const registry = BX.Disk.folderListActionPanels || {};
		const panel = registry[this.actionPanel.key];

		if (!panel || panel.renderTo !== this.actionPanel.renderTo)
		{
			return null;
		}

		return panel;
	};

	FolderListClass.prototype.subscribeToActionPanel = function()
	{
		if (this.isActionPanelSubscribed)
		{
			return;
		}

		const panel = this.getCurrentActionPanel();
		if (!panel)
		{
			return;
		}

		this.isActionPanelSubscribed = true;
		BX.addCustomEvent(panel, 'BX.UI.ActionPanel:showPanel', () => {
			this.refreshDestroyGroupAction();
		});
	};

	FolderListClass.prototype.onBeforeFilterApply = function(filterId, data, filter, promise) {
		if (filterId !== this.filterId)
		{
			return;
		}

		this.cancelSearchSession();
		this.isFiltetedFolderList = true;
		promise.then(() => {
			if (filter.getSearch().getSearchString() || filter.getSearch().getSquares().length > 0)
			{
				this.blockSorting();
			}
			else
			{
				this.unblockSorting();
			}
		});
	};

	FolderListClass.prototype.blockSorting = function()
	{
		if (this.commonGrid.isGrid())
		{
			this.commonGrid.instance.blockSorting();
		}
		this.sort.layout.label.style.pointerEvents = 'none';
	};

	FolderListClass.prototype.unblockSorting = function()
	{
		if (this.commonGrid.isGrid())
		{
			this.commonGrid.instance.unblockSorting();
		}
		this.sort.layout.label.style.pointerEvents = null;
	};

	const _getSymlinksUnderObjectId = [];
	FolderListClass.prototype.getSymlinksUnderObjectId = function(object, session)
	{
		const objectId = object.id;
		if (_getSymlinksUnderObjectId[objectId] !== undefined)
		{
			const result = new BX.Promise();
			result.fulfill(
				!session || this.isCurrentSearchSession(session) ? _getSymlinksUnderObjectId[objectId] : [],
			);

			return result;
		}
		const promise = new BX.Promise();

		BX.Disk.ajax({
			method: 'POST',
			dataType: 'json',
			url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'showSymlinks'),
			data: object,
			onsuccess: (data) => {
				if (!data || data.status !== 'success' || !BX.type.isArray(data.items))
				{
					promise.reject(data);

					return;
				}

				_getSymlinksUnderObjectId[objectId] = data.items;
				promise.fulfill(
					!session || this.isCurrentSearchSession(session) ? _getSymlinksUnderObjectId[objectId] : [],
				);
			},
			onfailure: (error) => {
				promise.reject(error);
			},
		});

		return promise;
	};

	FolderListClass.prototype.needRunFilterUnderLinks = function()
	{
		if (!this.filter.getSearch().getSearchString() && this.filter.getSearch().getSquares().length === 0)
		{
			return false;
		}

		for (const field in this.filterValueToSkipSearchUnderLinks)
		{
			if (!this.filterValueToSkipSearchUnderLinks.hasOwnProperty(field))
			{
				continue;
			}

			const value = this.filterValueToSkipSearchUnderLinks[field];
			const filterFieldsValues = this.filter.getFilterFieldsValues();
			if (filterFieldsValues[field] == value)
			{
				return false;
			}
		}

		return true;
	};

	FolderListClass.prototype.showPopupWindowInfo = function(target) {
		this.popupWindowInfo = new BX.PopupWindow('disk-folder-list-popup-info', target, {
			className: 'disk-folder-list-popup-info',
			autoHide: true,
			zIndex: 200,
			closeByEsc: true,
			offsetTop: 5,
			width: target.offsetWidth - 20,
			content: `<span class="disk-folder-list-popup-info-content">${BX.message('DISK_FOLDER_LIST_SEARCH_INDEX_NOTICE_1')}</span>`,
		});

		this.popupWindowInfo.show();
	};

	FolderListClass.prototype.onFilterApply = function(filterId, data, filter, promise, params)
	{
		if (this.showSearchNotice && filter.getSearch().getSearchString())
		{
			setTimeout(() => {
				this.showPopupWindowInfo(filter.search.container);
			}, 200);
		}

		if (filterId !== this.filterId)
		{
			return;
		}

		this.cancelSearchSession();

		if (this.commonGrid.isTile())
		{
			promise = promise.then(() => {
				return this.commonGrid.reload();
			});
		}

		if (!this.needRunFilterUnderLinks())
		{
			return;
		}

		this.runAfterFilterOpenFolder = this.resetFilter.bind(this);

		const folder = BX.Disk.Page.getFolder();
		folder.link = window.location.pathname.toString();
		const session = this.beginSearchSession(folder);

		promise.then(() => {
			if (!this.isCurrentSearchSession(session))
			{
				return;
			}

			if (!this.commonGrid.countItems())
			{
				if (this.commonGrid.isTile())
				{
					this.commonGrid.instance.removeEmptyBlock();
					this.commonGrid.instance.setMinHeightContainer();
				}

				session.faded = true;
				this.commonGrid.fade();
			}

			this.getSymlinksUnderObjectId(folder, session).then(
				(items) => {
					this.searchConnectedFolders(session, items);
				},
				() => {
					this.finishSearchSession(session);
				},
			);
		}, () => {
			this.finishSearchSession(session);
		});
	};

	FolderListClass.prototype.searchConnectedFolders = function(session, items)
	{
		let queue = new BX.Promise();
		const startPromise = queue;

		items.forEach((symlink, index) => {
			queue = queue.then(() => {
				return this.requestConnectedFolder(session, symlink, items.length === index + 1);
			});
		});

		const finishSearch = () => {
			this.finishSearchSession(session);
		};
		queue.then(
			finishSearch,
			finishSearch,
		);

		startPromise.fulfill();
	};

	FolderListClass.prototype.requestConnectedFolder = function(session, symlink, isLast)
	{
		const requestPromise = new BX.Promise();
		if (!this.isCurrentSearchSession(session))
		{
			requestPromise.fulfill();

			return requestPromise;
		}

		const grid = this.commonGrid.instance;
		const data = {
			viewGridStorageId: BX.Disk.Page.getStorage().id,
		};

		if (!isLast && this.commonGrid.countItems() > 0)
		{
			this.showSearchProcessInConnectedFolders(session);
		}

		if (this.commonGrid.isGrid())
		{
			const gridData = grid.getData();
			gridData.request(
				symlink.link,
				'POST',
				data,
				null,
				() => {
					try
					{
						if (this.isCurrentSearchSession(session))
						{
							this.applySearchResponse(session, gridData.getResponse());
						}

						requestPromise.fulfill();
					}
					catch (error)
					{
						requestPromise.reject(error);
					}
				},
				(xhr, error) => {
					requestPromise.reject(error || xhr);
				},
			);
		}
		else
		{
			BX.ajax.promise({
				url: BX.util.add_url_param(symlink.link, {
					grid_id: this.commonGrid.getId(),
					internal: true,
				}),
				method: 'POST',
				dataType: 'json',
				data,
			}).then(
				(response) => {
					try
					{
						if (this.isCurrentSearchSession(session))
						{
							this.applySearchResponse(session, response);
						}

						requestPromise.fulfill();
					}
					catch (error)
					{
						requestPromise.reject(error);
					}
				},
				(error) => {
					requestPromise.reject(error);
				},
			);
		}

		return requestPromise;
	};

	FolderListClass.prototype.applySearchResponse = function(session, response)
	{
		if (!this.isCurrentSearchSession(session))
		{
			return false;
		}

		if (this.commonGrid.isGrid())
		{
			const grid = this.commonGrid.instance;
			const bodyRows = BX.Grid.Utils.getByClass(response, grid.settings.get('classBodyRow'));
			if (!BX.type.isArray(bodyRows))
			{
				throw new TypeError('Invalid connected folder search response');
			}

			if (
				bodyRows.length === 0
				|| (
					bodyRows.length === 1
					&& BX.hasClass(bodyRows[0], grid.settings.get('classEmptyRows'))
				)
			)
			{
				return true;
			}

			BX.remove(BX.Grid.Utils.getByClass(grid.getContainer(), grid.settings.get('classEmptyRows'), true));
			grid.adjustEmptyTable(bodyRows);
			grid.getUpdater().appendBodyRows(bodyRows);
			grid.getRows().reset();
			grid.bindOnRowEvents();
			grid.updateCounterDisplayed();
			grid.updateCounterSelected();

			return true;
		}

		if (
			!response
			|| !response.data
			|| !response.data.tileGrid
			|| !BX.type.isArray(response.data.tileGrid.items)
		)
		{
			throw new TypeError('Invalid connected folder search response');
		}

		response.data.tileGrid.items.forEach((item) => {
			this.commonGrid.instance.appendItem(item);
		});

		return true;
	};

	FolderListClass.prototype.resetFilter = function()
	{
		this.isFiltetedFolderList = false;
		this.filter.getApi().setFields({});
		this.filter.getSearch().clearForm();
		this.filter.getSearch().adjustPlaceholder();
	};

	FolderListClass.prototype.onChangeDocumentService = function(service)
	{
		const shouldHide = service !== 'l';

		this.commonGrid.getIds().forEach((objectId) => {
			const actionEdit = this.commonGrid.getActionById(objectId, 'edit');
			if (!actionEdit)
			{
				return;
			}
			actionEdit.hide = shouldHide;
			const menu = this.commonGrid.getActionsMenu(objectId);
			menu.getMenuItem('edit').hide = shouldHide;

			if (shouldHide)
			{
				BX.addClass(menu.getMenuItem('edit').layout.item, 'disk-popup-menu-hidden-item');
			}
			else
			{
				BX.removeClass(menu.getMenuItem('edit').layout.item, 'disk-popup-menu-hidden-item');
			}
		});
	};

	FolderListClass.prototype.onItemMove = function(sourceItem, destinationItem)
	{
		if (this.isTrashMode)
		{}
		else
		{
			BX.ajax.runAction('disk.api.commonActions.move', {
				analyticsLabel: 'folder.list.dd',
				data: {
					objectId: sourceItem.getId(),
					toFolderId: destinationItem.getId(),
				},
			});
		}
	};

	FolderListClass.prototype.handleItemRemoveByTileGrid = function(item)
	{
		if (!this.isTrashMode)
		{
			BX.ajax.runAction('disk.api.commonActions.markDeleted', {
				analyticsLabel: 'folder.list.dd',
				data: {
					objectId: item.getId(),
				},
			});
		}
	};

	FolderListClass.prototype.onItemDblClick = function(item)
	{
		if (item.isFolder)
		{
			this.onOpenFolder({
				id: item.getId(),
				name: item.name,
				link: item.item.titleLink.href,
			});
		}
		else
		{
			// BX.SidePanel.Instance.open(item.link);
			BX.fireEvent(item.item.titleLink, 'click');
		}
	};

	FolderListClass.prototype.handleTitleClickOnTileItem = function(item, event)
	{
		if (item.isFolder)
		{
			this.openFolderByAnchor(item.item.titleLink, event);
		}
	};

	FolderListClass.prototype.handleClickOnBreadcrumb = function(breadcrumbLink, event)
	{
		this.openFolderByAnchor(breadcrumbLink, event);
	};

	FolderListClass.prototype.onChangeFolder = function(folder, newFolder)
	{
		if (BX.type.isFunction(this.runAfterFilterOpenFolder))
		{
			this.runAfterFilterOpenFolder();
			this.runAfterFilterOpenFolder = null;

			const folderState = history.state.folder;
			folderState.link = window.location.pathname.toString();

			BX.onCustomEvent('Disk.FolderListClass:openFolderAfterFilter', [folderState]);
		}
	};

	FolderListClass.prototype.onGridUpdated = function()
	{};

	FolderListClass.prototype.onGridOptionsChanged = function(grid)
	{
		const options = grid.getUserOptions().getCurrentOptions();
		this.sort.sortBy = options.last_sort_by;
		this.sort.direction = options.last_sort_order;

		const sortByItem = this.sortFields.find(function(item) {
			return item.field === this.sort.sortBy;
		}, this);

		if (sortByItem)
		{
			BX.adjust(this.sort.layout.label, {
				text: sortByItem.label,
			});
		}
	};

	FolderListClass.prototype.onBeforeGridRequest = function(ctx, requestParams)
	{
		if (this.gridId !== requestParams.gridId)
		{
			return;
		}

		if (!requestParams.url)
		{
			requestParams.url = this.baseGridPageUrl;
		}

		if (requestParams.data.controls)
		{
			const obj = {};
			requestParams.data.rows.forEach((e) => {
				obj[e] = { ID: e };
			});

			requestParams.data.rows = obj;
		}

		if (requestParams.data.FIELDS || requestParams.data.ID)
		{
			if (requestParams.data.FIELDS)
			{
				requestParams.data.rows = requestParams.data.FIELDS;
			}
			else if (requestParams.data.ID)
			{
				const objId = {};
				requestParams.data.ID.forEach((id) => {
					objId[id] = { ID: id };
				});

				requestParams.data.rows = objId;
			}

			requestParams.data.FIELDS = null;
			requestParams.data.ID = null;
			requestParams.data.controls = requestParams.data.controls || {};

			if (this.commonGrid.isGrid())
			{
				requestParams.data.controls = BX.mergeEx(requestParams.data.controls, BX.clone(requestParams.data));
			}
		}
	};

	FolderListClass.prototype.runCommandOnObjectId = function(command, objectId)
	{
		if (!command)
		{
			return;
		}

		switch (command.toLowerCase())
		{
			case '!disconnect':
			case '!detach':
				var menuItem = this.commonGrid.getActionsMenu(objectId).getMenuItem(command.toLowerCase().slice(1));
				if (!menuItem || !menuItem.onclick)
				{
					return;
				}

				eval(menuItem.onclick);
				break;
			case '!share':
				var menuItem = this.commonGrid.getActionsMenu(objectId).getMenuItem('share-section');
				if (!menuItem || !menuItem.hasSubMenu())
				{
					return;
				}
				menuItem.addSubMenu(menuItem._items);
				menuItem = menuItem.getSubMenu().getMenuItem(command.toLowerCase().slice(1));
				if (!menuItem || !menuItem.onclick)
				{
					return;
				}

				eval(menuItem.onclick);
				break;
			case '!show':
				var linkWithObject = BX(`disk_obj_${objectId}`);
				if (linkWithObject)
				{
					BX.fireEvent(linkWithObject, 'click');
				}
				break;
			default:
				break;
		}
	};

	// todo create object which will describe folder/file.
	function getObjectDataId(objectId)
	{
		const row = this.getRow(objectId);

		return {
			row: this.getRow(objectId),
			title: BX.findChild(row.node, {
				tagName: 'a',
				className: 'bx-disk-folder-title',
			}, true),
			icon: BX.findChild(row.node, (node) => {
				return BX.type.isElementNode(node) && (BX.hasClass(node, 'bx-disk-file-icon') || BX.hasClass(node, 'bx-disk-folder-icon'));
			}, true),
		};
	}

	function getIconElementByObjectId(objectId)
	{
		const row = this.getRow(objectId);

		return BX.findChild(row.node, (node) => {
			return BX.type.isElementNode(node) && (BX.hasClass(node, 'bx-disk-file-icon') || BX.hasClass(node, 'bx-disk-folder-icon'));
		}, true);
	}

	FolderListClass.prototype.scrollToObject = function(objectId)
	{
		const row = this.getRow(objectId);
		this.scrollToRow(row);
	};

	FolderListClass.prototype.scrollToRow = function(row)
	{
		const rowNode = row.node;

		(new BX.easing({
			duration: 500,
			start: { scroll: window.pageYOffset || document.documentElement.scrollTop },
			finish: { scroll: BX.pos(rowNode).top },
			transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
			step(state) {
				window.scrollTo(0, state.scroll);
			},
		})).animate();
	};

	FolderListClass.prototype.openMenuWithServices = function(targetElement) {
		const obElementViewer = new BX.CViewer({});
		BX.PopupMenu.show(
			'disk_open_menu_with_services',
			BX(targetElement),
			[
				{
					text: BX.message('DISK_FOLDER_TOOLBAR_LABEL_LOCAL_BDISK_EDIT'),
					className: 'bx-viewer-popup-item item-b24',
					href: '#',
					onclick: BX.delegate(function(e) {
						if (BX.CViewer.isEnableLocalEditInDesktop())
						{
							this.setEditService('l');
							BX.adjust(BX('bx-disk-default-service-label'), { text: BX.message('DISK_FOLDER_TOOLBAR_LABEL_LOCAL_BDISK_EDIT') });
							BX.PopupMenu.destroy('disk_open_menu_with_services');
						}
						else
						{
							this.helpDiskDialog();
						}

						return BX.PreventDefault(e);
					}, obElementViewer),
				},
				{
					text: obElementViewer.getNameEditService('google'),
					className: 'bx-viewer-popup-item item-gdocs',
					href: '#',
					onclick: BX.delegate(function(e) {
						this.setEditService('google');
						BX.adjust(BX('bx-disk-default-service-label'), { text: this.getNameEditService('google') });
						BX.PopupMenu.destroy('disk_open_menu_with_services');

						return BX.PreventDefault(e);
					}, obElementViewer),
				},
				{
					text: obElementViewer.getNameEditService('office365'),
					className: 'bx-viewer-popup-item item-office365',
					href: '#',
					onclick: BX.delegate(function(e) {
						this.setEditService('office365');
						BX.adjust(BX('bx-disk-default-service-label'), { text: this.getNameEditService('office365') });
						BX.PopupMenu.destroy('disk_open_menu_with_services');

						return BX.PreventDefault(e);
					}, obElementViewer),
				},
				{
					text: obElementViewer.getNameEditService('skydrive'),
					className: 'bx-viewer-popup-item item-office',
					href: '#',
					onclick: BX.delegate(function(e) {
						this.setEditService('skydrive');
						BX.adjust(BX('bx-disk-default-service-label'), { text: this.getNameEditService('skydrive') });
						BX.PopupMenu.destroy('disk_open_menu_with_services');

						return BX.PreventDefault(e);
					}, obElementViewer),
				},
			],
			{
				angle: {
					position: 'top',
					offset: 45,
				},
				autoHide: true,
				overlay: {
					opacity: 0.01,
				},
			},
		);
	};

	FolderListClass.prototype.blockFeatures = function() {
		BX.PopupWindowManager.create('bx-disk-business-tools-info', null, {
			content: BX('bx-bitrix24-business-tools-info'),
			closeIcon: true,
			onPopupClose()
			{
				this.destroy();
			},
			autoHide: true,
			zIndex: 11000,
		}).show();
	};

	FolderListClass.prototype.runCreatingFile = function(documentType, service, popupItem, onSuccess = null, byUnifiedLink = false) {
		if (BX.message('disk_restriction'))
		{
			this.blockFeatures();

			return;
		}

		if (service === 'l' && BX.Disk.Document.Local.Instance.isEnabled())
		{
			BX.Disk.Document.Local.Instance.createFile({
				type: documentType,
				targetFolderId: BX.Disk.Page.getFolder().id,
			}).then((response) => {
				this.commonGrid.reload(BX.Disk.getUrlToShowObjectInGrid(response.object.id));
				if (onSuccess)
				{
					onSuccess(response);
				}
			});

			return;
		}

		const analytics = {
			...this.analytics,
			c_sub_section: 'new_element',
		};

		const createProcess = new BX.Disk.Document.CreateProcess({
			typeFile: documentType,
			targetFolderId: BX.Disk.Page.getFolder().id,
			serviceCode: service,
			byUnifiedLink,
			triggerNode: popupItem?.layout?.item,
			onAfterSave: function(response) {
				if (response.status === 'success')
				{
					this.commonGrid.reload(BX.Disk.getUrlToShowObjectInGrid(response.object.id));
					if (onSuccess)
					{
						onSuccess(response);
					}
				}
			}.bind(this),
			onAfterCreateFile: (response) => {
				popupItem?.getMenuWindow()?.getParentMenuWindow()?.close();
				if (response.status === 'success')
				{
					this.commonGrid.reload();
				}
			},
			analytics,
		});

		createProcess.start();
	};

	FolderListClass.prototype.changeView = function(event)
	{
		const link = BX.getEventTarget(event);
		if (link && this.commonGrid.isTile())
		{
			event.preventDefault();

			this.commonGrid.instance.changeTileSize(link.dataset.viewTileSize);

			for (let i = 0; i < this.layout.changeViewButtons.length; ++i)
			{
				this.layout.changeViewButtons[i].classList.remove('disk-folder-list-view-item-active');
			}

			link.classList.toggle('disk-folder-list-view-item-active');

			if (this.shouldUseHistory())
			{
				window.history.replaceState(null, null, BX.util.remove_url_param(document.location.toString(), 'viewSize'));
			}

			BX.ajax.runComponentAction('bitrix:disk.folder.list', 'saveViewOptions', {
				analyticsLabel: `tile.${link.dataset.viewTileSize}`,
				mode: 'class',
				data: {
					storageId: BX.Disk.Page.getStorage().id,
					viewMode: 'tile',
					viewSize: link.dataset.viewTileSize,
				},
			});
		}
	};

	FolderListClass.prototype.createFolder = function() {
		const self = this;
		const idSuffix = BX.util.getRandomString(6);
		const inputId = `disk-new-create-filename-${idSuffix}`;
		const errorId = `disk-new-create-folder-error-${idSuffix}`;

		const errorNode = BX.create('div', {
			props: {
				id: errorId,
				className: 'bx-disk-popup-error',
			},
			attrs: {
				role: 'alert',
				'data-testid': 'disk-folder-create-error',
			},
			style: {
				marginTop: '8px',
				color: 'var(--ui-color-accent-main-alert, #f76d63)',
				fontSize: '13px',
			},
		});

		const input = BX.create('input', {
			props: {
				id: inputId,
				className: 'bx-disk-popup-input',
				type: 'text',
				value: '',
			},
			attrs: {
				required: 'required',
				'aria-required': 'true',
				'aria-invalid': 'false',
				'aria-describedby': errorId,
				'data-testid': 'disk-folder-create-name-input',
			},
			style: {
				fontSize: '16px',
				marginTop: '10px',
			},
		});

		const clearError = () => {
			if (errorNode.textContent === '')
			{
				return;
			}
			errorNode.textContent = '';
			input.setAttribute('aria-invalid', 'false');
		};

		const showError = () => {
			BX.addClass(input, 'disk-animated disk-animate-shake');
			input.addEventListener('animationend', () => {
				BX.removeClass(input, 'disk-animated disk-animate-shake');
			}, { once: true });

			errorNode.textContent = BX.message('DISK_FOLDER_ERROR_EMPTY_NAME_CREATE_FOLDER');
			input.setAttribute('aria-invalid', 'true');
			BX.focus(input);
		};

		BX.bind(input, 'input', clearError);

		const content = BX.create('div', {
			children: [
				BX.create('label', {
					props: {
						className: 'bx-disk-popup-label',
					},
					attrs: {
						for: inputId,
					},
					children: [
						BX.create('span', {
							props: {
								className: 'req',
							},
							attrs: {
								'aria-hidden': 'true',
							},
							text: '*',
						}),
						BX.create('span', {
							text: BX.message('DISK_FOLDER_LABEL_NAME_CREATE_FOLDER'),
						}),
					],
				}),
				input,
				errorNode,
			],
		});

		this.showAirMessageBox({
			title: BX.message('DISK_FOLDER_TITLE_CREATE_FOLDER'),
			message: content,
			popupOptions: {
				closeByEsc: true,
				focusTrap: true,
				events: {
					onAfterPopupShow() {
						BX.focus(input);
					},
				},
			},
			buttonsFactory(messageBox) {
				let submitting = false;

				const submit = (button) => {
					if (submitting)
					{
						return;
					}

					const newName = input.value;
					if (!newName || !newName.replaceAll(/\s+/g, ''))
					{
						showError();

						return;
					}

					submitting = true;
					button.setWaiting(true);

					BX.Disk.ajax({
						method: 'POST',
						dataType: 'json',
						url: BX.Disk.addToLinkParam(self.ajaxUrl, 'action', 'addFolder'),
						data: {
							targetFolderId: BX.Disk.Page.getFolder().id,
							name: newName,
						},
						onsuccess(data) {
							if (!data)
							{
								submitting = false;
								button.setWaiting(false);

								return;
							}

							if (data.status && data.status === 'success')
							{
								messageBox.close();

								self.commonGrid.reload(
									BX.Disk.getUrlToShowObjectInGrid(data.folder.id, { resetFilter: 1 }),
									{},
								).then(() => {
									self.resetFilter();
									self.commonGrid.selectItemById(data.folder.id);

									if (self.commonGrid.isGrid())
									{
										const row = self.getRow(data.folder.id);
										self.scrollToRow(row);
									}
								});
							}
							else
							{
								submitting = false;
								button.setWaiting(false);
								BX.Disk.showModalWithStatusAction(data);
							}
						},
					});
				};

				const createButton = new BX.UI.Button({
					text: BX.message('DISK_FOLDER_BTN_CREATE_FOLDER'),
					useAirDesign: true,
					style: BX.UI.AirButtonStyle.FILLED,
					wide: true,
					onclick(button) {
						submit(button);
					},
				});
				createButton.getContainer().setAttribute('data-testid', 'disk-folder-create-submit-btn');

				BX.bind(input, 'keydown', (event) => {
					if (event.key === 'Enter')
					{
						event.preventDefault();
						submit(createButton);
					}
				});

				const cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				});
				cancelButton.setText(BX.message('DISK_JS_BTN_CLOSE'));
				cancelButton.setWide(true);
				cancelButton.getContainer().setAttribute('data-testid', 'disk-folder-create-cancel-btn');

				return [createButton, cancelButton];
			},
		});
	};

	/**
	 *
	 * @param {BX.UI.Button} button
	 * @param e
	 */
	FolderListClass.prototype.onClickManageConnectButton = function(button, e)
	{
		if (button.getIcon() === BX.UI.Button.Icon.DISK)
		{
			BX.Disk.ajax({
				method: 'POST',
				dataType: 'json',
				url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'connectToUserStorage'),
				data: {
					objectId: this.storage.rootObject.id,
				},
				onsuccess: BX.delegate(function(response)
				{
					BX.Disk.showModalWithStatusAction(response);
					if (response.status != 'success')
					{
						return;
					}
					button.setIcon(BX.UI.Button.Icon.DONE);
					button.setText(BX.message('DISK_FOLDER_LIST_LABEL_ALREADY_CONNECT_DISK'));

					if (response.manage.link)
					{
						this.storage.manage.link = BX.clone(response.manage.link, true);
					}
				}, this),
			});
		}
		else if (button.getIcon() === BX.UI.Button.Icon.DONE)
		{
			this.openConfirmDetach({
				object: {
					id: this.storage.manage.link.object.id,
					name: this.storage.name,
					isFolder: true,
				},
				onSuccess(response) {
					if (response && response.status == 'success')
					{
						response.message = BX.message('DISK_FOLDER_LIST_LABEL_DISCONNECTED_DISK');
					}
					BX.Disk.showModalWithStatusAction(response);

					button.setIcon(BX.UI.Button.Icon.DISK);
					button.setText(BX.message('DISK_FOLDER_LIST_LABEL_CONNECT_DISK'));
				},
			});
		}
	};

	FolderListClass.prototype.showTree = function(params)
	{
		const bindElement = params.bindElement || null;
		const textElement = params.textElement || null;
		const valueElement = params.valueElement || null;
		const onSelect = params.onSelect || null;

		let targetObjectId = null;
		let targetObjectNode = null;

		const modalTree = new BX.Disk.Tree.Modal(this.rootObject, {
			enableKeyboardNavigation: false,
			events: {
				onSelectFolder(node, objectId) {
					if (!node.getAttribute('data-can-add'))
					{
						BX.removeClass(node, 'selected');

						return;
					}

					targetObjectId = objectId;
					if (targetObjectNode)
					{
						BX.removeClass(targetObjectNode, 'selected');
					}
					targetObjectNode = node;
					if (targetObjectId && valueElement)
					{
						valueElement.value = targetObjectId;
					}

					if (targetObjectId && BX.type.isFunction(onSelect))
					{
						onSelect(targetObjectId);
					}
				},
				onUnSelectFolder(node) {
					targetObjectId = null;
					targetObjectNode = null;
					const pos = BX('grid_group_action_target_object');
					pos && BX.remove(pos);
				},
			},
			modalParameters: {
				bindElement,
				title: params.title,
				buttons: params.buttons,
			},
		});
		modalTree.show();
	};

	FolderListClass.prototype.onClickGetFilesCountAndSizeButtonButton = function(e)
	{
		BX.Disk.ajax({
			url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'calculateFileSizeAndCount'),
			method: 'POST',
			dataType: 'json',
			data: {
				folderId: this.currentFolder.id,
			},
			onsuccess: BX.delegate(function(response) {
				if (!response || response.status != 'success')
				{
					BX.Disk.showModalWithStatusAction(response);

					return;
				}

				BX.adjust(this.getFilesCountAndSize.sizeContainer, { text: response.size });
				BX.adjust(this.getFilesCountAndSize.countContainer, { text: response.count });
			}, this),
		});
	};

	FolderListClass.prototype.handleDocumentSaved = function(object, documentSession)
	{
		const item = this.commonGrid.getItemById(object.id);
		if (!item || this.commonGrid.isTile())
		{
			return;
		}

		this.commonGrid.instance.updateRow(object.id, null, null, () => {
			const rowNode = this.commonGrid.instance.getRows().getById(object.id).getNode();
			if (!rowNode)
			{
				return;
			}

			BX.addClass(rowNode, 'main-grid-row-checked');
			setInterval(() => {
				BX.removeClass(rowNode, 'main-grid-row-checked');
			}, 8000);
		});
	};

	FolderListClass.prototype.onSliderMessage = function(event) {
		const eventData = event.getData();
		if (event.getEventId() === 'Disk.File:onMarkDeleted' && eventData.objectId)
		{
			setTimeout(() => {
				this.removeRow(eventData.objectId);
			}, 500);
		}

		if (event.getEventId() === 'Disk.File:onDelete' && eventData.objectId)
		{
			setTimeout(() => {
				this.removeRow(eventData.objectId);
			}, 500);
		}

		if (event.getEventId() === 'Disk.File:onRestore' && eventData.objectId)
		{
			setTimeout(() => {
				this.removeRow(eventData.objectId);
			}, 500);
		}

		if (event.getEventId() === 'Disk.File:onNewVersionUploaded')
		{
			this.commonGrid.reload(BX.Disk.getUrlToShowObjectInGrid(eventData.object.id));
		}

		if (event.getEventId() === 'Disk.OnlyOffice:onSaved')
		{
			if (eventData.object)
			{
				this.commonGrid.reload(BX.Disk.getUrlToShowObjectInGrid(eventData.object.id));
			}
			else
			{
				this.commonGrid.reload();
			}
		}

		if (event.getEventId() === 'Disk.OnlyOffice:onClosed' && eventData.object && eventData.process === 'create')
		{
			this.commonGrid.reload(BX.Disk.getUrlToShowObjectInGrid(eventData.object.id));
		}

		if (event.getEventId() === 'Disk.File:onAddSharing')
		{
			this.showSharingIcon(eventData.objectId);
		}
	};

	FolderListClass.prototype.onPopState = function(e)
	{
		const state = e.state;
		if (!state || !state.disk || !state.folder)
		{
			window.location.reload();

			return;
		}

		if (!state.folder.link)
		{
			state.folder.link = window.location.pathname.toString();
		}

		BX.onCustomEvent('Disk.FolderListClass:onPopState', [state.folder]);

		this.openFolder(state.folder.id, state.folder);
	};

	FolderListClass.prototype.openGridFolder = function(event)
	{
		if (event.shiftKey || event.ctrlKey)
		{
			return;
		}

		const element = event.target || event.srcElement;
		if (!element.dataset.objectId)
		{
			return;
		}

		const row = this.getRow(element.dataset.objectId);
		const a = BX.findChildByClassName(row.node, 'js-disk-grid-folder');
		BX.fireEvent(a, 'click');
	};

	FolderListClass.prototype.openFolderByAnchor = function(anchor, event)
	{
		if (event.which !== 1 || event.ctrlKey || event.metaKey)
		{
			return;
		}

		if (this.onOpenFolderByAnchor(anchor))
		{
			event.preventDefault();
		}
	};

	FolderListClass.prototype.onOpenFolderByAnchor = function(anchor)
	{
		const folder = {
			id: anchor.dataset.objectId,
			canAdd: anchor.dataset.canAdd,
			link: anchor.href,
			name: anchor.textContent.trim(),
			node: anchor,
		};

		return this.onOpenFolder(folder);
	};

	/**
	 * @param {Object} folder
	 * @param {number} [folder.id]
	 * @param {string} [folder.link]
	 * @param {string} [folder.name]
	 * @param {Node} [folder.node]
	 * @returns {boolean}
	 */
	FolderListClass.prototype.onOpenFolder = function(folder)
	{
		if (!folder.id)
		{
			return false;
		}

		BX.onCustomEvent('Disk.FolderListClass:onFolderBeforeOpen', [folder]);

		const state = {
			disk: true,
			folder: {
				id: folder.id,
				name: folder.name,
			},
		};

		if (this.shouldUseHistory())
		{
			window.history.pushState(
				state,
				null,
				folder.link,
			);
		}
		BX.onCustomEvent('Window:onPushState', [state, null, folder.link]);
		this.baseGridPageUrl = folder.link;

		this.openFolder(folder.id, folder);

		return true;
	};

	FolderListClass.prototype.openFolderByContextMenu = function(anchor, event, folderId, folder)
	{
		event.preventDefault();

		folder.link = anchor.href;
		folder.id = folderId;

		this.onOpenFolder(folder);
	};

	/**
	 * @param {number} folderId
	 * @param {Object} folder
	 * @param {number} [folder.id]
	 * @param {string} [folder.link]
	 * @param {string} [folder.name]
	 * @param {Node} [folder.node]
	 * @returns {boolean}
	 */
	FolderListClass.prototype.openFolder = function(folderId, folder)
	{
		this.cancelSearchSession();
		this.commonGrid.reload(folder.link, {
			resetFilter: 1,
		}).then(() => {
			BX.onCustomEvent('Disk.FolderListClass:onFolderOpen', [folder, this.isFiltetedFolderList]);

			BX.Disk.Page.changeFolder({
				id: folder.id,
				name: folder.name,
			});

			if (folder.canAdd === undefined)
			{
				BX.ajax.runAction('disk.api.folder.getAllowedOperationsRights', {
					analyticsLabel: 'folder.list',
					data: {
						folderId: folder.id,
					},
				}).then((response) => {
					const operations = response.data.operations;
					operations.disk_add ? this.setActiveStateToCreateItemsButton() : this.setInactiveStateToCreateItemsButton();

					folder.canAdd = Boolean(operations.disk_add);
				});
			}
			else
			{
				folder.canAdd ? this.setActiveStateToCreateItemsButton() : this.setInactiveStateToCreateItemsButton();
			}

			window.scroll(0, 0);
		});
	};

	FolderListClass.prototype.onClickDeleteGroup = function(e)
	{
		if (!this.commonGrid.instance.IsActionEnabled())
		
		{ return false;
		}
		const allRows = document.getElementById(`actallrows_${this.commonGrid.instance.table_id}`);

		this.openConfirmDeleteGroup({
			attemptDeleteAll: allRows && allRows.checked,
		});
		BX.PreventDefault(e);

		return false;
	};

	FolderListClass.prototype.removeRow = function(objectId)
	{
		this.commonGrid.removeItemById(objectId);

		BX.onCustomEvent('onRemoveRowFromDiskList', [objectId]);
	};

	FolderListClass.prototype.getRow = function(objectId)
	{
		return this.commonGrid.instance.getRows().getById(objectId);
	};

	FolderListClass.prototype.setInactiveStateToCreateItemsButton = function()
	{
		this.blockCreateItemsButton();

		if (this.isUserCollaber)
		{
			this.addHintToCreateItemButtons();
		}
	};

	FolderListClass.prototype.setActiveStateToCreateItemsButton = function()
	{
		this.unblockCreateItemsButton();

		if (this.isUserCollaber)
		{
			this.removeHintFromCreateItemButtons();
			this.showCollaberTourOnCreateItemsButton();
		}
	};

	FolderListClass.prototype.showCollaberTourOnCreateItemsButton = function()
	{
		if (!this.isCollaberTourOnAddButtonViewed)
		{
			const guide = new BX.UI.Tour.Guide({
				id: this.collaberTourOnAddButtonId,
				simpleMode: true,
				overlay: false,
				onEvents: true,
				autoSave: true,
				steps: [
					{
						target: this.layout.createItemsButton,
						title: BX.message('DISK_FOLDER_LIST_COLLABER_TOUR_ON_ADD_BUTTON_TITLE'),
						text: BX.message('DISK_FOLDER_LIST_COLLABER_TOUR_ON_ADD_BUTTON_TEXT'),
						position: 'left',
						condition: {
							color: 'white',
							bottom: false,
							top: false,
						},
					},
				],
			});
			guide.getPopup().setWidth(420);

			guide.start();

			this.isCollaberTourOnAddButtonViewed = true;
		}
	};

	FolderListClass.prototype.blockCreateItemsButton = function()
	{
		if (this.layout.createItemsButton)
		{
			this.layout.createItemsButton.classList.add('ui-btn-disabled');
		}

		if (this.layout.emptyBlockUploadFileButtonId)
		{
			BX.addClass(this.layout.emptyBlockUploadFileButtonId, 'disk-folder-list-no-data-disabled');
		}

		if (this.layout.emptyBlockCreateFolderButtonId)
		{
			BX.addClass(this.layout.emptyBlockCreateFolderButtonId, 'disk-folder-list-no-data-disabled');
		}
	};

	FolderListClass.prototype.unblockCreateItemsButton = function()
	{
		if (this.layout.createItemsButton)
		{
			this.layout.createItemsButton.classList.remove('ui-btn-disabled');
		}

		if (this.layout.emptyBlockUploadFileButtonId)
		{
			BX.removeClass(this.layout.emptyBlockUploadFileButtonId, 'disk-folder-list-no-data-disabled');
		}

		if (this.layout.emptyBlockCreateFolderButtonId)
		{
			BX.removeClass(this.layout.emptyBlockCreateFolderButtonId, 'disk-folder-list-no-data-disabled');
		}
	};

	FolderListClass.prototype.addHintToCreateItemButtons = function()
	{
		if (this.layout.createItemsButton)
		{
			this.layout.createItemsButton.dataset.hint = this.getCollaberHintForCreateItemButtons();
			delete this.layout.createItemsButton.dataset.hintInit;
			BX.UI.Hint.initNode(this.layout.createItemsButton);
		}
	};

	FolderListClass.prototype.getCollaberHintForCreateItemButtons = function()
	{
		const isReadonlyCollabFolder = BX.Http.Cookie.get(this.readonlyCollabFolderStateCookieName) === '1';
		if (isReadonlyCollabFolder)
		{
			return BX.message('DISK_FOLDER_LIST_COLLABER_HINT_FOR_READONLY_FOLDER_IN_COLLAB');
		}

		return BX.message('DISK_FOLDER_LIST_COLLABER_HINT');
	};

	FolderListClass.prototype.removeHintFromCreateItemButtons = function()
	{
		if (this.layout.createItemsButton)
		{
			delete this.layout.createItemsButton.dataset.hint;
		}
	};

	FolderListClass.prototype.renameInline = function(objectId)
	{
		if (this.commonGrid.isTile())
		{
			const item = this.commonGrid.instance.getItem(objectId);
			if (item)
			{
				this.keepFocusThroughMenuClose(() => item.onRename());
			}

			return;
		}

		this.commonGrid.instance.getRows().unselectAll();
		const row = this.commonGrid.instance.getRows().getById(objectId);
		row.select();
		this.commonGrid.instance.editSelected();

		const editorContainer = BX.Grid.Utils.getByClass(row.getNode(), 'main-grid-editor-container', true);
		const input = BX.findChild(editorContainer, {
			tag: 'input',
		}, true);

		if (input)
		{
			// editSelectedCancel() may blur the input (e.g. in Chrome), which triggers the
			// 'blur' handler below and would call editSelectedSave() with the new value,
			// overriding the cancel. This flag tells 'blur' that a cancel is in progress.
			let cancelling = false;

			BX.bind(input, 'keydown', (event) => {
				if (event.key === 'Enter')
				{
					event.stopPropagation();
					event.preventDefault();

					this.commonGrid.instance.editSelectedSave();
				}

				if (event.key === 'Escape')
				{
					event.stopPropagation();
					event.preventDefault();

					cancelling = true;
					this.commonGrid.instance.editSelectedCancel();
				}
			});
			BX.bind(input, 'blur', (event) => {
				event.stopPropagation();
				event.preventDefault();

				if (cancelling)
				{
					return;
				}

				this.commonGrid.instance.editSelectedSave();
			});

			this.keepFocusThroughMenuClose(() => BX.focus(input));
		}
	};

	// Activates the inline-rename field and keeps its focus when the actions menu closes.
	//
	// The row/tile actions menu is a popup that may own an a11y focus-trap (ui.a11y). On
	// close the trap restores focus to the element that was focused before the menu opened
	// by dispatching a cancelable 'a11y:restore-focus' event (FocusNavigator.restoreFocus).
	// That blurs the rename field → editSelectedSave/runRename → the rename collapses.
	//
	// Two independent problems, two parts of the fix:
	//   1) The restore may run synchronously, via requestAnimationFrame, or on the close
	//      animation, so a timer can't reliably win the race. We cancel the restore instead:
	//      intercept the first 'a11y:restore-focus' and preventDefault it.
	//   2) The activation itself must run after the menu's click/close cycle — in tile mode
	//      running it synchronously inside the menu-item click is undone by the close. So we
	//      defer focusFn to the next tick.
	// Together: the activation runs once the menu is gone and the restore can't steal focus,
	// regardless of its timing. If a11y/focus-trap is off, no event fires and focus just stays.
	FolderListClass.prototype.keepFocusThroughMenuClose = function(focusFn)
	{
		const onRestore = (event) => {
			event.preventDefault();
			document.removeEventListener('a11y:restore-focus', onRestore, true);
		};

		document.addEventListener('a11y:restore-focus', onRestore, true);

		// Safety: drop the listener if no restore happens (a11y/focus-trap is off).
		setTimeout(() => {
			document.removeEventListener('a11y:restore-focus', onRestore, true);
		}, 2000);

		setTimeout(focusFn, 0);
	};

	FolderListClass.prototype.processGridGroupActionRestore = function()
	{
		const selectedRows = this.commonGrid.getSelectedIds();
		if (selectedRows.length === 0)
		{
			return;
		}

		const messageDescription = BX.message('DISK_TRASHCAN_TRASH_RESTORE_DESCR_MULTIPLE');
		this.showAirMessageBox({
			title: BX.message('DISK_TRASHCAN_TRASH_RESTORE_TITLE'),
			message: messageDescription,
			buttonsFactory: (messageBox) => {
				const cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				});
				cancelButton.setText(BX.message('DISK_JS_BTN_CANCEL'));
				cancelButton.setWide(true);

				return [
					new BX.UI.Button({
						text: BX.message('DISK_TRASHCAN_ACT_RESTORE'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.FILLED,
						wide: true,
						onclick: (button) => {
							button.setWaiting(true);

							BX.ajax.runAction('disk.api.commonActions.restoreCollection', {
								analyticsLabel: 'folder.list',
								data: {
									objectCollection: selectedRows,
								},
							}).then((response) => {
								if (response.status === 'success')
								{
									if (response.data.restoredObjectIds.length > 1)
									{
										BX.Disk.showModalWithStatusAction({
											status: 'success',
											message: BX.message('DISK_TRASHCAN_TRASH_RESTORE_SUCCESS'),
										});
										this.commonGrid.reload();
									}
									else
									{
										const firstObjectId = response.data.restoredObjectIds.pop();
										window.document.location = BX.Disk.getUrlToShowObjectInGrid(firstObjectId);
									}
								}

								messageBox.close();
							}, () => {
								button.setWaiting(false);
							});
						},
					}),
					cancelButton,
				];
			},
		});
	};

	FolderListClass.prototype.openConfirmRestore = function(parameters)
	{
		const name = parameters.object.name;
		const objectId = parameters.object.id;
		const isFolder = parameters.object.isFolder;
		let messageDescription = '';
		if (isFolder)
		{
			messageDescription = BX.message('DISK_TRASHCAN_TRASH_RESTORE_FOLDER_CONFIRM');
		}
		else
		{
			messageDescription = BX.message('DISK_TRASHCAN_TRASH_RESTORE_FILE_CONFIRM');
		}

		this.showAirMessageBox({
			title: BX.message('DISK_TRASHCAN_TRASH_RESTORE_TITLE'),
			message: this.formatAirMessageBoxFileName(messageDescription, name),
			buttonsFactory: (messageBox) => {
				const cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				});
				cancelButton.setText(BX.message('DISK_JS_BTN_CANCEL'));
				cancelButton.setWide(true);

				return [
					new BX.UI.Button({
						text: BX.message('DISK_TRASHCAN_ACT_RESTORE'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.FILLED,
						wide: true,
						onclick: (button) => {
							button.setWaiting(true);

							BX.ajax.runAction('disk.api.commonActions.restore', {
								analyticsLabel: 'folder.list',
								data: {
									objectId,
								},
							}).then((response) => {
								messageBox.close();
								this.commonGrid.selectItemById(objectId);

								window.document.location = BX.Disk.getUrlToShowObjectInGrid(response.data.object.id);
							}, () => {
								button.setWaiting(false);
							});
						},
					}),
					cancelButton,
				];
			},
		});
	};

	FolderListClass.prototype.formatAirMessageBoxFileName = function(message, name)
	{
		const safeName = BX.util.htmlspecialchars(name);
		const chars = Array.from(name);
		const dotIndex = chars.lastIndexOf('.');
		const extLength = dotIndex > 0 ? chars.length - dotIndex : 0;
		const tailLength = Math.min(chars.length, Math.max(12, Math.min(extLength + 2, 20)));
		const head = BX.util.htmlspecialchars(chars.slice(0, chars.length - tailLength).join(''));
		const tail = BX.util.htmlspecialchars(chars.slice(chars.length - tailLength).join(''));
		const fileName = '<span class="disk-air-message-box-file-name-sr-only">' + safeName + '</span>'
			+ '<span class="disk-air-message-box-file-name" aria-hidden="true">' + head + '</span>'
			+ '<span class="disk-air-message-box-file-name-tail" aria-hidden="true">' + tail + '</span>';
		const wrapFileName = (leftPart, rightPart) => {
			return '<span'
				+ ' class="disk-air-message-box-file-name-wrapper"'
				+ ' data-testid="disk-air-message-box-file-name"'
				+ ' title="' + safeName + '">'
				+ leftPart
				+ fileName
				+ rightPart
				+ '</span>'
			;
		};

		return message
			.replace(/(["'])#NAME#\1(\?)/g, (match, quote, questionMark) => {
				return wrapFileName(quote, quote + '&nbsp;' + questionMark);
			})
			.replace(/(["'])#NAME#\1/g, (match, quote) => {
				return wrapFileName(quote, quote);
			})
			.replace(/#NAME#(\?)/g, (match, questionMark) => {
				return wrapFileName('', questionMark);
			})
			.replace(/#NAME#/g, () => {
				return wrapFileName('', '');
			})
		;
	};

	FolderListClass.prototype.showAirMessageBox = function(options)
	{
		BX.Runtime.loadExtension('ui.dialogs.messagebox').then(() => {
			const maxWidth = options.maxWidth || 650;
			const messageBox = BX.UI.Dialogs.MessageBox.create({
				title: options.title,
				message: options.message,
				modal: true,
				useAirDesign: true,
				maxWidth,
				popupOptions: options.popupOptions || {},
			});

			if (BX.type.isFunction(options.buttonsFactory))
			{
				const buttons = options.buttonsFactory(messageBox);
				if (buttons === null)
				{
					return;
				}

				messageBox.setButtons(buttons);
			}

			const popupContainer = messageBox.getPopupWindow().getPopupContainer();
			popupContainer.classList.add('disk-air-message-box-fit-content', '--content-text');

			messageBox.show();
		});
	};

	FolderListClass.prototype.copyLinkInternalLink = function(link, target)
	{
		target.classList.add('menu-popup-item-accept', 'disk-folder-list-context-menu-item-accept-animate');
		target.style.minWidth = `${target.offsetWidth}px`;
		const textNode = target.querySelector('.menu-popup-item-text');
		if (textNode)
		{
			textNode.textContent = BX.message('DISK_FOLDER_LIST_ACT_COPIED_INTERNAL_LINK');
		}

		BX.clipboard.copy(link);
	};

	FolderListClass.prototype.openConfirmDelete = function(parameters)
	{
		const name = parameters.object.name;
		const objectId = parameters.object.id;
		const isFolder = parameters.object.isFolder;
		const isDeleted = parameters.object.isDeleted;

		const canMarkDeleted = parameters.canMarkDeleted === true;
		const canDelete = parameters.canDelete === true;
		const canMarkDeletedObject = !isDeleted && canMarkDeleted;
		if (!canMarkDeletedObject && !canDelete)
		{
			return;
		}

		let messageCode = '';

		if (isDeleted)
		{
			messageCode = isFolder
				? 'DISK_FOLDER_LIST_TRASH_DELETE_DESTROY_DELETED_FOLDER_CONFIRM'
				: 'DISK_FOLDER_LIST_TRASH_DELETE_DESTROY_DELETED_FILE_CONFIRM';
		}
		else if (canMarkDeletedObject && canDelete)
		{
			messageCode = isFolder
				? 'DISK_FOLDER_LIST_TRASH_DELETE_DESTROY_FOLDER_CONFIRM'
				: 'DISK_FOLDER_LIST_TRASH_DELETE_DESTROY_FILE_CONFIRM';
		}
		else if (canMarkDeletedObject)
		{
			messageCode = isFolder
				? 'DISK_FOLDER_LIST_TRASH_DELETE_FOLDER_CONFIRM'
				: 'DISK_FOLDER_LIST_TRASH_DELETE_FILE_CONFIRM';
		}
		else
		{
			messageCode = isFolder
				? 'DISK_FOLDER_LIST_TRASH_DELETE_DESTROY_DELETED_FOLDER_CONFIRM'
				: 'DISK_FOLDER_LIST_TRASH_DELETE_DESTROY_DELETED_FILE_CONFIRM';
		}

		this.showAirMessageBox({
			title: BX.message('DISK_FOLDER_LIST_TRASH_DELETE_TITLE'),
			message: this.formatAirMessageBoxFileName(BX.message(messageCode), name),
			buttonsFactory: (messageBox) => {
				const buttons = [];
				const cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				});
				cancelButton.setText(BX.message('DISK_FOLDER_LIST_TRASH_CANCEL_DELETE_BUTTON'));

				if (canMarkDeletedObject)
				{
					buttons.push(new BX.UI.Button({
						text: BX.message('DISK_FOLDER_LIST_TRASH_DELETE_BUTTON'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.FILLED,
						onclick: (button) => {
							button.setWaiting(true);

							BX.ajax.runAction('disk.api.commonActions.markDeleted', {
								analyticsLabel: 'folder.list',
								data: {
									objectId,
								},
							}).then(() => {
								messageBox.close();
								this.removeRow(objectId);
							}, () => {
								button.setWaiting(false);
							});
						},
					}));
				}

				if (canDelete)
				{
					buttons.push(new BX.UI.Button({
						text: BX.message('DISK_FOLDER_LIST_TRASH_DESTROY_BUTTON'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.OUTLINE,
						onclick: (button) => {
							button.setWaiting(true);

							BX.ajax.runAction('disk.api.commonActions.delete', {
								analyticsLabel: 'folder.list',
								data: {
									objectId,
								},
							}).then(() => {
								messageBox.close();
								this.removeRow(objectId);
							}, () => {
								button.setWaiting(false);
							});
						},
					}));
				}

				buttons.push(cancelButton);

				return buttons;
			},
		});
	};

	FolderListClass.prototype.onPopupFileUploadClose = function(diskUpload, fileId)
	{
		this.commonGrid.reload(BX.Disk.getUrlToShowObjectInGrid(fileId, { resetFilter: 1 })).then(() => {
			this.resetFilter();
			this.commonGrid.selectItemById(fileId);

			if (this.commonGrid.isGrid())
			{
				const row = this.getRow(fileId);
				this.scrollToRow(row);
			}
		});
	};

	FolderListClass.prototype.onStepperHasBeenFinished = function(stepper)
	{
		// we don't want to analyze: is it our stepper or not. Because there is strange and not useful structure.
		this.commonGrid.reload();
	};

	let alreadyRunEmptyTrash = false;
	FolderListClass.prototype.openConfirmEmptyTrash = function()
	{
		const storageId = this.storage.id;
		this.showAirMessageBox({
			title: BX.message('DISK_FOLDER_LIST_TITLE_EMPTY_TRASH_TITLE'),
			message: BX.message('DISK_FOLDER_LIST_TRASH_EMPTY_TRASH_DESCRIPTION'),
			buttonsFactory: (messageBox) => {
				const cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				});
				cancelButton.setText(BX.message('DISK_JS_BTN_CANCEL'));
				cancelButton.setWide(true);

				return [
					new BX.UI.Button({
						text: BX.message('DISK_FOLDER_LIST_TITLE_EMPTY_TRASH'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.FILLED,
						wide: true,
						onclick: (button) => {
							if (alreadyRunEmptyTrash)
							{
								messageBox.close();

								return;
							}

							button.setWaiting(true);
							alreadyRunEmptyTrash = true;
							BX.ajax.runAction('disk.api.trashcan.empty', {
								analyticsLabel: 'folder.list',
								data: {
									storageId,
								},
							}).then(() => {
								BX.ajax.runComponentAction('bitrix:disk.folder.list', 'getSteppers', {
									mode: 'class',
								}).then((response) => {
									if (response.data.html)
									{
										const place = BX('disk-folder-list-place-for-stepper');
										if (place)
										{
											BX.html(place, response.data.html);
										}
									}
								});

								messageBox.close();
							}, (response) => {
								BX.Disk.showModalWithStatusAction(response);
								messageBox.close();
							});
						},
					}),
					cancelButton,
				];
			},
		});
	};

	FolderListClass.prototype.openConfirmDetach = function(parameters)
	{
		const name = parameters.object.name;
		const objectId = parameters.object.id;
		const isFolder = parameters.object.isFolder;
		const onSuccess = parameters.onSuccess;
		let messageDescription = '';
		if (isFolder)
		{
			messageDescription = BX.message('DISK_FOLDER_LIST_DETACH_FOLDER_CONFIRM');
		}
		else
		{
			messageDescription = BX.message('DISK_FOLDER_LIST_DETACH_FILE_CONFIRM');
		}
		this.showAirMessageBox({
			title: isFolder ? BX.message('DISK_FOLDER_LIST_DETACH_FOLDER_TITLE') : BX.message('DISK_FOLDER_LIST_DETACH_FILE_TITLE'),
			message: messageDescription.replace('#NAME#', BX.util.htmlspecialchars(name)),
			buttonsFactory: (messageBox) => {
				const cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				});
				cancelButton.setText(BX.message('DISK_FOLDER_LIST_TRASH_CANCEL_DELETE_BUTTON'));
				cancelButton.setWide(true);

				return [
					new BX.UI.Button({
						text: BX.message('DISK_FOLDER_LIST_DETACH_BUTTON'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.FILLED,
						wide: true,
						onclick: (button) => {
							button.setWaiting(true);

							BX.Disk.ajax({
								method: 'POST',
								dataType: 'json',
								url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'detach'),
								data: {
									objectId,
								},
								onsuccess: BX.delegate(function(data) {
									if (!data)
									{
										button.setWaiting(false);
										return;
									}

									if (data.status == 'success')
									{
										messageBox.close();

										if (BX.type.isFunction(onSuccess))
										{
											BX.delegate(onSuccess, this)(data);
										}
										else
										{
											this.removeRow(objectId);
										}

										return;
									}

									button.setWaiting(false);
									BX.Disk.showModalWithStatusAction(data);
								}, this),
							});
						},
					}),
					cancelButton,
				];
			},
		});
	};

	FolderListClass.prototype.openConfirmDeleteGroup = function()
	{
		const messageDescription = BX.message('DISK_FOLDER_LIST_TRASH_DELETE_GROUP_CONFIRM');
		this.showAirMessageBox({
			title: BX.message('DISK_FOLDER_LIST_TRASH_DELETE_TITLE'),
			message: messageDescription,
			buttonsFactory: (messageBox) => {
				const cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				});
				cancelButton.setText(BX.message('DISK_FOLDER_LIST_TRASH_CANCEL_DELETE_BUTTON'));
				cancelButton.setWide(true);
				const buttons = [
					new BX.UI.Button({
						text: BX.message('DISK_FOLDER_LIST_TRASH_DELETE_BUTTON'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.FILLED,
						wide: true,
						onclick: (button) => {
							button.setWaiting(true);

							const values = {};
							values[this.commonGrid.getActionKey()] = 'delete';

							const data = {
								rows: this.commonGrid.getSelectedIds(),
								controls: values,
							};

							this.commonGrid.reload(null, data).then(() => {
								messageBox.close();
							}, () => {
								button.setWaiting(false);
							});
						},
					}),
				];

				const canWeDestroyAll = false;
				// this.commonGrid.instance.getRows().getSelected().forEach(function(row) {
				// 	if (!row.node.dataset.canDestroy)
				// 	{
				// 		canWeDestroyAll = false;
				// 	}
				// });

				if (canWeDestroyAll)
				{
					buttons.push(
						new BX.UI.Button({
							text: BX.message('DISK_FOLDER_LIST_TRASH_DESTROY_BUTTON'),
							useAirDesign: true,
							style: BX.UI.AirButtonStyle.OUTLINE,
							wide: true,
							onclick: (button) => {
								button.setWaiting(true);

								const values = {};
								values[this.commonGrid.getActionKey()] = 'destroy';

								const data = {
									rows: this.commonGrid.getSelectedIds(),
									controls: values,
								};

								this.commonGrid.reload(null, data).then(() => {
									messageBox.close();
								}, () => {
									button.setWaiting(false);
								});
							},
						}),
					);
				}

				buttons.push(cancelButton);

				return buttons;
			},
		});
	};

	FolderListClass.prototype.canDestroySelected = function()
	{
		const ids = this.commonGrid.getSelectedIds();
		if (ids.length === 0)
		{
			return false;
		}

		if (this.commonGrid.isGrid())
		{
			const selectedRows = this.commonGrid.instance.getRows().getSelected();

			return selectedRows.length === ids.length && selectedRows.every((row) => {
				return row.getNode().dataset.canDestroy === '1';
			});
		}

		const items = this.commonGrid.instance.getSelectedItems();

		return items.length === ids.length && items.every((item) => {
			return item.canDelete === true;
		});
	};

	FolderListClass.prototype.refreshDestroyGroupAction = function()
	{
		const panel = this.getCurrentActionPanel();
		if (!panel)
		{
			return;
		}

		const item = panel.getItemById('destroy');
		if (!item)
		{
			return;
		}

		if (this.canDestroySelected())
		{
			item.show();
		}
		else
		{
			item.hide();
		}
	};

	FolderListClass.prototype.openConfirmDestroyGroup = function()
	{
		if (!this.canDestroySelected())
		{
			return;
		}

		const messageDescription = BX.message('DISK_FOLDER_LIST_TRASH_DESTROY_GROUP_CONFIRM');
		this.showAirMessageBox({
			title: BX.message('DISK_FOLDER_LIST_TRASH_DELETE_TITLE'),
			message: messageDescription,
			buttonsFactory: (messageBox) => {
				if (!this.canDestroySelected())
				{
					this.refreshDestroyGroupAction();

					return null;
				}

				const cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				});
				cancelButton.setText(BX.message('DISK_JS_BTN_CANCEL'));
				cancelButton.setWide(true);

				return [
					new BX.UI.Button({
						text: BX.message('DISK_FOLDER_LIST_TRASH_DESTROY_BUTTON'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.FILLED,
						wide: true,
						onclick: (button) => {
							if (!this.canDestroySelected())
							{
								messageBox.close();
								this.refreshDestroyGroupAction();

								return;
							}

							const selectedIds = this.commonGrid.getSelectedIds();
							button.setWaiting(true);

							const values = {};
							values[this.commonGrid.getActionKey()] = 'destroy';

							const data = {
								rows: selectedIds,
								controls: values,
							};

							this.commonGrid.reload(null, data).then(() => {
								messageBox.close();
							}, () => {
								button.setWaiting(false);
							});
						},
					}),
					cancelButton,
				];
			},
		});
	};

	FolderListClass.prototype.downloadGroup = function()
	{
		const selectedRows = this.commonGrid.getSelectedIds();
		if (selectedRows.length === 0)
		{
			return;
		}

		BX.ajax.runAction('disk.api.commonActions.checkFileLimit', {
			data: {
				objectCollection: selectedRows,
			},
		}).then((response) => {
			if (response.data.isFileLimitExceeded === false)
			{
				BX.ajax.runAction('disk.api.commonActions.getArchiveLink', {
					analyticsLabel: 'folder.list',
					data: {
						objectCollection: selectedRows,
					},
				}).then((responseSecond) => {
					this.downloadFile(responseSecond.data.downloadArchiveUri);
				}).catch((responseSecond) => {
					BX.Disk.showModalWithStatusAction(responseSecond);
				});
			}
			else
			{
				this.showErrorPopup();
			}
		}).catch((response) => {
			BX.Disk.showModalWithStatusAction(response);
		});
	};

	FolderListClass.prototype.checkFileLimit = async function(folderId, downloadArchiveUri)
	{
		BX.ajax.runAction('disk.api.folder.checkFileLimit', {
			data: {
				id: folderId,
			},
		}).then((response) => {
			if (response.data.isFileLimitExceeded === false)
			{
				this.downloadFile(downloadArchiveUri);
			}
			else
			{
				this.showErrorPopup();
			}
		}).catch((response) => {
			BX.Disk.showModalWithStatusAction(response);
		});
	};

	FolderListClass.prototype.showErrorPopup = function()
	{
		BX.Runtime.loadExtension('ui.dialogs.messagebox').then((exports) => {
			exports.MessageBox.show({
				message: BX.Loc.getMessage('DISK_FOLDER_LIST_ACT_DOWNLOAD_ERROR'),
				buttons: exports.MessageBoxButtons.OK,
				onOk(messageBox) {
					messageBox.close();
				},
				useAirDesign: true,
			});
		});
	};

	FolderListClass.prototype.downloadFile = function(url)
	{
		window.location.href = url;
	};

	FolderListClass.prototype.openConfirmCopyGroup = function()
	{
		let destinationFolderId;
		const self = this;
		const buttons = [
			new BX.PopupWindowCustomButton({
				text: BX.message('DISK_FOLDER_LIST_TITLE_GRID_TOOLBAR_COPY_BUTTON'),
				className: 'ui-btn ui-btn-success',
				events: {
					click(e) {
						if (!destinationFolderId)
						{
							return;
						}

						this.addClassName('ui-btn-clock');

						const values = {};
						values[self.commonGrid.getActionKey()] = 'copy';
						values.destinationFolderId = destinationFolderId;

						const data = {
							rows: self.commonGrid.getSelectedIds(),
							controls: values,
						};

						self.commonGrid.reload(null, data).then(() => {
							BX.PopupWindowManager.getCurrentPopup().destroy();
						});
					},
				},
			}),
			new BX.PopupWindowCustomButton({
				text: BX.message('DISK_JS_BTN_CANCEL'),
				className: 'ui-btn ui-btn-link',
				events: {
					click(e) {
						BX.PopupWindowManager.getCurrentPopup().destroy();
					},
				},
			}),
		];

		this.showTree({
			title: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_MANY_COPY_TO'),
			buttons,
			onSelect(targetObjectId) {
				destinationFolderId = targetObjectId;
			},
		});
	};

	FolderListClass.prototype.openConfirmMoveGroup = function()
	{
		let destinationFolderId;
		const self = this;
		const buttons = [
			new BX.PopupWindowCustomButton({
				text: BX.message('DISK_FOLDER_LIST_TITLE_GRID_TOOLBAR_MOVE_BUTTON'),
				className: 'ui-btn ui-btn-success',
				events: {
					click(e) {
						if (!destinationFolderId)
						{
							return;
						}

						this.addClassName('ui-btn-clock');

						const values = {};
						values[self.commonGrid.getActionKey()] = 'move';
						values.destinationFolderId = destinationFolderId;

						const data = {
							rows: self.commonGrid.getSelectedIds(),
							controls: values,
						};

						self.commonGrid.reload(null, data).then(() => {
							BX.PopupWindowManager.getCurrentPopup().destroy();
						});
					},
				},
			}),
			new BX.PopupWindowCustomButton({
				text: BX.message('DISK_JS_BTN_CANCEL'),
				className: 'ui-btn ui-btn-link',
				events: {
					click(e) {
						BX.PopupWindowManager.getCurrentPopup().destroy();
					},
				},
			}),
		];

		this.showTree({
			title: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_MANY_MOVE_TO'),
			buttons,
			onSelect(targetObjectId) {
				destinationFolderId = targetObjectId;
			},
		});
	};

	FolderListClass.prototype.connectObjectToDisk = function(parameters)
	{
		const name = parameters.object.name;
		const objectId = parameters.object.id;
		const isFolder = parameters.object.isFolder;

		BX.Disk.ajaxPromise({
			method: 'POST',
			dataType: 'json',
			url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'connectToUserStorage'),
			data: {
				objectId,
			},
		}).then((response) => {
			if (!response)
			{
				return;
			}

			if (response.status == 'success')
			{
				this.commonGrid.getActionById(objectId, 'connect').hide = true;

				const menu = this.commonGrid.getActionsMenu(objectId);
				menu.getMenuItem('connect').hide = true;
				BX.addClass(menu.getMenuItem('connect').layout.item, 'disk-popup-menu-hidden-item');

				BX.Disk.showModalWithStatusAction({
					status: 'success',
					message: isFolder
						? BX.message('DISK_FOLDER_LIST_SUCCESS_CONNECT_TO_DISK_FOLDER').replace('#NAME#', name)
						: BX.message('DISK_FOLDER_LIST_SUCCESS_CONNECT_TO_DISK_FILE').replace('#NAME#', name),
				});
			}
			else
			{
				response.errors = response.errors || [{}];
				BX.Disk.showModalWithStatusAction({
					status: 'error',
					message: response.errors.pop().message,
				});
			}
		});
	};

	FolderListClass.prototype.unlockFile = function(parameters)
	{
		const name = parameters.object.name;
		const objectId = parameters.object.id;

		BX.Disk.ajaxPromise({
			method: 'POST',
			dataType: 'json',
			url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'unlock'),
			data: {
				objectId,
			},
		}).then((response) => {
			if (!response)
			{
				return;
			}

			if (response.status == 'success')
			{
				this.commonGrid.getActionById(objectId, 'lock').hide = false;
				this.commonGrid.getActionById(objectId, 'unlock').hide = true;

				const menu = this.commonGrid.getActionsMenu(objectId);
				menu.getMenuItem('lock').hide = false;
				menu.getMenuItem('unlock').hide = true;
				BX.removeClass(menu.getMenuItem('lock').layout.item, 'disk-popup-menu-hidden-item');
				BX.addClass(menu.getMenuItem('unlock').layout.item, 'disk-popup-menu-hidden-item');

				this.hideLockIcon(objectId);
			}
			else
			{
				response.errors = response.errors || [{}];
				BX.Disk.showModalWithStatusAction({
					status: 'error',
					message: response.errors.pop().message,
				});
			}
		});
	};

	FolderListClass.prototype.lockFile = function(parameters) {
		const name = parameters.object.name;
		const objectId = parameters.object.id;

		BX.Disk.ajaxPromise({
			method: 'POST',
			dataType: 'json',
			url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'lock'),
			data: {
				objectId,
			},
		}).then((response) => {
			if (!response)
			{
				return;
			}

			if (response.status == 'success')
			{
				this.commonGrid.getActionById(objectId, 'unlock').hide = false;
				this.commonGrid.getActionById(objectId, 'lock').hide = true;

				const menu = this.commonGrid.getActionsMenu(objectId);
				menu.getMenuItem('unlock').hide = false;
				menu.getMenuItem('lock').hide = true;
				BX.removeClass(menu.getMenuItem('unlock').layout.item, 'disk-popup-menu-hidden-item');
				BX.addClass(menu.getMenuItem('lock').layout.item, 'disk-popup-menu-hidden-item');

				this.showLockIcon(objectId);
			}
			else
			{
				response.errors = response.errors || [{}];
				BX.Disk.showModalWithStatusAction({
					status: 'error',
					message: response.errors.pop().message,
				});
			}
		});
	};

	FolderListClass.prototype.showSharingIcon = function(objectId)
	{
		if (this.commonGrid.isTile())
		{
			const item = this.commonGrid.instance.getItem(objectId);
			item && item.markAsShared();
		}
		else
		{
			const row = this.getRow(objectId);
			const icon = BX.findChildByClassName(row.node, 'bx-disk-file-icon', true) || BX.findChildByClassName(row.node, 'bx-disk-folder-icon', true);
			if (icon)
			{
				BX.addClass(icon, 'icon-shared shared icon-shared_1 icon-shared_2');
			}
		}
	};

	FolderListClass.prototype.hideSharingIcon = function(objectId)
	{
		if (this.commonGrid.isTile())
		{
			const item = this.commonGrid.instance.getItem(objectId);
			item && item.unmarkAsShared();
		}
		else
		{
			const row = this.getRow(objectId);
			const icon = BX.findChildByClassName(row.node, 'bx-disk-file-icon', true) || BX.findChildByClassName(row.node, 'bx-disk-folder-icon', true);
			if (icon)
			{
				BX.removeClass(icon, 'icon-shared shared icon-shared_1 icon-shared_2');
			}
		}
	};

	FolderListClass.prototype.showLockIcon = function(objectId)
	{
		if (this.commonGrid.isGrid())
		{
			const row = this.getRow(objectId);
			const lockIcon = BX.findChildByClassName(row.node, 'js-lock-icon', true);
			if (lockIcon)
			{
				BX.show(lockIcon, 'block');
			}
		}
		else
		{
			const item = this.commonGrid.instance.getItem(objectId);
			item.lock();
		}
	};

	FolderListClass.prototype.hideLockIcon = function(objectId)
	{
		if (this.commonGrid.isGrid())
		{
			const row = this.getRow(objectId);
			const lockIcon = BX.findChildByClassName(row.node, 'js-lock-icon', true);
			if (lockIcon)
			{
				BX.hide(lockIcon, 'block');
			}
		}
		else
		{
			const item = this.commonGrid.instance.getItem(objectId);
			item.unlock();
		}
	};

	FolderListClass.prototype.sortByColumn = function(sortBy, direction)
	{
		direction = direction || 'desc';

		this.sort.sortBy = sortBy;
		this.sort.direction = direction.toLowerCase();

		this.commonGrid.sortByColumn({
			sort_by: this.sort.sortBy,
			sort_order: this.sort.direction,
		});
	};

	FolderListClass.prototype.showGridSortingMenu = function(event)
	{
		const bindElement = BX.getEventTarget(event);
		const updateLabel = function(item) {
			if (bindElement)
			{
				BX.adjust(bindElement, {
					text: item.text,
				});
			}
		};

		const toggleActiveMark = function(item) {
			item.layout.item.classList.toggle('menu-popup-item-accept');
			item.layout.item.classList.toggle('menu-popup-no-icon');
		};

		const items = [];

		this.sortFields.forEach(function(item) {
			items.push({
				title: item.label,
				text: item.label,
				field: item.field,
				className: item.active ? 'menu-popup-item menu-popup-item-accept' : '',
				onclick: function(event, item) {
					this.sortFields.forEach((menuItem) => menuItem.active = false);
					const clickedField = this.sortFields.find((menuItem) => menuItem.field === item.field);
					if (clickedField)
					{
						clickedField.active = true;
					}

					this.sortByColumn(item.field, this.sort.direction);
					updateLabel(item);
					item.menuWindow.close();
				}.bind(this),
			});
		}, this);

		items.push(
			{
				delimiter: true,
			},
			{
				title: BX.message('DISK_FOLDER_LIST_LABEL_SORT_INVERSE_DIRECTION'),
				text: BX.message('DISK_FOLDER_LIST_LABEL_SORT_INVERSE_DIRECTION'),
				className: this.sort.direction === 'desc' ? 'menu-popup-item menu-popup-item-accept' : '',
				onclick: function(event, item) {
					this.inverseSortByColumn();
					toggleActiveMark(item);
					item.menuWindow.close();
				}.bind(this),
			},
			{
				delimiter: true,
			},
			{
				title: BX.message('DISK_FOLDER_LIST_LABEL_SORT_MIX_MODE'),
				text: BX.message('DISK_FOLDER_LIST_LABEL_SORT_MIX_MODE'),
				className: this.sort.mix ? 'menu-popup-item menu-popup-item-accept' : '',
				onclick: function(event, item) {
					this.toggleMixSort();
					toggleActiveMark(item);
					item.menuWindow.close();
				}.bind(this),
			},
		);

		const menu = BX.PopupMenu.create(
			'disk-folder-list-sorting-menu',
			this.sort.layout.label,
			items,
			{
				autoHide: true,
				className: 'disk-folder-list-sorting-menu',
				offsetTop: 0,
				offsetLeft: 35,
				angle: {
					offset: 45,
				},
				events: {
					onPopupClose()
					{
						BX.PopupMenu.destroy('disk-folder-list-sorting-menu');
						this.destroy();
					},
				},
			},
		);
		menu.show();
	};

	FolderListClass.prototype.inverseSortByColumn = function()
	{
		const inverseDirection = this.sort.direction === 'desc' ? 'asc' : 'desc';

		this.sortByColumn(this.sort.sortBy, inverseDirection);
	};

	FolderListClass.prototype.toggleMixSort = function()
	{
		if (this.sort.mix)
		{
			this.disableMixSort();
		}
		else
		{
			this.enableMixSort();
		}
	};

	FolderListClass.prototype.enableMixSort = function()
	{
		this.sort.mix = true;
		this.commonGrid.reload('', {
			sortMode: 'mix',
		});
	};

	FolderListClass.prototype.disableMixSort = function()
	{
		this.sort.mix = false;
		this.commonGrid.reload('', {
			sortMode: 'ord',
		});
	};

	FolderListClass.prototype.openExternalLinkDetailSettingsWithEditing = function(objectId)
	{
		BX.Disk.modalWindowActionLoader('disk.api.commonActions.generateExternalLink', {
			analyticsLabel: 'folder.list',
			id: 'bx-disk-external-link-loader',
			postData: {
				objectId,
			},
			afterSuccessLoad(response) {
				if (!response || response.status != 'success')
				{
					BX.Disk.showModalWithStatusAction(response);

					return;
				}

				const externalLink = new BX.Disk.Model.ExternalLink.Input({
					state: response.data.externalLink,
					data: {
						objectId,
					},
					models: {
						externalLinkSettings: new BX.Disk.Model.ExternalLink.Settings({
							state: response.data.externalLink,
						}),
						externalLinkDescription: new BX.Disk.Model.ExternalLink.Description({
							state: response.data.externalLink,
						}),
					},
				});
				externalLink.render();

				BX.Disk.modalWindow({
					modalId: 'bx-disk-external-link',
					title: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_GET_EXT_LINK'),
					contentClassName: 'disk-popup-external-link-config',
					className: 'disk-external-link-popup',
					contentStyle: {},
					events: {
						onPopupClose() {
							this.destroy();
						},
					},
					content: [
						externalLink.getContainer(),
					],
					buttons: [
						new BX.PopupWindowCustomButton({
							text: BX.message('DISK_FOLDER_LIST_BTN_SAVE'),
							className: 'ui-btn ui-btn-success',
							events: {
								click() {
									externalLink.externalLinkSettings.save();
									BX.PopupWindowManager.getCurrentPopup().close();
									setTimeout(() => {
										BX.Disk.showModalWithStatusAction({ status: 'success' });
									}, 300);
								},
							},
						}),
						new BX.PopupWindowCustomButton({
							className: 'ui-btn ui-btn-link',
							text: BX.message('DISK_JS_BTN_CLOSE'),
							events: {
								click() {
									BX.PopupWindowManager.getCurrentPopup().close();
								},
							},
						}),
					],
				});
			},
		});
	};

	FolderListClass.prototype.onBeforeElementShow = function(viewer, element, status)
	{
		if (element.hasOwnProperty('image') || !BX.message('disk_restriction'))
		{
			return;
		}
		status.prevent = true;

		BX.PopupWindowManager.create('bx-disk-business-tools-info', null, {
			content: BX('bx-bitrix24-business-tools-info'),
			closeIcon: true,
			onPopupClose()
			{
				this.destroy();
			},
			autoHide: true,
			zIndex: 11000,
		}).show();
	};

	FolderListClass.prototype.onIframeElementLoadDataToView = function(element, responseData)
	{
		if (responseData && responseData.status === 'restriction' && BX('bx-bitrix24-business-tools-info'))
		{
			if (BX.CViewer && BX.CViewer.objNowInShow)
			{
				if (element.currentModalWindow)
				{
					element.currentModalWindow.close();
				}

				BX.CViewer.objNowInShow.close();
			}
			BX.PopupWindowManager.create('bx-disk-business-tools-info', null, {
				content: BX('bx-bitrix24-business-tools-info'),
				closeIcon: true,
				onPopupClose()
				{
					this.destroy();
				},
				autoHide: true,
				zIndex: 11000,
			}).show();
		}
	};

	FolderListClass.prototype.getExternalLink = function(objectId)
	{
		const objectData = BX.delegate(getObjectDataId, this)(objectId);
		const isFolder = BX.hasClass(objectData.icon, 'bx-disk-folder-icon');
		let queryUrl = this.ajaxUrl;

		queryUrl = BX.Disk.addToLinkParam(queryUrl, 'action', 'generateExternalLink');
		queryUrl = BX.Disk.addToLinkParam(queryUrl, 'isFolder', isFolder);

		BX.Disk.modalWindowLoader(queryUrl, {
			id: 'bx-disk-external-link-loader',
			responseType: 'json',
			postData: {
				objectId,
			},
			afterSuccessLoad: BX.delegate(function(response) {
				if (!response || response.status != 'success')
				{
					BX.Disk.showModalWithStatusAction(response);

					return;
				}
				this.cacheExternalLinks[objectId] = response.link;

				BX.Disk.modalWindow({
					modalId: 'bx-disk-external-link',
					title: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_GET_EXT_LINK'),
					contentClassName: 'tac',
					contentStyle: {},
					events: {
						onAfterPopupShow() {
							const inputExtLink = BX('disk-get-external-link');
							BX.focus(inputExtLink);
							inputExtLink.setSelectionRange(0, inputExtLink.value.length);
						},
						onPopupClose() {
							this.destroy();
						},
					},
					content: [
						BX.create('label', {
							props: {
								className: 'bx-disk-popup-label',
								for: 'disk-get-external-link',
							},
						}),
						BX.create('input', {
							style: {
								marginTop: '10px',
							},
							props: {
								id: 'disk-get-external-link',
								className: 'bx-viewer-inp',
								type: 'text',
								value: response.link,
							},
						}),
					],
					buttons: [
						new BX.PopupWindowCustomButton({
							text: BX.message('DISK_JS_BTN_CLOSE'),
							className: 'ui-btn ui-btn-link',
							events: {
								click() {
									BX.PopupWindowManager.getCurrentPopup().close();
								},
							},
						}),
					],

				});
			}, this),
		});

		return false;
	};

	FolderListClass.prototype.getInternalLink = function(internalLink)
	{
		BX.Disk.modalWindow({
			modalId: 'bx-disk-internal-link',
			title: BX.message('DISK_FOLDER_LIST_ACT_COPY_INTERNAL_LINK'),
			contentClassName: 'tac',
			contentStyle: {},
			events: {
				onAfterPopupShow() {
					const inputLink = BX('disk-get-internal-link');
					BX.focus(inputLink);
					inputLink.setSelectionRange(0, inputLink.value.length);
				},
				onPopupClose() {
					this.destroy();
				},
			},
			content: [
				BX.create('label', {
					props: {
						className: 'bx-disk-popup-label',
						for: 'disk-get-internal-link',
					},
				}),
				BX.create('input', {
					style: {
						marginTop: '10px',
					},
					props: {
						id: 'disk-get-internal-link',
						className: 'bx-viewer-inp',
						type: 'text',
						value: internalLink,
					},
				}),
			],
			buttons: [
				new BX.PopupWindowCustomButton({
					text: BX.message('DISK_JS_BTN_CLOSE'),
					className: 'ui-btn ui-btn-link',
					events: {
						click() {
							BX.PopupWindowManager.getCurrentPopup().close();
						},
					},
				}),
			],
		});
	};

	FolderListClass.prototype.openCopyModalWindow = function(rootObject, objectToMove)
	{
		let targetObjectId = null;
		let targetObjectNode = null;

		const modalTree = new BX.Disk.Tree.Modal(this.rootObject, {
			events: {
				onSelectFolder(node, objectId) {
					if (!node.getAttribute('data-can-add'))
					{
						BX.removeClass(node, 'selected');

						return;
					}

					if (targetObjectNode)
					{
						BX.removeClass(targetObjectNode, 'selected');
					}
					targetObjectId = objectId;
					targetObjectNode = node;
				},
				onUnSelectFolder() {
					targetObjectId = null;
					targetObjectNode = null;
				},
			},
			modalParameters: {
				title: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_TREE'),
				contentTitle: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_COPY_TO').replace('#NAME#', objectToMove.name),
				buttons: [
					new BX.PopupWindowCustomButton({
						text: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_COPY_TO_BUTTON'),
						className: 'ui-btn ui-btn-success',
						events: {
							click: BX.delegate(function(e) {
								if (!targetObjectId)
								{
									BX.PreventDefault(e);

									return false;
								}

								BX.PopupWindowManager.getCurrentPopup().close();
								BX.PreventDefault(e);

								BX.Disk.ajax({
									method: 'POST',
									dataType: 'json',
									url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'copyTo'),
									data: {
										objectId: objectToMove.id,
										targetObjectId,
									},
									onsuccess(data) {
										if (!data)
										{
											return;
										}

										if (data.status == 'success')
										{
											if (data.isFolder)
											{
												data.message = BX.message('DISK_FOLDER_LIST_OK_FOLDER_COPIED').replace('#FOLDER#', data.name);
											}
											else
											{
												data.message = BX.message('DISK_FOLDER_LIST_OK_FILE_COPIED').replace('#FILE#', data.name);
											}
											data.message = data.message.replace('#TARGET_FOLDER#', data.destination.name);

											BX.Disk.showModalWithStatusAction(data);

											return;
										}
										BX.Disk.showModalWithStatusAction(data);
									},
								});

								return false;
							}, this),
						},
					}),
					new BX.PopupWindowCustomButton({
						text: BX.message('DISK_JS_BTN_CANCEL'),
						className: 'ui-btn ui-btn-link',
						events: {
							click(e)
							{
								BX.PopupWindowManager.getCurrentPopup().destroy();
							},
						},
					}),

				],
			},
		});
		modalTree.show();
	};

	FolderListClass.prototype.openMoveModalWindow = function(rootObject, objectToMove)
	{
		let targetObjectId = null;
		let targetObjectNode = null;

		const modalTree = new BX.Disk.Tree.Modal(this.rootObject, {
			events: {
				onSelectFolder(node, objectId) {
					if (!node.getAttribute('data-can-add'))
					{
						BX.removeClass(node, 'selected');

						return;
					}

					if (targetObjectNode)
					{
						BX.removeClass(targetObjectNode, 'selected');
					}

					targetObjectId = objectId;
					targetObjectNode = node;
				},
				onUnSelectFolder() {
					targetObjectId = null;
					targetObjectNode = null;
				},
			},
			modalParameters: {
				title: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_TREE'),
				contentTitle: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_MOVE_TO').replace('#NAME#', objectToMove.name),
				buttons: [
					new BX.PopupWindowCustomButton({
						text: BX.message('DISK_FOLDER_LIST_TITLE_MODAL_MOVE_TO_BUTTON'),
						className: 'ui-btn ui-btn-success',
						events: {
							click: BX.delegate(function(e) {
								if (!targetObjectId)
								{
									BX.PreventDefault(e);

									return false;
								}

								BX.PopupWindowManager.getCurrentPopup().close();
								BX.PreventDefault(e);

								BX.Disk.ajaxPromise({
									method: 'POST',
									dataType: 'json',
									url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'moveTo'),
									data: {
										objectId: objectToMove.id,
										targetObjectId,
									},
								}).then((response) => {
									if (this.commonGrid.isGrid())
									{
										this.commonGrid.instance.getRows().unselectAll();
									}
									this.commonGrid.selectItemById(objectToMove.id);
									this.commonGrid.reload();

									if (response.isFolder)
									{
										response.message = BX.message('DISK_FOLDER_LIST_OK_FOLDER_MOVED').replace('#FOLDER#', response.name);
									}
									else
									{
										response.message = BX.message('DISK_FOLDER_LIST_OK_FILE_MOVED').replace('#FILE#', response.name);
									}
									response.message = response.message.replace('#TARGET_FOLDER#', response.destination.name);

									BX.Disk.showModalWithStatusAction(response);
								});

								return false;
							}, this),
						},
					}),
					new BX.PopupWindowCustomButton({
						text: BX.message('DISK_JS_BTN_CANCEL'),
						className: 'ui-btn ui-btn-link',
						events: {
							click(e)
							{
								BX.PopupWindowManager.getCurrentPopup().destroy();
							},
						},
					}),
				],
			},
		});
		modalTree.show();
	};

	let isChangedRights = false;
	let storageNewRights = {};
	let originalRights = {};
	let detachedRights = {};
	let moduleTasks = {};

	let entityToNewShared = {};
	let loadedReadOnlyEntityToNewShared = {};
	let entityToNewSharedMaxTaskName = '';

	FolderListClass.prototype.showSharingDetailWithChangeRights = function(params)
	{
		entityToNewShared = {};
		loadedReadOnlyEntityToNewShared = {};

		params = params || {};
		const objectId = params.object.id;

		BX.Disk.modalWindowLoader(
			BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'showSharingDetailChangeRights'),
			{
				id: `folder_list_sharing_detail_object_${objectId}`,
				responseType: 'json',
				postData: {
					objectId,
				},
				afterSuccessLoad: BX.delegate(function(response) {
					if (response.status != 'success')
					{
						response.errors = response.errors || [{}];
						BX.Disk.showModalWithStatusAction({
							status: 'error',
							message: response.errors.pop().message,
						});
					}

					const objectOwner = {
						name: response.owner.name,
						avatar: response.owner.avatar,
						link: response.owner.link,
					};

					if (response.unifiedLink)
					{
						const accessLevel = response.unifiedLink.availableAccessLevels.find((accessLevel) => { // eslint-disable-next-line no-mixed-spaces-and-tabs
							return accessLevel.value === response.unifiedLink.currentAccessLevel;
						});

						const accessLevelNode = BX.create('span', {
							props: {
								className: 'bx-disk-filepage-used-people-permission',
							},
							text: accessLevel.name,
						});

						const menuId = 'disk_open_menu_with_rights';

						accessLevelNode.addEventListener('click', (event) => {
							const menuId = 'access-level-menu';
							const menuItems = response.unifiedLink.availableAccessLevels.map((accessLevel) => {
								return {
									id: accessLevel.value,
									text: accessLevel.name,
									onclick() {
										accessLevelNode.textContent = accessLevel.name;
										if (entityToNewShared.unifiedLink.currentAccessLevel !== accessLevel.value)
										{
											entityToNewShared.unifiedLink.newAccessLevel = accessLevel.value;
										}
										BX.PopupMenu.destroy(menuId);
									},
								};
							});

							BX.PopupMenu.show(menuId, event.target, menuItems, {
								autoHide: true,
								offsetTop: 0,
								offsetLeft: 0,
								angle: {
									position: 'top',
									offset: 45,
								},
								autoHide: true,
								overlay: {
									opacity: 0.01,
								},
								events: {
									onPopupClose() {
										BX.PopupMenu.destroy(menuId);
									},
								},
							});
						});

						var unifiedLinkElement = BX.create('table', {
							props: {
								id: 'bx-disk-popup-shared-universal-list',
								className: 'bx-disk-popup-shared-people-list',
							},
							children: [
								BX.create('thead', {
									children: [
										BX.create('tr', {
											children: [
												BX.create('td', {
													props: { className: 'bx-disk-popup-shared-people-list-head-col1' },
												}),
												BX.create('td', {
													props: { className: 'bx-disk-popup-shared-people-list-head-col2' },
													text: BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS'),
												}),
												BX.create('td', {
													props: { className: 'bx-disk-popup-shared-people-list-head-col3' },
												}),
											],
										}),
										BX.create('tr', {
											children: [
												BX.create('td', {
													props: { className: 'bx-disk-popup-shared-people-list-head-col1' },
													children: [
														BX.create('span', {
															props: { className: 'bx-disk-filepage-used-people-link' },
															children: [
																BX.create('span', {
																	props: {
																		className: 'bx-disk-filepage-used-people-avatar link',
																		style: '--ui-icon-set__icon-size: 15px;',
																	},
																}),
																BX.create('span', {
																	text: BX.message('DISK_FOLDER_LIST_UNIFIED_RIGHT_USERS'),
																}),
															],
														}),
													],
												}),
												BX.create('td', {
													props: { className: 'bx-disk-popup-shared-people-list-head-col2' },
													children: [accessLevelNode],
												}),
												BX.create('td', {
													props: { className: 'bx-disk-popup-shared-people-list-head-col3' },
												}),
											],
										}),
									],
								}),
							],
						});
					}

					BX.Disk.modalWindow({
						modalId: 'bx-disk-detail-sharing-folder-change-right',
						title: BX.message('DISK_FOLDER_LIST_SHARING_TITLE_MODAL_3'),
						contentClassName: '',
						contentStyle: {},
						events: {
							onAfterPopupShow: BX.delegate(function() {
								BX.addCustomEvent('onChangeRightOfSharing', BX.proxy(this.onChangeRightOfSharing, this));

								for (const i in response.members)
								{
									if (!response.members.hasOwnProperty(i))
									{
										continue;
									}

									entityToNewShared[response.members[i].entityId] = {
										item: {
											id: response.members[i].entityId,
											name: response.members[i].name,
											avatar: response.members[i].avatar,
										},
										type: response.members[i].type,
										right: response.members[i].right,
									};
								}

								if (response.unifiedLink)
								{
									entityToNewShared.unifiedLink = response.unifiedLink;
								}

								BX.SocNetLogDestination.init({
									name: this.destFormName,
									searchInput: BX('feed-add-post-destination-input'),
									bindMainPopup: {
										node: BX('feed-add-post-destination-container'),
										offsetTop: '5px',
										offsetLeft: '15px',
									},
									bindSearchPopup: {
										node: BX('feed-add-post-destination-container'),
										offsetTop: '5px',
										offsetLeft: '15px',
									},
									callback: {
										select: BX.proxy(this.onSelectDestination, this),
										unSelect: BX.proxy(this.onUnSelectDestination, this),
										openDialog: BX.proxy(this.onOpenDialogDestination, this),
										closeDialog: BX.proxy(this.onCloseDialogDestination, this),
										openSearch: BX.proxy(this.onOpenSearchDestination, this),
										closeSearch: BX.proxy(this.onCloseSearchDestination, this),
									},
									items: response.destination.items,
									itemsLast: response.destination.itemsLast,
									itemsSelected: response.destination.itemsSelected,
								});

								const BXSocNetLogDestinationFormName = this.destFormName;
								BX.bind(BX('feed-add-post-destination-container'), 'click', (e) => {
									BX.SocNetLogDestination.openDialog(BXSocNetLogDestinationFormName);
									BX.PreventDefault(e);
								});
								BX.bind(BX('feed-add-post-destination-input'), 'keyup', BX.proxy(this.onKeyUpDestination, this));
								BX.bind(BX('feed-add-post-destination-input'), 'keydown', BX.proxy(this.onKeyDownDestination, this));
							}, this),
							onPopupClose: BX.delegate(function() {
								if (BX.SocNetLogDestination && BX.SocNetLogDestination.isOpenDialog())
								{
									BX.SocNetLogDestination.closeDialog();
								}
								BX.removeCustomEvent('onChangeRightOfSharing', BX.proxy(this.onChangeRightOfSharing, this));
								BX.proxy_context.destroy();
							}, this),
						},
						content: [
							BX.create('div', {
								props: {
									className: 'bx-disk-popup-content',
								},
								children: [
									BX.create('table', {
										props: {
											className: 'bx-disk-popup-shared-people-list',
										},
										children: [
											BX.create('thead', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-head-col1">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_OWNER')}</td>`
													+ '</tr>',
											}),
											BX.create('tr', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-col1" style="border-bottom: none;"><a class="bx-disk-filepage-used-people-link" href="${objectOwner.link}"><span class="bx-disk-filepage-used-people-avatar" style="background-image: url('${encodeURI(objectOwner.avatar)}');"></span>${BX.util.htmlspecialchars(objectOwner.name)}</a></td>`
													+ '</tr>',
											}),
										],
									}),
									unifiedLinkElement,
									BX.create('table', {
										props: {
											id: 'bx-disk-popup-shared-people-list',
											className: 'bx-disk-popup-shared-people-list',
										},
										children: [
											BX.create('thead', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-head-col1">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS_USER')}</td>`
													+ `<td class="bx-disk-popup-shared-people-list-head-col2">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS')}</td>`
													+ '<td class="bx-disk-popup-shared-people-list-head-col3"></td>'
													+ '</tr>',
											}),
										],
									}),
									BX.create('div', {
										props: {
											id: 'feed-add-post-destination-container',
											className: 'feed-add-post-destination-wrap',
										},
										children: [
											BX.create('span', {
												props: {
													className: 'feed-add-post-destination-item',
												},
											}),
											BX.create('span', {
												props: {
													id: 'feed-add-post-destination-input-box',
													className: 'feed-add-destination-input-box',
												},
												style: {
													background: 'transparent',
												},
												children: [
													BX.create('input', {
														props: {
															type: 'text',
															value: '',
															id: 'feed-add-post-destination-input',
															className: 'feed-add-destination-inp',
														},
													}),
												],
											}),
											BX.create('a', {
												props: {
													href: '#',
													id: 'bx-destination-tag',
													className: 'feed-add-destination-link',
												},
												style: {
													background: 'transparent',
												},
												text: BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_ADD_RIGHTS_USER'),
												events: {
													click: BX.delegate(() => {}, this),
												},
											}),
										],
									}),
								],
							}),
						],
						buttons: [
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_FOLDER_LIST_BTN_SAVE'),
								className: 'ui-btn ui-btn-success',
								events: {
									click: BX.delegate(function() {
										BX.Disk.ajax({
											method: 'POST',
											dataType: 'json',
											url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'changeSharingAndRights'),
											data: {
												objectId,
												entityToNewShared,
											},
											onsuccess: BX.delegate(function(response) {
												if (!response)
												{
													return;
												}

												if (params.object.isFolder)
												{
													response.message = BX.message('DISK_FOLDER_LIST_OK_FOLDER_SHARE_MODIFIED').replace('#FOLDER#', params.object.name);
												}
												else
												{
													let name = params.object.name.split('.');
													const ext = name.pop().toLowerCase();
													name = name.join('.');
													if (name && ext === 'board')
													{
														response.message = BX.message('DISK_FOLDER_LIST_OK_BOARD_SHARE_MODIFIED').replace('#FILE#', name);
													}
													else
													{
														response.message = BX.message('DISK_FOLDER_LIST_OK_FILE_SHARE_MODIFIED').replace('#FILE#', params.object.name);
													}
												}
												BX.Disk.showModalWithStatusAction(response);
												this.showSharingIcon(objectId);

												// var icon = BX.delegate(getIconElementByObjectId, this)(objectId);
												// if(icon)
												// {
												// 	if(!entityToNewShared || BX.Disk.isEmptyObject(entityToNewShared))
												// 	{
												// 		BX.removeClass(icon, 'icon-shared icon-shared_2 shared');
												// 		BX.removeClass(icon, 'icon-shared_1');
												// 	}
												// 	else
												// 	{
												// 		BX.addClass(icon, 'icon-shared icon-shared_2 shared');
												// 	}
												// }
											}, this),
										});

										BX.PopupWindowManager.getCurrentPopup().close();
									}, this),
								},
							}),
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_JS_BTN_CANCEL'),
								className: 'ui-btn ui-btn-link',
								events: {
									click(e) {
										BX.PopupWindowManager.getCurrentPopup().destroy();
									},
								},
							}),
						],
					});
				}, this),
			},
		);
	};

	function showAccessCodeFullName(item)
	{
		item = item || {};

		return (item.provider ? `${item.provider}: ` : '') + item.name;
	}

	FolderListClass.prototype.showRights = function(params)
	{
		params = params || {};
		const objectId = params.object.id;
		const rights = {};

		BX.Disk.modalWindowLoader(
			BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'showRightsDetail'),
			{
				id: `folder_list_sharing_detail_object_${objectId}`,
				responseType: 'json',
				postData: {
					objectId,
				},
				afterSuccessLoad: BX.delegate(function(response)
				{
					if (response.status != 'success')
					{
						response.errors = response.errors || [{}];
						BX.Disk.showModalWithStatusAction({
							status: 'error',
							message: response.errors.pop().message,
						});
					}

					for (const i in response.rights)
					{
						if (!response.rights.hasOwnProperty(i))
						{
							continue;
						}
						const rightsByAccessCode = response.rights[i];
						for (const j in rightsByAccessCode)
						{
							if (!rightsByAccessCode.hasOwnProperty(j))
							{
								continue;
							}

							rights[i] = {
								readOnly: true,
								item: {
									id: i,
									name: showAccessCodeFullName(response.accessCodeNames[i]),
									avatar: null,
								},
								type: 'group',
								right: {
									title: rightsByAccessCode[j].TASK.TITLE,
								},
							};
						}
					}

					BX.Disk.modalWindow({
						modalId: 'bx-disk-detail-sharing-folder-change-right',
						title: BX.message('DISK_FOLDER_LIST_SHARING_TITLE_MODAL_3'),
						contentClassName: '',
						contentStyle: {
							// paddingTop: '30px',
							// paddingBottom: '70px'
						},
						events: {
							onAfterPopupShow: BX.delegate(() => {
								for (const i in rights)
								{
									if (!rights.hasOwnProperty(i))
									{
										continue;
									}
									BX.Disk.appendRight(rights[i]);
								}
							}, this),
							onPopupClose: BX.delegate(() => {
								BX.proxy_context.destroy();
							}, this),
						},
						content: [
							BX.create('div', {
								props: {
									className: 'bx-disk-popup-content',
								},
								children: [
									BX.create('table', {
										props: {
											id: 'bx-disk-popup-shared-people-list',
											className: 'bx-disk-popup-shared-people-list',
										},
										children: [
											BX.create('thead', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-head-col1">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS_USER')}</td>`
													+ `<td class="bx-disk-popup-shared-people-list-head-col2">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS')}</td>`
													+ '<td class="bx-disk-popup-shared-people-list-head-col3"></td>'
												+ '</tr>',
											}),
										],
									}),
									BX.create('a', {
										text: BX.message('DISK_FOLDER_TOOLBAR_BTN_CREATE_FOLDER'),
										props: {
											id: 'bx-disk-destination-object-modal',
											className: 'bx-disk-btn bx-disk-btn-big bx-disk-btn-transparent border',
										},
										events: {
											click: BX.delegate(() => {}, this),
										},
										children: [
											BX.create('span', {
												props: {
													className: 'bx-disk-btn-icon bx-disk-btn-icon-plus',
												},
											}),
											BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_ADD_RIGHTS_USER'),
										],
									}),
									BX.create('div', {
										html:
												'<span class="feed-add-destination-input-box" id="feed-add-post-destination-input-box">'
													+ '<input autocomplete="nope" type="text" value="" class="feed-add-destination-inp" id="feed-add-post-destination-input"/>'
												+ '</span>',
									}),
								],
							}),
						],
						buttons: [],
					});
				}, this),
			},
		);
	};

	FolderListClass.prototype.showRightsOnStorage = function()
	{
		storageNewRights = {};
		const storageId = this.storage.id;
		const rights = {};

		BX.Disk.modalWindowLoader(
			BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'showRightsOnStorageDetail'),
			{
				id: `folder_list_rights_detail_storage_${storageId}`,
				responseType: 'json',
				postData: {
					storageId,
				},
				afterSuccessLoad: BX.delegate(function(response, windowLoader)
				{
					windowLoader && windowLoader.close();

					if (response.status !== 'success')
					{
						response.errors = response.errors || [{}];
						BX.Disk.showModalWithStatusAction({
							status: 'error',
							message: response.errors.pop().message,
						});

						return;
					}

					if (BX.Disk.isEmptyObject(moduleTasks))
					{
						moduleTasks = BX.clone(response.tasks, true);
						BX.Disk.setModuleTasks(moduleTasks);
					}

					for (const i in response.rights)
					{
						if (!response.rights.hasOwnProperty(i))
						{
							continue;
						}
						const rightsByAccessCode = response.rights[i];
						for (const j in rightsByAccessCode)
						{
							if (!rightsByAccessCode.hasOwnProperty(j))
							{
								continue;
							}

							rights[i] = {
								readOnly: Boolean(rightsByAccessCode[j].READ_ONLY),
								item: {
									id: i,
									name: showAccessCodeFullName(response.accessCodeNames[i]),
									avatar: null,
								},
								type: 'group',
								right: {
									title: rightsByAccessCode[j].TASK.TITLE,
									id: rightsByAccessCode[j].TASK.ID,
								},
							};
						}
					}
					const showExtendedRights = Boolean(response.showExtendedRights);
					const showSystemFolderCheckbox = response.systemFolders.show;
					var modalWindow = BX.Disk.modalWindow({
						modalId: 'bx-disk-detail-sharing-folder-change-right',
						title: BX.message('DISK_FOLDER_LIST_RIGHTS_TITLE_MODAL_WITH_NAME').replace('#OBJECT#', response.storage.name),
						withoutWindowManager: true,
						contentClassName: '',
						contentStyle: {
							// paddingTop: '30px',
							// paddingBottom: '70px'
						},
						events: {
							onAfterPopupShow: BX.delegate(function() {
								storageNewRights = BX.clone(rights, true);
								isChangedRights = false;

								BX.Access.Init({
									groups: { disabled: this.isBitrix24 },
								});
								const startValue = {};
								for (const key in storageNewRights)
								{
									if (!storageNewRights.hasOwnProperty(key))
									
									{ continue;
									}

									storageNewRights[key].isBitrix24 = this.isBitrix24;
									BX.Disk.appendSystemRight(storageNewRights[key]);
								}

								BX.addCustomEvent('onChangeSystemRight', BX.proxy(this.onChangeSystemRight, this));
								BX.addCustomEvent('onDetachSystemRight', BX.proxy(this.onDetachSystemRight, this));

								BX.bind(BX('feed-add-post-destination-container'), 'click', BX.delegate(function(e) {
									const startValue = {};
									for (const key in storageNewRights)
									{
										if (!storageNewRights.hasOwnProperty(key))
										
										{ continue;
										}
										startValue[key] = true;
									}
									BX.Access.SetSelected(startValue);

									BX.Access.ShowForm({
										showSelected: true,
										callback: BX.delegate(function(arRights) {
											const res = [];
											for (const provider in arRights)
											{
												for (const id in arRights[provider])
												{
													res.push(arRights[provider][id]);
													this.onSelectSystemRight(arRights[provider][id], provider);
												}
											}
										}, this),
									});

									return BX.PreventDefault(e);
								}, this));
							}, this),
							onPopupClose: BX.delegate(function() {
								BX.removeCustomEvent('onChangeSystemRight', BX.proxy(this.onChangeRight, this));
							}, this),
						},
						content: [
							BX.create('div', {
								props: {
									className: 'bx-disk-popup-content',
								},
								children: [
									BX.create('table', {
										props: {
											id: 'bx-disk-popup-shared-people-list',
											className: 'bx-disk-popup-shared-people-list',
										},
										children: [
											BX.create('thead', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-head-col1">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS_USER')}</td>`
													+ `<td class="bx-disk-popup-shared-people-list-head-col2">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS')}</td>`
													+ '<td class="bx-disk-popup-shared-people-list-head-col3"></td>'
												+ '</tr>',
											}),
										],
									}),
									BX.create('div', {
										props: {
											id: 'feed-add-post-destination-container',
											className: 'feed-add-post-destination-wrap',
										},
										children: [
											BX.create('span', {
												props: {
													className: 'feed-add-post-destination-item',
												},
											}),
											BX.create('span', {
												props: {
													id: 'feed-add-post-destination-input-box',
													className: 'feed-add-destination-input-box',
												},
												style: {
													background: 'transparent',
												},
												children: [
													BX.create('input', {
														props: {
															type: 'text',
															value: '',
															id: 'feed-add-post-destination-input',
															className: 'feed-add-destination-inp',
														},
													}),
												],
											}),
											BX.create('a', {
												props: {
													href: '#',
													id: 'bx-destination-tag',
													className: 'feed-add-destination-link',
												},
												style: {
													background: 'transparent',
												},
												text: BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_ADD_RIGHTS_USER'),
												events: {
													click: BX.delegate(() => {}, this),
												},
											}),
										],
									}),
									BX.create('div', {
										style: {
											marginTop: '27px',
											marginBottom: '20px',
										},
										html:
											`<div><input type="checkbox" ${showExtendedRights ? 'checked="checked"' : ''} id="showExtendedRights"/><label for="showExtendedRights">${BX.message('DISK_FOLDER_LIST_LABEL_SHOW_EXTENDED_RIGHTS')}</label></div>${
											showSystemFolderCheckbox ? `<div><input type="checkbox" id="setRightsOnPseudoSystemFolders"/><label for="setRightsOnPseudoSystemFolders">${BX.message('DISK_FOLDER_LIST_LABEL_CHANGE_SYSTEM_FOLDERS').replace('#FOLDERS#', response.systemFolders.names.join(', '))}</label></div>` : ''}`,
									}),
								],
							}),
						],
						buttons: [
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_FOLDER_LIST_BTN_SAVE'),
								className: 'ui-btn ui-btn-success',
								events: {
									click: BX.delegate(function() {
										BX.Disk.ajax({
											method: 'POST',
											dataType: 'json',
											url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'saveRightsOnStorage'),
											data: {
												isChangedRights: isChangedRights ? 1 : 0,
												showExtendedRights: BX('showExtendedRights').checked ? 1 : 0,
												setRightsOnPseudoSystemFolders: BX('setRightsOnPseudoSystemFolders')?.checked ? 1 : 0,
												storageId,
												storageNewRights,
											},
											onsuccess: BX.delegate((response) => {
												if (!response)
												{
													return;
												}
												BX.Disk.showModalWithStatusAction(response);
												document.location.reload();
											}, this),
										});

										if (modalWindow)
										{
											modalWindow.close();
										}
									}, this),
								},
							}),
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_JS_BTN_CANCEL'),
								className: 'ui-btn ui-btn-link',
								events: {
									click(e)
									{
										if (modalWindow)
										{
											modalWindow.close();
										}
									},
								},
							}),
						],
					});
				}, this),
			},
		);
	};

	FolderListClass.prototype.showRightsOnObjectDetail = function(params)
	{
		storageNewRights = {};
		const storageId = this.storage.id;
		const rights = {};

		params = params || {};
		const objectId = params.object.id;

		BX.Disk.modalWindowLoader(
			BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'showRightsOnObjectDetail'),
			{
				id: `folder_list_rights_detail_object_${objectId}`,
				responseType: 'json',
				postData: {
					objectId,
					storageId,
				},
				afterSuccessLoad: BX.delegate(function(response, windowLoader)
				{
					windowLoader && windowLoader.close();

					if (response.status !== 'success')
					{
						response.errors = response.errors || [{}];
						BX.Disk.showModalWithStatusAction({
							status: 'error',
							message: response.errors.pop().message,
						});

						return;
					}

					if (BX.Disk.isEmptyObject(moduleTasks))
					{
						moduleTasks = BX.clone(response.tasks, true);
						BX.Disk.setModuleTasks(moduleTasks);
					}

					for (const i in response.rights)
					{
						if (!response.rights.hasOwnProperty(i))
						{
							continue;
						}
						const rightsByAccessCode = response.rights[i];
						for (const j in rightsByAccessCode)
						{
							if (!rightsByAccessCode.hasOwnProperty(j))
							{
								continue;
							}

							rights[i] = {
								item: {
									id: i,
									name: showAccessCodeFullName(response.accessCodeNames[i]),
									avatar: null,
								},
								type: 'group',
								right: {
									title: rightsByAccessCode[j].TASK.TITLE,
									id: rightsByAccessCode[j].TASK.ID,
								},
							};
						}
					}
					var modalWindow = BX.Disk.modalWindow({
						modalId: 'bx-disk-detail-sharing-folder-change-right',
						title: BX.message('DISK_FOLDER_LIST_RIGHTS_TITLE_MODAL_WITH_NAME').replace('#OBJECT#', response.object.name),
						withoutWindowManager: true,
						contentClassName: '',
						contentStyle: {
							// paddingTop: '30px',
							// paddingBottom: '70px'
						},
						events: {
							onAfterPopupShow: BX.delegate(function() {
								storageNewRights = BX.clone(rights, true);
								originalRights = BX.clone(rights, true);
								detachedRights = {};

								BX.Access.Init({
									groups: { disabled: this.isBitrix24 },
								});
								for (const key in storageNewRights)
								{
									if (!storageNewRights.hasOwnProperty(key))
									
									{ continue;
									}

									storageNewRights[key].isBitrix24 = this.isBitrix24;
									BX.Disk.appendSystemRight(storageNewRights[key]);
								}

								BX.addCustomEvent('onChangeSystemRight', BX.proxy(this.onChangeSystemRight, this));
								BX.addCustomEvent('onDetachSystemRight', BX.proxy(this.onDetachSystemRight, this));

								BX.bind(BX('feed-add-post-destination-container'), 'click', BX.delegate(function(e) {
									const startValue = {};
									for (const key in storageNewRights)
									{
										if (!storageNewRights.hasOwnProperty(key))
										
										{ continue;
										}
										startValue[key] = true;
									}
									BX.Access.SetSelected(startValue);

									BX.Access.ShowForm({
										showSelected: true,
										callback: BX.delegate(function(arRights) {
											const res = [];
											for (const provider in arRights)
											{
												for (const id in arRights[provider])
												{
													res.push(arRights[provider][id]);
													this.onSelectSystemRight(arRights[provider][id], provider);
												}
											}
										}, this),
									});

									return BX.PreventDefault(e);
								}, this));
							}, this),
							onPopupClose: BX.delegate(function() {
								BX.removeCustomEvent('onChangeSystemRight', BX.proxy(this.onChangeRight, this));
							}, this),
						},
						content: [
							BX.create('div', {
								props: {
									className: 'bx-disk-popup-content',
								},
								children: [
									BX.create('table', {
										props: {
											id: 'bx-disk-popup-shared-people-list',
											className: 'bx-disk-popup-shared-people-list',
										},
										children: [
											BX.create('thead', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-head-col1">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS_USER')}</td>`
													+ `<td class="bx-disk-popup-shared-people-list-head-col2">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS')}</td>`
													+ '<td class="bx-disk-popup-shared-people-list-head-col3"></td>'
												+ '</tr>',
											}),
										],
									}),
									BX.create('div', {
										props: {
											id: 'feed-add-post-destination-container',
											className: 'feed-add-post-destination-wrap',
										},
										children: [
											BX.create('span', {
												props: {
													className: 'feed-add-post-destination-item',
												},
											}),
											BX.create('span', {
												props: {
													id: 'feed-add-post-destination-input-box',
													className: 'feed-add-destination-input-box',
												},
												style: {
													background: 'transparent',
												},
												children: [
													BX.create('input', {
														props: {
															type: 'text',
															value: '',
															id: 'feed-add-post-destination-input',
															className: 'feed-add-destination-inp',
														},
													}),
												],
											}),
											BX.create('a', {
												props: {
													href: '#',
													id: 'bx-destination-tag',
													className: 'feed-add-destination-link',
												},
												style: {
													background: 'transparent',
												},
												text: BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_ADD_RIGHTS_USER'),
												events: {
													click: BX.delegate(() => {}, this),
												},
											}),
										],
									}),
								],
							}),
						],
						buttons: [
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_FOLDER_LIST_BTN_SAVE'),
								className: 'ui-btn ui-btn-success',
								events: {
									click: BX.delegate(function() {
										BX.Disk.ajax({
											method: 'POST',
											dataType: 'json',
											url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'saveRightsOnObject'),
											data: {
												objectId,
												objectNewRights: storageNewRights,
												detachedRights,
											},
											onsuccess: BX.delegate((response) => {
												if (!response)
												{
													return;
												}

												if (params.object.isFolder)
												{
													response.message = BX.message('DISK_FOLDER_LIST_OK_FOLDER_RIGHTS_MODIFIED').replace('#FOLDER#', params.object.name);
												}
												else
												{
													response.message = BX.message('DISK_FOLDER_LIST_OK_FILE_RIGHTS_MODIFIED').replace('#FILE#', params.object.name);
												}

												BX.Disk.showModalWithStatusAction(response);
											}, this),
										});

										if (modalWindow)
										{
											modalWindow.close();
										}
									}, this),
								},
							}),
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_JS_BTN_CANCEL'),
								className: 'ui-btn ui-btn-link',
								events: {
									click(e)
									{
										if (modalWindow)
										{
											modalWindow.close();
										}
									},
								},
							}),
						],
					});
				}, this),
			},
		);
	};

	FolderListClass.prototype.openSlider = function(url)
	{
		BX.SidePanel.Instance.open(url, {
			allowChangeHistory: false,
		});
	};

	FolderListClass.prototype.showSettingsOnBizproc = function()
	{
		const storageId = this.storage.id;
		let activationBizProc = '';

		BX.Disk.modalWindowLoader(
			BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'showSettingsOnBizproc'),
			{
				responseType: 'json',
				postData: {
					storageId,
				},
				afterSuccessLoad: BX.delegate(function(response)
				{
					if (response.status != 'success')
					{
						response.errors = response.errors || [{}];
						BX.Disk.showModalWithStatusAction({
							status: 'error',
							message: response.errors.pop().message,
						});
					}

					if (response.statusBizProc)
					{
						activationBizProc = 'checked';
					}

					BX.Disk.modalWindow({
						modalId: 'bx-disk-settings-bizproc',
						title: BX.message('DISK_FOLDER_LIST_BIZPROC_TITLE_MODAL'),
						contentClassName: '',
						events: {},
						content: [
							BX.create('table', {
								html: `<tr><td><label for="activationBizProc">${BX.message('DISK_FOLDER_LIST_BIZPROC_LABEL')}</label></td>`
								+ `<td><input type="checkbox" id="activationBizProc" ${activationBizProc} /></td>`
								+ '</tr>',
							}),
						],
						buttons: [
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_FOLDER_LIST_BTN_SAVE'),
								className: 'ui-btn ui-btn-success',
								events: {
									click: BX.delegate(function() {
										BX.Disk.ajax({
											method: 'POST',
											dataType: 'json',
											url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'saveSettingsOnBizproc'),
											data: {
												storageId,
												activationBizproc: BX('activationBizProc').checked ? 1 : 0,
											},
											onsuccess: BX.delegate((response) => {
												if (!response)
												{
													return;
												}

												if (response.status == 'success')
												{
													BX.Disk.showModalWithStatusAction(response);
												}
												else
												{
													response.errors = response.errors || [{}];
													BX.Disk.showModalWithStatusAction({
														status: 'error',
														message: response.errors.pop().message,
													});
												}
												location.reload();
											}, this),
										});
									}, this),
								},
							}),
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_JS_BTN_CANCEL'),
								className: 'ui-btn ui-btn-link',
								events: {
									click(e)
									{
										BX.PopupWindowManager.getCurrentPopup().destroy();
									},
								},
							}),
						],

					});
				}, this),
			},
		);
	};

	FolderListClass.prototype.openWindowForSelectDocumentService = function()
	{
		BX.Disk.InformationPopups.openWindowForSelectDocumentService({});
	};

	FolderListClass.prototype.showHiddenContent = function(el)
	{
		el.style.display = (el.style.display == 'none') ? 'block' : 'none';
	};

	FolderListClass.prototype.hide = function(el)
	{
		if (!el.getAttribute('displayOld'))
		{
			el.setAttribute('displayOld', el.style.display);
		}
		el.style.display = 'none';
	};

	FolderListClass.prototype.showNetworkDriveConnect = function(params)
	{
		params = params || {};
		const link = params.link;
		const showHiddenContent = this.showHiddenContent;
		const hide = this.hide;
		showHiddenContent(BX('bx-disk-network-drive-full'));

		this.showAirMessageBox({
			title: BX.message('DISK_FOLDER_LIST_PAGE_TITLE_NETWORK_DRIVE'),
			message: BX.create('div', {
				style: {
					padding: '0 24px 0',
				},
				children: [
					BX.create('label', {
						text: `${BX.message('DISK_FOLDER_LIST_PAGE_TITLE_NETWORK_DRIVE_DESCR_MODAL')} :`,
						props: {
							className: 'bx-disk-popup-label',
							for: 'disk-get-network-drive-link',
						},
					}),
					BX.create('input', {
						style: {
							marginTop: '10px',
						},
						props: {
							id: 'disk-get-network-drive-link',
							className: 'bx-disk-popup-input',
							type: 'text',
							value: link,
						},
					}),
					BX('bx-disk-network-drive-full'),
				],
			}),
			popupOptions: {
				events: {
					onAfterPopupShow() {
						const inputLink = BX('disk-get-network-drive-link');
						BX.focus(inputLink);
						inputLink.setSelectionRange(0, inputLink.value.length);
					},
					onPopupClose() {
						hide(BX('bx-disk-network-drive'));
						hide(BX('bx-disk-network-drive-full'));
						document.body.appendChild(BX('bx-disk-network-drive-full'));
						this.destroy();
					},
				},
			},
			buttonsFactory: (messageBox) => {
				const cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,
				});
				cancelButton.setText(BX.message('DISK_JS_BTN_CLOSE'));
				cancelButton.setWide(true);

				return [cancelButton];
			},
		});
		if (BX('bx-disk-network-drive-secure-label'))
		{
			hide(BX.findChildByClassName(BX('bx-disk-show-network-drive-connect'), 'bx-disk-popup-label'));
			hide(BX.findChildByClassName(BX('bx-disk-show-network-drive-connect'), 'bx-disk-popup-input'));
		}
	};

	FolderListClass.prototype.showSharingDetailWithSharing = function(params) {
		entityToNewShared = {};
		loadedReadOnlyEntityToNewShared = {};

		params = params || {};
		const objectId = params.object.id;

		BX.Disk.modalWindowLoader(
			BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'showSharingDetailAppendSharing'),
			{
				id: `folder_list_sharing_detail_object_${objectId}`,
				responseType: 'json',
				postData: {
					objectId,
				},
				afterSuccessLoad: BX.delegate(function(response)
				{
					if (response.status != 'success')
					{
						response.errors = response.errors || [{}];
						BX.Disk.showModalWithStatusAction({
							status: 'error',
							message: response.errors.pop().message,
						});
					}

					const objectOwner = {
						name: response.owner.name,
						avatar: response.owner.avatar,
						link: response.owner.link,
					};
					entityToNewSharedMaxTaskName = response.owner.maxTaskName;

					BX.Disk.modalWindow({
						modalId: 'bx-disk-detail-sharing-folder-change-right',
						title: BX.message('DISK_FOLDER_LIST_SHARING_TITLE_MODAL_3'),
						contentClassName: '',
						contentStyle: {
							// paddingTop: '30px',
							// paddingBottom: '70px'
						},
						events: {
							onAfterPopupShow: BX.delegate(function() {
								BX.addCustomEvent('onChangeRightOfSharing', BX.proxy(this.onChangeRightOfSharing, this));

								for (const i in response.members)
								{
									if (!response.members.hasOwnProperty(i))
									{
										continue;
									}

									entityToNewShared[response.members[i].entityId] = {
										item: {
											id: response.members[i].entityId,
											name: response.members[i].name,
											avatar: response.members[i].avatar,
										},
										type: response.members[i].type,
										right: response.members[i].right,
									};
								}
								loadedReadOnlyEntityToNewShared = BX.clone(entityToNewShared, true);

								BX.SocNetLogDestination.init({
									name: this.destFormName,
									searchInput: BX('feed-add-post-destination-input'),
									bindMainPopup: { node: BX('feed-add-post-destination-container'), offsetTop: '5px', offsetLeft: '15px' },
									bindSearchPopup: { node: BX('feed-add-post-destination-container'), offsetTop: '5px', offsetLeft: '15px' },
									callback: {
										select: BX.proxy(this.onSelectDestination, this),
										unSelect: BX.proxy(this.onUnSelectDestination, this),
										openDialog: BX.proxy(this.onOpenDialogDestination, this),
										closeDialog: BX.proxy(this.onCloseDialogDestination, this),
										openSearch: BX.proxy(this.onOpenSearchDestination, this),
										closeSearch: BX.proxy(this.onCloseSearchDestination, this),
									},
									items: response.destination.items,
									itemsLast: response.destination.itemsLast,
									itemsSelected: response.destination.itemsSelected,
								});

								const BXSocNetLogDestinationFormName = this.destFormName;
								BX.bind(BX('feed-add-post-destination-container'), 'click', (e) => { BX.SocNetLogDestination.openDialog(BXSocNetLogDestinationFormName); BX.PreventDefault(e);
								});
								BX.bind(BX('feed-add-post-destination-input'), 'keyup', BX.proxy(this.onKeyUpDestination, this));
								BX.bind(BX('feed-add-post-destination-input'), 'keydown', BX.proxy(this.onKeyDownDestination, this));
							}, this),
							onPopupClose: BX.delegate(function() {
								if (BX.SocNetLogDestination && BX.SocNetLogDestination.isOpenDialog())
								{
									BX.SocNetLogDestination.closeDialog();
								}

								BX.removeCustomEvent('onChangeRightOfSharing', BX.proxy(this.onChangeRightOfSharing, this));
								BX.proxy_context.destroy();
							}, this),
						},
						content: [
							BX.create('div', {
								props: {
									className: 'bx-disk-popup-content',
								},
								children: [
									BX.create('table', {
										props: {
											className: 'bx-disk-popup-shared-people-list',
										},
										children: [
											BX.create('thead', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-head-col1">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_OWNER')}</td>`
												+ '</tr>',
											}),
											BX.create('tr', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-col1" style="border-bottom: none;"><a class="bx-disk-filepage-used-people-link" href="${objectOwner.link}"><span class="bx-disk-filepage-used-people-avatar" style="background-image: url('${encodeURI(objectOwner.avatar)}');"></span>${BX.util.htmlspecialchars(objectOwner.name)}</a></td>`
												+ '</tr>',
											}),
										],
									}),
									BX.create('table', {
										props: {
											id: 'bx-disk-popup-shared-people-list',
											className: 'bx-disk-popup-shared-people-list',
										},
										children: [
											BX.create('thead', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-head-col1">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS_USER')}</td>`
													+ `<td class="bx-disk-popup-shared-people-list-head-col2">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS')}</td>`
													+ '<td class="bx-disk-popup-shared-people-list-head-col3"></td>'
												+ '</tr>',
											}),
										],
									}),
									BX.create('div', {
										props: {
											id: 'feed-add-post-destination-container',
											className: 'feed-add-post-destination-wrap',
										},
										children: [
											BX.create('span', {
												props: {
													className: 'feed-add-post-destination-item',
												},
											}),
											BX.create('span', {
												props: {
													id: 'feed-add-post-destination-input-box',
													className: 'feed-add-destination-input-box',
												},
												style: {
													background: 'transparent',
												},
												children: [
													BX.create('input', {
														props: {
															type: 'text',
															value: '',
															id: 'feed-add-post-destination-input',
															className: 'feed-add-destination-inp',
														},
													}),
												],
											}),
											BX.create('a', {
												props: {
													href: '#',
													id: 'bx-destination-tag',
													className: 'feed-add-destination-link',
												},
												style: {
													background: 'transparent',
												},
												text: BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_ADD_RIGHTS_USER'),
												events: {
													click: BX.delegate(() => {}, this),
												},
											}),
										],
									}),
								],
							}),
						],
						buttons: [
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_FOLDER_LIST_BTN_SAVE'),
								className: 'ui-btn ui-btn-success',
								events: {
									click: BX.delegate(function() {
										BX.Disk.ajax({
											method: 'POST',
											dataType: 'json',
											url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'appendSharing'),
											data: {
												objectId,
												entityToNewShared,
											},
											onsuccess: BX.delegate(function(response) {
												if (!response)
												{
													return;
												}
												BX.Disk.showModalWithStatusAction(response);
												const icon = BX.delegate(getIconElementByObjectId, this)(objectId);
												if (icon)
												{
													if (!entityToNewShared || BX.Disk.isEmptyObject(entityToNewShared))
													{
														BX.removeClass(icon, 'icon-shared icon-shared_2 shared');
														BX.removeClass(icon, 'icon-shared_1');
													}
													else
													{
														BX.addClass(icon, 'icon-shared icon-shared_2 shared');
													}
												}
											}, this),
										});

										BX.PopupWindowManager.getCurrentPopup().close();
									}, this),
								},
							}),
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_JS_BTN_CANCEL'),
								className: 'ui-btn ui-btn-link',
								events: {
									click(e)
									{
										BX.PopupWindowManager.getCurrentPopup().destroy();
									},
								},
							}),
						],
					});
				}, this),
			},
		);
	};

	FolderListClass.prototype.onCreateExtendedFolder = function() {
		this.showCreateFolderWithSharing({});
	};

	FolderListClass.prototype.showCreateFolderWithSharing = function()
	{
		entityToNewShared = {};
		storageNewRights = {};
		const storageId = this.storage.id;
		const rights = {};

		BX.Disk.modalWindowLoader(
			BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'showCreateFolderWithSharingInCommon'),
			{
				id: `folder_list_rights_detail_storage_${storageId}`,
				responseType: 'json',
				postData: {
					storageId,
				},
				afterSuccessLoad: BX.delegate(function(response)
				{
					if (response.status != 'success')
					{
						response.errors = response.errors || [{}];
						BX.Disk.showModalWithStatusAction({
							status: 'error',
							message: response.errors.pop().message,
						});
					}

					if (BX.Disk.isEmptyObject(moduleTasks))
					{
						moduleTasks = BX.clone(response.tasks, true);
						BX.Disk.setModuleTasks(moduleTasks);
					}

					for (const i in response.rights)
					{
						if (!response.rights.hasOwnProperty(i))
						{
							continue;
						}
						const rightsByAccessCode = response.rights[i];
						for (const j in rightsByAccessCode)
						{
							if (!rightsByAccessCode.hasOwnProperty(j))
							{
								continue;
							}

							rights[i] = {
								detachOnly: true,
								item: {
									id: i,
									name: response.accessCodeNames[i].name,
									avatar: null,
								},
								type: 'group',
								right: {
									title: rightsByAccessCode[j].TASK.TITLE,
									id: rightsByAccessCode[j].TASK.ID,
								},
							};
						}
					}

					BX.Disk.modalWindow({
						modalId: 'bx-disk-detail-sharing-create-folder',
						title: BX.message('DISK_FOLDER_LIST_CREATE_FOLDER_MODAL'),
						contentClassName: '',
						contentStyle: {},
						events: {
							onAfterPopupShow: BX.delegate(function() {
								BX.focus(BX('disk-new-create-filename'));
								storageNewRights = BX.clone(rights, true);

								for (const i in rights)
								{
									if (!rights.hasOwnProperty(i))
									{
										continue;
									}
									BX.Disk.appendRight(rights[i]);
								}

								BX.addCustomEvent('onChangeRightOfSharing', BX.proxy(this.onChangeRightOfSharing, this));
								BX.addCustomEvent('onChangeRight', BX.proxy(this.onChangeRight, this));
								BX.addCustomEvent('onDetachRight', BX.proxy(this.onDetachRight, this));

								BX.SocNetLogDestination.init({
									name: this.destFormName,
									searchInput: BX('feed-add-post-destination-input'),
									bindMainPopup: { node: BX('feed-add-post-destination-container'), offsetTop: '5px', offsetLeft: '15px' },
									bindSearchPopup: { node: BX('feed-add-post-destination-container'), offsetTop: '5px', offsetLeft: '15px' },
									callback: {
										select: BX.proxy(this.onSelectDestination, this),
										unSelect: BX.proxy(this.onUnSelectDestination, this),
										openDialog: BX.proxy(this.onOpenDialogDestination, this),
										closeDialog: BX.proxy(this.onCloseDialogDestination, this),
										openSearch: BX.proxy(this.onOpenSearchDestination, this),
										closeSearch: BX.proxy(this.onCloseSearchDestination, this),
									},
									items: response.destination.items,
									itemsLast: response.destination.itemsLast,
									itemsSelected: response.destination.itemsSelected,
								});

								const BXSocNetLogDestinationFormName = this.destFormName;
								BX.bind(BX('feed-add-post-destination-container'), 'click', (e) => { BX.SocNetLogDestination.openDialog(BXSocNetLogDestinationFormName); BX.PreventDefault(e);
								});
								BX.bind(BX('feed-add-post-destination-input'), 'keyup', BX.proxy(this.onKeyUpDestination, this));
								BX.bind(BX('feed-add-post-destination-input'), 'keydown', BX.proxy(this.onKeyDownDestination, this));
							}, this),
							onPopupClose: BX.delegate(function() {
								if (BX.SocNetLogDestination && BX.SocNetLogDestination.isOpenDialog())
								{
									BX.SocNetLogDestination.closeDialog();
								}

								BX.removeCustomEvent('onChangeRight', BX.proxy(this.onChangeRight, this));
								BX.proxy_context.destroy();
							}, this),
						},
						content: [
							BX.create('div', {
								props: {
									className: 'bx-disk-popup-content-small',
								},
								children: [
									BX.create('label', {
										props: {
											className: 'bx-disk-popup-label',
											for: 'disk-new-create-filename',
										},
										children: [
											BX.create('span', {
												props: {
													className: 'req',
												},
												text: '*',
											}),
											BX.message('DISK_FOLDER_LIST_LABEL_NAME_CREATE_FOLDER'),
										],
									}),
									BX.create('input', {
										props: {
											id: 'disk-new-create-filename',
											className: 'bx-disk-popup-input',
											type: 'text',
											value: '',
										},
										style: {
											fontSize: '16px',
											marginTop: '10px',
										},
									}),
								],
							}),
							BX.create('div', {
								props: {
									className: 'bx-disk-popup-content',
								},
								children: [
									BX.create('table', {
										props: {
											id: 'bx-disk-popup-shared-people-list',
											className: 'bx-disk-popup-shared-people-list',
										},
										children: [
											BX.create('thead', {
												html: '<tr>'
													+ `<td class="bx-disk-popup-shared-people-list-head-col1">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS_USER')}</td>`
													+ `<td class="bx-disk-popup-shared-people-list-head-col2">${BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_RIGHTS')}</td>`
													+ '<td class="bx-disk-popup-shared-people-list-head-col3"></td>'
												+ '</tr>',
											}),
										],
									}),
									BX.create('div', {
										props: {
											id: 'feed-add-post-destination-container',
											className: 'feed-add-post-destination-wrap',
										},
										children: [
											BX.create('span', {
												props: {
													className: 'feed-add-post-destination-item',
												},
											}),
											BX.create('span', {
												props: {
													id: 'feed-add-post-destination-input-box',
													className: 'feed-add-destination-input-box',
												},
												style: {
													background: 'transparent',
												},
												children: [
													BX.create('input', {
														props: {
															type: 'text',
															value: '',
															id: 'feed-add-post-destination-input',
															className: 'feed-add-destination-inp',
														},
													}),
												],
											}),
											BX.create('a', {
												props: {
													href: '#',
													id: 'bx-destination-tag',
													className: 'feed-add-destination-link',
												},
												style: {
													background: 'transparent',
												},
												text: BX.message('DISK_FOLDER_LIST_SHARING_LABEL_NAME_ADD_RIGHTS_USER'),
												events: {
													click: BX.delegate(() => {}, this),
												},
											}),
										],
									}),
								],
							}),
						],
						buttons: [
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_FOLDER_LIST_BTN_SAVE'),
								className: 'ui-btn ui-btn-success',
								events: {
									click: BX.delegate(function() {
										const newName = BX('disk-new-create-filename').value;
										if (!newName)
										{
											BX.focus(BX('disk-new-create-filename'));

											return;
										}

										BX.Disk.ajax({
											method: 'POST',
											dataType: 'json',
											url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'createFolderWithSharing'),
											data: {
												name: newName,
												storageId,
												storageNewRights: storageNewRights || {},
												entityToNewShared: entityToNewShared || {},
											},
											onsuccess: BX.delegate((response) => {
												if (!response)
												{
													return;
												}
												BX.Disk.showModalWithStatusAction(response);
												if (response.status && response.status == 'success')
												{
													window.document.location = BX.Disk.getUrlToShowObjectInGrid(response.folder.id);
												}
											}, this),
										});

										BX.PopupWindowManager.getCurrentPopup().close();
									}, this),
								},
							}),
							new BX.PopupWindowCustomButton({
								text: BX.message('DISK_JS_BTN_CANCEL'),
								className: 'ui-btn ui-btn-link',
								events: {
									click(e)
									{
										BX.PopupWindowManager.getCurrentPopup().destroy();
									},
								},
							}),
						],
					});
				}, this),
			},
		);
	};

	FolderListClass.prototype.onSelectSystemRight = function(item, type)
	{
		storageNewRights[item.id] = storageNewRights[item.id] || {};
		isChangedRights = true;

		const providerPrefix = BX.Access.GetProviderPrefix(type, item.id);
		storageNewRights[item.id] = {
			item: {
				avatar: null,
				id: item.id,
				name: (providerPrefix ? `${providerPrefix}: ` : '') + item.name,
			},
			type: 'user', // todo fix nd actualize this. May be groups, users, departments, etc.
			right: 'read',
		};

		storageNewRights[item.id].isBitrix24 = this.isBitrix24;
		BX.Disk.appendSystemRight(storageNewRights[item.id]);
	};

	FolderListClass.prototype.onSelectRightDestination = function(item, type, search)
	{
		storageNewRights[item.id] = storageNewRights[item.id] || {};

		storageNewRights[item.id] = {
			item,
			type,
			right: storageNewRights[item.id].right || {},
		};

		BX.Disk.appendRight({
			destFormName: this.destFormName,
			item,
			type,
			right: storageNewRights[item.id].right,
		});
	};

	FolderListClass.prototype.onUnSelectRightDestination = function(item, type, search)
	{
		const entityId = item.id;

		delete storageNewRights[entityId];

		const child = BX.findChild(BX('bx-disk-popup-shared-people-list'), { attribute: { 'data-dest-id': `${String(entityId)}` } }, true);
		if (child)
		{
			BX.remove(child);
		}
	};

	FolderListClass.prototype.onChangeSystemRight = function(entityId, task)
	{
		if (storageNewRights[entityId])
		{
			isChangedRights = true;
			storageNewRights[entityId].right = {
				id: task.ID,
				title: task.TITLE,
			};
		}
	};

	FolderListClass.prototype.onDetachSystemRight = function(entityId)
	{
		if (storageNewRights[entityId])
		{
			isChangedRights = true;
			BX.Access.DeleteSelected(entityId);
			detachedRights[entityId] = storageNewRights[entityId];

			delete storageNewRights[entityId];
		}
	};

	FolderListClass.prototype.onChangeRight = function(entityId, task)
	{
		if (storageNewRights[entityId])
		{
			storageNewRights[entityId].right = {
				id: task.ID,
				title: task.TITLE,
			};
		}
	};

	FolderListClass.prototype.onDetachRight = function(entityId)
	{
		if (storageNewRights[entityId])
		{
			delete storageNewRights[entityId];
		}
	};

	FolderListClass.prototype.onSelectDestination = function(item, type, search)
	{
		entityToNewShared[item.id] = entityToNewShared[item.id] || {};
		BX.Disk.appendNewShared({
			maxTaskName: entityToNewSharedMaxTaskName,
			readOnly: Boolean(loadedReadOnlyEntityToNewShared[item.id]),
			destFormName: this.destFormName,
			item,
			type,
			right: entityToNewShared[item.id].right,
		});

		entityToNewShared[item.id] = {
			item,
			type,
			right: entityToNewShared[item.id].right || 'disk_access_read',
		};
	};

	FolderListClass.prototype.onUnSelectDestination = function(item, type, search)
	{
		const entityId = item.id;

		if (loadedReadOnlyEntityToNewShared[entityId])
		{
			return false;
		}

		delete entityToNewShared[entityId];

		const child = BX.findChild(BX('bx-disk-popup-shared-people-list'), { attribute: { 'data-dest-id': `${String(entityId)}` } }, true);
		if (child)
		{
			BX.remove(child);
		}
	};

	FolderListClass.prototype.onChangeRightOfSharing = function(entityId, taskName)
	{
		if (entityToNewShared[entityId])
		{
			entityToNewShared[entityId].right = taskName;
		}
	};

	FolderListClass.prototype.onOpenDialogDestination = function()
	{
		BX.style(BX('feed-add-post-destination-input-box'), 'display', 'inline-block');
		BX.style(BX('bx-destination-tag'), 'display', 'none');
		BX.focus(BX('feed-add-post-destination-input'));
		if (BX.SocNetLogDestination.popupWindow)
		
		{ BX.SocNetLogDestination.popupWindow.adjustPosition({ forceTop: true });
		}
	};

	FolderListClass.prototype.onCloseDialogDestination = function()
	{
		const input = BX('feed-add-post-destination-input');
		if (!BX.SocNetLogDestination.isOpenSearch() && input && input.value.length <= 0)
		{
			BX.style(BX('feed-add-post-destination-input-box'), 'display', 'none');
			BX.style(BX('bx-destination-tag'), 'display', 'inline-block');
		}
	};

	FolderListClass.prototype.onOpenSearchDestination = function()
	{
		if (BX.SocNetLogDestination.popupSearchWindow)
		
		{ BX.SocNetLogDestination.popupSearchWindow.adjustPosition({ forceTop: true });
		}
	};

	FolderListClass.prototype.onCloseSearchDestination = function()
	{
		const input = BX('feed-add-post-destination-input');
		if (!BX.SocNetLogDestination.isOpenSearch() && input && input.value.length > 0)
		{
			BX.style(BX('feed-add-post-destination-input-box'), 'display', 'none');
			BX.style(BX('bx-destination-tag'), 'display', 'inline-block');
			BX('feed-add-post-destination-input').value = '';
		}
	};

	FolderListClass.prototype.onKeyDownDestination = function(event)
	{
		const BXSocNetLogDestinationFormName = this.destFormName;
		if (event.keyCode == 8 && BX('feed-add-post-destination-input').value.length <= 0)
		{
			BX.SocNetLogDestination.sendEvent = false;
			BX.SocNetLogDestination.deleteLastItem(BXSocNetLogDestinationFormName);
		}

		return true;
	};

	FolderListClass.prototype.onKeyUpDestination = function(event)
	{
		const BXSocNetLogDestinationFormName = this.destFormName;
		if (event.keyCode == 16 || event.keyCode == 17 || event.keyCode == 18 || event.keyCode == 20 || event.keyCode == 244 || event.keyCode == 224 || event.keyCode == 91)
		
		{ return false;
		}

		if (event.keyCode == 13)
		{
			BX.SocNetLogDestination.selectFirstSearchItem(BXSocNetLogDestinationFormName);

			return BX.PreventDefault(event);
		}

		if (event.keyCode == 27)
		{
			BX('feed-add-post-destination-input').value = '';
		}
		else
		{
			BX.SocNetLogDestination.search(BX('feed-add-post-destination-input').value, true, BXSocNetLogDestinationFormName);
		}

		if (BX.SocNetLogDestination.sendEvent && BX.SocNetLogDestination.isOpenDialog())
		
		{ BX.SocNetLogDestination.closeDialog();
		}

		if (event.keyCode == 8)
		{
			BX.SocNetLogDestination.sendEvent = true;
		}

		return BX.PreventDefault(event);
	};

	FolderListClass.prototype.resolveSearchHost = function()
	{
		const gridContainer = this.commonGrid.getContainer();
		const host = gridContainer.closest('.bx-disk-interface-filelist') || gridContainer;
		BX.addClass(host, 'bx-disk-interface-filelist-search-host');

		return host;
	};

	FolderListClass.prototype.beginSearchSession = function(folder)
	{
		this.cancelSearchSession();

		const session = {
			id: ++this.searchSessionId,
			folderId: folder.id,
			host: this.resolveSearchHost(),
			faded: false,
			loader: null,
			loaderWrapper: null,
		};

		this.activeSearchSession = session;
		BX.addClass(session.host, 'disk-running-filter');

		return session;
	};

	FolderListClass.prototype.cancelSearchSession = function()
	{
		const session = this.activeSearchSession;
		this.activeSearchSession = null;
		this.tearDownSearchSession(session);
	};

	FolderListClass.prototype.finishSearchSession = function(session)
	{
		if (!this.isCurrentSearchSession(session))
		{
			return;
		}

		this.activeSearchSession = null;
		this.tearDownSearchSession(session);
	};

	FolderListClass.prototype.isCurrentSearchSession = function(session)
	{
		return Boolean(
			session
			&& this.activeSearchSession
			&& this.activeSearchSession.id === session.id,
		);
	};

	FolderListClass.prototype.tearDownSearchSession = function(session)
	{
		if (!session)
		{
			return;
		}

		const searchSession = session;
		this.removeSearchProcessInConnectedFolders(searchSession);
		BX.removeClass(searchSession.host, 'disk-running-filter');

		if (searchSession.faded)
		{
			searchSession.faded = false;
			this.commonGrid.unFade();
		}

		this.restoreTileEmptyState();
	};

	FolderListClass.prototype.restoreTileEmptyState = function()
	{
		if (!this.commonGrid.countItems() && this.commonGrid.isTile())
		{
			this.commonGrid.instance.removeEmptyBlock();
			this.commonGrid.instance.setMinHeightContainer();
			this.commonGrid.instance.appendEmptyBlock();
		}
	};

	FolderListClass.prototype.showSearchProcessInConnectedFolders = function(session)
	{
		const resolvedHost = this.resolveSearchHost();
		const searchSession = session || this.activeSearchSession;
		if (!this.isCurrentSearchSession(searchSession) || searchSession.loader)
		{
			return;
		}

		const host = searchSession.host || resolvedHost;
		searchSession.loader = BX.create('div', {
			props: {
				className: 'bx-disk-interface-filelist-loader',
			},
			children: [
				 BX.create('div', {
					props: {
						className: 'bx-disk-interface-filelist-loader-wrapper',
					},
					children: [
						searchSession.loaderWrapper = BX.create('div', {
							props: {
								className: 'bx-disk-interface-filelist-loader-container',
							},
						}),
						BX.create('div', {
							props: {
								className: 'bx-disk-interface-filelist-loader-text',
							},
							text: BX.message('DISK_FOLDER_LIST_SEARCH_PROGRESS_LABEL'),
						}),
					],
				}),
			],
		});

		const loader = new BX.Loader({ size: 170 });

		loader.show(searchSession.loaderWrapper);
		BX.append(searchSession.loader, host);
	};

	FolderListClass.prototype.removeSearchProcessInConnectedFolders = function(session)
	{
		const searchSession = session;
		if (!searchSession || !searchSession.loader)
		{
			return;
		}

		if (searchSession.loader.parentNode)
		{
			BX.remove(searchSession.loader);
		}

		searchSession.loader = null;
		searchSession.loaderWrapper = null;
	};

	return FolderListClass;
})();

(function() {
	'use strict';

	/**
	 * @namespace BX.Disk.Model.FolderList
	 */
	BX.namespace('BX.Disk.Model.FolderList');

	/**
	 *
	 * @param {object} parameters
	 * @extends {BX.Disk.Model.Item}
	 * @constructor
	 */
	BX.Disk.Model.FolderList.SearchProgress = function(parameters)
	{
		BX.Disk.Model.Item.apply(this, arguments);

		this.templateId = 'search-progress';
	};

	BX.Disk.Model.FolderList.SearchProgress.prototype =	{
		__proto__: BX.Disk.Model.Item.prototype,
		constructor: BX.Disk.Model.FolderList.SearchProgress,

		isTimeToShow()
		{
			return this.state.total > 0 && this.state.total !== this.state.current;
		},

		getDefaultStateValues()
		{
			return {
				isTimeToShow: this.isTimeToShow.bind(this),
			};
		},
	};

	BX.Disk.Model.FolderList.CommonGrid = function(parameters)
	{
		this.instance = parameters.instance;
	};

	BX.Disk.Model.FolderList.CommonGrid.prototype =	{
		constructor: BX.Disk.Model.FolderList.CommonGrid,

		getId()
		{
			return this.instance.getId();
		},

		isGrid()
		{
			return !this.isTile();
		},

		isTile()
		{
			return BX.TileGrid.Grid && (this.instance instanceof BX.TileGrid.Grid);
		},

		getContainer()
		{
			return this.instance.getContainer();
		},

		fade()
		{
			if (this.isGrid())
			{
				this.instance.tableFade();
			}
			else
			{
				this.instance.setFadeContainer();
				this.instance.getLoader();
				this.instance.showLoader();
			}
		},

		unFade()
		{
			if (this.isGrid())
			{
				this.instance.tableUnfade();
			}
			else
			{
				this.instance.getLoader().hide();
				this.instance.unSetFadeContainer();
			}
		},

		getActionKey()
		{
			return (`action_button_${this.instance.getId()}`);
		},

		getSelectedIds()
		{
			if (this.isGrid())
			{
				return this.instance.getRows().getSelectedIds();
			}

			return this.instance.getSelectedItems().map((item) => {
				return item.getId();
			});
		},

		getIds()
		{
			if (this.isGrid())
			{
				return this.instance.getRows().getBodyChild().map((row) => {
					return row.getId();
				});
			}

			return this.instance.items.map((item) => {
				return item.id;
			});
		},

		countItems()
		{
			if (this.isGrid())
			{
				return this.instance.getRows().getBodyChild().length;
			}

			return this.instance.countItems();
		},

		reload(url, data)
		{
			data = data || {};

			if (this.isGrid())
			{
				const promise = new BX.Promise();
				this.instance.reloadTable(
					'POST',
					data,
					() => {
						promise.fulfill();
					},
					url,
				);

				return promise;
			}

			return this.instance.reload(url, data);
		},

		getActionsMenu(itemId)
		{
			if (this.isGrid())
			{
				return this.instance.getRows().getById(itemId).getActionsMenu();
			}

			const item = this.instance.getItem(itemId);
			if (item)
			{
				return item.getActionsMenu();
			}
		},

		getItemById(id)
		{
			if (this.isGrid())
			{
				return this.instance.getRows().getById(id);
			}

			return this.instance.getItem(id);
		},

		scrollTo(id)
		{
			let contentNode;
			if (this.isGrid())
			{
				var row = this.instance.getRows().getById(id);
				if (row && row.node)
				{
					contentNode = row.node;
				}
			}
			else
			{
				const item = this.instance.getItem(id);
				if (row && row.node)
				{
					contentNode = row.getContainer();
				}
			}

			if (contentNode)
			{
				(new BX.easing({
					duration: 500,
					start: { scroll: window.pageYOffset || document.documentElement.scrollTop },
					finish: { scroll: BX.pos(contentNode).top },
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step(state) {
						window.scrollTo(0, state.scroll);
					},
				})).animate();
			}
		},

		getActionById(id, menuItemId)
		{
			const item = this.getItemById(id);
			if (!item)
			{
				return null;
			}

			const actions = item.getActions() || [];
			for (const action of actions)
			{
				if (action.id && action.id === menuItemId)
				{
					return action;
				}
			}

			return null;
		},

		removeItemById(itemId)
		{
			BX.fireEvent(document.body, 'click');

			if (this.isGrid())
			{
				this.instance.removeRow(itemId);
			}
			else
			{
				const item = this.instance.getItem(itemId);
				if (item)
				{
					this.instance.removeItem(item);
				}
			}
		},

		selectItemById(itemId)
		{
			let item;
			if (this.isGrid())
			{
				item = this.instance.getRows().getById(itemId);
				if (item)
				{
					item.select();
				}
			}
			else
			{
				item = this.instance.getItem(itemId);
				if (item)
				{
					this.instance.selectItem(item);
				}
			}
		},

		removeSelected()
		{
			if (this.isGrid())
			{
				this.instance.removeSelected();
			}
			else
			{
				// todo here we have to remove items from server
			}
		},

		sortByColumn(column)
		{
			this.instance.sortByColumn(column);
		},
	};

	BX.namespace('BX.Disk.TileGrid');

	/**
	 *
	 * @param options
	 * @extends {BX.TileGrid.Item}
	 * @constructor
	 */
	BX.Disk.TileGrid.Item = function(options)
	{
		BX.TileGrid.Item.apply(this, arguments);

		this.isDraggable = options.isDraggable;
		this.isDroppable = options.isDroppable;
		this.dblClickDelay = 0;
		this.title = options.name;
		this.isFolder = options.isFolder;
		this.isFile = options.isFile;
		this.isMailAttachments = options.isMailAttachments;
		this.canAdd = options.canAdd;
		this.canDelete = options.canDelete === true;
		this.isLocked = options.isLocked;
		this.isSymlink = options.isSymlink;
		this.image = options.image;
		this.actions = options.actions;
		this.link = options.link;
		this.attributes = options.attributes;
		this.item = {
			container: null,
			action: null,
			title: null,
			titleWrapper: null,
			titleLink: null,
			titleInput: null,
			lock: null,
			symlink: null,
			imageBlock: null,
			picture: null,
			fileType: null,
			icons: null,
		};
		this.actionsMenu = null;
		this.imageItemHandler = null;

		BX.addCustomEvent(window, 'TileGrid.Grid:onItemDragStart', () => {
			if (this.actionsMenu)

			
     { this.actionsMenu.popupWindow.close();
			}
		});
	};

	BX.Disk.TileGrid.Item.prototype =	{
		__proto__: BX.TileGrid.Item.prototype,
		constructor: BX.TileGrid.Item,

		handleDblClick()
		{
			BX.onCustomEvent('Disk.TileItem.Item:onItemDblClick', [this]);
		},

		handleEnter()
		{
			BX.onCustomEvent('Disk.TileItem.Item:onItemEnter', [this]);
		},

		/**
		 *
		 * @returns {Element}
		 */
		getContent()
		{
			this.item.container = BX.create('div', {
				attrs: {
					className: this.isFile ? 'disk-folder-list-item' : 'disk-folder-list-item disk-folder-list-item-folder',
				},
				children: [
					this.getImage(),
					this.getActionBlock(),
					BX.create('div', {
						props: {
							className: (!this.getLocked() && !this.getSymlink()) ? 'disk-folder-list-item-bottom disk-folder-list-item-bottom-without-icons' : 'disk-folder-list-item-bottom',
						},
						children: [
							this.getTitle(),
							this.getIconsContainer(),
						],
					}),
				],
				events: {
					contextmenu: function(event) {
						if (event.ctrlKey)
						{
							return;
						}

						this.showActionsMenu(event);
						this.gridTile.resetSelection();
						this.gridTile.selectItem(this);
						event.preventDefault();
					}.bind(this),
				},
			});

			if (this.image)
			{
				this.imageItemHandler = BX.throttle(this.appendImageItem, 20, this);
				BX.bind(window, 'resize', this.imageItemHandler);
				BX.bind(window, 'scroll', this.imageItemHandler);
			}

			return this.item.container;
		},

		appendImageItem()
		{
			if (this.isVisibleOnFolderList())
			{
				this.item.picture.setAttribute('src', this.image);
				BX.bind(this.item.container, 'animationend', BX.proxy(this.appendImageItem, this));
				BX.unbind(this.item.container, 'animationend', BX.proxy(this.appendImageItem, this));
				BX.unbind(window, 'resize', this.imageItemHandler);
				BX.unbind(window, 'scroll', this.imageItemHandler);
			}
		},

		lock()
		{
			this.item.lock.style.display = null;
		},

		unlock()
		{
			this.item.lock.style.display = 'none';
		},

		getIconsContainer()
		{
			this.item.icons = BX.create('div', {
				props: {
					className: 'disk-folder-list-item-icons',
				},
				children: [
					this.getLocked(),
					this.getSymlink(),
				],
			});

			return this.item.icons;
		},

		getLocked()
		{
			this.item.lock = BX.create('div', {
				attrs: {
					className: 'disk-folder-list-item-locked',
				},
				style: {
					display: this.isLocked ? null : 'none',
				},
			});

			return this.item.lock;
		},

		getSymlink()
		{
			this.item.symlink = BX.create('div', {
				attrs: {
					className: 'disk-folder-list-item-shared',
				},
				style: {
					display: this.isSymlink ? null : 'none',
				},
			});

			return this.item.symlink;
		},

		/**
		 *
		 * @returns {Element}
		 */
		getTitle()
		{
			return this.item.title = BX.create('div', {
				props: {
					className: 'disk-folder-list-item-title',
				},
				children: [
					this.item.titleWrapper = BX.create('div', {
						props: {
							className: 'disk-folder-list-item-title-wrapper',
						},
						 children: [
						 	this.getTitleInput(),
							this.item.titleLink = BX.create('a', {
								attrs: {
						 			className: 'disk-folder-list-item-title-link',
						 			href: this.link,
						 			title: this.title,
									id: `disk_obj_${this.id}`,
						 		},
								events: {
									click: this.handleTitleClick.bind(this),
								},
						 		text: this.title,
						 		dataset: BX.mergeEx({
						 			objectId: this.id,
						 			canAdd: this.canAdd,
						 		}, this.attributes),
						 	}),
						 ],
					}),
				],
			});
		},

		handleTitleClick(event)
		{
			BX.onCustomEvent('Disk.TileItem.Item:onTitleClick', [this, event]);
		},

		getTitleInput()
		{
			this.item.titleInput = BX.create('input', {
				attrs: {
					className: 'disk-folder-list-item-title-input',
					type: 'text',
					value: this.title,
				},
			});

			BX.bind(this.item.titleInput, 'click', (event) => {
				event.stopPropagation();
			});

			BX.addCustomEvent(window, 'BX.TileGrid.Grid:resetSelectAllItems', this.cancelRenaming.bind(this));
			BX.addCustomEvent(window, 'BX.TileGrid.Grid:selectItem', this.cancelRenaming.bind(this));

			BX.bind(this.item.titleInput, 'keydown', (event) => {
				if (event.key === 'Escape')
				{
					// cancelRenaming() blurs the input, which triggers the 'blur' handler below
					// and would call runRename() with the new value. Restore the original title
					// first, so runRename()'s early-return (value === this.title) makes it a no-op.
					this.item.titleInput.value = this.title;
					this.cancelRenaming();

					event.preventDefault();
				}

				if (event.key === 'Enter')
				{
					this.cancelRenaming();
					this.runRename();

					event.preventDefault();
				}

				event.stopPropagation();
			});

			BX.bind(this.item.titleInput, 'blur', (event) => {
				this.cancelRenaming();
				this.runRename();
			});

			return this.item.titleInput;
		},

		onRename()
		{
			this.gridTile.resetSelection();
			jsDD.Disable();

			this.item.titleInput.value = this.title;
			BX.addClass(this.item.title, 'disk-folder-list-item-title-rename');
			this.item.titleInput.focus();
			if (this.isFile)
			{
				this.item.titleInput.setSelectionRange(0, this.title.lastIndexOf('.'));
			}
			else
			{
				this.item.titleInput.select();
			}
		},

		cancelRenaming()
		{
			BX.removeClass(this.item.title, 'disk-folder-list-item-title-rename');
			this.item.titleInput.blur();

			jsDD.Enable();
		},

		rename(newName)
		{
			BX.addClass(this.item.titleLink, 'disk-folder-list-item-title-link-renamed');

			this.item.titleLink.addEventListener('animationend', () => {
				BX.removeClass(this.item.titleLink, 'disk-folder-list-item-title-link-renamed');
			});

			this.item.titleLink.textContent = newName;
			this.item.titleLink.setAttribute('title', newName);
			this.title = newName;
			this.rebuildLinkAfterRename(newName);

			jsDD.Enable();
		},

		rebuildLinkAfterRename(name)
		{
			if (this.link)
			{
				if (this.isFile)
				{
					this.link = this.link.slice(0, Math.max(0, this.link.lastIndexOf('/') + 1)) + encodeURIComponent(name);
				}
				else
				{
					this.link = `${this.link.slice(0, Math.max(0, this.link.lastIndexOf('/', this.link.length - 2) + 1)) + encodeURIComponent(name)}/`;
				}

				this.item.titleLink.href = this.link;
				this.actions.forEach(function(action) {
					if (action.id === 'open' && action.href)
					{
						action.href = this.link;
					}
				}, this);
			}

			this.destroyActionsMenu();
		},

		runRename()
		{
			if (this.item.titleInput.value === this.title)
			{
				return;
			}

			const oldTitle = this.title;
			this.rename(this.item.titleInput.value);

			BX.ajax.runAction('disk.api.commonActions.rename', {
				analyticsLabel: 'folder.list',
				data: {
					objectId: this.getId(),
					newName: this.title,
					autoCorrect: true,
				},
			}).then((response) => {
				if (response.data.object.name !== this.title)
				{
					this.rename(response.data.object.name);
				}
			}).catch((response) => {
				BX.Disk.showModalWithStatusAction(response);
				this.rename(oldTitle);
			});
		},

		afterRender()
		{
			if (!this.item.picture)

			
     { return;
			}

			if (this.isVisibleOnFolderList())
			{
				this.appendImageItem();
			}

			BX.bind(this.item.container, 'animationend', BX.proxy(this.appendImageItem, this));

			this.item.picture.onload = function()
			{
				BX.show(this.item.picture);
				BX.hide(this.item.fileType);
			}.bind(this);
		},

		isVisibleOnFolderList()
		{
			const rect = this.layout.container.getBoundingClientRect();
			const rectBody = document.body.getBoundingClientRect();
			const itemHeight = this.layout.container.offsetHeight * 2;

			if (rect.top < 0 || rect.bottom < 0)

			
     { return false;
			}

			return rectBody.height > (rect.top - itemHeight) && rectBody.height >= (rect.bottom - itemHeight);
		},

		getImage()
		{
			const fileExtension = this.getFileExtension(this.title);

			this.item.imageBlock = BX.create('div', {
				attrs: {
					className: 'disk-folder-list-item-image',
				},
				children: [
					this.item.fileType = BX.create('div', {
						attrs: {
							className: `ui-icon ui-icon-file ui-icon-file-${fileExtension}`,
						},
						style: {
							width: this.isFolder ? '85%' : '70%',
						},
						html: '<i></i>',
					}),
					this.item.picture = (this.image ? BX.create('img', {
						attrs: {
							className: 'disk-folder-list-item-image-img',
							// src: this.image
						},
						style: {
							display: 'none',
						},
					}) : null),
				],
			});

			return this.item.imageBlock;
		},

		markAsShared()
		{
			this.isSymlink = true;

			if (this.isFolder)
			{
				this.item.fileType.classList.add(
					this.isMailAttachments ? 'ui-icon-file-folder-mail-shared' : 'ui-icon-file-folder-shared'
				);
			}
			else if (this.item.symlink)
			{
				this.item.symlink.style.display = null;
			}
		},

		unmarkAsShared()
		{
			this.isSymlink = false;

			if (this.isFolder)
			{
				this.item.fileType.classList.remove(
					this.isMailAttachments ? 'ui-icon-file-folder-mail-shared' : 'ui-icon-file-folder-shared'
				);
			}
			else if (this.item.symlink)
			{
				this.item.symlink.style.display = 'none';
			}
		},

		/**
		 *
		 * @returns {string}
		 */
		getFileExtension(fileName)
		{
			let fileExtension = fileName.slice(Math.max(0, fileName.lastIndexOf('.') + 1));

			switch (fileExtension)
			{
				case 'mp4':
				case 'mkv':
				case 'mpeg':
				case 'avi':
				case '3gp':
				case 'flv':
				case 'm4v':
				case 'ogg':
				case 'swf':
				case 'wmv':
					fileExtension = 'mov';
					break;

				case 'txt':
					fileExtension = 'txt';
					break;

				case 'doc':
				case 'docx':
					fileExtension = 'doc';
					break;

				case 'xls':
				case 'xlsx':
					fileExtension = 'xls';
					break;

				case 'php':
					fileExtension = 'php';
					break;

				case 'pdf':
					fileExtension = 'pdf';
					break;

				case 'ppt':
				case 'pptx':
					fileExtension = 'ppt';
					break;

				case 'rar':
					fileExtension = 'rar';
					break;

				case 'zip':
					fileExtension = 'zip';
					break;

				case 'set':
					fileExtension = 'set';
					break;

				case 'mov':
					fileExtension = 'mov';
					break;

				case 'img':
				case 'jpg':
				case 'jpeg':
				case 'gif':
					fileExtension = 'img';
					break;

				case 'flp':
				case 'board':
					fileExtension = 'board';
					break;

				case 'odf':
					fileExtension = 'odf';
					break;

				case 'odt':
					fileExtension = 'odt';
					break;

				case 'ods':
					fileExtension = 'ods';
					break;

				case 'odp':
					fileExtension = 'odp';
					break;

				default:
					fileExtension = 'empty';
			}

			this.isFolder ? fileExtension = 'folder' : null;
			this.isSymlink && this.isFolder ? fileExtension = 'folder-shared' : null;
			this.isFolder && this.isMailAttachments ? fileExtension = 'folder-mail' : null;
			this.isSymlink && this.isFolder && this.isMailAttachments ? fileExtension = 'folder-mail-shared' : null;

			return fileExtension;
		},

		getActionBlock()
		{
			if (!this.item.action)
			{
				this.item.action = BX.create('div', {
					attrs: {
						className: 'disk-folder-list-item-action',
					},
					events: {
						click: function(event) {
							this.showActionsMenu(event, BX.getEventTarget(event));
						}.bind(this),
					},
				});
			}

			return this.item.action;
		},

		getActions()
		{
			return this.actions;
		},

		destroyActionsMenu()
		{
			if (this.actionsMenu)
			{
				this.actionsMenu.destroy();
				this.actionsMenu = null;
			}
		},

		getActionsMenu(target)
		{
			if (this.actionsMenu)
			{
				return this.actionsMenu;
			}

			this.actionsMenu = BX.PopupMenu.create(`-disk-folder-list-item-action-menu${this.getId()}`, target, this.actions, {
				autoHide: true,
				offsetLeft: 20,
				angle: true,
			});

			BX.bind(this.actionsMenu.popupWindow.popupContainer, 'click', (event) => {
				const actionsMenu = this.getActionsMenu();
				if (actionsMenu)
				{
					const target = BX.getEventTarget(event);
					const item = BX.findParent(target, {
						className: 'menu-popup-item',
					}, 10);

					if (!item || !item.dataset.preventCloseContextMenu)
					{
						actionsMenu.close();
					}
				}
			});

			return this.actionsMenu;
		},

		showActionsMenu(event, bindElement)
		{
 			BX.fireEvent(document.body, 'click');

			const actionsMenu = this.getActionsMenu(bindElement);
			actionsMenu.show();

			if (!bindElement)
			{
				actionsMenu.popupWindow.popupContainer.style.top = `${event.pageY}px`;
				actionsMenu.popupWindow.popupContainer.style.left = `${event.pageX - 35}px`;
			}
			else if (bindElement)
			{
				const pos = BX.pos(bindElement);
				pos.forceBindPosition = true;
				actionsMenu.popupWindow.setBindElement(bindElement);
				actionsMenu.popupWindow.adjustPosition(pos);
			}
		},
	};
})();

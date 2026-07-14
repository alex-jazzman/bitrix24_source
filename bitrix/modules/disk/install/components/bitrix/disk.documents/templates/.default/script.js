/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, main_loader, disk_users, main_polyfill_intersectionobserver, disk_externalLink, main_core_events, main_popup, clipboard, ui_dialogs_messagebox, ui_ears, ui_tour, ui_navigationpanel) {
	'use strict';

	let intersectionObserver;
	function observeIntersection(entity, callback) {
		if (!intersectionObserver) {
			intersectionObserver = new IntersectionObserver(function (entries) {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						intersectionObserver.unobserve(entry.target);
						const observedCallback = entry.target.observedCallback;
						delete entry.target.observedCallback;
						setTimeout(observedCallback);
					}
				});
			}, {
				threshold: 0
			});
		}
		entity.observedCallback = callback;
		intersectionObserver.observe(entity);
	}

	class BackendInner {
		static idsForShared = {};
		static idsForExternalLinks = {};
		static sendForInfo = main_core.Runtime.debounce(function () {
			const requestData = {
				'shared': BackendInner.idsForShared,
				'externalLink': BackendInner.idsForExternalLinks
			};
			BackendInner.idsForShared = {};
			BackendInner.idsForExternalLinks = {};
			const request = {};
			for (let action in requestData) {
				if (requestData.hasOwnProperty(action)) {
					for (let id in requestData[action]) {
						if (requestData[action].hasOwnProperty(id)) {
							request[id] = request[id] || [];
							request[id].push(action);
						}
					}
				}
			}
			main_core.ajax.runComponentAction(Backend.component, 'getInfo', {
				mode: 'ajax',
				data: {
					trackedObjectIds: request
				}
			}).then(({
				data
			}) => {
				for (let action in requestData) {
					if (requestData.hasOwnProperty(action)) {
						for (let id in requestData[action]) {
							if (requestData[action].hasOwnProperty(id)) {
								requestData[action][id][0]({
									data: data[id][action]
								});
							}
						}
					}
				}
			}).catch(({
				errors
			}) => {
				for (let action in requestData) {
					if (requestData.hasOwnProperty(action)) {
						for (let id in requestData[action]) {
							if (requestData[action].hasOwnProperty(id)) {
								requestData[action][id][1]({
									errors
								});
							}
						}
					}
				}
			});
		}, 500);
	}
	class Backend {
		static component = 'bitrix:disk.documents';
		static getShared(id) {
			return new Promise((resolve, reject) => {
				BackendInner.idsForShared[id] = [resolve, reject];
				BackendInner.sendForInfo();
			});
		}
		static getExternalLink(id) {
			return new Promise((resolve, reject) => {
				BackendInner.idsForExternalLinks[id] = [resolve, reject];
				BackendInner.sendForInfo();
			});
		}
		static getMenuActions(id, analytics = null) {
			const data = {
				trackedObjectId: id
			};
			if (analytics !== null) {
				data.analytics = analytics;
			}
			return main_core.ajax.runComponentAction(Backend.component, 'getMenuActions', {
				mode: 'ajax',
				data,
				analyticsLabel: Backend.component + '.gridMenuActions'
			});
		}
		static getMenuOpenAction(id) {
			return main_core.ajax.runComponentAction(Backend.component, 'getMenuOpenAction', {
				mode: 'ajax',
				data: {
					trackedObjectId: id
				},
				analyticsLabel: Backend.component + '.gridMenuOpenAction'
			});
		}
		static renameAction(id, newName) {
			return main_core.ajax.runAction('disk.api.trackedObject.rename', {
				data: {
					objectId: id,
					newName: newName
				}
			});
		}
		static copyToMeAction(id) {
			return main_core.ajax.runComponentAction(Backend.component, 'copyToMe', {
				mode: 'ajax',
				data: {
					trackedObjectId: id
				},
				analyticsLabel: Backend.component + '.copyToMe'
			});
		}
	}

	class Sharing {
		constructor(id, node) {
			this.id = id;
			this.node = node;
			this.init();
			this.observe();
		}
		init() {
			this.actionName = 'getShared';
		}
		observe() {
			observeIntersection(this.node, () => {
				this.showLoading();
				Backend[this.actionName](this.id).then(({
					data
				}) => {
					this.hideLoading();
					this.renderData(data);
				}, ({
					errors
				}) => {
					this.hideLoading();
					const errorMessages = [];
					errors.forEach(error => {
						errorMessages.push(error.message);
					});
					this.node.innerHTML = 'Error! ' + errorMessages.join('<br>');
				});
			});
		}
		showLoading() {
			this.loader = this.loader || new main_loader.Loader({
				target: this.node,
				mode: 'inline',
				size: 20
			});
			this.loader.show();
			this.node.dataset.bxLoading = 'Y';
		}
		hideLoading() {
			delete this.node.dataset.bxLoading;
			this.loader.hide();
		}
		renderData(data) {
			this.node.innerHTML = '';
			const res = new disk_users.Users(data, null, {
				placeInGrid: true
			});
			this.node.appendChild(res.getContainer());
		}
	}

	class DocumentsExternalLinkForTrackedObject extends disk_externalLink.ExternalLinkForTrackedObject {
		openSettingsPopup() {
			const supportsSharingAccessPopup = this.data?.supportsSharingAccessPopup === true;
			if (!supportsSharingAccessPopup) {
				return this.constructor.showPopup(this.objectId, this.data);
			}
			return super.openSettingsPopup();
		}
	}
	class ExternalLink extends Sharing {
		init() {
			this.actionName = 'getExternalLink';
		}
		showLoading() {}
		hideLoading() {}
		renderData(data) {
			this.node.innerHTML = '';
			const res = new DocumentsExternalLinkForTrackedObject(this.id, data);
			this.node.appendChild(res.getContainer());
		}
	}

	class CommonGrid {
		/**
		 * @type {BX.TileGrid.Grid|BX.Main.grid}
		 */
		gridInstance = null;
		constructor(options) {
			this.gridInstance = options.gridInstance;
		}
		getId() {
			return this.gridInstance.getId();
		}
		isGrid() {
			return !this.isTile();
		}
		isTile() {
			return BX.TileGrid.Grid && this.gridInstance instanceof BX.TileGrid.Grid;
		}
		getContainer() {
			return this.gridInstance.getContainer();
		}
		fade() {
			if (this.isGrid()) {
				this.gridInstance.tableFade();
			} else {
				this.gridInstance.setFadeContainer();
				this.gridInstance.getLoader();
				this.gridInstance.showLoader();
			}
		}
		unFade() {
			if (this.isGrid()) {
				this.gridInstance.tableUnfade();
			} else {
				this.gridInstance.getLoader().hide();
				this.gridInstance.unSetFadeContainer();
			}
		}
		getActionKey() {
			return 'action_button_' + this.gridInstance.getId();
		}
		getSelectedIds() {
			if (this.isGrid()) {
				return this.gridInstance.getRows().getSelectedIds();
			} else {
				return this.gridInstance.getSelectedItems().map(function (item) {
					return item.getId();
				});
			}
		}
		getIds() {
			if (this.isGrid()) {
				return this.gridInstance.getRows().getBodyChild().map(function (row) {
					return row.getId();
				});
			} else {
				return this.gridInstance.items.map(function (item) {
					return item.id;
				});
			}
		}
		countItems() {
			if (this.isGrid()) {
				return this.gridInstance.getRows().getBodyChild().length;
			} else {
				return this.gridInstance.countItems();
			}
		}
		reload(url, data) {
			data = data || {};
			if (this.isGrid()) {
				var promise = new BX.Promise();
				this.gridInstance.reloadTable("POST", data, function () {
					promise.fulfill();
				}, url);
				return promise;
			} else {
				return this.gridInstance.reload(url, data);
			}
		}
		getActionsMenu(itemId) {
			if (this.isGrid()) {
				return this.gridInstance.getRows().getById(itemId).getActionsMenu();
			} else {
				var item = this.gridInstance.getItem(itemId);
				if (item) {
					return item.getActionsMenu();
				}
			}
		}
		getItemById(id) {
			if (this.isGrid()) {
				return this.gridInstance.getRows().getById(id);
			} else {
				return this.gridInstance.getItem(id);
			}
		}
		scrollTo(id) {
			var contentNode;
			if (this.isGrid()) {
				var row = this.gridInstance.getRows().getById(id);
				if (row && row.node) {
					contentNode = row.node;
				}
			} else {
				this.gridInstance.getItem(id);
				if (row && row.node) {
					contentNode = row.getContainer();
				}
			}
			if (contentNode) {
				new BX.easing({
					duration: 500,
					start: {
						scroll: window.pageYOffset || document.documentElement.scrollTop
					},
					finish: {
						scroll: BX.pos(contentNode).top
					},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step: function (state) {
						window.scrollTo(0, state.scroll);
					}
				}).animate();
			}
		}
		getActionById(id, menuItemId) {
			var item = this.getItemById(id);
			if (item) {
				var actions = item.getActions();
				for (var i = 0; i < actions.length; i++) {
					if (actions[i].id && actions[i].id === menuItemId) {
						return actions[i];
					}
				}
			}
			return null;
		}
		removeItemById(itemId) {
			BX.fireEvent(document.body, 'click');
			if (this.isGrid()) {
				this.gridInstance.removeRow(itemId);
			} else {
				var item = this.gridInstance.getItem(itemId);
				if (item) {
					//todo here we have to remove item from server
					this.gridInstance.removeItem(item);
				}
			}
		}
		selectItemById(itemId) {
			var item;
			if (this.isGrid()) {
				item = this.gridInstance.getRows().getById(itemId);
				if (item) {
					item.select();
				}
			} else {
				item = this.gridInstance.getItem(itemId);
				if (item) {
					this.gridInstance.selectItem(item);
				}
			}
		}
		removeSelected() {
			if (this.isGrid()) {
				this.gridInstance.removeSelected();
			}
		}
		sortByColumn(column) {
			this.gridInstance.sortByColumn(column);
		}
	}

	class Options {
		static gridId = 'diskDocumentsGrid'; // $arParams['GRID_ID']
		static filterId = 'diskDocumentsFilter'; // $arParams['GRID_ID']
		static editableExt = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'xodt'];
		static getGridId() {
			return Options.gridId;
		}
		static getCommonGrid() {
			let gridInstance;
			const gridId = this.getGridId();
			if (main_core.Reflection.getClass('BX.Main.gridManager') && BX.Main.gridManager.getInstanceById(gridId)) {
				gridInstance = BX.Main.gridManager.getInstanceById(gridId);
			} else if (main_core.Reflection.getClass('BX.Main.tileGridManager') && BX.Main.tileGridManager.getInstanceById(gridId)) {
				gridInstance = BX.Main.tileGridManager.getInstanceById(gridId);
			}
			return new CommonGrid({
				gridInstance: gridInstance
			});
		}
		static setGridId(gridId) {
			Options.gridId = gridId;
		}
		static getFilterId() {
			return Options.filterId;
		}
		static getEditableExt() {
			return Options.editableExt;
		}
		static setEditableExt(extensions) {
			Options.editableExt = extensions;
		}
		static setViewList() {
			BX.userOptions.save('disk', 'documents', 'viewMode', 'list');
			BX.userOptions.save('disk', 'documents', 'viewSize', '');
			window.location.reload();
		}
		static setViewSmallTile() {
			BX.userOptions.save('disk', 'documents', 'viewMode', 'tile');
			BX.userOptions.save('disk', 'documents', 'viewSize', 'm');
			window.location.reload();
		}
		static setViewBigTile() {
			BX.userOptions.save('disk', 'documents', 'viewMode', 'tile');
			BX.userOptions.save('disk', 'documents', 'viewSize', 'xl');
			window.location.reload();
		}
	}

	class Toolbar {
		static documentHandlers = [];
		static reloadGridAndFocus(rowId) {
			const commonGrid = Options.getCommonGrid();
			commonGrid.reload();
		}
		static runCreating(documentType, service, nodeToBind, nodeName, analytics = '') {
			analytics = JSON.parse(analytics);
			if (BX.message('disk_restriction')) {
				// this.blockFeatures();
				return;
			}
			if (service === 'l' && BX.Disk.Document.Local.Instance.isEnabled()) {
				BX.Disk.Document.Local.Instance.createFile({
					type: documentType
				}).then(response => {
					this.reloadGridAndFocus(response.object.id);
				});
				return;
			}
			let targetNode = null;
			if (service === 'onlyoffice' && nodeToBind !== null) {
				targetNode = [...nodeToBind.children].find(el => el.textContent.trim() === nodeName);
			}
			const byUnifiedLink = this.documentHandlers.some(handler => handler.supportsUnifiedLink && handler.code === service);
			const localAnalytics = {
				...(analytics || {}),
				c_sub_section: 'new_element'
			};
			const createProcess = new BX.Disk.Document.CreateProcess({
				typeFile: documentType,
				serviceCode: service,
				byUnifiedLink,
				triggerNode: targetNode ?? nodeToBind,
				onAfterSave: response => {
					if (response.status === 'success') {
						this.reloadGridAndFocus(response.object.id);
					}
				},
				onAfterCreateFile: response => {
					if (response.status === 'success') {
						this.reloadGridAndFocus(response.data.id);
					}
				},
				analytics: localAnalytics
			});
			createProcess.start();
		}
		static resolveServiceCode(service) {
			if (!service) {
				service = BX.Disk.getDocumentService();
			}
			if (service) {
				return service;
			}
			if (BX.Disk.isAvailableOnlyOffice()) {
				return 'onlyoffice';
			}
			BX.Disk.InformationPopups.openWindowForSelectDocumentService({});
			return null;
		}
		static createBoard(analyticsElement = null) {
			const newTab = window.open('', '_blank');
			const config = {};
			if (analyticsElement) {
				config.analytics = {
					event: 'create',
					tool: 'boards',
					category: 'boards',
					c_element: analyticsElement
				};
			}
			BX.ajax.runAction('disk.integration.flipchart.createDocument', config).then(response => {
				if (response.status === 'success' && response.data.file) {
					const manager = BX.Main.gridManager || BX.Main.tileGridManager;
					const grid = manager.getById('diskDocumentsGrid')?.instance;
					if (grid) {
						grid.reload();
					}
					if (response.data.viewUrl) {
						newTab.location.href = response.data.viewUrl;
					}
				}
			});
		}
		static createDocx(service, element, nodeName, analytics) {
			const code = this.resolveServiceCode(service);
			if (code) {
				const nodeToBind = this.resolveNodeToBind(element);
				this.runCreating('docx', code, nodeToBind, nodeName, analytics);
			}
		}
		static createXlsx(service, element, nodeName, analytics) {
			const code = this.resolveServiceCode(service);
			if (code) {
				const nodeToBind = this.resolveNodeToBind(element);
				this.runCreating('xlsx', code, nodeToBind, nodeName, analytics);
			}
		}
		static createPptx(service, element, nodeName, analytics) {
			const code = this.resolveServiceCode(service);
			if (code) {
				const nodeToBind = this.resolveNodeToBind(element);
				this.runCreating('pptx', code, nodeToBind, nodeName, analytics);
			}
		}
		static createByDefault(service) {
			console.log('createByDefault:', service);
			console.log('try to upload just for the test');
		}

		/**
		 * Returns a DOM element to bind boost widget
		 * @param element
		 * @returns {*|null}
		 */
		static resolveNodeToBind(element) {
			if (main_core.Type.isElementNode(element))
				// clicked on card button
				{
					return element.querySelector('.disk-documents-control-panel-card-btn') ?? null;
				}
			if (main_core.Type.isElementNode(element?.itemsContainer))
				// clicked on menu item
				{
					return element.itemsContainer;
				}
			return null;
		}
	}

	class Item extends main_core_events.EventEmitter {
		data = {};
		constructor(trackedObjectId, itemData) {
			super();
			this.setEventNamespace('Disk:Documents:');
			this.trackedObjectId = trackedObjectId;
			this.data = Object.assign({}, itemData);
			this.data['className'] = (this.data['className'] || '') + ' disk-folder-list-context-menu-item';
			if (!this.data['text']) {
				this.data['text'] = this.data['id'];
			}
			this.objectId = this.data['objectId'];
			delete this.data['objectId'];
		}
		getData(key) {
			if (key) {
				return this.data[key];
			}
			return this.data;
		}
		showError(errors) {
			console.log('errors: ', errors);
		}
		addPopupMenuItem(popupMenu) {
			this.popupMenuItem = popupMenu.addMenuItem(this.data);
		}
		showLoad() {
			if (this.popupMenuItem) {
				this.loader = this.loader || new main_loader.Loader({
					target: this.popupMenuItem.getContainer(),
					size: 32
				});
				this.loader.show();
			}
		}
		hideLoad() {
			if (this.loader) {
				this.loader.hide();
			}
		}
		static detect(itemData) {
			return true;
		}
	}

	class ItemCopyToMe extends Item {
		constructor(trackedObjectId, itemData) {
			super(trackedObjectId, itemData);
			if (!this.data['onclick']) {
				this.data['onclick'] = this.copyToMe.bind(this);
			}
		}
		copyToMe() {
			Backend.copyToMeAction(this.trackedObjectId).then(response => {
				if (response.status === 'success') {
					const commonGrid = Options.getCommonGrid();
					commonGrid.reload();
				} else if (response.status === 'error') {
					this.showError(response.errors);
				}
			});
		}
		static detect(itemData) {
			return itemData['id'] === 'copyToMe';
		}
	}

	class ItemHistory extends Item {
		constructor(trackedObjectId, itemData) {
			super(trackedObjectId, itemData);
			this.object = {
				id: itemData.dataset.objectId,
				fileHistoryUrl: itemData.dataset.fileHistoryUrl,
				name: itemData.dataset.objectName,
				blockedByFeature: itemData.dataset.blockedByFeature
			};
			this.data.onclick = this.handleClick.bind(this);
		}
		handleClick() {
			this.emit('close');
			if (this.object.blockedByFeature) {
				top.BX.UI.InfoHelper.show('limit_office_version_storage');
				return;
			}
			const fileHistoryUrl = this.object.fileHistoryUrl;
			BX.SidePanel.Instance.open(fileHistoryUrl, {
				cacheable: false,
				allowChangeHistory: false
			});
		}
		static detect(itemData) {
			return itemData.id === 'history';
		}
	}

	class ItemOpen extends Item {
		constructor(objectId, itemData) {
			super(objectId, itemData);
			this.data['dataset'] = this.data['dataset'] || {};
			this.data['dataset']['preventCloseContextMenu'] = true;
			this.data['onclick'] = function () {
				if (this.data['href']) {
					return this.open();
				}
				this.showLoad();
				Backend.getMenuOpenAction(this.objectId).then(({
					data
				}) => {
					this.hideLoad();
					this.data['href'] = data;
					this.open();
				}).catch(({
					errors
				}) => {
					this.hideLoad();
					this.showError(errors);
				});
			}.bind(this);
		}
		open() {
			if (main_core.Type.isStringFilled(this.data['href'])) {
				if (!this.data['target']) {
					BX.SidePanel.Instance.open(this.data['href']);
				}
				this.emit('close');
			} else {
				this.showError([{
					text: 'Empty href'
				}]);
			}
		}
		static detect(itemData) {
			return itemData['id'] === 'open';
		}
	}

	class ItemShareSection extends Item {
		constructor(objectId, itemData) {
			super(objectId, itemData);
			this.data['dataset'] = this.data['dataset'] || {};
			this.data['dataset']['preventCloseContextMenu'] = true;
		}
		static detect(itemData) {
			return itemData['id'] === 'share-section';
		}
	}

	class ItemInternalLink extends Item {
		constructor(trackedObjectId, itemData) {
			super(trackedObjectId, itemData);
			this.data['className'] += ' disk-documents-grid-actions-copy-internal-link';
			this.data['html'] = [this.data.text, '<span class="disk-documents-grid-actions-copy-internal-link-icon">' + '<span class="disk-documents-grid-actions-copy-internal-link-icon-inner">' + '</span>' + '</span>'].join('');
			delete this.data['text'];
			this.data['dataset'] = this.data['dataset'] || {};
			this.data['dataset']['preventCloseContextMenu'] = true;
			this.data['onclick'] = function (event, menuItem) {
				const target = menuItem.getLayout().item;
				target.classList.add('menu-popup-item-accept', 'disk-folder-list-context-menu-item-accept-animate');
				target.style.minWidth = target.offsetWidth + 'px';
				const textNode = target.querySelector('.menu-popup-item-text');
				if (textNode) {
					textNode.textContent = this.data['dataset']['textCopied'];
				}
				BX.clipboard.copy(this.data['dataset']['internalLink']);
			}.bind(this);
		}
		static detect(itemData) {
			return itemData['id'] === 'internalLink';
		}
	}

	class ItemExternalLink extends Item {
		constructor(objectId, itemData) {
			super(objectId, itemData);
			const shouldBlockFeature = itemData['dataset']['shouldBlockFeature'];
			const blocker = itemData['dataset']['blocker'];
			this.data['onclick'] = function () {
				this.emit('close');
				if (shouldBlockFeature && blocker) {
					eval(blocker);
					return;
				}
				disk_externalLink.ExternalLinkForTrackedObject.showPopup(this.trackedObjectId);
			}.bind(this);
		}
		static detect(itemData) {
			return itemData['id'] === 'externalLink';
		}
	}

	class ItemRename extends Item {
		buffExtension = '';
		constructor(trackedObjectId, itemData) {
			super(trackedObjectId, itemData);
			if (!this.data['onclick']) {
				this.data['onclick'] = this.rename.bind(this);
			}
		}
		cutExtension(name) {
			this.buffExtension = '';
			if (name.lastIndexOf('.') > 0) {
				this.buffExtension = name.substr(name.lastIndexOf('.'));
				return name.substr(0, name.lastIndexOf('.'));
			}
			return name;
		}
		restoreExtension(name) {
			name += this.buffExtension;
			this.buffExtension = '';
			return name;
		}
		rename() {
			const grid = BX.Main.gridManager.getInstanceById(Options.getGridId());
			const row = grid.getRows().getById(this.trackedObjectId);
			row.edit();
			const editorContainer = BX.Grid.Utils.getByClass(row.getNode(), 'main-grid-editor-container', true);
			const input = editorContainer.querySelector('input');
			if (input) {
				input.value = this.cutExtension(input.value);
				const onBlur = function (event) {
					onBeforeSend(event);
				}.bind(this);
				const onBeforeSend = event => {
					event.stopPropagation();
					event.preventDefault();
					const fullName = this.restoreExtension(input.value);
					Backend.renameAction(this.trackedObjectId, fullName).then(({
						data: {
							object: {
								name
							}
						}
					}) => {
						if (fullName !== name) {
							row.getNode().querySelector('#disk_obj_' + this.trackedObjectId).innerHTML = main_core.Text.encode(name);
							row.editData['NAME'] = name;
						}
					});
					input.removeEventListener('blur', onBlur);
					row.getNode().querySelector('#disk_obj_' + this.trackedObjectId).innerHTML = main_core.Text.encode(fullName);
					row.editData['NAME'] = fullName;
					row.editCancel();
				};
				input.addEventListener('keydown', function (event) {
					if (event.key === 'Enter') {
						onBeforeSend(event);
					} else if (event.key === 'Escape') {
						input.removeEventListener('blur', onBlur);
						row.editCancel();
					}
				}.bind(this));
				input.addEventListener('blur', onBlur);
				BX.focus(input);
			}
		}
		static detect(itemData) {
			return itemData['id'] === 'rename';
		}
	}

	class ItemSharing extends Item {
		constructor(trackedObjectId, itemData) {
			super(trackedObjectId, itemData);
			const dataset = itemData.dataset || {};
			const objectId = dataset.objectId;
			const objectName = dataset.objectName;
			const mode = dataset.type;
			const supportsSharingAccessPopup = dataset.supportsSharingAccessPopup === 'true';
			this.data['onclick'] = () => {
				this.emit('close');
				if (!supportsSharingAccessPopup) {
					const legacyMethodByMode = {
						'without-edit': 'showSharingDetailWithoutEdit',
						'with-change-rights': 'showSharingDetailWithChangeRights',
						'with-sharing': 'showSharingDetailWithSharing'
					};
					const legacyMethod = legacyMethodByMode[mode] ?? 'showSharingDetailWithChangeRights';
					BX.Runtime.loadExtension('disk.sharing-legacy-popup').then(({
						LegacyPopup
					}) => {
						const popup = new LegacyPopup();
						popup[legacyMethod]({
							object: {
								id: Number(objectId),
								name: objectName,
								isFolder: false
							}
						});
					});
					return;
				}
				BX.Runtime.loadExtension('disk.sharing-access-popup').then(({
					SharingPopupDialog
				}) => {
					const popup = new SharingPopupDialog();
					popup.open({
						objectId: Number(objectId)
					});
				});
			};
		}
		static detect(itemData) {
			return itemData['id'] === 'sharing';
		}
	}

	class ItemDelete extends Item {
		constructor(trackedObjectId, itemData) {
			super(trackedObjectId, itemData);
			this.object = {
				id: itemData['dataset']['objectId'],
				name: itemData['dataset']['objectName']
			};
			this.data['onclick'] = this.handleClick.bind(this);
		}
		handleClick() {
			this.emit('close');
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('DISK_DOCUMENTS_ACT_DELETE_TITLE'),
				message: main_core.Loc.getMessage('DISK_DOCUMENTS_ACT_DELETE_MESSAGE', {
					'#NAME#': this.object.name
				}),
				modal: true,
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('DISK_DOCUMENTS_ACT_DELETE_OK_BUTTON'),
				onOk: this.handleClickDelete.bind(this)
			});
		}
		handleClickDelete() {
			main_core.ajax.runAction('disk.api.commonActions.markDeleted', {
				analyticsLabel: 'folder.list.dd',
				data: {
					objectId: this.object.id
				}
			}).then(response => {
				if (response.status === 'success') {
					const commonGrid = Options.getCommonGrid();
					commonGrid.removeItemById(this.trackedObjectId);
				}
			});
			return true;
		}
		static detect(itemData) {
			return itemData['id'] === 'delete';
		}
	}

	const itemMappings = [ItemOpen, ItemShareSection, ItemSharing, ItemInternalLink, ItemExternalLink, ItemHistory, ItemRename, ItemDelete, ItemCopyToMe];
	function getMenuItem(trackedObjectId, itemData) {
		let itemClassName = Item;
		itemMappings.forEach(itemClass => {
			if (itemClass.detect(itemData)) {
				itemClassName = itemClass;
			}
		});
		return new itemClassName(trackedObjectId, itemData);
	}

	class List {
		#analytics;
		constructor(analytics = null) {
			this.#analytics = analytics;
			this.addReloadGrid();
			this.addMenuActionLoader();
			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('Disk.OnlyOffice:onSaved', this.handleDocumentSaved.bind(this));
		}
		handleDocumentSaved(event) {
			const [object, documentSession] = event.getCompatData();
			const grid = BX.Main.gridManager.getInstanceById(Options.getGridId());
			const objectNode = grid.getBody().querySelector(`span[data-object-id="${object.id}"]`);
			if (!objectNode) {
				return;
			}
			const row = objectNode.closest('.main-grid-row');
			if (!row || !row.dataset.id) {
				return;
			}
			const rowId = row.dataset.id;
			grid.updateRow(rowId, null, null, () => {
				const rowNode = grid.getRows().getById(rowId).getNode();
				if (!rowNode) {
					return;
				}
				main_core.Dom.addClass(rowNode, 'main-grid-row-checked');
				setInterval(() => {
					main_core.Dom.removeClass(rowNode, 'main-grid-row-checked');
				}, 8000);
			});
		}
		addReloadGrid() {
			BX.addCustomEvent('onPopupFileUploadClose', () => {
				BX.Main.gridManager.getInstanceById(Options.getGridId()).reload();
			});
		}
		addMenuActionLoader() {
			main_core_events.EventEmitter.subscribe('onPopupFirstShow', function ({
				compatData: [popup]
			}) {
				if (popup.uniquePopupId.indexOf('menu-popup-main-grid-actions-menu-') !== 0) {
					return;
				}
				const objectId = popup.uniquePopupId.replace(/^menu-popup-main-grid-actions-menu-/, '');
				popup.getContentContainer().classList.add('disk-documents-animate');
				popup.getContentContainer().style.height = 80 + 'px';
				Backend.getMenuActions(objectId, this.#analytics).then(function ({
					data
				}) {
					const row = BX.Main.gridManager.getInstanceById(Options.getGridId()).getRows().getById(objectId);
					const menu = row.getActionsMenu();
					row.actions = [];
					const prepareActionMenu = (item, index, ar) => {
						if (item['items']) {
							item['items'].forEach(prepareActionMenu);
						}
						const menuItem = getMenuItem(objectId, item);
						menuItem.subscribe('close', () => {
							row.closeActionsMenu();
						});
						if (ar === data) {
							menuItem.addPopupMenuItem(menu);
							row.actions.push(menuItem.getData());
						} else {
							ar[index] = menuItem.getData();
						}
					};
					setTimeout(function () {
						popup.getContentContainer().style.height = data.length * 36 + 16 + 'px';
					});
					popup.getContentContainer().addEventListener('transitionend', () => {
						popup.getContentContainer().classList.remove('disk-documents-animate');
						popup.getContentContainer().style.height = '';
					});
					data.forEach(prepareActionMenu);
					if (menu) {
						menu.removeMenuItem('loader');
					}
				}.bind(this)).catch(function ({
					errors
				}) {
					//Hide Loader and show errors
					console.log(errors);
				}.bind(this));
			}.bind(this));
		}
	}

	class Tile {
		#analytics;
		constructor(analytics = null) {
			this.#analytics = analytics;
			this.addReloadGrid();
			this.addMenuActionLoader();
			this.addFilterSequence();
		}
		addFilterSequence() {
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', function ({
				compatData: [filterId, data, filter, promise, params]
			}) {
				if (filterId === Options.getFilterId()) {
					promise.then(function () {
						BX.Main.tileGridManager.getInstanceById(Options.getGridId()).reload();
					}.bind(this));
				}
			});
		}
		addReloadGrid() {
			BX.addCustomEvent('onPopupFileUploadClose', () => {
				BX.Main.tileGridManager.getInstanceById(Options.getGridId()).reload();
			});
		}
		addMenuActionLoader() {
			main_core_events.EventEmitter.subscribe('Disk:Documents:TileGrid:MenuAction:FirstShow', function ({
				compatData: [row, objectId, menuPopup]
			}) {
				Backend.getMenuActions(objectId, this.#analytics).then(function ({
					data
				}) {
					const menu = menuPopup;
					row.actions = [];
					const prepareActionMenu = (item, index, ar) => {
						if (item['items']) {
							item['items'].forEach(prepareActionMenu);
						}
						if (item['id'] === 'rename') {
							item['onclick'] = row.onRename.bind(row);
						}
						const menuItem = getMenuItem(objectId, item);
						menuItem.subscribe('close', () => {
							menu.close();
						});
						if (ar === data) {
							menuItem.addPopupMenuItem(menu);
							row.actions.push(menuItem.getData());
						} else {
							ar[index] = menuItem.getData();
						}
					};
					data.forEach(prepareActionMenu);
					if (menu) {
						menu.removeMenuItem('loader');
					}
				}.bind(this)).catch(function ({
					errors
				}) {
					//Hide Loader and show errors
					console.log(errors);
				}.bind(this));
			}.bind(this));
		}
		static generateEmptyBlock() {
			return main_core.Tag.render`
		<div class="disk-folder-list-no-data-inner">
			<div class="disk-folder-list-no-data-inner-message">
				${main_core.Loc.getMessage('DISK_DOCUMENTS_GRID_TILE_EMPTY_BLOCK_TITLE')}
			</div>
			<div class="disk-folder-list-no-data-inner-variable">
				<div class="disk-folder-list-no-data-inner-create-file" onmouseover="BX.onCustomEvent(window, 'onDiskUploadPopupShow', [this]);">
					${main_core.Loc.getMessage('DISK_DOCUMENTS_GRID_TILE_EMPTY_BLOCK_UPLOAD')}</div>
			</div>
		</div>`;
		}
	}

	class BoardsGuide {
		target = null;
		targetSpotlight = null;
		guide = null;
		constructor(options) {
			this.target = document.querySelector(options.targetSelector);
			this.targetSpotlight = document.querySelector(options.spotlightSelector);
			this.isBoardsPage = options.isBoardsPage;
			if (this.#checkParams()) {
				this.guide = this.#createGuide(options.id);
			} else {
				console.error('Unable to create guide');
			}
		}
		start() {
			if (this.guide === null) {
				console.error('Unable to start guide');
				return;
			}
			setTimeout(() => {
				this.guide.scrollToTarget(this.target);
				this.guide.start();
			}, 1000);
		}
		#checkParams() {
			return this.target !== null && this.targetSpotlight !== null;
		}
		#createGuide(id) {
			const spotlight = this.#createSpotlight();
			const guide = new ui_tour.Guide({
				id,
				simpleMode: true,
				overlay: false,
				onEvents: true,
				autoSave: true,
				steps: [{
					target: this.target,
					title: this.#getTitle(),
					text: this.#getText(),
					position: 'bottom',
					condition: {
						color: 'primary',
						bottom: false,
						top: true
					}
				}],
				events: {
					onStart: () => {
						spotlight.show();
					},
					onFinish: () => {
						spotlight.close();
					}
				}
			});
			const guidePopup = guide.getPopup();
			guidePopup.setWidth(380);
			guidePopup.setAngle({
				offset: this.target.offsetWidth / 2 - guidePopup.contentContainer.offsetWidth / 2
			});
			return guide;
		}
		#createSpotlight() {
			const spotLight = new BX.SpotLight({
				targetElement: this.targetSpotlight,
				targetVertex: 'middle-center',
				lightMode: true
			});
			spotLight.getTargetContainer().style.pointerEvents = 'none';
			return spotLight;
		}
		#getTitle() {
			// noinspection JSAnnotator
			return this.isBoardsPage ? main_core.Loc.getMessage('DISK_BOARD_TOUR_TITLE') : main_core.Loc.getMessage('DISK_DOCUMENTS_TOUR_TITLE');
		}
		#getText() {
			// noinspection JSAnnotator
			return this.isBoardsPage ? main_core.Loc.getMessage('DISK_BOARD_TOUR_DESCRIPTION') : main_core.Loc.getMessage('DISK_DOCUMENTS_TOUR_DESCRIPTION');
		}
	}

	class Switcher {
		target = null;
		constructor(options) {
			this.target = document.getElementById(options.targetId);
			this.activeButtonId = options.activeButtonId || '';
		}
		init() {
			if (main_core.Type.isDomNode(this.target)) {
				new ui_navigationpanel.NavigationPanel({
					target: this.target,
					items: [{
						title: main_core.Loc.getMessage('DISK_DOCUMENTS_GRID_VIEW_LIST'),
						active: this.activeButtonId === 'list',
						events: {
							click: Options.setViewList
						}
					}, {
						title: main_core.Loc.getMessage('DISK_DOCUMENTS_GRID_VIEW_SMALL_TILE'),
						active: this.activeButtonId === 'smallTile',
						events: {
							click: Options.setViewSmallTile
						}
					}, {
						title: main_core.Loc.getMessage('DISK_DOCUMENTS_GRID_VIEW_TILE'),
						active: this.activeButtonId === 'tile',
						events: {
							click: Options.setViewBigTile
						}
					}]
				}).init();
			}
		}
	}

	function showShared(objectId, node) {
		new Sharing(objectId, node);
	}
	function showExternalLink(objectId, node) {
		new ExternalLink(objectId, node);
	}
	const TileGridEmptyBlockGenerator = Tile.generateEmptyBlock;

	//Template things
	BX.ready(() => {
		const analytics = window.BX_ANALYTICS || null;
		if (BX.Main.gridManager && BX.Main.gridManager.getInstanceById(Options.getGridId())) {
			new List(analytics);
		} else if (BX.Main.tileGridManager && BX.Main.tileGridManager.getInstanceById(Options.getGridId())) {
			new Tile(analytics);
		} else {
			main_core_events.EventEmitter.subscribeOnce(main_core_events.EventEmitter.GLOBAL_TARGET, 'Grid::ready', ({
				compatData: [instance]
			}) => {
				if (instance && instance.getId() === Options.getGridId()) {
					new List(analytics);
				}
			});
			main_core_events.EventEmitter.subscribeOnce(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.TileGrid.Grid:initialized', ({
				compatData: [instance]
			}) => {
				if (instance && instance.getId() === Options.getGridId()) {
					new Tile(analytics);
				}
			});
		}
		if (document.querySelector('#disk-documents-control-panel')) {
			const ears = new ui_ears.Ears({
				container: document.querySelector('#disk-documents-control-panel'),
				noScrollbar: false,
				className: 'disk-documents-ears'
			});
			ears.init();
		}
		const func = (id, uploader) => {
			uploader.limits["uploadFileExt"] = Options.getEditableExt().join(',');
			uploader.limits["uploadFile"] = '.' + Options.getEditableExt().join(',.');
			if (uploader.fileInput) {
				uploader.fileInput.accept = uploader.limits["uploadFile"];
			}
		};
		if (BX.UploaderManager && BX.UploaderManager.getById('DiskDocuments')) {
			func('DiskDocuments', BX.UploaderManager.getById('DiskDocuments'));
		} else {
			const listener = ({
				compatData: [id, uploader]
			}) => {
				setTimeout(() => {
					func(id, uploader);
				}, 200);
				main_core_events.EventEmitter.unsubscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'onUploaderIsInited', listener);
			};
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'onUploaderIsInited', listener);
		}
		if (window.location.search) {
			const searchParams = new URLSearchParams(window.location.search);
			const newSearchParams = new URLSearchParams();
			searchParams.delete('c_section');
			for (const param of searchParams) {
				if (param[0].startsWith('st[')) continue;
				newSearchParams.append(param[0], param[1]);
			}
			let newState = null;
			if (newSearchParams.size > 0) {
				newState = `?${newSearchParams.toString()}`;
			} else {
				newState = window.location.pathname;
			}
			window.history.replaceState(null, '', newState);
		}
	});

	exports.Backend = Backend;
	exports.BoardsGuide = BoardsGuide;
	exports.GridSwitcher = Switcher;
	exports.Options = Options;
	exports.TileGridEmptyBlockGenerator = TileGridEmptyBlockGenerator;
	exports.Toolbar = Toolbar;
	exports.showExternalLink = showExternalLink;
	exports.showShared = showShared;

})(this.BX.Disk.Documents = this.BX.Disk.Documents || {}, BX, BX, BX.Disk, BX, BX.Disk, BX.Event, BX.Main, BX, BX.UI.Dialogs, BX.UI, BX.UI.Tour, BX.UI);
//# sourceMappingURL=script.js.map

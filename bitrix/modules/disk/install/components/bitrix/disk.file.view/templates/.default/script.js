BX.namespace("BX.Disk");
BX.Disk.FileViewClass = (function ()
{
	var historyTabsIsLoaded = false;
	var bpTabsIsLoaded = false;

	var FileViewClass = function (parameters)
	{
		this.componentName = parameters.componentName;
		this.surfaceId = parameters.surfaceId;
		this.signedParameters = parameters.signedParameters;

		this.selectorDialogId = parameters.selectorDialogId;
		//this.grid = parameters.grid;
		this.object = parameters.object || {};
		this.uf = parameters.uf || {};
		this.isViewByUnifiedLink = parameters.isViewByUnifiedLink || false;
		this.canDelete = !!parameters.canDelete;

		this.layout = parameters.layout;
		this.urls = parameters.urls;

		if (parameters.externalLinkInfo)
		{
			this.buildExternalLinkByState(parameters.externalLinkInfo);
		}

		this.gridId = parameters.gridId;
		this.grid = this.gridId? BX.Main.gridManager.getById(this.gridId) : null;

		this.ajaxUrl = '/bitrix/components/bitrix/disk.file.view/ajax.php';
		this.ajaxCurrentPageUrl = document.location.href;

		this.selectorDialog = null;
		this.selectorOpenGeneration = 0;
		// the recipients of this surface by their access code: the marks of the dialog are built
		// from them, and the deselect of a recipient is addressed to its own model
		this.sharingItems = {};
		this.sharingAccessPopup = null;
		this.sharingAccessPopupOpenGeneration = 0;
		// both layers of this surface live in the body, outside the slider it was opened in, and
		// have to go away with it: the slider is subscribed to once, for the two of them
		this.slider = null;
		this.sliderCloseHandler = null;
		this.sharingMembersChangedHandler = null;

		if(!parameters.withoutEventBinding)
			this.setEvents();

		if (BX.DiskUpload && BX.DiskUpload.getObj)
		{
			this.updateFileUploadUls(BX.DiskUpload.getObj('FolderList'));
		}

		this.render();

		this.workWithLocationHash();

		BX.ajax.runAction('disk.api.file.showSharingEntities', {
			analyticsLabel: 'file.view',
			data: {
				fileId: this.object.id
			}
		}).then(function (response) {

			if (BX.type.isArray(response.data))
			{
				response.data.forEach(function (item) {
					var sharingItem = new BX.Disk.Model.SharingItem({
						surfaceId: this.surfaceId,
						getDialog: this.getSelectorDialog.bind(this),
						onForgetSharingItem: this.forgetSharingItem.bind(this),
						state: {
							entity: item.entity,
							sharing: item.sharing,
							object: {
								id: this.object.id
							}
						}
					});

					sharingItem.render();
					this.registerSharingItem(sharingItem);
					this.appendSharingItem(sharingItem);
				}.bind(this));
			}
		}.bind(this));

	};

	FileViewClass.prototype.buildExternalLinkByState = function (state)
	{
		this.externalLink = {
			container: this.createExternalLinkPopupControl('disk-detail-sidebar-link-settings'),
			render: function () {},
			getContainer: function ()
			{
				return this.container;
			},
			adjustHeight: function () {},
		};
	};

	FileViewClass.prototype.createExternalLinkPopupControl = function(className)
	{
		const link = BX.create('div', {
			props: {
				className: className,
			},
			attrs: {
				'data-testid': 'disk-detail-external-link',
			},
			text: BX.message('DISK_FILE_VIEW_ACCESS_BY_LINK'),
		});

		BX.bind(link, 'click', this.openExternalLinkPopup.bind(this));

		return link;
	};

	FileViewClass.prototype.openExternalLinkPopup = function()
	{
		var openGeneration = ++this.sharingAccessPopupOpenGeneration;
		this.bindToCurrentSlider();

		BX.Runtime.loadExtension('disk.sharing-access-popup').then(function(exports) {
			if (openGeneration !== this.sharingAccessPopupOpenGeneration)
			{
				return;
			}

			const popup = this.sharingAccessPopup || new exports.SharingPopupDialog();
			this.sharingAccessPopup = popup;

			popup.open({
				objectId: this.object.id,
				uniqueCode:
					BX.type.isStringFilled(this.object.uniqueCode)
						? this.object.uniqueCode
						: null
				,
				onAfterHide: this.onSharingAccessPopupHide.bind(this, popup),
			});
		}.bind(this));
	};

	// One subscription serves both layers of this surface - the window of access settings and the
	// dialog of recipients. It is put up when the surface starts and again when a layer opens: a
	// surface built before SidePanel knew its slider would otherwise stay unbound.
	FileViewClass.prototype.bindToCurrentSlider = function()
	{
		var eventEmitter = BX.Event && BX.Event.EventEmitter ? BX.Event.EventEmitter : null;
		var slider = BX.SidePanel && BX.SidePanel.Instance
			? BX.SidePanel.Instance.getSliderByWindow(window)
			: null
		;

		if (!eventEmitter || !slider || this.slider === slider)
		{
			return;
		}

		this.unbindFromCurrentSlider();

		this.slider = slider;
		this.sliderCloseHandler = this.onCurrentSliderClose.bind(this);
		eventEmitter.subscribe(
			slider,
			'SidePanel.Slider:onClose',
			this.sliderCloseHandler,
		);
	};

	FileViewClass.prototype.unbindFromCurrentSlider = function()
	{
		if (!this.slider || !this.sliderCloseHandler)
		{
			return;
		}

		var eventEmitter = BX.Event && BX.Event.EventEmitter ? BX.Event.EventEmitter : null;
		if (eventEmitter)
		{
			eventEmitter.unsubscribe(
				this.slider,
				'SidePanel.Slider:onClose',
				this.sliderCloseHandler,
			);
		}

		this.slider = null;
		this.sliderCloseHandler = null;
	};

	// the slider removes its own markup, so only the state kept outside it is released here
	FileViewClass.prototype.onCurrentSliderClose = function()
	{
		this.closeSharingAccessPopup();
		this.destroySelectorDialog();
		this.unsubscribeFromSharingMembersChanged();
		this.unbindFromCurrentSlider();
	};

	FileViewClass.prototype.closeSharingAccessPopup = function()
	{
		this.sharingAccessPopupOpenGeneration++;

		const popup = this.sharingAccessPopup;
		this.sharingAccessPopup = null;

		if (popup)
		{
			popup.close();
		}
	};

	FileViewClass.prototype.onSharingAccessPopupHide = function(popup)
	{
		if (this.sharingAccessPopup === popup)
		{
			this.sharingAccessPopup = null;
		}
	};

	FileViewClass.prototype.setUrlToAjaxCurrentPage = function (url)
	{
		this.ajaxCurrentPageUrl = url;
	};

	FileViewClass.prototype.getUrlToAjaxCurrentPage = function ()
	{
		return this.ajaxCurrentPageUrl.replace(document.location.hash, '');
	};

	FileViewClass.prototype.render = function ()
	{
		if (this.externalLink && this.layout.externalLink && this.layout.externalLink.parentNode)
		{
			// the mounting point leaves the document with the control taking its place: a panel
			// opened later looks its own point up globally and must not find the one of this panel
			this.layout.externalLink.parentNode.replaceChild(this.externalLink.getContainer(), this.layout.externalLink);
		}
	};

	// role="button" carries no native activation, so the keys are served here: the click handler
	// of the node is the one thing that has to run, whichever of the two events brought us in
	FileViewClass.prototype.bindKeyboardActivation = function (node)
	{
		if (!node)
		{
			return;
		}

		BX.bind(node, 'keydown', function (event) {
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				node.click();
			}
		});
	};

	FileViewClass.prototype.setEvents = function ()
	{
		this.bindKeyboardActivation(this.layout.copyInternalLinkButton);
		this.bindKeyboardActivation(this.layout.addSharingButton);
		this.bindKeyboardActivation(this.layout.editUf);
		this.bindKeyboardActivation(this.layout.historyButton);
		this.bindKeyboardActivation(this.layout.moreActionsButton);
		if (this.layout.copyInternalLinkButton && this.layout.internalLinkInput)
		{
			var layout = this.layout;
			BX.clipboard.bindCopyClick(layout.copyInternalLinkButton, {
				// the field is rewritten when the link changes, so the value is read on copy
				text: function () {
					return layout.internalLinkInput.value;
				},
				showButtonIfNotSupported: true,
				// the confirmation balloon hides itself in a moment: it must not hold the focus
				popup: {
					hideTimeout: 2200,
					offsetLeft: -10,
					focusTrap: false
				}
			});
		}
		if (this.layout.deleteButton)
		{
			BX.bind(this.layout.deleteButton, 'click', this.openDeleteConfirm.bind(this));
		}
		if (this.layout.restoreButton)
		{
			BX.bind(this.layout.restoreButton, 'click', this.openConfirmRestoreFromTrash.bind(this));
		}
		if (this.layout.historyButton)
		{
			BX.bind(this.layout.historyButton, 'click', this.openFileHistory.bind(this));
		}
		if (this.layout.addSharingButton)
		{
			BX.bind(this.layout.addSharingButton, 'click', this.openSelector.bind(this));
		}
		if (this.layout.editUf)
		{
			BX.bind(this.layout.editUf, 'click', this.editUf.bind(this));
		}
		if (this.layout.moreActionsButton)
		{
			BX.bind(this.layout.moreActionsButton, 'click', this.openFileActions.bind(this));
		}
		BX.bind(window, 'popstate', this.onPopState.bind(this));

		BX.addCustomEvent("onIframeElementLoadDataToView", BX.proxy(this.onIframeElementLoadDataToView, this));
		BX.addCustomEvent("onIframeElementConverted", BX.proxy(this.onIframeElementConverted, this));
		BX.addCustomEvent("onBeforeElementShow", BX.proxy(this.onBeforeElementShow, this));
		BX.addCustomEvent('SidePanel.Slider:onMessage', this.onSliderMessage.bind(this));
		BX.addCustomEvent("onPopupFileUploadClose", this.onPopupFileUploadClose.bind(this));
		BX.addCustomEvent(window, 'onDiskUploadAgentInitialized', this.onDiskUploadAgentInitialized.bind(this));

		this.bindToCurrentSlider();
		this.subscribeToSharingMembersChanged();

		if(!!this.uf)
		{
			BX.bind(this.uf.editButton, 'click', BX.delegate(this.onClickEditUfButton, this));
		}
	};

	FileViewClass.prototype.onDiskUploadAgentInitialized = function (fileUpload)
	{
		this.updateFileUploadUls(fileUpload);
	};

	FileViewClass.prototype.updateFileUploadUls = function (fileUpload)
	{
		if (!this.isViewByUnifiedLink || !BX.type.isStringFilled(this.object.uls) || !fileUpload)
		{
			return;
		}

		fileUpload.updateUls(this.object.uls);
	};

	FileViewClass.prototype.onSliderMessage = function(event)
	{
		var eventData = event.getData();
		if (
			event.getEventId() === 'Disk.File:onRestoredFromVersion' ||
			event.getEventId() === 'Disk.Version:onDeleted' ||
			event.getEventId() === 'Disk.OnlyOffice:onSaved'
		)
		{
			window.location.reload();
		}
		if (event.getEventId() === 'Disk.File:onNewVersionUploaded')
		{
			if (event.getData().object.id == this.object.id)
			{
				window.location.reload();
			}
		}
		if (event.getEventId() === 'Disk.File.Uf:onUpdated')
		{
			this.reloadUf();
		}
	};

	FileViewClass.prototype.onPopupFileUploadClose = function (diskUpload, fileId)
	{
		if (fileId == this.object.id)
		{
			document.location.reload();
		}
	};

	FileViewClass.prototype.onBeforeElementShow = function(viewer, element, status)
	{
		if(element.hasOwnProperty('image') || !BX.message('disk_restriction'))
		{
			return;
		}
		status.prevent = true;

		BX.PopupWindowManager.create('bx-disk-business-tools-info', null, {
			content: BX('bx-bitrix24-business-tools-info'),
			closeIcon: true,
			onPopupClose: function ()
			{
				this.destroy();
			},
			autoHide: true,
			zIndex: 11000
		}).show();
	};

	FileViewClass.prototype.onIframeElementConverted = function(element, newName, oldName)
	{
		this.setUrlToAjaxCurrentPage(
			this.ajaxCurrentPageUrl.replace(encodeURIComponent(oldName), encodeURIComponent(newName))
		);
	};

	FileViewClass.prototype.onIframeElementLoadDataToView = function(element, responseData)
	{
		if(responseData && responseData.status === "restriction" && BX('bx-bitrix24-business-tools-info'))
		{
			setTimeout(function ()
			{
				if (BX.CViewer && BX.CViewer.objNowInShow) {
					if(element.currentModalWindow)
					{
						element.currentModalWindow.close();
					}
					BX.CViewer.objNowInShow.close();
				}

			}, 100);
			BX.PopupWindowManager.create('bx-disk-business-tools-info', null, {
				content: BX('bx-bitrix24-business-tools-info'),
				closeIcon: true,
				onPopupClose: function ()
				{
					this.destroy();
				},
				autoHide: true,
				zIndex: 11000
			}).show();
		}

	};

	FileViewClass.prototype.onClickEditUfButton = function(e)
	{
		BX.PreventDefault(e);

		BX.Disk.ajax({
			url: BX.Disk.addToLinkParam(document.location.href.replace(document.location.hash, ''), 'action', 'editUserField'),
			method: 'POST',
			dataType: 'html',
			data: {},
			onsuccess: BX.delegate(function (data)
			{
				var showContentNode = BX.findChild(this.uf.contentContainer, {className: 'bx-disk-uf-show-content'});
				var editContentNode = BX.findChild(this.uf.contentContainer, {className: 'bx-disk-uf-edit-content'});
				if(showContentNode)
				{
					BX.hide(showContentNode);
				}
				BX.adjust(editContentNode, {html: data});
				//BX.remove(loader);
			}, this)
		});
	};

	FileViewClass.prototype.openConfirmRestoreFromTrash = function ()
	{
		var name = this.object.name;
		var objectId = this.object.id;
		var messageDescription = BX.message('DISK_FILE_TRASH_RESTORE_FILE_CONFIRM_1');
		var self = this;

		var buttons = [
			new BX.PopupWindowButton({
				text: BX.message('DISK_FILE_VIEW_FILE_RESTORE'),
				className: "popup-window-button-accept",
				events: {
					click: function (e) {
						this.addClassName('popup-window-button-wait');

						let restoreAction = 'disk.api.file.restore';

						let restoreData = {
							fileId: objectId,
						};

						if (self.isViewByUnifiedLink && BX.type.isStringFilled(self.object.uniqueCode))
						{
							restoreAction = 'disk.api.unifiedlinkactions.restore';

							restoreData = {
								uniqueCode: self.object.uniqueCode,
							};
						}

						BX.ajax.runAction(restoreAction, {
							analyticsLabel: 'file.view',
							data: restoreData,
						}).then(function (response) {
							BX.PopupWindowManager.getCurrentPopup().close();

							var sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
							if (sliderByWindow)
							{
								sliderByWindow.close();
								BX.SidePanel.Instance.postMessageAll(window, 'Disk.File:onRestore', {
									objectId: objectId
								});
							}

							const restoredObjectId =
								response.data.file && response.data.file.id
									? response.data.file.id
									: response.data.object && response.data.object.id
							;

							if (restoredObjectId)
							{
								const reloadUrlParams = {};
								const uls = response.data.object?.uls;

								if (BX.type.isStringFilled(uls))
								{
									reloadUrlParams._uls = uls;
								}

								document.location.href = BX.Disk.getUrlToShowObjectInGrid(
									restoredObjectId,
									reloadUrlParams,
								);
							}
						});
					}
				}
			}),
			new BX.PopupWindowButton({
				text: BX.message('DISK_FILE_VIEW_VERSION_CANCEL_BUTTON'),
				events: {
					click: function (e){
						BX.PopupWindowManager.getCurrentPopup().close();
					}
				}
			})
		];

		BX.Disk.modalWindow({
			modalId: 'bx-link-unlink-confirm',
			title: BX.message('DISK_FILE_TRASHCAN_TRASH_RESTORE_TITLE'),
			contentClassName: 'tac',
			contentStyle: {
				paddingTop: '70px',
				paddingBottom: '70px'
			},
			content: messageDescription.replace('#NAME#', name),
			buttons: buttons
		});
	};

	FileViewClass.prototype.openConfirmRestore = function (parameters)
	{
		var name = parameters.object.name;
		var objectId = parameters.object.id;
		var versionId = parameters.version.id;
		var messageDescription = BX.message('DISK_FILE_VIEW_VERSION_RESTORE_CONFIRM_1');
		var buttons = [
			new BX.PopupWindowButton({
				text: BX.message('DISK_FILE_VIEW_VERSION_RESTORE_BUTTON'),
				className: "popup-window-button-accept",
				events: {
					click: BX.delegate(function (e) {
						BX.PopupWindowManager.getCurrentPopup().close();
						BX.PreventDefault(e);

						BX.Disk.ajax({
							method: 'POST',
							dataType: 'json',
							url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'restoreFromVersion'),
							data: {
								objectId: objectId,
								versionId: versionId
							},
							onsuccess: BX.delegate(function (data) {
								if (!data) {
									return;
								}
								this.grid.instance.reload();
								BX.Disk.showModalWithStatusAction(data);
							}, this)
						});

						return false;
					}, this)
				}
			}),
			new BX.PopupWindowButton({
				text: BX.message('DISK_FILE_VIEW_VERSION_CANCEL_BUTTON'),
				events: {
					click: function (e) {
						BX.PopupWindowManager.getCurrentPopup().close();
						BX.PreventDefault(e);
						return false;
					}
				}
			})
		];

		BX.Disk.modalWindow({
			modalId: 'bx-link-unlink-confirm',
			title: BX.message('DISK_FILE_VIEW_VERSION_RESTORE_TITLE'),
			contentClassName: 'tac',
			contentStyle: {
				paddingTop: '70px',
				paddingBottom: '70px'
			},
			content: messageDescription.replace('#NAME#', name),
			buttons: buttons
		});
	};

	FileViewClass.prototype.openDeleteConfirm = function ()
	{
		var name = this.object.name;
		var objectId = this.object.id;
		var canMarkDeleted = !this.object.isDeleted;
		var canDelete = this.canDelete;

		var messageDescription = canDelete ?
			BX.message('DISK_FILE_VIEW_TRASH_DELETE_DESTROY_FILE_CONFIRM') :
			BX.message('DISK_FILE_VIEW_TRASH_DELETE_FILE_CONFIRM')
		;

		if (this.object.isDeleted)
		{
			messageDescription = BX.message('DISK_FILE_VIEW_TRASH_DELETE_DESTROY_DELETED_FILE_CONFIRM');
		}

		var self = this;
		var airMessageBox = BX.Disk.AirMessageBox;

		airMessageBox.showAirMessageBox({
			title: BX.message('DISK_FILE_VIEW_VERSION_DELETE_TITLE'),
			message: airMessageBox.formatFileName(messageDescription, name),
			className: 'disk-air-message-box-equal-buttons',
			buttonsFactory: function(messageBox) {
				var buttons = [];
				var cancelButton = messageBox.getCancelButton({
					style: BX.UI.AirButtonStyle.PLAIN_NO_ACCENT
				});
				cancelButton.setText(BX.message('DISK_FILE_VIEW_VERSION_CANCEL_BUTTON'));

				if (canMarkDeleted)
				{
					buttons.push(new BX.UI.Button({
						text: BX.message('DISK_FILE_VIEW_TRASH_DELETE_BUTTON'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.FILLED,
						onclick: function(button) {
							button.setWaiting(true);

							BX.ajax.runAction('disk.api.file.markDeleted', {
								analyticsLabel: 'file.view',
								data: {
									fileId: objectId
								}
							}).then(function() {
								messageBox.close();

								var sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
								if (sliderByWindow)
								{
									sliderByWindow.close();
									BX.SidePanel.Instance.postMessageAll(window, 'Disk.File:onMarkDeleted', {
										objectId: objectId
									});
								}
							}, function() {
								button.setWaiting(false);
							});
						}
					}));
				}

				if (canDelete)
				{
					buttons.push(new BX.UI.Button({
						text: BX.message('DISK_FILE_VIEW_TRASH_DESTROY_BUTTON'),
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.OUTLINE,
						onclick: function(button) {
							button.setWaiting(true);

							BX.ajax.runAction('disk.api.file.delete', {
								analyticsLabel: 'file.view',
								data: {
									fileId: objectId
								}
							}).then(function() {
								messageBox.close();

								var sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
								if (sliderByWindow)
								{
									sliderByWindow.close();
									BX.SidePanel.Instance.postMessageAll(window, 'Disk.File:onDelete', {
										objectId: objectId
									});
								}
								else
								{
									document.location.href = self.urls.trashcanList;
								}
							}, function() {
								button.setWaiting(false);
							});
						}
					}));
				}

				buttons.push(cancelButton);

				return buttons;
			}
		});
	};

	FileViewClass.prototype.openConfirmDeleteVersion = function (parameters)
	{
		var name = parameters.object.name;
		var objectId = parameters.object.id;
		var versionId = parameters.version.id;
		var messageDescription = BX.message('DISK_FILE_VIEW_VERSION_DELETE_VERSION_CONFIRM');
		var buttons = [
			new BX.PopupWindowButton({
				text: BX.message('DISK_FILE_VIEW_VERSION_DELETE_VERSION_BUTTON'),
				className: "popup-window-button-accept",
				events: {
					click: BX.delegate(function (e) {
						BX.PopupWindowManager.getCurrentPopup().close();
						BX.PreventDefault(e);

						BX.Disk.ajax({
							method: 'POST',
							dataType: 'json',
							url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'deleteVersion'),
							data: {
								objectId: objectId,
								versionId: versionId
							},
							onsuccess: BX.delegate(function (data) {
								if (!data) {
									return;
								}
								this.grid.instance.removeRow(versionId);

								BX.Disk.showModalWithStatusAction(data);
							}, this)
						});

						return false;
					}, this)
				}
			}),
			new BX.PopupWindowButton({
				text: BX.message('DISK_FILE_VIEW_VERSION_CANCEL_BUTTON'),
				events: {
					click: function (e) {
						BX.PopupWindowManager.getCurrentPopup().close();
						BX.PreventDefault(e);
						return false;
					}
				}
			})
		];

		BX.Disk.modalWindow({
			modalId: 'bx-link-unlink-confirm',
			title: BX.message('DISK_FILE_VIEW_VERSION_DELETE_VERSION_TITLE'),
			contentClassName: 'tac',
			contentStyle: {
				paddingTop: '70px',
				paddingBottom: '70px'
			},
			content: messageDescription.replace('#NAME#', name),
			buttons: buttons
		});
	};

	FileViewClass.prototype.deleteBizProc = function (idBizProc)
	{
		BX.Disk.ajax({
			method: 'POST',
			dataType: 'json',
			url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'deleteBizProc'),
			data: {
				idBizProc: idBizProc,
				fileId: this.object.id
			},
			onsuccess: BX.delegate(function (response) {
				if(response)
				{
					BX.remove(BX(idBizProc));
				}
			}, this)
		});
	};

	FileViewClass.prototype.stopBizProc = function (idBizProc)
	{
		BX.Disk.ajax({
			method: 'POST',
			dataType: 'json',
			url: BX.Disk.addToLinkParam(this.ajaxUrl, 'action', 'stopBizProc'),
			data: {
				idBizProc: idBizProc,
				fileId: this.object.id
			},
			onsuccess: BX.delegate(function (response) {
				if(response.status == 'success')
				{
					var url = document.location.href.replace("#tab-bp", '');
					url += "#tab-bp";
					document.location.href = url;
					location.reload();
				}
				else
				{
					response.errors = response.errors || [{}];
					BX.Disk.showModalWithStatusAction({
						status: 'error',
						message: response.errors.pop().message
					})
				}
			}, this)
		});
	};

	FileViewClass.prototype.openSlider = function (url)
	{
		BX.SidePanel.Instance.open(url, {
			allowChangeHistory: false
		});
	};

	FileViewClass.prototype.showLogBizProc = function (key)
	{
		this.openSlider(BX.Disk.addToLinkParam(this.urls.fileShowBp, 'log_workflow', key));
	};

	FileViewClass.prototype.sortBizProcLog = function ()
	{
		var newOnclickStr = BX.findChildByClassName(BX('workarea-content'), 'bx-sortable').getAttribute('onclick').replace('log_sort=1&', '');
		newOnclickStr = newOnclickStr.replace('?log_workflow', '?log_sort=1&log_workflow');
		newOnclickStr = newOnclickStr.replace('&action=showBp', '');
		BX.findChildByClassName(BX('workarea-content'), 'bx-sortable').setAttribute('onclick', newOnclickStr);
	}

	FileViewClass.prototype.fixUrlForSort = function ()
	{
		var url = document.location.href.replace('&log_sort=1', '');
		url += "#tab-bp";
		document.location.href = url;
	}

	FileViewClass.prototype.onPopState = function (e)
	{
		var state = e.state;
		if(state && state.disk)
		{
			window.location.reload();
		}
	};

	FileViewClass.prototype.openFileHistory = function ()
	{
		if (this.object.isHistoryBlocked)
		{
			top.BX.UI.InfoHelper.show('limit_office_version_storage');
		}
		else
		{
			BX.SidePanel.Instance.open(this.urls.fileHistory);
		}
	};

	FileViewClass.prototype.openFileActions = function (event)
	{
		if (!this.actionsMenu)
		{
			this.actionsMenu = new BX.UI.System.Menu({
				// the id of the surface root keeps the layer of a second surface of the same
				// component open in the same document apart
				id: 'disk-file-view-actions-' + this.surfaceId,
				items: this.buildFileActionsItems(),
				angle: true,
				offsetLeft: 20,
				// the layer lives in the body, outside the surface it belongs to: it is not kept
				// past its closing
				cacheable: false,
				overlay: {
					opacity: 0.01
				},
				events: {
					onDestroy: function() {
						this.actionsMenu = null;
					}.bind(this)
				}
			});
		}

		this.actionsMenu.show(BX.getEventTarget(event));
	};

	FileViewClass.prototype.buildFileActionsItems = function ()
	{
		var self = this;
		var items = [];

		if (this.object.hasUf)
		{
			items.push({
				title: BX.message('DISK_FILE_VIEW_FILE_GO_TO_SHOW_USERFIELDS'),
				onClick: function () {
					BX.SidePanel.Instance.open(self.urls.fileShowUf, {
						allowChangeHistory: false
					});
				}
			});
		}

		if (this.object.hasBp)
		{
			items.push({
				title: BX.message('DISK_FILE_VIEW_FILE_GO_TO_SHOW_BP'),
				onClick: function () {
					BX.SidePanel.Instance.open(self.urls.fileShowBp, {
						allowChangeHistory: false
					});
				}
			});
		}

		return items;
	};

	FileViewClass.prototype.editUf = function ()
	{
		BX.SidePanel.Instance.open(this.urls.fileEditUf, {
			allowChangeHistory: false
		});
	};

	FileViewClass.prototype.reloadUf = function ()
	{
		BX.ajax.runComponentAction('bitrix:disk.file.view', 'showUfSidebar', {
			mode: 'class',
			data: {
				fileId: this.object.id
			}
		}).then(function (response) {
			BX.cleanNode(this.layout.sidebarUfValuesSection);
			this.layout.sidebarUfValuesSection.innerHTML = response.data.html;
		}.bind(this));
	};

	// the dialog is loaded with the first opening, not with the page: a surface without the button
	// of adding never asks for it
	FileViewClass.prototype.openSelector = function ()
	{
		// the button is a toggle: the click that closes the dialog does not ask for a new one
		if (this.selectorDialog && this.selectorDialog.isOpen())
		{
			this.destroySelectorDialog();

			return;
		}

		var openGeneration = ++this.selectorOpenGeneration;

		BX.Runtime.loadExtension(['ui.entity-selector', 'ui.a11y'])
			.then(this.loadProjectSelectorEntity.bind(this))
			.then(function (isProjectAvailable) {
				if (openGeneration === this.selectorOpenGeneration)
				{
					this.showSelectorDialog(isProjectAvailable);
				}
			}.bind(this))
			// the dialog that failed to load or to open leaves the button silent otherwise
			.catch(this.showSelectorLoadError.bind(this))
		;
	};

	// projects are picked through the entity of socialnetwork: a portal without it simply has none
	FileViewClass.prototype.loadProjectSelectorEntity = function ()
	{
		return BX.Runtime.loadExtension('socialnetwork.entity-selector').then(
			function () {
				return true;
			},
			function () {
				return false;
			}
		);
	};

	FileViewClass.prototype.showSelectorLoadError = function ()
	{
		var message = BX.message('DISK_FILE_VIEW_SHARING_SELECTOR_LOAD_ERROR');

		// the balloon of ui.notification carries no live region of its own, so the text is announced
		// apart; ui.a11y itself can be the extension that failed to load
		var announcer = BX.UI && BX.UI.Accessibility ? BX.UI.Accessibility.LiveAnnouncer : null;
		if (announcer)
		{
			announcer.announce(message, 'assertive');
		}

		BX.Disk.showModalWithStatusAction({
			status: 'error',
			message: message
		});
	};

	FileViewClass.prototype.showSelectorDialog = function (isProjectAvailable)
	{
		if (!this.layout.addSharingButton)
		{
			return;
		}

		// the recipients change while the block is open, so the dialog is built anew every time
		// and takes the list as it is now
		this.destroySelectorDialog();
		this.forgetRemovedSharingItems();

		var entities = this.getSelectorEntities(isProjectAvailable);

		this.selectorDialog = new BX.UI.EntitySelector.Dialog({
			id: this.selectorDialogId,
			targetNode: this.layout.addSharingButton,
			context: 'DISK_SHARING_PRIVATE_ACCESS',
			multiple: true,
			enableSearch: true,
			entities: entities,
			preselectedItems: this.getPreselectedItems(entities),
			// access is revoked from anyone: no recipient is kept from being deselected
			undeselectedItems: [],
			events: {
				'Item:onSelect': function (event) {
					this.onSelectSelectorItem(event.getData().item);
				}.bind(this),
				'Item:onDeselect': function (event) {
					this.onDeselectSelectorItem(event.getData().item);
				}.bind(this)
			}
		});

		this.bindToCurrentSlider();

		this.selectorDialog.show();
		// the card can itself be opened in a slider, and the dialog is a layer of the document
		// above it
		this.selectorDialog.adjustPosition();

		// the dialog lies outside the root of this surface, so a test cannot reach it through that
		// root: the mark tells the dialog of the card from the one a panel of the same file opens
		this.selectorDialog.getContainer().setAttribute('data-testid', 'disk-detail-card-sharing-selector');
	};

	FileViewClass.prototype.destroySelectorDialog = function ()
	{
		if (this.selectorDialog)
		{
			this.selectorDialog.destroy();
			this.selectorDialog = null;
		}
	};

	FileViewClass.prototype.getSelectorDialog = function ()
	{
		return this.selectorDialog;
	};

	FileViewClass.prototype.getSelectorEntities = function (isProjectAvailable)
	{
		var entities = [
			{
				id: 'user',
				options: {
					// this block never invited anybody and never looked outside the portal
					inviteEmployeeLink: false,
					inviteGuestLink: false
				}
			},
			{
				id: 'department',
				options: {
					selectMode: 'usersAndDepartments'
				}
			}
		];

		if (isProjectAvailable)
		{
			entities.push({id: 'project'});
		}

		return entities;
	};

	// a recipient without a matching entity in the dialog (a chat, a project on a portal without the
	// project entity) stays in the list of the block but is not preselected
	FileViewClass.prototype.getPreselectedItems = function (entities)
	{
		var entityIds = entities.map(function (entity) {
			return entity.id;
		});

		var preselectedItems = [];

		Object.keys(this.sharingItems).forEach(function (accessCode) {
			var itemId = BX.Disk.SharingAccessCodes.getSelectorItemIdByAccessCode(accessCode);
			if (itemId && entityIds.includes(itemId[0]))
			{
				preselectedItems.push(itemId);
			}
		});

		return preselectedItems;
	};

	// a recipient deleted by its own cross takes its node out of the list and leaves the model of
	// the surface behind: the list of the block tells who holds the access now
	FileViewClass.prototype.forgetRemovedSharingItems = function ()
	{
		Object.keys(this.sharingItems).forEach(function (accessCode) {
			if (!document.contains(this.sharingItems[accessCode].getContainer()))
			{
				delete this.sharingItems[accessCode];
			}
		}.bind(this));
	};

	// the sharing section of this card, not the one of a panel opened over it
	FileViewClass.prototype.appendSharingItem = function (sharingItem)
	{
		if (this.layout.sharingSection)
		{
			this.layout.sharingSection.appendChild(sharingItem.getContainer());
		}
	};

	FileViewClass.prototype.registerSharingItem = function (sharingItem)
	{
		this.sharingItems[sharingItem.state.entity.id] = sharingItem;
	};

	// the model of a recipient the server has taken out of the list says so itself
	FileViewClass.prototype.forgetSharingItem = function (accessCode)
	{
		delete this.sharingItems[accessCode];
	};

	FileViewClass.prototype.onSelectSelectorItem = function (item)
	{
		var accessCode = BX.Disk.SharingAccessCodes.getAccessCodeBySelectorItem(item.getEntityId(), item.getId());
		if (!accessCode)
		{
			return;
		}

		// the recipient already holds the access or is already waiting for it: a second request
		// would grant the same access twice
		if (this.sharingItems[accessCode])
		{
			return;
		}

		var sharingItem = new BX.Disk.Model.DraftSharingItem({
			surfaceId: this.surfaceId,
			getDialog: this.getSelectorDialog.bind(this),
			onForgetSharingItem: this.forgetSharingItem.bind(this),
			onReplaceByRealItem: this.registerSharingItem.bind(this),
			state: {
				entity: {
					id: accessCode,
					type: BX.Disk.SharingAccessCodes.getMemberTypeBySelectorEntity(item.getEntityId()),
					name: item.getTitle(),
					link: item.getLink(),
					avatar: item.getAvatar()
				},
				object: {
					id: this.object.id
				}
			}
		});

		sharingItem.render();
		sharingItem.save();

		this.registerSharingItem(sharingItem);
		this.appendSharingItem(sharingItem);
	};

	FileViewClass.prototype.onDeselectSelectorItem = function (item)
	{
		var accessCode = BX.Disk.SharingAccessCodes.getAccessCodeBySelectorItem(item.getEntityId(), item.getId());
		var sharingItem = accessCode ? this.sharingItems[accessCode] : null;

		if (!sharingItem)
		{
			return;
		}

		// a draft holds no access to revoke yet: the gesture is kept and the access is revoked as
		// soon as the server answers the request of the draft
		if (sharingItem instanceof BX.Disk.Model.DraftSharingItem)
		{
			sharingItem.requestRevokeAfterSave();

			return;
		}

		// the row, the record of the surface and the mark go away with the answer of the server:
		// a refused revoke has to find all three of them in place
		sharingItem.deleteSharing();
	};

	// The card and a panel of the same file show one and the same list of recipients:
	// what one of them got the server to agree to, the other shows without asking the server again.
	FileViewClass.prototype.subscribeToSharingMembersChanged = function ()
	{
		var eventEmitter = BX.Event && BX.Event.EventEmitter ? BX.Event.EventEmitter : null;
		if (!eventEmitter || this.sharingMembersChangedHandler)
		{
			return;
		}

		this.sharingMembersChangedHandler = this.onSharingMembersChanged.bind(this);
		eventEmitter.subscribe('Disk.FileView:onSharingMembersChanged', this.sharingMembersChangedHandler);
	};

	FileViewClass.prototype.unsubscribeFromSharingMembersChanged = function ()
	{
		var eventEmitter = BX.Event && BX.Event.EventEmitter ? BX.Event.EventEmitter : null;
		if (!eventEmitter || !this.sharingMembersChangedHandler)
		{
			return;
		}

		eventEmitter.unsubscribe('Disk.FileView:onSharingMembersChanged', this.sharingMembersChangedHandler);
		this.sharingMembersChangedHandler = null;
	};

	FileViewClass.prototype.onSharingMembersChanged = function (event)
	{
		var data = event.getData() || {};

		// the own message is an echo; a message about another file belongs to another surface
		if (data.sourceSurfaceId === this.surfaceId || data.objectId !== this.object.id)
		{
			return;
		}

		this.forgetRemovedSharingItems();

		if (data.action === 'added')
		{
			this.addSharingItemByMember(data.member);
		}
		else if (data.action === 'removed')
		{
			this.removeSharingItemByAccessCode(data.accessCode);
		}
	};

	// the change has already happened on the server: this surface only catches its list up with it
	FileViewClass.prototype.addSharingItemByMember = function (member)
	{
		if (!member || !member.entity || this.sharingItems[member.entity.id])
		{
			return;
		}

		var sharingItem = new BX.Disk.Model.SharingItem({
			surfaceId: this.surfaceId,
			getDialog: this.getSelectorDialog.bind(this),
			onForgetSharingItem: this.forgetSharingItem.bind(this),
			state: {
				entity: member.entity,
				sharing: member.sharing,
				object: {
					id: this.object.id
				}
			}
		});

		sharingItem.render();
		this.registerSharingItem(sharingItem);
		this.appendSharingItem(sharingItem);

		this.markSelectorItem(member.entity.id, true);
	};

	FileViewClass.prototype.removeSharingItemByAccessCode = function (accessCode)
	{
		var sharingItem = this.sharingItems[accessCode];
		if (!sharingItem)
		{
			return;
		}

		delete this.sharingItems[accessCode];
		sharingItem.remove();

		this.markSelectorItem(accessCode, false);
	};

	// the mark of the own dialog follows the list; the dialog of another surface is never touched
	FileViewClass.prototype.markSelectorItem = function (accessCode, isSelected)
	{
		var itemId = this.selectorDialog
			? BX.Disk.SharingAccessCodes.getSelectorItemIdByAccessCode(accessCode)
			: null
		;
		var item = itemId ? this.selectorDialog.getItem(itemId) : null;
		if (!item)
		{
			return;
		}

		// the change is already done: answering it with an event would give a second request
		if (isSelected)
		{
			item.select({emitEvents: false});
		}
		else
		{
			item.deselect({emitEvents: false});
		}
	};

	FileViewClass.prototype.workWithLocationHash = function()
	{
		setTimeout(BX.delegate(function(){
			this.onHashChange();
		}, this), 350);
	};

	FileViewClass.prototype.onHashChange = function()
	{
		var matches = document.location.hash.match(/hl-([0-9]+)/g);
		if(matches)
		{
			var command = (document.location.hash.match(/!([a-zA-Z]+)/g) || []).pop();
			for (var i in matches) {
				if (!matches.hasOwnProperty(i)) {
					continue;
				}
				var hl = matches[i];
				var number = hl.match(/hl-([0-9]+)/);
				if(number && number[1] && command)
				{
					switch (command.toLowerCase())
					{
						case '!history':
							this.openSlider(this.urls.fileHistory);
							break;
					}
				}
			}
		}
	};

	return FileViewClass;
})();

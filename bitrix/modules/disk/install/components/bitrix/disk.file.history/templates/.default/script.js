(function() {

	"use strict";

	/**
	 * @namespace BX.Disk
	 */
	BX.namespace("BX.Disk");

	/**
	 *
	 * @param {object} parameters
	 * @constructor
	 */
	BX.Disk.FileHistoryComponent = function(parameters)
	{
		this.layout = {};
		this.object = parameters.object;
		this.isViewByUnifiedLink = parameters.isViewByUnifiedLink || false;
		this.gridId = parameters.gridId;
		this.grid = BX.Main.gridManager.getById(this.gridId);

		this.bindEvents();
	};

	BX.Disk.FileHistoryComponent.prototype =
	{
		bindEvents: function ()
		{
			BX.bind(window, 'popstate', this.onPopState.bind(this));
		},

		onPopState: function (e)
		{
			var state = e.state;
			if (state && state.disk)
			{
				window.location.reload();
			}
		},

		openRestoreConfirm: function (parameters)
		{
			var name = parameters.object.name;
			var objectId = parameters.object.id;
			var versionId = parameters.version.id;
			var messageDescription = BX.message('DISK_FILE_HISTORY_VERSION_RESTORE_CONFIRM');

			var self = this;
			var buttons = [
				new BX.PopupWindowCustomButton({
					text: BX.message('DISK_FILE_HISTORY_VERSION_RESTORE_BUTTON'),
					className: "ui-btn ui-btn-success",
					events: {
						click: function (e) {
							this.addClassName('ui-btn-clock');

							let restoreAction = 'disk.api.file.restoreFromVersion';

							let restoreData = {
								fileId: objectId,
								versionId: versionId,
							};

							if (self.isViewByUnifiedLink && BX.type.isStringFilled(self.object.uniqueCode))
							{
								restoreAction = 'disk.api.unifiedlinkactions.restoreFromVersion';

								restoreData = {
									uniqueCode: self.object.uniqueCode,
									versionId: versionId,
								};
							}

							BX.ajax.runAction(restoreAction, {
								analyticsLabel: 'file.history',
								data: restoreData,
							}).then(function (response) {
								BX.PopupWindowManager.getCurrentPopup().close();

								self.grid.instance.reload();

								var sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
								if (sliderByWindow)
								{
									BX.SidePanel.Instance.postMessageAll(window, 'Disk.File:onRestoredFromVersion', {
										fileId: objectId,
										versionId: versionId
									});
								}
							});
						}
					}
				}),
				new BX.PopupWindowCustomButton({
					text: BX.message('DISK_JS_BTN_CANCEL'),
					className: 'ui-btn ui-btn-link',
					events: {
						click: function (e) {
							BX.PopupWindowManager.getCurrentPopup().close();
						}
					}
				})
			];

			BX.Disk.modalWindow({
				modalId: 'bx-link-unlink-confirm',
				title: BX.message('DISK_FILE_HISTORY_VERSION_RESTORE_TITLE'),
				contentClassName: 'disk-popup-content',
				content: messageDescription.replace('#NAME#', name),
				buttons: buttons
			});
		},

		openDeleteConfirm: function (parameters)
		{
			var name = parameters.object.name;
			var objectId = parameters.object.id;
			var versionId = parameters.version.id;
			var messageDescription = BX.message('DISK_FILE_HISTORY_VERSION_DELETE_VERSION_CONFIRM');

			var self = this;
			var buttons = [
				new BX.PopupWindowCustomButton({
					text: BX.message('DISK_FILE_HISTORY_VERSION_DELETE_VERSION_BUTTON'),
					className: "ui-btn ui-btn-success",
					events: {
						click: function (e) {
							this.addClassName('ui-btn-clock');

							let deleteAction = 'disk.api.version.delete';
							let deleteData = {
								versionId: versionId,
							};

							if (self.isViewByUnifiedLink && BX.type.isStringFilled(self.object.uniqueCode))
							{
								deleteAction = 'disk.api.unifiedlinkactions.deleteVersion';
								deleteData = {
									uniqueCode: self.object.uniqueCode,
									versionId: versionId,
								};
							}

							BX.ajax.runAction(deleteAction, {
								analyticsLabel: 'file.history',
								data: deleteData,
							}).then(function (response) {
								BX.PopupWindowManager.getCurrentPopup().close();

								self.grid.instance.reload();

								var sliderByWindow = BX.SidePanel.Instance.getSliderByWindow(window);
								if (sliderByWindow)
								{
									BX.SidePanel.Instance.postMessageAll(window, 'Disk.Version:onDeleted', {
										fileId: objectId,
										versionId: versionId
									});
								}
							});
						}
					}
				}),
				new BX.PopupWindowCustomButton({
					text: BX.message('DISK_JS_BTN_CANCEL'),
					className: 'ui-btn ui-btn-link',
					events: {
						click: function (e) {
							BX.PopupWindowManager.getCurrentPopup().close();
						}
					}
				})
			];

			BX.Disk.modalWindow({
				modalId: 'bx-link-unlink-confirm',
				title: BX.message('DISK_FILE_HISTORY_VERSION_DELETE_VERSION_TITLE'),
				contentClassName: 'disk-popup-content',
				content: messageDescription.replace('#NAME#', name),
				buttons: buttons
			});
		}
	};
})();

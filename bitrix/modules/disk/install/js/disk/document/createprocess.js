(function() {

	"use strict";

	/**
	 * @namespace BX.Disk.Document
	 */
	BX.namespace("BX.Disk.Document");

	var markup = function ()
	{
		if (!BX.Disk.DialogMarkup)
		{
			throw new Error('BX.Disk.Document.CreateProcess: extension "disk.dialog-markup" is not loaded.');
		}

		return BX.Disk.DialogMarkup;
	};

	/**
	 *
	 * @param {object} parameters
	 * @extends {BX.Disk.Document.EditProcess}
	 * @constructor
	 */
	BX.Disk.Document.CreateProcess = function(parameters)
	{
		BX.Disk.Document.EditProcess.apply(this, arguments);

		this.targetFolderId = parameters.targetFolderId;
		this.serviceCode = parameters.serviceCode;
		this.additionalQueryParameters = parameters.additionalQueryParameters || {};
		this.service = null;
		this.popupConfirm = null;
		this.isCreate = true;

		if (BX.type.isFunction(parameters.onAfterCreateFile))
		{
			this.onAfterCreateFile = parameters.onAfterCreateFile;
		}
	};

	BX.Disk.Document.CreateProcess.prototype =
	{
		__proto__: BX.Disk.Document.EditProcess.prototype,
		constructor: BX.Disk.Document.CreateProcess,

		getSliderQueryParameters: function()
		{
			return Object.assign({
				action: 'disk.api.documentService.goToCreate',
				serviceCode: this.serviceCode,
				typeFile: this.typeFile,
				targetFolderId: this.targetFolderId,
				analytics: this.analytics,
				_uls: this.uls ?? '',
			}, this.additionalQueryParameters)
		},

		openInNewTab: function ()
		{
			const newTab = window.open('', '_blank');
			let hasNavigated = false;

			const data = {
				serviceCode: this.serviceCode,
				typeFile: this.typeFile,
				targetFolderId: this.targetFolderId,
				createByUnifiedLink: true,
				analytics: this.analytics,
			};

			BX.ajax.runAction('disk.api.documentService.goToCreate', {
				getParameters: {
					_uls: this.uls ?? '',
				},
				data,
			}).then((response) => {
				const openUrl = response?.data?.openUrl;
				if (!openUrl)
				{
					newTab?.close();

					return;
				}

				if (newTab && !newTab.closed)
				{
					newTab.location.href = new URL(openUrl, window.location.href).href;
					hasNavigated = true;
				}

				if (BX.type.isFunction(this.onAfterCreateFile))
				{
					this.onAfterCreateFile(response);
				}
			}).catch((error) => {
				if (!hasNavigated)
				{
					newTab?.close();
				}

				console.error(error);
			});
		},

		getSliderData: function ()
		{
			return {
				process: 'create',
			}
		},

		buildModalWindow: function ()
		{
			return this.openModal(BX.util.add_url_param('/bitrix/services/main/ajax.php', this.getSliderQueryParameters()));
		},

		getConfirmMessages: function ()
		{
			return {
				title: BX.message('JS_DISK_DOC_PROCESS_NOW_CREATING_IN_SERVICE').replace('#SERVICE#', this.service.name),
				text: BX.message('JS_DISK_DOC_PROCESS_CREATE_DESCR_SAVE_DOC_F').replace('#SAVE_AS_DOC#', BX.message('JS_DISK_DOC_PROCESS_SAVE_AS')),
				saveButton: BX.message('JS_DISK_DOC_PROCESS_SAVE_AS')
			};
		},

		save: function ()
		{
			return this.commit().then(function(response){
				this.objectId = response.objectId;
				this.objectUls = response.uls || null;
				this.showSaveFileDialog(response);
			}.bind(this));
		},

		showSaveFileDialog: function (params)
		{
			var extension = params.extension;
			var nameWithoutExtension = params.nameWithoutExtension;
			var titleId = 'document-save-as-confirm-title';

			var saveDialog = BX.create('div', {
				props: {
					className: 'bx-disk-document-edit-confirm'
				},
				attrs: {
					'data-testid': 'disk-save-as-dialog'
				},
				children: [
					BX.create('h3', {
						props: {
							className: 'bx-disk-document-edit-confirm-title'
						},
						attrs: {id: titleId},
						// the class the title has always carried says nothing about margins: a heading
						// brings its own from the browser, and the box around it is laid out without one
						style: {margin: '0'},
						text: BX.message('JS_DISK_DOC_PROCESS_NOW_CREATING_IN_SERVICE').replace('#SERVICE#', this.service.name),
						children: []
					}),
					markup().renderSaveAsField({
						nameWithoutExtension: nameWithoutExtension,
						extension: extension
					})
				]
			});

			var self = this;
			var nameFieldId = markup().SAVE_AS_FIELD_ID;
			// Closing the window cancels the draft on the server, and a document already saved must
			// not be cancelled after it: this tells the two closings apart.
			var isSaved = false;

			// The buttons of the window are native ones so that the keyboard reaches them; the class
			// the popup puts on them carries a look of its own, so it is taken back off.
			var saveButton = new BX.PopupWindowButton({
				text: BX.message('DISK_JS_BTN_SAVE'),
				className: 'ui-btn ui-btn-success',
				events: {
					click: function () {
						var newName = BX(nameFieldId).value;
						if (!newName) {
							BX.focus(BX(nameFieldId));
							return;
						}

						this.addClassName('ui-btn-clock');
						self.rename({
							newName: newName,
							oldName: nameWithoutExtension,
							extension: extension,
							currentName: params.name,
							currentSize: params.sizeInt
						}).then(function(response){
							response.uls = this.objectUls;

							if (BX.type.isPlainObject(response.object))
							{
								response.object.uls = this.objectUls;
							}

							isSaved = true;

							this.onAfterSave.call(this, response, {
								object: {
									id: params.objectId,
									name: params.name,
									size: params.size,
									sizeInt: params.sizeInt,
									extension: params.extension
								},
								folderName: params.folderName
							});
							saveFileDialog.close();
						}.bind(self));
					}
				}
			});
			saveButton.removeClassName('popup-window-button');
			saveButton.getContainer().setAttribute('data-testid', 'disk-save-as-save-btn');

			var closeButton = new BX.PopupWindowButton({
				text: BX.message('DISK_JS_BTN_CLOSE'),
				className: 'ui-btn ui-btn-link',
				events: {
					click: function () {
						saveFileDialog.close();
					}
				}
			});
			closeButton.removeClassName('popup-window-button');
			closeButton.getContainer().setAttribute('data-testid', 'disk-save-as-close-btn');

			var saveFileDialog = BX.PopupWindowManager.create('document-save-as-confirm', null, {
	 			content: saveDialog,
				ariaLabelledBy: titleId,
				overlay: true,
				buttons: [saveButton, closeButton],
	 			autoHide: false,
				closeByEsc: true,
				focusTrap: true,
				events: {
					// The field carries `data-autofocus` for the focus trap of the window to find, and
					// takes the focus here as well: what the trap does with it hangs on an option of
					// the window, and the field taking the focus is what the window is opened for.
					onPopupShow: function () {
						BX.focus(BX(nameFieldId));
					},
					onPopupClose: function () {
						this.destroy();

						if (isSaved)
						{
							return;
						}

						self.discard();
						self.closeModal();
					}
				}
			});

			saveFileDialog.show();
		},

		rename: function (params)
		{
			var promise = new BX.Promise();

			var newName = params.newName;
			var oldName = params.oldName;
			var extension = params.extension;

			if (newName === oldName || (newName + '.' + extension) === oldName)
			{
				// No request leaves here, so the answer is shaped the way the endpoint of the rename
				// shapes it: what reads the answer never has to tell the two paths apart.
				promise.fulfill({
					status: 'success',
					object: {
						id: this.objectId,
						name: params.currentName,
						size: params.currentSize
					},
					objectId: this.objectId,
					newName: params.currentName
				});

				return promise;
			}

			let renameUrl = this.urlHelper().getUrlRenameFile(
				BX.Disk.Document.EditProcess.prototype.buildLinkToCommit.apply(this)
			);

			renameUrl = BX.Uri.addParam(renameUrl, {
				_uls: this.objectUls ?? '',
			});

			return BX.ajax.promise({
				method: 'POST',
				dataType: 'json',
				url: renameUrl,
				data:  {
					objectId: this.objectId,
					newName: newName + '.' + extension,
					sessid: BX.bitrix_sessid()
				}
			});
		},

		commit: function ()
		{
			return BX.Disk.Document.EditProcess.prototype.commit.apply(this, arguments).then(function (response) {
				return response;
			});
		},

		buildLinkToCommit: function ()
		{
			const url = this.urlHelper().getUrlCommitBlank(
				BX.Disk.Document.EditProcess.prototype.buildLinkToCommit.apply(this),
				this.typeFile,
				this.targetFolderId
			);

			return BX.Uri.addParam(url, {
				_uls: this.uls ?? '',
			});
		},

		buildLinkToDiscard: function ()
		{
			return this.urlHelper().getUrlDiscardBlankFile(
				this.buildLinkToCommit()
			);
		}
	};
})();

BX.namespace("BX.Disk.InformationPopups");
BX.Disk.InformationPopups = (function ()
{
	return {
		getContentWarningLockedDocument: function (data)
		{
			return '<div class="disk-locked-document-popup">' +
					'<div class="disk-locked-document-popup-container">' +
						'<div class="disk-locked-document-popup-img-container">' +
							'<div class="disk-locked-document-popup-img"></div>' +
						'</div>' +
						'<div class="disk-locked-document-popup-content">' +
							'<h3 class="disk-locked-document-popup-content-title">' + BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_TITLE')+ '</h3>' +
							'<div class="disk-locked-document-popup-content-info">' +
								'<span class="disk-locked-document-popup-content-text">' + BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_WAS_LOCKED_FORKED_COPY').replace('#LINK#', data.link) + '</span>' +
							'</div>' +
							'<a href="#" class="webform-button webform-button-create disk-locked-document-popup-content-button">' + BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_GO_TO_FILE') + '</a>' +
						'</div>' +
					'</div>' +
				'</div>'
			;
		},
		getContentWarningLockedDocumentDesktop: function (data)
		{
			return '<div class="disk-locked-document-popup">' +
					'<div class="disk-locked-document-popup-desktop-container">' +
						'<div class="disk-locked-document-popup-desktop-img-container">' +
							'<div class="disk-locked-document-popup-desktop-img"></div>' +
						'</div>' +
						'<div class="disk-locked-document-popup-desktop-content">' +
							'<h3 class="disk-locked-document-popup-desktop-content-title">' + BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_TITLE')+ '</h3>' +
							'<div class="disk-locked-document-popup-desktop-content-info">' +
								'<span class="disk-locked-document-popup-desktop-content-text">' + BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_WAS_LOCKED_FORKED_COPY').replace('#LINK#', data.link) + '</span>' +
							'</div>' +
							'<span onclick="document.location=\'' + data.link + '\'" class="popup-window-button popup-window-button-accept disk-locked-document-popup-desktop-content-button">' + BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_GO_TO_FILE') + '</span>' +
						'</div>' +
					'</div>' +
				'</div>';
		},
		getContentConflictBetweenFiles: function (forkedFileData, originFileData)
		{
			var originFileLink = '<a class="disk-locked-document-popup-content-link js-disk-open-filefolder" data-href="' + originFileData.path + '" href="#">' + originFileData.name + '</a>';
			var forkedFileLink = '<a class="disk-locked-document-popup-content-link js-disk-open-filefolder" data-href="' + forkedFileData.path + '" href="#">' + forkedFileData.name + '</a>';

			var helpMessage = BX.message('disk_bdisk_file_conflict_between_versions')
				.replace('#FILE#', function() {return originFileLink; })
				.replace('#FILE#', function() {return originFileLink; })
				.replace('#FORKED_FILE#', forkedFileLink)
				.replace('#A#', '<a href="' + BX.message('disk_bdisk_file_conflict_between_versions_helpdesk') + '" target="_blank">')
				.replace('#A_END#', '</a>')
			;

			return '<div class="disk-locked-document-popup">' +
					'<div class="disk-locked-document-popup-desktop-container">' +
						'<div class="disk-locked-document-popup-desktop-img-container">' +
							'<div class="disk-locked-document-popup-desktop-img"></div>' +
						'</div>' +
						'<div class="disk-locked-document-popup-desktop-content">' +
							'<a href="#" class="bx-notifier-item-delete"></a>' +
							'<h3 class="disk-locked-document-popup-desktop-content-title">' + BX.message('disk_bdisk_file_conflict_between_versions_title')+ '</h3>' +
							'<div class="disk-locked-document-popup-desktop-content-info">' +
								'<span class="disk-locked-document-popup-desktop-content-text">' + helpMessage + '</span>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>';
		},
		getContentSwitchOnBDisk: function ()
		{
			var helpMessage = BX.message('DISK_JS_INF_POPUPS_SWITCH_ON_BDISK_DESCR')
				.replace('#A#', '<a href="#" id="bx-open-bdisk-settings">')
				.replace('#A_END#', '</a>')
			;

			return '<div class="disk-locked-document-popup">' +
					'<div class="disk-locked-document-popup-desktop-container">' +
						'<div class="disk-locked-document-popup-desktop-img-container">' +
							'<div class="disk-locked-document-popup-desktop-img"></div>' +
						'</div>' +
						'<div class="disk-locked-document-popup-desktop-content">' +
							'<a href="#" class="bx-notifier-item-delete"></a>' +
							'<h3 class="disk-locked-document-popup-desktop-content-title">' + BX.message('DISK_JS_INF_POPUPS_SWITCH_ON_BDISK_TITLE')+ '</h3>' +
							'<div class="disk-locked-document-popup-desktop-content-info">' +
								'<span class="disk-locked-document-popup-desktop-content-text">' + helpMessage + '</span>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>';
		},
		getContentLockedByProgram: function (fileData, program)
		{
			var originFileLink = '<a class="disk-locked-document-popup-content-link js-disk-open-filefolder" data-href="' + fileData.path + '" href="#">' + fileData.name + '</a>';

			var helpMessage = BX.message('disk_bdisk_file_conflict_locked_by_app')
				.replace('#FILE#', function() {return originFileLink; })
				.replace('#FILE#', function() {return originFileLink; })
				.replace('#PROGRAM#', function() {return program; })
				.replace('#PROGRAM#', function() {return program; })
				.replace('#A#', '<a href="' + BX.message('disk_bdisk_file_conflict_locked_by_app_helpdesk') + '" target="_blank">')
				.replace('#A_END#', '</a>')
			;

			return '<div class="disk-locked-document-popup">' +
					'<div class="disk-locked-document-popup-desktop-container">' +
						'<div class="disk-locked-document-popup-desktop-img-container">' +
							'<div class="disk-locked-document-popup-desktop-img"></div>' +
						'</div>' +
						'<div class="disk-locked-document-popup-desktop-content">' +
							'<a href="#" class="bx-notifier-item-delete"></a>' +
							'<h3 class="disk-locked-document-popup-desktop-content-title">' + BX.message('disk_bdisk_file_conflict_locked_by_app_title')+ '</h3>' +
							'<div class="disk-locked-document-popup-desktop-content-info">' +
								'<span class="disk-locked-document-popup-desktop-content-text">' + helpMessage + '</span>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>';
		},
		showWarningLockedDocument: function (data)
		{
			(new BX.PopupWindow('testy', null, {
				content: BX.create('div', {html: BX.Disk.InformationPopups.getContentWarningLockedDocument({
					link: data.link
				})}),
				autoHide: true,
				lightShadow: true,
				closeIcon: {right: "20px", top: "10px"},
				events: {
					onPopupClose: function ()
					{
						this.destroy();
					}
				},
				buttons: []
			})).show();
		},
		openWindowForSelectDocumentService: function (params) {
			BX.Runtime.loadExtension('ui.dialogs.messagebox').then(function () {
				var viewInUf = params.viewInUf || false;
				var currentSelection = BX.Disk.getDocumentService();
				var newSelectedService = '';

				var currentServiceIsCloud = false;
				if (currentSelection !== 'l' && currentSelection !== 'onlyoffice' && currentSelection)
				{
					currentServiceIsCloud = true;
				}
				if (!currentSelection && BX.Disk.isAvailableOnlyOffice())
				{
					currentSelection = 'onlyoffice';
				}
				else if(!currentSelection)
				{
					currentSelection = 'l';
				}
				newSelectedService = currentSelection;

				var suffix = viewInUf? '' : '2';
				var lang = BX.message('LANGUAGE_ID');
				var imageSrc = '/bitrix/images/disk/disk_description' + suffix + '_en.png';
				if(lang == 'kz')
					lang = 'ru';
				switch(lang)
				{
					case 'ru':
					case 'en':
					case 'de':
					case 'ua':
					case 'br':
					case 'la':
					case 'sc':
					case 'tc':
						imageSrc = '/bitrix/images/disk/disk_description' + suffix + '_' + lang + '.png';
						break;
				}

				var content =
					'<div id="bx-disk-select-doc-service" data-testid="disk-doc-service-popup">' +
					'<div class="bx-disk-info-popup-cont-title" id="bx-disk-service-choice-title">' +
						BX.message('DISK_JS_SERVICE_CHOICE_TITLE') +
					'</div>' +
					'<div class="bx-disk-info-popup-btn-wrap" role="radiogroup" aria-labelledby="bx-disk-service-choice-title">' +
						'<span data-service="l" id="bx-disk-info-popup-btn-local" data-testid="disk-doc-service-card-l" role="radio" tabindex="0" aria-checked="' + (currentSelection === 'l' ? 'true' : 'false') + '" aria-labelledby="bx-disk-doc-service-l-title" aria-describedby="bx-disk-doc-service-l-desc"' + (currentSelection === 'l' ? ' data-autofocus' : '') + ' class="bx-disk-info-popup-btn bx-disk-info-popup-btn-local ' + (currentSelection === 'l' ? 'bx-disk-info-popup-btn-active' : '') + ' ">' +
							'<span class="bx-disk-info-popup-btn-text">' +
								'<span id="bx-disk-doc-service-l-title">' + BX.message('DISK_JS_SERVICE_LOCAL_TITLE') + '</span>'+
							'</span>' +
							'<span class="bx-disk-info-popup-btn-descript" id="bx-disk-doc-service-l-desc">' +
								BX.message('DISK_JS_SERVICE_LOCAL_TEXT') +
							'</span>' +
							'<span class="bx-disk-info-popup-btn-check"></span>' +
						'</span>' +
						'<span data-service="gdrive" id="bx-disk-info-popup-btn-cloud" data-testid="disk-doc-service-card-gdrive" role="radio" tabindex="0" aria-checked="' + (currentServiceIsCloud ? 'true' : 'false') + '" aria-labelledby="bx-disk-doc-service-cloud-title" aria-describedby="bx-disk-doc-service-cloud-desc"' + (currentServiceIsCloud ? ' data-autofocus' : '') + ' class="bx-disk-info-popup-btn bx-disk-info-popup-btn-cloud ' + (currentServiceIsCloud ? 'bx-disk-info-popup-btn-active' : '') + ' ">' +
							'<span class="bx-disk-info-popup-btn-text">' +
								'<span id="bx-disk-doc-service-cloud-title">'+ BX.message('DISK_JS_SERVICE_CLOUD_TITLE') + '</span>' +
							'</span>' +
							'<span class="bx-disk-info-popup-btn-descript" id="bx-disk-doc-service-cloud-desc">' +
								BX.message('DISK_JS_SERVICE_CLOUD_TEXT') +
							'</span>' +
							'<span class="bx-disk-info-popup-btn-check"></span>' +
						'</span>' +
						'<span data-service="onlyoffice" ' + (BX.Disk.isAvailableOnlyOffice()? '' : 'style="display:none;"') +' id="bx-disk-info-popup-btn-b24" data-testid="disk-doc-service-card-onlyoffice" role="radio" tabindex="' + (BX.Disk.isAvailableOnlyOffice()? '0' : '-1') + '" aria-checked="' + (currentSelection === 'onlyoffice' ? 'true' : 'false') + '" aria-labelledby="bx-disk-doc-service-b24-title" aria-describedby="bx-disk-doc-service-b24-desc"' + (currentSelection === 'onlyoffice'? ' data-autofocus' : '') + ' class="bx-disk-info-popup-btn bx-disk-info-popup-btn-b24 ' + (currentSelection === 'onlyoffice'? 'bx-disk-info-popup-btn-active' : '') + ' ">' +
						'<span class="bx-disk-info-popup-btn-text">' +
							'<span id="bx-disk-doc-service-b24-title">'+ BX.message('DISK_JS_SERVICE_B24_DOCS_TITLE') + '</span>' +
						'</span>' +
							'<span class="bx-disk-info-popup-btn-descript" id="bx-disk-doc-service-b24-desc">' +
								BX.message('DISK_JS_SERVICE_B24_DOCS_TEXT') +
							'</span>' +
						'	<span class="bx-disk-info-popup-btn-check"></span>' +
						'</span>' +
					'</div>' +
					'<div class="bx-disk-info-descript">' +
						(viewInUf? BX.message('DISK_JS_SERVICE_HELP_TEXT') : BX.message('DISK_JS_SERVICE_HELP_TEXT_2')) +
						'<img style="height: 182px;" class="bx-disk-info-descript-img" src="' + imageSrc + '" alt="" aria-hidden="true"/>' +
					'</div>' +
					'<div style="margin-top: 10px">' +
						'<a href="/" id="bx-disk-info-popup-helpdesk" data-testid="disk-doc-service-helpdesk" style="font-size: 14px">' + BX.message('DISK_JS_HELP_WITH_BDISK') + '</a>' +
					'</div>' +
					'</div>'
					;

				var messageBox = BX.UI.Dialogs.MessageBox.create({
					useAirDesign: true,
					modal: true,
					title: BX.message('DISK_JS_SERVICE_CHOICE_TITLE_SMALL'),
					message: content,
					maxWidth: 650,
					popupOptions: {}
				});

				var defaultOnSave = function (service) {
					if (service === 'l' && !BX.Disk.Document.Local.Instance.isEnabled())
					{
						this.getHelpDialogToUseLocalService().show();
						return;
					}

					BX.Disk.saveDocumentService(service);
					messageBox.close();
				}.bind(this);

				var saveAction = function () {
					defaultOnSave(newSelectedService);
					if (BX.type.isFunction(params.onSave))
					{
						params.onSave(newSelectedService);
					}
				};

				var cancelButton = messageBox.getCancelButton();
				cancelButton.setText(BX.message('DISK_JS_BTN_CLOSE'));
				cancelButton.setDataSet({ testid: 'disk-doc-service-close' });

				messageBox.setButtons([
					new BX.UI.Button({
						useAirDesign: true,
						style: BX.UI.AirButtonStyle.FILLED,
						wide: true,
						text: BX.message('DISK_JS_BTN_SAVE'),
						dataset: { testid: 'disk-doc-service-save' },
						onclick: function () {
							saveAction();
						}
					}),
					cancelButton
				]);

				messageBox.show();

				var contentNode = messageBox.getPopupWindow().getContentContainer();

				var selectCard = function (targetNode) {
					newSelectedService = targetNode.dataset.service;

					if (BX.hasClass(targetNode, 'bx-disk-info-popup-btn-active'))
					{
						return;
					}

					var activeCard = contentNode.querySelector('.bx-disk-info-popup-btn-active');
					if (activeCard)
					{
						activeCard.classList.remove('bx-disk-info-popup-btn-active');
						activeCard.setAttribute('aria-checked', 'false');
					}

					BX.toggleClass(targetNode, 'bx-disk-info-popup-btn-active');
					targetNode.setAttribute('aria-checked', 'true');
				};

				BX.bindDelegate(contentNode, 'click', {className: 'bx-disk-info-popup-btn'}, function (e) {
					selectCard(this);
				});

				BX.bindDelegate(contentNode, 'keydown', {className: 'bx-disk-info-popup-btn'}, function (e) {
					if (e.key !== ' ' && e.keyCode !== 32)
					{
						return;
					}
					e.preventDefault();
					selectCard(this);
				});

				var helpdeskLink = contentNode.querySelector('#bx-disk-info-popup-helpdesk');
				if (helpdeskLink)
				{
					BX.bind(helpdeskLink, 'click', function (e) {
						e.preventDefault();
						if (top.BX.Helper)
						{
							top.BX.Helper.show("redirect=detail&code=8626407");
						}
						messageBox.close();
					});
				}

				BX.bind(contentNode, 'keydown', function (e) {
					if (e.key !== 'Enter' && e.keyCode !== 13)
					{
						return;
					}
					if (e.target && e.target.closest && e.target.closest('button, a'))
					{
						return;
					}
					saveAction();
				});
			}.bind(this));
		},
		getHelpDialogToUseLocalService: function ()
		{
			var title = BX.message('DISK_JS_INF_POPUPS_EDIT_IN_LOCAL_SERVICE');
			var message = BX.message('DISK_JS_INF_POPUPS_SERVICE_LOCAL_INSTALL_DESKTOP');
			var helpDiskDialog = BX.create('div', {
				props: {
					className: 'bx-viewer-confirm'
				},
				children: [
					BX.create('div', {
						props: {
							className: 'bx-viewer-confirm-title'
						},
						text: title,
						children: []
					}),
					BX.create('div', {
						props: {
							className: 'bx-viewer-confirm-text-wrap'
						},
						children: [
							BX.create('span', {
								props: {
									className: 'bx-viewer-confirm-text-alignment'
								}
							}),
							BX.create('span', {
								props: {
									className: 'bx-viewer-confirm-text'
								},
								html: message
							})
						]
					})
				]
			});

			var popup = BX.PopupWindowManager.create('helpDialogToUseLocalService', null, {
				content: helpDiskDialog,
				buttons: [
					new BX.PopupWindowButton({
						text: BX.message('DISK_JS_BTN_DOWNLOAD'),
						className: "popup-window-button-accept",
						events: {
							click: function () {
								document.location.href = BX.Intranet.DesktopDownload.getLinkForCurrentUser();
							}
						}
					}),
					new BX.PopupWindowButton({
						text: BX.message('DISK_JS_BTN_CANCEL'),
						events: {
							click: function () {
								popup.close();
							}
						}
					})
				]
			});

			return popup;
		}
	};
})();

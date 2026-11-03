BX.namespace("BX.Disk.InformationPopups");
BX.Disk.InformationPopups = (function ()
{
	// The desktop notifications below stay HTML strings: their consumer wraps the returned value into
	// a node as raw HTML. Every value interpolated into them comes from the desktop client or from the
	// error text of the storage controller, so all of it is treated as controlled by the user.
	var encode = function (value)
	{
		return BX.Text.encode(BX.type.isNotEmptyString(value) ? value : '');
	};

	// The markup of the window belongs to `disk.dialog-markup`, and this namespace is public: a call
	// made without that extension is told what it is missing instead of failing on a property of
	// nothing.
	var markup = function ()
	{
		if (!BX.Disk.DialogMarkup)
		{
			throw new Error('BX.Disk.InformationPopups: extension "disk.dialog-markup" is not loaded.');
		}

		return BX.Disk.DialogMarkup;
	};

	// The policy of the address is read here for what the markup cannot decide - the desktop
	// notification, which has no node, and the binding of the web button.
	var safeLink = function (link)
	{
		return markup().safeLink(link);
	};

	// The phrases of the warning belong to this extension, and the block is told which ones to print.
	var lockedDocumentWarningParams = function (link)
	{
		return {
			link: link,
			titleMessageId: 'DISK_JS_INF_POPUPS_LOCKED_DOC_TITLE',
			textMessageId: 'DISK_JS_INF_POPUPS_LOCKED_DOC_WAS_LOCKED_FORKED_COPY',
			actionMessageId: 'DISK_JS_INF_POPUPS_LOCKED_DOC_GO_TO_FILE'
		};
	};

	return {
		/**
		 * @deprecated the markup of the web variant belongs to `disk.dialog-markup`; the method is
		 * kept for the consumers of this public namespace that live outside the repository.
		 */
		getContentWarningLockedDocument: function (data)
		{
			return markup().renderLockedDocumentWarning(lockedDocumentWarningParams(data.link)).outerHTML;
		},
		getContentWarningLockedDocumentDesktop: function (data)
		{
			var link = safeLink(data.link);
			// the value is handed over by a function: as a replacement string `$&`, `$'` and `` $` ``
			// would stand for parts of the match instead of themselves
			var text = BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_WAS_LOCKED_FORKED_COPY')
				.replace('#LINK#', function () { return encode(link); })
			;
			// The action is the one thing the notification is opened for, and with no address there
			// is nowhere for it to lead - the same as in the block of the web variant.
			var action = link === ''
				? ''
				: '<a href="' + encode(link) + '" class="popup-window-button popup-window-button-accept disk-locked-document-popup-desktop-content-button">' + BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_GO_TO_FILE') + '</a>';

			return '<div class="disk-locked-document-popup">' +
					'<div class="disk-locked-document-popup-desktop-container">' +
						'<div class="disk-locked-document-popup-desktop-img-container">' +
							'<div class="disk-locked-document-popup-desktop-img"></div>' +
						'</div>' +
						'<div class="disk-locked-document-popup-desktop-content">' +
							'<h3 class="disk-locked-document-popup-desktop-content-title">' + BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_TITLE')+ '</h3>' +
							'<div class="disk-locked-document-popup-desktop-content-info">' +
								'<span class="disk-locked-document-popup-desktop-content-text">' + text + '</span>' +
							'</div>' +
							action +
						'</div>' +
					'</div>' +
				'</div>';
		},
		getContentConflictBetweenFiles: function (forkedFileData, originFileData)
		{
			var originFileLink = '<a class="disk-locked-document-popup-content-link js-disk-open-filefolder" data-href="' + encode(originFileData.path) + '" href="#">' + encode(originFileData.name) + '</a>';
			var forkedFileLink = '<a class="disk-locked-document-popup-content-link js-disk-open-filefolder" data-href="' + encode(forkedFileData.path) + '" href="#">' + encode(forkedFileData.name) + '</a>';

			var helpMessage = BX.message('disk_bdisk_file_conflict_between_versions')
				.replace('#FILE#', function() {return originFileLink; })
				.replace('#FILE#', function() {return originFileLink; })
				.replace('#FORKED_FILE#', function() {return forkedFileLink; })
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
			var originFileLink = '<a class="disk-locked-document-popup-content-link js-disk-open-filefolder" data-href="' + encode(fileData.path) + '" href="#">' + encode(fileData.name) + '</a>';
			var programName = encode(program);

			var helpMessage = BX.message('disk_bdisk_file_conflict_locked_by_app')
				.replace('#FILE#', function() {return originFileLink; })
				.replace('#FILE#', function() {return originFileLink; })
				.replace('#PROGRAM#', function() {return programName; })
				.replace('#PROGRAM#', function() {return programName; })
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
			var dialogMarkup = markup();
			var link = safeLink(data.link);
			var content = dialogMarkup.renderLockedDocumentWarning(lockedDocumentWarningParams(link));
			// The heading of the block names the window.
			var titleId = dialogMarkup.LOCKED_DOCUMENT_WARNING_TITLE_ID;

			// One window stands under this identifier instead of a second node carrying the same
			// heading; the window is destroyed on close, so a later warning is built anew.
			var popup = BX.PopupWindowManager.create('disk-locked-document-warning', null, {
				content: content,
				ariaLabelledBy: titleId,
				autoHide: true,
				closeByEsc: true,
				focusTrap: true,
				lightShadow: true,
				closeIcon: {right: "20px", top: "10px"},
				events: {
					onPopupClose: function ()
					{
						this.destroy();
					}
				},
				buttons: []
			});

			// A window handed back by the manager stands with the warning of the document it was raised
			// for, and the announcement below speaks of this one: it takes the block just built.
			var reused = !popup.getContentContainer().contains(content);
			if (reused)
			{
				popup.setContent(content);
			}

			if (link !== '')
			{
				BX.bind(content.querySelector('.disk-locked-document-popup-content-button'), 'click', function () {
					BX.Page.redirect(link);
				});
			}

			popup.show();

			if (reused)
			{
				var focusTrap = popup.getFocusTrap();
				if (focusTrap)
				{
					// A window already shown leaves `show()` before it reads the place to hand the focus
					// back to, so the warning that took the window over names that place itself. Focus
					// already standing in the window names nothing: the trap keeps the place it holds.
					focusTrap.captureActiveElement();
					// The block that held the focus left the window with the warning it belonged to.
					focusTrap.applyInitialFocus();
				}
			}

			BX.UI.Accessibility.LiveAnnouncer.announce(
				BX.message('DISK_JS_INF_POPUPS_LOCKED_DOC_ANNOUNCE'),
				'assertive'
			);
		},
		openWindowForSelectDocumentService: function (params) {
			var dialogMarkup = markup();

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
				var imageSrc = '/bitrix/images/disk/disk_description' + suffix + '_en.webp';
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
						imageSrc = '/bitrix/images/disk/disk_description' + suffix + '_' + lang + '.webp';
						break;
				}

				var serviceCardNodes = [
					dialogMarkup.renderServiceCard({
						service: 'l',
						id: 'bx-disk-info-popup-btn-local',
						testId: 'disk-doc-service-card-l',
						modifierClass: 'bx-disk-info-popup-btn-local',
						titleId: 'bx-disk-doc-service-l-title',
						descriptionId: 'bx-disk-doc-service-l-desc',
						titleMessageId: 'DISK_JS_SERVICE_LOCAL_TITLE',
						descriptionMessageId: 'DISK_JS_SERVICE_LOCAL_TEXT'
					}, currentSelection === 'l'),
					dialogMarkup.renderServiceCard({
						service: 'gdrive',
						id: 'bx-disk-info-popup-btn-cloud',
						testId: 'disk-doc-service-card-gdrive',
						modifierClass: 'bx-disk-info-popup-btn-cloud',
						titleId: 'bx-disk-doc-service-cloud-title',
						descriptionId: 'bx-disk-doc-service-cloud-desc',
						titleMessageId: 'DISK_JS_SERVICE_CLOUD_TITLE',
						descriptionMessageId: 'DISK_JS_SERVICE_CLOUD_TEXT'
					}, currentServiceIsCloud),
					dialogMarkup.renderServiceCard({
						service: 'onlyoffice',
						id: 'bx-disk-info-popup-btn-b24',
						testId: 'disk-doc-service-card-onlyoffice',
						modifierClass: 'bx-disk-info-popup-btn-b24',
						titleId: 'bx-disk-doc-service-b24-title',
						descriptionId: 'bx-disk-doc-service-b24-desc',
						titleMessageId: 'DISK_JS_SERVICE_B24_DOCS_TITLE',
						descriptionMessageId: 'DISK_JS_SERVICE_B24_DOCS_TEXT',
						hidden: !BX.Disk.isAvailableOnlyOffice()
					}, currentSelection === 'onlyoffice')
				];

				var content = BX.Tag.render`
					<div id="bx-disk-select-doc-service" data-testid="disk-doc-service-popup">
						<div class="bx-disk-info-popup-cont-title" id="bx-disk-service-choice-title">
							${BX.message('DISK_JS_SERVICE_CHOICE_TITLE')}
						</div>
						<div class="bx-disk-info-popup-btn-wrap" data-testid="disk-doc-service-group" role="radiogroup" aria-labelledby="bx-disk-service-choice-title">
							${serviceCardNodes}
						</div>
						<div class="bx-disk-info-descript">
							${viewInUf ? BX.message('DISK_JS_SERVICE_HELP_TEXT') : BX.message('DISK_JS_SERVICE_HELP_TEXT_2')}
							<img style="height: 182px;" class="bx-disk-info-descript-img" data-testid="disk-doc-service-illustration" src="${imageSrc}" alt="" aria-hidden="true"/>
						</div>
						<div style="margin-top: 10px">
							<a href="/" id="bx-disk-info-popup-helpdesk" data-testid="disk-doc-service-helpdesk" style="font-size: 14px">${BX.message('DISK_JS_HELP_WITH_BDISK')}</a>
						</div>
					</div>
				`;

				var messageBox = BX.UI.Dialogs.MessageBox.create({
					useAirDesign: true,
					modal: true,
					title: BX.message('DISK_JS_SERVICE_CHOICE_TITLE_SMALL'),
					message: content,
					maxWidth: 650,
					// The message box turns Escape on only for the windows its own `alert` builds, so the
					// key is asked for here: `popupOptions` is what the box hands the popup last.
					popupOptions: {focusTrap: true, closeByEsc: true}
				});

				// The inner padding of the window comes with a modifier the message box sets only for
				// a message given as a string (`ui/install/js/ui/dialogs/messagebox/src/messagebox.js`,
				// `getPopupWindow`), and the message here is a node.
				BX.addClass(messageBox.getPopupWindow().getPopupContainer(), '--content-text');

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

				var isCardSelectionKey = function (e) {
					return e.key === ' ' || e.keyCode === 32 || e.key === 'Enter' || e.keyCode === 13;
				};

				BX.bindDelegate(contentNode, 'click', {className: 'bx-disk-info-popup-btn'}, function (e) {
					selectCard(this);
				});

				BX.bindDelegate(contentNode, 'keydown', {className: 'bx-disk-info-popup-btn'}, function (e) {
					if (!isCardSelectionKey(e))
					{
						return;
					}
					e.preventDefault();
					selectCard(this);
				});

				var radioGroupNode = contentNode.querySelector('.bx-disk-info-popup-btn-wrap');
				var hiddenAttribute = dialogMarkup.SERVICE_CARD_HIDDEN_ATTRIBUTE;
				var reachableCards = Array.prototype.filter.call(
					radioGroupNode.querySelectorAll('.bx-disk-info-popup-btn'),
					function (card) {
						return !card.hasAttribute(hiddenAttribute);
					}
				);

				var getEntryCard = function () {
					var checked = reachableCards.filter(function (card) {
						return card.getAttribute('aria-checked') === 'true';
					});

					return checked[0] || reachableCards[0] || null;
				};

				// The zone owns the keyboard model of the group: one Tab stop on the checked card,
				// arrows between the cards. The cards lie in a row, so the horizontal arrows are bound too.
				var focusZone = new BX.UI.Accessibility.FocusZone(radioGroupNode, {
					bindKeys: BX.UI.Accessibility.FocusKeys.ArrowAll | BX.UI.Accessibility.FocusKeys.HomeAndEnd,
					focusOutBehavior: 'wrap',
					focusInStrategy: getEntryCard
				});
				focusZone.activate();

				// Selection follows the focus, the way a radio group is expected to behave.
				BX.bind(radioGroupNode, 'focusin', function (e) {
					var card = e.target.closest('.bx-disk-info-popup-btn');
					if (card)
					{
						selectCard(card);
					}
				});

				messageBox.getPopupWindow().subscribeOnce('onClose', function () {
					focusZone.deactivate();
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
			}.bind(this));
		},
		getHelpDialogToUseLocalService: function ()
		{
			var title = BX.message('DISK_JS_INF_POPUPS_EDIT_IN_LOCAL_SERVICE');
			var message = BX.message('DISK_JS_INF_POPUPS_SERVICE_LOCAL_INSTALL_DESKTOP');
			var titleId = 'disk-help-local-service-title';
			var helpDiskDialog = BX.create('div', {
				props: {
					className: 'bx-viewer-confirm'
				},
				attrs: {'data-testid': 'disk-help-local-service'},
				children: [
					BX.create('h3', {
						props: {
							className: 'bx-viewer-confirm-title'
						},
						attrs: {id: titleId},
						// the class the title has always carried says nothing about margins: a heading
						// brings its own from the browser, and the box around it is laid out without one
						style: {margin: '0'},
						text: title
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

			var downloadButton = new BX.PopupWindowButton({
				text: BX.message('DISK_JS_BTN_DOWNLOAD'),
				className: "popup-window-button-accept",
				events: {
					click: function () {
						document.location.href = BX.Intranet.DesktopDownload.getLinkForCurrentUser();
					}
				}
			});
			downloadButton.getContainer().setAttribute('data-testid', 'disk-help-local-service-download-btn');

			var cancelButton = new BX.PopupWindowButton({
				text: BX.message('DISK_JS_BTN_CANCEL'),
				events: {
					click: function () {
						popup.close();
					}
				}
			});
			cancelButton.getContainer().setAttribute('data-testid', 'disk-help-local-service-cancel-btn');

			var popup = BX.PopupWindowManager.create('helpDialogToUseLocalService', null, {
				content: helpDiskDialog,
				ariaLabelledBy: titleId,
				closeByEsc: true,
				focusTrap: true,
				events: {
					// The window carries an identifier of its own and is built anew on every call:
					// left alive it would keep the manager handing the first build back.
					onPopupClose: function ()
					{
						this.destroy();
					}
				},
				buttons: [downloadButton, cancelButton]
			});

			return popup;
		}
	};
})();

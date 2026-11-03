;(function ()
{
	'use strict';

	BX.namespace('BX.Landing.Component.Filter');

	BX.Landing.Component.Filter.filterId = null;
	BX.Landing.Component.Filter.canCreateFolder = false;
	BX.Landing.Component.Filter.createButton = null;
	BX.Landing.Component.Filter.createFolderButton = null;
	BX.Landing.Component.Filter.recycleBinButton = null;
	BX.Landing.Component.Filter.settingsButtons = null;
	BX.Landing.Component.Filter.ajaxPath = null;
	BX.Landing.Component.Filter.ajaxSend = false;
	BX.Landing.Component.Filter.componentName = '';
	BX.Landing.Component.Filter.signedParameters = '';

	BX.Landing.Component.Filter = function (params)
	{
		if (params.filterId !== undefined)
		{
			BX.Landing.Component.Filter.filterId = params.filterId;
		}

		if (BX.Type.isBoolean(params.canCreateFolder))
		{
			BX.Landing.Component.Filter.canCreateFolder = params.canCreateFolder;
		}

		const toolbar = BX.UI.ToolbarManager.getDefaultToolbar();
		if (toolbar && BX.Type.isString(params.landingCreateButtonId))
		{
			BX.Landing.Component.Filter.createButton = toolbar.getButton(params.landingCreateButtonId);
			BX.Landing.Component.Filter.bindMenuExpandedState(BX.Landing.Component.Filter.createButton);
		}

		if (toolbar && BX.Type.isString(params.landingCreateFolderButtonId))
		{
			BX.Landing.Component.Filter.createFolderButton = toolbar.getButton(params.landingCreateFolderButtonId);
		}

		if (toolbar && BX.Type.isString(params.landingRecycleBinButtonId))
		{
			BX.Landing.Component.Filter.recycleBinButton = toolbar.getButton(params.landingRecycleBinButtonId);
		}

		if (params.landingSettingsButtons !== undefined)
		{
			BX.Landing.Component.Filter.settingsButtons = params.landingSettingsButtons;
		}

		if (params.landingAjaxPath !== undefined)
		{
			BX.Landing.Component.Filter.ajaxPath = params.landingAjaxPath;
		}

		if (BX.Type.isString(params.componentName))
		{
			BX.Landing.Component.Filter.componentName = params.componentName;
		}

		if (BX.Type.isString(params.signedParameters))
		{
			BX.Landing.Component.Filter.signedParameters = params.signedParameters;
		}

		BX.addCustomEvent('BX.Main.Filter:apply', BX.delegate(BX.Landing.Component.Filter.onFilterCallback));
		BX.addCustomEvent('BX.Landing.Filter:apply', BX.delegate(BX.Landing.Component.Filter.onFilterCallback));

		// force creating folder item to correctly BX.Landing.TileGrid init
		if (BX.Landing.Component.Filter.canCreateFolder)
		{
			BX.Landing.Component.Filter.getFolderCard();
		}
	};

	// aria-expanded has to follow the real menu state, so it is driven by the menu popup itself;
	// a button without a menu keeps no such attribute at all
	BX.Landing.Component.Filter.bindMenuExpandedState = (button) =>
	{
		const menu = button && BX.Type.isFunction(button.getMenuWindow) ? button.getMenuWindow() : null;
		if (!menu)
		{
			return;
		}

		const popup = menu.getPopupWindow();
		popup.subscribe('onShow', () => {
			button.setProps({'aria-expanded': 'true'});
		});
		popup.subscribe('onClose', () => {
			button.setProps({'aria-expanded': 'false'});
		});
	};

	BX.Landing.Component.Filter.onRecycleBinClick = () =>
	{
		if (BX.Landing.Component.Filter.filterId === null)
		{
			return;
		}

		const filterManager = BX.Main.filterManager.getById(BX.Landing.Component.Filter.filterId);
		const filterApi = filterManager.getApi();
		const currValues = filterManager.getFilterFieldsValues();
		if (currValues.DELETED === 'Y')
		{
			currValues.DELETED = '';
		}
		else
		{
			currValues.DELETED = 'Y';
		}

		filterApi.setFields(currValues);
		filterApi.apply();
	};

	let announceTimerId = null;
	let pendingAnnouncement = null;

	BX.Landing.Component.Filter.announceNow = (message, politeness) =>
	{
		BX.Runtime.loadExtension('ui.a11y').then((exports) =>
		{
			exports.LiveAnnouncer.announce(message, politeness);
		}).catch((error) => {
			console.error('[Landing.Filter] announcement failed:', error);
		});
	};

	// keeps only the last pending message so racing realtime refreshes don't queue stale announcements
	BX.Landing.Component.Filter.announce = (message, politeness) =>
	{
		pendingAnnouncement = {message: message, politeness: politeness};

		if (announceTimerId !== null)
		{
			clearTimeout(announceTimerId);
		}

		announceTimerId = setTimeout(() =>
		{
			announceTimerId = null;
			const announcement = pendingAnnouncement;
			pendingAnnouncement = null;

			if (announcement === null)
			{
				return;
			}

			BX.Landing.Component.Filter.announceNow(announcement.message, announcement.politeness);
		}, 500);
	};

	BX.Landing.Component.Filter.closestCardId = (element) =>
	{
		const card = element.closest ? element.closest('.landing-sites__item[id]') : null;

		return card ? card.id : null;
	};

	BX.Landing.Component.Filter.controlKeyOf = (element) =>
	{
		if (element.dataset && element.dataset.testid)
		{
			return {type: 'testid', value: element.dataset.testid};
		}

		if (element.id)
		{
			return {type: 'id', value: element.id};
		}

		const firstClass = element.classList && element.classList.length > 0 ? element.classList[0] : null;

		return {
			type: 'tag',
			value: element.tagName.toLowerCase(),
			className: firstClass,
		};
	};

	BX.Landing.Component.Filter.cardSelector = (cardId) =>
	{
		return '[id="' + cardId + '"]';
	};

	BX.Landing.Component.Filter.findControl = (container, controlKey) =>
	{
		if (controlKey.type === 'testid')
		{
			return [...container.querySelectorAll('[data-testid]')]
				.find((element) => element.dataset.testid === controlKey.value)
				|| null;
		}

		if (controlKey.type === 'id')
		{
			const element = document.getElementById(controlKey.value);

			return element && container.contains(element) ? element : null;
		}

		const elements = [...container.getElementsByTagName(controlKey.value)];
		if (!controlKey.className)
		{
			return elements[0] || null;
		}

		return elements.find((element) => element.classList.contains(controlKey.className)) || null;
	};

	BX.Landing.Component.Filter.saveFocusAnchor = (workArea) =>
	{
		const active = document.activeElement;
		let anchor = null;
		if (active && workArea.contains(active))
		{
			anchor = {
				cardId: BX.Landing.Component.Filter.closestCardId(active),
				controlKey: BX.Landing.Component.Filter.controlKeyOf(active),
			};
		}

		return anchor;
	};

	BX.Landing.Component.Filter.restoreFocusAnchor = (workArea, anchor) =>
	{
		if (!anchor)
		{
			return;
		}

		let target = null;
		const card = anchor.cardId
			? workArea.querySelector(BX.Landing.Component.Filter.cardSelector(anchor.cardId))
			: null;
		if (card)
		{
			target = BX.Landing.Component.Filter.findControl(card, anchor.controlKey);
		}
		if (!target)
		{
			target = workArea;
			if (!workArea.hasAttribute('tabindex'))
			{
				workArea.setAttribute('tabindex', '-1');
			}
		}
		target.focus({preventScroll: true});
	};

	BX.Landing.Component.Filter.onFilterCallback = (id, data, filter) =>
	{
		// the toolbar state follows the applied filter, so it is synced before any early return,
		// but only for the own filter: BX.Landing.Filter:apply comes without arguments at all
		if (filter && id === BX.Landing.Component.Filter.filterId)
		{
			const currValues = filter.getFilterFieldsValues();
			if (currValues.DELETED === 'Y')
			{
				BX.Landing.Component.Filter.createButton?.setDisabled(true);
				BX.Landing.Component.Filter.createFolderButton?.setDisabled(true);
				BX.Landing.Component.Filter.recycleBinButton?.setProps({'aria-pressed': 'true'});
			}
			else
			{
				BX.Landing.Component.Filter.createButton?.setDisabled(false);
				BX.Landing.Component.Filter.createFolderButton?.setDisabled(false);
				BX.Landing.Component.Filter.recycleBinButton?.setProps({'aria-pressed': 'false'});
			}
		}

		if (BX.Landing.Component.Filter.ajaxPath === null)
		{
			return;
		}

		if (BX.Landing.Component.Filter.ajaxSend)
		{
			return;
		}
		BX.Landing.Component.Filter.ajaxSend = true;

		const workArea = BX('workarea-content') || BX('air-workarea-content');
		const sitesArea = BX('landing-sites');
		let loaderContainer = null;
		let loader = null;
		if (!sitesArea)
		{
			loaderContainer = BX.create('div', {
				attrs: {
					className: 'landing-filter-loading',
					role: 'status',
				},
			});
			document.body.appendChild(loaderContainer);
			loader = new BX.Loader({size: 130, color: '#bfc3c8'});
			loader.show(loaderContainer);
		}

		BX.ajax({
			method: 'POST',
			dataType: 'html',
			url: BX.Landing.Component.Filter.ajaxPath,
			onsuccess: function (data)
			{
				BX.Landing.Component.Filter.ajaxSend = false;
				if (loader)
				{
					loader.hide();
				}
				if (loaderContainer)
				{
					loaderContainer.classList.add('landing-filter-loading-hide');
				}
				const anchor = BX.Landing.Component.Filter.saveFocusAnchor(workArea);
				// let open card dialogs release their focus trap (inert) before their DOM is discarded
				BX.Event.EventEmitter.emit('BX.Landing.SiteTile:beforeGridRefresh');
				workArea.innerHTML = data;
				// BX.ajax executes response scripts after onsuccess, and only they rebuild the card grid
				setTimeout(function ()
				{
					BX.Landing.Component.Filter.restoreFocusAnchor(workArea, anchor);
					BX.Landing.Component.Filter.announce(BX.message('LANDING_FILTER_LIST_UPDATED'), 'polite');
				}, 0);
			},
			onfailure: function ()
			{
				BX.Landing.Component.Filter.ajaxSend = false;
				if (loader)
				{
					loader.hide();
				}
				if (loaderContainer)
				{
					loaderContainer.classList.add('landing-filter-loading-hide');
				}
				BX.Landing.Component.Filter.announce(BX.message('LANDING_FILTER_LIST_UPDATE_ERROR'), 'assertive');
			},
		});
	};

	BX.Landing.Component.Filter.onSettingsClick = (button) => {
		if (BX.Landing.Component.Filter.settingsButtons === null)
		{
			return;
		}

		const lastLocation = top.location.toString();
		const events = {
			onClose: () =>
			{
				if (window['landingSettingsSaved'] === true)
				{
					top.location = lastLocation;
				}

				if (BX.PopupMenu.getCurrentMenu())
				{
					BX.PopupMenu.getCurrentMenu().close();
				}
			},
		};

		const landingSettingsButtons = BX.Landing.Component.Filter.settingsButtons;
		if (landingSettingsButtons.length === 1)
		{
			const item = landingSettingsButtons[0];
			const skipSlider = item.dataset && item.dataset.skipSlider === true;
			if (!skipSlider)
			{
				BX.SidePanel.Instance.open(item.href, {
					allowChangeHistory: false,
					events,
				});
			}
		}
		else
		{
			for (let i = 0, c = landingSettingsButtons.length; i < c; i++)
			{
				landingSettingsButtons[i].onclick = (event, item) =>
				{
					const skipSlider = item && item.dataset && item.dataset.skipSlider === true;
					if (!skipSlider)
					{
						BX.SidePanel.Instance.open(item.href, {
							allowChangeHistory: false,
							events,
						});

						BX.PreventDefault(event);
					}
					BX.PopupMenu.getMenuById('landing-menu-settings').close();
				};
			}

			let menu = BX.PopupMenu.getMenuById('landing-menu-settings');
			if (!menu)
			{
				menu = BX.Main.MenuManager.create({
					id: 'landing-menu-settings',
					bindElement: button.button,
					autoHide: true,
					zIndex: 1200,
					offsetLeft: 20,
					angle: true,
					closeByEsc: true,
					items: landingSettingsButtons,
					// the menu outlives a single click, so the trigger state is bound to the popup here
					events: {
						onPopupShow: () => {
							button.setProps({'aria-expanded': 'true'});
						},
						onPopupClose: () => {
							button.setProps({'aria-expanded': 'false'});
						},
					},
				});
			}
			if (menu)
			{
				menu.show();
			}
		}
		BX.PreventDefault(event);
	};

	BX.Landing.Component.Filter.onCreateDropdownItemClick = (itemCode, targetUrl = '') =>
	{
		const notifyPromise = BX.Landing.Component.Filter.notifyCreateMenuItemClick(itemCode);

		if (itemCode === 'generate_gpt')
		{
			if (targetUrl)
			{
				top.location.href = targetUrl;
			}
		}
		else if (itemCode === 'select_template')
		{
			if (targetUrl)
			{
				BX.SidePanel.Instance.open(targetUrl, {
					allowChangeHistory: false,
				});
			}
		}
		else if (itemCode === 'build_yourself')
		{
			notifyPromise.then((response) => {
				const data = response && response.data ? response.data : null;
				const redirectUrl = data ? data.redirectUrl : '';
				const isSuccess = data ? data.success === true : false;
				if (redirectUrl)
				{
					top.location.href = redirectUrl;
					return;
				}

				if (!isSuccess)
				{
					const message = data && data.message ? data.message : 'Failed to create an empty site.';
					console.error('[Landing.Filter] build_yourself failed:', message, data);
				}
			}).catch((error) => {
				console.error('[Landing.Filter] build_yourself action error:', error);
			});
		}

		BX.PopupMenu.getCurrentMenu()?.close();
	};

	BX.Landing.Component.Filter.notifyCreateMenuItemClick = (itemCode) =>
	{
		if (!BX.Landing.Component.Filter.componentName || !BX.Landing.Component.Filter.signedParameters)
		{
			console.error(
				'[Landing.Filter] create menu action skipped: missing componentName/signedParameters',
				{
					componentName: BX.Landing.Component.Filter.componentName,
					signedParameters: BX.Landing.Component.Filter.signedParameters,
				},
			);
			return Promise.resolve({ data: null });
		}

		return BX.ajax.runComponentAction(
			BX.Landing.Component.Filter.componentName,
			'createMenuItemClick',
			{
				mode: 'class',
				signedParameters: BX.Landing.Component.Filter.signedParameters,
				data: {
					itemCode: itemCode,
				},
			}
		);
	};

	BX.Landing.Component.Filter.folderCreating = false;
	BX.Landing.Component.Filter.folderErrorDialogOpen = false;
	BX.Landing.Component.Filter.folderTrigger = null;

	BX.Landing.Component.Filter.onFolderCreateClick = (button) =>
	{
		if (!BX.Landing.Component.Filter.canCreateFolder)
		{
			return;
		}

		// the flag belongs to submitFolder and its handlers: a click while the request is in flight
		// must not release the protection against a second Site::addFolder
		if (BX.Landing.Component.Filter.folderCreating)
		{
			return;
		}

		const createFolderEl = button.button;
		if (!createFolderEl)
		{
			return;
		}

		BX.Landing.Component.Filter.folderTrigger = createFolderEl;

		const folderCard = BX.Landing.Component.Filter.getFolderCard();
		// the card is reattached on demand, so it stays detached only when the page has no
		// placeholder at all: nothing opens then and nothing must be announced
		if (!folderCard.isConnected)
		{
			return;
		}

		BX.style(folderCard, 'display', 'block');
		BX.focus(BX.Landing.Component.Filter.getFolderText());
		// announced past the debounced queue: it must not displace a pending list update message
		BX.Landing.Component.Filter.announceNow(BX.message('LANDING_FILTER_FOLDER_NAME_INPUT_OPENED'), 'polite');
	};

	BX.Landing.Component.Filter.submitFolder = () =>
	{
		const createFolderEl = BX.Landing.Component.Filter.folderTrigger;
		if (BX.Landing.Component.Filter.folderCreating || !createFolderEl)
		{
			return;
		}

		// the popup keeps no focus trap here, so the input stays alive under the error dialog:
		// Enter is the natural way to dismiss the alert and must not send a second Site::addFolder
		if (BX.Landing.Component.Filter.folderErrorDialogOpen)
		{
			return;
		}

		const createFolderText = BX.Landing.Component.Filter.getFolderText();
		const title = createFolderText.value.trim();
		if (title === '')
		{
			return;
		}

		BX.Landing.Component.Filter.folderCreating = true;

		BX.ajax({
			url: '/bitrix/tools/landing/ajax.php?' +
				'action=Site::addFolder&' +
				'type=' + BX.data(createFolderEl, 'type'),
			method: 'POST',
			data: {
				data: {
					siteId: BX.data(createFolderEl, 'siteId'),
					fields: {
						TITLE: title,
						PARENT_ID: BX.data(createFolderEl, 'folderId'),
					},
				},
				sessid: BX.message('bitrix_sessid'),
			},
			dataType: 'json',
			onsuccess: function (data)
			{
				// the request is over whatever the response looks like, so the flag is released here only
				BX.Landing.Component.Filter.folderCreating = false;

				if (
					typeof data.type !== 'undefined' &&
					typeof data.result !== 'undefined'
				)
				{
					if (data.type === 'error')
					{
						// read before any flag is raised: a malformed error response must not leave
						// folderErrorDialogOpen set with no dialog to release it
						const errorItem = data.result[0];
						if (!errorItem)
						{
							return;
						}

						var msg = BX.Landing.UI.Tool.ActionDialog.getInstance();
						// the input keeps the focus under the alert, so Enter and Escape still reach it:
						// while the dialog is up they must neither resend the request nor cancel the card
						BX.Landing.Component.Filter.folderErrorDialogOpen = true;
						const promise = msg.show({
							content: errorItem.error_description,
							confirm: 'OK',
							type: 'alert',
						});
						const popupWindow = msg.popup.getPopupWindow();
						// the dialog promise settles on the confirm button only, and the popup is shared,
						// so any way of closing it has to lead to the same state: flag released,
						// duplicate name dropped, focus back in the input
						let errorDialogReleased = false;
						const releaseErrorDialog = function ()
						{
							if (errorDialogReleased)
							{
								return;
							}
							errorDialogReleased = true;

							BX.removeCustomEvent(popupWindow, 'onPopupClose', releaseErrorDialog);
							BX.Landing.Component.Filter.folderErrorDialogOpen = false;

							if (errorItem.error === 'FOLDER_IS_NOT_UNIQUE')
							{
								createFolderText.value = '';
							}

							// the confirm button, the close cross or the user moved the focus out
							// of the input, so it is returned there
							BX.fireEvent(createFolderEl, 'click');
						};
						BX.addCustomEvent(popupWindow, 'onPopupClose', releaseErrorDialog);
						promise.then(releaseErrorDialog, releaseErrorDialog);

						// the dialog is a visual only alert: no role, no focus trap, the focus stays
						// in the input, so the live region is the only way the error reaches a screen reader
						BX.Landing.Component.Filter.announceNow(errorItem.error_description, 'assertive');
					}
					else
					{
						window.location.reload();
					}
				}
			},
			onfailure: function ()
			{
				BX.Landing.Component.Filter.folderCreating = false;
			},
		});
	};

	// returns true when the card was really closed, false when there was nothing to cancel
	BX.Landing.Component.Filter.cancelFolder = (returnFocus) =>
	{
		// the card is frozen while the request is in flight and while the error dialog is open:
		// in both cases the typed name has to survive
		if (BX.Landing.Component.Filter.folderCreating || BX.Landing.Component.Filter.folderErrorDialogOpen)
		{
			return false;
		}

		const folderCard = BX.Landing.Component.Filter.getFolderCard();
		if (folderCard.style.display !== 'block')
		{
			return false;
		}

		BX.Landing.Component.Filter.getFolderText().value = '';
		BX.style(folderCard, 'display', 'none');

		if (returnFocus)
		{
			BX.focus(BX.Landing.Component.Filter.folderTrigger);
		}

		return true;
	};
	BX.Landing.Component.Filter.folderCard = null;
	// the placeholder lives inside the work area, so a list refresh discards it together with the
	// inserted card: the cached card has to be attached to the current placeholder again
	const attachFolderCard = (folderCard) =>
	{
		BX.insertAfter(folderCard, document.body.querySelector('.landing-folder-placeholder'));
	};
	BX.Landing.Component.Filter.getFolderCard = () =>
	{
		if (BX.Landing.Component.Filter.folderCard)
		{
			if (!BX.Landing.Component.Filter.folderCard.isConnected)
			{
				attachFolderCard(BX.Landing.Component.Filter.folderCard);
			}

			return BX.Landing.Component.Filter.folderCard;
		}

		const createFolderText = BX.Landing.Component.Filter.getFolderText();

		const folderCard = BX.create('div', {
			props: {
				className: 'landing-item landing-item-folder',
			},
			attrs: {
				'data-testid': 'landing-filter-folder-card',
			},
			children: [
				BX.create('div', {
					props: {
						className: 'landing-title',
					},
					children: [
						BX.create('div', {
							props: {
								className: 'landing-title-wrap',
							},
							children: [
								BX.create('div', {
									props: {
										className: 'landing-title-overflow --create-folder-input',
									},
									children: [
										createFolderText,
									],
								}),
							],
						}),
					],
				}),
				BX.create('div', {
					props: {
						className: 'landing-item-cover',
					},
					children: [
						BX.create('div', {
							props: {
								className: 'landing-item-preview',
							},
						}),
						BX.create('div', {
							props: {
								className: 'landing-item-folder-corner',
							},
							children: [
								BX.create('div', {
									props: {
										className: 'landing-item-folder-dropdown',
									},
								}),
							],
						}),
					],
				}),
			],
		});

		BX.style(folderCard, 'display', 'none');
		BX.Landing.Component.Filter.folderCard = folderCard;
		attachFolderCard(folderCard);

		return folderCard;
	};
	BX.Landing.Component.Filter.folderText = null;
	BX.Landing.Component.Filter.getFolderText = () =>
	{
		if (BX.Landing.Component.Filter.folderText)
		{
			return BX.Landing.Component.Filter.folderText;
		}

		const inputAttrs = {
			'data-testid': 'landing-filter-folder-name-input',
		};
		// a missing phrase would be written as the accessible name "null", which is worse than none
		const inputLabel = BX.message('LANDING_TPL_FOLDER_NAME_INPUT_LABEL');
		if (inputLabel)
		{
			inputAttrs['aria-label'] = inputLabel;
		}

		// the input is created once, so its listeners are bound once too
		const createFolderText = BX.create('input', {
			props: {
				type: 'text',
			},
			attrs: inputAttrs,
			events: {
				keydown: (event) =>
				{
					if (event.key === 'Enter')
					{
						BX.Landing.Component.Filter.submitFolder();
					}
					else if (event.key === 'Escape')
					{
						// keep the page level layers from closing on the same Escape,
						// but only when this Escape really closed the card
						if (BX.Landing.Component.Filter.cancelFolder(true))
						{
							event.stopPropagation();
						}
					}
				},
				// losing focus is not a trigger of its own: the card stays open with the typed name,
				// so the user can come back to the input and finish it
			},
		});

		BX.Landing.Component.Filter.folderText = createFolderText;

		return createFolderText;
	};
})();

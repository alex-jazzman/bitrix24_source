;(function ()
{
	'use strict';

	BX.namespace('BX.Landing.Component.Filter');

	BX.Landing.Component.Filter.filterId = null;
	BX.Landing.Component.Filter.canCreateFolder = false;
	BX.Landing.Component.Filter.createButton = null;
	BX.Landing.Component.Filter.createFolderButton = null;
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
		}

		if (toolbar && BX.Type.isString(params.landingCreateFolderButtonId))
		{
			BX.Landing.Component.Filter.createFolderButton = toolbar.getButton(params.landingCreateFolderButtonId);
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

			BX.Runtime.loadExtension('ui.a11y').then((exports) =>
			{
				exports.LiveAnnouncer.announce(announcement.message, announcement.politeness);
			});
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
		if (BX.Landing.Component.Filter.ajaxPath === null)
		{
			return;
		}

		if (BX.Landing.Component.Filter.ajaxSend)
		{
			return;
		}
		BX.Landing.Component.Filter.ajaxSend = true;

		if (filter)
		{
			const currValues = filter.getFilterFieldsValues();
			if (currValues.DELETED === 'Y')
			{
				BX.Landing.Component.Filter.createButton?.setDisabled(true);
				BX.Landing.Component.Filter.createFolderButton?.setDisabled(true);
			}
			else
			{
				BX.Landing.Component.Filter.createButton?.setDisabled(false);
				BX.Landing.Component.Filter.createFolderButton?.setDisabled(false);
			}
		}

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

	BX.Landing.Component.Filter.onFolderCreateClick = (button) =>
	{
		if (!BX.Landing.Component.Filter.canCreateFolder)
		{
			return;
		}

		const createFolderEl = button.button;
		if (!createFolderEl)
		{
			return;
		}

		const folderCard = BX.Landing.Component.Filter.getFolderCard();
		const createFolderText = BX.Landing.Component.Filter.getFolderText();

		let folderCreating = false;

		function ajaxAddFolder()
		{
			if (folderCreating)
			{
				return;
			}

			folderCreating = true;

			BX.ajax({
				url: '/bitrix/tools/landing/ajax.php?' +
					'action=Site::addFolder&' +
					'type=' + BX.data(createFolderEl, 'type'),
				method: 'POST',
				data: {
					data: {
						siteId: BX.data(createFolderEl, 'siteId'),
						fields: {
							TITLE: createFolderText.value,
							PARENT_ID: BX.data(createFolderEl, 'folderId'),
						},
					},
					sessid: BX.message('bitrix_sessid'),
				},
				dataType: 'json',
				onsuccess: function (data)
				{
					if (
						typeof data.type !== 'undefined' &&
						typeof data.result !== 'undefined'
					)
					{
						if (data.type === 'error')
						{
							var msg = BX.Landing.UI.Tool.ActionDialog.getInstance();
							msg.show({
								content: data.result[0].error_description,
								confirm: 'OK',
								type: 'alert',
							}).then(
								function ()
								{
									folderCreating = false;

									if (data.result[0].error === 'FOLDER_IS_NOT_UNIQUE')
									{
										createFolderText.value = '';
										createFolderText.focus();
									}
									else
									{
										BX.fireEvent(createFolderEl, 'click');
									}
								},
							);
						}
						else
						{
							window.location.reload();
						}
					}
				},
				onfailure: function (error)
				{
					folderCreating = false;
				},
			});
		}

		createFolderText.addEventListener('keydown', function (event)
		{
			if (event.keyCode === 13)
			{
				ajaxAddFolder();
			}
		});

		createFolderText.addEventListener('blur', function ()
		{
			if (createFolderText.value.length !== 0)
			{
				ajaxAddFolder();
			}
		});

		BX.style(folderCard, 'display', 'block');
		BX.focus(createFolderText);
	};
	BX.Landing.Component.Filter.folderCard = null;
	BX.Landing.Component.Filter.getFolderCard = () =>
	{
		if (BX.Landing.Component.Filter.folderCard)
		{
			return BX.Landing.Component.Filter.folderCard;
		}

		const createFolderText = BX.Landing.Component.Filter.getFolderText();

		const folderCard = BX.create('div', {
			props: {
				className: 'landing-item landing-item-folder',
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
		BX.insertAfter(folderCard, document.body.querySelector(".landing-folder-placeholder"));

		return folderCard;
	};
	BX.Landing.Component.Filter.folderText = null;
	BX.Landing.Component.Filter.getFolderText = () =>
	{
		if (BX.Landing.Component.Filter.folderText)
		{
			return BX.Landing.Component.Filter.folderText;
		}

		const createFolderText = BX.create('input', {
			props: {
				type: 'text',
			},
		});

		BX.Landing.Component.Filter.folderText = createFolderText;

		return createFolderText;
	};
})();

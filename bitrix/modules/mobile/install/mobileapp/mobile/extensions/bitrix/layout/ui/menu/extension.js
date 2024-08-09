/**
 * @module layout/ui/menu
 */
jn.define('layout/ui/menu', (require, exports, module) => {
	const { Alert } = require('alert');
	const { Feature } = require('feature');
	const { Color } = require('tokens');
	const { mergeImmutable } = require('utils/object');

	const DEFAULT_MENU_SECTION_NAME = 'main';

	const airStyleSupported = Feature.isAirStyleSupported();

	let iconsPath = '/bitrix/mobileapp/mobile/extensions/bitrix/layout/ui/menu/icons/';

	if (airStyleSupported)
	{
		iconsPath += 'outline-';
	}

	/**
	 * @class UIMenuType
	 */
	const Types = {
		DESKTOP: 'desktop',
		HELPDESK: 'helpdesk',
	};

	/**
	 * @class UIMenu
	 */
	class Menu
	{
		constructor(actions, options = {})
		{
			this.popup = null;
			this.provider = null;

			if (Array.isArray(actions))
			{
				this.provider = () => actions;
			}
			else if (typeof actions === 'function')
			{
				this.provider = actions;
			}

			if (!this.provider)
			{
				throw new TypeError('Incorrect type of actions');
			}
		}

		getPopup()
		{
			if (!this.popup)
			{
				this.popup = dialogs.createPopupMenu();
			}

			// @todo optional items recalculation?
			this.popup.setData(...this.getMenuConfig());

			return this.popup;
		}

		show(options = {})
		{
			const { target } = options;
			const popup = this.getPopup();

			if (target && typeof popup.setTarget === 'function')
			{
				popup.setTarget(target);
			}

			popup.show();
		}

		hide()
		{
			this.getPopup().hide();
		}

		getMenuConfig()
		{
			const actions = this.getPreparedMenuActions();

			const items = [];
			const sectionMap = new Map();
			const actionsFlatMap = new Map();

			for (const action of actions.values())
			{
				this.prepareActions(action, items, sectionMap, actionsFlatMap);
			}

			return [
				items,
				[...sectionMap.values()],
				(event, item) => {
					if (event === 'onItemSelected')
					{
						const action = actionsFlatMap.get(item.id);
						if (action && action.callbacks.onItemSelected)
						{
							action.callbacks.onItemSelected(event, item);
						}
					}
				},
			];
		}

		prepareActions(action, items, sectionMap, actionsFlatMap)
		{
			items.push(action.params);

			const sectionCode = action.params?.sectionCode ?? DEFAULT_MENU_SECTION_NAME;
			let section = sectionMap.get(sectionCode);
			if (!section)
			{
				section = {
					id: sectionCode,
					title: action.params?.sectionTitle ?? '',
				};
				sectionMap.set(sectionCode, section);
			}
			else if (action.params?.sectionTitle)
			{
				section.title = action.params.sectionTitle;
			}

			if (action.params?.nextMenu?.items)
			{
				for (const item of action.params.nextMenu.items)
				{
					actionsFlatMap.set(item.id, { params: item, callbacks: { onItemSelected: item.onItemSelected } });
					if (item.nextMenu?.items)
					{
						this.prepareActions({ params: item }, items, sectionMap, actionsFlatMap);
					}
				}
			}

			if (actionsFlatMap.has(action.params.id))
			{
				console.warn(`${action.params.id} already exists in actionsFlatMap so it was overwritten, check that all menu items have a unique ID`);
			}
			actionsFlatMap.set(action.params.id, action);
		}

		getActionConfigByType(type, showHint = true)
		{
			switch (type)
			{
				case Types.DESKTOP:
					return {
						id: 'desktop',
						title: BX.message('UI_MENU_ITEM_TYPE_DESKTOP_MSGVER_1'),
						iconUrl: `${iconsPath}desktop.png`,
						onItemSelected: (data) => () => {
							const promise = new Promise((resolve) => {
								const { qrUrl, qrUrlCallback } = data;
								if (qrUrl)
								{
									resolve(qrUrl);
								}
								else if (qrUrlCallback)
								{
									qrUrlCallback().then(resolve);
								}
							});

							promise.then((qrUrl) => {
								if (!qrUrl)
								{
									Alert.alert(
										BX.message('UI_MENU_ITEM_TYPE_QR_LINK_ERROR_TITLE'),
										BX.message('UI_MENU_ITEM_TYPE_QR_LINK_ERROR_TEXT'),
									);

									return;
								}

								qrauth.open({
									title: data.qrTitle || BX.message('UI_MENU_ITEM_TYPE_DESKTOP_MSGVER_1'),
									redirectUrl: qrUrl || '',
									showHint,
								});
							});
						},
					};

				case Types.HELPDESK:
					return {
						id: 'helpdesk',
						title: BX.message('UI_MENU_ITEM_TYPE_HELPDESK'),
						iconUrl: `${iconsPath}helpdesk.png`,
						onItemSelected: (data) => () => {
							helpdesk.openHelpArticle(data.articleCode, 'helpdesk');
						},
					};
			}

			throw new Error(`Not supported type ${type} of menu item in context menu.`);
		}

		getPreparedMenuActions()
		{
			const result = new Map();

			this.provider().forEach((action) => {
				if (action.type)
				{
					const showHint = (action.showHint === undefined ? true : action.showHint);
					action = {
						...this.getActionConfigByType(action.type, showHint),
						...action,
					};
					action.onItemSelected = action.onItemSelected(action.data);
				}

				const disable = BX.prop.getBoolean(action, 'disable', false);
				const isDestructive = BX.prop.getBoolean(action, 'isDestructive', false);
				const destructiveStyles = {
					title: {
						font: {
							color: Color.accentMainAlert.toHex(),
						},
					},
					icon: {
						color: Color.accentMainAlert.toHex(),
					},
				};

				const styles = mergeImmutable(
					isDestructive ? destructiveStyles : {},
					action.style ?? {},
				);

				result.set(action.id, {
					params: {
						id: action.id,
						testId: action.testId,
						title: action.title,
						iconUrl: this.getIconUrl(action),
						iconName: this.getIconName(action),
						showTopSeparator: action.showTopSeparator || false,
						checked: action.checked || false,
						showCheckedIcon: action.showCheckedIcon,
						sectionCode: action.sectionCode || DEFAULT_MENU_SECTION_NAME,
						sectionTitle: action.sectionTitle || '',
						disable,
						counterValue: action.counterValue || null,
						counterStyle: action.counterStyle || null,
						nextMenu: action.nextMenu || null,
						styles,
					},
					callbacks: {
						onItemSelected: action.onItemSelected,
					},
				});
			});

			return result;
		}

		/**
		 * @param action
		 * @returns {string}
		 */
		getIconUrl(action)
		{
			const iconUrl = action?.iconUrl;

			if (Application.isBeta() && iconUrl)
			{
				console.warn(`UIMenu: Please use the iconName parameter instead of <<${iconUrl}>>.`);
			}

			return iconUrl;
		}

		/**
		 * @param action
		 * @returns {string}
		 */
		getIconName(action)
		{
			const icon = action?.iconName;
			const isStringIcon = typeof icon === 'string';

			if (!icon)
			{
				return null;
			}

			if (Application.isBeta() && isStringIcon)
			{
				console.warn(`UIMenu: You are using an deprecated icon "<<${icon}>>" type, you need to use enums "Icon.<name your icon>", example "cont { Icon } = require('assets/icons');`);
			}

			if (isStringIcon)
			{
				return icon;
			}

			return icon?.getIconName?.();
		}
	}

	module.exports = {
		UIMenu: Menu,
		UIMenuType: Types,
	};
});

(() => {
	const { UIMenu, UIMenuType } = jn.require('layout/ui/menu');

	this.UI = this.UI || {};
	this.UI.Menu = UIMenu;
	this.UI.Menu.Types = UIMenuType;
})();

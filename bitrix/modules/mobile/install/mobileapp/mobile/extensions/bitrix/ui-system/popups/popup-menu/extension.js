/**
 * @module ui-system/popups/popup-menu
 */
jn.define('ui-system/popups/popup-menu', (require, exports, module) => {
	const { Alert } = require('alert');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { withCurrentDomain } = require('utils/url');
	const { isNil, isBoolean } = require('utils/type');
	const { qrauth } = require('qrauth/utils');
	const { mergeImmutable, isFunction, omitBy } = require('utils/object');
	const { MenuPosition } = require('ui-system/popups/popup-menu/src/menu-position');
	const { Icon } = require('assets/icons');
	const { MenuType } = require('ui-system/popups/popup-menu/src/menu-type');

	const instanceCache = {};
	const DEFAULT_MENU_SECTION_NAME = 'main';

	const Types = MenuType.getTypes();

	/**
	 * @class PopupMenu
	 */
	class PopupMenu
	{
		/** @type {DialogPopupMenu} */
		#popupMenu;
		/** @type {(() => Array<PopupMenuActionItem>)|null} */
		#provider;
		/** @type {Map<string, PopupMenuActionItem>} */
		#itemsFlatMap = new Map();
		/** @type {Map<string, PopupMenuSection>} */
		#sectionsMap = new Map();
		/** @type {Map<string, PopupMenuItem>} */
		#itemsMap = new Map();
		/** @type {PopupMenuActionsData|null} */
		#actions = null;

		/**
		 * @param {(Array<PopupMenuActionItem>|(() => Array<PopupMenuActionItem>)|Object)} [actions]
		 * @param {Array<PopupMenuActionItem>} [actions.items]
		 * @param {Array<PopupMenuSection>} [actions.sections]
		 */
		constructor(actions)
		{
			this.setActions(actions);
		}

		/**
		 * @public
		 * @param {Object} params
		 * @param {string} params.cacheId
		 * @returns {PopupMenu}
		 */
		static create(params)
		{
			const cacheId = params?.cacheId;
			if (!cacheId || typeof cacheId !== 'string')
			{
				console.warn('PopupMenu: cacheId is not provided, the instance will not be cached.');
			}

			if (cacheId && instanceCache[cacheId])
			{
				return instanceCache[cacheId];
			}

			const instance = new PopupMenu();
			instance.#createPopupMenu();

			if (cacheId)
			{
				instanceCache[cacheId] = instance;
			}

			return instance;
		}

		/**
		 * @public
		 * @param {TargetRef} target
		 * @param {PopupMenuTargetParams} [targetParams]
		 */
		setTarget(target, targetParams)
		{
			this.#assertPopupMenuCreated('target');

			this.#popupMenu.setTarget(target, targetParams);

			return this;
		}

		/**
		 * @public
		 * @param {Array<PopupMenuSection>} sections
		 * @returns {PopupMenu}
		 */
		setSections(sections)
		{
			this.#updateSections(sections);

			return this;
		}

		/**
		 * @param {PopupMenuActionsData} actions
		 * @return {PopupMenu}
		 */
		setActions(actions)
		{
			this.#actions = actions;
			this.#createProvider(actions);

			return this;
		}

		/**
		 * @public
		 * @param {MenuPosition} position
		 */
		setPosition(position)
		{
			this.#assertPopupMenuCreated('position');
			if (MenuPosition.has(position))
			{
				this.#popupMenu.setPosition(position.toString());
			}
		}

		/**
		 * @public
		 * @param {PopupMenuShowOptions} [options]
		 */
		show(options = {})
		{
			const {
				target,
				targetParams,
				position,
			} = options;

			/**
			 * @description Backward compatibility: when called with no options,
			 * show the popup in the top right position (if no target is provided).
			 */
			if (!this.#popupMenu)
			{
				this.#createPopupMenu();
			}

			this.#updateSections(this.#actions?.sections);
			this.#updateItems(this.#provider?.());

			if (target)
			{
				this.setTarget(target, targetParams);
			}

			if (position)
			{
				this.setPosition(position);
			}

			this.setData(...this.#getMenuConfig());

			this.#popupMenu.show();
		}

		/**
		 * @public
		 */
		hide()
		{
			this.#popupMenu.hide();
		}

		/**
		 * @public
		 * @param {Array<PopupMenuItem>} items
		 * @param {Array<PopupMenuSectionItem>} sections
		 * @param {popupMenuCallback} callback
		 */
		setData(items, sections, callback)
		{
			this.#assertPopupMenuCreated('data');
			this.#popupMenu.setData(items, sections, callback);
		}

		/**
		 * @public
		 * @deprecated use setActions and setSections instead
		 * @param {() => Array<PopupMenuActionItem>} provider
		 */
		setProvider(provider)
		{
			this.#provider = provider;
		}

		/**
		 * @deprecated use getNativeElement instead
		 * @returns {DialogPopupMenu}
		 */
		getPopup()
		{
			return this.#popupMenu;
		}

		/**
		 * @return {DialogPopupMenu}
		 */
		getNativeElement()
		{
			return this.#popupMenu;
		}

		/**
		 * @param {Array<PopupMenuSection>} sections
		 */
		#updateSections(sections)
		{
			if (!Array.isArray(sections))
			{
				return;
			}

			sections.forEach((section) => {
				const formattedSection = {
					id: section.id,
					title: section.title,
					iconUrl: this.#resolveIconUrl(section),
					iconName: this.#resolveIconName(section),
					styles: section.styles,
				};

				this.#sectionsMap.set(section.id, omitBy(formattedSection, isNil));
			});
		}

		#createProvider(actions)
		{
			const actionItems = this.#isProvider(actions) ? actions : actions?.items;

			if (Array.isArray(actionItems))
			{
				this.#provider = () => actionItems;
			}
			else if (isFunction(actionItems))
			{
				this.#provider = actionItems;
			}
		}

		#isProvider(actions)
		{
			return !Array.isArray(actions?.items) && !Array.isArray(actions?.sections);
		}

		/**
		 * @returns {PopupMenu}
		 */
		#createPopupMenu()
		{
			this.#popupMenu = dialogs.createPopupMenu();

			return this;
		}

		/**
		 * @param {popupMenuCallbackEvent} event
		 * @param {Partial<PopupMenuActionItem>} item
		 */
		#handleMenuEvent = (event, item) => {
			if (event === 'onItemSelected')
			{
				const action = this.#itemsFlatMap.get(item.id);

				action?.onItemSelected?.(event, item);
			}
		};

		/**
		 * @returns {[items: Array<PopupMenuItem>, sections: Array<PopupMenuSectionItem>, callback: popupMenuCallback]}
		 */
		#getMenuConfig()
		{
			return [
				[...this.#itemsMap.values()],
				[...this.#sectionsMap.values()],
				this.#handleMenuEvent,
			];
		}

		/**
		 * @param {Array<PopupMenuActionItem>} actions
		 */
		#updateItems(actions)
		{
			if (!Array.isArray(actions))
			{
				return;
			}

			this.#itemsFlatMap.clear();
			this.#itemsMap.clear();

			actions.forEach((action) => {
				const item = this.#formatMenuItem(action);
				const sectionCode = item.sectionCode ?? DEFAULT_MENU_SECTION_NAME;
				const section = this.#sectionsMap.get(sectionCode);

				if (!section)
				{
					this.#sectionsMap.set(sectionCode, this.#prepareSection(item, sectionCode, section));
				}

				this.#itemsMap.set(item.id, this.#filterItem(item));
			});
		}

		/**
		 * @param {PopupMenuActionItem} item
		 * @returns {Partial<PopupMenuItem>}
		 */
		#filterItem(item)
		{
			const { sectionTitle, onItemSelected, ...restItem } = item;

			return omitBy(restItem, isNil);
		}

		/**
		 * @param {Partial<PopupMenuActionItem>} item
		 * @param {string} sectionCode
		 * @param {PopupMenuSection} prevSection
		 * @returns {PopupMenuSection}
		 */
		#prepareSection(item, sectionCode, prevSection)
		{
			if (!prevSection)
			{
				return {
					id: sectionCode,
					title: item?.sectionTitle ?? '',
				};
			}

			if (item?.sectionTitle && item.sectionTitle !== prevSection.title)
			{
				return {
					...prevSection,
					title: item.sectionTitle,
				};
			}

			return prevSection;
		}

		/**
		 * @param {Partial<PopupMenuActionItem>} item
		 */
		#addItemToFlatMap(item)
		{
			if (this.#itemsFlatMap.has(item.id))
			{
				console.warn(`${item.id} already exists in actionsFlatMap so it was overwritten, check that all menu items have a unique ID`);
			}

			this.#itemsFlatMap.set(item.id, item);
		}

		/**
		 * @param {PopupMenuActionItem} action
		 * @returns {Partial<PopupMenuActionItem>}
		 */
		#getMenuItemConfigByType(action)
		{
			switch (action.type)
			{
				case Types.DESKTOP:
					return this.#formatDesktopMenuItem(action);

				case Types.HELPDESK:
					return this.#formatHelpdeskMenuItem(action);

				default:
					throw new Error(`Not supported type ${action.type} of menu item in context menu.`);
			}
		}

		/**
		 * @param {PopupMenuActionItem} action
		 * @returns {PopupMenuStyles}
		 */
		#getMenuItemStyles(action)
		{
			const isDestructive = action.isDestructive || action.destructive;
			const styles = action.styles || action.style;

			if (!isDestructive)
			{
				return styles;
			}

			return mergeImmutable(styles, {
				title: {
					font: {
						color: Color.accentMainAlert.toHex(),
					},
				},
				icon: {
					color: Color.accentMainAlert.toHex(),
				},
			});
		}

		/**
		 * @param {PopupMenuActionItem} action
		 * @param {'iconUrl'|'iconName'} primaryProp
		 * @param {function} getFromIcon
		 * @param {function} [transform]
		 * @returns {string|null}
		 */
		#resolveIconProperty(action, primaryProp, getFromIcon, transform)
		{
			const icon = action?.icon;
			const value = action?.[primaryProp];

			if (!value && !icon)
			{
				return null;
			}

			const isStringValue = typeof value === 'string';

			if (Application.isBeta() && isStringValue)
			{
				console.warn(`PopupMenu: You are using an deprecated icon "<<${value}>>" type, you need to use enums "Icon.<name your icon>", example "cont { Icon } = require('assets/icons');`);
			}

			if (isStringValue)
			{
				return transform ? transform(value) : value;
			}

			return getFromIcon(icon, value);
		}

		/**
		 * @param {PopupMenuActionItem|PopupMenuSection} action
		 * @returns {string|null}
		 */
		#resolveIconUrl(action)
		{
			return this.#resolveIconProperty(
				action,
				'iconUrl',
				(icon) => withCurrentDomain(icon?.getPath()),
				withCurrentDomain,
			);
		}

		/**
		 * @param {string|Color} textColor
		 * @return string|null
		 */
		#resolveTextColor(textColor)
		{
			if (!textColor)
			{
				return null;
			}

			if (Color.has(textColor))
			{
				return textColor.toHex();
			}

			return textColor;
		}

		/**
		 * @param {PopupMenuActionItem|PopupMenuSection} action
		 * @returns {string|null}
		 */
		#resolveIconName(action)
		{
			return this.#resolveIconProperty(
				action,
				'iconName',
				(icon, iconName) => icon?.getIconName?.() || iconName?.getIconName?.(),
			);
		}

		/**
		 * @param {string} action
		 */
		#assertPopupMenuCreated(action = '')
		{
			if (!this.#popupMenu)
			{
				throw new Error(
					`PopupMenu: popup menu is not created. Please call createPopupMenu() before setting ${action}.`,
				);
			}
		}

		/**
		 * @param action
		 * @returns {Partial<PopupMenuActionItem>}
		 */
		#formatHelpdeskMenuItem(action)
		{
			const actionData = action.data || {};

			return ({
				id: Types.HELPDESK,
				title: Loc.getMessage('POPUP_MENU_ITEM_TYPE_HELPDESK'),
				icon: Icon.QUESTION,
				onItemSelected: () => {
					helpdesk.openHelpArticle(actionData.articleCode, Types.HELPDESK);
				},
			});
		}

		/**
		 * @param {PopupMenuActionItem} action
		 * @returns {Partial<PopupMenuActionItem>}
		 */
		#formatDesktopMenuItem(action)
		{
			const actionData = action.data || {};

			return ({
				id: Types.DESKTOP,
				title: Loc.getMessage('POPUP_MENU_ITEM_TYPE_DESKTOP'),
				icon: Icon.GO_TO,
				onItemSelected: () => {
					const { qrUrl } = actionData;

					if (!qrUrl)
					{
						Alert.alert(
							Loc.getMessage('POPUP_MENU_ITEM_TYPE_QR_LINK_ERROR_TITLE'),
							Loc.getMessage('POPUP_MENU_ITEM_TYPE_QR_LINK_ERROR_TEXT'),
						);

						return;
					}

					let showHint = true;
					if (isBoolean(actionData.showHint) || isBoolean(action.showHint))
					{
						showHint = actionData.showHint ?? action.showHint;
					}

					const { qrTitle, analyticsSection } = actionData;

					void qrauth.open({
						showHint,
						redirectUrl: qrUrl,
						title: qrTitle || Loc.getMessage('POPUP_MENU_ITEM_TYPE_DESKTOP'),
						analyticsSection: analyticsSection || '',
					});
				},
			});
		}

		/**
		 * @param {PopupMenuActionItem} action
		 * @returns {PopupMenuActionItem}
		 */
		#formatMenuItem(action)
		{
			let mergedConfig = action;
			if (action.type)
			{
				mergedConfig = { ...mergedConfig, ...this.#getMenuItemConfigByType(mergedConfig) };
			}

			const item = {
				id: mergedConfig.id,
				testId: mergedConfig.testId,
				title: mergedConfig.title,
				subtitle: mergedConfig.subtitle,
				titleBadgeValue: mergedConfig.titleBadgeValue,
				textColor: this.#resolveTextColor(mergedConfig.textColor),
				iconUrl: this.#resolveIconUrl(mergedConfig),
				iconName: this.#resolveIconName(mergedConfig),
				showTopSeparator: Boolean(mergedConfig.showTopSeparator),
				checked: Boolean(mergedConfig.checked) || Boolean(mergedConfig.showCheckedIcon),
				sectionCode: mergedConfig.sectionCode || DEFAULT_MENU_SECTION_NAME,
				sectionTitle: mergedConfig.sectionTitle || '',
				counterValue: mergedConfig.counterValue || null,
				counterStyle: mergedConfig.counterStyle || null,
				nextMenu: this.#formatNextMenu(mergedConfig.nextMenu),
				disable: Boolean(mergedConfig.disable),
				styles: this.#getMenuItemStyles(mergedConfig),
				onItemSelected: mergedConfig.onItemSelected,
			};

			this.#addItemToFlatMap(item);

			return item;
		}

		/**
		 * @param {PopupMenuActionNextMenu} nextMenu
		 * @returns {PopupMenuActionNextMenu}
		 */
		#formatNextMenu(nextMenu)
		{
			if (!nextMenu || !Array.isArray(nextMenu.items))
			{
				return nextMenu;
			}

			if (!Array.isArray(nextMenu.sections) || nextMenu.sections.length === 0)
			{
				console.warn(
					'PopupMenu: nextMenu.items provided but nextMenu.sections missing. Example: { items: [...], sections: [{ id: "id", title: "Title" }] }',
				);
			}

			return {
				...nextMenu,
				items: nextMenu.items.map((item) => this.#formatMenuItem(item)),
			};
		}
	}

	module.exports = {
		PopupMenu,
		PopupMenuType: Types,
		PopupMenuPosition: MenuPosition,
	};
});

/**
 * @module crm/entity-tab/type/entities/base
 */
jn.define('crm/entity-tab/type/entities/base', (require, exports, module) => {
	const { Loc } = require('loc');
	const { EmptyScreen } = require('layout/ui/empty-screen');
	const { openChat } = require('crm/entity-tab/type/traits/open-chat');
	const { Icon } = require('ui-system/blocks/icon');
	const { FeatureBanner } = require('layout/ui/feature-banner');

	/**
	 * @class Base
	 */
	class Base
	{
		/**
		 * @param {Object} params
		 */
		constructor(params)
		{
			this.params = params || {};
		}

		/**
		 * @returns {Number}
		 */
		getId()
		{
			abstract();
		}

		/**
		 * @returns {String|Null}
		 */
		getName()
		{
			return null;
		}

		getCategoryId()
		{
			return this.params.categoryId || 0;
		}

		getUserInfo()
		{
			return this.params.userInfo || null;
		}

		getParentWidget()
		{
			return this.params.parentWidget || PageManager;
		}

		/**
		 * @returns {{
		 * image: object,
		 * title: string,
		 * list: array,
		 * description: string,
		 * onDescriptionLinkClick: function,
		 * }}
		 */
		getEmptyEntityScreenConfig()
		{
			const imageParams = this.getEmptyImage();
			const description = this.getEmptyEntityScreenDescriptionText();
			const title = this.getEmptyScreenTitle();
			const parentWidget = this.getParentWidget();

			return {
				image: Image(imageParams),
				title,
				description: description,
				onDescriptionLinkClick: (params) => this.showFeatureBanner(parentWidget, params?.url),
			};
		}

		showFeatureBanner(parentWidget, redirectUrl)
		{
			void FeatureBanner.show(parentWidget, {
				featureItems: [
					Loc.getMessage('M_CRM_ENTITY_TAB_COMMUNICATION_DESCRIPTION_BANNER_FEATURE_1'),
					Loc.getMessage('M_CRM_ENTITY_TAB_COMMUNICATION_DESCRIPTION_BANNER_FEATURE_2'),
					Loc.getMessage('M_CRM_ENTITY_TAB_COMMUNICATION_DESCRIPTION_BANNER_FEATURE_3'),
				],
				qrauth: {
					redirectUrl,
					analyticsSection: 'crm',
					title: Loc.getMessage('M_CRM_ENTITY_TAB_ENTITY_EMPTY_DESCRIPTION_REDIRECT_TITLE'),
				},
				title: Loc.getMessage('M_CRM_ENTITY_TAB_COMMUNICATION_DESCRIPTION_TITLE'),
				buttonText: Loc.getMessage('M_CRM_ENTITY_TAB_COMMUNICATION_DESCRIPTION_BANNER_BUTTON_TEXT'),
				params: {
					title: Loc.getMessage('M_CRM_ENTITY_TAB_COMMUNICATION_DESCRIPTION_BANNER_TITLE'),
				},
			});
		}

		getEmptyScreenTitle()
		{
			const entityTypeName = (this.getName() || 'COMMON');

			return this.getLastMessageVer(`M_CRM_ENTITY_TAB_ENTITY_EMPTY_TITLE2_${entityTypeName}`);
		}

		getEmptyColumnScreenConfig(data)
		{
			const imageParams = this.getEmptyImage();
			const screenConfig = {
				title: this.getEmptyColumnScreenTitle(),
				image: Image(imageParams),
			};

			const { column } = data;
			if (column && column.semantics === 'P')
			{
				screenConfig.description = this.getEmptyColumnScreenDescription();
			}

			return screenConfig;
		}

		getEmptyColumnScreenTitle()
		{
			const entityTypeName = this.getName();

			return this.getLastMessageVer(`M_CRM_ENTITY_TAB_COLUMN_EMPTY_${entityTypeName}_TITLE`);
		}

		getEmptyColumnScreenDescription()
		{
			const entityTypeName = this.getName();

			return this.getLastMessageVer(`M_CRM_ENTITY_TAB_COLUMN_EMPTY_${entityTypeName}_DESCRIPTION`);
		}

		getUnsuitableStageScreenConfig()
		{
			return {
				title: this.getColumnUnsuitableForFilterTitle(),
				description: this.getColumnUnsuitableForFilterDescription(),
				image: this.getEmptyImage(),
			};
		}

		getColumnUnsuitableForFilterTitle()
		{
			const entityTypeName = this.getName();

			return this.getLastMessageVer(`M_CRM_ENTITY_TAB_COLUMN_USUITABLE_FOR_FILTER_TITLE_${entityTypeName}`);
		}

		getColumnUnsuitableForFilterDescription()
		{
			const entityTypeName = this.getName();

			return this.getLastMessageVer(`M_CRM_ENTITY_TAB_COLUMN_USUITABLE_FOR_FILTER_DESCRIPTION_${entityTypeName}`);
		}

		getEmptyImage()
		{
			return {
				style: {
					width: 212,
					height: 212,
				},
				uri: this.getPathToIcon(),
			};
		}

		getPathToIcon()
		{
			return EmptyScreen.makeLibraryImagePath(`${this.getIconName()}.webp`, 'crm');
		}

		getIconName()
		{
			return 'marshmallow-empty-crm';
		}

		/**
		 * @returns {Object[]}
		 */
		getItemActions(permissions)
		{
			const actions = [
				{
					id: 'activity',
					sort: 200,
					title: Loc.getMessage('M_CRM_ENTITY_TAB_ACTION_ACTIVITY'),
					showActionLoader: false,
					onClickCallback: this.addActivity.bind(this),
					onDisableClick: this.showForbiddenActionNotification.bind(this),
					icon: Icon.ADD_TIMELINE,
					isDisabled: !permissions.update,
				},
			];
			if (this.params.isChatSupported)
			{
				actions.push({
					id: 'chat',
					title: BX.message('M_CRM_ENTITY_TAB_ACTION_CHAT'),
					sort: 700,
					onClickCallback: openChat.bind(this, { entityTypeId: this.getId() }),
					onDisableClick: this.showForbiddenActionNotification.bind(this),
					icon: Icon.EMPTY_MESSAGE,
					sectionCode: 'additional',
					isRawIcon: true,
					isDisabled: false, // !permissions.exclude,
				});
			}

			return actions;
		}

		async addActivity(action, itemId, { parentWidget } = {})
		{
			const { TimelineScheduler } = await requireLazy('crm:timeline/scheduler');

			if (parentWidget)
			{
				await new Promise((resolve) => {
					parentWidget.close(resolve);
				});
			}

			await (new TimelineScheduler({
				entity: {
					id: itemId,
					typeId: this.getId(),
					categoryId: this.getCategoryId(),
					reminders: this.params.reminders,
				},
				user: this.getUserInfo(),
				analytics: this.params.analyticsEvent?.setCategory('activity_operations'),
			})).openActivityEditor();
		}

		showForbiddenActionNotification()
		{
			const title = Loc.getMessage('M_CRM_ENTITY_TAB_ACTION_FORBIDDEN_TITLE');
			const text = Loc.getMessage('M_CRM_ENTITY_TAB_ACTION_FORBIDDEN_TEXT');

			Notify.showUniqueMessage(text, title, { time: 3 });
		}

		/**
		 * @return {{
		 * image: ImageProps,
		 * title: string|Function,
		 * description: string|Function,
		 * }}
		 */
		getEmptySearchScreenConfig()
		{
			const imageParams = this.getEmptySearchIcon();
			const title = this.getEmptySearchScreenTitle();
			const description = Loc.getMessage('M_CRM_ENTITY_TAB_SEARCH_EMPTY_DESCRIPTION');

			return {
				image: Image(imageParams),
				title,
				description,
			};
		}

		getEmptySearchIcon()
		{
			return {
				style: {
					width: 156,
					height: 140,
				},
				uri: this.getEmptySearchIconPath(),
			};
		}

		getEmptySearchIconPath()
		{
			return EmptyScreen.makeLibraryImagePath(`${this.getEmptySearchIconName()}.webp`, 'crm');
		}

		getEmptySearchIconName()
		{
			return 'empty-search-crm';
		}

		getEmptySearchScreenTitle()
		{
			const entityTypeName = (this.getName() || 'COMMON');

			return this.getLastMessageVer(`M_CRM_ENTITY_TAB_SEARCH_EMPTY_${entityTypeName}_TITLE2`);
		}

		/**
		 * @returns {string}
		 */
		getCommunicationChannelsRedirectUrl()
		{
			return '/contact_center';
		}

		getEmptyEntityScreenDescriptionText()
		{
			return Loc.getMessage('M_CRM_ENTITY_TAB_ENTITY_EMPTY_DESCRIPTION', {
				'#URL#': this.getCommunicationChannelsRedirectUrl(),
				'#MANY_ENTITY_TYPE_TITLE#': this.getManyEntityTypeTitle(),
				'#SINGLE_ENTITY_TYPE_TITLE#': this.getSingleEntityTypeTitle(),
			});
		}

		getManyEntityTypeTitle()
		{
			const entityTypeName = (this.getName() || 'COMMON');

			return this.getLastMessageVer(`M_CRM_ENTITY_TAB_ENTITY_EMPTY_MANY_${entityTypeName}`);
		}

		getSingleEntityTypeTitle()
		{
			const entityTypeName = (this.getName() || 'COMMON');

			return this.getLastMessageVer(`M_CRM_ENTITY_TAB_ENTITY_EMPTY_SINGLE_${entityTypeName}`);
		}

		getMenuActions()
		{
			return [];
		}

		getLastMessageVer(messageCode, verLimit = 5)
		{
			if (Loc.hasMessage(messageCode))
			{
				return Loc.getMessage(messageCode);
			}

			const messageWithVerText = `${messageCode}_MSGVER_`;
			for (let ver = 1; ver <= verLimit; ver++)
			{
				if (Loc.hasMessage(messageWithVerText + ver.toString()))
				{
					return Loc.getMessage(messageWithVerText + ver.toString());
				}
			}

			return null;
		}
	}

	function abstract(msg)
	{
		const message = msg || 'Abstract method must be implemented in child class';

		throw new Error(message);
	}

	module.exports = { Base };
});

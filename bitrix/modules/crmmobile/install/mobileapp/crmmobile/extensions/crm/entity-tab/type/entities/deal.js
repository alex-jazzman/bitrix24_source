/**
 * @module crm/entity-tab/type/entities/deal
 */
jn.define('crm/entity-tab/type/entities/deal', (require, exports, module) => {
	const { Base: BaseEntityType } = require('crm/entity-tab/type/entities/base');
	const { excludeItem } = require('crm/entity-tab/type/traits/exclude-item');
	const { TypeId, TypeName } = require('crm/type');
	const { Loc } = require('loc');
	const { Icon } = require('ui-system/blocks/icon');
	const { UIMenuType } = require('layout/ui/menu');

	/**
	 * @class Deal
	 */
	class Deal extends BaseEntityType
	{
		/**
		 * @returns {Number}
		 */
		getId()
		{
			return TypeId.Deal;
		}

		/**
		 * @returns {String}
		 */
		getName()
		{
			return TypeName.Deal;
		}

		/**
		 * @returns {Object[]}
		 */
		getItemActions(permissions)
		{
			const actions = super.getItemActions(permissions);

			return [
				...actions,
				{
					id: 'exclude',
					title: Loc.getMessage('M_CRM_ENTITY_TAB_ACTION_EXCLUDE'),
					sort: 500,
					onClickCallback: excludeItem.bind(this),
					onDisableClick: this.showForbiddenActionNotification.bind(this),
					icon: Icon.CIRCLE_CROSS,
					isDisabled: !permissions.exclude,
				},
			];
		}

		getEmptyEntityScreenConfig()
		{
			const imageParams = this.getEmptyImage();
			const description = this.getEmptyEntityScreenDescriptionText();
			const title = this.getEmptyScreenTitle();
			const parentWidget = this.getParentWidget();

			if (env.isAdmin)
			{
				const list = this.getEmptyEntityScreenList();

				return {
					image: Image(imageParams),
					title,
					list,
				};
			}

			return {
				image: Image(imageParams),
				title,
				description,
				onDescriptionLinkClick: (params) => this.showFeatureBanner(parentWidget, params?.url),
			};
		}

		getEmptyScreenTitle()
		{
			if (env.isAdmin)
			{
				return this.getLastMessageVer(`M_CRM_ENTITY_TAB_ENTITY_EMPTY_TITLE2_${this.getName()}_ADMIN`);
			}

			return this.getLastMessageVer(`M_CRM_ENTITY_TAB_ENTITY_EMPTY_TITLE2_${this.getName()}_MSGVER_1`);
		}

		getEmptySearchScreenConfig()
		{
			const config = super.getEmptySearchScreenConfig();
			if (this.params.categoriesCount > 1)
			{
				const entityTypeName = this.getName();
				config.description = Loc.getMessage(`M_CRM_ENTITY_TAB_SEARCH_WITH_TWO_OR_MORE_CATEGORIES_EMPTY_${entityTypeName}_DESCRIPTION2`);
			}

			return config;
		}

		getEmptyEntityScreenDescriptionText()
		{
			return Loc.getMessage(`M_CRM_ENTITY_TAB_ENTITY_EMPTY_${this.getName()}_DESCRIPTION`);
		}

		getEmptyEntityScreenList()
		{
			return [
				{
					icon: Icon.HANDSHAKE,
					text: Loc.getMessage('M_CRM_ENTITY_TAB_ENTITY_EMPTY_DESCRIPTION_FEATURE_1'),
				},
				{
					icon: Icon.LOGIN_HISTORY,
					text: Loc.getMessage('M_CRM_ENTITY_TAB_ENTITY_EMPTY_DESCRIPTION_FEATURE_2'),
				},
				{
					icon: Icon.CRM,
					text: Loc.getMessage('M_CRM_ENTITY_TAB_ENTITY_EMPTY_DESCRIPTION_FEATURE_3'),
				},
			];
		}

		getMenuActions()
		{
			return [
				{
					type: UIMenuType.HELPDESK,
					data: {
						articleCode: '16758628',
					},
				},
			];
		}
	}

	module.exports = { Deal };
});

/**
 * @module selector/providers/tree-providers/nested-department-provider/src/entities/user
 */
jn.define('selector/providers/tree-providers/nested-department-provider/src/entities/user', (require, exports, module) => {
	const { AvatarClass } = require('ui-system/blocks/avatar');
	const { SelectorDataProvider } = require('layout/ui/user/user-name');
	const { BaseEntity } = require('selector/providers/tree-providers/nested-department-provider/src/entities/base-entity');

	const ENTITY_TYPE = {
		employee: 'employee',
	};

	class UserEntity extends BaseEntity
	{
		/**
		 * @param {NestedDepartmentUserEntityOptions} options
		 */
		constructor(options = {})
		{
			super();
			/** @type {NestedDepartmentUserEntityOptions} */
			this.options = options;
		}

		/**
		 * @return {string}
		 */
		static getId()
		{
			return 'user';
		}

		/**
		 * @return {NestedDepartmentEntityDialog}
		 */
		getEntityForDialog()
		{
			const entity = super.getEntityForDialog();
			if (!this.options.disableSearch)
			{
				return entity;
			}

			return {
				...entity,
				dynamicSearch: false,
				searchable: false,
				options: {
					...entity.options,
					fillDialog: false,
				},
			};
		}

		/**
		 * @return {NestedDepartmentDialogUserOptions}
		 */
		getEntityOptions()
		{
			const { userOptions = {}, ...options } = this.options;

			return {
				emailUsers: true,
				inviteEmployeeLink: false,
				...options,
				...userOptions,
			};
		}

		/**
		 * @param {NestedDepartmentSelectorItem} item
		 * @param {NestedDepartmentSelectorItem} initialEntity
		 * @return {NestedDepartmentSelectorItem}
		 */
		prepareItemForDrawing(item, initialEntity)
		{
			const isEmployee = item.params?.entityType === ENTITY_TYPE.employee;

			if (!item.id)
			{
				return this.getDefaultItemsStyles(item);
			}

			const preparedParams = this.getPreparedParamsForAvatar(item);
			const avatarParams = AvatarClass.resolveEntitySelectorParams({ ...preparedParams, withRedux: true });
			const avatar = AvatarClass.getAvatar(avatarParams).getAvatarNativeProps();
			const userNameStyle = SelectorDataProvider.getUserTitleStyle(preparedParams);

			if (!isEmployee)
			{
				return this.getNonEmployeeStyles(item, avatar, userNameStyle);
			}

			return this.getDefaultItemsStyles(item);
		}

		/**
		 * @param {NestedDepartmentSelectorItem} item
		 * @return {NestedDepartmentSelectorItem}
		 */
		getPreparedParamsForAvatar(item)
		{
			return {
				...item,
				customData: item.params?.customData,
				entityId: item.params?.entityId,
				entityType: item.params?.entityType,
				avatar: item.imageUrl,
			};
		}

		/**
		 * @param {NestedDepartmentSelectorItem} item
		 * @return {NestedDepartmentSelectorItem}
		 */
		getDefaultItemsStyles(item)
		{
			return {
				...item,
				styles: {
					...item.styles,
					image: {
						border: {
							width: 0,
						},
					},
				},
			};
		}

		/**
		 * @param {NestedDepartmentSelectorItem} item
		 * @param {NestedDepartmentAvatarProps} avatar
		 * @param {NestedDepartmentUserNameStyle} userNameStyle
		 * @return {NestedDepartmentSelectorItem}
		 */
		getNonEmployeeStyles(item, avatar, userNameStyle)
		{
			return {
				...item,
				avatar,
				styles: userNameStyle,
			};
		}
	}

	module.exports = { UserEntity };
});

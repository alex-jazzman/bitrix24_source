/**
 * @module ui-system/blocks/avatar/src/providers/selector
 */
jn.define('ui-system/blocks/avatar/src/providers/selector', (require, exports, module) => {
	const { isNil } = require('utils/type');
	const { mergeImmutable } = require('utils/object');
	const store = require('statemanager/redux/store');
	const { UserSelectorEntityType } = require('layout/ui/user/enums');
	const { usersSelector } = require('statemanager/redux/slices/users');
	const { AvatarEntityType } = require('ui-system/blocks/avatar/src/enums/entity-type');

	class SelectorDataProvider
	{
		/**
		 * @param {AvatarSelectorParams} data
		 */
		constructor(data = {})
		{
			this.data = mergeImmutable(data, this.getReduxData(data));
		}

		/**
		 * @param {AvatarSelectorParams} params
		 * @return {AvatarSliceUser}
		 */
		getReduxData({ id, withRedux })
		{
			if (!withRedux)
			{
				return {};
			}

			return usersSelector.selectById(store.getState(), Number(id)) || {};
		}

		/**
		 * @return {AvatarId}
		 */
		getId()
		{
			const { id } = this.data;

			return id;
		}

		/**
		 * @return {string}
		 */
		getName()
		{
			const { fullName, title } = this.data;
			const { name, lastName } = this.getCustomData();

			return fullName ?? (title || [name, lastName].filter(Boolean).join(' '));
		}

		/**
		 * @return {string | undefined}
		 */
		getEntityType()
		{
			const { entityType } = this.data;

			return entityType;
		}

		/**
		 * @return {string | undefined}
		 */
		getSelectorEntityId()
		{
			const { entityId } = this.data;

			return entityId;
		}

		/**
		 * @return {AvatarSelectorCustomData}
		 */
		getCustomData()
		{
			const { customData } = this.data;

			return customData || {};
		}

		/**
		 * @return {string}
		 */
		getTestId()
		{
			const testId = 'avatar-selector';

			return this.getId() ? `${testId}-${this.getId()}` : testId;
		}

		/**
		 * @return {AvatarEntityType | null}
		 */
		getAvatarEntityType()
		{
			const avatarType = this.getAvatarType();

			if (this.isCollaber())
			{
				return AvatarEntityType.COLLAB;
			}

			if (this.isExtranet())
			{
				return AvatarEntityType.EXTRANET;
			}

			if (avatarType)
			{
				return AvatarEntityType.resolveType(avatarType);
			}

			return null;
		}

		/**
		 * @return {string | undefined}
		 */
		getAvatarType()
		{
			return this.getEntityType();
		}

		/**
		 * @return {string | undefined}
		 */
		getUri()
		{
			const { avatarSize100, avatar } = this.data;

			return avatarSize100 ?? avatar;
		}

		/**
		 * @return {boolean}
		 */
		isExtranet()
		{
			const { isExtranet } = this.data;

			return Boolean(isExtranet) || this.getAvatarType() === this.getExtranetEntityName();
		}

		/**
		 * @return {boolean}
		 */
		isCollaber()
		{
			const { isCollaber } = this.data;

			return Boolean(isCollaber) || this.getAvatarType() === this.getCollabEntityName();
		}

		/**
		 * @return {AvatarShape | null}
		 */
		getShape()
		{
			return null;
		}

		/**
		 * @return {string}
		 */
		getCollabEntityName()
		{
			return UserSelectorEntityType.COLLABER.getValue();
		}

		/**
		 * @return {string}
		 */
		getExtranetEntityName()
		{
			return UserSelectorEntityType.EXTRANET.getValue();
		}

		/**
		 * @return {Partial<AvatarComponentProps>}
		 */
		getParams()
		{
			const { id, entityId, size, onClick } = this.data;

			const params = {
				id,
				size,
				onClick,
				entityId,
				uri: this.getUri(),
				name: this.getName(),
				testId: this.getTestId(),
				shape: this.getShape(),
				entityType: this.getAvatarEntityType(),
			};

			const cleanNil = (values) => {
				return Object.fromEntries(
					Object.entries(values).filter(([_, value]) => !isNil(value)),
				);
			};

			return cleanNil(params);
		}
	}

	module.exports = {
		SelectorDataProviderClass: SelectorDataProvider,
		/**
		 * @param {AvatarSelectorParams} data
		 * @return {Partial<AvatarComponentProps>}
		 */
		selectorDataProvider: (data) => (new SelectorDataProvider(data)).getParams(),
	};
});

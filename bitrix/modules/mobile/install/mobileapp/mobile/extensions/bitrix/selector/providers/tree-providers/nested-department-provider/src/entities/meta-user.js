/**
 * @module selector/providers/tree-providers/nested-department-provider/src/entities/meta-user
 */
jn.define('selector/providers/tree-providers/nested-department-provider/src/entities/meta-user', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { withCurrentDomain } = require('utils/url');

	/**
	 * @class MetaUserEntity
	 */
	class MetaUserEntity
	{
		static getId()
		{
			return 'meta-user';
		}

		getEntityForDialog()
		{
			return {
				id: MetaUserEntity.getId(),
				dynamicLoad: true,
				dynamicSearch: false,
				filters: [],
				options: {
					'all-users': {
						allowView: true,
					},
				},
				searchable: true,
				substituteEntityId: null,
			};
		}

		prepareItemForDrawing(item, initialEntity)
		{
			const metaUserImageStyles = {
				backgroundColor: Color.accentMainSuccess.getValue(),
				image: {
					tintColor: Color.baseWhiteFixed.getValue(),
					contentHeight: 26,
					borderRadiusPx: 6,
				},
				border: {
					color: Color.accentMainSuccess.getValue(),
					width: 2,
				},
			};

			return {
				...item,
				imageUrl: withCurrentDomain(Icon.THREE_PERSONS.getPath()),
				shortTitle: initialEntity.shortTitle,
				subtitle: initialEntity.subtitle,
				// new styles' set up
				styles: {
					...item.styles,
					image: initialEntity?.styles?.image ?? metaUserImageStyles,
					selectedImage: initialEntity?.styles?.selectedImage ?? metaUserImageStyles,
				},
				// old styles' set up
				typeIconFrame: 1,
				color: Color.accentMainSuccess.getValue(),
			};
		}

		findItem(id, items)
		{
			return items.find((item) => (
				String(item.id) === String(id)
				&& String(item.entityId) === MetaUserEntity.getId()
			));
		}
	}

	module.exports = { MetaUserEntity };
});

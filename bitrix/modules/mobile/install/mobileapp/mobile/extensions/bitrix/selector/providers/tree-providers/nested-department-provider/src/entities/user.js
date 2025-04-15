/**
 * @module selector/providers/tree-providers/nested-department-provider/src/entities/user
 */
jn.define('selector/providers/tree-providers/nested-department-provider/src/entities/user', (require, exports, module) => {

	/**
	 * @class UserEntity
	 */
	class UserEntity
	{
		static getId()
		{
			return 'user';
		}

		getEntityForDialog()
		{
			return {
				id: UserEntity.getId(),
				dynamicLoad: true,
				dynamicSearch: true,
				filters: [],
				options: {
					emailUsers: true,
					inviteEmployeeLink: false,
				},
				searchable: true,
				substituteEntityId: null,
			};
		}

		prepareItemForDrawing(item)
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

		findItem(id, items)
		{
			return items.find((item) => (
				String(item.id) === String(id)
				&& String(item.entityId) === UserEntity.getId()
			));
		}
	}

	module.exports = { UserEntity };
});

/**
 * @module tasks/layout/task/create-new/src/converters
 */
jn.define('tasks/layout/task/create-new/src/converters', (require, exports, module) => {
	function mapUserToEntitySelectorFormat(user)
	{
		if (!user)
		{
			return null;
		}

		return {
			id: user.id,
			title: user.title ?? user.fullName ?? user.name,
			imageUrl: user.imageUrl ?? user.avatarSize100 ?? user.image ?? null,
			customData: {
				position: user.customData?.position ?? user.workPosition,
			},
		};
	}

	function convertUsersCollectionToEntitySelectorFormat(users)
	{
		if (!Array.isArray(users))
		{
			return [];
		}

		return users
			.map((user) => mapUserToEntitySelectorFormat(user))
			.filter(Boolean);
	}

	function convertGroupToEntitySelectorFormat(group)
	{
		return group
			? {
				id: group.id,
				title: group.name,
				imageUrl: group.image,
				customData: {
					datePlan: {
						dateStart: group.dateStart,
						dateFinish: group.dateFinish,
					},
				},
			}
			: undefined;
	}

	module.exports = {
		convertUsersCollectionToEntitySelectorFormat,
		convertGroupToEntitySelectorFormat,
	};
});

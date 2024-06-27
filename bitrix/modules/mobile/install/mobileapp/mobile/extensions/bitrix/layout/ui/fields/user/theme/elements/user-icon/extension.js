/**
 * @module layout/ui/fields/user/theme/elements/user-icon
 */
jn.define('layout/ui/fields/user/theme/elements/user-icon', (require, exports, module) => {
	const { Avatar } = require('layout/ui/user/avatar');
	const { EmptyAvatar } = require('layout/ui/user/empty-avatar');

	/**
	 * @param {UserField} field
	 * @param {object} entity
	 * @param {number} entity.id
	 * @param {string} entity.title
	 * @param {string} entity.imageUrl
	 * @param {string} entity.avatar
	 * @param {number} size
	 * @param {boolean} [canOpenEntity=true]
	 * @param {object} [additionalStyles]
	 */
	const UserAvatar = ({
		field,
		entity,
		size,
		canOpenEntity = true,
		additionalStyles = {},
	}) => {
		const onClick = field.openEntity.bind(field, entity.id);

		if (!entity.imageUrl)
		{
			return EmptyAvatar({
				id: entity.id,
				name: entity.title,
				size,
				onClick: canOpenEntity && onClick,
				testId: `${field.testId}_USER_${entity.id}_LETTERS_ICON`,
				additionalStyles,
			});
		}

		return Avatar({
			id: entity.id,
			name: entity.title,
			size,
			onClick: canOpenEntity && onClick,
			testId: `${field.testId}_USER_${entity.id}_ICON`,
			image: entity.imageUrl || entity.avatar || field.getDefaultAvatar(),
			additionalStyles: {
				wrapper: additionalStyles,
			},
		});
	};

	module.exports = {
		UserAvatar,
	};
});

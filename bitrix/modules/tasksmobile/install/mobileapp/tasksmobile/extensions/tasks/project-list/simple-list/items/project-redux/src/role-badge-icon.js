/**
 * @module tasks/project-list/simple-list/items/project-redux/src/role-badge-icon
 */
jn.define('tasks/project-list/simple-list/items/project-redux/src/role-badge-icon', (require, exports, module) => {
	const { Color } = require('tokens');

	const OUTLINE_WIDTH = 4;
	const ROLE_BADGE_HEIGHT = 13;

	const RoleBadgeType = {
		OWNER: 'owner',
		MODERATOR: 'moderator',
	};

	const roleBadgeSize = {
		[RoleBadgeType.OWNER]: {
			width: 14,
			height: ROLE_BADGE_HEIGHT,
		},
		[RoleBadgeType.MODERATOR]: {
			width: 13,
			height: ROLE_BADGE_HEIGHT,
		},
	};

	const ownerPath = 'M6.3739 2.35938C6.61581 1.88028 7.28983 1.8803 7.5321 2.35938L9.12 5.5C9.13968 5.53894 9.17956 5.54637 9.20691 5.53223L10.9696 4.62109C11.5064 4.34393 12.0371 4.87148 11.8915 5.38965C11.8814 5.42555 11.8788 5.43325 11.8778 5.43945L11.2528 9.53809C11.2445 9.59256 11.2282 9.67147 11.1854 9.75C11.048 10.0021 10.784 10.1659 10.4901 10.166H3.46765C3.17138 10.166 2.90595 9.99956 2.76941 9.74414C2.72936 9.66915 2.71335 9.59468 2.70496 9.54297L2.03894 5.43945C2.03797 5.43354 2.03602 5.42677 2.02625 5.39258C1.8779 4.8729 2.41056 4.3427 2.94812 4.62109L4.70496 5.53223C4.73225 5.54629 4.77119 5.53869 4.79089 5.5L6.3739 2.35938Z';
	const moderatorPath = 'M4.16785 2.13281C5.25745 1.80434 6.50758 2.08595 7.3905 2.96875C8.2475 3.82574 8.53882 5.02932 8.25476 6.0957C8.20965 6.2654 8.2468 6.45005 8.37097 6.57422L9.95789 8.16113C10.3092 8.51262 10.3093 9.08218 9.95789 9.43359L9.49109 9.90039C9.13965 10.2514 8.56999 10.2516 8.21863 9.90039L6.66394 8.34473C6.53642 8.21735 6.34568 8.18165 6.17273 8.23242C5.08769 8.55167 3.84626 8.26826 2.96863 7.39062C2.06025 6.48212 1.78858 5.18438 2.16296 4.07324C2.21819 3.90935 2.42442 3.8729 2.54675 3.99512L4.14441 5.5918C4.33967 5.78702 4.65619 5.78705 4.85144 5.5918L5.65027 4.79297C5.84553 4.59771 5.84553 4.28022 5.65027 4.08496L4.08289 2.51758C3.95897 2.39305 3.99955 2.1836 4.16785 2.13281Z';

	/**
	 * @param {ProjectRoleBadgeSvgParams} params
	 * @returns {string}
	 */
	const renderIcon = ({ width, height, viewBox, path, fill }) => `
		<svg width="${width}" height="${height}" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
			<path d="${path}" fill="none" stroke="white" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round" stroke-linecap="round"/>
			<path d="${path}" fill="${fill}"/>
		</svg>
	`;

	const getRoleBadgeIcon = {
		[RoleBadgeType.OWNER]: () => renderIcon({
			width: 14,
			height: 14,
			viewBox: '0 0 14 14',
			path: ownerPath,
			fill: Color.accentMainWarning.toHex(),
		}),
		[RoleBadgeType.MODERATOR]: () => renderIcon({
			width: 12,
			height: 12,
			viewBox: '0 0 12 12',
			path: moderatorPath,
			fill: Color.accentMainSuccess.toHex(),
		}),
	};

	/**
	 * @param {ProjectRoleBadgeType} type
	 * @returns {ProjectRoleBadgeType}
	 */
	const normalizeRoleBadgeType = (type) => {
		return type === RoleBadgeType.OWNER ? RoleBadgeType.OWNER : RoleBadgeType.MODERATOR;
	};

	/**
	 * @param {ProjectRoleBadgeIconProps} props
	 * @returns {object}
	 */
	const RoleBadgeIcon = ({ type }) => {
		const badgeType = normalizeRoleBadgeType(type);

		return Image({
			style: {
				...roleBadgeSize[badgeType],
			},
			svg: {
				content: getRoleBadgeIcon[badgeType](),
			},
		});
	};

	module.exports = {
		ROLE_BADGE_HEIGHT,
		RoleBadgeIcon,
		RoleBadgeType,
	};
});

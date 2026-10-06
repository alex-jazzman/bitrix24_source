/**
 * @module tasks/project-list/simple-list/items/project-redux/src/project-avatar-stacks
 */
jn.define('tasks/project-list/simple-list/items/project-redux/src/project-avatar-stacks', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Text } = require('ui-system/typography/text');
	const { AvatarStack } = require('ui-system/blocks/avatar-stack');
	const {
		ROLE_BADGE_HEIGHT,
		RoleBadgeIcon,
		RoleBadgeType,
	} = require('tasks/project-list/simple-list/items/project-redux/src/role-badge-icon');

	const STACK_HEIGHT = 32;
	const USER_AVATAR_SIZE = 24;
	const USER_AVATAR_OUTLINE = 2;
	const ROLE_BADGE_OFFSET_X = 2;
	const ROLE_BADGE_OFFSET_Y = 2;
	const ROLE_STACK_VISIBLE_COUNT = 3;
	const MEMBER_STACK_VISIBLE_COUNT = 2;
	const AVATAR_STACK_OFFSET = -Indent.S.toNumber();
	const AVATAR_STACK_ELEMENT_WIDTH = USER_AVATAR_SIZE + USER_AVATAR_OUTLINE;
	const AVATAR_STACK_STEP = AVATAR_STACK_ELEMENT_WIDTH - Math.max(0, AVATAR_STACK_OFFSET);
	const AVATAR_STACK_BOTTOM_OFFSET = (STACK_HEIGHT - AVATAR_STACK_ELEMENT_WIDTH) / 2;

	/**
	 * @param {number} visibleCount
	 * @returns {number}
	 */
	const getVisibleRoleStackWidth = (visibleCount) => (
		AVATAR_STACK_ELEMENT_WIDTH + Math.max(0, visibleCount - 1) * AVATAR_STACK_STEP
	);

	/**
	 * @param {number} index
	 * @returns {number}
	 */
	const getRoleAvatarLeft = (index) => index * AVATAR_STACK_STEP;

	/**
	 * @param {ProjectRoleStackProps} props
	 * @returns {number[]}
	 */
	const getRoleEntities = ({ ownerId, moderatorIds = [] }) => {
		const entities = [];
		const moderators = moderatorIds ?? [];

		if (ownerId > 0)
		{
			entities.push(ownerId);
		}

		return [
			...entities,
			...moderators.filter((id) => id !== ownerId),
		];
	};

	/**
	 * @param {number} restCount
	 * @returns {object}
	 */
	const renderAvatarStackRestView = (restCount) => {
		const restText = restCount > 99 ? '99+' : `+${restCount}`;
		const fontSize = restText.length < 3 ? (USER_AVATAR_SIZE / 2) : (USER_AVATAR_SIZE / 2) - 1;

		return View(
			{
				style: {
					width: AVATAR_STACK_ELEMENT_WIDTH,
					height: AVATAR_STACK_ELEMENT_WIDTH,
					alignItems: 'center',
					justifyContent: 'center',
				},
			},
			Text({
				text: restText,
				color: Color.base4,
				style: {
					fontSize,
				},
			}),
		);
	};

	/**
	 * @param {ProjectRoleBadgeProps} props
	 * @returns {object}
	 */
	const renderRoleBadge = ({ testId, index, ownerId }) => {
		const isOwner = index === 0 && ownerId > 0;

		return View({
			testId: `${testId}_ROLE_BADGE_${index}`,
			style: {
				position: 'absolute',
				left: getRoleAvatarLeft(index),
				width: AVATAR_STACK_ELEMENT_WIDTH,
				alignItems: 'flex-end',
				zIndex: ROLE_STACK_VISIBLE_COUNT + 1,
			},
		}, RoleBadgeIcon({
			type: isOwner ? RoleBadgeType.OWNER : RoleBadgeType.MODERATOR,
		}));
	};

	/**
	 * @param {ProjectRoleBadgesProps} props
	 * @returns {object}
	 */
	const renderRoleBadges = ({ testId, visibleCount, ownerId }) => View(
		{
			style: {
				position: 'absolute',
				left: Indent.XS2.toNumber() + ROLE_BADGE_OFFSET_X,
				bottom: AVATAR_STACK_BOTTOM_OFFSET - ROLE_BADGE_OFFSET_Y,
				width: getVisibleRoleStackWidth(visibleCount),
				height: ROLE_BADGE_HEIGHT,
				zIndex: ROLE_STACK_VISIBLE_COUNT + 1,
			},
		},
		...Array.from(
			{ length: visibleCount },
			(_, index) => renderRoleBadge({ testId, index, ownerId }),
		),
	);

	/**
	 * @param {ProjectRoleStackFrameProps} props
	 * @returns {object}
	 */
	const renderRoleStackFrame = ({ testId, entities }) => View(
		{
			style: {
				height: STACK_HEIGHT,
				borderWidth: 1,
				borderColor: Color.accentMainSuccess.toHex(),
				borderRadius: STACK_HEIGHT / 2,
				paddingHorizontal: Indent.M.toNumber(),
				justifyContent: 'center',
			},
		},
		AvatarStack({
			testId: `${testId}_ROLE_STACK`,
			entities,
			size: USER_AVATAR_SIZE,
			visibleEntityCount: ROLE_STACK_VISIBLE_COUNT,
			backgroundColor: Color.bgContentPrimary,
			offset: AVATAR_STACK_OFFSET,
			restView: renderAvatarStackRestView,
		}),
	);

	/**
	 * @param {ProjectRoleStackProps} props
	 * @returns {object|null}
	 */
	const ProjectRoleStack = ({ testId, ownerId, moderatorIds }) => {
		const entities = getRoleEntities({ ownerId, moderatorIds });

		if (entities.length === 0)
		{
			return null;
		}

		return View(
			{
				style: {
					position: 'relative',
					height: STACK_HEIGHT,
					overflow: 'visible',
				},
			},
			renderRoleStackFrame({ testId, entities }),
			renderRoleBadges({
				testId,
				visibleCount: Math.min(entities.length, ROLE_STACK_VISIBLE_COUNT),
				ownerId,
			}),
		);
	};

	/**
	 * @param {ProjectMemberStackProps} props
	 * @returns {object|null}
	 */
	const ProjectMemberStack = ({ testId, memberIds = [] }) => {
		const entities = memberIds ?? [];

		if (entities.length === 0)
		{
			return null;
		}

		return View(
			{
				style: {
					height: STACK_HEIGHT,
					justifyContent: 'center',
					marginLeft: Indent.S.toNumber(),
				},
			},
			AvatarStack({
				testId: `${testId}_MEMBER_STACK`,
				entities,
				size: USER_AVATAR_SIZE,
				visibleEntityCount: MEMBER_STACK_VISIBLE_COUNT,
				backgroundColor: Color.bgContentPrimary,
				offset: AVATAR_STACK_OFFSET,
				restView: renderAvatarStackRestView,
			}),
		);
	};

	module.exports = {
		ProjectMemberStack,
		ProjectRoleStack,
	};
});

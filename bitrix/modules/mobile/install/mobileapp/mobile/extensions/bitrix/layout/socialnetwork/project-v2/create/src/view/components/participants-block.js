/**
 * @module layout/socialnetwork/project-v2/create/src/view/components/participants-block
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/components/participants-block', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { Loc } = require('loc');
	const { Component, Indent, Color } = require('tokens');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { createTestIdGenerator } = require('utils/test');

	const LEFT_ICON_SIZE = 40;
	const INNER_ICON_SIZE = 24;
	const SEPARATOR_LEFT_OFFSET = Component.paddingLr.toNumber() + LEFT_ICON_SIZE + Indent.XL.toNumber();

	const getParticipantsSubtitle = (participants) => {
		const userTitles = (participants.user ?? []).map((item) => item.title);
		const departmentTitles = (participants.department ?? []).map((item) => item.title);
		const titles = [...userTitles, ...departmentTitles];

		if (titles.length === 0)
		{
			return Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_PARTICIPANTS_EMPTY');
		}

		return titles.join(', ');
	};

	const getModeratorsSubtitle = (moderatorsData) => {
		if ((moderatorsData ?? []).length === 0)
		{
			return Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_PARTICIPANTS_EMPTY');
		}

		return moderatorsData.map((moderator) => moderator.title).join(', ');
	};

	const renderParticipantIcon = (icon, id, getTestId) => View(
		{
			testId: getTestId(`item-${id}-icon-wrap`),
			style: {
				width: LEFT_ICON_SIZE,
				height: LEFT_ICON_SIZE,
				borderRadius: LEFT_ICON_SIZE / 2,
				backgroundColor: Color.accentSoftBlue2.toHex(),
				alignItems: 'center',
				justifyContent: 'center',
			},
		},
		IconView({
			testId: getTestId(`item-${id}-icon`),
			icon,
			size: INNER_ICON_SIZE,
			color: Color.accentMainPrimaryalt,
		}),
	);

	const renderParticipantItem = ({
		id,
		title,
		subtitle,
		leftContent,
		onClick,
		isLast = false,
		getTestId,
	}) => View(
		{
			testId: getTestId(`item-${id}`),
			style: {
				flexDirection: 'row',
				alignItems: 'center',
				paddingHorizontal: Component.paddingLr.toNumber(),
				paddingVertical: Indent.XL.toNumber(),
			},
			onClick,
		},
		View(
			{
				testId: getTestId(`item-${id}-left`),
				style: {
					width: LEFT_ICON_SIZE,
					alignItems: 'center',
					justifyContent: 'center',
					marginRight: Indent.XL.toNumber(),
				},
			},
			leftContent,
		),
		View(
			{
				testId: getTestId(`item-${id}-content`),
				style: {
					flex: 1,
				},
			},
			Text2({
				testId: getTestId(`item-${id}-title`),
				text: title,
				color: Color.base1,
				style: {
					marginBottom: Indent.XS2.toNumber(),
				},
			}),
			Text5({
				testId: getTestId(`item-${id}-subtitle`),
				text: subtitle,
				color: Color.base3,
				numberOfLines: 2,
			}),
		),
		View(
			{
				testId: getTestId(`item-${id}-chevron-wrap`),
				style: {
					marginLeft: Indent.XL.toNumber(),
				},
			},
			IconView({
				testId: getTestId(`item-${id}-chevron`),
				icon: Icon.CHEVRON_TO_THE_RIGHT,
				color: Color.base4,
				size: 24,
			}),
		),
		!isLast && View({
			style: {
				position: 'absolute',
				left: SEPARATOR_LEFT_OFFSET,
				right: 0,
				bottom: 0,
				height: 1,
				backgroundColor: Color.bgSeparatorSecondary.toHex(),
			},
		}),
	);

	const ProjectCreateParticipantsBlock = ({
	testId,
	ownerData,
	moderatorsData,
	participants,
	showParticipants = true,
	onOwnerClick,
	onModeratorsClick,
	onParticipantsClick,
	}) => {
		const getTestId = createTestIdGenerator({ prefix: testId });

		return Area(
			{
				excludePaddingSide: {
					bottom: true,
				},
			},
			View(
				{
					testId: getTestId(),
					style: {
						width: '100%',
						borderRadius: 12,
						borderWidth: 1,
						borderColor: Color.bgSeparatorPrimary.toHex(),
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				renderParticipantItem({
					id: 'owner',
					title: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_OWNER_TITLE'),
					subtitle: ownerData.title || Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_PARTICIPANTS_EMPTY'),
					leftContent: renderParticipantIcon(Icon.CROWN, 'owner', getTestId),
					onClick: onOwnerClick,
					getTestId,
				}),
				renderParticipantItem({
					id: 'moderators',
					title: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_MODERATORS_TITLE'),
					subtitle: getModeratorsSubtitle(moderatorsData),
					leftContent: renderParticipantIcon(Icon.MODERATOR, 'moderators', getTestId),
					onClick: onModeratorsClick,
					isLast: !showParticipants,
					getTestId,
				}),
				showParticipants && renderParticipantItem({
					id: 'participants',
					title: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_PARTICIPANTS_TITLE'),
					subtitle: getParticipantsSubtitle(participants),
					leftContent: renderParticipantIcon(Icon.THREE_PERSONS, 'participants', getTestId),
					onClick: onParticipantsClick,
					isLast: true,
					getTestId,
				}),
			),
		);
	};

	module.exports = { ProjectCreateParticipantsBlock };
});

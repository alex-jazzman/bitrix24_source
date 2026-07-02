/**
 * @module layout/socialnetwork/project-v2/create/src/view/components/settings-block
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/components/settings-block', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { Loc } = require('loc');
	const { Component, Indent, Color } = require('tokens');
	const { getFeatureRestriction } = require('tariff-plan-restriction');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { createTestIdGenerator } = require('utils/test');

	const LEFT_ICON_SIZE = 40;
	const INNER_ICON_SIZE = 24;
	const SEPARATOR_LEFT_OFFSET = Component.paddingLr.toNumber() + LEFT_ICON_SIZE + Indent.XL.toNumber();

	const renderSettingsIcon = (icon, id, getTestId, isRestricted) => View(
		{
			testId: getTestId(`item-${id}-icon-wrap`),
			style: {
				width: LEFT_ICON_SIZE,
				height: LEFT_ICON_SIZE,
				borderRadius: LEFT_ICON_SIZE / 2,
				backgroundColor: isRestricted ? Color.base7.toHex() : Color.accentSoftBlue2.toHex(),
				alignItems: 'center',
				justifyContent: 'center',
			},
		},
		IconView({
			testId: getTestId(`item-${id}-icon`),
			icon: isRestricted ? Icon.LOCK : icon,
			size: INNER_ICON_SIZE,
			color: Color.accentMainPrimaryalt,
		}),
	);

	const renderSettingsItem = ({
		id,
		title,
		subtitle,
		leftIcon,
		onClick,
		isLast = false,
		isRestricted = false,
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
			onClick: () => onClick?.({ id }),
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
			renderSettingsIcon(leftIcon, id, getTestId, isRestricted),
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
					marginBottom: subtitle ? Indent.XS2.toNumber() : 0,
				},
			}),
			subtitle && Text5({
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

	const ProjectCreateSettingsBlock = ({
		testId,
		typeSubtitle,
		showPermissions = true,
		onItemClick,
	}) => {
		const getTestId = createTestIdGenerator({ prefix: testId });
		const { isRestricted } = getFeatureRestriction('socialnetwork_projects_access_permissions');

		return Area(
			{},
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
				renderSettingsItem({
					id: 'type',
					title: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TYPE_TITLE'),
					subtitle: typeSubtitle,
					leftIcon: Icon.SHIELD,
					onClick: onItemClick,
					getTestId,
				}),
				showPermissions && renderSettingsItem({
					id: 'permissions',
					title: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_PERMISSIONS_TITLE'),
					leftIcon: Icon.PERSON_SETTINGS,
					onClick: onItemClick,
					isRestricted: isRestricted(),
					getTestId,
				}),
				renderSettingsItem({
					id: 'additional-settings',
					title: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_ADDITIONAL_BLOCK_TITLE'),
					leftIcon: Icon.SETTINGS,
					onClick: onItemClick,
					isLast: true,
					getTestId,
				}),
			),
		);
	};

	module.exports = { ProjectCreateSettingsBlock };
});

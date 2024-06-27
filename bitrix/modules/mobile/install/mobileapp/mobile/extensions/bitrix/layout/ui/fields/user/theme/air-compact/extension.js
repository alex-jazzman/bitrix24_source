/**
 * @module layout/ui/fields/user/theme/air-compact
 */
jn.define('layout/ui/fields/user/theme/air-compact', (require, exports, module) => {
	const { Indent, Color } = require('tokens');
	const { UserFieldClass } = require('layout/ui/fields/user');
	const { withTheme } = require('layout/ui/fields/theme');

	const { Chip } = require('ui-system/blocks/chips/chip');
	const { Text4 } = require('ui-system/typography/text');
	const { IconView } = require('ui-system/blocks/icon');
	const { ElementsStack, Directions } = require('elements-stack');
	const { Entity } = require('layout/ui/fields/user/theme/air-compact/src/entity');

	const ICON_SIZE = 20;

	/**
	 * @param {UserField} field
	 * @return {Chip}
	 * @constructor
	 */
	const AirCompactThemeWrapper = ({ field }) => {
		const testId = `${field.testId}_COMPACT_FIELD`;

		let contentColor = null;
		let borderColor = null;

		if (field.isReadOnly())
		{
			contentColor = Color.base6;
			borderColor = Color.bgSeparatorPrimary;
		}
		else if (field.isEmpty())
		{
			contentColor = Color.base3;
			borderColor = Color.bgSeparatorPrimary;
		}
		else if (field.hasErrorMessage())
		{
			contentColor = Color.accentMainAlert;
			borderColor = Color.accentSoftRed1;
		}
		else
		{
			contentColor = Color.accentMainPrimary;
			borderColor = Color.accentSoftBlue1;
		}

		const entityList = field.getEntityList();
		const showName = entityList.length === 1;
		let userName = null;

		if (showName)
		{
			const entityUser = entityList[0];
			userName = Text4({
				testId: `${field.testId}_COMPACT_USER_${entityUser.id}_TITLE`,
				text: entityUser.title,
				color: contentColor,
				style: {
					marginLeft: Indent.XS.toNumber(),
					flexShrink: 2,
				},
				ellipsize: 'end',
				numberOfLines: 1,
			});
		}

		const children = field.isEmpty() ? [
			View(
				{
					testId: `${testId}_CONTENT_EMPTY_VIEW`,
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flexShrink: 2,
					},
				},
				IconView({
					testId: `${field.testId}__CONTENT_EMPTY_VIEW_ICON`,
					icon: field.getDefaultLeftIcon(),
					color: contentColor,
					size: ICON_SIZE,
				}),
				Text4({
					testId: `${testId}_COMPACT_FIELD_TEXT`,
					text: field.getTitleText(),
					color: contentColor,
					style: {
						marginLeft: Indent.XS.toNumber(),
						flexShrink: 2,
					},
					numberOfLines: 1,
					ellipsize: 'middle',
				}),
			),
		] : [
			IconView({
				testId: `${testId}_ICON`,
				icon: field.getDefaultLeftIcon(),
				color: contentColor,
				size: ICON_SIZE,
			}),
			ElementsStack(
				{
					direction: Directions.right,
					indent: 1,
					offset: Indent.S,
					showRest: true,
					maxElements: 3,
					textColor: contentColor,
					style: {
						marginLeft: Indent.XS.toNumber(),
						opacity: entityList.length > 1 && field.isReadOnly() ? 0.22 : 1,
					},
				},
				...entityList.map((entity) => Entity({
					field,
					entity,
					avatarSize: ICON_SIZE,
					canOpenEntity: false,
					avatarStyle: {
						opacity: entityList.length === 1 && field.isReadOnly() ? 0.22 : 1,
					},
				})),
			),
			userName,
		];

		return Chip({
			testId: `${field.testId}_COMPACT_FIELD`,
			style: {
				maxWidth: 250,
			},
			onClick: field.getContentClickHandler(),
			indent: {
				left: Indent.M,
				right: Indent.L,
			},
			backgroundColor: Color.bgContentPrimary,
			borderColor,
			children,
		});
	};

	/** @type {function(object): object} */
	const UserField = withTheme(UserFieldClass, AirCompactThemeWrapper);

	module.exports = {
		UserField,
	};
});

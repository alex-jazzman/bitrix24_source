/**
 * @module layout/socialnetwork/project-v2/create/src/view/type-settings
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/type-settings', (require, exports, module) => {
	const { Box } = require('ui-system/layout/box');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Text2, Text5 } = require('ui-system/typography/text');
	const { Component, Indent, Color } = require('tokens');
	const { Loc } = require('loc');
	const { Checkbox } = require('ui-system/form/checkbox');
	const { createTestIdGenerator } = require('utils/test');
	const { ProjectType } = require('layout/socialnetwork/project-v2/create/src/enum/project-type');

	const BORDER_RADIUS = 12;
	const SEPARATOR_HEIGHT = 1;
	const SEPARATOR_LEFT_OFFSET = Component.paddingLr.toNumber();

	const renderTypeItem = ({
		id,
		title,
		subtitle,
		selected,
		onClick,
		isLast,
		getTestId,
	}) => View(
		{
			testId: getTestId(`item-${id}`),
			style: {
				paddingHorizontal: Component.paddingLr.toNumber(),
				paddingVertical: Indent.XL.toNumber(),
			},
			onClick: () => onClick(id),
		},
		View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'center',
				},
			},
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
				}),
			),
			selected && new Checkbox({
				testId: getTestId(`item-${id}-checkbox`),
				checked: true,
				useState: false,
				size: 24,
			}),
		),
		!isLast && View({
			style: {
				position: 'absolute',
				left: SEPARATOR_LEFT_OFFSET,
				right: 0,
				bottom: 0,
				height: SEPARATOR_HEIGHT,
				backgroundColor: Color.bgSeparatorSecondary.toHex(),
			},
		}),
	);

	class ProjectCreateTypeSettings extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'project-create-type-settings',
				context: this,
			});

			this.state = {
				type: props.type ?? ProjectType.PUBLIC.getValue(),
			};
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					resizableByKeyboard: true,
				},
				AreaList(
					{
						testId: this.getTestId('area-list'),
						resizableByKeyboard: true,
						showsVerticalScrollIndicator: true,
					},
					Area(
						{
							isFirst: true,
						},
						View(
							{
								testId: this.getTestId('card'),
								style: {
									width: '100%',
									borderRadius: BORDER_RADIUS,
									borderWidth: 1,
									borderColor: Color.bgSeparatorPrimary.toHex(),
									backgroundColor: Color.bgContentPrimary.toHex(),
								},
							},
							...ProjectType.getEnums().map((item, index) => renderTypeItem({
								id: item.getValue(),
								title: Loc.getMessage(item.getTitleCode()),
								subtitle: Loc.getMessage(item.getSubtitleCode()),
								selected: this.state.type === item.getValue(),
								onClick: this.#onSelectType,
								isLast: index === ProjectType.getEnums().length - 1,
								getTestId: this.getTestId,
							})),
						),
					),
				),
			);
		}

		#onSelectType = (type) => {
			if (this.state.type === type)
			{
				return;
			}

			this.setState({ type }, () => {
				this.props.onChange?.({ type });
			});
		};
	}

	module.exports = {
		ProjectCreateTypeSettings: (props) => new ProjectCreateTypeSettings(props),
	};
});

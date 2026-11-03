/**
 * @module settings-v2/ui/items/src/font-size-switch
 */
jn.define('settings-v2/ui/items/src/font-size-switch', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { Card, CardDesign, BadgeStatusMode } = require('ui-system/layout/card');
	const { Text1, Text3, Text4 } = require('ui-system/typography/text');
	const { Color, Indent, Component } = require('tokens');
	const { NativeFontSizeService } = require('settings-v2/services/native');

	const PREVIEW_TEXT = 'Aa';

	const PREVIEW_HEIGHT = 54;

	const FontSizeLabel = {
		'1.0': '×1',
		'1.1': '×1.5',
		'1.2': '×2',
	};

	const FontSizePreview = {
		'1.0': { Component: Text4, accent: true, style: { fontSize: 22 } },
		'1.1': { Component: Text1, accent: true, style: { fontSize: 28 } },
		'1.2': { Component: Text1, accent: true, style: { fontSize: 34, lineHeight: 42 } },
	};

	class FontSizeSwitchItem extends LayoutComponent
	{
		/**
		 * @param {ItemProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'settings-font-size-item',
				context: this,
			});

			this.state = {
				selectedFontSize: props.value,
				isLoading: true,
			};

			this.options = [];

			props.controller.setOnCancel(() => {
				this.setState({
					selectedFontSize: props.value,
				});
			});
		}

		componentDidMount()
		{
			void this.loadOptions();
		}

		async loadOptions()
		{
			this.options = await NativeFontSizeService.getOptions();

			this.setState({
				isLoading: false,
			});
		}

		render()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'center',
					},
				},
				View(
					{
						testId: this.getTestId('list'),
						style: {
							flex: 1,
							flexDirection: 'row',
							maxWidth: 500,
							paddingVertical: Indent.M.toNumber(),
						},
					},
					...this.options.map((option, index) => this.renderFontSizeCard(option, index)),
				),
			);
		}

		renderFontSizeCard(option, index)
		{
			const selected = this.state.selectedFontSize === option;

			return View(
				{
					testId: this.getTestId(`card-wrapper-${option}`),
					onClick: () => this.onChange(option),
					style: {
						flex: 1,
						marginLeft: index === 0 ? 0 : Component.cardListGap.toNumber(),
					},
				},
				Card(
					{
						testId: this.getTestId(`font-size-card-${option}`),
						design: CardDesign.PRIMARY,
						accent: selected,
						border: true,
						badgeMode: selected ? BadgeStatusMode.SUCCESS : null,
						style: {
							alignItems: 'center',
						},
					},
					this.renderPreview(option),
				),
				Text3({
					testId: this.getTestId(`label-${option}`),
					text: FontSizeLabel[option] ?? option,
					color: Color.base1,
					numberOfLines: 1,
					style: {
						alignSelf: 'center',
						marginTop: Indent.S.toNumber(),
					},
				}),
			);
		}

		renderPreview(option)
		{
			const { Component: PreviewText, accent, style } = FontSizePreview[option] ?? { Component: Text3, accent: true };

			const textProps = {
				testId: this.getTestId(`preview-${option}`),
				text: PREVIEW_TEXT,
				color: Color.base1,
				accent,
			};

			if (style)
			{
				textProps.style = style;
			}

			return View(
				{
					testId: this.getTestId(`preview-wrapper-${option}`),
					style: {
						width: '100%',
						height: PREVIEW_HEIGHT,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				PreviewText(textProps),
			);
		}

		onChange = (option) => {
			if (this.state.selectedFontSize === option)
			{
				return;
			}

			const { id, controller, onChange } = this.props;

			this.setState({
				selectedFontSize: option,
			}, () => {
				if (onChange)
				{
					onChange(id, controller, option);
				}
			});
		};
	}

	module.exports = {
		FontSizeSwitchItem,
	};
});

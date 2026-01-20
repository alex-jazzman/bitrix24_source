/**
 * @module manual-testing-tools
 */
jn.define('manual-testing-tools', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text4 } = require('ui-system/typography/text');
	const { ToolFactory, ToolType } = require('manual-testing-tools/src/factory');
	const { BaseManualTestingTool } = require('manual-testing-tools/src/base-tool');
	const { FieldType } = require('manual-testing-tools/src/field');

	class ManualTestingToolList extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.tools = Object.values(ToolType).map((toolName) => ({ title: toolName }));
		}

		render()
		{
			return ListView({
				data: [{ items: this.tools }],
				renderItem: (tool) => this.renderItem(tool),
			});
		}

		renderItem(tool)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingVertical: Indent.XL2.toNumber(),
						borderBottomColor: Color.bgSeparatorSecondary.toHex(),
						borderBottomWidth: 1,
					},
					onClick: () => this.handleOnClick(tool),
				},
				this.renderTitle(tool.title),
				this.renderChevron(),
			);
		}

		renderTitle(title)
		{
			if (!title)
			{
				return null;
			}

			return View(
				{
					style: {
						flexDirection: 'row',
					},
				},
				this.renderIcon(),
				Text4({
					text: title,
				}),
			);
		}

		renderIcon()
		{
			return IconView({
				size: 30,
				icon: Icon.ROCKET,
				color: Color.copilotAccentPrimaryAlt,
				style: {
					marginRight: Indent.M.toNumber(),
				},
			});
		}

		renderChevron()
		{
			return IconView({
				size: 30,
				icon: Icon.CHEVRON_TO_THE_RIGHT_SIZE_S,
				color: Color.base3,
			});
		}

		handleOnClick(tool)
		{
			const ToolComponent = ToolFactory.create(tool.title);
			if (ToolComponent)
			{
				PageManager.openWidget(
					'layout',
					{
						title: `${tool.title} manual testing tool`,
						onReady: (layoutWidget) => {
							const component = (typeof ToolComponent === 'function') ? ToolComponent() : ToolComponent;
							layoutWidget.showComponent(component);
						},
					},
				);
			}
		}
	}

	module.exports = {
		BaseManualTestingTool,
		FieldType,
		ManualTestingToolList: (props) => new ManualTestingToolList(props),
	};
});

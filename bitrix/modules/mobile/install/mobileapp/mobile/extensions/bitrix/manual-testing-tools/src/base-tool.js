/**
 * @module manual-testing-tools/src/base-tool
 */
jn.define('manual-testing-tools/src/base-tool', (require, exports, module) => {
	const { H3 } = require('ui-system/typography/heading');
	const { Box } = require('ui-system/layout/box');
	const { Indent } = require('tokens');
	const { BaseToolField, FieldType } = require('manual-testing-tools/src/field');

	class BaseManualTestingTool extends LayoutComponent
	{
		/**
		 * @returns {array}
		 */
		getSettings()
		{
			return [];
		}

		render()
		{
			const settings = this.getSettings();

			return Box(
				{
					withScroll: true,
					resizableByKeyboard: true,
					safeArea: { bottom: true },
					style: {
						marginHorizontal: Indent.XL3.toNumber(),
						marginVertical: Indent.XL.toNumber(),
					},
				},
				...settings.map((setting) => this.renderSetting(setting)),
			);
		}

		renderSetting(setting)
		{
			if (setting.type === FieldType.GROUP)
			{
				return this.renderGroupSetting(setting);
			}

			const { id, title, value, onChange, testId, type, label } = setting;

			const content = [
				BaseToolField({
					id,
					testId,
					label,
					value,
					type,
					onChange,
				}),
			];

			return this.renderSettingContainer(title, content);
		}

		renderGroupSetting(setting)
		{
			const content = setting.fields.map((field) => BaseToolField(field));

			return this.renderSettingContainer(setting.title, content);
		}

		renderSettingContainer(title, children)
		{
			const nodes = [];

			if (title)
			{
				nodes.push(H3({ text: title }));
			}

			nodes.push(...children);

			return View(
				{
					style: {
						marginBottom: 10,
					},
				},
				...nodes,
			);
		}
	}

	module.exports = { BaseManualTestingTool };
});

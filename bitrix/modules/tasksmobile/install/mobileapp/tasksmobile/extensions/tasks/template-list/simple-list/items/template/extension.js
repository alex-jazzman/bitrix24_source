/**
 * @module tasks/template-list/simple-list/items/template
 */
jn.define('tasks/template-list/simple-list/items/template', (require, exports, module) => {
	const { Base } = require('layout/ui/simple-list/items/base');
	const { mergeImmutable } = require('utils/object');
	const { withPressed } = require('utils/color');
	const { TemplateContentView } = require('tasks/template-list/simple-list/items/template/src/template-content');

	class Template extends Base
	{
		templateContentRef = null;

		getStyles()
		{
			return mergeImmutable(super.getStyles(), {
				wrapper: {
					paddingBottom: 0,
					backgroundColor: this.colors.bgContentPrimary,
				},
				item: {
					position: 'relative',
					backgroundColor: withPressed(this.colors.bgContentPrimary),
				},
			});
		}

		renderItemContent()
		{
			const { testId, itemLayoutOptions, item } = this.props;

			return TemplateContentView({
				forwardedRef: this.bindRef,
				testId,
				itemLayoutOptions,
				id: item.id,
				template: item,
				showBorder: item.showBorder,
			});
		}

		bindRef = (ref) => {
			this.templateContentRef = ref;
		};

		async blink(callback, showUpdated)
		{
			await this.templateContentRef?.blink();
		}

		setLoading(callback)
		{
			this.blink(callback);
		}

		dropLoading(callback, blink = true)
		{
			this.blink(callback);
		}
	}

	module.exports = { Template };
});

/**
 * @module tasks/layout/fields/template/theme/air/src/content
 */
jn.define('tasks/layout/fields/template/theme/air/src/content', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { Text5 } = require('ui-system/typography/text');
	const { PureComponent } = require('layout/pure-component');

	class TemplateAirContent extends PureComponent
	{
		/**
		 * @returns {TemplateField}
		 */
		get #field()
		{
			return this.props.field;
		}

		/**
		 * @returns {string}
		 */
		get #testId()
		{
			return this.#field.testId;
		}

		render()
		{
			return View(
				{
					ref: this.#field.bindContainerRef,
				},
				View(
					{
						onClick: this.#field.getContentClickHandler(),
						testId: this.#testId,
					},
				),
			);
		}

		renderTitle()
		{
			return Text5({
				text: Loc.getMessage('TASKS_FIELDS_TEMPLATE_TITLE'),
				color: Color.base4,
			});
		}
	}

	module.exports = {
		TemplateAirContent,
	};
});

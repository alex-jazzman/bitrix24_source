/**
 * @module tasks/layout/task/create-new/src/description
 */
jn.define('tasks/layout/task/create-new/src/description', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { TaskField } = require('tasks/enum');
	const { TextEditor } = require('text-editor');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { PlainTextFormatter } = require('bbcode/formatter/plain-text-formatter');

	class Description extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.initialState(props);
		}

		componentWillReceiveProps(props)
		{
			this.initialState(props);
		}

		initialState(props)
		{
			this.state = {
				description: props.description,
			};
		}

		render()
		{
			const { description } = this.state;
			const { style, parentWidget, fileField } = this.props;

			return View(
				{
					style,
					testId: `${TaskField.DESCRIPTION}_FIELD`,
					onLayout: this.onLayout,
					onClick: () => {
						void TextEditor.edit({
							fileField,
							parentWidget,
							title: Loc.getMessage('TASKSMOBILE_TASK_CREATE_FIELD_DESCRIPTION_EDITOR_TITLE'),
							value: description,
							allowFiles: true,
							closeOnSave: true,
							onSave: this.onChange,
						});
					},
				},
				BBCodeText({
					testId: `${TaskField.DESCRIPTION}_CONTENT`,
					size: 4,
					color: Color.base2,
					ellipsize: 'end',
					numberOfLines: 4,
					value: this.getTextToShow(),
				}),
			);
		}

		onLayout = (params) => {
			const { onLayout } = this.props;
			onLayout?.(params);
		};

		onChange = ({ bbcode: description, files }) => {
			const { onChange } = this.props;

			onChange?.({ description, files });
			this.setState({ description });
		};

		getTextToShow()
		{
			const { description } = this.state;

			if (description.length === 0)
			{
				const text = Loc.getMessage('TASKSMOBILE_TASK_CREATE_FIELD_DESCRIPTION_PLACEHOLDER');

				return `[color=${Color.base5.toHex()}]${text}[/color]`;
			}

			const plaintTextFormatter = new PlainTextFormatter();
			const plainAst = plaintTextFormatter.format({ source: description });

			return plainAst.toString();
		}
	}

	module.exports = { Description };
});

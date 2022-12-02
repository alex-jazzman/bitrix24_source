/**
 * @module layout/ui/fields/textarea
 */
jn.define('layout/ui/fields/textarea', (require, exports, module) => {
	const { StringFieldClass } = require('layout/ui/fields/string');

	/**
	 * @class TextAreaField
	 */
	class TextAreaField extends StringFieldClass
	{
		constructor(props)
		{
			super(props);
			this.state.height = this.state.focus ? 20 : 1;
		}

		componentDidMount() {
			super.componentDidMount();
			this.initialValue = this.getValue();
		}

		getDefaultStyles()
		{
			const styles = super.getDefaultStyles();

			return {
				...styles,
				editableValue: {
					...styles.editableValue,
					flex: 1,
					height: this.getFieldHeight(),
					minHeight: this.state.height ? 20 : 1,
				},
			};
		}

		getFieldHeight()
		{
			if (Application.getPlatform() === 'ios')
			{
				return this.initialValue !== '' && this.initialValue === this.getValue() ? 'auto' : this.state.height
			}

			return 'auto';
		}

		getEllipsizeParams()
		{
			return this.getConfig().ellipsize ? {
				numberOfLines: 4,
				ellipsize: 'end',
			} : null;
		}

		renderEditableContent()
		{
			return TextInput(this.getFieldInputProps());
		}

		getFieldInputProps()
		{
			return {
				...super.getFieldInputProps(),
				multiline: (this.props.multiline || true),
				onSubmitEditing: this.getConfig().onSubmitEditing,
				onContentSizeChange: ({height}) => setTimeout(() => this.setState({height}), 50),
			};
		}
	}

	module.exports = {
		TextAreaType: 'textarea',
		TextAreaField: (props) => new TextAreaField(props),
	};
});

/**
 * @module crm/entity-name
 */
jn.define('crm/entity-name', (require, exports, module) => {
	const { StringField } = require('layout/ui/fields/string');

	class EntityName extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = {
				name: BX.prop.getString(this.props, 'name', ''),
			};
		}

		get title()
		{
			return BX.prop.getString(this.props, 'title', '');
		}

		get placeholder()
		{
			return BX.prop.getString(this.props, 'placeholder', '');
		}

		get required()
		{
			return BX.prop.getBoolean(this.props, 'required', false);
		}

		get showRequired()
		{
			return BX.prop.getBoolean(this.props, 'showRequired', false);
		}

		get config()
		{
			return BX.prop.get(this.props, 'config', {});
		}

		render()
		{
			return View(
				{
					style: {
						paddingTop: 18,
						paddingBottom: 18,
						paddingLeft: 20,
						paddingRight: 20,
						borderRadius: 12,
						backgroundColor: '#fff',
					},
				},
				StringField({
					title: this.title,
					value: this.state.name,
					placeholder: this.placeholder,
					required: this.required,
					showRequired: this.showRequired,
					config: this.config,
					onChange: (value) => {
						const { onChange } = this.props;
						this.setState({
							name: value,
						}, () => {
							if (onChange)
							{
								onChange(this.state.name);
							}
						});
					},
				}),
			);
		}

		onChange()
		{
			const { onChange } = this.props;

			if (onChange)
			{
				onChange(this.state.name);
			}
		}
	}

	module.exports = { EntityName };
});
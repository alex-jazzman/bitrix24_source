import './style.css';

// @vue/component
export const NodeSettingsVariable = {
	name: 'node-settings-variable',
	props:
	{
		variableName:
		{
			type: String,
			required: true,
		},
		variableValue:
		{
			type: String,
			required: true,
		},
	},
	template: `
		<div class="node-settings-variable">
			<span class="node-settings-variable_name">
				{{ variableName }}
			</span>
			<span class="node-settings-variable_eq">=</span>
			<span class="node-settings-variable_value">
				{{ variableValue }}
			</span>
		</div>
	`,
};

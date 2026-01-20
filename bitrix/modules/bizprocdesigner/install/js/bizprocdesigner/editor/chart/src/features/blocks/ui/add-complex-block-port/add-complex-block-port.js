import './style.css';

const PORT_POSITIONS = {
	right: 'right',
};

export const AddComplexBlockPort = {
	name: 'add-complex-block-port',
	props:
	{
		position:
		{
			type: String,
			required: true,
		},
		highlighted:
		{
			type: Boolean,
			required: true,
		},
	},
	computed:
	{
		pointClasses(): { [key: string]: boolean }
		{
			return {
				'--right': this.position === PORT_POSITIONS.right,
				'--highlighted': this.highlighted,
			};
		},
	},
	template: `
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="9"
			height="9"
			viewBox="0 0 9 9"
			fill="none"
			class="complex-block-port-add-point"
			:class="pointClasses"
		>
			<circle cx="4.5" cy="4.5" r="4" fill="white" stroke="#DFE0E3"/>
			<rect x="4" y="2" width="1" height="5" rx="0.5" fill="#DFE0E3"/>
			<rect x="2" y="5" width="1" height="5" rx="0.5" transform="rotate(-90 2 5)" fill="#DFE0E3"/>
		</svg>
	`,
};

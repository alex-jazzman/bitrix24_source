import './dropdown-menu-option.css';

// @vue/component
export const DropdownMenuOption = {
	name: 'DropdownMenuOption',
	props:
	{
		title:
		{
			type: String,
			default: '',
		},
		description:
		{
			type: String,
			default: '',
		},
		isActive:
		{
			type: Boolean,
			default: false,
		},
		notReleased: {
			type: Boolean,
			default: false,
		},
		// The item runs an operation of its own and waits for it: the state belongs to the control
		// the keyboard stands on, not to the row around it.
		busy: {
			type: Boolean,
			default: false,
		},
		// The item switches a state on and off instead of running an operation: such a control tells
		// that state itself, while an item that acts can only point at the state in force.
		toggle: {
			type: Boolean,
			default: false,
		},
	},
	computed:
	{
		// The row answers a click, so it is a control and is reached by Tab as one. An item that
		// answers nothing stays plain text: a button that does nothing only wastes a stop of Tab.
		isAction(): boolean
		{
			return Boolean(this.$attrs.onClick);
		},
		// The mark of the row is a border and nothing more, so the state travels in ARIA as well:
		// pressed for a switch, current for an item the state in force belongs to.
		ariaPressed(): ?string
		{
			if (!this.toggle || !this.isAction)
			{
				return null;
			}

			return this.isActive ? 'true' : 'false';
		},
		ariaCurrent(): ?string
		{
			return !this.toggle && this.isActive ? 'true' : null;
		},
	},
	template: `
		<li
			class="editor-chart-dropdown-menu-option"
			:class="{ '--selected': isActive }"
		>
			<component
				:is="isAction ? 'button' : 'div'"
				:type="isAction ? 'button' : null"
				class="editor-chart-dropdown-menu-option__control"
				:aria-busy="busy ? 'true' : null"
				:aria-pressed="ariaPressed"
				:aria-current="ariaCurrent"
			>
				<span class="editor-chart-dropdown-menu-option__content">
					<span class="editor-chart-dropdown-menu-option__title">
						{{ title }}
					</span>
					<span class="editor-chart-dropdown-menu-option__description">
						{{ description }}
					</span>
				</span>
				<span class="editor-chart-dropdown-menu-option__icon">
					<slot name="icon"/>
					<span
						v-if="notReleased"
						class="editor-chart-dropdown-menu-option__not-released-badge"
					>
						{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NOT_RELEASE_BADGE') }}
					</span>
				</span>
			</component>
		</li>
	`,
};

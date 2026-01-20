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
	},
	template: `
		<li
			class="editor-chart-dropdown-menu-option"
			:class="{ '--selected': isActive }"
		>
			<div class="editor-chart-dropdown-menu-option__content">
				<div class="editor-chart-dropdown-menu-option__title">
					{{ title }}
				</div>
				<div class="editor-chart-dropdown-menu-option__description">
					{{ description }}
				</div>
			</div>
			<div class="editor-chart-dropdown-menu-option__icon">
				<slot name="icon"/>
				<div
					v-if="notReleased"
					class="editor-chart-dropdown-menu-option__not-released-badge"
				>
					{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NOT_RELEASE_BADGE') }}
				</div>
			</div>
		</li>
	`,
};

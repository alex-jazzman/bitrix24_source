import { Event } from 'main.core';
import './dropdown-menu-button.css';
import { SplitButton } from '../../../../shared/ui';

type DropdownMenuButtonData = {
	isOpen: boolean,
};

// @vue/components
export const DropdownMenuButton = {
	name: 'DropdownMenuButton',
	components: {
		SplitButton,
	},
	props:
	{
		text:
		{
			type: String,
			default: '',
		},
		icon:
		{
			type: String,
			default: '',
		},
		loading:
		{
			type: Boolean,
			default: false,
		},
	},
	emits: ['change'],
	data(): DropdownMenuButtonData
	{
		return {
			isOpen: false,
		};
	},
	mounted()
	{
		Event.bind(document, 'mousedown', this.handleClickOutside);
	},
	beforeUnmount()
	{
		Event.unbind(document, 'mousedown', this.handleClickOutside);
	},
	methods:
	{
		onToggleDropdown(): void
		{
			this.isOpen = !this.isOpen;
		},
		handleClickOutside(event: MouseEvent): void
		{
			const dropdown = this.$el;

			if (dropdown && !dropdown?.contains(event.target))
			{
				this.isOpen = false;
			}
		},
	},
	template: `
		<div class="editor-chart-dropdown-menu-button">
			<SplitButton
				:text="text"
				:icon="icon"
				:loading="loading"
				@mainClick="$emit('change')"
				@menuClick="onToggleDropdown"
			/>
			<transition name="slide-fade">
				<div v-if="isOpen"
					class="editor-chart-dropdown-menu-button__menu-content"
					ref="dropdownMenu"
				>
					<ul class="editor-chart-dropdown-menu-button__list">
						<slot/>
					</ul>
					<div class="editor-chart-dropdown-menu-button__footer">
						<a
							href="#"
							class="editor-chart-dropdown-menu-button__help-link"
						>
							{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLICATION_LINK') }}
						</a>
					</div>
				</div>
			</transition>
		</div>
	`,
};

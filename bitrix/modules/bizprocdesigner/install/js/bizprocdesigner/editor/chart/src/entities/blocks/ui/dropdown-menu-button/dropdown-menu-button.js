import { Event, Text } from 'main.core';
import { hint } from 'ui.vue3.directives.hint';
import './dropdown-menu-button.css';
import { SplitButton } from '../../../../shared/ui';

type DropdownMenuButtonData = {
	isOpen: boolean,
	hintDescriptionId: string,
};

// The caret of the split button: the menu is opened from it, and the focus comes back to it.
const MENU_BUTTON_SELECTOR = '[data-testid="bizprocdesigner-split-button-menu"]';

// @vue/components
export const DropdownMenuButton = {
	name: 'DropdownMenuButton',
	directives: {
		hint,
	},
	components: {
		SplitButton,
	},
	provide(): Object
	{
		return {
			// An item of the menu may be an action of its own, and then the menu it was chosen in has
			// nothing left to show. Only the button owns whether the menu is open.
			dropdownMenu: {
				close: this.closeDropdown,
			},
		};
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
		style:
		{
			type: String,
			default: null,
		},
		disabled:
		{
			type: Boolean,
			default: false,
		},
		hint:
		{
			type: Object,
			default: null,
		},
		// The menu shown and kept open from outside the button: while it is held, the menu survives a
		// click anywhere on the page.
		keepOpen:
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
			hintDescriptionId: `editor-chart-dropdown-menu-button-hint-${Text.getRandom()}`,
		};
	},
	computed:
	{
		isMenuShown(): boolean
		{
			return this.keepOpen || this.isOpen;
		},
		// A disabled button is skipped by Tab, so the hover-only hint never reaches a keyboard or screen
		// reader user. The same text is rendered off-screen and bound to the button as its description.
		hintDescription(): ?string
		{
			return this.disabled ? (this.hint?.text ?? null) : null;
		},
		describedBy(): ?string
		{
			return this.hintDescription ? this.hintDescriptionId : null;
		},
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
		handleMainClick(): void
		{
			// The waiting state of the platform button is drawn, not enforced: it lets the clicks
			// through. A button that already shows an operation running answers no new one.
			if (this.disabled || this.loading)
			{
				return;
			}

			this.$emit('change');
		},
		onToggleDropdown(): void
		{
			if (this.disabled)
			{
				return;
			}

			// A menu held open from outside is not the caret's to take away: the step of the tour points at
			// an item of it. What the caret must not do either is overwrite the choice of the user, so a
			// menu they opened themselves is still open once the hold is over.
			if (this.keepOpen)
			{
				return;
			}

			this.isOpen = !this.isOpen;
		},
		handleClickOutside(event: MouseEvent): void
		{
			if (this.keepOpen)
			{
				return;
			}

			const dropdown = this.$el;

			if (dropdown && !dropdown?.contains(event.target))
			{
				this.closeDropdown();
			}
		},
		closeDropdown(): void
		{
			this.returnFocusToMenuButton();
			this.isOpen = false;
		},
		// The menu goes away together with the item the keyboard stands on - an item of the menu closes it
		// once its own operation is over - so the focus goes back to the caret the menu was opened from
		// instead of falling onto the page. A focus that is already elsewhere is left where the user put it.
		returnFocusToMenuButton(): void
		{
			if (!this.$refs.dropdownMenu?.contains(document.activeElement))
			{
				return;
			}

			this.$el?.querySelector(MENU_BUTTON_SELECTOR)?.focus();
		},
	},
	template: `
		<div class="editor-chart-dropdown-menu-button" v-hint="hint">
			<SplitButton
				:text="text"
				:icon="icon"
				:loading="loading"
				:style="style"
				:disabled="disabled"
				:describedBy="describedBy"
				@mainClick="handleMainClick"
				@menuClick="onToggleDropdown"
			/>
			<span
				v-if="hintDescription"
				:id="hintDescriptionId"
				class="editor-chart-dropdown-menu-button__hint-description"
			>{{ hintDescription }}</span>
			<transition name="slide-fade">
				<div v-if="isMenuShown"
					class="editor-chart-dropdown-menu-button__menu-content"
					data-testid="bizprocdesigner-dropdown-menu"
					ref="dropdownMenu"
				>
					<ul class="editor-chart-dropdown-menu-button__list">
						<slot/>
					</ul>
					<div class="editor-chart-dropdown-menu-button__footer">
						<a
							href="#"
							class="editor-chart-dropdown-menu-button__help-link"
							data-testid="bizprocdesigner-dropdown-menu-help-link"
						>
							{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_PUBLICATION_LINK') }}
						</a>
					</div>
				</div>
			</transition>
		</div>
	`,
};

import { Extension } from 'main.core';
import { mapGetters } from 'ui.vue3.vuex';
import { BMenu, type MenuOptions } from 'ui.vue3.components.menu';

import { Model } from 'booking.const';
import { Button as UiButton, ButtonColor, ButtonSize, ButtonIcon } from 'booking.component.button';

const webForms = Extension.getSettings('booking.booking').webForms;

// @vue/component
export const SettingsButton = {
	components: {
		UiButton,
		BMenu,
	},
	props: {
		container: {
			type: HTMLElement,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			ButtonColor,
			ButtonSize,
			ButtonIcon,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		...mapGetters({
			expanded: `${Model.Interface}/expanded`,
		}),
		menuOptions(): MenuOptions
		{
			const createSection = 'create';

			return {
				id: 'booking-settings-menu',
				bindElement: this.$refs.button.$el,
				offsetTop: 8,
				sections: [
					{
						code: createSection,
					},
				],
				items: [
					{
						title: this.loc('BOOKING_TOP_MENU_ITEM_FORMS_ALL_FORMS'),
						onClick: this.openAllForms,
					},
					{
						sectionCode: createSection,
						title: this.loc('BOOKING_TOP_MENU_ITEM_FORMS_CREATE_FORM'),
						subMenu: {
							items: webForms.presets.map((preset) => ({
								title: preset.NAME,
								onClick: () => this.createFormFromPreset(preset.LINK),
							})),
						},
					},
				],
			};
		},
	},
	mounted(): void
	{
		this.container.replaceWith(this.$refs.button.$el);
	},
	methods: {
		handleClick(): void
		{
			this.isMenuShown = true;
		},
		openAllForms(): void
		{
			BX.SidePanel.Instance.open(webForms.link, { cacheable: false });
		},
		createFormFromPreset(link: string): void
		{
			window.open(link, '_blank');
		},
	},
	template: `
		<UiButton
			v-show="expanded"
			buttonClass="ui-btn-themes"
			:color="ButtonColor.LIGHT_BORDER"
			:size="ButtonSize.SMALL"
			:icon="ButtonIcon.DOTS"
			ref="button"
			@click="handleClick"
		/>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};

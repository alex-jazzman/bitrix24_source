import { Loc } from 'main.core';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.vue';

// @vue/component
export const SharingAccessButtons = {
	name: 'SharingAccessButtons',
	components: { UiButton },
	props: {
		isPublic: { type: Boolean, required: true },
	},
	emits: ['update:isPublic'],
	computed: {
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		Outline: () => Outline,
	},
	methods: {
		setPublic(value)
		{
			this.$emit('update:isPublic', value);
		},
	},
	template: `
		<div class="disk-sharing-access-popup__buttons">
			<UiButton
				text="${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_ACCESSIBILITY_BUTTON')}"
				:leftIcon="Outline.GROUP"
				:size="ButtonSize.MEDIUM"
				:style="!isPublic ? AirButtonStyle.SELECTION : AirButtonStyle.OUTLINE"
				:remove-right-corners="true"
				:wide="true"
				@click="setPublic(false)"
			/>
			<UiButton
				text="${Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_ACCESSIBILITY_BUTTON')}"
				:leftIcon="Outline.EARTH"
				:size="ButtonSize.MEDIUM"
				:style="isPublic ? AirButtonStyle.SELECTION : AirButtonStyle.OUTLINE"
				:remove-left-corners="true"
				:wide="true"
				@click="setPublic(true)"
			/>
		</div>
	`,
};

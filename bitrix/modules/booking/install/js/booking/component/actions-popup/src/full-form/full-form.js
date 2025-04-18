import { hint } from 'ui.vue3.directives.hint';
import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';

import './full-form.css';

export const FullForm = {
	name: 'ActionsPopupFullForm',
	directives: {
		hint,
	},
	computed: {
		arrowIcon(): string
		{
			return IconSet.CHEVRON_RIGHT;
		},
		arrowIconSize(): number
		{
			return 12;
		},
		arrowIconColor(): string
		{
			return 'var(--ui-color-palette-gray-40)';
		},
		soonHint(): Object
		{
			return {
				text: this.loc('BOOKING_BOOKING_SOON_HINT'),
				popupOptions: {
					offsetLeft: 60,
				},
			};
		},
	},
	components: {
		Icon,
	},
	template: `
		<div
			v-hint="soonHint"
			class="booking-actions-popup__item booking-actions-popup__item-full-form-content --disabled"
			role="button"
			tabindex="0"
		>
			<div class="booking-actions-popup__item-full-form-label">
				{{ loc('BB_ACTIONS_POPUP_FULL_FORM_LABEL') }}
			</div>
			<div class="booking-actions-popup__item-full-form-icon">
				<Icon :name="arrowIcon" :size="arrowIconSize" :color="arrowIconColor"/>
			</div>
		</div>
	`,
};

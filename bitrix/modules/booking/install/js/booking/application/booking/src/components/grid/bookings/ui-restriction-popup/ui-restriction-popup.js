import { Popup as MainPopup } from 'main.popup';
import { mapGetters } from 'ui.vue3.vuex';

import { Popup } from 'booking.component.popup';
import { Model } from 'booking.const';
import './ui-restriction-popup.css';

// @vue/component
export const UiRestrictionPopup = {
	name: 'UiRestrictionPopup',
	components: {
		Popup,
	},
	props: {
		message: {
			type: String,
			required: true,
		},
		popupId: {
			type: String,
			required: true,
		},
	},
	emits: ['close'],
	computed: {
		...mapGetters({
			mousePosition: `${Model.Interface}/mousePosition`,
		}),
		config(): Object
		{
			const width = 200;
			const angleLeft = MainPopup.getOption('angleMinBottom');
			const angleOffset = width / 2 - angleLeft;

			return {
				bindElement: this.mousePosition,
				width,
				background: '#2878ca',
				offsetTop: -5,
				offsetLeft: -angleOffset + angleLeft,
				bindOptions: {
					forceBindPosition: true,
					position: 'top',
				},
				angle: {
					offset: angleOffset,
					position: 'bottom',
				},
				angleBorderRadius: 'var(--ui-border-radius-2xs) 0',
				autoHide: false,
			};
		},
	},
	watch: {
		mousePosition: {
			handler(): void
			{
				this.adjustPosition();
			},
			deep: true,
		},
	},
	methods: {
		adjustPosition(): void
		{
			const popup = this.$refs.popup?.getPopupInstance();
			if (!popup)
			{
				return;
			}

			popup.setBindElement(this.mousePosition);
			popup.adjustPosition();
		},
		closePopup(): void
		{
			this.$emit('close');
		},
	},
	template: `
		<Popup
			v-if="mousePosition.left !== 0 && mousePosition.top !== 0"
			:id="popupId"
			:config="config"
			ref="popup"
			@close="closePopup"
		>
			<div class="booking-booking-restriction-popup">
				{{ message }}
			</div>
		</Popup>
	`,
};

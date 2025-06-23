import { PopupManager } from 'main.popup';
import { mapGetters } from 'ui.vue3.vuex';

import { ClientPopup, CLIENT_POPUP_ID } from 'booking.component.client-popup';
import { Model } from 'booking.const';
import { limit } from 'booking.lib.limit';

import './add-client.css';

// @vue/component
export const AddClient = {
	name: 'AddClient',
	components: {
		ClientPopup,
	},
	props: {
		expired: {
			type: Boolean,
			default: false,
		},
		dataAttributes: {
			type: Object,
			default: () => ({}),
		},
		buttonClass: {
			type: String,
			default: '',
		},
		popupOffsetLeft: {
			type: Number,
			default: null,
		},
	},
	emits: ['add'],
	data(): Object
	{
		return {
			showPopup: false,
		};
	},
	computed: {
		...mapGetters({
			providerModuleId: `${Model.Clients}/providerModuleId`,
			isFeatureEnabled: `${Model.Interface}/isFeatureEnabled`,
		}),
		offsetLeft(): number
		{
			if (this.popupOffsetLeft === null)
			{
				return this.$refs.button.offsetWidth + 10;
			}

			return this.popupOffsetLeft;
		},
	},
	methods: {
		clickHandler(): void
		{
			if (!this.isFeatureEnabled)
			{
				limit.show();

				return;
			}

			PopupManager.getPopupById(CLIENT_POPUP_ID)?.destroy();

			this.showPopup = true;
		},
	},
	template: `
		<div
			v-if="providerModuleId"
			class="booking--booking-base--add-client-button"
			:class="[buttonClass, { '--expired': expired }]"
			v-bind="$props.dataAttributes"
			ref="button"
			@click="clickHandler"
		>
			{{ loc('BOOKING_BOOKING_PLUS_CLIENT') }}
		</div>
		<ClientPopup
			v-if="showPopup"
			:bindElement="this.$refs.button"
			:offset-top="-100"
			:offset-left="offsetLeft"
			@create="$emit('add', $event)"
			@close="showPopup = false"
		/>
	`,
};

import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
// eslint-disable-next-line no-unused-vars
import type { WaitListItemModel } from 'booking.model.wait-list';

import { WaitListItemActionsPopup } from './actions-popup/actions-popup';
import './actions.css';

// @vue/component
export const WaitListItemActions = {
	name: 'WaitListItemActions',
	components: {
		WaitListItemActionsPopup,
	},
	props: {
		/**
		 * @type {WaitListItemModel}
		 */
		waitListItem: {
			type: Object,
			required: true,
		},
	},
	computed: {
		...mapGetters({
			editingWaitListItemId: `${Model.Interface}/editingWaitListItemId`,
			isEditingBookingMode: `${Model.Interface}/isEditingBookingMode`,
			isMenuOpenedForWaitListItem: `${Model.Interface}/isMenuOpenedForWaitListItem`,
		}),
	},
	async mounted(): void
	{
		if (this.isEditingBookingMode && this.editingWaitListItemId === this.waitListItem.id)
		{
			await this.$store.dispatch(
				`${Model.Interface}/setMenuOpenedForWaitListItem`,
				this.waitListItem.id,
			);
		}
	},
	methods: {
		async clickHandler(): void
		{
			const currentId = this.waitListItem.id;
			const waitListItemId = this.isMenuOpenedForWaitListItem(currentId)
				? 0
				: currentId
			;
			await this.$store.dispatch(
				`${Model.Interface}/setMenuOpenedForWaitListItem`,
				waitListItemId,
			);
		},
		async onClose(): void
		{
			if (this.isMenuOpenedForWaitListItem(this.waitListItem.id))
			{
				await this.$store.dispatch(
					`${Model.Interface}/setMenuOpenedForWaitListItem`,
					0,
				);
			}
		},
	},
	template: `
		<div
			ref="node"
			class="booking-booking-booking-actions booking--wait-list-item-actions"
			data-element="booking-wait-list-item-actions-button"
			:data-id="waitListItem.id"
			@click="clickHandler"
		>
			<div class="booking-booking-booking-actions-inner">
				<div class="ui-icon-set --chevron-down"></div>
			</div>
		</div>
		<WaitListItemActionsPopup
			v-if="isMenuOpenedForWaitListItem(waitListItem.id)"
			:waitListItem
			:bindElement="$refs.node"
			@close="onClose()"
		/>
	`,
};

import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { NotePopup } from 'booking.component.note-popup';
import { bookingService } from 'booking.provider.service.booking-service';
import type { BookingModel } from 'booking.model.bookings';
import type { NotePopupSavePayload } from 'booking.component.note-popup';

import './note.css';

export const Note = {
	props: {
		bookingId: {
			type: [Number, String],
			required: true,
		},
		bindElement: {
			type: Function,
			required: true,
		},
	},
	data(): Object
	{
		return {
			isPopupShown: false,
			isEditMode: false,
		};
	},
	computed: {
		...mapGetters({
			isFeatureEnabled: `${Model.Interface}/isFeatureEnabled`,
		}),
		booking(): BookingModel
		{
			return this.$store.getters[`${Model.Bookings}/getById`](this.bookingId);
		},
		hasNote(): boolean
		{
			return Boolean(this.booking.note);
		},
	},
	methods: {
		showViewPopup(): void
		{
			if (this.isPopupShown || !this.hasNote)
			{
				return;
			}

			this.isEditMode = false;
			this.isPopupShown = true;
		},
		closeViewPopup(): void
		{
			if (this.isEditMode)
			{
				return;
			}

			this.isPopupShown = false;
		},
		showEditPopup(): void
		{
			this.isEditMode = true;
			this.isPopupShown = true;
		},
		closeEditPopup(): void
		{
			if (!this.isEditMode)
			{
				return;
			}

			this.isPopupShown = false;
		},
		async saveBookingNote({ note }: NotePopupSavePayload): Promise<void>
		{
			await bookingService.update({
				id: this.booking.id,
				note,
			});
		},
	},
	components: {
		NotePopup,
	},
	template: `
		<div class="booking-booking-booking-note">
			<div
				class="booking-booking-booking-note-button"
				:class="{'--has-note': hasNote}"
				data-element="booking-booking-note-button"
				:data-id="bookingId"
				@click="showEditPopup"
			>
				<div class="ui-icon-set --note"></div>
			</div>
		</div>
		<NotePopup
			v-if="isPopupShown"
			:isEditMode="isEditMode && isFeatureEnabled"
			:id="bookingId"
			:text="booking.note"
			:bindElement="bindElement"
			:dataId="bookingId"
			dataElementPrefix="booking"
			@close="closeEditPopup"
			@save="saveBookingNote"
		/>
	`,
};

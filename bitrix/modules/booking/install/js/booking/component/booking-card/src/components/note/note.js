import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { NotePopup } from 'booking.component.note-popup';

import './note.css';

export type { NotePopupSavePayload } from 'booking.component.note-popup';

// @vue/component
export const Note = {
	name: 'BookingCardNote',
	components: {
		NotePopup,
	},
	inject: {
		/** @type{ AbstractCardDataService } */
		cardDataService: {},
	},
	props: {
		bindElement: {
			type: Function,
			required: true,
		},
		note: {
			type: String,
			default: '',
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
		itemId(): number
		{
			return this.cardDataService.itemId;
		},
		hasNote(): boolean
		{
			return Boolean(this.noteText);
		},
		noteText(): string
		{
			return this.cardDataService.note;
		},
		dataAttributes(): Object
		{
			return this.cardDataService.buildDataAttributes('booking-booking-card-note-button');
		},
	},
	methods: {
		onNoteMouseEnter(): void
		{
			this.showNoteTimeout = setTimeout(this.showViewPopup, 100);
		},
		onNoteMouseLeave(): void
		{
			clearTimeout(this.showNoteTimeout);
			this.closeViewPopup();
		},
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
		async handleSave(payload): Promise<void>
		{
			await this.cardDataService.saveNote(payload.note);
		},
	},
	template: `
		<div 
			class="booking-booking-card__note"
			@click="showViewPopup"
			@mouseenter="onNoteMouseEnter"
			@mouseleave="onNoteMouseLeave"
		>
			<div
				class="booking-booking-card__note-button"
				:class="{'--has-note': hasNote}"
				v-bind="dataAttributes"
				@click="showEditPopup"
			>
				<div class="ui-icon-set --note"></div>
			</div>
		</div>
		<NotePopup
			v-if="isPopupShown"
			:isEditMode="isEditMode && isFeatureEnabled"
			:id="itemId"
			:dataId="itemId"
			:dataElementPrefix="cardDataService.dataKindAttribute"
			:text="noteText"
			:bindElement
			@close="closeEditPopup"
			@save="handleSave"
		/>
	`,
};

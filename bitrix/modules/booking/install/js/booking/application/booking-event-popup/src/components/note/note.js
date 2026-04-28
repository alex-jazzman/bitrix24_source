import { mapGetters } from 'ui.vue3.vuex';
import { BIcon as UiIcon, Outline } from 'ui.icon-set.api.vue';
import { RichLoc } from 'ui.vue3.components.rich-loc';

import { Model } from 'booking.const';

import './note.css';

// @vue/component
export const BookingEventPopupNote = {
	name: 'BookingEventPopupNote',
	components: {
		RichLoc,
		UiIcon,
	},
	setup(): { iconName: string }
	{
		const iconName = Outline.NOTE;

		return {
			iconName,
		};
	},
	data(): { showedMore: boolean }
	{
		return {
			showedMore: false,
		};
	},
	computed: {
		...mapGetters({
			note: `${Model.BookingInfo}/note`,
		}),
		shortNote(): string
		{
			if (this.showedMore)
			{
				return this.note;
			}

			const moreText = this.extractMoreText(this.loc('BOOKING_EVENT_POPUP_NOTE_MORE_MSGVER_1', {
				'#NOTE#': '',
			}));

			return this.note.slice(0, 100 - moreText.length - 3).trimEnd();
		},
		richLocText(): string
		{
			return this.loc('BOOKING_EVENT_POPUP_NOTE_MORE_MSGVER_1', {
				'#NOTE#': this.shortNote,
			});
		},

	},
	methods: {
		extractMoreText(text): string
		{
			const regex = /\[button](.*?)\[\/button]/;
			const matchResult = text.match(regex);

			if (matchResult && matchResult.length > 1)
			{
				return matchResult[1];
			}

			return '';
		},
	},
	template: `
		<div class="booking-event-popup__person-info">
			<div class="booking-event-popup__person-info_icon">
				<UiIcon :name="iconName" :size="22" color="rgba(250, 167, 44, 1)"/>
			</div>
			<div class="booking-event-popup__person-info_text">
				<RichLoc v-if="shortNote.length < note.length" :text="richLocText" placeholder="[button]">
					<template #button="{ text }">
						<span
							class="booking-event-popup__person-info_text-more"
							@click="showedMore = true"
						>
							{{ text }}
						</span>
					</template>
				</RichLoc>
				<text v-else>
					{{ note }}
				</text>
			</div>
		</div>
	`,
};

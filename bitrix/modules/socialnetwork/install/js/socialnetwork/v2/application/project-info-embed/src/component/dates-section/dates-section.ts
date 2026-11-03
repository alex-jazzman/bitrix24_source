import { DateTimeFormat } from 'main.date';
import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { TextSm } from 'ui.system.typography.vue';

import { formatCalendarDate, formatProjectDates } from '../../lib/format-project-dates/format-project-dates';
import { type ProjectDates } from '../../model/project-view-info/types';

export const DatesSection = defineComponent({
	name: 'SocialnetworkProjectInfoDatesSection',
	components: {
		TextSm,
	},
	mixins: [locMixin],
	props: {
		dates: {
			type: Object as PropType<ProjectDates | null>,
			default: null,
		},
	},
	computed: {
		formatted(): string
		{
			return formatProjectDates(
				this.dates,
				(date) => formatCalendarDate(date, (timestamp, utc) => {
					const format = DateTimeFormat.getFormat('LONG_DATE_FORMAT') || '';

					return DateTimeFormat.format(format, timestamp, null, utc);
				}),
				(phrase, replacements) => this.loc(phrase, replacements),
			);
		},
	},
	template: `
		<TextSm v-if="formatted">{{ formatted }}</TextSm>
		<TextSm v-else class="sonet-project-info-empty">
			{{ loc('SONET_PROJECT_INFO_EMBED_DATES_EMPTY') }}
		</TextSm>
	`,
});

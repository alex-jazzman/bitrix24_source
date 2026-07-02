import { DateTimeFormat } from 'main.date';

// @vue/component
export const VacationPlaceholder = {
	name: 'VacationPlaceholder',
	props: {
		vacationDate: {
			type: Date,
			required: true,
		},
	},
	computed: {
		preparedVacationText(): string
		{
			return this.loc('IM_LIST_RECENT_VACATION', {
				'#VACATION_END_DATE#': this.formattedVacationEndDate,
			});
		},
		formattedVacationEndDate(): string
		{
			return DateTimeFormat.format('d.m.Y', this.vacationDate);
		},
	},
	methods: {
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<span class="bx-im-list-recent-item__balloon_container --vacation">
			<span class="bx-im-list-recent-item__balloon">
				{{ preparedVacationText }}
			</span>
		</span>
	`,
};

import { defineComponent, type PropType } from 'ui.vue3';

/** Both lists show the same two strings; only a message carries a stamp behind them. */
type CellDate = {
	short: string,
	title: string,
};

/**
 * When the message arrived, already resolved on the server together with the full date of the
 * tooltip. The tooltip holds a line break of its own, and a break is what the attribute is given:
 * the markup used to carry a character reference for it, and an attribute is not markup.
 */
// @vue/component
export const DateCell = defineComponent({
	name: 'MailMessageGridDateCell',

	props: {
		date: {
			type: Object as PropType<CellDate>,
			required: true,
		},
		/** Composite identifier of the row; the cells of one row share a class built from it. */
		rowId: {
			type: String,
			required: true,
		},
		unseen: {
			type: Boolean,
			default: false,
		},
	},

	computed: {
		cellClass(): Record<string, boolean>
		{
			return {
				'mail-msg-list-date-block': true,
				[`mail-msg-list-cell-${this.rowId}`]: true,
				'mail-msg-list-cell-unseen': this.unseen,
			};
		},
	},

	template: `
		<span :class="cellClass" :title="date.title">
			<span class="mail-msg-date-title">{{ date.short }}</span>
		</span>
	`,
});

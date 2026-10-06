import { hint } from 'ui.vue3.directives.hint';

import { getLastValueHintParams, hasHiddenCollectionItems, type LastValueHintParams } from '../../utils/last-value-hint';

import './inspector-value-cell.css';

/**
 * Carrier of the last value in the data inspector: shrinks to its text and shows the hint only
 * when the hint adds something to what the cell already shows, either the text does not fit,
 * or the collection has elements the cell leaves out. Shrinking to the text is what keeps the
 * hint popup bound to the value, so the carrier owns those rules itself.
 */
// @vue/component
export const InspectorValueCell = {
	name: 'InspectorValueCell',
	directives: {
		hint,
	},
	props: {
		item: {
			/** @type InspectorViewItem */
			type: Object,
			required: true,
		},
	},
	data(): { isTruncated: boolean, carrierWidth: number }
	{
		return {
			isTruncated: false,
			carrierWidth: 0,
		};
	},
	computed: {
		value(): string
		{
			return this.item.exampleValue ?? '';
		},
		valueHint(): ?LastValueHintParams
		{
			if (!hasHiddenCollectionItems(this.item) && !this.isTruncated)
			{
				return null;
			}

			return getLastValueHintParams(this.item, this.carrierWidth);
		},
	},
	watch: {
		// rows are reused on pagination and on node switching, so remeasure on a new value
		value(): void
		{
			void this.$nextTick(() => this.updateMetrics());
		},
	},
	created(): void
	{
		this.resizeObserver = null;
	},
	mounted(): void
	{
		this.updateMetrics();

		// typeof, not Type.isFunction: the identifier may be absent, and reading it would throw
		if (typeof ResizeObserver === 'function')
		{
			this.resizeObserver = new ResizeObserver(() => this.updateMetrics());
			this.resizeObserver.observe(this.$el);
		}
	},
	beforeUnmount(): void
	{
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	},
	methods: {
		updateMetrics(): void
		{
			// both metrics are rounded to integers, so a value that fits tightly reads as
			// one pixel wider than the box: below that a hint would only repeat what is visible
			const isTruncated = this.$el.scrollWidth - this.$el.clientWidth > 1;

			// the same width the hint directive measures to place the popup angle
			const carrierWidth = this.$el.getBoundingClientRect().width;

			// assigning unconditionally would loop through updated -> observer -> updated
			if (isTruncated !== this.isTruncated)
			{
				this.isTruncated = isTruncated;
			}

			if (carrierWidth !== this.carrierWidth)
			{
				this.carrierWidth = carrierWidth;
			}
		},
	},
	template: `
		<span class="editor-chart-inspector-value-cell" v-hint="valueHint">{{ value }}</span>
	`,
};

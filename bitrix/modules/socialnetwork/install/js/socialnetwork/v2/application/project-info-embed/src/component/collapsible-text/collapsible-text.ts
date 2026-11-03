import { Text } from 'main.core';
import { defineComponent, markRaw } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { TextSm } from 'ui.system.typography.vue';

import { isTextTruncated } from '../../lib/is-text-truncated/is-text-truncated';
import './collapsible-text.css';

const DEFAULT_LINE_CLAMP = 3;

type CollapsibleTextData = {
	isTruncated: boolean,
	isExpanded: boolean,
	textId: string,
	resizeObserver: ResizeObserver | null,
};

export const CollapsibleText = defineComponent({
	name: 'SocialnetworkProjectInfoCollapsibleText',
	components: {
		TextSm,
	},
	mixins: [locMixin],
	props: {
		text: {
			type: String,
			default: '',
		},
		lineClamp: {
			type: Number,
			default: DEFAULT_LINE_CLAMP,
		},
		// Short, title-like text reads better with its lines evened out; running
		// body copy does not, so it keeps the orphan-avoiding default.
		balanced: {
			type: Boolean,
			default: false,
		},
		// The goal leads the block and carries a little more weight than the
		// running text under it.
		accent: {
			type: Boolean,
			default: false,
		},
	},
	data(): CollapsibleTextData
	{
		return {
			isTruncated: false,
			isExpanded: false,
			textId: `sonet-project-info-text-${Text.getRandom()}`,
			resizeObserver: null,
		};
	},
	computed: {
		clampStyle(): { [key: string]: number }
		{
			return { '--sonet-project-info-line-clamp': this.lineClamp };
		},
		toggleText(): string
		{
			const phrase = this.isExpanded
				? 'SONET_PROJECT_INFO_EMBED_TEXT_COLLAPSE'
				: 'SONET_PROJECT_INFO_EMBED_TEXT_EXPAND';

			return this.loc(phrase) ?? '';
		},
	},
	watch: {
		// A new project (or a re-read of the same one) starts collapsed again:
		// the previous expanded state says nothing about the incoming text.
		text(): void
		{
			this.isExpanded = false;
			void this.$nextTick(() => this.detectTruncation());
		},
	},
	mounted(): void
	{
		const element = this.textElement();
		if (element)
		{
			this.resizeObserver = markRaw(new ResizeObserver(() => this.detectTruncation()));
			this.resizeObserver.observe(element);
		}

		this.detectTruncation();
	},
	updated(): void
	{
		this.detectTruncation();
	},
	beforeUnmount(): void
	{
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	},
	methods: {
		textElement(): HTMLElement | null
		{
			const element = (this.$refs.text as { $el?: HTMLElement } | void)?.$el;

			return element instanceof HTMLElement ? element : null;
		},
		// Overflow is only observable while the clamp is on. Expanding removes it,
		// so a measurement taken then would report "fits" and drop the very button
		// the user needs to collapse the text back.
		detectTruncation(): void
		{
			const element = this.textElement();
			if (element)
			{
				this.isTruncated = isTextTruncated(
					this.isExpanded,
					this.isTruncated,
					element.scrollHeight,
					element.clientHeight,
				);
			}
		},
		handleToggle(): void
		{
			this.isExpanded = !this.isExpanded;
		},
	},
	// The tooltip serves pointer users only — keyboard and touch reach the full
	// text through the toggle below. Expanded text needs no tooltip of its own.
	template: `
		<div class="sonet-project-info-collapsible">
			<TextSm
				:id="textId"
				ref="text"
				:accent="accent"
				:title="isTruncated && !isExpanded ? text : null"
				class="sonet-project-info-collapsible-text"
				:class="{ '--expanded': isExpanded, '--balanced': balanced }"
				:style="clampStyle"
			>{{ text }}</TextSm>
			<button
				v-if="isTruncated"
				type="button"
				class="sonet-project-info-link-button sonet-project-info-collapsible__toggle"
				:aria-expanded="isExpanded ? 'true' : 'false'"
				:aria-controls="textId"
				data-testid="project-info-text-toggle"
				@click="handleToggle"
			>{{ toggleText }}</button>
		</div>
	`,
});

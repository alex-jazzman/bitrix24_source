import { Loc, Text } from 'main.core';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { TextSm } from 'ui.system.typography.vue';

import { calcVisibleTagCount } from '../../lib/calc-visible-tag-count/calc-visible-tag-count';
import './tags-section.css';

const MAX_COLLAPSED_ROWS = 2;

type TagsSectionData = {
	visibleCount: number,
	isExpanded: boolean,
	rowId: string,
	measuredWidth: number,
	resizeObserver: ResizeObserver | null,
};

export const TagsSection = defineComponent({
	name: 'SocialnetworkProjectInfoTagsSection',
	components: {
		Chip,
		TextSm,
	},
	mixins: [locMixin],
	props: {
		tags: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
	},
	setup(): Object
	{
		return { ChipDesign, ChipSize };
	},
	data(): TagsSectionData
	{
		return {
			visibleCount: this.tags.length,
			isExpanded: false,
			rowId: `sonet-project-info-tags-${Text.getRandom()}`,
			measuredWidth: -1,
			resizeObserver: null,
		};
	},
	computed: {
		hasTags(): boolean
		{
			return this.tags.length > 0;
		},
		// Expanding does not re-measure: the same `visibleCount` keeps driving the
		// "+N" label while the row simply stops clipping and shows the rest.
		displayedTags(): string[]
		{
			return this.isExpanded ? this.tags : this.tags.slice(0, this.visibleCount);
		},
		hiddenCount(): number
		{
			return Math.max(this.tags.length - this.visibleCount, 0);
		},
		toggleText(): string
		{
			if (this.isExpanded)
			{
				return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_COLLAPSE') ?? '';
			}

			return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_MORE', { '#COUNT#': String(this.hiddenCount) }) ?? '';
		},
		// The collapsed name starts with the visible "+N" so that voice control can
		// target the button by what the user actually sees (WCAG 2.5.3).
		toggleLabel(): string
		{
			if (this.isExpanded)
			{
				return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_COLLAPSE_ARIA') ?? '';
			}

			return Loc.getMessagePlural(
				'SONET_PROJECT_INFO_EMBED_TAGS_MORE_ARIA',
				this.hiddenCount,
				{ '#COUNT#': String(this.hiddenCount) },
			) ?? '';
		},
		// One sample per digit length, widest count first within its length:
		// 14 tags give "+9" and "+14", covering every hidden count that can occur.
		measureMoreCounts(): number[]
		{
			const total = this.tags.length;
			if (total === 0)
			{
				return [];
			}

			const counts = [];
			for (let cap = 9; cap < total; cap = (cap * 10) + 9)
			{
				counts.push(cap);
			}
			counts.push(total);

			return counts;
		},
		// Focus lands on the section root when the toggle disappears; a bare div
		// would leave the reader with no idea where it went.
		groupLabel(): string | null
		{
			return this.hasTags ? this.loc('SONET_PROJECT_INFO_EMBED_SECTION_TAGS') ?? null : null;
		},
		measureMoreTexts(): string[]
		{
			return this.measureMoreCounts.map((count) => {
				return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_MORE', { '#COUNT#': String(count) }) ?? '';
			});
		},
		collapseText(): string
		{
			return this.loc('SONET_PROJECT_INFO_EMBED_TAGS_COLLAPSE') ?? '';
		},
	},
	watch: {
		tags(): void
		{
			this.isExpanded = false;
			void this.$nextTick(() => this.recompute(true));
		},
		hiddenCount(value: number): void
		{
			if (value > 0)
			{
				return;
			}

			this.isExpanded = false;
			this.keepFocusInSection();
		},
	},
	// The root element is always rendered, so the observer survives the empty
	// first render: project data arrives asynchronously, and a `v-if` root would
	// leave `$refs.container` undefined at mount time and never recompute again.
	mounted(): void
	{
		const container = this.$refs.container;
		if (container instanceof HTMLElement)
		{
			this.resizeObserver = markRaw(new ResizeObserver(() => this.recompute()));
			this.resizeObserver.observe(container);
		}

		this.recompute(true);
	},
	beforeUnmount(): void
	{
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	},
	methods: {
		// `force` is for changes the width cannot reveal — a new tag list or the
		// first run. Plain observer callbacks skip an unchanged width: the observed
		// root also grows when the reveal block opens, and those callbacks would
		// otherwise re-measure every chip for the same result.
		recompute(force: boolean = false): void
		{
			const container = this.$refs.container;
			if (!(container instanceof HTMLElement))
			{
				return;
			}

			const available = container.clientWidth;
			if (!force && available === this.measuredWidth)
			{
				return;
			}

			this.measuredWidth = available;
			const chipWidths = this.measureChipWidths();

			// Container hidden or unmeasurable; show every tag as a fallback.
			if (available <= 0 || chipWidths.length === 0)
			{
				this.visibleCount = this.tags.length;

				return;
			}

			this.visibleCount = this.calcVisibleCount(
				available,
				chipWidths,
				this.measureMoreWidths(),
				this.measureCollapseWidth(),
			);
		},
		// Tags are `Chip` components and expose their node as `$el`; the toggle is a
		// plain button, whose ref already is the node. One accessor covers both.
		elementOf(ref: mixed): HTMLElement | null
		{
			if (ref instanceof HTMLElement)
			{
				return ref;
			}

			const element = (ref as { $el?: HTMLElement } | null)?.$el;

			return element instanceof HTMLElement ? element : null;
		},
		measureWidths(ref: mixed): number[]
		{
			if (!Array.isArray(ref))
			{
				return [];
			}

			return ref.map((item) => this.elementOf(item)?.offsetWidth ?? 0);
		},
		measureChipWidths(): number[]
		{
			return this.measureWidths(this.$refs.measureChip);
		},
		measureMoreWidths(): number[]
		{
			// Vue does not promise that `v-for` refs keep the source order, and here
			// only the widths matter: more digits never make the label narrower.
			return this.measureWidths(this.$refs.measureMore).sort((a, b) => a - b);
		},
		measureCollapseWidth(): number
		{
			return this.elementOf(this.$refs.measureCollapse)?.offsetWidth ?? 0;
		},
		calcVisibleCount(
			available: number,
			chipWidths: number[],
			moreWidths: number[],
			collapseWidth: number,
			maxRows: number = MAX_COLLAPSED_ROWS,
		): number
		{
			return calcVisibleTagCount(available, chipWidths, moreWidths, collapseWidth, maxRows);
		},
		handleToggle(): void
		{
			this.isExpanded = !this.isExpanded;
		},
		// The toggle is dropped as soon as everything fits. If it held focus at that
		// moment, focus would fall back to <body> and the reader would lose the place.
		keepFocusInSection(): void
		{
			const toggleEl = this.elementOf(this.$refs.toggle);
			if (toggleEl === null || document.activeElement !== toggleEl)
			{
				return;
			}

			void this.$nextTick(() => {
				const container = this.$refs.container;
				if (container instanceof HTMLElement)
				{
					container.focus();
				}
			});
		},
	},
	template: `
		<div
			ref="container"
			class="sonet-project-info-tags"
			tabindex="-1"
			:role="hasTags ? 'group' : null"
			:aria-label="groupLabel"
		>
			<template v-if="hasTags">
				<div
					:id="rowId"
					class="sonet-project-info-tags__row"
					:class="{ '--expanded': isExpanded }"
					data-testid="project-info-tags-row"
				>
					<Chip
						v-for="tag in displayedTags"
						:key="tag"
						:text="tag"
						:size="ChipSize.Sm"
						:design="ChipDesign.OutlineNoAccent"
						trimmable
						rounded
						tabindex="-1"
						class="sonet-project-info-tags__chip"
						data-testid="project-info-tag"
					/>
					<button
						v-if="hiddenCount > 0"
						ref="toggle"
						type="button"
						class="sonet-project-info-link-button sonet-project-info-tags__toggle"
						:aria-expanded="isExpanded ? 'true' : 'false'"
						:aria-controls="rowId"
						:aria-label="toggleLabel"
						data-testid="project-info-tags-more"
						@click="handleToggle"
					>{{ toggleText }}</button>
				</div>
				<div ref="measurer" class="sonet-project-info-tags__measurer" aria-hidden="true">
					<Chip
						v-for="tag in tags"
						:key="tag"
						ref="measureChip"
						:text="tag"
						:size="ChipSize.Sm"
						:design="ChipDesign.OutlineNoAccent"
						trimmable
						rounded
						class="sonet-project-info-tags__chip"
					/>
					<button
						v-for="text in measureMoreTexts"
						:key="text"
						ref="measureMore"
						type="button"
						tabindex="-1"
						class="sonet-project-info-link-button sonet-project-info-tags__toggle"
					>{{ text }}</button>
					<button
						ref="measureCollapse"
						type="button"
						tabindex="-1"
						class="sonet-project-info-link-button sonet-project-info-tags__toggle"
					>{{ collapseText }}</button>
				</div>
			</template>
			<TextSm v-else class="sonet-project-info-empty">
				{{ loc('SONET_PROJECT_INFO_EMBED_TAGS_EMPTY') }}
			</TextSm>
		</div>
	`,
});

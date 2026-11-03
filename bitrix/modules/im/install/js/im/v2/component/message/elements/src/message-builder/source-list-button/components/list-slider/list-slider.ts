import { Loc, Tag } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { Layout } from 'ui.sidepanel.layout';
import { defineComponent, type PropType } from 'ui.vue3';

import { Utils } from 'im.v2.lib.utils';
import { type AnyBlockType } from 'im.v2.const';

import './list-slider.css';

export const SLIDER_ID_PREFIX = 'im:source-list-slider';
const SLIDER_WIDTH = 546;

type RawSource = { url?: string; metaData?: { title?: string; description?: string } };
type SourceCarryingBlock = { sources: Record<string, RawSource> };
type SourceEntry = { url: string; title: string; description: string };

// Slider id is derived from the message id. The sources button is rendered only for fully
// received messages, so `messageId` is stable for the component lifetime (not a temporary
// sending id) and yields a stable, per-message unique slider id.
export const buildSliderId = (messageId: number | string): string => `${SLIDER_ID_PREFIX}:${messageId}`;

// @vue/component
export const SourceListSlider = defineComponent({
	name: 'SourceListSlider',
	props: {
		messageBlocks: {
			type: Array as PropType<AnyBlockType[]>,
			required: true,
		},
		messageId: {
			type: [Number, String],
			required: true,
		},
	},
	emits: ['close'],
	setup(): { sliderId: string; contentContainer: HTMLElement | null }
	{
		return {
			sliderId: '',
			contentContainer: null,
		};
	},
	computed: {
		blocks(): AnyBlockType[]
		{
			return this.messageBlocks;
		},
		title(): string
		{
			return this.loc('IM_MESSAGE_BUILDER_SOURCES_SLIDER_TITLE');
		},
		allSources(): SourceEntry[]
		{
			return this.blocks
				.filter((block) => (block as SourceCarryingBlock).sources)
				.flatMap((block) => Object.values((block as SourceCarryingBlock).sources))
				.map((source) => ({
					url: source.url ?? '',
					title: source.metaData?.title ?? '',
					description: source.metaData?.description ?? '',
				}));
		},
	},
	created()
	{
		this.sliderId = buildSliderId(this.messageId);
		this.contentContainer = Tag.render`<div></div>`;
		this.openSlider();
	},
	beforeUnmount()
	{
		this.closeSlider();
	},
	methods: {
		openSlider()
		{
			SidePanel.Instance.open(this.sliderId, {
				cacheable: false,
				width: SLIDER_WIDTH,
				contentCallback: () => {
					return this.createLayoutContent();
				},
				events: {
					onCloseComplete: () => {
						this.$emit('close');
					},
				},
			});
		},
		closeSlider()
		{
			const slider = SidePanel.Instance.getSlider(this.sliderId);
			if (!slider)
			{
				return;
			}

			slider.close();
		},
		createLayoutContent()
		{
			return Layout.createContent({
				title: this.title,
				design: {
					margin: null,
					section: false,
					alignButtonsLeft: true,
				},
				content: () => this.contentContainer,
				buttons: () => [],
			} as unknown as Parameters<typeof Layout.createContent>[0]);
		},
		getSourceTitle(source: { url: string; title: string }): string
		{
			if (source.title)
			{
				return source.title;
			}

			return Utils.text.getHostFromUrl(source.url);
		},
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode) ?? '';
		},
	},
	template: `
		<Teleport :to="contentContainer">
			<div class="bx-im-message-source-list-slider__container bx-im-messenger__scope">
				<div
					v-for="(source, index) in allSources"
					:key="index"
					class="bx-im-message-source-list-slider__item"
				>
					<div class="bx-im-message-source-list-slider__item-title --line-clamp-2">
						{{ getSourceTitle(source) }}
					</div>
					<div
						v-if="source.description"
						class="bx-im-message-source-list-slider__item-description --line-clamp-2"
					>
						{{ source.description }}
					</div>
					<a :href="source.url" target="_blank" class="bx-im-message-source-list-slider__item-link --ellipsis">
						{{ source.url }}
					</a>
				</div>
			</div>
		</Teleport>
	`,
});

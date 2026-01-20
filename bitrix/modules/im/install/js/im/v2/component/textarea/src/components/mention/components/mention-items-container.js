import { Event, Type } from 'main.core';

import { EventType, SpecialMentionDialogId } from 'im.v2.const';
import { ScrollWithGradient } from 'im.v2.component.elements.scroll-with-gradient';
import { Utils } from 'im.v2.lib.utils';

import { AllParticipantsItem } from './mention-item/components/all-participants-item';
import { CopilotItem } from './mention-item/components/copilot-item';
import { DefaultItem } from './mention-item/components/default-item';
import { MentionInsertManager } from '../classes/insert-manager';
import { getMarginTop, getNewScrollPosition } from '../helpers/helpers';

import '../css/mention-item.css';

import type { BitrixVueComponentProps } from 'ui.vue3';
import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';

const GRADIENT_HEIGHT = 13;
const CONTAINER_MAX_HEIGHT = 200;

// @vue/component
export const MentionItemsContainer = {
	name: 'MentionItemsContainer',
	components: { AllParticipantsItem, CopilotItem, DefaultItem, ScrollWithGradient },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		query: {
			type: String,
			default: '',
		},
		items: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			selectedIndex: 0,
		};
	},
	computed: {
		GRADIENT_HEIGHT: () => GRADIENT_HEIGHT,
		CONTAINER_MAX_HEIGHT: () => CONTAINER_MAX_HEIGHT,
		preparedQuery(): string
		{
			return this.query.trim().toLowerCase();
		},
		copilotBotDialogId(): ?string
		{
			return this.$store.getters['users/bots/getCopilotBotDialogId'];
		},
	},
	watch: {
		preparedQuery()
		{
			this.selectedIndex = 0;
		},
	},
	created() {
		Event.bind(window, 'keydown', this.onKeyDown);
		this.getEmitter().subscribe(EventType.mention.selectItem, this.onInsertMentionText);
	},
	beforeUnmount()
	{
		Event.unbind(window, 'keydown', this.onKeyDown);
		this.getEmitter().unsubscribe(EventType.mention.selectItem, this.onInsertMentionText);
	},
	methods: {
		getComponentToShow(id: string): BitrixVueComponentProps
		{
			const components = {
				[SpecialMentionDialogId.allParticipants]: AllParticipantsItem,
				[this.copilotBotDialogId]: CopilotItem,
				default: DefaultItem,
			};

			return components[id] ?? components.default;
		},
		onKeyDown(event: KeyboardEvent)
		{
			if (this.items.length === 0)
			{
				return;
			}

			const lastIndex = this.items.length - 1;
			let nextIndex = this.selectedIndex;

			if (Utils.key.isCombination(event, 'ArrowDown'))
			{
				nextIndex = nextIndex === lastIndex ? 0 : nextIndex + 1;
			}

			if (Utils.key.isCombination(event, 'ArrowUp'))
			{
				nextIndex = nextIndex === 0 ? lastIndex : nextIndex - 1;
			}

			this.selectedIndex = nextIndex;

			const element = this.getDomElementByIndex(this.selectedIndex);
			if (!element)
			{
				this.selectedIndex = 0;
			}

			this.scrollToItem(element);
		},
		getDomElementByIndex(index: number): ?HTMLElement
		{
			return this.$refs['popup-items'].querySelector(`[data-index="${index}"]`);
		},
		scrollToItem(element: HTMLElement)
		{
			const scrollContainer = this.$refs['scroll-gradient'].getContainer();
			const marginTop = getMarginTop(this.$refs['popup-items']);

			scrollContainer.scrollTop = getNewScrollPosition(element, scrollContainer, marginTop);
		},
		onItemHover(index: string)
		{
			this.selectedIndex = index;
		},
		onInsertMentionText()
		{
			if (!Type.isArrayFilled(this.items))
			{
				return;
			}

			this.insertMentionText();
		},
		onItemClick()
		{
			this.insertMentionText();
			this.$emit('close');
		},
		insertMentionText()
		{
			const { id } = this.items[this.selectedIndex];

			const insertManager = new MentionInsertManager({ emitter: this.getEmitter() });
			insertManager.emit({ id, dialogId: this.dialogId, query: this.query });
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<ScrollWithGradient
			v-if="items.length > 0"
			ref="scroll-gradient"
			:gradientHeight="GRADIENT_HEIGHT"
			:containerMaxHeight="CONTAINER_MAX_HEIGHT"
			:withShadow="false"
		>
			<div class="bx-im-mention-popup-content__items" ref="popup-items">
				<component
					v-for="(item, index) in items"
					:data-index="index"
					:is="getComponentToShow(item.id)"
					:item="item"
					:query="query"
					:dialogId="dialogId"
					:selected="index === selectedIndex"
					@click="onItemClick"
					@close="$emit('close')"
					@mouseover="onItemHover(index)"
				/>
			</div>
		</ScrollWithGradient>
	`,
};

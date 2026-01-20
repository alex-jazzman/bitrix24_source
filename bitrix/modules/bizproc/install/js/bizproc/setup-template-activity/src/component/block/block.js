import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import { DraggableContainer } from '../draggable-container/draggable-container';

import './block.css';

import type { Item } from '../../types';

type DndSlotProps = {
	dropTargetIndex: number | null,
	draggedItemIndex: number | null,
};

// @vue/component
export const BlockComponent = {
	name: 'BlockComponent',
	components: {
		BIcon,
		DraggableContainer,
	},
	props: {
		position: {
			type: Number,
			required: true,
		},
		/** type Array<Item> */
		items: {
			type: Array,
			required: true,
		},
		blockIndex: {
			type: Number,
			required: true,
		},
	},
	emits: ['deleteBlock', 'update:items'],
	setup(): { [string]: string }
	{
		return {
			Outline,
		};
	},
	computed: {
		title(): string
		{
			return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_BLOCK_TITLE', {
				'#POSITION#': this.position,
			});
		},
	},
	methods:
	{
		onItemsUpdate(newItems: Array<Item>): void
		{
			this.$emit('update:items', newItems);
		},
		showDropPlaceholder(dnd: DndSlotProps, itemIndex: number): boolean
		{
			return dnd.dropTargetIndex === itemIndex && dnd.dropTargetIndex !== dnd.draggedItemIndex;
		},
		showFinalDropPlaceholder(dnd: DndSlotProps): boolean
		{
			return dnd.dropTargetIndex === this.items.length && dnd.draggedItemIndex !== this.items.length;
		},
	},
	template: `
		<div class="bizproc-setuptemplateactivity-block">
			<div class="bizproc-setuptemplateactivity-block__header">
				<div class="bizproc-setuptemplateactivity-block__header-wrap">
					<p class="bizproc-setuptemplateactivity-block__title">
						{{ title }}
					</p>
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-block__delete-icon"
						@click="$emit('deleteBlock')"
					/>
				</div>
			</div>
			<DraggableContainer
				:items="items"
				:blockIndex="blockIndex"
				@update:items="onItemsUpdate"
				v-slot="dnd"
			>
				<div
					:data-block-index="blockIndex"
					class="bizproc-setuptemplateactivity-block__items"
					data-draggable-container="true"
				>
					<div
						v-for="(item, itemIndex) in items"
						:key="item.id"
						class="bizproc-setuptemplateactivity-draggable-wrapper"
						data-draggable-item="true"
					>
						<div
							v-if="showDropPlaceholder(dnd, itemIndex)"
							class="bizproc-setuptemplateactivity-drop-placeholder"
						></div>
						<slot
							name="item"
							:item="item"
							:itemIndex="itemIndex"
						></slot>
					</div>
					<div
						v-if="showFinalDropPlaceholder(dnd)"
						class="bizproc-setuptemplateactivity-drop-placeholder"
					></div>
				</div>
			</DraggableContainer>
			<div class="bizproc-setuptemplateactivity-block__footer">
				<div class="bizproc-setuptemplateactivity-block__footer-wrap">
					<slot name="footer"/>
				</div>
			</div>
		</div>
	`,
};

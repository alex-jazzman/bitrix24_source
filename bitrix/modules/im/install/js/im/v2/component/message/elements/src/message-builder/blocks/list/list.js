import { Type, type JsonObject } from 'main.core';
import { type BitrixVueComponentProps } from 'ui.vue3';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { ExpandAnimation } from 'im.v2.component.animation';
import { type OrderedListBlockType, type UnorderedListBlockType } from 'im.v2.const';

import { SourceHandler } from '../../source-handler/source-handler.js';
import { BaseBlock } from '../base/base';
import { UnorderedList } from './components/unordered-list/unordered-list';
import { OrderedList } from './components/ordered-list/ordered-list';

import './list.css';

// @vue/component
export const ListBlock = {
	name: 'ListBlock',
	components: { BaseBlock, ExpandAnimation, BIcon, SourceHandler },
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			isOpened: true,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		listBlock(): OrderedListBlockType | UnorderedListBlockType
		{
			return this.block;
		},
		listComponent(): BitrixVueComponentProps
		{
			const typeToComponent = {
				orderedList: OrderedList,
				unorderedList: UnorderedList,
			};

			return typeToComponent[this.listBlock.type] ?? UnorderedList;
		},
		fold()
		{
			return this.listBlock.fold;
		},
		isFoldable(): boolean
		{
			return Type.isPlainObject(this.fold);
		},
		foldTitle(): string
		{
			return this.fold?.title ?? '';
		},

	},
	created()
	{
		this.isOpened = this.fold?.isOpened ?? true;
	},
	methods: {
		toggle()
		{
			this.isOpened = !this.isOpened;
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="listBlock"
			:dialogId="dialogId"
		>
			<div
				v-if="isFoldable"
				class="bx-im-message-block-list-fold__header"
				@click="toggle"
			>
				<div class="bx-im-message-block-list-fold__title">{{ foldTitle }}</div>
				<BIcon
					:name="OutlineIcons.CHEVRON_DOWN_L"
					:class="{ '--folded': !isOpened }"
					class="bx-im-message-block-list-fold__icon"
				/>
			</div>
			<ExpandAnimation>
				<div v-if="isOpened">
					<SourceHandler :block="listBlock" :messageId="message.id">
						<component :is="listComponent" :block="listBlock" />
					</SourceHandler>
				</div>
			</ExpandAnimation>
		</BaseBlock>
	`,
};

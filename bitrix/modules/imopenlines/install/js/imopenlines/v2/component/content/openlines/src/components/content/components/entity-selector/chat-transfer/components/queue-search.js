import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { type ImolModelQueue } from 'imopenlines.v2.model';

import { QUEUE_ID_PREFIX } from '../const/const';

import './css/queue-search.css';

// @vue/component
export const QueueSearch = {
	name: 'QueueSearch',
	components: { BIcon },
	props: {
		query: {
			type: String,
			default: '',
		},
		selectedItems: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['clickItem'],
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		isLinesOperator(): boolean
		{
			return this.$store.getters['openLines/queue/isLinesOperator'];
		},
		queues(): ImolModelQueue[]
		{
			if (!this.isLinesOperator)
			{
				return [];
			}

			return this.$store.getters['openLines/queue/getListOfActive']();
		},
		filteredQueues(): ImolModelQueue[]
		{
			if (this.query.length === 0)
			{
				return this.queues;
			}

			const processedQuery = this.query.toLowerCase();

			return this.queues.filter((queue) => queue.lineName.toLowerCase().includes(processedQuery));
		},
		hasQueues(): boolean
		{
			return this.filteredQueues.length > 0;
		},
	},
	methods:
	{
		isSelected(queueId: number): boolean
		{
			const queueFullId = `${QUEUE_ID_PREFIX}${queueId}`;

			return this.selectedItems.includes(queueFullId);
		},
		selectQueue(queue: ImolModelQueue, nativeEvent: PointerEvent)
		{
			this.$emit('clickItem', { queueId: queue.id, nativeEvent });
		},
		loc(key: string): string
		{
			return this.$Bitrix.Loc.getMessage(key);
		},
	},
	template: `
		<div v-if="hasQueues" class="bx-imol-chat-transfer-entity-selector__queue-list">
			<div class="bx-imol-chat-transfer-entity-selector__queue-list-title">
				{{ loc('IMOL_ENTITY_SELECTOR_CHAT_TRANSFER_QUEUE_SECTION') }}
			</div>
			<div
				class="bx-im-search-item__container bx-im-search-item__scope"
				v-for="queue in filteredQueues"
				:key="queue.id"
				:class="{ '--selected': isSelected(queue.id) }"
				@click="selectQueue(queue, $event)"
			>
				<div class="bx-im-search-item__avatar-container">
					<div
						class="bx-imol-chat-transfer-entity-selector__queue-avatar"
						:style="{ backgroundColor: queue.color }"
					>
						<BIcon :name="OutlineIcons.OPEN_CHANNELS" />
					</div>
				</div>
				<div class="bx-im-search-item__content-container">
					<div class="bx-im-search-item__content_header">
						<div class="bx-imol-chat-transfer-entity-selector__queue-title">{{ queue.lineName }}</div>
					</div>
					<div class="bx-im-search-item__item-text">
						{{ loc('IMOL_ENTITY_SELECTOR_CHAT_TRANSFER_QUEUE_ITEM_SUBTITLE') }}
					</div>
				</div>
				<div v-if="isSelected(queue.id)" class="bx-im-chat-search-item__selected"></div>
			</div>
		</div>
	`,
};

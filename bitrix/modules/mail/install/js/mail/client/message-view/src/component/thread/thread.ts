import { type ComponentOptions, type PropType } from 'ui.vue3';

import {
	type ThreadItemState,
	type ThreadSide,
	type ThreadSideState,
} from '../../feature/thread/thread';

export type ThreadComponentLabels = {
	readonly beforeSeparator: string,
	readonly afterSeparator: string,
	readonly loadBefore: string,
	readonly loadAfter: string,
	readonly loadingBefore: string,
	readonly loadingAfter: string,
	readonly errorBefore: string,
	readonly errorAfter: string,
	readonly retryBefore: string,
	readonly retryAfter: string,
	readonly expandItem: string,
	readonly collapseItem: string,
	readonly loadingItem: string,
	readonly errorItem: string,
	readonly retryItem: string,
};

export type ThreadLoadSideIntent = {
	readonly side: ThreadSide,
};

export type ThreadToggleItemIntent = {
	readonly id: number,
	readonly side: ThreadSide,
	readonly rowHostId: string,
	readonly detailsHostId: string,
};

export type ThreadRetryItemIntent = {
	readonly id: number,
	readonly side: ThreadSide,
	readonly detailsHostId: string,
};

const LegacyHostAttribute = 'data-mail-message-view-host';

const TestId = {
	thread: 'mail-message-view-thread',
	item: 'mail-message-view-thread-item',
	loading: 'mail-message-view-thread-loading',
	loadOlder: 'mail-message-view-load-older',
	loadNewer: 'mail-message-view-load-newer',
	heading: 'mail-message-view-thread-heading',
	collapse: 'mail-message-view-collapse',
};

// @vue/component
export const ThreadComponent = {
	name: 'MailMessageViewThread',
	props: {
		sideState: {
			type: Object as PropType<ThreadSideState>,
			required: true,
		},
		labels: {
			type: Object as PropType<ThreadComponentLabels>,
			required: true,
		},
	},
	emits: {
		'load-side': (payload?: ThreadLoadSideIntent): boolean => {
			return payload?.side === 'before' || payload?.side === 'after';
		},
		'toggle-item': (payload?: ThreadToggleItemIntent): boolean => {
			return Boolean(
				payload
				&& Number.isInteger(payload.id)
				&& (payload.side === 'before' || payload.side === 'after')
				&& payload.rowHostId
				&& payload.detailsHostId,
			);
		},
		'retry-item': (payload?: ThreadRetryItemIntent): boolean => {
			return Boolean(
				payload
				&& Number.isInteger(payload.id)
				&& (payload.side === 'before' || payload.side === 'after')
				&& payload.detailsHostId,
			);
		},
	},
	setup(): Object
	{
		return {
			TestId,
		};
	},
	computed: {
		items(): ThreadItemState[]
		{
			return this.sideState.items;
		},
		side(): ThreadSide
		{
			return this.sideState.code;
		},
		shouldPlaceControlsBeforeItems(): boolean
		{
			return this.side === 'before';
		},
		separatorLabel(): string
		{
			return this.side === 'before' ? this.labels.beforeSeparator : this.labels.afterSeparator;
		},
		loadLabel(): string
		{
			return this.side === 'before' ? this.labels.loadBefore : this.labels.loadAfter;
		},
		loadingLabel(): string
		{
			return this.side === 'before' ? this.labels.loadingBefore : this.labels.loadingAfter;
		},
		errorLabel(): string
		{
			return this.side === 'before' ? this.labels.errorBefore : this.labels.errorAfter;
		},
		retryLabel(): string
		{
			return this.side === 'before' ? this.labels.retryBefore : this.labels.retryAfter;
		},
		loadButtonTestId(): string
		{
			return this.side === 'before' ? TestId.loadOlder : TestId.loadNewer;
		},
		sideContentHostId(): string
		{
			return `mail-message-view-thread-${this.side}-content`;
		},
		canLoadSide(): boolean
		{
			return this.sideState.hasMore && this.sideState.status === 'idle';
		},
		canRetrySide(): boolean
		{
			return this.sideState.status === 'error' && this.sideState.canRetry;
		},
		isSideLoading(): boolean
		{
			return this.sideState.status === 'loading';
		},
	},
	methods: {
		getHostAttribute(hostId: string): Record<string, string>
		{
			return {
				[LegacyHostAttribute]: hostId,
			};
		},
		handleLoadSide(): void
		{
			this.$emit('load-side', { side: this.side });
		},
		handleToggleItem(item: ThreadItemState): void
		{
			this.$emit('toggle-item', {
				id: item.pair.id,
				side: item.side,
				rowHostId: item.pair.rowKey,
				detailsHostId: item.pair.detailsKey,
			});
		},
		handleRetryItem(item: ThreadItemState): void
		{
			this.$emit('retry-item', {
				id: item.pair.id,
				side: item.side,
				detailsHostId: item.pair.detailsKey,
			});
		},
		getItemToggleLabel(item: ThreadItemState): string
		{
			return item.expanded ? this.labels.collapseItem : this.labels.expandItem;
		},
		isItemLoading(item: ThreadItemState): boolean
		{
			return item.detailsStatus === 'loading';
		},
		isItemError(item: ThreadItemState): boolean
		{
			return item.detailsStatus === 'error';
		},
	},
	template: `
		<div
			class="mail-message-view-thread"
			:data-side="side"
			:data-testid="TestId.thread"
		>
			<div
				v-if="shouldPlaceControlsBeforeItems"
				class="mail-message-view-thread-separator"
			>
				<div
					class="mail-message-view-thread-separator-line"
					role="separator"
					:aria-label="separatorLabel"
				></div>
				<button
					v-if="canLoadSide"
					type="button"
					class="mail-message-view-thread-load"
					:data-testid="loadButtonTestId"
					@click="handleLoadSide"
				>{{ loadLabel }}</button>
				<span
					v-if="isSideLoading"
					class="mail-message-view-thread-state"
					:data-testid="TestId.loading"
					aria-live="polite"
				>{{ loadingLabel }}</span>
				<span
					v-if="sideState.status === 'error'"
					class="mail-message-view-thread-state"
					role="alert"
				>{{ errorLabel }}</span>
				<button
					v-if="canRetrySide"
					type="button"
					class="mail-message-view-thread-load"
					:data-testid="loadButtonTestId"
					@click="handleLoadSide"
				>{{ retryLabel }}</button>
			</div>
			<div :id="sideContentHostId" class="mail-message-view-thread-content">
				<article
					v-for="item in items"
					:key="item.pair.id"
					class="mail-message-view-thread-item"
					:data-testid="TestId.item"
					:data-id="item.pair.id"
					:data-message-id="item.pair.id"
				>
					<div class="mail-message-view-thread-row">
						<button
							type="button"
							class="mail-message-view-thread-heading"
							:data-testid="TestId.heading"
							:aria-label="getItemToggleLabel(item)"
							:aria-describedby="item.pair.rowKey"
							:aria-expanded="item.expanded ? 'true' : 'false'"
							:aria-controls="item.pair.detailsKey"
							:aria-busy="isItemLoading(item) ? 'true' : 'false'"
							@click="handleToggleItem(item)"
						></button>
						<button
							type="button"
							class="mail-message-view-thread-collapse"
							:data-testid="TestId.collapse"
							:aria-expanded="item.expanded ? 'true' : 'false'"
							:aria-controls="item.pair.detailsKey"
							:aria-busy="isItemLoading(item) ? 'true' : 'false'"
							@click="handleToggleItem(item)"
						>{{ getItemToggleLabel(item) }}</button>
						<div
							:id="item.pair.rowKey"
							class="mail-message-view-host mail-message-view-thread-row-host"
							aria-hidden="true"
							v-bind="getHostAttribute(item.pair.rowKey)"
						></div>
					</div>
					<div
						v-show="item.expanded"
						class="mail-message-view-thread-details"
						:aria-busy="isItemLoading(item) ? 'true' : 'false'"
						role="region"
						:aria-labelledby="item.pair.rowKey"
					>
						<div
							:id="item.pair.detailsKey"
							class="mail-message-view-host mail-message-view-thread-details-host"
							v-bind="getHostAttribute(item.pair.detailsKey)"
						></div>
						<span
							v-if="isItemLoading(item)"
							class="mail-message-view-thread-state"
							:data-testid="TestId.loading"
							aria-live="polite"
						>{{ labels.loadingItem }}</span>
						<span
							v-if="isItemError(item)"
							class="mail-message-view-thread-state"
							role="alert"
						>{{ labels.errorItem }}</span>
						<button
							v-if="isItemError(item) && item.canRetry"
							type="button"
							class="mail-message-view-thread-retry"
							@click="handleRetryItem(item)"
						>{{ labels.retryItem }}</button>
					</div>
				</article>
			</div>
			<div
				v-if="!shouldPlaceControlsBeforeItems"
				class="mail-message-view-thread-separator"
			>
				<div
					class="mail-message-view-thread-separator-line"
					role="separator"
					:aria-label="separatorLabel"
				></div>
				<button
					v-if="canLoadSide"
					type="button"
					class="mail-message-view-thread-load"
					:data-testid="loadButtonTestId"
					@click="handleLoadSide"
				>{{ loadLabel }}</button>
				<span
					v-if="isSideLoading"
					class="mail-message-view-thread-state"
					:data-testid="TestId.loading"
					aria-live="polite"
				>{{ loadingLabel }}</span>
				<span
					v-if="sideState.status === 'error'"
					class="mail-message-view-thread-state"
					role="alert"
				>{{ errorLabel }}</span>
				<button
					v-if="canRetrySide"
					type="button"
					class="mail-message-view-thread-load"
					:data-testid="loadButtonTestId"
					@click="handleLoadSide"
				>{{ retryLabel }}</button>
			</div>
		</div>
	`,
} satisfies ComponentOptions;

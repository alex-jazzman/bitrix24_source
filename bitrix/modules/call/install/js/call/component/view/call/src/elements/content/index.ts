import { defineComponent } from 'ui.vue3';

import { useUsersStore, useUiStore } from 'call.store';
import type { UsersStoreInstance, UiStoreInstance } from 'call.store';
import { CallUserCard, CallUserCardPlus } from 'call.component.block.user-card';
import { CallIcon } from 'call.component.ui.icon';

import { CallContentHands } from './hands/index';

import './styles.css';

// Layout configuration constants
const LAYOUT_CONFIG = {
	padding: {
		horizontal: 20,
		vertical: 0,
	},
	gap: 10,
	aspectRatio: 16 / 9,
	minCardHeight: 100,
	thumbnailHeight: 100,
	maxUsersLimit: 20,
	maxTestColumns: 5,
	virtualScrollBuffer: 1,
} as const;

// Pre-calculate sidebar thumbnail width
const THUMBNAIL_WIDTH = LAYOUT_CONFIG.thumbnailHeight * LAYOUT_CONFIG.aspectRatio;

export interface GridConfig
{
	cols: number;
	rows: number;
	cardWidth: number;
	cardHeight: number;
	totalWidth: number;
	totalHeight: number;
}

export interface LastGridConfig
{
	userCount: number;
	availableWidth: number;
	availableHeight: number;
	cols: number;
	rows: number;
}

export interface LayoutItem
{
	x: number;
	y: number;
	width: number;
	height: number;
	userId?: number;
	isSpeaker?: boolean;
	plus?: boolean;
}

export const CallContent = defineComponent({
	name: 'CallContent',
	components: {
		CallUserCard,
		CallUserCardPlus,
		CallIcon,
		CallContentHands,
	},
	setup(): { usersStore: UsersStoreInstance; uiStore: UiStoreInstance }
	{
		return {
			usersStore: useUsersStore(),
			uiStore: useUiStore(),
		};
	},
	data(): { page: number; sidebarScrollTop: number; lastGridConfig: LastGridConfig | null }
	{
		return {
			page: 1,
			sidebarScrollTop: 0,
			lastGridConfig: null,
		};
	},
	computed: {
		// --- Layout dimensions ---

		layoutWidth(): number
		{
			return this.uiStore.layoutWidth;
		},
		layoutHeight(): number
		{
			return this.uiStore.layoutContentHeight;
		},

		availableWidth(): number
		{
			return this.layoutWidth - LAYOUT_CONFIG.padding.horizontal * 2;
		},
		availableHeight(): number
		{
			return this.layoutHeight - LAYOUT_CONFIG.padding.vertical * 2;
		},

		containerStyle(): Record<string, string>
		{
			return {
				position: 'relative',
				width: `${this.layoutWidth}px`,
				height: `${this.layoutHeight}px`,
				overflow: 'hidden',
				boxSizing: 'border-box',
				padding: `${LAYOUT_CONFIG.padding.vertical}px`,
			};
		},

		// --- Mode detection ---

		speakerId(): number | null
		{
			return this.usersStore.speakerId;
		},
		isSpeakerMode(): boolean
		{
			return this.speakerId !== null;
		},
		userIds(): number[]
		{
			return this.usersStore.userIds;
		},

		// --- Speaker mode virtual scroll ---

		sidebarOtherUsers(): number[]
		{
			if (!this.isSpeakerMode || this.speakerId === null)
			{
				return [];
			}

			return this.userIds.filter((id: number): boolean => id !== this.speakerId);
		},

		sidebarTotalHeight(): number
		{
			const { gap, thumbnailHeight } = LAYOUT_CONFIG;
			const itemCount = this.sidebarOtherUsers.length + 1;

			return itemCount * thumbnailHeight + (itemCount - 1) * gap;
		},

		sidebarCanScroll(): boolean
		{
			return this.sidebarTotalHeight > this.availableHeight;
		},

		sidebarMaxScroll(): number
		{
			return Math.max(0, this.sidebarTotalHeight - this.availableHeight);
		},

		sidebarVisibleRange(): { start: number; end: number }
		{
			if (!this.isSpeakerMode)
			{
				return { start: 0, end: 0 };
			}

			const { gap, thumbnailHeight, virtualScrollBuffer } = LAYOUT_CONFIG;
			const itemHeight = thumbnailHeight + gap;

			const startIndex = Math.max(0, Math.floor(this.sidebarScrollTop / itemHeight) - virtualScrollBuffer);
			const visibleCount = Math.ceil(this.availableHeight / itemHeight);
			const endIndex = Math.min(this.sidebarOtherUsers.length, startIndex + visibleCount + virtualScrollBuffer * 2);

			return { start: startIndex, end: endIndex };
		},

		sidebarVisibleUsers(): number[]
		{
			const { start, end } = this.sidebarVisibleRange;

			return this.sidebarOtherUsers.slice(start, end);
		},

		showSidebarPlus(): boolean
		{
			if (!this.isSpeakerMode)
			{
				return false;
			}
			const plusIndex = this.sidebarOtherUsers.length;

			return plusIndex >= this.sidebarVisibleRange.start && plusIndex < this.sidebarVisibleRange.end + 1;
		},

		// --- Grid mode capacity ---

		maxGridUsers(): number
		{
			const { gap, aspectRatio, minCardHeight, maxUsersLimit } = LAYOUT_CONFIG;
			const minCardWidth = minCardHeight * aspectRatio;

			const maxCols = Math.max(1, Math.floor((this.availableWidth + gap) / (minCardWidth + gap)));
			const maxRows = Math.max(1, Math.floor((this.availableHeight + gap) / (minCardHeight + gap)));

			const calculatedMax = Math.min(maxUsersLimit, maxCols * maxRows);

			return Math.max(2, calculatedMax);
		},

		// --- Grid pagination ---

		totalGridPages(): number
		{
			return Math.ceil(this.userIds.length / this.maxGridUsers);
		},

		isLastGridPage(): boolean
		{
			const startIndex = (this.page - 1) * this.maxGridUsers;
			const remainingUsers = this.userIds.length - startIndex;

			return remainingUsers <= this.maxGridUsers;
		},

		canGoPrev(): boolean
		{
			return !this.isSpeakerMode && this.page > 1;
		},

		canGoNext(): boolean
		{
			return !this.isSpeakerMode && !this.isLastGridPage;
		},

		prevIcon(): string
		{
			return 'chevron-left';
		},

		nextIcon(): string
		{
			return 'chevron-right';
		},

		// --- Layout items ---

		layoutItems(): LayoutItem[]
		{
			if (this.isSpeakerMode)
			{
				return this.getSpeakerLayout();
			}

			return this.getGridLayout();
		},
	},
	watch: {
		isSpeakerMode(newValue: boolean): void
		{
			if (newValue)
			{
				this.sidebarScrollTop = 0;
			}
			else
			{
				this.page = 1;
			}
			this.lastGridConfig = null;
		},

		totalGridPages(newTotal: number): void
		{
			if (!this.isSpeakerMode && this.page > newTotal && newTotal > 0)
			{
				this.page = newTotal;
			}
		},

		sidebarMaxScroll(newMax: number): void
		{
			if (this.sidebarScrollTop > newMax)
			{
				this.sidebarScrollTop = newMax;
			}
		},
	},
	methods: {
		// --- Grid layout calculation ---

		getGridLayout(): LayoutItem[]
		{
			const startIndex = (this.page - 1) * this.maxGridUsers;
			const pageUserIds = this.userIds.slice(startIndex, startIndex + this.maxGridUsers);
			if (!pageUserIds?.length)
			{
				return [];
			}

			const userCount = pageUserIds.length;

			if (userCount === 1)
			{
				this.lastGridConfig = null;

				return this.layoutSingleUser(pageUserIds[0]);
			}

			const canReuseGrid =
				this.lastGridConfig
				&& this.lastGridConfig.userCount === userCount
				&& Math.abs(this.lastGridConfig.availableWidth - this.availableWidth) < 10
				&& Math.abs(this.lastGridConfig.availableHeight - this.availableHeight) < 10;

			let grid: GridConfig | null = null;

			if (canReuseGrid)
			{
				grid = this.tryGrid(this.lastGridConfig!.cols, this.lastGridConfig!.rows);
				if (!grid)
				{
					grid = this.findOptimalGrid(userCount);
				}
			}
			else
			{
				grid = this.findOptimalGrid(userCount);
			}

			if (grid)
			{
				this.lastGridConfig = {
					userCount,
					availableWidth: this.availableWidth,
					availableHeight: this.availableHeight,
					cols: grid.cols,
					rows: grid.rows,
				};
			}

			return this.positionUsersInGrid(pageUserIds, grid!);
		},

		findOptimalGrid(userCount: number): GridConfig
		{
			const { maxTestColumns } = LAYOUT_CONFIG;

			let bestGrid: GridConfig | null = null;
			let bestScore = -Infinity;

			const maxCols = Math.min(userCount, maxTestColumns);

			for (let cols = 1; cols <= maxCols; cols++)
			{
				const rows = Math.ceil(userCount / cols);
				const grid = this.tryGrid(cols, rows);

				if (!grid)
				{
					continue;
				}

				const score = this.scoreGrid(grid, cols, rows);

				if (score > bestScore)
				{
					bestScore = score;
					bestGrid = grid;
				}
			}

			return bestGrid || this.createMinimumGrid(userCount);
		},

		tryGrid(cols: number, rows: number): GridConfig | null
		{
			const { gap, aspectRatio, minCardHeight } = LAYOUT_CONFIG;

			const cardWidthByWidth = (this.availableWidth - (cols - 1) * gap) / cols;
			const cardHeightByHeight = (this.availableHeight - (rows - 1) * gap) / rows;
			const cardWidthByHeight = cardHeightByHeight * aspectRatio;

			let cardWidth = Math.min(cardWidthByWidth, cardWidthByHeight);
			let cardHeight = cardWidth / aspectRatio;

			if (cardHeight < minCardHeight)
			{
				cardHeight = minCardHeight;
				cardWidth = cardHeight * aspectRatio;
			}

			const totalWidth = cols * cardWidth + (cols - 1) * gap;
			const totalHeight = rows * cardHeight + (rows - 1) * gap;

			if (totalWidth > this.availableWidth + 1 || totalHeight > this.availableHeight + 1)
			{
				return null;
			}

			return { cols, rows, cardWidth, cardHeight, totalWidth, totalHeight };
		},

		scoreGrid(grid: GridConfig, cols: number, rows: number): number
		{
			const cardArea = grid.cardWidth * grid.cardHeight;
			const aspectBalance = 1 / (Math.abs(cols - rows) + 1);
			const spaceUsage = (grid.totalWidth * grid.totalHeight) / (this.availableWidth * this.availableHeight);

			return cardArea * aspectBalance * spaceUsage;
		},

		createMinimumGrid(userCount: number): GridConfig
		{
			const { gap, aspectRatio, minCardHeight } = LAYOUT_CONFIG;

			const cardHeight = minCardHeight;
			const cardWidth = cardHeight * aspectRatio;
			const cols = Math.max(1, Math.floor((this.availableWidth + gap) / (cardWidth + gap)));
			const rows = Math.ceil(userCount / cols);

			return {
				cols,
				rows,
				cardWidth,
				cardHeight,
				totalWidth: cols * cardWidth + (cols - 1) * gap,
				totalHeight: rows * cardHeight + (rows - 1) * gap,
			};
		},

		positionUsersInGrid(userIds: number[], grid: GridConfig): LayoutItem[]
		{
			const { cols, rows, cardWidth, cardHeight, totalWidth, totalHeight } = grid;
			const { gap, padding } = LAYOUT_CONFIG;

			const startX = padding.horizontal + (this.availableWidth - totalWidth) / 2;
			const startY = padding.vertical + (this.availableHeight - totalHeight) / 2;

			const items: LayoutItem[] = [];
			let userIndex = 0;

			for (let row = 0; row < rows && userIndex < userIds.length; row++)
			{
				const itemsInRow = Math.min(cols, userIds.length - userIndex);
				const rowWidth = itemsInRow * cardWidth + (itemsInRow - 1) * gap;
				const rowStartX = startX + (totalWidth - rowWidth) / 2;

				for (let col = 0; col < itemsInRow; col++)
				{
					const x = rowStartX + col * (cardWidth + gap);
					const y = startY + row * (cardHeight + gap);

					items.push({
						x,
						y,
						width: cardWidth,
						height: cardHeight,
						userId: userIds[userIndex],
					});

					userIndex++;
				}
			}

			return items;
		},

		layoutSingleUser(userId: number): LayoutItem[]
		{
			const { aspectRatio, minCardHeight, padding } = LAYOUT_CONFIG;

			let cardWidth = this.availableWidth;
			let cardHeight = cardWidth / aspectRatio;

			if (cardHeight > this.availableHeight)
			{
				cardHeight = this.availableHeight;
				cardWidth = cardHeight * aspectRatio;
			}

			if (cardHeight < minCardHeight)
			{
				cardHeight = minCardHeight;
				cardWidth = cardHeight * aspectRatio;
			}

			const x = padding.horizontal + (this.availableWidth - cardWidth) / 2;
			const y = padding.vertical + (this.availableHeight - cardHeight) / 2;

			return [{ x, y, width: cardWidth, height: cardHeight, userId }];
		},

		// --- Speaker layout with virtual scroll ---

		getSpeakerLayout(): LayoutItem[]
		{
			if (this.speakerId === null)
			{
				return [];
			}

			const { gap, padding, thumbnailHeight } = LAYOUT_CONFIG;
			const hasSidebar = this.sidebarOtherUsers.length > 0;
			const speakerWidth = this.availableWidth - (hasSidebar ? THUMBNAIL_WIDTH + gap : 0);

			const items: LayoutItem[] = [
				{
					x: padding.horizontal,
					y: padding.vertical,
					width: speakerWidth,
					height: this.availableHeight,
					userId: this.speakerId,
					isSpeaker: true,
				},
			];

			if (!hasSidebar)
			{
				return items;
			}

			const sidebarX = this.layoutWidth - THUMBNAIL_WIDTH - padding.horizontal;
			const itemHeight = thumbnailHeight + gap;
			const { start } = this.sidebarVisibleRange;

			for (let i = 0; i < this.sidebarVisibleUsers.length; i++)
			{
				const actualIndex = start + i;
				const userId = this.sidebarVisibleUsers[i];
				const y = padding.vertical + actualIndex * itemHeight - this.sidebarScrollTop;

				items.push({
					x: sidebarX,
					y,
					width: THUMBNAIL_WIDTH,
					height: thumbnailHeight,
					userId,
				});
			}

			if (this.showSidebarPlus)
			{
				const plusIndex = this.sidebarOtherUsers.length;
				const y = padding.vertical + plusIndex * itemHeight - this.sidebarScrollTop;

				items.push({
					x: sidebarX,
					y,
					width: THUMBNAIL_WIDTH,
					height: thumbnailHeight,
					plus: true,
				});
			}

			return items;
		},

		// --- Event handlers ---

		handleUserSelect(userId: number): void
		{
			this.usersStore.setSpeaker(userId);
			this.page = 1;
			this.sidebarScrollTop = 0;
			this.lastGridConfig = null;
		},

		handlePrev(): void
		{
			if (!this.canGoPrev)
			{
				return;
			}
			this.page--;
			this.lastGridConfig = null;
		},

		handleNext(): void
		{
			if (!this.canGoNext)
			{
				return;
			}
			this.page++;
			this.lastGridConfig = null;
		},

		handleSidebarWheel(event: WheelEvent): void
		{
			if (!this.isSpeakerMode || !this.sidebarCanScroll)
			{
				return;
			}

			event.preventDefault();

			const delta = event.deltaY;
			const newScroll = Math.max(0, Math.min(this.sidebarMaxScroll, this.sidebarScrollTop + delta));

			this.sidebarScrollTop = newScroll;
		},

		// --- Helpers ---

		getItemKey(item: LayoutItem): string | number
		{
			return item.plus ? 'plus' : item.userId!;
		},

		getCardStyle(item: LayoutItem): Record<string, string>
		{
			return {
				'--call-card-width': `${item.width}px`,
				'--call-card-height': `${item.height}px`,
				'--call-card-top': `${item.y}px`,
				'--call-card-left': `${item.x}px`,
			};
		},
	},
	template: /* HTML */`
		<div class="call-content" :style="containerStyle" @wheel="handleSidebarWheel">
			<!-- User cards -->
			<template v-for="item in layoutItems" :key="getItemKey(item)">
				<div class="call-content__card" :style="getCardStyle(item)">
					<CallUserCardPlus v-if="item.plus" />
					<CallUserCard
						v-else
						:userId="item.userId"
						:pinned="item.isSpeaker"
						active
						@select="handleUserSelect"
					/>
				</div>
			</template>

			<!-- Navigation arrows (only in grid mode) -->
			<div v-if="canGoPrev || canGoNext" class="call-content__arrows">
				<div v-if="canGoPrev" class="call-content__arrow --prev" @click="handlePrev">
					<CallIcon :icon="prevIcon" />
				</div>
				<div v-if="canGoNext" class="call-content__arrow --next" @click="handleNext">
					<CallIcon :icon="nextIcon" />
				</div>
			</div>
			<!--TODO: do normal margin!!!-->
			<CallContentHands v-if="isSpeakerMode" :style="{ marginRight: '195px', marginBottom: '15px' }" />
			<CallContentHands v-else />
		</div>
	`,
});

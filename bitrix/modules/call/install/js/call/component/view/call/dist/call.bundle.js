/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_store, call_component_block_header, call_component_block_footer, call_component_block_userCard, call_component_ui_icon, call_component_ui_avatar) {
	'use strict';

	const CallContentHands = ui_vue3.defineComponent({
		name: 'CallContentHands',
		components: {
			CallAvatar: call_component_ui_avatar.CallAvatar,
			CallIcon: call_component_ui_icon.CallIcon
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		setup() {
			return {
				usersStore: call_store.useUsersStore()
			};
		},
		computed: {
			queueItems() {
				const maxVisible = 4;
				const ids = this.usersStore.raiseHandQueue.slice(0, maxVisible);
				return ids.map((userId, index) => {
					const user = this.usersStore.userById(userId);
					return {
						userId,
						userName: user?.name || '',
						opacity: Math.max(0, 1 - index * 0.25)
					};
				}).filter(item => Boolean(item.userName));
			}
		},
		methods: {
			handleRemove(userId) {
				this.usersStore.removeRaiseHand(userId);
			},
			userText(userName) {
				return this.loc('CALL_RAISE_HAND_QUEUE_WANTS_TO_SPEAK', {
					'#USER_NAME#': userName
				});
			}
		},
		template: `
		<transition-group
			tag="div"
			class="call-raise-hand-queue"
			name="call-raise-hand-queue"
		>
				<div
					v-for="item in queueItems"
					:key="item.userId"
					class="call-raise-hand-queue__item"
					:style="{ opacity: item.opacity }"
				>
					<CallAvatar :label="item.userName" :size="20"/>
					<CallIcon icon="stop-hand-solid" :size="20"/>
					<span class="call-raise-hand-queue__text">{{ userText(item.userName) }}</span>
					<CallIcon icon="cross" :size="16" class="call-raise-hand-queue__cross" @click="handleRemove(item.userId)"/>
				</div>
		</transition-group>
	`
	});

	const LAYOUT_CONFIG = {
		padding: {
			horizontal: 20,
			vertical: 0
		},
		gap: 10,
		aspectRatio: 16 / 9,
		minCardHeight: 100,
		thumbnailHeight: 100,
		maxUsersLimit: 20,
		maxTestColumns: 5,
		virtualScrollBuffer: 1
	};
	const THUMBNAIL_WIDTH = LAYOUT_CONFIG.thumbnailHeight * LAYOUT_CONFIG.aspectRatio;
	const CallContent = ui_vue3.defineComponent({
		name: 'CallContent',
		components: {
			CallUserCard: call_component_block_userCard.CallUserCard,
			CallUserCardPlus: call_component_block_userCard.CallUserCardPlus,
			CallIcon: call_component_ui_icon.CallIcon,
			CallContentHands
		},
		setup() {
			return {
				usersStore: call_store.useUsersStore(),
				uiStore: call_store.useUiStore()
			};
		},
		data() {
			return {
				page: 1,
				sidebarScrollTop: 0,
				lastGridConfig: null
			};
		},
		computed: {
			layoutWidth() {
				return this.uiStore.layoutWidth;
			},
			layoutHeight() {
				return this.uiStore.layoutContentHeight;
			},
			availableWidth() {
				return this.layoutWidth - LAYOUT_CONFIG.padding.horizontal * 2;
			},
			availableHeight() {
				return this.layoutHeight - LAYOUT_CONFIG.padding.vertical * 2;
			},
			containerStyle() {
				return {
					position: 'relative',
					width: `${this.layoutWidth}px`,
					height: `${this.layoutHeight}px`,
					overflow: 'hidden',
					boxSizing: 'border-box',
					padding: `${LAYOUT_CONFIG.padding.vertical}px`
				};
			},
			speakerId() {
				return this.usersStore.speakerId;
			},
			isSpeakerMode() {
				return this.speakerId !== null;
			},
			userIds() {
				return this.usersStore.userIds;
			},
			sidebarOtherUsers() {
				if (!this.isSpeakerMode || this.speakerId === null) {
					return [];
				}
				return this.userIds.filter(id => id !== this.speakerId);
			},
			sidebarTotalHeight() {
				const {
					gap,
					thumbnailHeight
				} = LAYOUT_CONFIG;
				const itemCount = this.sidebarOtherUsers.length + 1;
				return itemCount * thumbnailHeight + (itemCount - 1) * gap;
			},
			sidebarCanScroll() {
				return this.sidebarTotalHeight > this.availableHeight;
			},
			sidebarMaxScroll() {
				return Math.max(0, this.sidebarTotalHeight - this.availableHeight);
			},
			sidebarVisibleRange() {
				if (!this.isSpeakerMode) {
					return {
						start: 0,
						end: 0
					};
				}
				const {
					gap,
					thumbnailHeight,
					virtualScrollBuffer
				} = LAYOUT_CONFIG;
				const itemHeight = thumbnailHeight + gap;
				const startIndex = Math.max(0, Math.floor(this.sidebarScrollTop / itemHeight) - virtualScrollBuffer);
				const visibleCount = Math.ceil(this.availableHeight / itemHeight);
				const endIndex = Math.min(this.sidebarOtherUsers.length, startIndex + visibleCount + virtualScrollBuffer * 2);
				return {
					start: startIndex,
					end: endIndex
				};
			},
			sidebarVisibleUsers() {
				const {
					start,
					end
				} = this.sidebarVisibleRange;
				return this.sidebarOtherUsers.slice(start, end);
			},
			showSidebarPlus() {
				if (!this.isSpeakerMode) {
					return false;
				}
				const plusIndex = this.sidebarOtherUsers.length;
				return plusIndex >= this.sidebarVisibleRange.start && plusIndex < this.sidebarVisibleRange.end + 1;
			},
			maxGridUsers() {
				const {
					gap,
					aspectRatio,
					minCardHeight,
					maxUsersLimit
				} = LAYOUT_CONFIG;
				const minCardWidth = minCardHeight * aspectRatio;
				const maxCols = Math.max(1, Math.floor((this.availableWidth + gap) / (minCardWidth + gap)));
				const maxRows = Math.max(1, Math.floor((this.availableHeight + gap) / (minCardHeight + gap)));
				const calculatedMax = Math.min(maxUsersLimit, maxCols * maxRows);
				return Math.max(2, calculatedMax);
			},
			totalGridPages() {
				return Math.ceil(this.userIds.length / this.maxGridUsers);
			},
			isLastGridPage() {
				const startIndex = (this.page - 1) * this.maxGridUsers;
				const remainingUsers = this.userIds.length - startIndex;
				return remainingUsers <= this.maxGridUsers;
			},
			canGoPrev() {
				return !this.isSpeakerMode && this.page > 1;
			},
			canGoNext() {
				return !this.isSpeakerMode && !this.isLastGridPage;
			},
			prevIcon() {
				return 'chevron-left';
			},
			nextIcon() {
				return 'chevron-right';
			},
			layoutItems() {
				if (this.isSpeakerMode) {
					return this.getSpeakerLayout();
				}
				return this.getGridLayout();
			}
		},
		watch: {
			isSpeakerMode(newValue) {
				if (newValue) {
					this.sidebarScrollTop = 0;
				} else {
					this.page = 1;
				}
				this.lastGridConfig = null;
			},
			totalGridPages(newTotal) {
				if (!this.isSpeakerMode && this.page > newTotal && newTotal > 0) {
					this.page = newTotal;
				}
			},
			sidebarMaxScroll(newMax) {
				if (this.sidebarScrollTop > newMax) {
					this.sidebarScrollTop = newMax;
				}
			}
		},
		methods: {
			getGridLayout() {
				const startIndex = (this.page - 1) * this.maxGridUsers;
				const pageUserIds = this.userIds.slice(startIndex, startIndex + this.maxGridUsers);
				if (!pageUserIds?.length) {
					return [];
				}
				const userCount = pageUserIds.length;
				if (userCount === 1) {
					this.lastGridConfig = null;
					return this.layoutSingleUser(pageUserIds[0]);
				}
				const canReuseGrid = this.lastGridConfig && this.lastGridConfig.userCount === userCount && Math.abs(this.lastGridConfig.availableWidth - this.availableWidth) < 10 && Math.abs(this.lastGridConfig.availableHeight - this.availableHeight) < 10;
				let grid = null;
				if (canReuseGrid) {
					grid = this.tryGrid(this.lastGridConfig.cols, this.lastGridConfig.rows);
					if (!grid) {
						grid = this.findOptimalGrid(userCount);
					}
				} else {
					grid = this.findOptimalGrid(userCount);
				}
				if (grid) {
					this.lastGridConfig = {
						userCount,
						availableWidth: this.availableWidth,
						availableHeight: this.availableHeight,
						cols: grid.cols,
						rows: grid.rows
					};
				}
				return this.positionUsersInGrid(pageUserIds, grid);
			},
			findOptimalGrid(userCount) {
				const {
					maxTestColumns
				} = LAYOUT_CONFIG;
				let bestGrid = null;
				let bestScore = -Infinity;
				const maxCols = Math.min(userCount, maxTestColumns);
				for (let cols = 1; cols <= maxCols; cols++) {
					const rows = Math.ceil(userCount / cols);
					const grid = this.tryGrid(cols, rows);
					if (!grid) {
						continue;
					}
					const score = this.scoreGrid(grid, cols, rows);
					if (score > bestScore) {
						bestScore = score;
						bestGrid = grid;
					}
				}
				return bestGrid || this.createMinimumGrid(userCount);
			},
			tryGrid(cols, rows) {
				const {
					gap,
					aspectRatio,
					minCardHeight
				} = LAYOUT_CONFIG;
				const cardWidthByWidth = (this.availableWidth - (cols - 1) * gap) / cols;
				const cardHeightByHeight = (this.availableHeight - (rows - 1) * gap) / rows;
				const cardWidthByHeight = cardHeightByHeight * aspectRatio;
				let cardWidth = Math.min(cardWidthByWidth, cardWidthByHeight);
				let cardHeight = cardWidth / aspectRatio;
				if (cardHeight < minCardHeight) {
					cardHeight = minCardHeight;
					cardWidth = cardHeight * aspectRatio;
				}
				const totalWidth = cols * cardWidth + (cols - 1) * gap;
				const totalHeight = rows * cardHeight + (rows - 1) * gap;
				if (totalWidth > this.availableWidth + 1 || totalHeight > this.availableHeight + 1) {
					return null;
				}
				return {
					cols,
					rows,
					cardWidth,
					cardHeight,
					totalWidth,
					totalHeight
				};
			},
			scoreGrid(grid, cols, rows) {
				const cardArea = grid.cardWidth * grid.cardHeight;
				const aspectBalance = 1 / (Math.abs(cols - rows) + 1);
				const spaceUsage = grid.totalWidth * grid.totalHeight / (this.availableWidth * this.availableHeight);
				return cardArea * aspectBalance * spaceUsage;
			},
			createMinimumGrid(userCount) {
				const {
					gap,
					aspectRatio,
					minCardHeight
				} = LAYOUT_CONFIG;
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
					totalHeight: rows * cardHeight + (rows - 1) * gap
				};
			},
			positionUsersInGrid(userIds, grid) {
				const {
					cols,
					rows,
					cardWidth,
					cardHeight,
					totalWidth,
					totalHeight
				} = grid;
				const {
					gap,
					padding
				} = LAYOUT_CONFIG;
				const startX = padding.horizontal + (this.availableWidth - totalWidth) / 2;
				const startY = padding.vertical + (this.availableHeight - totalHeight) / 2;
				const items = [];
				let userIndex = 0;
				for (let row = 0; row < rows && userIndex < userIds.length; row++) {
					const itemsInRow = Math.min(cols, userIds.length - userIndex);
					const rowWidth = itemsInRow * cardWidth + (itemsInRow - 1) * gap;
					const rowStartX = startX + (totalWidth - rowWidth) / 2;
					for (let col = 0; col < itemsInRow; col++) {
						const x = rowStartX + col * (cardWidth + gap);
						const y = startY + row * (cardHeight + gap);
						items.push({
							x,
							y,
							width: cardWidth,
							height: cardHeight,
							userId: userIds[userIndex]
						});
						userIndex++;
					}
				}
				return items;
			},
			layoutSingleUser(userId) {
				const {
					aspectRatio,
					minCardHeight,
					padding
				} = LAYOUT_CONFIG;
				let cardWidth = this.availableWidth;
				let cardHeight = cardWidth / aspectRatio;
				if (cardHeight > this.availableHeight) {
					cardHeight = this.availableHeight;
					cardWidth = cardHeight * aspectRatio;
				}
				if (cardHeight < minCardHeight) {
					cardHeight = minCardHeight;
					cardWidth = cardHeight * aspectRatio;
				}
				const x = padding.horizontal + (this.availableWidth - cardWidth) / 2;
				const y = padding.vertical + (this.availableHeight - cardHeight) / 2;
				return [{
					x,
					y,
					width: cardWidth,
					height: cardHeight,
					userId
				}];
			},
			getSpeakerLayout() {
				if (this.speakerId === null) {
					return [];
				}
				const {
					gap,
					padding,
					thumbnailHeight
				} = LAYOUT_CONFIG;
				const hasSidebar = this.sidebarOtherUsers.length > 0;
				const speakerWidth = this.availableWidth - (hasSidebar ? THUMBNAIL_WIDTH + gap : 0);
				const items = [{
					x: padding.horizontal,
					y: padding.vertical,
					width: speakerWidth,
					height: this.availableHeight,
					userId: this.speakerId,
					isSpeaker: true
				}];
				if (!hasSidebar) {
					return items;
				}
				const sidebarX = this.layoutWidth - THUMBNAIL_WIDTH - padding.horizontal;
				const itemHeight = thumbnailHeight + gap;
				const {
					start
				} = this.sidebarVisibleRange;
				for (let i = 0; i < this.sidebarVisibleUsers.length; i++) {
					const actualIndex = start + i;
					const userId = this.sidebarVisibleUsers[i];
					const y = padding.vertical + actualIndex * itemHeight - this.sidebarScrollTop;
					items.push({
						x: sidebarX,
						y,
						width: THUMBNAIL_WIDTH,
						height: thumbnailHeight,
						userId
					});
				}
				if (this.showSidebarPlus) {
					const plusIndex = this.sidebarOtherUsers.length;
					const y = padding.vertical + plusIndex * itemHeight - this.sidebarScrollTop;
					items.push({
						x: sidebarX,
						y,
						width: THUMBNAIL_WIDTH,
						height: thumbnailHeight,
						plus: true
					});
				}
				return items;
			},
			handleUserSelect(userId) {
				this.usersStore.setSpeaker(userId);
				this.page = 1;
				this.sidebarScrollTop = 0;
				this.lastGridConfig = null;
			},
			handlePrev() {
				if (!this.canGoPrev) {
					return;
				}
				this.page--;
				this.lastGridConfig = null;
			},
			handleNext() {
				if (!this.canGoNext) {
					return;
				}
				this.page++;
				this.lastGridConfig = null;
			},
			handleSidebarWheel(event) {
				if (!this.isSpeakerMode || !this.sidebarCanScroll) {
					return;
				}
				event.preventDefault();
				const delta = event.deltaY;
				const newScroll = Math.max(0, Math.min(this.sidebarMaxScroll, this.sidebarScrollTop + delta));
				this.sidebarScrollTop = newScroll;
			},
			getItemKey(item) {
				return item.plus ? 'plus' : item.userId;
			},
			getCardStyle(item) {
				return {
					'--call-card-width': `${item.width}px`,
					'--call-card-height': `${item.height}px`,
					'--call-card-top': `${item.y}px`,
					'--call-card-left': `${item.x}px`
				};
			}
		},
		template: `
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
	`
	});

	const CallMainLayout = ui_vue3.defineComponent({
		name: 'CallMainLayout',
		components: {
			CallHeader: call_component_block_header.CallHeader,
			CallContent,
			CallFooter: call_component_block_footer.CallFooter
		},
		setup() {
			return {
				uiStore: call_store.useUiStore()
			};
		},
		data() {
			return {
				resizeObserver: null,
				resizeRafId: null,
				pendingEntry: null,
				lastDimensions: null
			};
		},
		mounted() {
			this.resizeObserver = new ResizeObserver(entries => {
				this.pendingEntry = entries[entries.length - 1];
				if (this.resizeRafId !== null) {
					return;
				}
				this.resizeRafId = requestAnimationFrame(() => this.flushResize());
			});
			this.resizeObserver.observe(this.$refs.layout);
		},
		beforeUnmount() {
			if (this.resizeRafId !== null) {
				cancelAnimationFrame(this.resizeRafId);
				this.resizeRafId = null;
			}
			if (this.resizeObserver) {
				this.resizeObserver.disconnect();
				this.resizeObserver = null;
			}
		},
		computed: {
			isCopilotActive() {
				return this.uiStore.isCopilotActive;
			}
		},
		methods: {
			flushResize() {
				this.resizeRafId = null;
				const entry = this.pendingEntry;
				this.pendingEntry = null;
				if (!entry) {
					return;
				}
				const header = this.$refs.header;
				const footer = this.$refs.footer;
				if (!header || !footer) {
					return;
				}
				const width = entry.contentRect.width;
				const height = entry.contentRect.height;
				const contentHeight = height - header.$el.clientHeight - footer.$el.clientHeight;
				const last = this.lastDimensions;
				if (last && last.layoutWidth === width && last.layoutHeight === height && last.layoutContentHeight === contentHeight) {
					return;
				}
				this.lastDimensions = {
					layoutWidth: width,
					layoutHeight: height,
					layoutContentHeight: contentHeight
				};
				this.uiStore.setLayoutDimensions(this.lastDimensions);
			}
		},
		template: `
		<div ref="layout" class="call-layout__main-layout" :class="{ '--copilot': isCopilotActive }" data-testid="call-layout-main">
			<div class="call-layout__main">
				<CallHeader ref="header" />
				<CallContent />
				<CallFooter ref="footer" class="call-layout__footer" />
			</div>
			<div class="call-layout__side"></div>
		</div>
	`
	});

	const CallLoaderLayout = ui_vue3.defineComponent({
		name: 'CallLoaderLayout',
		inject: {
			loc: {
				default: () => key => key
			}
		},
		setup() {
			return {
				uiStore: call_store.useUiStore()
			};
		},
		computed: {
			uiState() {
				return this.uiStore.uiState;
			},
			statusText() {
				const key = this.uiState === 'Reconnecting' ? 'CALL_VIEW_CALL_STATUS_RECONNECTING' : 'CALL_VIEW_CALL_STATUS_CONNECTING';
				return this.loc(key);
			},
			testState() {
				return this.uiState.toLowerCase();
			}
		},
		template: `
		<div
			class="call-layout__loader"
			data-testid="call-layout-loader"
			:data-test-state="testState"
		>
			<div class="call-layout__loader-spinner"></div>
			<div class="call-layout__loader-status">{{ statusText }}</div>
		</div>
	`
	});

	const CallErrorLayout = ui_vue3.defineComponent({
		name: 'CallErrorLayout',
		components: {
			CallIcon: call_component_ui_icon.CallIcon
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		computed: {
			title() {
				return this.loc('CALL_VIEW_CALL_ERROR_TITLE');
			},
			message() {
				return this.loc('CALL_VIEW_CALL_ERROR_MESSAGE');
			}
		},
		template: `
		<div class="call-layout__error" data-testid="call-layout-error">
			<div class="call-layout__error-icon">
				<CallIcon icon="alert-accent" :size="48" color="red" />
			</div>
			<div class="call-layout__error-title">{{ title }}</div>
			<div class="call-layout__error-message">{{ message }}</div>
		</div>
	`
	});

	const LOADING_STATES = new Set(['Idle', 'Preparing', 'Connecting', 'Reconnecting']);
	const CallLayout = ui_vue3.defineComponent({
		name: 'CallLayout',
		components: {
			CallMainLayout,
			CallLoaderLayout,
			CallErrorLayout
		},
		setup() {
			return {
				uiStore: call_store.useUiStore()
			};
		},
		computed: {
			uiState() {
				return this.uiStore.uiState;
			},
			isLoading() {
				return LOADING_STATES.has(this.uiState);
			},
			isError() {
				return this.uiState === 'Error';
			},
			isCopilotActive() {
				return this.uiStore.isCopilotActive;
			}
		},
		template: `
		<div
			class="call-layout"
			:class="{ 'call-layout--copilot': isCopilotActive }"
			data-testid="call-layout"
			:data-test-state="uiState.toLowerCase()"
		>
			<CallErrorLayout v-if="isError" />
			<CallLoaderLayout v-else-if="isLoading" />
			<CallMainLayout v-else />
		</div>
	`
	});

	exports.CallErrorLayout = CallErrorLayout;
	exports.CallLayout = CallLayout;
	exports.CallLoaderLayout = CallLoaderLayout;
	exports.CallMainLayout = CallMainLayout;

})(this.BX.Call.Component.View = this.BX.Call.Component.View || {}, BX.Vue3, BX.Call.Store, BX.Call.Component.Block, BX.Call.Component.Block, BX.Call.Component.Block, BX.Call.Component.Ui, BX.Call.Component.Ui);
//# sourceMappingURL=call.bundle.js.map

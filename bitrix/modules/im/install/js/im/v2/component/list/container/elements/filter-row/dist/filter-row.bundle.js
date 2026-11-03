/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, ui_cnt, ui_system_chip_vue, ui_vue3, ui_vue3_components_counter, im_v2_lib_counter, im_v2_lib_menu) {
	'use strict';

	const FilterMode = {
		all: 'all',
		unread: 'unread'
	};
	const FilterRow = ui_vue3.defineComponent({
		name: 'ImListContainerFilterRow',
		components: {
			UiChip: ui_system_chip_vue.Chip,
			BCounter: ui_vue3_components_counter.Counter
		},
		props: {
			mode: {
				type: String,
				required: true,
				validator: value => Object.values(FilterMode).includes(value)
			},
			counter: {
				type: Number,
				default: 0
			},
			readAllSection: {
				type: String,
				default: null
			}
		},
		emits: ['changeMode'],
		setup() {
			return {
				FilterMode,
				ChipSize: ui_system_chip_vue.ChipSize,
				CounterSize: ui_cnt.CounterSize,
				unreadMenu: null
			};
		},
		computed: {
			hasReadAllMenu() {
				return im_v2_lib_menu.UnreadFilterMenu.isAvailableFor(this.readAllSection);
			},
			showCounter() {
				return this.counter > 0;
			},
			counterStyle() {
				return this.isActive(FilterMode.unread) ? ui_cnt.CounterStyle.FILLED : ui_cnt.CounterStyle.FILLED_NO_ACCENT;
			},
			maxCounterValue() {
				return im_v2_lib_counter.CounterManager.getCounterDisplayLimit() - 1;
			},
			unreadAriaLabel() {
				if (!this.showCounter) {
					return this.loc('IM_LIST_CONTAINER_FILTER_ROW_UNREAD');
				}
				return this.loc('IM_LIST_CONTAINER_FILTER_ROW_UNREAD_ARIA', {
					'#COUNT#': String(this.counter)
				});
			}
		},
		beforeUnmount() {
			this.unreadMenu?.destroy();
		},
		methods: {
			isActive(mode) {
				return this.mode === mode;
			},
			chipDesign(mode) {
				return this.isActive(mode) ? ui_system_chip_vue.ChipDesign.OutlineAccent : ui_system_chip_vue.ChipDesign.OutlineNoAccent;
			},
			ariaPressed(mode) {
				return this.isActive(mode) ? 'true' : 'false';
			},
			handleSelect(mode) {
				if (this.isActive(mode)) {
					return;
				}
				this.$emit('changeMode', mode);
			},
			handleKeydown(event, mode) {
				if (event.key === ' ') {
					event.preventDefault();
					this.handleSelect(mode);
				}
			},
			handleContextMenu(event) {
				if (!this.hasReadAllMenu) {
					return;
				}
				event.preventDefault();
				const target = event.button === 2 ? {
					left: event.pageX,
					top: event.pageY
				} : event.currentTarget;
				this.unreadMenu ??= new im_v2_lib_menu.UnreadFilterMenu();
				this.unreadMenu.openMenu({
					section: this.readAllSection
				}, target);
			},
			loc(phraseCode, replacements = {}) {
				return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
			}
		},
		template: `
		<div
			class="bx-im-list-container-filter-row__container --hidden-scroll"
			role="group"
			:aria-label="loc('IM_LIST_CONTAINER_FILTER_ROW_ARIA')"
			data-testid="im-list-filter-row"
		>
			<UiChip
				class="bx-im-list-container-filter-row__chip --focus-visible"
				:text="loc('IM_LIST_CONTAINER_FILTER_ROW_ALL')"
				:design="chipDesign(FilterMode.all)"
				:size="ChipSize.Md"
				rounded
				role="button"
				:aria-pressed="ariaPressed(FilterMode.all)"
				data-testid="im-list-filter-all"
				@click="handleSelect(FilterMode.all)"
				@keydown="handleKeydown($event, FilterMode.all)"
			/>
			<div class="bx-im-list-container-filter-row__unread">
				<UiChip
					class="bx-im-list-container-filter-row__chip --focus-visible"
					:text="loc('IM_LIST_CONTAINER_FILTER_ROW_UNREAD')"
					:design="chipDesign(FilterMode.unread)"
					:size="ChipSize.Md"
					rounded
					role="button"
					:aria-pressed="ariaPressed(FilterMode.unread)"
					:aria-label="unreadAriaLabel"
					:aria-haspopup="hasReadAllMenu ? 'menu' : null"
					data-testid="im-list-filter-unread"
					@click="handleSelect(FilterMode.unread)"
					@keydown="handleKeydown($event, FilterMode.unread)"
					@contextmenu="handleContextMenu"
				/>
				<div
					v-if="showCounter"
					class="bx-im-list-container-filter-row__counter"
					data-testid="im-list-filter-unread-counter"
					aria-hidden="true"
				>
					<BCounter
						:value="counter"
						:maxValue="maxCounterValue"
						:style="counterStyle"
						:size="CounterSize.SMALL"
					/>
				</div>
			</div>
		</div>
	`
	});

	exports.FilterMode = FilterMode;
	exports.FilterRow = FilterRow;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.UI, BX.UI.System.Chip.Vue, BX.Vue3, BX.UI.Vue3.Components, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=filter-row.bundle.js.map

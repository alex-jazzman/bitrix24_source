import { type PopupTarget } from 'main.popup';
import { CounterSize, CounterStyle } from 'ui.cnt';
import { Chip as UiChip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { defineComponent, type PropType } from 'ui.vue3';
import { Counter as BCounter } from 'ui.vue3.components.counter';

import { type RecentTypeItem } from 'im.v2.const';
import { CounterManager } from 'im.v2.lib.counter';
import { UnreadFilterMenu } from 'im.v2.lib.menu';

import 'im.v2.css.classes';

import './filter-row.css';

export const FilterMode = {
	all: 'all',
	unread: 'unread',
} as const;

export type FilterModeItem = typeof FilterMode[keyof typeof FilterMode];

type FilterRowState = {
	FilterMode: typeof FilterMode,
	ChipSize: typeof ChipSize,
	CounterSize: typeof CounterSize,
	unreadMenu: UnreadFilterMenu | null,
};

// The container owns the active mode and the counter; the row shows them and owns the context menu
// of the unread chip - the read of the section the chip filters.
// @vue/component
export const FilterRow = defineComponent({
	name: 'ImListContainerFilterRow',
	components: { UiChip, BCounter } as { UiChip: typeof UiChip, BCounter: typeof BCounter },
	props: {
		mode: {
			type: String as PropType<FilterModeItem>,
			required: true,
			validator: (value: string): boolean => Object.values(FilterMode).includes(value as FilterModeItem),
		},
		counter: {
			type: Number,
			default: 0,
		},
		// The section the unread chip reads from its context menu. A container that passes none keeps
		// the native menu of the browser on the chip.
		readAllSection: {
			type: String as PropType<RecentTypeItem | null>,
			default: null,
		},
	},
	emits: ['changeMode'],
	setup(): FilterRowState
	{
		// The menu instance lives here and not in `data`: Vue's Proxy breaks the private fields of a class.
		return { FilterMode, ChipSize, CounterSize, unreadMenu: null };
	},
	computed: {
		hasReadAllMenu(): boolean
		{
			return UnreadFilterMenu.isAvailableFor(this.readAllSection);
		},
		showCounter(): boolean
		{
			return this.counter > 0;
		},
		// The badge follows the chip state: accent on the active chip, neutral on the inactive one.
		counterStyle(): string
		{
			return this.isActive(FilterMode.unread) ? CounterStyle.FILLED : CounterStyle.FILLED_NO_ACCENT;
		},
		// Same limit as the recent item counters, so the chip and the folder badge overflow together.
		maxCounterValue(): number
		{
			return CounterManager.getCounterDisplayLimit() - 1;
		},
		unreadAriaLabel(): string
		{
			if (!this.showCounter)
			{
				return this.loc('IM_LIST_CONTAINER_FILTER_ROW_UNREAD');
			}

			return this.loc('IM_LIST_CONTAINER_FILTER_ROW_UNREAD_ARIA', { '#COUNT#': String(this.counter) });
		},
	},
	beforeUnmount(): void
	{
		this.unreadMenu?.destroy();
	},
	methods: {
		isActive(mode: FilterModeItem): boolean
		{
			return this.mode === mode;
		},
		chipDesign(mode: FilterModeItem): string
		{
			return this.isActive(mode) ? ChipDesign.OutlineAccent : ChipDesign.OutlineNoAccent;
		},
		ariaPressed(mode: FilterModeItem): string
		{
			return this.isActive(mode) ? 'true' : 'false';
		},
		handleSelect(mode: FilterModeItem): void
		{
			if (this.isActive(mode))
			{
				return;
			}

			this.$emit('changeMode', mode);
		},
		// Enter is handled by the chip itself; Space is the second activation key of a button.
		handleKeydown(event: KeyboardEvent, mode: FilterModeItem): void
		{
			if (event.key === ' ')
			{
				event.preventDefault();
				this.handleSelect(mode);
			}
		},
		// Raised by the pointer and by the keyboard alike (Shift+F10, the context menu key): the keyboard
		// event carries no button and no pointer to aim at, so the menu binds to the chip itself.
		handleContextMenu(event: MouseEvent): void
		{
			if (!this.hasReadAllMenu)
			{
				return;
			}

			event.preventDefault();

			const target: PopupTarget = event.button === 2
				? { left: event.pageX, top: event.pageY }
				: (event.currentTarget as HTMLElement);

			// Built on the first open and not in `created`: the menu takes the store of the application
			// in its constructor, and the row is mounted where there is none.
			this.unreadMenu ??= new UnreadFilterMenu();
			this.unreadMenu.openMenu({ section: this.readAllSection }, target);
		},
		loc(phraseCode: string, replacements: Record<string, string> = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
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
	`,
});

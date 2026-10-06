import { Loc, Text } from 'main.core';
import { FocusKeys, FocusNavigator, FocusZone } from 'ui.a11y';

import { TileItem } from './tile-item';
import { TileMoreItem } from './tile-more-item';

import type { BitrixVueComponentProps } from 'ui.vue3';
import type { TileWidgetItem } from '../tile-widget-item';

/**
 * @memberof BX.UI.Uploader
 */
export const TileList: BitrixVueComponentProps = {
	components: {
		TileItem,
		TileMoreItem,
	},
	emits: ['onUnmount'],
	/**
	 * The tiles learn from here that they are inside a managed list: only then do they take a group
	 * role and hand their actions over to the focus zone. TileItem is public, and other modules
	 * render it on their own markup, where neither would be right.
	 */
	provide(): Object
	{
		return {
			insideTileList: true,
			// the tiles move the focus through the zone, never by focusing a node directly:
			// the zone would otherwise resolve the entry point on its own and land elsewhere
			tileZone: {
				focusAction: (action: HTMLElement): void => this.focusAction(action),
				holdEntry: (action: ?HTMLElement): void => this.holdEntryAction(action),
			},
		};
	},
	props: {
		autoCollapse: {
			type: Boolean,
			default: false,
		},
		items: {
			type: Array,
			default: [],
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		removeFromServer: {
			type: Boolean,
			default: true,
		},
		forceDisableSelection: {
			type: Boolean,
			default: false,
		},
	},
	data: (): Object => ({
		pageSize: 5,
		firstHiddenItem: null,
		lastHiddenItem: null,
	}),
	created(): void
	{
		this.moreItemBlocked = false;

		// non-reactive on purpose: a FocusZone instance behind a Vue proxy breaks its private fields
		this.focusZone = null;
		this.entryAction = null;

		if (!this.autoCollapse)
		{
			return;
		}

		if (this.items.length > this.pageSize)
		{
			this.firstHiddenItem = this.items[this.pageSize];
			this.lastHiddenItem = this.items[this.items.length - 1];
		}
	},
	mounted(): void
	{
		// the list is a single Tab stop: the arrows walk every action of every file in one chain,
		// so the last action of a file is followed by the first action of the next one
		this.focusZone = new FocusZone(this.$refs.list, {
			bindKeys: FocusKeys.ArrowAll | FocusKeys.HomeAndEnd,
			focusOutBehavior: 'wrap',
			// an explicit function instead of a strategy name: the zone otherwise decides the entry
			// point from its own history, and a programmatic focus lands on the wrong action
			focusInStrategy: (): ?HTMLElement => this.takeEntryAction(),
			preventScroll: true,
		});
		this.focusZone.activate();
	},
	beforeUnmount(): void
	{
		this.focusZone?.deactivate();
		this.focusZone = null;
	},
	unmounted(): void
	{
		this.$emit('onUnmount');
	},
	computed: {
		visibleItems(): TileWidgetItem[]
		{
			if (this.firstHiddenItem === null)
			{
				return this.items;
			}

			const index = this.items.indexOf(this.firstHiddenItem);
			if (index === -1)
			{
				this.resetMoreItem();

				return this.items;
			}

			return this.items.slice(0, index);
		},

		realtimeItems(): TileWidgetItem[]
		{
			if (this.lastHiddenItem === null)
			{
				return [];
			}

			const index = this.items.indexOf(this.lastHiddenItem);
			if (index === -1)
			{
				this.resetMoreItem();

				return [];
			}

			return this.items.slice(index + 1);
		},

		hiddenFilesCount(): number
		{
			if (this.lastHiddenItem === null)
			{
				return 0;
			}

			const firstIndex = this.items.indexOf(this.firstHiddenItem);
			const lastIndex = this.items.indexOf(this.lastHiddenItem);

			if (firstIndex === -1 || lastIndex === -1)
			{
				this.resetMoreItem();

				return 0;
			}

			return lastIndex - firstIndex + 1;
		},
		groupBy(): string
		{
			return Text.getRandom(16);
		},
		listLabel(): string
		{
			return Loc.getMessage('TILE_UPLOADER_FILE_LIST_LABEL');
		},
	},
	methods: {
		getRenderedTiles(): HTMLElement[]
		{
			return [...(this.$refs.list?.querySelectorAll('.ui-tile-uploader-item') ?? [])];
		},

		getFirstAction(): ?HTMLElement
		{
			return this.$refs.list?.querySelector('button') ?? null;
		},

		/**
		 * Moves the focus to an action of this list. The zone resolves the entry point through
		 * `focusInStrategy`, so the target is announced to it first - otherwise a programmatic
		 * focus is redirected to whatever the zone remembers as its last active action.
		 */
		focusAction(action: HTMLElement): void
		{
			this.holdEntryAction(action);
			action.focus({ preventScroll: true });
		},

		/**
		 * Announces where the next entry into the zone has to land. A layer opened from inside the
		 * list - the menu of a tile - gives the focus back to its own initiator, and that arrives
		 * from outside the container, so the zone would otherwise resolve the entry point itself and
		 * throw the focus to the first action of the first file.
		 */
		holdEntryAction(action: ?HTMLElement): void
		{
			this.entryAction = action;
		},

		// the announced entry point is spent on the first entry: later ones start from the top again
		takeEntryAction(): ?HTMLElement
		{
			const action: ?HTMLElement = this.entryAction;
			this.entryAction = null;

			return action ?? this.getFirstAction();
		},

		focusRevealedTile(knownTiles: Set<HTMLElement>): void
		{
			const revealed: ?HTMLElement = this.getRenderedTiles().find((tile) => !knownTiles.has(tile));
			if (!revealed)
			{
				return;
			}

			// the tile is still running its enter animation from opacity: 0, so it counts as
			// invisible for FocusNavigator - take its first action directly
			const action: ?HTMLElement = revealed.querySelector('button');
			if (action)
			{
				this.focusAction(action);

				return;
			}

			// a tile without actions (readonly, no menu, no viewer) still has to hold the focus,
			// otherwise it drops to the body together with the "more" item
			FocusNavigator.focusContainer(revealed, { preventScroll: true });
		},
		getMore(): void
		{
			if (this.moreItemBlocked)
			{
				return;
			}

			const activeElement: ?HTMLElement = FocusNavigator.getActiveElement();
			const focusWasOnMoreItem = (
				activeElement !== null
				&& activeElement.closest('.ui-tile-uploader-item-more') !== null
			);
			const knownTiles: Set<HTMLElement> = new Set(this.getRenderedTiles());

			this.pageSize = Math.min(this.pageSize + 5, 30);

			const currentFirstIndex = this.items.indexOf(this.firstHiddenItem);
			const lastIndex = this.items.indexOf(this.lastHiddenItem);

			const newFirstIndex: number = currentFirstIndex + this.pageSize;
			const nextFirstIndex: number = newFirstIndex > lastIndex ? lastIndex + 1 : newFirstIndex;
			let itemsToShow: number = nextFirstIndex - currentFirstIndex;

			for (let i = currentFirstIndex, delay = 0; i < nextFirstIndex; i++, delay++)
			{
				this.moreItemBlocked = true;
				setTimeout((): void => {
					if (i === lastIndex)
					{
						this.resetMoreItem();
					}
					else
					{
						this.firstHiddenItem = this.items[i + 1];
					}

					itemsToShow--;
					if (itemsToShow === 0)
					{
						this.moreItemBlocked = false;
					}

					// the "more" item disappears, so the first revealed tile takes over the focus
					if (focusWasOnMoreItem && delay === 0)
					{
						this.$nextTick((): void => this.focusRevealedTile(knownTiles));
					}
				}, 100 * delay);
			}
		},
		resetMoreItem(): void
		{
			this.firstHiddenItem = null;
			this.lastHiddenItem = null;
		},
	},
	// language=Vue
	template: `
		<div
			class="ui-tile-uploader-items"
			data-testid="ui-tile-uploader-list"
			role="toolbar"
			:aria-label="listLabel"
			ref="list"
		>
			<transition-group name="ui-tile-uploader-item" type="animation">
				<TileItem
					v-for="item in visibleItems"
					:key="item.id" :item="item"
					:readonly="readonly"
					:viewerGroupBy="groupBy"
					:removeFromServer="removeFromServer"
					:forceDisableSelection="forceDisableSelection"
				/>
			</transition-group>
			<transition name="ui-tile-uploader-item" type="animation">
				<TileMoreItem
					v-if="hiddenFilesCount > 0"
					:hiddenFilesCount="hiddenFilesCount"
					@onClick="getMore"
				/>
			</transition>
			<transition-group name="ui-tile-uploader-item" type="animation">
				<TileItem
					v-for="item in realtimeItems"
					:key="item.id"
					:item="item"
					:readonly="readonly"
					:viewerGroupBy="groupBy"
					:removeFromServer="removeFromServer"
					:forceDisableSelection="forceDisableSelection"
				/>
			</transition-group>
		</div>
	`,
};

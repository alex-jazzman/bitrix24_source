import { Type, type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';
import { type BitrixVueComponentProps } from 'ui.vue3';
import { PopupManager } from 'main.popup';

import { EventType, PopupType, SpecialMentionDialogId, TextareaTarget } from 'im.v2.const';
import { ScrollWithGradient } from 'im.v2.component.elements.scroll-with-gradient';
import { Core } from 'im.v2.application.core';

import {
	MentionListEvents,
	type MentionMoveColumnEvent,
	type MentionMoveSelectionEvent,
} from '../../../classes/mention-detector';
import { MentionInsertManager } from './classes/insert-manager';
import { getNewScrollPosition, getScrollRoom } from '../helpers/helpers';
import { AllParticipantsItem } from './mention-item/components/all-participants-item';
import { CopilotItem } from './mention-item/components/copilot-item';
import { DefaultItem } from './mention-item/components/default-item';

import '../css/mention-item.css';

const GRADIENT_HEIGHT = 13;

// @vue/component
export const MentionItemsContainer = {
	name: 'MentionItemsContainer',
	components: { AllParticipantsItem, CopilotItem, DefaultItem, ScrollWithGradient },
	// Provided by the composer that owns the field: one set of ids per composer, see `createMentionGridIds`.
	inject: ['mentionGridIds'],
	provide(): JsonObject
	{
		return {
			mentionInsertTarget: this.target,
		};
	},
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		items: {
			type: Array,
			required: true,
		},
		participantsIds: {
			type: Set,
			default: () => new Set(),
		},
		query: {
			type: String,
			default: '',
		},
		target: {
			type: String,
			default: TextareaTarget.main,
		},
		resolveItemComponent: {
			type: Function,
			default: null,
		},
		onItemSelect: {
			type: Function,
			default: null,
		},
		selectEventType: {
			type: String,
			default: EventType.mention.selectItem,
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			// the keyboard position: only key events move it. A hovering pointer has its own :hover state
			// in css and writes nothing here, so it never speaks for the screen reader. It holds a person
			// and not a row number, because a silent refresh rebuilds the list under a position nobody
			// moved, and a kept number would point at somebody else.
			selectedItemId: null,
			// the active column inside the active row: 0 is the name cell, 1 the optional action cell
			activeColumn: 0,
			// Whether the user has started walking the list with the keys. The ring is the mark of that walk
			// and waits for the first movement key; the background of the active row does not, because
			// aria-activedescendant names that row from the start and what it names has to be visible. A
			// fresh list means a fresh walk: a reopened panel mounts this component anew, and a new query
			// resets the flag below.
			keyboardTraversalStarted: false,
		};
	},
	computed: {
		GRADIENT_HEIGHT: () => GRADIENT_HEIGHT,
		// a person gone from the result leaves no row to highlight, so the first one takes the highlight
		selectedIndex(): number
		{
			const index = this.items.findIndex((item) => item.id === this.selectedItemId);

			return index === -1 ? 0 : index;
		},
		preparedQuery(): string
		{
			return this.query.trim().toLowerCase();
		},
		copilotBotDialogId(): ?string
		{
			return this.$store.getters['users/bots/getCopilotBotDialogId'];
		},
		// Only the items this container renders itself draw `role="row"` / `role="gridcell"`. A consumer
		// that brings its own item component - the slash-command popup - gets a plain list, because a grid
		// around rowless items is a grid without rows.
		isGridContext(): boolean
		{
			return this.resolveItemComponent === null;
		},
		// selectedIndex + activeColumn are the single source of the keyboard position. The name column
		// exposes its gridcell; the action column exposes the native button so its role and state are announced.
		activeItemNodeId(): ?string
		{
			const activeItem = this.items[this.selectedIndex];
			if (!activeItem)
			{
				return null;
			}

			return this.activeColumn === 1
				? this.mentionGridIds.getActionButtonId(this.selectedIndex)
				: this.mentionGridIds.getCellId(this.selectedIndex, 0);
		},
	},
	watch: {
		async preparedQuery()
		{
			this.selectedItemId = null;
			this.activeColumn = 0;
			this.keyboardTraversalStarted = false;

			// the watcher runs before the narrowed list is rendered: wait for the new nodes
			await this.$nextTick();
			this.scrollToSelectedItem();
		},
		activeItemNodeId: {
			handler(nodeId: ?string)
			{
				this.publishActiveItem(nodeId);
			},
			immediate: true,
		},
		participantsIds: {
			handler()
			{
				this.resetParticipantActionColumn();
			},
			deep: true,
		},
		items()
		{
			this.resetMissingActionColumn();
		},
	},
	created()
	{
		this.getEmitter().subscribe(MentionListEvents.moveSelection, this.onMoveSelection);
		this.getEmitter().subscribe(MentionListEvents.moveColumn, this.onMoveColumn);
		this.getEmitter().subscribe(this.selectEventType, this.onInsertMentionText);
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(MentionListEvents.moveSelection, this.onMoveSelection);
		this.getEmitter().unsubscribe(MentionListEvents.moveColumn, this.onMoveColumn);
		this.getEmitter().unsubscribe(this.selectEventType, this.onInsertMentionText);

		// the list leaves the DOM: the field must not keep pointing at a removed item
		this.publishActiveItem(null);
	},
	methods: {
		isParticipant(id: string): boolean
		{
			const currentUserId = Core.getUserId().toString();
			if (currentUserId === id)
			{
				return true;
			}

			return this.participantsIds.has(id);
		},
		getComponentToShow(id: string): BitrixVueComponentProps
		{
			if (this.resolveItemComponent)
			{
				return this.resolveItemComponent(id);
			}

			const components = {
				[SpecialMentionDialogId.allParticipants]: AllParticipantsItem,
				[this.copilotBotDialogId]: CopilotItem,
				default: DefaultItem,
			};

			return components[id] ?? components.default;
		},
		onScroll()
		{
			PopupManager.getPopupById(PopupType.mentionAddToChatDropdown)?.close();
		},
		onMoveSelection(event: BaseEvent<MentionMoveSelectionEvent>)
		{
			if (this.items.length === 0)
			{
				return;
			}

			const { offset } = event.getData();
			const itemsCount = this.items.length;

			this.keyboardTraversalStarted = true;
			const nextIndex = (this.selectedIndex + offset + itemsCount) % itemsCount;
			this.selectedItemId = this.items[nextIndex].id;
			// a vertical move always returns to the name cell of the new row
			this.activeColumn = 0;

			this.scrollToSelectedItem();
		},
		onMoveColumn(event: BaseEvent<MentionMoveColumnEvent>)
		{
			const { offset } = event.getData();
			// The manager sends this event only when the key really moves the position between the cells of
			// the active row, so it counts as a walk on either side.
			this.keyboardTraversalStarted = true;
			if (offset < 0)
			{
				this.activeColumn = 0;

				return;
			}

			// only step onto the action cell when the active row actually renders one
			if (this.activeRowHasActionCell())
			{
				this.activeColumn = 1;
			}
		},
		resetParticipantActionColumn()
		{
			if (this.activeColumn !== 1)
			{
				return;
			}

			const activeItem = this.items[this.selectedIndex];
			if (activeItem && this.isParticipant(activeItem.id))
			{
				this.activeColumn = 0;
			}
		},
		// A silent refresh replaces the list without changing the query, and the row the position lands on may
		// render no action cell. Column 1 would then name a cell that is not in the DOM - the field pointing at
		// nothing - and no row would be marked either, because a row draws its highlight from column 0 alone.
		async resetMissingActionColumn()
		{
			if (this.activeColumn !== 1)
			{
				return;
			}

			// the watcher runs before the changed list is rendered: wait for the new cells
			await this.$nextTick();
			if (!this.activeRowHasActionCell())
			{
				this.activeColumn = 0;
			}
		},
		activeRowHasActionCell(): boolean
		{
			const actionCellId = this.mentionGridIds.getCellId(this.selectedIndex, 1);

			return Boolean(this.$refs['popup-items']?.querySelector(`[id="${actionCellId}"]`));
		},
		scrollToSelectedItem()
		{
			const itemsContainer = this.$refs['popup-items'];
			// The grid names its cells, so the active one is found by that id. A plain list has no ids of its
			// own: there one item is one child of the container, in the order of `items`.
			const activeItemSelector = this.isGridContext
				? `[id="${this.activeItemNodeId}"]`
				: `:scope > :nth-child(${this.selectedIndex + 1})`;
			const activeItem = itemsContainer?.querySelector(activeItemSelector);
			if (!activeItem)
			{
				return;
			}

			// The ring of the keyboard position goes around the whole row, so the row is what the scrolling
			// has to bring into view, ring included: in the grid the id above names a cell of that row, and
			// the row insets its cells by its own padding. A list whose items are rows already - the
			// slash-command popup - has nothing to climb to.
			const activeRow = activeItem.closest('.bx-im-mention-item__container') ?? activeItem;
			const scrollContainer = this.$refs['scroll-gradient'].getContainer();
			const room = getScrollRoom(activeRow, itemsContainer);

			scrollContainer.scrollTop = getNewScrollPosition(activeRow, scrollContainer, room);
		},
		publishActiveItem(nodeId: ?string)
		{
			this.getEmitter().emit(MentionListEvents.activeItemChanged, { nodeId });
		},
		onInsertMentionText()
		{
			if (!Type.isArrayFilled(this.items))
			{
				return;
			}

			this.insertMentionText(this.items[this.selectedIndex].id);
		},
		// A click carries the item it landed on, so the pointer inserts what it points at without
		// moving the keyboard position first.
		onItemClick(id: string)
		{
			this.insertMentionText(id);
			this.$emit('close');
		},
		insertMentionText(id: string)
		{
			if (this.onItemSelect)
			{
				const selectedItem = this.items.find((item) => item.id === id);
				if (selectedItem)
				{
					this.onItemSelect(selectedItem);
				}

				return;
			}

			const insertManager = new MentionInsertManager({ emitter: this.getEmitter() });
			insertManager.insert({
				id,
				dialogId: this.dialogId,
				query: this.query,
				target: this.target,
				isParticipant: this.isParticipant(id),
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ScrollWithGradient
			v-if="items.length > 0"
			ref="scroll-gradient"
			:gradientSize="GRADIENT_HEIGHT"
			@scroll="onScroll"
		>
			<div
				v-if="isGridContext"
				class="bx-im-mention-popup-content__items"
				:class="{'--keyboard-traversal': keyboardTraversalStarted}"
				ref="popup-items"
				:id="mentionGridIds.gridId"
				role="grid"
				:aria-label="loc('IM_TEXTAREA_MENTION_GRID_ARIA')"
				data-testid="im-textarea-mention-grid"
			>
				<component
					v-for="(item, index) in items"
					:is="getComponentToShow(item.id)"
					:isParticipant="isParticipant(item.id)"
					:item="item"
					:query="query"
					:dialogId="dialogId"
					:index="index"
					:selected="index === selectedIndex"
					:activeColumn="activeColumn"
					data-testid="im-mention-item"
					@click="onItemClick(item.id)"
					@close="$emit('close')"
				/>
			</div>
			<div
				v-else
				class="bx-im-mention-popup-content__items"
				:class="{'--keyboard-traversal': keyboardTraversalStarted}"
				ref="popup-items"
			>
				<component
					v-for="(item, index) in items"
					:is="getComponentToShow(item.id)"
					:isParticipant="isParticipant(item.id)"
					:item="item"
					:query="query"
					:dialogId="dialogId"
					:selected="index === selectedIndex"
					@click="onItemClick(item.id)"
					@close="$emit('close')"
				/>
			</div>
		</ScrollWithGradient>
	`,
};

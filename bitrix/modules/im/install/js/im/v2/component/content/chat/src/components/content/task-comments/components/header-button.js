import { type JsonObject } from 'main.core';

import { FocusNavigator } from 'ui.a11y';

import { PromoId } from 'im.v2.const';
import { PromoManager } from 'im.v2.lib.promo';
import { EntityControl, HeaderControlKey } from 'im.v2.component.content.elements';
import {
	CHAT_DETAIL_FOCUS_CONTEXT,
	type ChatDetailFocusContext,
	type HeaderControlSnapshotEntry,
} from 'im.v2.lib.a11y';

import { TaskCardPromo, TASK_CARD_PROMO_DESCRIPTION_ID } from './promo';

const TAB_KEY = 'Tab';

// @vue/component
export const TaskHeaderButton = {
	name: 'TaskHeaderButton',
	components: { EntityControl, TaskCardPromo },
	inject: {
		chatDetailFocusContext: {
			from: CHAT_DETAIL_FOCUS_CONTEXT,
			default: null,
		},
	},
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		text: {
			type: String,
			default: '',
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
		// The card is a surface of its own, so the button reports whether it is open right now.
		expanded: {
			type: Boolean,
			default: null,
		},
		withEmbeddedTaskCard: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	data(): JsonObject
	{
		return {
			showPromo: false,
		};
	},
	computed: {
		// The promo tells what the task button leads to, so the button is described by that text while
		// the promo shows - and says nothing about a text that is no longer on screen.
		promoDescriptionId(): string | null
		{
			return this.showPromo ? TASK_CARD_PROMO_DESCRIPTION_ID : null;
		},
	},
	watch: {
		// The promo of the previous chat is no promo of this one: it goes without counting as watched.
		dialogId()
		{
			this.showPromo = false;
		},
	},
	mounted()
	{
		if (!this.withEmbeddedTaskCard)
		{
			return;
		}

		this.initPromo();
	},
	methods: {
		initPromo()
		{
			this.showPromo = true;
			this.showPromo = PromoManager.getInstance().needToShow(PromoId.taskSideCard);
		},
		onClosePromo(): void
		{
			this.showPromo = false;
			void PromoManager.getInstance().markAsWatched(PromoId.taskSideCard);
		},
		/**
		 * While the promo shows, its close button is the stop right behind this one - and `main.popup`
		 * draws that button at the end of the document, so the ordinary walk would reach it only past the
		 * rest of the header. The step is taken here rather than inside the promo because the button is
		 * ours: a listener of the template goes and comes back with the element Vue renders.
		 */
		onTaskButtonKeydown(event: KeyboardEvent): void
		{
			if (event.key !== TAB_KEY || event.shiftKey || !this.showPromo)
			{
				return;
			}

			const closeButton = this.getPromoCloseStop();
			if (closeButton === null)
			{
				return;
			}

			event.preventDefault();
			FocusNavigator.focusTarget(closeButton, { preventScroll: true });
		},
		// A promo without a close button of its own registers no stop, and one that cannot take the focus
		// is no stop either: the header itself answers both questions in its snapshot of the walk.
		getPromoCloseStop(): HTMLElement | null
		{
			const context = this.getFocusContext();
			const isStopOfTheWalk = context?.getHeaderSnapshot().some((entry: HeaderControlSnapshotEntry) => {
				return entry.key === HeaderControlKey.promoClose && entry.enabled;
			});

			return isStopOfTheWalk === true
				? context.getHeaderControlElement(HeaderControlKey.promoClose)
				: null;
		},
		getFocusContext(): ChatDetailFocusContext | null
		{
			return this.chatDetailFocusContext;
		},
	},
	template: `
		<div class="bx-im-task-comments-header-button__container">
			<div ref="entity-button">
				<EntityControl
					:text="text"
					:compactMode="compactMode"
					:expanded="expanded"
					:aria-describedby="promoDescriptionId"
					data-testid="im-task-comments-header-card-btn"
					@click="$emit('click')"
					@keydown="onTaskButtonKeydown"
				/>
			</div>
			<TaskCardPromo
				v-if="showPromo"
				:bindElement="$refs['entity-button']"
				@close="onClosePromo"
			/>
		</div>
	`,
};

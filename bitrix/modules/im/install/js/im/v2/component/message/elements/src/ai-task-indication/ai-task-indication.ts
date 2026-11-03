import { Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';
// `LiveAnnouncer` is the announcement channel; the import also brings in the <visually-hidden>
// custom element of the same extension, which the template below writes the source mark into.
import { LiveAnnouncer } from 'ui.a11y';
import { defineComponent, type PropType } from 'ui.vue3';

import { EventType } from 'im.v2.const';
import { type AiTaskOperation, type ImModelMessage } from 'im.v2.model';

import {
	AiTaskIndicationLayout,
	findAiTaskFrame,
	getAiTaskOperation,
	isAiTaskCaptionPlace,
	isAiTaskStatusInTimeRow,
	type AiTaskFrame,
	type AiTaskIndicationLayoutValue,
} from './ai-task-frames';
import { AiTaskStatusRow } from './ai-task-status-row';

import './ai-task-indication.css';

/**
 * The operation is announced twice and no more: once on entry and once on its outcome. The stages
 * in between say nothing a listener can act on, and a polite update per stage would leave the
 * outcome at the end of a run of announcements assistive technology tends to collapse.
 */
const ENTRY_ANNOUNCEMENT_KEY = 'IM_MESSAGE_AI_TASK_PREPARING';

/**
 * How many messages the operation runs on is carried by the entry announcement, and by nothing
 * else. Visually the set is the rim standing on its sources, and the rim is decorative; the
 * caption cannot say it either, because every stage shares one cell so that the width of the row
 * never jumps. The announcer is the one channel that adds a fact without touching the layout.
 */
const ENTRY_ANNOUNCEMENT_MULTIPLE_KEY = 'IM_MESSAGE_AI_TASK_PREPARING_MULTIPLE';

/**
 * Says of the message what the rim says of it visually: this one is a source of the running
 * operation. It stands wherever the rim does - the caption message has the status row as well,
 * but the row speaks about the operation, not about the message it stands on.
 */
const SOURCE_MARK_KEY = 'IM_MESSAGE_AI_TASK_SOURCE';

// @vue/component
export const AiTaskIndication = defineComponent({
	name: 'AiTaskIndication',
	components: { AiTaskStatusRow } as { AiTaskStatusRow: typeof AiTaskStatusRow },
	// <visually-hidden> comes from ui.a11y as a custom element, so it is not looked up among components
	compilerOptions: {
		isCustomElement: (tag: string): boolean => tag === 'visually-hidden',
	},
	props: {
		message: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
		layout: {
			type: String as PropType<AiTaskIndicationLayoutValue>,
			default: AiTaskIndicationLayout.bubble,
		},
	},
	data(): { isOffscreen: boolean }
	{
		return {
			// Starts lit, and the observer only ever takes the spin away: it speaks on a change of
			// visibility alone, so a source already on the screen when the operation starts hears
			// nothing at all - starting paused would leave the rim dead in front of the very user
			// who is watching it.
			isOffscreen: false,
		};
	},
	computed: {
		operation(): AiTaskOperation | null
		{
			return getAiTaskOperation(this.$store, this.message);
		},
		frame(): AiTaskFrame | null
		{
			return findAiTaskFrame(this.operation);
		},
		/**
		 * The name alone, so the watcher below hears a change of the frame and not every re-read of
		 * the operation the store hands out.
		 */
		frameName(): string | null
		{
			return this.frame?.name ?? null;
		},
		/**
		 * Every indicated source carries the rim, but the caption message alone reports its visibility
		 * and speaks for the operation. One expression of the rule, so the two cannot drift apart.
		 */
		isCaptionPlace(): boolean
		{
			return isAiTaskCaptionPlace(this.operation, this.message);
		},
		/**
		 * The caption of a bubble is mounted by the content of the message, inside the row that
		 * already carries the time and the delivery ticks; the other two layouts have no such row,
		 * so their plate is a child of this fragment and stands under the graphics.
		 */
		withStatusPlate(): boolean
		{
			return !isAiTaskStatusInTimeRow(this.layout);
		},
		/** How many messages the operation was started on, those drawn without the rim included. */
		sourceCount(): number
		{
			return this.operation?.messageIds.length ?? 0;
		},
		/**
		 * A set of sources is named by its size, a single message is not: an operation on one message
		 * is the usual case, and reading a count out to it would be arithmetic instead of a fact.
		 */
		entryAnnouncement(): string
		{
			if (this.sourceCount < 2)
			{
				return this.loc(ENTRY_ANNOUNCEMENT_KEY);
			}

			// `Loc` of `main.core`, not the one on `$Bitrix`: the plural form of the count is picked by
			// the language, and only the former knows how to do that.
			return Loc.getMessagePlural(ENTRY_ANNOUNCEMENT_MULTIPLE_KEY, this.sourceCount, {
				'#COUNT#': String(this.sourceCount),
			}) ?? '';
		},
		sourceMark(): string
		{
			return this.loc(SOURCE_MARK_KEY);
		},
		decorClasses(): string[]
		{
			const classes: string[] = [`--${this.layout}`];
			if (this.frame?.extinguishesDecor)
			{
				classes.push('--extinguished');
			}

			// The message list is not virtualized, so the layer of a source scrolled out of sight
			// stays in the DOM and would keep spinning for the whole operation. It keeps its paint
			// and loses only the movement, bringing the count of spinning rims down to what the
			// screen actually holds.
			if (this.isOffscreen)
			{
				classes.push('--offscreen');
			}

			// The round layer squares itself off the plate below it, so it has to know whether that
			// plate is there at all: it stands on the caption message only, and only in the layouts
			// that keep the caption inside the body.
			if (this.isCaptionPlace && this.withStatusPlate)
			{
				classes.push('--with-status');
			}

			return classes;
		},
	},
	watch: {
		frameName: {
			// The first frame is already there when the component is created: the operation starts and
			// the gate of `BaseMessage` mounts the indication in the same tick.
			immediate: true,
			handler(name: string | null, previousName?: string | null): void
			{
				this.announceFrame(previousName ?? null);
			},
		},
	},
	mounted(): void
	{
		// Subscribed from every indicated source, not only from the caption message: the caption
		// message of the tracked operation can change under a mounted component, and the write itself
		// is gated by `reportAnchorVisibility`, so a foreign instance still reports nothing.
		this.$Bitrix.eventEmitter.subscribe(EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
		this.$Bitrix.eventEmitter.subscribe(EventType.dialog.onMessageIsNotVisible, this.onMessageIsNotVisible);
	},
	beforeUnmount(): void
	{
		this.$Bitrix.eventEmitter.unsubscribe(EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
		this.$Bitrix.eventEmitter.unsubscribe(EventType.dialog.onMessageIsNotVisible, this.onMessageIsNotVisible);
		// The caption message leaves the screen together with its component: the message list drops
		// the message far from the viewport, and a stale `true` would send a failure to a frame that
		// nobody can see.
		this.reportAnchorVisibility(false);
	},
	methods: {
		onMessageIsVisible(event: BaseEvent<{ messageId: number }>): void
		{
			this.handleVisibilityEvent(event, true);
		},
		onMessageIsNotVisible(event: BaseEvent<{ messageId: number }>): void
		{
			this.handleVisibilityEvent(event, false);
		},
		handleVisibilityEvent(event: BaseEvent<{ messageId: number }>, visible: boolean): void
		{
			const messageId: number | undefined = event.getData()?.messageId;
			if (messageId !== this.message.id)
			{
				return;
			}

			// Written on every indicated source, unlike the report below: the spin belongs to the
			// rim, and the rim stands on all of them.
			this.isOffscreen = !visible;
			this.reportAnchorVisibility(visible);
		},
		/**
		 * The single writer of `anchorVisible`: the pull handler only reads the field, and it reads
		 * it as the visibility of the caption, so an instance mounted on any other source stays silent.
		 */
		reportAnchorVisibility(visible: boolean): void
		{
			if (!this.isCaptionPlace)
			{
				return;
			}

			// The observer speaks on every scroll pass, so the repeat is cut off before the dispatch
			// as well: the action drops the no-op write of its own, but a dispatch is not free.
			if (this.operation?.anchorVisible === visible)
			{
				return;
			}

			void this.$store.dispatch('aiTask/setAnchorVisibility', {
				chatId: this.message.chatId,
				// `isCaptionPlace` holds, so this id is the caption message of the operation.
				messageId: this.message.id,
				visible,
			});
		},
		/**
		 * The only announcement channel of the indication. The visual row carries no live semantics of
		 * its own: it enters the DOM together with its content, and a region born that way loses its
		 * first announcement. `LiveAnnouncer` keeps one region mounted ahead of any operation, holds a
		 * single shared instance for the whole page and pushes an assertive message past the queue -
		 * so the failure does not wait behind the progress of the run.
		 */
		announceFrame(previousName: string | null): void
		{
			const frame: AiTaskFrame | null = this.frame;
			// One voice per operation, not one per source: every indicated source carries the rim, the
			// caption message alone speaks for it.
			if (!frame || !this.isCaptionPlace)
			{
				return;
			}

			if (frame.isTerminal)
			{
				LiveAnnouncer.announce(this.loc(frame.labelKey), frame.politeness);

				return;
			}

			// A step inside the running sequence: the entry has been announced by the frame it replaced.
			if (previousName)
			{
				return;
			}

			LiveAnnouncer.announce(this.entryAnnouncement, frame.politeness);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<template v-if="frame">
			<div
				class="bx-im-message-ai-task__decor"
				:class="decorClasses"
				aria-hidden="true"
				data-testid="im-message-ai-task-indication"
			>
				<div class="bx-im-message-ai-task__wash">
					<div class="bx-im-message-ai-task__wash-core"></div>
				</div>
				<div class="bx-im-message-ai-task__ring">
					<div class="bx-im-message-ai-task__ring-blur">
						<div class="bx-im-message-ai-task__ring-band"></div>
					</div>
				</div>
			</div>
			<visually-hidden>{{ sourceMark }}</visually-hidden>
			<AiTaskStatusRow v-if="withStatusPlate" :message="message" :layout="layout" />
		</template>
	`,
});

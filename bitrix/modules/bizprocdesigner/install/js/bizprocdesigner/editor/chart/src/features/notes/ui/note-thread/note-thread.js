/**
 * The thread of a note: the conversation of the open note beside its marker, the messages of
 * it from the oldest down, and the field the next one is written in.
 *
 * Only one thread is open at a time (AC-012), and the store is what holds that: `openedNoteId` is the
 * whole of it, so nothing of that rule is kept here a second time. Closing the thread changes neither
 * the note nor a word of what is written in it - it is the reading of a conversation that ends, and
 * the store is not asked to change anything by it.
 *
 * The conversation is read by an action of its own (API-07) and never comes with the list of the
 * markers, so a thread that has been opened is a thread that has been read anew: another editor may
 * have written into it since the schema was opened.
 *
 * The names of the authors are resolved here, once for the whole conversation: DTO-02 carries the
 * identifier of the author alone, and a message asking for a name of its own would ask once per
 * message. A name that could not be read leaves the message readable all the same.
 */

import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { TextSm } from 'ui.system.typography.vue';
import { Type } from 'main.core';
import { computed, defineComponent, getCurrentInstance, nextTick, toValue, type Ref } from 'ui.vue3';
import { useBlockDiagram } from 'ui.block-diagram';

import {
	createConnectionIndex,
	resolveMarkerPosition,
	useNotesStore,
	type NoteConnectionIndex,
	type NoteSchemaConnection,
	type NoteSchemaRect,
	type TemplateNote,
	type TemplateNoteMessage,
} from '../../../../entities/notes';
import { editorAPI } from '../../../../shared/api';
import { useLoc } from '../../../../shared/composables';
import { Loader } from '../../../../shared/ui';
import { NoteCompleteAction } from '../note-complete-action/note-complete-action';
import { NoteMessage } from '../note-message/note-message';
import { NoteMessageInput } from '../note-message-input/note-message-input';
import { NoteThreadPopup, isAnchorVisible, type ThreadBox, type ThreadPoint } from './note-thread-popup';

import './note-thread.css';

const THREAD_TEST_ID = 'bizprocdesigner-note-thread';
const MESSAGES_TEST_ID = 'bizprocdesigner-note-thread-messages';
const EARLIER_TEST_ID = 'bizprocdesigner-note-thread-earlier';
const CLOSE_TEST_ID = 'bizprocdesigner-note-thread-close';
const LOADING_TEST_ID = 'bizprocdesigner-note-thread-loading';

const ARIA_LABEL_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_THREAD_ARIA_LABEL';
const TITLE_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_THREAD_TITLE';
const CLOSE_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_THREAD_CLOSE';
const MESSAGES_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_THREAD_MESSAGES_ARIA_LABEL';
const EARLIER_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_THREAD_SHOW_EARLIER';
const LOADING_MESSAGE_ID = 'BIZPROCDESIGNER_EDITOR_NOTE_THREAD_LOADING';

/**
 * How much of a conversation is drawn at once, and how much more every ask for the earlier messages
 * adds. A note may hold up to `messagesPerNote` messages - 500 of them - and every one drawn is an
 * instance of the text editor of its own, because the markup of a message is parsed into the nodes of
 * a document instead of being put into the page as a string (DTO-03). The last messages are the ones
 * a thread is opened for; the earlier ones are drawn when they are asked for. Nothing is re-read from
 * the server by that: API-07 answers with the whole conversation, and the window is over what is
 * already in the store.
 */
const MESSAGE_PAGE = 20;

/** The part of the state of the canvas the thread reads: the geometry it pins by and the camera. */
type CanvasState = {
	blocksRectMap: Ref<{ [blockId: string]: NoteSchemaRect }>,
	portsRectMap: Ref<{ [blockId: string]: { [portId: string]: NoteSchemaRect } }>,
	connections: Ref<NoteSchemaConnection[]>,
	transform: Ref<{ x: number, y: number, zoom: number }>,
	canvasWidth: Ref<number>,
	canvasHeight: Ref<number>,
};

/**
 * The state of the canvas, and only once the canvas itself has built it: whoever asks for it first is
 * who creates it, so asking ahead of the canvas would leave it with a state built without its own
 * options. The thread reads a state that exists and is pinned to nothing until it does.
 */
function useCanvasState(): CanvasState | null
{
	const app = getCurrentInstance()?.appContext?.app;

	if (!app?.config?.globalProperties?.$blockDiagram)
	{
		return null;
	}

	return useBlockDiagram();
}

export const NoteThread = defineComponent({
	name: 'BizprocdesignerNoteThread',
	components: { Loader, NoteCompleteAction, NoteMessage, NoteMessageInput, NoteThreadPopup, TextSm, UiButton },
	props: {
		// the hint of the mentions answers with the editors of this template and with nobody else
		templateId: {
			type: Number,
			required: true,
		},
		// the write lock of the editor: a template that may not be changed is discussed no further
		readonly: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		const { getMessage } = useLoc();
		const notesStore = useNotesStore();
		const canvas = useCanvasState();

		/**
		 * The index of the connections is owed to the set of the connections alone: the thread travels
		 * with its marker through every move of the camera and rebuilds nothing by it.
		 */
		const connectionIndex = computed((): NoteConnectionIndex => (
			canvas === null ? createConnectionIndex([]) : createConnectionIndex(toValue(canvas.connections))
		));

		/**
		 * The point of the screen the marker of the open note stands at, counted by the same camera the
		 * canvas draws itself with. It is a computed value and not a listener of its own: the canvas
		 * publishes its camera and its geometry as state, so a thread reading them travels with its
		 * marker through every move and every zoom at no cost of its own (AC-014a).
		 */
		const anchor = computed((): ThreadPoint | null => {
			const note: TemplateNote | null = notesStore.openedNote;

			if (note === null || canvas === null)
			{
				return null;
			}

			const camera = toValue(canvas.transform);
			const zoom = Number(camera?.zoom);

			// the canvas has not measured itself yet, so there is no screen to pin the thread to
			if (!Number.isFinite(zoom) || zoom <= 0)
			{
				return null;
			}

			const point = resolveMarkerPosition(note, {
				nodeRects: toValue(canvas.blocksRectMap),
				portRects: toValue(canvas.portsRectMap),
				connections: toValue(canvas.connections),
				connectionIndex: connectionIndex.value,
			});

			return {
				x: Math.round((point.x - camera.x) * zoom),
				y: Math.round((point.y - camera.y) * zoom),
			};
		});

		const viewport = computed((): ThreadBox => {
			if (canvas === null)
			{
				return { width: 0, height: 0 };
			}

			return { width: toValue(canvas.canvasWidth), height: toValue(canvas.canvasHeight) };
		});

		return {
			getMessage,
			notesStore,
			anchor,
			viewport,
			buttonSize: ButtonSize.SMALL,
			plainButtonStyle: AirButtonStyle.PLAIN_NO_ACCENT,
		};
	},
	data(): Object
	{
		return {
			// the names of the authors met so far: they belong to the portal and not to one note
			userNames: {},
			visibleCount: MESSAGE_PAGE,
		};
	},
	computed: {
		/**
		 * The conversation is read and nothing is written into it: either the editor itself is under
		 * the write lock - a version on the canvas, a restore in flight - or the right to the template
		 * has been taken away from this tab and the refusal of the list of the notes confirmed it
		 * (ERR-005). What is on the screen stays on it; only the actions go.
		 *
		 * The actions being out of reach is no protection of its own: the server checks the right of
		 * every operation of its own accord (AC-039).
		 */
		isReadonly(): boolean
		{
			return this.readonly || this.notesStore.isAccessLost;
		},
		note(): TemplateNote | null
		{
			return this.notesStore.openedNote;
		},
		openedNoteId(): number | null
		{
			return this.notesStore.openedNoteId;
		},
		messages(): TemplateNoteMessage[]
		{
			return this.notesStore.openedMessages;
		},
		isLoading(): boolean
		{
			return this.note !== null && this.notesStore.loadingThreadId === this.note.id;
		},
		isMeasuredCanvas(): boolean
		{
			return this.viewport.width > 0 && this.viewport.height > 0;
		},
		isAnchored(): boolean
		{
			return this.note !== null
				&& this.anchor !== null
				&& this.isMeasuredCanvas
				&& isAnchorVisible(this.anchor, this.viewport)
			;
		},
		/**
		 * The marker of the open note has been taken out of the drawn area by the camera. The thread
		 * is closed by it and not merely hidden: a popup without the marker it belongs to would stand
		 * over the schema explaining nothing (AC-014a).
		 */
		isAnchorLost(): boolean
		{
			return this.note !== null
				&& this.anchor !== null
				&& this.isMeasuredCanvas
				&& !isAnchorVisible(this.anchor, this.viewport)
			;
		},
		visibleMessages(): TemplateNoteMessage[]
		{
			return this.messages.slice(Math.max(0, this.messages.length - this.visibleCount));
		},
		hasEarlierMessages(): boolean
		{
			return this.messages.length > this.visibleMessages.length;
		},
		threadLabel(): string
		{
			return this.getMessage(ARIA_LABEL_MESSAGE_ID);
		},
		titleText(): string
		{
			return this.getMessage(TITLE_MESSAGE_ID);
		},
		closeText(): string
		{
			return this.getMessage(CLOSE_MESSAGE_ID);
		},
		messagesLabel(): string
		{
			return this.getMessage(MESSAGES_MESSAGE_ID);
		},
		earlierText(): string
		{
			return this.getMessage(EARLIER_MESSAGE_ID);
		},
		loadingText(): string
		{
			return this.getMessage(LOADING_MESSAGE_ID);
		},
		threadTestId(): string
		{
			return this.$testId(THREAD_TEST_ID);
		},
		messagesTestId(): string
		{
			return this.$testId(MESSAGES_TEST_ID);
		},
		// The dataset key is lower-case on purpose: `testid` renders as data-testid, the attribute
		// page.getByTestId() looks for, while a camel-cased `testId` would render data-test-id.
		earlierButtonDataset(): { testid: string }
		{
			return { testid: this.$testId(EARLIER_TEST_ID) };
		},
		closeTestId(): string
		{
			return this.$testId(CLOSE_TEST_ID);
		},
		loadingTestId(): string
		{
			return this.$testId(LOADING_TEST_ID);
		},
	},
	watch: {
		// Another note is another conversation: it is read from its last messages, as an opened one is.
		openedNoteId(): void
		{
			this.visibleCount = MESSAGE_PAGE;
			void this.scrollToLatest();
		},
		isAnchorLost(isLost: boolean): void
		{
			if (isLost)
			{
				this.deferClose();
			}
		},
		// A conversation that changed may have brought in somebody who has not written here before.
		messages(): void
		{
			void this.loadAuthorNames();
		},
	},
	created(): void
	{
		// Off data() on purpose: nothing renders it, and only the newest answer is allowed to write
		// the names it brought.
		this.lastNamesRequestId = 0;
		// Off data() for the same reason: it is a handle of a timer and not a part of the picture.
		this.closeTimeout = null;
	},
	mounted(): void
	{
		void this.loadAuthorNames();
	},
	beforeUnmount(): void
	{
		this.cancelDeferredClose();
	},
	methods: {
		/**
		 * The closing of the thread is taken off the frame the camera moved in. Every drawn message
		 * holds an instance of the text editor of its own (DTO-03), and tearing twenty of them down
		 * inside that frame is felt as a stutter of the drag itself. The marker is looked at again when
		 * the turn comes: a camera that brought it back leaves the thread open.
		 */
		deferClose(): void
		{
			if (this.closeTimeout !== null)
			{
				return;
			}

			this.closeTimeout = setTimeout(() => {
				this.closeTimeout = null;

				if (this.isAnchorLost)
				{
					this.notesStore.closeThread();
				}
			});
		},
		cancelDeferredClose(): void
		{
			if (this.closeTimeout !== null)
			{
				clearTimeout(this.closeTimeout);
				this.closeTimeout = null;
			}
		},
		authorNameOf(message: TemplateNoteMessage): string
		{
			return this.userNames[String(message.authorId)] ?? '';
		},
		/**
		 * The names of everyone who wrote in the open conversation, in one request for all of them. A
		 * name already known is never asked for again, and a request that was overtaken by a later one
		 * writes nothing: the thread it was made for is no longer the one on the screen.
		 */
		async loadAuthorNames(): Promise<void>
		{
			const userIds = [...new Set(
				this.messages
					.map((message: TemplateNoteMessage) => message.authorId)
					.filter((userId: number) => (
						Type.isNumber(userId) && userId > 0 && !(String(userId) in this.userNames)
					)),
			)];

			if (userIds.length === 0)
			{
				return;
			}

			const requestId = ++this.lastNamesRequestId;
			try
			{
				const names = await editorAPI.fetchUserNames(userIds);
				if (this.lastNamesRequestId === requestId)
				{
					this.userNames = { ...this.userNames, ...names };
				}
			}
			catch
			{
				// A message whose author could not be named is still a message that can be read.
			}
		},
		showEarlierMessages(): void
		{
			this.visibleCount += MESSAGE_PAGE;
		},
		/**
		 * The newest message is the one a thread is opened at and the one a reply lands at. Whoever
		 * scrolled the conversation up meanwhile is left alone: only opening a thread and writing into
		 * it bring the reading back down.
		 */
		async scrollToLatest(): Promise<void>
		{
			await nextTick();

			const list = this.$refs.list ?? null;
			if (list !== null)
			{
				list.scrollTop = list.scrollHeight;
			}
		},
		handleSent(): void
		{
			void this.scrollToLatest();
		},
		handleClose(): void
		{
			this.notesStore.closeThread();
		},
	},
	template: `
		<NoteThreadPopup
			v-if="isAnchored"
			:key="note.id"
			:anchorX="anchor.x"
			:anchorY="anchor.y"
			:viewportWidth="viewport.width"
			:viewportHeight="viewport.height"
			:ariaLabel="threadLabel"
			:closeLabel="closeText"
			:testId="threadTestId"
			:closeTestId="closeTestId"
			@close="handleClose"
		>
			<template #head>
				<TextSm className="editor-chart-note-thread__title">{{ titleText }}</TextSm>
				<!-- The completion draws nothing without the right to it, so the gap of the row is what
					sets it apart and no wrapper of its own is left behind when it is not offered. -->
				<NoteCompleteAction v-if="!isReadonly" :note="note"/>
			</template>
			<div
				v-if="isLoading && messages.length === 0"
				class="editor-chart-note-thread__loading"
				role="status"
				:aria-label="loadingText"
				:data-testid="loadingTestId"
			>
				<Loader/>
			</div>
			<div
				v-else
				class="editor-chart-note-thread__messages"
				ref="list"
				role="group"
				:aria-label="messagesLabel"
				:data-testid="messagesTestId"
			>
				<div v-if="hasEarlierMessages" class="editor-chart-note-thread__earlier">
					<UiButton
						:text="earlierText"
						:size="buttonSize"
						:style="plainButtonStyle"
						:dataset="earlierButtonDataset"
						@click="showEarlierMessages"
					/>
				</div>
				<!-- The deletion of the last message takes the note away in the store, and the thread
					closes with it: nothing of that is counted here. -->
				<NoteMessage
					v-for="message in visibleMessages"
					:key="message.id"
					:message="message"
					:templateId="templateId"
					:authorName="authorNameOf(message)"
					:readonly="isReadonly"
				/>
			</div>
			<!-- The field stays where it is under the write lock and turns inert instead of leaving:
				a field that comes and goes takes the reply typed into it along (AC-037d). -->
			<NoteMessageInput
				:noteId="note.id"
				:templateId="templateId"
				:readonly="isReadonly"
				@sent="handleSent"
			/>
		</NoteThreadPopup>
	`,
});

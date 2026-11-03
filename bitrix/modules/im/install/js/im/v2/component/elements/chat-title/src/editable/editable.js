import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { ActionByRole, EventType } from 'im.v2.const';
// The shared --focus-visible rule of the messenger draws the ring of the title button.
import 'im.v2.css.classes';
import { EscEventAction } from 'im.v2.lib.esc-manager';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelChat } from 'im.v2.model';

import { ChatTitle } from '../base/chat-title.js';

import './css/editable-chat-title.css';

const INPUT_PADDING = 5;

// @vue/component
export const EditableChatTitle = {
	name: 'EditableChatTitle',
	components: { ChatTitle },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['newTitleSubmit'],
	data(): JsonObject
	{
		return {
			isEditing: false,
			inputWidth: 0,
			chatTitle: '',
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		canBeRenamed(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.rename, this.dialogId);
		},
		showTitleButton(): boolean
		{
			return this.canBeRenamed && !this.isEditing;
		},
		// The title itself reads as a name, so the button says what activating it does - and keeps the
		// name, otherwise the walk would announce the action without telling which chat it renames.
		// The marks of the title travel with it: the button hides its own content, so a state drawn as
		// an icon has no other way into the accessibility tree.
		renameLabel(): string
		{
			const rename = this.loc('IM_CHAT_TITLE_RENAME_ARIA', { '#TITLE#': this.dialog.name });

			return [rename, ...this.titleStates].join(', ');
		},
		titleStates(): string[]
		{
			const states = [];

			if (this.dialog.isMuted)
			{
				states.push(this.loc('IM_CHAT_TITLE_MUTED_ARIA'));
			}

			if (this.isAutoDeleteEnabled)
			{
				states.push(this.loc('IM_CHAT_TITLE_AUTO_DELETE_ARIA'));
			}

			return states;
		},
		isAutoDeleteEnabled(): boolean
		{
			return this.$store.getters['chats/autoDelete/isEnabled'](this.dialog.chatId);
		},
		inputStyle(): { width: string }
		{
			return {
				width: `calc(${this.inputWidth}ch + ${INPUT_PADDING}px)`,
			};
		},
	},
	watch:
	{
		chatTitle()
		{
			this.inputWidth = this.chatTitle.length;
		},
	},
	created()
	{
		this.getEmitter().subscribe(EventType.key.onBeforeEscape, this.onBeforeEscape);
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.key.onBeforeEscape, this.onBeforeEscape);
	},
	mounted()
	{
		this.chatTitle = this.dialog.name;
	},
	methods:
	{
		// ALG-02: the native button activates on Enter and Space by itself, so entering the edit mode has
		// a single entry point and needs no key handler of its own.
		async onTitleClick()
		{
			if (!this.canBeRenamed)
			{
				return;
			}

			this.chatTitle = this.dialog.name;
			this.isEditing = true;
			await this.$nextTick();
			this.$refs.titleInput.focus();
		},
		/**
		 * The single exit of the editor, idempotent by the edit flag, so one gesture submits once.
		 *
		 * It is also the whole of ALG-02 for `Tab` and `Shift+Tab`, and those keys get no handler on
		 * purpose: the browser has already picked the next stop from the focused field, and closing the
		 * editor inside `keydown` would take that starting point away before the default action runs.
		 * The blur of the real focus move saves instead - Vue updates asynchronously, so the field is
		 * still in the document while the browser moves on, and nothing here places the focus itself.
		 */
		onNewTitleSubmit()
		{
			if (!this.isEditing)
			{
				return;
			}
			this.isEditing = false;

			const nameNotChanged = this.chatTitle === this.dialog.name;
			if (nameNotChanged || this.chatTitle === '')
			{
				return;
			}

			this.$emit('newTitleSubmit', this.chatTitle);
		},
		// ALG-02: Enter saves and hands the focus back to the button it came from. The submit itself is
		// idempotent, so the blur of the field being unmounted adds no second event.
		onInputEnter()
		{
			this.onNewTitleSubmit();
			void this.focusTitleButton();
		},
		// ALG-02: Escape restores the title the chat had, closes the editor and returns the focus. The
		// `handled` answer is what stops the rest of the Esc chain, so the chat itself stays open.
		onBeforeEscape(): $Values<typeof EscEventAction>
		{
			if (!this.isEditing)
			{
				return EscEventAction.ignored;
			}

			this.chatTitle = this.dialog.name;
			this.isEditing = false;
			void this.focusTitleButton();

			return EscEventAction.handled;
		},
		async focusTitleButton(): Promise<void>
		{
			await this.$nextTick();
			this.$refs.titleButton?.focus();
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string, replacements: { [key: string]: string } = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	/**
	 * The pencil stands in the markup of the button from the start and is revealed by CSS - on `:hover`
	 * and on `:focus-visible` - instead of being inserted and removed by handlers of the focus. WebKit
	 * aborts the focus move of a `Tab` when the element that is losing the focus rebuilds its own content
	 * at that moment, and the walk was left standing on the title (measured on the stand, 2026-08-27).
	 * The pencil stays out of the accessibility tree and out of the walk either way.
	 */
	// language=Vue
	template: `
		<button
			v-if="showTitleButton"
			ref="titleButton"
			type="button"
			tabindex="0"
			:aria-label="renameLabel"
			@click="onTitleClick"
			class="bx-im-elements-editable-chat-title__scope bx-im-elements-editable-chat-title__wrap
				--can-rename --focus-visible"
			data-testid="im-chat-title-rename-btn"
		>
			<div class="bx-im-elements-editable-chat-title__container" aria-hidden="true">
				<ChatTitle :dialogId="dialogId" :withMute="true" :withAutoDelete="true" />
			</div>
			<div class="bx-im-elements-editable-chat-title__edit-icon_container" aria-hidden="true">
				<div class="bx-im-elements-editable-chat-title__edit-icon"></div>
			</div>
		</button>
		<div
			v-else-if="!isEditing"
			class="bx-im-elements-editable-chat-title__scope bx-im-elements-editable-chat-title__wrap"
		>
			<div class="bx-im-elements-editable-chat-title__container">
				<ChatTitle :dialogId="dialogId" :withMute="true" :withAutoDelete="true" />
			</div>
			<div class="bx-im-elements-editable-chat-title__edit-icon_container"></div>
		</div>
		<div
			v-else
			class="bx-im-elements-editable-chat-title__scope bx-im-elements-editable-chat-title__input_container"
		>
			<input
				v-model="chatTitle"
				:style="inputStyle"
				:aria-label="loc('IM_CHAT_TITLE_RENAME_INPUT_ARIA')"
				@focus="$event.target.select()"
				@blur="onNewTitleSubmit"
				@keydown.enter.prevent="onInputEnter"
				type="text"
				class="bx-im-elements-editable-chat-title__input"
				data-testid="im-chat-title-input"
				ref="titleInput"
			/>
		</div>
	`,
};

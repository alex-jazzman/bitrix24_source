import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { Core } from 'im.v2.application.core';
import { EventType } from 'im.v2.const';
import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';
import { CommandService } from 'im.v2.provider.service.command';
import { type ImModelCommand, type ImModelUser } from 'im.v2.model';

import { MentionItemsContainer } from '../mention/components/mention-items-container';
import { ContentFooter } from '../mention/components/content-footer';
import { SlashCommandItem } from './components/slash-command-item';
import { ErrorState } from './components/error-state';
import { EmptyState } from './components/empty-state';
import { getFilteredCommands } from './filters';

import './css/slash-command-content.css';

// notifies the textarea (via the shared emitter) whether the popup currently has selectable items
export const SlashCommandItemsChangedEvent = 'IM:Textarea:slashCommandItemsChanged';

// @vue/component
export const SlashCommandPopupContent = {
	name: 'SlashCommandPopupContent',
	components: { Spinner, MentionItemsContainer, ContentFooter, ErrorState, EmptyState },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		query: {
			type: String,
			default: '',
		},
	},
	emits: ['close', 'adjustPosition'],
	setup(): Object
	{
		return {
			SpinnerSize,
			SpinnerColor,
			selectEventType: EventType.textarea.selectSlashCommand,
		};
	},
	computed:
	{
		allCommands(): ImModelCommand[]
		{
			return this.$store.getters['commands/getByDialogId'](this.dialogId);
		},
		status(): string
		{
			return this.$store.getters['commands/getStatus'](this.dialogId);
		},
		isCached(): boolean
		{
			return this.$store.getters['commands/isCached'](this.dialogId);
		},
		isLoading(): boolean
		{
			return this.status === 'loading';
		},
		isError(): boolean
		{
			return this.status === 'error';
		},
		isExtranetUser(): boolean
		{
			const currentUser: ?ImModelUser = this.$store.getters['users/get'](Core.getUserId());

			return currentUser?.extranet === true;
		},
		items(): ImModelCommand[]
		{
			return getFilteredCommands(this.allCommands, this.query, this.isExtranetUser);
		},
		showError(): boolean
		{
			return this.isError && this.allCommands.length === 0;
		},
		isEmptyState(): boolean
		{
			return !this.isLoading && !this.showError && this.items.length === 0;
		},
		showList(): boolean
		{
			return !this.isLoading && !this.showError && !this.isEmptyState;
		},
		showEscHint(): boolean
		{
			return this.showError || this.isEmptyState;
		},
		// discriminant mirroring the template's v-if chain; height only changes between these states
		contentState(): string
		{
			if (this.isLoading)
			{
				return 'loading';
			}

			if (this.showError)
			{
				return 'error';
			}

			if (this.isEmptyState)
			{
				return 'empty';
			}

			return 'list';
		},
	},
	watch:
	{
		// reposition on state transitions only, not on every filtered-list content change
		contentState(): void
		{
			void this.adjustPosition();
		},
		items(): void
		{
			this.emitItemsState();
		},
	},
	mounted()
	{
		this.emitItemsState();
	},
	created()
	{
		this.commandService = new CommandService();
		if (this.isCached)
		{
			void this.commandService.loadCommands(this.dialogId, { silent: true });

			return;
		}

		void this.commandService.loadCommands(this.dialogId);
	},
	methods:
	{
		resolveSlashCommandItem(): Object
		{
			return SlashCommandItem;
		},
		onItemSelect(item: ImModelCommand): void
		{
			this.getEmitter().emit(EventType.textarea.insertMention, {
				dialogId: this.dialogId,
				isMentionSymbol: false,
				textToReplace: `/${this.query}`,
				mentionText: item.command,
				mentionReplacement: item.command,
				registerReplacement: false,
			});
		},
		onRetry(): void
		{
			void this.commandService.loadCommands(this.dialogId);
		},
		emitItemsState(): void
		{
			this.getEmitter().emit(SlashCommandItemsChangedEvent, {
				dialogId: this.dialogId,
				hasItems: this.items.length > 0,
			});
		},
		async adjustPosition(): Promise<void>
		{
			await this.$nextTick();
			this.$emit('adjustPosition');
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
		<div class="bx-im-slash-command-content__container" :class="{ '--list': showList }">
			<div v-if="isLoading" class="bx-im-slash-command-content__state" data-testid="im-textarea-slash-command-loading">
				<Spinner :size="SpinnerSize.XXS" :color="SpinnerColor.grey"/>
				<span class="bx-im-slash-command-content__state-text">
					{{ loc('IM_TEXTAREA_SLASH_COMMAND_LOADING_STATE') }}
				</span>
			</div>
			<ErrorState v-else-if="showError" @retry="onRetry"/>
			<EmptyState v-else-if="isEmptyState"/>
			<div v-else class="bx-im-slash-command-content__list">
				<MentionItemsContainer
					data-testid="im-textarea-slash-command-list"
					:dialogId="dialogId"
					:query="query"
					:items="items"
					:resolveItemComponent="resolveSlashCommandItem"
					:onItemSelect="onItemSelect"
					:selectEventType="selectEventType"
					@close="$emit('close')"
				/>
			</div>
			<ContentFooter v-if="showList" class="bx-im-slash-command-content__footer"/>
			<div
				v-else-if="showEscHint"
				class="bx-im-slash-command-content__esc-hint"
				data-testid="im-textarea-slash-command-esc-hint"
			>
				<span class="bx-im-slash-command-content__esc-hint-key">Esc</span>
				<span class="bx-im-slash-command-content__esc-hint-description">
					{{ loc('IM_TEXTAREA_MENTION_ESC_CONTROL') }}
				</span>
			</div>
		</div>
	`,
};

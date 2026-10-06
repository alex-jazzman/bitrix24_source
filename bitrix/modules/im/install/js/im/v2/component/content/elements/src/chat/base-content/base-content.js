import { type JsonObject } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { computed } from 'ui.vue3';

import { ChatDialog } from 'im.v2.component.dialog.chat';
import { ChatSidebar } from 'im.v2.component.sidebar';
import { ChatTextarea } from 'im.v2.component.textarea';
import { ActionByRole, Settings, UserRole, EventType, SidebarDetailBlock } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { ResizeManager } from 'im.v2.lib.textarea';
import { ThemeManager, type BackgroundStyle } from 'im.v2.lib.theme';
import { type ImModelChat } from 'im.v2.model';

import { ChatHeader } from '../header/chat-header';
import { BulkActionsPanel } from './components/bulk-actions-panel';
import { ChatContentDisclaimer } from './components/chat-content-disclaimer/chat-content-disclaimer';
import { DropArea } from './components/drop-area';
import { JoinPanel } from './components/join-panel';
import { LoadingBar } from './components/loading-bar';
import { MutePanel } from './components/mute-panel';
import { Height } from './const/size';
import { TextareaObserverDirective } from './utils/observer-directive';

import './css/base-chat-content.css';

type SidebarDetailBlockType = $Values<typeof SidebarDetailBlock>;

// @vue/component
export const BaseChatContent = {
	name: 'BaseChatContent',
	components:
	{
		ChatHeader,
		ChatDialog,
		ChatTextarea,
		ChatSidebar,
		ChatContentDisclaimer,
		DropArea,
		MutePanel,
		JoinPanel,
		BulkActionsPanel,
		LoadingBar,
	},
	directives: { 'textarea-observer': TextareaObserverDirective },
	provide(): { currentSidebarPanel: SidebarDetailBlockType, withSidebar: boolean }
	{
		return {
			currentSidebarPanel: computed(() => this.currentSidebarPanel),
			withSidebar: computed(() => this.withSidebar),
		};
	},
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
		withSidebar: {
			type: Boolean,
			default: true,
		},
		withHeader: {
			type: Boolean,
			default: true,
		},
		withDropArea: {
			type: Boolean,
			default: true,
		},
		backgroundId: {
			type: String,
			default: null,
		},
	},
	data(): JsonObject
	{
		return {
			textareaHeight: 0,
			headerHeight: 0,
			showLoadingBar: false,
			currentSidebarPanel: '',
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		canSend(): boolean
		{
			if (!this.dialog.isTextareaEnabled)
			{
				return false;
			}

			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.send, this.dialog.dialogId);
		},
		isGuest(): boolean
		{
			return this.dialog.role === UserRole.guest;
		},
		isBulkActionsMode(): boolean
		{
			return this.$store.getters['messages/select/isBulkActionsModeActive'](this.dialogId);
		},
		hasCommentsOnTop(): boolean
		{
			return this.$store.getters['messages/comments/areOpenedForChannel'](this.dialogId);
		},
		containerClasses(): string[]
		{
			const alignment = this.$store.getters['application/settings/get'](Settings.appearance.alignment);

			return [`--${alignment}-align`];
		},
		backgroundStyle(): BackgroundStyle
		{
			if (this.backgroundId)
			{
				return ThemeManager.getBackgroundStyleById(this.backgroundId);
			}

			return ThemeManager.getCurrentBackgroundStyle(this.dialogId);
		},
		dialogContainerStyle(): Object
		{
			let textareaHeight = this.textareaHeight;
			if (!this.canSend || this.isBulkActionsMode)
			{
				textareaHeight = Height.blockedTextarea;
			}

			return {
				height: `calc(100% - ${this.headerHeight}px - ${textareaHeight}px)`,
			};
		},
	},
	watch:
	{
		textareaHeight(newValue, oldValue)
		{
			if (!this.dialog.inited || oldValue === 0)
			{
				return;
			}

			EventEmitter.emit(EventType.dialog.scrollToBottom, {
				chatId: this.dialog.chatId,
				animation: false,
			});
		},
	},
	created()
	{
		this.initTextareaResizeManager();
		this.bindEvents();
	},
	mounted()
	{
		this.headerHeight = this.$refs['header-container']?.clientHeight ?? 0;
	},
	beforeUnmount()
	{
		this.unbindEvents();
	},
	methods:
	{
		getContainer(): HTMLElement
		{
			return this.$refs.content;
		},
		initTextareaResizeManager()
		{
			this.textareaResizeManager = new ResizeManager();
			this.textareaResizeManager.subscribe(ResizeManager.events.onHeightChange, this.onTextareaHeightChange);
		},
		onTextareaMount()
		{
			const textareaContainer: HTMLDivElement = this.$refs['textarea-container'];
			this.textareaHeight = textareaContainer.clientHeight;
		},
		onTextareaHeightChange(event: BaseEvent<{newHeight: number}>)
		{
			const { newHeight } = event.getData();
			this.textareaHeight = newHeight;
		},
		onShowLoadingBar(event: BaseEvent<{ dialogId: string }>)
		{
			const { dialogId } = event.getData();
			if (dialogId !== this.dialogId)
			{
				return;
			}
			this.showLoadingBar = true;
		},
		onHideLoadingBar(event: BaseEvent<{ dialogId: string }>)
		{
			const { dialogId } = event.getData();
			if (dialogId !== this.dialogId)
			{
				return;
			}
			this.showLoadingBar = false;
		},
		onChangeSidebarPanel({ panel }: { panel: SidebarDetailBlockType })
		{
			this.currentSidebarPanel = panel;
		},
		bindEvents()
		{
			this.getEmitter().subscribe(EventType.dialog.showLoadingBar, this.onShowLoadingBar);
			this.getEmitter().subscribe(EventType.dialog.hideLoadingBar, this.onHideLoadingBar);
		},
		unbindEvents()
		{
			this.getEmitter().unsubscribe(EventType.dialog.showLoadingBar, this.onShowLoadingBar);
			this.getEmitter().unsubscribe(EventType.dialog.hideLoadingBar, this.onHideLoadingBar);
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
		<div class="bx-im-content-chat__scope bx-im-content-chat__container" :class="containerClasses" :style="backgroundStyle">
			<div class="bx-im-content-chat__content" ref="content">
				<div v-if="withHeader" ref="header-container">
					<slot name="header">
						<ChatHeader :dialogId="dialogId" :key="dialogId" />
					</slot>
				</div>
				<slot name="sub-header"></slot>
				<div :style="dialogContainerStyle" class="bx-im-content-chat__dialog_container">
					<Transition name="loading-bar-transition">
						<LoadingBar v-if="showLoadingBar" />
					</Transition>
					<div class="bx-im-content-chat__dialog_content">
						<slot name="dialog">
							<ChatDialog :dialogId="dialogId" :key="dialogId"/>
						</slot>
					</div>
				</div>
				<!-- Textarea -->
				<Transition name="bx-im-panel-transition">
					<BulkActionsPanel v-if="isBulkActionsMode" :dialogId="dialogId"/>
					<div v-else-if="canSend" v-textarea-observer class="bx-im-content-chat__textarea_container" ref="textarea-container">
						<slot name="textarea" :onTextareaMount="onTextareaMount">
							<ChatTextarea
								:dialogId="dialogId"
								:key="dialogId"
								@mounted="onTextareaMount"
							/>
						</slot>
						<div class="bx-im-content-chat__after-textarea_container">
							<slot name="after-textarea">
								<ChatContentDisclaimer :dialogId="dialogId"/>
							</slot>
						</div>
					</div>
					<slot v-else-if="isGuest" name="join-panel">
						<JoinPanel :dialogId="dialogId" />
					</slot>
					<MutePanel v-else :dialogId="dialogId" />
				</Transition>
				<DropArea
					v-if="withDropArea"
					:key="dialogId" 
					:dialogId="dialogId" 
					:container="$refs.content || {}" 
				/>
				<!-- End textarea -->
			</div>
			<ChatSidebar
				v-if="dialogId && withSidebar" 
				:originDialogId="dialogId"
				:isActive="!hasCommentsOnTop"
				@changePanel="onChangeSidebarPanel"
			/>
			<slot name="extra-panel"></slot>
		</div>
	`,
};

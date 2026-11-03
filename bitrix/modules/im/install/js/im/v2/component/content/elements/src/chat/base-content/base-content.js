import { type JsonObject, Type } from 'main.core';
import { type EventEmitter, type BaseEvent } from 'main.core.events';
import { computed, inject, onBeforeUnmount } from 'ui.vue3';

import { ChatDialog } from 'im.v2.component.dialog.chat';
import { ChatSidebar } from 'im.v2.component.sidebar';
import { ChatTextarea } from 'im.v2.component.textarea';
import { ActionByRole, Settings, UserRole, EventType, SidebarDetailBlock } from 'im.v2.const';
import {
	CHAT_DETAIL_FOCUS_CONTEXT,
	ChatDetailFocusContext,
	DetailArea,
	type DetailAreaType,
} from 'im.v2.lib.a11y';
import { PermissionManager } from 'im.v2.lib.permission';
import { ThemeManager, type BackgroundStyle } from 'im.v2.lib.theme';
import { type ImModelChat } from 'im.v2.model';

import { ChatHeader } from '../header/chat-header';
import { BulkActionsPanel } from './components/bulk-actions-panel';
import { ChatContentDisclaimer } from './components/chat-content-disclaimer/chat-content-disclaimer';
import { DropArea } from './components/drop-area';
import { JoinPanel } from './components/join-panel';
import { LoadingBar } from './components/loading-bar';
import { MutePanel } from './components/mute-panel';

import './css/base-chat-content.css';

type SidebarDetailBlockType = $Values<typeof SidebarDetailBlock>;

type ProvidedContext = {
	currentSidebarPanel: SidebarDetailBlockType,
	withSidebar: boolean,
	sidebarAreaId: string,
	chatDetailFocusContext: ChatDetailFocusContext,
};

/**
 * The bounds of the detail areas this composition owns: the context learns where an area starts and ends
 * and nothing about the stops inside it, which belong to the owner of the area.
 */
const DetailAreaRef: { [DetailAreaType]: string } = Object.freeze({
	[DetailArea.header]: 'headerArea',
	[DetailArea.preFeed]: 'preFeedArea',
	[DetailArea.feed]: 'feedArea',
	[DetailArea.composerOrReplacement]: 'composerArea',
	[DetailArea.postComposer]: 'postComposerArea',
	[DetailArea.sidebar]: 'sidebarArea',
});

/**
 * The stable name of the sidebar area a header control points at with `aria-controls`. Several details can
 * live on one page - an embedded chat beside the messenger, the comments layer over the base one - so the
 * name carries the number of the composition that owns the element and stays the same while it is mounted.
 */
const SIDEBAR_AREA_ID_PREFIX = 'bx-im-chat-detail-sidebar';
let sidebarAreaSequence = 0;

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
	provide(): ProvidedContext
	{
		return {
			currentSidebarPanel: computed(() => this.currentSidebarPanel),
			withSidebar: computed(() => this.withSidebar),
			// A control names the area it opens only while that area is really rendered: an `aria-controls`
			// pointing at nothing is worse than no attribute at all.
			sidebarAreaId: computed(() => (this.showSidebar ? this.sidebarAreaElementId : '')),
			[CHAT_DETAIL_FOCUS_CONTEXT]: this.focusContext,
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
	setup(): Object
	{
		sidebarAreaSequence += 1;
		const sidebarAreaElementId = `${SIDEBAR_AREA_ID_PREFIX}-${sidebarAreaSequence}`;

		const inheritedFocusContext = inject(CHAT_DETAIL_FOCUS_CONTEXT, null);
		if (inheritedFocusContext !== null)
		{
			return { focusContext: inheritedFocusContext, sidebarAreaElementId };
		}

		// Embedded content mounted on its own has no messenger root above it, so it owns a fallback
		// coordinator of its detail areas and takes it down together with itself.
		const focusContext = new ChatDetailFocusContext();
		onBeforeUnmount(() => focusContext.destroy());

		return { focusContext, sidebarAreaElementId };
	},
	data(): JsonObject
	{
		return {
			showLoadingBar: false,
			currentSidebarPanel: '',
			dropAreaContainer: null,
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
		showSidebar(): boolean
		{
			return Type.isStringFilled(this.dialogId) && this.withSidebar;
		},
		canRenderDropArea(): boolean
		{
			return this.withDropArea && Boolean(this.dropAreaContainer);
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
	},
	created()
	{
		this.registeredAreas = new Map();
		this.bindEvents();
	},
	mounted()
	{
		this.syncDetailAreas();
		// $refs are not reactive: the drop area gets the node through state, not straight from the template
		this.dropAreaContainer = this.$refs.content;
	},
	updated()
	{
		this.syncDetailAreas();
	},
	beforeUnmount()
	{
		this.releaseDetailAreas();
		this.unbindEvents();
	},
	methods:
	{
		getContainer(): HTMLElement
		{
			return this.$refs.content;
		},
		/**
		 * While the comments layer covers this content, the layer on top describes the detail: several
		 * compositions share one context, and only the one the user is looking at owns the area bounds.
		 */
		syncDetailAreas()
		{
			const isCovered = this.hasCommentsOnTop;

			Object.keys(DetailAreaRef).forEach((area: DetailAreaType) => {
				const element = isCovered ? null : this.resolveAreaElement(DetailAreaRef[area]);
				const registered = this.registeredAreas.get(area) ?? null;
				if (registered === element)
				{
					return;
				}

				if (registered !== null)
				{
					this.focusContext.unregisterArea(area, registered);
					this.registeredAreas.delete(area);
				}

				if (element !== null)
				{
					this.focusContext.registerArea(area, element);
					this.registeredAreas.set(area, element);
				}
			});
		},
		releaseDetailAreas()
		{
			this.registeredAreas.forEach((element: HTMLElement, area: DetailAreaType) => {
				this.focusContext.unregisterArea(area, element);
			});
			this.registeredAreas.clear();
		},
		// An area drawn by a component hands over its root element, an area of this template - itself.
		resolveAreaElement(refName: string): HTMLElement | null
		{
			const target = this.$refs[refName];
			const element = Type.isElementNode(target) ? target : target?.$el;

			return Type.isElementNode(element) ? element : null;
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
		<div
			class="bx-im-content-chat__scope bx-im-content-chat__container"
			:class="containerClasses"
			:style="backgroundStyle"
			data-testid="im-content-chat-container"
		>
			<div class="bx-im-content-chat__content" ref="content" data-testid="im-content-chat-content">
				<div v-if="withHeader" ref="headerArea">
					<slot name="header">
						<ChatHeader :dialogId="dialogId" :key="dialogId" />
					</slot>
				</div>
				<div class="bx-im-content-chat__pre-feed_container" ref="preFeedArea">
					<slot name="sub-header"></slot>
				</div>
				<div class="bx-im-content-chat__dialog_container" ref="feedArea">
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
				<div class="bx-im-content-chat__composer_container" ref="composerArea">
					<Transition name="bx-im-panel-transition" @afterLeave="syncDetailAreas">
						<BulkActionsPanel v-if="isBulkActionsMode" :dialogId="dialogId"/>
						<div v-else-if="canSend" class="bx-im-content-chat__textarea_container">
							<!-- default field serves the in-scope surfaces only: everyone else either replaces it
								through the slot or never gets here, having no right to send -->
							<slot name="textarea">
								<ChatTextarea
									:dialogId="dialogId"
									:withKeyboardNavigation="true"
									:key="dialogId"
								/>
							</slot>
							<div class="bx-im-content-chat__after-textarea_container" ref="postComposerArea">
								<slot name="after-textarea">
									<ChatContentDisclaimer :dialogId="dialogId"/>
								</slot>
							</div>
						</div>
						<slot v-else name="blocked-panel">
							<slot v-if="isGuest" name="join-panel">
								<JoinPanel :dialogId="dialogId" />
							</slot>
							<MutePanel v-else :dialogId="dialogId" />
						</slot>
					</Transition>
				</div>
				<DropArea
					v-if="canRenderDropArea"
					:key="dialogId"
					:dialogId="dialogId"
					:container="dropAreaContainer"
				/>
				<!-- End textarea -->
			</div>
			<ChatSidebar
				v-if="showSidebar"
				ref="sidebarArea"
				:id="sidebarAreaElementId"
				:originDialogId="dialogId"
				:isActive="!hasCommentsOnTop"
				@changePanel="onChangeSidebarPanel"
			/>
			<slot name="extra-panel"></slot>
		</div>
	`,
};

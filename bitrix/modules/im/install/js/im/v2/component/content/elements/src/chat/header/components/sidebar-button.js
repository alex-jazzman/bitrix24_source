import { Event, Type } from 'main.core';
import { FocusMonitor, FocusNavigator, InteractivityChecker } from 'ui.a11y';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { EventType, SidebarDetailBlock } from 'im.v2.const';
import { CHAT_DETAIL_FOCUS_CONTEXT, DetailArea, type ChatDetailFocusContext } from 'im.v2.lib.a11y';

import { HeaderAction, HeaderActionShape, HeaderControlKey } from './header-action/header-action';

import type { EventEmitter } from 'main.core.events';

const ICON_SIZE = 24;
const KEYBOARD_MODALITY = 'keyboard';
const TAB_KEY = 'Tab';

/**
 * ALG-03. The direct entry into the sidebar is the one branch of the walk the document order cannot make.
 * `entry` is armed by the keyboard activation that opens the panel and spent by the very next direct `Tab`
 * off this button; `back` is armed by that jump and spent by the `Shift+Tab` that returns. Everything else
 * drops both, so outside the branch the reverse walk out of the sidebar stays the natural one.
 */
const SidebarBranchIntent = Object.freeze({
	entry: 'sidebarEntry',
	back: 'sidebarEntryBack',
});

// @vue/component
export const SidebarButton = {
	name: 'SidebarButton',
	components: { BIcon, HeaderAction },
	inject:
	{
		currentSidebarPanel: 'currentSidebarPanel',
		sidebarAreaId: { default: '' },
		chatDetailFocusContext: {
			from: CHAT_DETAIL_FOCUS_CONTEXT,
			default: null,
		},
	},
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
	},
	computed:
	{
		Outline: () => Outline,
		ICON_SIZE: () => ICON_SIZE,
		HeaderActionShape: () => HeaderActionShape,
		HeaderControlKey: () => HeaderControlKey,
		isSidebarOpened(): boolean
		{
			return Type.isStringFilled(this.currentSidebarPanel);
		},
	},
	watch:
	{
		// The branch is a promise about one open panel of one chat: the panel closing or the chat changing
		// under the same button leaves nothing to keep it for.
		isSidebarOpened(opened: boolean)
		{
			if (!opened)
			{
				this.dropEntryBranch();
			}
		},
		dialogId()
		{
			this.dropEntryBranch();
		},
	},
	created()
	{
		this.watchedOpener = null;
		this.entryTarget = null;
	},
	beforeUnmount()
	{
		this.dropEntryBranch();
	},
	methods:
	{
		toggleRightPanel()
		{
			this.updateEntryIntent(!this.isSidebarOpened);

			if (this.isSidebarOpened)
			{
				this.getEmitter().emit(EventType.sidebar.close, { panel: '' });

				return;
			}

			this.getEmitter().emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.main,
				dialogId: this.dialogId,
			});
		},
		// Only a keyboard activation that really opens the panel earns the branch: a mouse click, a closing
		// one and a sidebar restored already open leave the walk to the document order.
		updateEntryIntent(isOpening: boolean)
		{
			this.dropEntryBranch();

			const context = this.getFocusContext();
			if (context === null || !isOpening)
			{
				return;
			}

			if (FocusMonitor.Instance.getLastInputModality() !== KEYBOARD_MODALITY)
			{
				return;
			}

			context.armIntent({
				name: SidebarBranchIntent.entry,
				dialogId: this.dialogId,
				openerKey: HeaderControlKey.sidebar,
			});

			this.watchedOpener = this.$el;
			Event.bind(this.watchedOpener, 'focusout', this.onOpenerFocusOut);
		},
		/**
		 * The promise is about the focus standing on this button, so it ends together with that focus. The
		 * branch spends the promise before it moves the focus itself, so its own jump is no such route.
		 */
		onOpenerFocusOut()
		{
			this.getFocusContext()?.clearIntent(SidebarBranchIntent.entry);
			this.unwatchOpener();
		},
		onOpenerKeydown(event: KeyboardEvent)
		{
			const context = this.getFocusContext();
			if (event.key !== TAB_KEY || context === null)
			{
				return;
			}

			const intent = context.getIntent(SidebarBranchIntent.entry);
			const isDirectEntry = !event.shiftKey
				&& intent !== null
				&& intent.dialogId === this.dialogId
				&& intent.openerKey === HeaderControlKey.sidebar;

			if (!isDirectEntry)
			{
				context.clearIntent(SidebarBranchIntent.entry);

				return;
			}

			// Spent by the step that took it, whether or not the area has a target to take the focus: the
			// promise was about this one `Tab` and no later one.
			context.consumeIntent(SidebarBranchIntent.entry);

			const target = context.getAreaEntryTarget(DetailArea.sidebar);
			if (!this.canTakeFocus(target))
			{
				return;
			}

			event.preventDefault();
			FocusNavigator.focusTarget(target, { preventScroll: true });
			this.armReturn(context, target);
		},
		armReturn(context: ChatDetailFocusContext, target: HTMLElement)
		{
			context.armIntent({
				name: SidebarBranchIntent.back,
				dialogId: this.dialogId,
				openerKey: HeaderControlKey.sidebar,
			});

			// The listener of somebody else's element lives exactly as long as the branch does, so the
			// sidebar keeps its own keyboard model everywhere outside this single step back.
			this.entryTarget = target;
			Event.bind(target, 'keydown', this.onEntryTargetKeydown);
			Event.bind(target, 'focusout', this.dropEntryBranch);
		},
		onEntryTargetKeydown(event: KeyboardEvent)
		{
			const context = this.getFocusContext();
			if (event.key !== TAB_KEY || context === null)
			{
				return;
			}

			const intent = context.getIntent(SidebarBranchIntent.back);
			const opener = context.getHeaderControlElement(HeaderControlKey.sidebar);

			this.dropEntryBranch();

			const isReturn = event.shiftKey && intent !== null && intent.dialogId === this.dialogId;
			if (!isReturn || !this.canTakeFocus(opener))
			{
				return;
			}

			event.preventDefault();
			FocusNavigator.focusTarget(opener, { preventScroll: true });
		},
		dropEntryBranch()
		{
			const context = this.getFocusContext();
			context?.clearIntent(SidebarBranchIntent.entry);
			context?.clearIntent(SidebarBranchIntent.back);

			this.unwatchOpener();

			if (this.entryTarget === null)
			{
				return;
			}

			Event.unbind(this.entryTarget, 'keydown', this.onEntryTargetKeydown);
			Event.unbind(this.entryTarget, 'focusout', this.dropEntryBranch);
			this.entryTarget = null;
		},
		unwatchOpener()
		{
			if (this.watchedOpener === null)
			{
				return;
			}

			Event.unbind(this.watchedOpener, 'focusout', this.onOpenerFocusOut);
			this.watchedOpener = null;
		},
		canTakeFocus(element: HTMLElement | null): boolean
		{
			if (element === null || !element.isConnected)
			{
				return false;
			}

			return InteractivityChecker.isFocusable(element) && !InteractivityChecker.isDisabled(element);
		},
		getFocusContext(): ChatDetailFocusContext | null
		{
			return this.chatDetailFocusContext;
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
	// One control, one wording: the tooltip is the only phrase of this control and therefore its name.
	// A second attribute carrying the same text would turn the tooltip into the description of that name,
	// and the control would announce itself twice.
	template: `
		<HeaderAction
			:controlKey="HeaderControlKey.sidebar"
			:expanded="isSidebarOpened"
			:controls="sidebarAreaId"
			:shape="HeaderActionShape.circle"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SIDEBAR')"
			:class="{'--active': isSidebarOpened}"
			class="bx-im-chat-header__icon --ds-icon"
			data-testid="im-chat-header-sidebar-btn"
			@click="toggleRightPanel"
			@keydown="onOpenerKeydown"
		>
			<BIcon :name="Outline.COLUMNS_SIDEBAR_PENDING" :size="ICON_SIZE" />
		</HeaderAction>
	`,
};

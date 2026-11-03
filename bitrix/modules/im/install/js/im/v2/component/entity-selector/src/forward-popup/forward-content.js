import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { LiveAnnouncer } from 'ui.a11y';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { ChatSearchInput, ForwardSearch, type ForwardSectionId } from 'im.v2.component.search';
import { EventType, RecentType, SoundType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Notifier } from 'im.v2.lib.notifier';
import { SoundNotificationManager } from 'im.v2.lib.sound-notification';
import { Utils } from 'im.v2.lib.utils';
import { SendingService } from 'im.v2.provider.service.sending';

import { ForwardNavigation } from './components/navigation/navigation';
import { ForwardSectionConfig, type ForwardSectionItem } from './const/section-config';
import { isCurrentUserGuest } from './helpers/current-user';
import { openForwardChat } from './helpers/open-forward-chat';

import './forward-content.css';

const ID_NAMESPACE_PREFIX = 'im-forward-';
const MAX_SELECTED_RECIPIENTS = 20;
let windowInstanceIndex = 0;

// The single owner of the window id space: every aria relation inside the window - the listbox and
// status ids below, the panel id, the tab and option ids of the child components - is derived from
// the namespace this returns, so two windows on one page never share an id. The same value addresses
// the shared search key channel, so a keystroke only acts in the window it was typed in.
const nextIdNamespace = (): string => `${ID_NAMESPACE_PREFIX}${++windowInstanceIndex}`;

// @vue/component
export const ForwardContent = {
	name: 'ForwardContent',
	components: { ForwardNavigation, ForwardSearch, ChatSearchInput, UiButton },
	props:
	{
		messagesIds: {
			type: Array,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		directForward: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			namespace: nextIdNamespace(),
			searchQuery: '',
			isLoading: false,
			currentSection: null,
			selectedDialogIds: [],
			hasAnnouncedSelectionLimit: false,
		};
	},
	computed:
	{
		navigationSections(): ForwardSectionItem[]
		{
			if (isCurrentUserGuest())
			{
				return [];
			}

			return Object.values(ForwardSectionConfig).filter((section) => section.isAvailable());
		},
		showSectionTabs(): boolean
		{
			return this.navigationSections.length > 0;
		},
		// The window owns the tab set, so it is the only one that can name the active section for the
		// announcement of the list. A guest has no tabs, hence no name to hand over.
		currentSectionName(): ?string
		{
			const activeSection = this.navigationSections.find(({ type }) => type === this.currentSection);

			return activeSection?.getTitle() ?? null;
		},
		panelId(): string
		{
			return `${this.namespace}-panel`;
		},
		// The ids below are pure functions of the namespace, so they are computed here instead of being
		// asked from the components that own the nodes.
		activeTabId(): string
		{
			return `${this.namespace}-tab-${this.currentSection}`;
		},
		listboxId(): string
		{
			return `${this.namespace}-listbox`;
		},
		statusId(): string
		{
			return `${this.namespace}-status`;
		},
		isMultipleRecipientsAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isForwardMultipleRecipientsAvailable);
		},
		selectedCount(): number
		{
			return this.selectedDialogIds.length;
		},
		selectionLimitReached(): boolean
		{
			return this.selectedCount >= MAX_SELECTED_RECIPIENTS;
		},
		ButtonSize: () => ButtonSize,
		ButtonStyle: () => AirButtonStyle,
		// Only a rendered tab can name the panel, so the results become a panel together with the tab set
		// and stay a standalone listbox without it - as they do for a guest, who gets no tabs at all. No
		// tabindex here: Tab from the search field has to reach the list itself.
		panelAttrs(): JsonObject
		{
			if (!this.showSectionTabs)
			{
				return {};
			}

			return {
				id: this.panelId,
				role: 'tabpanel',
				'aria-labelledby': this.activeTabId,
			};
		},
	},
	created()
	{
		this.currentSection = this.navigationSections[0]?.type ?? RecentType.default;
	},
	beforeUnmount()
	{
		Analytics.getInstance().messageForward.onClosePopup();
	},
	methods:
	{
		onSelectSection(section: ForwardSectionId)
		{
			this.currentSection = section;
		},
		onLoading(value: boolean)
		{
			this.isLoading = value;
		},
		onSearchZoneKeydown(event: KeyboardEvent)
		{
			// Kept local: the arrow is never published to the shared key channel, so it acts in this
			// window only. keydown, because the page scroll has to be cancelled before it happens.
			// Exact combination, so Shift/Cmd + arrow stays native text navigation in the field.
			if (!Utils.key.isExactCombination(event, 'ArrowDown'))
			{
				return;
			}

			event.preventDefault();
			this.$refs.searchResults.focusFirstResult();
		},
		// The list has nothing left to hold the focus and asks for it to go back where the window put it on
		// opening. The field is ours, so the node is looked up inside this window and nowhere else; it is
		// found by the very id we hand the field as aria-controls.
		onReturnFocusToSearch()
		{
			this.$el?.querySelector(`[aria-controls="${this.listboxId}"]`)?.focus();
		},
		onUpdateSearch(query: string)
		{
			Analytics.getInstance().messageForward.onStartSearch({
				dialogId: this.dialogId,
				section: this.currentSection,
			});
			this.searchQuery = query.trim().toLowerCase();
		},
		isSelfChat(dialogId: string): boolean
		{
			return this.$store.getters['chats/isSelfChat'](dialogId);
		},
		async forwardDirectly(forwardDialogId: string)
		{
			try
			{
				const isComplete = await SendingService.getInstance().forwardMessages({
					forwardIds: this.messagesIds,
					dialogId: forwardDialogId,
				});
				if (isComplete === false)
				{
					Notifier.onDefaultError();

					return;
				}

				Notifier.message.onForwardComplete(this.messagesIds, () => {
					void openForwardChat(forwardDialogId);
				});
				SoundNotificationManager.getInstance().playOnce(SoundType.send);
			}
			catch
			{
				Notifier.onDefaultError();
			}
		},
		async onSelectItem(event: {dialogId: string, nativeEvent: KeyboardEvent})
		{
			const { dialogId: forwardDialogId } = event;

			this.getEmitter().emit(EventType.dialog.closeBulkActionsMode, {
				dialogId: this.dialogId,
			});

			const isSelfChatForward = this.isSelfChat(forwardDialogId);
			const isSelfChatOpen = this.isSelfChat(this.dialogId);
			if (this.directForward || (isSelfChatForward && !isSelfChatOpen))
			{
				void this.forwardDirectly(forwardDialogId);
			}
			else
			{
				await openForwardChat(forwardDialogId);
				this.getEmitter().emit(EventType.textarea.insertForward, {
					messagesIds: this.messagesIds,
					dialogId: forwardDialogId,
				});
			}

			this.$emit('close');
		},
		onToggleItem(event: {dialogId: string, nativeEvent: KeyboardEvent})
		{
			const { dialogId } = event;
			if (this.selectedDialogIds.includes(dialogId))
			{
				this.selectedDialogIds = this.selectedDialogIds.filter((selectedDialogId) => {
					return selectedDialogId !== dialogId;
				});

				return;
			}

			if (this.selectionLimitReached)
			{
				return;
			}

			this.selectedDialogIds = [...this.selectedDialogIds, dialogId];
			if (this.selectionLimitReached && !this.hasAnnouncedSelectionLimit)
			{
				this.hasAnnouncedSelectionLimit = true;
				LiveAnnouncer.announce(this.loc('IM_ENTITY_SELECTOR_FORWARD_RECIPIENT_LIMIT_REACHED'), 'polite');
			}
		},
		onSubmit()
		{
			if (this.selectedCount === 0)
			{
				return;
			}

			if (this.selectedCount === 1)
			{
				void this.onSelectItem({ dialogId: this.selectedDialogIds[0], nativeEvent: null });

				return;
			}

			this.getEmitter().emit(EventType.dialog.closeBulkActionsMode, {
				dialogId: this.dialogId,
			});

			const operation = SendingService.getInstance().createForwardOperation({
				forwardIds: [...this.messagesIds],
				recipientDialogIds: [...this.selectedDialogIds],
			});
			const sourceDialogId = this.dialogId;
			const limitReached = this.selectedCount === MAX_SELECTED_RECIPIENTS;
			const reportResult = (result) => {
				const failedRecipients = result.recipients.filter(({ state }) => state !== 'success');
				const reasonGroups = failedRecipients.flatMap(({ messages = [] }) => {
					return messages.map(({ failureGroup }) => failureGroup).filter(Boolean);
				});
				Analytics.getInstance().messageForward.onOperationResult({
					dialogId: sourceDialogId,
					recipientCount: result.totalRecipients,
					unsuccessfulCount: result.totalRecipients - result.successfulRecipients,
					reasonGroups,
					limitReached,
					isRetry: result.isRetry,
				});
			};

			const retry = async () => {
				const result = await operation.retry();
				reportResult(result);

				return result;
			};

			const runOperation = async () => {
				try
				{
					const result = await operation.run();
					reportResult(result);
					try
					{
						await Notifier.forward.showResult({
							operationId: result.operationId,
							result,
							retry: operation.canRetry() ? retry : undefined,
						});
					}
					catch
					{
						Notifier.onDefaultError();
					}

					if (result.successfulRecipients > 0)
					{
						SoundNotificationManager.getInstance().playOnce(SoundType.send);
					}
				}
				catch
				{
					Notifier.onDefaultError();
				}
			};
			void runOperation();

			this.$emit('close');
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
		<div class="bx-im-entity-selector-forward__container">
			<div class="bx-im-entity-selector-forward__input" @keydown="onSearchZoneKeydown">
				<ChatSearchInput
					:searchMode="true"
					:isLoading="isLoading"
					:withIcon="false"
					autofocusOnTrapActivation
					:withGlobalEscapeHandling="false"
					:clearButtonLabel="loc('IM_ENTITY_SELECTOR_FORWARD_SEARCH_CLEAR_ARIA')"
					inputRole="searchbox"
					:inputControlsId="listboxId"
					:inputDescribedById="statusId"
					:searchContext="namespace"
					@updateSearch="onUpdateSearch"
				/>
			</div>
			<ForwardNavigation
				v-if="showSectionTabs"
				:sections="navigationSections"
				:currentSection="currentSection"
				:namespace="namespace"
				:panelId="panelId"
				@selectSection="onSelectSection"
			/>
			<div class="bx-im-entity-selector-forward__search-result-container" v-bind="panelAttrs">
				<ForwardSearch
					ref="searchResults"
					:query="searchQuery"
					:dialogId="dialogId"
					:recentSection="currentSection"
					:searchContext="namespace"
					:sectionName="currentSectionName"
					:multiple="isMultipleRecipientsAvailable"
					:selectedDialogIds="selectedDialogIds"
					:selectionLimitReached="selectionLimitReached"
					@clickItem="onSelectItem"
					@toggleItem="onToggleItem"
					@loading="onLoading"
					@returnFocusToSearch="onReturnFocusToSearch"
				/>
			</div>
			<div v-if="isMultipleRecipientsAvailable" class="bx-im-entity-selector-forward__footer">
				<span class="bx-im-entity-selector-forward__selected-count">
					{{ loc('IM_ENTITY_SELECTOR_FORWARD_SELECTED_COUNT').replace('#COUNT#', selectedCount) }}
				</span>
				<UiButton
					:size="ButtonSize.LARGE"
					:text="loc('IM_ENTITY_SELECTOR_FORWARD_SUBMIT')"
					:disabled="selectedCount === 0"
					:style="ButtonStyle.FILLED"
					:dataset="{ testid: 'im-forward-submit' }"
					@click="onSubmit"
				/>
			</div>
		</div>
	`,
};

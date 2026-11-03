import { type JsonObject } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { ChipDesign, ChipSize, Chip } from 'ui.system.chip.vue';
import { LiveAnnouncer } from 'ui.a11y';

import { McpSelector } from 'aiassistant.mcp-selector';

import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { CopilotMcpSelectionStatus } from 'im.v2.const';
import { McpSelection } from 'im.v2.provider.service.copilot';
import { type ImModelCopilotMcpAuth } from 'im.v2.model';

import { ToolbarHint } from './toolbar-hint';

const COPILOT_ANALYTICS_CONTEXT = 'copilot_chat';

type AnnouncedSelection = {
	dialogId: string,
	status: string,
};

const AriaLive = {
	polite: 'polite',
	assertive: 'assertive',
};

// @vue/component
export const CopilotMcpIntegration = {
	name: 'CopilotMcpIntegration',
	components: { Chip, ToolbarHint },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		isExpanded: {
			type: Boolean,
			default: true,
		},
	},
	data(): JsonObject
	{
		return {
			isSelectorOpened: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ChipDesign: () => ChipDesign,
		ChipSize: () => ChipSize,
		isAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.aiAssistantMcpSelectorAvailable);
		},
		isRestoreAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAiAssistantMcpSelectionRestoreAvailable);
		},
		mcpAuth(): ?ImModelCopilotMcpAuth
		{
			return this.$store.getters['copilot/chats/getMcpAuth'](this.dialogId);
		},
		selectionStatus(): string
		{
			return this.$store.getters['copilot/chats/getMcpSelectionStatus'](this.dialogId);
		},
		hasSelectedMcpAuth(): boolean
		{
			return Boolean(this.mcpAuth?.id);
		},
		isMcpAuthConfirmedByServer(): boolean
		{
			return this.$store.getters['copilot/chats/isMcpAuthConfirmed'](this.dialogId);
		},
		awaitsMcpAuthConfirmation(): boolean
		{
			return this.isRestoreAvailable && !this.isMcpAuthConfirmedByServer;
		},
		outgoingMcpAuthId(): ?number
		{
			if (this.awaitsMcpAuthConfirmation)
			{
				return null;
			}

			return this.mcpAuth?.id ?? null;
		},
		hasOutgoingMcpAuth(): boolean
		{
			return this.outgoingMcpAuthId !== null;
		},
		chipDesign(): string
		{
			if (this.isRestoreAvailable && this.hasFailedSelection)
			{
				return ChipDesign.OutlineAlert;
			}

			return this.hasOutgoingMcpAuth ? ChipDesign.OutlineAccent2 : ChipDesign.Outline;
		},
		hasFailedSelection(): boolean
		{
			return [CopilotMcpSelectionStatus.error, CopilotMcpSelectionStatus.unavailable]
				.includes(this.selectionStatus);
		},
		withClear(): boolean
		{
			if (!this.isRestoreAvailable)
			{
				return this.hasSelectedMcpAuth;
			}

			return this.hasOutgoingMcpAuth || this.hasFailedSelection;
		},
		defaultIcon(): ?string
		{
			if (this.mcpIcon)
			{
				return null;
			}

			return OutlineIcons.MCP;
		},
		mcpIcon(): ?{ src: string, alt: string }
		{
			if (!this.mcpAuth?.icon)
			{
				return null;
			}

			return {
				src: this.mcpAuth.icon,
				alt: '',
			};
		},
		statusLabel(): ?string
		{
			switch (this.selectionStatus)
			{
				case CopilotMcpSelectionStatus.restoring:
					return this.loc('IM_CONTENT_COPILOT_MCP_STATUS_RESTORING');
				case CopilotMcpSelectionStatus.error:
					return this.loc('IM_CONTENT_COPILOT_MCP_STATUS_ERROR');
				case CopilotMcpSelectionStatus.unavailable:
					return this.loc('IM_CONTENT_COPILOT_MCP_STATUS_UNAVAILABLE');
				default:
					return null;
			}
		},
		selectionLabel(): string
		{
			if (this.isRestoreAvailable && this.statusLabel && !this.hasOutgoingMcpAuth)
			{
				return this.statusLabel;
			}

			return this.mcpAuth?.name ?? this.loc('IM_CONTENT_COPILOT_MCP_INTEGRATIONS');
		},
		isStatusLabelMovedToHint(): boolean
		{
			return this.isRestoreAvailable && Boolean(this.statusLabel) && this.hasOutgoingMcpAuth;
		},
		chipText(): string
		{
			return this.selectionLabel;
		},
		hintText(): string
		{
			return this.isStatusLabelMovedToHint ? this.statusLabel : this.selectionLabel;
		},
		announcedSelection(): AnnouncedSelection
		{
			return { dialogId: this.dialogId, status: this.selectionStatus };
		},
		isHintEnabled(): boolean
		{
			if (this.isSelectorOpened)
			{
				return false;
			}

			return this.isStatusLabelMovedToHint || !this.isExpanded;
		},
	},
	watch: {
		// the chat and its status are watched together, so the guard does not depend on watcher order:
		// neither a chat switch nor the first status the opened chat settles on follows a user action
		announcedSelection(current: AnnouncedSelection, previous: AnnouncedSelection)
		{
			if (current.dialogId !== previous.dialogId)
			{
				this.awaitsSettledStatus = current.status === CopilotMcpSelectionStatus.restoring;

				return;
			}

			if (this.awaitsSettledStatus)
			{
				this.awaitsSettledStatus = false;

				return;
			}

			this.announceStatus();
		},
	},
	created()
	{
		this.awaitsSettledStatus = this.selectionStatus === CopilotMcpSelectionStatus.restoring;
	},
	beforeUnmount()
	{
		this.selector?.destroy();
	},
	methods: {
		announceStatus()
		{
			if (!this.isRestoreAvailable || !this.statusLabel)
			{
				return;
			}

			const politeness = this.selectionStatus === CopilotMcpSelectionStatus.error
				? AriaLive.assertive
				: AriaLive.polite;

			LiveAnnouncer.announce(this.statusLabel, politeness);
		},
		toggle()
		{
			Analytics.getInstance().copilot.onMcpIntegrationClick(this.dialogId);
			if (this.isSelectorOpened)
			{
				this.selector?.hide();

				return;
			}

			if (this.isRestoreAvailable && this.hasFailedSelection)
			{
				this.dismissFailedSelectionLocally();
			}

			this.getSelector().show();
		},
		onMcpAuthChange(mcpAuth: ?ImModelCopilotMcpAuth) {
			if (!mcpAuth)
			{
				this.clear();

				return;
			}

			this.setMcpAuth(mcpAuth);
		},
		// the selector takes its selected auth id only at construction, so it is rebuilt, not reused,
		// once the store moved on
		isSelectorOutdated(): boolean
		{
			if (!this.isRestoreAvailable || this.selectionStatus === CopilotMcpSelectionStatus.restoring)
			{
				return false;
			}

			return this.selectorAuthId !== this.outgoingMcpAuthId;
		},
		getSelector(): McpSelector
		{
			if (this.selector && !this.isSelectorOutdated())
			{
				return this.selector;
			}

			this.selector?.destroy();
			this.selector = null;

			const selectorOptions = {
				context: COPILOT_ANALYTICS_CONTEXT,
				dialogId: this.dialogId,
				targetNode: this.$refs.chip.$el,
				dialogOptions: {
					popupOptions: {
						className: 'mcp-selector-dialog',
					},
				},
				entityOptions: {
					agentMode: false,
				},
				events: {
					onSelect: (event) => {
						const { auth, mcp } = event.getData();
						const selectedMcpAuth = auth
							? {
								id: auth.id,
								name: auth.name,
								icon: mcp.iconUrl,
							}
							: null;

						this.selectorAuthId = selectedMcpAuth?.id ?? null;
						this.onMcpAuthChange(selectedMcpAuth);
					},
					onHide: () => {
						this.isSelectorOpened = false;
					},
					onShow: () => {
						this.isSelectorOpened = true;
					},
				},
			};

			if (this.isRestoreAvailable)
			{
				selectorOptions.selectedAuthId = this.outgoingMcpAuthId;
			}

			this.selectorAuthId = this.isRestoreAvailable ? this.outgoingMcpAuthId : null;
			this.selector = new McpSelector(selectorOptions);

			return this.selector;
		},
		getMcpSelectionService(): McpSelection
		{
			if (!this.mcpSelectionService)
			{
				this.mcpSelectionService = new McpSelection();
			}

			return this.mcpSelectionService;
		},
		setMcpAuth(mcpAuth: ImModelCopilotMcpAuth)
		{
			if (this.isRestoreAvailable)
			{
				void this.getMcpSelectionService().save({ dialogId: this.dialogId, mcpAuth });
			}
			else
			{
				this.$store.dispatch('copilot/chats/setMcpAuth', {
					dialogId: this.dialogId,
					mcpAuth,
					confirmed: true,
				});
			}

			Analytics.getInstance().copilot.onChangeMCP(this.dialogId);
		},
		// the way back from the error state must not depend on a call that can fail the same way
		dismissFailedSelectionLocally()
		{
			void this.$store.dispatch('copilot/chats/setMcpSelectionStatus', {
				dialogId: this.dialogId,
				status: CopilotMcpSelectionStatus.ready,
			});
		},
		clear()
		{
			if (this.isRestoreAvailable && this.hasFailedSelection && !this.hasSelectedMcpAuth)
			{
				this.dismissFailedSelectionLocally();

				return;
			}

			const hadSelectedMcpAuth = this.hasSelectedMcpAuth;

			if (this.isRestoreAvailable)
			{
				void this.getMcpSelectionService().clear(this.dialogId);
			}
			else
			{
				this.$store.dispatch('copilot/chats/clearMcpAuth', this.dialogId);
			}

			if (hadSelectedMcpAuth)
			{
				Analytics.getInstance().copilot.onChangeMCP(this.dialogId);
			}
		},
		// the selector re-emits the cleared selection through onSelect, which runs clear() itself
		onChipClearClick()
		{
			if (this.selector)
			{
				this.selector.clear();

				return;
			}

			this.clear();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ToolbarHint
			v-if="isAvailable"
			:hintEnabled="isHintEnabled"
			:text="hintText"
		>
			<Chip
				ref="chip"
				data-testid="copilot-mcp-chip"
				:text="chipText"
				:trimmable="true"
				:rounded="true"
				:size="ChipSize.Sm"
				:icon="defaultIcon"
				:image="mcpIcon"
				:design="chipDesign"
				:withClear="withClear"
				:collapsed="!isExpanded"
				@click="toggle"
				@clear="onChipClearClick"
			/>
		</ToolbarHint>
	`,
};

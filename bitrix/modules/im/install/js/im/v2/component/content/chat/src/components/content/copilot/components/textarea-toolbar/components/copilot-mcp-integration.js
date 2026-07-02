import { type JsonObject } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { ChipDesign, ChipSize, Chip } from 'ui.system.chip.vue';

import { McpSelector } from 'aiassistant.mcp-selector';
import { type ImModelCopilotMcpAuth } from 'im.v2.model';

import { ToolbarHint } from './toolbar-hint';

const COPILOT_ANALYTICS_CONTEXT = 'copilot_chat';

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
		mcpAuth(): ?ImModelCopilotMcpAuth
		{
			return this.$store.getters['copilot/chats/getMcpAuth'](this.dialogId);
		},
		hasSelectedMcpAuth(): boolean
		{
			return Boolean(this.mcpAuth?.id);
		},
		chipDesign(): string
		{
			return this.hasSelectedMcpAuth ? ChipDesign.OutlineAccent2 : ChipDesign.Outline;
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
		chipText(): string
		{
			return this.mcpAuth?.name ?? this.loc('IM_CONTENT_COPILOT_MCP_INTEGRATIONS');
		},
		hintText(): string
		{
			return this.mcpAuth?.name ?? this.loc('IM_CONTENT_COPILOT_MCP_INTEGRATIONS');
		},
		isHintEnabled(): boolean
		{
			if (this.isSelectorOpened)
			{
				return false;
			}

			return !this.isExpanded;
		},
	},
	beforeUnmount()
	{
		this.selector?.destroy();
	},
	methods: {
		toggle()
		{
			if (this.isSelectorOpened)
			{
				this.getSelector().hide();

				return;
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
		getSelector(): McpSelector
		{
			if (this.selector)
			{
				return this.selector;
			}

			this.selector = new McpSelector({
				context: COPILOT_ANALYTICS_CONTEXT,
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

						this.onMcpAuthChange(selectedMcpAuth);
					},
					onHide: () => {
						this.isSelectorOpened = false;
					},
					onShow: () => {
						this.isSelectorOpened = true;
					},
				},
			});

			return this.selector;
		},
		setMcpAuth(mcpAuth: ImModelCopilotMcpAuth)
		{
			this.$store.dispatch('copilot/chats/setMcpAuth', {
				dialogId: this.dialogId,
				mcpAuth,
			});
		},
		clear()
		{
			this.$store.dispatch('copilot/chats/clearMcpAuth', this.dialogId);
		},
		onChipClearClick()
		{
			this.selector?.clear();
			this.clear();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ToolbarHint
			:hintEnabled="isHintEnabled"
			:text="hintText"
		>
			<Chip
				ref="chip"
				:text="chipText"
				:trimmable="true"
				:rounded="true"
				:size="ChipSize.Sm"
				:icon="defaultIcon"
				:image="mcpIcon"
				:design="chipDesign"
				:withClear="hasSelectedMcpAuth"
				:collapsed="!isExpanded"
				@click="toggle"
				@clear="onChipClearClick"
			/>
		</ToolbarHint>
	`,
};

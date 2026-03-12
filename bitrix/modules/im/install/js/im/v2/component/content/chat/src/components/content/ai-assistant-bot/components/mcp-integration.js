import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { ChipDesign, ChipSize, Chip } from 'ui.system.chip.vue';
import { McpSelector } from 'aiassistant.mcp-selector';

import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { McpHintService } from '../classes/mcp-hint-service';

import './css/mcp-integration.css';

import type { JsonObject } from 'main.core';

const MAX_INTEGRATION_NAME_LENGTH = 20;
const MARTA_ANALYTICS_CONTEXT = 'marta_chat';

// @vue/component
export const McpIntegration = {
	name: 'McpIntegration',
	components: { Chip },
	data(): JsonObject
	{
		return {
			isSelectorOpened: false,
			mcpAuth: {
				id: null,
				name: null,
				icon: null,
			},
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		ChipDesign: () => ChipDesign,
		ChipSize: () => ChipSize,
		hasSelectedMcpAuth(): boolean
		{
			return this.mcpAuth.id !== null;
		},
		chipDesign(): string
		{
			if (this.hasSelectedMcpAuth)
			{
				return ChipDesign.OutlineAccent2;
			}

			return ChipDesign.Outline;
		},
		isAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.aiAssistantMcpSelectorAvailable);
		},
		defaultIcon(): ?string
		{
			if (this.mcpIcon)
			{
				return null;
			}

			return OutlineIcons.APPS;
		},
		mcpIcon(): ?{ src: string, alt: '' }
		{
			if (!this.mcpAuth.icon)
			{
				return null;
			}

			return {
				src: this.mcpAuth.icon,
				alt: '',
			};
		},
		chipName(): string
		{
			if (!this.mcpAuth.name)
			{
				return this.loc('IM_CONTENT_AI_ASSISTANT_MCP_INTEGRATIONS');
			}

			const needEllipsis = this.mcpAuth.name.length > MAX_INTEGRATION_NAME_LENGTH;
			if (needEllipsis)
			{
				return `${this.mcpAuth.name.slice(0, MAX_INTEGRATION_NAME_LENGTH)}...`;
			}

			return this.mcpAuth.name;
		},
	},
	beforeUnmount()
	{
		this.clear();
		this.selector?.destroy();
	},
	methods: {
		toggle()
		{
			Analytics.getInstance().aiAssistant.onMcpIntegrationClick();

			if (this.isSelectorOpened)
			{
				this.getSelector().hide();

				return;
			}

			this.getSelector().show();
		},
		getSelector(): McpSelector
		{
			if (this.selector)
			{
				return this.selector;
			}

			this.selector = new McpSelector({
				context: MARTA_ANALYTICS_CONTEXT,
				targetNode: this.$refs.selector,
				dialogOptions: {
					popupOptions: {
						className: 'mcp-selector-dialog', // widget z-index fix
					},
				},
				entityOptions: {
					agentMode: false,
				},
				events: {
					onSelect: (event) => {
						const { auth, mcp } = event.getData();
						if (!auth)
						{
							this.clear();

							return;
						}

						this.setMcpAuth({
							id: auth.id,
							name: auth.name,
							icon: mcp.iconUrl,
						});
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
		setMcpAuth(mcpAuth: {id: number, name: string, icon: string})
		{
			this.mcpAuth = mcpAuth;
			this.$store.dispatch('aiAssistant/setMcpAuthId', this.mcpAuth.id);
			(new McpHintService()).sendSelectionHintOnce(this.mcpAuth.id);
		},
		clear()
		{
			this.mcpAuth = {
				id: null,
				name: null,
				icon: null,
			};
			this.$store.dispatch('aiAssistant/setMcpAuthId', null);
		},
		onChipClearClick()
		{
			this.selector.clear();
			this.clear();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<span v-if="isAvailable" ref="selector" class="bx-im-mcp-integration__container">
			<Chip
				:text="chipName"
				:rounded="true"
				:size="ChipSize.Sm"
				:dropdown="!hasSelectedMcpAuth"
				:icon="defaultIcon"
				:image="mcpIcon"
				:design="chipDesign"
				:withClear="hasSelectedMcpAuth"
				@click="toggle"
				@clear="onChipClearClick"
			/>
		</span>
	`,
};

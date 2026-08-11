import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { ModeButton } from './components/mode-button';
import { ReasoningButton } from './components/reasoning-button';
import { CopilotMcpIntegration } from './components/copilot-mcp-integration';
import { SearchButton } from './components/search-button';
import { AgentModeButton } from '../agent-mode-button';

import '../../css/toolbar-buttons.css';

const COMPACT_MODE_BREAKPOINT = 400;

const ButtonKey = {
	mode: 'mode',
	search: 'search',
};

const DEFAULT_EXPANDED = ButtonKey.search;

// @vue/component
export const ToolbarButtons = {
	name: 'ToolbarButtons',
	components: { ModeButton, ReasoningButton, CopilotMcpIntegration, SearchButton, AgentModeButton },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): { isCompact: boolean }
	{
		return {
			isCompact: false,
		};
	},
	computed: {
		isTempChat(): boolean
		{
			return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
		},
		expandedKey(): ?string
		{
			if (!this.isCompact)
			{
				return null;
			}

			if (this.isReasoningEnabled)
			{
				return ButtonKey.mode;
			}

			return DEFAULT_EXPANDED;
		},
		isModeExpanded(): boolean
		{
			return !this.isCompact || this.expandedKey === ButtonKey.mode;
		},
		isSearchExpanded(): boolean
		{
			return !this.isCompact || this.expandedKey === ButtonKey.search;
		},
		isMcpExpanded(): boolean
		{
			return !this.isCompact;
		},
		isSearchAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCopilotForceSearchAvailable);
		},
		isAgentModeAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAiAssistantAgentModeAvailable);
		},
		isReasoningEnabled(): boolean
		{
			return this.$store.getters['copilot/chats/isReasoningEnabled'](this.dialogId);
		},
	},
	mounted()
	{
		this.initResizeObserver();
	},
	beforeUnmount()
	{
		this.getResizeObserver().disconnect();
	},
	methods: {
		initResizeObserver()
		{
			this.resizeObserver = new ResizeObserver(([entry]) => {
				this.onResize(entry.contentRect.width);
			});
			this.resizeObserver.observe(this.$refs.container);
		},
		onResize(width: number)
		{
			this.isCompact = width <= COMPACT_MODE_BREAKPOINT;
		},
		onClearMode()
		{
			if (this.isTempChat)
			{
				return;
			}

			this.$store.dispatch('copilot/chats/toggleReasoning', this.dialogId);
			Analytics.getInstance().copilot.onToggleReasoning(this.dialogId);
		},
		getResizeObserver(): ResizeObserver
		{
			return this.resizeObserver;
		},
	},
	template: `
		<div ref="container" class="bx-im-copilot-textarea__left-buttons"
		>
			<ModeButton
				:dialogId="dialogId"
				:isActive="isReasoningEnabled"
				:isExpanded="isModeExpanded"
				@clearMode="onClearMode"
			/>
			<CopilotMcpIntegration
				:dialogId="dialogId"
				:isExpanded="isMcpExpanded"
			/>
			<SearchButton
				v-if="isSearchAvailable"
				:dialogId="dialogId"
				:isExpanded="isSearchExpanded"
			/>
			<AgentModeButton
				v-if="isAgentModeAvailable"
				:dialogId="dialogId"
			/>
		</div>
	`,
};

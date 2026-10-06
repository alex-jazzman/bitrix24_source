import './agent-glow.css';

// Decorative layer only: whether a card shows it is decided by the card itself.
// @vue/component
export const AgentGlow = {
	name: 'BizprocdesignerAgentGlow',
	template: `
		<span
			class="editor-chart-agent-glow"
			data-testid="bizprocdesigner-editor-agent-glow"
			aria-hidden="true"
		>
			<span class="editor-chart-agent-glow__blur">
				<span class="editor-chart-agent-glow__ring --glow"></span>
			</span>
			<span
				class="editor-chart-agent-glow__ring --edge"
				data-testid="bizprocdesigner-editor-agent-glow-ring-edge"
			></span>
		</span>
	`,
};

import { Dom, Loc, Text } from 'main.core';
import { HtmlFormatter } from 'ui.bbcode.formatter.html-formatter';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';

import { ViewMode, type ViewMode as ViewModeValue } from '../../const/view-mode';
import { isViewMode, resolveViewMode } from '../../feature/view-mode/view-mode';
import {
	NavigationPanelAdapter,
	type NavigationPanelItem,
} from './navigation-panel-adapter';

import './hint-view.css';

type HintViewData = {
	ViewMode: typeof ViewMode,
	selectedMode: ViewModeValue,
	formatter: HtmlFormatter,
	navigation: NavigationPanelAdapter | null,
	navigationItemIdPrefix: string,
	renderedPrompt: string | null,
	renderedTarget: HTMLElement | null,
};

export const HintView = defineComponent({
	name: 'CrmCopilotCallHintView',
	props: {
		prompt: {
			type: String,
			default: '',
		},
		isHintEnabled: {
			type: Boolean,
			default: false,
		},
		hasHint: {
			type: Boolean,
			default: false,
		},
		mode: {
			type: String as PropType<ViewModeValue | null>,
			default: null,
			validator: (mode: unknown): boolean => mode === null || isViewMode(mode),
		},
	},
	emits: {
		select: (mode: ViewModeValue): boolean => isViewMode(mode),
	},
	data(): HintViewData
	{
		return {
			ViewMode,
			selectedMode: resolveViewMode(this.hasHint, this.mode),
			formatter: markRaw(new HtmlFormatter()),
			navigation: null,
			navigationItemIdPrefix: `crm-copilot-call-hint-${Text.getRandom(8)}`,
			renderedPrompt: null,
			renderedTarget: null,
		};
	},
	computed: {
		isHintAvailable(): boolean
		{
			return this.hasHint === true;
		},
	},
	watch: {
		hasHint(): void
		{
			this.refresh();
		},
		mode(): void
		{
			this.refresh();
		},
	},
	mounted(): void
	{
		this.syncNavigation();
		this.renderHint();
	},
	updated(): void
	{
		this.syncNavigation();
		this.renderHint();
	},
	beforeUnmount(): void
	{
		this.navigation?.destroy();
		this.navigation = null;
	},
	methods: {
		refresh(): void
		{
			this.selectedMode = resolveViewMode(this.hasHint, this.mode);
		},
		select(mode: ViewModeValue): void
		{
			if (!this.isHintAvailable || !isViewMode(mode) || mode === this.selectedMode)
			{
				return;
			}

			this.selectedMode = mode;
			this.$emit('select', mode);
		},
		getNavigationItems(): NavigationPanelItem[]
		{
			return [
				{
					id: `${this.navigationItemIdPrefix}-hint`,
					title: Loc.getMessage('CRM_COPILOT_CALL_HINT_TAB_HINT') ?? '',
					active: this.selectedMode === ViewMode.Hint,
					events: { click: () => this.select(ViewMode.Hint) },
					link: { 'data-testid': 'crm-copilot-call-hint-action-hint' },
				},
				{
					id: `${this.navigationItemIdPrefix}-rules`,
					title: Loc.getMessage('CRM_COPILOT_CALL_HINT_TAB_RULES') ?? '',
					active: this.selectedMode === ViewMode.Rules,
					events: { click: () => this.select(ViewMode.Rules) },
					link: { 'data-testid': 'crm-copilot-call-hint-action-rules' },
				},
			];
		},
		syncNavigation(): void
		{
			const target = this.$refs.navigation as HTMLElement | undefined;
			if (!this.isHintAvailable || !target)
			{
				this.navigation?.destroy();
				this.navigation = null;

				return;
			}

			this.navigation ??= markRaw(new NavigationPanelAdapter(target));
			this.navigation.render(
				this.getNavigationItems(),
				Loc.getMessage('CRM_COPILOT_CALL_HINT_NAVIGATION_ARIA_LABEL') ?? '',
			);
		},
		renderHint(): void
		{
			const target = this.$refs.hintContent as HTMLElement | undefined;
			if (!target || this.selectedMode !== ViewMode.Hint || !this.isHintAvailable)
			{
				return;
			}

			if (target === this.renderedTarget && this.prompt === this.renderedPrompt)
			{
				return;
			}

			const content = this.formatter.format({ source: this.prompt });
			Dom.clean(target);
			if (content !== null)
			{
				target.append(content);
			}
			this.renderedTarget = markRaw(target);
			this.renderedPrompt = this.prompt;
		},
	},
	template: `
		<section class="crm-copilot-call-hint" data-testid="crm-copilot-call-hint">
			<div
				v-if="isHintAvailable"
				ref="navigation"
				class="crm-copilot-call-hint__navigation"
				data-testid="crm-copilot-call-hint-navigation"
			></div>
			<div
				v-if="isHintAvailable && selectedMode === ViewMode.Hint"
				class="crm-copilot-call-hint__hint"
			>
				<div
					ref="hintContent"
					class="crm-copilot-call-hint__content ui-typography-container"
					data-testid="crm-copilot-call-hint-content"
				></div>
			</div>
			<div v-else class="crm-copilot-call-hint__rules">
				<slot name="rules"></slot>
			</div>
		</section>
	`,
});

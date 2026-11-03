/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_bbcode_formatter_htmlFormatter, ui_vue3, ui_navigationpanel) {
	'use strict';

	const ViewMode = Object.freeze({
		Hint: 'hint',
		Rules: 'rules'
	});

	function isViewMode(mode) {
		return mode === ViewMode.Hint || mode === ViewMode.Rules;
	}
	function resolveViewMode(hasHint, preferredMode) {
		if (hasHint !== true) {
			return ViewMode.Rules;
		}
		return isViewMode(preferredMode) ? preferredMode : ViewMode.Hint;
	}

	class NavigationPanelAdapter {
		#panel = null;
		#target;
		constructor(target) {
			this.#target = target;
		}
		render(items, ariaLabel) {
			if (this.#panel === null) {
				this.#panel = new ui_navigationpanel.NavigationPanel({
					target: this.#target,
					items,
					ariaLabel
				});
				this.#panel.init();
				return;
			}
			const activeItem = items.find(item => item.active);
			const panelItem = activeItem ? this.#panel.getItemById(activeItem.id) : null;
			if (panelItem && !panelItem.active) {
				panelItem.activate();
			}
		}
		destroy() {
			if (this.#panel === null) {
				return;
			}
			this.#panel.items.forEach(item => item.closeMenu?.());
			main_core.Dom.clean(this.#target);
			this.#panel = null;
		}
	}

	const HintView = ui_vue3.defineComponent({
		name: 'CrmCopilotCallHintView',
		props: {
			prompt: {
				type: String,
				default: ''
			},
			isHintEnabled: {
				type: Boolean,
				default: false
			},
			hasHint: {
				type: Boolean,
				default: false
			},
			mode: {
				type: String,
				default: null,
				validator: mode => mode === null || isViewMode(mode)
			}
		},
		emits: {
			select: mode => isViewMode(mode)
		},
		data() {
			return {
				ViewMode,
				selectedMode: resolveViewMode(this.hasHint, this.mode),
				formatter: ui_vue3.markRaw(new ui_bbcode_formatter_htmlFormatter.HtmlFormatter()),
				navigation: null,
				navigationItemIdPrefix: `crm-copilot-call-hint-${main_core.Text.getRandom(8)}`,
				renderedPrompt: null,
				renderedTarget: null
			};
		},
		computed: {
			isHintAvailable() {
				return this.hasHint === true;
			}
		},
		watch: {
			hasHint() {
				this.refresh();
			},
			mode() {
				this.refresh();
			}
		},
		mounted() {
			this.syncNavigation();
			this.renderHint();
		},
		updated() {
			this.syncNavigation();
			this.renderHint();
		},
		beforeUnmount() {
			this.navigation?.destroy();
			this.navigation = null;
		},
		methods: {
			refresh() {
				this.selectedMode = resolveViewMode(this.hasHint, this.mode);
			},
			select(mode) {
				if (!this.isHintAvailable || !isViewMode(mode) || mode === this.selectedMode) {
					return;
				}
				this.selectedMode = mode;
				this.$emit('select', mode);
			},
			getNavigationItems() {
				return [{
					id: `${this.navigationItemIdPrefix}-hint`,
					title: main_core.Loc.getMessage('CRM_COPILOT_CALL_HINT_TAB_HINT') ?? '',
					active: this.selectedMode === ViewMode.Hint,
					events: {
						click: () => this.select(ViewMode.Hint)
					},
					link: {
						'data-testid': 'crm-copilot-call-hint-action-hint'
					}
				}, {
					id: `${this.navigationItemIdPrefix}-rules`,
					title: main_core.Loc.getMessage('CRM_COPILOT_CALL_HINT_TAB_RULES') ?? '',
					active: this.selectedMode === ViewMode.Rules,
					events: {
						click: () => this.select(ViewMode.Rules)
					},
					link: {
						'data-testid': 'crm-copilot-call-hint-action-rules'
					}
				}];
			},
			syncNavigation() {
				const target = this.$refs.navigation;
				if (!this.isHintAvailable || !target) {
					this.navigation?.destroy();
					this.navigation = null;
					return;
				}
				this.navigation ??= ui_vue3.markRaw(new NavigationPanelAdapter(target));
				this.navigation.render(this.getNavigationItems(), main_core.Loc.getMessage('CRM_COPILOT_CALL_HINT_NAVIGATION_ARIA_LABEL') ?? '');
			},
			renderHint() {
				const target = this.$refs.hintContent;
				if (!target || this.selectedMode !== ViewMode.Hint || !this.isHintAvailable) {
					return;
				}
				if (target === this.renderedTarget && this.prompt === this.renderedPrompt) {
					return;
				}
				const content = this.formatter.format({
					source: this.prompt
				});
				main_core.Dom.clean(target);
				if (content !== null) {
					target.append(content);
				}
				this.renderedTarget = ui_vue3.markRaw(target);
				this.renderedPrompt = this.prompt;
			}
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
	`
	});

	const PreferenceOptionName = Object.freeze({
		Call: 'copilot_call_hint_call',
		Assessment: 'copilot_call_hint_assessment'
	});
	class Preference {
		#optionName;
		constructor(optionName) {
			if (!Object.values(PreferenceOptionName).includes(optionName)) {
				throw new TypeError('Unknown call hint preference option name');
			}
			this.#optionName = optionName;
		}
		resolve(hasHint, preferredMode) {
			return resolveViewMode(hasHint, preferredMode);
		}
		save(mode) {
			if (!isViewMode(mode)) {
				return;
			}
			const {
				userOptions
			} = window.BX;
			userOptions.save('crm', this.#optionName, 'mode', mode, false);
		}
	}

	exports.HintView = HintView;
	exports.Preference = Preference;
	exports.PreferenceOptionName = PreferenceOptionName;
	exports.ViewMode = ViewMode;
	exports.isViewMode = isViewMode;
	exports.resolveViewMode = resolveViewMode;

})(this.BX.Crm.Copilot = this.BX.Crm.Copilot || {}, BX, BX.UI.BBCode.Formatter, BX.Vue3, BX.UI);
//# sourceMappingURL=call-hint.bundle.js.map

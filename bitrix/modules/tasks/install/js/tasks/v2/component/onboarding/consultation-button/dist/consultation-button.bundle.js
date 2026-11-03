/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, ui_bannerDispatcher, ui_vue3, ui_vue3_mixins_locMixin, spotlight, ui_system_typography_vue, tasks_v2_component_elements_hint) {
	'use strict';

	// @vue/component
	const ConsultationAha = {
		components: {
			Hint: tasks_v2_component_elements_hint.Hint,
			TextMd: ui_system_typography_vue.TextMd,
			HeadlineSm: ui_system_typography_vue.HeadlineSm
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			},
			close: {
				type: Function,
				required: true
			}
		},
		data() {
			return {
				pulsar: null
			};
		},
		mounted() {
			// standard product aha-moment pulse (main.spotlight)
			this.pulsar = new BX.SpotLight({
				targetElement: this.bindElement,
				targetVertex: 'middle-center',
				color: 'var(--ui-color-primary)'
			});
			this.pulsar.show();
		},
		beforeUnmount() {
			if (this.pulsar) {
				this.pulsar.close();
				this.pulsar = null;
			}
		},
		template: `
		<Hint
			:bindElement
			:options="{
				closeIcon: true,
				maxWidth: 520,
				padding: 0,
				ariaLabel: loc('TASKS_COMPONENT_ONBOARDING_CONSULTATION_BUTTON_TITLE'),
				focusTrap: {
					initialFocus: true,
					restoreFocus: bindElement,
				},
			}"
			@close="close"
		>
			<div class="tasks-consultation-aha">
				<div class="tasks-consultation-aha__image"/>
				<div class="tasks-consultation-aha__info">
					<HeadlineSm tag="h2" class="tasks-consultation-aha__text">
						{{ loc('TASKS_COMPONENT_ONBOARDING_CONSULTATION_BUTTON_TITLE') }}
					</HeadlineSm>
					<TextMd class="tasks-consultation-aha__text">
						{{ loc('TASKS_COMPONENT_ONBOARDING_CONSULTATION_BUTTON_TEXT') }}
					</TextMd>
				</div>
			</div>
		</Hint>
	`
	};

	const PROMOTION_ID = 'tasks_consultation_button';
	const BIND_ELEMENT_ID = 'tasks-feedback-button';
	class ConsultationButton {
		#application = null;
		static show() {
			new this().showTooltip();
		}
		showTooltip() {
			const bindElement = document.getElementById(BIND_ELEMENT_ID);
			if (!bindElement) {
				return;
			}
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				const container = document.createElement('div');
				this.#application = ui_vue3.BitrixVue.createApp(ConsultationAha, {
					bindElement,
					close: () => this.#destroy(onDone)
				});
				this.#application.mixin(ui_vue3_mixins_locMixin.locMixin);
				this.#application.mount(container);
				this.setViewed();
			});
		}
		#destroy(onDone) {
			if (this.#application) {
				this.#application.unmount();
				this.#application = null;
				onDone();
			}
		}
		setViewed() {
			void main_core.ajax.runAction('tasks.promotion.setViewed', {
				data: {
					promotion: PROMOTION_ID
				}
			});
		}
	}

	exports.ConsultationButton = ConsultationButton;

})(this.BX.Tasks.V2.Component.Onboarding = this.BX.Tasks.V2.Component.Onboarding || {}, BX, BX.UI, BX.Vue3, BX.Vue3.Mixins, BX, BX.UI.System.Typography.Vue, BX.Tasks.V2.Component.Elements);
//# sourceMappingURL=consultation-button.bundle.js.map

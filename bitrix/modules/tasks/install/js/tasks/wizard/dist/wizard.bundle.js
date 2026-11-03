/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_buttons) {
	'use strict';

	class Wizard {
		#params;
		#layout;
		#steps;
		constructor(params) {
			this.#params = params;
			this.#steps = params.steps;
			this.#layout = {};
		}
		render() {
			const wrap = main_core.Tag.render`
			<div class="tasks-wizard__container tasks-wizard__scope">
				${this.#renderStepHeader(this.#steps)}
				${this.#renderStepContainer(this.#steps)}
			</div>
		`;
			this.#openStep(this.#steps[0]);
			return wrap;
		}
		getCurrentStep() {
			return this.#steps[this.getCurrentStepIndex()];
		}
		update() {
			this.#updateStepsAvailability();
		}
		initHints() {
			this.#steps.forEach(step => {
				step.hintManager = top.BX.UI.Hint.createInstance({
					id: `tasks-flow-edit-form-${step.id}-${main_core.Text.getRandom()}`,
					className: 'skipInitByClassName',
					popupParameters: {
						targetContainer: step.node
					}
				});
				step.hintManager.init(step.node);
			});
		}
		hideHints() {
			this.#steps.forEach(step => {
				step.hintManager?.hide();
			});
		}
		#getPreviousStep() {
			return this.#steps[this.getCurrentStepIndex() - 1];
		}
		#updateStepsAvailability() {
			let isAvailable = true;
			for (const step of this.#steps) {
				if (isAvailable) {
					main_core.Dom.removeClass(step.titleNode, '--unavailable');
				} else {
					main_core.Dom.addClass(step.titleNode, '--unavailable');
				}
				const isStepUnavailable = main_core.Type.isFunction(step.isFilled) && !step.isFilled();
				isAvailable = isAvailable && !isStepUnavailable;
				if (step.selected) {
					this.#layout.continueButton.setState(isAvailable ? null : ui_buttons.ButtonState.DISABLED);
				}
			}
			this.#layout.finishButton.setState(isAvailable ? null : ui_buttons.ButtonState.DISABLED);
			if (this.#layout.saveChangesButton) {
				this.#layout.saveChangesButton.setState(isAvailable ? null : ui_buttons.ButtonState.DISABLED);
			}
		}
		getCurrentStepIndex() {
			for (const [index, step] of this.#steps.entries()) {
				if (step.selected) {
					return index;
				}
			}
			return 0;
		}
		#renderStepHeader(steps) {
			const firstSteps = steps.slice(0, -1);
			const lastStep = steps.slice(-1)[0];
			return main_core.Tag.render`
			<div class="tasks-wizard__step_header">
				${firstSteps.map(step => this.#renderStepTitle(step, false))}
				${this.#renderStepTitle(lastStep, true)}
			</div>
		`;
		}
		#renderStepTitle(step, isLast) {
			const arrow = isLast ? null : main_core.Tag.render`
			<div class="ui-icon-set --chevron-right" style="--ui-icon-set__icon-size: 15px;"></div>
		`;
			step.titleNode = main_core.Tag.render`
			<span
				class="tasks-wizard__step_name ${step.selected ? '--selected' : ''}"
				data-id="tasks-wizard-step-${step.id}"
			>${step.title}</span>
		`;
			main_core.Event.bind(step.titleNode, 'click', () => this.#openStep(step));
			return main_core.Tag.render`
			<span class="tasks-wizard__step_name-container">
				${step.titleNode}
				${arrow}
			</span>
		`;
		}
		#renderStepContainer(steps) {
			return main_core.Tag.render`
			<div class="tasks-wizard__step_container">
				${steps.map(step => this.#renderStep(step))}
				${this.#renderButtonsContainer()}
			</div>
		`;
		}
		#renderButtonsContainer() {
			return main_core.Tag.render`
			<div class="tasks-wizard__step_buttons-container">
				${this.#renderBackButton()}
				${this.#renderCancelButton()}
				${this.#renderContinueButton()}
				${this.#renderFinishButton()}
				${this.#renderSaveChangesButton()}
				${this.#renderArticle()}
			</div>
		`;
		}
		#renderArticle() {
			if (!main_core.Type.isNumber(this.#params.article)) {
				return '';
			}
			const article = main_core.Tag.render`
			<div class="tasks-wizard__article">
				<span class="ui-icon-set --help"></span>
				${main_core.Loc.getMessage('TASKS_WIZARD_HELP')}
			</div>
		`;
			main_core.Event.bind(article, 'click', this.#openHelpDesk.bind(this));
			return article;
		}
		#openHelpDesk() {
			top.BX.Helper.show(`redirect=detail&code=${this.#params.article}`);
		}
		#renderStep(step) {
			const fadeTop = main_core.Tag.render`
			<div class="tasks-wizard__step_fade --top"></div>
		`;
			const fadeBottom = main_core.Tag.render`
			<div class="tasks-wizard__step_fade"></div>
		`;
			step.node = main_core.Tag.render`
			<div class="tasks-wizard__step ${step.selected ? '--selected' : ''}">
				${fadeTop}
				${step.content}
				${fadeBottom}
			</div>
		`;
			const observer = new IntersectionObserver(() => {
				if (step.node.offsetWidth > 0) {
					this.#updateFade(step.node, fadeTop, fadeBottom);
					observer.disconnect();
				}
			});
			observer.observe(step.node);
			main_core.Event.bind(step.node, 'scroll', () => this.#updateFade(step.node, fadeTop, fadeBottom));
			this.#subscribeToPopupInit(step.node);
			return step.node;
		}
		#subscribeToPopupInit(stepContainer) {
			main_core_events.EventEmitter.subscribe('BX.Main.Popup:onInit', event => {
				const data = event.getCompatData();
				const bindElement = data[1];
				const params = data[2];
				if (main_core.Type.isDomNode(bindElement) && stepContainer.contains(bindElement)) {
					params.targetContainer = stepContainer;
				}
			});
		}
		#updateFade(container, fadeTop, fadeBottom) {
			const scrollTop = container.scrollTop;
			const maxScroll = container.scrollHeight - container.offsetHeight;
			const scrolledToBottom = Math.abs(scrollTop - maxScroll) < 1;
			if (scrollTop === 0) {
				main_core.Dom.removeClass(fadeTop, '--show');
			} else {
				main_core.Dom.addClass(fadeTop, '--show');
			}
			if (scrolledToBottom) {
				main_core.Dom.removeClass(fadeBottom, '--show');
			} else {
				main_core.Dom.addClass(fadeBottom, '--show');
			}
		}
		#renderBackButton() {
			this.#layout.backButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_BACK'),
				color: ui_buttons.Button.Color.LIGHT_BORDER,
				round: true,
				size: BX.UI.Button.Size.LARGE,
				onclick: () => {
					this.#openStep(this.#getPreviousStep());
				}
			});
			this.#layout.backButton.setDataSet({
				id: 'tasks-wizard-flow-back'
			});
			return this.#layout.backButton.render();
		}
		#renderCancelButton() {
			this.#layout.cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_CANCEL'),
				color: ui_buttons.Button.Color.LIGHT_BORDER,
				round: true,
				size: BX.UI.Button.Size.LARGE,
				onclick: () => this.#params.onCancel()
			});
			this.#layout.cancelButton.setDataSet({
				id: 'tasks-wizard-flow-cancel'
			});
			return this.#layout.cancelButton.render();
		}
		#renderContinueButton() {
			this.#layout.continueButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('TASKS_FLOW_EDIT_FORM_CONTINUE'),
				color: ui_buttons.Button.Color.LIGHT_BORDER,
				round: true,
				size: BX.UI.Button.Size.LARGE,
				onclick: this.#onContinueButtonClickHandler.bind(this)
			});
			this.#layout.continueButton.setDataSet({
				id: 'tasks-wizard-flow-continue'
			});
			return this.#layout.continueButton.render();
		}
		async #onContinueButtonClickHandler() {
			if (this.#layout.continueButton.getState() === ui_buttons.ButtonState.DISABLED) {
				this.#params.onDisabledContinueButtonClick?.();
				return;
			}
			if (main_core.Type.isFunction(this.#params.onContinueHandler) && this.#layout.continueButton.getState() === null) {
				const canContinue = await this.#params.onContinueHandler();
				if (!canContinue) {
					return;
				}
			}
			const currentStep = this.getCurrentStepIndex();
			const nextStep = currentStep + 1;
			this.#openStep(this.#steps[nextStep]);
		}
		#renderFinishButton() {
			this.#layout.finishButton = this.#params.finishButton;
			this.#layout.finishButton?.setDataSet({
				id: 'tasks-wizard-flow-finish'
			});
			return this.#layout.finishButton.render();
		}
		#renderSaveChangesButton() {
			this.#layout.saveChangesButton = this.#params.saveChangesButton;
			this.#layout.saveChangesButton?.setDataSet({
				id: 'tasks-wizard-flow-save'
			});
			return this.#layout.saveChangesButton?.render();
		}
		#openStep(currentStep) {
			const index = this.#steps.findIndex(step => step.id === currentStep.id);
			this.#steps.forEach(step => {
				step.selected = false;
				main_core.Dom.removeClass(step.titleNode, '--selected');
				main_core.Dom.removeClass(step.node, '--selected');
			});
			currentStep.selected = true;
			main_core.Dom.addClass(currentStep.titleNode, '--selected');
			main_core.Dom.addClass(currentStep.node, '--selected');
			main_core.Dom.style(this.#layout.finishButton.getContainer(), 'display', 'none');
			main_core.Dom.style(this.#layout.continueButton.getContainer(), 'display', '');
			if (this.#layout.saveChangesButton) {
				main_core.Dom.style(this.#layout.saveChangesButton.getContainer(), 'display', '');
			}
			if (index === this.#steps.length - 1) {
				main_core.Dom.style(this.#layout.finishButton.getContainer(), 'display', '');
				main_core.Dom.style(this.#layout.continueButton.getContainer(), 'display', 'none');
				if (this.#layout.saveChangesButton) {
					main_core.Dom.style(this.#layout.saveChangesButton.getContainer(), 'display', 'none');
				}
			}
			if (index > 0) {
				main_core.Dom.style(this.#layout.backButton.getContainer(), 'display', '');
				main_core.Dom.style(this.#layout.cancelButton.getContainer(), 'display', 'none');
			} else {
				main_core.Dom.style(this.#layout.backButton.getContainer(), 'display', 'none');
				main_core.Dom.style(this.#layout.cancelButton.getContainer(), 'display', '');
			}
			this.#updateStepsAvailability();
		}
	}

	exports.Wizard = Wizard;

})(this.BX.Tasks = this.BX.Tasks || {}, BX, BX.Event, BX.UI);
//# sourceMappingURL=wizard.bundle.js.map

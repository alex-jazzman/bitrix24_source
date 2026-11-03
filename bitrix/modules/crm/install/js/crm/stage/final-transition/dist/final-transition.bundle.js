/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_notification, crm_stage_entityText, ui_buttons, ui_a11y, ui_system_dialog, crm_stage_descriptionTooltip) {
	'use strict';

	const DIALOG_WIDTH = 480;
	const DIALOG_TITLE_CLASS = 'crm-stage-final-transition__title';
	function syncTitleHint(titleNode) {
		if (titleNode.scrollHeight > titleNode.clientHeight) {
			titleNode.setAttribute('title', titleNode.textContent ?? '');
		} else {
			titleNode.removeAttribute('title');
		}
	}
	function centerInVisibleWidth(container) {
		const visibleWidth = document.documentElement.clientWidth;
		const left = window.scrollX + Math.max(0, (visibleWidth - container.offsetWidth) / 2);
		main_core.Dom.style(container, 'left', `${left}px`);
	}

	class FinalTransitionModel {
		#currentStage;
		#successStage;
		#failureStages;
		#entityTitle;
		#entityTextContext;
		#onMoveToStage;
		#onUndo;
		#isMoveCancelled;
		#canMoveToStage;
		#onMovePermissionDenied;
		#analytics;
		#undoTargetStatusId = '';
		#isUndoing = false;
		constructor(options) {
			this.#currentStage = FinalTransitionModel.cloneStage(options.currentStage);
			this.#successStage = FinalTransitionModel.cloneStage(options.successStage);
			this.#failureStages = main_core.Type.isArray(options.failureStages) ? options.failureStages.map(stage => FinalTransitionModel.cloneStage(stage)) : [];
			this.#entityTitle = main_core.Type.isStringFilled(options.entityTitle) ? options.entityTitle : '';
			this.#entityTextContext = main_core.Type.isPlainObject(options.entityTextContext) ? {
				...options.entityTextContext
			} : {};
			this.#onMoveToStage = options.onMoveToStage;
			this.#onUndo = options.onUndo;
			this.#isMoveCancelled = main_core.Type.isFunction(options.isMoveCancelled) ? options.isMoveCancelled : () => false;
			this.#canMoveToStage = main_core.Type.isFunction(options.canMoveToStage) ? options.canMoveToStage : () => true;
			this.#onMovePermissionDenied = main_core.Type.isFunction(options.onMovePermissionDenied) ? options.onMovePermissionDenied : () => {};
			this.#analytics = main_core.Type.isPlainObject(options.analytics) ? {
				...options.analytics
			} : {};
		}
		getEntityTitle() {
			return this.#entityTitle;
		}
		getEntityTextContext() {
			return {
				...this.#entityTextContext
			};
		}
		getSuccessButtonText(fallback) {
			const name = FinalTransitionModel.getName(this.getConfiguredSuccessStage()).trim();
			return name === '' ? fallback : name;
		}
		getFailureButtonText(fallback) {
			const failureStages = this.getAllFailureStages();
			if (failureStages.length !== 1) {
				return fallback;
			}
			const name = FinalTransitionModel.getName(failureStages[0]).trim();
			return name === '' ? fallback : name;
		}
		getSuccessStage() {
			const statusId = FinalTransitionModel.getStatusId(this.#successStage);
			return statusId === '' || !this.#canMoveToStage(statusId) ? null : FinalTransitionModel.cloneStage(this.#successStage);
		}
		getConfiguredSuccessStage() {
			return FinalTransitionModel.cloneStage(this.#successStage);
		}
		getFailureStages() {
			return this.#failureStages.filter(stage => {
				const statusId = FinalTransitionModel.getStatusId(stage);
				return statusId !== '' && this.#canMoveToStage(statusId);
			}).map(stage => FinalTransitionModel.cloneStage(stage));
		}
		getAllFailureStages() {
			return this.#failureStages.filter(stage => FinalTransitionModel.getStatusId(stage) !== '').map(stage => FinalTransitionModel.cloneStage(stage));
		}
		canMoveToStage(statusId) {
			return statusId !== '' && this.#canMoveToStage(statusId);
		}
		notifyMovePermissionDenied() {
			this.#onMovePermissionDenied();
		}
		hasFailureStages() {
			return this.getFailureStages().length > 0;
		}
		createMoveContext(stage, outcome) {
			const targetStage = FinalTransitionModel.cloneStage(stage);
			return {
				outcome,
				previousStatusId: FinalTransitionModel.getStatusId(this.#currentStage),
				targetStage,
				failureStage: outcome === 'failure' ? FinalTransitionModel.cloneStage(targetStage) : null,
				analytics: {
					...this.#analytics
				}
			};
		}
		async moveToStage(stage, context) {
			const statusId = FinalTransitionModel.getStatusId(stage);
			if (!this.canMoveToStage(statusId)) {
				throw new Error('Stage transition is not permitted');
			}
			const updatedStage = await this.#onMoveToStage(statusId, context);
			this.#currentStage = FinalTransitionModel.cloneStage(updatedStage);
			this.#undoTargetStatusId = FinalTransitionModel.getStatusId(this.#currentStage);
			return this.#currentStage;
		}
		async undo(previousStatusId) {
			if (this.#isUndoing || this.#undoTargetStatusId === '') {
				throw new Error('Undo is unavailable');
			}
			this.#isUndoing = true;
			try {
				const updatedStage = await this.#onUndo(previousStatusId, this.#undoTargetStatusId);
				this.#currentStage = FinalTransitionModel.cloneStage(updatedStage);
				this.#undoTargetStatusId = '';
			} finally {
				this.#isUndoing = false;
			}
			return this.#currentStage;
		}
		isMoveCancelled(error) {
			return this.#isMoveCancelled(error);
		}
		static getStatusId(stage) {
			if (!main_core.Type.isPlainObject(stage)) {
				return '';
			}
			return main_core.Type.isStringFilled(stage.statusId) ? stage.statusId : '';
		}
		static getName(stage) {
			if (!main_core.Type.isPlainObject(stage)) {
				return '';
			}
			return main_core.Type.isString(stage.name) ? stage.name : '';
		}
		static getColor(stage) {
			if (!main_core.Type.isPlainObject(stage) || !main_core.Type.isStringFilled(stage.color)) {
				return 'd3d7dc';
			}
			const color = stage.color.replace('#', '');
			return /^[\da-f]{3,6}$/i.test(color) ? color : 'd3d7dc';
		}
		static getDescription(stage) {
			if (!main_core.Type.isPlainObject(stage)) {
				return '';
			}
			return main_core.Type.isString(stage.description) ? stage.description : '';
		}
		static cloneStage(stage) {
			return main_core.Type.isPlainObject(stage) ? {
				...stage
			} : {};
		}
	}

	class LossReasonDialog {
		#options;
		#dialog = null;
		#contentNode = null;
		#titleNode = null;
		#reasonsNode = null;
		#reasonsScrollNode = null;
		#backButton = null;
		#reasonNodes = [];
		#submittingStatusNode = null;
		#isSubmitting = false;
		#stageDescriptionTooltip = new crm_stage_descriptionTooltip.StageDescriptionTooltip();
		#isInternalHide = false;
		#revealScrollTop = null;
		#canMoveToStage;
		#onPermissionDenied;
		#titleId = `crm-stage-final-transition-loss-title-${main_core.Text.getRandom(8).toLowerCase()}`;
		#labelId = `crm-stage-final-transition-loss-label-${main_core.Text.getRandom(8).toLowerCase()}`;
		#handleWindowResize = () => {
			if (this.#titleNode) {
				syncTitleHint(this.#titleNode);
			}
			this.#centerDialog();
		};
		#handleReasonsFocusIn = event => {
			const reasonItem = event.target.closest('.crm-stage-final-transition__reason-wrap');
			if (reasonItem) {
				this.#revealReason(reasonItem);
			}
		};
		#handleReasonsScroll = () => {
			this.#syncScrollHints();
			const isRevealScroll = this.#revealScrollTop !== null && this.#reasonsScrollNode?.scrollTop === this.#revealScrollTop;
			this.#revealScrollTop = null;
			if (!isRevealScroll) {
				this.#stageDescriptionTooltip.hideImmediately();
			}
		};
		constructor(options) {
			this.#options = options;
			this.#canMoveToStage = options.canMoveToStage ?? (() => true);
			this.#onPermissionDenied = options.onPermissionDenied ?? (() => {});
		}
		show() {
			this.#getDialog().show();
		}
		#markDialogContainer() {
			const container = this.#contentNode?.closest('.ui-system-dialog');
			if (container) {
				main_core.Dom.addClass(container, 'crm-stage-final-transition-dialog');
				main_core.Dom.addClass(container, 'crm-stage-final-transition-dialog--loss');
				container.setAttribute('data-testid', 'crm-stage-final-transition-loss-dialog');
				const title = container.querySelector('.ui-system-dialog__header-left > :first-child');
				if (title) {
					title.id = this.#titleId;
					main_core.Dom.addClass(title, DIALOG_TITLE_CLASS);
					container.setAttribute('aria-labelledby', this.#titleId);
					this.#titleNode = title;
					syncTitleHint(title);
				}
				main_core.Event.bind(window, 'resize', this.#handleWindowResize);
				const closeButton = container.querySelector('.ui-system-dialog__header-close-btn');
				if (closeButton) {
					closeButton.dataset.testid = 'crm-stage-final-transition-loss-close';
					closeButton.setAttribute('aria-label', main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_CLOSE_BUTTON') ?? '');
					[...closeButton.children].forEach(child => child.setAttribute('aria-hidden', 'true'));
				}
			}
		}
		#centerDialog() {
			const container = this.#contentNode?.closest('.ui-system-dialog');
			if (container) {
				centerInVisibleWidth(container);
			}
		}
		hide() {
			this.#stageDescriptionTooltip.hideImmediately();
			this.#dialog?.hide();
		}
		hideForNavigation() {
			this.#isInternalHide = true;
			this.hide();
		}
		setSubmitting(isSubmitting) {
			this.#isSubmitting = isSubmitting;
			if (this.#backButton) {
				this.#backButton.setDisabled(isSubmitting);
			}
			this.#reasonNodes.forEach(node => {
				const statusId = node.dataset.statusId ?? '';
				const isPermissionDenied = !this.#canMoveToStage(statusId);
				main_core.Dom.toggleClass(node, '--disabled', isSubmitting);
				main_core.Dom.toggleClass(node, '--permission-denied', isPermissionDenied);
				node.setAttribute('aria-disabled', isSubmitting || isPermissionDenied ? 'true' : 'false');
			});
			this.#contentNode?.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
			if (this.#submittingStatusNode) {
				this.#submittingStatusNode.textContent = isSubmitting ? main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_SUBMITTING') ?? '' : '';
			}
		}
		#getDialog() {
			if (this.#dialog) {
				return this.#dialog;
			}
			this.#backButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_BACK_BUTTON') ?? '',
				size: ui_buttons.ButtonSize.LARGE,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				onclick: () => {
					this.#options.onBack();
					return {};
				}
			});
			const backButton = this.#backButton.getContainer();
			main_core.Dom.addClass(backButton, 'crm-stage-final-transition__back');
			backButton.dataset.testid = 'crm-stage-final-transition-loss-back';
			const label = main_core.Text.encode(main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_LOSS_SUBTITLE') ?? '');
			const contentNode = main_core.Tag.render`
			<div
				class="crm-stage-final-transition crm-stage-final-transition--loss-reason"
				aria-busy="${this.#isSubmitting ? 'true' : 'false'}"
			>
				<div class="crm-stage-final-transition__field">
					<div class="crm-stage-final-transition__label" id="${this.#labelId}">${label}</div>
					<div class="crm-stage-final-transition__reasons">
						<ul class="crm-stage-final-transition__reasons-scroll" aria-labelledby="${this.#labelId}">
							${this.#options.failureStages.map(stage => this.#renderReason(stage))}
						</ul>
					</div>
				</div>
				<visually-hidden class="crm-stage-final-transition__submitting-status" role="status" aria-live="polite"></visually-hidden>
			</div>
		`;
			this.#contentNode = contentNode;
			this.#reasonsNode = contentNode.querySelector('.crm-stage-final-transition__reasons');
			this.#reasonsScrollNode = contentNode.querySelector('.crm-stage-final-transition__reasons-scroll');
			this.#submittingStatusNode = contentNode.querySelector('.crm-stage-final-transition__submitting-status');
			if (this.#reasonsScrollNode) {
				main_core.Event.bind(this.#reasonsScrollNode, 'scroll', this.#handleReasonsScroll, {
					passive: true
				});
				main_core.Event.bind(this.#reasonsScrollNode, 'focusin', this.#handleReasonsFocusIn, true);
			}
			const dialogOptions = {
				title: crm_stage_entityText.getEntityMessage('CRM_STAGE_FINAL_TRANSITION_TITLE', this.#options.entityTextContext, {
					'#ENTITY#': this.#options.entityTitle,
					'#ENTITY_TYPE#': this.#options.entityTextContext.entityTypeCaption ?? ''
				}),
				content: contentNode,
				leftButtons: [this.#backButton],
				width: DIALOG_WIDTH,
				hasCloseButton: true,
				closeByEsc: true,
				closeByClickOutside: true,
				hasOverlay: true,
				events: {
					onShow: () => {
						this.#markDialogContainer();
						this.#syncScrollHints();
					},
					onAfterShow: () => {
						this.#centerDialog();
					},
					onHide: () => {
						main_core.Event.unbind(window, 'resize', this.#handleWindowResize);
						if (this.#isInternalHide) {
							this.#isInternalHide = false;
							return;
						}
						this.#options.onClose();
					}
				}
			};
			this.#dialog = new ui_system_dialog.Dialog(dialogOptions);
			return this.#dialog;
		}
		#renderReason(stage) {
			const statusId = FinalTransitionModel.getStatusId(stage);
			const canMove = this.#canMoveToStage(statusId);
			const testStatusId = statusId.toLowerCase().replaceAll(/[^\da-z]+/g, '-').replaceAll(/^-+|-+$/g, '');
			const name = main_core.Text.encode(FinalTransitionModel.getName(stage));
			const node = main_core.Tag.render`
			<button
				class="crm-stage-final-transition__reason --tinted-alert ${canMove ? '' : '--permission-denied'}"
				type="button"
				aria-disabled="${this.#isSubmitting || !canMove ? 'true' : 'false'}"
				data-status-id="${main_core.Text.encode(statusId)}"
				data-testid="crm-stage-final-transition-loss-reason-${testStatusId}"
			><span class="crm-stage-final-transition__reason-name">${name}</span></button>
		`;
			main_core.Event.bind(node, 'mouseenter', () => this.#showStageDescriptionTooltip(node, stage));
			main_core.Event.bind(node, 'mouseleave', () => this.#stageDescriptionTooltip.hide());
			main_core.Event.bind(node, 'focusin', () => this.#showStageDescriptionTooltip(node, stage));
			main_core.Event.bind(node, 'focusout', () => this.#stageDescriptionTooltip.hide());
			main_core.Event.bind(node, 'click', () => {
				if (this.#isSubmitting) {
					return;
				}
				if (!this.#canMoveToStage(statusId)) {
					this.#onPermissionDenied();
					return;
				}
				this.#options.onSelect(stage);
			});
			this.#reasonNodes.push(node);
			return main_core.Tag.render`<li class="crm-stage-final-transition__reason-wrap">${node}</li>`;
		}
		#revealReason(reasonItem) {
			const scrollNode = this.#reasonsScrollNode;
			if (!scrollNode) {
				return;
			}
			const scrollTop = scrollNode.scrollTop;
			reasonItem.scrollIntoView({
				block: 'nearest'
			});
			if (scrollNode.scrollTop !== scrollTop) {
				this.#stageDescriptionTooltip.hideImmediately();
				this.#revealScrollTop = scrollNode.scrollTop;
			}
		}
		#syncScrollHints() {
			const reasonsNode = this.#reasonsNode;
			const scrollNode = this.#reasonsScrollNode;
			if (!reasonsNode || !scrollNode) {
				return;
			}
			const maxScrollTop = scrollNode.scrollHeight - scrollNode.clientHeight;
			main_core.Dom.toggleClass(reasonsNode, '--scrolled-from-top', scrollNode.scrollTop > 0);
			main_core.Dom.toggleClass(reasonsNode, '--more-below', maxScrollTop - scrollNode.scrollTop > 1);
		}
		#showStageDescriptionTooltip(bindElement, stage) {
			this.#stageDescriptionTooltip.show({
				bindElement,
				name: FinalTransitionModel.getName(stage),
				description: FinalTransitionModel.getDescription(stage),
				showName: false
			});
		}
	}

	function isOutcomeButtonTextCropped(textNode) {
		return textNode !== null && textNode.offsetWidth < textNode.scrollWidth;
	}

	class OutcomeDialog {
		#options;
		#dialog = null;
		#successButton = null;
		#failureButton = null;
		#contentNode = null;
		#titleNode = null;
		#stageDescriptionTooltip = new crm_stage_descriptionTooltip.StageDescriptionTooltip();
		#isInternalHide = false;
		#isSuccessButtonShown = false;
		#boundSuccessButtonContainer = null;
		#titleId = `crm-stage-final-transition-outcome-title-${main_core.Text.getRandom(8).toLowerCase()}`;
		#handleWindowResize = () => {
			if (this.#titleNode) {
				syncTitleHint(this.#titleNode);
			}
			this.#centerDialog();
		};
		#handleExternalSuccessButtonClick = event => {
			if (!this.#options.canMoveToSuccess()) {
				event.preventDefault();
				event.stopImmediatePropagation();
				this.#options.onPermissionDenied();
			}
		};
		constructor(options) {
			this.#options = options;
		}
		show() {
			const dialog = this.#getDialog();
			this.#bindExternalSuccessButton();
			dialog.show();
			this.#notifySuccessButtonShow();
		}
		#markDialogContainer() {
			const container = this.#contentNode?.closest('.ui-system-dialog');
			if (container) {
				main_core.Dom.addClass(container, 'crm-stage-final-transition-dialog');
				main_core.Dom.addClass(container, 'crm-stage-final-transition-dialog--outcome');
				container.setAttribute('data-testid', 'crm-stage-final-transition-outcome-dialog');
				const title = container.querySelector('.ui-system-dialog__header-left > :first-child');
				if (title) {
					title.id = this.#titleId;
					main_core.Dom.addClass(title, DIALOG_TITLE_CLASS);
					container.setAttribute('aria-labelledby', this.#titleId);
					this.#titleNode = title;
					syncTitleHint(title);
				}
				main_core.Event.bind(window, 'resize', this.#handleWindowResize);
				const closeButton = container.querySelector('.ui-system-dialog__header-close-btn');
				if (closeButton) {
					closeButton.dataset.testid = 'crm-stage-final-transition-outcome-close';
					closeButton.setAttribute('aria-label', main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_CLOSE_BUTTON') ?? '');
					[...closeButton.children].forEach(child => child.setAttribute('aria-hidden', 'true'));
				}
			}
		}
		#centerDialog() {
			const container = this.#contentNode?.closest('.ui-system-dialog');
			if (container) {
				centerInVisibleWidth(container);
			}
		}
		hide() {
			this.#stageDescriptionTooltip.hideImmediately();
			this.#unbindExternalSuccessButton();
			this.#dialog?.hide();
		}
		hideForNavigation() {
			this.#isInternalHide = true;
			this.hide();
		}
		setSubmitting(isSubmitting) {
			if (this.#successButton) {
				this.#setButtonState(this.#successButton, isSubmitting, this.#options.canMoveToSuccess());
			}
			if (this.#failureButton) {
				this.#setButtonState(this.#failureButton, isSubmitting, this.#options.canMoveToFailure());
			}
		}
		#getDialog() {
			if (this.#dialog) {
				return this.#dialog;
			}
			const contentNode = main_core.Tag.render`<div class="crm-stage-final-transition crm-stage-final-transition--outcome"></div>`;
			this.#contentNode = contentNode;
			this.#successButton = this.#options.successButton ?? this.#renderOutcomeButton('success', this.#options.successStage);
			this.#failureButton = this.#renderOutcomeButton('failure', this.#options.failureStage);
			this.#setPermissionState(this.#successButton, this.#options.canMoveToSuccess());
			this.#setPermissionState(this.#failureButton, this.#options.canMoveToFailure());
			const dialogOptions = {
				title: crm_stage_entityText.getEntityMessage('CRM_STAGE_FINAL_TRANSITION_TITLE', this.#options.entityTextContext, {
					'#ENTITY#': this.#options.entityTitle,
					'#ENTITY_TYPE#': this.#options.entityTextContext.entityTypeCaption ?? ''
				}),
				subtitle: main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_SUBTITLE') ?? '',
				content: contentNode,
				leftButtons: [this.#successButton, this.#failureButton],
				width: DIALOG_WIDTH,
				hasVerticalPadding: false,
				hasCloseButton: true,
				closeByEsc: true,
				closeByClickOutside: true,
				hasOverlay: true,
				events: {
					onShow: () => {
						this.#markDialogContainer();
					},
					onAfterShow: () => {
						this.#centerDialog();
					},
					onHide: () => {
						main_core.Event.unbind(window, 'resize', this.#handleWindowResize);
						this.#unbindExternalSuccessButton();
						this.#notifySuccessButtonHide();
						if (this.#isInternalHide) {
							this.#isInternalHide = false;
							return;
						}
						this.#options.onClose();
					}
				}
			};
			this.#dialog = new ui_system_dialog.Dialog(dialogOptions);
			return this.#dialog;
		}
		#bindExternalSuccessButton() {
			if (!this.#options.successButton) {
				return;
			}
			const container = this.#options.successButton.getContainer();
			if (this.#boundSuccessButtonContainer === container) {
				return;
			}
			this.#unbindExternalSuccessButton();
			this.#boundSuccessButtonContainer = container;
			main_core.Event.bind(container, 'click', this.#handleExternalSuccessButtonClick, true);
		}
		#unbindExternalSuccessButton() {
			if (!this.#boundSuccessButtonContainer) {
				return;
			}
			main_core.Event.unbind(this.#boundSuccessButtonContainer, 'click', this.#handleExternalSuccessButtonClick, true);
			this.#boundSuccessButtonContainer = null;
		}
		#notifySuccessButtonShow() {
			if (!this.#options.successButton || this.#isSuccessButtonShown || !this.#options.canMoveToSuccess()) {
				return;
			}
			this.#isSuccessButtonShown = true;
			this.#options.onSuccessButtonShow();
		}
		#notifySuccessButtonHide() {
			if (!this.#options.successButton || !this.#isSuccessButtonShown) {
				return;
			}
			this.#isSuccessButtonShown = false;
			this.#options.onSuccessButtonHide();
		}
		#renderOutcomeButton(outcome, stage) {
			const isSuccess = outcome === 'success';
			const button = new ui_buttons.Button({
				text: isSuccess ? this.#options.successButtonText : this.#options.failureButtonText,
				size: ui_buttons.ButtonSize.LARGE,
				collapsedIcon: isSuccess ? ui_buttons.ButtonIcon.DONE : ui_buttons.ButtonIcon.CANCEL,
				useAirDesign: true,
				style: isSuccess ? ui_buttons.AirButtonStyle.FILLED_SUCCESS : ui_buttons.AirButtonStyle.FILLED_ALERT,
				round: false,
				onclick: () => {
					const canMove = isSuccess ? this.#options.canMoveToSuccess() : this.#options.canMoveToFailure();
					if (!canMove) {
						this.#options.onPermissionDenied();
						return {};
					}
					if (isSuccess && this.#options.successStage) {
						this.#options.onSuccess();
					} else {
						this.#options.onFailure();
					}
					return {};
				}
			});
			const buttonContainer = button.getContainer();
			main_core.Dom.addClass(buttonContainer, `crm-stage-final-transition__outcome-btn --${outcome}`);
			buttonContainer.dataset.testid = `crm-stage-final-transition-${outcome}`;
			main_core.Event.bind(buttonContainer, 'mouseenter', () => this.#showStageDescriptionTooltip(buttonContainer, stage));
			main_core.Event.bind(buttonContainer, 'mouseleave', () => this.#stageDescriptionTooltip.hide());
			main_core.Event.bind(buttonContainer, 'focusin', () => this.#showStageDescriptionTooltip(buttonContainer, stage));
			main_core.Event.bind(buttonContainer, 'focusout', () => this.#stageDescriptionTooltip.hide());
			return button;
		}
		#setPermissionState(button, canMove) {
			const container = button.getContainer();
			main_core.Dom.toggleClass(container, ui_buttons.ButtonState.DISABLED, !canMove);
			container.setAttribute('aria-disabled', canMove ? 'false' : 'true');
		}
		#setButtonState(button, isSubmitting, canMove) {
			button.setDisabled(isSubmitting);
			this.#setPermissionState(button, !isSubmitting && canMove);
		}
		#showStageDescriptionTooltip(bindElement, stage) {
			const textNode = bindElement.querySelector('.ui-btn-text-inner');
			this.#stageDescriptionTooltip.show({
				bindElement,
				name: FinalTransitionModel.getName(stage),
				description: FinalTransitionModel.getDescription(stage),
				showName: isOutcomeButtonTextCropped(textNode)
			});
		}
	}

	const CLOSE_DELAY = 4000;
	class CloseToast {
		static #cancelAutoClose = null;
		static show(options) {
			this.#cancelAutoClose?.();
			const title = main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_TOAST', {
				'#STAGE#': FinalTransitionModel.getName(options.context.targetStage)
			}) ?? '';
			const undoTitle = main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_UNDO') ?? '';
			const content = main_core.Tag.render`
			<span
				class="crm-stage-final-transition__toast-message"
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>
				${main_core.Text.encode(title)}<br>${main_core.Text.encode(options.entityTitle)}
			</span>
		`;
			let isUndoing = false;
			const balloon = ui_notification.Center.notify({
				id: 'crm-stage-final-transition-toast',
				position: 'top-right',
				width: 'auto',
				autoHideDelay: CLOSE_DELAY,
				blinkOnUpdate: false,
				closeButton: false,
				testId: 'crm-stage-final-transition-toast',
				data: {
					finalTransitionTargetStatusId: FinalTransitionModel.getStatusId(options.context.targetStage)
				},
				content,
				actions: [{
					id: 'undo',
					title: undoTitle,
					testId: 'crm-stage-final-transition-undo',
					events: {
						click: (_event, currentBalloon, action) => {
							if (isUndoing) {
								return;
							}
							isUndoing = true;
							action.getContainer().setAttribute('aria-disabled', 'true');
							currentBalloon.close();
							void options.onUndo().catch(() => {
								ui_notification.Center.notify({
									content: main_core.Text.encode(main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_UNDO_ERROR') ?? ''),
									autoHideDelay: 4000
								});
							});
						}
					}
				}]
			});
			const visibleBalloon = balloon ?? ui_notification.Center.getBalloonById('crm-stage-final-transition-toast');
			if (visibleBalloon) {
				main_core.Dom.addClass(visibleBalloon.getContainer(), 'crm-stage-final-transition__toast');
				this.#scheduleAutoClose(visibleBalloon);
			}
		}
		static #scheduleAutoClose(balloon) {
			const timeout = setTimeout(() => balloon.close(), CLOSE_DELAY);
			const cancelAutoClose = () => {
				clearTimeout(timeout);
				balloon.removeEvent('onClose', cancelAutoClose);
				this.#cancelAutoClose = null;
			};
			this.#cancelAutoClose = cancelAutoClose;
			balloon.addEvent('onClose', cancelAutoClose);
		}
	}

	function notifyFinalTransitionError(error, fallbackMessage) {
		let message = fallbackMessage;
		if (main_core.Type.isStringFilled(error)) {
			message = error;
		} else if (error instanceof Error && main_core.Type.isStringFilled(error.message)) {
			message = error.message;
		} else if (main_core.Type.isPlainObject(error)) {
			const typedError = error;
			if (main_core.Type.isStringFilled(typedError.message)) {
				message = typedError.message;
			} else {
				const firstErrorMessage = typedError.errors?.find(item => main_core.Type.isStringFilled(item?.message))?.message;
				if (main_core.Type.isStringFilled(firstErrorMessage)) {
					message = firstErrorMessage;
				}
			}
		}
		ui_notification.Center.notify({
			content: main_core.Text.encode(message)
		});
	}
	class FinalTransition {
		#model;
		#outcomeDialog = null;
		#lossReasonDialog = null;
		#onClose;
		#successButton;
		#onSuccessButtonShow;
		#onSuccessButtonHide;
		#isClosed = false;
		static open(options) {
			const transition = new FinalTransition(options);
			transition.open();
			return transition;
		}
		constructor(options) {
			this.#model = new FinalTransitionModel(options);
			this.#onClose = main_core.Type.isFunction(options.onClose) ? options.onClose : () => {};
			this.#successButton = options.successButton ?? null;
			this.#onSuccessButtonShow = main_core.Type.isFunction(options.onSuccessButtonShow) ? options.onSuccessButtonShow : () => {};
			this.#onSuccessButtonHide = main_core.Type.isFunction(options.onSuccessButtonHide) ? options.onSuccessButtonHide : () => {};
		}
		open() {
			this.#showOutcomeDialog();
		}
		close() {
			if (this.#isClosed) {
				return;
			}
			this.#hideDialogs();
			this.#completeClose();
		}
		#showOutcomeDialog = () => {
			this.#lossReasonDialog?.hideForNavigation();
			this.#lossReasonDialog = null;
			const failureStages = this.#model.getAllFailureStages();
			this.#outcomeDialog = new OutcomeDialog({
				entityTitle: this.#model.getEntityTitle(),
				entityTextContext: this.#model.getEntityTextContext(),
				canMoveToSuccess: () => this.#model.getSuccessStage() !== null,
				canMoveToFailure: () => this.#model.hasFailureStages(),
				successStage: this.#model.getConfiguredSuccessStage(),
				failureStage: failureStages.length === 1 ? failureStages[0] : null,
				successButtonText: this.#model.getSuccessButtonText(main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_SUCCESS_BUTTON') ?? ''),
				failureButtonText: this.#model.getFailureButtonText(main_core.Loc.getMessage('CRM_STAGE_FINAL_TRANSITION_FAILURE_BUTTON') ?? ''),
				successButton: this.#successButton,
				onSuccessButtonShow: () => this.#onSuccessButtonShow(this.#completeCustomSuccess),
				onSuccessButtonHide: this.#onSuccessButtonHide,
				onSuccess: this.#handleSuccess,
				onFailure: this.#handleFailure,
				onPermissionDenied: () => this.#model.notifyMovePermissionDenied(),
				onClose: this.#completeClose
			});
			this.#outcomeDialog.show();
		};
		#showLossReasonDialog() {
			this.#outcomeDialog?.hideForNavigation();
			this.#outcomeDialog = null;
			this.#lossReasonDialog = new LossReasonDialog({
				entityTitle: this.#model.getEntityTitle(),
				entityTextContext: this.#model.getEntityTextContext(),
				failureStages: this.#model.getAllFailureStages(),
				canMoveToStage: statusId => this.#model.canMoveToStage(statusId),
				onPermissionDenied: () => this.#model.notifyMovePermissionDenied(),
				onSelect: this.#handleFailureStageSelect,
				onBack: this.#showOutcomeDialog,
				onClose: this.#completeClose
			});
			this.#lossReasonDialog.show();
		}
		#handleSuccess = () => {
			const successStage = this.#model.getSuccessStage();
			if (!successStage) {
				notifyFinalTransitionError(null, this.#getMessage('CRM_STAGE_FINAL_TRANSITION_SUCCESS_STAGE_NOT_FOUND'));
				return;
			}
			void this.#moveToStage(successStage, 'success');
		};
		#completeCustomSuccess = () => {
			this.#finish();
		};
		#handleFailure = () => {
			const failureStages = this.#model.getAllFailureStages();
			if (failureStages.length > 1) {
				this.#showLossReasonDialog();
				return;
			}
			const failureStage = failureStages[0] ?? null;
			if (!failureStage) {
				notifyFinalTransitionError(null, this.#getMessage('CRM_STAGE_FINAL_TRANSITION_FAILURE_STAGE_NOT_FOUND'));
				return;
			}
			void this.#moveToStage(failureStage, 'failure');
		};
		#handleFailureStageSelect = stage => {
			void this.#moveToStage(stage, 'failure');
		};
		async #moveToStage(stage, outcome) {
			const activeDialog = this.#lossReasonDialog ?? this.#outcomeDialog;
			activeDialog?.setSubmitting(true);
			try {
				const context = this.#model.createMoveContext(stage, outcome);
				await this.#model.moveToStage(stage, context);
				this.#finish();
				this.#showCloseToast(context);
			} catch (error) {
				if (!this.#model.isMoveCancelled(error)) {
					notifyFinalTransitionError(error, this.#getMessage('CRM_STAGE_FINAL_TRANSITION_ERROR'));
				}
			} finally {
				activeDialog?.setSubmitting(false);
			}
		}
		#showCloseToast(context) {
			CloseToast.show({
				context,
				entityTitle: this.#model.getEntityTitle(),
				onUndo: async () => {
					await this.#model.undo(context.previousStatusId);
				}
			});
		}
		#hideDialogs() {
			this.#lossReasonDialog?.hideForNavigation();
			this.#outcomeDialog?.hideForNavigation();
			this.#lossReasonDialog = null;
			this.#outcomeDialog = null;
		}
		#finish() {
			this.#hideDialogs();
			this.#isClosed = true;
		}
		#completeClose = () => {
			if (this.#isClosed) {
				return;
			}
			this.#isClosed = true;
			this.#lossReasonDialog = null;
			this.#outcomeDialog = null;
			this.#onClose();
		};
		#getMessage(code) {
			return crm_stage_entityText.getEntityMessage(code, this.#model.getEntityTextContext(), {
				'#ENTITY#': this.#model.getEntityTitle(),
				'#ENTITY_TYPE#': this.#model.getEntityTextContext().entityTypeCaption ?? ''
			});
		}
	}

	exports.FinalTransition = FinalTransition;

})(this.BX.Crm.Stage = this.BX.Crm.Stage || {}, BX, BX.UI.Notification, BX.Crm.Stage, BX.UI, BX.UI.Accessibility, BX.UI.System, BX.Crm.Stage);
//# sourceMappingURL=final-transition.bundle.js.map

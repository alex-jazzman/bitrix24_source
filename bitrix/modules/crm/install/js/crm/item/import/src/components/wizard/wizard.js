import { Builder } from 'crm.integration.analytics';
import { Loc, Event, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { sendData } from 'ui.analytics';
import { Button, ButtonColor, ButtonSize } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';

import { BitrixVueComponentProps } from 'ui.vue3';
import { ImportSettings } from '../../lib/model/import-settings';
import { WizardController } from '../../lib/service/wizard-controller';
import { HeaderTabList } from './components/navigation/header-tab-list/header-tab-list';
import { HeaderTab } from './components/navigation/header-tab/header-tab';
import { StepPagination } from './components/navigation/step-pagination/step-pagination';

import './wizard.css';

declare type ConfirmOptions = {
	title: string,
	message: string,
	yesMessage: string,
	noMessage: string,
	onYes: Function,
	onNo: Function,
	onClose: Function,
};

export const Wizard: BitrixVueComponentProps = {
	name: 'Wizard',

	cancelConfirmationPopup: null,
	againConfirmationPopup: null,
	completeConfirmationPopup: null,
	isUserConfirmedClose: false,

	components: {
		HeaderTabList,
		HeaderTab,
		StepPagination,
	},

	props: {
		importSettings: {
			type: ImportSettings,
			required: true,
		},
	},

	data: () => {
		return {
			wizardController: new WizardController({
				currentStepIndex: 0,
				isProcessNext: false,
				isProcessBack: false,
				isBottomNavigationHidden: false,
				isFinish: false,

				enableCancelConfirmation: true,
				enableCompleteConfirmation: true,
				enableAgainConfirmation: true,
			}),
		};
	},

	computed: {
		steps(): Array
		{
			return this.$slots.default();
		},

		currentStepComponent(): BitrixVueComponentProps
		{
			return this.$slots.default()[this.wizardController.currentStepIndex];
		},
	},

	mounted(): void
	{
		this.confirmBeforeCloseSlider();
		this.bindWindowOnBeforeUnload();
	},

	beforeUnmount(): any
	{
		this.unbindWindowOnBeforeUnload();
	},

	methods: {
		async next(): void
		{
			this.wizardController.isProcessNext = true;
			const beforeNext = await this.$refs.currentStepRef?.beforeNext?.();
			this.wizardController.isProcessNext = false;

			if (beforeNext === false)
			{
				return;
			}

			this.wizardController.currentStepIndex++;
			this.scrollOnTop();
		},

		async back(): void
		{
			this.wizardController.isProcessBack = true;
			const beforeBack = await this.$refs.currentStepRef?.beforeBack?.();
			this.wizardController.isProcessBack = false;

			if (beforeBack === false)
			{
				return;
			}

			this.wizardController.currentStepIndex--;
			this.scrollOnTop();
		},
		async cancel(): void
		{
			const cancel = () => {
				this.unbindWindowOnBeforeUnload();
				this.slider().close();

				this.sendCancelAnalytics();
			};

			if (!this.wizardController.enableCancelConfirmation)
			{
				cancel();

				return;
			}

			if (this.cancelConfirmationPopup || !this.wizardController.enableCancelConfirmation)
			{
				return;
			}

			this.cancelConfirmationPopup = this.getConfirmationPopup({
				title: Loc.getMessage('CRM_ITEM_IMPORT_CANCEL_CONFIRMATION_TITLE'),
				message: Loc.getMessage('CRM_ITEM_IMPORT_CANCEL_CONFIRMATION'),
				yesMessage: Loc.getMessage('CRM_ITEM_IMPORT_CANCEL_CONFIRMATION_YES'),
				noMessage: Loc.getMessage('CRM_ITEM_IMPORT_CANCEL_CONFIRMATION_NO'),
				onYes: () => {
					this.isUserConfirmedClose = true;

					cancel();
				},
				onClose: () => {
					this.cancelConfirmationPopup = null;
				},
			});

			this.cancelConfirmationPopup.show();
		},

		async complete(): void
		{
			const complete = () => {
				this.slider().close();

				this.sendFinishAnalytics('crm_import_done');
			};

			if (!this.wizardController.enableCompleteConfirmation)
			{
				complete();

				return;
			}

			if (this.completeConfirmationPopup)
			{
				return;
			}

			this.completeConfirmationPopup = this.getConfirmationPopup({
				title: Loc.getMessage('CRM_ITEM_IMPORT_COMPLETE_CONFIRMATION_TITLE'),
				message: Loc.getMessage('CRM_ITEM_IMPORT_COMPLETE_CONFIRMATION'),
				yesMessage: Loc.getMessage('CRM_ITEM_IMPORT_COMPLETE_CONFIRMATION_YES'),
				noMessage: Loc.getMessage('CRM_ITEM_IMPORT_COMPLETE_CONFIRMATION_NO'),
				onYes: () => {
					this.isUserConfirmedClose = true;

					complete();
				},
				onClose: () => {
					this.completeConfirmationPopup = null;
				},
			});

			this.completeConfirmationPopup.show();
		},

		async again(): void
		{
			const again = () => {
				this.unbindWindowOnBeforeUnload();
				this.slider().reload();

				this.sendFinishAnalytics('crm_import_again');
			};

			if (!this.wizardController.enableAgainConfirmation)
			{
				again();

				return;
			}

			if (this.againConfirmationPopup)
			{
				return;
			}

			this.againConfirmationPopup = this.getConfirmationPopup({
				title: Loc.getMessage('CRM_ITEM_IMPORT_AGAIN_CONFIRMATION_TITLE'),
				message: Loc.getMessage('CRM_ITEM_IMPORT_AGAIN_CONFIRMATION'),
				yesMessage: Loc.getMessage('CRM_ITEM_IMPORT_AGAIN_CONFIRMATION_YES'),
				noMessage: Loc.getMessage('CRM_ITEM_IMPORT_AGAIN_CONFIRMATION_NO'),
				onYes: () => {
					again();
				},
				onClose: () => {
					this.againConfirmationPopup = null;
				},
			});

			this.againConfirmationPopup.show();
		},

		slider(): BX.SidePanel.Slider
		{
			return BX.SidePanel?.Instance?.getSliderByWindow(window);
		},

		getConfirmationPopup(options: ConfirmOptions): MessageBox
		{
			const box = MessageBox.create({
				mediumButtonSize: false,
				title: options.title,
				message: options.message,
				modal: true,
				useAirDesign: true,
				buttons: [
					new Button({
						color: ButtonColor.PRIMARY,
						size: ButtonSize.SMALL,
						text: options.yesMessage,
						onclick: () => {
							box.close();

							if (Type.isFunction(options.onYes))
							{
								options.onYes();
							}
						},
					}),
					new Button({
						color: ButtonColor.LINK,
						size: ButtonSize.SMALL,
						text: options.noMessage,
						onclick: () => {
							box.close();

							if (Type.isFunction(options.onNo))
							{
								options.onNo();
							}
						},
					}),
				],
				popupOptions: {
					events: {
						onClose: () => {
							if (Type.isFunction(options?.onClose))
							{
								options.onClose();
							}
						},
					},
				},
			});

			return box;
		},

		confirmBeforeCloseSlider(): void
		{
			EventEmitter.subscribe('SidePanel.Slider:onClose', (event: BaseEvent<BX.SidePanel.Event[]>): void => {
				const [sliderEvent] = event.getData();

				const isSliderBelongsToThisApp = this.slider() === sliderEvent?.getSlider();
				if (!isSliderBelongsToThisApp)
				{
					return;
				}

				if (this.isUserConfirmedClose)
				{
					return;
				}

				if (
					this.wizardController.isFinish
					&& this.wizardController.enableCompleteConfirmation
				)
				{
					sliderEvent?.denyAction();
					this.complete();

					return;
				}

				if (this.wizardController.enableCancelConfirmation)
				{
					sliderEvent?.denyAction();
					this.cancel();
				}
			});
		},

		bindWindowOnBeforeUnload(): void
		{
			if (!this.beforeUnloadHandler)
			{
				this.beforeUnloadHandler = (e) => {
					e.preventDefault();
				};

				Event.bind(window, 'beforeunload', this.beforeUnloadHandler);
			}
		},

		unbindWindowOnBeforeUnload(): void
		{
			if (this.beforeUnloadHandler)
			{
				Event.unbind(window, 'beforeunload', this.beforeUnloadHandler);
				this.beforeUnloadHandler = null;
			}
		},

		sendFinishAnalytics(finishControl: 'crm_import_done' | 'crm_import_again'): void
		{
			sendData(
				Builder
					.Import
					.CreateEvent
					.createDefault(this.importSettings.get('entityTypeId'))
					.setOrigin(this.importSettings.get('origin'))
					.setImportCompleteButton(finishControl)
					.buildData()
				,
			);
		},

		sendCancelAnalytics(): void
		{
			sendData(
				Builder
					.Import
					.CancelEvent
					.createDefault(this.importSettings.get('entityTypeId'))
					.setOrigin(this.importSettings.get('origin'))
					.setStep(this.currentStepComponent.type.eventId)
					.buildData()
				,
			);
		},

		scrollOnTop(): void
		{
			void this.$nextTick(() => {
				const element = this.$refs.currentStepRef?.$el || this.$refs.currentStepRef;
				if (element)
				{
					element.scrollIntoView({
						behavior: 'smooth',
						block: 'start',
					});
				}
			});
		},
	},

	template: `
		<div class="crm-item-import__wizard">
			<div class="crm-item-import__wizard-main">
				<div class="crm-item-import__wizard-header">
					<div class="crm-item-import__wizard-header-tabs-container">
						<HeaderTabList :tabs-count="steps.length">
							<template v-for="(step, index) in steps" #[index]>
								<HeaderTab :is-active="wizardController.currentStepIndex === index">
									{{ step.type.title }}
								</HeaderTab>
							</template>
						</HeaderTabList>
					</div>
				</div>
				<div class="crm-item-import__wizard-body">
					<div class="crm-item-import__wizard-step-container">
						<component
							:is="currentStepComponent"
							ref="currentStepRef"
							:wizard-controller="wizardController"
						/>
					</div>
				</div>
			</div>
			<div class="crm-item-import__wizard-footer">
				<div class="crm-item-import__wizard-footer-step-pagination-container">
					<StepPagination
						:current-item-id="wizardController.currentStepIndex"
						:items-count="steps.length"
						:disabled="wizardController.isProcessNext || wizardController.isProcessBack"
						:hidden="wizardController.isBottomNavigationHidden"
						@next="next"
						@back="back"
						@cancel="cancel"
						@complete="complete"
						@again="again"
					/>
				</div>
			</div>
		</div>
	`,
};

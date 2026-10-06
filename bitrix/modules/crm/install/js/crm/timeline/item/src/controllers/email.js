import { ActivityProvider } from 'crm.ai.call';
import { DatetimeConverter } from 'crm.timeline.tools';
import { Loc, Runtime, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { ButtonState } from 'ui.buttons';
import { Outline } from 'ui.icon-set.api.vue';
import { Menu } from 'ui.system.menu';

import ContactList from '../components/content-blocks/mail/contact-list';
import ConfigurableItem from '../configurable-item';

import type { CopilotConfig } from './ai/copilot-base';
import { CopilotBase } from './ai/copilot-base';
import { type ActionParams } from './base';

export class Email extends CopilotBase
{
	static #copilotTourObserver: ?IntersectionObserver = null;
	static #copilotTourCallbacks: Map<Element, Function> = new Map();

	#copilotSummaryMenu: Menu = null;
	#copilotWelcomeTourTimeout: ?number = null;
	#copilotTourTarget: ?Element = null;

	// region Base overridden methods
	onInitialize(item: ConfigurableItem): void
	{
		if (item)
		{
			this.#showCopilotWelcomeTour(item);
		}
	}

	onBeforeItemClearLayout(item: ConfigurableItem): void
	{
		super.onBeforeItemClearLayout(item);

		this.#copilotSummaryMenu?.destroy();
		this.#copilotSummaryMenu = null;

		if (this.#copilotWelcomeTourTimeout)
		{
			clearTimeout(this.#copilotWelcomeTourTimeout);
			this.#copilotWelcomeTourTimeout = null;
		}

		if (this.#copilotTourTarget)
		{
			Email.#unobserveCopilotTour(this.#copilotTourTarget);
			this.#copilotTourTarget = null;
		}
	}
	// endregion

	// region CopilotBase overridden methods
	getCopilotConfig(): CopilotConfig
	{
		return {
			actionEndpoint: 'crm.timeline.ai.launchCopilot',
			validEntityTypes: [BX.CrmEntityType.enumeration.lead, BX.CrmEntityType.enumeration.deal],
			agreementContext: 'text',
		};
	}
	// endregion

	// region Base overridden methods
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Email::OpenMessage' && actionData)
		{
			this.#openMessage(actionData);
		}

		if (action === 'Email::Schedule' && actionData)
		{
			this.runScheduleAction(actionData.activityId, actionData.scheduleDate);
		}

		if (action === 'Email:LaunchCopilot' && actionData)
		{
			void this.handleCopilotLaunch(item, actionData);
		}

		if (action === 'Email::ShowCopilotSummary' && actionData)
		{
			void this.#showCopilotSummary(item, actionData);
		}
	}

	getContentBlockComponents(Item: ConfigurableItem): Object
	{
		return {
			ContactList,
		};
	}
	// endregion

	// region jsEvent action handlers
	#showCopilotSummary(item: ConfigurableItem, actionData: Object): void
	{
		const activityId = actionData.activityId;
		const items = actionData.summarizeTranscriptionList;
		if (activityId <= 0 || !items)
		{
			return;
		}

		if (Object.keys(items).length === 1)
		{
			void this.openCopilotSummaryPopup(actionData, ActivityProvider.email, Object.keys(items)[0]);

			return;
		}

		if (this.#copilotSummaryMenu === null)
		{
			const barTarget = item.getLayoutContentBlockById('aiActionBar')?.getContainer();
			const elementTarget = barTarget?.querySelector('.ui-icon-set.--o-copilot');
			const menuTarget = elementTarget || barTarget;
			if (!menuTarget)
			{
				return;
			}
			const menuItems = Object.entries(items).reverse().map(([jobId, timestamp]) => {
				const converter = DatetimeConverter.createFromServerTimestamp(timestamp).toUserTime();

				return {
					title: Loc.getMessage(
						'CRM_TIMELINE_ITEM_ACTIVITY_EMAIL_SUMMARIZE_TRANSCRIPTION_MENU',
						{ '#DATE#': converter.toDatetimeString({ delimiter: ', ' }) },
					),
					design: 'copilot',
					icon: Outline.TEXT,
					onClick: (): void => {
						this.#copilotSummaryMenu.close();

						this.openCopilotSummaryPopup(actionData, ActivityProvider.email, jobId);
					},
				};
			});

			this.#copilotSummaryMenu = new Menu({
				id: `crm-timeline-activity-email-copilot-summary-${activityId}-${Text.getRandom()}`,
				animation: 'fading-slide',
				bindElement: menuTarget,
				autoHide: true,
				closeByEsc: false,
				offsetTop: 5,
				items: menuItems,
			});
		}

		this.#copilotSummaryMenu.show();
	}

	#viewActivity(id): void
	{
		const editor = this.#getActivityEditor();
		if (editor && id)
		{
			const emailActivity = BX.CrmActivityEmail.create(
				{
					ID: id,
				},
				editor,
				{},
			);

			emailActivity.openDialog(BX.CrmDialogMode.view);
		}
	}

	#getActivityEditor(): BX.CrmActivityEditor
	{
		return BX.CrmActivityEditor.getDefault();
	}

	#openMessage(actionData): void
	{
		if (!Type.isNumber(actionData.threadId))
		{
			return;
		}
		this.#viewActivity(actionData.threadId);
	}
	// endregion

	#showCopilotWelcomeTour(item: ConfigurableItem): void
	{
		this.#copilotWelcomeTourTimeout = setTimeout(() => {
			this.#copilotWelcomeTourTimeout = null;

			const aiCopilotBtn = this.getFooterCopilotButton(item);
			const aiCopilotUIBtn = aiCopilotBtn?.getUiButton();
			if (!aiCopilotUIBtn || aiCopilotUIBtn.getState() === ButtonState.DISABLED)
			{
				return;
			}

			const target = aiCopilotUIBtn.getContainer();

			if (aiCopilotBtn?.isInViewport())
			{
				this.#emitShowCopilotTour(target, 1500);

				return;
			}

			this.#copilotTourTarget = target;
			void Email.#observeCopilotTour(target, () => {
				this.#copilotTourTarget = null;
				this.#emitShowCopilotTour(target, 1000);
			});
		}, 50);
	}

	#emitShowCopilotTour(target: Element, delay: number): void
	{
		EventEmitter.emit(
			this,
			'BX.Crm.Timeline.Email:onShowCopilotTour',
			{
				target,
				stepId: 'copilot-in-email',
				delay,
			},
		);
	}

	static #getCopilotTourObserver(): IntersectionObserver
	{
		if (Email.#copilotTourObserver === null)
		{
			Email.#copilotTourObserver = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting)
					{
						return;
					}

					const callback = Email.#copilotTourCallbacks.get(entry.target);
					Email.#unobserveCopilotTour(entry.target);
					callback?.();
				});
			});
		}

		return Email.#copilotTourObserver;
	}

	static async #observeCopilotTour(target: Element, callback: Function): Promise<void>
	{
		if (!target)
		{
			return;
		}

		Email.#copilotTourCallbacks.set(target, callback);

		if (typeof IntersectionObserver === 'undefined')
		{
			await Runtime.loadExtension('main.polyfill.intersectionobserver');
			if (!Email.#copilotTourCallbacks.has(target))
			{
				return;
			}
		}

		Email.#getCopilotTourObserver().observe(target);
	}

	static #unobserveCopilotTour(target: Element): void
	{
		if (!target)
		{
			return;
		}

		Email.#copilotTourObserver?.unobserve(target);
		Email.#copilotTourCallbacks.delete(target);

		if (Email.#copilotTourCallbacks.size === 0)
		{
			Email.#copilotTourObserver?.disconnect();
			Email.#copilotTourObserver = null;
		}
	}
	// endregion

	static isItemSupported(item: ConfigurableItem): boolean
	{
		const supportedItemTypes = [
			'ContactList',
			'Activity:Email',
			'EmailActivitySuccessfullyDelivered',
			'EmailActivityNonDelivered',
			'EmailLogIncomingMessage',
		];

		return supportedItemTypes.includes(item.getType());
	}
}

import { ActivityProvider } from 'crm.ai.call';
import { Event, Runtime, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { ButtonState } from 'ui.buttons';

import 'ui.feedback.form';
import type ConfigurableItem from '../configurable-item';
import type { CopilotConfig } from './ai/copilot-base';
import { CopilotBase } from './ai/copilot-base';
import type { ActionParams } from './base';
import 'crm_common';

const COPILOT_BUTTON_NUMBER_OF_MANUAL_STARTS_WITH_BOOST_LIMIT = 5;

export class Call extends CopilotBase
{
	#currentTranscriptionState: string = 'empty';
	#isCopilotWelcomeTourShown: boolean = false;
	#isTranscriptEventBound: boolean = false;

	// region Base overridden methods
	onInitialize(item: ConfigurableItem): void
	{
		this.#showCopilotWelcomeTour(item);
		this.#bindAdditionalCopilotActions(item);
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Call:MakeCall' && actionData)
		{
			this.#makeCall(actionData);
		}

		if (action === 'Call:Schedule' && actionData)
		{
			this.runScheduleAction(actionData.activityId, actionData.scheduleDate);
		}

		if (action === 'Call:OpenTranscript' && actionData && actionData.callId)
		{
			this.#openTranscript(actionData.callId);
		}

		if (action === 'Call:ChangePlayerState' && actionData && actionData.recordId)
		{
			this.#changePlayerState(item, actionData.recordId);
		}

		if (action === 'Call:DownloadRecord' && actionData && actionData.url)
		{
			this.#downloadRecord(actionData.url);
		}

		if (action === 'Call:LaunchCopilot' && actionData)
		{
			void this.handleCopilotLaunch(item, actionData);
		}

		if (action === 'Call:OpenCallScoringResult' && actionData)
		{
			this.#openCallScoringResult(actionData);
		}

		if (action === 'Call:ShowCopilotSummary' && actionData)
		{
			void this.#showCopilotSummary(item, actionData);
		}
	}
	// endregion

	// region CopilotBase overridden methods
	getCopilotConfig(): CopilotConfig
	{
		return {
			actionEndpoint: 'crm.timeline.ai.launchCopilot',
			validEntityTypes: [BX.CrmEntityType.enumeration.lead, BX.CrmEntityType.enumeration.deal],
			agreementContext: 'audio',
			onPreLaunch: (...args) => this.#handlePreLaunch(...args),
			onPostLaunch: (...args) => this.#handlePostLaunch(...args),
			onError: (...args) => this.#handleError(...args),
		};
	}

	useInfoHelper(): boolean
	{
		return true;
	}
	// endregion

	// region jsEvent action handlers
	#handlePreLaunch(item: ConfigurableItem, actionData: Object): void
	{
		const player = this.#getAudioPlayer(item);
		if (!player)
		{
			return;
		}

		this.#currentTranscriptionState = player.getTranscriptionState();
		if (this.#currentTranscriptionState === 'empty')
		{
			player.setTranscriptionState('pending');
		}
	}

	#handleError(item: ConfigurableItem, actionData: Object, response: Object): void
	{
		const player = this.#getAudioPlayer(item);
		if (player)
		{
			player.setTranscriptionState(this.#currentTranscriptionState);
		}
	}

	#handlePostLaunch(item: ConfigurableItem, actionData: Object, response: Object): void
	{
		if (response?.status !== 'success')
		{
			return;
		}

		const numberOfManualStarts = response?.data?.numberOfManualStarts;
		const aiCopilotBtnUI = this.getFooterCopilotButton(item)?.getUiButton();
		if (
			aiCopilotBtnUI
			&& numberOfManualStarts >= COPILOT_BUTTON_NUMBER_OF_MANUAL_STARTS_WITH_BOOST_LIMIT)
		{
			this.#emitTimelineCopilotTourEvent(
				aiCopilotBtnUI.getContainer(),
				'BX.Crm.Timeline.Call:onShowTourWhenManualStartTooMuch',
				'copilot-in-call-automatically',
				500,
			);
		}
	}

	#makeCall(actionData): void
	{
		if (!Type.isStringFilled(actionData.phone))
		{
			return;
		}

		const params = {
			ENTITY_TYPE_NAME: BX.CrmEntityType.resolveName(actionData.entityTypeId),
			ENTITY_ID: actionData.entityId,
			AUTO_FOLD: true,
		};

		if (actionData.ownerTypeId !== actionData.entityTypeId || actionData.ownerId !== actionData.entityId)
		{
			params.BINDINGS = {
				OWNER_TYPE_NAME: BX.CrmEntityType.resolveName(actionData.ownerTypeId),
				OWNER_ID: actionData.ownerId,
			};
		}

		if (actionData.activityId > 0)
		{
			params.SRC_ACTIVITY_ID = actionData.activityId;
		}

		Runtime.loadExtension('im.public').then((exports: Object) => {
			exports.Messenger.startPhoneCall(actionData.phone, params);
		}).catch((exception) => {
			console.error('Error loading "im.public":', exception);
		});
	}

	#openTranscript(callId): void
	{
		if (BX.Voximplant && BX.Voximplant.Transcript)
		{
			BX.Voximplant.Transcript.create({ callId }).show();
		}
	}

	#changePlayerState(item: ConfigurableItem, recordId: Number): void
	{
		const player = this.#getAudioPlayer(item);
		if (!player)
		{
			return;
		}

		if (recordId !== player.id)
		{
			return;
		}

		if (player.state === 'play')
		{
			player.pause();
		}
		else
		{
			player.play();
		}
	}

	#downloadRecord(url: String): void
	{
		location.href = url;
	}

	async #openCallScoringResult(actionData: Object): void
	{
		if (
			!Type.isInteger(actionData.activityId)
			|| !Type.isInteger(actionData.ownerTypeId)
			|| !Type.isInteger(actionData.ownerId)
		)
		{
			return;
		}

		// Runtime.loadExtension not work in this case (see http://jabber.bx/view.php?id=241940)
		await top.BX.Runtime.loadExtension('crm.ai.call');
		const callQualityDlg = new top.BX.Crm.AI.Call.CallQuality({
			activityId: actionData.activityId,
			ownerTypeId: actionData.ownerTypeId,
			ownerId: actionData.ownerId,
			activityCreated: actionData.activityCreated ?? null,
			clientDetailUrl: actionData.clientDetailUrl ?? null,
			clientFullName: actionData.clientFullName ?? null,
			userPhotoUrl: actionData.userPhotoUrl ?? null,
			jobId: actionData.jobId ?? null,
			assessmentSettingsId: actionData.assessmentSettingsId ?? null,
		});
		callQualityDlg.open();
	}

	async #openTranscriptResult(payload: ?Object = null): void
	{
		if (
			!Type.isInteger(payload?.activityId)
			|| !Type.isInteger(payload?.ownerTypeId)
			|| !Type.isInteger(payload?.ownerId)
		)
		{
			return;
		}

		Runtime.loadExtension('crm.ai.call').then((exports) => {
			const transcription = new exports.Call.Transcription({
				activityId: payload?.activityId,
				ownerTypeId: payload?.ownerTypeId,
				ownerId: payload?.ownerId,
				languageTitle: payload?.languageTitle,
			});
			transcription.open();
		}).catch((exception) => {
			console.error('Error loading "crm.ai.call":', exception);
		});
	}

	#showCopilotSummary(item: ConfigurableItem, actionData: Object): void
	{
		void this.openCopilotSummaryPopup(actionData, ActivityProvider.call);
	}
	// endregion

	// eslint-disable-next-line sonarjs/cognitive-complexity
	#showCopilotWelcomeTour(item: ConfigurableItem): void
	{
		if (!item)
		{
			return;
		}

		if (this.#isCopilotWelcomeTourShown)
		{
			return;
		}

		setTimeout(() => {
			const aiCopilotBtn = this.getFooterCopilotButton(item);
			const aiCopilotUIBtn = aiCopilotBtn?.getUiButton();
			if (!aiCopilotUIBtn || aiCopilotUIBtn.getState() === ButtonState.DISABLED)
			{
				return;
			}

			if (aiCopilotBtn?.isInViewport())
			{
				this.#emitTimelineCopilotTourEvents(
					aiCopilotUIBtn.getContainer(),
					1500,
					item.getDataPayload(),
				);

				return;
			}

			const showCopilotTourOnScroll = () => {
				if (aiCopilotBtn?.isInViewport())
				{
					this.#emitTimelineCopilotTourEvents(
						aiCopilotUIBtn.getContainer(),
						1500,
						item.getDataPayload(),
					);

					this.#isCopilotWelcomeTourShown = true;

					Event.unbind(window, 'scroll', showCopilotTourOnScroll);
				}
			};

			Event.bind(window, 'scroll', showCopilotTourOnScroll);
		}, 50);
	}

	#bindAdditionalCopilotActions(item: ConfigurableItem): void
	{
		if (!item || this.#isTranscriptEventBound)
		{
			return;
		}

		this.#isTranscriptEventBound = true;

		EventEmitter.subscribe('ui:audioplayer:pause', (event: BaseEvent): void => {
			const { initiator } = event.getData();
			const aiCopilotBtn = this.getFooterCopilotButton(item);
			const aiCopilotUIBtn = aiCopilotBtn?.getUiButton();
			if (
				!aiCopilotUIBtn
				|| aiCopilotUIBtn.getState() === ButtonState.DISABLED
				|| !aiCopilotBtn?.isPropEqual('data-activity-id', initiator)
			)
			{
				return;
			}

			this.#emitTimelineCopilotTourEvents(aiCopilotUIBtn.getContainer(), 500);
		});

		EventEmitter.subscribe('crm:audioplayer:transcript', (event: BaseEvent): void => {
			const { initiator, action } = event.getData();
			const activityId = item.getDataPayload()?.activityId;
			if (!Type.isInteger(activityId) || activityId !== initiator)
			{
				return;
			}

			if (action === 'open')
			{
				this.#openTranscriptResult(item.getDataPayload());
			}
			else if (action === 'transcribe')
			{
				void this.handleCopilotLaunch(item, {
					activityId: item.getDataPayload()?.activityId,
					ownerTypeId: item.getDataPayload()?.ownerTypeId,
					ownerId: item.getDataPayload()?.ownerId,
					scenario: 'transcribe_record',
				});
			}
		});
	}

	#emitTimelineCopilotTourEvents(target: HTMLElement, delay: number = 1500, payload: ?Object = null): void
	{
		const isWelcomeTourEnabled = payload?.isWelcomeTourEnabled ?? true;
		const isWelcomeTourAutomaticallyEnabled = payload?.isWelcomeTourAutomaticallyEnabled ?? true;
		const isWelcomeTourManuallyEnabled = payload?.isWelcomeTourManuallyEnabled ?? true;

		if (isWelcomeTourEnabled)
		{
			this.#emitTimelineCopilotTourEvent(
				target,
				'BX.Crm.Timeline.Call:onShowCopilotTour',
				'copilot-button-in-call',
				delay,
			);
		}

		if (isWelcomeTourAutomaticallyEnabled)
		{
			this.#emitTimelineCopilotTourEvent(
				target,
				'BX.Crm.Timeline.Call:onShowTourWhenCopilotAutomaticallyStart',
				'copilot-button-in-call-automatically',
				delay,
			);
		}

		if (isWelcomeTourManuallyEnabled)
		{
			this.#emitTimelineCopilotTourEvent(
				target,
				'BX.Crm.Timeline.Call:onShowTourWhenCopilotManuallyStart',
				'copilot-button-in-call-manually',
				delay,
			);
		}
	}

	#emitTimelineCopilotTourEvent(target: Element, eventName: string, stepId: string, delay: Number = 1500): void
	{
		EventEmitter.emit(this, eventName, { target, stepId, delay });
	}

	#getAudioPlayer(item: ConfigurableItem): ?Object
	{
		return item
			?.getLayoutContentBlockById('callGroupOfBlocks')
			?.getBlockById('audio')
		;
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return item.getType() === 'Activity:Call';
	}
}

/* global BXDesktopSystem */
import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { DesktopApi } from 'im.v2.lib.desktop-api';

import { Analytics } from 'call.lib.analytics';

import { CallCloudRecord, CallCommonRecordState, CallCommonRecordType } from '../call_common_record';
import Util from '../util';

/**
 * Manages recording-related UI: record button clicks, record menu popup, cloud record promos,
 * and recording state view updates.
 *
 * Emits events for the controller to handle engine calls:
 *  - `RecordingUiService::onStartRecord` — user triggered a recording start
 *  - `RecordingUiService::onStopRecord` — user triggered a recording stop (also used for pause/resume)
 *  - `RecordingUiService::onDestroyRecord` — user triggered a recording destroy
 */
export class RecordingUiService extends EventEmitter
{
	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {*} [config.callStore]
	 */
	constructor({ viewPort, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.RecordingUiService');

		this.viewPort = viewPort;
		this.callStore = callStore ?? null;

		/**
		 * Tracks whether the local-record start notification has already been shown
		 * to the current user in this call session (prevents duplicate notifications).
		 *
		 * @type {boolean}
		 */
		this.notifyShowed = false;
	}

	/**
	 * Handles the record button click by showing the appropriate menu or promo popup.
	 *
	 * @param {object} recordingState
	 * @param {object} recordingState.commonRecordState — current common record state object from controller
	 * @param {boolean} recordingState.cloudRecordEnabled — whether cloud recording is available for this call
	 * @param {boolean} recordingState.isCloudRecordFeaturesEnabled — whether cloud recording features tariff is enabled
	 * @param {string|number} recordingState.callId — current call id
	 * @param {boolean} recordingState.isServiceEnabled — whether cloud record service is globally enabled
	 */
	onRecordButtonClick({
		commonRecordState,
		cloudRecordEnabled,
		isCloudRecordFeaturesEnabled,
		callId,
		isServiceEnabled,
		canRecord,
	})
	{
		if (!this.viewPort)
		{
			return;
		}

		if (isServiceEnabled)
		{
			if (!CallCloudRecord.tariffAvailable)
			{
				Util.openArticle(CallCloudRecord.tariffSlider);

				return;
			}

			if (!isCloudRecordFeaturesEnabled && !DesktopApi.isDesktop())
			{
				this.viewPort.showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId);

				return;
			}

			this.viewPort.showCommonRecordMenuPopup(isCloudRecordFeaturesEnabled && DesktopApi.isDesktop());

			return;
		}

		if (!canRecord)
		{
			window.BX?.Helper?.show('redirect=detail&code=22079566');

			return;
		}

		this.viewPort.showCommonRecordMenuPopup(true);
	}

	/**
	 * Handles a menu action selected from the common record popup menu.
	 * Shows UI modals/notifications and emits events for the controller to call the engine.
	 *
	 * @param {object} menuAction
	 * @param {string} menuAction.state — one of CallCommonRecordState values
	 * @param {string} menuAction.kind — one of CallCommonRecordType values
	 * @param {boolean} menuAction.hotkey — whether triggered via hotkey (skip confirmation)
	 * @param {object} recordingState
	 * @param {object} recordingState.commonRecordState — current common record state from controller
	 * @param {boolean} recordingState.cloudRecordEnabled — whether cloud recording is available for this call
	 * @param {boolean} recordingState.isCloudRecordFeaturesEnabled
	 * @param {string|number} recordingState.callId
	 * @param {boolean} recordingState.isCopilotActive — whether copilot is currently active
	 */
	onCommonRecordMenu({ state, kind, hotkey }, { commonRecordState, cloudRecordEnabled, isCopilotActive })
	{
		if (!this.viewPort)
		{
			return;
		}

		const isCloud = CallCloudRecord.serviceEnabled && CallCloudRecord.tariffAvailable && cloudRecordEnabled;

		switch (state)
		{
			case CallCommonRecordState.Started: {
				if (hotkey)
				{
					this.emit('RecordingUiService::onStartRecord', {
						isCloud,
						recordType: CallCommonRecordType.Video,
					});

					return;
				}

				if (isCopilotActive && kind === CallCommonRecordType.Audio)
				{
					this.viewPort
						.showConfirmModal({
							title: Loc.getMessage('CALL_RECORD_AUDIO_WITH_COPILOT_TITLE'),
							message: Loc.getMessage('CALL_RECORD_AUDIO_WITH_COPILOT_MESSAGE'),
							yesButtonText: Loc.getMessage('CALL_RECORD_AUDIO_WITH_COPILOT_YES_BUTTON'),
							noButtonText: Loc.getMessage('CALL_RECORD_AUDIO_WITH_COPILOT_NO_BUTTON'),
						})
						.then((choice) => {
							if (choice === 'no')
							{
								this.emit('RecordingUiService::onStartRecord', { recordType: kind, isCloud });
							}
						})
						.catch((error) => console.error('Unspecified error in viewPort.showConfirmModal:', error));

					return;
				}

				this.emit('RecordingUiService::onStartRecord', { recordType: kind, isCloud });

				return;
			}

			case CallCommonRecordState.Paused:
			case CallCommonRecordState.Resumed: {
				this.emit('RecordingUiService::onStopRecord', { state, isCloud });

				return;
			}

			case CallCommonRecordState.Stopped: {
				if (isCloud)
				{
					this.viewPort.blockButtons(['record']);
					this.emit('RecordingUiService::onStopRecord', { state, isCloud: true });

					return;
				}

				this.viewPort.setButtonActive('record', false);

				break;
			}

			case CallCommonRecordState.Destroyed: {
				if (isCloud)
				{
					this.viewPort
						.showConfirmModal({
							title: Loc.getMessage('CALL_CLOUD_RECORD_DESTROY_TITLE'),
							message: Loc.getMessage('CALL_CLOUD_RECORD_DESTROY_MESSAGE'),
							yesButtonText: Loc.getMessage('CALL_CLOUD_RECORD_DESTROY_RESUME_BUTTON'),
							noButtonText: Loc.getMessage('CALL_CLOUD_RECORD_DESTROY_DELETE_BUTTON'),
						})
						.then((choice) => {
							if (choice === 'no')
							{
								this.viewPort?.blockButtons(['record']);
								this.emit('RecordingUiService::onDestroyRecord', { isCloud: true });
							}
						})
						.catch((error) => console.error('Unspecified error in viewPort.showConfirmModal:', error));

					return;
				}

				break;
			}

			default: {
				console.error('Unknown recording state', state);
				break;
			}
		}

		this.emit('RecordingUiService::onStopRecord', { state, isCloud: false });
	}

	/**
	 * Shows the cloud recording feature promo or info popup.
	 *
	 * @param {boolean} isCloudRecordFeaturesEnabled — whether cloud record tariff features are enabled
	 * @param {string|number} callId — current call id
	 */
	showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId)
	{
		if (!this.viewPort)
		{
			return;
		}

		if (isCloudRecordFeaturesEnabled)
		{
			this.viewPort.showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId);
		}
		else
		{
			this.viewPort.showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId);
		}
	}

	/**
	 * Updates common record state in the viewPort and shows the appropriate notification.
	 * Called by the controller on cloud/local record state changes.
	 *
	 * @param {object} commonRecord - common record state object to pass to viewPort
	 * @param {object} notificationContext - context describing which notification to show
	 * @param {'cloudRecord'|'localRecord'} notificationContext.type
	 */
	updateView(commonRecord, notificationContext)
	{
		if (this.viewPort)
		{
			this.viewPort.setCommonRecordState(commonRecord);
			this.viewPort.unblockButtons(['record']);
			this.viewPort.setButtonActive('record', !Util.isCommonRecordStateInactive(commonRecord.state));
		}

		this.#handleNotification(notificationContext);
	}

	/**
	 * Updates the recording state in the viewPort and tracks analytics.
	 *
	 * @param {object} params
	 */
	handleCommonRecordState(params)
	{
		const { state, initiatorId, currentUserId, commonRecordState, callId, callType } = params;

		this.updateView(
			commonRecordState,
			{
				type: 'localRecord',
				initiatorId,
				currentUserId,
				state,
			},
		);

		if (state === CallCommonRecordState.Stopped && initiatorId === currentUserId)
		{
			this.trackLocalRecordStop(callId, callType, commonRecordState);
		}
	}

	/**
	 * Dispatches notification display to the appropriate handler based on context type.
	 *
	 * @param {object} notificationContext
	 * @param {'cloudRecord'|'localRecord'} notificationContext.type
	 */
	#handleNotification(notificationContext)
	{
		if (notificationContext.type === 'cloudRecord')
		{
			this.#handleCloudRecordNotification(notificationContext);
		}
		else if (notificationContext.type === 'localRecord')
		{
			this.#handleLocalRecordNotification(notificationContext);
		}
	}

	/**
	 * Shows cloud recording notification for other participants when a remote user changes
	 * the cloud record state or joins an already-recording call.
	 *
	 * @param {object} context
	 * @param {string|null} context.userId — user who triggered the record state change
	 * @param {string} context.currentUserId — current logged-in user's id
	 * @param {boolean} context.justJoined — whether the user just joined the call
	 * @param {object} context.eventRecordState — raw event.commonRecordState
	 * @param {string} context.eventRecordState.state — the record state from the event
	 */
	#handleCloudRecordNotification({ userId, currentUserId, justJoined, eventRecordState })
	{
		if (!userId || userId === currentUserId)
		{
			return;
		}

		if (justJoined)
		{
			if (eventRecordState.state !== CallCommonRecordState.Started)
			{
				return;
			}

			if (CallCloudRecord.isCisRegion)
			{
				this.viewPort.showCommonRecordStartNotify(userId, CallCommonRecordState.Started);

				if (this.callStore)
				{
					this.callStore.addNotification('recordStarted', { userId, state: CallCommonRecordState.Started });
				}
			}
			else
			{
				this.viewPort.showCommonRecordStartModal();

				if (this.callStore)
				{
					this.callStore.addNotification('recordStarted', { userId, state: CallCommonRecordState.Started });
				}
			}
		}
		else
		{
			this.viewPort.showCommonRecordStartNotify(userId, eventRecordState.state);

			const notificationType = Util.isCommonRecordStateInactive(eventRecordState.state)
				? 'recordStopped'
				: 'recordStarted';

			if (this.callStore)
			{
				this.callStore.addNotification(notificationType, { userId, state: eventRecordState.state });
			}
		}
	}

	/**
	 * Shows local record start notification when another user starts recording.
	 * Tracks via `this.notifyShowed` to avoid duplicate notifications per session.
	 *
	 * @param {object} context
	 * @param {string} context.initiatorId — user who initiated the recording
	 * @param {string} context.currentUserId — current logged-in user's id
	 * @param {string} context.state — current record state
	 */
	#handleLocalRecordNotification({ initiatorId, currentUserId, state })
	{
		if (!this.notifyShowed && state === CallCommonRecordState.Started && initiatorId !== currentUserId)
		{
			this.notifyShowed = true;
			this.viewPort.showCommonRecordStartNotify(initiatorId);

			if (this.callStore)
			{
				this.callStore.addNotification('recordStarted', { userId: initiatorId, state });
			}
		}

		if (Util.isCommonRecordStateInactive(state) && initiatorId !== currentUserId)
		{
			this.notifyShowed = false;
		}
	}

	/**
	 * Handles the desktop local recording start when initiated by the current user.
	 * Formats the filename, fires the API call, tracks analytics, and triggers BXDesktopSystem.
	 *
	 * @param {object} params
	 * @param {string} params.callId - analytics call identifier
	 * @param {string} params.callType - analytics call type
	 * @param {string|number} params.callApiId - currentCall.id (for REST call)
	 * @param {string} params.callUuid - currentCall.uuid (for REST call)
	 * @param {string|number} params.dialogId - associatedEntity.id
	 * @param {string} params.dialogName - associatedEntity.name
	 * @param {string} params.formatRecordDate - date format string
	 * @param {string} params.recordType - commonRecord.type
	 * @param {boolean} params.isMicrophoneMuted - Hardware.isMicrophoneMuted
	 * @param {string} params.windowId - desktop window id (View.RecordSource.Chat)
	 */
	handleLocalRecordStart({
		callId,
		callType,
		callApiId,
		callUuid,
		dialogId,
		dialogName,
		formatRecordDate,
		recordType,
		isMicrophoneMuted,
		windowId,
	})
	{
		const callDate = BX?.date?.format(formatRecordDate) || BX.Main.Date.format(formatRecordDate);

		let fileName = Loc.getMessage('IM_CALL_RECORD_NAME');
		if (fileName)
		{
			fileName = fileName
				.replace('#CHAT_TITLE#', dialogName)
				.replace('#CALL_ID#', callId)
				.replace('#DATE#', callDate);
		}
		else
		{
			fileName = `call_record_${callId}`;
		}

		BX.ajax.runAction('call.Call.onStartRecord', { data: { callId: callApiId, callUuid } });

		Analytics.getInstance().onRecordStart({ callId, callType, recordType, errorCode: null });

		BXDesktopSystem.CallRecordStart({
			windowId,
			fileName,
			callId,
			callDate,
			dialogId,
			dialogName,
			video: recordType !== CallCommonRecordType.Audio,
			muted: isMicrophoneMuted,
			cropTop: 72,
			cropBottom: 90,
			shareMethod: 'im.disk.record.share',
			callType,
		});
	}

	/**
	 * Tracks analytics when a local recording is stopped.
	 *
	 * @param {string} callId - analytics call identifier
	 * @param {string} callType - analytics call type
	 * @param {object|null} commonRecordInfo - current commonRecord.info (for record time)
	 */
	trackLocalRecordStop(callId, callType, commonRecordInfo)
	{
		Analytics.getInstance().onRecordStop({
			callId,
			callType,
			subSection: Analytics.AnalyticsSubSection.window,
			element: Analytics.AnalyticsElement.recordButton,
			recordTime: Util.getRecordTimeText(commonRecordInfo, true),
		});
	}

	/**
	 * Tracks analytics for a cloud record state change (only for the user who triggered it).
	 *
	 * @param {object} params
	 * @param {string} params.currentUserId - local user id
	 * @param {string} params.eventUserId - user id from the event
	 * @param {string} params.newState - new record state (CallCommonRecordState value)
	 * @param {string} params.recordType - record type from event.commonRecordState.type
	 * @param {string} params.previousState - previous commonRecord.state
	 * @param {object|null} params.commonRecordInfo - current commonRecord.info (for record time)
	 * @param {string} params.callId - analytics call id
	 * @param {string} params.callType - analytics call type
	 */
	trackCloudRecordStateChange({
		currentUserId,
		eventUserId,
		newState,
		recordType,
		previousState,
		commonRecordInfo,
		callId,
		callType,
	})
	{
		if (currentUserId !== eventUserId)
		{
			return;
		}

		switch (newState)
		{
			case CallCommonRecordState.Started: {
				if (previousState === CallCommonRecordState.Resumed)
				{
					Analytics.getInstance().onRecordResumed({ callId, callType, errorCode: null });
				}
				else
				{
					Analytics.getInstance().onRecordStart({ callId, callType, recordType, errorCode: null });
				}

				break;
			}

			case CallCommonRecordState.Paused: {
				Analytics.getInstance().onRecordPaused({ callId, callType, errorCode: null });
				break;
			}

			case CallCommonRecordState.Stopped: {
				Analytics.getInstance().onRecordStop({
					callId,
					callType,
					subSection: Analytics.AnalyticsSubSection.window,
					element: Analytics.AnalyticsElement.recordButton,
					recordTime: Util.getRecordTimeText(commonRecordInfo, true),
				});

				break;
			}

			case CallCommonRecordState.Destroyed: {
				Analytics.getInstance().onRecordDelete({ callId, callType, errorCode: null });
				break;
			}

			default: {
				if (Util.isCloudRecordLogEnabled())
				{
					console.error(`Unknown record state: ${newState}`);
				}
			}
		}
	}

	/**
	 * Releases all resources and event listeners held by this service.
	 */
	destroy()
	{
		this.callStore = null;
		this.viewPort = null;
		this.notifyShowed = false;
	}
}

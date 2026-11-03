import { Loc, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { DesktopApi } from 'im.v2.lib.desktop-api';

import { Analytics } from 'call.lib.analytics';
import { ViewRecordSource } from 'call.mapping';

import { CallCloudRecord, CallCommonRecordState, CallCommonRecordType } from '../call_common_record';
import Util from '../util';
import { popupKindOfRoute, RecordRoute, resolveRecordRoute } from './resolve-record-route';

/**
 * Closed list of local record start refusals the client is able to detect. The codes travel to
 * analytics and to the subscribers of `RecordingUiService::onLocalRecordStartFailed` as plain
 * strings, so the list stays local to the service.
 */
const LocalRecordStartError = Object.freeze({
	DesktopCommandUnavailable: 'desktop_command_unavailable',
	DesktopCommandThrew: 'desktop_command_threw',
});

/**
 * Manages recording-related UI: record button clicks, record menu popup, cloud record promos,
 * and recording state view updates.
 *
 * Emits events for the controller to handle engine calls:
 *  - `RecordingUiService::onStartRecord` — user triggered a recording start
 *  - `RecordingUiService::onStopRecord` — user triggered a recording stop (also used for pause/resume)
 *  - `RecordingUiService::onDestroyRecord` — user triggered a recording destroy
 *  - `RecordingUiService::onLocalRecordStartFailed` — a local record start was refused
 */
export class RecordingUiService extends EventEmitter
{
	#recordStopSent = false;

	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 */
	constructor({ viewPort })
	{
		super();
		this.setEventNamespace('BX.Call.RecordingUiService');

		this.viewPort = viewPort;

		/**
		 * Tracks whether the local-record start notification has already been shown
		 * to the current user in this call session (prevents duplicate notifications).
		 *
		 * @type {boolean}
		 */
		this.notifyShowed = false;
	}

	/**
	 * Resets the cloud record_stop dedup flag.
	 * Must be called when a new recording session starts (any type).
	 */
	resetRecordStopSent()
	{
		this.#recordStopSent = false;
	}

	/**
	 * Handles the record button click by showing the appropriate menu or promo popup.
	 *
	 * @param {object} recordingState
	 * @param {boolean} recordingState.isCloudRecordFeaturesEnabled — whether cloud recording features tariff is enabled
	 * @param {string|number} recordingState.callId — current call id
	 * @param {boolean} recordingState.isServiceEnabled — whether cloud record service is globally enabled
	 * @param {boolean} recordingState.canRecord — whether recording is actually available (local desktop or cloud); gates the record menu vs. the tariff helpdesk article
	 */
	onRecordButtonClick({
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

		const { route, isDesktopRecord } = resolveRecordRoute({
			isServiceEnabled,
			canRecord,
			tariffAvailable: CallCloudRecord.tariffAvailable,
			isCloudRecordFeaturesEnabled,
			isDesktop: DesktopApi.isDesktop(),
		});

		switch (route)
		{
			case RecordRoute.Menu: {
				this.viewPort.showCommonRecordMenuPopup(isDesktopRecord);
				break;
			}

			case RecordRoute.Dialog: {
				this.viewPort.showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId);
				break;
			}

			case RecordRoute.TariffArticle: {
				Util.openArticle(CallCloudRecord.tariffSlider);
				break;
			}

			case RecordRoute.HelpArticle: {
				window.BX?.Helper?.show('redirect=detail&code=22079566');
				break;
			}

			// RecordRoute.RecordLimit is decided by the view, so the click never resolves to it here.
			default: {
				break;
			}
		}
	}

	/**
	 * Tells the record button which layer it opens, so that it can announce it before it is pressed.
	 *
	 * Takes the flags the click handler takes, plus the recording limit the view decides on its own:
	 * the announcement and the click must be answered by the same function, or the button promises a
	 * menu and opens an article. Routes that lead to a slider or a hint announce no layer at all.
	 *
	 * Safe to call at any moment of the life of the panel: the button is created lazily, and the view
	 * skips a button that is not there yet.
	 *
	 * @param {object} recordingState
	 * @param {boolean} recordingState.isServiceEnabled - whether cloud record service is globally enabled
	 * @param {boolean} recordingState.canRecord - whether recording is actually available (local desktop or cloud)
	 * @param {boolean} recordingState.isCloudRecordFeaturesEnabled - whether cloud record features tariff is enabled
	 * @param {boolean} recordingState.isRecordLimitReached - whether the recording limit closes the button
	 */
	syncRecordButtonPopupKind({
		isServiceEnabled,
		canRecord,
		isCloudRecordFeaturesEnabled,
		isRecordLimitReached,
	})
	{
		// Every reason of the route is fixed for the life of a call: the cloud record service and its
		// tariff are read once from the settings of the extension, the recording limit from the page,
		// the desktop client from the environment. Only a new call brings a new provider and new cloud
		// record features, and a new call rebinds its events. That is why the callers sync where call
		// events are bound and where the record button is built, and nothing subscribes to the flags.
		if (!this.viewPort)
		{
			return;
		}

		const { route } = resolveRecordRoute({
			isServiceEnabled,
			canRecord,
			tariffAvailable: CallCloudRecord.tariffAvailable,
			isCloudRecordFeaturesEnabled,
			isDesktop: DesktopApi.isDesktop(),
			isRecordLimitReached,
		});

		this.viewPort.setButtonPopupKind('record', popupKindOfRoute(route));
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
	 * @param {boolean} recordingState.cloudRecordEnabled — whether cloud recording is available for this call
	 * @param {boolean} recordingState.isCopilotActive — whether copilot is currently active
	 */
	onCommonRecordMenu({ state, kind, hotkey }, { cloudRecordEnabled, isCopilotActive })
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
							message: Loc.getMessage('CALL_RECORD_AUDIO_WITH_COPILOT_MESSAGE_MSGVER_1'),
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

		this.viewPort.showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId);
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
			}
			else
			{
				this.viewPort.showCommonRecordStartModal();
			}
		}
		else
		{
			this.viewPort.showCommonRecordStartNotify(userId, eventRecordState.state);
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
		}

		if (Util.isCommonRecordStateInactive(state) && initiatorId !== currentUserId)
		{
			this.notifyShowed = false;
		}
	}

	/**
	 * Handles the desktop local recording start when initiated by the current user.
	 * Formats the filename and asks the desktop client to capture; the portal call and the
	 * analytics of a started record follow the capture command, so a refused start is never
	 * recorded as a running one. A detected refusal emits
	 * `RecordingUiService::onLocalRecordStartFailed` and leaves the record state to the controller.
	 *
	 * @param {object} params
	 * @param {string} params.callId - analytics call identifier
	 * @param {string|number} [params.desktopCallId] - identifier the rest of the client knows the call
	 *   by: it names the record file the user sees, so it must not follow the analytics one. Defaults
	 *   to callId, for a caller whose call is known by one identifier only
	 * @param {string} params.callType - analytics call type
	 * @param {string|number} params.callApiId - currentCall.id (for REST call)
	 * @param {string} params.callUuid - currentCall.uuid (for REST call)
	 * @param {string|number} params.dialogId - associatedEntity.id
	 * @param {string} params.dialogName - associatedEntity.name
	 * @param {string} params.formatRecordDate - date format string
	 * @param {string} params.recordType - commonRecord.type
	 * @param {boolean} params.isMicrophoneMuted - Hardware.isMicrophoneMuted
	 * @param {string} [params.windowId] - id of the native window the client is asked to capture.
	 *   The main window of the application answers to the alias `ViewRecordSource.Chat`, which is the
	 *   default here and is what the call in a chat needs. A window opened by the client on its own —
	 *   the public conference page — gets no id of its own (`window.bxdWindowId` is undefined there),
	 *   so it is recognised by the title of its document and has to pass that value itself. Sending
	 *   the alias from such a window makes the client refuse the capture.
	 */
	handleLocalRecordStart({
		callId,
		desktopCallId = callId,
		callType,
		callApiId,
		callUuid,
		dialogId,
		dialogName,
		formatRecordDate,
		recordType,
		isMicrophoneMuted,
		windowId = ViewRecordSource.Chat,
	})
	{
		const callDate = BX?.date?.format(formatRecordDate) || BX.Main.Date.format(formatRecordDate);
		const fileName = this.#buildFileName({ dialogName, desktopCallId, callDate });
		const startCommand = this.#desktopRecordStartCommand();
		const analyticsParams = { callId, callType, recordType };

		if (!Type.isFunction(startCommand))
		{
			this.#failStart(LocalRecordStartError.DesktopCommandUnavailable, analyticsParams);

			return;
		}

		try
		{
			startCommand({
				windowId,
				fileName,
				callId: desktopCallId,
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
		catch (error)
		{
			// The code of the refusal is what analytics counts; the reason of this one lives only in the
			// exception of the client, and without it a report from the field says nothing.
			console.error('BX.Call.RecordingUiService: the desktop client refused the record start', error);
			this.#failStart(LocalRecordStartError.DesktopCommandThrew, analyticsParams);

			return;
		}

		BX.ajax.runAction('call.Call.onStartRecord', { data: { callId: callApiId, callUuid } });

		this.resetRecordStopSent();
		Analytics.getInstance().onRecordStart({
			...analyticsParams,
			errorCode: null,
			storageType: Analytics.AnalyticsStorageType.local,
		});
	}

	/**
	 * The only point where the service reaches the desktop capture command.
	 *
	 * @returns {Function|null} the command bound to its owner, or null when the client has none
	 */
	#desktopRecordStartCommand()
	{
		const command = window.BXDesktopSystem?.CallRecordStart;

		return Type.isFunction(command) ? command.bind(window.BXDesktopSystem) : null;
	}

	/**
	 * @param {object} params
	 * @param {string} params.dialogName
	 * @param {string|number} params.desktopCallId
	 * @param {string} params.callDate
	 * @returns {string} name of the record file the user sees
	 */
	#buildFileName({ dialogName, desktopCallId, callDate })
	{
		const template = Loc.getMessage('IM_CALL_RECORD_NAME');
		if (!template)
		{
			return `call_record_${desktopCallId}`;
		}

		return template
			.replace('#CHAT_TITLE#', dialogName)
			.replace('#CALL_ID#', desktopCallId)
			.replace('#DATE#', callDate);
	}

	/**
	 * Reports a refused local record start: analytics gets the code instead of a success, and the
	 * controller gets the event it turns into a notification and a rollback of the record state.
	 *
	 * @param {string} errorCode - member of LocalRecordStartError
	 * @param {object} analyticsParams - callId, callType and recordType of the refused start
	 */
	#failStart(errorCode, analyticsParams)
	{
		Analytics.getInstance().onRecordStart({
			...analyticsParams,
			errorCode,
			storageType: Analytics.AnalyticsStorageType.local,
		});

		this.emit('RecordingUiService::onLocalRecordStartFailed', { errorCode });
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
			storageType: Analytics.AnalyticsStorageType.local,
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
					Analytics.getInstance().onRecordResumed({
						callId,
						callType,
						errorCode: null,
						storageType: Analytics.AnalyticsStorageType.cloud,
					});
				}
				else
				{
					this.resetRecordStopSent();
					Analytics.getInstance().onRecordStart({
						callId,
						callType,
						recordType,
						errorCode: null,
						storageType: Analytics.AnalyticsStorageType.cloud,
					});
				}

				break;
			}

			case CallCommonRecordState.Paused: {
				Analytics.getInstance().onRecordPaused({
					callId,
					callType,
					errorCode: null,
					storageType: Analytics.AnalyticsStorageType.cloud,
				});
				break;
			}

			case CallCommonRecordState.Stopped: {
				if (!this.#recordStopSent)
				{
					this.#recordStopSent = true;
					Analytics.getInstance().onRecordStop({
						callId,
						callType,
						subSection: Analytics.AnalyticsSubSection.window,
						element: Analytics.AnalyticsElement.recordButton,
						recordTime: Util.getRecordTimeText(commonRecordInfo, true),
						storageType: Analytics.AnalyticsStorageType.cloud,
					});
				}

				break;
			}

			case CallCommonRecordState.Destroyed: {
				Analytics.getInstance().onRecordDelete({
					callId,
					callType,
					errorCode: null,
					storageType: Analytics.AnalyticsStorageType.cloud,
				});
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
	 * Sends record_stop analytics for cloud recording when the call is being disconnected.
	 * Implements ALG-01 dedup: only sends if record_stop has not already been sent in this session.
	 *
	 * @param {string} callId - analytics call identifier
	 * @param {string} callType - analytics call type
	 * @param {object|null} commonRecordInfo - current commonRecord.info (for record time)
	 * @param {boolean} finishCall - true if finishing for all, false if disconnecting only
	 */
	trackCloudRecordStopOnDisconnect(callId, callType, commonRecordInfo, finishCall)
	{
		if (this.#recordStopSent)
		{
			return;
		}

		this.#recordStopSent = true;
		Analytics.getInstance().onRecordStop({
			callId,
			callType,
			subSection: finishCall
				? Analytics.AnalyticsSubSection.contextMenu
				: Analytics.AnalyticsSubSection.window,
			element: finishCall
				? Analytics.AnalyticsElement.finishForAllButton
				: Analytics.AnalyticsElement.disconnectButton,
			recordTime: Util.getRecordTimeText(commonRecordInfo, true),
			storageType: Analytics.AnalyticsStorageType.cloud,
		});
	}

	/**
	 * Releases all resources and event listeners held by this service.
	 */
	destroy()
	{
		this.viewPort = null;
		this.notifyShowed = false;
	}
}

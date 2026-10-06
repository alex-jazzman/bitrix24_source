import { sendData } from 'ui.analytics';

import {
	AnalyticsCategory,
	AnalyticsEvent,
	AnalyticsSection,
	AnalyticsStatus,
	AnalyticsTool,
	AnalyticsType,
} from '../const';
import { getCallTool } from '../utils';

type BaseCallParams = {
	callId: string;
};

type BaseCallTypeParams = BaseCallParams & {
	callType: string;
};

type AIRecordStartParams = BaseCallTypeParams & {
	chatUserCount: number;
	isAutostart?: boolean;
	userCount?: number;
	errorCode?: 'AI_UNAVAILABLE_ERROR' | 'AI_SETTINGS_ERROR' | 'AI_AGREEMENT_ERROR' | 'AI_NOT_ENOUGH_BAAS_ERROR';
};

type AIRecordStatusChangedParams = BaseCallTypeParams & {
	isAIOn: boolean;
	error?: string;
};

type OpenFollowUpTabParams = BaseCallParams & {
	tabName: string;
};

type AIRestrictionsPopupShowParams = BaseCallParams & {
	popupType: string;
};

type CopilotNotifyShowParams = BaseCallParams & {
	isCopilotActive: boolean;
};

export class Copilot
{
	#callAutoStartRecordSent: Array<string> = [];

	onAIRecordStart(params: AIRecordStartParams)
	{
		if (params?.isAutostart && this.#callAutoStartRecordSent.includes(params.callId))
		{
			return;
		}

		this.#callAutoStartRecordSent.push(params.callId);

		const errorCodes = {
			AI_UNAVAILABLE_ERROR: AnalyticsStatus.errorB24,
			AI_SETTINGS_ERROR: AnalyticsStatus.errorB24,
			AI_AGREEMENT_ERROR: AnalyticsStatus.errorAgreement,
			AI_NOT_ENOUGH_BAAS_ERROR: AnalyticsStatus.errorLimitBaas,
		};

		const resultData = {
			tool: AnalyticsTool.ai,
			category: AnalyticsCategory.callsOperations,
			event: AnalyticsEvent.aiRecordStart,
			type: params.callType,
			c_section: AnalyticsSection.callFollowup,
			p2: `chatUserCount_${params.chatUserCount}`,
			p5: `callId_${params.callId}`,
		};

		// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
		resultData.p1 = params?.isAutostart ? 'launchType_auto' : 'launchType_manual';

		if (params?.userCount)
		{
			// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
			resultData.p3 = `userCount_${params.userCount}`;
		}

		// @ts-expect-error [call-ts] wait AnalyticsOptions from ui.analytics to ts
		resultData.status = params?.errorCode ? errorCodes[params.errorCode] : AnalyticsStatus.success;

		sendData(resultData);
	}

	onAIRecordStatusChanged(params: AIRecordStatusChangedParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: params.isAIOn ? AnalyticsEvent.aiOn : AnalyticsEvent.aiOff,
			type: params.callType,
			// @ts-expect-error [call-ts] AnalyticsOptions.status is too narrow; wait ui.analytics to ts
			status: params?.error ? `error_${params.error}` : AnalyticsStatus.success,
			p5: `callId_${params.callId}`,
		});
	}

	onOpenFollowUpTab(params: OpenFollowUpTabParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callFollowup,
			event: AnalyticsEvent.openTab,
			type: params.tabName,
			p5: `callId_${params.callId}`,
		});
	}

	onOpenFollowUpSlider(params: BaseCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callFollowup,
			event: AnalyticsEvent.openSlider,
			p5: `callId_${params.callId}`,
		});
	}

	onFollowUpCreateEventClick(params: BaseCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callFollowup,
			event: AnalyticsEvent.clickCreateEvent,
			p5: `callId_${params.callId}`,
		});
	}

	onFollowUpCreateTaskClick(params: BaseCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callFollowup,
			event: AnalyticsEvent.clickCreateTask,
			p5: `callId_${params.callId}`,
		});
	}

	onAIRestrictionsPopupShow(params: AIRestrictionsPopupShowParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.viewPopup,
			type: params.popupType,
			p5: `callId_${params.callId}`,
		});
	}

	onCopilotNotifyShow(params: CopilotNotifyShowParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.viewNotification,
			type: params.isCopilotActive ? AnalyticsType.aiOn : AnalyticsType.turnOnAi,
			p5: `callId_${params.callId}`,
		});
	}

	onAIRecordTimeCodeClick(params: BaseCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callFollowup,
			event: AnalyticsEvent.clickTimeCode,
			p5: `callId_${params.callId}`,
		});
	}

	onAIPlayRecord(params: BaseCallParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callFollowup,
			event: AnalyticsEvent.playRecord,
			p5: `callId_${params.callId}`,
		});
	}

	onClickAIOff(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.clickAiOff,
			type: params.callType,
			p5: `callId_${params.callId}`,
		});
	}

	onSelectAIOff(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.call,
			event: AnalyticsEvent.aiOff,
			type: params.callType,
			p5: `callId_${params.callId}`,
		});
	}

	onSelectAIDelete(params: BaseCallTypeParams)
	{
		sendData({
			tool: getCallTool(),
			category: AnalyticsCategory.callFollowup,
			event: AnalyticsEvent.delete,
			type: params.callType,
			c_section: AnalyticsSection.call,
			p5: `callId_${params.callId}`,
		});
	}
}

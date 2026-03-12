import { GetParameter } from 'im.v2.const';

export const BindingsCondition = {
	openLinesHistory: new RegExp(
		`\\?${GetParameter.openHistory}=([^&]+)`,
		'i',
	),
	openLines: new RegExp(
		`\\?${GetParameter.openLines}=([^&]+)`,
		'i',
	),
	openCopilotChat: new RegExp(
		`\\?${GetParameter.openCopilotChat}=([^&]+)`,
		'i',
	),
	openChannel: new RegExp(
		`\\?${GetParameter.openChannel}=([^&]+)`,
		'i',
	),
	openCollab: new RegExp(
		`\\?${GetParameter.openCollab}=([^&]+)`,
		'i',
	),
	openSharedLink: new RegExp(
		`\\?${GetParameter.openSharedLink}=([^&]+)`,
		'i',
	),
	openTaskComments: new RegExp(
		`\\?${GetParameter.openTaskComments}=([^&]+)(&${GetParameter.openMessage}=([^&]+))?`,
		'i',
	),
	openBotContext: new RegExp(
		`\\?${GetParameter.openChat}=([^&]+)(&${GetParameter.botContext}=([^&]+))`,
		'i',
	),
	openChat: new RegExp(
		`\\?${GetParameter.openChat}=([^&]+)(&${GetParameter.openMessage}=([^&]+))?`,
		'i',
	),

	openOriginRoot: new RegExp(`${location.origin}/online/$`),
	openRoot: /^\/online\/$/,
	openExtranetRoot: /^\/extranet\/online\/$/,

	openCollabLayout: new RegExp(`/online/\\?${GetParameter.openCollab}(?=&|$)`, 'i'),
	openCopilotChatLayout: new RegExp(`/online/\\?${GetParameter.openCopilotChat}(?=&|$)`, 'i'),
	openChannelLayout: new RegExp(`/online/\\?${GetParameter.openChannel}(?=&|$)`, 'i'),
};

import type { CopilotChatOptions } from 'ai.copilot-chat.ui';
import { Loc } from 'main.core';
import { CopilotAdvice } from './copilot-advice';

export const getDefaultChatOptions = (): CopilotChatOptions => {
	const popupWidth = 420;
	const avatarSrc = '/bitrix/js/tasks/flow/copilot-advice/images/copilot-advice-avatar.png';
	const copilotName = CopilotAdvice.getCopilotName();

	return {
		popupOptions: {
			fixed: true,
			width: popupWidth,
			bindElement: {
				left: window.innerWidth - popupWidth - 85,
				top: 50,
			},
			cacheable: false,
			className: 'tasks-flow__copilot-chat-popup',
			animation: {
				showClassName: 'tasks-flow__copilot-chat-popup-show',
				closeClassName: 'tasks-flow__copilot-chat-popup-close',
				closeAnimationType: 'animation',
			},
		},
		loaderText: Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_LOADER_TEXT'),
		header: {
			title: Loc.getMessage('TASKS_FLOW_COPILOT_ADVICE_POPUP_TITLE_MSGVER_1', {
				'#COPILOT_NAME#': copilotName,
			}),
			avatar: avatarSrc,
			useCloseIcon: true,
		},
		botOptions: {
			avatar: avatarSrc,
			messageTitle: copilotName,
			messageMenuItems: [],
		},
		useInput: false,
		useChatStatus: false,
		scrollToTheEndAfterFirstShow: false,
		showCopilotWarningMessage: true,
	};
};

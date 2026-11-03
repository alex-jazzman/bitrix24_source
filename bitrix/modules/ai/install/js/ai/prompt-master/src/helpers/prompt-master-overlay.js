import { PopupManager } from 'main.popup';

export const PROMPT_MASTER_POPUP_ID = 'prompt-master-popup';

export const syncPromptMasterOverlay = (): void => {
	const popup = PopupManager.getPopupById(PROMPT_MASTER_POPUP_ID);
	if (!popup?.isShown() || !popup.hasOverlay())
	{
		return;
	}

	popup.hideOverlay();
	popup.resizeOverlay();
	popup.showOverlay();
};

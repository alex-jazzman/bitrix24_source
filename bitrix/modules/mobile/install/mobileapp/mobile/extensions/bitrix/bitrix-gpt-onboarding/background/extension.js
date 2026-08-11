(() => {
	const require = (ext) => jn.require(ext);

	const { BitrixGptOnboardingUIManager } = require('bitrix-gpt-onboarding/ui-manager');
	const { ONBOARDING_OPEN_CHAT_EVENT } = require('bitrix-gpt-onboarding/const');
	const { openChat } = require('bitrix-gpt-onboarding/utils');

	BX.addCustomEvent(ONBOARDING_OPEN_CHAT_EVENT, (dialogId) => {
		void openChat(dialogId);
	});

	void BitrixGptOnboardingUIManager.openInBackgroundIfNeeded();
})();

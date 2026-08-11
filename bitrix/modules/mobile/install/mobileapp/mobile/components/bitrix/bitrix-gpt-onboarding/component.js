(() => {
	const require = (extension) => jn.require(extension);

	const { Tourist } = require('tourist');
	const { ONBOARDING_TOURIST_EVENT, ONBOARDING_OPEN_CHAT_EVENT } = require('bitrix-gpt-onboarding/const');
	const { BitrixGptOnboardingBanner } = require('bitrix-gpt-onboarding/banner');

	BX.onViewLoaded(() => {
		void Tourist.remember(ONBOARDING_TOURIST_EVENT);

		let dialogId = null;

		layout.setListener((eventName) => {
			if (eventName === 'onViewHidden' && dialogId)
			{
				BX.postComponentEvent(ONBOARDING_OPEN_CHAT_EVENT, [dialogId]);
			}
		});

		void BitrixGptOnboardingBanner.show({
			onClose: ({ dialogId: id } = {}) => {
				dialogId = id ?? null;
				layout.close();
			},
		});
	});
})();

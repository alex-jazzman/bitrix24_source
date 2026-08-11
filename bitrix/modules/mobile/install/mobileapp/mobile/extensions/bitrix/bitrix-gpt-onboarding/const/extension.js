/**
 * @module bitrix-gpt-onboarding/const
 */
jn.define('bitrix-gpt-onboarding/const', (require, exports, module) => {
	const ONBOARDING_COMPONENT_NAME = 'bitrix-gpt-onboarding';
	const ONBOARDING_TOURIST_EVENT = 'bitrix_gpt_onboarding_shown';
	const ONBOARDING_OPEN_CHAT_EVENT = 'bitrix_gpt_onboarding_open_chat';

	module.exports = {
		ONBOARDING_COMPONENT_NAME,
		ONBOARDING_TOURIST_EVENT,
		ONBOARDING_OPEN_CHAT_EVENT,
	};
});

/**
 * @module mail/signatures/aha
 */
jn.define('mail/signatures/aha', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Tourist } = require('tourist');
	const { AhaMoment, ButtonType } = require('ui-system/popups/aha-moment');

	const SIGNATURES_AHA_EVENT = 'mail_signatures_aha_shown';
	const SIGNATURES_OPENED_EVENT = 'mail_signatures_section_opened';

	function showSignaturesAhaMoment({ targetRef, onClick })
	{
		return Tourist.ready().then(() => {
			if (!Tourist.firstTime(SIGNATURES_AHA_EVENT))
			{
				return false;
			}

			AhaMoment.show({
				testId: 'mail-signatures-aha',
				targetRef,
				title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_SIGNATURES_AHA_TITLE'),
				description: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_SIGNATURES_AHA_DESCRIPTION'),
				buttonText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_SIGNATURES_AHA_ACTION'),
				bottomButtonType: ButtonType.GO_TO_FEATURE,
				disableHideByOutsideClick: false,
				delay: 500,
				onClick,
				onShow: () => Tourist.remember(SIGNATURES_AHA_EVENT),
			});

			return true;
		});
	}

	function isSignaturesOpenedFirstTime()
	{
		return Tourist.firstTime(SIGNATURES_OPENED_EVENT);
	}

	function rememberSignaturesOpened()
	{
		return Tourist.remember(SIGNATURES_OPENED_EVENT);
	}

	module.exports = {
		showSignaturesAhaMoment,
		isSignaturesOpenedFirstTime,
		rememberSignaturesOpened,
	};
});

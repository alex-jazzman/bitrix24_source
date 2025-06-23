/**
 * @module layout/ui/app-rating/src/rating-constants
 */
jn.define('layout/ui/app-rating/src/rating-constants', (require, exports, module) => {
	const PathToExtension = `${currentDomain}/bitrix/mobileapp/mobile/extensions/bitrix/layout/ui/app-rating`;
	const LottiePath = `${PathToExtension}/lottie`;

	const HighestRate = 4;
	const BackdropHeight = 450;

	module.exports = {
		HighestRate,
		BackdropHeight,
		LottiePath,
	};
});

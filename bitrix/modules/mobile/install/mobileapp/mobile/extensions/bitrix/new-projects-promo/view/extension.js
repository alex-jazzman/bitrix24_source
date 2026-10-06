/**
 * @module new-projects-promo/view
 */
jn.define('new-projects-promo/view', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Icon } = require('assets/icons');
	const { InfoScreen } = require('layout/ui/info-screen');
	const { AiLoc } = require('loc');
	const {
		createAiStarsGradientIcon,
		getBitrixGptTextGradient,
	} = require('new-projects-promo/view/src/bitrix-gpt-branding');

	const IMAGE_MIN_SCREEN_HEIGHT = 800;

	/**
	 * @param {NewProjectsPromoProps} props
	 * @return {LayoutComponent<Record<string, unknown>, Record<string, never>>}
	 */
	function NewProjectsPromo({ onClose })
	{
		return InfoScreen({
			testId: 'new-projects-promo',
			contentMaxWidth: device.screen.width,
			itemsPaddingHorizontal: 0,
			testIds: {
				box: 'new-projects-promo-screen',
				content: 'new-projects-promo',
				image: 'new-projects-promo-image',
				footer: 'new-projects-promo-footer',
				primaryButton: 'new-projects-promo-button',
			},
			withScroll: true,
			image: device.screen.height < IMAGE_MIN_SCREEN_HEIGHT
				? null
				: {
					uri: makeLibraryImagePath('zephyr-projects.png', 'projects-v2'),
					resizeMode: 'contain',
					width: 120,
					height: 94,
				},
			title: AiLoc.getMessage('MOBILE_NEW_PROJECTS_PROMO_TITLE'),
			items: [
				{
					icon: Icon.FOLDER,
					title: AiLoc.getMessage('MOBILE_NEW_PROJECTS_PROMO_ITEM_1_TITLE'),
					description: AiLoc.getMessage('MOBILE_NEW_PROJECTS_PROMO_ITEM_1_DESCRIPTION'),
				},
				{
					icon: Icon.CHATS,
					title: AiLoc.getMessage('MOBILE_NEW_PROJECTS_PROMO_ITEM_2_TITLE'),
					description: AiLoc.getMessage('MOBILE_NEW_PROJECTS_PROMO_ITEM_2_DESCRIPTION'),
				},
				{
					icon: createAiStarsGradientIcon(),
					title: AiLoc.getMessage('MOBILE_NEW_PROJECTS_PROMO_ITEM_3_TITLE'),
					titleGradient: getBitrixGptTextGradient(),
					description: AiLoc.getMessage('MOBILE_NEW_PROJECTS_PROMO_ITEM_3_DESCRIPTION'),
				},
			],
			footer: true,
			primaryButton: {
				testId: 'new-projects-promo-button',
				text: AiLoc.getMessage('MOBILE_NEW_PROJECTS_PROMO_BUTTON'),
				onClick: onClose,
			},
		});
	}

	module.exports = {
		NewProjectsPromo,
	};
});

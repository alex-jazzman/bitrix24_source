/**
 * @module assets/icons/src/gratitude
 */
jn.define('assets/icons/src/gratitude', (require, exports, module) => {
	const { BaseIcon } = require('assets/icons/src/base');
	const { Loc } = require('loc');

	const ImageDir = `${currentDomain}/bitrix/mobileapp/mobile/extensions/bitrix/assets/gratitude-icons`;

	class GratitudeIcon extends BaseIcon
	{
		static BEER = new GratitudeIcon('BEER', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_BEER'),
			testId: 'beer-gratitude-image',
			path: `${ImageDir}/beer.svg`,
			content: '',
			imageUrl: '',
		});

		static CAKE = new GratitudeIcon('CAKE', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_CAKE'),
			testId: 'cake-gratitude-image',
			path: `${ImageDir}/cake.svg`,
			content: '',
			imageUrl: '',
		});

		static COCKTAIL = new GratitudeIcon('COCKTAIL', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_COCKTAIL'),
			testId: 'cocktail-gratitude-image',
			path: `${ImageDir}/cocktail.svg`,
			content: '',
			imageUrl: '',
		});

		static CROWN = new GratitudeIcon('CROWN', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_CROWN'),
			testId: 'crown-gratitude-image',
			path: `${ImageDir}/crown.svg`,
			content: '',
			imageUrl: '',
		});

		static CUP = new GratitudeIcon('CUP', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_CUP'),
			testId: 'cup-gratitude-image',
			path: `${ImageDir}/cup.svg`,
			content: '',
			imageUrl: '',
		});

		static FLAG = new GratitudeIcon('FLAG', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_FLAG'),
			testId: 'flag-gratitude-image',
			path: `${ImageDir}/flag.svg`,
			content: '',
			imageUrl: '',
		});

		static FLOWER = new GratitudeIcon('FLOWER', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_FLOWER'),
			testId: 'flower-gratitude-image',
			path: `${ImageDir}/flower.svg`,
			content: '',
			imageUrl: '',
		});

		static GIFT = new GratitudeIcon('GIFT', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_GIFT'),
			testId: 'gift-gratitude-image',
			path: `${ImageDir}/gift.svg`,
			content: '',
			imageUrl: '',
		});

		static HEART = new GratitudeIcon('HEART', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_HEART'),
			testId: 'heart-gratitude-image',
			path: `${ImageDir}/heart.svg`,
			content: '',
			imageUrl: '',
		});

		static FIRST_PLACE = new GratitudeIcon('FIRST_PLACE', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_FIRST_PLACE'),
			testId: 'first-place-gratitude-image',
			path: `${ImageDir}/medal.svg`,
			content: '',
			imageUrl: '',
		});

		static MONEY = new GratitudeIcon('MONEY', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_MONEY'),
			testId: 'money-gratitude-image',
			path: `${ImageDir}/money.svg`,
			content: '',
			imageUrl: '',
		});

		static SMILE = new GratitudeIcon('SMILE', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_SMILE'),
			testId: 'smile-gratitude-image',
			path: `${ImageDir}/smile.svg`,
			content: '',
			imageUrl: '',
		});

		static STAR = new GratitudeIcon('STAR', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_STAR'),
			testId: 'star-gratitude-image',
			path: `${ImageDir}/star.svg`,
			content: '',
			imageUrl: '',
		});

		static SUCCESS = new GratitudeIcon('SUCCESS', {
			name: Loc.getMessage('M_UI_GRATITUDE_ICON_SUCCESS'),
			testId: 'success-gratitude-image',
			path: `${ImageDir}/success.svg`,
			content: '',
			imageUrl: '',
		});

		/**
		 * @param {string} name
		 * @returns {string|null}
		 */
		static getTestIdByName(name)
		{
			const badge = this.getEnums().find((item) => item.getIconName() === name);

			return badge ? badge.getValue().testId : null;
		}

		/**
		 * @param {string} name
		 * @returns {string|null}
		 */
		static getSvgUriByName(name)
		{
			const badge = this.getEnums().find((item) => item.getIconName() === name);

			return badge ? badge.getPath() : null;
		}

		/**
		 * @param {string} name
		 * @returns {GratitudeIcon|null}
		 */
		static getEnumByName(name)
		{
			return this.getEnums().find((item) => item.getIconName() === name) || null;
		}
	}

	module.exports = {
		GratitudeIcon,
	};
});

export type DeviceItem = {
	name: string,
	code: string,
	className: string,
	langCode?: string,
};

/**
 * IMPORTANT:
 * For non-Apple devices, width and height values are calculated relatively:
 *  - mobile devices are calculated relative to Apple iPhone (6.3")
 *  - tablet devices are calculated relative to Apple iPad Pro (13")
 *
 * This is required to preserve correct visual proportions in preview mode.
 * A physically smaller device must never be rendered larger than a physically bigger one,
 * even if its native screen resolution is higher.
 *
 * Apple devices are used as reference points because their physical dimensions
 * are well-known and stable.
 */
export const Devices = {
	defaultDevice: {
		tablet: 'iPad11',
		mobile: 'iPhone',
	},
	devices: {
		delimiter1: {
			code: 'delimiter',
			langCode: 'LANDING_PREVIEW_DEVICE_MOBILES',
		},
		// Apple iPhone 17 / Apple iPhone 17 Pro
		iPhone: {
			name: 'Apple iPhone (6.3")',
			code: 'iPhone',
			className: '--iphone',
			width: 1206 / 3, // 402
			height: 2622 / 3, // 874
			type: 'mobile',
		},
		// Apple iPhone 17 Air
		iPhoneAir: {
			name: 'Apple iPhone Air (6.5")',
			code: 'iPhoneAir',
			className: '--iphone-air',
			width: 1260 / 3, // 420
			height: 2736 / 3, // 912
			type: 'mobile',
		},
		// Apple iPhone 17 Pro Max
		iPhoneProMax: {
			name: 'Apple iPhone Pro Max (6.9")',
			code: 'iPhoneProMax',
			className: '--iphone-pro-max',
			width: 1320 / 3, // 440
			height: 2868 / 3, // 956
			type: 'mobile',
		},
		// Apple iPhone SE 4
		iPhoneSE: {
			name: 'Apple iPhone SE (4.7")',
			code: 'iPhoneSE',
			className: '--iphone-se',
			width: 1179 / 3, // 393
			height: 2532 / 3, // 844
			type: 'mobile',
		},
		// Samsung Galaxy S26
		// Dimensions are calculated relatively to Apple iPhone (6.3")
		// to preserve correct visual proportions in preview
		samsungGalaxy: {
			name: 'Samsung Galaxy (6.3")',
			code: 'samsungGalaxy',
			className: '--samsung-galaxy',
			// width: 1080 / 3, // 360
			// height: 2340 / 3, // 780
			width: 1212 / 3, // 404
			height: 2616 / 3, // 872
			type: 'mobile',
		},
		// Samsung Galaxy S26 +
		// Dimensions are calculated relatively to Apple iPhone (6.3")
		// to preserve correct visual proportions in preview
		samsungGalaxyPlus: {
			name: 'Samsung Galaxy + (6.7")',
			code: 'samsungGalaxyPlus',
			className: '--samsung-galaxy-plus',
			// width: 1440 / 3, // 480
			// height: 3120 / 3, // 1040
			width: 1287 / 3, // 429
			height: 2781 / 3, // 927
			type: 'mobile',
		},
		// Xiaomi Redmi Note 15 Pro
		// Dimensions are calculated relatively to Apple iPhone (6.3")
		// to preserve correct visual proportions in preview
		xiaomiRedmiNotePro: {
			name: 'Xiaomi Redmi Note Pro (6.8")',
			code: 'xiaomiRedmiNotePro',
			className: '--xiaomi-redmi-note-pro',
			// width: 1280 / 3, // 427
			// height: 2772 / 3, // 924
			width: 1308 / 3, // 436
			height: 2826 / 3, // 942
			type: 'mobile',
		},
		delimiter2: {
			code: 'delimiter',
			langCode: 'LANDING_PREVIEW_DEVICE_TABLETS',
		},
		iPadMini: {
			name: 'Apple iPad Mini (8.3")',
			code: 'iPadMini',
			className: '--ipad-mini',
			width: 1488 / 2, // 744
			height: 2266 / 2, // 1133
			type: 'tablet',
		},
		// Apple iPad 11‑inch
		iPad11: {
			name: 'Apple iPad (11")',
			code: 'iPad11',
			className: '--ipad-11',
			width: 1640 / 2, // 820
			height: 2360 / 2, // 1180
			type: 'tablet',
		},
		// Apple iPad Pro 13‑inch
		iPad13: {
			name: 'Apple iPad Pro (13")',
			code: 'iPad13',
			className: '--ipad-13',
			width: 2048 / 2, // 1024
			height: 2732 / 2, // 1366
			type: 'tablet',
		},
		// Galaxy Tab S11 Ultra
		// Dimensions are calculated relatively to Apple iPad Pro (13")
		// to preserve correct visual proportions in preview
		samsungGalaxyTabUltra: {
			name: 'Samsung Galaxy Tab Ultra (14.6")',
			code: 'samsungGalaxyTabUltra',
			className: '--samsung-galaxy-tab-ultra',
			// width: 1848 / 2.5, // 739
			// height: 2960 / 2.5, // 1184
			width: 2064 / 2, // 1032,
			height: 3304 / 2, // 1652
			type: 'tablet',
		},
	},
};

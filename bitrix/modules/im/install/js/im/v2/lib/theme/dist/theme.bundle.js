/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, im_v2_application_core, im_v2_const, im_v2_lib_collab, im_v2_lib_feature) {
	'use strict';

	const ThemeType = Object.freeze({
		light: 'light',
		dark: 'dark'
	});
	const ThemePattern = Object.freeze({
		default: 'default',
		aiAssistant: 'ai-assistant'
	});

	/**
	 * Synced with \Bitrix\Im\V2\Chat\Background\BackgroundId (selectable cases).
	 */
	const SelectableBackgroundId = Object.freeze({
		azure: 'azure',
		mint: 'mint',
		steel: 'steel',
		slate: 'slate',
		teal: 'teal',
		cornflower: 'cornflower',
		sky: 'sky',
		peach: 'peach',
		frost: 'frost'
	});
	const SelectableBackground = Object.freeze({
		// dark ones
		[SelectableBackgroundId.azure]: {
			color: '#9fcfff',
			type: ThemeType.dark,
			pattern: ThemePattern.default
		},
		[SelectableBackgroundId.mint]: {
			color: '#81d8bf',
			type: ThemeType.dark,
			pattern: ThemePattern.default
		},
		[SelectableBackgroundId.steel]: {
			color: '#7fadd1',
			type: ThemeType.dark,
			pattern: ThemePattern.default
		},
		[SelectableBackgroundId.slate]: {
			color: '#7a90b6',
			type: ThemeType.dark,
			pattern: ThemePattern.default
		},
		[SelectableBackgroundId.teal]: {
			color: '#5f9498',
			type: ThemeType.dark,
			pattern: ThemePattern.default
		},
		[SelectableBackgroundId.cornflower]: {
			color: '#799fe1',
			type: ThemeType.dark,
			pattern: ThemePattern.default
		},
		// light ones
		[SelectableBackgroundId.sky]: {
			color: '#cfeefa',
			type: ThemeType.light,
			pattern: ThemePattern.default
		},
		[SelectableBackgroundId.peach]: {
			color: '#efded3',
			type: ThemeType.light,
			pattern: ThemePattern.default
		},
		[SelectableBackgroundId.frost]: {
			color: '#eff4f6',
			type: ThemeType.light,
			pattern: ThemePattern.default
		}
	});

	// should be synced with \Bitrix\Im\V2\Chat\Background\BackgroundId
	const SpecialBackgroundId = {
		collab: 'collab',
		collabV2: 'collabV2',
		martaAI: 'martaAI',
		copilot: 'copilot',
		aiAssistant: 'aiAssistant',
		aiAssistantWidget: 'aiAssistantWidget',
		notifications: 'notifications',
		transparent: 'transparent'
	};
	const SpecialBackground = {
		[SpecialBackgroundId.collab]: {
			color: '#76c68b',
			type: ThemeType.dark,
			pattern: ThemePattern.default
		},
		[SpecialBackgroundId.collabV2]: {
			color: '#5E96F0',
			type: ThemeType.dark,
			pattern: ThemePattern.default
		},
		[SpecialBackgroundId.martaAI]: {
			color: '#0277ff',
			type: ThemeType.dark,
			pattern: ThemePattern.aiAssistant
		},
		[SpecialBackgroundId.copilot]: SelectableBackground[SelectableBackgroundId.slate],
		[SpecialBackgroundId.aiAssistant]: {
			color: '#9294D1',
			type: ThemeType.dark,
			pattern: ThemePattern.default
		},
		[SpecialBackgroundId.aiAssistantWidget]: {
			color: '#5B4FC7',
			type: ThemeType.dark
		},
		[SpecialBackgroundId.notifications]: {
			color: '#fafcfd',
			type: ThemeType.light,
			pattern: ThemePattern.default
		},
		[SpecialBackgroundId.transparent]: {
			color: 'transparent',
			type: ThemeType.light
		}
	};

	/**
	 * Maps background IDs to image file name.
	 * Images are at /bitrix/js/im/images/chat-v2-background/{name}.[png|webp]
	 */
	const ImageFileByBackgroundId = {
		[SpecialBackgroundId.collab]: 'collab',
		[SpecialBackgroundId.collabV2]: 'collabV2',
		[SpecialBackgroundId.martaAI]: 'ai-assistant',
		[SpecialBackgroundId.copilot]: '4',
		[SpecialBackgroundId.aiAssistant]: 'ai-assistant-v2',
		[SpecialBackgroundId.aiAssistantWidget]: 'ai-assistant-widget.webp',
		[SpecialBackgroundId.notifications]: '11',
		[SelectableBackgroundId.azure]: '1',
		[SelectableBackgroundId.mint]: '2',
		[SelectableBackgroundId.steel]: '3',
		[SelectableBackgroundId.slate]: '4',
		[SelectableBackgroundId.teal]: '5',
		[SelectableBackgroundId.cornflower]: '6',
		[SelectableBackgroundId.sky]: '7',
		[SelectableBackgroundId.peach]: '9',
		[SelectableBackgroundId.frost]: '11'
	};

	const IMAGE_FOLDER_PATH = '/bitrix/js/im/images/chat-v2-background';
	const BackgroundPatternColor = Object.freeze({
		white: 'white',
		gray: 'gray'
	});
	const ThemeManager = {
		isLightTheme() {
			const backgroundId = im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.appearance.background);
			const selectedColorScheme = SelectableBackground[backgroundId];
			return selectedColorScheme?.type === ThemeType.light;
		},
		isDarkTheme() {
			const backgroundId = im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.appearance.background);
			const selectedColorScheme = SelectableBackground[backgroundId];
			return selectedColorScheme?.type === ThemeType.dark;
		},
		getCurrentBackgroundStyle(dialogId) {
			const backgroundId = resolveBackgroundId(dialogId);
			return this.getBackgroundStyleById(backgroundId);
		},
		getBackgroundStyleById(backgroundId) {
			const backgroundsList = {
				...SelectableBackground,
				...SpecialBackground
			};
			const colorScheme = backgroundsList[backgroundId];
			if (!colorScheme) {
				return this.getCurrentBackgroundStyle();
			}
			return {
				...buildBackgroundStyles(colorScheme, backgroundId),
				backgroundColor: colorScheme.color
			};
		}
	};

	/** Background selection priority:
	 * 1. If there is no dialog context: user selected background (from user settings)
	 * 2. Background by chat type (collab/copilot/aiAssistant)
	 * 3. Chat background (from chat fields)
	 * 4. Bot background (from bot fields)
	 * 5. User selected background (from user settings)
	 */
	const resolveBackgroundId = dialogId => {
		const userBackground = im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.appearance.background);
		if (!main_core.Type.isStringFilled(dialogId)) {
			return userBackground;
		}
		const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
		if (chat.type === im_v2_const.ChatType.collab) {
			return im_v2_lib_collab.CollabManager.getBackgroundId(chat);
		}
		if (chat.type === im_v2_const.ChatType.copilot) {
			if (im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isBitrixGptV2Available)) {
				return SpecialBackgroundId.aiAssistant;
			}
			return SpecialBackgroundId.copilot;
		}
		const isAiAssistant = im_v2_application_core.Core.getStore().getters['users/bots/isAiAssistant'](dialogId);
		if (isAiAssistant) {
			return SpecialBackgroundId.martaAI;
		}
		const chatBackground = im_v2_application_core.Core.getStore().getters['chats/getBackgroundId'](dialogId);
		if (main_core.Type.isStringFilled(chatBackground)) {
			return chatBackground;
		}
		const botBackground = im_v2_application_core.Core.getStore().getters['users/bots/getBackgroundId'](dialogId);
		if (main_core.Type.isStringFilled(botBackground)) {
			return botBackground;
		}
		return userBackground;
	};
	const getPatternBackgroundStyleLayer = colorScheme => {
		if (!colorScheme.pattern) {
			return null;
		}
		const patternColor = colorScheme.type === ThemeType.light ? BackgroundPatternColor.gray : BackgroundPatternColor.white;
		return {
			image: `url('${IMAGE_FOLDER_PATH}/pattern-${patternColor}-${colorScheme.pattern}.svg')`,
			position: 'top right',
			repeat: 'repeat',
			size: 'auto'
		};
	};
	const getHighlightBackgroundStyleLayer = backgroundId => {
		const fileName = ImageFileByBackgroundId[backgroundId];
		if (!fileName) {
			return null;
		}
		const hasExtension = fileName.includes('.');
		const fullName = hasExtension ? fileName : `${fileName}.png`;
		return {
			image: `url('${IMAGE_FOLDER_PATH}/${fullName}')`,
			position: 'center',
			repeat: 'no-repeat',
			size: 'cover'
		};
	};
	const buildBackgroundStyles = (colorScheme, backgroundId) => {
		const patternLayer = getPatternBackgroundStyleLayer(colorScheme);
		const highlightLayer = getHighlightBackgroundStyleLayer(backgroundId);
		if (!patternLayer && !highlightLayer) {
			return {};
		}
		if (patternLayer && highlightLayer) {
			return {
				backgroundImage: `${patternLayer.image}, ${highlightLayer.image}`,
				backgroundPosition: `${patternLayer.position}, ${highlightLayer.position}`,
				backgroundRepeat: `${patternLayer.repeat}, ${highlightLayer.repeat}`,
				backgroundSize: `${patternLayer.size}, ${highlightLayer.size}`
			};
		}
		const layer = patternLayer ?? highlightLayer;
		return {
			backgroundImage: layer.image,
			backgroundPosition: layer.position,
			backgroundRepeat: layer.repeat,
			backgroundSize: layer.size
		};
	};

	exports.SelectableBackground = SelectableBackground;
	exports.SelectableBackgroundId = SelectableBackgroundId;
	exports.SpecialBackground = SpecialBackgroundId;
	exports.ThemeManager = ThemeManager;
	exports.ThemeType = ThemeType;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=theme.bundle.js.map

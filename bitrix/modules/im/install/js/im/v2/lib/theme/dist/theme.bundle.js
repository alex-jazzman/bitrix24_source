/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core,im_v2_application_core,im_v2_const) {
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
	  martaAI: 'martaAI',
	  copilot: 'copilot',
	  notifications: 'notifications'
	};
	const SpecialBackground = {
	  [SpecialBackgroundId.collab]: {
	    color: '#76c68b',
	    type: ThemeType.dark,
	    pattern: ThemePattern.default
	  },
	  [SpecialBackgroundId.martaAI]: {
	    color: '#0277ff',
	    type: ThemeType.dark,
	    pattern: ThemePattern.aiAssistant
	  },
	  [SpecialBackgroundId.copilot]: SelectableBackground[SelectableBackgroundId.slate],
	  [SpecialBackgroundId.notifications]: {
	    color: '#fafcfd',
	    type: ThemeType.light,
	    pattern: ThemePattern.default
	  }
	};

	/**
	 * Maps background IDs to image file (without extension).
	 * Images are at /bitrix/js/im/images/chat-v2-background/{name}.png
	 */
	const ImageFileByBackgroundId = {
	  [SpecialBackgroundId.collab]: 'collab-v2',
	  [SpecialBackgroundId.martaAI]: 'ai-assistant',
	  [SpecialBackgroundId.copilot]: '4',
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
	    return (selectedColorScheme == null ? void 0 : selectedColorScheme.type) === ThemeType.light;
	  },
	  isDarkTheme() {
	    const backgroundId = im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.appearance.background);
	    const selectedColorScheme = SelectableBackground[backgroundId];
	    return (selectedColorScheme == null ? void 0 : selectedColorScheme.type) === ThemeType.dark;
	  },
	  getCurrentBackgroundStyle(dialogId) {
	    const backgroundId = resolveBackgroundId(dialogId);
	    return this.getBackgroundStyleById(backgroundId);
	  },
	  getBackgroundStyleById(backgroundId) {
	    var _ImageFileByBackgroun;
	    const backgroundsList = {
	      ...SelectableBackground,
	      ...SpecialBackground
	    };
	    const colorScheme = backgroundsList[backgroundId];
	    if (!colorScheme) {
	      return {};
	    }
	    const patternColor = colorScheme.type === ThemeType.light ? BackgroundPatternColor.gray : BackgroundPatternColor.white;
	    const patternType = colorScheme.pattern;
	    const fileName = (_ImageFileByBackgroun = ImageFileByBackgroundId[backgroundId]) != null ? _ImageFileByBackgroun : backgroundId;
	    const patternImage = `url('${IMAGE_FOLDER_PATH}/pattern-${patternColor}-${patternType}.svg')`;
	    const highlightImage = `url('${IMAGE_FOLDER_PATH}/${fileName}.png')`;
	    return {
	      backgroundColor: colorScheme.color,
	      backgroundImage: `${patternImage}, ${highlightImage}`,
	      backgroundPosition: 'top right, center',
	      backgroundRepeat: 'repeat, no-repeat',
	      backgroundSize: 'auto, cover'
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
	  const chatType = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true).type;
	  if (chatType === im_v2_const.ChatType.collab) {
	    return SpecialBackgroundId.collab;
	  }
	  if (chatType === im_v2_const.ChatType.copilot) {
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

	exports.SelectableBackground = SelectableBackground;
	exports.SelectableBackgroundId = SelectableBackgroundId;
	exports.SpecialBackground = SpecialBackgroundId;
	exports.ThemeType = ThemeType;
	exports.ThemeManager = ThemeManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX,BX.Messenger.v2.Application,BX.Messenger.v2.Const));
//# sourceMappingURL=theme.bundle.js.map

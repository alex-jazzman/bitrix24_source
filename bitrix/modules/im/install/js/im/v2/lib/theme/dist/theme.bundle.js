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
	const SelectableBackground = Object.freeze({
	  // dark ones
	  1: {
	    color: '#9fcfff',
	    type: ThemeType.dark
	  },
	  2: {
	    color: '#81d8bf',
	    type: ThemeType.dark
	  },
	  3: {
	    color: '#7fadd1',
	    type: ThemeType.dark
	  },
	  4: {
	    color: '#7a90b6',
	    type: ThemeType.dark
	  },
	  5: {
	    color: '#5f9498',
	    type: ThemeType.dark
	  },
	  6: {
	    color: '#799fe1',
	    type: ThemeType.dark
	  },
	  // light ones
	  7: {
	    color: '#cfeefa',
	    type: ThemeType.light
	  },
	  9: {
	    color: '#efded3',
	    type: ThemeType.light
	  },
	  11: {
	    color: '#eff4f6',
	    type: ThemeType.light
	  }
	});
	const SpecialBackgroundId = {
	  collab: 'collab',
	  martaAI: 'martaAI',
	  copilot: 'copilot'
	};
	const COPILOT_BACKGROUND_ID = 4;
	const SpecialBackground = {
	  [SpecialBackgroundId.collab]: {
	    color: '#76c68b',
	    type: ThemeType.dark
	  },
	  [SpecialBackgroundId.martaAI]: {
	    color: '#4596f9',
	    type: ThemeType.dark
	  },
	  [SpecialBackgroundId.copilot]: SelectableBackground[COPILOT_BACKGROUND_ID]
	};
	const ImageFileByBackgroundId = {
	  [SpecialBackgroundId.collab]: 'collab-v2',
	  [SpecialBackgroundId.martaAI]: 'marta-ai',
	  [SpecialBackgroundId.copilot]: COPILOT_BACKGROUND_ID.toString()
	};

	const IMAGE_FOLDER_PATH = '/bitrix/js/im/images/chat-v2-background';
	const BackgroundPatternColor = Object.freeze({
	  white: 'white',
	  gray: 'gray'
	});
	const ThemeManager = {
	  isLightTheme() {
	    const selectedBackgroundId = im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.appearance.background);
	    const selectedColorScheme = SelectableBackground[selectedBackgroundId];
	    return (selectedColorScheme == null ? void 0 : selectedColorScheme.type) === ThemeType.light;
	  },
	  isDarkTheme() {
	    const selectedBackgroundId = im_v2_application_core.Core.getStore().getters['application/settings/get'](im_v2_const.Settings.appearance.background);
	    const selectedColorScheme = SelectableBackground[selectedBackgroundId];
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
	    const fileName = (_ImageFileByBackgroun = ImageFileByBackgroundId[backgroundId]) != null ? _ImageFileByBackgroun : backgroundId;
	    const patternImage = `url('${IMAGE_FOLDER_PATH}/pattern-${patternColor}.svg')`;
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
	 * 2. Background by chat type (collab/copilot)
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
	  const chatBackground = im_v2_application_core.Core.getStore().getters['chats/getBackgroundId'](dialogId);
	  const botBackground = im_v2_application_core.Core.getStore().getters['users/bots/getBackgroundId'](dialogId);
	  if (SpecialBackgroundId[chatBackground]) {
	    return SpecialBackgroundId[chatBackground];
	  }
	  if (SpecialBackgroundId[botBackground]) {
	    return SpecialBackgroundId[botBackground];
	  }
	  return userBackground;
	};

	exports.SelectableBackground = SelectableBackground;
	exports.SpecialBackground = SpecialBackgroundId;
	exports.ThemeType = ThemeType;
	exports.ThemeManager = ThemeManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX,BX.Messenger.v2.Application,BX.Messenger.v2.Const));
//# sourceMappingURL=theme.bundle.js.map

import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ChatType, Settings } from 'im.v2.const';
import { CollabManager } from 'im.v2.lib.collab';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import {
	SelectableBackground,
	SelectableBackgroundId,
	SpecialBackground,
	SpecialBackgroundId,
	ThemeType,
	ImageFileByBackgroundId,
	type BackgroundItem,
} from './color-scheme';

export {
	SelectableBackground,
	SelectableBackgroundId,
	SpecialBackgroundId as SpecialBackground,
	ThemeType,
	ThemeManager,
};

const IMAGE_FOLDER_PATH = '/bitrix/js/im/images/chat-v2-background';

export type BackgroundStyle = {
	backgroundColor: string,
	backgroundImage: string,
	backgroundPosition: string,
	backgroundRepeat: string,
	backgroundSize: string,
};

type BackgroundStyleLayer = {
	image: string,
	position: string,
	repeat: string,
	size: string,
};

const BackgroundPatternColor = Object.freeze({
	white: 'white',
	gray: 'gray',
});

const ThemeManager = {
	isLightTheme(): boolean
	{
		const backgroundId = Core.getStore().getters['application/settings/get'](Settings.appearance.background);
		const selectedColorScheme: BackgroundItem = SelectableBackground[backgroundId];

		return selectedColorScheme?.type === ThemeType.light;
	},

	isDarkTheme(): boolean
	{
		const backgroundId = Core.getStore().getters['application/settings/get'](Settings.appearance.background);
		const selectedColorScheme: BackgroundItem = SelectableBackground[backgroundId];

		return selectedColorScheme?.type === ThemeType.dark;
	},

	getCurrentBackgroundStyle(dialogId?: string): BackgroundStyle
	{
		const backgroundId = resolveBackgroundId(dialogId);

		return this.getBackgroundStyleById(backgroundId);
	},

	getBackgroundStyleById(backgroundId: string): BackgroundStyle
	{
		const backgroundsList = { ...SelectableBackground, ...SpecialBackground };
		const colorScheme: BackgroundItem = backgroundsList[backgroundId];
		if (!colorScheme)
		{
			return this.getCurrentBackgroundStyle();
		}

		return {
			...buildBackgroundStyles(colorScheme, backgroundId),
			backgroundColor: colorScheme.color,
		};
	},
};

/** Background selection priority:
 * 1. If there is no dialog context: user selected background (from user settings)
 * 2. Background by chat type (collab/copilot/aiAssistant)
 * 3. Chat background (from chat fields)
 * 4. Bot background (from bot fields)
 * 5. User selected background (from user settings)
 */
const resolveBackgroundId = (dialogId?: string): string => {
	const userBackground = Core.getStore().getters['application/settings/get'](Settings.appearance.background);
	if (!Type.isStringFilled(dialogId))
	{
		return userBackground;
	}

	const chat = Core.getStore().getters['chats/get'](dialogId, true);
	if (chat.type === ChatType.collab)
	{
		return CollabManager.getBackgroundId(chat);
	}

	if (chat.type === ChatType.copilot)
	{
		if (FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available))
		{
			return SpecialBackgroundId.aiAssistant;
		}

		return SpecialBackgroundId.copilot;
	}

	const isAiAssistant = Core.getStore().getters['users/bots/isAiAssistant'](dialogId);
	if (isAiAssistant)
	{
		return SpecialBackgroundId.martaAI;
	}

	const chatBackground = Core.getStore().getters['chats/getBackgroundId'](dialogId);
	if (Type.isStringFilled(chatBackground))
	{
		return chatBackground;
	}

	const botBackground = Core.getStore().getters['users/bots/getBackgroundId'](dialogId);
	if (Type.isStringFilled(botBackground))
	{
		return botBackground;
	}

	return userBackground;
};

const getPatternBackgroundStyleLayer = (colorScheme: BackgroundItem): ?BackgroundStyleLayer => {
	if (!colorScheme.pattern)
	{
		return null;
	}

	const patternColor = colorScheme.type === ThemeType.light
		? BackgroundPatternColor.gray
		: BackgroundPatternColor.white
	;

	return {
		image: `url('${IMAGE_FOLDER_PATH}/pattern-${patternColor}-${colorScheme.pattern}.svg')`,
		position: 'top right',
		repeat: 'repeat',
		size: 'auto',
	};
};

const getHighlightBackgroundStyleLayer = (backgroundId: string): ?BackgroundStyleLayer => {
	const fileName = ImageFileByBackgroundId[backgroundId];
	if (!fileName)
	{
		return null;
	}

	const hasExtension = fileName.includes('.');
	const fullName = hasExtension ? fileName : `${fileName}.png`;

	return {
		image: `url('${IMAGE_FOLDER_PATH}/${fullName}')`,
		position: 'center',
		repeat: 'no-repeat',
		size: 'cover',
	};
};

const buildBackgroundStyles = (colorScheme: BackgroundItem, backgroundId: string): $Shape<BackgroundStyle> => {
	const patternLayer = getPatternBackgroundStyleLayer(colorScheme);
	const highlightLayer = getHighlightBackgroundStyleLayer(backgroundId);

	if (!patternLayer && !highlightLayer)
	{
		return {};
	}

	if (patternLayer && highlightLayer)
	{
		return {
			backgroundImage: `${patternLayer.image}, ${highlightLayer.image}`,
			backgroundPosition: `${patternLayer.position}, ${highlightLayer.position}`,
			backgroundRepeat: `${patternLayer.repeat}, ${highlightLayer.repeat}`,
			backgroundSize: `${patternLayer.size}, ${highlightLayer.size}`,
		};
	}

	const layer = patternLayer ?? highlightLayer;

	return {
		backgroundImage: layer.image,
		backgroundPosition: layer.position,
		backgroundRepeat: layer.repeat,
		backgroundSize: layer.size,
	};
};

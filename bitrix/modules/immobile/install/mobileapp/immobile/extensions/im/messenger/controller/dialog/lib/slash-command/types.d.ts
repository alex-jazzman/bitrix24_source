import { IServiceLocator } from '../../../../lib/di/service-locator/types';
import { DialogLocatorServices } from '../../types/dialog';
import { AvatarDetail } from '../../../../lib/element/chat-avatar/chat-avatar';

/**
 * Element of the command list response (ChatCommandList::toDto). `command` comes with a
 * leading slash; `common` and `extranet` are 'Y'/'N' flags; `params` is a plain string.
 */
export type SlashCommand = {
	id: number,
	botId: number,
	command: string,
	category: string,
	common: 'Y' | 'N',
	context: string,
	title: string,
	params: string,
	extranet: 'Y' | 'N',
};

/**
 * Whole response `{ commands, users }`. `users` is a per-bot map keyed by
 * botId; its element shape is owned by the panel, opaque for the provider (passed through unchanged).
 */
export type SlashCommandListResponse = {
	commands: SlashCommand[],
	users: Record<string, unknown>,
};

/**
 * Current input-field context the prefix filter reads.
 * `prefix` - the text typed after the triggering slash (no leading slash).
 */
export type SlashCommandQueryContext = {
	prefix?: string,
};

export type SlashCommandProviderStateType = 'ready' | 'loading' | 'updated' | 'error';

export type SlashCommandProviderStates = {
	ready: 'ready',
	loading: 'loading',
	updated: 'updated',
	error: 'error',
};

/**
 * Payload passed to onStateChange alongside the state. Fields depend on the state:
 * ready/updated carry the filtered response; error carries offline flag and retry.
 */
export type SlashCommandStatePayload = {
	commands?: SlashCommand[],
	users?: Record<string, unknown>,
	offline?: boolean,
	retry?: () => void,
};

export type SlashCommandManagerOptions = {
	view: DialogView,
	dialogId: string,
	dialogLocator?: IServiceLocator<DialogLocatorServices>,
	provider?: SlashCommandProvider,
	/** Notified whenever the panel opens (true) or closes (false); drives the "/" button tint. */
	onPanelStateChange?: (isOpened: boolean) => void,
};

/**
 * Row passed to the shared DialogMentionPanel (subset of MentionItem). The bot avatar is
 * carried by `avatar` (AvatarDetail) resolved from users[botId]; imageUrl/imageColor are kept
 * as a deprecated fallback. Slash rows use no action buttons.
 */
export type SlashCommandItem = {
	id: string,
	title: string,
	/** Command description (DTO `title`), drawn as the row's second line; empty/error rows omit it. */
	description?: string,
	avatar?: AvatarDetail,
	/** @deprecated use avatar */
	imageUrl: string,
	/** @deprecated use avatar */
	imageColor: string,
	testId: string,
};

export type SlashCommandProviderOptions = {
	dialogId: string,
	onStateChange: (state: SlashCommandProviderStateType, payload: SlashCommandStatePayload) => void,
	repository?: {
		getByDialogId: (dialogId: string, language: string) => Promise<{ payload: SlashCommandListResponse } | null>,
		save: (dialogId: string, language: string, payload: SlashCommandListResponse) => Promise<void>,
	},
	service?: {
		getListByChat: (dialogId: string) => Promise<SlashCommandListResponse>,
	},
	isOnlineChecker?: () => boolean,
};

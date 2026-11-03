import { type BaseEvent } from 'main.core.events';

import { type FileDto } from 'tasks.v2.provider.service.file-service';

export const StateStatus = Object.freeze({
	Idle: 'idle',
	Loading: 'loading',
	Loaded: 'loaded',
	Error: 'error',
});

export type StateStatusValue = 'idle' | 'loading' | 'loaded' | 'error';

export type ResultMessageMap = {
	[messageId: string]: number,
};

export type StateEntry = {
	status: StateStatusValue,
	map: ResultMessageMap,
	promise: Promise<ResultMessageMap> | null,
	revision: number,
};

export type HydrateOptions = {
	force?: boolean,
};

export type ResultEvent = BaseEvent & {
	getData: () => {
		taskId?: number | string,
	},
};

export type MessageContext = {
	id: number,
	chatId: number,
	dialogId: string,
	text: string,
	authorId: number,
	isDeleted?: boolean,
};

export type ResultMessageMenuAnalytics = {
	context?: string,
	additionalContext?: string,
	cardType?: string,
};

export const RegistrationPriority = Object.freeze({
	Normal: 0,
	High: 100,
});

export type RegisterOptions = {
	taskId: number,
	chatId: number,
	priority?: number,
	analytics?: ResultMessageMenuAnalytics,
	stateController?: MenuStateController,
	createMenuClass?: (
		baseMenu: BaseMenuConstructor,
		defaults: MenuFactoryDependencies,
	) => BaseMenuConstructor,
};

export type Registration = {
	teardown: () => void,
};

export type ResultPayload = {
	id: string,
	taskId: number,
	text: string,
	author: {
		id: number,
		name: string,
		image: {
			src: string,
		},
		type: string,
		gender: string,
		role: string,
	},
	createdAtTs: number,
	updatedAtTs: number,
	status: string,
	fileIds: number[],
	previewId: number | null,
	rights: {
		edit: boolean,
		remove: boolean,
	},
	files: FileDto[],
};

export type ResultMenuItem = {
	title: string,
	icon?: string,
	onClick?: () => void,
};

export type BaseMenuInstance = {
	context: MessageContext,
	isDeletedMessage: () => boolean,
	close: () => void,
};

export type BaseMenuConstructor = new (...args: unknown[]) => BaseMenuInstance;

export type MenuStateController = {
	getStatus: (taskId: number) => StateStatusValue,
	getMessageResultId: (taskId: number, messageId: number) => number,
	hydrate?: (taskId: number) => Promise<ResultMessageMap>,
};

export type MenuExecutor = {
	addFromMessage: (
		taskId: number,
		messageContext: MessageContext,
		analytics?: ResultMessageMenuAnalytics | null,
	) => Promise<boolean>,
	removeFromMessage: (
		taskId: number,
		messageId: number,
		resultId: number,
		analytics?: ResultMessageMenuAnalytics | null,
	) => Promise<boolean>,
};

export type ResultMessageTransport = {
	add: (taskId: number, messageContext: MessageContext) => Promise<boolean>,
	remove: (taskId: number, messageId: number, resultId: number) => Promise<void>,
};

export type MenuFactoryDependencies = {
	getTaskId: () => number,
	getAnalytics?: () => ResultMessageMenuAnalytics | null,
	stateController: MenuStateController,
	executor: MenuExecutor,
};

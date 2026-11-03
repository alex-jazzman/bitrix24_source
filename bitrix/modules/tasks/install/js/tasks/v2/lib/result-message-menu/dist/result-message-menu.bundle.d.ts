/* eslint-disable */
type RegisterOptions = {
	taskId: number;
	chatId: number;
	priority?: number;
	analytics?: ResultMessageMenuAnalytics;
	stateController?: MenuStateController;
	createMenuClass?: (baseMenu: BaseMenuConstructor, defaults: MenuFactoryDependencies) => BaseMenuConstructor;
};

type ResultMessageMenuAnalytics = {
	context?: string;
	additionalContext?: string;
	cardType?: string;
};

type MenuStateController = {
	getStatus: (taskId: number) => StateStatusValue;
	getMessageResultId: (taskId: number, messageId: number) => number;
	hydrate?: (taskId: number) => Promise<ResultMessageMap>;
};

type StateStatusValue = 'idle' | 'loading' | 'loaded' | 'error';

type ResultMessageMap = {
	[messageId: string]: number;
};

type BaseMenuConstructor = new (...args: unknown[]) => BaseMenuInstance;

type BaseMenuInstance = {
	context: MessageContext;
	isDeletedMessage: () => boolean;
	close: () => void;
};

type MessageContext = {
	id: number;
	chatId: number;
	dialogId: string;
	text: string;
	authorId: number;
	isDeleted?: boolean;
};

type MenuFactoryDependencies = {
	getTaskId: () => number;
	getAnalytics?: () => ResultMessageMenuAnalytics | null;
	stateController: MenuStateController;
	executor: MenuExecutor;
};

type MenuExecutor = {
	addFromMessage: (taskId: number, messageContext: MessageContext, analytics?: ResultMessageMenuAnalytics | null) => Promise<boolean>;
	removeFromMessage: (taskId: number, messageId: number, resultId: number, analytics?: ResultMessageMenuAnalytics | null) => Promise<boolean>;
};

type Registration = {
	teardown: () => void;
};

type ResultMessageTransport = {
	add: (taskId: number, messageContext: MessageContext) => Promise<boolean>;
	remove: (taskId: number, messageId: number, resultId: number) => Promise<void>;
};

declare namespace BX.Tasks.V2.Lib {
	const resultMessageMenu: RegistrationManager;

	class RegistrationManager {
		register(options: RegisterOptions): Promise<Registration>;
	}

	const ResultMessageMenu: (baseMenu: BaseMenuConstructor, dependencies: MenuFactoryDependencies) => BaseMenuConstructor;

	const executor: Executor;

	class Executor {
		constructor(transport: ResultMessageTransport);
		addFromMessage(taskId: number, messageContext: MessageContext, analyticsContext?: ResultMessageMenuAnalytics | null): Promise<boolean>;
		removeFromMessage(taskId: number, messageId: number, resultId: number): Promise<boolean>;
	}

	const storeExecutor: Executor;

	const RegistrationPriority: Readonly<{
		Normal: 0;
		High: 100;
	}>;
}

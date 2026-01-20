import { ChatActionDispatcher } from './chat-action-dispatcher.js';
import { ChatLinkParser } from './chat-link-parser.js';
import { showCheckListAction } from './action/check-list/show-check-list-action';
import { showCheckListItemsAction } from './action/check-list/show-check-list-items-action';
import { changeDeadlineAction } from './action/change-deadline-action.js';
import { completeTaskAction } from './action/complete-task-action.js';
import { openResultAction } from './action/open-result-action';
import type { BaseAction } from './action/base-action';
import type { Coordinates } from './type/coordinates';
import type { Link } from './type/link.js';

type Dependencies = {
	actionDispatcher: ChatActionDispatcher,
	linkParser: ChatLinkParser,
};

type Options = {
	coordinates?: Coordinates,
};

export class ChatActionService
{
	#defaultActions: Array<BaseAction> = [
		changeDeadlineAction,
		completeTaskAction,
		openResultAction,
		showCheckListAction,
		showCheckListItemsAction,
	];

	#actionDispatcher: ChatActionDispatcher;
	#linkParser: ChatLinkParser;

	constructor(dependencies: Dependencies)
	{
		this.#actionDispatcher = dependencies.actionDispatcher;
		this.#linkParser = dependencies.linkParser;

		this.#registerDefaultActions();
	}

	#registerDefaultActions(): void
	{
		this.#defaultActions.forEach((action: BaseAction): void => {
			try
			{
				this.#actionDispatcher.register(action);
			}
			catch (error)
			{
				console.error('ChatActionService: Failed to register action', action.getName(), error);
			}
		});
	}

	async process(link: Link, options: Options = {}): Promise<void>
	{
		try
		{
			const parsedLink = this.#linkParser.parse(link);
			if (!parsedLink)
			{
				return;
			}

			const payload = {
				...parsedLink.payload,
				...options,
			};

			await this.#actionDispatcher.execute(parsedLink.actionName, payload);
		}
		catch (error)
		{
			console.error('ChatActionService: Failed to process link', error);
		}
	}
}

export const chatActionService = new ChatActionService({
	actionDispatcher: new ChatActionDispatcher(),
	linkParser: new ChatLinkParser(),
});

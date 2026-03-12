import { ChatType, GetParameter } from 'im.v2.const';
import { Messenger } from 'im.public';

import { BindingsCondition } from '../const/bindings';

export class BindingsManager
{
	#conditionHandler = {
		[BindingsCondition.openCopilotChat]: (params) => this.#openCopilot(params),
		[BindingsCondition.openChannel]: (params) => this.#openChannel(params),
		[BindingsCondition.openLinesHistory]: (params) => this.#openLinesHistory(params),
		[BindingsCondition.openLines]: (params) => this.#openLines(params),
		[BindingsCondition.openCollab]: (params) => this.#openCollab(params),
		[BindingsCondition.openTaskComments]: (params) => this.#openTaskComments(params),
		[BindingsCondition.openBotContext]: (params) => this.#openChatWithBotContext(params),
		[BindingsCondition.openChat]: (params) => this.#openChat(params),
		[BindingsCondition.openSharedLink]: (params) => this.#openSharedLink(params),

		[BindingsCondition.openOriginRoot]: () => this.#openNavigationItem({ id: ChatType.chat }),
		[BindingsCondition.openRoot]: () => this.#openNavigationItem({ id: ChatType.chat }),
		[BindingsCondition.openExtranetRoot]: () => this.#openNavigationItem({ id: ChatType.chat }),

		[BindingsCondition.openChannelLayout]: () => this.#openNavigationItem({ id: ChatType.channel }),
		[BindingsCondition.openCollabLayout]: () => this.#openNavigationItem({ id: ChatType.collab }),
		[BindingsCondition.openCopilotChatLayout]: () => this.#openNavigationItem({ id: ChatType.copilot }),
	};

	routeLink(url: string): void
	{
		const condition = this.#findMatchingCondition(url);

		if (!this.#conditionHandler[condition])
		{
			return;
		}

		const currentUrl = new URL(url, location.origin);
		const searchParams = currentUrl.searchParams;

		this.#conditionHandler[condition](searchParams);
	}

	#findMatchingCondition(url: string): ?$Values<typeof BindingsCondition>
	{
		for (const regex of Object.values(BindingsCondition))
		{
			const isMatch = regex.exec(url);
			if (isMatch)
			{
				return regex;
			}
		}

		return null;
	}

	#openNavigationItem({ id, asLink = true }: { id: string, asLink: boolean })
	{
		void Messenger.openNavigationItem({ id, asLink });
	}

	#openLinesHistory(params: URLSearchParams)
	{
		const dialogId = params.get(GetParameter.openHistory);
		void Messenger.openLinesHistory(dialogId);
	}

	#openLines(params: URLSearchParams)
	{
		const dialogId = params.get(GetParameter.openLines);
		void Messenger.openLines(dialogId);
	}

	#openCopilot(params: URLSearchParams)
	{
		const dialogId = params.get(GetParameter.openCopilotChat);
		void Messenger.openCopilot(dialogId);
	}

	#openChannel(params: URLSearchParams)
	{
		const dialogId = params.get(GetParameter.openChannel);
		void Messenger.openChannel(dialogId);
	}

	#openCollab(params: URLSearchParams)
	{
		const dialogId = params.get(GetParameter.openCollab);
		void Messenger.openCollab(dialogId);
	}

	#openTaskComments(params: URLSearchParams)
	{
		const dialogId = params.get(GetParameter.openTaskComments);
		const messageId = Number(params.get(GetParameter.openMessage)) || 0;

		void Messenger.openTaskComments(dialogId, messageId);
	}

	#openChat(params: URLSearchParams)
	{
		const dialogId = params.get(GetParameter.openChat);
		const messageId = Number(params.get(GetParameter.openMessage)) || 0;

		void Messenger.openChat(dialogId, messageId);
	}

	#openChatWithBotContext(params: URLSearchParams)
	{
		const dialogId = params.get(GetParameter.openChat);
		const botContext = params.get(GetParameter.botContext);

		let decodedContext = {};
		try
		{
			decodedContext = JSON.parse(decodeURIComponent(botContext));
		}
		catch (error)
		{
			console.error('Im bindings: incorrect bot context', error);
		}

		void Messenger.openChatWithBotContext(dialogId, decodedContext);
	}

	#openSharedLink(params: URLSearchParams)
	{
		const code = params.get(GetParameter.openSharedLink);
		void Messenger.joinChatByCode(code);
	}
}

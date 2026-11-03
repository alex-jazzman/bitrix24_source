import {PullClient} from "pull.client";
import {Type} from "main.core";
import type {CommandOptions} from "./types";
import type OnlyOffice from "./onlyoffice";

export default class BaseCommandHandler
{
	options: CommandOptions = null;
	onlyOffice: OnlyOffice = null;

	constructor(commandOptions: CommandOptions)
	{
		this.options = commandOptions;
		this.context = commandOptions.context;
		this.onlyOffice = commandOptions.onlyOffice;
	}

	getModuleId(): string
	{
		return 'disk';
	}

	getSubscriptionType(): string
	{
		return PullClient.SubscriptionType.Server;
	}

	filterCurrentObject(handler: Function): any
	{
		return (data) => {
			if (this.context.object.id !== data.object.id)
			{
				return;
			}

			return handler(data);
		};
	}

	isCurrentUser(userId: number): boolean
	{
		return this.context.currentUser.id === userId;
	}

	/**
	 * The channel belongs to the object, so a message reaches every tab which has it open. The hash of
	 * the document session names the opening the message came from: editors of one editing session
	 * share it, while a viewing and a reopening each have one of their own.
	 */
	isCurrentDocumentSession(documentSessionHash: ?string): boolean
	{
		return Type.isStringFilled(documentSessionHash)
			&& this.context.documentSession?.hash === documentSessionHash
		;
	}
}
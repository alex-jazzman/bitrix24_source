import { Type } from 'main.core';

export type CallLogContext = {
	roomId?: string;
	callId?: number;
	chatId?: number;
};

type CallLogContextProvider = () => CallLogContext;

class ContextProviderRegistry
{
	#providers: CallLogContextProvider[] = [];

	registerProvider(provider: CallLogContextProvider): void
	{
		if (this.#providers.includes(provider))
		{
			return;
		}

		this.#providers.push(provider);
	}

	unregisterProvider(provider: CallLogContextProvider): void
	{
		this.#providers = this.#providers.filter((registered) => registered !== provider);
	}

	getContext(): CallLogContext
	{
		for (const provider of this.#providers)
		{
			const context = this.#safeCall(() => this.#pickAllowedFields(provider())) ?? {};
			if (this.#hasFilledField(context))
			{
				return context;
			}
		}

		return {};
	}

	// A broken provider, or a throwing getter on its result, must not break logging:
	// both the provider call and the field filtering run inside the guard
	#safeCall(read: () => CallLogContext): CallLogContext | null
	{
		try
		{
			return read();
		}
		catch
		{
			return null;
		}
	}

	// Providers are not trusted: only known scalar fields may reach the log payload
	#pickAllowedFields(context: CallLogContext | null): CallLogContext
	{
		const allowed: CallLogContext = {};
		if (!context)
		{
			return allowed;
		}

		if (Type.isString(context.roomId))
		{
			allowed.roomId = context.roomId;
		}

		if (Type.isNumber(context.callId))
		{
			allowed.callId = context.callId;
		}

		if (Type.isNumber(context.chatId))
		{
			allowed.chatId = context.chatId;
		}

		return allowed;
	}

	#hasFilledField(context: CallLogContext): boolean
	{
		return Object.values(context).some((value) => value !== undefined && value !== null && value !== '');
	}
}

export const CallLogContextRegistry = new ContextProviderRegistry();

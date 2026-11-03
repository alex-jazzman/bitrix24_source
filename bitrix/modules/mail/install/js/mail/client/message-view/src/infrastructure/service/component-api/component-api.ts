import { ajax, Type } from 'main.core';

import { type Screen } from '../../../application/screen';

export type ComponentActionError = unknown;

export type ComponentApiFailure = {
	status: 'error',
	kind: 'application' | 'network',
	errors: readonly ComponentActionError[],
	cause: unknown,
	generation: number,
};

export type ComponentApiIgnored = {
	status: 'ignored',
	generation: number,
};

export type ComponentApiSuccess<T> = {
	status: 'success',
	data: T,
	generation: number,
};

export type ComponentApiOutcome<T> = ComponentApiSuccess<T> | ComponentApiFailure | ComponentApiIgnored;

export type TrustedComponentContent = {
	readonly html: string,
	readonly source: 'componentAction',
};

export type LogPayload = {
	readonly id: number,
	readonly log: string,
	readonly size: number,
	readonly mail_uf_message_token?: string,
};

export type LogItemPayload = {
	readonly id: number,
	readonly mail_uf_message_token?: string,
};

export type LogResult = {
	readonly content: TrustedComponentContent,
	readonly count: number,
};

export type LogItemResult = {
	readonly content: TrustedComponentContent,
};

type ComponentActionOptions = {
	mode: 'class',
	data: LogPayload | LogItemPayload,
};

type ComponentActionResponse = {
	status?: string,
	data?: unknown,
	errors?: readonly ComponentActionError[],
};

export type ComponentActionRunner = (
	component: string,
	action: 'log' | 'logitem',
	options: ComponentActionOptions,
) => Promise<ComponentActionResponse>;

export type ComponentApiOptions = {
	screen: Screen,
	runner?: ComponentActionRunner,
};

const componentName = 'bitrix:mail.client.message.view';

const defaultRunner: ComponentActionRunner = (component, action, options) => {
	return ajax.runComponentAction(component, action, options) as Promise<ComponentActionResponse>;
};

export class ComponentApi
{
	#screen: Screen;
	#runner: ComponentActionRunner;
	#destroyed = false;

	constructor(options: ComponentApiOptions)
	{
		this.#screen = options.screen;
		this.#runner = options.runner ?? defaultRunner;
		this.#screen.registerCleanup(() => this.destroy());
	}

	async log(payload: LogPayload): Promise<ComponentApiOutcome<LogResult>>
	{
		return this.#request('log', payload, this.#mapLogResult);
	}

	async logItem(payload: LogItemPayload): Promise<ComponentApiOutcome<LogItemResult>>
	{
		return this.#request('logitem', payload, this.#mapLogItemResult);
	}

	destroy(): void
	{
		this.#destroyed = true;
	}

	async #request<T>(
		action: 'log' | 'logitem',
		payload: LogPayload | LogItemPayload,
		mapResult: (data: unknown) => T | null,
	): Promise<ComponentApiOutcome<T>>
	{
		const generation = this.#screen.captureGeneration();
		if (this.#destroyed || !this.#screen.isAlive())
		{
			return { status: 'ignored', generation };
		}

		try
		{
			const response = await this.#runner(componentName, action, {
				mode: 'class',
				data: payload,
			});
			const errors = response.errors ?? [];
			if (errors.length > 0 || (response.status && response.status !== 'success'))
			{
				return this.#guardOutcome(generation, {
					status: 'error',
					kind: 'application',
					errors,
					cause: response,
					generation,
				});
			}

			const data = mapResult(response.data);
			if (data === null)
			{
				return this.#guardOutcome(generation, {
					status: 'error',
					kind: 'application',
					errors: [],
					cause: response,
					generation,
				});
			}

			return this.#guardOutcome(generation, {
				status: 'success',
				data,
				generation,
			});
		}
		catch (cause)
		{
			const errors = this.#getServerErrors(cause);

			return this.#guardOutcome(generation, {
				status: 'error',
				kind: errors.length > 0 ? 'application' : 'network',
				errors,
				cause,
				generation,
			});
		}
	}

	#guardOutcome<T>(generation: number, outcome: ComponentApiOutcome<T>): ComponentApiOutcome<T>
	{
		let accepted = false;
		this.#screen.guardCompletion(generation, () => {
			accepted = !this.#destroyed;
		});

		return accepted ? outcome : { status: 'ignored', generation };
	}

	#mapLogResult = (data: unknown): LogResult | null => {
		if (!Type.isObject(data))
		{
			return null;
		}

		const result = data as { html?: unknown, count?: unknown };
		if (!Type.isString(result.html) || !Type.isNumber(result.count))
		{
			return null;
		}

		return {
			content: {
				html: result.html,
				source: 'componentAction',
			},
			count: result.count,
		};
	};

	#mapLogItemResult = (data: unknown): LogItemResult | null => {
		if (!Type.isString(data))
		{
			return null;
		}

		return {
			content: {
				html: data,
				source: 'componentAction',
			},
		};
	};

	#getServerErrors(cause: unknown): readonly ComponentActionError[]
	{
		if (!Type.isObject(cause))
		{
			return [];
		}

		const response = cause as { errors?: unknown };

		return Type.isArray(response.errors) ? response.errors : [];
	}
}

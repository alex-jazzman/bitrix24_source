import { TemplateApi } from '../../infrastructure/service/template/template';
import { type ComposeState } from '../../model/compose/types';

const RecentLimit = 5;

type RememberUpdate = {
	desired: boolean,
	confirmed: boolean,
	promise: Promise<boolean> | null,
};

const rememberUpdates = new WeakMap<ComposeState, RememberUpdate>();
const pendingLoads = new WeakMap<ComposeState, Promise<void>>();

/**
 * The promise is answered only when the list is really there: a caller that awaits it goes on to read
 * the loaded state. A request already on its way is awaited instead of being started a second time,
 * and a forced read waits for it and then asks the server anew — the section of templates may have
 * changed exactly while that first request was in flight.
 */
export async function loadRecentTemplates(state: ComposeState, force: boolean = false): Promise<void>
{
	const pending = pendingLoads.get(state) ?? null;
	if (pending)
	{
		await pending;
		if (!force)
		{
			return;
		}
	}

	if (state.templates.isLoaded && !force)
	{
		return;
	}

	const request = requestRecentTemplates(state);
	pendingLoads.set(state, request);
	try
	{
		await request;
	}
	finally
	{
		if (pendingLoads.get(state) === request)
		{
			pendingLoads.delete(state);
		}
	}
}

async function requestRecentTemplates(state: ComposeState): Promise<void>
{
	const { templates } = state;
	templates.isLoading = true;
	templates.error = null;
	try
	{
		const response = await TemplateApi.quickList();
		templates.recent = response.items.slice(0, RecentLimit);
		/*
		 * The setting comes from the answer only while the client has no wish of its own: once the switch
		 * is touched, the wish and its synchronizer own the flag, and a list request that started earlier
		 * must not roll the switch back.
		 */
		if (!rememberUpdates.has(state))
		{
			templates.rememberLast = response.rememberLast;
		}
		templates.autoApply.candidate = response.autoApply;
		templates.isLoaded = true;
	}
	catch
	{
		templates.error = 'load';
		templates.isLoaded = false;
	}
	finally
	{
		templates.isLoading = false;
	}
}

export async function updateRememberLast(state: ComposeState, enabled: boolean): Promise<boolean>
{
	const { templates } = state;
	const update = rememberUpdates.get(state) ?? {
		desired: templates.rememberLast,
		confirmed: templates.rememberLast,
		promise: null,
	};
	rememberUpdates.set(state, update);
	update.desired = enabled;
	templates.rememberLast = enabled;

	if (!update.promise)
	{
		update.promise = synchronizeRememberLast(state, update);
	}

	return update.promise;
}

async function synchronizeRememberLast(state: ComposeState, update: RememberUpdate): Promise<boolean>
{
	const { templates } = state;
	const current = update;
	if (current.confirmed === current.desired)
	{
		current.promise = null;

		return true;
	}

	const requested = current.desired;
	try
	{
		const response = await TemplateApi.setRememberLast(requested);
		current.confirmed = response.enabled;
		if (current.desired === requested)
		{
			templates.rememberLast = response.enabled;
			if (response.enabled !== requested)
			{
				current.promise = null;

				return true;
			}
		}
	}
	catch
	{
		if (current.desired === requested)
		{
			templates.rememberLast = current.confirmed;
			current.promise = null;

			return false;
		}
	}

	return synchronizeRememberLast(state, current);
}

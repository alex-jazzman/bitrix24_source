import { TemplateApi } from '../../infrastructure/service/template/template';
import { type ComposeState } from '../../model/compose/types';

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

	/*
	 * Both are one-shot asks of the list, taken by the request that carries them to the server. Taken at the
	 * start and not at the answer: a section left while this request is in flight asks anew, and that ask
	 * belongs to the request that follows, which the answer of this one would otherwise wipe on its way in.
	 */
	const priorityReference = templates.priorityReference;
	const pinRecentlyCreated = templates.pinRecentlyCreated;
	templates.priorityReference = null;
	templates.pinRecentlyCreated = false;

	try
	{
		const response = await TemplateApi.quickList(priorityReference, pinRecentlyCreated);
		templates.recent = response.items;
		templates.isLoaded = true;
	}
	catch
	{
		// Nothing was read, so the asks go back for the retry to carry - unless a newer one stands there already.
		templates.priorityReference = templates.priorityReference ?? priorityReference;
		templates.pinRecentlyCreated = templates.pinRecentlyCreated || pinRecentlyCreated;
		templates.error = 'load';
		templates.isLoaded = false;
	}
	finally
	{
		templates.isLoading = false;
	}
}

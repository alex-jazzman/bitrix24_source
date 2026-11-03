import { api } from './api';
import { resultHandler } from './result-handler';
import { takeScreenState } from './screen-state';
import { setupTemplateOpener } from './setup-template-opener';
import { type AiDigestSetupOptions, type ScreenStateBridge } from './types';

export class AiDigestSetup
{
	// Single-flight per report: a repeated click on the same row joins the request already in
	// flight, while another row always gets its own, so the wizard never opens for a foreign report.
	static #requests: Map<number | undefined, Promise<void>> = new Map();

	static async open(options: AiDigestSetupOptions): Promise<void>
	{
		if (!resultHandler.canStart(options.availability))
		{
			return;
		}

		// The wizard downloads while the backend prepares its data, so the first open waits for neither in turn.
		setupTemplateOpener.preload();

		const { dashboardId, bridge } = options;
		let request = AiDigestSetup.#requests.get(dashboardId);
		if (!request)
		{
			request = AiDigestSetup.#prepare(dashboardId, bridge);
			AiDigestSetup.#requests.set(dashboardId, request);
		}

		await request;
	}

	static async #prepare(dashboardId?: number, bridge?: ScreenStateBridge | null): Promise<void>
	{
		try
		{
			// Only an opened report has a screen to carry over; without one the request leaves at once.
			const screenState = dashboardId === undefined || !bridge ? null : await takeScreenState(bridge);
			const result = await (
				screenState
					? api.prepareDigestSetup(dashboardId, screenState)
					: api.prepareDigestSetup(dashboardId)
			);
			await resultHandler.handle(result);
		}
		catch
		{
			resultHandler.handleFailure();
		}
		finally
		{
			AiDigestSetup.#requests.delete(dashboardId);
		}
	}
}

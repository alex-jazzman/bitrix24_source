import {Type} from 'main.core';
import {Realtime} from 'landing.realtime';
import 'landing.main';
import 'landing.pageobject';
import 'landing.history';

const subscribeToBlockChanged = (handler: Function): Function => {
	return Realtime.subscribe('block.changed', handler);
};

export class EditorRealtime
{
	static isInitialized = false;
	static unsubscribe = null;

	static init(blockChangedSubscriber: Function = subscribeToBlockChanged): void
	{
		if (this.isInitialized)
		{
			return;
		}

		this.isInitialized = true;
		this.unsubscribe = blockChangedSubscriber((payload) => {
			return this.handleBlockChanged(payload);
		});
	}

	static handleBlockChanged(payload: Object): Promise
	{
		if (!this.isMatchingPayload(payload))
		{
			return Promise.resolve();
		}

		const block = this.getBlock(payload.entityId);
		if (!block || typeof block.reload !== 'function')
		{
			return Promise.resolve();
		}

		return Promise.resolve(block.reload())
			.then(() => {
				return this.reloadHistory();
			})
			.catch(() => {
				return Promise.resolve();
			});
	}

	static isMatchingPayload(payload: Object): boolean
	{
		if (!Type.isPlainObject(payload))
		{
			return false;
		}

		if (payload.entityType !== 'block' || payload.action !== 'update')
		{
			return false;
		}

		const entityId = Math.max(0, parseInt(payload.entityId, 10) || 0);
		const landingId = Math.max(0, parseInt(payload?.scope?.landingId, 10) || 0);
		const currentLandingId = this.getCurrentLandingId();

		return entityId > 0 && landingId > 0 && currentLandingId > 0 && landingId === currentLandingId;
	}

	static getCurrentLandingId(): number
	{
		try
		{
			return Math.max(0, parseInt(BX.Landing.Main.getInstance().id, 10) || 0);
		}
		catch (error)
		{
			return 0;
		}
	}

	static getBlock(blockId: number): ?Object
	{
		try
		{
			return BX.Landing.PageObject.getBlocks().get(blockId);
		}
		catch (error)
		{
			return null;
		}
	}

	static reloadHistory(): Promise
	{
		try
		{
			const history = BX.Landing.History.getInstance();
			if (history && typeof history.reload === 'function')
			{
				return Promise.resolve(history.reload());
			}
		}
		catch (error)
		{}

		return Promise.resolve();
	}
}

EditorRealtime.init();

export const __testHooks = {
	reset(): void
	{
		if (typeof EditorRealtime.unsubscribe === 'function')
		{
			EditorRealtime.unsubscribe();
		}

		EditorRealtime.isInitialized = false;
		EditorRealtime.unsubscribe = null;
	},
};

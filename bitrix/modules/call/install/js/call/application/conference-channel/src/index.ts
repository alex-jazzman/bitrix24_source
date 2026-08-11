import { DesktopApi } from 'call.adapter.desktop-api';
import { BroadcastRequestChannel } from 'call.infrastructure.broadcast-channel';

class ConferenceChannel
{
	static #instance: ConferenceChannel | null = null;
	private callMultiBroadcastClient: BroadcastRequestChannel<string, boolean>;

	constructor()
	{
		this.callMultiBroadcastClient = new BroadcastRequestChannel('call_conf_controller_multi_channel');
	}

	static getInstance(): ConferenceChannel
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	async sendRequest(conferenceCode: string): Promise<boolean[]>
	{
		if (!DesktopApi.isDesktop())
		{
			return [];
		}

		return this.callMultiBroadcastClient.broadcastRequest(conferenceCode, { timeout: 100 });
	}

	setExecuter(handle: (conferenceCode: string) => boolean): void
	{
		this.callMultiBroadcastClient.executer(handle);
	}
}

export { ConferenceChannel };

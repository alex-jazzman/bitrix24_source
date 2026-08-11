/* eslint-disable */
declare namespace BX.Messenger.Application {
	class ConferenceChannel {
		private callMultiBroadcastClient;
		constructor();
		static getInstance(): ConferenceChannel;
		sendRequest(conferenceCode: string): Promise<boolean[]>;
		setExecuter(handle: (conferenceCode: string) => boolean): void;
	}
}

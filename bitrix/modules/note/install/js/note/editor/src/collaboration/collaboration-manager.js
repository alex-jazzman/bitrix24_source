import { HocuspocusProvider } from '@hocuspocus/provider';

type ProviderOptions = {
	url: string,
	name: string,
	token: string,
	onStatus?: Function,
	onSynced?: Function,
	onDisconnect?: Function,
	onClose?: Function,
	onAuthenticationFailed?: Function,
};

export function createCollaborationProvider({ url, name, token, ...callbacks }: ProviderOptions): HocuspocusProvider
{
	const docKeyEncoded = encodeURIComponent(name);
	const fullUrl = `${url.replace(/\/+$/, '')}/${docKeyEncoded}`;

	return new HocuspocusProvider({
		url: fullUrl,
		name,
		token,
		connect: false,
		broadcast: false,
		maxAttempts: 5,
		...callbacks,
	});
}

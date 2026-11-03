import { ajax, Event, Loc, Type } from 'main.core';

import { EmbedCreateView } from './embed-create-view';

const EMBED_CREATE_SLIDER_ID_PREFIX = 'vibecodeconnector-embed-create-';

export const EmbedCreateTarget = Object.freeze({
	Hub: 'create',
	Application: 'applications-create',
	Agent: 'agents-create',
});

const EMBED_CREATE_TITLES: { [string]: string } = Object.freeze({
	[EmbedCreateTarget.Hub]: 'VIBECODECONNECTOR_CATALOG_CREATE_TITLE',
	[EmbedCreateTarget.Application]: 'VIBECODECONNECTOR_CATALOG_CREATE_APPLICATION',
	[EmbedCreateTarget.Agent]: 'VIBECODECONNECTOR_CATALOG_CREATE_AGENT',
});

const EMBED_CLOSE_MESSAGE_TYPE = 'vibe:embed-close';
const EMBED_TARIFF_MESSAGE_TYPE = 'vibe:open-tariff';
const EMBED_TARIFF_ACK_MESSAGE_TYPE = 'vibe:open-tariff-ack';
const TARIFF_SLIDER_URL = '/settings/license_all.php';

function resolveOrigin(url: string): string | null
{
	try
	{
		return new URL(url).origin;
	}
	catch
	{
		return null;
	}
}

function listenEmbedMessages(sliderId: string, vibecodeUrl: string): () => void
{
	const allowedOrigin = resolveOrigin(vibecodeUrl);

	const handler = (event: MessageEvent) => {
		if (allowedOrigin === null || event.origin !== allowedOrigin)
		{
			return;
		}

		const type = event.data?.type;
		if (type === EMBED_CLOSE_MESSAGE_TYPE)
		{
			BX.SidePanel.Instance.getSlider(sliderId)?.close();

			return;
		}

		if (type === EMBED_TARIFF_MESSAGE_TYPE)
		{
			BX.SidePanel.Instance.open(TARIFF_SLIDER_URL);
			// the frame falls back to a new tab unless it hears back, so an old module stays usable
			event.source?.postMessage({ type: EMBED_TARIFF_ACK_MESSAGE_TYPE }, allowedOrigin);
		}
	};

	Event.bind(window, 'message', handler);

	return () => Event.unbind(window, 'message', handler);
}

export function openVibecodeCreate(
	view: string,
	options: { vibecodeUrl: string, onClose?: () => void },
): boolean
{
	const titleCode = EMBED_CREATE_TITLES[view];
	if (titleCode === undefined)
	{
		return false;
	}

	const sliderId = `${EMBED_CREATE_SLIDER_ID_PREFIX}${view}`;
	if (BX.SidePanel.Instance.getSlider(sliderId) !== null)
	{
		return true;
	}

	const embedView = new EmbedCreateView();
	const layoutPromise = loadEmbedCreateLayout(view);
	layoutPromise.catch(() => {});

	const unlisten = listenEmbedMessages(sliderId, options.vibecodeUrl);

	const opened = BX.SidePanel.Instance.open(sliderId, {
		title: Loc.getMessage(titleCode),
		cacheable: false,
		allowChangeHistory: false,
		contentCallback: () => embedView.getContainer(),
		events: {
			onLoad: () => {
				layoutPromise
					.then(({ html }) => embedView.mountLayout(html))
					.catch(() => embedView.showLoadError());
			},
			onClose: () => {
				unlisten();
				options.onClose?.();
			},
		},
	});

	if (!opened)
	{
		unlisten();

		return false;
	}

	return true;
}

function loadEmbedCreateLayout(view: string): Promise<{ html: string }>
{
	return ajax.runAction('vibecodeconnector.Embed.openLayout', { data: { view } })
		.then((response) => {
			const html = response?.data?.html;

			return { html: Type.isString(html) ? html : '' };
		});
}

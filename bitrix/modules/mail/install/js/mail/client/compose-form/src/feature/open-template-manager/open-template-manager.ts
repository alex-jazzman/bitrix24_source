import { Page, Uri } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';

import { loadRecentTemplates } from '../load-recent-templates/load-recent-templates';
import { type ComposeState, type TemplateReference } from '../../model/compose/types';

const SubmitEvent = 'CrmMailTemplateEdit:onSubmit';
const SliderMessageEvent = 'SidePanel.Slider:onMessage';

type SubmitPayload = {
	reference?: TemplateReference,
	operation?: 'create' | 'update',
};

type Slider = {
	getUrl?(): string,
};

type SliderMessage = BaseEvent & {
	getEventId(): string | null,
	getSender?(): Slider | null,
};

type SliderOpenEvent = {
	getSlider?(): Slider | null,
};

type SliderStack = {
	getOpenSliders?(): Slider[],
};

type SliderEventEmitter = {
	subscribe(
		eventName: string,
		handler: (event: SliderMessage) => void,
		options?: { compatMode?: boolean },
	): void,
	unsubscribe(eventName: string, handler: (event: SliderMessage) => void): void,
};

type SliderRootWindow = Window & {
	BX?: { Event?: { EventEmitter?: SliderEventEmitter } },
};

/**
 * The panel manager lives in the root window and hands the message of a saved template to the panel opened
 * right before the sender. With the section of templates in between, that panel is the section and not the
 * letter, so the emitter of the frame of the letter never hears the message. The one of the root window hears
 * it at any depth of nesting, and falls back to the local emitter where the root is out of reach.
 *
 * Both are listened to, not the first available one: the extensions of a page get their own instance of
 * `main.core.events`, and it is not the object that lives in `BX.Event` of the same window. A form opened
 * outside a frame therefore hears the message on its own emitter, a framed one on the emitter of the root,
 * and the handler is written to survive hearing it twice.
 */
function getSliderEvents(): SliderEventEmitter
{
	const rootWindow = Page.getRootWindow() as SliderRootWindow | null;
	const localEmitter = EventEmitter as unknown as SliderEventEmitter;
	const rootEmitter = rootWindow?.BX?.Event?.EventEmitter ?? null;
	const emitters = rootEmitter === null || rootEmitter === localEmitter
		? [localEmitter]
		: [rootEmitter, localEmitter];

	return {
		subscribe: (eventName, handler, options): void => {
			emitters.forEach((emitter): void => emitter.subscribe(eventName, handler, options));
		},
		unsubscribe: (eventName, handler): void => {
			emitters.forEach((emitter): void => emitter.unsubscribe(eventName, handler));
		},
	};
}

/**
 * The section of the CRM writes the identifier of an existing template into the address of the form it opens:
 * `.../edit/42/` where the addresses of the portal are readable, `?element_id=42&edit` where they are not.
 * The scheme of those addresses belongs to the CRM and may change there without a word to this form.
 */
function namesExistingTemplate(address: string): boolean
{
	const url = new Uri(address);

	return (/\/edit\/\d+\/?$/).test(url.getPath()) || Number(url.getQueryParam('element_id')) > 0;
}

/**
 * A CRM released before this form reports the bare fact of a save and names no operation at all: a creation
 * and an edit arrive as one and the same message, and the address the panel saved from is the only thing left
 * to tell them apart. An address that names no template of its own - an unreadable address included - counts
 * as a creation, because a CRM that names no operation is the very reason the lead of the list is pinned.
 */
function isCreation(payload: SubmitPayload, sender: Slider | null): boolean
{
	if (payload.operation !== undefined)
	{
		return payload.operation === 'create';
	}

	return !namesExistingTemplate(sender?.getUrl?.() ?? '');
}

/**
 * The emitter of the root window hears the message of every panel of the page, and the identifier of the event
 * alone does not tell whose template was saved. The panels of the page share one stack, so the panel this call
 * opened and everything the user opened on top of it stand above it: a sender anywhere else is somebody else's
 * business. A panel that never reported itself accepts nothing - the list is reread on close regardless.
 */
function isOwnSender(ownSlider: Slider | null, sender: Slider | null): boolean
{
	if (ownSlider === null || sender === null)
	{
		return false;
	}

	if (ownSlider === sender)
	{
		return true;
	}

	const openSliders = (SidePanel.Instance as SliderStack).getOpenSliders?.() ?? [];
	const ownIndex = openSliders.indexOf(ownSlider);

	return ownIndex !== -1 && openSliders.indexOf(sender) > ownIndex;
}

export function openTemplateManager(params: {
	state: ComposeState,
	path: string,
	createPath?: string,
	create?: boolean,
	onRefresh?: () => void,
}): void
{
	const { state, onRefresh, path: managePath, createPath, create } = params;
	const path = create ? createPath || `${managePath.replace(/\/$/, '')}/add/` : managePath;
	const initialReferences = new Set(
		state.templates.recent.map(({ reference }): string => `${reference.source}:${reference.id}`),
	);
	let wasSaved = false;
	let mayHaveCreated = false;
	let ownSlider: Slider | null = null;
	const handleMessage = (event: SliderMessage): void => {
		const sender = event.getSender?.() ?? null;
		if (event.getEventId() !== SubmitEvent || !isOwnSender(ownSlider, sender))
		{
			return;
		}

		const payload = (event.getData() ?? {}) as SubmitPayload;
		if (payload.operation === 'create' && payload.reference?.source === 'crm')
		{
			state.templates.priorityReference = payload.reference;
		}

		wasSaved = true;
		mayHaveCreated = mayHaveCreated || isCreation(payload, sender);
	};

	const sliderEvents = getSliderEvents();
	let isListening = true;
	const stopListening = (): void => {
		if (!isListening)
		{
			return;
		}

		isListening = false;
		sliderEvents.unsubscribe(SliderMessageEvent, handleMessage);
	};

	sliderEvents.subscribe(SliderMessageEvent, handleMessage, { compatMode: true });
	const isOpened = SidePanel.Instance.open(path, {
		cacheable: false,
		events: {
			onOpen: (event: SliderOpenEvent): void => {
				ownSlider = event.getSlider?.() ?? null;
			},
			onCloseComplete: async (): Promise<void> => {
				stopListening();
				/*
				 * Only a template written anew stands outside the history of the user, and a section that names
				 * it leaves nothing to guess at. An unnamed creation is asked for by the newest template the
				 * server knows of; an edit asks for nothing, or a template created by somebody else meanwhile
				 * would take the lead of the list and push an item of the full list out of it.
				 */
				state.templates.pinRecentlyCreated = mayHaveCreated && state.templates.priorityReference === null;
				await loadRecentTemplates(state, true);
				if (!state.templates.isLoaded || state.templates.error !== null)
				{
					return;
				}

				const hasNewTemplate = state.templates.recent.some(({ reference }): boolean => (
					!initialReferences.has(`${reference.source}:${reference.id}`)
				));
				if (!create || wasSaved || hasNewTemplate)
				{
					onRefresh?.();
				}
			},
		},
	});

	/*
	 * The manager answers `false` whenever it opened no panel of its own: the address already stands on top
	 * of the stack, or the panel refused to open. No close of that panel follows, so the handler would stay
	 * in the emitter of the root window for as long as the page lives.
	 */
	if (!isOpened)
	{
		stopListening();
	}
}

import { Loc, Text, Type, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
// @ts-ignore — BitrixVue is declared as namespace in .d.ts, not as export
import { BitrixVue, type App } from 'ui.vue3';
import { createPinia, type Pinia } from 'ui.vue3.pinia';

import { DesktopApi, type DesktopWindow } from 'call.adapter.desktop-api';
import { LocPlugin } from 'call.plugin.loc';
import { IncomingCallEvent, IncomingCallInternalEvent, type IncomingCallEventMap } from 'call.mapping';

import { useCallIncomingStore, type IncomingCallParams } from 'call.store';
import { CallIncoming } from 'call.component.view.incoming';

// BitrixVue is declared as namespace in .d.ts, not as named export
const Vue = BitrixVue as unknown as { createApp: (...args: unknown[]) => App };

interface IncomingCallConfig
{
	callType?: string;
	callerName?: string;
	callerAvatar?: string;
	callerType?: string;
	callerColor?: string;
	video?: boolean;
	hasCamera?: boolean;
	microphoneState?: boolean;
	cameraState?: boolean;
	zIndex?: number;
	onClose?: (...args: unknown[]) => void;
	onDestroy?: (...args: unknown[]) => void;
	onButtonClick?: (...args: unknown[]) => void;
}

interface PostponedEvent
{
	event: string;
	data: Record<string, unknown>;
}

interface MountResult
{
	unmount: () => void;
}

interface IncomingDocumentAttributes
{
	lang?: string | null;
	title?: string | null;
}

type IncomingCallMountProps = IncomingCallParams & {
	languageId?: string;
	lang?: string;
	title?: string;
};

let instanceCounter = 0;

// an invitation to a conference is joined or skipped, an incoming call is answered or declined:
// the window is named after which of the two it is
const DIALOG_NAME_PHRASE = Object.freeze({
	regular: 'CALL_INCOMING_DIALOG_ARIA',
	conference: 'CALL_INCOMING_CONFERENCE_DIALOG_ARIA',
});

const escapeJsonForScript = (json: string): string => {
	return json
		.replaceAll('<', '\\u003C')
		.replaceAll('>', '\\u003E')
		.replaceAll('&', '\\u0026')
		.replaceAll('\u2028', '\\u2028')
		.replaceAll('\u2029', '\\u2029');
};

/**
 * Every phrase of the card goes through here on its way into the Vue plugin. An unknown code comes
 * back from the platform as an empty string, not as undefined, so the fallback is written with ||
 * and not with ??: the plugin itself only guards against undefined, and an empty answer would leave
 * the element with nothing to read. The code of the phrase is at least visible and searchable.
 */
export function resolveIncomingPhrase(id: string, replacements?: Record<string, string>): string
{
	return Loc.getMessage(id, replacements) || id;
}

/**
 * The backend sends the name of the caller HTML-encoded: the store decodes it on its way into the
 * card, and this is the same decoding for the container, which reads the configuration directly and
 * never sees the store. Both consumers of the name, the label of the popup and the title of the
 * second document, take the string already built here.
 */
export function buildIncomingDialogName(callType: string, callerName?: string): string
{
	const phraseCode = callType === 'conference' ? DIALOG_NAME_PHRASE.conference : DIALOG_NAME_PHRASE.regular;
	// the phrase is only in the dictionaries the portal has been translated into, and a name that
	// says nothing leaves the dialog unnamed: neither the label of the popup nor the title of the
	// second document is set from an empty string. The caller is known on every locale
	const decodedName = Text.decode(callerName ?? '');

	return Loc.getMessage(phraseCode, { '#NAME#': decodedName }) || decodedName;
}

/**
 * The document of the second window carries neither a language nor a name of its own. Both are
 * values of the opener, so they are put in from the outside and nothing else about the window is
 * known here.
 */
export function applyIncomingDocumentAttributes(
	targetDocument?: Document | null,
	{ lang, title }: IncomingDocumentAttributes = {},
): void
{
	if (!targetDocument)
	{
		return;
	}

	if (Type.isStringFilled(lang))
	{
		targetDocument.documentElement?.setAttribute('lang', lang);
	}

	if (Type.isStringFilled(title))
	{
		// the document of the window has no <title> node at all: the browser creates one by the
		// assignment itself, and building the node by hand would leave the window unnamed
		// eslint-disable-next-line no-param-reassign -- naming the document given is the whole job
		targetDocument.title = title;
	}
}

export class IncomingCall extends EventEmitter
{
	static Events: IncomingCallEventMap = IncomingCallEvent;

	static mount(container: HTMLElement, props: IncomingCallMountProps): MountResult
	{
		const pinia = createPinia();

		const rootComponent = {
			name: 'CallIncomingApplication',
			components: { CallIncoming },
			methods: {
				onButtonClick(data: Record<string, unknown>): void
				{
					DesktopApi.emitToMainWindow(IncomingCallInternalEvent.onButtonClick, [data]);
				},
			},
			template: /* HTML */'<CallIncoming @button-click="onButtonClick" />',
		};

		const app = Vue.createApp(rootComponent);

		app.use(LocPlugin, {
			getMessage: resolveIncomingPhrase,
			languageId: props.languageId ?? 'ru',
		});

		app.use(pinia);

		const store = useCallIncomingStore(pinia);
		store.initFromParams(props);

		const onSetHasCamera = (event: Record<string, unknown>): void => {
			const data = (event?.data ?? event) as Record<string, unknown>;
			store.setHasCamera(data.hasCamera as boolean);
		};

		DesktopApi.subscribe(IncomingCallInternalEvent.setHasCamera, onSetHasCamera);

		// the order is fixed: the markup goes first, then the language, and only then the name and
		// the focus, so that the window is named in a document that has already declared what it speaks
		app.mount(container);

		applyIncomingDocumentAttributes(container.ownerDocument, { lang: props.lang, title: props.title });

		// the root of the card is read from the mount container, not by a test id: a renamed identifier
		// would look like a change for the tests and silently break the entry of the focus. Vue empties
		// the container before rendering into it, so the first element inside is the root of the card no
		// matter how many root nodes the template has: whitespace around it stays a text node, not an element
		const cardRoot = container.firstElementChild;

		if (cardRoot instanceof HTMLElement)
		{
			cardRoot.focus();
		}

		DesktopApi.emitToMainWindow(IncomingCallInternalEvent.contentReady);

		if (props.callType === 'regular')
		{
			const broadcastChannel = new BroadcastChannel('IncomingNotification');
			broadcastChannel.postMessage({ type: 'desktopWindowIsReady' });
			broadcastChannel.close();
		}

		return {
			unmount: (): void => {
				DesktopApi.unsubscribe(IncomingCallInternalEvent.setHasCamera, onSetHasCamera);
				app.unmount();
			},
		};
	}

	readonly #contentReadyHandler: () => void;
	readonly #buttonClickHandler: (event: Record<string, unknown>) => void;
	readonly #config: IncomingCallConfig;
	readonly #callType: string;
	#popup: Popup | null;
	#app: App | null;
	#pinia: Pinia | null;
	#store: ReturnType<typeof useCallIncomingStore> | null;
	#resizeHandler: (() => void) | null;
	#desktopWindow: DesktopWindow | null;
	#desktopWindowReady: boolean;
	#postponedEvents: PostponedEvent[];
	#broadcastChannel: BroadcastChannel | null;
	readonly #popupId: string;

	constructor(config: IncomingCallConfig)
	{
		super();
		this.setEventNamespace('BX.Call.IncomingCall');

		this.#config = config;
		this.#callType = config.callType ?? 'regular';

		this.#popup = null;
		this.#app = null;
		this.#pinia = null;
		this.#store = null;
		this.#resizeHandler = null;

		this.#desktopWindow = null;
		this.#desktopWindowReady = false;
		this.#postponedEvents = [];
		this.#broadcastChannel = null;

		this.#contentReadyHandler = this.#onDesktopContentReady.bind(this);
		this.#buttonClickHandler = this.#onDesktopButtonClick.bind(this);

		instanceCounter += 1;
		this.#popupId = `bx-call-incoming-${instanceCounter}`;

		if (Type.isFunction(config.onClose))
		{
			this.subscribe(IncomingCallEvent.onClose, config.onClose);
		}

		if (Type.isFunction(config.onDestroy))
		{
			this.subscribe(IncomingCallEvent.onDestroy, config.onDestroy);
		}

		if (Type.isFunction(config.onButtonClick))
		{
			this.subscribe(IncomingCallEvent.onButtonClick, config.onButtonClick);
		}
	}

	show(): void
	{
		if (DesktopApi.isChatWindow())
		{
			this.#showInDesktop();

			return;
		}

		this.#showInWeb();
	}

	setHasCamera(hasCamera: boolean): void
	{
		if (this.#callType !== 'regular')
		{
			return;
		}

		if (this.#store !== null)
		{
			this.#store.setHasCamera(hasCamera);
		}

		if (DesktopApi.isChatWindow() || this.#desktopWindow !== null)
		{
			if (this.#desktopWindowReady)
			{
				DesktopApi.emit(IncomingCallInternalEvent.setHasCamera, [{ hasCamera }]);
			}
			else
			{
				this.#postponedEvents.push({
					event: IncomingCallInternalEvent.setHasCamera,
					data: { hasCamera },
				});
			}
		}
	}

	close(): void
	{
		if (this.#popup)
		{
			this.#popup.close();
		}

		if (this.#desktopWindow)
		{
			this.#desktopWindow.BXDesktopWindow.ExecuteCommand('hide');

			if (DesktopApi.getApiVersion() >= 76)
			{
				this.#desktopWindow.BXDesktopWindow.ExecuteCommand('close');
				this.#desktopWindow = null;
				this.#desktopWindowReady = false;
			}
		}

		this.emit(IncomingCallEvent.onClose, {});
	}

	destroy(): void
	{
		if (this.#resizeHandler)
		{
			Event.unbind(window, 'resize', this.#resizeHandler);
			this.#resizeHandler = null;
		}

		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
		}

		if (this.#popup)
		{
			this.#popup.destroy();
			this.#popup = null;
		}

		if (this.#broadcastChannel)
		{
			this.#broadcastChannel.close();
			this.#broadcastChannel = null;
		}

		DesktopApi.unsubscribe(IncomingCallInternalEvent.contentReady, this.#contentReadyHandler);
		DesktopApi.unsubscribe(IncomingCallInternalEvent.onButtonClick, this.#buttonClickHandler);

		if (this.#desktopWindow)
		{
			this.#desktopWindow.BXDesktopWindow.ExecuteCommand('close');
			this.#desktopWindow = null;
		}

		this.#store = null;
		this.#pinia = null;

		this.emit(IncomingCallEvent.onDestroy, {});
	}

	onResize(): void
	{
		const maxHeight = document.body.clientHeight;

		if (this.#popup)
		{
			this.#popup.setMaxHeight(maxHeight);
		}
	}

	#showInWeb(): void
	{
		const mountContainer = document.createElement('div');

		this.#popup = new Popup({
			id: this.#popupId,
			autoHide: false,
			draggable: true,
			closeByEsc: false,
			overlay: { color: '#000000', opacity: 30 },
			borderRadius: 14,
			zIndex: this.#config.zIndex,
			content: mountContainer,
			padding: 0,
			// the trap is asked for explicitly so that the card does not depend on the accessibility
			// setting of the portal: the buttons of the card are the only way out of it
			focusTrap: true,
			ariaLabel: this.#getDialogName(),
			events: {
				onPopupDestroy: () => {
					this.#app?.unmount();
				},
			},
		} as Record<string, unknown>);

		this.#pinia = createPinia();

		const rootComponent = {
			name: 'CallIncomingApplication',
			components: { CallIncoming },
			methods: {
				onButtonClick: (data: Record<string, unknown>): void => this.#onVueButtonClick(data),
			},
			template: /* HTML */' <CallIncoming @button-click="onButtonClick" /> ',
		};

		this.#app = Vue.createApp(rootComponent) as App;
		this.#app.use(LocPlugin, {
			getMessage: resolveIncomingPhrase,
			languageId: Loc.getMessage('LANGUAGE_ID') ?? 'en',
		});
		this.#app.use(this.#pinia!);

		this.#store = useCallIncomingStore(this.#pinia);
		this.#store.initFromParams(this.#config);

		this.#app.mount(mountContainer);
		this.#popup!.show();

		this.#resizeHandler = this.onResize.bind(this);
		Event.bind(window, 'resize', this.#resizeHandler);
		this.onResize();
	}

	#getDialogName(): string
	{
		return buildIncomingDialogName(this.#callType, this.#config.callerName);
	}

	#onVueButtonClick(eventData: Record<string, unknown>): void
	{
		this.emit(IncomingCallEvent.onButtonClick, eventData);
	}

	#showInDesktop(): void
	{
		if (this.#desktopWindow)
		{
			this.#desktopWindow.BXDesktopWindow.ExecuteCommand('show');

			return;
		}

		DesktopApi.subscribe(IncomingCallInternalEvent.contentReady, this.#contentReadyHandler);
		DesktopApi.subscribe(IncomingCallInternalEvent.onButtonClick, this.#buttonClickHandler);

		if (this.#callType === 'regular')
		{
			this.#broadcastChannel = new BroadcastChannel('IncomingNotification');
			this.#broadcastChannel.onmessage = (event: MessageEvent): void => {
				if (event.data?.type === 'desktopWindowIsReady')
				{
					this.#setDesktopWindowDimensions();
				}
			};
		}

		const props = {
			callType: this.#config.callType,
			callerName: this.#config.callerName,
			callerAvatar: this.#config.callerAvatar ?? '',
			callerType: this.#config.callerType ?? '',
			callerColor: this.#config.callerColor ?? '#525252',
			video: this.#config.video ?? false,
			hasCamera: this.#config.hasCamera ?? false,
			microphoneState: this.#config.microphoneState ?? true,
			cameraState: this.#config.cameraState ?? false,
			isDesktop: true,
			languageId: Loc.getMessage('LANGUAGE_ID') ?? 'en',
			// the language tag is copied from the main document: LANGUAGE_ID is the identifier of the
			// language of the portal, and for kz, ua, sc, tc, br, la and vn it is not a language tag
			lang: document.documentElement?.lang,
			title: this.#getDialogName(),
		};

		const propsJson = escapeJsonForScript(JSON.stringify(props));

		const js = `
			BX.Runtime.loadExtension('call.application.incoming').then(function(exports) {
				var container = document.createElement('div');
				document.body.appendChild(container);
				exports.IncomingCall.mount(container, ${propsJson});
			});
		`;

		this.#desktopWindow = DesktopApi.createTopmostWindow(DesktopApi.prepareHtml('', js));
	}

	#onDesktopContentReady(): void
	{
		this.#desktopWindowReady = true;
		this.#setDesktopWindowDimensions();

		this.#postponedEvents.forEach((item: PostponedEvent) => {
			DesktopApi.emit(item.event, [item.data]);
		});

		this.#postponedEvents = [];
	}

	#onDesktopButtonClick(event: Record<string, unknown>): void
	{
		const data = (event?.data ?? event) as Record<string, unknown>;
		this.emit(IncomingCallEvent.onButtonClick, data);
	}

	#setDesktopWindowDimensions(): void
	{
		if (!this.#desktopWindow)
		{
			return;
		}

		const width = 352;
		const height = 495;

		this.#desktopWindow.BXDesktopWindow?.SetProperty?.('position', {
			X: 'STP_CENTER',
			Y: 'STP_VCENTER',
			Width: width,
			Height: height,
		});
	}
}

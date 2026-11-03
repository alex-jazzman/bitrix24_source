import { Type } from 'main.core';
import { type App as VueApp, BitrixVue, reactive } from 'ui.vue3';
import { createPinia, setActivePinia } from 'ui.vue3.pinia';

import { type EditorAdapter, type PresentationAdapter, type SaveStatus } from '../const/adapter';
import { HeaderElement } from '../const/element';
import {
	EditorAdapterInjectionKey,
	EditUrlInjectionKey,
	NameAsPageHeadingInjectionKey,
	PresentationAdapterInjectionKey,
	SaveStatusInjectionKey,
	ShowPromoImmediatelyInjectionKey,
} from '../const/injection';
import {
	applyComposition,
	loadComposition,
	requiresDocumentSession,
} from '../feature/load-composition/load-composition';
import { RenameRefusal, renameObject, type RenameResult } from '../feature/rename-object/rename-object';
import { type SessionBoostContext, showBoost } from '../feature/show-boost/show-boost';
import { loadInitialPresence } from '../feature/sync-presence/sync-presence';
import { reportTimeToActions } from '../lib/timing/timing';
import { useCompositionStore } from '../model/composition/composition';
import { App } from './app';

export type MountContext = {
	// the opening as the controller knows it; an opening which is not a session of a document has none
	documentSessionHash?: string,
	adapter: EditorAdapter,
	// the container the existing boost package renders its own button into
	boostContainerId: string,
	// the address the logo leads to; depends on the surface and the mode of the opening
	logoUrl: string,
	// the address of the switch to editing the same opening; computed by the server
	editUrl: string,
	// the shell which owns the presentation mode; a shell which has no such mode gives none
	presentationAdapter?: PresentationAdapter,
	// the scenario of showing the boost widget automatically; `null` when the server assigned none
	sessionBoost: SessionBoostContext | null,
	shouldShowPromoImmediately: boolean,
	// the header stands on a page of its own and not in a shell of an editor, so the name of the
	// object is the heading of that page; a shell which says nothing gets the name as plain text
	shouldRenderNameAsPageHeading?: boolean,
	// the description of the opening as the page carried it; absent when the page could not describe it
	composition?: unknown,
};

/**
 * Classes of events the header leaves a trace of. Neither of them takes the opened object down: the
 * header simply does not appear, and the failure stays visible before a user reports it.
 */
const FailureEvent = Object.freeze({
	Mount: 'mount',
	Composition: 'composition',
} as const);

/**
 * The header of an opened document or board. The shell of the page gives it a container and the
 * context of the opening; everything specific to the editor arrives through the adapter, and nothing
 * outside the composition is ever drawn.
 */
export class DocumentHeader
{
	#container: HTMLElement;
	#context: MountContext;
	#pinia: ReturnType<typeof createPinia> | null = null;
	#app: VueApp | null = null;
	#unsubscribeFromAdapter: (() => void) | null = null;
	#saveStatus: SaveStatus = reactive({ state: 'neutral' });
	#isUnmounted: boolean = false;

	constructor(container: HTMLElement, context: MountContext)
	{
		this.#container = container;
		this.#context = context;

		void this.#start();
	}

	unmount(): void
	{
		this.#isUnmounted = true;
		this.#unsubscribeFromAdapter?.();
		this.#unsubscribeFromAdapter = null;
		this.#app?.unmount();
		this.#app = null;
		this.#pinia = null;
	}

	/**
	 * Renaming of the object from outside the header - the editor of the object may rename it on its
	 * own side, and the object follows. The header owns its own store, so the store is addressed here
	 * rather than through whichever one happens to be active on the page.
	 */
	async rename(newName: string): Promise<RenameResult>
	{
		if (this.#pinia === null)
		{
			return { success: false, refusal: RenameRefusal.Refused, message: '' };
		}

		setActivePinia(this.#pinia);

		return renameObject(this.#context.documentSessionHash, newName);
	}

	async #start(): Promise<void>
	{
		const problems = validateMountContext(this.#container, this.#context);
		if (problems.length > 0)
		{
			reportFailure(FailureEvent.Mount, `the mount context is not usable: ${problems.join(', ')}`);

			return;
		}

		const pinia = createPinia();
		// the composition is put into the store outside any component, so the store is made active first
		setActivePinia(pinia);
		this.#pinia = pinia;

		// The page hands the description of the opening over together with itself, and the header is
		// drawn without waiting for anything. The request stays the way back for a page which carried
		// no description, and the way the header refreshes the description afterwards.
		if (!applyComposition(this.#context.composition))
		{
			const loaded = await loadComposition(this.#context.documentSessionHash);
			if (!loaded.success)
			{
				reportFailure(FailureEvent.Composition, `${loaded.error.code} ${loaded.error.message}`.trim());

				return;
			}

			if (this.#isUnmounted)
			{
				return;
			}
		}

		const store = useCompositionStore();
		if (store.composition?.objectType === 'document')
		{
			// a document at rest reads as saved; a board states its own mode through its adapter instead
			this.#saveStatus.state = 'saved';
		}

		this.#subscribeToAdapter();
		this.#mount(pinia);

		reportTimeToActions(store.composition?.objectType ?? '');

		if (store.hasElement(HeaderElement.Presence))
		{
			// the roster arrives after the header is drawn: the block appears once it is confirmed
			void loadInitialPresence(this.#context.documentSessionHash);
		}

		if (store.hasElement(HeaderElement.Boost))
		{
			void showBoost({
				containerId: this.#context.boostContainerId,
				sessionBoost: this.#context.sessionBoost,
				isCancelled: () => this.#isUnmounted,
			});
		}
	}

	#mount(pinia: ReturnType<typeof createPinia>): void
	{
		const app = BitrixVue.createApp(App, {
			documentSessionHash: this.#context.documentSessionHash,
			boostContainerId: this.#context.boostContainerId,
			logoUrl: this.#context.logoUrl,
		});

		app.use(pinia);
		app.provide(SaveStatusInjectionKey, this.#saveStatus);
		app.provide(EditorAdapterInjectionKey, this.#context.adapter);
		app.provide(EditUrlInjectionKey, this.#context.editUrl);
		app.provide(PresentationAdapterInjectionKey, this.#context.presentationAdapter ?? null);
		app.provide(ShowPromoImmediatelyInjectionKey, this.#context.shouldShowPromoImmediately);
		app.provide(NameAsPageHeadingInjectionKey, this.#context.shouldRenderNameAsPageHeading === true);
		app.mount(this.#container);

		this.#app = app;
	}

	/**
	 * What the editor reports is passed on as it is, with one rule of the header on top: a document
	 * is never shown as neutral. Neutral means the editor claims nothing - the document is at rest -
	 * and a document at rest reads as saved. Everything the editor does claim, the saving of a change
	 * among it, reaches the indicator unchanged.
	 */
	#subscribeToAdapter(): void
	{
		const unsubscribe = this.#context.adapter.subscribeToSaveStatus((status: SaveStatus) => {
			const objectType = useCompositionStore().composition?.objectType;
			this.#saveStatus.state = status.state === 'neutral' && objectType === 'document'
				? 'saved'
				: status.state
			;
			this.#saveStatus.errorMessage = status.errorMessage;
		});

		this.#unsubscribeFromAdapter = Type.isFunction(unsubscribe) ? unsubscribe : null;
	}
}

/**
 * The context is collected by the shell of the page, so it is checked before anything is mounted: a
 * header which cannot be trusted is better absent than wrong.
 */
export function validateMountContext(container: HTMLElement, context: MountContext): string[]
{
	if (!Type.isPlainObject(context))
	{
		return ['context'];
	}

	const problems: string[] = [];

	if (!Type.isElementNode(container))
	{
		problems.push('container');
	}

	// the session names the opening to the controller, so it is asked for only where the header talks to it
	if (requiresDocumentSession(context.composition) && !Type.isStringFilled(context.documentSessionHash))
	{
		problems.push('documentSessionHash');
	}

	if (!isEditorAdapter(context.adapter))
	{
		problems.push('adapter');
	}

	if (!Type.isStringFilled(context.boostContainerId))
	{
		problems.push('boostContainerId');
	}

	if (!Type.isString(context.logoUrl))
	{
		problems.push('logoUrl');
	}

	// an object which cannot be edited simply carries no such element, so an empty address is normal
	if (!Type.isString(context.editUrl))
	{
		problems.push('editUrl');
	}

	// the scenario of the widget is not assigned to every opening, and an absent one is normal
	if (context.sessionBoost !== null && !isSessionBoostContext(context.sessionBoost))
	{
		problems.push('sessionBoost');
	}

	if (!Type.isBoolean(context.shouldShowPromoImmediately))
	{
		problems.push('shouldShowPromoImmediately');
	}

	// only a shell standing on a page of its own says so, and saying nothing is normal
	if (
		context.shouldRenderNameAsPageHeading !== undefined
		&& !Type.isBoolean(context.shouldRenderNameAsPageHeading)
	)
	{
		problems.push('shouldRenderNameAsPageHeading');
	}

	// the mode is not offered by every shell, and an absent adapter is normal
	if (context.presentationAdapter !== undefined && !isPresentationAdapter(context.presentationAdapter))
	{
		problems.push('presentationAdapter');
	}

	return problems;
}

/** A scenario without the address of the mark would open the widget on every opening of the object. */
function isSessionBoostContext(boost: SessionBoostContext): boolean
{
	return Type.isPlainObject(boost)
		&& Type.isBoolean(boost.shouldShowWidgetInstantly)
		&& Type.isPlainObject(boost.widgetViewOption)
		&& Type.isStringFilled(boost.widgetViewOption.category)
		&& Type.isStringFilled(boost.widgetViewOption.name)
	;
}

function isEditorAdapter(adapter: EditorAdapter): boolean
{
	return Type.isObject(adapter)
		&& Type.isFunction(adapter.subscribeToSaveStatus)
		&& Type.isFunction(adapter.retrySave)
		&& Type.isFunction(adapter.canRetrySave)
	;
}

function isPresentationAdapter(adapter: PresentationAdapter): boolean
{
	return Type.isObject(adapter)
		&& Type.isFunction(adapter.enter)
		&& Type.isFunction(adapter.exit)
		&& Type.isFunction(adapter.subscribeToState)
		&& Type.isFunction(adapter.isActive)
	;
}

function reportFailure(event: string, detail: string): void
{
	console.error(`[disk.document-header] ${event} failed: ${detail}`);
}

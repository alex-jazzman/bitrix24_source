import { Dom, Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import { defineComponent, inject, markRaw } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { mapState } from 'ui.vue3.pinia';

import { type PresentationAdapter } from '../../const/adapter';
import { HeaderElement, type HeaderElementValue } from '../../const/element';
import { PresentationAdapterInjectionKey } from '../../const/injection';
import { HeaderTestId } from '../../const/testid';
import { copyLink } from '../../feature/copy-link/copy-link';
import { openAccess } from '../../feature/open-access-popup/open-access-popup';
import { ButtonSpinner } from '../../lib/button-spinner/button-spinner';
import { useCompositionStore } from '../../model/composition/composition';
import { type CompositionModel } from '../../model/composition/types';

import './action-bar.css';

/**
 * What the shell of the page gave the header besides the composition. An action which needs it is
 * only shown while the shell answers for it.
 */
type ActionContext = {
	presentationAdapter: PresentationAdapter | null,
};

type ActionDescriptor = {
	element: HeaderElementValue,
	icon: string,
	phraseCode: string,
	testId: string,
	/** The access and the downloading carry a visible caption; the rest are icons on every width. */
	hasCaption: boolean,
	/**
	 * The address of an action which is a link: the browser does the work, so such an action carries
	 * no `run` of its own.
	 */
	linkUrl?: (composition: CompositionModel) => string,
	/** An action the shell of the page answers for is out of the bar while the shell does not. */
	isAvailable?: (context: ActionContext) => boolean,
	/** An action which gives its promise back keeps its own button waiting until the work is over. */
	run?: (composition: CompositionModel, context: ActionContext) => void | Promise<void>,
};

type HeaderAction = {
	element: HeaderElementValue,
	icon: string,
	caption: string,
	text: string,
	linkUrl: string,
	dataset: { headerAction: HeaderElementValue, testid: string },
	run: (() => void | Promise<void>) | null,
};

type ActionBarContext = {
	AirButtonStyle: typeof AirButtonStyle,
	ButtonSize: typeof ButtonSize,
	presentationAdapter: PresentationAdapter | null,
};

type ActionBarState = {
	/** The bar carries out one action at a time, so a single element names the button which waits. */
	waitingElement: HeaderElementValue | null,
	spinner: ButtonSpinner | null,
	isPresentationActive: boolean,
	unsubscribeFromPresentation: (() => void) | null,
};

/** The only place the bar says which addresses it is ready to put into a link of its own. */
const AllowedLinkSchemes: ReadonlySet<string> = new Set(['http:', 'https:']);

/**
 * The second lock over the composition the server built: only an address the browser may follow
 * from this page reaches an `href`. An empty one is no address either - it resolves to the page
 * itself and would leave a button which looks alive and does nothing.
 */
function isFollowableUrl(url: string): boolean
{
	if (url.trim() === '')
	{
		return false;
	}

	try
	{
		return AllowedLinkSchemes.has(new URL(url, document.baseURI).protocol);
	}
	catch
	{
		return false;
	}
}

/** Declaration order is the render order; it repeats the order of the elements in the composition. */
const ActionDescriptors: ActionDescriptor[] = [
	{
		element: HeaderElement.Access,
		icon: Outline.THREE_PERSONS,
		phraseCode: 'DISK_DOCUMENT_HEADER_ACCESS_ACTION',
		testId: HeaderTestId.Access,
		hasCaption: true,
		// the popup arrives with the extension of its own, so the button waits until it is on the screen
		run: (composition: CompositionModel) => {
			return openAccess(composition);
		},
	},
	{
		element: HeaderElement.CopyLink,
		icon: Outline.LINK,
		phraseCode: 'DISK_DOCUMENT_HEADER_COPY_LINK_ACTION',
		testId: HeaderTestId.CopyLink,
		hasCaption: false,
		// the address of the object as the composition gives it: copying turns no access on
		run: (composition: CompositionModel) => {
			void copyLink(composition.urls.unifiedLink);
		},
	},
	{
		element: HeaderElement.Download,
		icon: Outline.DOWNLOAD,
		phraseCode: 'DISK_DOCUMENT_HEADER_DOWNLOAD_ACTION',
		testId: HeaderTestId.Download,
		hasCaption: true,
		// the address the composition hands out; the header adds nothing of its own to it
		linkUrl: (composition: CompositionModel) => composition.urls.download,
	},
	{
		element: HeaderElement.Presentation,
		icon: Outline.EXPAND_M,
		phraseCode: 'DISK_DOCUMENT_HEADER_PRESENTATION_ACTION',
		testId: HeaderTestId.Presentation,
		// the mode belongs to the page, so the button keeps its icon alone at every width
		hasCaption: false,
		isAvailable: (context: ActionContext) => context.presentationAdapter !== null,
		// the entry alone: the way out of the mode is the floating button of the page
		run: (composition: CompositionModel, context: ActionContext) => {
			context.presentationAdapter?.enter();
		},
	},
];

/**
 * Actions of the header. An action belongs to the bar only while its element belongs to the
 * composition; the bar keeps no rules of its own and asks the features to do the work.
 */
export const ActionBar = defineComponent({
	name: 'DiskDocumentHeaderActionBar',
	components: {
		UiButton,
	},
	props: {
		showCaptions: {
			type: Boolean,
			default: true,
		},
	},
	setup(): ActionBarContext
	{
		return {
			AirButtonStyle,
			ButtonSize,
			/**
			 * Taken here and not into the state of the component on purpose: a reactive wrapper around an
			 * object of somebody else breaks the identity the shell compares it by.
			 */
			presentationAdapter: inject<PresentationAdapter | null>(PresentationAdapterInjectionKey, null),
		};
	},
	data(): ActionBarState
	{
		return {
			waitingElement: null,
			spinner: null,
			isPresentationActive: false,
			unsubscribeFromPresentation: null,
		};
	},
	computed: {
		...mapState(useCompositionStore, ['composition', 'hasElement']),
		actionContext(): ActionContext
		{
			return {
				presentationAdapter: this.presentationAdapter,
			};
		},
		actions(): HeaderAction[]
		{
			const composition: CompositionModel | null = this.composition;
			if (composition === null)
			{
				return [];
			}

			const actions: HeaderAction[] = [];
			for (const descriptor of ActionDescriptors)
			{
				if (!this.hasElement(descriptor.element) || !(descriptor.isAvailable?.(this.actionContext) ?? true))
				{
					continue;
				}

				// asked of the descriptor once: the bar both keeps the action by the address and links by it
				const linkUrl = descriptor.linkUrl?.(composition);
				if (linkUrl !== undefined && !isFollowableUrl(linkUrl))
				{
					continue;
				}

				actions.push(this.createAction(descriptor, composition, linkUrl ?? ''));
			}

			return actions;
		},
	},
	watch: {
		// nothing in the render depends on the wait any more, so the update of the bar is no news about it
		waitingElement(): void
		{
			this.syncButtonAttributes();
			this.syncSpinner();
		},
		/**
		 * The state of the mode is not in the render, and the focus comes back here once the mode is over,
		 * whichever path took it off. Followed at once: a full screen confirmed after the mode was already
		 * left turns the state on and off within one tick, and a deferred watcher, comparing the ends of
		 * it, would see no change at all and leave the focus nowhere.
		 */
		isPresentationActive: {
			flush: 'sync',
			handler(isActive: boolean): void
			{
				if (!isActive)
				{
					this.focusAction(HeaderElement.Presentation);
				}
			},
		},
	},
	mounted(): void
	{
		this.subscribeToPresentation();
		this.syncButtonAttributes();
		this.syncSpinner();
	},
	updated(): void
	{
		this.syncButtonAttributes();
		this.syncSpinner();
	},
	beforeUnmount(): void
	{
		this.unsubscribeFromPresentation?.();
		this.unsubscribeFromPresentation = null;
		this.destroySpinner();
	},
	methods: {
		/** The mode is turned on and off from outside the header as well, so the state is asked for. */
		subscribeToPresentation(): void
		{
			const adapter: PresentationAdapter | null = this.presentationAdapter;
			if (adapter === null)
			{
				return;
			}

			this.isPresentationActive = adapter.isActive();
			this.unsubscribeFromPresentation = adapter.subscribeToState((isActive: boolean) => {
				this.isPresentationActive = isActive;
			});
		},
		createAction(descriptor: ActionDescriptor, composition: CompositionModel, linkUrl: string): HeaderAction
		{
			const caption = Loc.getMessage(descriptor.phraseCode) ?? '';
			const { run } = descriptor;
			const context = this.actionContext;

			return {
				element: descriptor.element,
				icon: descriptor.icon,
				caption,
				text: descriptor.hasCaption && this.showCaptions ? caption : '',
				linkUrl,
				dataset: { headerAction: descriptor.element, testid: descriptor.testId },
				run: run === undefined ? null : () => run(composition, context),
			};
		},
		focusAction(element: HeaderElementValue): void
		{
			this.findActionNode(element)?.focus();
		},
		findActionNode(element: HeaderElementValue): HTMLElement | null
		{
			const bar = this.$el;
			if (!(bar instanceof HTMLElement))
			{
				return null;
			}

			const node = bar.querySelector(`[data-header-action="${element}"]`);

			return node instanceof HTMLElement ? node : null;
		},
		async handleAction(action: HeaderAction): Promise<void>
		{
			// a downloading action is the link itself: the browser follows the address without us
			if (action.run === null)
			{
				return;
			}

			// the button which waits stays operable so it keeps the focus, and answers no press meanwhile
			if (this.waitingElement !== null)
			{
				return;
			}

			const work = action.run();
			if (!(work instanceof Promise))
			{
				return;
			}

			this.waitingElement = action.element;

			try
			{
				await work;
			}
			finally
			{
				this.waitingElement = null;
			}
		},
		/**
		 * The button of the design system carries neither the accessible name of an icon-only button, nor
		 * the mark of a downloading link, nor the wait through its props, so they are put onto the
		 * rendered node. A waiting button is never `disabled`: that would take it out of the tab order and
		 * drop the focus of the person who has just pressed it.
		 */
		syncButtonAttributes(): void
		{
			this.actions.forEach((action: HeaderAction) => {
				const node = this.findActionNode(action.element);
				if (node === null)
				{
					return;
				}

				const isWaiting = action.element === this.waitingElement;

				Dom.attr(node, 'aria-label', action.caption);
				Dom.attr(node, 'download', action.linkUrl === '' ? null : '');
				Dom.attr(node, 'aria-busy', String(isWaiting));
				Dom.attr(node, 'aria-disabled', isWaiting ? 'true' : null);
			});
		},
		syncSpinner(): void
		{
			if (this.waitingElement === null)
			{
				this.destroySpinner();

				return;
			}

			const target = this.findActionNode(this.waitingElement);
			if (target === null)
			{
				return;
			}

			this.spinner ??= markRaw(new ButtonSpinner());
			this.spinner.showOver(target);
		},
		destroySpinner(): void
		{
			this.spinner?.destroy();
			this.spinner = null;
		},
	},
	template: `
		<div v-if="actions.length > 0" class="disk-document-header-action-bar">
			<UiButton
				v-for="action in actions"
				:key="action.element"
				:text="action.text"
				:leftIcon="action.icon"
				:dataset="action.dataset"
				:link="action.linkUrl"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.OUTLINE"
				@click="handleAction(action)"
			/>
		</div>
	`,
});

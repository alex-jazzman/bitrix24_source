import { Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import {
	isFavoriteRequiredError,
	isShippedSubscriptionMode,
	SHIPPED_SUBSCRIPTION_MODES,
	SubscriptionApi,
	SUBSCRIPTION_MODE_MUTED,
	SUBSCRIPTION_MODE_SELF,
	SUBSCRIPTION_SCOPE_DOCUMENT,
} from './subscription-api';
import { SubscriptionBellView } from './subscription-bell-view';
import { subscribeDocumentSubscription } from './history-pull';
import { extractErrorMessage } from './error-message';
import { showErrorToast } from './show-error-toast';

// Subscription bell of the activity line: the "#bellLine" control plus the scope popover
// per mockup-activity-line.html's #popSub. This half owns the state and the transport - it adopts
// the bootstrap snapshot (or loads it from SubscriptionController.getState), writes through
// SubscriptionApi and reconciles the effective state afterwards. The control itself, the popover
// and its keyboard model live in SubscriptionBellView, shared with the row of the favorites block.
//
// EVENT-02: a subscription changed in another session (or by the same user in another tab)
// re-reads the state, so the bell of an open document stops relying on the page being reloaded.
//
// MODES-01: this half is also where the shipped modes are read. Visibility and the state handed to
// the control are brought to that map, and the form of the control follows from how many modes it
// holds - one leaves nothing to choose. `mute()`/`resume()` stay in place and are out of reach while
// `muted` is not shipped.
export const SubscriptionBellComponent = {
	name: 'NoteDocumentHistorySubscriptionBell',
	components: {
		SubscriptionBellView,
	},
	props: {
		documentId: {
			type: Number,
			required: true,
		},
		// Not required by the document-scope set()/getState() contract (the server
		// resolves the document's own collection when it's omitted) — accepted so the
		// caller can pass it through explicitly when it already has it at hand.
		collectionId: {
			type: Number,
			default: 0,
		},
		// Bell state bundled with the document bootstrap (see DocumentSubscriptionStateResolver):
		// `{ subscribed, mode, muted, inherited, inheritedSource }`. When present the bell adopts it
		// on mount instead of issuing its own getState request; absent → it falls back to getState.
		// Shape matches getState's `document` block, so both paths reuse applyState().
		initialState: {
			type: Object,
			default: null,
		},
		// Is the document in the caller's favorites list. Owned by the star next to the bell,
		// which is the only place that knows the optimistic frame as well as the store.
		isFavorite: {
			type: Boolean,
			default: false,
		},
		messages: {
			type: Object,
			required: true,
		},
	},
	data()
	{
		return {
			subscribed: false,
			mode: null,
			// [inherited] Covered by an ancestor subtree / collection subscription (no direct row) —
			// the bell reads as active and the popover explains the source instead of offering a
			// redundant scope choice. `muted` is the per-document negative override of that coverage.
			inherited: false,
			inheritedSource: null,
			// Title of the covering source (nearest subtree-subscribed ancestor, or the collection) —
			// names it in the info line ("within the «…» section") so the coverage isn't a vague "parent".
			inheritedTitle: '',
			muted: false,
			isLoading: false,
			isSaving: false,
		};
	},
	computed: {
		// MODES-01 / Q-1: only a direct row in a shipped mode counts as a subscription here. A row of a
		// mode outside the shipping delivers nothing, so reading it as active would promise notifications
		// that never arrive - it reads as "not subscribed" instead, and one press rewrites it into the
		// shipped mode (set() upserts), after which the state has fixed itself.
		isShippedSubscription(): boolean
		{
			return this.subscribed && isShippedSubscriptionMode(SUBSCRIPTION_SCOPE_DOCUMENT, this.mode);
		},
		// Coverage from above is a state of the control only while `muted` is shipped: the inherited and
		// muted layouts exist to suppress that coverage, and coverage nothing can suppress has nothing to
		// offer. Derived from the mode map, so returning `muted` to it brings both layouts back by itself.
		isCovered(): boolean
		{
			return this.inherited && isShippedSubscriptionMode(SUBSCRIPTION_SCOPE_DOCUMENT, SUBSCRIPTION_MODE_MUTED);
		},
		// One shipped mode leaves nothing to choose, so the control is a plain toggle. A second mode
		// brings the scope popover back on its own - widening the shipping must not need a component edit.
		isToggleOnly(): boolean
		{
			return SHIPPED_SUBSCRIPTION_MODES[SUBSCRIPTION_SCOPE_DOCUMENT].length < 2;
		},
		toggleMode(): string
		{
			return SHIPPED_SUBSCRIPTION_MODES[SUBSCRIPTION_SCOPE_DOCUMENT][0] ?? SUBSCRIPTION_MODE_SELF;
		},
		// Notifications live on favorites: the bell is offered for a document in the list, and
		// for one that is still covered after the star came off - otherwise there would be no way to
		// switch that coverage off or to mute what an ancestor imposes.
		isVisible(): boolean
		{
			// `muted` is deliberately not a reason of its own: a mute suppresses coverage from above, so it
			// only ever appears together with `inherited`. Once that coverage is gone (the subscription on
			// the knowledge base switched off) the row it left behind suppresses nothing, and a bell for it
			// would sit on a document notifications no longer reach. Same rule in the rows of the block.
			return this.isFavorite || this.isShippedSubscription || this.isCovered;
		},
		// The state surface the view draws from - already brought to the shipped modes, because the
		// control is presentational and normalizes nothing itself.
		bellState(): Object
		{
			return {
				mode: this.isShippedSubscription ? this.mode : null,
				subscribed: this.isShippedSubscription,
				muted: this.muted && this.isCovered,
				inherited: this.isCovered,
				inheritedSource: this.inheritedSource,
				inheritedTitle: this.inheritedTitle,
			};
		},
	},
	created()
	{
		this.subscriptionPullDispose = null;
		// Own announcements come back through the same bus; adopting them would cost a second settle
		// request for a state this component already holds. Delivery is synchronous, so a flag set right
		// before the emit is enough to recognise the echo.
		this.skipOwnSubscriptionEcho = false;

		this.localSubscriptionHandler = (event: Object): void => {
			if (this.skipOwnSubscriptionEcho)
			{
				this.skipOwnSubscriptionEcho = false;

				return;
			}

			const data = event?.getData?.() ?? {};
			const scope = String(data.scope || SUBSCRIPTION_SCOPE_DOCUMENT);
			if (scope !== SUBSCRIPTION_SCOPE_DOCUMENT || Number(data.entityId) !== Number(this.documentId))
			{
				// Not this document's own row - but a subscription on the knowledge base or on the
				// subtree of an ancestor changes what reaches this document, and the payload does not say
				// whether it does. Only the server can tell, so the read waits for the announcement that
				// has the server's answer behind it; an unconfirmed one would be read before the write.
				if (data.confirmed === true)
				{
					void this.loadState();
				}

				return;
			}

			// The state travels with the announcement, so the bell lights up in the frame of the press with
			// no read of its own. A read here would race the sender: the sidebar announces the change
			// optimistically, before its write reaches the server, and getState would answer with the state
			// from before it - the bell would flip back and then forward again on the push. Coverage from
			// above is not touched by a write on this document's own row, so what is held stays valid, and
			// the push that follows settles the rest.
			if (data.state)
			{
				this.subscribed = Boolean(data.state.subscribed);
				this.mode = this.subscribed ? String(data.state.mode || '') : null;
				this.muted = Boolean(data.state.muted);

				return;
			}

			void this.loadState();
		};
		EventEmitter.subscribe('Note:subscriptionChanged', this.localSubscriptionHandler);
	},
	mounted()
	{
		// Adopt the bootstrap snapshot when the caller supplied it (see initialState prop) — no
		// getState round-trip on document open. Fall back to a fetch only when it's absent.
		if (Type.isPlainObject(this.initialState))
		{
			this.applyState(this.initialState);
		}
		else
		{
			void this.loadState();
		}

		this.subscribeSubscriptionEvents();
	},
	beforeUnmount()
	{
		this.unsubscribeSubscriptionEvents();
		EventEmitter.unsubscribe('Note:subscriptionChanged', this.localSubscriptionHandler);
		this.localSubscriptionHandler = null;
	},
	watch: {
		// The editor remounts per document, so this rarely fires — but re-adopt the fresh bootstrap
		// snapshot (or refetch) defensively if the caller ever reuses the instance across documents.
		documentId(): void
		{
			if (Type.isPlainObject(this.initialState))
			{
				this.applyState(this.initialState);
			}
			else
			{
				void this.loadState();
			}

			this.subscribeSubscriptionEvents();
		},
	},
	methods: {
		// Broadcasts a subscription change on this document over the local bus of the page. The state
		// travels with it: every other bell of the same object (the row of the favorites block) can then
		// light up in this frame instead of waiting for the pull round-trip.
		// `confirmed` distinguishes the announcement of the optimistic flip from the one backed by the
		// server's answer: a listener that has to re-read coverage from above can only trust the latter.
		emitSubscriptionChanged(confirmed: boolean = true): void
		{
			this.skipOwnSubscriptionEcho = true;
			EventEmitter.emit('Note:subscriptionChanged', new BaseEvent({
				data: {
					scope: SUBSCRIPTION_SCOPE_DOCUMENT,
					entityId: Number(this.documentId),
					state: this.bellState,
					confirmed,
				},
			}));
		},
		// Shared by the bootstrap-adopt and getState paths — both carry the same `document` shape.
		applyState(state: ?Object): void
		{
			this.subscribed = Boolean(state?.subscribed);
			this.mode = this.subscribed ? String(state?.mode || '') : null;
			this.inherited = Boolean(state?.inherited);
			this.inheritedSource = this.inherited ? String(state?.inheritedSource || '') : null;
			this.inheritedTitle = this.inherited ? String(state?.inheritedTitle || '') : '';
			this.muted = Boolean(state?.muted);
		},
		// The payload carries the direct mode only; the effective state also depends on
		// coverage from above, so the event is a signal to re-read rather than a state to adopt.
		subscribeSubscriptionEvents(): void
		{
			this.unsubscribeSubscriptionEvents();
			this.subscriptionPullDispose = subscribeDocumentSubscription(
				this.documentId,
				() => {
					void this.loadState();
				},
			);
		},
		unsubscribeSubscriptionEvents(): void
		{
			if (typeof this.subscriptionPullDispose === 'function')
			{
				this.subscriptionPullDispose();
			}

			this.subscriptionPullDispose = null;
		},
		async loadState(): Promise<void>
		{
			const documentId = Number(this.documentId);
			if (!(documentId > 0))
			{
				return;
			}

			this.isLoading = true;
			try
			{
				const response = await SubscriptionApi.getState({
					documentId,
					collectionId: Number(this.collectionId) || null,
				});
				this.applyState(response?.data?.document ?? null);
			}
			catch
			{
				// Leave the bell in its default "not subscribed" state rather than showing
				// a misleading toggle — same reasoning as ViewsWidgetComponent.loadSnapshot().
			}
			finally
			{
				this.isLoading = false;
			}
		},
		async selectMode(mode: string): Promise<void>
		{
			if (this.isSaving)
			{
				return;
			}

			// Optimistic: flip colour this frame, reconcile against the server afterwards. set() is
			// idempotent, so the only reason to touch state again is a failure - then roll back to the
			// captured previous state and surface a toast.
			const previous = { subscribed: this.subscribed, mode: this.mode };
			this.subscribed = true;
			this.mode = mode;
			// The row of the sidebar lights up in the frame of the press, like the star does.
			this.emitSubscriptionChanged(false);

			this.isSaving = true;
			try
			{
				await SubscriptionApi.set({ scope: SUBSCRIPTION_SCOPE_DOCUMENT, entityId: this.documentId, mode });
				// Reconcile: a direct subscription may sit atop inherited coverage — reload the true
				// effective state rather than trusting the optimistic flip.
				await this.loadState();
				this.emitSubscriptionChanged();
			}
			catch (error)
			{
				this.subscribed = previous.subscribed;
				this.mode = previous.mode;
				// The optimistic announcement has already been adopted elsewhere - take it back.
				this.emitSubscriptionChanged(false);
				// The document left the favorites list between the render and the press. The
				// roll-back above is already the server's answer about the subscription, and EVENT-01 has
				// the list covered, so this is a stale view rather than a technical failure.
				if (isFavoriteRequiredError(error))
				{
					void this.loadState();

					return;
				}

				showErrorToast(extractErrorMessage(error, this.messages.subscriptionSetError));
			}
			finally
			{
				this.isSaving = false;
			}
		},
		async unsubscribe(): Promise<void>
		{
			if (this.isSaving)
			{
				return;
			}

			// Optimistic (see selectMode) — remove() is idempotent, so mirror the same flow.
			const previous = { subscribed: this.subscribed, mode: this.mode };
			this.subscribed = false;
			this.mode = null;
			this.emitSubscriptionChanged(false);

			this.isSaving = true;
			try
			{
				await SubscriptionApi.remove({ scope: SUBSCRIPTION_SCOPE_DOCUMENT, entityId: this.documentId });
				// Removing the direct row can leave inherited coverage in place (ancestor subtree /
				// collection) — reload so the bell settles to the real effective state.
				await this.loadState();
				this.emitSubscriptionChanged();
			}
			catch (error)
			{
				this.subscribed = previous.subscribed;
				this.mode = previous.mode;
				// The optimistic announcement has already been adopted elsewhere - take it back.
				this.emitSubscriptionChanged(false);
				showErrorToast(extractErrorMessage(error, this.messages.subscriptionRemoveError));
			}
			finally
			{
				this.isSaving = false;
			}
		},
		// [inherited] Suppress this document's notifications despite an ancestor subtree / collection
		// subscription — writes a MODE_MUTED row (negative override). remove() later lifts it (resume).
		async mute(): Promise<void>
		{
			if (this.isSaving)
			{
				return;
			}

			const previousMuted = this.muted;
			this.muted = true; // optimistic: bell off this frame
			this.emitSubscriptionChanged(false);

			this.isSaving = true;
			try
			{
				await SubscriptionApi.set({ scope: SUBSCRIPTION_SCOPE_DOCUMENT, entityId: this.documentId, mode: SUBSCRIPTION_MODE_MUTED });
				await this.loadState();
				this.emitSubscriptionChanged();
			}
			catch (error)
			{
				this.muted = previousMuted;
				this.emitSubscriptionChanged(false);
				showErrorToast(extractErrorMessage(error, this.messages.subscriptionSetError));
			}
			finally
			{
				this.isSaving = false;
			}
		},
		// [inherited] Lift the mute (delete the MODE_MUTED row) — coverage falls back to the ancestor
		// subtree / collection subscription that was there before.
		async resume(): Promise<void>
		{
			if (this.isSaving)
			{
				return;
			}

			const previousMuted = this.muted;
			this.muted = false; // optimistic: back to inherited coverage
			this.emitSubscriptionChanged(false);

			this.isSaving = true;
			try
			{
				await SubscriptionApi.remove({ scope: SUBSCRIPTION_SCOPE_DOCUMENT, entityId: this.documentId });
				await this.loadState();
				this.emitSubscriptionChanged();
			}
			catch (error)
			{
				this.muted = previousMuted;
				this.emitSubscriptionChanged(false);
				showErrorToast(extractErrorMessage(error, this.messages.subscriptionRemoveError));
			}
			finally
			{
				this.isSaving = false;
			}
		},
	},
	// language=Vue
	template: `
		<SubscriptionBellView
			v-if="isVisible"
			:state="bellState"
			:is-saving="isSaving"
			:toggle-only="isToggleOnly"
			:toggle-mode="toggleMode"
			test-id="note-activity-subscription"
			:messages="messages"
			@select-mode="selectMode"
			@unsubscribe="unsubscribe"
			@mute="mute"
			@resume="resume"
		/>
	`,
};

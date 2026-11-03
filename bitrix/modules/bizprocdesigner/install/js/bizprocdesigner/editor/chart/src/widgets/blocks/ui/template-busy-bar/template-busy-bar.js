import { Dom, Loc, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { AirButtonStyle, ButtonSize, ButtonState } from 'ui.buttons';
import { BCircle, BLine } from 'ui.system.skeleton.vue';
import { Avatar } from 'ui.vue3.components.avatar';
import { Button as UiButton } from 'ui.vue3.components.button';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore, toTemplateLockOwner } from '../../../../entities/blocks';
import { editorAPI, type EditorUser } from '../../../../shared/api';
import { getErrorCode, isPortalAdmin } from '../../../../shared/utils';

import './template-busy-bar.css';

// Only keeps the wording of the bar fresh, so the tick is deliberately coarse: leaving the reading
// mode is the business of the button, never of this timer. It is also the one request in the feature
// that grows with the number of readers, not of writers.
const OWNER_REFRESH_TICK_MS = 60 * 1000;

// The action lives inside a vanilla UI.Button rendered by UiButton, so the node is reached through the
// markup and not through a ref of the component. Both actions of the centre answer one selector: the
// same node is marked busy and takes the lost focus over, whichever of the two is on the screen.
const TAKEOVER_BUTTON_TEST_ID = 'bizprocdesigner-editor-template-busy-bar-takeover';
const START_BUTTON_TEST_ID = 'bizprocdesigner-editor-template-busy-bar-start';
const ACTION_BUTTON_SELECTOR = `[data-testid="${TAKEOVER_BUTTON_TEST_ID}"], [data-testid="${START_BUTTON_TEST_ID}"]`;

// The link of the holder leaves the markup for the length of a name lookup, so the node has to be
// found again after it comes back — the same way the action of the centre is.
const OWNER_LINK_TEST_ID = 'bizprocdesigner-editor-template-busy-overlay-owner-link';
const OWNER_LINK_SELECTOR = `[data-testid="${OWNER_LINK_TEST_ID}"]`;

// The description of the overlay is referred to from two places at once — the paragraph itself and
// the section it describes — and both of them leave together.
const DESCRIPTION_ELEMENT_ID = 'bizprocdesigner-editor-template-busy-overlay-description';

// The avatar stands on the line of the name inside the heading, so its size and the placeholder that
// waits for it follow the type of that line, not the scale of avatars elsewhere.
const OWNER_AVATAR_SIZE = 28;
const OWNER_NAME_PLACEHOLDER_WIDTH = 180;
const OWNER_NAME_PLACEHOLDER_HEIGHT = 22;

type OwnerAvatarOptions = {
	size: number,
	title: string,
	picPath: ?string,
};

function loc(phraseCode: string, replacements: ?Object): string
{
	return Loc.getMessage(phraseCode, replacements) ?? '';
}

// @vue/component
export const TemplateBusyBar = {
	name: 'TemplateBusyBar',
	components: {
		Avatar,
		BCircle,
		BLine,
		UiButton,
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			OWNER_AVATAR_SIZE,
			OWNER_NAME_PLACEHOLDER_WIDTH,
			OWNER_NAME_PLACEHOLDER_HEIGHT,
			OWNER_LINK_TEST_ID,
		};
	},
	data(): Object
	{
		return {
			// The holder as the read answered about them: null until it answers and for an employee the
			// provider gave nothing about.
			owner: null,
			isOwnerNameLoading: false,
		};
	},
	computed: {
		...mapState(
			useDiagramStore,
			[
				'isBusy',
				'templateId',
				'hasEnteredBusyDuringWork',
				'busyLock',
				'isBusyLockConfirmedFree',
				'terminalLockReason',
				'isTemplateTakeoverInProgress',
				'canOfferTemplateTakeover',
			],
		),
		ownerId(): number
		{
			return this.busyLock?.userId ?? 0;
		},
		// The two states of the bar: the template is held by somebody else, or nobody holds it and this
		// session has simply stopped editing it.
		title(): string
		{
			return this.busyLock === null
				? loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_BAR_IDLE')
				: loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_OVERLAY_TITLE')
			;
		},
		// A verdict about the template itself leaves the centre without an action, and a description that
		// keeps offering one would promise what cannot be done. The reason of the lock is named by the
		// header from then on, so the centre says nothing instead of saying the wrong thing.
		description(): string
		{
			if (this.terminalLockReason !== null)
			{
				return '';
			}

			if (this.busyLock === null)
			{
				return loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_OVERLAY_IDLE_DESCRIPTION');
			}

			return isPortalAdmin()
				? loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_OVERLAY_ADMIN_DESCRIPTION')
				: loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_OVERLAY_USER_DESCRIPTION')
			;
		},
		// The overlay is described by its centre only while the centre has something to say: a reference
		// to a text that is not on the screen describes nothing.
		descriptionId(): ?string
		{
			return this.description === '' ? null : DESCRIPTION_ELEMENT_ID;
		},
		// A verdict about the template itself outlives the holder: over a deleted template and with a
		// lost access the start of the editing could only be refused, and a free template is no
		// exception — the verdict and the freedom live together.
		isStartAvailable(): boolean
		{
			return this.isBusyLockConfirmedFree && this.busyLock === null && this.terminalLockReason === null;
		},
		// Which of the two actions the centre offers, or neither of them. The identity and not the state:
		// one action replacing the other keeps the bar on the screen and takes the pressed node away with
		// it, and that is what the focus has to be told about.
		centreAction(): ?string
		{
			if (this.canOfferTemplateTakeover)
			{
				return TAKEOVER_BUTTON_TEST_ID;
			}

			return this.isStartAvailable ? START_BUTTON_TEST_ID : null;
		},
		// The visible half of the waiting, and the same one for both actions of the centre: aria-busy is
		// read by the screen reader and leaves the eye nothing, and the state of the design system draws
		// the waiting without a spinner of our own. Deliberately not the loading prop of the button: that
		// one sets the native disabled and drops the action out of the tab order.
		actionButtonState(): ?string
		{
			return this.isTemplateTakeoverInProgress ? ButtonState.WAITING : null;
		},
		text(): string
		{
			return this.busyLock === null
				? loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_BAR_IDLE')
				: loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_BAR_OWNER', { '#USER#': this.ownerTitle })
			;
		},
		// An employee the provider gave nothing about has no page to lead to either.
		ownerProfileUrl(): string
		{
			return this.owner !== null && this.ownerId > 0 ? `/company/personal/user/${this.ownerId}/` : '';
		},
		ownerName(): string
		{
			return this.owner?.name ?? '';
		},
		// The server never sends the name, and the lookup by id keeps the visibility rules of the portal:
		// a hidden employee or a colleague from the extranet leaves the bar without a name, and an
		// impersonal wording is what the person reads instead of a gap.
		ownerTitle(): string
		{
			return Type.isStringFilled(this.ownerName)
				? this.ownerName
				: loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_BAR_OWNER_UNKNOWN')
			;
		},
		ownerAvatarOptions(): OwnerAvatarOptions
		{
			return {
				size: OWNER_AVATAR_SIZE,
				title: this.ownerName,
				picPath: this.owner?.avatarUrl ?? null,
			};
		},
		// The avatar reads its options once, in created(), so a new holder or a new photo has to arrive
		// as a new instance of the component and not as a changed prop.
		ownerAvatarKey(): string
		{
			return `${this.ownerId}:${this.owner?.avatarUrl ?? ''}`;
		},
	},
	watch: {
		ownerId(): void
		{
			void this.loadOwnerName();
		},
		isBusy(isBusy: boolean): void
		{
			if (!isBusy)
			{
				this.stopOwnerRefresh();
			}
		},
		// The wording of the bar changes on its own: the owner is refreshed every minute and a refused
		// button names a new one. A computed only fires here when the value really differs, so an
		// unchanged tick stays silent. A new owner is announced by the lookup of their name instead:
		// until it answers, the wording still carries the name of the previous one.
		text(text: string): void
		{
			if (!this.isOwnerNameLoading)
			{
				this.announceText(text);
			}
		},
		// The centre changes its action while the bar itself stays — a release that could not take the
		// template, a holder who let it go, a verdict that removes both — and the node under the focus
		// leaves with the old action. The unmount is not reached, so releaseFocus() never comes: the
		// focus is carried over here, before the redraw, and lands on the action that arrives.
		centreAction(action: ?string): void
		{
			if (this.$el?.contains?.(document.activeElement) !== true)
			{
				return;
			}

			if (action === null)
			{
				this.releaseFocus();

				return;
			}

			void this.$nextTick(() => {
				this.getActionButtonNode()?.focus?.();
			});
		},
		// The takeover keeps the pressed action in place: a native disabled would drop it out of the tab
		// order under the person, and the second press is stopped by the store itself. The tick asks who
		// holds the template, and its answer would arrive in the middle of the takeover: the flag keeps
		// that question from being asked at all, whichever entry raised it. A question already in the
		// network is not taken back by that — the answer of an outdated one is dropped by its number.
		isTemplateTakeoverInProgress(isInProgress: boolean): void
		{
			const button = this.getActionButtonNode();
			if (button !== null)
			{
				Dom.attr(button, 'aria-disabled', isInProgress ? 'true' : null);
				Dom.attr(button, 'aria-busy', isInProgress ? 'true' : null);
			}

			if (isInProgress)
			{
				this.stopOwnerRefresh();
				this.ownerRefreshGeneration += 1;

				return;
			}

			// The template stayed with somebody else, so the bar stays too — and with it the reason to
			// keep the name it carries fresh.
			if (this.isBusy)
			{
				this.startOwnerRefresh();
			}
		},
		// The holder is replaced while the bar stays: the refresh brings another id, and the name of the
		// new one is looked up behind the skeleton, which takes the link out of the markup. The action of
		// the centre does not change on such a swap, so centreAction() has nothing to carry over — the
		// focus standing on that link is carried here instead, to the link that comes back.
		isOwnerNameLoading(isLoading: boolean): void
		{
			if (isLoading)
			{
				// The very first lookup runs from created(), before there is any markup at all: an absent
				// link must not read as the focused one, whatever the document says about the focus.
				const link = this.getOwnerLinkNode();
				this.hasFocusOnOwnerLink = link !== null && link === document.activeElement;

				return;
			}

			if (!this.hasFocusOnOwnerLink)
			{
				return;
			}

			this.hasFocusOnOwnerLink = false;
			void this.$nextTick(() => {
				// The lookup takes about a second, and the person is free to leave during it: a Tab or a
				// click puts them somewhere of their own choosing, and returning the focus from there is
				// the same theft the bar avoids on mount. Only the focus the redraw itself dropped on the
				// body is ours to give back.
				const active = document.activeElement;
				if (active !== null && active !== document.body)
				{
					return;
				}

				// A holder the person is not allowed to see comes back without a link: the action of the
				// centre is what the bar leaves to stand on, and a bar without one leaves the editor.
				const returned = this.getOwnerLinkNode() ?? this.getActionButtonNode();
				if (returned === null)
				{
					this.focusEditorRoot();

					return;
				}

				returned.focus();
			});
		},
	},
	created(): void
	{
		this.ownerRefreshTimerId = null;
		// Numbers the question asked of the server. A request already in the network is taken back by
		// nobody, so the answer of an outdated one is dropped by its number instead.
		this.ownerRefreshGeneration = 0;
		// What the screen reader has already heard. The bar says the same sentence from several places,
		// and each of them is worth a second of speech.
		this.announcedText = '';
		// Whether the focus stood on the link of the holder when the lookup of a new name took it away.
		this.hasFocusOnOwnerLink = false;
		// A verdict about the template itself — it is gone, or the right to it is lost — stops the refresh
		// for good: it would otherwise be asked about every minute for as long as the tab stays open.
		this.isOwnerRefreshBroken = false;
		this.handleVisibilityChange = (): void => {
			if (document.hidden)
			{
				this.stopOwnerRefresh();

				return;
			}

			void this.refreshOwner();
			this.startOwnerRefresh();
		};

		void this.loadOwnerName();
	},
	mounted(): void
	{
		document.addEventListener('visibilitychange', this.handleVisibilityChange);
		this.startOwnerRefresh();
		// A name still on its way makes the announcement wait for it: the impersonal wording that fills
		// the gap meanwhile is a sentence nobody needs to hear before the real one.
		if (!this.isOwnerNameLoading)
		{
			this.announceText(this.text);
		}

		this.takeOverLostFocus();
	},
	beforeUnmount(): void
	{
		document.removeEventListener('visibilitychange', this.handleVisibilityChange);
		this.stopOwnerRefresh();
		this.releaseFocus();

		// The bar also goes away when the version view takes its place: the editor is still closed for
		// writing then, and announcing the way back to work would be untrue.
		if (!this.isBusy)
		{
			LiveAnnouncer.announce(loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_BAR_EXIT'));
		}
	},
	methods: {
		...mapActions(useDiagramStore, [
			'takeOverTemplate',
			'handleTerminalLockCode',
			'refreshBusyOwner',
		]),
		loc,
		// Both actions of the centre are the same move: over a template somebody else holds it starts by
		// releasing their lease, over a free one there is simply nothing to release.
		async handleTakeOver(): Promise<void>
		{
			// The action is drawn busy while the move goes on, and a press on it leads nowhere: the store
			// refuses the repeated entry anyway, and answering that press as a failure would be untrue.
			if (this.isTemplateTakeoverInProgress)
			{
				return;
			}

			// The move changes the centre of the overlay, so what was pressed is remembered before it: the
			// failure of the takeover is not announced in the words of the start of the editing.
			const pressedAction = this.centreAction;
			const wasOwnerShown = this.busyLock !== null;
			const isTakenOver = await this.takeOverTemplate();
			// A move that gave the template away — released and not taken — changes the centre of the
			// overlay, and the change is announced by the new wording of the bar: one event is worth one
			// announcement. Everywhere else the holder stays where they were, nothing on the screen moves,
			// and the press itself is answered here.
			const hasLostShownOwner = wasOwnerShown && this.busyLock === null;
			if (!isTakenOver && !hasLostShownOwner)
			{
				const failure = pressedAction === TAKEOVER_BUTTON_TEST_ID
					? 'BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_BAR_TAKEOVER_FAILED'
					: 'BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_BAR_START_FAILED'
				;
				LiveAnnouncer.announce(loc(failure), 'assertive');
			}
		},
		announceText(text: string): void
		{
			if (text === this.announcedText)
			{
				return;
			}

			this.announcedText = text;
			LiveAnnouncer.announce(text);
		},
		getActionButtonNode(): ?HTMLElement
		{
			return this.$el?.querySelector?.(ACTION_BUTTON_SELECTOR) ?? null;
		},
		getOwnerLinkNode(): ?HTMLElement
		{
			return this.$el?.querySelector?.(OWNER_LINK_SELECTOR) ?? null;
		},
		// The reading mode arrives from the outside — a lease taken away, a refused write — and takes the
		// catalog, the settings dialog and the menu of the header away with it. Whatever the person was
		// standing on is gone by now, and the action of the bar is the one the reading mode leaves.
		takeOverLostFocus(): void
		{
			// A page opened on a template somebody else holds keeps the focus it came with: there the
			// reading mode took nothing away, and a ring on a button nobody pressed only puzzles.
			if (!this.hasEnteredBusyDuringWork)
			{
				return;
			}

			const active = document.activeElement;
			if (active !== null && active !== document.body)
			{
				return;
			}

			this.getActionButtonNode()?.focus?.();
		},
		// The bar leaves together with the only control it had. The content of the editor takes the focus
		// over — the same root the focus monitor of ui.a11y falls back to — so it is not dropped on body.
		releaseFocus(): void
		{
			if (this.$el?.contains?.(document.activeElement) !== true)
			{
				return;
			}

			this.focusEditorRoot();
		},
		// Called on its own when the focus is already lost to the body by a redraw of the bar: the guard
		// of releaseFocus() would read that as somebody else holding the focus and leave it there.
		focusEditorRoot(): void
		{
			const root = this.$el?.closest?.('main') ?? null;
			if (root === null)
			{
				return;
			}

			if (!root.hasAttribute('tabindex'))
			{
				Dom.attr(root, 'tabindex', '-1');
			}

			root.focus({ preventScroll: true });
		},
		async loadOwnerName(): Promise<void>
		{
			const userId = this.ownerId;
			if (userId <= 0)
			{
				this.owner = null;
				this.isOwnerNameLoading = false;

				return;
			}

			this.isOwnerNameLoading = true;
			try
			{
				const users: { [string]: EditorUser } = await editorAPI.fetchUsers([userId]);
				if (this.ownerId === userId)
				{
					this.owner = users[String(userId)] ?? null;
				}
			}
			finally
			{
				this.finishOwnerNameLoad(userId);
			}
		},
		// The announcement the mount left to the lookup is made here, and it is made whatever the lookup
		// answered: a hidden employee has no name to wait for, and the mode must still be told.
		finishOwnerNameLoad(userId: number): void
		{
			if (this.ownerId !== userId)
			{
				return;
			}

			this.isOwnerNameLoading = false;
			this.announceText(this.text);
		},
		startOwnerRefresh(): void
		{
			if (
				this.ownerRefreshTimerId !== null
				|| this.isOwnerRefreshBroken
				|| this.isTemplateTakeoverInProgress
				|| document.hidden
			)
			{
				return;
			}

			this.ownerRefreshTimerId = setInterval(() => {
				void this.refreshOwner();
			}, OWNER_REFRESH_TICK_MS);
		},
		stopOwnerRefresh(): void
		{
			clearInterval(this.ownerRefreshTimerId);
			this.ownerRefreshTimerId = null;
		},
		async refreshOwner(): Promise<void>
		{
			if (
				!this.isBusy
				|| document.hidden
				|| this.isOwnerRefreshBroken
				|| this.isTemplateTakeoverInProgress
				|| this.templateId <= 0
			)
			{
				return;
			}

			this.ownerRefreshGeneration += 1;
			const generation = this.ownerRefreshGeneration;

			try
			{
				const data = await editorAPI.getTemplateLock({ templateId: this.templateId });
				if (generation === this.ownerRefreshGeneration)
				{
					this.applyOwner(data?.lock ?? null);
				}
			}
			catch (error)
			{
				// A failure of a question nobody waits for any more says nothing about the one asked after
				// it: stopping the refresh by it would leave the bar with a name frozen for good.
				if (generation !== this.ownerRefreshGeneration)
				{
					return;
				}

				// Silent on purpose: a refusal here is about a label going stale, and a toast every minute
				// would report it as a failure of the editor. Only a verdict about the template itself is
				// worth giving up on — a broken connection is outlived by the next tick a minute later.
				// Which codes are the verdicts, and what each of them closes the editor with, is answered
				// by the store: the refused write reads them through the very same entry.
				if (!this.handleTerminalLockCode(getErrorCode(error)))
				{
					return;
				}

				this.isOwnerRefreshBroken = true;
				this.stopOwnerRefresh();
			}
		},
		// Only a named foreign owner is taken in. A template nobody holds must not open the writing from
		// here: the graph on the canvas would still be the one somebody else left behind, and the way back
		// to work goes through the button and the reload of the schema. Whether the answer is still worth
		// anything is decided by the store: this one left for the network before the person pressed the
		// button and can well have outlived the reading mode itself.
		applyOwner(lock: mixed): void
		{
			if (lock?.isMine === true)
			{
				return;
			}

			this.refreshBusyOwner(lock === null ? null : toTemplateLockOwner(lock));
		},
	},
	template: `
		<section
			class="bizprocdesigner-editor-template-busy-overlay"
			role="region"
			aria-labelledby="bizprocdesigner-editor-template-busy-overlay-title"
			:aria-describedby="descriptionId"
			data-testid="bizprocdesigner-editor-template-busy-overlay"
		>
			<div
				class="bizprocdesigner-editor-template-busy-overlay__content"
				data-testid="bizprocdesigner-editor-template-busy-bar"
			>
				<h2
					id="bizprocdesigner-editor-template-busy-overlay-title"
					class="bizprocdesigner-editor-template-busy-overlay__title"
					:aria-busy="isOwnerNameLoading"
					data-testid="bizprocdesigner-editor-template-busy-overlay-title"
				>
					<span data-testid="bizprocdesigner-editor-template-busy-overlay-title-text">{{ title }}</span>
					<template v-if="busyLock !== null">
						<br aria-hidden="true">
						<span
							v-if="isOwnerNameLoading"
							class="bizprocdesigner-editor-template-busy-overlay__owner-placeholder"
							aria-hidden="true"
							data-testid="bizprocdesigner-editor-template-busy-overlay-owner-placeholder"
						>
							<BCircle :size="OWNER_AVATAR_SIZE"/>
							<BLine :width="OWNER_NAME_PLACEHOLDER_WIDTH" :height="OWNER_NAME_PLACEHOLDER_HEIGHT"/>
						</span>
						<template v-else>
							<span
								class="bizprocdesigner-editor-template-busy-overlay__owner-avatar"
								aria-hidden="true"
								data-testid="bizprocdesigner-editor-template-busy-overlay-owner-avatar"
							>
								<Avatar :key="ownerAvatarKey" :options="ownerAvatarOptions"/>
							</span>
							<a
								v-if="ownerProfileUrl"
								:href="ownerProfileUrl"
								target="_blank"
								rel="noopener noreferrer"
								class="bizprocdesigner-editor-template-busy-overlay__owner"
								:data-testid="OWNER_LINK_TEST_ID"
							>{{ ownerTitle }}</a>
							<span v-else>{{ ownerTitle }}</span>
						</template>
					</template>
				</h2>
				<p
					v-if="descriptionId !== null"
					:id="descriptionId"
					class="bizprocdesigner-editor-template-busy-overlay__description"
					data-testid="bizprocdesigner-editor-template-busy-overlay-text"
				>{{ description }}</p>
				<span
					class="bizprocdesigner-editor-template-busy-overlay__legacy-text"
					data-testid="bizprocdesigner-editor-template-busy-bar-text"
				>{{ text }}</span>
				<UiButton
					v-if="canOfferTemplateTakeover"
					class="bizprocdesigner-editor-template-busy-overlay__action"
					:text="loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_BAR_TAKEOVER')"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.EXTRA_SMALL"
					:state="actionButtonState"
					:dataset="{ testid: 'bizprocdesigner-editor-template-busy-bar-takeover' }"
					@click="handleTakeOver"
				/>
				<UiButton
					v-if="isStartAvailable"
					class="bizprocdesigner-editor-template-busy-overlay__action"
					:text="loc('BIZPROCDESIGNER_EDITOR_TEMPLATE_BUSY_BAR_START')"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.EXTRA_SMALL"
					:state="actionButtonState"
					:dataset="{ testid: 'bizprocdesigner-editor-template-busy-bar-start' }"
					@click="handleTakeOver"
				/>
			</div>
		</section>
	`,
};

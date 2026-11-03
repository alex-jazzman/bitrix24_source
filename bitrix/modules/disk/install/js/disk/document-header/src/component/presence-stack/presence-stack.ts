import { Dom, Loc } from 'main.core';
import { FocusNavigator } from 'ui.a11y';
import { TextSm, TextXs } from 'ui.system.typography.vue';
import { defineComponent, markRaw } from 'ui.vue3';
import { mapState } from 'ui.vue3.pinia';

import { HeaderElement } from '../../const/element';
import { HeaderTestId } from '../../const/testid';
import { ButtonSpinner } from '../../lib/button-spinner/button-spinner';
import {
	type DeferredComponent,
	type DeferredPopover,
	loadAvatar,
	loadPopover,
} from '../../lib/deferred-ui/deferred-ui';
import { useCompositionStore } from '../../model/composition/composition';
import { usePresenceStore } from '../../model/presence/presence';
import { type PresenceParticipant } from '../../model/presence/types';

import './presence-stack.css';

const VisibleCount = 3;
const StackAvatarSize = 28;
const ListAvatarSize = 24;
const ListOffset = 8;
/** The bubble of the design system is mounted outside the component, so its list is found in the page. */
const ListSelector = '.disk-document-header-presence-list';
/**
 * The bubble does not land in the page in the tick the list is rendered: it is mounted outside the
 * component and held out of sight until a positioning cycle of its own is over. The frames are watched
 * until the dialog takes the focus, and this is the ceiling of that watch - a bubble which never came
 * is a case of its own and not a reason to watch forever.
 */
const ListFocusFrames = 60;
/**
 * A roster which keeps arriving is what asks for the faces again after a refusal, and this is the
 * ceiling of such asks: a load which refuses beat after beat must not be answered forever.
 */
const AvatarAttempts = 3;

type AvatarOptions = {
	size: number,
	userName: string,
	userpicPath: string,
};

/** What the bubble of the design system is given, described here so it is not carried by the opening. */
type PopoverBinding = {
	target: HTMLElement | null,
	positioning: {
		position: string,
		alignment: string,
		offset: number,
	},
};

type PresenceStackState = {
	isOpen: boolean,
	anchor: HTMLElement | null,
	closedAt: number,
	/** The bubble of the design system arrives on the first opening and stays for the next ones. */
	popover: DeferredPopover | null,
	isPopoverLoading: boolean,
	/** The faces arrive with the first roster to draw; until they do, the block holds their place. */
	avatar: DeferredComponent | null,
	isAvatarLoading: boolean,
	/** Asks made for the faces, counted so a refusal which repeats stops being answered. */
	avatarAttempts: number,
	spinner: ButtonSpinner | null,
};

/**
 * Everyone who has the document open: three avatars, a counter of the rest and a list of the whole
 * roster. The block draws itself only on a confirmed roster - an empty stack and a knowingly incomplete
 * one are both worse than no stack at all - and shows nothing about a participant beyond the name and
 * the avatar the server gave: seeing the list grants no rights on the object nor on the profiles.
 */
export const PresenceStack = defineComponent({
	name: 'DiskDocumentHeaderPresenceStack',
	components: {
		TextSm,
		TextXs,
	},
	setup(): Object
	{
		return {
			HeaderTestId,
			ListAvatarSize,
			StackAvatarSize,
		};
	},
	data(): PresenceStackState
	{
		return {
			isOpen: false,
			anchor: null,
			closedAt: 0,
			popover: null,
			isPopoverLoading: false,
			avatar: null,
			isAvatarLoading: false,
			avatarAttempts: 0,
			spinner: null,
		};
	},
	computed: {
		...mapState(useCompositionStore, ['hasElement']),
		...mapState(usePresenceStore, ['isAvailable', 'participants']),
		/** A roster worth drawing; the faces of it are asked for only once there is one. */
		hasRoster(): boolean
		{
			return this.hasElement(HeaderElement.Presence)
				&& this.isAvailable
				&& this.participants.length > 0
			;
		},
		isPresent(): boolean
		{
			return this.hasRoster && this.avatar !== null;
		},
		/** The row holds the place of the faces while an ask for them is still left to make. */
		isAwaited(): boolean
		{
			return this.hasRoster && this.avatar === null && this.avatarAttempts < AvatarAttempts;
		},
		visibleParticipants(): PresenceParticipant[]
		{
			return this.participants.slice(0, VisibleCount);
		},
		hiddenCount(): number
		{
			return Math.max(this.participants.length - VisibleCount, 0);
		},
		triggerLabel(): string
		{
			return Loc.getMessage('DISK_DOCUMENT_HEADER_PRESENCE_ACTION') ?? '';
		},
		listLabel(): string
		{
			return Loc.getMessage('DISK_DOCUMENT_HEADER_PRESENCE_LIST') ?? '';
		},
		/** The faces take their size as an option, and the row is drawn to the very same size. */
		stackSizeStyle(): Record<string, string>
		{
			return { '--disk-document-header-presence-stack-avatar-size': `${StackAvatarSize}px` };
		},
		popoverOptions(): PopoverBinding | null
		{
			if (this.popover === null)
			{
				return null;
			}

			return {
				target: this.anchor,
				positioning: {
					position: this.popover.position,
					alignment: this.popover.alignment,
					offset: ListOffset,
				},
			};
		},
	},
	watch: {
		hasRoster: {
			immediate: true,
			handler(): void
			{
				void this.loadFaces();
			},
		},
		/** A roster which arrived anew is the second chance of the faces a refusal left undrawn. */
		participants: {
			handler(): void
			{
				void this.loadFaces();
			},
		},
	},
	beforeUnmount(): void
	{
		// the block is going away, and with it the list the frames were being watched for
		this.isOpen = false;
		this.destroySpinner();
	},
	methods: {
		/**
		 * A refusal leaves the block undrawn, and the next roster asks for the faces again - up to the
		 * ceiling of the asks, after which the page draws no roster until it is opened anew.
		 */
		async loadFaces(): Promise<void>
		{
			if (!this.hasRoster || this.avatar !== null || this.isAvatarLoading)
			{
				return;
			}

			if (this.avatarAttempts >= AvatarAttempts)
			{
				return;
			}

			this.isAvatarLoading = true;
			const avatar = await loadAvatar();
			this.isAvatarLoading = false;
			this.avatarAttempts += 1;
			this.avatar = avatar === null ? null : markRaw(avatar);
		},
		avatarOptions(participant: PresenceParticipant, size: number): AvatarOptions
		{
			return {
				size,
				userName: participant.name,
				userpicPath: participant.avatar,
			};
		},
		/**
		 * The list closes itself on a click outside, and the stack is outside it: such a click reaches the
		 * stack once the list is already closed and would open it right back. It is told from a new one by
		 * its own moment - an event born before the closing is the very activation that closed the list.
		 *
		 * The bubble the list is drawn in is not a part of the opening and arrives on the first press; the
		 * stack itself stays where it is meanwhile, so the press does not throw the focus anywhere.
		 */
		async toggleList(event: Event): Promise<void>
		{
			const trigger = this.$refs.trigger;
			if (event.timeStamp <= this.closedAt || !(trigger instanceof HTMLElement) || this.isPopoverLoading)
			{
				return;
			}

			if (this.isOpen)
			{
				this.hideList();

				return;
			}

			this.anchor = markRaw(trigger);

			if (this.popover === null)
			{
				this.isPopoverLoading = true;
				this.syncSpinner(trigger);

				const popover = await loadPopover();

				this.isPopoverLoading = false;
				this.popover = popover === null ? null : markRaw(popover);
				this.syncSpinner(trigger);
			}

			// a bubble which never arrived leaves the stack alive: the next press asks for it again
			if (this.popover !== null)
			{
				this.isOpen = true;
				await this.$nextTick();
				await this.focusList();
			}
		},
		closeList(): void
		{
			this.hideList();
			this.closedAt = performance.now();
		},
		/**
		 * Taking the dialog off the page takes away what the keyboard was on: while the focus was inside
		 * the list, the stack it grew out of gets it back. A closing which followed the focus leaving on
		 * its own - a press somewhere else - takes nothing back.
		 */
		hideList(): void
		{
			const holdsFocus = this.listHoldsFocus();

			this.isOpen = false;

			if (holdsFocus && this.$refs.trigger instanceof HTMLElement)
			{
				FocusNavigator.focusTarget(this.$refs.trigger);
			}
		},
		/**
		 * A dialog the keyboard cannot enter gives the press no answer at all. There is nothing to press
		 * inside the list, so the dialog itself takes the focus and lets it go on with the next Tab.
		 *
		 * The dialog is not on the page in the tick it is rendered, and a node which is not there takes no
		 * focus - so the attempt is repeated frame by frame until the focus is really inside the list. A
		 * list which never took it - a bubble which never came - leaves the focus on the stack.
		 */
		async focusList(): Promise<void>
		{
			for (let frame = 0; frame < ListFocusFrames; frame++)
			{
				if (!this.isOpen || !this.focusWaitsOnStack())
				{
					return;
				}

				const list = this.listNode();
				if (list !== null)
				{
					FocusNavigator.focusContainer(list);

					if (this.listHoldsFocus())
					{
						return;
					}
				}

				await nextFrame();
			}
		},
		/** A focus which went somewhere on its own while the bubble was on its way is not taken away. */
		focusWaitsOnStack(): boolean
		{
			const active = FocusNavigator.getActiveElement();

			return active === null || active === document.body || active === this.$refs.trigger;
		},
		listHoldsFocus(): boolean
		{
			const list = this.listNode();
			const active = FocusNavigator.getActiveElement();

			return list !== null && active !== null && list.contains(active);
		},
		listNode(): HTMLElement | null
		{
			const node = document.querySelector(ListSelector);

			return node instanceof HTMLElement ? node : null;
		},
		syncSpinner(trigger: HTMLElement): void
		{
			Dom.attr(trigger, 'aria-busy', String(this.isPopoverLoading));

			if (this.isPopoverLoading)
			{
				this.spinner ??= markRaw(new ButtonSpinner());
				this.spinner.showOver(trigger);

				return;
			}

			this.destroySpinner();
		},
		destroySpinner(): void
		{
			this.spinner?.destroy();
			this.spinner = null;
		},
	},
	template: `
		<div
			v-if="isPresent"
			class="disk-document-header-presence-stack"
			:style="stackSizeStyle"
			:data-testid="HeaderTestId.Presence"
		>
			<button
				ref="trigger"
				type="button"
				class="disk-document-header-presence-stack__trigger"
				:data-testid="HeaderTestId.PresenceTrigger"
				aria-haspopup="dialog"
				:aria-expanded="isOpen ? 'true' : 'false'"
				:aria-label="triggerLabel"
				@click="toggleList"
			>
				<component
					:is="avatar"
					v-for="participant in visibleParticipants"
					:key="participant.id"
					class="disk-document-header-presence-stack__avatar"
					:data-testid="HeaderTestId.PresenceAvatar"
					:options="avatarOptions(participant, StackAvatarSize)"
				/>
				<TextXs v-if="hiddenCount > 0" class="disk-document-header-presence-stack__counter" accent>
					+{{ hiddenCount }}
				</TextXs>
			</button>
			<component
				:is="popover?.component"
				v-if="isOpen"
				class="disk-document-header-presence-list"
				:data-testid="HeaderTestId.PresenceList"
				role="dialog"
				tabindex="-1"
				:aria-label="listLabel"
				:options="popoverOptions"
				@keydown.esc="closeList"
				@hide="closeList"
			>
				<div
					v-for="participant in participants"
					:key="participant.id"
					class="disk-document-header-presence-list__row"
					:data-testid="HeaderTestId.PresenceItem + '-' + participant.id"
				>
					<component :is="avatar" :options="avatarOptions(participant, ListAvatarSize)"/>
					<TextSm class="disk-document-header-presence-list__name">{{ participant.name }}</TextSm>
				</div>
			</component>
		</div>
		<div
			v-else-if="isAwaited"
			class="disk-document-header-presence-stack disk-document-header-presence-stack--awaited"
			:style="stackSizeStyle"
			aria-hidden="true"
		>
			<span
				v-for="participant in visibleParticipants"
				:key="participant.id"
				class="disk-document-header-presence-stack__avatar"
			></span>
			<TextXs v-if="hiddenCount > 0" class="disk-document-header-presence-stack__counter" accent>
				+{{ hiddenCount }}
			</TextXs>
		</div>
	`,
});

function nextFrame(): Promise<void>
{
	return new Promise((resolve: () => void) => {
		requestAnimationFrame(() => resolve());
	});
}

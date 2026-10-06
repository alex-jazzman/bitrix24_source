import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineXs, TextSm } from 'ui.system.typography.vue';
import { Popup } from 'ui.vue3.components.popup';
import { mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import { useLoc } from '../../../../shared/composables';

import './pilot-badge.css';

const CARD_WIDTH = 300;

/**
 * The mark of a live pilot in the toolbar of the editor and the card behind it. The state comes from
 * the store alone; the operations over the pilot are given to the card through the `actions` slot.
 */
// @vue/component
export const PilotBadge = {
	name: 'PilotBadge',
	components: {
		BIcon,
		Popup,
		HeadlineXs,
		TextSm,
	},
	provide(): Object
	{
		return {
			pilotCardLock: {
				hold: this.holdCard,
				release: this.releaseCard,
			},
		};
	},
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			outline: Outline,
		};
	},
	data(): { isCardShown: boolean }
	{
		return {
			isCardShown: false,
		};
	},
	computed: {
		...mapState(useDiagramStore, ['pilot', 'isPilotFeatureAvailable']),
		// while the feature is off a stored pilot is shown nowhere in the editor.
		isVisible(): boolean
		{
			return this.isPilotFeatureAvailable && this.pilot.hasPilot;
		},
		// : the author, the size of the audience and the date belong to the right of
		// publication. Without it the server sends them as null and the card only tells that the pilot is live.
		authorText(): ?string
		{
			if (!Type.isStringFilled(this.pilot.publishedByName))
			{
				return null;
			}

			return this.getMessage(
				'BIZPROCDESIGNER_EDITOR_PILOT_CARD_AUTHOR',
				{ '#NAME#': this.pilot.publishedByName },
			);
		},
		audienceText(): ?string
		{
			if (!Type.isNumber(this.pilot.audienceCount))
			{
				return null;
			}

			return this.getMessage(
				'BIZPROCDESIGNER_EDITOR_PILOT_CARD_AUDIENCE',
				{ '#COUNT#': String(this.pilot.audienceCount) },
			);
		},
		publishedAtText(): ?string
		{
			if (!Type.isStringFilled(this.pilot.publishedAt))
			{
				return null;
			}

			const publishedAt = new Date(this.pilot.publishedAt);
			if (Number.isNaN(publishedAt.getTime()))
			{
				return null;
			}

			return this.getMessage(
				'BIZPROCDESIGNER_EDITOR_PILOT_CARD_PUBLISHED_AT',
				{ '#DATE#': DateTimeFormat.format(DateTimeFormat.getFormat('FORMAT_DATETIME'), publishedAt) },
			);
		},
		// : while the pilot runs over a common version the settings of the process stay
		// as they are, and the publisher is told why before the refusal comes - the refusal itself is
		// the server's and reaches the form of the settings, not this editor.
		isSettingsFrozen(): boolean
		{
			return this.pilot.settingsFrozen;
		},
		cardOptions(): Object
		{
			// The card hangs on the mark it was opened from, and the mark is created anew every time a
			// pilot appears: a pilot stopped and published again leaves the previous node out of the
			// document. `$refs` changes nothing on its own, so the state of the card is what makes the
			// options be collected at every opening instead of once and for the whole session.
			const bindElement = this.isCardShown ? this.$refs.badge : null;

			return {
				bindElement,
				width: CARD_WIDTH,
				autoHide: true,
				closeByEsc: true,
				animation: 'fading',
				offsetTop: 6,
				ariaLabel: this.getMessage('BIZPROCDESIGNER_EDITOR_PILOT_CARD_TITLE'),
				/**
				 * The card is a dialog of its own in `body`, away from the toolbar the mark stands in:
				 * without the focus taken into it its actions are out of reach of the keyboard. The card
				 * is read before it is acted upon, so the focus goes to the card itself and not to the
				 * first of its buttons; where it goes back is the trap's own doing - to the mark the card
				 * was opened from, unless the focus has already left for somewhere else.
				 */
				focusTrap: {
					initialFocus: 'container',
				},
			};
		},
	},
	watch: {
		// The pilot may be stopped from another surface: the card must not outlive its mark.
		isVisible(value: boolean): void
		{
			if (!value)
			{
				this.isCardShown = false;
			}
		},
	},
	created(): void
	{
		// Nothing in the markup depends on the holds, so they are kept off the reactive state.
		this.holdCount = 0;
	},
	methods: {
		handleClick(): void
		{
			this.isCardShown = !this.isCardShown;
		},
		handleCardClose(): void
		{
			this.isCardShown = false;
		},
		/**
		 * An action of the card opens a modal dialog of its own, and the card would hide behind it -
		 * together with the button that shows the operation is still running. It is held until the
		 * action is over, so the answer of the server reaches the publisher where the action was taken.
		 */
		holdCard(): void
		{
			this.holdCount += 1;
			this.$refs.card?.freeze();
		},
		releaseCard(): void
		{
			this.holdCount = Math.max(this.holdCount - 1, 0);

			if (this.holdCount === 0)
			{
				this.$refs.card?.unfreeze();
			}
		},
	},
	template: `
		<button
			v-if="isVisible"
			ref="badge"
			type="button"
			class="bp-pilot-badge"
			data-testid="bizprocdesigner-pilot-badge"
			aria-haspopup="dialog"
			:title="getMessage('BIZPROCDESIGNER_EDITOR_PILOT_BADGE_TITLE')"
			:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_PILOT_BADGE_TITLE')"
			@click="handleClick"
		>
			<BIcon
				:name="outline.THREE_PERSONS"
				:size="24"
				color="var(--ui-color-base-4)"
				aria-hidden="true"
			/>
		</button>
		<Popup
			v-if="isVisible && isCardShown"
			ref="card"
			:options="cardOptions"
			@close="handleCardClose"
		>
			<div
				class="bp-pilot-card"
				data-testid="bizprocdesigner-pilot-card"
			>
				<HeadlineXs>{{ getMessage('BIZPROCDESIGNER_EDITOR_PILOT_CARD_TITLE') }}</HeadlineXs>
				<TextSm>{{ getMessage('BIZPROCDESIGNER_EDITOR_PILOT_CARD_SUBTITLE') }}</TextSm>
				<TextSm
					v-if="authorText"
					data-testid="bizprocdesigner-pilot-card-author"
				>
					{{ authorText }}
				</TextSm>
				<TextSm
					v-if="audienceText"
					data-testid="bizprocdesigner-pilot-card-audience"
				>
					{{ audienceText }}
				</TextSm>
				<TextSm
					v-if="publishedAtText"
					data-testid="bizprocdesigner-pilot-card-published-at"
				>
					{{ publishedAtText }}
				</TextSm>
				<TextSm
					v-if="isSettingsFrozen"
					data-testid="bizprocdesigner-pilot-card-settings-frozen"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_PILOT_CARD_SETTINGS_FROZEN') }}
				</TextSm>
				<div
					v-if="$slots.actions"
					class="bp-pilot-card__actions"
					data-testid="bizprocdesigner-pilot-card-actions"
				>
					<slot name="actions"/>
				</div>
			</div>
		</Popup>
	`,
};

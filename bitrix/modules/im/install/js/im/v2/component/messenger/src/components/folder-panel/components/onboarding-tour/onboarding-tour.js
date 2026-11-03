import { PopupManager, type PopupOptions } from 'main.popup';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { HeadlineMd, Text3Xs, TextSm } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { MessengerPopup } from 'im.v2.component.elements.popup';

import { getFramePointerShift } from '../../functions/tour-geometry';
import { TOUR_STEPS, type TourStep } from './steps';

import './css/onboarding-tour.css';

const POPUP_ID = 'im-folder-panel-onboarding-tour';
const TITLE_ID = `${POPUP_ID}-title`;
const TEXT_ID = `${POPUP_ID}-text`;
const POPUP_DESIGN_CONTEXT = '--ui-context-content-dark';
const POPUP_WIDTH = 440;
const POPUP_BACKGROUND = 'var(--ui-color-accent-soft-element-blue)';
const POPUP_BORDER_RADIUS = '16px';
const POPUP_RAIL_GAP = 12;
const POPUP_ANGLE_OFFSET = 44;
// middle of the arrow inside the left angle of main.popup: 8px from the top of the angle plus half of its 15px
const POPUP_ANGLE_ARROW_MIDDLE = 16;
// without forceTop the core popup flips over a tile standing low on the screen and the pointer leaves the tile
const POPUP_BIND_OPTIONS = Object.freeze({ position: 'bottom', forceTop: true });
const FOREIGN_DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"], .popup-window';

// The tour comes from the queue at a moment the user did not choose, so it leaves the focus in a field being typed in
// and in somebody else's dialog.
const canTakeFocusFrom = (element: ?Element): boolean => {
	if (!element)
	{
		return true;
	}

	const isEditable = element.matches('input, textarea') || element.isContentEditable;

	return !isEditable && element.closest(FOREIGN_DIALOG_SELECTOR) === null;
};

// @vue/component
export const OnboardingTour = {
	name: 'OnboardingTour',
	components: { MessengerPopup, UiButton, BIcon, HeadlineMd, TextSm, Text3Xs },
	props: {
		step: {
			type: Number,
			required: true,
		},
		/** @type HTMLElement */
		bindElement: {
			type: Object,
			required: true,
		},
		/** @type HTMLElement */
		railElement: {
			type: Object,
			required: true,
		},
		/** @type HTMLElement */
		listElement: {
			type: Object,
			required: true,
		},
		/** @type ?HTMLElement */
		frameElement: {
			type: Object,
			default: null,
		},
	},
	emits: ['prev', 'next', 'goto', 'close'],
	computed: {
		POPUP_ID: () => POPUP_ID,
		TITLE_ID: () => TITLE_ID,
		TEXT_ID: () => TEXT_ID,
		OutlineIcons: () => OutlineIcons,
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		currentStep(): TourStep
		{
			return TOUR_STEPS[this.step - 1];
		},
		stepCount(): number
		{
			return TOUR_STEPS.length;
		},
		isFirstStep(): boolean
		{
			return this.step === 1;
		},
		isLastStep(): boolean
		{
			return this.step === this.stepCount;
		},
		stepCounterLabel(): string
		{
			return this.loc('IM_MESSENGER_FOLDER_PANEL_TOUR_COUNTER_ARIA', {
				'#CURRENT#': this.step,
				'#TOTAL#': this.stepCount,
			});
		},
		title(): string
		{
			return this.loc(this.currentStep.titleCode);
		},
		text(): string
		{
			return this.loc(this.currentStep.textCode);
		},
		buttonText(): string
		{
			return this.loc(this.currentStep.buttonCode);
		},
		popupConfig(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				targetContainer: document.body,
				designSystemContext: POPUP_DESIGN_CONTEXT,
				width: POPUP_WIDTH,
				padding: 0,
				background: POPUP_BACKGROUND,
				borderRadius: POPUP_BORDER_RADIUS,
				contentBorderRadius: POPUP_BORDER_RADIUS,
				overlay: false,
				autoHide: false,
				closeByEsc: true,
				// the cross of the core popup carries a hardcoded english label, so the tour draws its own
				closeIcon: false,
				animation: 'fading',
				offsetLeft: this.getOffsetLeft(),
				offsetTop: this.getOffsetTop(),
				bindOptions: POPUP_BIND_OPTIONS,
				angle: { position: 'left', offset: POPUP_ANGLE_OFFSET },
				role: 'dialog',
				ariaLabelledBy: TITLE_ID,
				ariaDescribedBy: TEXT_ID,
			};
		},
	},
	watch: {
		// The popup of the core is built once, out of the options it was handed then, and a config
		// recomputed for the next step never reaches it on its own. The pointer has to follow the folder
		// the step speaks of, so the step moves the live popup itself.
		step()
		{
			this.adjustPosition();
		},
		// A tile that leaves the rail during the step is replaced by another one, measured once the rail is laid out
		bindElement: {
			handler(): void
			{
				this.adjustPosition();
			},
			flush: 'post',
		},
		frameElement(frameElement: ?HTMLElement): void
		{
			if (frameElement)
			{
				this.observeHeight(frameElement);
			}
		},
	},
	mounted()
	{
		this.adjustPosition();
		// The container of the core popup is the node with the dialog role, and it is focusable on its
		// own: the tour is not modal, so the focus is moved there without a trap.
		if (canTakeFocusFrom(document.activeElement))
		{
			PopupManager.getPopupById(POPUP_ID)?.getPopupContainer()?.focus();
		}

		this.listElement.addEventListener('scroll', this.adjustPosition, { passive: true });
		this.observedHeights = new Map();
		this.resizeObserver = new ResizeObserver(this.onResize);
		this.observeHeight(this.listElement);
		if (this.frameElement)
		{
			this.observeHeight(this.frameElement);
		}
	},
	beforeUnmount()
	{
		this.listElement.removeEventListener('scroll', this.adjustPosition);
		this.resizeObserver.disconnect();
	},
	methods: {
		adjustPosition(): void
		{
			const popup = PopupManager.getPopupById(POPUP_ID);
			if (!popup)
			{
				return;
			}

			popup.setBindElement(this.bindElement);
			popup.setOffset({ offsetLeft: this.getOffsetLeft(), offsetTop: this.getOffsetTop() });
			popup.adjustPosition({ ...POPUP_BIND_OPTIONS, forceBindPosition: true });
		},
		observeHeight(element: HTMLElement): void
		{
			if (this.observedHeights.has(element))
			{
				return;
			}

			this.observedHeights.set(element, element.clientHeight);
			this.resizeObserver.observe(element);
		},
		// Only the frame depends on the heights: a slider lays the list out later than the window resize, and a folder
		// added to the rail or hidden from it changes the frame while the list keeps its height.
		onResize(entries: ResizeObserverEntry[]): void
		{
			let hasHeightChanged = false;
			entries.forEach(({ target }) => {
				const height = target.clientHeight;
				hasHeightChanged = hasHeightChanged || height !== this.observedHeights.get(target);
				this.observedHeights.set(target, height);
			});

			if (hasHeightChanged && this.frameElement)
			{
				this.adjustPosition();
			}
		},
		getOffsetLeft(): number
		{
			const railRight = this.railElement.getBoundingClientRect().right;

			return railRight - this.bindElement.getBoundingClientRect().left + POPUP_RAIL_GAP;
		},
		getOffsetTop(): number
		{
			const pointerShift = this.frameElement
				? getFramePointerShift(this.listElement, this.frameElement, this.bindElement)
				: 0;

			return pointerShift - (this.bindElement.offsetHeight / 2) - POPUP_ANGLE_OFFSET - POPUP_ANGLE_ARROW_MIDDLE;
		},
		loc(phraseCode: string, replacements: ?Object = null): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
		stepLabel(number: number): string
		{
			return this.loc('IM_MESSENGER_FOLDER_PANEL_TOUR_STEP_ARIA', { '#NUMBER#': number });
		},
	},
	template: `
		<MessengerPopup :id="POPUP_ID" :config="popupConfig" @close="$emit('close')">
			<div class="bx-im-folder-tour__container" :data-step="step" data-testid="im-folder-tour-popup">
				<!-- first in the container so the tab order matches the visual one -->
				<button
					type="button"
					class="bx-im-folder-tour__close"
					:aria-label="loc('IM_MESSENGER_FOLDER_PANEL_TOUR_CLOSE_ARIA')"
					data-testid="im-folder-tour-close-btn"
					@click="$emit('close')"
				>
					<BIcon :name="OutlineIcons.CROSS_L" />
				</button>
				<div v-if="currentStep.image" class="bx-im-folder-tour__image" :class="currentStep.image"></div>
				<div class="bx-im-folder-tour__content">
					<!-- the step is swapped in place, so the new title and text are announced from here;
					     the footer stays out of the region and is not read again on every step -->
					<div class="bx-im-folder-tour__body" aria-live="polite">
						<HeadlineMd
							:id="TITLE_ID"
							tag="div"
							className="bx-im-folder-tour__title"
							data-testid="im-folder-tour-title"
						>
							{{ title }}
						</HeadlineMd>
						<TextSm
							:id="TEXT_ID"
							tag="div"
							className="bx-im-folder-tour__text"
							data-testid="im-folder-tour-text"
						>{{ text }}</TextSm>
					</div>
					<div class="bx-im-folder-tour__footer">
						<div class="bx-im-folder-tour__pagination">
							<button
								type="button"
								class="bx-im-folder-tour__arrow"
								:disabled="isFirstStep"
								:aria-label="loc('IM_MESSENGER_FOLDER_PANEL_TOUR_PREV_ARIA')"
								data-testid="im-folder-tour-prev-btn"
								@click="$emit('prev')"
							>
								<BIcon :name="OutlineIcons.CHEVRON_LEFT_L" />
							</button>
							<!-- the dots are step controls of their own now, so the group is named and they stay
							     in the accessibility tree instead of being hidden behind one label -->
							<div
								class="bx-im-folder-tour__steps"
								role="group"
								:aria-label="stepCounterLabel"
								data-testid="im-folder-tour-counter"
							>
								<button
									v-for="number in stepCount"
									:key="number"
									type="button"
									class="bx-im-folder-tour__step"
									:class="{ '--current': number === step }"
									:aria-label="stepLabel(number)"
									:aria-current="number === step ? 'step' : null"
									:data-testid="'im-folder-tour-step-' + number + '-btn'"
									@click="$emit('goto', number)"
								>
									<Text3Xs v-if="number === step" className="bx-im-folder-tour__step-number">{{ number }}</Text3Xs>
								</button>
							</div>
							<button
								type="button"
								class="bx-im-folder-tour__arrow"
								:disabled="isLastStep"
								:aria-label="loc('IM_MESSENGER_FOLDER_PANEL_TOUR_NEXT_ARIA')"
								data-testid="im-folder-tour-next-btn"
								@click="$emit('next')"
							>
								<BIcon :name="OutlineIcons.CHEVRON_RIGHT_L" />
							</button>
						</div>
						<UiButton
							:size="ButtonSize.MEDIUM"
							:style="AirButtonStyle.FILLED"
							:text="buttonText"
							:dataset="{ testid: 'im-folder-tour-action-btn' }"
							class="bx-im-folder-tour__action"
							@click="$emit('next')"
						/>
					</div>
				</div>
			</div>
		</MessengerPopup>
	`,
};

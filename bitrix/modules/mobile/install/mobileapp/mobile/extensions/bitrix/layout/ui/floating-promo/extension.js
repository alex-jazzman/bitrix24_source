/**
 * @module layout/ui/floating-promo
 */
jn.define('layout/ui/floating-promo', (require, exports, module) => {
	const { Animated } = require('animation/animated');
	const { Feature } = require('feature');
	const { Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');

	// durations are in seconds here, unlike ref.animate()
	const DURATION = 0.3;
	// the card fades faster than it collapses, and the collapsed state picks up right at that moment
	const FADE_DURATION = 0.25;
	const EASING = 'easeInOutQuad';

	// the collapsed state starts this small and grows into its own size
	const GROW_FROM = 0.4;
	// it picks up while the card is still fading, not after
	const BUTTON_DELAY = 0.08;
	// and overshoots its own size before settling back
	const BUTTON_OVERSHOOT = 8;
	const BUTTON_SETTLE_DURATION = 0.12;
	// Half of the overshoot, in two roles that have to stay one number: the anchor is grown by the
	// overshoot and inset by this much, so the centre of the collapsed state stays put, and the layer
	// keeps this much under the collapsed state, so the peak of the growth stays inside the frame it is
	// clipped to.
	const GAP_MIN = BUTTON_OVERSHOOT / 2;

	// The chain of phases hangs on native callbacks, and closing frames do get lost on Android
	// (see #renderCollapsed), so the transition is closed by the clock as well: a callback lost in
	// the growth or the settling would leave the card on the stage for good. A transition closed that
	// way brings the collapsed state to its own size itself, see #snapCollapsedToItsSize.
	const TRANSITION_DURATION = BUTTON_DELAY + DURATION + BUTTON_SETTLE_DURATION;
	// room for a starved main thread, so the watchdog never cuts a transition that is still running
	const WATCHDOG_SLACK = 0.5;

	const PADDING_HORIZONTAL = Indent.XL3.toNumber();
	const PADDING_BOTTOM = Indent.M.toNumber();
	// Air over the card, so the content of the consumer does not end right against it. Part of the frame
	// of the layer, hence of the reserve: the consumers give up their own bottom padding under the layer.
	// Doubles as the room the peak of the growth reaches above the collapsed state, so it is never below
	// GAP_MIN.
	const PADDING_TOP = Indent.M.toNumber();

	const IS_IOS = Application.getPlatform() === 'ios';
	const SAFE_AREA_HEIGHT = 18;

	/**
	 * @param {boolean} [safeArea]
	 * @returns {boolean}
	 */
	const isSafeAreaRequested = (safeArea) => safeArea !== false;

	/**
	 * @returns {boolean}
	 */
	const isBottomBandNative = () => IS_IOS || Feature.isSafeAreaSupportedOnAndroid();

	/**
	 * The global of the device, or nothing where there is none. A consumer states its reserve as the
	 * extension loads (see the banners), and that happens in the TestApp of the story showcases too, where
	 * the globals of the app are not all there: `env` was missing there already, and a bare read of one
	 * throws on the very first frame rather than degrading.
	 * @returns {object|null}
	 */
	const getDevice = () => (typeof device === 'undefined' ? null : device);

	/**
	 * The bottom band of the screen, as the native side reports it. Padded by the layer itself rather than
	 * asked for with the `safeArea` prop: the prop lays the band INSIDE the box the layer states - the
	 * frame stays as stated and the band is taken off the room its children get - while an absolutely
	 * positioned child is placed against the border box and never sees it at all. Measured on iOS: of a
	 * stated frame of 90 the card was left 52 and the collapsed state sat inside the band. Taken as a
	 * number, the band takes part in the geometry the layer works out instead of being cut out of it
	 * afterwards.
	 * @param {boolean} [safeArea]
	 * @returns {number}
	 */
	const getFloatingPromoBottomBand = (safeArea) => (isSafeAreaRequested(safeArea) && isBottomBandNative()
		? getDevice()?.screen?.safeArea?.bottom ?? 0
		: 0);

	/**
	 * Android below the supported api version has no bottom band of its own: nobody insets the content of
	 * the screen and nobody pads the band, so the layer pays for it inside its frame - and inside the
	 * reserve with it.
	 * @param {boolean} [safeArea]
	 * @returns {number}
	 */
	const getOwnBand = (safeArea) => (
		isSafeAreaRequested(safeArea) && !isBottomBandNative() && getDevice()?.isGestureNavigation
			? SAFE_AREA_HEIGHT
			: 0
	);

	/**
	 * The room the layer keeps right under the collapsed state, above the bottom band: its own padding
	 * where the band was not asked for, since whoever lies under the layer pays for it there, and the
	 * floor under the peak of the growth where it was. Never below the half of the overshoot the peak
	 * reaches into: a zero gap has Android clip that peak away.
	 * @param {boolean} [safeArea]
	 * @returns {number}
	 */
	const getGap = (safeArea) => Math.max(
		GAP_MIN,
		isSafeAreaRequested(safeArea) ? GAP_MIN : PADDING_BOTTOM,
	);

	/**
	 * Everything the layer keeps under the collapsed state: the gap above the bottom band and the band
	 * itself. The two sources of the band exclude one another by construction - the native side either
	 * reports it or ignores it altogether - and adding them up is the very defect this rule replaces.
	 * @param {boolean} [safeArea]
	 * @returns {number}
	 */
	const getPaddingBottom = (safeArea) => getGap(safeArea) + getOwnBand(safeArea) + getFloatingPromoBottomBand(safeArea);

	/**
	 * The part of the bottom band the consumer is inset by on its own, and the only part of the frame of
	 * the layer that is no room of the content. iOS insets the content of the screen by the band itself,
	 * so a reserve carrying it would hold it twice - the content would stop that much short of the layer.
	 * Android draws to the very edge of the screen and insets nothing: there the band is room the content
	 * runs under unless the reserve pays for it. Measured on a device (1080x2460, 440 dpi, 16 of band): of
	 * the 114 the layer took the list held 98, and the missing 16 were exactly the band.
	 * @param {boolean} [safeArea]
	 * @returns {number}
	 */
	const getBandInsetByNative = (safeArea) => (IS_IOS ? getFloatingPromoBottomBand(safeArea) : 0);

	/**
	 * The room the layer takes of the content, before the transition and after it - stated rather than
	 * measured, so a consumer holds it from its very first frame. Of the bottom band it carries whatever
	 * the consumer is NOT inset by: what the layer pads itself, and, on a platform that draws to the edge
	 * of the screen, the band the native side reports as well.
	 * @param {FloatingPromoReserveParams} params
	 * @returns {FloatingPromoReserve}
	 */
	const getFloatingPromoReserve = ({ expandedHeight, collapsedHeight, safeArea }) => {
		const room = PADDING_TOP
			+ getGap(safeArea)
			+ getOwnBand(safeArea)
			+ getFloatingPromoBottomBand(safeArea)
			- getBandInsetByNative(safeArea);

		if (collapsedHeight === undefined)
		{
			// A promo that never collapses holds the room of its card for the life of the layer, so both
			// numbers of the reserve are that room: whichever of them a consumer holds, it holds the right
			// one.
			const permanent = room + expandedHeight;

			return { expanded: permanent, collapsed: permanent };
		}

		return {
			// the taller of the two states, so that collapsing never grows the frame of the layer
			expanded: room + Math.max(expandedHeight, collapsedHeight + GAP_MIN),
			collapsed: room + collapsedHeight,
		};
	};

	/**
	 * The frame of the layer: the room it takes of the content plus the band the consumer is already inset
	 * by. Stated as a function of the same numbers, so that the frame and the reserve can never part ways -
	 * they were counted two different ways once, and the whole defect grew out of it.
	 * @param {FloatingPromoReserveParams} params
	 * @returns {FloatingPromoReserve}
	 */
	const getFloatingPromoFrame = ({ expandedHeight, collapsedHeight, safeArea }) => {
		const reserve = getFloatingPromoReserve({ expandedHeight, collapsedHeight, safeArea });
		const band = getBandInsetByNative(safeArea);

		return {
			expanded: reserve.expanded + band,
			collapsed: reserve.collapsed + band,
		};
	};

	/**
	 * @extends {PureComponent<FloatingPromoProps, FloatingPromoState>}
	 */
	class FloatingPromoComponent extends PureComponent
	{
		/**
		 * @param {FloatingPromoProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				expandedMounted: true,
				expandedVisible: true,
			};

			this.hasCollapsed = false;
			this.isAnimating = false;
			this.isUnmounted = false;
			this.timers = new Set();
			this.runningPhases = new Set();

			// Animated values go straight into the style: the runtime recalculates the layout every frame,
			// so the frame really shrinks instead of being moved. Each value is created exactly once,
			// since a value rebuilt on a re-render loses the animation that drives it.
			this.expandedOpacity = Animated.newCalculatedValue(1);
			// The values below are the whole transition, and a promo that never collapses has none: it
			// names no size for them to start from either.
			this.collapsedWidthValue = this.#isExpandedOnly()
				? null
				: Animated.newCalculatedValue(Math.round(props.collapsedWidth * GROW_FROM));
			this.collapsedHeightValue = this.#isExpandedOnly()
				? null
				: Animated.newCalculatedValue(Math.round(props.collapsedHeight * GROW_FROM));
			this.collapsedOpacity = this.#isExpandedOnly() ? null : Animated.newCalculatedValue(0);

			this.getTestId = createTestIdGenerator({ context: this });
			this.slotParams = this.#isExpandedOnly() ? {} : { collapse: () => this.collapse() };
		}

		/**
		 * The layer leaves the screen as soon as it has nothing to show, and that can happen in the
		 * middle of the transition, so both drivers of the transition are shut down here.
		 */
		componentWillUnmount()
		{
			this.isUnmounted = true;
			this.#clearTimers();
			this.#stopPhases();
		}

		render()
		{
			const { safeArea, style } = this.props;

			return View(
				{
					testId: this.getTestId(),
					style: {
						position: 'absolute',
						right: 0,
						bottom: 0,
						alignItems: 'flex-end',
						height: this.#getBoxHeight(),
						paddingRight: PADDING_HORIZONTAL,
						paddingTop: PADDING_TOP,
						paddingBottom: getPaddingBottom(safeArea),
						...this.#getHorizontalSpan(),
						...style,
					},
				},
				// The collapsed state goes first on purpose: Android hit-tests children topmost-first and
				// ignores alpha, so as the last child the transparent state would take taps aimed at the
				// expanded one. UIKit drops views with alpha <= 0.01 on its own.
				this.#renderCollapsed(),
				this.#renderExpanded(),
			);
		}

		/**
		 * A promo whose consumer named no collapsed state: the card holds the stage for the life of the
		 * layer, and neither the transition nor the geometry of the collapsed state is ever reached.
		 * @returns {boolean}
		 */
		#isExpandedOnly()
		{
			return Boolean(this.props.expandedOnly);
		}

		/**
		 * The layer is the only box its children are clipped to - by default on Android, never on iOS -
		 * and its height is stated, not measured, so the card is stretched into it and the collapsed state
		 * is anchored to its edges.
		 *
		 * The frame carries the whole bottom band of the screen; the reserve carries only the part the
		 * consumer is not inset by, so the two are one number apart (see getFloatingPromoFrame).
		 * @returns {number}
		 */
		#getBoxHeight()
		{
			const { expandedHeight, collapsedHeight, safeArea } = this.props;
			const frame = getFloatingPromoFrame({ expandedHeight, collapsedHeight, safeArea });

			return this.state.expandedMounted ? frame.expanded : frame.collapsed;
		}

		/**
		 * @returns {{ width: number, height: number }}
		 */
		#getCollapsedSize()
		{
			const { collapsedWidth, collapsedHeight } = this.props;

			return { width: collapsedWidth, height: collapsedHeight };
		}

		#renderExpanded()
		{
			if (!this.state.expandedMounted)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('expanded-slot'),
					// Touch sink, and only while the card is visible: Android falls through to the next
					// child when the upper one declines the touch, and the collapsed state lies right
					// under this corner. Once the card has faded its frame sits exactly over the collapsed
					// state, so a sink kept any longer would swallow taps on the only CTA of the banner.
					clickable: this.state.expandedVisible,
					style: {
						opacity: this.expandedOpacity,
						flex: 1,
						alignSelf: 'stretch',
					},
				},
				this.#renderSlot(this.props.expanded),
			);
		}

		/**
		 * The collapsed state grows out of its own centre, so it is centred in an anchor of its peak size.
		 * Without the extra room the state hits the anchor bounds at the peak of the overshoot and loses its
		 * corner radius; the anchor is inset by half of that room so that the edges of the settled state
		 * still meet the edges of the card. The anchor is placed against the border box of the layer -
		 * absolute children ignore the padding of their parent, the bottom band of the screen among it -
		 * so the whole bottom padding of the layer is part of its offsets, and the gap above the band is
		 * what keeps the peak inside the layer.
		 *
		 * Neither the tree nor the set of style keys changes with the state, and that is deliberate: the end
		 * of the transition is a handover of numbers, and a node that also changes its place in the tree or
		 * drops a style key it had gets a frame of the runtime deciding what to do with it. That frame is a
		 * single flicker of the collapsed state right after it has grown.
		 * @returns {object}
		 */
		#renderCollapsed()
		{
			if (this.#isExpandedOnly())
			{
				return null;
			}

			const { collapsed, safeArea } = this.props;
			const collapsedSize = this.#getCollapsedSize();
			const settled = !this.state.expandedMounted;

			const slot = View(
				{
					testId: this.getTestId('collapsed-slot'),
					// The settled frame is stated as plain numbers, and that is the whole point: an animated
					// value reaches the layout as the last frame its driver managed to compute, and a frame
					// dropped at the very end is never recomputed, so the state simply keeps the size it had
					// then. Measured on Android under load: 79 and 81 units instead of 78, and 67 on the run
					// where the closing frames of the growth were lost too.
					style: settled
						? { ...collapsedSize, opacity: 1 }
						: {
							width: this.collapsedWidthValue,
							height: this.collapsedHeightValue,
							opacity: this.collapsedOpacity,
						},
				},
				this.#renderSlot(collapsed),
			);

			return View(
				{
					style: {
						position: 'absolute',
						right: PADDING_HORIZONTAL - GAP_MIN,
						bottom: getPaddingBottom(safeArea) - GAP_MIN,
						width: collapsedSize.width + BUTTON_OVERSHOOT,
						height: collapsedSize.height + BUTTON_OVERSHOOT,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				slot,
			);
		}

		/**
		 * @param {FloatingPromoSlot} [slot]
		 * @returns {object|null}
		 */
		#renderSlot(slot)
		{
			return typeof slot === 'function' ? slot(this.slotParams) : null;
		}

		/**
		 * How far the layer reaches across the screen, and with it the band that takes the touches: iOS
		 * answers a touch with the topmost view whose frame holds the point, whether that view draws
		 * anything there or not, and walks the responder chain up from it rather than on to the views
		 * behind. So everything the layer spans and does not show is a strip of dead taps over the content
		 * below. Android hands the touch back to the siblings under a container that takes none, which is
		 * why only iOS ever saw it.
		 *
		 * The frame is narrowed rather than the touches declined: what `clickable` and `interactable` mean
		 * for a whole subtree is nowhere stated in the code for iOS, and on Android the prop comes down to
		 * `view.isClickable`, which does not keep the children from taking a touch of their own. Geometry
		 * does not rest on that unknown.
		 *
		 * Across the whole screen the layer reaches while the card is on the stage, since the card is
		 * stretched to it. Once the card is gone the layer holds the collapsed state and the gap it keeps
		 * from the edge of the screen, and nothing else: `width` beside the `right` of the layer holds
		 * through a rotation on its own, while a `left` counted from the screen would have to be counted
		 * again at every turn.
		 * @returns {object}
		 */
		#getHorizontalSpan()
		{
			const { collapsedWidth } = this.props;

			if (this.state.expandedMounted)
			{
				return { left: 0, paddingLeft: PADDING_HORIZONTAL };
			}

			return { width: PADDING_HORIZONTAL + collapsedWidth, paddingLeft: 0 };
		}

		/**
		 * The trigger the slots hold outlives the layer: the card of the invite banner collapses on the
		 * answer of a lazy import, and the screen can be closed while that answer is on its way. Started
		 * then, the transition would raise timers and phases the unmount has just shut down.
		 *
		 * The signal goes out from here and only from here, so the consumer hears of a transition that has
		 * really begun: a trigger pulled twice, or after the transition, is dropped by the very same guards
		 * that keep the phases from starting twice.
		 */
		collapse()
		{
			if (this.#isExpandedOnly() || this.isUnmounted || this.hasCollapsed || this.isAnimating)
			{
				return;
			}

			this.isAnimating = true;
			this.#schedule(() => this.#finishTransition(), TRANSITION_DURATION + WATCHDOG_SLACK);
			this.props.onCollapseStarted?.({ duration: Math.round(TRANSITION_DURATION * 1000) });
			this.#dismissCard();
		}

		/**
		 * Opening phase: the card fades out, and nothing else of it moves. Every frame of a changing size
		 * lays the whole subtree of the card out anew - its text among it, and the ellipsis of a brand of
		 * any length among the text - and the runtime has neither a transform nor a native driver to do it
		 * any cheaper. The frame the card keeps costs nothing: the layer states its own height either way.
		 */
		#dismissCard()
		{
			this.#play([this.#timing(this.expandedOpacity, 0, FADE_DURATION)]);

			// the collapsed state does not wait for the card to disappear: it picks up mid-fade
			this.#schedule(() => this.#growCollapsed(), BUTTON_DELAY);
			// The faded card stays on the stage - the height of the layer and its span follow that very
			// state, and both hand over only once the collapsed state has settled - but it stops taking
			// taps. Driven by the clock rather than by the callback of the fade: the release of the taps
			// must not depend on the same runtime whose lost callbacks it guards against.
			this.#schedule(() => this.setState({ expandedVisible: false }), FADE_DURATION);
		}

		/**
		 * The collapsed state grows out of the same corner, overshooting its own size.
		 */
		#growCollapsed()
		{
			const collapsedSize = this.#getCollapsedSize();

			this.#play(
				[
					this.#timing(this.collapsedWidthValue, collapsedSize.width + BUTTON_OVERSHOOT, DURATION),
					this.#timing(this.collapsedHeightValue, collapsedSize.height + BUTTON_OVERSHOOT, DURATION),
					this.#timing(this.collapsedOpacity, 1, DURATION),
				],
				() => this.#settleCollapsed(),
			);
		}

		#settleCollapsed()
		{
			const collapsedSize = this.#getCollapsedSize();

			this.#play(
				[
					this.#timing(this.collapsedWidthValue, collapsedSize.width, BUTTON_SETTLE_DURATION),
					this.#timing(this.collapsedHeightValue, collapsedSize.height, BUTTON_SETTLE_DURATION),
				],
				() => this.#finishTransition(),
			);
		}

		/**
		 * The card leaves the stage only now: until the collapsed state has settled the card holds the
		 * frame of the layer, so the collapsed state has nothing to jump over. Reached either by the
		 * last phase or by the watchdog, hence the guard - and the watchdog is why the transition is not
		 * merely declared over here: whatever of it is still on the stage is shut down and brought to its
		 * final geometry, otherwise the collapsed state would keep the frame of a passing phase.
		 */
		#finishTransition()
		{
			if (this.hasCollapsed)
			{
				return;
			}

			// set before setState: the re-render must keep the collapsed state visible
			this.hasCollapsed = true;
			this.isAnimating = false;
			this.#clearTimers();
			this.#stopPhases();
			this.#snapCollapsedToItsSize();

			this.setState({ expandedMounted: false });
		}

		/**
		 * Puts the values of the collapsed state where its phases would have left them: nothing to do for a
		 * chain that played to its end, and the whole geometry of the collapsed state for one the watchdog
		 * had to close.
		 *
		 * A phase whose completion is still on its way when the watchdog fires starts no next one, so the
		 * growth leaves the state on its overshoot - measured on Android as 66 units against the 58 of the
		 * collapsed button, and 86 against the 78 of the subscription one. The plain numbers of the settled
		 * frame do not undo that: a value a phase has already bound to the view outlives them there.
		 */
		#snapCollapsedToItsSize()
		{
			const collapsedSize = this.#getCollapsedSize();

			this.collapsedWidthValue.setValue(collapsedSize.width);
			this.collapsedHeightValue.setValue(collapsedSize.height);
			this.collapsedOpacity.setValue(1);
		}

		/**
		 * Shuts down the phases that are still running: one left alone would go on writing the frames of a
		 * transition that is already over.
		 */
		#stopPhases()
		{
			this.runningPhases.forEach((phase) => phase.stop());
			this.runningPhases.clear();
		}

		/**
		 * @param {CalculatedValue} value
		 * @param {number} toValue
		 * @param {number} duration
		 * @returns {JNCalculatedAnimation}
		 */
		#timing(value, toValue, duration)
		{
			return Animated.timing(value, { toValue, duration, type: EASING });
		}

		/**
		 * Plays a phase: every animation of it runs at once and the phase reports when the last of them
		 * is done. `stagger` with a zero delay is NOT an alternative: on Android it divides the elapsed
		 * time by the delay to pick the next animation and throws right there.
		 * A phase that reports after the transition is over - a late callback of a phase the watchdog
		 * has already outrun - starts nothing and touches no state.
		 * @param {Array<JNCalculatedAnimation>} animations
		 * @param {function(): void} [onFinish]
		 */
		#play(animations, onFinish = () => {})
		{
			// A runtime old enough to have no group primitive plays the very same animations, just each on
			// its own; the phase is then over once every one of them has reported - not once the first has,
			// so which of them runs the longest is none of this method's business.
			const drivers = Animated.isParallelSupported() ? [Animated.parallel(animations)] : animations;
			let pending = drivers.length;

			drivers.forEach((driver) => {
				this.runningPhases.add(driver);
				driver.start(() => {
					this.runningPhases.delete(driver);
					pending -= 1;

					if (pending > 0 || this.isUnmounted || this.hasCollapsed)
					{
						return;
					}

					onFinish();
				});
			});
		}

		/**
		 * Every timer of the transition goes through here, so unmounting the layer cancels all of them.
		 * @param {function(): void} action
		 * @param {number} delay in seconds, like the durations above
		 */
		#schedule(action, delay)
		{
			const timer = setTimeout(() => {
				this.timers.delete(timer);
				action();
			}, delay * 1000);

			this.timers.add(timer);
		}

		#clearTimers()
		{
			this.timers.forEach((timer) => clearTimeout(timer));
			this.timers.clear();
		}
	}

	/**
	 * @param {function} validator
	 * @returns {function(object, string, string): ?Error}
	 */
	function requiredForCollapsible(validator)
	{
		return (props, propName, componentName) => {
			if (props.expandedOnly)
			{
				return null;
			}

			if (props[propName] === undefined || props[propName] === null)
			{
				return new Error(
					`The prop \`${propName}\` is required in \`${componentName}\` unless \`expandedOnly\` is set.`,
				);
			}

			return validator(props, propName, componentName) ?? null;
		};
	}

	FloatingPromoComponent.defaultProps = {
		expandedOnly: false,
		safeArea: true,
	};

	FloatingPromoComponent.propTypes = {
		testId: PropTypes.string.isRequired,
		expandedOnly: PropTypes.bool,
		expanded: PropTypes.func.isRequired,
		expandedHeight: PropTypes.number.isRequired,
		// Required unless the promo has no collapsed state at all: the modes are told apart in types, and
		// types are gone by the time the layer is built, so a consumer that forgets the collapsed state
		// would otherwise learn about it from a crash in the constructor instead of a warning.
		collapsed: requiredForCollapsible(PropTypes.func),
		collapsedHeight: requiredForCollapsible(PropTypes.number),
		collapsedWidth: requiredForCollapsible(PropTypes.number),
		onCollapseStarted: PropTypes.func,
		safeArea: PropTypes.bool,
		style: PropTypes.object,
	};

	module.exports = {
		/**
		 * @param {FloatingPromoProps} props
		 * @returns {FloatingPromoComponent}
		 */
		FloatingPromo: (props) => new FloatingPromoComponent(props),
		getFloatingPromoReserve,
		getFloatingPromoFrame,
	};
});

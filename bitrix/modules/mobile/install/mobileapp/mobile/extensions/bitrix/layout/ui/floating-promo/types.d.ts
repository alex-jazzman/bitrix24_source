type FloatingPromoSlotParams = {
	collapse: () => void;
};

type FloatingPromoSlot = (params: FloatingPromoSlotParams) => object;

type FloatingPromoReserveParams = {
	expandedHeight: number;
	/** Left out by a promo that never collapses: there is no second state to keep room for. */
	collapsedHeight?: number;
	safeArea?: boolean;
};

/**
 * The room the layer takes of the content, before the transition and after it. Of the bottom band of the
 * screen it carries whatever the content is NOT inset by, so the frame of the layer is this number plus
 * the part the native side has inset the content by itself.
 */
type FloatingPromoReserve = {
	expanded: number;
	collapsed: number;
};

type FloatingPromoBaseProps = {
	testId: string;
	/**
	 * Height of the card of the consumer - of whatever the `expanded` slot draws. Neither this number nor
	 * the height of the collapsed state below states the frame of the layer: the consumer names its own
	 * elements, and the layer works its own frame, its gaps and both reserves out of them.
	 */
	expandedHeight: number;
	/**
	 * `false` states that the bottom band of the screen is paid for by whoever lies under the layer - the
	 * tab panel of the screen, say - and the layer keeps its own padding under the collapsed state
	 * instead. Otherwise the layer pads that band itself, out of the height the native side reports.
	 */
	safeArea?: boolean;
	/**
	 * The vertical paddings of the layer are part of the room it takes, so overriding them here would
	 * state a reserve the layer does not match. How far the layer reaches across the screen is what keeps
	 * its taps off the content beside the collapsed state, so overriding that hands them back to the layer.
	 */
	style?: Partial<ElementStyle>;
};

type FloatingPromoCollapsibleProps = FloatingPromoBaseProps & {
	expandedOnly?: false;
	expanded: FloatingPromoSlot;
	collapsed: FloatingPromoSlot;
	/** Height of the button of the consumer - of whatever the `collapsed` slot draws. */
	collapsedHeight: number;
	/**
	 * Width of the button: the collapsed state is centred on it, and once the card is off the stage it is
	 * the width of the layer itself. So the layout of the collapsed state has to fit into this number:
	 * whatever it draws wider than that falls outside the frame of the layer, and iOS hands no taps at all
	 * to a view outside its parent, while Android clips it away.
	 */
	collapsedWidth: number;
	/** The transition has really begun; `duration` is how long it takes, in milliseconds. */
	onCollapseStarted?: (params: { duration: number }) => void;
};

/**
 * A promo with no collapsed state at all: the card holds the stage for the life of the layer, so the
 * layer keeps one frame and one reserve, and nothing of it ever moves.
 */
type FloatingPromoExpandedOnlyProps = FloatingPromoBaseProps & {
	expandedOnly: true;
	expanded: (params: Record<string, never>) => object;
	collapsed?: never;
	collapsedHeight?: never;
	collapsedWidth?: never;
	onCollapseStarted?: never;
};

type FloatingPromoProps = FloatingPromoCollapsibleProps | FloatingPromoExpandedOnlyProps;

type FloatingPromoState = {
	/**
	 * The card is on the stage: the layer holds the frame of the expanded state, and it reaches across the
	 * whole screen while the card is there.
	 */
	expandedMounted: boolean;
	/** The card is still visible, so it owns the taps over its own frame. */
	expandedVisible: boolean;
};

declare function FloatingPromo(props: FloatingPromoProps): LayoutComponent<FloatingPromoProps, FloatingPromoState>;

declare function getFloatingPromoReserve(params: FloatingPromoReserveParams): FloatingPromoReserve;

/**
 * The frame of the layer - the reserve plus the part of the bottom band the consumer is inset by on its
 * own. Of interest to whoever checks the geometry of the layer against what it states; a consumer needs
 * the reserve alone.
 */
declare function getFloatingPromoFrame(params: FloatingPromoReserveParams): FloatingPromoReserve;

export {
	FloatingPromo,
	FloatingPromoProps,
	FloatingPromoReserve,
	FloatingPromoReserveParams,
	FloatingPromoSlot,
	FloatingPromoSlotParams,
	FloatingPromoState,
	getFloatingPromoFrame,
	getFloatingPromoReserve,
};

/* eslint-disable */
type WhatsNewOptions = {
	size?: BX.UI.System.WhatsNew.WhatsNewSize;
	mediaPosition?: BX.UI.System.WhatsNew.WhatsNewMediaPosition;
	actionsAlign?: BX.UI.System.WhatsNew.WhatsNewActionsAlign;
	stepCount?: number;
	currentStep?: number;
	label?: string;
	title?: string;
	titleBrand?: string;
	subtitle?: string;
	items?: WhatsNewItem[];
	scene?: WhatsNewScene | null;
	video?: WhatsNewVideo | null;
	gallery?: WhatsNewGallerySlide[];
	galleryNav?: BX.UI.System.WhatsNew.WhatsNewGalleryNav;
	currentSlide?: number;
	parallax?: boolean;
	backdrop?: BX.UI.System.WhatsNew.WhatsNewBackdrop;
	backdropColor?: BX.UI.System.WhatsNew.WhatsNewColor;
	actions?: BX.UI.Button[];
	hasOverlay?: boolean;
	disableScrolling?: boolean;
	closeByEsc?: boolean;
	closeByClickOutside?: boolean;
	hasCloseButton?: boolean;
	events?: WhatsNewEvents;
};

type WhatsNewSize = typeof BX.UI.System.WhatsNew.WhatsNewSize[keyof typeof BX.UI.System.WhatsNew.WhatsNewSize];

type WhatsNewMediaPosition = typeof BX.UI.System.WhatsNew.WhatsNewMediaPosition[keyof typeof BX.UI.System.WhatsNew.WhatsNewMediaPosition];

type WhatsNewActionsAlign = typeof BX.UI.System.WhatsNew.WhatsNewActionsAlign[keyof typeof BX.UI.System.WhatsNew.WhatsNewActionsAlign];

type WhatsNewItem = {
	icon: string;
	title: string;
	description?: string;
	accent?: boolean;
	testId?: string;
	onClick?: () => void;
};

type WhatsNewScene = WhatsNewSceneLayer[] | WhatsNewSceneLayers;

type WhatsNewSceneLayer = {
	src: string;
	left?: number;
	top?: number;
	width?: number;
	depth?: number;
	shift?: number;
	tilt?: number;
	period?: number;
	delay?: number;
	spark?: boolean;
};

type WhatsNewSceneLayers = {
	layers: WhatsNewSceneLayer[];
	aspect?: number;
};

type WhatsNewVideo = {
	src: string;
	poster?: string;
};

type WhatsNewGallerySlide = HTMLElement | {
	src: string;
} | {
	scene: WhatsNewScene;
};

type WhatsNewGalleryNav = typeof BX.UI.System.WhatsNew.WhatsNewGalleryNav[keyof typeof BX.UI.System.WhatsNew.WhatsNewGalleryNav];

type WhatsNewBackdrop = typeof BX.UI.System.WhatsNew.WhatsNewBackdrop[keyof typeof BX.UI.System.WhatsNew.WhatsNewBackdrop];

type WhatsNewColor = typeof BX.UI.System.WhatsNew.WhatsNewColor[keyof typeof BX.UI.System.WhatsNew.WhatsNewColor];

type WhatsNewEvents = {
	[eventName: string]: (event: BX.Event.BaseEvent) => void;
};

type WhatsNewBackdropOrigin = {
	x: number;
	y: number;
};

declare namespace BX.UI.System.WhatsNew {
	class WhatsNew extends BX.Event.EventEmitter {
		constructor(options?: WhatsNewOptions);
		show(): void;
		hide(): void;
		destroy(): void;
		getPopup(): BX.Main.Popup | null;
		setCurrentStep(currentStep: number): void;
		/**
		 * Puts the gallery on another slide, counted from zero. A slide past either end of the list comes back on
		 * the other side of it: the carousel is a ring.
		 *
		 * The move is a move of the mark and of the shown slide and nothing else: rebuilding the content for it
		 * would drop the focus off the control the user has just pressed.
		 */
		setCurrentSlide(currentSlide: number | null): void;
		/**
		 * Puts the card on another colour scheme of the palette. The change is a reveal: the new scheme grows
		 * over the card by a circle from `origin`, a point in shares of the card, the bottom centre by default.
		 *
		 * A scheme the card already shows, a value outside the dictionary and a call made while a reveal runs
		 * change nothing and report nothing - the lock of the reveal is what keeps a hail of calls from stacking
		 * layer over layer.
		 */
		setBackdropColor(color: WhatsNewColor, origin?: WhatsNewBackdropOrigin): void;
		setItems(items: WhatsNewItem[]): void;
		setActions(actions: BX.UI.Button[]): void;
		setClosable(closable: boolean): void;
		isClosable(): boolean;
	}

	const WhatsNewSize: Readonly<{
		Lg: "l";
		Md: "m";
	}>;

	const WhatsNewMediaPosition: Readonly<{
		Top: "top";
		Left: "left";
		Right: "right";
	}>;

	const WhatsNewActionsAlign: Readonly<{
		Right: "right";
		Left: "left";
		Center: "center";
	}>;

	const WhatsNewGalleryNav: Readonly<{
		Sides: "sides";
		Bottom: "bottom";
		OverBleed: "over-bleed";
	}>;

	const WhatsNewBackdrop: Readonly<{
		None: "none";
		Water: "water";
		Bubble: "bubble";
		Balloons: "balloons";
		Sparkle: "sparkle";
	}>;

	const WhatsNewColor: Readonly<{
		DarkBlue: "dark-blue";
		Pink: "pink";
		Violet: "violet";
		Magenta: "magenta";
		Sapphire: "sapphire";
		BitrixGpt: "bitrix-gpt";
		Gradient: "gradient";
	}>;
}

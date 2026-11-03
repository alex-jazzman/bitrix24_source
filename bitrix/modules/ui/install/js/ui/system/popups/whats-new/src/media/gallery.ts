import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.buttons';
// The glyphs of the icons of the buttons live in a stylesheet of their own, and the button brings none of
// them: an arrow without it is a button with an empty face.
import 'ui.buttons.icons';

import { WhatsNewGalleryNav } from '../const';
import { Scene, SceneVariant } from '../scene/scene';
import { type WhatsNewGallerySlide, type WhatsNewScene } from '../types';

import './media.css';

const BLOCK_CLASS = 'ui-system-whats-new-gallery';

const ACTIVE_CLASS = '--active';

// The arrows stand on the coloured surface of the card, the way the row of buttons does, so they take the
// palette of a dark edge from the design system - the very palette the secondary button of the row is drawn
// in - instead of a fill of their own.
const EDGE_CONTEXT = '--ui-context-edge-dark';

// The two ways round the ring of slides.
const PREVIOUS = -1;
const NEXT = 1;

type GalleryOptions = {
	slides: WhatsNewGallerySlide[];
	nav?: WhatsNewGalleryNav;
	/*
	 * Whether the stage of the slides flies out onto a layer of its own. The zone then keeps the arrows and
	 * the dots alone: the layer takes no pointer, and controls placed on it would never be pressed.
	 */
	bleed?: boolean;
	/*
	 * The slide the gallery stands on, counted from zero. A number turns the controlled mode on: the gallery
	 * reports the slide the user asked for and moves nothing itself. Given no number, it moves by itself.
	 */
	currentSlide?: number | null;
	// Whether a slide of layers follows the pointer. It is the axis of the card, and a composition on a slide
	// is the same composition as the one standing in the zone.
	parallax?: boolean;
	onSlideChange: (slide: number) => void;
};

/**
 * The gallery of the announcement, standing in the media zone of the card: a carousel of slides, the arrows
 * of it on the icon buttons of the design system and a row of dots telling which slide of the ring is shown.
 *
 * The unit is two nodes and not one, because the graphics of the card can leave the card: the panel holds the
 * controls and stands in the zone, the stage holds the slides and goes wherever the card puts it - inside the
 * panel, or onto the layer the graphics flies out onto. The index is one for the two of them, so a slide on
 * the layer and a dot in the panel never part.
 */
export class Gallery
{
	#slides: WhatsNewGallerySlide[];
	#nav: WhatsNewGalleryNav;
	#bleed: boolean;
	#parallax: boolean;
	#controlled: boolean;
	#currentSlide: number;
	#onSlideChange: (slide: number) => void;

	#panel: HTMLElement | null = null;
	#stage: HTMLElement | null = null;
	#slideNodes: HTMLElement[] = [];
	#dotNodes: HTMLElement[] = [];
	/*
	 * The pictures the component draws itself, and the address each of them is waiting for. A slide stands in
	 * the tree from the start - taking one out and putting it back would start its loading over - but only
	 * the slide in sight and the two next to it round the ring are given their address: a carousel that gave
	 * every slide its address at once would fetch the whole set to show one of them, and the illustrations of
	 * an announcement are hundreds of kilobytes each. A slide of a ready node of the consumer is not here:
	 * that node is theirs and the component does not touch what it loads.
	 */
	#waitingImages: Array<{ node: HTMLImageElement; src: string } | null> = [];
	/*
	 * The compositions of layers the component lays out itself, and the slide each of them waits in. They wait
	 * for the same reason the pictures do, and it weighs more here: a composition is a dozen sprites and more,
	 * so a carousel that laid every one of them out at once would fetch the whole set to show one slide. A
	 * composition already laid out is not here any more; the ones that were are kept below to be let go of.
	 */
	#waitingScenes: Array<{ scene: Scene; slide: HTMLElement } | null> = [];
	#scenes: Scene[] = [];
	// The composition of every slide that has one, in the places of the ring: the follow of the pointer is
	// turned on for the slide in sight and off for the rest, and that is addressed by place.
	#slideScenes: Array<Scene | null> = [];
	// Whether the card the gallery stands in is shown. A closed card keeps its gallery for the next show.
	#shown: boolean = false;
	// The presses of the arrows are taken by hand: the option of the button that takes them is typed to give
	// something back, and a turn of the carousel gives nothing back.
	#arrowPresses: Array<{ node: HTMLElement; handler: () => void }> = [];

	constructor(options: GalleryOptions)
	{
		this.#slides = options.slides;
		this.#nav = options.nav ?? WhatsNewGalleryNav.Sides;
		this.#bleed = options.bleed === true;
		this.#parallax = options.parallax !== false;
		this.#controlled = Type.isNumber(options.currentSlide);
		this.#currentSlide = this.#toSlide(options.currentSlide);
		this.#onSlideChange = options.onSlideChange;
	}

	// The panel is built once and handed out as the same node afterwards: a rebuild of the card moves the very
	// same controls into the new content together with the focus standing on one of them.
	render(): HTMLElement
	{
		this.#panel ??= this.#renderPanel();

		return this.#panel;
	}

	// The stage of the slides. It stands inside the panel while the graphics stays in the card, and the card
	// asks for it separately when the graphics leaves the card through a layer of its own.
	renderStage(): HTMLElement
	{
		this.#stage ??= this.#buildStage();

		return this.#stage;
	}

	/*
	 * A number of the consumer turns the controlled mode on and its absence hands the ring back to itself: the
	 * axis is nullable in the public contract, so a change of it changes the mode and not only the index. The
	 * mode lives apart from setCurrentSlide() on purpose - that one is called by the gallery itself as it
	 * turns, and folding the two together would make every self-made turn look like an index of the consumer.
	 */
	setControlled(controlled: boolean): void
	{
		this.#controlled = controlled;
	}

	/*
	 * The card hands the ring over to the pointer when it is shown and takes it back when it closes: a gallery
	 * kept for the next show would otherwise keep listening to every move of the pointer on the page.
	 */
	setShown(shown: boolean): void
	{
		this.#shown = shown;

		this.#applyTracking();
	}

	// Moves the gallery onto another slide of the ring. Changing the slide is worth one class on the slide and
	// one on the dot - not a rebuild of the carousel, which would fetch every picture of it anew.
	setCurrentSlide(slide: number): void
	{
		this.#currentSlide = this.#toSlide(slide);

		this.#loadAround();
		this.#applyTracking();
		this.#slideNodes.forEach((node, index) => this.#mark(node, index === this.#currentSlide));
		this.#dotNodes.forEach((node, index) => {
			this.#mark(node, index === this.#currentSlide);
			node.setAttribute('aria-current', index === this.#currentSlide ? 'true' : 'false');
		});
	}

	// The gallery holds its nodes and lets go of them here, so that a card nobody shows any more holds no tree
	// of pictures behind it.
	destroy(): void
	{
		this.#arrowPresses.forEach(({ node, handler }) => Event.unbind(node, 'click', handler));
		this.#arrowPresses = [];
		this.#panel = null;
		this.#stage = null;
		this.#slideNodes = [];
		this.#dotNodes = [];
		this.#waitingImages = [];
		this.#waitingScenes = [];
		this.#scenes.forEach((scene: Scene) => scene.destroy());
		this.#scenes = [];
		this.#slideScenes = [];
	}

	/*
	 * The panel is the zone of the slides and, under it, the row of dots. The zone is a box of its own so that
	 * the arrows are placed against the slide and not against a panel the row of dots has made taller.
	 */
	#renderPanel(): HTMLElement
	{
		const viewport: HTMLElement = Tag.render`
			<div class="${BLOCK_CLASS}__viewport">
				${this.#bleed ? this.#renderReserve() : this.renderStage()}
				${this.#renderArrows()}
			</div>
		`;

		return Tag.render`
			<div class="${this.#getClassName()}" data-testid="announce-dialog-gallery">
				${viewport}
				${this.#renderDots()}
			</div>
		`;
	}

	/*
	 * The stage keeps every slide at once and shows one of them. A slide taken out of the tree and put back
	 * would start the loading of its pictures over, and the stage of a fixed height is what keeps the zone
	 * from jumping: slides of different proportions must never move the card under them.
	 *
	 * The whole stage is decoration and is hidden from assistive technology - what the announcement says is
	 * said by the text of the card, and the dots below name the slides.
	 */
	#buildStage(): HTMLElement
	{
		// One place per slide, so that the ring of neighbours below counts the slides and not the pictures: a
		// slide of a ready node of the consumer keeps an empty place of its own.
		this.#waitingImages = this.#slides.map(() => null);
		this.#slideScenes = this.#slides.map(() => null);
		this.#slideNodes = this.#slides.map((slide, index) => this.#renderSlide(slide, index));
		this.#loadAround();

		return Tag.render`
			<div class="${BLOCK_CLASS}__stage" aria-hidden="true" data-testid="announce-dialog-gallery-stage">
				${this.#slideNodes}
			</div>
		`;
	}

	/*
	 * Gives their address to the slide in sight and to the two next to it round the ring, and to no one else.
	 * The neighbours are given theirs together with the shown one so that a turn of the carousel shows a
	 * picture and not an empty rectangle; a picture already given its address is left alone, so a walk round
	 * the ring loads every slide once and never again.
	 */
	#loadAround(): void
	{
		const total: number = this.#slides.length;
		if (total === 0)
		{
			return;
		}

		const wanted = new Set<number>([
			this.#currentSlide,
			(this.#currentSlide + total + PREVIOUS) % total,
			(this.#currentSlide + total + NEXT) % total,
		]);

		wanted.forEach((index: number) => {
			const picture = this.#waitingImages[index];
			if (picture)
			{
				this.#waitingImages[index] = null;
				picture.node.src = picture.src;
			}

			const composition = this.#waitingScenes[index];
			if (composition)
			{
				this.#waitingScenes[index] = null;
				this.#scenes.push(composition.scene);
				Dom.append(composition.scene.render(), composition.slide);
				// The neighbours of the shown slide are laid out ahead of the turn and are not seen yet.
				composition.scene.setTracking(this.#shown && index === this.#currentSlide);
			}
		});
	}

	// The room the stage keeps in the zone while the slides themselves fly out onto a layer of their own: a
	// zone that let them go and shrank would pull the card up from under them.
	#renderReserve(): HTMLElement
	{
		return Tag.render`
			<div class="${BLOCK_CLASS}__stage" data-testid="announce-dialog-gallery-reserve"></div>
		`;
	}

	/*
	 * A ready node of the consumer is drawn as it is: it carries a composition of its own and the mask of the
	 * bottom edge would eat the lower part of it. A picture of an address is drawn by the component and melts
	 * into the backdrop by that very mask, the way the art of a single scene does. A composition of layers is
	 * laid out by the component too, and it arrives in the slide once the carousel reaches it - see
	 * #waitingScenes for why.
	 */
	#renderSlide(slide: WhatsNewGallerySlide, index: number): HTMLElement
	{
		const isScene: boolean = !Type.isDomNode(slide) && 'scene' in slide;
		const content: HTMLElement | string = this.#renderSlideContent(slide, index, isScene);

		const node: HTMLElement = Tag.render`
			<div class="${BLOCK_CLASS}__slide" data-testid="announce-dialog-gallery-slide-${index}">
				${content}
			</div>
		`;

		if (isScene)
		{
			const scene: Scene = new Scene({
				content: (slide as { scene: WhatsNewScene }).scene,
				variant: SceneVariant.Art,
				parallax: this.#parallax,
			});

			this.#waitingScenes[index] = { scene, slide: node };
			this.#slideScenes[index] = scene;
		}

		this.#mark(node, index === this.#currentSlide);

		return node;
	}

	#renderSlideContent(slide: WhatsNewGallerySlide, index: number, isScene: boolean): HTMLElement | string
	{
		if (Type.isDomNode(slide))
		{
			return slide;
		}

		// A composition is put into the slide later, so the slide of one stands empty until then.
		return isScene ? '' : this.#renderSlideImage(slide as { src: string }, index);
	}

	// The address is not put in the markup: it is handed to the node once the slide comes into sight or next
	// to it, and until then the picture is not fetched at all. See #waitingImages for why.
	#renderSlideImage(slide: { src: string }, index: number): HTMLElement
	{
		const node: HTMLImageElement = Tag.render`
			<img
				class="${BLOCK_CLASS}__slide-image"
				alt=""
				data-testid="announce-dialog-gallery-slide-image-${index}"
			>
		`;

		this.#waitingImages[index] = { node, src: slide.src };

		return node;
	}

	// A ring of one slide is no carousel: there is nowhere to turn and nothing to tell apart.
	#hasControls(): boolean
	{
		return this.#slides.length > 1;
	}

	#renderArrows(): HTMLElement[] | string
	{
		return this.#hasControls() ? [this.#renderArrow(PREVIOUS), this.#renderArrow(NEXT)] : '';
	}

	/*
	 * The arrow is a standard icon button of the design system, and the wrapper around it is what places it
	 * over the slide and carries the shadow. The button itself is never placed: the design system owns its
	 * geometry, and a rule of ours reaching into it would break with the next release of the button.
	 */
	#renderArrow(step: number): HTMLElement
	{
		const isPrevious: boolean = step === PREVIOUS;
		const side: string = isPrevious ? '--prev' : '--next';
		const testId: string = `announce-dialog-gallery-${isPrevious ? 'prev' : 'next'}`;
		const label: string = Loc.getMessage(
			isPrevious ? 'UI_SYSTEM_WHATS_NEW_GALLERY_PREV_ARIA' : 'UI_SYSTEM_WHATS_NEW_GALLERY_NEXT_ARIA',
		) ?? '';

		const button: HTMLElement = new Button({
			useAirDesign: true,
			// The style of the secondary button of the row of actions: in the context of a dark edge it comes
			// as a thin white outline over the graphics and not as a white plate on it.
			style: AirButtonStyle.OUTLINE,
			size: ButtonSize.MEDIUM,
			/*
			 * The button carries no text, so it is a collapsed one and the icon of that mode is its own.
			 * These two are the chevrons the air design draws for a button; the icons named after the
			 * directions are of the design before it and paint themselves over the fill of the button.
			 */
			collapsedIcon: isPrevious ? ButtonIcon.CHEVRON_LEFT_S : ButtonIcon.CHEVRON_RIGHT_S,
			props: { 'aria-label': label },
		}).render();

		const handler = (): void => this.#move(step);

		Event.bind(button, 'click', handler);
		this.#arrowPresses.push({ node: button, handler });

		// The test id marks the wrapper: it is the wrapper that is placed, and the button inside it belongs to
		// the design system.
		return Tag.render`
			<span
				class="${BLOCK_CLASS}__arrow ${side} ${EDGE_CONTEXT}"
				data-testid="${testId}"
			>${button}</span>
		`;
	}

	// Every dot is a control of its own: it takes focus, answers the keyboard and names the slide it leads to,
	// and the one the gallery stands on is marked as the current position of the ring.
	#renderDots(): HTMLElement | string
	{
		if (!this.#hasControls())
		{
			return '';
		}

		this.#dotNodes = Array.from({ length: this.#slides.length }, (unused, index) => this.#renderDot(index));

		return Tag.render`
			<div
				class="${BLOCK_CLASS}__dots"
				role="group"
				aria-label="${Loc.getMessage('UI_SYSTEM_WHATS_NEW_SLIDES_ARIA') ?? ''}"
				data-testid="announce-dialog-gallery-dots"
			>
				${this.#dotNodes}
			</div>
		`;
	}

	#renderDot(index: number): HTMLElement
	{
		const label: string = Loc.getMessage('UI_SYSTEM_WHATS_NEW_SLIDE_ARIA', {
			'#NUMBER#': String(index + 1),
			'#TOTAL#': String(this.#slides.length),
		}) ?? '';

		const node: HTMLElement = Tag.render`
			<button
				type="button"
				class="${BLOCK_CLASS}__dot"
				aria-label="${label}"
				data-testid="announce-dialog-gallery-dot-${index}"
				onclick="${() => this.#select(index)}"
			>
				<span class="${BLOCK_CLASS}__dot-mark"></span>
			</button>
		`;

		// The mark is put on by the same code that moves it later, so a drawn row and a changed one never
		// differ.
		this.#mark(node, index === this.#currentSlide);
		node.setAttribute('aria-current', index === this.#currentSlide ? 'true' : 'false');

		return node;
	}

	#move(step: number): void
	{
		const total: number = this.#slides.length;

		this.#select((this.#currentSlide + step + total) % total);
	}

	// The gallery always reports the slide the user asked for; it moves onto it itself only while the consumer
	// keeps no index of its own.
	#select(slide: number): void
	{
		this.#onSlideChange(slide);

		if (!this.#controlled)
		{
			this.setCurrentSlide(slide);
		}
	}

	// Only the slide in sight follows the pointer: a composition nobody sees has nothing to answer with.
	#applyTracking(): void
	{
		this.#slideScenes.forEach((scene: Scene | null, index: number) => {
			scene?.setTracking(this.#shown && index === this.#currentSlide);
		});
	}

	#mark(node: HTMLElement, isCurrent: boolean): void
	{
		if (isCurrent)
		{
			Dom.addClass(node, ACTIVE_CLASS);
		}
		else
		{
			Dom.removeClass(node, ACTIVE_CLASS);
		}
	}

	// The ring closes: a slide past either end of the list comes back on the other side of it.
	#toSlide(value: unknown): number
	{
		const total: number = this.#slides.length;

		if (total === 0)
		{
			return 0;
		}

		const slide: number = Type.isNumber(value) ? Math.trunc(value) : 0;

		return ((slide % total) + total) % total;
	}

	#getClassName(): string
	{
		return [BLOCK_CLASS, `--nav-${this.#nav}`].join(' ');
	}
}

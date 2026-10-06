import { Dom, Event, Tag, Text } from 'main.core';

export class LandingSitesAiSlider
{
	static init(options = {})
	{
		const renderTo = typeof options.renderTo === 'string'
			? document.querySelector(options.renderTo)
			: options.renderTo;

		if (!renderTo)
		{
			return null;
		}

		const items = options.items || LandingSitesAiSlider.getDefaultItems(options.templateFolder, options.lang);
		const root = LandingSitesAiSlider.render(items);
		Dom.clean(renderTo);
		Dom.append(root, renderTo);

		const slider = new LandingSitesAiSlider(root);
		slider.init();

		return slider;
	}

	static getDefaultItems(
		templateFolder = '/bitrix/components/bitrix/landing.site_tile/templates/.default',
		lang = 'en',
	)
	{
		const imageLang = lang === 'ru' ? 'ru' : 'en';

		return [1, 2, 3].map((number) => ({
			title: `Desktop ${number}`,
			preview: `${templateFolder}/images/desktop-blured-${number}.png`,
			center: `${templateFolder}/images/desktop-${number}-${imageLang}.jpg`,
		}));
	}

	static render(items)
	{
		const root = Tag.render`<div class="landing-sites-ai"></div>`;
		const slider = Tag.render`<div class="landing-sites-ai__slider" data-landing-sites-ai-slider></div>`;
		const viewport = Tag.render`<div class="landing-sites-ai__viewport"></div>`;
		const previewLayer = Tag.render`<div class="landing-sites-ai__preview-layer"></div>`;
		const centerLayer = Tag.render`<div class="landing-sites-ai__center-layer"></div>`;

		items.forEach((item, index) => {
			Dom.append(LandingSitesAiSlider.renderSlide(item, index, 'preview'), previewLayer);
		});
		items.forEach((item, index) => {
			Dom.append(LandingSitesAiSlider.renderSlide(item, index, 'center'), centerLayer);
		});

		Dom.append(previewLayer, viewport);
		Dom.append(centerLayer, viewport);
		Dom.append(viewport, slider);
		Dom.append(slider, root);

		return root;
	}

	static renderSlide(item, index, type)
	{
		const src = type === 'preview' ? item.preview : item.center;
		const slide = Tag.render`
			<button
				class="landing-sites-ai__slide landing-sites-ai__slide--${Text.encode(type)}"
				type="button"
				data-index="${Text.encode(String(index))}"
				aria-label="${Text.encode(item.title || '')}"
				aria-hidden="true"
				tabindex="-1"
			>
				<img
					class="landing-sites-ai__slide-image"
					src="${Text.encode(src)}"
					alt=""
					draggable="false"
				>
			</button>
		`;

		Dom.attr(slide, type === 'preview' ? 'data-landing-sites-ai-preview-slide' : 'data-landing-sites-ai-center-slide', '');

		return slide;
	}

	constructor(root)
	{
		this.root = root;
		this.previewSlides = Array.from(this.root.querySelectorAll('[data-landing-sites-ai-preview-slide]'));
		this.centerSlides = Array.from(this.root.querySelectorAll('[data-landing-sites-ai-center-slide]'));
		this.activeIndex = 0;
		this.visibleIndexes = null;
		this.isTransitioning = false;
		this.transition = null;
		this.transitionTimeout = null;
		this.interval = null;
		this.delay = 3200;
		this.transitionDuration = 860;
	}

	init()
	{
		if (this.previewSlides.length < 2 || this.previewSlides.length !== this.centerSlides.length)
		{
			return;
		}

		this.initVisibleIndexes();
		this.bindEvents();
		this.update();
		this.start();
	}

		initVisibleIndexes()
		{
			const total = this.previewSlides.length;
			this.visibleIndexes = [
				(this.activeIndex - 1 + total) % total,
				this.activeIndex,
				(this.activeIndex + 1) % total,
			];
		}

		bindEvents()
		{
			[...this.previewSlides, ...this.centerSlides].forEach((slide) => {
				Event.bind(slide, 'click', () => {
					this.goTo(Number(slide.dataset.index));
				});
			});

			Event.bind(this.root, 'mouseenter', () => {
				this.stop();
			});

			Event.bind(this.root, 'mouseleave', () => {
				this.start();
			});

			Event.bind(document, 'visibilitychange', () => {
				if (document.hidden)
				{
					this.stop();
					return;
				}

				this.start();
			});
		}

		start()
		{
			if (this.isTransitioning)
			{
				return;
			}

			this.stop();
			this.interval = window.setInterval(() => {
				this.next();
			}, this.delay);
		}

		stop()
		{
			if (this.interval)
			{
				window.clearInterval(this.interval);
				this.interval = null;
			}
		}

		next()
		{
			if (!this.visibleIndexes)
			{
				this.initVisibleIndexes();
			}

			this.goTo(this.visibleIndexes[0]);
		}

		goTo(index)
		{
			const total = this.centerSlides.length;
			const nextIndex = (index + total) % total;
			if (nextIndex === this.activeIndex || this.isTransitioning)
			{
				return;
			}

			if (!this.visibleIndexes || !this.visibleIndexes.includes(nextIndex))
			{
				this.activeIndex = nextIndex;
				this.initVisibleIndexes();
				this.update();
				this.start();
				return;
			}

			if (nextIndex !== this.visibleIndexes[0] && nextIndex !== this.visibleIndexes[2])
			{
				this.activeIndex = nextIndex;
				this.update();
				this.start();
				return;
			}

			this.runTransition(nextIndex, nextIndex === this.visibleIndexes[0] ? 'left' : 'right');
		}

		runTransition(nextIndex, direction)
		{
			this.stop();
			this.clearTransitionTimeout();
			this.isTransitioning = true;
			this.transition = {
				from: this.activeIndex,
				to: nextIndex,
				direction: direction,
			};
			this.activeIndex = nextIndex;

			this.root.dataset.transition = direction;
			this.root.dataset.transitionStage = 'start';
			this.update();
			this.applyPreviewMotionFrame('start');
			this.applyCenterOverlayFrame('start');

			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					if (this.isTransitioning)
					{
						this.root.dataset.transitionStage = 'active';
						this.applyPreviewMotionFrame('active');
						this.applyCenterOverlayFrame('active');
					}
				});
			});

			this.transitionTimeout = window.setTimeout(() => {
				this.isTransitioning = false;
				delete this.root.dataset.transition;
				delete this.root.dataset.transitionStage;
				this.rotateVisibleIndexes();
				this.transition = null;
				this.clearPreviewMotionStyles(true);
				this.clearCenterOverlayStyles(true);
				this.update();
				window.requestAnimationFrame(() => {
					window.requestAnimationFrame(() => {
						this.clearPreviewMotionTransitionLocks();
						this.clearCenterOverlayTransitionLocks();
						this.start();
					});
				});
			}, this.transitionDuration);
		}

		update()
		{
			if (this.isTransitioning)
			{
				this.updateTransition();
				return;
			}

			if (!this.visibleIndexes)
			{
				this.initVisibleIndexes();
			}
			const [leftIndex, centerIndex, rightIndex] = this.visibleIndexes;

			this.previewSlides.forEach((slide, index) => {
				let state = 'hidden';
				if (index === centerIndex)
				{
					state = 'preview-center';
				}
				else if (index === leftIndex)
				{
					state = 'left';
				}
				else if (index === rightIndex)
				{
					state = 'right';
				}

				this.applySlideState(slide, state);
			});

			this.centerSlides.forEach((slide, index) => {
				this.applySlideState(slide, index === centerIndex ? 'center' : 'hidden');
			});

			this.activeIndex = centerIndex;
		}

		updateTransition()
		{
			const currentIndex = this.transition.from;
			const nextIndex = this.transition.to;
			const direction = this.transition.direction;
			const oldSideIndex = direction === 'left'
				? this.visibleIndexes[2]
				: this.visibleIndexes[0];

			this.previewSlides.forEach((slide, index) => {
				let state = 'hidden';
				if (index === currentIndex)
				{
					state = direction === 'left' ? 'preview-center-to-right' : 'preview-center-to-left';
				}
				else if (index === nextIndex)
				{
					state = 'preview-to-center';
				}
				else if (index === oldSideIndex)
				{
					state = direction === 'left' ? 'preview-right-to-left' : 'preview-left-to-right';
				}
				this.applySlideState(slide, state);
			});

			this.centerSlides.forEach((slide, index) => {
				let state = 'hidden';
				if (index === currentIndex)
				{
					state = 'center-out';
				}
				else if (index === nextIndex)
				{
					state = 'center-in';
				}

				this.applySlideState(slide, state);
			});
		}

		applySlideState(slide, state)
		{
			Dom.attr(slide, 'data-state', state);
			Dom.attr(slide, 'aria-hidden', 'true');
			slide.tabIndex = -1;
		}

		rotateVisibleIndexes()
		{
			if (!this.visibleIndexes || !this.transition)
			{
				return;
			}

			const [leftIndex, centerIndex, rightIndex] = this.visibleIndexes;
			this.visibleIndexes = this.transition.direction === 'left'
				? [rightIndex, leftIndex, centerIndex]
				: [centerIndex, rightIndex, leftIndex];
			this.activeIndex = this.visibleIndexes[1];
		}

		applyPreviewMotionFrame(stage)
		{
			if (!this.transition)
			{
				return;
			}

			const currentIndex = this.transition.from;
			const nextIndex = this.transition.to;
			const direction = this.transition.direction;
			const oldSideIndex = direction === 'left'
				? this.visibleIndexes[2]
				: this.visibleIndexes[0];
			const motionMap = new Map();

			if (direction === 'left')
			{
				motionMap.set(nextIndex, stage === 'start' ? 'left' : 'center');
				motionMap.set(currentIndex, stage === 'start' ? 'center' : 'right');
				motionMap.set(oldSideIndex, stage === 'start' ? 'right' : 'left');
			}
			else
			{
				motionMap.set(nextIndex, stage === 'start' ? 'right' : 'center');
				motionMap.set(currentIndex, stage === 'start' ? 'center' : 'left');
				motionMap.set(oldSideIndex, stage === 'start' ? 'left' : 'right');
			}

			motionMap.forEach((position, index) => {
				this.applyPreviewMotionStyle(this.previewSlides[index], position, stage);
			});
		}

		applyPreviewMotionStyle(slide, position, stage)
		{
			if (!slide)
			{
				return;
			}

			const styles = this.getPreviewMotionStyles(position);
			Object.entries(styles).forEach(([property, value]) => {
				slide.style[property] = value;
			});
			slide.style.transition = stage === 'start'
				? 'none'
				: 'width var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), height var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), transform var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), opacity var(--landing-sites-ai-fan-duration) ease';
			slide.style.animation = 'none';
		}

		applyCenterOverlayFrame(stage)
		{
			if (!this.transition)
			{
				return;
			}

			const currentSlide = this.centerSlides[this.transition.from];
			const nextSlide = this.centerSlides[this.transition.to];
			const currentPosition = this.transition.direction === 'left' ? 'right' : 'left';
			const nextPosition = this.transition.direction === 'left' ? 'left' : 'right';

			this.applyCenterOverlayStyle(
				currentSlide,
				stage === 'start' ? 'center' : currentPosition,
				stage === 'start' ? 'visible' : 'hidden',
				stage,
				'6',
			);
			this.applyCenterOverlayStyle(
				nextSlide,
				stage === 'start' ? nextPosition : 'center',
				stage === 'start' ? 'hidden' : 'visible',
				stage,
				'7',
			);
		}

		applyCenterOverlayStyle(slide, position, state, stage, zIndex)
		{
			if (!slide)
			{
				return;
			}

			const styles = this.getCenterOverlayMotionStyles(position, state);
			Object.entries(styles).forEach(([property, value]) => {
				slide.style[property] = value;
			});
			slide.style.visibility = 'visible';
			slide.style.zIndex = zIndex;
			slide.style.pointerEvents = state === 'visible' && position === 'center' ? 'auto' : 'none';
			slide.style.transition = stage === 'start'
				? 'none'
				: 'width var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), height var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), transform var(--landing-sites-ai-fan-duration) var(--landing-sites-ai-fan-easing), opacity var(--landing-sites-ai-fan-duration) ease, filter var(--landing-sites-ai-fan-duration) ease';
		}

		getPreviewMotionStyles(position)
		{
			if (position === 'center')
			{
				return {
					width: 'var(--landing-sites-ai-slide-width)',
					height: 'var(--landing-sites-ai-slide-height)',
					opacity: '.45',
					transform: 'translateX(-50%) scale(1)',
					transformOrigin: '50% 100%',
					zIndex: '3',
				};
			}

			const isLeft = position === 'left';
			return {
				width: 'var(--landing-sites-ai-side-width)',
				height: 'var(--landing-sites-ai-side-height)',
				opacity: '.45',
				transform: isLeft
					? 'translateX(calc(-50% - var(--landing-sites-ai-side-shift))) translateY(var(--landing-sites-ai-side-drop)) scale(var(--landing-sites-ai-side-scale)) rotate(var(--landing-sites-ai-side-rotate-left))'
					: 'translateX(calc(-50% + var(--landing-sites-ai-side-shift))) translateY(var(--landing-sites-ai-side-drop)) scale(var(--landing-sites-ai-side-scale)) rotate(var(--landing-sites-ai-side-rotate-right))',
				transformOrigin: isLeft ? '82% 100%' : '18% 100%',
				zIndex: position === 'center' ? '5' : '2',
			};
		}

		getCenterOverlayMotionStyles(position, state)
		{
			const isVisible = state === 'visible';

			if (position === 'center')
			{
				return {
					width: 'var(--landing-sites-ai-slide-width)',
					height: 'var(--landing-sites-ai-slide-height)',
					opacity: isVisible ? '1' : '0',
					filter: 'none',
					transform: 'translateX(-50%) scale(1)',
					transformOrigin: '50% 100%',
				};
			}

			const isLeft = position === 'left';
			return {
				width: 'var(--landing-sites-ai-side-width)',
				height: 'var(--landing-sites-ai-side-height)',
				opacity: isVisible ? '1' : '0',
				filter: 'blur(10px)',
				transform: isLeft
					? 'translateX(calc(-50% - var(--landing-sites-ai-side-shift))) translateY(var(--landing-sites-ai-side-drop)) scale(var(--landing-sites-ai-side-scale)) rotate(var(--landing-sites-ai-side-rotate-left))'
					: 'translateX(calc(-50% + var(--landing-sites-ai-side-shift))) translateY(var(--landing-sites-ai-side-drop)) scale(var(--landing-sites-ai-side-scale)) rotate(var(--landing-sites-ai-side-rotate-right))',
				transformOrigin: isLeft ? '82% 100%' : '18% 100%',
			};
		}

		clearPreviewMotionStyles(lockTransitions)
		{
			this.previewSlides.forEach((slide) => {
				if (lockTransitions)
				{
					slide.style.transition = 'none';
				}

				[
					'width',
					'height',
					'opacity',
					'filter',
					'transform',
					'transformOrigin',
					'zIndex',
					'animation',
				].forEach((property) => {
					slide.style[property] = '';
				});
			});
		}

		clearPreviewMotionTransitionLocks()
		{
			this.previewSlides.forEach((slide) => {
				slide.style.transition = '';
			});
		}

		clearCenterOverlayStyles(lockTransitions)
		{
			this.centerSlides.forEach((slide) => {
				if (lockTransitions)
				{
					slide.style.transition = 'none';
				}

				[
					'width',
					'height',
					'opacity',
					'visibility',
					'filter',
					'transform',
					'transformOrigin',
					'zIndex',
					'pointerEvents',
				].forEach((property) => {
					slide.style[property] = '';
				});
			});
		}

		clearCenterOverlayTransitionLocks()
		{
			this.centerSlides.forEach((slide) => {
				slide.style.transition = '';
			});
		}

		clearTransitionTimeout()
		{
			if (this.transitionTimeout)
			{
				window.clearTimeout(this.transitionTimeout);
				this.transitionTimeout = null;
			}
		}
}

export default LandingSitesAiSlider;

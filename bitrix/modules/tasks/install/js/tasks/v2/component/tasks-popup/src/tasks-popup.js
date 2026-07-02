import { Type } from 'main.core';
import { ZIndexManager, type ZIndexComponent } from 'main.core.z-index-manager';

import './tasks-popup.css';

type TasksPopupOptions = {
	isWithBG: boolean,
	isWithPointer: boolean,
	isWithOverlay: boolean,
	isDarkMode: boolean,
	isEscBlocked: boolean,
	isFlippingBlocked: boolean,
	isFrozen: boolean,
	id: string,
	className: string,
	classNameOverlay: string,
	positioning: {
		elementAnchor: any,
		isOpenedUp: boolean,
		isOpenedLeft: boolean,
		offsetVertical: number,
		offsetHorizontal: number,
	},
};

// @vue/components
export const TasksPopup = {
	name: 'TasksPopup',
	props: {
		options: {
			/** @type TasksPopupOptions */
			type: Object,
			default: null,
		},
	},
	emits: [
		'mouseenterOverlay',
		'mouseleaveOverlay',
		'clickOverlay',
		'mouseenter',
		'mouseleave',
		'click',
		'close',
	],
	data(): Object
	{
		return {
			// TODO: remove zIndex management when there is no old popup
			zIndexComponent: null,
			left: null,
			right: null,
			top: null,
			bottom: null,
			isFlippedNoSpaceHorizontally: false,
			isFlippedNoSpaceHorizontallyBack: false,
			isFlippedNoSpaceVertically: false,
			isFlippedNoSpaceVerticallyBack: false,
		};
	},
	computed: {
		positioning(): any
		{
			return this.options?.positioning || {};
		},
		elementAnchor(): any
		{
			return this.positioning.elementAnchor;
		},
		offsetVertical(): any
		{
			const offsetVerticalNew = this.positioning.offsetVertical || 0;
			const offsetVerticalForPointer = this.options?.isWithPointer ? 5 : 0;

			return offsetVerticalNew + offsetVerticalForPointer;
		},
		classNamePopupOverlayCustom(): any
		{
			return this.options?.classNameOverlay;
		},
		classNamePopupOverlay(): any
		{
			let classNamePopupOverlayNew = 'tasks-popup-overlay';

			if (this.classNamePopupOverlayCustom)
			{
				classNamePopupOverlayNew += ` ${this.classNamePopupOverlayCustom}`;
			}

			if (this.options?.isWithOverlay)
			{
				classNamePopupOverlayNew += ' tasks-popup-overlay_alive';
			}

			classNamePopupOverlayNew += this.options?.isDarkMode ? ' --ui-context-content-dark' : ' --ui-context-content-light';

			return classNamePopupOverlayNew;
		},
		classNamePopupCustom(): any
		{
			return this.options?.className;
		},
		classNamePopup(): any
		{
			let classNamePopupNew = 'tasks-popup';

			if (!this.elementAnchor)
			{
				classNamePopupNew += ' tasks-popup_unbound';
			}

			if (this.classNamePopupCustom)
			{
				classNamePopupNew += ` ${this.classNamePopupCustom}`;
			}

			if (this.positioning.isOpenedUp)
			{
				classNamePopupNew += ' tasks-popup_opened-up';
			}

			if (this.positioning.isOpenedLeft)
			{
				classNamePopupNew += ' tasks-popup_opened-left';
			}

			if (this.options?.isWithBG)
			{
				classNamePopupNew += ' tasks-popup_with-bg';
			}

			if (this.options?.isWithPointer)
			{
				classNamePopupNew += ' tasks-popup_with-pointer';
			}

			return classNamePopupNew;
		},
		zIndexPopup(): any
		{
			return this.zIndexComponent?.zIndex || 0;
		},
		stylePopupOverlay(): any
		{
			const stylePopupOverlayNew = {
				zIndex: this.zIndexPopup,
			};

			return stylePopupOverlayNew;
		},
		stylePopup(): any
		{
			const stylePopupNew = {};

			if (Type.isNumber(this.left))
			{
				stylePopupNew.left = `${this.left}px`;
			}

			if (Type.isNumber(this.right))
			{
				stylePopupNew.right = `${this.right}px`;
			}

			if (Type.isNumber(this.top))
			{
				stylePopupNew.top = `${this.top}px`;
			}

			if (Type.isNumber(this.bottom))
			{
				stylePopupNew.bottom = `${this.bottom}px`;
			}

			return stylePopupNew;
		},
	},
	mounted(): void
	{
		this.registerZIndexComponent();

		if (this.elementAnchor)
		{
			this.setCoordsForPopup();
		}

		document.addEventListener('click', this.handleClickDocument);
		document.addEventListener('keydown', this.handleKeyDownDocument);
	},
	async beforeUnmount(): void
	{
		this.unregisterZIndexComponent();
		document.removeEventListener('click', this.handleClickDocument);
		document.removeEventListener('keydown', this.handleKeyDownDocument);
	},
	methods: {
		registerZIndexComponent(): ZIndexComponent
		{
			const elementPopup = this.$refs.popupOverlay;
			const options = null;
			this.zIndexComponent = ZIndexManager.register(elementPopup, options);
		},
		unregisterZIndexComponent(): ZIndexComponent
		{
			const elementPopup = this.$refs.popupOverlay;
			ZIndexManager.unregister(elementPopup);
			this.zIndexComponent = null;
		},
		getZIndexOfElement(element): number
		{
			const stylesOfElement = window.getComputedStyle(element);
			const zIndexOfElement = stylesOfElement.getPropertyValue('z-index');

			if (isNaN(zIndexOfElement))
			{
				return 0;
			}

			return Number(zIndexOfElement);
		},
		getZIndexHighest(): any
		{
			const popupsModern = document.body.querySelectorAll('body > .tasks-popup-overlay');
			const popupsLegacy = document.body.querySelectorAll('body > .popup-window');
			const popupsSidePanel = document.body.querySelectorAll('body > .side-panel');
			const popupsResult = [...popupsModern, ...popupsLegacy, ...popupsSidePanel];
			const popupsResultActive = popupsResult.filter((popup) => {
				const popupStyleDisplay = window?.getComputedStyle(popup)?.display;
				const isPopupHidden = popupStyleDisplay === 'none';

				return popupStyleDisplay && !isPopupHidden;
			});
			const zIndexes = popupsResultActive.map(pupup => this.getZIndexOfElement(pupup));
			const zIndexesAscending = zIndexes.sort((a, b) => a - b);
			const zIndexHighest = zIndexesAscending[zIndexesAscending.length - 1];

			return zIndexHighest;
		},
		getIsThisPopupLast(): any
		{
			const sort = this.zIndexComponent.getSort();
			const stackRaw = this.zIndexComponent.getStack();
			const stackPopups = stackRaw.components.items.filter((item) => {
				const isAlwaysOnTop = !item.alwaysOnTop;
				const element = item.element;
				const isHidden = window?.getComputedStyle(element)?.display === 'none';

				return (!isAlwaysOnTop && !isHidden);
			});
			const stackSorts = stackPopups.map(item => item.sort);

			let isSortHighest = true;
			for (let i = 0; i < stackSorts.length; i++)
			{
				const stackSort = stackSorts[i];
				isSortHighest = (sort >= stackSort);
			}

			return isSortHighest;
		},
		getRectWithOffset(elem): any
		{
			const rect = elem.getBoundingClientRect();

			return {
				top: rect.top + window.pageYOffset,
				right: rect.right + window.pageXOffset,
				bottom: rect.bottom + window.pageYOffset,
				left: rect.left + window.pageXOffset,
			};
		},
		setCoordsForPopupHorizontal(sizes): void
		{
			const {
				rectAnchor,
				widthParent,
				widthSelf,
			} = sizes;

			if (this.positioning.isOpenedLeft)
			{
				const leftNew = rectAnchor.right - widthSelf - (this.positioning.offsetHorizontal || 0);

				if (leftNew < 0)
				{
					if (!this.isFlippedNoSpaceHorizontally)
					{
						this.isFlippedNoSpaceHorizontally = true;
						this.positioning.isOpenedLeft = !this.positioning.isOpenedLeft;
						this.setCoordsForPopupHorizontal(sizes);
					}
					else if (!this.isFlippedNoSpaceHorizontallyBack)
					{
						this.isFlippedNoSpaceHorizontallyBack = true;
						this.positioning.isOpenedLeft = !this.positioning.isOpenedLeft;
						this.setCoordsForPopupHorizontal(sizes);
					}
					else
					{
						this.left = 0;
						this.right = null;
					}
				}
				else
				{
					this.left = leftNew;
					this.right = null;
				}
			}
			else
			{
				const leftNew = rectAnchor.left + (this.positioning.offsetHorizontal || 0);
				const rightBasedOnLeftResult = widthParent - (leftNew + widthSelf);

				if (rightBasedOnLeftResult < 0)
				{
					if (!this.isFlippedNoSpaceHorizontally)
					{
						this.isFlippedNoSpaceHorizontally = true;
						this.positioning.isOpenedLeft = !this.positioning.isOpenedLeft;
						this.setCoordsForPopupHorizontal(sizes);
					}
					else if (!this.isFlippedNoSpaceHorizontallyBack)
					{
						this.isFlippedNoSpaceHorizontallyBack = true;
						this.positioning.isOpenedLeft = !this.positioning.isOpenedLeft;
						this.setCoordsForPopupHorizontal(sizes);
					}
					else
					{
						this.left = null;
						this.right = 0;
					}
				}
				else
				{
					this.left = leftNew;
					this.right = null;
				}
			}
		},
		setCoordsForPopupVertical(sizes): void
		{
			const {
				rectAnchor,
				heightParent,
				heightSelf,
			} = sizes;

			if (this.positioning.isOpenedUp)
			{
				const topNew = rectAnchor.top - heightSelf - (this.offsetVertical || 0);

				if (topNew < 0)
				{
					if (!this.isFlippedNoSpaceVertically)
					{
						this.isFlippedNoSpaceVertically = true;
						this.positioning.isOpenedUp = !this.positioning.isOpenedUp;
						this.setCoordsForPopupVertical(sizes);
					}
					else if (!this.isFlippedNoSpaceVerticallyBack)
					{
						this.isFlippedNoSpaceVerticallyBack = true;
						this.positioning.isOpenedUp = !this.positioning.isOpenedUp;
						this.setCoordsForPopupVertical(sizes);
					}
					else
					{
						this.top = 0;
						this.bottom = null;
					}
				}
				else
				{
					this.top = topNew;
					this.bottom = null;
				}
			}
			else
			{
				const topNew = rectAnchor.bottom + (this.offsetVertical || 0);
				const bottomBasedOnTopResult = heightParent - (topNew + heightSelf);

				if (bottomBasedOnTopResult < 0)
				{
					if (!this.isFlippedNoSpaceVertically)
					{
						this.isFlippedNoSpaceVertically = true;
						this.positioning.isOpenedUp = !this.positioning.isOpenedUp;
						this.setCoordsForPopupVertical(sizes);
					}
					else if (!this.isFlippedNoSpaceVerticallyBack)
					{
						this.isFlippedNoSpaceVerticallyBack = true;
						this.positioning.isOpenedUp = !this.positioning.isOpenedUp;
						this.setCoordsForPopupVertical(sizes);
					}
					else
					{
						this.top = null;
						this.bottom = 0;
					}
				}
				else
				{
					this.top = topNew;
					this.bottom = null;
				}
			}
		},
		setCoordsForPopup(): void
		{
			const elementAnchor = this.elementAnchor;
			const elementSelf = this.$refs.popup;
			const parent = elementSelf.parentNode;

			const rectAnchor = this.getRectWithOffset(elementAnchor);
			const rectParent = this.getRectWithOffset(parent);
			const rectSelf = this.getRectWithOffset(elementSelf);

			const widthParent = rectParent.right - rectParent.left;
			const heightParent = rectParent.bottom - rectParent.top;
			const widthSelf = rectSelf.right - rectSelf.left;
			const heightSelf = rectSelf.bottom - rectSelf.top;

			const sizes = {
				rectAnchor,
				rectParent,
				rectSelf,
				widthParent,
				heightParent,
				widthSelf,
				heightSelf,
			};

			this.setCoordsForPopupHorizontal(sizes);
			this.setCoordsForPopupVertical(sizes);
		},
		closeThisPopup(): void
		{
			this.$emit('close');
		},
		tryToCloseThisPopup(): void
		{
			if (this.options.isFrozen)
			{
				return;
			}
			this.closeThisPopup();
		},
		closeNextPopups(): void
		{
			const popupsModern = document.body.querySelectorAll('.tasks-popup-overlay');

			for (const popupModern of popupsModern)
			{
				const siblingZIndex = this.getZIndexOfElement(popupModern);
				if (siblingZIndex > this.zIndexPopup)
				{
					const victimVueComponent = popupModern.__vueParentComponent;
					victimVueComponent.emit('close');
				}
			}
		},
		handleClickDocument(event): void
		{
			const target = event.target;
			const isTargetHigher = this.getZIndexOfElement(target) > this.zIndexPopup;
			if (isTargetHigher)
			{
				return;
			}

			// doesn't close popup when the click is lower, but popup opened is higher
			// popup gets opened faster than zIndexes are collected
			// not a bug, but a feature
			const isThisPopupLast = this.getIsThisPopupLast();
			if (!isThisPopupLast)
			{
				return;
			}

			this.tryToCloseThisPopup();
		},
		handleMouseEnterPopupOverlay(): void
		{
			this.$emit('mouseenterOverlay');
		},
		handleMouseLeavePopupOverlay(): void
		{
			this.$emit('mouseleaveOverlay');
		},
		handleClickPopupOverlay(): void
		{
			this.$emit('clickOverlay');
		},
		handleMouseEnterPopup(): void
		{
			// TODO: do not mouseleave parent popups on mouseenter child popup. same as with clicks
			this.$emit('mouseenter');
		},
		handleMouseLeavePopup(): void
		{
			this.$emit('mouseleave');
		},
		handleClickPopup(): void
		{
			event.stopPropagation();
			const isThisPopupLast = this.getIsThisPopupLast();

			if (!isThisPopupLast)
			{
				this.closeNextPopups();
			}

			this.$emit('click');
		},
		// TODO: merge Escape events with both new(keydown) and old(keyup) popups on the page
		handleKeyDownDocument(event) {
			if (event.key === 'Escape')
			{
				if (this.options.isEscBlocked)
				{
					return;
				}

				const isThisPopupLast = this.getIsThisPopupLast();
				if (!isThisPopupLast)
				{
					return;
				}

				this.tryToCloseThisPopup();
			}
		},
	},
	template: `
		<Teleport
			to="body"
		>
			<div
				ref="popupOverlay"
				:id="options.id"
				:class="classNamePopupOverlay"
				:style="stylePopupOverlay"
				@mouseenter="handleMouseEnterPopupOverlay"
				@mouseleave="handleMouseLeavePopupOverlay"
				@click="handleClickPopupOverlay"
			>
				<div
					v-if="options.isWithOverlay"
					class="tasks-popup-overlay__bg"
				></div>
				<div
					ref="popup"
					:class="classNamePopup"
					:style="stylePopup"
					@mouseenter="handleMouseEnterPopup"
					@mouseleave="handleMouseLeavePopup"
					@click="handleClickPopup"
				>
					<div class="tasks-popup__bg"></div>
					<div class="tasks-popup__content">
						<slot />
					</div>
				</div>
			</div>
		</Teleport>
	`,
};

import Item from './item';
import Backend from '../backend';
import { Dom, Text } from 'main.core';
import { Counter } from 'ui.cnt';
import Utils from '../utils';

export default class ItemGroup extends Item
{
	static code = 'group';
	groupContainer: Element;

	constructor()
	{
		super(...arguments);
		this.container.addEventListener('click', this.toggleAndSave.bind(this), true);
		this.container.addEventListener('mouseleave', () => {
			Dom.removeClass(this.container, 'menu-item-group-actioned');
		});
		this.groupContainer = this.container.parentNode.querySelector(`[data-group-id="${this.getId()}"]`);
		if (this.container.getAttribute('data-collapse-mode') === 'collapsed')
		{
			this.groupContainer.style.display = 'none';
		}
		setTimeout(() => {
			this.updateCounter();
		}, 0);
	}

	toggleAndSave(event)
	{
		event.preventDefault();
		event.stopPropagation();
		const toggleButton = this.container.querySelector('.menu-item-link');
		const containsActive = this.container.getAttribute('data-contains-active-item') === 'Y';
		if (this.container.getAttribute('data-collapse-mode') === 'collapsed')
		{
			Backend.expandGroup(this.getId());
			this
				.expand()
				.then(() => {
					this.container.setAttribute('data-collapse-mode', 'expanded');
					Dom.attr(toggleButton, 'aria-expanded', 'true');
					Dom.attr(toggleButton, 'aria-label', this.constructor.getItemAriaLabel(
						this.getName(),
						0,
					));

					if (containsActive)
					{
						this.#transferAriaCurrentToChild(toggleButton);
					}
				});
		}
		else
		{
			Backend.collapseGroup(this.getId());
			this
				.collapse()
				.then(() => {
					this.container.setAttribute('data-collapse-mode', 'collapsed');
					Dom.attr(toggleButton, 'aria-expanded', 'false');
					Dom.attr(toggleButton, 'aria-label', this.constructor.getItemAriaLabel(
						this.getName(),
						this.getCounterValue(),
					));

					if (containsActive)
					{
						this.#transferAriaCurrentToGroup(toggleButton);
					}
				});
		}

		return false;
	}

	#transferAriaCurrentToChild(groupButton)
	{
		groupButton.removeAttribute('aria-current');
		const activeChild = this.groupContainer.querySelector('.menu-item-active .menu-item-link');

		if (activeChild)
		{
			Dom.attr(activeChild, 'aria-current', 'page');
		}
	}

	#transferAriaCurrentToGroup(groupButton)
	{
		const activeChild = this.groupContainer.querySelector('.menu-item-active .menu-item-link');

		if (activeChild)
		{
			activeChild.removeAttribute('aria-current');
		}
		Dom.attr(groupButton, 'aria-current', 'page');
	}

	checkAndCorrect(): ItemGroup
	{
		const groupContainer = this.groupContainer;

		if (groupContainer.parentNode === this.container)
		{
			Dom.insertAfter(groupContainer, this.container);
		}
		[...groupContainer
			.querySelectorAll(`.menu-item-block`)
		].forEach((node) => {
			node.setAttribute('data-status', this.container.getAttribute("data-status"));
		});
		return this;
	}

	#collapsingAnimation;
	collapse(hideGroupContainer): Promise
	{
		return new Promise((resolve) => {
			const groupContainer = this.groupContainer;

			if (this.#collapsingAnimation)
			{
				this.#collapsingAnimation.stop();
			}

			const onComplete = () => {
				Dom.style(groupContainer, {
					display: 'none',
					opacity: 'auto',
					height: 'auto',
				});

				Dom.style(groupContainer, 'overflow', null);

				if (this.container.getAttribute('data-contains-active-item') === 'Y')
				{
					Dom.addClass(this.container, 'menu-item-active');
				}
				Dom.removeClass(this.container, 'menu-item-group-collapsing');
				Dom.removeClass(groupContainer, 'menu-item-group-collapsing');
				this.#collapsingAnimation = null;

				if (hideGroupContainer === true)
				{
					Dom.append(groupContainer, this.container);
				}
				resolve();
			};

			if (Utils.prefersReducedMotion())
			{
				onComplete();

				return;
			}

			groupContainer.style.overflow = 'hidden';
			Dom.addClass(this.container, 'menu-item-group-collapsing');
			Dom.addClass(this.container, 'menu-item-group-actioned');
			Dom.addClass(groupContainer, 'menu-item-group-collapsing');
			const slideParams = {
				height: groupContainer.offsetHeight,
				display: groupContainer.style.display
			};

			this.#collapsingAnimation = (new BX.easing({
				duration: 500,
				start: {height: slideParams.height, opacity: 100},
				finish: {height: 0, opacity: 0},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: function (state) {
					groupContainer.style.height = state.height + 'px';
					groupContainer.style.opacity = state.opacity / 100;
				},
				complete: onComplete,
			}));
			this.#collapsingAnimation.animate();
		});
	}

	expand(checkAttribute): Promise
	{
		return new Promise((resolve) => {
			const container = this.container;
			const groupContainer = this.groupContainer;

			if (checkAttribute === true
				&& container.getAttribute('data-collapse-mode') === 'collapsed')
			{
				return resolve();
			}

			if (groupContainer.parentNode === this.container)
			{
				Dom.insertAfter(groupContainer, this.container);
			}

			Dom.style(groupContainer, {
				display: 'block',
			});

			if (Utils.prefersReducedMotion())
			{
				Dom.style(groupContainer, {
					height: 'auto',
					opacity: 'auto',
				});

				resolve();

				return;
			}

			const contentHeight = groupContainer.querySelectorAll('li').length * (container.offsetHeight + 4);
			Dom.addClass(container, 'menu-item-group-expanding');
			Dom.addClass(container, 'menu-item-group-actioned');
			Dom.addClass(groupContainer, 'menu-item-group-expanding');

			this.#collapsingAnimation = (new BX.easing({
				duration: 500,
				start: {height: 0, opacity: 0},
				finish: {height: contentHeight, opacity: 100},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: function (state) {
					groupContainer.style.height = state.height + 'px';
					groupContainer.style.opacity = state.opacity / 100;
				},
				complete: function () {
					Dom.removeClass(container, 'menu-item-group-expanding menu-item-active');
					Dom.removeClass(groupContainer, 'menu-item-group-expanding');
					groupContainer.style.height = 'auto';
					groupContainer.style.opacity = 'auto';
					resolve();
				}
			}));
			this.#collapsingAnimation.animate();
		});
	}

	canDelete(): boolean
	{
		return false;
	}

	updateCounter()
	{
		let counterValue = 0;
		[...this.container
			.parentNode
			.querySelector(`[data-group-id="${this.getId()}"]`)
			.querySelectorAll(`.${Counter.BaseClassname}`)]
			.forEach((node) => {
				const counter = Counter.initFromCounterNode(node);
				counterValue += counter.getRealValue();
			});

		Counter.updateCounterNodeValue(
			this.container.querySelector(`.${Counter.BaseClassname}`),
			counterValue,
		);

		if (counterValue > 0)
		{
			Dom.addClass(this.container, 'menu-item-with-index');
		}
		else
		{
			Dom.removeClass(this.container, 'menu-item-with-index');
		}

		const isCollapsed = this.container.getAttribute('data-collapse-mode') === 'collapsed';
		const linkNode = this.container.querySelector('.menu-item-link');

		Dom.attr(linkNode, 'aria-label', this.constructor.getItemAriaLabel(
			this.getName(),
			isCollapsed ? counterValue : 0,
		));
	}

	markAsActive()
	{
		this.container.setAttribute('data-contains-active-item', 'Y');
		if (this.container.getAttribute('data-collapse-mode') === 'collapsed')
			Dom.addClass(this.container, 'menu-item-active');
	}

	markAsInactive()
	{
		this.container.removeAttribute('data-contains-active-item');
		Dom.removeClass(this.container, 'menu-item-active');
	}

	isActive()
	{
		return this.container.getAttribute('data-contains-active-item') === 'Y';
	}

	static detect(node)
	{
		return node.getAttribute("data-role") === 'group' &&
			node.getAttribute("data-type") === this.code;
	}
}

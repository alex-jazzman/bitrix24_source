import { Dom, Type } from 'main.core';

import { createSVG } from '../svg';
import { createCssTooltip } from './helpers/create-css-tooltip';
import { guardedClick } from './helpers/guarded-click';
import { panelTestId } from './helpers/test-id';

export class DeviceButton
{
	constructor(config)
	{
		this.class = config.class;
		// the panel the button belongs to names the hook namespace; the button itself does not know it
		this.testId = panelTestId(this.class, config.testIdPrefix);
		this.text = config.text;

		this.enabled = (config.enabled === true);
		this.arrowHidden = (config.arrowHidden === true);
		this.blocked = (config.blocked === true);

		this.tooltip = createCssTooltip(Type.isPlainObject(config.tooltip) ? config.tooltip : {});

		this.backgroundClass = config.backgroundClass ?? '';

		this.showLevel = (config.showLevel === true);
		this.level = config.level || 0;

		this.sideIcon = config.sideIcon ?? '';

		// accessible name for the main toggle; a button with a visible caption must not pass this (WCAG 2.5.3)
		this.ariaLabel = config.ariaLabel ?? '';
		// accessible name for the device selection arrow button (icon-only, no visible text)
		this.arrowAriaLabel = config.arrowAriaLabel ?? '';
		// disclosure semantics for the arrow: it opens the DeviceSelector popup
		this.arrowHasPopup = config.arrowHasPopup ?? '';

		this.elements = {
			root: null,
			button: null,
			iconContainer: null,
			icon: null,
			arrow: null,
			levelMeter: null,
			pointer: null,
			ellipsis: null,
		};

		// only the main toggle is click-guarded: the arrow opens the device selector,
		// which stays available while broadcasting is forbidden
		this.callbacks = {
			onClick: guardedClick(this, Type.isFunction(config.onClick) ? config.onClick : () => {}),
			onArrowClick: Type.isFunction(config.onArrowClick) ? config.onArrowClick : () => {},
			onSideIconClick: Type.isFunction(config.onSideIconClick) ? config.onSideIconClick : () => {},
		};
	}

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		const {
			tooltipClass, tooltipStyle, tooltipText,
		} = this.tooltip;

		this.elements.arrow = this.buildArrow();

		// main toggle: its accessible name comes from the visible caption, or from ariaLabel where
		// the caption is dropped, so glyphs are aria-hidden.
		// DeviceButton is only used for microphone/camera device toggles, hence role="switch" is unconditional.
		this.elements.button = Dom.create('button', {
			props: {
				type: 'button',
				className: 'bx-messenger-videocall-panel-item-with-arrow-main',
			},
			attrs: {
				role: 'switch',
				'aria-checked': this.enabled ? 'true' : 'false',
				'data-testid': this.testId,
			},
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-panel-item-with-arrow-left' },
					children: [
						this.elements.iconContainer = Dom.create('div', {
							props: { className: this.getIconContainerClass() },
							children: [
								this.elements.icon = Dom.create('div', {
									props: { className: this.getIconClass() },
									attrs: { 'aria-hidden': 'true' },
								}),
							],
						}),
					],
				}),
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-panel-text' },
					attrs: { 'data-testid': `${this.testId}-text` },
					children: [
						Dom.create('div', {
							props: { className: 'bx-messenger-videocall-panel-text-content' },
							text: this.text,
						}),
					],
				}),
			],
			events: {
				click: this.callbacks.onClick,
			},
		});

		// root is a non-interactive container hosting two sibling buttons (no button-in-button)
		this.elements.root = Dom.create('div', {
			props: {
				id: `bx-messenger-videocall-panel-item-with-arrow-${
					this.class}`,
				className: `bx-messenger-videocall-panel-item-with-arrow ${tooltipText ? tooltipClass : ''}${
					this.blocked ? ' blocked' : ''}`,
			},
			attrs: {
				style: tooltipStyle,
				// the id above repeats across panels; the hook is the only locator unique per panel
				'data-testid': `${this.testId}-container`,
			},
			children: [
				this.elements.button,
				...(this.arrowHidden ? [] : [this.elements.arrow]),
			],
		});

		if (this.blocked)
		{
			this.elements.button.setAttribute('aria-disabled', 'true');
		}

		if (this.ariaLabel)
		{
			this.elements.button.setAttribute('aria-label', this.ariaLabel);
		}

		this.appendLevelMeter();

		this.elements.ellipsis = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-panel-icon-ellipsis' },
			attrs: { 'aria-hidden': 'true', 'data-testid': `${this.testId}-ellipsis` },
			events: {
				click: this.callbacks.onSideIconClick,
			},
		});

		this.elements.pointer = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-panel-icon-pointer' },
			attrs: { 'aria-hidden': 'true', 'data-testid': `${this.testId}-pointer` },
			events: {
				click: this.callbacks.onSideIconClick,
			},
		});

		if (this.sideIcon === 'pointer')
		{
			BX.Dom.insertAfter(this.elements.pointer, this.elements.icon);
		}
		else if (this.sideIcon === 'ellipsis')
		{
			BX.Dom.insertAfter(this.elements.ellipsis, this.elements.icon);
		}

		return this.elements.root;
	}

	buildArrow()
	{
		// device selector opener: sibling <button>, does not toggle the device
		const arrow = Dom.create('button', {
			props: {
				type: 'button',
				className: 'bx-messenger-videocall-panel-item-with-arrow-right',
			},
			attrs: {
				'data-testid': `${this.testId}-arrow`,
			},
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-panel-item-with-arrow-right-icon' },
					attrs: { 'aria-hidden': 'true' },
				}),
			],
			events: {
				click: function(...args)
				{
					const [e] = args;
					Dom.addClass(this.elements.arrow, 'rotate');
					this.callbacks.onArrowClick.apply(this, args);
					// keep the click from reaching the view body handler (onBodyClick)
					e.stopPropagation();
				}.bind(this),
			},
		});

		if (this.arrowAriaLabel)
		{
			arrow.setAttribute('aria-label', this.arrowAriaLabel);
		}

		if (this.arrowHasPopup)
		{
			arrow.setAttribute('aria-haspopup', this.arrowHasPopup);
			arrow.setAttribute('aria-expanded', 'false');
		}

		return arrow;
	}

	appendLevelMeter()
	{
		if (!this.showLevel)
		{
			return;
		}

		Dom.append(createSVG('svg', {
			attrNS: {
				class: 'bx-messenger-videocall-panel-item-level-meter-container',
				'aria-hidden': 'true',
				width: '28',
				height: '28',
				viewBox: '0 0 28 28',
				fill: 'none',
			},
			children: [
				createSVG('defs', {
					children: [
						createSVG('linearGradient', {
							attrNS: {
								id: 'volumeGradient',
								x1: '0%',
								y1: '100%',
								x2: '0%',
								y2: '0%',
							},
							children: [
								this.elements.gradientStop1 = createSVG('stop', {
									attrNS: {
										offset: '0',
										id: 'gradientStop1',
									},
								}),
								this.elements.gradientStop2 = createSVG('stop', {
									attrNS: {
										offset: '0',
										'stop-color': 'transparent',
										id: 'gradientStop2',
									},
								}),
							],
						}),
					],
				}),
				createSVG('path', {
					attrNS: {
						'fill-rule': 'evenodd',
						'clip-rule': 'evenodd',
						d: 'M7.01843 12.8394C7.46936 12.8492 7.82709 13.2234 7.81726 13.6743C7.76065 16.2837 9.9066 19.8267 13.9882 19.8267C18.0865 19.8265 20.3038 16.2334 20.1805 13.6987C20.1586 13.2483 20.5056 12.8654 20.9559 12.8433C21.4064 12.8213 21.7894 13.1682 21.8114 13.6187C21.9638 16.7444 19.4696 20.9702 14.8124 21.4204V23.1763H16.7714C17.2222 23.1765 17.5878 23.5427 17.5878 23.9937C17.5875 24.4443 17.2221 24.8099 16.7714 24.8101H11.2206C10.7699 24.8098 10.4044 24.4443 10.4042 23.9937C10.4042 23.5428 10.7698 23.1765 11.2206 23.1763H13.1796V21.4224C8.50848 20.9829 6.11622 16.768 6.18445 13.6382C6.1943 13.1874 6.56769 12.8297 7.01843 12.8394ZM13.9921 3.30518C16.1622 3.30518 17.9218 5.06469 17.9218 7.23486V13.5396C17.9218 15.7097 16.1622 17.4692 13.9921 17.4692C11.8221 17.469 10.0634 15.7096 10.0634 13.5396V7.23486C10.0634 5.06481 11.8221 3.30537 13.9921 3.30518ZM13.9921 4.93896C12.7241 4.93916 11.6962 5.96687 11.6962 7.23486V13.5396C11.6962 14.8075 12.7241 15.8353 13.9921 15.8354C15.2602 15.8354 16.2889 14.8077 16.2889 13.5396V7.23486C16.2889 5.96676 15.2602 4.93896 13.9921 4.93896Z',
						fill: 'url(#volumeGradient)',
					},
				}),
			],
		}), this.elements.icon);
	}

	getIconClass()
	{
		return `bx-messenger-videocall-panel-item-with-arrow-icon bx-messenger-videocall-panel-item-with-arrow-icon-${this.class}${this.enabled ? '' : '-off'}`;
	}

	getIconContainerClass()
	{
		const off = this.enabled ? '' : '-off';
		const arrowHidden = this.arrowHidden ? ' bx-messenger-videocall-panel-item-with-arrow-icon-container-arrow-hidden' : '';
		const background = this.backgroundClass ? ` ${this.backgroundClass}` : '';

		return `bx-messenger-videocall-panel-item-with-arrow-icon-container bx-messenger-videocall-panel-item-with-arrow-icon-container-${this.class}${off}${arrowHidden}${background}`;
	}

	enable()
	{
		if (this.enabled)
		{
			return;
		}
		this.enabled = true;
		this.refreshIconState();
	}

	disable()
	{
		if (!this.enabled)
		{
			return;
		}
		this.enabled = false;
		this.refreshIconState();
	}

	refreshIconState()
	{
		this.elements.iconContainer.className = this.getIconContainerClass();
		this.elements.icon.className = this.getIconClass();
		// single sync point for both enable() and disable(): state arrives async, not on click
		this.elements.button.setAttribute('aria-checked', this.enabled ? 'true' : 'false');

		if (this.elements.gradientStop1 && this.elements.gradientStop2)
		{
			this.elements.gradientStop1.setAttribute('offset', '0%');
			this.elements.gradientStop2.setAttribute('offset', '0%');
		}
		else if (this.elements.levelMeter)
		{
			this.elements.levelMeter.setAttribute('y', Math.round((1 - this.level) * 20));
		}

		this.syncTooltip();
	}

	/**
	 * The plate is drawn by the class and filled by the variable, so both follow the text: a tooltip
	 * whose text depends on the state of the button says nothing in some of them, and an empty string
	 * still hovers as a blank plate.
	 */
	syncTooltip()
	{
		const {
			hasTooltip, getTooltipText, tooltipTextVarName, tooltipClass,
		} = this.tooltip;

		if (!hasTooltip)
		{
			return;
		}

		const tooltipText = getTooltipText();

		Dom.style(this.elements.root, tooltipTextVarName, `'${tooltipText}'`);

		if (tooltipText)
		{
			Dom.addClass(this.elements.root, tooltipClass);
		}
		else
		{
			Dom.removeClass(this.elements.root, tooltipClass);
		}
	}

	setBlocked(blocked)
	{
		if (this.blocked === blocked)
		{
			return;
		}

		this.blocked = blocked;
		this.elements.iconContainer.className = this.getIconContainerClass();
		this.elements.icon.className = this.getIconClass();
		if (this.blocked)
		{
			Dom.addClass(this.elements.root, 'blocked');
			this.elements.button.setAttribute('aria-disabled', 'true');
		}
		else
		{
			Dom.removeClass(this.elements.root, 'blocked');
			this.elements.button.removeAttribute('aria-disabled');
		}
	}

	setSideIcon(sideIcon)
	{
		if (this.sideIcon === sideIcon)
		{
			return;
		}
		this.sideIcon = sideIcon;

		BX.Dom.remove(this.elements.pointer);
		BX.Dom.remove(this.elements.ellipsis);

		if (this.sideIcon === 'pointer')
		{
			BX.Dom.insertAfter(this.elements.pointer, this.elements.icon);
		}
		else if (this.sideIcon === 'ellipsis')
		{
			BX.Dom.insertAfter(this.elements.ellipsis, this.elements.icon);
		}
	}

	showArrow()
	{
		if (!this.arrowHidden)
		{
			return;
		}
		this.arrowHidden = false;

		this.elements.iconContainer.className = this.getIconContainerClass();

		if (!this.elements.arrow.parentElement)
		{
			Dom.append(this.elements.arrow, this.elements.root);
		}
	}

	hideArrow()
	{
		if (this.arrowHidden)
		{
			return;
		}
		this.arrowHidden = true;

		this.elements.iconContainer.className = this.getIconContainerClass();

		if (this.elements.arrow.parentElement)
		{
			Dom.remove(this.elements.arrow);
		}
	}

	setLevel(level)
	{
		this.level = level > 0 ? Math.max(0, Math.min(1, Math.log(level * 100) / 4.6)) : 0;
		if (this.showLevel && this.enabled)
		{
			const offset = `${100 - Math.round((1 - this.level) * 100)}%`;
			this.elements.gradientStop1.setAttribute('offset', offset);
			this.elements.gradientStop2.setAttribute('offset', offset);
		}
	}
}

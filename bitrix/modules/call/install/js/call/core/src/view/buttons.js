import { Dom, Text, Type } from 'main.core';

import Util from '../util';
import { createSVG } from './svg';
import { CallCommonRecordState } from '../call_common_record';



const createCssTooltip = (options = {}) => {
	const {
		width: tooltipWidth = 'max-content',
		position: tooltipPosition = 'top',
		getText: getTooltipText = () => ''
	} = options;

	const hasTooltip = Boolean(Object.keys(options).length);
	const tooltipText = getTooltipText();
	const tooltipPositionClass = tooltipPosition === 'bottom' ? '-bottom' : '-top';
	const tooltipClass = `bx-videocall-tooltip ${tooltipPositionClass}`;
	const tooltipTextVarName = '--data-tooltip-text';

	return {
		hasTooltip,
		tooltipClass: hasTooltip ? tooltipClass : '',
		tooltipText,
		tooltipStyle: `--data-tooltip-width:${tooltipWidth}; ${tooltipTextVarName}:'${tooltipText}'`,
		getTooltipText,
		tooltipTextVarName,
	}
}
export class TitleButton
{
	constructor(config)
	{
		this.elements = {
			root: null
		};

		this.text = Type.isStringFilled(config.text) ? config.text : '';
		this.isGroupCall = config.isGroupCall;
	};

	render()
	{
		this.elements.root = Dom.create("div", {
			props: {className: "bx-messenger-videocall-panel-title"},
			html: this.getTitle()
		});

		return this.elements.root;
	};

	getTitle()
	{
		const prettyName = '<span class="bx-messenger-videocall-panel-title-name">' + Text.encode(this.text) + '</span>';

		if (this.isGroupCall)
		{
			return BX.message("IM_M_GROUP_CALL_WITH").replace("#CHAT_NAME#", prettyName);
		}
		else
		{
			return BX.message("IM_M_CALL_WITH").replace("#USER_NAME#", prettyName);
		}
	};

	update(config)
	{
		this.text = Type.isStringFilled(config.text) ? config.text : '';
		this.isGroupCall = config.isGroupCall;
		this.elements.root.innerHTML = this.getTitle();
	}
}

export class SimpleButton
{
	constructor(config)
	{
		this.class = config.class;
		this.backgroundClass = BX.prop.getString(config, "backgroundClass", "");
		this.backgroundClass = "bx-messenger-videocall-panel-icon-background" + (this.backgroundClass ? " " : "") + this.backgroundClass;
		this.blocked = config.blocked === true;

		this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));

		this.text = BX.prop.getString(config, "text", "");
		this.isActive = false;
		this.counter = BX.prop.getInteger(config, "counter", 0);
		this.isComingSoon = config.isComingSoon || false;

		this.elements = {
			root: null,
			counter: null,
			comingSoon: null,
		};

		this.callbacks = {
			onClick: BX.prop.getFunction(config, "onClick", BX.DoNothing),
		}
	};

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		let textNode;
		if (this.text !== '')
		{
			textNode = Dom.create('div', {
				props: { className: 'bx-messenger-videocall-panel-text' },
				text: this.text,
				children: [
					Dom.create('div', {
						props: { className: 'bx-messenger-videocall-panel-text-content' },
						text: this.text,
					}),
				],
			});
		}
		else
		{
			textNode = null;
		}

		const {
			tooltipClass, tooltipStyle,
		} = this.tooltip;

		this.elements.root = Dom.create('div', {
			props: {
				className: `bx-messenger-videocall-panel-item ${tooltipClass}${
					this.blocked ? ' blocked' : ''}${
					this.isComingSoon ? ' coming-soon' : ''}`,
			},
			attrs: {
				style: tooltipStyle,
			},
			children: [
				Dom.create('div', {
					props: { className: this.backgroundClass },
					children: [
						Dom.create('div', {
							props: {
								className: `bx-messenger-videocall-panel-icon bx-messenger-videocall-panel-icon-${
									this.class}`,
							},
						}),
						this.elements.counter = Dom.create('span', {
							props: { className: 'bx-messenger-videocall-panel-item-counter' },
							text: 0,
							dataset: {
								counter: 0,
								counterType: 'digits',
							},
						}),
						this.elements.comingSoon = Dom.create('span', {
							props: { className: 'bx-messenger-videocall-panel-item-coming-soon' },
							text: BX.message('CALL_FEATURES_COMING_SOON_MSGVER_1'),
							dataset: {
								visible: this.isComingSoon ? 'Y' : 'N',
							},
						}),
					],
				}),
				textNode,
			],
			events: {
				click: this.callbacks.onClick,
			},
		});

		if (this.isActive)
		{
			this.elements.root.classList.add("active");
		}

		return this.elements.root;
	};

	setActive(isActive)
	{
		if (this.isActive == isActive)
		{
			return;
		}
		this.isActive = isActive;
		if (!this.elements.root)
		{
			return;
		}
		if (this.isActive)
		{
			this.elements.root.classList.add("active");
		}
		else
		{
			this.elements.root.classList.remove("active");
		}

		const {
			hasTooltip, getTooltipText, tooltipTextVarName,
		} = this.tooltip;

		hasTooltip && this.elements.root.style.setProperty(tooltipTextVarName, `'${getTooltipText()}'`);

	};

	setBlocked(isBlocked)
	{
		if (this.blocked == isBlocked)
		{
			return;
		}

		this.blocked = isBlocked;
		if (this.blocked)
		{
			this.elements.root.classList.add("blocked");
		}
		else
		{
			this.elements.root.classList.remove("blocked");
		}
	};

	setCounter(counter)
	{
		this.counter = parseInt(counter, 10);

		if (Number.isNaN(this.counter))
		{
			this.counter = 0;
			this.elements.counter.dataset.counter = 0;
			this.elements.counter.dataset.counterType = 'digits';
			this.elements.counter.innerText = 0;

			return;
		}

		let counterLabel = this.counter;
		const counterData = counterLabel;

		if (counterLabel > 99)
		{
			counterLabel = '99+';
		}

		let counterType = 'digits';
		if (counterLabel.toString().length === 2)
		{
			counterType = 'dozens';
		}
		else if (counterLabel.toString().length > 2)
		{
			counterType = 'hundreds';
		}

		this.elements.counter.dataset.counter = counterData;
		this.elements.counter.dataset.counterType = counterType;
		this.elements.counter.innerText = counterLabel;
	};

	setIsComingSoon(isActive)
	{
		this.isComingSoon = isActive;

		this.isComingSoon
			? this.elements.comingSoon.dataset.visible = 'Y'
			: this.elements.comingSoon.dataset.visible = 'N';

		if (this.isComingSoon)
		{
			this.elements.root?.classList.add('coming-soon');
		}
		else
		{
			this.elements.root?.classList.remove('coming-soon');
		}
	}
}

export class DeviceButton
{
	constructor(config)
	{
		this.class = config.class;
		this.text = config.text;

		this.enabled = (config.enabled === true);
		this.arrowEnabled = (config.arrowEnabled === true);
		this.arrowHidden = (config.arrowHidden === true);
		this.blocked = (config.blocked === true);

		this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));

		this.backgroundClass = BX.prop.getString(config, "backgroundClass", "");

		this.showLevel = (config.showLevel === true);
		this.level = config.level || 0;

		this.sideIcon = BX.prop.getString(config, "sideIcon", "");

		this.elements = {
			root: null,
			iconContainer: null,
			icon: null,
			arrow: null,
			levelMeter: null,
			pointer: null,
			ellipsis: null,
		};

		this.callbacks = {
			onClick: BX.prop.getFunction(config, "onClick", BX.DoNothing),
			onArrowClick: BX.prop.getFunction(config, "onArrowClick", BX.DoNothing),
			onSideIconClick: BX.prop.getFunction(config, "onSideIconClick", BX.DoNothing),
		}
	};

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		const {
			tooltipClass, tooltipStyle,
		} = this.tooltip;

		this.elements.arrow = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-panel-item-with-arrow-right' },
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-panel-item-with-arrow-right-icon' },
				}),
			],
			events: {
				click: function(e)
				{
					this.elements.arrow?.classList.add('rotate');
					this.callbacks.onArrowClick.apply(this, arguments);
					e.stopPropagation();
				}.bind(this),
			},
		});

		this.elements.root = Dom.create('div', {
			props: {
				id: `bx-messenger-videocall-panel-item-with-arrow-${
					this.class}`,
				className: `bx-messenger-videocall-panel-item-with-arrow ${tooltipClass}${
					this.blocked ? ' blocked' : ''}`,
			},
			attrs: {
				style: tooltipStyle,
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
								}),
							],
						}),
						...(this.arrowHidden ? [] : [this.elements.arrow]),
					],
				}),
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-panel-text' },
					text: this.text,
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

		if (this.showLevel)
		{
			this.elements.icon.appendChild(createSVG("svg", {
				attrNS: {
					class: "bx-messenger-videocall-panel-item-level-meter-container",
					width: "28",
					height: "28",
					viewBox: "0 0 28 28",
					fill: "none",
				},
				children: [
					createSVG("defs", {
						children: [
							createSVG("linearGradient", {
								attrNS: {
									id: "volumeGradient",
									x1: "0%",
									y1: "100%",
									x2: "0%",
									y2: "0%"
								},
								children: [
									this.elements.gradientStop1 = createSVG("stop", {
										attrNS: {
											offset: "0",
											id: "gradientStop1"
										}
									}),
									this.elements.gradientStop2 = createSVG("stop", {
										attrNS: {
											offset: "0",
											"stop-color": "transparent",
											id: "gradientStop2"
										}
									})
								]
							})
						]
					}),
					createSVG("path", {
						attrNS: {
							"fill-rule": "evenodd",
							"clip-rule": "evenodd",
							d: 'M7.01843 12.8394C7.46936 12.8492 7.82709 13.2234 7.81726 13.6743C7.76065 16.2837 9.9066 19.8267 13.9882 19.8267C18.0865 19.8265 20.3038 16.2334 20.1805 13.6987C20.1586 13.2483 20.5056 12.8654 20.9559 12.8433C21.4064 12.8213 21.7894 13.1682 21.8114 13.6187C21.9638 16.7444 19.4696 20.9702 14.8124 21.4204V23.1763H16.7714C17.2222 23.1765 17.5878 23.5427 17.5878 23.9937C17.5875 24.4443 17.2221 24.8099 16.7714 24.8101H11.2206C10.7699 24.8098 10.4044 24.4443 10.4042 23.9937C10.4042 23.5428 10.7698 23.1765 11.2206 23.1763H13.1796V21.4224C8.50848 20.9829 6.11622 16.768 6.18445 13.6382C6.1943 13.1874 6.56769 12.8297 7.01843 12.8394ZM13.9921 3.30518C16.1622 3.30518 17.9218 5.06469 17.9218 7.23486V13.5396C17.9218 15.7097 16.1622 17.4692 13.9921 17.4692C11.8221 17.469 10.0634 15.7096 10.0634 13.5396V7.23486C10.0634 5.06481 11.8221 3.30537 13.9921 3.30518ZM13.9921 4.93896C12.7241 4.93916 11.6962 5.96687 11.6962 7.23486V13.5396C11.6962 14.8075 12.7241 15.8353 13.9921 15.8354C15.2602 15.8354 16.2889 14.8077 16.2889 13.5396V7.23486C16.2889 5.96676 15.2602 4.93896 13.9921 4.93896Z',
							fill: "url(#volumeGradient)"
						}
					})
				]
			}));
		}

		this.elements.ellipsis = Dom.create("div", {
			props: {className: "bx-messenger-videocall-panel-icon-ellipsis"},
			events: {
				click: this.callbacks.onSideIconClick
			}
		})

		this.elements.pointer = Dom.create("div", {
			props: {className: "bx-messenger-videocall-panel-icon-pointer"},
			events: {
				click: this.callbacks.onSideIconClick
			}
		})

		if (this.sideIcon == "pointer")
		{
			BX.Dom.insertAfter(this.elements.pointer, this.elements.icon);
		}
		else if (this.sideIcon == "ellipsis")
		{
			BX.Dom.insertAfter(this.elements.ellipsis, this.elements.icon);
		}

		return this.elements.root;
	};

	getIconClass()
	{
		return "bx-messenger-videocall-panel-item-with-arrow-icon bx-messenger-videocall-panel-item-with-arrow-icon-" + this.class + (this.enabled ? "" : "-off");
	};

	getIconContainerClass()
	{
		return "bx-messenger-videocall-panel-item-with-arrow-icon-container" + " bx-messenger-videocall-panel-item-with-arrow-icon-container-" + this.class + (this.enabled ? "" : "-off") + (this.arrowHidden ? " bx-messenger-videocall-panel-item-with-arrow-icon-container-arrow-hidden" : "") + (this.backgroundClass ? ` ${this.backgroundClass}` : "");
	};

	enable()
	{
		if (this.enabled)
		{
			return;
		}
		this.enabled = true;
		this.elements.iconContainer.className = this.getIconContainerClass();
		this.elements.icon.className = this.getIconClass();

		if (this.elements.gradientStop1 && this.elements.gradientStop2)
		{
			this.elements.gradientStop1.setAttribute('offset', '0%');
			this.elements.gradientStop2.setAttribute('offset', '0%');
		}
		else if (this.elements.levelMeter)
		{
			this.elements.levelMeter.setAttribute('y', Math.round((1 - this.level) * 20));
		}

		const {
			hasTooltip, getTooltipText, tooltipTextVarName,
		} = this.tooltip;

		hasTooltip && this.elements.root.style.setProperty(tooltipTextVarName, `'${getTooltipText()}'`);
	};

	disable()
	{
		if (!this.enabled)
		{
			return;
		}
		this.enabled = false;
		this.elements.iconContainer.className = this.getIconContainerClass();
		this.elements.icon.className = this.getIconClass();

		if (this.elements.gradientStop1 && this.elements.gradientStop2)
		{
			this.elements.gradientStop1.setAttribute('offset', '0%');
			this.elements.gradientStop2.setAttribute('offset', '0%');
		}
		else if (this.elements.levelMeter)
		{
			this.elements.levelMeter.setAttribute('y', Math.round((1 - this.level) * 20));
		}

		const {
			hasTooltip, getTooltipText, tooltipTextVarName,
		} = this.tooltip;

		hasTooltip && this.elements.root.style.setProperty(tooltipTextVarName, `'${getTooltipText()}'`);
	};

	setBlocked(blocked)
	{
		if (this.blocked == blocked)
		{
			return;
		}

		this.blocked = blocked;
		this.elements.iconContainer.className = this.getIconContainerClass();
		this.elements.icon.className = this.getIconClass();
		if (this.blocked)
		{
			this.elements.root.classList.add("blocked");
		}
		else
		{
			this.elements.root.classList.remove("blocked");
		}
	};

	setSideIcon(sideIcon)
	{
		if (this.sideIcon == sideIcon)
		{
			return;
		}
		this.sideIcon = sideIcon;

		BX.Dom.remove(this.elements.pointer);
		BX.Dom.remove(this.elements.ellipsis);

		if (this.sideIcon == "pointer")
		{
			BX.Dom.insertAfter(this.elements.pointer, this.elements.icon);
		}
		else if (this.sideIcon == "ellipsis")
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

		if (!this.elements.root.querySelector('.bx-messenger-videocall-panel-item-with-arrow-right-icon'))
		{
			this.elements.root.children[0].appendChild(this.elements.arrow);
		}
	};

	hideArrow()
	{
		if (this.arrowHidden)
		{
			return;
		}
		this.arrowHidden = true;

		this.elements.iconContainer.className = this.getIconContainerClass();

		if (this.elements.root.querySelector('.bx-messenger-videocall-panel-item-with-arrow-right-icon'))
		{
			this.elements.root.children[0].removeChild(this.elements.arrow);
		}
	};

	setLevel(level)
	{
		this.level = Math.log(level * 100) / 4.6;
		if (this.showLevel && this.enabled)
		{
			const offset = `${100 - Math.round((1 - this.level) * 100)}%`;
			this.elements.gradientStop1.setAttribute('offset', offset);
			this.elements.gradientStop2.setAttribute('offset', offset);
		}
	}
}

export class WaterMarkButton
{
	constructor(config)
	{
		this.language = config.language;
		this.elements = {
			root: null,
		};
	}

	render(): HTMLElement
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		this.elements.root = Dom.create('div', {
			props: { className: 'bx-messenger-videocall-watermark' },
			children: [
				Dom.create('img', {
					props: {
						className: 'bx-messenger-videocall-watermark-img',
						src: this.getWatermarkUrl(this.language),
					},
				}),
			],
		});

		return this.elements.root;
	}

	getWatermarkUrl(language)
	{
		switch (language)
		{
			case 'ru':
			case 'kz':
			case 'by':
				return '/bitrix/js/call/images/new-logo-white-ru.svg';
			default:
				return '/bitrix/js/call/images/new-logo-white-en.svg';
		}
	};
}

export class TopButton
{
	constructor(config)
	{
		this.iconClass = BX.prop.getString(config, 'iconClass', '');
		this.text = BX.prop.getString(config, 'text', '');
		this.elements = {
			root: null,
			icon: null,
			text: null,
		};
		this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));

		this.callbacks = {
			onClick: BX.prop.getFunction(config, 'onClick', BX.DoNothing),
		};
	}

	render(): HTMLElement
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		const {
			tooltipClass, tooltipStyle,
		} = this.tooltip;

		this.elements.root = Dom.create('div', {
			props: { className: `bx-messenger-videocall-top-button ${tooltipClass}` },
			attrs: {
				style: tooltipStyle,
			},
			children: [
				this.elements.icon = Dom.create('div', {
					props: { className: `bx-messenger-videocall-top-button-icon ${this.iconClass}` },
				}),
				this.elements.text = Dom.create('div', {
					props: { className: `bx-messenger-videocall-top-button-text ${this.iconClass}` },
					text: this.text,
				}),
			],
			events: {
				click: this.callbacks.onClick,
			},
		});

		return this.elements.root;
	}

	update(config)
	{
		const iconClass = BX.prop.getString(config, 'iconClass', this.iconClass);
		const text = BX.prop.getString(config, 'text', this.text);

		if (this.iconClass !== iconClass)
		{
			this.iconClass = iconClass;
			this.elements.icon.className = `bx-messenger-videocall-top-button-icon ${this.iconClass}`;
		}

		if (this.text !== text)
		{
			this.text = text;
			this.elements.text.innerText = this.text;
			this.elements.text.className = `bx-messenger-videocall-top-button-text ${this.iconClass}`;
		}
	}

	setBlocked(isBlocked)
	{
		if (this.blocked === isBlocked)
		{
			return;
		}

		this.blocked = isBlocked;
		if (this.blocked)
		{
			Dom.addClass(this.elements.root, 'blocked');
		}
		else
		{
			Dom.removeClass(this.elements.root, 'blocked');
		}
	}
}

export class TopFramelessButton
{
	constructor(config)
	{
		this.iconClass = BX.prop.getString(config, 'iconClass', '');
		this.textClass = BX.prop.getString(config, 'textClass', '');
		this.text = BX.prop.getString(config, 'text', '');
		this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));

		this.elements = {
			root: null,
		};

		this.callbacks = {
			onClick: BX.prop.getFunction(config, 'onClick', BX.DoNothing),
		};
	}

	render(): HTMLElement
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		const {
			tooltipClass, tooltipStyle,
		} = this.tooltip;

		this.elements.root = Dom.create('div', {
			props: { className: `bx-messenger-videocall-top-button-frameless ${tooltipClass}` },
			attrs: {
				style: tooltipStyle,
			},
			children: [
				Dom.create('div', {
					props: { className: `bx-messenger-videocall-top-button-icon ${this.iconClass}` },
				}),
				(this.text === ''
						? null
						: Dom.create('div', {
							props: { className: `bx-messenger-videocall-top-button-text ${this.textClass}` },
							text: this.text,
						})
				),
			],
			events: {
				click: this.callbacks.onClick,
			},
		});

		return this.elements.root;
	}
}

export class ParticipantsButton
{
	constructor(config)
	{
		this.count = BX.prop.getInteger(config, "count", 0);
		this.foldButtonState = BX.prop.getString(config, "foldButtonState", ParticipantsButton.FoldButtonState.Hidden);
		this.allowAdding = BX.prop.getBoolean(config, "allowAdding", false);

		this.elements = {
			root: null,
			leftContainer: null,
			rightContainer: null,
			foldIcon: null,
			count: null,
			separator: null
		};

		this.callbacks = {
			onListClick: BX.prop.getFunction(config, "onListClick", BX.DoNothing),
			onAddClick: BX.prop.getFunction(config, "onAddClick", BX.DoNothing)
		}
	};

	static FoldButtonState = {
		Active: "active",
		Fold: "fold",
		Unfold: "unfold",
		Hidden: "hidden"
	};

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}
		this.elements.root = Dom.create("div", {
			props: {className: "bx-messenger-videocall-top-participants"},
			children: [
				this.elements.leftContainer = Dom.create("div", {
					props: {className: "bx-messenger-videocall-top-participants-inner left" + (this.foldButtonState != ParticipantsButton.FoldButtonState.Hidden ? " active" : "")},
					children: [
						Dom.create("div", {
							props: {className: "bx-messenger-videocall-top-button-icon participants"}
						}),
						this.elements.count = Dom.create("div", {
							props: {className: "bx-messenger-videocall-top-participants-text-count"},
							text: this.count
						}),
						this.elements.foldIcon = Dom.create("div", {
							props: {className: "bx-messenger-videocall-top-participants-fold-icon " + this.foldButtonState},
						})
					],
					events: {
						click: this.callbacks.onListClick
					}
				}),

			]
		});

		this.elements.separator = Dom.create("div", {
			props: {className: "bx-messenger-videocall-top-participants-separator"}
		});
		this.elements.rightContainer = Dom.create("div", {
			props: {className: "bx-messenger-videocall-top-participants-inner active"},
			children: [
				Dom.create("div", {
					props: {className: "bx-messenger-videocall-top-participants-text"},
					text: BX.message("IM_M_CALL_BTN_ADD")
				}),
				Dom.create("div", {
					props: {className: "bx-messenger-videocall-top-button-icon add"}
				}),
			],
			events: {
				click: this.callbacks.onAddClick
			}
		});

		if (this.allowAdding)
		{
			this.elements.root.appendChild(this.elements.separator);
			this.elements.root.appendChild(this.elements.rightContainer);
		}
		return this.elements.root;
	};

	update(config)
	{
		this.count = BX.prop.getInteger(config, "count", this.count);
		this.foldButtonState = BX.prop.getString(config, "foldButtonState", this.foldButtonState);
		this.allowAdding = BX.prop.getBoolean(config, "allowAdding", this.allowAdding);

		this.elements.count.innerText = this.count;

		this.elements.foldIcon.className = "bx-messenger-videocall-top-participants-fold-icon " + this.foldButtonState;
		if (this.foldButtonState == ParticipantsButton.FoldButtonState.Hidden)
		{
			this.elements.leftContainer.classList.remove("active");
		}
		else
		{
			this.elements.leftContainer.classList.add("active");
		}

		if (this.allowAdding && !this.elements.separator.parentElement)
		{
			this.elements.root.appendChild(this.elements.separator);
			this.elements.root.appendChild(this.elements.rightContainer);
		}
		if (!this.allowAdding && this.elements.separator.parentElement)
		{
			BX.remove(this.elements.separator);
			BX.remove(this.elements.rightContainer);
		}
	};

	setBlocked(isBlocked)
	{
		if (this.blocked == isBlocked)
		{
			return;
		}

		this.blocked = isBlocked;
		if (this.blocked)
		{
			Dom.addClass(this.elements.root, 'blocked');
		}
		else
		{
			Dom.removeClass(this.elements.root, 'blocked');
		}
	}
}

export class ParticipantsButtonMobile
{
	constructor(config)
	{
		this.count = BX.prop.getInteger(config, "count", 0);
		this.elements = {
			root: null,
			icon: null,
			text: null,
			arrow: null
		};

		this.callbacks = {
			onClick: BX.prop.getFunction(config, "onClick", BX.DoNothing),
		}
	};

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		this.elements.root = Dom.create("div", {
			props: {
				className: "bx-messenger-videocall-top-participants-mobile"
			},
			children: [
				this.elements.icon = Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-top-participants-mobile-icon"
					}
				}),
				this.elements.text = Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-top-participants-mobile-text"
					},
					text: BX.message("IM_M_CALL_PARTICIPANTS").replace("#COUNT#", this.count)
				}),
				this.elements.arrow = Dom.create("div", {
					props: {
						className: "bx-messenger-videocall-top-participants-mobile-arrow"
					}
				}),
			],
			events: {
				click: this.callbacks.onClick
			}
		});

		return this.elements.root;
	};

	setCount(count)
	{
		if (this.count == count || !this.elements.text)
		{
			return;
		}
		this.count = count;
		this.elements.text.innerText = BX.message("IM_M_CALL_PARTICIPANTS").replace("#COUNT#", this.count);
	};
}

export class RecordStatusButton
{
	constructor(config)
	{
		this.userId = config.userId;
		this.commonRecordState = config.commonRecordState;

		this.updateViewInterval = null;

		this.tooltip = createCssTooltip(BX.prop.getObject(config, 'tooltip', {}));

		this.elements = {
			root: null,
			timeText: null,
			stateText: null,
		};
	}

	render()
	{
		if (this.elements.root)
		{
			return this.elements.root;
		}

		const { tooltipStyle } = this.tooltip;

		this.elements.root = Dom.create('div', {
			props: {
				className: `bx-messenger-videocall-top-recordstatus record-status-${this.commonRecordState.state}`,
			},
			attrs: {
				style: tooltipStyle,
			},
			children: [
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-top-recordstatus-status' },
					children: [
						Dom.create('div', {
							props: { className: 'bx-messenger-videocall-top-button-icon record-status' },
						}),
					],
				}),
				Dom.create('div', {
					props: { className: 'bx-messenger-videocall-top-recordstatus-time' },
					children: [
						(this.elements.timeText = Dom.create('span', {
							props: { className: 'bx-messenger-videocall-top-recordstatus-time-text' },
							text: Util.getRecordTimeText(this.commonRecordState),
						})),
					],
				}),
			],
		});

		return this.elements.root;
	}

	update(commonRecordState)
	{
		const prevState = this.commonRecordState?.state;

		if (prevState !== commonRecordState.state)
		{
			clearInterval(this.updateViewInterval);
			this.updateViewInterval = null;

			if (commonRecordState.state === CallCommonRecordState.Started)
			{
				this.updateViewInterval = setInterval(() => this.updateView(), 1000);
			}
		}

		this.commonRecordState = commonRecordState;
		this.updateView();
	}

	updateView()
	{
		const timeText = Util.getRecordTimeText(this.commonRecordState);

		if (this.elements.timeText.innerText !== timeText)
		{
			this.elements.timeText.innerText = timeText;
		}

		const currentClass = `record-status-${this.commonRecordState.state}`;
		if (!this.elements.root.classList.contains(currentClass))
		{
			const { tooltipClass, hasTooltip, tooltipTextVarName, getTooltipText } = this.tooltip;
			const tooltipText = getTooltipText();

			if (hasTooltip && tooltipText)
			{
				this.elements.root.style.setProperty(tooltipTextVarName, `'${tooltipText}'`);
			}

			const classes = [
				tooltipText ? tooltipClass : '',
				'bx-messenger-videocall-top-recordstatus',
				currentClass,
			].filter(Boolean);

			this.elements.root.className = classes.join(' ');
		}
	}

	stopViewUpdate()
	{
		if (this.updateViewInterval)
		{
			clearInterval(this.updateViewInterval);
			this.updateViewInterval = null;
		}
	};
}
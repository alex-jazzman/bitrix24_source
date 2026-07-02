/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class AvatarBase {
		constructor(options) {
			this.options = {
				...this.getDefaultOptions(),
				...(main_core.Type.isPlainObject(options) ? options : {})
			};
			this.node = {
				avatar: null,
				initials: null,
				svgUserPic: null,
				svgMask: null,
				svgDefaultUserPic: null
			};
			this.events = null;
			this.title = null;
			this.userName = this.options.userName ?? this.title;
			this.initials = main_core.Type.isString(this.options.initials) ? this.options.initials : null;
			this.picPath = null;
			this.userpicPath = main_core.Type.isString(this.options.userpicPath) ?? this.picPath;
			this.unicId = null;
			this.events = {};
			this.size = null;
			this.baseColor = null;
			this.borderColor = null;
			this.borderInnerColor = null;
			this.setMask();
			this.setBaseColor(this.options.baseColor);
			this.setBorderColor(this.options.borderColor);
			this.setBorderInnerColor(this.options.borderInnerColor);
			this.setTitle(this.options.title ?? this.options.userName);
			if (this.initials) {
				this.setInitials(this.initials);
			}
			this.setSize(this.options.size);
			this.setPic(this.options.picPath ?? this.options.userpicPath);
			this.setEvents(this.options.events);
			if (!this.title && !this.initials && !this.picPath) {
				this.setDefaultUserPic();
			}
		}
		setEvents(events) {
			if (main_core.Type.isObject(events)) {
				this.events = events;
				const eventKeys = Object.keys(this.events);
				for (const event of eventKeys) {
					main_core.Event.bind(this.getContainer(), event, () => {
						this.events[event]();
					});
					main_core.Dom.addClass(this.getContainer(), '--cursor-pointer');
				}
			}
			return this;
		}
		hexToRgb(hex) {
			if (!/^#([\dA-Fa-f]{3}){1,2}$/.test(hex)) {
				return hex;
			}
			const color = hex.length === 4 ? [hex[1], hex[1], hex[2], hex[2], hex[3], hex[3]]
			// eslint-disable-next-line unicorn/no-useless-spread
			: [...hex.slice(1)];
			const rgb = parseInt(color.join(''), 16);
			return `${rgb >> 16 & 255}, ${rgb >> 8 & 255}, ${rgb & 255}`;
		}
		setBorderColor(colorCode) {
			if (main_core.Type.isString(colorCode)) {
				this.borderColor = colorCode;
				main_core.Dom.style(this.getContainer(), '--ui-avatar-border-color', this.borderColor);
			}
			return this;
		}
		setBorderInnerColor(colorCode) {
			if (main_core.Type.isString(colorCode)) {
				this.borderInnerColor = colorCode;
				main_core.Dom.style(this.getContainer(), '--ui-avatar-border-inner-color', this.borderInnerColor);
			}
		}
		setBaseColor(colorCode) {
			if (main_core.Type.isString(colorCode)) {
				this.baseColor = this.hexToRgb(colorCode);
				main_core.Dom.style(this.getContainer(), '--ui-avatar-base-color-rgb', this.baseColor);
			}
			return this;
		}
		getUnicId() {
			if (!this.unicId) {
				this.unicId = `ui-avatar-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
			}
			return this.unicId;
		}
		getDefaultOptions() {
			return {};
		}
		setTitle(text) {
			if (main_core.Type.isString(text) && text.trim().length > 0) {
				this.title = text;
				if (this.title.length > 0) {
					this.getContainer().setAttribute('title', this.title);
					const validSymbolsPattern = /[\p{L}\p{N} ]/u;
					const words = this.title.split(/[\s,]/).filter(word => {
						const firstLetter = word.charAt(0);
						return validSymbolsPattern.test(firstLetter);
					});
					let initials = '';
					if (words.length > 0) {
						initials = words.length > 1 ? words[0].charAt(0) + words[1].charAt(0) : initials = words[0].charAt(0);
					}
					this.setInitials(initials.toUpperCase());
				}
			}
			return this;
		}
		getInitialsNode() {
			if (!this.node.initials) {
				this.node.initials = main_core.Tag.render`
				<div class="ui-avatar__text" style="font-size: calc(var(--ui-avatar-size) / 2.6)"></div>
			`;
			}
			return this.node.initials;
		}
		setInitials(text) {
			if (this.picPath) {
				return this;
			}
			if (main_core.Type.isString(text)) {
				this.getInitialsNode().textContent = text;
				if (!this.getInitialsNode().parentNode) {
					this.node.initials = main_core.Tag.render`
					<div class="ui-avatar__text"></div>
				`;
					main_core.Dom.append(this.getInitialsNode(), this.getContainer());
					main_core.Dom.style(this.getInitialsNode(), 'font-size', 'calc(var(--ui-avatar-size) / 2.6)');
				}
				this.getInitialsNode().textContent = text;
			}
			return this;
		}
		getSvgElement(tag, attr) {
			if (main_core.Type.isString(tag) || main_core.Type.isObject(attr)) {
				const svg = document.createElementNS('http://www.w3.org/2000/svg', tag);
				Object.keys(attr).forEach(attrSingle => {
					if (Object.prototype.hasOwnProperty.call(attr, attrSingle)) {
						svg.setAttributeNS(null, attrSingle, attr[attrSingle]);
					}
				});
				return svg;
			}
			return null;
		}
		getMaskNode() {
			if (!this.node.svgMask) {
				this.node.svgMask = this.getSvgElement('circle', {
					cx: 51,
					cy: 51,
					r: 51,
					fill: 'white'
				});
			}
			return this.node.svgMask;
		}
		setMask() {
			const mask = this.getSvgElement('mask', {
				id: `${this.getUnicId()}-${this.constructor.name}`
			});
			main_core.Dom.append(this.getMaskNode(), mask);
			main_core.Dom.prepend(mask, this.getContainer().querySelector('svg'));
		}
		getDefaultUserPic() {
			if (!this.node.svgDefaultUserPic) {
				this.node.svgDefaultUserPic = this.getSvgElement('svg', {
					width: 56,
					height: 64,
					viewBox: '0 0 28 32',
					x: 23,
					y: 20
				});
				this.node.svgDefaultUserPic.innerHTML = `
				<path fill="#fff" d="M25.197 29.5091C26.5623 29.0513 27.3107 27.5994 27.0337 26.1625L26.6445 24.143C26.4489 22.8806 25.0093 21.4633 21.7893 20.6307C20.6983 20.3264 19.6613 19.8546 18.7152 19.232C18.5082 19.1138 18.5397 18.0214 18.5397 18.0214L17.5026 17.8636C17.5026 17.7749 17.4139 16.4649 17.4139 16.4649C18.6548 16.048 18.5271 13.5884 18.5271 13.5884C19.3151 14.0255 19.8283 12.0791 19.8283 12.0791C20.7604 9.37488 19.3642 9.53839 19.3642 9.53839C19.6085 7.88753 19.6085 6.20972 19.3642 4.55887C18.7435 -0.917471 9.39785 0.569216 10.506 2.35777C7.77463 1.85466 8.39788 8.06931 8.39788 8.06931L8.99031 9.67863C8.16916 10.2112 8.33041 10.8225 8.51054 11.5053C8.58564 11.7899 8.66401 12.087 8.67586 12.396C8.73309 13.9469 9.68211 13.6255 9.68211 13.6255C9.7406 16.1851 11.0028 16.5184 11.0028 16.5184C11.2399 18.1258 11.0921 17.8523 11.0921 17.8523L9.9689 17.9881C9.9841 18.3536 9.95432 18.7197 9.88022 19.078C9.2276 19.3688 8.82806 19.6003 8.43247 19.8294C8.0275 20.064 7.62666 20.2962 6.9627 20.5873C4.42693 21.6985 1.8838 22.3205 1.39387 24.2663C1.28119 24.7138 1.1185 25.4832 0.962095 26.2968C0.697567 27.673 1.44264 29.0328 2.74873 29.4755C5.93305 30.5548 9.46983 31.1912 13.2024 31.2728H14.843C18.5367 31.192 22.0386 30.5681 25.197 29.5091Z"/>
			`;
			}
			return this.node.svgDefaultUserPic;
		}
		getUserPicNode() {
			if (!this.node.svgUserPic) {
				this.node.svgUserPic = this.getSvgElement('image', {
					height: 102,
					width: 102,
					mask: `url(#${this.getUnicId()}-${this.constructor.name})`,
					preserveAspectRatio: 'xMidYMid slice'
				});
			}
			return this.node.svgUserPic;
		}
		setDefaultUserPic() {
			if (!this.getDefaultUserPic().parentNode) {
				main_core.Dom.append(this.getDefaultUserPic(), this.getContainer().querySelector('svg'));
			}
			main_core.Dom.addClass(this.getContainer(), '--default-user-pic');
			main_core.Dom.remove(this.getInitialsNode());
			this.node.initials = null;
			return this;
		}
		removeDefaultUserPic() {
			main_core.Dom.remove(this.getDefaultUserPic());
			main_core.Dom.removeClass(this.getContainer(), '--default-user-pic');
			this.node.svgDefaultUserPic = null;
			return this;
		}
		setPic(url) {
			this.setUserPic(url);
		}
		removePic() {
			this.removeUserPic();
		}
		setUserPic(url) {
			if (main_core.Type.isString(url) && url !== '') {
				this.picPath = url;
				if (!this.getUserPicNode().parentNode) {
					main_core.Dom.append(this.getUserPicNode(), this.getContainer().querySelector('svg'));
				}
				this.getUserPicNode().setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
				main_core.Dom.removeClass(this.getContainer(), '--default-user-pic');
				main_core.Dom.remove(this.getInitialsNode());
				this.node.initials = null;
			}
			return this;
		}
		removeUserPic() {
			main_core.Dom.remove(this.getUserPicNode());
			this.picPath = null;
			this.setInitials(this.title);
			main_core.Dom.style(this.getContainer(), '--ui-avatar-base-color-rgb', this.baseColor);
		}
		setSize(size) {
			if (main_core.Type.isNumber(size) && size > 0) {
				this.size = size;
				main_core.Dom.style(this.getContainer(), '--ui-avatar-size', `${this.size}px`);
			}
			return this;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --base">
					<svg viewBox="0 0 102 102">
						<circle class="ui-avatar-base" cx="51" cy="51" r="51" />
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
		renderTo(node) {
			if (main_core.Type.isDomNode(node)) {
				main_core.Dom.append(this.getContainer(), node);
			}
			return null;
		}
	}

	class AvatarRound extends AvatarBase {}

	class AvatarRoundGuest extends AvatarBase {
		getMaskNode() {
			if (!this.node.svgMask) {
				this.node.svgMask = this.getSvgElement('circle', {
					cx: 51,
					cy: 51,
					r: 42.5,
					fill: 'white'
				});
			}
			return this.node.svgMask;
		}
		getDefaultUserPic() {
			if (!this.node.svgDefaultUserPic) {
				this.node.svgDefaultUserPic = this.getSvgElement('svg', {
					width: 56,
					height: 64,
					viewBox: '0 0 28 32',
					x: 23,
					y: 20
				});
				this.node.svgDefaultUserPic.innerHTML = `
				<path class="ui-avatar-default-path" d="M25.197 29.5091C26.5623 29.0513 27.3107 27.5994 27.0337 26.1625L26.6445 24.143C26.4489 22.8806 25.0093 21.4633 21.7893 20.6307C20.6983 20.3264 19.6613 19.8546 18.7152 19.232C18.5082 19.1138 18.5397 18.0214 18.5397 18.0214L17.5026 17.8636C17.5026 17.7749 17.4139 16.4649 17.4139 16.4649C18.6548 16.048 18.5271 13.5884 18.5271 13.5884C19.3151 14.0255 19.8283 12.0791 19.8283 12.0791C20.7604 9.37488 19.3642 9.53839 19.3642 9.53839C19.6085 7.88753 19.6085 6.20972 19.3642 4.55887C18.7435 -0.917471 9.39785 0.569216 10.506 2.35777C7.77463 1.85466 8.39788 8.06931 8.39788 8.06931L8.99031 9.67863C8.16916 10.2112 8.33041 10.8225 8.51054 11.5053C8.58564 11.7899 8.66401 12.087 8.67586 12.396C8.73309 13.9469 9.68211 13.6255 9.68211 13.6255C9.7406 16.1851 11.0028 16.5184 11.0028 16.5184C11.2399 18.1258 11.0921 17.8523 11.0921 17.8523L9.9689 17.9881C9.9841 18.3536 9.95432 18.7197 9.88022 19.078C9.2276 19.3688 8.82806 19.6003 8.43247 19.8294C8.0275 20.064 7.62666 20.2962 6.9627 20.5873C4.42693 21.6985 1.8838 22.3205 1.39387 24.2663C1.28119 24.7138 1.1185 25.4832 0.962095 26.2968C0.697567 27.673 1.44264 29.0328 2.74873 29.4755C5.93305 30.5548 9.46983 31.1912 13.2024 31.2728H14.843C18.5367 31.192 22.0386 30.5681 25.197 29.5091Z"/>
			`;
			}
			return this.node.svgDefaultUserPic;
		}
		getUserPicNode() {
			if (!this.node.svgUserpic) {
				this.node.svgUserpic = this.getSvgElement('image', {
					height: 86,
					width: 86,
					x: 8,
					y: 8,
					mask: `url(#${this.getUnicId()}-${this.constructor.name})`,
					preserveAspectRatio: 'xMidYMid slice'
				});
			}
			return this.node.svgUserpic;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --round --guest">
					<svg viewBox="0 0 102 102">
						<circle class="ui-avatar-border-inner" cx="51" cy="51" r="51"/>
						<circle class="ui-avatar-base" cx="51" cy="51" r="42.5"/>
						<path class="ui-avatar-border" d="M51 98.26C77.101 98.26 98.26 77.101 98.26 51C98.26 24.899 77.101 3.74 51 3.74C24.899 3.74 3.74 24.899 3.74 51C3.74 77.101 24.899 98.26 51 98.26ZM51 102C79.1665 102 102 79.1665 102 51C102 22.8335 79.1665 0 51 0C22.8335 0 0 22.8335 0 51C0 79.1665 22.8335 102 51 102Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarRoundCopilot extends AvatarRoundGuest {
		setInitials() {}
		getDefaultUserPic() {
			if (!this.node.svgDefaultUserPic) {
				this.node.svgDefaultUserPic = this.getSvgElement('svg', {
					width: 86,
					height: 86,
					viewBox: '0 0 86 86',
					x: 8,
					y: 8
				});
				this.node.svgDefaultUserPic.innerHTML = `
				<mask id="mask0_37169_151806" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="86" height="86">
					<circle cx="43" cy="43" r="42.5" fill="#D9D9D9"/>
				</mask>
				<g mask="url(#mask0_37169_151806)">
					<g clip-path="url(#clip0_37169_151806)">
						<rect width="86" height="86" fill="url(#paint0_linear_37169_151806)"/>
						<g filter="url(#filter0_f_37169_151806)">
							<path d="M7.29559 61.0024C7.29559 74.5261 12.0511 80.6392 19.8616 86H86V7.73433C86 2.71761 84.411 -3.30594 82.0987 2.65204C74.2152 16.6238 67.8963 19.0601 59.1554 24.7426C50.4145 30.4251 7.29559 32.6619 7.29559 61.0024Z" fill="url(#paint1_linear_37169_151806)"/>
						</g>
						<path fill-rule="evenodd" clip-rule="evenodd" d="M43.003 57.102C50.7377 57.102 57.0079 50.7916 57.0079 43.0074C57.0079 35.2232 50.7377 28.9129 43.003 28.9129C35.2683 28.9129 28.9981 35.2232 28.9981 43.0074C28.9981 50.7916 35.2683 57.102 43.003 57.102ZM40.7646 32.4541C40.6384 32.1107 40.1558 32.1107 40.0296 32.4541L38.6355 36.2456C38.2386 37.3251 37.393 38.1761 36.3204 38.5755L32.553 39.9786C32.2118 40.1056 32.2118 40.5912 32.553 40.7182L36.3204 42.1213C37.393 42.5207 38.2386 43.3717 38.6355 44.4512L40.0296 48.2427C40.1558 48.5861 40.6384 48.5861 40.7646 48.2427L42.1587 44.4512C42.5556 43.3717 43.4012 42.5207 44.4738 42.1213L48.2412 40.7182C48.5824 40.5912 48.5824 40.1056 48.2412 39.9786L44.4738 38.5755C43.4012 38.1761 42.5556 37.3251 42.1587 36.2456L40.7646 32.4541ZM48.7681 43.4107C48.6952 43.2124 48.4164 43.2124 48.3435 43.4107L47.538 45.6015C47.3086 46.2252 46.82 46.717 46.2003 46.9477L44.0234 47.7584C43.8263 47.8318 43.8263 48.1124 44.0234 48.1858L46.2003 48.9965C46.82 49.2273 47.3086 49.719 47.538 50.3427L48.3435 52.5335C48.4164 52.7319 48.6952 52.7319 48.7681 52.5335L49.5736 50.3427C49.803 49.719 50.2916 49.2273 50.9113 48.9965L53.0882 48.1858C53.2853 48.1124 53.2853 47.8318 53.0882 47.7584L50.9113 46.9477C50.2916 46.717 49.803 46.2252 49.5736 45.6015L48.7681 43.4107Z" fill="white"/>
						<path d="M63.1545 43.863C64.5305 43.923 65.6125 45.0982 65.4047 46.4685C63.7447 57.4186 54.3471 65.8076 43.0027 65.8076C30.4866 65.8076 20.3403 55.5963 20.3403 43.0001C20.3403 30.4039 30.4866 20.1926 43.0027 20.1926C48.9652 20.1926 54.3899 22.51 58.4361 26.2987C59.4465 27.2449 59.3211 28.8449 58.2754 29.7515C57.2309 30.6569 55.665 30.5236 54.6272 29.6104C51.5202 26.8765 47.4535 25.2201 43.0022 25.2201C33.2437 25.2201 25.3329 33.1815 25.3329 43.0025C25.3329 52.8235 33.2437 60.7849 43.0022 60.7849C51.6574 60.7849 58.8591 54.522 60.377 46.2536C60.6277 44.8875 61.7754 43.8028 63.1545 43.863Z" fill="white"/>
					</g>
				</g>
				<defs>
					<filter id="filter0_f_37169_151806" x="6.28383" y="-0.837937" width="80.7279" height="87.8497" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
						<feFlood flood-opacity="0" result="BackgroundImageFix"/>
						<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
						<feGaussianBlur stdDeviation="0.505882" result="effect1_foregroundBlur_37169_151806"/>
					</filter>
					<linearGradient id="paint0_linear_37169_151806" x1="49.5996" y1="0.681138" x2="34.8518" y2="86.4028" gradientUnits="userSpaceOnUse">
						<stop stop-color="#E574F3"/>
						<stop offset="1" stop-color="#6D55EB"/>
					</linearGradient>
					<linearGradient id="paint1_linear_37169_151806" x1="83.7262" y1="13.236" x2="32.6935" y2="83.15" gradientUnits="userSpaceOnUse">
						<stop stop-color="#E778E6"/>
						<stop offset="0.945" stop-color="#9B72F9"/>
					</linearGradient>
					<clipPath id="clip0_37169_151806">
						<rect width="86" height="86" fill="white"/>
					</clipPath>
				</defs>
			`;
			}
			return this.node.svgDefaultUserPic;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --round --copilot">
					<svg viewBox="0 0 102 102">
						<circle class="ui-avatar-border-inner" cx="51" cy="51" r="51"/>
						${this.getDefaultUserPic()}
						<path class="ui-avatar-border" d="M51 98.26C77.101 98.26 98.26 77.101 98.26 51C98.26 24.899 77.101 3.74 51 3.74C24.899 3.74 3.74 24.899 3.74 51C3.74 77.101 24.899 98.26 51 98.26ZM51 102C79.1665 102 102 79.1665 102 51C102 22.8335 79.1665 0 51 0C22.8335 0 0 22.8335 0 51C0 79.1665 22.8335 102 51 102Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarRoundBitrixGpt extends AvatarRoundGuest {
		getDefaultUserPic() {
			if (!this.node.svgDefaultUserPic) {
				this.node.svgDefaultUserPic = this.getSvgElement('svg', {
					width: 86,
					height: 86,
					viewBox: '0 0 86 86',
					x: 8,
					y: 8
				});
				this.node.svgDefaultUserPic.innerHTML = `
				<mask id="ui-avatar-bitrix-gpt-mask-${this.getUnicId()}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="86" height="86">
					<circle cx="43" cy="43" r="42.5" fill="#D9D9D9"/>
				</mask>
				<g mask="url(#ui-avatar-bitrix-gpt-mask-${this.getUnicId()})">
					<g clip-path="url(#ui-avatar-bitrix-gpt-clip-${this.getUnicId()})">
						<image width="86" height="86" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/jpeg;base64,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"/>
					</g>
					<g opacity="0.18" style="transform: translate(2px, 18px)">
						<path d="M112.222 11.7184C130.289 34.0744 124.796 62.8974 123.772 67.4812C123.682 67.8845 123.386 68.1826 122.987 68.2882C119.933 69.0955 105.428 72.3307 69.1274 72.3288C33.8923 72.327 -3.83788 64.3812 -14.3938 61.9903C-15.41 61.7601 -15.5722 60.4115 -14.6527 59.9214C-10.2147 57.556 -0.670855 52.4386 9.976 46.5407C19.0097 41.5364 30.7259 34.9153 35.1807 32.071C46.8729 24.6058 54.1074 19.1159 59.1913 15.3878C64.2752 11.6597 92.5387 -12.6382 112.222 11.7184Z" fill="url(#ui-avatar-bitrix-gpt-glance-gradient-${this.getUnicId()})"/>
					</g>
				</g>
				<defs>
					<clipPath id="ui-avatar-bitrix-gpt-clip-${this.getUnicId()}">
						<circle cx="43" cy="43" r="42.5"/>
					</clipPath>
					<linearGradient id="ui-avatar-bitrix-gpt-glance-gradient-${this.getUnicId()}" x1="125.354" y1="34.5565" x2="-17.2805" y2="34.5565" gradientUnits="userSpaceOnUse">
						<stop offset="0.2" stop-color="white" stop-opacity="0.8"/>
						<stop offset="1" stop-color="white" stop-opacity="0.12"/>
					</linearGradient>
				</defs>
			`;
			}
			return this.node.svgDefaultUserPic;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --round --bitrix-gpt">
					<svg viewBox="0 0 102 102">
						<circle class="ui-avatar-border-inner" cx="51" cy="51"/>
						${this.getDefaultUserPic()}
						<path class="ui-avatar-border" fill="url(#ui-avatar-gradient-bitrix-gpt-${this.getUnicId()})" d="M51 98.26C77.101 98.26 98.26 77.101 98.26 51C98.26 24.899 77.101 3.74 51 3.74C24.899 3.74 3.74 24.899 3.74 51C3.74 77.101 24.899 98.26 51 98.26ZM51 102C79.1665 102 102 79.1665 102 51C102 22.8335 79.1665 0 51 0C22.8335 0 0 22.8335 0 51C0 79.1665 22.8335 102 51 102Z"/>
						<linearGradient id="ui-avatar-gradient-bitrix-gpt-${this.getUnicId()}" x1="1.97114e-06" y1="-2.125" x2="102" y2="102" gradientUnits="userSpaceOnUse">
							<stop offset="0.122725" stop-color="#FFB61A"/>
							<stop offset="0.381008" stop-color="#F046B7"/>
							<stop offset="0.682691" stop-color="#9D48FF"/>
							<stop offset="1" stop-color="#3F68FF"/>
						</linearGradient>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarRoundMarta extends AvatarRoundGuest {
		getDefaultUserPic() {
			if (!this.node.svgDefaultUserPic) {
				this.node.svgDefaultUserPic = this.getSvgElement('svg', {
					width: 86,
					height: 86,
					viewBox: '0 0 86 86',
					x: 8,
					y: 8
				});
				this.node.svgDefaultUserPic.innerHTML = `
				<mask id="mask0_37739_286983" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="86" height="86">
					<circle cx="43.0045" cy="43" r="42.5" fill="#D9D9D9"/>
				</mask>
				<g mask="url(#mask0_37739_286983)">
					<g clip-path="url(#clip0_37739_286983)">
						<rect width="86" height="86" transform="translate(0.0045166)" fill="url(#paint0_linear_37739_286983)"/>
						<g opacity="0.2" filter="url(#filter0_f_37739_286983)">
							<path d="M52.0017 76.8239C64.0812 80.2656 70.5411 77.8538 76.9714 72.7017L90.876 17.5222L20.969 -2.3958C16.488 -3.67252 10.7737 -3.8797 15.6093 -0.434309C26.4315 9.6986 27.2791 15.5905 30.5171 24.3292C33.7551 33.068 26.688 69.6115 52.0017 76.8239Z" fill="url(#paint1_linear_37739_286983)"/>
						</g>
					</g>
				</g>
				<defs>
					<filter id="filter0_f_37739_286983" x="11.7443" y="-5.2728" width="81.1553" height="85.7282" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
						<feFlood flood-opacity="0" result="BackgroundImageFix"/>
						<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
						<feGaussianBlur stdDeviation="1.01176" result="effect1_foregroundBlur_37739_286983"/>
					</filter>
					<linearGradient id="paint0_linear_37739_286983" x1="43" y1="0" x2="43" y2="86" gradientUnits="userSpaceOnUse">
						<stop stop-color="#50C2FF"/>
						<stop offset="1" stop-color="#0277FE"/>
					</linearGradient>
					<linearGradient id="paint1_linear_37739_286983" x1="32.0175" y1="27.0845" x2="70.4547" y2="44.9651" gradientUnits="userSpaceOnUse">
						<stop stop-color="#7BFEC3"/>
						<stop offset="0.945" stop-color="#44A5FC"/>
					</linearGradient>
					<clipPath id="clip0_37739_286983">
						<rect width="86" height="86" fill="white" transform="translate(0.0045166)"/>
					</clipPath>
				</defs>
			`;
			}
			return this.node.svgDefaultUserPic;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --round --marta">
					<svg viewBox="0 0 102 102">
						<circle class="ui-avatar-border-inner" cx="51" cy="51"/>
						${this.getDefaultUserPic()}
						<path class="ui-avatar-border" fill="url(#ui-avatar-gradient-accent-${this.getUnicId()})" d="M51 98.26C77.101 98.26 98.26 77.101 98.26 51C98.26 24.899 77.101 3.74 51 3.74C24.899 3.74 3.74 24.899 3.74 51C3.74 77.101 24.899 98.26 51 98.26ZM51 102C79.1665 102 102 79.1665 102 51C102 22.8335 79.1665 0 51 0C22.8335 0 0 22.8335 0 51C0 79.1665 22.8335 102 51 102Z" transform="rotate(140 51 51)"/>
						<linearGradient id="ui-avatar-gradient-accent-${this.getUnicId()}" gradientUnits="userSpaceOnUse">
							<stop stop-color="rgba(0, 117, 255, 1)"/>
								<stop offset="25%" stop-color="rgba(48, 180, 247, 1)" />
							<stop offset="75%" stop-color="rgba(124, 255, 194, 1)" />
							<stop offset="100%" stop-color="rgba(59, 243, 156, 1)" />
						</linearGradient>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarRoundExtranet extends AvatarRoundGuest {
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --round --extranet">
					<svg viewBox="0 0 102 102">
						<circle class="ui-avatar-border-inner" cx="51" cy="51" r="51"/>
						<circle class="ui-avatar-base" cx="51" cy="51" r="42.5"/>
						<path class="ui-avatar-border" d="M51 98.26C77.101 98.26 98.26 77.101 98.26 51C98.26 24.899 77.101 3.74 51 3.74C24.899 3.74 3.74 24.899 3.74 51C3.74 77.101 24.899 98.26 51 98.26ZM51 102C79.1665 102 102 79.1665 102 51C102 22.8335 79.1665 0 51 0C22.8335 0 0 22.8335 0 51C0 79.1665 22.8335 102 51 102Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarRoundAccent extends AvatarRoundGuest {
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --round --accent">
					<svg viewBox="0 0 102 102">
						<circle class="ui-avatar-border-inner" cx="51" cy="51"/>
						<circle class="ui-avatar-base" cx="51" cy="51" r="42.5"/>
						<path class="ui-avatar-border" fill="url(#ui-avatar-gradient-accent-${this.getUnicId()})" d="M51 98.26C77.101 98.26 98.26 77.101 98.26 51C98.26 24.899 77.101 3.74 51 3.74C24.899 3.74 3.74 24.899 3.74 51C3.74 77.101 24.899 98.26 51 98.26ZM51 102C79.1665 102 102 79.1665 102 51C102 22.8335 79.1665 0 51 0C22.8335 0 0 22.8335 0 51C0 79.1665 22.8335 102 51 102Z"/>
						<linearGradient id="ui-avatar-gradient-accent-${this.getUnicId()}" x1="13.3983" y1="2.16102" x2="53.5932" y2="60.0763" gradientUnits="userSpaceOnUse">
							<stop stop-color="var(--ui-avatar-color-gradient-start)"/>
							<stop offset="1" stop-color="var(--ui-avatar-color-gradient-stop)"/>
						</linearGradient>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarHexagon extends AvatarBase {
		getUserPicNode() {
			if (!this.node.svgUserpic) {
				this.node.svgUserpic = this.getSvgElement('image', {
					height: 102,
					width: 102,
					mask: `url(#${this.getUnicId()}-${this.constructor.name})`,
					preserveAspectRatio: 'xMidYMid slice'
				});
			}
			return this.node.svgUserpic;
		}
		getMaskNode() {
			if (!this.node.svgMask) {
				this.node.svgMask = this.getSvgElement('path', {
					class: 'ui-avatar-mask',
					d: 'M40.4429 2.77436C47.0211 -0.823713 54.979 -0.823711 61.5572 2.77436L88.9207 17.7412C95.9759 21.6001 100.363 29.001 100.363 37.0426V64.9573C100.363 72.9989 95.9759 80.3998 88.9207 84.2588L61.5572 99.2256C54.979 102.824 47.0211 102.824 40.4429 99.2256L13.0794 84.2588C6.02419 80.3998 1.6366 72.9989 1.6366 64.9573V37.0426C1.6366 29.001 6.0242 21.6001 13.0794 17.7412L40.4429 2.77436Z'
				});
			}
			return this.node.svgMask;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --hexagon --base">
					<svg viewBox="0 0 102 102">
						<path class="ui-avatar-base" d="M40.4429 2.77436C47.0211 -0.823713 54.979 -0.823711 61.5572 2.77436L88.9207 17.7412C95.9759 21.6001 100.363 29.001 100.363 37.0426V64.9573C100.363 72.9989 95.9759 80.3998 88.9207 84.2588L61.5572 99.2256C54.979 102.824 47.0211 102.824 40.4429 99.2256L13.0794 84.2588C6.02419 80.3998 1.6366 72.9989 1.6366 64.9573V37.0426C1.6366 29.001 6.0242 21.6001 13.0794 17.7412L40.4429 2.77436Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarHexagonGuest extends AvatarBase {
		getUserPicNode() {
			if (!this.node.svgUserpic) {
				this.node.svgUserpic = this.getSvgElement('image', {
					height: 86,
					width: 86,
					x: 8,
					y: 8,
					mask: `url(#${this.getUnicId()}-${this.constructor.name})`,
					preserveAspectRatio: 'xMidYMid slice'
				});
			}
			return this.node.svgUserpic;
		}
		getDefaultUserPic() {
			if (!this.node.svgDefaultUserPic) {
				this.node.svgDefaultUserPic = this.getSvgElement('svg', {
					width: 56,
					height: 64,
					viewBox: '0 0 28 32',
					x: 23,
					y: 20
				});
				this.node.svgDefaultUserPic.innerHTML = `
				<path class="ui-avatar-default-path" d="M25.197 29.5091C26.5623 29.0513 27.3107 27.5994 27.0337 26.1625L26.6445 24.143C26.4489 22.8806 25.0093 21.4633 21.7893 20.6307C20.6983 20.3264 19.6613 19.8546 18.7152 19.232C18.5082 19.1138 18.5397 18.0214 18.5397 18.0214L17.5026 17.8636C17.5026 17.7749 17.4139 16.4649 17.4139 16.4649C18.6548 16.048 18.5271 13.5884 18.5271 13.5884C19.3151 14.0255 19.8283 12.0791 19.8283 12.0791C20.7604 9.37488 19.3642 9.53839 19.3642 9.53839C19.6085 7.88753 19.6085 6.20972 19.3642 4.55887C18.7435 -0.917471 9.39785 0.569216 10.506 2.35777C7.77463 1.85466 8.39788 8.06931 8.39788 8.06931L8.99031 9.67863C8.16916 10.2112 8.33041 10.8225 8.51054 11.5053C8.58564 11.7899 8.66401 12.087 8.67586 12.396C8.73309 13.9469 9.68211 13.6255 9.68211 13.6255C9.7406 16.1851 11.0028 16.5184 11.0028 16.5184C11.2399 18.1258 11.0921 17.8523 11.0921 17.8523L9.9689 17.9881C9.9841 18.3536 9.95432 18.7197 9.88022 19.078C9.2276 19.3688 8.82806 19.6003 8.43247 19.8294C8.0275 20.064 7.62666 20.2962 6.9627 20.5873C4.42693 21.6985 1.8838 22.3205 1.39387 24.2663C1.28119 24.7138 1.1185 25.4832 0.962095 26.2968C0.697567 27.673 1.44264 29.0328 2.74873 29.4755C5.93305 30.5548 9.46983 31.1912 13.2024 31.2728H14.843C18.5367 31.192 22.0386 30.5681 25.197 29.5091Z"/>
			`;
			}
			return this.node.svgDefaultUserPic;
		}
		getMaskNode() {
			if (!this.node.svgMask) {
				this.node.svgMask = this.getSvgElement('path', {
					class: 'ui-avatar-mask',
					d: 'M44.2368 10.2019C48.4219 7.93252 53.5781 7.93252 57.7632 10.2019L85.2368 25.0997C89.4219 27.3692 92 31.5632 92 36.1021V65.8977C92 70.4365 89.4219 74.6306 85.2368 76.9L57.7632 91.7978C53.5781 94.0672 48.4219 94.0672 44.2368 91.7978L16.7632 76.9C12.5781 74.6306 10 70.4365 10 65.8977V36.1021C10 31.5632 12.5781 27.3692 16.7632 25.0997L44.2368 10.2019Z'
				});
			}
			return this.node.svgMask;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --hexagon --guest">
					<svg viewBox="0 0 102 102">
						<path class="ui-avatar-border-inner" d="M40.4429 2.77436C47.0211 -0.823713 54.979 -0.823711 61.5572 2.77436L88.9207 17.7412C95.9759 21.6001 100.363 29.001 100.363 37.0426V64.9573C100.363 72.9989 95.9759 80.3998 88.9207 84.2588L61.5572 99.2256C54.979 102.824 47.0211 102.824 40.4429 99.2256L13.0794 84.2588C6.02419 80.3998 1.6366 72.9989 1.6366 64.9573V37.0426C1.6366 29.001 6.0242 21.6001 13.0794 17.7412L40.4429 2.77436Z"/>
						<path class="ui-avatar-border" d="M87.126 21.0224L59.7625 6.05561C54.3025 3.06921 47.6975 3.06921 42.2376 6.0556L14.8741 21.0224C9.01831 24.2253 5.3766 30.3681 5.3766 37.0426V64.9573C5.3766 71.6319 9.0183 77.7746 14.8741 80.9775L42.2376 95.9443C47.6975 98.9307 54.3025 98.9307 59.7625 95.9443L87.126 80.9775C92.9818 77.7746 96.6235 71.6319 96.6235 64.9573V37.0426C96.6235 30.3681 92.9818 24.2253 87.126 21.0224ZM61.5572 2.77436C54.979 -0.823711 47.0211 -0.823713 40.4429 2.77436L13.0794 17.7412C6.0242 21.6001 1.6366 29.001 1.6366 37.0426V64.9573C1.6366 72.9989 6.02419 80.3998 13.0794 84.2588L40.4429 99.2256C47.0211 102.824 54.979 102.824 61.5572 99.2256L88.9207 84.2588C95.9759 80.3998 100.363 72.9989 100.363 64.9573V37.0426C100.363 29.001 95.9759 21.6001 88.9207 17.7412L61.5572 2.77436Z"/>
						<path class="ui-avatar-base" d="M44.2368 10.2019C48.4219 7.93252 53.5781 7.93252 57.7632 10.2019L85.2368 25.0997C89.4219 27.3692 92 31.5632 92 36.1021V65.8977C92 70.4365 89.4219 74.6306 85.2368 76.9L57.7632 91.7978C53.5781 94.0672 48.4219 94.0672 44.2368 91.7978L16.7632 76.9C12.5781 74.6306 10 70.4365 10 65.8977V36.1021C10 31.5632 12.5781 27.3692 16.7632 25.0997L44.2368 10.2019Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarHexagonExtranet extends AvatarHexagonGuest {
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --hexagon --extranet">
					<svg viewBox="0 0 102 102">
						<path class="ui-avatar-border-inner" d="M40.4429 2.77436C47.0211 -0.823713 54.979 -0.823711 61.5572 2.77436L88.9207 17.7412C95.9759 21.6001 100.363 29.001 100.363 37.0426V64.9573C100.363 72.9989 95.9759 80.3998 88.9207 84.2588L61.5572 99.2256C54.979 102.824 47.0211 102.824 40.4429 99.2256L13.0794 84.2588C6.02419 80.3998 1.6366 72.9989 1.6366 64.9573V37.0426C1.6366 29.001 6.0242 21.6001 13.0794 17.7412L40.4429 2.77436Z"/>
						<path class="ui-avatar-border" d="M87.126 21.0224L59.7625 6.05561C54.3025 3.06921 47.6975 3.06921 42.2376 6.0556L14.8741 21.0224C9.01831 24.2253 5.3766 30.3681 5.3766 37.0426V64.9573C5.3766 71.6319 9.0183 77.7746 14.8741 80.9775L42.2376 95.9443C47.6975 98.9307 54.3025 98.9307 59.7625 95.9443L87.126 80.9775C92.9818 77.7746 96.6235 71.6319 96.6235 64.9573V37.0426C96.6235 30.3681 92.9818 24.2253 87.126 21.0224ZM61.5572 2.77436C54.979 -0.823711 47.0211 -0.823713 40.4429 2.77436L13.0794 17.7412C6.0242 21.6001 1.6366 29.001 1.6366 37.0426V64.9573C1.6366 72.9989 6.02419 80.3998 13.0794 84.2588L40.4429 99.2256C47.0211 102.824 54.979 102.824 61.5572 99.2256L88.9207 84.2588C95.9759 80.3998 100.363 72.9989 100.363 64.9573V37.0426C100.363 29.001 95.9759 21.6001 88.9207 17.7412L61.5572 2.77436Z"/>
						<path class="ui-avatar-base" d="M44.2368 10.2019C48.4219 7.93252 53.5781 7.93252 57.7632 10.2019L85.2368 25.0997C89.4219 27.3692 92 31.5632 92 36.1021V65.8977C92 70.4365 89.4219 74.6306 85.2368 76.9L57.7632 91.7978C53.5781 94.0672 48.4219 94.0672 44.2368 91.7978L16.7632 76.9C12.5781 74.6306 10 70.4365 10 65.8977V36.1021C10 31.5632 12.5781 27.3692 16.7632 25.0997L44.2368 10.2019Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarHexagonAccent extends AvatarHexagonGuest {
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --hexagon --accent">
					<svg viewBox="0 0 102 102">
						<path class="ui-avatar-border-inner" d="M40.4429 2.77436C47.0211 -0.823713 54.979 -0.823711 61.5572 2.77436L88.9207 17.7412C95.9759 21.6001 100.363 29.001 100.363 37.0426V64.9573C100.363 72.9989 95.9759 80.3998 88.9207 84.2588L61.5572 99.2256C54.979 102.824 47.0211 102.824 40.4429 99.2256L13.0794 84.2588C6.02419 80.3998 1.6366 72.9989 1.6366 64.9573V37.0426C1.6366 29.001 6.0242 21.6001 13.0794 17.7412L40.4429 2.77436Z"/>
						<path class="ui-avatar-border" fill="url(#ui-avatar-gradient-accent-${this.getUnicId()})"  d="M87.126 21.0224L59.7625 6.05561C54.3025 3.06921 47.6975 3.06921 42.2376 6.0556L14.8741 21.0224C9.01831 24.2253 5.3766 30.3681 5.3766 37.0426V64.9573C5.3766 71.6319 9.0183 77.7746 14.8741 80.9775L42.2376 95.9443C47.6975 98.9307 54.3025 98.9307 59.7625 95.9443L87.126 80.9775C92.9818 77.7746 96.6235 71.6319 96.6235 64.9573V37.0426C96.6235 30.3681 92.9818 24.2253 87.126 21.0224ZM61.5572 2.77436C54.979 -0.823711 47.0211 -0.823713 40.4429 2.77436L13.0794 17.7412C6.0242 21.6001 1.6366 29.001 1.6366 37.0426V64.9573C1.6366 72.9989 6.02419 80.3998 13.0794 84.2588L40.4429 99.2256C47.0211 102.824 54.979 102.824 61.5572 99.2256L88.9207 84.2588C95.9759 80.3998 100.363 72.9989 100.363 64.9573V37.0426C100.363 29.001 95.9759 21.6001 88.9207 17.7412L61.5572 2.77436Z"/>
						<path class="ui-avatar-base" d="M44.2368 10.2019C48.4219 7.93252 53.5781 7.93252 57.7632 10.2019L85.2368 25.0997C89.4219 27.3692 92 31.5632 92 36.1021V65.8977C92 70.4365 89.4219 74.6306 85.2368 76.9L57.7632 91.7978C53.5781 94.0672 48.4219 94.0672 44.2368 91.7978L16.7632 76.9C12.5781 74.6306 10 70.4365 10 65.8977V36.1021C10 31.5632 12.5781 27.3692 16.7632 25.0997L44.2368 10.2019Z"/>
						<linearGradient id="ui-avatar-gradient-accent-${this.getUnicId()}" x1="13.3983" y1="2.16102" x2="53.5932" y2="60.0763" gradientUnits="userSpaceOnUse">
							<stop stop-color="var(--ui-avatar-color-gradient-start)"/>
							<stop offset="1" stop-color="var(--ui-avatar-color-gradient-stop)"/>
						</linearGradient>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarSquare extends AvatarBase {
		getMaskNode() {
			if (!this.node.svgMask) {
				this.node.svgMask = this.getSvgElement('path', {
					class: 'ui-avatar-mask',
					d: 'M12 0C5.37258 0 0 5.37258 0 12V90C0 96.6274 5.37258 102 12 102H90C96.6274 102 102 96.6274 102 90V12C102 5.37258 96.6274 0 90 0H12Z'
				});
			}
			return this.node.svgMask;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --square --base">
					<svg viewBox="0 0 102 102">
						<path class="ui-avatar-base" d="M12 0C5.37258 0 0 5.37258 0 12V90C0 96.6274 5.37258 102 12 102H90C96.6274 102 102 96.6274 102 90V12C102 5.37258 96.6274 0 90 0H12Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarSquareGuest extends AvatarSquare {
		getMaskNode() {
			if (!this.node.svgMask) {
				this.node.svgMask = this.getSvgElement('path', {
					class: 'ui-avatar-mask',
					d: 'M8.47241 14.4724C8.47241 11.1587 11.1587 8.47241 14.4724 8.47241H87.4724C90.7861 8.47241 93.4724 11.1587 93.4724 14.4724V87.4724C93.4724 90.7861 90.7861 93.4724 87.4724 93.4724H14.4724C11.1587 93.4724 8.47241 90.7861 8.47241 87.4724V14.4724Z'
				});
			}
			return this.node.svgMask;
		}
		getDefaultUserPic() {
			if (!this.node.svgDefaultUserPic) {
				this.node.svgDefaultUserPic = this.getSvgElement('svg', {
					width: 56,
					height: 64,
					viewBox: '0 0 28 32',
					x: 23,
					y: 20
				});
				this.node.svgDefaultUserPic.innerHTML = `
				<path class="ui-avatar-default-path" d="M25.197 29.5091C26.5623 29.0513 27.3107 27.5994 27.0337 26.1625L26.6445 24.143C26.4489 22.8806 25.0093 21.4633 21.7893 20.6307C20.6983 20.3264 19.6613 19.8546 18.7152 19.232C18.5082 19.1138 18.5397 18.0214 18.5397 18.0214L17.5026 17.8636C17.5026 17.7749 17.4139 16.4649 17.4139 16.4649C18.6548 16.048 18.5271 13.5884 18.5271 13.5884C19.3151 14.0255 19.8283 12.0791 19.8283 12.0791C20.7604 9.37488 19.3642 9.53839 19.3642 9.53839C19.6085 7.88753 19.6085 6.20972 19.3642 4.55887C18.7435 -0.917471 9.39785 0.569216 10.506 2.35777C7.77463 1.85466 8.39788 8.06931 8.39788 8.06931L8.99031 9.67863C8.16916 10.2112 8.33041 10.8225 8.51054 11.5053C8.58564 11.7899 8.66401 12.087 8.67586 12.396C8.73309 13.9469 9.68211 13.6255 9.68211 13.6255C9.7406 16.1851 11.0028 16.5184 11.0028 16.5184C11.2399 18.1258 11.0921 17.8523 11.0921 17.8523L9.9689 17.9881C9.9841 18.3536 9.95432 18.7197 9.88022 19.078C9.2276 19.3688 8.82806 19.6003 8.43247 19.8294C8.0275 20.064 7.62666 20.2962 6.9627 20.5873C4.42693 21.6985 1.8838 22.3205 1.39387 24.2663C1.28119 24.7138 1.1185 25.4832 0.962095 26.2968C0.697567 27.673 1.44264 29.0328 2.74873 29.4755C5.93305 30.5548 9.46983 31.1912 13.2024 31.2728H14.843C18.5367 31.192 22.0386 30.5681 25.197 29.5091Z"/>
			`;
			}
			return this.node.svgDefaultUserPic;
		}
		getUserPicNode() {
			if (!this.node.svgUserpic) {
				this.node.svgUserpic = this.getSvgElement('image', {
					height: 86,
					width: 86,
					x: 8,
					y: 8,
					mask: `url(#${this.getUnicId()}-${this.constructor.name})`,
					preserveAspectRatio: 'xMidYMid slice'
				});
			}
			return this.node.svgUserpic;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --square --guest">
					<svg viewBox="0 0 102 102">
						<path class="ui-avatar-border-inner" d="M12 0C5.37258 0 0 5.37258 0 12V90C0 96.6274 5.37258 102 12 102H90C96.6274 102 102 96.6274 102 90V12C102 5.37258 96.6274 0 90 0H12Z"/>
						<path class="ui-avatar-border" d="M90 3.74H12C7.43813 3.74 3.74 7.43813 3.74 12V90C3.74 94.5619 7.43813 98.26 12 98.26H90C94.5619 98.26 98.26 94.5619 98.26 90V12C98.26 7.43813 94.5619 3.74 90 3.74ZM12 0C5.37258 0 0 5.37258 0 12V90C0 96.6274 5.37258 102 12 102H90C96.6274 102 102 96.6274 102 90V12C102 5.37258 96.6274 0 90 0H12Z"/>
						<path class="ui-avatar-base" d="M8.47241 14.4724C8.47241 11.1587 11.1587 8.47241 14.4724 8.47241H87.4724C90.7861 8.47241 93.4724 11.1587 93.4724 14.4724V87.4724C93.4724 90.7861 90.7861 93.4724 87.4724 93.4724H14.4724C11.1587 93.4724 8.47241 90.7861 8.47241 87.4724V14.4724Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarSquareExtranet extends AvatarSquareGuest {
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --square --extranet">
					<svg viewBox="0 0 102 102">
						<path class="ui-avatar-border-inner" d="M12 0C5.37258 0 0 5.37258 0 12V90C0 96.6274 5.37258 102 12 102H90C96.6274 102 102 96.6274 102 90V12C102 5.37258 96.6274 0 90 0H12Z"/>
						<path class="ui-avatar-border" d="M90 3.74H12C7.43813 3.74 3.74 7.43813 3.74 12V90C3.74 94.5619 7.43813 98.26 12 98.26H90C94.5619 98.26 98.26 94.5619 98.26 90V12C98.26 7.43813 94.5619 3.74 90 3.74ZM12 0C5.37258 0 0 5.37258 0 12V90C0 96.6274 5.37258 102 12 102H90C96.6274 102 102 96.6274 102 90V12C102 5.37258 96.6274 0 90 0H12Z"/>
						<path class="ui-avatar-base" d="M8.47241 14.4724C8.47241 11.1587 11.1587 8.47241 14.4724 8.47241H87.4724C90.7861 8.47241 93.4724 11.1587 93.4724 14.4724V87.4724C93.4724 90.7861 90.7861 93.4724 87.4724 93.4724H14.4724C11.1587 93.4724 8.47241 90.7861 8.47241 87.4724V14.4724Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarSquareAccent extends AvatarSquareGuest {
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --square --accent">
					<svg viewBox="0 0 102 102">
						
						<path class="ui-avatar-border-inner" d="M12 0C5.37258 0 0 5.37258 0 12V90C0 96.6274 5.37258 102 12 102H90C96.6274 102 102 96.6274 102 90V12C102 5.37258 96.6274 0 90 0H12Z"/>
						<path class="ui-avatar-border" fill="url(#ui-avatar-gradient-accent-${this.getUnicId()})"  d="M90 3.74H12C7.43813 3.74 3.74 7.43813 3.74 12V90C3.74 94.5619 7.43813 98.26 12 98.26H90C94.5619 98.26 98.26 94.5619 98.26 90V12C98.26 7.43813 94.5619 3.74 90 3.74ZM12 0C5.37258 0 0 5.37258 0 12V90C0 96.6274 5.37258 102 12 102H90C96.6274 102 102 96.6274 102 90V12C102 5.37258 96.6274 0 90 0H12Z"/>
						<path class="ui-avatar-base" d="M8.47241 14.4724C8.47241 11.1587 11.1587 8.47241 14.4724 8.47241H87.4724C90.7861 8.47241 93.4724 11.1587 93.4724 14.4724V87.4724C93.4724 90.7861 90.7861 93.4724 87.4724 93.4724H14.4724C11.1587 93.4724 8.47241 90.7861 8.47241 87.4724V14.4724Z"/>
						<linearGradient id="ui-avatar-gradient-accent-${this.getUnicId()}" x1="13.3983" y1="2.16102" x2="53.5932" y2="60.0763" gradientUnits="userSpaceOnUse">
							<stop stop-color="var(--ui-avatar-color-gradient-start)"/>
							<stop offset="1" stop-color="var(--ui-avatar-color-gradient-stop)"/>
						</linearGradient>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	class AvatarHexagonProject extends AvatarBase {
		getDefaultOptions() {
			return {
				baseColor: getComputedStyle(document.documentElement).getPropertyValue('--ui-color-accent-main-primary').trim()
			};
		}
		getUserPicNode() {
			if (!this.node.svgUserpic) {
				this.node.svgUserpic = this.getSvgElement('image', {
					height: 86,
					width: 86,
					x: 8,
					y: 8,
					mask: `url(#${this.getUnicId()}-${this.constructor.name})`,
					preserveAspectRatio: 'xMidYMid slice'
				});
			}
			return this.node.svgUserpic;
		}
		getDefaultUserPic() {
			if (!this.node.svgDefaultUserPic) {
				this.node.svgDefaultUserPic = this.getSvgElement('svg', {
					width: 56,
					height: 64,
					viewBox: '0 0 28 32',
					x: 23,
					y: 20
				});
				this.node.svgDefaultUserPic.innerHTML = `
				<path class="ui-avatar-default-path" d="M25.197 29.5091C26.5623 29.0513 27.3107 27.5994 27.0337 26.1625L26.6445 24.143C26.4489 22.8806 25.0093 21.4633 21.7893 20.6307C20.6983 20.3264 19.6613 19.8546 18.7152 19.232C18.5082 19.1138 18.5397 18.0214 18.5397 18.0214L17.5026 17.8636C17.5026 17.7749 17.4139 16.4649 17.4139 16.4649C18.6548 16.048 18.5271 13.5884 18.5271 13.5884C19.3151 14.0255 19.8283 12.0791 19.8283 12.0791C20.7604 9.37488 19.3642 9.53839 19.3642 9.53839C19.6085 7.88753 19.6085 6.20972 19.3642 4.55887C18.7435 -0.917471 9.39785 0.569216 10.506 2.35777C7.77463 1.85466 8.39788 8.06931 8.39788 8.06931L8.99031 9.67863C8.16916 10.2112 8.33041 10.8225 8.51054 11.5053C8.58564 11.7899 8.66401 12.087 8.67586 12.396C8.73309 13.9469 9.68211 13.6255 9.68211 13.6255C9.7406 16.1851 11.0028 16.5184 11.0028 16.5184C11.2399 18.1258 11.0921 17.8523 11.0921 17.8523L9.9689 17.9881C9.9841 18.3536 9.95432 18.7197 9.88022 19.078C9.2276 19.3688 8.82806 19.6003 8.43247 19.8294C8.0275 20.064 7.62666 20.2962 6.9627 20.5873C4.42693 21.6985 1.8838 22.3205 1.39387 24.2663C1.28119 24.7138 1.1185 25.4832 0.962095 26.2968C0.697567 27.673 1.44264 29.0328 2.74873 29.4755C5.93305 30.5548 9.46983 31.1912 13.2024 31.2728H14.843C18.5367 31.192 22.0386 30.5681 25.197 29.5091Z"/>
			`;
			}
			return this.node.svgDefaultUserPic;
		}
		getMaskNode() {
			if (!this.node.svgMask) {
				this.node.svgMask = this.getSvgElement('path', {
					class: 'ui-avatar-mask',
					d: 'M44.2368 10.2019C48.4219 7.93252 53.5781 7.93252 57.7632 10.2019L85.2368 25.0997C89.4219 27.3692 92 31.5632 92 36.1021V65.8977C92 70.4365 89.4219 74.6306 85.2368 76.9L57.7632 91.7978C53.5781 94.0672 48.4219 94.0672 44.2368 91.7978L16.7632 76.9C12.5781 74.6306 10 70.4365 10 65.8977V36.1021C10 31.5632 12.5781 27.3692 16.7632 25.0997L44.2368 10.2019Z'
				});
			}
			return this.node.svgMask;
		}
		getContainer() {
			if (!this.node.avatar) {
				this.node.avatar = main_core.Tag.render`
				<div class="ui-avatar --hexagon --project">
					<svg viewBox="0 0 102 102">
						<path class="ui-avatar-border-inner" d="M40.4429 2.77436C47.0211 -0.823713 54.979 -0.823711 61.5572 2.77436L88.9207 17.7412C95.9759 21.6001 100.363 29.001 100.363 37.0426V64.9573C100.363 72.9989 95.9759 80.3998 88.9207 84.2588L61.5572 99.2256C54.979 102.824 47.0211 102.824 40.4429 99.2256L13.0794 84.2588C6.02419 80.3998 1.6366 72.9989 1.6366 64.9573V37.0426C1.6366 29.001 6.0242 21.6001 13.0794 17.7412L40.4429 2.77436Z"/>
						<path class="ui-avatar-border" d="M87.126 21.0224L59.7625 6.05561C54.3025 3.06921 47.6975 3.06921 42.2376 6.0556L14.8741 21.0224C9.01831 24.2253 5.3766 30.3681 5.3766 37.0426V64.9573C5.3766 71.6319 9.0183 77.7746 14.8741 80.9775L42.2376 95.9443C47.6975 98.9307 54.3025 98.9307 59.7625 95.9443L87.126 80.9775C92.9818 77.7746 96.6235 71.6319 96.6235 64.9573V37.0426C96.6235 30.3681 92.9818 24.2253 87.126 21.0224ZM61.5572 2.77436C54.979 -0.823711 47.0211 -0.823713 40.4429 2.77436L13.0794 17.7412C6.0242 21.6001 1.6366 29.001 1.6366 37.0426V64.9573C1.6366 72.9989 6.02419 80.3998 13.0794 84.2588L40.4429 99.2256C47.0211 102.824 54.979 102.824 61.5572 99.2256L88.9207 84.2588C95.9759 80.3998 100.363 72.9989 100.363 64.9573V37.0426C100.363 29.001 95.9759 21.6001 88.9207 17.7412L61.5572 2.77436Z"/>
						<path class="ui-avatar-base" d="M44.2368 10.2019C48.4219 7.93252 53.5781 7.93252 57.7632 10.2019L85.2368 25.0997C89.4219 27.3692 92 31.5632 92 36.1021V65.8977C92 70.4365 89.4219 74.6306 85.2368 76.9L57.7632 91.7978C53.5781 94.0672 48.4219 94.0672 44.2368 91.7978L16.7632 76.9C12.5781 74.6306 10 70.4365 10 65.8977V36.1021C10 31.5632 12.5781 27.3692 16.7632 25.0997L44.2368 10.2019Z"/>
					</svg>
				</div>
			`;
			}
			return this.node.avatar;
		}
	}

	exports.AvatarBase = AvatarBase;
	exports.AvatarHexagon = AvatarHexagon;
	exports.AvatarHexagonAccent = AvatarHexagonAccent;
	exports.AvatarHexagonExtranet = AvatarHexagonExtranet;
	exports.AvatarHexagonGuest = AvatarHexagonGuest;
	exports.AvatarHexagonProject = AvatarHexagonProject;
	exports.AvatarRound = AvatarRound;
	exports.AvatarRoundAccent = AvatarRoundAccent;
	exports.AvatarRoundBitrixGpt = AvatarRoundBitrixGpt;
	exports.AvatarRoundCopilot = AvatarRoundCopilot;
	exports.AvatarRoundExtranet = AvatarRoundExtranet;
	exports.AvatarRoundGuest = AvatarRoundGuest;
	exports.AvatarRoundMarta = AvatarRoundMarta;
	exports.AvatarSquare = AvatarSquare;
	exports.AvatarSquareAccent = AvatarSquareAccent;
	exports.AvatarSquareExtranet = AvatarSquareExtranet;
	exports.AvatarSquareGuest = AvatarSquareGuest;

})(this.BX.UI = this.BX.UI || {}, BX);
//# sourceMappingURL=avatar.bundle.js.map

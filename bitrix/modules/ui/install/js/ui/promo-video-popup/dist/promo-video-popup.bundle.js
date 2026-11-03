/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_iconSet_api_core, ui_buttons) {
	'use strict';

	const AnglePosition = Object.freeze({
		TOP: 'top',
		LEFT: 'left',
		BOTTOM: 'bottom',
		RIGHT: 'right'
	});
	const PromoVideoPopupEvents = Object.freeze({
		ACCEPT: 'accept',
		HIDE: 'hide'
	});
	const PromoVideoPopupButtonPosition = Object.freeze({
		LEFT: 'left',
		RIGHT: 'right',
		CENTER: 'center'
	});
	class PromoVideoPopup extends main_core_events.EventEmitter {
		#videoSrc;
		#title;
		#width;
		#text;
		#icon;
		#colors;
		#targetOptions;
		#angleOptions;
		#offset;
		#videoContainerMinHeight = 255;
		#buttonOptions = null;
		#useOverlay;
		#popup;
		constructor(options) {
			super(options);
			this.setEventNamespace('UI.PromoVideoPopup');
			this.#validateOptions(options);
			this.#videoSrc = options.videoSrc;
			this.#title = options.title;
			this.#width = options.width ?? PromoVideoPopup.getWidth();
			this.#text = options.text;
			this.#icon = this.#isIconExist(options.icon) ? options.icon : ui_iconSet_api_core.Main.B_24;
			this.#colors = options.colors;
			this.#targetOptions = options.targetOptions ?? null;
			this.#angleOptions = options.angleOptions || false;
			this.#offset = options.offset;
			this.#videoContainerMinHeight = options.videoContainerMinHeight;
			this.#buttonOptions = options.button ?? null;
			this.#useOverlay = options.useOverlay === true;
		}

		/**
		 * @deprecated
		 */
		static getWidth() {
			return 498;
		}
		show() {
			if (!this.#popup) {
				this.#iniPopup();
			}
			if (this.#popup.isShown()) {
				return;
			}
			this.#popup.show();
		}
		hide() {
			this.#popup?.close();
		}
		isShown() {
			return Boolean(this.#popup?.isShown());
		}
		adjustPosition() {
			this.#popup?.adjustPosition({
				forceBindPosition: true
			});
		}
		getWidth() {
			return this.#width;
		}
		setTargetOptions(targetOptions) {
			this.#targetOptions = targetOptions;
			if (this.#popup) {
				this.#popup.setBindElement(targetOptions);
			}
			return this;
		}
		#iniPopup() {
			const styles = getComputedStyle(document.body);
			const backgroundPrimary = styles.getPropertyValue('--ui-color-background-primary');
			const backgroundPrimaryRgb = styles.getPropertyValue('--ui-color-background-primary-rgb');
			this.#popup = new main_popup.Popup({
				bindElement: this.#targetOptions,
				cacheable: false,
				width: this.#width,
				borderRadius: '16px',
				angle: this.#angleOptions,
				content: this.#renderPopupContent(),
				closeByEsc: true,
				autoHide: true,
				closeIcon: true,
				background: `rgba(${backgroundPrimaryRgb}, 0.5)`,
				contentBackground: backgroundPrimary,
				contentPadding: 12,
				contentBorderRadius: '8px',
				overlay: this.#getPopupOverlay(),
				className: this.#getPopupClassname(),
				events: {
					onPopupClose: () => {
						this.#keepStateForClosing();
					},
					/**
					 * The popup is not cacheable, so it is taken apart right after the closing. This step
					 * is the one every way the window goes reaches, a destruction in the middle of the
					 * closing included, while the step after the close is skipped there. The reference
					 * goes before the event: a consumer that shows the promo from its own handler has to
					 * get a new window built for it, not the one on its way out. The event itself leaves
					 * the destruction: the popup takes its node, its overlay and its listeners apart
					 * after this handler, and a subscriber that throws would leave that undone.
					 */
					onPopupDestroy: () => {
						this.#popup = null;
						queueMicrotask(() => {
							this.emit(PromoVideoPopupEvents.HIDE);
						});
					}
				},
				animation: {
					showClassName: '--show',
					closeClassName: this.#getAnimationCloseClassName(),
					closeAnimationType: 'animation'
				}
			});
			this.#popup.setOffset({
				offsetTop: this.#offset?.top,
				offsetLeft: this.#offset?.left
			});
		}

		/**
		 * The popup takes the show class off and puts the close class on in one go, so a close that
		 * interrupts the show would otherwise start the closing from the resting visible state and
		 * make the popup jump. The state the show was cut at becomes the first frame of the closing.
		 */
		#keepStateForClosing() {
			const container = this.#popup.getPopupContainer();

			// A repeated close keeps the movement of the close going, so a state written down again
			// would move the first frame of a closing already under way.
			if (main_core.Dom.hasClass(container, this.#getAnimationCloseClassName())) {
				return;
			}
			const interrupted = getComputedStyle(container);
			main_core.Dom.style(container, {
				'--ui__promo-video-popup_close-from-opacity': interrupted.opacity,
				'--ui__promo-video-popup_close-from-transform': interrupted.transform
			});
		}
		#getPopupClassname() {
			let classNames = ['ui__promo-video-popup'];
			if (this.#angleOptions?.position === AnglePosition.RIGHT) {
				classNames = [...classNames, '--from-right'];
			}
			if (this.#angleOptions?.position === AnglePosition.TOP) {
				classNames = [...classNames, '--from-top'];
			}
			return classNames.join(' ');
		}
		#getAnimationCloseClassName() {
			switch (this.#angleOptions?.position) {
				case AnglePosition.RIGHT:
					{
						return '--close-left';
					}
				case AnglePosition.TOP:
					{
						return '--close-bottom';
					}
				default:
					{
						return '--close';
					}
			}
		}
		#renderPopupContent() {
			return main_core.Tag.render`
			<div
				class="ui__promo-video-popup-content"
				style="${this.#getPopupContentVariablesStyles()}"
			>
				<div class="ui__promo-video-popup-content_header">
					<div class="ui__promo-video-popup-content_header-icon">
						${this.#renderIcon()}
					</div>
					<div class="ui__promo-video-popup-content_header-title">
						${this.#title}
					</div>
				</div>
				<div class="ui__promo-video-popup-content_promo-text">
					${this.#text}
				</div>
				<div
					class="ui__promo-video-popup-content_promo-video-wrapper"
					style="min-height: ${`${this.#videoContainerMinHeight}px`}"
				>
					${this.#renderVideo()}
				</div>
				<div class="${this.#getPopupFooterElementClassname()}">
					${this.#renderAcceptButton()}
				</div>
			</div>
		`;
		}
		#renderVideo() {
			const videoElement = main_core.Tag.render`
			<video
				src="${this.#videoSrc}"
				autoplay
				preload
				loop
				class="ui__promo-video-popup-content_promo-video"
			></video>
		`;

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			videoElement.addEventListener('canplay', () => {
				videoElement.muted = true;
				videoElement.play();
			});
			return videoElement;
		}
		#renderAcceptButton() {
			const buttonOptions = this.#getButtonOptions();
			const btn = new ui_buttons.Button({
				color: buttonOptions.color,
				text: buttonOptions.text,
				size: buttonOptions.size,
				round: true,
				onclick: () => {
					this.emit(PromoVideoPopupEvents.ACCEPT);
				}
			});
			return btn.render();
		}
		#renderIcon() {
			const color = getComputedStyle(document.body).getPropertyValue('--ui-color-on-primary');
			const icon = new ui_iconSet_api_core.Icon({
				color,
				size: 18,
				icon: this.#icon
			});
			return icon.render();
		}
		#getPopupContentVariablesStyles() {
			const cssVariables = {};
			if (this.#getOptionsTitleColor()) {
				cssVariables['--ui__promo-video-popup_title-color'] = this.#getOptionsTitleColor();
			}
			if (this.#getOptionsIconColor()) {
				cssVariables['--ui__promo-video-popup_icon-color'] = this.#getOptionsIconColor();
			}
			return Object.entries(cssVariables).map(([variable, value]) => {
				return `${variable}: ${value}`;
			}).join(';');
		}
		#getOptionsTitleColor() {
			return this.#colors?.title;
		}
		#getOptionsIconColor() {
			return this.#colors?.iconBackground;
		}
		#getOptionsButtonColor() {
			return this.#colors?.button;
		}

		// eslint-disable-next-line sonarjs/cognitive-complexity
		#validateOptions(options) {
			const title = options?.title;
			const text = options?.text;
			const video = options?.videoSrc;
			const iconColor = options?.colors?.iconBackground;
			const titleColor = options?.colors?.title;
			const buttonColor = options?.colors?.button;
			const targetOptions = options?.targetOptions;
			const offset = options?.offset;
			const videoContainerMinHeight = options?.videoContainerMinHeight;
			if (!options) {
				throw new TypeError('UI.PromoVideoPopup: options are required for constructor');
			}
			if (!targetOptions) {
				throw new Error('UI.PromoVideoPopup: targetOptions is required option');
			}
			if (title && main_core.Type.isString(title) === false) {
				throw new TypeError('UI.PromoVideoPopup: title option must be string');
			}
			if (iconColor && main_core.Type.isStringFilled(iconColor) === false) {
				throw new TypeError('UI.PromoVideoPopup: colors.icon option must be string');
			}
			if (titleColor && main_core.Type.isStringFilled(titleColor) === false) {
				throw new TypeError('UI.PromoVideoPopup: colors.title option must be string');
			}
			if (buttonColor && Object.values(ui_buttons.ButtonColor).includes(buttonColor) === false) {
				throw new TypeError('UI.PromoVideoPopup: colors.button option must be from ButtonColor from ui.buttons');
			}
			if (text && main_core.Type.isString(text) === false) {
				throw new TypeError('UI.PromoVideoPopup: description option must be string');
			}
			if (!video) {
				throw new Error('UI.PromoVideoPopup: videoSrc is required option');
			}
			if (video && main_core.Type.isStringFilled(video) === false) {
				throw new Error('UI.PromoVideoPopup: videoSrc must be string');
			}
			if (offset && main_core.Type.isPlainObject(offset) === false) {
				throw new Error('UI.PromoVideoPopup: offset options must be plain object with top and left properties');
			}
			if (offset?.top && main_core.Type.isNumber(offset?.top) === false) {
				throw new TypeError('UI.PromoVideoPopup: offset.top option must be number');
			}
			if (offset?.left && main_core.Type.isNumber(offset?.left) === false) {
				throw new TypeError('UI.PromoVideoPopup: offset.left option must be number');
			}
			if (videoContainerMinHeight && main_core.Type.isNumber(videoContainerMinHeight) === false) {
				throw new TypeError('UI.PromoVideoPopup: videoContainerMinHeight option must be number');
			}
		}
		#isIconExist(icon) {
			return Object.values(ui_iconSet_api_core.Set).includes(icon);
		}
		#getButtonOptions() {
			const defaultOptions = this.#getDefaultButtonOptions();
			return {
				text: this.#buttonOptions?.text ?? defaultOptions.text,
				color: this.#buttonOptions?.color ?? defaultOptions.color,
				size: this.#buttonOptions?.size ?? defaultOptions.size,
				position: this.#buttonOptions?.position ?? defaultOptions.position
			};
		}
		#getDefaultButtonOptions() {
			return {
				text: main_core.Loc.getMessage('PROMO_VIDEO_POPUP_ACCEPT'),
				size: ui_buttons.ButtonSize.SMALL,
				color: this.#getOptionsButtonColor() || ui_buttons.ButtonColor.PRIMARY,
				position: PromoVideoPopupButtonPosition.LEFT
			};
		}
		#getPopupOverlay() {
			return this.#useOverlay ? {
				backgroundColor: 'rgba(0, 0, 0, 0.4)'
			} : false;
		}
		#getPopupFooterElementClassname() {
			let buttonAlignModifier = '';
			if (this.#getButtonOptions().position === PromoVideoPopupButtonPosition.CENTER) {
				buttonAlignModifier = '--align-center';
			}
			if (this.#getButtonOptions().position === PromoVideoPopupButtonPosition.RIGHT) {
				buttonAlignModifier = '--align-right';
			}
			return `ui__promo-video-popup-content_footer ${buttonAlignModifier}`;
		}
	}

	exports.AnglePosition = AnglePosition;
	exports.PromoVideoPopup = PromoVideoPopup;
	exports.PromoVideoPopupButtonPosition = PromoVideoPopupButtonPosition;
	exports.PromoVideoPopupEvents = PromoVideoPopupEvents;

})(this.BX.UI = this.BX.UI || {}, BX, BX.Event, BX.Main, BX.UI.IconSet, BX.UI);
//# sourceMappingURL=promo-video-popup.bundle.js.map

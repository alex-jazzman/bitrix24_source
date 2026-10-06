/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	class ReleaseSlider extends main_core_events.EventEmitter {
		#id;
		#windowMessageHandler = null;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Intranet.Bitrix24.ReleaseSlider');
			options = main_core.Type.isPlainObject(options) ? options : {};
			this.subscribeFromOptions(options.events);
			this.url = main_core.Type.isStringFilled(options.url) ? options.url : 'about:blank';
			this.#id = `release-slider-${main_core.Text.getRandom()}`;
			this.sliderOptions = main_core.Type.isPlainObject(options.sliderOptions) ? options.sliderOptions : {};
			this.#windowMessageHandler = this.#handleWindowMessage.bind(this);
			this.html = new main_core.Cache.MemoryCache();
		}
		show() {
			if (this.isOpen()) {
				return;
			}
			const defaultOptions = {
				width: 1100,
				customLeftBoundary: 0
			};
			const options = Object.assign({}, defaultOptions, this.sliderOptions);
			const userEvents = main_core.Type.isPlainObject(options.events) ? options.events : {};
			options.events = {
				onCloseComplete: () => {
					main_core.Event.unbind(window, 'message', this.#windowMessageHandler);
					this.emit('onCloseComplete');
				},
				onOpenComplete: () => {
					main_core.Event.bind(window, 'message', this.#windowMessageHandler);
				}
			};
			options.contentCallback = slider => {
				for (const eventName in userEvents) {
					if (main_core.Type.isFunction(userEvents[eventName])) {
						main_core_events.EventEmitter.subscribe(slider, BX.SidePanel.Slider.getEventFullName(eventName), userEvents[eventName]);
					}
				}
				return new Promise((resolve, reject) => {
					if (this.getFrame().src !== this.url) {
						this.getFrame().src = this.url;
					}
					main_core.Event.bind(this.getFrame(), 'load', this.#handleFrameLoad.bind(this));
					resolve(this.#getContent());
				});
			};
			BX.SidePanel.Instance.open(this.getId(), options);
		}
		hide() {
			const slider = this.getSlider();
			if (slider) {
				slider.close();
			}
		}
		isOpen() {
			return this.getSlider() && this.getSlider().isOpen();
		}
		getId() {
			return this.#id;
		}
		getSlider() {
			return BX.SidePanel.Instance.getSlider(this.getId());
		}
		getFrame() {
			return this.html.remember('frame', () => {
				return main_core.Tag.render`<iframe src="about:blank" class="intranet-release-iframe"></iframe>`;
			});
		}
		#getContent() {
			return this.html.remember('content', () => {
				return main_core.Tag.render`<div class="intranet-release-iframe-container">${this.getFrame()}</div>`;
			});
		}
		#handleFrameLoad() {
			this.emit('onLoad');
		}
		#handleWindowMessage(event) {
			const frameOrigin = new URL(this.url);
			if (event.origin !== frameOrigin.origin) {
				return;
			}
			this.emit('onMessage', {
				message: event.data,
				event
			});
		}
	}

	class ReleaseEar extends main_core_events.EventEmitter {
		container = null;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Intranet.Bitrix24.ReleaseEar');
			options = main_core.Type.isPlainObject(options) ? options : {};
			this.zone = main_core.Type.isStringFilled(options.zone) ? options.zone : 'en';
			this.subscribeFromOptions(options.events);
		}
		show(animate = false) {
			if (animate) {
				main_core.Dom.removeClass(this.getContainer(), '--hidden');
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						main_core.Dom.removeClass(this.getContainer(), '--hidden');
					});
				});
			} else {
				main_core.Dom.removeClass(this.getContainer(), '--hidden');
			}
		}
		hide() {
			main_core.Dom.addClass(this.getContainer(), '--hidden');
		}
		getContainer() {
			if (this.container === null) {
				this.container = main_core.Tag.render`
				<div class="intranet-release-ear" onclick="${this.handleClick.bind(this)}">
					<div class="intranet-release-button"><i></i></div>
					<div class="intranet-release-logo --${this.zone}"></div>
				</div>
			`;
				main_core.Dom.append(this.container, document.body);
			}
			return this.container;
		}
		handleClick() {
			this.emit('onClick');
		}
	}

	class Release {
		#deactivated = false;
		#id = '';
		#autoLaunch = false;
		#showEar = true;
		constructor(releaseOptions) {
			const options = main_core.Type.isPlainObject(releaseOptions) ? releaseOptions : {};
			if (!main_core.Type.isStringFilled(options.url)) {
				throw new Error('Release: the "url" parameter is required.');
			}
			this.#id = main_core.Type.isStringFilled(options.id) ? options.id : '';
			this.#showEar = options.showEar !== false;
			this.slider = new ReleaseSlider({
				url: options.url,
				sliderOptions: options.sliderOptions,
				events: {
					onCloseComplete: this.#handleSliderClose.bind(this),
					onMessage: this.#handleFrameMessage.bind(this)
				}
			});
			if (this.#showEar) {
				this.ear = new ReleaseEar({
					zone: options.zone,
					events: {
						onClick: this.#handleEarClick.bind(this)
					}
				});
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpen', () => {
					this.getEar().hide();
				});
				const onClose = () => {
					if (BX.SidePanel.Instance.getOpenSlidersCount() === 0) {
						this.getEar().show(true);
					}
				};
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', onClose);
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onDestroy', onClose);
			}
		}
		show(mode = 'ear') {
			if (mode === 'ear' && !this.#showEar) {
				return;
			}
			if (mode === 'slider') {
				const BannerDispatcher = main_core.Reflection.getClass('BX.UI.BannerDispatcher');
				if (BannerDispatcher) {
					BannerDispatcher.critical.toQueue(() => {
						this.getSlider().show();
					}, {
						id: this.#id
					});
				} else {
					this.getSlider().show();
				}
				this.#autoLaunch = true;
				void this.#runAction('show', {
					context: 'auto'
				});
			} else if (this.#showEar) {
				if (BX.SidePanel.Instance.getOpenSlidersCount() === 0) {
					this.getEar().show();
				}
			}
		}
		getSlider() {
			return this.slider;
		}
		getEar() {
			return this.ear;
		}
		#runAction(action, labels = {}, data = {}) {
			return main_core.ajax.runComponentAction('bitrix:intranet.bitrix24.release', action, {
				mode: 'class',
				data,
				analyticsLabel: {
					module: 'intranet',
					service: this.#id,
					action,
					...labels
				}
			});
		}
		#deactivate() {
			if (this.#deactivated === false) {
				this.#deactivated = true;
				void this.#runAction('deactivate').catch(() => {
					this.#deactivated = false;
				});
			}
		}
		#handleSliderClose() {
			if (this.#showEar && BX.SidePanel.Instance.getOpenSlidersCount() === 0) {
				this.getEar().show(true);
			}
			const AutoLauncher = main_core.Reflection.getClass('BX.UI.AutoLaunch.AutoLauncher');
			if (AutoLauncher) {
				setTimeout(() => {
					AutoLauncher.unregister(this.#id);
				}, 1000);
			}
			if (this.#autoLaunch) {
				void this.#runAction('close');
				if (!this.#showEar) {
					this.#deactivate();
				}
			} else {
				this.#deactivate();
			}
		}
		#handleEarClick() {
			this.getEar().hide();
			this.getSlider().show();
			void this.#runAction('show', {
				context: 'ear-click'
			});
		}
		#handleFrameMessage(event) {
			const {
				message
			} = event.getData();
			if (!main_core.Type.isPlainObject(message)) {
				return;
			}
			if (message.command === 'endOfScroll' && this.#deactivated === false) {
				this.#deactivate();
			}
			if (message.command === 'openHelper' && BX.Helper) {
				BX.Helper.show(message.options);
			}
		}
	}

	exports.Release = Release;
	exports.ReleaseEar = ReleaseEar;
	exports.ReleaseSlider = ReleaseSlider;

})(this.BX.Intranet.Bitrix24 = this.BX.Intranet.Bitrix24 || {}, BX, BX.Event);
//# sourceMappingURL=script.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, ui_analytics, main_core, main_popup, ui_buttons, ui_avatar, landing_imagecompressor, landing_screenshoter) {
	'use strict';

	class Analytic {
		#section;
		constructor(options) {
			this.#section = options.section ?? '';
		}
		send(options) {
			ui_analytics.sendData({
				...options,
				category: 'year_summary',
				tool: 'intranet',
				c_section: this.#section
			});
		}
		next(stepId, type) {
			this.send({
				event: 'next_click',
				p1: stepId,
				type
			});
		}
		prev(stepId, type) {
			this.send({
				event: 'prev_click',
				p1: stepId,
				type
			});
		}
		share(stepId, type) {
			this.send({
				event: 'share_click',
				p1: stepId,
				type
			});
		}
		save(stepId, type) {
			this.send({
				event: 'save_click',
				p1: stepId,
				type
			});
		}
		close(stepId, type) {
			this.send({
				event: 'close_click',
				p1: stepId,
				type
			});
		}
		show(stepId, type) {
			this.send({
				event: 'popup_show',
				p1: stepId,
				type
			});
		}
	}

	class Carousel {
		#position = {
			left: 1,
			right: -1
		};
		#popup;
		#container;
		#leftControl;
		#rightControl;
		#navigation;
		#canClose;
		#userpicPath;
		#showOverlay;
		#analytic;
		constructor(options = {}) {
			this.#container = main_core.Tag.render`<div class="intranet-year-results-popup__slide-wrapper"></div>`;
			this.#canClose = options.canClose !== false;
			this.#showOverlay = options.showOverlay ?? true;
			this.#leftControl = main_core.Tag.render`<div class="intranet-year-results-popup__sidepanel-wrapper"></div>`;
			this.#rightControl = main_core.Tag.render`<div class="intranet-year-results-popup__sidepanel-wrapper"></div>`;
			this.#userpicPath = options.userpicPath;
			this.#popup = this.#createPopup();
			this.#navigation = options.navigation;
			this.#analytic = options.analytic;
			if (options?.isUseArrowNavigation !== false) {
				main_core.Event.bind(document, 'keydown', event => {
					if (this.#popup.isShown() && event.key === 'ArrowLeft') {
						this.left();
						event.preventDefault();
					} else if (this.#popup.isShown() && event.key === 'ArrowRight') {
						this.right();
						event.preventDefault();
					}
				});
			}
			this.subscribe('onShow', () => {
				this.#analytic?.show(this.#navigation.position().index(), this.#navigation.position().featureType());
			});
			this.subscribe('onClose', () => {
				this.#analytic?.close(this.#navigation.position().index(), this.#navigation.position().featureType());
			});
		}
		hasLeft() {
			return !main_core.Type.isNil(this.#navigation.position(-1));
		}
		hasRight() {
			return !main_core.Type.isNil(this.#navigation.position(1));
		}
		left() {
			if (!this.hasLeft()) {
				return;
			}
			this.#middleCardTo(this.#position.left);
			this.#showCard(this.#position.right);
			this.#addCardToLeft();
			this.#navigation.previous();
			this.#updateControls();
			this.#analytic?.prev(this.#navigation.position().index(), this.#navigation.position().featureType());
		}
		right() {
			if (!this.hasRight()) {
				return;
			}
			this.#middleCardTo(this.#position.right);
			this.#showCard(this.#position.left);
			this.#addCardToRight();
			this.#navigation.next();
			this.#updateControls();
			this.#analytic?.next(this.#navigation.position().index(), this.#navigation.position().featureType());
		}
		show() {
			this.#popup.show();
			this.#navigation.position(-1)?.addClassToContent('intranet-year-results-popup__slide--slide-out-left');
			main_core.Dom.append(this.#navigation.position(-1)?.cachedContent(), this.#container);
			main_core.Dom.append(this.#navigation.position()?.cachedContent(), this.#container);
			this.#navigation.position(1)?.addClassToContent('intranet-year-results-popup__slide--slide-out-right');
			main_core.Dom.append(this.#navigation.position(1)?.cachedContent(), this.#container);
			this.#updateControls();
		}
		close() {
			this.#popup.close();
		}
		subscribe(eventName, callback) {
			this.#popup.subscribe(eventName, callback);
		}
		#showCard(position) {
			this.#navigation.position(position)?.removeClassFromContent(['intranet-year-results-popup__slide--slide-out-left', 'intranet-year-results-popup__slide--slide-out-right']);
		}
		#middleCardTo(side) {
			this.#navigation.position(side)?.destroy();
			if (side === this.#position.left) {
				this.#navigation.position()?.addClassToContent('intranet-year-results-popup__slide--slide-out-right');
			} else if (side === this.#position.right) {
				this.#navigation.position()?.addClassToContent('intranet-year-results-popup__slide--slide-out-left');
			}
		}
		#addCardToRight() {
			this.#navigation.position(2)?.addClassToContent('intranet-year-results-popup__slide--slide-out-right');
			main_core.Dom.append(this.#navigation.position(2)?.cachedContent(), this.#container);
		}
		#addCardToLeft() {
			this.#navigation.position(-2)?.addClassToContent('intranet-year-results-popup__slide--slide-out-left');
			main_core.Dom.prepend(this.#navigation.position(-2)?.cachedContent(), this.#container);
		}
		#createWrapper() {
			return main_core.Tag.render`
			<div id="popup-content-base">
				<div class="intranet-year-results-popup__content">
					<div class="intranet-year-results-popup__header">
						<div class="intranet-year-results-popup__user">
							${this.#createAvatar()}
						</div>
						<div class="intranet-year-results-popup__header-wrapper">
							${this.#canClose ? this.closeButton() : ''}
						</div>
					</div>
					${this.#leftControl}
					${this.#container}
					${this.#rightControl}
				</div>
			</div>
		`;
		}
		#createPopup() {
			const popup = new main_popup.Popup({
				closeByEsc: this.#canClose,
				content: this.#createWrapper(),
				padding: 0,
				className: 'intranet-year-results-popup',
				fixed: true,
				overlay: this.#showOverlay ? {
					opacity: 100,
					backgroundColor: 'rgba(0, 32, 78, 0.46)'
				} : false,
				animation: {
					showClassName: 'intranet-year-results-popup__show-animation',
					closeAnimationType: 'transition'
				}
			});
			main_core.Event.bindOnce(popup.getPopupContainer(), 'animationend', () => {
				main_core.Dom.addClass(popup.getPopupContainer(), 'intranet-year-results-popup__show-animation-end');
			});
			return popup;
		}
		closeButton() {
			const button = new ui_buttons.Button({
				size: ui_buttons.Button.Size.SMALL,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				icon: BX.UI.IconSet.Outline.CROSS_L,
				className: '--ui-context-edge-dark intranet-year-results-popup__navigation-button',
				onclick: () => this.close()
			});
			return button.render();
		}
		#createAvatar() {
			if (main_core.Type.isStringFilled(this.#userpicPath)) {
				const avatar = new ui_avatar.AvatarRound({
					size: 84,
					userpicPath: this.#userpicPath
				});
				return avatar.getContainer();
			}
			return '';
		}
		#createRightControl() {
			const button = new ui_buttons.Button({
				size: ui_buttons.Button.Size.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				icon: BX.UI.IconSet.Outline.ARROW_RIGHT_M,
				className: '--ui-context-edge-dark intranet-year-results-popup__navigation-button',
				onclick: () => this.right()
			});
			return button.render();
		}
		#createLeftControl() {
			const button = new ui_buttons.Button({
				size: ui_buttons.Button.Size.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				icon: BX.UI.IconSet.Outline.ARROW_LEFT_M,
				className: '--ui-context-edge-dark intranet-year-results-popup__navigation-button',
				onclick: () => this.left()
			});
			return button.render();
		}
		#updateControls() {
			main_core.Dom.clean(this.#leftControl);
			main_core.Dom.clean(this.#rightControl);
			if (this.#navigation.position(-1)) {
				main_core.Dom.append(this.#createLeftControl(), this.#leftControl);
			}
			if (this.#navigation.position(1)) {
				main_core.Dom.append(this.#createRightControl(), this.#rightControl);
			}
		}
	}

	class View {
		#content;
		content() {
			return main_core.Tag.render``;
		}
		cachedContent() {
			if (!this.#content) {
				this.#content = this.content();
			}
			return this.#content;
		}
		destroy() {
			main_core.Dom.remove(this.#content);
			this.#content = null;
		}
		addClassToContent(className) {
			main_core.Dom.addClass(this.cachedContent(), className);
		}
		removeClassFromContent(className) {
			main_core.Dom.removeClass(this.cachedContent(), className);
		}
		featureType() {
			return null;
		}
		index() {
			return null;
		}
	}

	class Navigation {
		#views = [];
		#current = 0;
		#show;
		constructor(options) {
			if (main_core.Type.isArray(options.views)) {
				this.#views = options.views.filter(view => view instanceof View);
			}
			this.#current = main_core.Type.isInteger(options.start) ? options.start : 0;
		}
		get(index) {
			return this.#views[index];
		}
		next() {
			this.move(this.#current + 1);
		}
		position(offset = 0) {
			return this.get(this.#current + offset);
		}
		current() {
			return this.get(this.#current);
		}
		previous() {
			this.move(this.#current - 1);
		}
		move(index) {
			const view = this.get(index);
			if (!view) {
				return;
			}
			this.#current = index;
		}
		offset(i) {
			this.#current += i;
		}
		index() {
			return this.#current;
		}
	}

	class Message {
		constructor(options) {
			this.title = options.title;
			this.description = options.description;
		}
	}

	class ShareService {
		#linkToShare;
		#screenshotToShare;
		constructor(options) {
			this.signedUserId = options?.signedUserId ?? null;
			this.signedType = options?.signedType ?? null;
		}
		isShareApiAvailable() {
			return window.isSecureContext && navigator.share && navigator.canShare;
		}
		getLinkToShare() {
			if (!this.#linkToShare) {
				this.#linkToShare = main_core.ajax.runAction('intranet.v2.AnnualSummary.getLink', {
					data: {
						signedUserId: this.signedUserId,
						signedType: this.signedType
					}
				}).then(response => response.data.link).catch(error => {
					this.#linkToShare = null;
					throw error;
				});
			}
			return this.#linkToShare;
		}
		getScreenshot(container) {
			if (!this.#screenshotToShare) {
				const sharedContainer = container.cloneNode(true);
				main_core.Dom.addClass(sharedContainer, 'intranet-year-results-popup__slide--screenshot');
				// We need to add container to DOM for html-to-image
				main_core.Dom.append(sharedContainer, document.querySelector('.intranet-year-results-popup__slide-wrapper'));
				landing_screenshoter.PageObject.getEditorWindow = () => window;
				this.#screenshotToShare = landing_screenshoter.Screenshoter.makeElementScreenshot(sharedContainer).then(sourceFile => {
					return landing_imagecompressor.ImageCompressor.compress(sourceFile, {
						maxWidth: 900,
						maxHeight: 1600
					});
				}).then(compressedFile => {
					return new File([compressedFile], 'bitrix24.png', {
						type: 'image/png'
					});
				}).catch(error => {
					this.#screenshotToShare = null;
					throw error;
				}).finally(() => {
					sharedContainer.remove();
				});
			}
			return this.#screenshotToShare;
		}
		async copyToClipboard(textToCopy) {
			if (!main_core.Type.isString(textToCopy)) {
				return Promise.reject();
			}
			if (window.isSecureContext && navigator.clipboard) {
				return new Promise((resolve, reject) => {
					setTimeout(() => navigator.clipboard.writeText(textToCopy).then(() => resolve()).catch(e => reject(e)), 0);
				});
			}
			return BX.clipboard?.copy(textToCopy) ? Promise.resolve() : Promise.reject();
		}
		shareContent(shareData) {
			shareData.title = main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_TITLE');
			if (window.isSecureContext && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
				return navigator.share(shareData);
			}
			return Promise.reject();
		}
		downloadFile(file) {
			const url = URL.createObjectURL(file);
			const a = document.createElement('a');
			a.href = url;
			a.download = file.name;
			a.click();
			URL.revokeObjectURL(url);
		}
	}

	class WithButtonView extends View {
		#click;
		#text;
		#hideBtn;
		#analytic;
		#shareService;
		#menu;
		constructor(options) {
			super(options);
			this.#click = main_core.Type.isFunction(options?.btn?.click) ? options?.btn?.click : this.onShare;
			this.#text = options?.btn?.text || '';
			this.message = options.message ?? null;
			this.#hideBtn = options.hideBtn === true;
			this.#analytic = options.analytic instanceof Analytic ? options.analytic : null;
			this.#shareService = options.shareService instanceof ShareService ? options.shareService : null;
		}
		shareButton() {
			if (this.#hideBtn) {
				return main_core.Tag.render``;
			}
			const handler = btn => {
				if (btn.isWaiting()) {
					return;
				}
				btn.setWaiting();
				Promise.all([this.#click(btn)]).then(() => btn.setWaiting(false)).catch(() => btn.setWaiting(false));
				this.#analytic?.share(this.index(), this.featureType());
			};
			const button = new ui_buttons.Button({
				useAirDesign: true,
				className: 'intranet-year-results-popup__footer-button',
				onclick: handler,
				text: this.#text,
				wide: true
			});
			return button.render();
		}
		downloadButton() {
			if (this.#hideBtn) {
				return main_core.Tag.render``;
			}
			const handler = btn => {
				if (btn.isWaiting()) {
					return;
				}
				btn.setWaiting();
				this.#analytic?.save(this.index(), this.featureType());
				this.#shareService.getScreenshot(this.cachedContent()).then(file => {
					this.#shareService.downloadFile(file);
				}).catch(e => console.error(e)).finally(() => {
					btn.setWaiting(false);
				});
			};
			const button = new ui_buttons.Button({
				useAirDesign: true,
				className: 'intranet-year-results-popup__footer-button intranet-year-results-popup__footer-button--white',
				onclick: handler,
				text: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_DOWNLOAD_BTN'),
				wide: true
			});
			return button.render();
		}
		onShare(event) {
			return this.#shareService.isShareApiAvailable() ? this.openShareOptionsPopup(event.button) : this.copyLink();
		}
		openShareOptionsPopup(target) {
			if (!this.#menu) {
				this.#menu = new main_popup.Menu({
					autoHide: true,
					closeByEsc: true,
					fixed: true,
					angle: {
						offset: main_core.Dom.getPosition(target).height / 2,
						position: 'left'
					},
					items: [{
						text: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_COPY_LINK'),
						onclick: async () => this.copyLink()
					}, {
						text: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_SCREENSHOT_TITLE'),
						onclick: async () => {
							try {
								const file = await this.#shareService.getScreenshot(this.cachedContent());
								await this.#shareService.shareContent({
									files: [file]
								});
							} catch (error) {
								console.error(error);
								throw error;
							}
						}
					}]
				});
				this.#menu.getPopupWindow().setBindElement(target);
				this.#menu.getPopupWindow().setOffset({
					offsetLeft: main_core.Dom.getPosition(target).width + 14,
					offsetTop: -(main_core.Dom.getPosition(target).height + 16)
				});
			}
			this.#menu.toggle();
			return Promise.resolve();
		}
		async copyLink() {
			try {
				const url = await this.#shareService.getLinkToShare();
				await this.#shareService.copyToClipboard(url);
				top.BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_NOTIFY_COPY'),
					autoHideDelay: 2500
				});
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
	}

	class StartView extends WithButtonView {
		content() {
			return main_core.Tag.render`
			<div class="intranet-year-results-popup__slide intranet-year-results-popup__slide--start">
				<div class="intranet-year-results-popup__slide-image"></div>
				<div class="intranet-year-results-popup__slide-content">
					<div class="intranet-year-results-popup__logo"></div>
					<h2 class="intranet-year-results-popup__title intranet-year-results-popup__title--bold">${main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_START_VIEW_TITLE')}</h2>
					<div class="intranet-year-results-popup__description-container">
						<p class="intranet-year-results-popup__description">${main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_START_VIEW_DESCRIPTION')}</p>
						<p class="intranet-year-results-popup__description">${main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_START_VIEW_DESCRIPTION_2')}</p>
					</div>
					<p class="intranet-year-results-popup__postscript">${main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_START_VIEW_EPILOGUE')}</p>
				</div>
				${this.shareButton()}
			</div>
		`;
		}
		featureType() {
			return 'intro';
		}
		index() {
			return 0;
		}
	}

	const FeatureType = Object.freeze({
		REACTION: 'reaction',
		BOARD: 'board',
		CHANNEL: 'channel',
		CHECKIN: 'checkin',
		COLLAB: 'collab',
		COPILOT: 'copilot',
		DEAL: 'deal',
		SITE: 'site',
		MESSAGE: 'message',
		TASK: 'task',
		WORKFLOW: 'workflow'
	});

	class SummaryView extends WithButtonView {
		constructor(options) {
			super(options);
			this.message = options.message;
			this.feature = options.feature;
			this.progressBar = options.progressBar;
		}
		content() {
			return main_core.Tag.render`
			<div class="intranet-year-results-popup__slide intranet-year-results-popup__slide--${this.feature}">
				<div class="intranet-year-results-popup__slide-image"></div>
				<div class="intranet-year-results-popup__slide-content">
					${this.progressBar?.render()}
					<div class="intranet-year-results-popup__logo"></div>
					<h2 class="intranet-year-results-popup__title">${this.message?.title}</h2>
					<div class="intranet-year-results-popup__description-container">
						<p class="intranet-year-results-popup__description">${this.message?.description}</p>
					</div>
				</div>
				<div class="intranet-year-results-popup__slide-footer">
					${this.downloadButton()}
					${this.shareButton()}
				</div>
			</div>
		`;
		}
		featureType() {
			return this.feature;
		}
		index() {
			return (this.progressBar?.currentStep ?? 0) + 1;
		}
	}

	class ProgressBar {
		constructor(options) {
			this.currentStep = options.currentStep;
			this.totalStep = options.totalStep;
		}
		render() {
			const progressBar = main_core.Tag.render`
			<div class="intranet-year-results-popup__progress-bar"></div>
		`;
			for (let i = 0; i <= this.currentStep; i++) {
				main_core.Dom.append(main_core.Tag.render`<div class="intranet-year-results-popup__progress-bar-step intranet-year-results-popup__progress-bar-step--active"></div>`, progressBar);
			}
			for (let i = this.currentStep + 1; i < this.totalStep; i++) {
				main_core.Dom.append(main_core.Tag.render`<div class="intranet-year-results-popup__progress-bar-step"></div>`, progressBar);
			}
			return progressBar;
		}
	}

	class WinnerView extends WithButtonView {
		#message;
		#featureClass;
		constructor(options) {
			super(options);
			this.#message = options.message;
			this.#featureClass = options.featureClass ?? '';
			this.progressBar = options.progressBar;
			this.feature = options.feature;
		}
		content() {
			return main_core.Tag.render`
			<div class="intranet-year-results-popup__slide ${this.#featureClass} intranet-year-results-popup__slide--character">
				<div class="intranet-year-results-popup__slide-image"></div>
				<div class="intranet-year-results-popup__slide-content">
					${this.progressBar?.render()}
					<div class="intranet-year-results-popup__logo"></div>
					<h3 class="intranet-year-results-popup__subtitle">${this.#message.title}</h3>
					<h2 class="intranet-year-results-popup__title intranet-year-results-popup__title--bold">${this.#message.name}</h2>
					<p class="intranet-year-results-popup__description--character">${this.#message.description}</p>
				</div>
				<div class="intranet-year-results-popup__slide-footer">
					${this.downloadButton()}
					${this.shareButton()}
				</div>
			</div>
		`;
		}
		featureType() {
			return this.feature;
		}
		index() {
			return (this.progressBar?.currentStep ?? 0) + 1;
		}
	}

	class ViewFactory {
		#signedUserId;
		#isShowStartView = true;
		#hideBtn = false;
		#showProgressBar;
		#analytic;
		constructor(options = {}) {
			this.#signedUserId = options.signedUserId;
			this.#isShowStartView = options.isShowStartView !== false;
			this.#hideBtn = options.hideBtn === true;
			this.#showProgressBar = options.showProgressBar ?? true;
			this.#analytic = options.analytic instanceof Analytic ? options.analytic : null;
		}
		create(data, context, progressBar) {
			return new SummaryView({
				hideBtn: this.#hideBtn,
				count: data.count,
				btn: {
					text: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_BTN')
				},
				events: {
					left: () => context.previous(),
					right: () => context.next(),
					close: () => context.close()
				},
				message: new Message(data?.message),
				feature: data.id,
				progressBar,
				analytic: this.#analytic,
				shareService: new ShareService({
					signedType: data?.signedId,
					signedUserId: this.#signedUserId
				})
			});
		}
		createTop(data, context) {
			const summary = [];
			if (this.#isShowStartView) {
				summary.push(this.createStartView(context));
			}
			const totalStep = data.length;
			data.forEach((item, index) => {
				let progressBar = null;
				if (this.#showProgressBar) {
					progressBar = new ProgressBar({
						currentStep: index,
						totalStep
					});
				}
				let view = null;
				if (item?.id?.includes('winner_')) {
					view = this.createWinner(item, context, progressBar);
				} else {
					view = this.create(item, context, progressBar);
				}
				if (view) {
					summary.push(view);
				}
			});
			return [...summary];
		}
		createWinner(data, context, progressBar) {
			return new WinnerView({
				feature: data.id,
				hideBtn: this.#hideBtn,
				message: data?.message,
				featureClass: (data?.featureId ?? 'base') === 'base' ? '' : `intranet-year-results-popup__slide--${data?.featureId}`,
				btn: {
					text: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_BTN')
				},
				events: {
					left: () => context.previous(),
					close: () => context.close()
				},
				progressBar,
				analytic: this.#analytic,
				shareService: new ShareService({
					signedType: data?.signedId,
					signedUserId: this.#signedUserId
				})
			});
		}
		createList(data, context) {
			const commonEvents = {
				btn: {
					text: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_SHARE_BTN')
				},
				events: {
					left: () => context.previous(),
					right: () => context.next(),
					close: () => context.close()
				}
			};
			const result = [this.createStartView(context)];
			Object.entries(FeatureType).forEach(([id, feature]) => {
				result.push(new SummaryView({
					...commonEvents,
					message: new Message({
						title: `You often use ${feature}`,
						description: `You use "${feature}" more than others in your company. Total: ${Math.floor(Math.random() * (1000 - 1 + 1)) + 1}`
					}),
					feature,
					analytic: this.#analytic
				}));
			});
			result.push(new WinnerView({
				message: {
					title: 'You are',
					name: 'Mr. Busy Bro',
					description: 'Use more Busy'
				},
				featureClass: '',
				btn: {
					text: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_LOOK_BTN'),
					click: () => context.next()
				},
				events: {
					left: () => context.previous(),
					right: () => context.next(),
					close: () => context.close()
				},
				analytic: this.#analytic
			}));
			Object.entries(FeatureType).forEach(([id, feature]) => {
				result.push(new WinnerView({
					message: {
						title: 'You are',
						name: `Mr. ${feature}`,
						description: `Use more ${feature}`
					},
					featureClass: (feature ?? 'base') === 'base' ? '' : `intranet-year-results-popup__slide--${feature}`,
					btn: {
						text: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_LOOK_BTN'),
						click: () => context.next()
					},
					events: {
						left: () => context.previous(),
						right: () => context.next(),
						close: () => context.close()
					}
				}));
			});
			return [...result];
		}
		createStartView(context) {
			return new StartView({
				btn: {
					text: main_core.Loc.getMessage('INTRANET_ANNUAL_SUMMARY_CARD_LOOK_BTN'),
					click: () => context.next()
				},
				events: {
					right: () => context.next(),
					close: () => context.close()
				}
			});
		}
	}

	class AnnualSummary {
		#carousel;
		#analytic;
		constructor(top, options) {
			this.#analytic = new Analytic({
				section: options.section ?? 'auto'
			});
			const factory = new ViewFactory({
				...options,
				analytic: this.#analytic
			});
			const navigation = new Navigation({
				start: 0,
				views: top?.all ? factory.createList(top, this) : factory.createTop(top, this)
			});
			this.#carousel = new Carousel({
				navigation,
				isUseArrowNavigation: true,
				canClose: options.canClose !== false,
				userpicPath: options.userpicPath,
				showOverlay: options.showOverlay,
				analytic: this.#analytic
			});
		}
		close() {
			this.#carousel.close();
		}
		show() {
			this.#carousel.show();
		}
		subscribe(eventName, callback) {
			this.#carousel.subscribe(eventName, callback);
		}
		next() {
			this.#carousel.right();
		}
		previous() {
			this.#carousel.left();
		}
	}

	exports.AnnualSummary = AnnualSummary;

})(this.BX.Intranet.NotifyBanner = this.BX.Intranet.NotifyBanner || {}, BX.UI.Analytics, BX, BX.Main, BX.UI, BX.UI, BX.Landing, BX.Landing);
//# sourceMappingURL=annual-summary.bundle.js.map

/* eslint-disable */
(function (crm_integration_ui_bannerDispatcher, main_core, main_core_events, main_popup, ui_buttons) {
	'use strict';

	const namespaceCrmWhatsNew = main_core.Reflection.namespace('BX.Crm.WhatsNew');

	// it's bottom by default

	class ActionViewMode {
		#slides;
		#steps;
		#options;
		#popup;
		#bannerDispatcher = null;
		#closeOptionName;
		#closeOptionCategory;
		#isViewHappened = false;
		#autoscroll = null;
		constructor({
			slides,
			steps,
			options,
			closeOptionCategory,
			closeOptionName
		}) {
			this.#slides = [];
			this.#steps = [];
			this.#options = options;
			this.#popup = null;
			this.slideClassName = 'crm-whats-new-slides-wrapper';
			this.#closeOptionCategory = main_core.Type.isString(closeOptionCategory) ? closeOptionCategory : '';
			this.#closeOptionName = main_core.Type.isString(closeOptionName) ? closeOptionName : '';
			this.onClickClose = this.onClickCloseHandler.bind(this);
			this.whatNewPromise = null;
			this.tourPromise = null;
			this.#prepareSlides(slides);
			this.#prepareSteps(steps);
		}
		show() {
			if (this.#options.isNumberOfViewsExceeded) {
				// eslint-disable-next-line no-console
				console.warn('Number of views exceeded');
				return;
			}
			if (this.#slides.length > 0) {
				this.#executeWhatsNew();
			} else if (this.#steps.length > 0) {
				this.#executeGuide();
			}
		}
		#prepareSlides(slideConfigs) {
			if (slideConfigs.length > 0) {
				this.whatNewPromise = main_core.Runtime.loadExtension('ui.dialogs.whats-new');
			}
			this.#slides = slideConfigs.map(slideConfig => {
				return {
					className: this.slideClassName,
					title: slideConfig.title,
					html: this.#getPreparedSlideHtml(slideConfig)
				};
			});
		}
		#getPreparedSlideHtml(slideConfig) {
			const slide = main_core.Tag.render`
			<div class="crm-whats-new-slide">
				<img src="${slideConfig.innerImage}" alt="">
				<div class="crm-whats-new-slide-inner-title"> ${slideConfig.innerTitle} </div>
				<p>${slideConfig.innerDescription}</p>
			</div>
		`;
			const buttons = this.#getPrepareSlideButtons(slideConfig);
			if (buttons.length > 0) {
				const buttonsContainer = main_core.Tag.render`<div class="crm-whats-new-slide-buttons"></div>`;
				main_core.Dom.append(buttonsContainer, slide);
				buttons.forEach(button => {
					main_core.Dom.append(button.getContainer(), buttonsContainer);
				});
			}
			return slide;
		}
		async #getBannerDispatcher() {
			if (this.#bannerDispatcher) {
				return this.#bannerDispatcher;
			}
			const {
				BannerDispatcher: Dispatcher
			} = await main_core.Runtime.loadExtension('crm.integration.ui.banner-dispatcher');
			this.#bannerDispatcher = new Dispatcher();
			return this.#bannerDispatcher;
		}
		#getPrepareSlideButtons(slideConfig) {
			let buttons = [];
			if (slideConfig.buttons) {
				const className = 'ui-btn ui-btn-primary ui-btn-hover ui-btn-round ';
				buttons = slideConfig.buttons.map(buttonConfig => {
					const config = {
						className: className + (buttonConfig.className ?? ''),
						text: buttonConfig.text
					};
					if (buttonConfig.onClickClose) {
						config.onclick = () => this.onClickClose();
					} else if (buttonConfig.helpDeskCode) {
						config.onclick = () => this.#showHelpDesk(buttonConfig.helpDeskCode);
					}
					return new ui_buttons.Button(config);
				});
			}
			return buttons;
		}
		#prepareSteps(stepsConfig) {
			this.#steps = stepsConfig.map(stepConfig => {
				const step = {
					id: stepConfig.id,
					title: stepConfig.title,
					text: stepConfig.text,
					position: stepConfig.position,
					article: stepConfig.article,
					articleAnchor: stepConfig.articleAnchor ?? null,
					infoHelperCode: stepConfig.infoHelperCode,
					buttons: stepConfig.buttons,
					highlighter: stepConfig.highlighter ?? null,
					autoscroll: stepConfig.autoscroll ?? null,
					iconSrc: stepConfig.iconSrc ?? null
				};
				if (stepConfig.useDynamicTarget) {
					const eventName = stepConfig.eventName ?? this.#getDefaultStepEventName(step.id);
					main_core_events.EventEmitter.subscribeOnce(eventName, this.#showStepByEvent.bind(this));
				} else {
					const target = this.#getAvailableTarget(stepConfig.target);
					if (target && main_core.Dom.style(target, 'display') !== 'none') {
						step.target = stepConfig.target;
					} else if (main_core.Type.isArrayFilled(stepConfig.reserveTargets)) {
						const isFound = stepConfig.reserveTargets.some(reserveTarget => {
							const reserveTargetElement = this.#getAvailableTarget(reserveTarget);
							if (reserveTargetElement && main_core.Dom.style(reserveTargetElement, 'display') !== 'none') {
								step.target = reserveTarget;
								return true;
							}
							return false;
						});
						if (!isFound && stepConfig.ignoreIfTargetNotFound) {
							return null;
						}
					} else if (stepConfig.ignoreIfTargetNotFound) {
						return null;
					} else {
						step.target = stepConfig.target;
					}
				}
				return step;
			});
			this.#steps = this.#steps.filter(step => step !== null);
			if (this.#steps.length > 0) {
				this.tourPromise = main_core.Runtime.loadExtension('ui.tour');
			}
		}
		#showStepByEvent(event) {
			const {
				disableBannerDispatcher = false
			} = this.#options;
			void this.tourPromise.then(exports$1 => {
				const {
					stepId,
					target
				} = event.data;
				// eslint-disable-next-line no-shadow
				const step = this.#steps.find(step => step.id === stepId);
				if (!step) {
					console.error('step not found');
					return;
				}
				step.target = target;
				const {
					Guide
				} = exports$1;
				const guide = this.createGuideInstance(Guide, [step], true);
				this.setStepPopupOptions(guide.getPopup());
				if (disableBannerDispatcher === false) {
					this.#runGuideWithBannerDispatcher(guide);
				} else {
					this.#runGuide(guide);
				}
			});
		}
		#runGuideWithBannerDispatcher(guide) {
			void this.#getBannerDispatcher().then(dispatcher => {
				dispatcher.toQueue(onDone => {
					this.#runGuide(guide, onDone);
				});
			});
		}
		#onGuideFinish(guide, onDone = null) {
			guide.subscribe('UI.Tour.Guide:onFinish', () => {
				this.save();
				if (onDone) {
					onDone();
				}
			});
		}
		#runGuide(guide, onDone = null) {
			let canShowGuide = !this.#isAnyPopupShown();
			const {
				target
			} = guide.steps[0];
			if (canShowGuide && main_core.Type.isStringFilled(target)) {
				canShowGuide = this.#getAvailableTarget(target) !== null;
			}
			if (canShowGuide) {
				this.#onGuideFinish(guide, onDone);
				void this.#onBeforeShow(guide).then(() => {
					guide.showNextStep();
				});
			} else {
				onDone();
			}
		}
		#getAvailableTarget(target) {
			if (!main_core.Type.isStringFilled(target)) {
				return null;
			}
			const targetNode = document.querySelector(target);
			return main_core.Type.isDomNode(targetNode) ? targetNode : null;
		}
		#getDefaultStepEventName(stepId) {
			return `Crm.WhatsNew::onTargetSetted::${stepId}`;
		}
		#isMultipleViewsAllowed() {
			return this.#options.numberOfViewsLimit > 1;
		}
		onClickCloseHandler() {
			const lastPosition = this.#popup.getLastPosition();
			const currentPosition = this.#popup.getPositionBySlide(this.#popup.getCurrentSlide());
			if (currentPosition >= lastPosition) {
				this.#popup.destroy();
			} else {
				this.#popup.selectNextSlide();
			}
		}
		#showHelpDesk(code) {
			if (top.BX.Helper) {
				top.BX.Helper.show(`redirect=detail&code=${code}`);
				event.preventDefault();
			}
		}
		#executeWhatsNew() {
			const {
				disableBannerDispatcher = false
			} = this.#options;
			if (this.#isAnyPopupShown()) {
				return;
			}
			void this.whatNewPromise.then(exports$1 => {
				const {
					WhatsNew
				} = exports$1;
				this.#popup = new WhatsNew({
					slides: this.#slides,
					popupOptions: {
						height: 440
					},
					events: {
						onDestroy: () => {
							this.save();
							this.#executeGuide(false);
						}
					}
				});
				if (disableBannerDispatcher === false) {
					// eslint-disable-next-line promise/no-nesting
					void this.#getBannerDispatcher().then(dispatcher => {
						dispatcher.toQueue(onDone => {
							this.#popup.subscribe('onDestroy', onDone);
							this.#popup.show();
						});
					});
				} else {
					this.#popup.show();
				}
				ActionViewMode.whatsNewInstances.push(this.#popup);
			}, this);
		}
		#executeGuide(isAddToQueue = true) {
			const {
				disableBannerDispatcher = false
			} = this.#options;
			let steps = main_core.clone(this.#steps);
			steps = steps.filter(step => Boolean(step.target));
			if (steps.length === 0) {
				return;
			}
			void this.tourPromise.then(exports$1 => {
				if (ActionViewMode.tourInstances.some(existedGuide => existedGuide.getPopup()?.isShown())) {
					return; // do not allow many guides at the same time
				}
				if (this.#isAnyPopupShown()) {
					return;
				}
				const {
					Guide
				} = exports$1;
				const guide = this.createGuideInstance(Guide, steps, this.#steps.length <= 1);
				ActionViewMode.tourInstances.push(guide);
				this.setStepPopupOptions(guide.getPopup());
				if (isAddToQueue) {
					if (disableBannerDispatcher === false) {
						this.#runGuideWithBannerDispatcher(guide);
					} else {
						this.#runGuide(guide);
					}
					return;
				}
				this.#showGuide(guide);
			});
		}
		#isAnyPopupShown() {
			return main_popup.PopupManager?.isAnyPopupShown();
		}
		#showGuide(guide) {
			if (guide.steps.length > 1 || this.#options.showOverlayFromFirstStep) {
				guide.start();
			} else {
				guide.showNextStep();
			}
		}
		createGuideInstance(Guide, steps, onEvents) {
			const guide = new Guide({
				onEvents,
				canShowWithoutTarget: this.#options.canShowWithoutTarget ?? false,
				steps: steps.map(step => {
					let highlighter = null;
					if (main_core.Type.isPlainObject(step.highlighter)) {
						highlighter = step.highlighter;
						// eslint-disable-next-line no-param-reassign
						delete step.highlighter;
					}
					if (main_core.Type.isPlainObject(step.autoscroll)) {
						this.#autoscroll = step.autoscroll;
						// eslint-disable-next-line no-param-reassign
						delete step.autoscroll;
					}
					return {
						...step,
						// why here and not in prepareSteps?
						// we need a guide instance reference
						buttons: step.buttons?.map(button => {
							return {
								text: button.text,
								event: () => {
									if (main_core.Type.isStringFilled(button.onclick?.code)) {
										// eslint-disable-next-line no-eval
										eval(button.onclick.code);
									}
									if (button.onclick?.closeAfterClick) {
										guide.close();
									}
								}
							};
						}),
						events: {
							onShow: event => {
								const {
									data
								} = event;
								if (!data) {
									return;
								}

								// custom air design for single step tours. Remove after ui implemented
								if (data.guide.steps.length === 1) {
									let airClassList = 'crm-whats-new-slide-air';
									if (main_core.Type.isArrayFilled(data.guide.steps[0].buttons)) {
										airClassList += ' --with-buttons';
									}
									if (main_core.Type.isStringFilled(data.guide.steps[0].iconSrc)) {
										airClassList += ' --with-icon';
									}
									main_core.Dom.addClass(data.guide.getPopup().getPopupContainer(), airClassList);
								}
								if (!highlighter) {
									return;
								}
								void BX.Runtime.loadExtension('ui.system.highlighter').then(() => {
									document.querySelectorAll(highlighter.target).forEach(item => {
										const element = main_core.Tag.render`<span class="ui-highlighter"></span>`;
										if (main_core.Type.isNumber(highlighter.radius)) {
											main_core.Dom.style(element, '--ui-highlighter-radius', `${highlighter.radius}px`);
										}
										main_core.Dom.append(element, item);
									});
								});
							},
							onClose: () => {
								if (!highlighter) {
									return;
								}
								document.querySelectorAll(highlighter.target).forEach(item => {
									main_core.Dom.remove(item.querySelector('.ui-highlighter'));
								});
							}
						}
					};
				}),
				events: {
					onFinish: () => {
						if (this.#slides.length === 0) {
							this.save();
						}
					}
				}
			});
			return guide;
		}
		#onBeforeShow(guide) {
			if (!main_core.Type.isPlainObject(this.#autoscroll)) {
				return Promise.resolve();
			}
			const step = guide.steps[0];
			const targetNode = this.#getAvailableTarget(step.target);
			if (targetNode === null || this.#isVisibleTargetNode(targetNode)) {
				return Promise.resolve();
			}
			let parentScrolledContainer = window;
			let parent = targetNode.parentElement;
			while (parent) {
				const style = window.getComputedStyle(parent);
				const overflowY = style.overflowY;
				if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight >= parent.clientHeight) {
					parentScrolledContainer = parent;
					break;
				}
				parent = parent.parentElement;
			}
			return new Promise(resolve => {
				const scrollTop = this.#getTargetNodeScrollTop(targetNode, parentScrolledContainer);
				if (this.#autoscroll.behavior === 'smooth' && 'scrollTo' in parentScrolledContainer) {
					void this.#scrollToWithPromise(parentScrolledContainer, {
						top: scrollTop,
						behavior: 'smooth'
					}).then(() => {
						resolve();
					});
				} else {
					parent.scrollTop = scrollTop;
					guide.getPopup().adjustPosition({
						forceBindPosition: true
					});
					resolve();
				}
			});
		}
		#isVisibleTargetNode(targetNode) {
			const rect = targetNode.getBoundingClientRect();
			return rect.top >= 0 && rect.left >= 0 && rect.bottom >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 200 && rect.right <= (window.innerWidth || document.documentElement.clientWidth) - 200;
		}
		#getTargetNodeScrollTop(targetNode, parentScrolledContainer) {
			const elementTop = targetNode.offsetTop;
			const elementHeight = targetNode.offsetHeight;
			const containerHeight = parentScrolledContainer.clientHeight;
			const block = this.#autoscroll.position ?? 'auto';
			const getMaxScrollTop = scrollTop => {
				return Math.max(0, Math.min(scrollTop, parentScrolledContainer.scrollHeight - containerHeight));
			};
			let scrollTop = parentScrolledContainer.scrollTop;
			if (block === 'start') {
				return getMaxScrollTop(elementTop);
			}
			if (block === 'center') {
				return getMaxScrollTop(elementTop + elementHeight / 2 - containerHeight / 2);
			}
			if (block === 'end') {
				return getMaxScrollTop(elementTop + elementHeight - containerHeight);
			}
			const currentViewTop = parentScrolledContainer.scrollTop;
			const currentViewBottom = currentViewTop + containerHeight;
			if (elementTop < currentViewTop) {
				scrollTop = elementTop;
			} else if (elementTop + elementHeight > currentViewBottom) {
				scrollTop = elementTop + elementHeight - containerHeight;
			}
			return getMaxScrollTop(scrollTop);
		}
		#scrollToWithPromise(element, options) {
			return new Promise(resolve => {
				const targetTop = options.top ?? element.scrollTop;
				const targetLeft = options.left ?? element.scrollLeft;
				const behavior = options.behavior ?? 'auto';
				const tolerance = 1;
				if (behavior === 'auto') {
					element.scrollTo(options);
					resolve();
					return;
				}
				let lastTop = element.scrollTop;
				let lastLeft = element.scrollLeft;
				let stationaryFrames = 0;
				const isClose = (a, b) => Math.abs(a - b) <= tolerance;
				const checkScrollEnd = () => {
					const currentTop = element.scrollTop;
					const currentLeft = element.scrollLeft;
					const reachedTarget = isClose(currentTop, targetTop) && isClose(currentLeft, targetLeft);
					const stoppedMoving = isClose(currentTop, lastTop) && isClose(currentLeft, lastLeft);
					if (reachedTarget && stoppedMoving) {
						stationaryFrames++;
						if (stationaryFrames >= 2) {
							resolve();
							return;
						}
					} else {
						stationaryFrames = 0;
					}
					lastTop = currentTop;
					lastLeft = currentLeft;
					requestAnimationFrame(checkScrollEnd);
				};
				element.scrollTo(options);
				requestAnimationFrame(checkScrollEnd);
			});
		}
		setStepPopupOptions(popup) {
			const {
				steps,
				hideTourOnMissClick = false
			} = this.#options;
			popup.setAutoHide(hideTourOnMissClick);
			if (steps?.popup?.width) {
				popup.setWidth(steps.popup.width);
			}
		}
		save() {
			main_core.ajax.runAction('crm.settings.tour.updateOption', {
				json: {
					category: this.#closeOptionCategory,
					name: this.#closeOptionName,
					options: {
						isMultipleViewsAllowed: !this.#isViewHappened && this.#isMultipleViewsAllowed(),
						numberOfViewsLimit: this.#options.numberOfViewsLimit ?? 1,
						additionalTourIdsForDisable: this.#options.additionalTourIdsForDisable ?? null
					}
				}
			}).then(({
				data
			}) => {
				this.#options.isNumberOfViewsExceeded = data.isNumberOfViewsExceeded;
				this.#isViewHappened = true;
			}).catch(errors => {
				console.error('Could not save tour settings', errors);
			});
		}
		static tourInstances = [];
		static whatsNewInstances = [];
	}
	namespaceCrmWhatsNew.ActionViewMode = ActionViewMode;

})(BX.Crm.Integration.UI, BX, BX.Event, BX.Main, BX.UI);
//# sourceMappingURL=script.js.map

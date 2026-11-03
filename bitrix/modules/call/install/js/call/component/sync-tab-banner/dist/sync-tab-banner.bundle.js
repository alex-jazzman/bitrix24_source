/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, main_popup, ui_autoLaunch, ui_bannerDispatcher, ui_vue3, ui_vue3_components_button, ui_system_typography_vue, ui_iconSet_api_vue, ui_iconSet_outline, call_lib_analytics, call_adapter_logger) {
	'use strict';

	const SHOW_LOCK_NAME = 'call:sync-tab-banner';
	const PROMO_SHOW_ANNOUNCE_TIMEOUT = 300;
	const CLAIM_SHOW_ACTION = 'call.Promotion.claimSyncTabBanner';
	const SYNC_MENU_ITEM_IDS = ['sync', 'menu_sync'];
	const SYNC_TAB_PATH = '/sync/';
	const BANNER_ID = 'call-sync-tab-banner';
	const TITLE_ELEMENT_ID = `${BANNER_ID}-title`;
	const TITLE_REVEAL_FALLBACK_TIMEOUT = 2200;
	const CHOREO_SETTLE_TIMEOUT = 900;
	const FLOAT_CARD_SLOTS = [{
		pos: {
			top: '-91px',
			left: '-40px'
		},
		dur: 6.5,
		px: 12,
		py: 9,
		delay: 260
	}, {
		pos: {
			top: '-46px',
			right: '-44px'
		},
		dur: 7.4,
		px: -11,
		py: 7,
		delay: 360
	}, {
		pos: {
			bottom: '-42px',
			left: '-44px'
		},
		dur: 5.8,
		px: 10,
		py: -11,
		delay: 460
	}, {
		pos: {
			bottom: '-57px',
			right: '-30px'
		},
		dur: 8.1,
		px: -12,
		py: -8,
		delay: 560
	}];
	const SyncTabBannerContent = ui_vue3.defineComponent({
		name: 'CallSyncTabBanner',
		components: {
			UiButton: ui_vue3_components_button.Button,
			Text: ui_system_typography_vue.Text,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			surface: {
				type: String,
				default: 'messenger'
			},
			onNavigate: {
				type: Function,
				required: true
			},
			onRequestClose: {
				type: Function,
				required: true
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				OutlineIcons: ui_iconSet_api_vue.Outline,
				TITLE_ELEMENT_ID
			};
		},
		data() {
			return {
				reduced: false,
				open: false,
				showTitle: false,
				atHome: false,
				contentIn: false,
				settled: false,
				closing: false,
				introTransform: null,
				titleTransition: 'none',
				revealStarted: false,
				choreoTimers: [],
				rafMouse: null,
				onResizeHandler: null,
				rootRect: null
			};
		},
		computed: {
			titleWords() {
				return (main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_TITLE') ?? '').split(' ');
			},
			subtitle() {
				return main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_SUBTITLE') ?? '';
			},
			buttonText() {
				return main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_BUTTON') ?? '';
			},
			closeLabel() {
				return main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_CLOSE') ?? '';
			},
			features() {
				return [{
					icon: ui_iconSet_api_vue.Outline.LINK,
					text: main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_FEATURE_LINK') ?? ''
				}, {
					icon: ui_iconSet_api_vue.Outline.ADD_PERSON,
					text: main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_FEATURE_NO_REGISTRATION') ?? ''
				}, {
					icon: ui_iconSet_api_vue.Outline.TIMER,
					text: main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_FEATURE_LIFETIME') ?? ''
				}];
			},
			floatCards() {
				const content = [{
					icon: ui_iconSet_api_vue.Outline.GLOBE_EXTRANET,
					text: main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_FCARD_GUEST_ACCESS') ?? ''
				}, {
					icon: ui_iconSet_api_vue.Outline.KEY,
					text: main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_FCARD_NO_REGISTRATION') ?? ''
				}, {
					icon: ui_iconSet_api_vue.Outline.CHATS,
					text: main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_FCARD_MEETING_CHAT') ?? ''
				}, {
					icon: ui_iconSet_api_vue.Outline.CLOUD,
					text: main_core.Loc.getMessage('CALL_SYNC_TAB_BANNER_FCARD_CLOUD_RECORD') ?? ''
				}];
				return FLOAT_CARD_SLOTS.map((slot, index) => ({
					...slot,
					...content[index]
				}));
			},
			backdropStyle() {
				return {
					opacity: this.open && !this.closing ? 1 : 0
				};
			},
			cardStyle() {
				const shown = this.open && !this.closing;
				let transform = 'translateY(28px) scale(0.955)';
				if (shown) {
					transform = 'translateY(0) scale(1)';
				} else if (this.closing) {
					transform = 'translateY(8px) scale(0.965)';
				}
				return {
					opacity: shown ? 1 : 0,
					transform,
					filter: shown ? 'none' : 'blur(6px)',
					transition: this.motion(this.closing ? 'opacity 340ms ease, transform 340ms ease, filter 340ms ease' : 'opacity 460ms ease 60ms, transform 560ms cubic-bezier(0.22, 1, 0.36, 1) 60ms, filter 460ms ease 60ms')
				};
			},
			titleStyle() {
				return {
					transform: this.atHome ? 'none' : this.introTransform ?? 'none',
					transformOrigin: 'center center',
					transition: this.motion(this.titleTransition),
					zIndex: this.atHome ? 4 : 20,
					willChange: this.settled ? 'auto' : 'transform'
				};
			},
			illustrationStyle() {
				return {
					opacity: this.contentIn ? 1 : 0,
					transform: this.contentIn ? 'translateX(0) scale(1)' : 'translateX(26px) scale(0.94)',
					filter: this.contentIn ? 'none' : 'blur(12px)',
					transition: this.motion('opacity 820ms ease 120ms, transform 860ms cubic-bezier(0.22, 1, 0.36, 1) 120ms, filter 820ms ease 120ms'),
					willChange: this.contentIn ? 'auto' : 'opacity, transform, filter'
				};
			}
		},
		mounted() {
			if (window.matchMedia) {
				this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			}
			if (this.reduced) {
				this.open = true;
				this.showTitle = true;
				this.atHome = true;
				this.contentIn = true;
				this.settled = true;
				return;
			}
			requestAnimationFrame(() => {
				this.open = true;
			});
			this.scheduleChoreo(() => {
				this.measure();
				this.showTitle = true;
				this.enableTitleTransition();
			}, 660);
			this.scheduleChoreo(() => this.handleTitleRevealed(), TITLE_REVEAL_FALLBACK_TIMEOUT);
			this.onResizeHandler = () => {
				this.cacheRootRect();
				if (!this.atHome) {
					this.measure();
				}
			};
			window.addEventListener('resize', this.onResizeHandler);
		},
		beforeUnmount() {
			this.clearChoreo();
			if (this.rafMouse) {
				cancelAnimationFrame(this.rafMouse);
			}
			if (this.onResizeHandler) {
				window.removeEventListener('resize', this.onResizeHandler);
			}
		},
		methods: {
			scheduleChoreo(callback, delay) {
				this.choreoTimers.push(setTimeout(callback, delay));
			},
			clearChoreo() {
				this.choreoTimers.forEach(id => clearTimeout(id));
				this.choreoTimers = [];
			},
			measure() {
				const card = this.$refs.card;
				const title = this.$refs.title;
				if (!card || !title) {
					return;
				}
				const cardRect = card.getBoundingClientRect();
				const titleRect = title.getBoundingClientRect();
				const scale = 1.55;
				const titleCenterX = titleRect.left + titleRect.width / 2 - cardRect.left;
				const titleCenterY = titleRect.top + titleRect.height / 2 - cardRect.top;
				const cardCenterX = cardRect.width / 2;
				const cardCenterY = cardRect.height * 0.46;
				const dx = Math.round(cardCenterX - titleCenterX);
				const dy = Math.round(cardCenterY - titleCenterY);
				this.introTransform = `translate(${dx}px, ${dy}px) scale(${scale})`;
			},
			enableTitleTransition() {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						this.titleTransition = 'transform 780ms cubic-bezier(0.22, 1, 0.36, 1)';
					});
				});
			},
			motion(transition) {
				return this.reduced ? 'none' : transition;
			},
			handleTitleRevealed() {
				if (this.revealStarted) {
					return;
				}
				this.revealStarted = true;
				this.scheduleChoreo(() => {
					this.atHome = true;
					this.scheduleChoreo(() => {
						this.contentIn = true;
						this.scheduleChoreo(() => {
							this.settled = true;
						}, CHOREO_SETTLE_TIMEOUT);
					}, 300);
				}, 620);
			},
			handleWordTransitionEnd(event, index) {
				const isLast = index === this.titleWords.length - 1;
				if (isLast && event.propertyName === 'opacity' && this.showTitle && !this.atHome) {
					this.handleTitleRevealed();
				}
			},
			wordStyle(index) {
				return {
					opacity: this.showTitle ? 1 : 0,
					filter: this.reduced ? 'none' : this.showTitle ? 'blur(0px)' : 'blur(11px)',
					transform: this.showTitle ? 'translateY(0)' : 'translateY(14px)',
					transition: this.motion('opacity 450ms ease, filter 450ms ease, transform 450ms cubic-bezier(0.22, 1, 0.36, 1)'),
					transitionDelay: this.reduced ? '0ms' : `${index * 90}ms`,
					willChange: this.settled ? 'auto' : 'opacity, filter, transform'
				};
			},
			revealStyle(delay) {
				return {
					opacity: this.contentIn ? 1 : 0,
					transform: this.contentIn ? 'translateY(0)' : 'translateY(18px)',
					transition: this.motion('opacity 520ms ease, transform 560ms cubic-bezier(0.22, 1, 0.36, 1)'),
					transitionDelay: this.reduced ? '0ms' : `${delay}ms`,
					willChange: this.settled ? 'auto' : 'opacity, transform'
				};
			},
			featureStyle(index) {
				return this.revealStyle(160 + index * 90);
			},
			floatCardAnchorStyle(card) {
				return {
					...card.pos,
					opacity: this.contentIn ? 1 : 0,
					transform: this.contentIn ? 'scale(1)' : 'scale(0.86)',
					transition: this.motion('opacity 520ms ease, transform 560ms cubic-bezier(0.34, 1.56, 0.64, 1)'),
					transitionDelay: this.reduced ? '0ms' : `${card.delay}ms`
				};
			},
			floatCardParallaxStyle(card) {
				return this.reduced ? {} : {
					'--px': String(card.px),
					'--py': String(card.py)
				};
			},
			floatCardFloatyStyle(card) {
				return this.reduced ? {} : {
					animationDuration: `${card.dur}s`
				};
			},
			cacheRootRect() {
				const root = this.$refs.root;
				this.rootRect = root ? root.getBoundingClientRect() : null;
			},
			handleMouseMove(event) {
				if (this.reduced) {
					return;
				}
				const root = this.$refs.root;
				if (!root) {
					return;
				}
				if (!this.rootRect || this.rootRect.width === 0) {
					this.cacheRootRect();
				}
				const rect = this.rootRect;
				if (!rect || rect.width === 0 || rect.height === 0) {
					return;
				}
				const {
					clientX,
					clientY
				} = event;
				if (this.rafMouse) {
					cancelAnimationFrame(this.rafMouse);
				}
				this.rafMouse = requestAnimationFrame(() => {
					const mx = (clientX - rect.left) / rect.width * 2 - 1;
					const my = (clientY - rect.top) / rect.height * 2 - 1;
					root.style.setProperty('--mx', mx.toFixed(3));
					root.style.setProperty('--my', my.toFixed(3));
					this.rafMouse = null;
				});
			},
			handleNavigate() {
				this.onNavigate();
			},
			handleClose() {
				if (this.closing) {
					return;
				}
				this.closing = true;
				this.clearChoreo();
				this.scheduleChoreo(() => this.onRequestClose(), 380);
			}
		},
		template: `
		<div ref="root" class="bx-call-sync-tab-banner__root" @mousemove="handleMouseMove" data-testid="sync-tab-banner-overlay">
			<div class="bx-call-sync-tab-banner__backdrop" :style="backdropStyle"></div>
			<div class="bx-call-sync-tab-banner__center" @click="handleClose" data-testid="sync-tab-banner-backdrop">
				<div ref="card" class="bx-call-sync-tab-banner__card" :style="cardStyle" @click.stop data-testid="sync-tab-banner-card">
					<div class="bx-call-sync-tab-banner__background" aria-hidden="true">
						<div class="bx-call-sync-tab-banner__background_base"></div>
						<div class="bx-call-sync-tab-banner__rays_container">
							<div class="bx-call-sync-tab-banner__rays_drift">
								<div class="bx-call-sync-tab-banner__rays"></div>
							</div>
						</div>
						<div class="bx-call-sync-tab-banner__glow --top"></div>
						<div class="bx-call-sync-tab-banner__glow --right"></div>
						<div class="bx-call-sync-tab-banner__vignette"></div>
					</div>
					<div class="bx-call-sync-tab-banner__border" aria-hidden="true"></div>

					<button
						class="bx-call-sync-tab-banner__close"
						:aria-label="closeLabel"
						@click="handleClose"
						data-testid="sync-tab-banner-close"
					>
						<BIcon :name="OutlineIcons.CROSS_M" :size="20" color="var(--sync-banner-icon-color-close)"/>
					</button>

					<div class="bx-call-sync-tab-banner__grid">
						<div class="bx-call-sync-tab-banner__column_left">
							<div ref="title" class="bx-call-sync-tab-banner__title" :style="titleStyle" data-testid="sync-tab-banner-title">
								<div class="bx-call-sync-tab-banner__title_text" :id="TITLE_ELEMENT_ID">
									<template v-for="(word, index) in titleWords" :key="index"><span class="bx-call-sync-tab-banner__title_word" :style="wordStyle(index)" @transitionend="handleWordTransitionEnd($event, index)">{{ word }}</span><template v-if="index < titleWords.length - 1">{{ ' ' }}</template></template>
								</div>
							</div>

							<Text size="md" className="bx-call-sync-tab-banner__subtitle" :style="revealStyle(80)" data-testid="sync-tab-banner-subtitle">
								{{ subtitle }}
							</Text>

							<ul class="bx-call-sync-tab-banner__features" data-testid="sync-tab-banner-features">
								<li
									v-for="(feature, index) in features"
									:key="feature.icon"
									class="bx-call-sync-tab-banner__feature"
									:style="featureStyle(index)"
									:data-testid="'sync-tab-banner-feature-' + index"
								>
									<span class="bx-call-sync-tab-banner__feature_icon">
										<BIcon :name="feature.icon" :size="24" color="var(--sync-banner-icon-color-feature)"/>
									</span>
									<Text size="md" className="bx-call-sync-tab-banner__feature_text">{{ feature.text }}</Text>
								</li>
							</ul>

							<div class="bx-call-sync-tab-banner__actions" :style="revealStyle(560)" :inert="!contentIn || null">
								<UiButton
									:text="buttonText"
									:style="AirButtonStyle.FILLED_SUCCESS"
									:size="ButtonSize.EXTRA_LARGE"
									:dataset="{ testid: 'sync-tab-banner-cta' }"
									@click="handleNavigate"
								/>
							</div>
						</div>

						<div class="bx-call-sync-tab-banner__column_right">
							<div class="bx-call-sync-tab-banner__illustration" :style="illustrationStyle" data-testid="sync-tab-banner-illustration">
								<div :class="['bx-call-sync-tab-banner__sync', { '--parallax': !reduced }]">
									<div class="bx-call-sync-tab-banner__sync_banner">
										<span class="bx-call-sync-tab-banner__sync_glow" aria-hidden="true"></span>
										<span class="bx-call-sync-tab-banner__sync_zephyr" aria-hidden="true"></span>
										<div class="bx-call-sync-tab-banner__sync_body">
											<span class="bx-call-sync-tab-banner__skeleton --title"></span>
											<span class="bx-call-sync-tab-banner__skeleton --line"></span>
											<span class="bx-call-sync-tab-banner__skeleton --line-short"></span>
											<span class="bx-call-sync-tab-banner__sync_button">
												<span class="bx-call-sync-tab-banner__sync_button_bar"></span>
											</span>
										</div>
									</div>

									<div class="bx-call-sync-tab-banner__sync_cards">
										<div class="bx-call-sync-tab-banner__sync_card">
											<span class="bx-call-sync-tab-banner__sync_card_icon --calendar" aria-hidden="true"></span>
											<span class="bx-call-sync-tab-banner__skeleton --caption"></span>
										</div>
										<div class="bx-call-sync-tab-banner__sync_card">
											<span class="bx-call-sync-tab-banner__sync_card_icon --join" aria-hidden="true"></span>
											<span class="bx-call-sync-tab-banner__skeleton --caption-short"></span>
										</div>
									</div>

									<div
										v-for="(card, index) in floatCards"
										:key="card.icon"
										class="bx-call-sync-tab-banner__float_card_anchor"
										:style="floatCardAnchorStyle(card)"
										:data-testid="'sync-tab-banner-fcard-' + index"
									>
										<div :class="['bx-call-sync-tab-banner__float_card', { '--parallax': !reduced }]" :style="floatCardParallaxStyle(card)">
											<div :class="['bx-call-sync-tab-banner__float_card_inner', { '--floaty': !reduced }]" :style="floatCardFloatyStyle(card)">
												<span class="bx-call-sync-tab-banner__float_card_icon">
													<BIcon :name="card.icon" :size="24" color="var(--sync-banner-icon-color-card)"/>
												</span>
												<Text size="sm" className="bx-call-sync-tab-banner__float_card_text">{{ card.text }}</Text>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	});
	class SyncTabBanner {
		static #current = null;
		static #cancelled = false;
		static #queuedTaskRunning = false;
		static #showRefused = false;
		static #surface = 'messenger';
		static show(options = {}) {
			SyncTabBanner.close();
			SyncTabBanner.#current = new SyncTabBanner(options);
			SyncTabBanner.#current.#show();
		}
		static close() {
			SyncTabBanner.#current?.close();
		}
		static launch(surface = 'messenger') {
			SyncTabBanner.#surface = surface;
			SyncTabBanner.#cancelled = false;
			if (!ui_autoLaunch.AutoLauncher.isEnabled()) {
				ui_autoLaunch.AutoLauncher.enable();
			}
			const options = {
				id: BANNER_ID,
				forceShowOnTop: true
			};
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				void SyncTabBanner.#showWithLock(onDone);
				return {};
			}, options);
		}
		static cancel() {
			SyncTabBanner.#cancelled = true;
			SyncTabBanner.close();
			if (!SyncTabBanner.#queuedTaskRunning) {
				ui_autoLaunch.AutoLauncher.unregister(BANNER_ID);
			}
		}
		static async #showWithLock(onDone) {
			let isDone = false;
			const done = () => {
				if (isDone) {
					return;
				}
				isDone = true;
				onDone();
			};
			if (SyncTabBanner.#cancelled) {
				done();
				return;
			}
			SyncTabBanner.#queuedTaskRunning = true;
			let channel = null;
			try {
				const openChannel = new BroadcastChannel(SHOW_LOCK_NAME);
				channel = openChannel;
				if (navigator.locks) {
					await navigator.locks.request(SHOW_LOCK_NAME, {
						ifAvailable: true
					}, async lock => {
						if (lock === null) {
							return;
						}
						openChannel.postMessage({
							shown: true
						});
						await SyncTabBanner.#showAndWaitForClose();
					});
				} else if (!(await SyncTabBanner.#wasAnnounced(openChannel))) {
					openChannel.postMessage({
						shown: true
					});
					await SyncTabBanner.#showAndWaitForClose();
				}
			} catch (error) {
				call_adapter_logger.Logger.warn('SyncTabBanner: show lock failed', error);
			} finally {
				SyncTabBanner.#queuedTaskRunning = false;
				channel?.close();
				done();
			}
		}
		static async #showAndWaitForClose() {
			if (SyncTabBanner.#cancelled || !(await SyncTabBanner.#claimShow())) {
				return;
			}
			await new Promise(resolve => {
				SyncTabBanner.show({
					surface: SyncTabBanner.#surface,
					onClose: () => resolve()
				});
			});
		}
		static async #claimShow() {
			if (SyncTabBanner.#showRefused) {
				return false;
			}
			try {
				const response = await main_core.ajax.runAction(CLAIM_SHOW_ACTION, {});
				SyncTabBanner.#showRefused = response?.data?.allowed !== true;
				return !SyncTabBanner.#showRefused;
			} catch (error) {
				call_adapter_logger.Logger.warn('SyncTabBanner: claiming the show failed', error);
				return false;
			}
		}
		static #wasAnnounced(channel) {
			return new Promise(resolve => {
				let timeoutId = 0;
				const onMessage = event => {
					if (event.data && event.data.shown) {
						clearTimeout(timeoutId);
						main_core.Event.unbind(channel, 'message', onMessage);
						resolve(true);
					}
				};
				main_core.Event.bind(channel, 'message', onMessage);
				timeoutId = setTimeout(() => {
					main_core.Event.unbind(channel, 'message', onMessage);
					resolve(false);
				}, PROMO_SHOW_ANNOUNCE_TIMEOUT);
			});
		}
		#options;
		#container;
		#layoutApp;
		#popup;
		#closed = false;
		constructor(options) {
			this.#options = options;
			this.#container = main_core.Tag.render`<div></div>`;
			this.#layoutApp = ui_vue3.BitrixVue.createApp(SyncTabBannerContent, {
				surface: this.#options.surface ?? 'messenger',
				onNavigate: () => this.#handleNavigate(),
				onRequestClose: () => this.close()
			});
			this.#layoutApp.mount(this.#container);
			this.#popup = new main_popup.Popup(this.#getPopupConfig());
		}
		close() {
			if (this.#closed) {
				return;
			}
			this.#closed = true;
			this.#popup.close();
		}
		#show() {
			this.#popup.show();
		}
		#handleNavigate() {
			if ((this.#options.surface ?? 'messenger') === 'sync-page') {
				this.close();
				return;
			}
			call_lib_analytics.Analytics.getInstance().syncTabBanner.onButtonClick();
			this.#navigateToSyncTab();
			this.close();
		}
		#getPopupConfig() {
			return {
				id: BANNER_ID,
				className: 'bx-call-sync-tab-banner__scope',
				ariaLabelledBy: TITLE_ELEMENT_ID,
				content: this.#container,
				overlay: false,
				closeByEsc: true,
				closeIcon: false,
				autoHide: false,
				focusTrap: {
					isolateOutside: true
				},
				cacheable: false,
				padding: 0,
				events: {
					onAfterPopupShow: () => {
						call_lib_analytics.Analytics.getInstance().syncTabBanner.onBannerView();
					},
					onPopupClose: () => {
						if (main_core.Type.isFunction(this.#options.onClose)) {
							this.#options.onClose();
						}
					},
					onPopupDestroy: () => {
						this.#layoutApp.unmount();
						if (SyncTabBanner.#current === this) {
							SyncTabBanner.#current = null;
						}
					}
				}
			};
		}
		#navigateToSyncTab() {
			try {
				if (SyncTabBanner.#clickSyncMenuItem()) {
					return;
				}
				main_core.Page.redirect(SYNC_TAB_PATH);
			} catch (error) {
				call_adapter_logger.Logger.warn('SyncTabBanner: navigation failed', error);
			}
		}
		static #clickSyncMenuItem() {
			const menuManager = main_core.Reflection.getClass('BX.Main.interfaceButtonsManager');
			const menus = [menuManager?.getById('chat-menu'), menuManager?.getById('top_menu_id_collaboration')].filter(Boolean);
			for (const menu of menus) {
				for (const itemId of SYNC_MENU_ITEM_IDS) {
					const item = menu?.getItemById?.(itemId) ?? null;
					if (item && main_core.Type.isFunction(item.click)) {
						item.click();
						return true;
					}
				}
			}
			return false;
		}
	}

	exports.SyncTabBanner = SyncTabBanner;

})(this.BX.Call.Component = this.BX.Call.Component || {}, BX, BX.Main, BX.UI.AutoLaunch, BX.UI, BX.Vue3, BX.Vue3.Components, BX.UI.System.Typography.Vue, BX.UI.IconSet, window, BX.Call.Lib, BX.Call.Adapter);
//# sourceMappingURL=sync-tab-banner.bundle.js.map

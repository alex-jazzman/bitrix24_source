/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_bannerDispatcher, market_marketLinks, main_popup, ui_vue3, main_date, ui_iconSet_api_vue, ui_system_typography_vue, ui_vue3_components_button) {
	'use strict';

	function resolveApplicationLimitPresentation(dto) {
		const count = dto?.limit?.count;
		const actions = getApplicationLimitActions(dto);
		const hasRequiredActions = actions.some(action => action.type === 'list') && actions.some(action => action.type === 'buy');
		if (!main_core.Type.isInteger(count) || count < 0 || !hasRequiredActions) {
			return null;
		}
		const configuredLimit = dto?.limit?.configuredLimit;
		const transitionEndAt = dto?.transition?.endsAt;
		if (dto?.transition?.active === true && dto.limit.state === 'unlimited' && main_core.Type.isInteger(configuredLimit) && configuredLimit >= 0 && count > configuredLimit && main_core.Type.isInteger(transitionEndAt) && transitionEndAt > 0) {
			return {
				variant: 'transition',
				count,
				limit: configuredLimit,
				transitionEndAt
			};
		}
		const limit = dto?.limit?.limit;
		if (dto?.limit?.state === 'finite' && dto.limit.exceeded === true && main_core.Type.isInteger(limit) && limit >= 0 && count > limit) {
			return {
				variant: 'active',
				count,
				limit,
				transitionEndAt: null
			};
		}
		return null;
	}
	function isApplicationLimitExceeded(dto) {
		return resolveApplicationLimitPresentation(dto) !== null;
	}
	function isApplicationInstallationBlocked(dto) {
		const count = dto?.limit?.count;
		const limit = dto?.limit?.limit;
		return dto?.limit?.state === 'finite' && dto.limit.installationBlocked === true && main_core.Type.isInteger(count) && main_core.Type.isInteger(limit) && count >= limit && getApplicationLimitActions(dto).some(action => action.type === 'list');
	}
	function getApplicationLimitActions(dto) {
		if (!Array.isArray(dto?.actions)) {
			return [];
		}
		return dto.actions.filter(action => {
			return ['list', 'trial', 'buy'].includes(action?.type) && main_core.Type.isStringFilled(action.target);
		});
	}
	function createApplicationLimitPreviewAction(close) {
		return () => close();
	}

	const TEST_ID_PREFIX = 'vibe-plus-notifications-app-limit';
	const APPLICATION_LIMIT_LEARN_MORE_TEST_ID = `${TEST_ID_PREFIX}-learn-more`;
	function getApplicationLimitActionTestId(type) {
		return {
			buy: `${TEST_ID_PREFIX}-upgrade-btn`,
			trial: `${TEST_ID_PREFIX}-trial-btn`,
			list: `${TEST_ID_PREFIX}-applist-btn`
		}[type] ?? `${TEST_ID_PREFIX}-action-btn`;
	}

	const RING_SIZE = 251;
	const RING_STROKE = 36;
	const MAX_TURNS = 2;
	function getApplicationLimitRingTurns(value, max) {
		if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
			return 0;
		}
		return Math.min(Math.max(value / max, 0), MAX_TURNS);
	}
	function rampColor(progress) {
		const normalizedProgress = Math.max(0, Math.min(progress, 1));
		if (normalizedProgress <= 0.45) {
			const warningPart = (normalizedProgress / 0.45 * 100).toFixed(1);
			return `color-mix(in srgb, var(--ui-color-accent-main-warning) ${warningPart}%, var(--ui-color-accent-soft-orange-1))`;
		}
		const alertPart = ((normalizedProgress - 0.45) / 0.55 * 100).toFixed(1);
		return `color-mix(in srgb, var(--ui-color-accent-main-alert) ${alertPart}%, var(--ui-color-accent-main-warning))`;
	}
	function createRingMask(fraction) {
		const radius = (RING_SIZE - RING_STROKE) / 2;
		const circumference = 2 * Math.PI * radius;
		const center = RING_SIZE / 2;
		const dash = circumference * Math.max(0, Math.min(fraction, 1));
		const svg = [`<svg xmlns='http://www.w3.org/2000/svg' width='${RING_SIZE}' height='${RING_SIZE}' viewBox='0 0 ${RING_SIZE} ${RING_SIZE}'>`, `<circle cx='${center}' cy='${center}' r='${radius}' fill='none' stroke='white' stroke-width='${RING_STROKE}' `, `stroke-linecap='butt' stroke-dasharray='${dash} ${circumference}' stroke-dashoffset='0' `, `transform='rotate(-90 ${center} ${center})'/></svg>`].join('');
		return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
	}
	const AppsProgressRing = {
		name: 'MarketVibePlusAppsProgressRing',
		inheritAttrs: false,
		components: {
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			value: {
				type: Number,
				required: true
			},
			max: {
				type: Number,
				required: true
			},
			label: {
				type: String,
				required: true
			},
			caption: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isOpeningAnimationActive: true
			};
		},
		computed: {
			effectiveTurns() {
				return getApplicationLimitRingTurns(this.value, this.max);
			},
			seamProgress() {
				return this.effectiveTurns > 0 ? Math.min(1 / this.effectiveTurns, 1) : 1;
			},
			lapFraction() {
				return Math.max(this.effectiveTurns - 1, 0);
			},
			baseStyle() {
				return {
					background: `conic-gradient(from 0deg, ${rampColor(0)} 0%, ${rampColor(this.seamProgress * 0.5)} 50%, ${rampColor(this.seamProgress)} 100%)`,
					maskImage: createRingMask(Math.min(this.effectiveTurns, 1)),
					WebkitMaskImage: createRingMask(Math.min(this.effectiveTurns, 1))
				};
			},
			lapStyle() {
				return {
					background: `conic-gradient(from 0deg, ${rampColor(this.seamProgress)} 0%, var(--ui-color-accent-main-alert) ${(this.lapFraction * 100).toFixed(1)}%, ${rampColor(this.seamProgress)} 100%)`,
					maskImage: createRingMask(this.lapFraction),
					WebkitMaskImage: createRingMask(this.lapFraction)
				};
			},
			tipStyle() {
				const radius = (RING_SIZE - RING_STROKE) / 2;
				const center = RING_SIZE / 2;
				const leadTurns = this.effectiveTurns <= 1 ? this.effectiveTurns : this.effectiveTurns - 1;
				const angle = leadTurns * 2 * Math.PI;
				return {
					left: `${center + radius * Math.sin(angle) - RING_STROKE / 2}px`,
					top: `${center - radius * Math.cos(angle) - RING_STROKE / 2}px`,
					background: rampColor(1)
				};
			}
		},
		methods: {
			handleOpeningAnimationEnd() {
				this.isOpeningAnimationActive = false;
			}
		},
		template: `
		<div
			class="market-vibe-plus-application-limit-popup__ring"
			role="img"
			:aria-label="label"
			v-bind="$attrs"
		>
			<div
				:class="[
					'market-vibe-plus-application-limit-popup__ring-track',
					{ '--opening': isOpeningAnimationActive },
				]"
				@animationend="handleOpeningAnimationEnd"
			>
				<div
					class="market-vibe-plus-application-limit-popup__ring-base"
					:style="baseStyle"
				></div>
				<div
					v-if="lapFraction > 0"
					class="market-vibe-plus-application-limit-popup__ring-lap"
					:style="lapStyle"
				></div>
				<div
					v-if="effectiveTurns > 0"
					class="market-vibe-plus-application-limit-popup__ring-tip"
					:style="tipStyle"
				></div>
			</div>
			<div class="market-vibe-plus-application-limit-popup__ring-center">
				<div class="market-vibe-plus-application-limit-popup__ring-value">
					{{ value }}/{{ max }}
				</div>
				<TextSm
					className="market-vibe-plus-application-limit-popup__ring-caption"
					accent
					tag="div"
				>
					{{ caption }}
				</TextSm>
			</div>
		</div>
	`
	};

	const ApplicationLimitPopupComponent = {
		name: 'MarketVibePlusApplicationLimitPopup',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			AppsProgressRing,
			HeadlineXl: ui_system_typography_vue.HeadlineXl,
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			dto: {
				type: Object,
				required: true
			},
			onAction: {
				type: Function,
				required: true
			},
			onClose: {
				type: Function,
				required: true
			}
		},
		data() {
			return {
				buttonSize: ui_vue3_components_button.ButtonSize.LARGE,
				closeIcon: ui_iconSet_api_vue.Outline.CROSS_M,
				learnMoreTestId: APPLICATION_LIMIT_LEARN_MORE_TEST_ID
			};
		},
		computed: {
			presentation() {
				const presentation = resolveApplicationLimitPresentation(this.dto);
				if (presentation === null) {
					throw new TypeError('The application limit popup received an invalid projection.');
				}
				return presentation;
			},
			actions() {
				return getApplicationLimitActions(this.dto);
			},
			title() {
				const suffix = this.presentation.variant === 'transition' ? 'TRANSITION' : 'ACTIVE';
				return main_core.Loc.getMessage(`MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_TITLE_${suffix}`) ?? '';
			},
			contentParagraphs() {
				const replacements = {
					'#COUNT#': String(this.presentation.count),
					'#LIMIT#': String(this.presentation.limit),
					'#DATE#': this.transitionEndDate
				};
				const codes = this.presentation.variant === 'transition' ? ['MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_SUMMARY_TRANSITION', 'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_ACTION_TRANSITION'] : ['MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_SUMMARY_ACTIVE', 'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_WARNING_ACTIVE', 'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_ACTION_ACTIVE'];
				return codes.map(code => main_core.Loc.getMessage(code, replacements) ?? '').filter(text => text !== '');
			},
			transitionEndDate() {
				if (this.presentation.transitionEndAt === null) {
					return '';
				}
				return main_date.DateTimeFormat.format(main_core.Loc.getMessage('MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_DATE_FORMAT') ?? 'j F', this.presentation.transitionEndAt);
			},
			ringLabel() {
				return main_core.Loc.getMessage('MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_RING_LABEL', {
					'#COUNT#': this.presentation.count,
					'#LIMIT#': this.presentation.limit
				}) ?? '';
			}
		},
		methods: {
			getActionLabel(type) {
				const messageCode = {
					buy: 'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_BUY',
					trial: 'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_TRIAL',
					list: 'MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_LIST'
				}[type] ?? '';
				return main_core.Loc.getMessage(messageCode) ?? '';
			},
			getActionStyle(type) {
				return {
					buy: ui_vue3_components_button.AirButtonStyle.FILLED_SUCCESS,
					trial: ui_vue3_components_button.AirButtonStyle.OUTLINE,
					list: ui_vue3_components_button.AirButtonStyle.PLAIN
				}[type] ?? ui_vue3_components_button.AirButtonStyle.PLAIN;
			},
			getActionDataset(action, index) {
				return {
					testid: getApplicationLimitActionTestId(action.type),
					autofocus: index === 0 ? '' : null
				};
			},
			showChangesInfo() {
				BX.Helper.show('redirect=detail&code=26027119');
			}
		},
		template: `
		<section
			class="market-vibe-plus-application-limit-popup"
			data-testid="vibe-plus-notifications-app-limit-popup"
		>
			<div
				class="market-vibe-plus-application-limit-popup__card"
				data-testid="vibe-plus-notifications-app-limit-card"
			>
				<div
					class="market-vibe-plus-application-limit-popup__left"
					data-testid="vibe-plus-notifications-app-limit-left"
				>
					<header
						class="market-vibe-plus-application-limit-popup__head"
						data-testid="vibe-plus-notifications-app-limit-head"
					>
						<HeadlineXl
							id="market-vibe-plus-application-limit-popup-title"
							className="market-vibe-plus-application-limit-popup__title"
							tag="h2"
							data-testid="vibe-plus-notifications-app-limit-title"
						>
							{{ title }}
						</HeadlineXl>
					</header>

					<div
						class="market-vibe-plus-application-limit-popup__content"
						data-testid="vibe-plus-notifications-app-limit-content"
					>
						<div class="market-vibe-plus-application-limit-popup__paragraphs">
							<TextSm
								v-for="(paragraph, index) in contentParagraphs"
								:key="index"
								className="market-vibe-plus-application-limit-popup__paragraph"
								tag="p"
								:data-testid="'vibe-plus-notifications-app-limit-paragraph-' + index"
							>
								{{ paragraph }}
							</TextSm>
						</div>
						<TextSm
							className="market-vibe-plus-application-limit-popup__learn-more"
							tag="a"
							href="#"
							:data-testid="learnMoreTestId"
							@click.prevent="showChangesInfo"
						>
							{{ $Bitrix.Loc.getMessage('MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_LEARN_MORE') }}
						</TextSm>
					</div>

					<div
						class="market-vibe-plus-application-limit-popup__buttons"
						data-testid="vibe-plus-notifications-app-limit-buttons"
					>
						<UiButton
							v-for="(action, index) in actions"
							:key="action.type"
							:class="'market-vibe-plus-application-limit-popup__action market-vibe-plus-application-limit-popup__action--' + action.type"
							:text="getActionLabel(action.type)"
							:style="getActionStyle(action.type)"
							:size="buttonSize"
							:dataset="getActionDataset(action, index)"
							@click="onAction(action)"
						/>
					</div>
				</div>

				<div
					class="market-vibe-plus-application-limit-popup__graphic"
					data-testid="vibe-plus-notifications-app-limit-graphic"
				>
					<AppsProgressRing
						data-testid="vibe-plus-notifications-app-limit-ring"
						:value="presentation.count"
						:max="presentation.limit"
						:label="ringLabel"
						:caption="$Bitrix.Loc.getMessage('MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_RING_CAPTION')"
					/>
					<img
						class="market-vibe-plus-application-limit-popup__mascot"
						src="/bitrix/js/market/vibe-plus-application-limit-popup/images/limit-mascot.webp"
						srcset="/bitrix/js/market/vibe-plus-application-limit-popup/images/limit-mascot.webp 1x, /bitrix/js/market/vibe-plus-application-limit-popup/images/limit-mascot@2x.webp 2x"
						alt=""
						aria-hidden="true"
						data-testid="vibe-plus-notifications-app-limit-mascot"
					>
				</div>

				<button
					class="market-vibe-plus-application-limit-popup__close"
					type="button"
					:aria-label="$Bitrix.Loc.getMessage('MARKET_VIBE_PLUS_APPLICATION_LIMIT_POPUP_CLOSE')"
					data-testid="vibe-plus-notifications-app-limit-close"
					@click="onClose"
				>
					<BIcon
						:name="closeIcon"
						:size="20"
						color="#ffffff"
						aria-hidden="true"
						data-testid="vibe-plus-notifications-app-limit-close-icon"
					/>
				</button>
			</div>
		</section>
	`
	};

	class ApplicationLimitPopup {
		#popup = null;
		#application = null;
		#closeCallbacks = new Set();
		show(dto, options) {
			if (this.#popup?.isShown()) {
				if (main_core.Type.isFunction(options.onClose)) {
					this.#closeCallbacks.add(options.onClose);
				}
				return true;
			}
			if (main_core.Type.isFunction(options.onClose)) {
				this.#closeCallbacks.add(options.onClose);
			}
			const mountPoint = main_core.Tag.render`<div class="market-vibe-plus-application-limit-popup-mount"></div>`;
			this.#application = ui_vue3.BitrixVue.createApp(ApplicationLimitPopupComponent, {
				dto,
				onAction: options.onAction,
				onClose: () => this.close()
			});
			this.#application.mount(mountPoint);
			this.#popup = new main_popup.Popup({
				id: 'market-vibe-plus-application-limit-popup',
				className: 'market-vibe-plus-application-limit-popup-window',
				content: mountPoint,
				width: Math.min(905, document.documentElement.clientWidth - 32),
				contentNoPaddings: true,
				borderRadius: '24px',
				contentBorderRadius: '24px',
				background: 'transparent',
				contentBackground: 'transparent',
				overlay: {
					backgroundColor: '#000000',
					opacity: 50,
					blur: '0'
				},
				fixed: true,
				closeByEsc: true,
				autoHide: false,
				closeIcon: false,
				cacheable: false,
				disableScroll: true,
				ariaLabelledBy: 'market-vibe-plus-application-limit-popup-title',
				focusTrap: {
					initialFocus: ['[data-autofocus]', 'first-tabbable', 'container'],
					restoreFocus: true
				},
				events: {
					onAfterClose: () => this.#handleAfterClose()
				}
			});
			this.#popup.show();
			return true;
		}
		showPreview(dto) {
			return this.show(dto, {
				onAction: createApplicationLimitPreviewAction(() => this.close())
			});
		}
		close() {
			this.#popup?.close();
		}
		#handleAfterClose() {
			this.#application?.unmount();
			this.#application = null;
			this.#popup = null;
			const callbacks = [...this.#closeCallbacks];
			this.#closeCallbacks.clear();
			callbacks.forEach(callback => callback());
		}
	}

	const AUTO_LAUNCH_ID = 'market-vibe-plus-application-limit-popup';
	const popup = new ApplicationLimitPopup();
	let autoShowScheduled = false;
	let autoShowCompleted = false;
	function getAutoLaunchStorageKey() {
		const userId = String(window.BX?.message?.('USER_ID') ?? 'anonymous');
		return `${AUTO_LAUNCH_ID}:shown:${userId}`;
	}
	function wasAutoShown() {
		try {
			return window.localStorage.getItem(getAutoLaunchStorageKey()) === 'Y';
		} catch {
			return false;
		}
	}
	function rememberAutoShow() {
		try {
			window.localStorage.setItem(getAutoLaunchStorageKey(), 'Y');
		} catch {
		}
	}
	function resolveApplicationLimitActionTarget(action) {
		return action.type === 'list' ? market_marketLinks.MarketLinks.installedVibePlusLimitLink() : action.target;
	}
	function openApplicationLimitAction(action) {
		const target = resolveApplicationLimitActionTarget(action);
		const topWindow = window.top ?? window;
		popup.close();
		if (action.type !== 'list') {
			main_core.Page.redirect(target);
		} else if (topWindow.BX?.SidePanel?.Instance) {
			topWindow.BX.SidePanel.Instance.open(target);
		} else {
			window.location.assign(target);
		}
	}
	function showVibePlusApplicationLimitPopup(dto) {
		if (!isApplicationLimitExceeded(dto)) {
			return false;
		}
		return popup.show(dto, {
			onAction: openApplicationLimitAction
		});
	}
	function showVibePlusApplicationLimitPopupPreview(dto) {
		if (!isApplicationLimitExceeded(dto)) {
			return false;
		}
		return popup.showPreview(dto);
	}
	function scheduleVibePlusApplicationLimitPopup(dto) {
		if (autoShowScheduled || autoShowCompleted || wasAutoShown() || !isApplicationLimitExceeded(dto)) {
			return false;
		}
		autoShowScheduled = true;
		ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
			let queueCompleted = false;
			const completeQueue = () => {
				if (queueCompleted) {
					return;
				}
				queueCompleted = true;
				autoShowCompleted = true;
				onDone();
			};
			try {
				const shown = popup.show(dto, {
					onAction: openApplicationLimitAction,
					onClose: completeQueue
				});
				if (!shown) {
					completeQueue();
					return {};
				}
				rememberAutoShow();
			} catch {
				completeQueue();
			}
			return {};
		}, {
			id: AUTO_LAUNCH_ID
		});
		return true;
	}

	exports.isApplicationInstallationBlocked = isApplicationInstallationBlocked;
	exports.isApplicationLimitExceeded = isApplicationLimitExceeded;
	exports.scheduleVibePlusApplicationLimitPopup = scheduleVibePlusApplicationLimitPopup;
	exports.showVibePlusApplicationLimitPopup = showVibePlusApplicationLimitPopup;
	exports.showVibePlusApplicationLimitPopupPreview = showVibePlusApplicationLimitPopupPreview;

})(this.BX.Market = this.BX.Market || {}, BX, BX.UI, BX.Market, BX.Main, BX.Vue3, BX.Main, BX.UI.IconSet, BX.UI.System.Typography.Vue, BX.Vue3.Components);
//# sourceMappingURL=vibe-plus-application-limit-popup.bundle.js.map

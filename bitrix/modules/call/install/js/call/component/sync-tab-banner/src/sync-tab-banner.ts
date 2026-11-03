import { ajax, Event, Loc, Page, Reflection, Tag, Type, type AjaxResponse } from 'main.core';
import { Popup, type PopupOptions } from 'main.popup';
import { AutoLauncher, type LaunchItemOptions } from 'ui.auto-launch';
import { BannerDispatcher } from 'ui.banner-dispatcher';
import { BitrixVue, defineComponent, type VueCreateAppResult } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Text } from 'ui.system.typography.vue';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Analytics } from 'call.lib.analytics';
import { Logger } from 'call.adapter.logger';

import './css/sync-tab-banner.css';

const SHOW_LOCK_NAME = 'call:sync-tab-banner';
const PROMO_SHOW_ANNOUNCE_TIMEOUT = 300;
const CLAIM_SHOW_ACTION = 'call.Promotion.claimSyncTabBanner';

// The tab is a portal section of its own (/sync/, declared by intranet with
// menu_item_id 'menu_sync'), and the portal's left menu is not owned by
// interfaceButtonsManager. Both codes are tried in case the tab is ever also published as a
// messenger tab, and the section path is what actually works today.
const SYNC_MENU_ITEM_IDS = ['sync', 'menu_sync'];
const SYNC_TAB_PATH = '/sync/';
const BANNER_ID = 'call-sync-tab-banner';
const TITLE_ELEMENT_ID = `${BANNER_ID}-title`;

// The reveal is driven by the last title word's transitionend. It may never arrive (the tab was in
// the background when the transition started, the word did not change opacity), and the content
// would then stay invisible for good: reveal it on a timer as well.
const TITLE_REVEAL_FALLBACK_TIMEOUT = 2200;
// After this, every intro transition is over and the promoted layers are not needed anymore.
const CHOREO_SETTLE_TIMEOUT = 900;

type ClaimShowResponse = { allowed: boolean };

// Where the banner is being shown. The wording of the call to action is the same everywhere —
// on the Sync page "start" reads as "get going", and the user is already where they need to be.
// What differs is what the press does: on that page there is nowhere to navigate, so it closes.
export type SyncTabBannerSurface = 'messenger' | 'sync-page';

type FeatureItem = { icon: string, text: string };

// Floating card slot: position + choreography are fixed; icon/text come from copy.
type FloatCardSlot = {
	pos: { [key: string]: string },
	dur: number,
	px: number,
	py: number,
	delay: number,
};
type FloatCard = FloatCardSlot & { icon: string, text: string };

const FLOAT_CARD_SLOTS: FloatCardSlot[] = [
	{ pos: { top: '-91px', left: '-40px' }, dur: 6.5, px: 12, py: 9, delay: 260 },
	{ pos: { top: '-46px', right: '-44px' }, dur: 7.4, px: -11, py: 7, delay: 360 },
	{ pos: { bottom: '-42px', left: '-44px' }, dur: 5.8, px: 10, py: -11, delay: 460 },
	{ pos: { bottom: '-57px', right: '-30px' }, dur: 8.1, px: -12, py: -8, delay: 560 },
];

const SyncTabBannerContent = defineComponent({
	name: 'CallSyncTabBanner',
	components: { UiButton, Text, BIcon },
	props: {
		surface: {
			type: String,
			default: 'messenger',
		},
		onNavigate: {
			type: Function,
			required: true,
		},
		onRequestClose: {
			type: Function,
			required: true,
		},
	},
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize, OutlineIcons, TITLE_ELEMENT_ID };
	},
	data()
	{
		return {
			reduced: false,
			open: false,
			showTitle: false,
			atHome: false,
			contentIn: false,
			settled: false,
			closing: false,
			introTransform: null as string | null,
			titleTransition: 'none',
			revealStarted: false,
			// bookkeeping for timers / raf id / resize listener / cached overlay rect
			choreoTimers: [] as number[],
			rafMouse: null as number | null,
			onResizeHandler: null as (() => void) | null,
			rootRect: null as DOMRect | null,
		};
	},
	computed: {
		titleWords(): string[]
		{
			return (Loc.getMessage('CALL_SYNC_TAB_BANNER_TITLE') ?? '').split(' ');
		},
		subtitle(): string
		{
			return Loc.getMessage('CALL_SYNC_TAB_BANNER_SUBTITLE') ?? '';
		},
		buttonText(): string
		{
			return Loc.getMessage('CALL_SYNC_TAB_BANNER_BUTTON') ?? '';
		},
		closeLabel(): string
		{
			return Loc.getMessage('CALL_SYNC_TAB_BANNER_CLOSE') ?? '';
		},
		features(): FeatureItem[]
		{
			return [
				{ icon: OutlineIcons.LINK, text: Loc.getMessage('CALL_SYNC_TAB_BANNER_FEATURE_LINK') ?? '' },
				{ icon: OutlineIcons.ADD_PERSON, text: Loc.getMessage('CALL_SYNC_TAB_BANNER_FEATURE_NO_REGISTRATION') ?? '' },
				{ icon: OutlineIcons.TIMER, text: Loc.getMessage('CALL_SYNC_TAB_BANNER_FEATURE_LIFETIME') ?? '' },
			];
		},
		floatCards(): FloatCard[]
		{
			const content: FeatureItem[] = [
				{ icon: OutlineIcons.GLOBE_EXTRANET, text: Loc.getMessage('CALL_SYNC_TAB_BANNER_FCARD_GUEST_ACCESS') ?? '' },
				{ icon: OutlineIcons.KEY, text: Loc.getMessage('CALL_SYNC_TAB_BANNER_FCARD_NO_REGISTRATION') ?? '' },
				{ icon: OutlineIcons.CHATS, text: Loc.getMessage('CALL_SYNC_TAB_BANNER_FCARD_MEETING_CHAT') ?? '' },
				{ icon: OutlineIcons.CLOUD, text: Loc.getMessage('CALL_SYNC_TAB_BANNER_FCARD_CLOUD_RECORD') ?? '' },
			];

			return FLOAT_CARD_SLOTS.map((slot, index) => ({ ...slot, ...content[index] }));
		},
		backdropStyle(): Object
		{
			return { opacity: (this.open && !this.closing) ? 1 : 0 };
		},
		cardStyle(): Object
		{
			const shown = this.open && !this.closing;
			let transform = 'translateY(28px) scale(0.955)';
			if (shown)
			{
				transform = 'translateY(0) scale(1)';
			}
			else if (this.closing)
			{
				transform = 'translateY(8px) scale(0.965)';
			}

			return {
				opacity: shown ? 1 : 0,
				transform,
				// keep 'none' (not blur(0px)) when shown: a filter on the parent disables
				// backdrop-filter on the glass cards inside.
				filter: shown ? 'none' : 'blur(6px)',
				transition: this.motion(this.closing
					? 'opacity 340ms ease, transform 340ms ease, filter 340ms ease'
					: 'opacity 460ms ease 60ms, transform 560ms cubic-bezier(0.22, 1, 0.36, 1) 60ms, filter 460ms ease 60ms'),
			};
		},
		titleStyle(): Object
		{
			return {
				transform: this.atHome ? 'none' : (this.introTransform ?? 'none'),
				transformOrigin: 'center center',
				transition: this.motion(this.titleTransition),
				zIndex: this.atHome ? 4 : 20,
				willChange: this.settled ? 'auto' : 'transform',
			};
		},
		illustrationStyle(): Object
		{
			return {
				opacity: this.contentIn ? 1 : 0,
				transform: this.contentIn ? 'translateX(0) scale(1)' : 'translateX(26px) scale(0.94)',
				filter: this.contentIn ? 'none' : 'blur(12px)',
				transition: this.motion('opacity 820ms ease 120ms, transform 860ms cubic-bezier(0.22, 1, 0.36, 1) 120ms, filter 820ms ease 120ms'),
				willChange: this.contentIn ? 'auto' : 'opacity, transform, filter',
			};
		},
	},
	mounted(): void
	{
		if (window.matchMedia)
		{
			this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		}

		if (this.reduced)
		{
			// no animation: jump straight to the final state
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

		// once the card has settled, measure the title's home position and start the reveal
		this.scheduleChoreo(() => {
			this.measure();
			this.showTitle = true;
			this.enableTitleTransition();
		}, 660);

		this.scheduleChoreo(() => this.handleTitleRevealed(), TITLE_REVEAL_FALLBACK_TIMEOUT);

		this.onResizeHandler = () => {
			this.cacheRootRect();
			if (!this.atHome)
			{
				this.measure();
			}
		};
		window.addEventListener('resize', this.onResizeHandler);
	},
	beforeUnmount(): void
	{
		this.clearChoreo();
		if (this.rafMouse)
		{
			cancelAnimationFrame(this.rafMouse);
		}
		if (this.onResizeHandler)
		{
			window.removeEventListener('resize', this.onResizeHandler);
		}
	},
	methods: {
		scheduleChoreo(callback: () => void, delay: number): void
		{
			this.choreoTimers.push(setTimeout(callback, delay));
		},
		clearChoreo(): void
		{
			this.choreoTimers.forEach((id: number) => clearTimeout(id));
			this.choreoTimers = [];
		},
		measure(): void
		{
			const card = this.$refs.card as HTMLElement;
			const title = this.$refs.title as HTMLElement;
			if (!card || !title)
			{
				return;
			}

			const cardRect = card.getBoundingClientRect();
			const titleRect = title.getBoundingClientRect();
			const scale = 1.55;
			const titleCenterX = titleRect.left + (titleRect.width / 2) - cardRect.left;
			const titleCenterY = titleRect.top + (titleRect.height / 2) - cardRect.top;
			const cardCenterX = cardRect.width / 2;
			const cardCenterY = cardRect.height * 0.46; // slightly above the geometric center, the "hero" spot
			const dx = Math.round(cardCenterX - titleCenterX);
			const dy = Math.round(cardCenterY - titleCenterY);
			this.introTransform = `translate(${dx}px, ${dy}px) scale(${scale})`;
		},
		enableTitleTransition(): void
		{
			// snap to center on the first frame, animate from the next one
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					this.titleTransition = 'transform 780ms cubic-bezier(0.22, 1, 0.36, 1)';
				});
			});
		},
		motion(transition: string): string
		{
			// inline styles win over the reduced-motion media query, so the choreography
			// has to be turned off here as well
			return this.reduced ? 'none' : transition;
		},
		handleTitleRevealed(): void
		{
			// the transitionend and the fallback timer both lead here
			if (this.revealStarted)
			{
				return;
			}

			this.revealStarted = true;

			// pause after the full reveal -> move to the corner -> reveal the content
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
		handleWordTransitionEnd(event: TransitionEvent, index: number): void
		{
			const isLast = index === (this.titleWords.length - 1);
			if (isLast && event.propertyName === 'opacity' && this.showTitle && !this.atHome)
			{
				this.handleTitleRevealed();
			}
		},
		wordStyle(index: number): Object
		{
			return {
				opacity: this.showTitle ? 1 : 0,
				filter: this.reduced ? 'none' : (this.showTitle ? 'blur(0px)' : 'blur(11px)'),
				transform: this.showTitle ? 'translateY(0)' : 'translateY(14px)',
				transition: this.motion('opacity 450ms ease, filter 450ms ease, transform 450ms cubic-bezier(0.22, 1, 0.36, 1)'),
				transitionDelay: this.reduced ? '0ms' : `${index * 90}ms`,
				willChange: this.settled ? 'auto' : 'opacity, filter, transform',
			};
		},
		revealStyle(delay: number): Object
		{
			return {
				opacity: this.contentIn ? 1 : 0,
				transform: this.contentIn ? 'translateY(0)' : 'translateY(18px)',
				transition: this.motion('opacity 520ms ease, transform 560ms cubic-bezier(0.22, 1, 0.36, 1)'),
				transitionDelay: this.reduced ? '0ms' : `${delay}ms`,
				willChange: this.settled ? 'auto' : 'opacity, transform',
			};
		},
		featureStyle(index: number): Object
		{
			return this.revealStyle(160 + (index * 90));
		},
		floatCardAnchorStyle(card: FloatCard): Object
		{
			return {
				...card.pos,
				opacity: this.contentIn ? 1 : 0,
				transform: this.contentIn ? 'scale(1)' : 'scale(0.86)',
				transition: this.motion('opacity 520ms ease, transform 560ms cubic-bezier(0.34, 1.56, 0.64, 1)'),
				transitionDelay: this.reduced ? '0ms' : `${card.delay}ms`,
			};
		},
		floatCardParallaxStyle(card: FloatCard): Object
		{
			return this.reduced ? {} : { '--px': String(card.px), '--py': String(card.py) };
		},
		floatCardFloatyStyle(card: FloatCard): Object
		{
			return this.reduced ? {} : { animationDuration: `${card.dur}s` };
		},
		cacheRootRect(): void
		{
			const root = this.$refs.root as HTMLElement;
			this.rootRect = root ? root.getBoundingClientRect() : null;
		},
		handleMouseMove(event: MouseEvent): void
		{
			if (this.reduced)
			{
				return;
			}

			const root = this.$refs.root as HTMLElement;
			if (!root)
			{
				return;
			}

			// the overlay is still detached while Vue mounts, so the rect is measured on the first move
			if (!this.rootRect || this.rootRect.width === 0)
			{
				this.cacheRootRect();
			}

			const rect = this.rootRect;
			if (!rect || rect.width === 0 || rect.height === 0)
			{
				return;
			}

			const { clientX, clientY } = event;
			if (this.rafMouse)
			{
				cancelAnimationFrame(this.rafMouse);
			}
			// The overlay is fixed to the viewport, so its rect only changes on resize: use the
			// cached one instead of forcing a reflow of the modal on every frame.
			this.rafMouse = requestAnimationFrame(() => {
				const mx = (((clientX - rect.left) / rect.width) * 2) - 1;
				const my = (((clientY - rect.top) / rect.height) * 2) - 1;
				root.style.setProperty('--mx', mx.toFixed(3));
				root.style.setProperty('--my', my.toFixed(3));
				this.rafMouse = null;
			});
		},
		handleNavigate(): void
		{
			this.onNavigate();
		},
		handleClose(): void
		{
			if (this.closing)
			{
				return;
			}

			this.closing = true;
			this.clearChoreo();
			this.scheduleChoreo(() => this.onRequestClose(), 380);
		},
	},
	// eslint-disable-next-line
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
	`,
});

export type SyncTabBannerOptions = {
	onClose?: () => void;
	surface?: SyncTabBannerSurface;
};

// LaunchItemOptions mistypes `callback` as required for the options bag; these are the fields we pass.
type QueueOptions = {
	id?: string,
	forceShowOnTop?: boolean,
};

export class SyncTabBanner
{
	static #current: SyncTabBanner | null = null;
	static #cancelled: boolean = false;
	static #queuedTaskRunning: boolean = false;
	static #showRefused: boolean = false;
	static #surface: SyncTabBannerSurface = 'messenger';

	static show(options: SyncTabBannerOptions = {}): void
	{
		SyncTabBanner.close();
		SyncTabBanner.#current = new SyncTabBanner(options);
		SyncTabBanner.#current.#show();
	}

	static close(): void
	{
		SyncTabBanner.#current?.close();
	}

	// Queue the banner behind the shared banner dispatcher, then show it under a cross-tab lock.
	// The surface decides what the call to action does; the promo itself is one per user across
	// all of them, because the view mark lives on the server and knows nothing about surfaces.
	static launch(surface: SyncTabBannerSurface = 'messenger'): void
	{
		SyncTabBanner.#surface = surface;
		SyncTabBanner.#cancelled = false;

		// The launcher switches itself off as soon as its queue drains and nothing switches it
		// back on, so a second cycle in this tab would never reach the task.
		if (!AutoLauncher.isEnabled())
		{
			AutoLauncher.enable();
		}

		const options: QueueOptions = { id: BANNER_ID, forceShowOnTop: true };

		BannerDispatcher.normal.toQueue((onDone: Function) => {
			void SyncTabBanner.#showWithLock(onDone);

			return {}; // LaunchItemCallback must return a non-nullish value
		}, options as LaunchItemOptions);
	}

	// Called when the surface the banner runs over goes away: the queue takes seconds to reach the
	// task, and by then there may be nothing left to show the banner over. Idempotent.
	static cancel(): void
	{
		SyncTabBanner.#cancelled = true;
		SyncTabBanner.close();

		if (!SyncTabBanner.#queuedTaskRunning)
		{
			// nobody holds the queue slot yet: drop the task before the launcher gets to it
			AutoLauncher.unregister(BANNER_ID);
		}
	}

	// Cross-tab coordination. With Web Locks the exclusion is strict: exactly one
	// tab wins the lock and shows the banner. Without them we fall back to a best-effort
	// BroadcastChannel announce (see #wasAnnounced): two tabs that start within the same
	// announce window can still both miss it; the server-side claim below is what finally
	// keeps the banner from being shown twice.
	// Everything runs inside the try, so the queue slot is always released exactly once.
	static async #showWithLock(onDone: Function): Promise<void>
	{
		let isDone = false;
		const done = (): void => {
			if (isDone)
			{
				return;
			}

			isDone = true;
			onDone();
		};

		if (SyncTabBanner.#cancelled)
		{
			done();

			return;
		}

		SyncTabBanner.#queuedTaskRunning = true;

		let channel: BroadcastChannel | null = null;
		try
		{
			const openChannel = new BroadcastChannel(SHOW_LOCK_NAME);
			channel = openChannel;

			if (navigator.locks)
			{
				await navigator.locks.request(SHOW_LOCK_NAME, { ifAvailable: true }, async (lock) => {
					if (lock === null)
					{
						return;
					}

					openChannel.postMessage({ shown: true });
					await SyncTabBanner.#showAndWaitForClose();
				});
			}
			else if (!(await SyncTabBanner.#wasAnnounced(openChannel)))
			{
				openChannel.postMessage({ shown: true });
				await SyncTabBanner.#showAndWaitForClose();
			}
		}
		catch (error)
		{
			Logger.warn('SyncTabBanner: show lock failed', error);
		}
		finally
		{
			SyncTabBanner.#queuedTaskRunning = false;
			channel?.close();
			done();
		}
	}

	// Resolves when the banner is closed: the lock has to outlive the popup, not the call that opened it.
	static async #showAndWaitForClose(): Promise<void>
	{
		// The snapshot this tab started from is taken when the page is rendered and goes stale;
		// the server decides for real, and takes the show in the same call.
		if (SyncTabBanner.#cancelled || !(await SyncTabBanner.#claimShow()))
		{
			return;
		}

		// No cancellation check past the claim: the server has already spent the promo and cannot
		// give it back, so backing out here would burn the banner without ever showing it. The
		// messenger may well be gone by now, but the banner is a page-level modal and stands on
		// its own.
		await new Promise<void>((resolve: () => void) => {
			SyncTabBanner.show({
				surface: SyncTabBanner.#surface,
				onClose: () => resolve(),
			});
		});
	}

	// Takes the show for this tab: `true` means the banner is ours to render and the server has
	// already marked it as seen. A refusal is final — the promo is spent for this user, and no
	// later cycle in this tab can turn it back into a grant, so the request is not repeated.
	// A network failure counts as a refusal for its own cycle only and is not remembered: not
	// showing the banner is cheaper than showing it twice. Retrying it takes a fresh page though —
	// the shared queue launches the banner task once per page, so a later cycle in this tab is
	// dropped before it reaches the request.
	static async #claimShow(): Promise<boolean>
	{
		if (SyncTabBanner.#showRefused)
		{
			return false;
		}

		try
		{
			const response: AjaxResponse<ClaimShowResponse> = await ajax.runAction(CLAIM_SHOW_ACTION, {});
			SyncTabBanner.#showRefused = response?.data?.allowed !== true;

			return !SyncTabBanner.#showRefused;
		}
		catch (error)
		{
			Logger.warn('SyncTabBanner: claiming the show failed', error);

			return false;
		}
	}

	// Best-effort fallback for browsers without Web Locks: back off if a winning tab has
	// announced the show within the window. This is not strict mutual exclusion: two tabs
	// racing inside the same window can both miss the announce and show; accepted for a promo.
	static #wasAnnounced(channel: BroadcastChannel): Promise<boolean>
	{
		return new Promise((resolve) => {
			let timeoutId = 0;
			const onMessage = (event: MessageEvent): void => {
				if (event.data && event.data.shown)
				{
					clearTimeout(timeoutId);
					Event.unbind(channel, 'message', onMessage);
					resolve(true);
				}
			};

			Event.bind(channel, 'message', onMessage);

			timeoutId = setTimeout(() => {
				Event.unbind(channel, 'message', onMessage);
				resolve(false);
			}, PROMO_SHOW_ANNOUNCE_TIMEOUT);
		});
	}

	#options: SyncTabBannerOptions;
	#container: HTMLElement;
	#layoutApp: VueCreateAppResult;
	#popup: Popup;
	#closed: boolean = false;

	constructor(options: SyncTabBannerOptions)
	{
		this.#options = options;
		this.#container = Tag.render`<div></div>`;
		this.#layoutApp = BitrixVue.createApp(SyncTabBannerContent, {
			surface: this.#options.surface ?? 'messenger',
			onNavigate: () => this.#handleNavigate(),
			onRequestClose: () => this.close(),
		});
		this.#layoutApp.mount(this.#container);
		this.#popup = new Popup(this.#getPopupConfig());
	}

	close(): void
	{
		if (this.#closed)
		{
			return;
		}

		this.#closed = true;
		this.#popup.close();
	}

	#show(): void
	{
		this.#popup.show();
	}

	#handleNavigate(): void
	{
		// On the Sync page the press just closes the banner: there is nowhere to navigate, and a
		// navigation would reload the page the user is already on. Closing is not measured — same
		// decision as for the cross and the backdrop — so no analytics call here either.
		if ((this.#options.surface ?? 'messenger') === 'sync-page')
		{
			this.close();

			return;
		}

		Analytics.getInstance().syncTabBanner.onButtonClick();
		this.#navigateToSyncTab();
		this.close();
	}

	#getPopupConfig(): PopupOptions
	{
		// The Vue component renders its own full-viewport overlay, backdrop and card,
		// so the popup itself is chrome-less: no overlay, no default close icon, no fade.
		// ESC is handled by the popup (closes at once); the close button / backdrop click
		// play the component's own exit animation before closing.
		return {
			id: BANNER_ID,
			className: 'bx-call-sync-tab-banner__scope',
			ariaLabelledBy: TITLE_ELEMENT_ID,
			content: this.#container,
			overlay: false,
			closeByEsc: true,
			closeIcon: false,
			autoHide: false,
			// the popup is not modal (it draws no overlay of its own), so the isolation
			// that comes with a modal has to be asked for explicitly
			focusTrap: { isolateOutside: true },
			cacheable: false,
			padding: 0,
			events: {
				onAfterPopupShow: () => {
					Analytics.getInstance().syncTabBanner.onBannerView();
				},
				onPopupClose: () => {
					if (Type.isFunction(this.#options.onClose))
					{
						this.#options.onClose();
					}
				},
				onPopupDestroy: () => {
					this.#layoutApp.unmount();
					if (SyncTabBanner.#current === this)
					{
						SyncTabBanner.#current = null;
					}
				},
			},
		};
	}

	#navigateToSyncTab(): void
	{
		try
		{
			if (SyncTabBanner.#clickSyncMenuItem())
			{
				return;
			}

			Page.redirect(SYNC_TAB_PATH);
		}
		catch (error)
		{
			// navigating to the Sync tab is best-effort: a failure must not block the interface
			Logger.warn('SyncTabBanner: navigation failed', error);
		}
	}

	// Clicking the menu item, when there is one, keeps whatever the menu does on top of
	// following its link. Reports whether it found something to click.
	static #clickSyncMenuItem(): boolean
	{
		const menuManager: any = Reflection.getClass('BX.Main.interfaceButtonsManager');
		const menus: any[] = [
			menuManager?.getById('chat-menu'),
			menuManager?.getById('top_menu_id_collaboration'),
		].filter(Boolean);

		for (const menu of menus)
		{
			for (const itemId of SYNC_MENU_ITEM_IDS)
			{
				const item: any = menu?.getItemById?.(itemId) ?? null;
				if (item && Type.isFunction(item.click))
				{
					item.click();

					return true;
				}
			}
		}

		return false;
	}
}

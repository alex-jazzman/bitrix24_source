/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_popupcomponentsmaker, ui_system_menu, main_core_events, ui_iconSet_api_core, main_sidepanel, socialnetwork_v2_lib_eventSender) {
	'use strict';

	class Content extends main_core_events.EventEmitter {
		cache = new main_core.Cache.MemoryCache();
		constructor(params = {}) {
			super();
			this.setEventNamespace('BX.Socialnetwork.FeatureMenu.Content');
			this.cache.set('params', params);
		}
		getParams() {
			return this.cache.get('params', {});
		}
		getFeatures() {
			return this.getParams().features || [];
		}
		getFeatureIds() {
			return this.getParams().featureIds || [];
		}
		getMinHeight() {
			return this.getParams().minHeight || '0';
		}
		getMargin() {
			return this.getParams().margin || '0';
		}
		getFeatureById(id) {
			return this.getFeatures().find(feature => feature.getId() === id) || null;
		}
		getFeaturesByIds(ids = []) {
			const featuresMap = new Map(this.getFeatures().map(feature => [feature.getId(), feature]));
			return ids.reduce((features, id) => {
				const feature = featuresMap.get(id);
				if (feature) {
					features.push(feature);
				}
				return features;
			}, []);
		}
		getLayout() {
			throw new Error('Must be implemented in a child class');
		}
		getFeaturesLayout() {
			return this.getFeaturesByIds(this.getFeatureIds()).map(feature => feature.getLayout());
		}
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: this.getMinHeight(),
				margin: this.getMargin()
			};
		}
	}

	let Base$1 = class Base extends Content {
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div class="socnet-feature-menu-content__wrapper --base">
					<div class="socnet-feature-menu-base-content-features__wrapper">
						${this.getFeaturesLayout()}
					</div>
				</div>
			`;
			});
		}
	};

	class List extends Content {
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div class="socnet-feature-menu-content__wrapper">
					${this.getFeaturesLayout()}
				</div>
			`;
			});
		}
	}

	const NavigationMode = Object.freeze({
		REDIRECT: 'redirect',
		SIDE_PANEL: 'side-panel'
	});
	class Feature extends main_core_events.EventEmitter {
		cache = new main_core.Cache.MemoryCache();
		constructor(params = {}) {
			super();
			this.setEventNamespace(`BX.Socialnetwork.FeatureMenu.Feature-${params.id}`);
			this.params = params;
		}
		getId() {
			return this.params.id;
		}
		getLayout() {
			return null;
		}
		getIcon() {
			throw new Error('Must be implemented in a child class');
		}
		getIconClass() {
			return `--${this.getIcon()}`;
		}
		handleClick(event) {
			this.emit('click');
			if (this.isLocked()) {
				// A click handler is synchronous, so a rejection of the asynchronous window has
				// nowhere to go: showRestriction() has already reported the failure to the console,
				// and an unhandled rejection would only report it a second time.
				void this.showRestriction(this.getRestrictionCode()).catch(() => {});
				event?.stopPropagation();
				event?.preventDefault();
				return;
			}
			const url = this.getUrl();
			if (!url) {
				return;
			}
			this.trackOpen();
			if (this.getNavigationMode() === NavigationMode.SIDE_PANEL) {
				this.#openSidePanel(url, this.getSliderOptions());
			} else {
				this.#redirect(url);
			}
			event?.stopPropagation();
			event?.preventDefault();
		}
		getAnalyticsConfig() {
			return null;
		}
		trackOpen() {
			const config = this.getAnalyticsConfig();
			const projectId = this.params.projectId;
			if (!config || !projectId) {
				return;
			}
			new socialnetwork_v2_lib_eventSender.SectionAnalytics().trackOpen(config, projectId);
		}
		isLocked() {
			return this.params.isLocked === true;
		}
		getRestrictionCode() {
			return this.params.restrictionCode;
		}
		showRestriction(code) {
			if (!code) {
				return Promise.resolve();
			}

			// A row locked by the server is rendered locked on a page which has already got
			// ui.info-helper: show the window right away, without a round-trip to the portal.
			if (this.#hasRestrictionWindow()) {
				return this.#showRestrictionWindow(code);
			}

			// A row may turn out to be restricted only by the server answer, so the page
			// carrying the menu has no reason to load ui.info-helper — take it on demand.
			return main_core.Runtime.loadExtension('ui.info-helper').catch(error => {
				console.error('Feature: failed to load ui.info-helper', error);
				throw error;
			}).then(() => {
				return this.#showRestrictionWindow(code);
			});
		}

		// ui.info-helper is bundled into the BX.UI namespace, so a loaded extension is visible
		// on the page without asking the loader about it.
		#hasRestrictionWindow() {
			return main_core.Type.isFunction(BX.UI?.InfoHelper?.show);
		}
		#showRestrictionWindow(code) {
			if (!this.#hasRestrictionWindow()) {
				const error = new Error('Feature: the restriction window (BX.UI.InfoHelper) is missing');
				console.error(error.message);
				return Promise.reject(error);
			}
			try {
				BX.UI.InfoHelper.show(code);
			} catch (error) {
				console.error('Feature: failed to show the restriction window', error);
				return Promise.reject(error);
			}
			return Promise.resolve();
		}
		getNavigationMode() {
			return NavigationMode.REDIRECT;
		}
		getSliderOptions() {
			return {};
		}
		#redirect(url) {
			window.location.href = url;
		}
		#openSidePanel(url, options = {}) {
			main_sidepanel.SidePanel.Instance.open(url, options);
		}
		getIconElement() {
			throw new Error('Must be implemented in a child class');
		}
		getActionElement() {
			return null;
		}
		getTitle() {
			return this.params.title;
		}
		getUrl() {
			return this.params.url;
		}
	}

	class Blog extends Feature {
		getIcon() {
			return ui_iconSet_api_core.Outline.NEWSFEED;
		}
		getId() {
			return 'blog';
		}
		getAnalyticsConfig() {
			return {
				tool: 'feed',
				category: 'feed',
				event: 'open_section',
				cElement: 'feed_button'
			};
		}
		getNavigationMode() {
			return NavigationMode.SIDE_PANEL;
		}
		getSliderOptions() {
			return {
				contentClassName: 'bitrix24-group-slider-content',
				loader: 'intranet:slider-livefeed',
				cacheable: false,
				customLeftBoundary: 0,
				newWindowLabel: true,
				copyLinkLabel: true,
				width: Math.round(window.innerWidth * 0.8)
			};
		}
	}

	class Base extends Feature {
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div
					data-test-id="bx-socnet-feature-menu-content-base-feature-${this.getId()}"
					onclick="${this.handleClick.bind(this)}"
					class="socnet-feature-menu-content-feature__wrapper"
				>
					<div class="socnet-feature-menu-content-base-feature-icon__wrapper">
						${this.getIconElement()}
						${this.#getCounterWrapper()}
					</div>
					<div class="socnet-feature-menu-content-base-feature__title">
						${this.getTitle()}
					</div>
				</div>
			`;
			});
		}
		getIconElement() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`
				<i
					class="ui-icon-set ${this.getIconClass()} socnet-feature-menu-content-base-feature__icon"
				/>
			`;
			});
		}
		getCounter() {
			return null;
		}
		#getCounterWrapper() {
			return this.cache.remember('counterWrapper', () => {
				const counter = this.getCounter();
				return main_core.Tag.render`
				<div class="socnet-feature-menu-content-base-feature__counter-wrapper">
					${counter?.render()}
				</div>
			`;
			});
		}
	}

	class Calendar extends Base {
		getIcon() {
			return ui_iconSet_api_core.Outline.CALENDAR_WITH_SLOTS;
		}
		getId() {
			return 'calendar';
		}
		getNavigationMode() {
			return NavigationMode.SIDE_PANEL;
		}
		getAnalyticsConfig() {
			return {
				tool: 'calendar',
				category: 'calendar',
				event: 'open_section',
				cElement: 'calendar_view_button'
			};
		}
	}

	class Files extends Base {
		getIcon() {
			return ui_iconSet_api_core.Outline.ATTACH;
		}
		getId() {
			return 'files';
		}
		getNavigationMode() {
			return NavigationMode.SIDE_PANEL;
		}
		getAnalyticsConfig() {
			return {
				tool: 'files',
				category: 'files_operations',
				event: 'open_section',
				cElement: 'files_button'
			};
		}
	}

	class Row extends Feature {
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div
					data-testid="bx-socnet-feature-menu-content-row-feature-${this.getId()}"
					onclick="${this.handleClick.bind(this)}"
					class="socnet-feature-menu-row-feature__wrapper"
				>
					${this.getIconElement()}
					<div class="socnet-feature-menu-content-row-item__info-wrapper">
						<span class="socnet-feature-menu-content-row-item__title">
							${this.getTitle()}
						</span>
					</div>
					${this.#getCounterWrapper()}
					${this.getActionElement()}
				</div>
			`;
			});
		}
		getIconElement() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`<i class="ui-icon-set ${this.getIconClass()} socnet-feature-menu-row-feature__icon"/>`;
			});
		}
		getActionElement() {
			return this.cache.remember('actionElement', () => {
				return main_core.Tag.render`<i class="ui-icon-set --chevron-right-m socnet-feature-menu-content-row-item__chevron"/>`;
			});
		}
		getCounter() {
			return null;
		}
		#getCounterWrapper() {
			return this.cache.remember('counterWrapper', () => {
				const counter = this.getCounter();
				return main_core.Tag.render`
				<div class="socnet-feature-menu-content-row-item__counter">
					${counter?.render()}
				</div>
			`;
			});
		}
	}

	class Flows extends Row {
		getIcon() {
			return ui_iconSet_api_core.Outline.BOTTLENECK;
		}
		getId() {
			return 'flows';
		}
		getNavigationMode() {
			return NavigationMode.SIDE_PANEL;
		}
	}

	class Forum extends Feature {
		getIcon() {
			return ui_iconSet_api_core.Outline.CONTACT;
		}
		getId() {
			return 'forum';
		}
	}

	/**
	 * Lists keeps its own ordinary pages, so the tool is opened in a new tab and the project stays
	 * in the tab the menu was opened from. The page is reached either by the link this row renders
	 * or, when the menu shows Lists as a menu item, by the click handler below — either way the tab
	 * is opened synchronously, while the user gesture still allows it.
	 */
	class Lists extends Row {
		getIcon() {
			return ui_iconSet_api_core.Outline.ACTION_REQUIRED;
		}
		getId() {
			return 'group_lists';
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				const layout = main_core.Tag.render`
				<a
					data-testid="bx-socnet-feature-menu-content-row-feature-${this.getId()}"
					onclick="${this.handleClick.bind(this)}"
					class="socnet-feature-menu-row-feature__wrapper"
				>
					${this.getIconElement()}
					<div class="socnet-feature-menu-content-row-item__info-wrapper">
						<span class="socnet-feature-menu-content-row-item__title">
							${main_core.Text.encode(this.getTitle())}
						</span>
					</div>
					${this.getActionElement()}
				</a>
			`;

				// A row the server brought no url for is not a link: it leads nowhere and an empty
				// `href` would reload the project page instead.
				const url = this.getUrl();
				if (url) {
					layout.href = url;
					layout.target = '_blank';
					// The opened page keeps no handle on the tab of the project.
					layout.rel = 'noopener';
				}
				return layout;
			});
		}
		handleClick(event) {
			this.emit('click');
			if (this.isLocked()) {
				// A click handler is synchronous, so a rejection of the asynchronous window has
				// nowhere to go: showRestriction() has already reported the failure to the console,
				// and an unhandled rejection would only report it a second time.
				void this.showRestriction(this.getRestrictionCode()).catch(() => {});
				event?.stopPropagation();
				event?.preventDefault();
				return;
			}
			const url = this.getUrl();
			if (!url) {
				return;
			}
			this.trackOpen();

			// The link of getLayout() is followed by the browser itself: opening the page here on
			// top of it would open the tool twice.
			if (this.#isOwnLinkClick(event)) {
				event.stopPropagation();
				return;
			}

			// A menu item is not the link — it calls the handler directly, so the new tab is opened
			// here. The default is prevented afterwards, the way the base row does it, so the click
			// leaves the menu container alone.
			window.open(url, '_blank', 'noopener');
			event?.stopPropagation();
			event?.preventDefault();
		}
		#isOwnLinkClick(event) {
			const layout = this.cache.get('layout', null);
			return layout instanceof HTMLAnchorElement && layout.hasAttribute('href') && event?.currentTarget === layout;
		}
	}

	class Knowledge extends Row {
		getIcon() {
			if (this.isLocked()) {
				return ui_iconSet_api_core.Outline.LOCK_L;
			}
			return ui_iconSet_api_core.Outline.KNOWLEDGE_BASE;
		}
		getId() {
			return 'landing_knowledge';
		}
		getNavigationMode() {
			return NavigationMode.SIDE_PANEL;
		}
		getAnalyticsConfig() {
			return {
				tool: 'kb',
				category: 'kb',
				event: 'open_start_page',
				cElement: 'bz_button'
			};
		}
	}

	class Marketplace extends Row {
		getIcon() {
			return ui_iconSet_api_core.Outline.MARKET;
		}
		getId() {
			return 'marketplace';
		}
		getAnalyticsConfig() {
			return {
				tool: 'kb',
				category: 'kb',
				event: 'open_market',
				cElement: 'market_button'
			};
		}
		handleClick(event) {
			this.trackOpen();
			BX.rest.Marketplace.open({
				PLACEMENT: 'SONET_GROUP_DETAIL_TAB'
			});
			event?.stopPropagation();
			event?.preventDefault();
		}
	}

	// socialnetwork.collab.Note.resolveSection: every field of the section may come back empty,
	// and `collectionId` is a part of the answer the row itself does not need.

	class Note extends Row {
		getIcon() {
			if (this.isLocked()) {
				return ui_iconSet_api_core.Outline.LOCK_L;
			}
			return ui_iconSet_api_core.Outline.KNOWLEDGE_BASE;
		}
		getId() {
			return 'note';
		}
		getNavigationMode() {
			return NavigationMode.SIDE_PANEL;
		}
		handleClick(event) {
			// Locked (tariff) — keep the base upsell behaviour (restriction slider).
			if (this.isLocked()) {
				super.handleClick(event);
				return;
			}
			this.emit('click');
			event?.stopPropagation();
			event?.preventDefault();

			// Lazy provisioning: the collab knowledge base is created on the FIRST click,
			// not at collab creation. The server resolves (and provisions on demand) the
			// section URL, which is then opened in a side panel.
			void this.#openSection();
		}
		async #openSection() {
			const projectId = this.params.projectId;
			if (!projectId) {
				return;
			}

			// First click may lazily create the collection on the server — show a spinner
			// in the row and keep the menu open until the section URL is resolved.
			this.#setLoading(true);
			try {
				const response = await main_core.ajax.runAction('socialnetwork.collab.Note.resolveSection', {
					data: {
						groupId: projectId
					}
				});

				// Awaited, so the spinner stays until the answer has been acted upon —
				// the restriction window may still have to load its own extension.
				await this.handleSectionResponse(response);
			} catch (error) {
				console.error('Note: failed to open the knowledge-base section', error);
			} finally {
				this.#setLoading(false);
			}
		}
		handleSectionResponse(response) {
			const url = response?.data?.url;
			if (url) {
				main_sidepanel.SidePanel.Instance.open(url, this.getSliderOptions());
				return Promise.resolve();
			}

			// The menu is cached until the page reloads, so the tariff may have closed
			// after the row had been rendered as available.
			return this.showRestriction(response?.data?.restriction);
		}
		#setLoading(loading) {
			const action = this.getActionElement();
			if (!(action instanceof HTMLElement)) {
				return;
			}

			// Swap the chevron (Row::getActionElement) for a self-contained CSS spinner
			// (feature.css `.--is-loading`) — no extra icon-set dependency.
			const chevronClass = '--chevron-right-m';
			const loaderClass = '--is-loading';
			if (loading) {
				main_core.Dom.removeClass(action, chevronClass);
				main_core.Dom.addClass(action, loaderClass);
			} else {
				main_core.Dom.removeClass(action, loaderClass);
				main_core.Dom.addClass(action, chevronClass);
			}
		}
	}

	class Placement extends Feature {
		getIcon() {
			return ui_iconSet_api_core.Outline.FOLDER;
		}
	}

	class Photo extends Feature {
		getIcon() {
			return ui_iconSet_api_core.Outline.CAMERA;
		}
		getId() {
			return 'photo';
		}
		getAnalyticsConfig() {
			return {
				tool: 'projects',
				category: 'project',
				event: 'open_section',
				cElement: 'photos_button'
			};
		}
		getNavigationMode() {
			return NavigationMode.SIDE_PANEL;
		}
	}

	class StartupToolSettings extends Row {
		getIcon() {
			return ui_iconSet_api_core.Outline.SETTINGS;
		}
		getId() {
			return 'settings_startup_tool';
		}
		handleClick(event) {
			this.emit('click');
			event?.stopPropagation();
			event?.preventDefault();
			void this.#openProjectWizard();
		}
		async #openProjectWizard() {
			const projectId = this.params.projectId;
			if (!projectId) {
				return;
			}
			if (main_core.Type.isFunction(this.params.onOpenStartupToolSettings)) {
				this.params.onOpenStartupToolSettings();
				return;
			}
			try {
				await main_core.Runtime.loadExtension('socialnetwork.v2.application.project-wizard');
				const ProjectWizard = BX.Socialnetwork?.V2?.Application?.ProjectWizard;
				const actions = BX.Socialnetwork?.V2?.Model?.TYPES_PROJECT_WIZARD_ACTION;
				if (!ProjectWizard || !actions) {
					return;
				}
				const wizard = new ProjectWizard({
					action: actions.UPDATE,
					projectId,
					scrollToStartupTool: true,
					onCancel: () => {}
				});
				void wizard.show();
			} catch (error) {
				console.error('StartupToolSettings: failed to open project wizard', error);
			}
		}
	}

	class Tasks extends Base {
		getIcon() {
			return ui_iconSet_api_core.Outline.TASK;
		}
		getCounter() {
			return this.cache.remember('counter', () => {
				if (Number(this.params.counter) < 1) {
					return null;
				}
				return null;
			});
		}
		getId() {
			return 'tasks';
		}
		getNavigationMode() {
			return NavigationMode.SIDE_PANEL;
		}
	}

	class Wiki extends Feature {
		getIcon() {
			return ui_iconSet_api_core.Outline.WIKI;
		}
		getId() {
			return 'wiki';
		}
		getAnalyticsConfig() {
			return {
				tool: 'projects',
				category: 'project',
				event: 'open_start_page',
				cElement: 'wiki_button'
			};
		}
	}

	const featureClassMap = {
		tasks: Tasks,
		calendar: Calendar,
		files: Files,
		landing_knowledge: Knowledge,
		note: Note,
		flows: Flows,
		marketplace: Marketplace,
		blog: Blog,
		forum: Forum,
		group_lists: Lists,
		wiki: Wiki,
		photo: Photo,
		settings_startup_tool: StartupToolSettings
	};
	class FeatureFactory {
		static createCollection(features = [], projectId = null, onOpenStartupToolSettings) {
			const collection = [];
			features.forEach(feature => {
				const featureItem = this.create(feature, projectId, onOpenStartupToolSettings);
				if (featureItem) {
					collection.push(featureItem);
				}
			});
			return collection;
		}
		static create(feature = {}, projectId = null, onOpenStartupToolSettings) {
			const params = projectId === null ? feature : {
				...feature,
				projectId
			};
			if (feature.id?.startsWith('placement_')) {
				return new Placement(params);
			}
			const FeatureClass = featureClassMap[feature.id];
			if (!FeatureClass) {
				return null;
			}
			if (feature.id === 'settings_startup_tool' && typeof onOpenStartupToolSettings === 'function') {
				return new FeatureClass({
					...params,
					onOpenStartupToolSettings
				});
			}
			return new FeatureClass(params);
		}
	}

	class Apps extends Row {
		getId() {
			return 'apps';
		}
		getTitle() {
			return 'Apps';
		}
		getIcon() {
			return ui_iconSet_api_core.Outline.ADD_PRODUCT;
		}
		getUrl() {
			return '';
		}
	}

	class More extends Row {
		getId() {
			return 'more';
		}
		getTitle() {
			return 'More';
		}
		getIcon() {
			return ui_iconSet_api_core.Outline.MORE_L;
		}
		getUrl() {
			return '';
		}
	}

	class FeatureMenuLoader {
		#cache = new main_core.Cache.MemoryCache();
		constructor(params = {}) {
			this.#cache.set('params', params);
		}
		show() {
			this.getPopup().show();
		}
		getPopup() {
			return this.#cache.remember('popup', () => {
				const popup = new main_popup.Popup({
					autoHide: true,
					id: this.#getParams().id ?? null,
					bindElement: this.#getParams().bindElement,
					width: this.#getParams().width,
					useAngle: this.#getParams().useAngle ?? true,
					angle: this.#getParams().useAngle ?? {
						offset: this.#getParams().width / 2 - 16
					},
					className: this.#getParams().className ?? null,
					animation: 'fading-slide',
					closeByEsc: true,
					offsetLeft: this.#getParams().offsetLeft ?? 0,
					offsetTop: this.#getParams().offsetTop ?? 3
				});
				const container = popup.getPopupContainer();
				this.#cache.set('popup-content', container.querySelector('.popup-window-content'));
				main_core.Dom.remove(container.querySelector('.popup-window-content'));
				main_core.Dom.addClass(container, 'socnet-feature-menu-skeleton__wrap');
				return popup;
			});
		}
		#getParams() {
			return this.#cache.get('params', {});
		}
		createSkeleton() {
			this.#addHeaderSkeleton();
			this.#addItemsSkeleton(1);
			this.#addItemsSkeleton(1);
			return this;
		}
		clearBeforeInsertContent() {
			const popupContainer = this.getPopup().getPopupContainer();
			main_core.Dom.removeClass(popupContainer, 'socnet-feature-menu-skeleton__wrap');
			const selectors = ['.socnet-feature-menu-skeleton', '.socnet-feature-menu-skeleton__header', '.socnet-feature-menu-skeleton__row'].join(', ');
			popupContainer.querySelectorAll(selectors).forEach(node => main_core.Dom.remove(node));
			main_core.Dom.prepend(this.#cache.get('popup-content'), popupContainer);
		}
		#addHeaderSkeleton() {
			main_core.Dom.prepend(this.#createHeaderSkeleton(), this.getPopup().getPopupContainer());
			return this;
		}
		#addItemsSkeleton(count) {
			main_core.Dom.append(this.#createItemsSkeleton(count), this.getPopup().getPopupContainer());
			return this;
		}
		#createItemsSkeleton(count) {
			const wrapper = main_core.Tag.render`
			<div class="socnet-feature-menu-skeleton__row">
				<div class="socnet-feature-menu-skeleton__item --column"></div>
			</div>
		`;
			const classPrefix = 'socnet-feature-menu-skeleton';
			for (let i = 0; i < count; i++) {
				const item = main_core.Tag.render`
				<div class="socnet-feature-menu-skeleton__nested-item">
					<div class="${classPrefix}__cube ${classPrefix}-column-split-item__cube"></div>
					<div class="${classPrefix}__line ${classPrefix}-column-split-item__line"></div>
					<div class="${classPrefix}__circle ${classPrefix}-column-split-item__circle"></div>
				</div>
			`;
				main_core.Dom.append(item, wrapper.querySelector('.socnet-feature-menu-skeleton__item'));
			}
			return wrapper;
		}
		#createHeaderSkeleton() {
			return main_core.Tag.render`
			<div class="socnet-feature-menu-skeleton__header">
				${this.#createFeaturesSkeleton()}
			</div>
		`;
		}
		#createFeaturesSkeleton(count = 3) {
			const wrapper = main_core.Tag.render`
			<div class="socnet-feature-menu-skeleton__features">
				<div class="socnet-feature-menu-skeleton__cubes"></div>
			</div>
		`;
			const labelsWrapper = main_core.Tag.render`<div class="socnet-feature-menu-skeleton__features-labels"></div>`;
			for (let i = 0; i < count; i++) {
				const itemCube = main_core.Tag.render`<div class="socnet-feature-menu-skeleton__cube"></div>`;
				main_core.Dom.append(itemCube, wrapper.querySelector('.socnet-feature-menu-skeleton__cubes'));
				const itemLabel = main_core.Tag.render`
				<div class="socnet-feature-menu-skeleton__line socnet-feature-menu-skeleton__features-label">
				</div>
			`;
				main_core.Dom.append(itemLabel, labelsWrapper);
			}
			main_core.Dom.append(labelsWrapper, wrapper);
			return wrapper;
		}
	}

	const featuresMenuOrder = ['blog', 'landing_knowledge', 'note', 'flows', 'photo', 'group_lists', 'forum', 'wiki', 'marketplace'];
	const secondaryFeaturesMenuOrder = ['marketplace'];
	const secondarySectionCode = 'secondary';
	const startupToolFeaturesOrder = ['settings_startup_tool'];
	const startupToolSectionCode = 'startup_tool';

	// All feature ids that are excluded from primary tiles and extra/"more" menu
	const allSecondaryIds = new Set([...secondaryFeaturesMenuOrder, ...startupToolFeaturesOrder]);
	class FeatureMenu {
		#cache = new main_core.Cache.MemoryCache();
		constructor(params = {}) {
			this.#cache.set('params', params);
			this.#validateRequiredParams();
		}
		init() {
			main_core.Event.unbindAll(this.#getParams().bindElement);
			main_core.Event.bind(this.#getParams().bindElement, 'click', () => {
				this.#getLoader().getPopup().setFixed(true);
				this.#getLoader().createSkeleton().show();
				this.#getData().then(() => {
					this.#getLoader().clearBeforeInsertContent();
					this.#show();
					main_core.Event.unbindAll(this.#getParams().bindElement);
					main_core.Event.bind(this.#getParams().bindElement, 'click', () => {
						this.#show();
					});
				}).catch(() => {});
			});
		}
		async showFeatures() {
			const menu = this.#getFeaturesMenu();
			if (menu && menu.getPopup()?.isShown()) {
				return;
			}
			await this.#getData();
			this.#showFeaturesMenu();
		}
		static async navigateToBaseFeature(projectChatId) {
			const response = await main_core.ajax.runAction('socialnetwork.V2.Project.getBaseFeature', {
				json: {
					project: {
						chatId: projectChatId
					}
				}
			});
			const baseFeature = response.data;
			if (baseFeature) {
				const feature = FeatureFactory.create(baseFeature, baseFeature?.projectId);
				feature?.handleClick();
			}
		}
		#show() {
			if (this.#getPopup().isShown()) {
				return;
			}
			this.#getPopup().show();
		}
		#showFeaturesMenu() {
			const menu = this.#getFeaturesMenu();
			if (menu === null || menu.getPopup()?.isShown()) {
				return;
			}
			menu.show(this.#getParams().bindElement);
		}
		#getParams() {
			return this.#cache.get('params', {});
		}
		#validateRequiredParams() {
			if (!this.#getParams().projectId) {
				throw new Error('projectId is required parameter');
			}
			if (!this.#getParams().bindElement) {
				throw new Error('bindElement is required parameter');
			}
		}
		#getFeatures() {
			return this.#cache.get('features', []);
		}
		#getFeatureItems() {
			return this.#cache.remember('featureItems', () => FeatureFactory.createCollection(this.#getFeatures(), this.#getParams().projectId, this.#getParams().onOpenStartupToolSettings));
		}
		#resetDerivedCache() {
			['featureItems', 'content', 'popup', 'featuresMenu', 'extraFeaturesMenu', 'placementFeaturesMenu', 'moreFeature', 'appsFeature'].forEach(cacheKey => this.#cache.delete(cacheKey));
		}
		#getData() {
			if (this.#cache.get('dataLoaded', false)) {
				return Promise.resolve(this.#getFeatures());
			}
			return this.#cache.remember('data', async () => {
				try {
					const response = await main_core.ajax.runAction('socialnetwork.v2.Project.getFeatures', {
						json: {
							project: {
								id: this.#getParams().projectId
							}
						}
					});
					this.#cache.set('features', response.data);
					this.#cache.set('dataLoaded', true);
					this.#resetDerivedCache();
					return response.data;
				} catch (response) {
					this.#cache.delete('data');
					throw response;
				}
			});
		}
		#getPopup() {
			return this.#cache.remember('popup', () => {
				const popup = new ui_popupcomponentsmaker.PopupComponentsMaker({
					target: this.#getParams().bindElement,
					popupLoader: this.#getLoader().getPopup(),
					width: 340,
					content: this.#getContent(),
					padding: 0
				});
				this.#cache.set('popup', popup);
				this.#cache.set('contentWrapper', popup.getContentWrapper());
				return popup;
			});
		}
		#getLoader() {
			return this.#cache.remember('loader', () => {
				return new FeatureMenuLoader({
					bindElement: this.#getParams().bindElement,
					className: 'socnet-feature-menu-skeleton-popup',
					width: 340,
					useAngle: false,
					fixed: true
				});
			});
		}
		#getContent() {
			return this.#cache.remember('content', () => {
				return this.#getContentDescriptions().map(description => {
					if (description.type === 'base') {
						return this.#getBase(description.params).getConfig();
					}
					return this.#getList(description.params).getConfig();
				});
			});
		}
		#getContentDescriptions() {
			return this.#getBaseContentDescriptions().map(description => {
				const featureIds = [...(description.params.featureIds || [])];
				if (description.params.appendMoreFeature && this.#hasExtraFeatures()) {
					featureIds.push('more');
				}
				if (description.params.appendAppsFeature && this.#hasPlacementFeatures()) {
					featureIds.push('apps');
				}
				if (featureIds.length === (description.params.featureIds || []).length) {
					return description;
				}
				return {
					...description,
					params: {
						...description.params,
						featureIds
					}
				};
			});
		}
		#getBase(params = {}) {
			const cacheId = this.#getContentCacheId('baseContent', params);
			return this.#cache.remember(cacheId, () => {
				return new Base$1({
					features: this.#getFeatureItems(),
					...params
				});
			});
		}
		#getList(params = {}) {
			const cacheId = this.#getContentCacheId('listContent', params);
			return this.#cache.remember(cacheId, () => {
				return new List({
					features: this.#getListFeatures(params),
					...params
				});
			});
		}
		#hasExtraFeatures() {
			return this.#getExtraFeatureItems().length > 0;
		}
		#hasPlacementFeatures() {
			return this.#getPlacementFeatures().length > 0;
		}
		#getExtraFeatureItems() {
			const renderedFeatureIds = new Set(this.#getBaseContentDescriptions().flatMap(description => description.params.featureIds || []));
			return this.#getFeatureItems().filter(feature => {
				return !feature.getId().startsWith('placement_') && !renderedFeatureIds.has(feature.getId()) && !allSecondaryIds.has(feature.getId());
			});
		}
		#getPlacementFeatures() {
			return this.#getFeatureItems().filter(feature => feature.getId().startsWith('placement_'));
		}
		#getListFeatures(params = {}) {
			const featureItems = [...this.#getFeatureItems()];
			if (this.#shouldAppendMoreFeature(params)) {
				featureItems.push(this.#getMoreFeature());
			}
			if (this.#shouldAppendAppsFeature(params)) {
				featureItems.push(this.#getAppsFeature());
			}
			return featureItems;
		}
		#shouldAppendMoreFeature(params = {}) {
			return params.appendMoreFeature === true && this.#hasExtraFeatures();
		}
		#shouldAppendAppsFeature(params = {}) {
			return params.appendAppsFeature === true && this.#hasPlacementFeatures();
		}
		#getMoreFeature() {
			return this.#cache.remember('moreFeature', () => {
				const moreFeature = new More();
				moreFeature.subscribe('click', this.#showMoreFeatureMenu.bind(this));
				return moreFeature;
			});
		}
		#getAppsFeature() {
			return this.#cache.remember('appsFeature', () => {
				const appsFeature = new Apps();
				appsFeature.subscribe('click', this.#showPlacementFeatures.bind(this));
				return appsFeature;
			});
		}
		#showMoreFeatureMenu(baseEvent) {
			const moreFeature = baseEvent.getTarget();
			const menu = this.#cache.remember('extraFeaturesMenu', () => {
				return new main_popup.Menu({
					bindElement: moreFeature.getActionElement(),
					offsetLeft: -25,
					offsetTop: -50,
					bindOptions: {
						forceBindPosition: false
					},
					angle: false,
					closeByEsc: true,
					items: this.#getExtraFeatureItems().map(feature => this.#createPopupMenuItem(feature))
				});
			});
			menu.show();
		}
		#showPlacementFeatures(baseEvent) {
			const appsFeature = baseEvent.getTarget();
			const menu = this.#cache.remember('placementFeaturesMenu', () => {
				return new main_popup.Menu({
					bindElement: appsFeature.getActionElement(),
					offsetLeft: -25,
					offsetTop: -50,
					bindOptions: {
						forceBindPosition: false
					},
					angle: false,
					closeByEsc: true,
					items: this.#getPlacementFeatures().map(feature => this.#createPopupMenuItem(feature))
				});
			});
			menu.show();
		}
		#getFeaturesMenu() {
			const items = this.#getFeaturesMenuItems();
			if (items.length === 0) {
				return null;
			}
			return this.#cache.remember('featuresMenu', () => {
				return new ui_system_menu.Menu({
					minWidth: 220,
					offsetLeft: 28,
					sections: this.#getFeaturesMenuSections(),
					angle: false,
					closeByEsc: true,
					items
				});
			});
		}
		#getFeaturesMenuItems() {
			const primaryItems = this.#getOrderedPrimaryFeatures().map(feature => this.#createSystemMenuItem(feature));
			const secondaryItems = this.#getOrderedSecondaryFeatures().map(feature => this.#createSystemMenuItem(feature, secondarySectionCode));
			if (this.#hasPlacementFeatures()) {
				secondaryItems.push({
					id: 'applications',
					sectionCode: secondarySectionCode,
					title: main_core.Loc.getMessage('SOCNET_FEATURE_MENU_APPLICATIONS'),
					subMenu: {
						angle: false,
						items: this.#getPlacementFeatures().map(feature => this.#createSystemMenuItem(feature, undefined, false))
					}
				});
			}
			const startupToolItems = this.#getOrderedStartupToolFeatures().map(feature => this.#createSystemMenuItem(feature, startupToolSectionCode));
			return [...primaryItems, ...secondaryItems, ...startupToolItems];
		}
		#getFeaturesMenuSections() {
			const sections = [];
			if (this.#getOrderedSecondaryFeatures().length > 0 || this.#hasPlacementFeatures()) {
				sections.push({
					code: secondarySectionCode
				});
			}
			if (this.#getOrderedStartupToolFeatures().length > 0) {
				sections.push({
					code: startupToolSectionCode
				});
			}
			return sections;
		}
		#orderFeaturesBy(order) {
			const featuresMap = new Map(this.#getFeatureItems().map(feature => [feature.getId(), feature]));
			return order.reduce((features, featureId) => {
				const feature = featuresMap.get(featureId);
				if (feature) {
					features.push(feature);
				}
				return features;
			}, []);
		}
		#getOrderedPrimaryFeatures() {
			return this.#orderFeaturesBy(featuresMenuOrder).filter(feature => !allSecondaryIds.has(feature.getId()));
		}
		#getOrderedSecondaryFeatures() {
			return this.#orderFeaturesBy(secondaryFeaturesMenuOrder);
		}
		#getOrderedStartupToolFeatures() {
			return this.#orderFeaturesBy(startupToolFeaturesOrder);
		}
		#createPopupMenuItem(feature) {
			return {
				id: feature.getId(),
				text: feature.getTitle(),
				onclick: (e, menuItem) => {
					menuItem.getMenuWindow().close();
					feature.handleClick();
				}
			};
		}
		#createSystemMenuItem(feature, sectionCode, withIcon = true) {
			return {
				id: feature.getId(),
				sectionCode,
				title: feature.getTitle(),
				...(withIcon ? {
					icon: feature.getIcon()
				} : {}),
				onClick: () => {
					feature.handleClick();
				}
			};
		}
		#getBaseContentDescriptions() {
			return [{
				type: 'base',
				params: {
					featureIds: ['tasks', 'files', 'calendar']
				}
			}, {
				type: 'list',
				params: {
					featureIds: ['landing_knowledge', 'note', 'flows'],
					minHeight: '50px',
					margin: '8px 20px 0 20px',
					appendMoreFeature: true
				}
			}, {
				type: 'list',
				params: {
					featureIds: ['marketplace'],
					minHeight: '50px',
					margin: '0 20px 20px 20px',
					appendAppsFeature: true
				}
			}];
		}
		#getContentCacheId(type, params = {}) {
			return JSON.stringify({
				type,
				params: this.#normalizeCacheValue(params)
			});
		}
		#normalizeCacheValue(value) {
			if (main_core.Type.isArray(value)) {
				return value.map(item => this.#normalizeCacheValue(item));
			}
			if (main_core.Type.isObjectLike(value)) {
				return Object.fromEntries(Object.keys(value).sort().map(key => [key, this.#normalizeCacheValue(value[key])]));
			}
			return value;
		}
	}

	exports.FeatureMenu = FeatureMenu;

})(this.BX.Socialnetwork = this.BX.Socialnetwork || {}, BX, BX.Main, BX.UI, BX.UI.System, BX.Event, BX.UI.IconSet, BX.SidePanel, BX.Socialnetwork.V2.Lib);
//# sourceMappingURL=feature-menu.bundle.js.map

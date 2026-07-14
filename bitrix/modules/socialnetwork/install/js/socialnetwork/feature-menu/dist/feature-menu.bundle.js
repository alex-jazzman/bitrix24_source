/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_popupcomponentsmaker, ui_system_menu, main_core_events, ui_iconSet_api_core, main_sidepanel) {
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
				this.#showRestriction();
				event?.stopPropagation();
				event?.preventDefault();
				return;
			}
			const url = this.getUrl();
			if (!url) {
				return;
			}
			if (this.getNavigationMode() === NavigationMode.SIDE_PANEL) {
				this.#openSidePanel(url, this.getSliderOptions());
			} else {
				this.#redirect(url);
			}
			event?.stopPropagation();
			event?.preventDefault();
		}
		isLocked() {
			return this.params.isLocked === true;
		}
		getRestrictionCode() {
			return this.params.restrictionCode;
		}
		#showRestriction() {
			const code = this.getRestrictionCode();
			if (!code) {
				return;
			}
			BX.UI.InfoHelper.show(code);
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

	class Lists extends Feature {
		getIcon() {
			return ui_iconSet_api_core.Outline.ACTION_REQUIRED;
		}
		getId() {
			return 'group_lists';
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
	}

	class Marketplace extends Row {
		getIcon() {
			return ui_iconSet_api_core.Outline.MARKET;
		}
		getId() {
			return 'marketplace';
		}
		handleClick(event) {
			BX.rest.Marketplace.open({
				PLACEMENT: 'SONET_GROUP_DETAIL_TAB'
			});
			event?.stopPropagation();
			event?.preventDefault();
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
		getNavigationMode() {
			return NavigationMode.SIDE_PANEL;
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
	}

	const featureClassMap = {
		tasks: Tasks,
		calendar: Calendar,
		files: Files,
		landing_knowledge: Knowledge,
		flows: Flows,
		marketplace: Marketplace,
		blog: Blog,
		forum: Forum,
		group_lists: Lists,
		wiki: Wiki,
		photo: Photo
	};
	class FeatureFactory {
		static createCollection(features = []) {
			const collection = [];
			features.forEach(feature => {
				const featureItem = this.create(feature);
				if (featureItem) {
					collection.push(featureItem);
				}
			});
			return collection;
		}
		static create(feature = {}) {
			if (feature.id?.startsWith('placement_')) {
				return new Placement(feature);
			}
			const FeatureClass = featureClassMap[feature.id];
			if (!FeatureClass) {
				return null;
			}
			return new FeatureClass(feature);
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

	const featuresMenuOrder = ['blog', 'landing_knowledge', 'flows', 'photo', 'group_lists', 'forum', 'wiki', 'marketplace'];
	const secondaryFeaturesMenuOrder = ['marketplace'];
	const secondarySectionCode = 'secondary';
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
				const feature = FeatureFactory.create(baseFeature);
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
			return this.#cache.remember('featureItems', () => FeatureFactory.createCollection(this.#getFeatures()));
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
				return !feature.getId().startsWith('placement_') && !renderedFeatureIds.has(feature.getId());
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
			return [...primaryItems, ...secondaryItems];
		}
		#getFeaturesMenuSections() {
			if (this.#getOrderedSecondaryFeatures().length === 0 && !this.#hasPlacementFeatures()) {
				return [];
			}
			return [{
				code: secondarySectionCode
			}];
		}
		#getOrderedPrimaryFeatures() {
			const secondaryIds = new Set(secondaryFeaturesMenuOrder);
			const featuresMap = new Map(this.#getFeatureItems().map(feature => [feature.getId(), feature]));
			return featuresMenuOrder.reduce((features, featureId) => {
				const feature = featuresMap.get(featureId);
				if (feature && !secondaryIds.has(featureId)) {
					features.push(feature);
				}
				return features;
			}, []);
		}
		#getOrderedSecondaryFeatures() {
			const featuresMap = new Map(this.#getFeatureItems().map(feature => [feature.getId(), feature]));
			return secondaryFeaturesMenuOrder.reduce((features, featureId) => {
				const feature = featuresMap.get(featureId);
				if (feature) {
					features.push(feature);
				}
				return features;
			}, []);
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
					featureIds: ['landing_knowledge', 'flows'],
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

})(this.BX.Socialnetwork = this.BX.Socialnetwork || {}, BX, BX.Main, BX.UI, BX.UI.System, BX.Event, BX.UI.IconSet, BX.SidePanel);
//# sourceMappingURL=feature-menu.bundle.js.map

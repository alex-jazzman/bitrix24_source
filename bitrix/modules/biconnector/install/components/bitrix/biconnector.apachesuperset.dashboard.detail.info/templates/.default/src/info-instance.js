import { Event, Loc, Text, Type, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Loader } from 'main.loader';
import { Messenger } from 'im.public';
import { DashboardManager } from 'biconnector.apache-superset-dashboard-manager';
import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';
import { VendorBlock } from './blocks/vendor';
import { ViewsBlock } from './blocks/views';
import { ButtonsBlock, MoreMenu } from './blocks/buttons';
import { CoverBlock } from './blocks/cover';
import { InfoBlock } from './blocks/info';
import { GalleryBlock } from './blocks/gallery';
import { DescriptionBlock } from './blocks/description';

type InfoConfig = {
	appNodeId?: string,
	componentName?: string,
	dashboardId?: number,
	dashboardListUrl?: string,
	imagesPath?: string,
	emptyIconPath?: string,
	emptyDescriptionPath?: string,
	isMarketModuleInstalled?: boolean,
	canModifySettings?: boolean,
	canDelete?: boolean,
};

export class InfoInstance
{
	constructor(config: InfoConfig = {})
	{
		this.eps = 2;
		this.defaultStep = 240;
		this.dashboardId = Type.isNumber(config.dashboardId) ? config.dashboardId : 0;
		this.componentName = Type.isStringFilled(config.componentName)
			? config.componentName
			: 'bitrix:biconnector.apachesuperset.dashboard.detail.info'
		;
		this.appNodeId = Type.isStringFilled(config.appNodeId)
			? config.appNodeId
			: 'biconnector-dashboard-detail-info-app'
		;
		this.appNode = document.getElementById(this.appNodeId);
		this.viewerGroupId = `biconnector-dashboard-detail-info-gallery-${this.dashboardId || 'default'}`;
		this.moreMenuId = `biconnector-dashboard-detail-info-more-menu-${this.dashboardId || 'default'}`;
		this.dashboardListUrl = Type.isStringFilled(config.dashboardListUrl) ? config.dashboardListUrl : '/bi/dashboard/';
		this.imagesPath = Type.isStringFilled(config.imagesPath) ? config.imagesPath : '';
		this.emptyIconPath = this.imagesPath ? `${this.imagesPath}/icon_empty.png` : '';
		this.emptyDescriptionPath = this.imagesPath ? `${this.imagesPath}/description_empty.png` : '';
		this.isMarketModuleInstalled = config.isMarketModuleInstalled === true;
		this.marketBackgroundPath = CoverBlock.getRandomMarketBackgroundPath(this.isMarketModuleInstalled);
		this.canModifySettings = config.canModifySettings === true;
		this.canDelete = config.canDelete === true;
		this.currentCanModifySettings = this.canModifySettings;
		this.currentCanDelete = this.canDelete;
		this.dashboardType = '';
		this.appCode = '';
		this.dashboardManager = null;
		this.loader = null;
		this.discussButton = null;
		this.isDiscussRequestRunning = false;
		this.moreButton = null;
		this.moreMenuBlock = null;
		this.galleries = [];
		this.galleryBlocks = [];
		this.infoBlock = null;
		this.dashboardSavedEventName = 'BIConnector.CreateForm:onDashboardSaved';
		this.settingsSavedEventName = 'BX.BIConnector.Settings:onAfterSave';
		this.onDashboardSavedHandler = this.onDashboardSaved.bind(this);
		this.onSettingsSavedHandler = this.onSettingsSaved.bind(this);
		this.onWindowUnloadHandler = this.onWindowUnload.bind(this);

		this.init();
	}

	init(): void
	{
		if (!Type.isDomNode(this.appNode))
		{
			return;
		}

		this.bindLifecycleEvents();
		this.subscribeToDashboardSavedEvent();
		this.subscribeToSettingsSavedEvent();

		this.loadDashboardData()
			.then((response) => {
				const dashboard = response?.data?.dashboard;
				if (!Type.isPlainObject(dashboard))
				{
					throw new TypeError('Dashboard data was not returned.');
				}

				this.renderDashboard(dashboard);
				this.bindDynamicElements();
				ApacheSupersetAnalytics.sendAnalytics('view', 'card_report_view', {
					type: (dashboard.TYPE ?? '').toLowerCase(),
					c_element: 'context_menu',
					status: 'success',
				});
			})
			.catch((response) => {
				ApacheSupersetAnalytics.sendAnalytics('view', 'card_report_view', {
					c_element: 'context_menu',
					status: 'error',
				});
				this.renderError(this.getErrorMessage(response));
			})
		;
	}

	bindLifecycleEvents(): void
	{
		Event.bind(window, 'unload', this.onWindowUnloadHandler);
	}

	onWindowUnload(): void
	{
		this.destroyGalleryBlocks();
		this.unsubscribeFromDashboardSavedEvent();
		this.unsubscribeFromSettingsSavedEvent();
	}

	subscribeToDashboardSavedEvent(): void
	{
		const eventBus = this.getEventBus();
		if (!eventBus)
		{
			return;
		}

		if (Type.isFunction(eventBus.unsubscribe))
		{
			eventBus.unsubscribe(this.dashboardSavedEventName, this.onDashboardSavedHandler);
		}

		if (eventBus && Type.isFunction(eventBus.subscribe))
		{
			eventBus.subscribe(this.dashboardSavedEventName, this.onDashboardSavedHandler);
		}
	}

	unsubscribeFromDashboardSavedEvent(): void
	{
		const eventBus = this.getEventBus();
		if (eventBus && Type.isFunction(eventBus.unsubscribe))
		{
			eventBus.unsubscribe(this.dashboardSavedEventName, this.onDashboardSavedHandler);
		}
	}

	subscribeToSettingsSavedEvent(): void
	{
		EventEmitter.unsubscribe(this.settingsSavedEventName, this.onSettingsSavedHandler);
		EventEmitter.subscribe(this.settingsSavedEventName, this.onSettingsSavedHandler);
	}

	unsubscribeFromSettingsSavedEvent(): void
	{
		EventEmitter.unsubscribe(this.settingsSavedEventName, this.onSettingsSavedHandler);
	}

	getEventBus(): Object
	{
		return window.top?.BX?.Event?.EventEmitter ?? EventEmitter;
	}

	onDashboardSaved(event: Object): void
	{
		if (!this.isDocumentAttached())
		{
			return;
		}

		const rawData = event && Type.isFunction(event.getData) ? event.getData() : null;
		const data = Array.isArray(rawData) ? rawData[0] : rawData;
		const dashboardId = Text.toNumber(data?.dashboard?.id);
		const isEditMode = data?.isEditMode === true;

		if (!isEditMode || dashboardId <= 0 || dashboardId !== this.dashboardId)
		{
			return;
		}

		this.reloadDashboard();
	}

	onSettingsSaved(): void
	{
		if (!this.isDocumentAttached())
		{
			return;
		}

		this.reloadDashboard();
	}

	isDocumentAttached(): boolean
	{
		return Type.isDomNode(this.appNode) && Boolean(document.body?.contains(this.appNode));
	}

	loadDashboardData(options: { refreshMarket?: boolean } = {}): Promise<Object>
	{
		if (this.dashboardId <= 0)
		{
			return Promise.reject(
				new TypeError(this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_LOAD_ERROR')),
			);
		}

		if (!this.isDocumentAttached())
		{
			return Promise.reject(new Error('Document is detached.'));
		}

		const refreshMarket = options?.refreshMarket === true;
		this.showLoader();

		const requestPromise = ajax.runComponentAction(this.componentName, 'getDashboardData', {
			mode: 'class',
			data: {
				dashboardId: this.dashboardId,
				refreshMarket: refreshMarket ? 1 : 0,
			},
		});

		return requestPromise
			.then((response) => {
				this.hideLoader();

				return response;
			})
			.catch((error) => {
				this.hideLoader();

				return Promise.reject(error);
			})
		;
	}

	showLoader(): void
	{
		if (!Type.isDomNode(this.appNode))
		{
			return;
		}

		if (!this.loader)
		{
			this.loader = new Loader({
				target: this.appNode,
				size: 80,
			});
		}

		this.loader.show();
	}

	hideLoader(): void
	{
		if (this.loader)
		{
			this.loader.hide();
		}
	}

	updateTitle(title: string): void
	{
		if (!Type.isStringFilled(title))
		{
			return;
		}

		BX.ajax?.UpdatePageTitle?.(title);
		BX.ajax?.UpdateWindowTitle?.(title);

		const sidePanel = BX.SidePanel?.Instance;
		const slider = sidePanel?.getSliderByWindow?.(window);

		if (slider && Type.isFunction(slider.setTitle))
		{
			slider.setTitle(title);
		}

		if (Type.isFunction(sidePanel?.updateBrowserTitle))
		{
			sidePanel.updateBrowserTitle();
		}
	}

	renderDashboard(dashboard: Object): void
	{
		if (!Type.isDomNode(this.appNode))
		{
			return;
		}

		if (this.infoBlock)
		{
			this.infoBlock.destroy();
			this.infoBlock = null;
		}

		this.destroyGalleryBlocks();

		this.dashboardType = Type.isStringFilled(dashboard.TYPE) ? dashboard.TYPE : '';
		this.appCode = Type.isStringFilled(dashboard.APP_CODE) ? dashboard.APP_CODE : '';
		this.currentCanModifySettings = dashboard.CAN_MODIFY_SETTINGS === true || this.canModifySettings === true;
		this.currentCanDelete = dashboard.CAN_DELETE === true || this.canDelete === true;

		if (Type.isStringFilled(dashboard.TITLE))
		{
			this.updateTitle(dashboard.TITLE);
		}

		this.appNode.innerHTML = this.getDashboardMarkup(dashboard);
	}

	renderError(message: string): void
	{
		if (!Type.isDomNode(this.appNode))
		{
			return;
		}

		this.destroyGalleryBlocks();

		const safeMessage = Type.isStringFilled(message)
			? Text.encode(message)
			: Text.encode(this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_LOAD_ERROR'))
		;

		this.appNode.innerHTML = `
			<section class="report">
				<div class="report__row">
					<div class="report__description">
						<div class="report__description-title">
							${Text.encode(this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_DESCRIPTION_TITLE'))}
						</div>
						<div class="report__description-content">${safeMessage}</div>
					</div>
				</div>
			</section>
		`;
	}

	getErrorMessage(response: Object, fallbackMessage: string = ''): string
	{
		const defaultMessage = Type.isStringFilled(fallbackMessage)
			? fallbackMessage
			: this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_LOAD_ERROR')
		;

		if (response instanceof Error && Type.isStringFilled(response.message))
		{
			return response.message;
		}

		const firstError = response?.errors?.[0];
		if (Type.isStringFilled(firstError?.message))
		{
			return firstError.message;
		}

		return defaultMessage;
	}

	bindDynamicElements(): void
	{
		if (!Type.isDomNode(this.appNode))
		{
			return;
		}

		this.destroyGalleryBlocks();

		if (BX?.UI?.Hint && Type.isFunction(BX.UI.Hint.init))
		{
			BX.UI.Hint.init(this.appNode);
		}

		this.discussButton = this.appNode.querySelector('#discuss-btn');
		this.moreButton = this.appNode.querySelector('#more-btn');
		this.galleries = [...this.appNode.querySelectorAll('[data-role="gallery"]')];

		const marketDetailNodes = [...this.appNode.querySelectorAll('[data-role="open-market-detail"]')];
		if (this.infoBlock)
		{
			marketDetailNodes.forEach((marketDetailNode) => {
				if (Type.isDomNode(marketDetailNode))
				{
					Event.bind(marketDetailNode, 'click', () => this.infoBlock.openMarketDetailSlider());
				}
			});
		}

		const reviewNode = this.appNode.querySelector('[data-role="rating-add-review"]');
		if (Type.isDomNode(reviewNode) && this.infoBlock)
		{
			Event.bind(reviewNode, 'click', () => this.infoBlock.showReviewPopup());
		}

		const ratingStarsNode = this.appNode.querySelector('[data-role="rating-stars-input"]');
		if (Type.isDomNode(ratingStarsNode) && this.infoBlock)
		{
			this.infoBlock.mountRatingStarsInput(ratingStarsNode);
		}

		this.initActionButtons();
		this.initMoreMenu();

		if (this.galleries.length === 0)
		{
			return;
		}

		this.galleryBlocks = this.galleries.map((gallery) => new GalleryBlock(gallery, {
			eps: this.eps,
			defaultStep: this.defaultStep,
		}))
		;
		this.galleryBlocks.forEach((galleryBlock) => galleryBlock.bind());
	}

	destroyGalleryBlocks(): void
	{
		this.galleryBlocks.forEach((galleryBlock) => galleryBlock.destroy());
		this.galleryBlocks = [];
		this.galleries = [];
	}

	getDashboardMarkup(dashboard: Object): string
	{
		const vendorBlock = new VendorBlock(dashboard.PARTNER_NAME, dashboard.TYPE);
		const viewsBlock = new ViewsBlock(dashboard.VIEWS_COUNT);
		const canShowMoreMenu = this.currentCanModifySettings || this.currentCanDelete;
		const publishedDate = InfoBlock.getDateValue(dashboard.PUBLISHED_DATE);
		const updatedDate = InfoBlock.getDateValue(dashboard.UPDATED_DATE);
		const period = InfoBlock.getPeriodValue(dashboard.PERIOD);
		const description = DescriptionBlock.getDescriptionValue(
			dashboard.DESCRIPTION,
			this.emptyDescriptionPath,
		);
		const images = GalleryBlock.normalizeImages(dashboard.IMAGES);

		return `
			<section class="report">
				${this.getTopRowMarkup(vendorBlock.render(), viewsBlock.render(), canShowMoreMenu)}
				${this.getOverviewMarkup(dashboard, publishedDate, updatedDate, period)}
				${GalleryBlock.render(images, this.viewerGroupId)}
				${new DescriptionBlock(description).render()}
			</section>
		`;
	}

	getTopRowMarkup(vendorMarkup: string, viewsMarkup: string, canShowMoreMenu: boolean): string
	{
		return `
			<div class="report__row report__row--top">
				<div class="report__meta">
					${vendorMarkup}
					${viewsMarkup}
				</div>

				<div class="report__actions">
					${ButtonsBlock.render(canShowMoreMenu)}
				</div>
			</div>
		`;
	}

	getOverviewMarkup(dashboard: Object, publishedDate: string, updatedDate: string, period: string): string
	{
		const coverBlock = new CoverBlock({
			icon: dashboard.ICON,
			dashboardType: dashboard.TYPE,
			emptyIconPath: this.emptyIconPath,
			marketBackgroundPath: this.marketBackgroundPath,
		});

		this.infoBlock = new InfoBlock({
			dashboard,
			publishedDate,
			updatedDate,
			period,
			reloadDashboardCallback: this.reloadDashboard.bind(this),
			isMarketModuleInstalled: this.isMarketModuleInstalled,
			appCode: this.appCode,
			imagesPath: this.imagesPath,
		});

		return `
			<div class="report__row report__row--overview">
				${coverBlock.render()}

				<div class="report__info">
					${this.infoBlock.render()}
				</div>
			</div>
		`;
	}

	initMoreMenu(): void
	{
		if (!Type.isDomNode(this.moreButton))
		{
			if (this.moreMenuBlock)
			{
				this.moreMenuBlock.close();
			}

			this.moreMenuBlock = null;

			return;
		}

		if (this.moreMenuBlock)
		{
			this.moreMenuBlock.close();
		}

		this.moreMenuBlock = new MoreMenu({
			button: this.moreButton,
			menuId: this.moreMenuId,
			canModifySettings: this.currentCanModifySettings,
			canDelete: this.currentCanDelete,
			onEdit: this.handleEditCardClick.bind(this),
			onDelete: this.showDeletePopup.bind(this),
		});
		this.moreMenuBlock.bind();
	}

	initActionButtons(): void
	{
		if (Type.isDomNode(this.discussButton))
		{
			Event.unbindAll(this.discussButton);
			Event.bind(this.discussButton, 'click', (event) => {
				event.preventDefault();
				this.handleDiscussClick();
			});
		}
	}

	handleEditCardClick(): void
	{
		if (this.dashboardId <= 0)
		{
			return;
		}

		ApacheSupersetAnalytics.sendAnalytics('edit', 'editing_card_report', {
			type: (this.dashboardType ?? '').toLowerCase(),
			c_element: 'card_report',
			status: 'success',
		});

		DashboardManager.openSettingsSlider(this.dashboardId, this.dashboardType);
	}

	handleDiscussClick(): void
	{
		if (this.dashboardId <= 0 || this.isDiscussRequestRunning)
		{
			return;
		}

		this.isDiscussRequestRunning = true;
		const fallbackMessage = this.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_DISCUSS_OPEN_ERROR');
		const finishRequest = () => {
			this.isDiscussRequestRunning = false;
		};

		this.getDashboardManager().openDiscussionChat(this.dashboardId)
			.then((response) => {
				const chatId = Text.toNumber(response?.data?.chatId);
				const responseDialogId = response?.data?.dialogId;
				const dialogId = Type.isStringFilled(responseDialogId)
					? responseDialogId
					: (chatId > 0 ? `chat${chatId}` : '')
				;

				if (!Type.isStringFilled(dialogId))
				{
					throw new TypeError(fallbackMessage);
				}

				const messenger = window.top?.BX?.Messenger?.Public ?? Messenger;
				if (!messenger || !Type.isFunction(messenger.openChat))
				{
					throw new TypeError(fallbackMessage);
				}

				messenger.openChat(dialogId);
				ApacheSupersetAnalytics.sendAnalytics('chat', 'create_discussion', {
					type: (this.dashboardType ?? '').toLowerCase(),
					c_element: 'discuss_button',
					status: 'success',
				});
				finishRequest();
			})
			.catch((response) => {
				ApacheSupersetAnalytics.sendAnalytics('chat', 'create_discussion', {
					type: (this.dashboardType ?? '').toLowerCase(),
					c_element: 'discuss_button',
					status: 'error',
				});
				BX.UI.Notification.Center.notify({
					content: Text.encode(this.getErrorMessage(response, fallbackMessage)),
				});
				finishRequest();
			})
		;
	}

	showDeletePopup(): void
	{
		if (this.dashboardId <= 0)
		{
			return;
		}

		this.getDashboardManager().showDeleteDashboardDialog({
			dashboardId: this.dashboardId,
			dashboardType: this.dashboardType,
		})
			.then((result) => {
				if (result.status !== 'deleted')
				{
					return;
				}

				ApacheSupersetAnalytics.sendAnalytics('edit', 'delete_report', {
					type: (this.dashboardType ?? '').toLowerCase(),
					c_element: 'card_report',
					status: 'success',
				});
				this.openDashboardList();
			})
			.catch(() => {
				ApacheSupersetAnalytics.sendAnalytics('edit', 'delete_report', {
					type: (this.dashboardType ?? '').toLowerCase(),
					c_element: 'card_report',
					status: 'error',
				});
			})
		;
	}

	openDashboardList(): void
	{
		const dashboardListUrl = Type.isStringFilled(this.dashboardListUrl)
			? this.dashboardListUrl
			: '/bi/dashboard/'
		;

		if (window.top && window.top.location)
		{
			window.top.location.href = dashboardListUrl;

			return;
		}

		window.location.href = dashboardListUrl;
	}

	getDashboardManager(): DashboardManager
	{
		if (!this.dashboardManager)
		{
			this.dashboardManager = new DashboardManager();
		}

		return this.dashboardManager;
	}

	getMessage(code: string, replacements: { [string]: string } = {}): string
	{
		return Loc.getMessage(code, replacements) ?? '';
	}

	reloadDashboard(options: { refreshMarket?: boolean } = {}): void
	{
		const refreshMarket = options?.refreshMarket === true;
		this.loadDashboardData({ refreshMarket }).then((response) => {
			const dashboard = response?.data?.dashboard;
			if (Type.isPlainObject(dashboard))
			{
				this.renderDashboard(dashboard);
				this.bindDynamicElements();
			}
		}).catch(() => {});
	}
}

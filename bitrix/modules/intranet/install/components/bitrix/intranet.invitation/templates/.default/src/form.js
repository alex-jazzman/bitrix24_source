import { Dom, Event, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { ActiveDirectory } from './active-directory';
import { Analytics } from './analytics';
import { MessageBar } from './message-bar';
import { Navigation } from './navigation';
import { PageProvider } from './page-provider';
import { Transport } from './transport';
import { SuccessInvitePopup } from './popup/success-invite-popup';

export default class Form extends EventEmitter
{
	constructor(formParams)
	{
		super();
		this.setEventNamespace('BX.Intranet.Invitation');
		const params = Type.isPlainObject(formParams) ? formParams : {};

		this.initParams(params);
		this.initUI();
		this.initAnalytics();
		this.initTransport(params);
		this.initNavigation();
		this.subscribeEvents();
	}

	initParams(params)
	{
		this.menuContainer = params.menuContainerNode;
		this.subMenuContainer = params.subMenuContainerNode;
		this.leftMenuItems = params.leftMenuItems;
		this.titleContainer = params.titleContainer;
		this.contentContainer = params.contentContainerNode;
		this.pageContainer = this.contentContainer.querySelector('.popup-window-tabs-content-invite');
		this.userOptions = params.userOptions;
		this.isExtranetInstalled = params.isExtranetInstalled === 'Y';
		this.isCloud = params.isCloud === 'Y';
		this.isAdmin = params.isAdmin === 'Y';
		this.canCurrentUserInvite = params.canCurrentUserInvite === true;
		this.isInvitationBySmsAvailable = params.isInvitationBySmsAvailable === 'Y';
		this.isCreatorEmailConfirmed = params.isCreatorEmailConfirmed === 'Y';
		this.firstInvitationBlock = params.firstInvitationBlock;
		this.isSelfRegisterEnabled = params.isSelfRegisterEnabled;
		this.analyticsLabel = params.analyticsLabel;
		this.projectLimitExceeded = Type.isBoolean(params.projectLimitExceeded) ? params.projectLimitExceeded : true;
		this.projectLimitFeatureId = Type.isString(params.projectLimitFeatureId) ? params.projectLimitFeatureId : '';
		this.whitelistValue = Type.isStringFilled(params.whitelistValue) ? params.whitelistValue : '';
		this.isCollabEnabled = params.isCollabEnabled === 'Y';
		this.registerNeedConfirm = params.registerConfirm === true;
		this.useLocalEmailProgram = params.useLocalEmailProgram === true;
	}

	initTransport(params): void
	{
		this.transport = new Transport({
			componentName: params.componentName,
			signedParameters: params.signedParameters,
			onSuccess: this.#onSuccessRequest.bind(this),
			onError: this.#onErrorRequest.bind(this),
			analytics: this.analytics,
		});
	}

	initUI()
	{
		if (Type.isDomNode(this.contentContainer))
		{
			this.messageBar = new MessageBar({
				errorContainer: this.contentContainer.querySelector('[data-role=\'error-message\']'),
				successContainer: this.contentContainer.querySelector('[data-role=\'success-message\']'),
			});

			BX.UI.Hint.init(this.contentContainer);
		}

		if (Type.isDomNode(this.menuContainer))
		{
			this.#initMenu();
		}
	}

	initAnalytics(): void
	{
		this.analytics = new Analytics(this.analyticsLabel, this.isAdmin);
		this.analytics.sendOpenSliderData(this.analyticsLabel.source);
	}

	initNavigation()
	{
		this.navigation = this.createNavigation();
		this.navigation?.subscribe('onBeforeChangePage', this.onBeforeChangePage.bind(this));
		this.navigation?.subscribe('onAfterChangePage', this.onAfterChangePage.bind(this));

		this.navigation.showFirst();
	}

	subscribeEvents(): void
	{
		EventEmitter.subscribe('BX.Intranet.Invitation:onError', (event: BaseEvent) => {
			this.messageBar.showError(event?.data?.error);
		});

		EventEmitter.subscribe('BX.Intranet.Invitation:clearError', () => {
			this.messageBar.hideAll();
		});

		EventEmitter.subscribe('BX.Intranet.Invitation:showSuccessPopup', this.#showSuccessPopup.bind(this));
	}

	onBeforeChangePage(event: BaseEvent): void
	{
		this.messageBar.hideAll();
		const { newPageCode } = event.data;
		BX?.UI?.ToolbarManager?.getDefaultToolbar().setTitle(
			this.leftMenuItems[newPageCode]?.TOOLBAR_TITLE ?? this.leftMenuItems[newPageCode]?.NAME ?? '',
		);
	}

	onAfterChangePage(event: BaseEvent)
	{
		const section = this.getSubSection();
		const page = event.getData().current;
		let subSection = null;
		if (page)
		{
			subSection = page.getAnalyticTab();
		}

		if (this.analytics && section && subSection)
		{
			this.analytics.sendTabData(section, subSection);
		}
	}

	getSubSection(): string
	{
		const regex = /analyticsLabel\[source]=(\w*)&/gm;
		const match = regex.exec(decodeURI(window.location));
		if (match?.length > 1)
		{
			return match[1];
		}

		return null;
	}

	#initMenu()
	{
		this.menuItems = Array.prototype.slice.call(this.menuContainer.querySelectorAll('a'));
		if (Type.isDomNode(this.subMenuContainer))
		{
			const subMenuItem = Array.prototype.slice.call(this.subMenuContainer.querySelectorAll('a'));

			this.menuItems = [...this.menuItems, ...subMenuItem];
		}

		(this.menuItems || []).forEach((item) => {
			Event.bind(item, 'click', () => {
				this.changeContent(item.getAttribute('data-action'));
				this.activeMenuItem(this.navigation.getCurrentCode());
			});

			if (item.getAttribute('data-action') === this.firstInvitationBlock)
			{
				Dom.addClass(item.parentElement, 'ui-sidepanel-menu-active');
			}
			else
			{
				Dom.removeClass(item.parentElement, 'ui-sidepanel-menu-active');
			}
		});
	}

	activeMenuItem(itemType: string)
	{
		(this.menuItems || []).forEach((item) => {
			Dom.removeClass(item.parentElement, 'ui-sidepanel-menu-active');
			if (item.getAttribute('data-action') === itemType)
			{
				Dom.addClass(item.parentElement, 'ui-sidepanel-menu-active');
			}
		});
	}

	changeContent(action)
	{
		if (!Type.isStringFilled(action))
		{
			return;
		}

		if (action === 'active-directory')
		{
			if (!this.activeDirectory)
			{
				this.activeDirectory = new ActiveDirectory(this);
			}

			this.activeDirectory.showForm();
			this.analytics.sendTabData(this.getSubSection(), Analytics.TAB_AD);

			return;
		}

		this.navigation.show(action);
	}

	createNavigation(): Navigation
	{
		return new Navigation({
			container: this.pageContainer,
			first: this.firstInvitationBlock,
			pages: (new PageProvider(
				{
					transport: this.transport,
					isSelfRegisterEnabled: this.isSelfRegisterEnabled,
					analytics: this.analytics,
					smsAvailable: this.isInvitationBySmsAvailable,
					useLocalEmailProgram: this.useLocalEmailProgram,
					isAdmin: this.isAdmin,
					needConfirmRegistration: this.registerNeedConfirm,
					whiteList: this.whitelistValue,
					isCloud: this.isCloud,
					linkRegisterEnabled: this.isSelfRegisterEnabled,
					isExtranetInstalled: this.isExtranetInstalled,
					canCurrentUserInvite: this.canCurrentUserInvite,
				},
				this.userOptions,
			)).provide(),
		});
	}

	#showSuccessPopup(): void
	{
		(new SuccessInvitePopup()).show();
	}

	#onSuccessRequest(response): void
	{
		this.messageBar.hideAll();

		if (response.data)
		{
			EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:onInviteRequestSuccess', {
				response,
			});
		}

		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'SidePanel.Slider:onClose',
			() => {
				BX.SidePanel.Instance.postMessageTop(window, 'BX.Bitrix24.EmailConfirmation:showPopup');
			},
		);
	}

	#onErrorRequest(reject): void
	{
		this.messageBar.showError(reject.errors[0].message);
	}
}

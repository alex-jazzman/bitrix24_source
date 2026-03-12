import DepartmentControl from 'intranet.department-control';
import { Dom, Event, Loc, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { ActiveDirectory } from './active-directory';
import { Analytics } from './analytics';
import { InputRowFactory, InputRowType } from './input-row-factory';
import { MessageBar } from './message-bar';
import { Navigation } from './navigation';
import { PageProvider } from './page-provider';
import { LinkPage } from './page/link-page';
import { LocalEmailPage } from './page/local-email-page';
import { SubmitButton } from './submit-button';
import { Transport } from './transport';
import { UI } from 'ui.notification';

export default class Form extends EventEmitter
{
	constructor(formParams)
	{
		super();
		this.setEventNamespace('BX.Intranet.Invitation');
		const params = Type.isPlainObject(formParams) ? formParams : {};

		this.initParams(params);
		this.initUI();
		this.initSubmitButton();
		this.initAnalytics();
		this.initNavigation();
		this.initArrow();
		this.subscribeEvents();

		this.hideButtonPanelForLinkPage();

		BX.Intranet.Invitation.Form = this;
	}

	initParams(params)
	{
		this.menuContainer = params.menuContainerNode;
		this.subMenuContainer = params.subMenuContainerNode;
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
		this.wishlistValue = Type.isStringFilled(params.wishlistValue) ? params.wishlistValue : '';
		this.isCollabEnabled = params.isCollabEnabled === 'Y';
		this.registerNeedeConfirm = params.registerConfirm === true;
		this.useLocalEmailProgram = params.useLocalEmailProgram === true;
		this.transport = new Transport({
			componentName: params.componentName,
			signedParameters: params.signedParameters,
		});
	}

	initUI()
	{
		if (Type.isDomNode(this.contentContainer))
		{
			this.messageBar = new MessageBar({
				errorContainer: this.contentContainer.querySelector("[data-role='error-message']"),
				successContainer: this.contentContainer.querySelector("[data-role='success-message']"),
			});

			BX.UI.Hint.init(this.contentContainer);
		}

		if (Type.isDomNode(this.menuContainer))
		{
			this.#initMenu();
		}
	}

	initSubmitButton()
	{
		this.submitButton = new SubmitButton({
			node: document.querySelector('#intranet-invitation-btn'),
			events: {
				click: (event) => {
					this.handleSubmitClick();
				},
			},
		});
	}

	initArrow()
	{
		this.arrowBox = document.querySelector('.invite-wrap-decal-arrow');
		if (Type.isDomNode(this.arrowBox))
		{
			this.arrowRect = this.arrowBox.getBoundingClientRect();
			this.arrowHeight = this.arrowRect.height;
			this.setSetupArrow();
		}
	}

	initAnalytics()
	{
		this.analytics = new Analytics(this.analyticsLabel, this.isAdmin);
		this.analytics.sendOpenSliderData(this.analyticsLabel.source);
	}

	initNavigation()
	{
		this.navigation = this.createNavigation();
		this.navigation?.subscribe('onBeforeChangePage', () => {
			this.messageBar.hideAll();
		});
		this.navigation?.subscribe('onAfterChangePage', this.onAfterChangePage.bind(this));

		this.navigation.showFirst();
	}

	subscribeEvents()
	{
		EventEmitter.subscribe('BX.Intranet.Invitation:onChangeForm', () => {
			this.submitButton.enable();
		});

		this.subscribe('BX.Intranet.Invitation:onSendData', this.onSendRequest.bind(this));

		EventEmitter.subscribe('BX.Intranet.Invitation:onSubmitReady', () => {
			this.submitButton.ready();
		});

		EventEmitter.subscribe('BX.Intranet.Invitation:onSubmitDisabled', () => {
			this.submitButton.disable();
		});

		EventEmitter.subscribe('BX.Intranet.Invitation:onSubmitWait', () => {
			this.submitButton.wait();
		});

		EventEmitter.subscribe('BX.Intranet.Invitation:changeButtonPanelState', (event) => {
			const state = event.getData()?.state || 'show';
			this.changeStateOfButtonPanel(state);
		});

		EventEmitter.subscribe('BX.Intranet.Invitation:toggleSelfRegister', (event) => {
			this.onSendRequest(event);
		});
	}

	handleSubmitClick()
	{
		if (
			!this.isCreatorEmailConfirmed
			&& !(this.navigation.current() instanceof LinkPage)
			&& !(this.navigation.current() instanceof LocalEmailPage)
		)
		{
			this.messageBar.showError(Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_CREATOR_EMAIL_ERROR'));

			return;
		}

		if (!this.submitButton.isWaiting() && this.submitButton.isEnabled())
		{
			this.submitButton.wait();
			EventEmitter.emit(this.navigation.current(), 'BX.Intranet.Invitation:submit', {
				context: this,
			});
			if (this.isCloud)
			{
				BX.userOptions.del('intranet.invitation', 'open_invitation_form_ts');
			}
		}
	}

	hideButtonPanelForLinkPage()
	{
		const currentPage = this.navigation.current();
		if (currentPage.hasShownButtonPanel() === false)
		{
			EventEmitter.emit('BX.Intranet.Invitation:changeButtonPanelState', { state: 'hide' });
		}
	}

	onAfterChangePage(event: BaseEvent)
	{
		const section = this.getSubSection();
		const page = event.getData().current;

		if (page.hasShownButtonPanel())
		{
			EventEmitter.emit('BX.Intranet.Invitation:changeButtonPanelState', { state: 'show' });
		}
		else
		{
			EventEmitter.emit('BX.Intranet.Invitation:changeButtonPanelState', { state: 'hide' });
		}

		let subSection = null;
		if (page)
		{
			subSection = page.getAnalyticTab();
			if (page.getSubmitButtonText())
			{
				this.submitButton.setLabel(page.getSubmitButtonText());
			}

			if (page.getButtonState() === SubmitButton.ENABLED_STATE)
			{
				this.submitButton.enable();
			}
			else if (page.getButtonState() === SubmitButton.DISABLED_STATE)
			{
				this.submitButton.disable();
			}
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
			pages: (new PageProvider()).provide.call(this),
		});
	}

	onSendRequest(event: BaseEvent)
	{
		this.submitButton.disable();
		const request = event.getData();
		const currentPage = this.navigation.current();
		this.messageBar.hideAll();

		if (Type.isArray(request.errors) && request.errors.length > 0)
		{
			this.#handleRequestError(request.errors, currentPage, false);

			return;
		}

		this.#enrichRequest(request);

		this.transport.send(request).then(
			(response) => this.#handleRequestSuccess(response, request, currentPage),
			(response) => this.#handleRequestError(response.errors, currentPage, true, response, request)
		).catch(() => {});
	}

	#enrichRequest(request)
	{
		request.userOptions = this.userOptions;
		request.analyticsData = this.analyticsLabel;
		if (request.data)
		{
			request.data.analyticsData = this.analyticsLabel;
		}
	}

	#handleRequestError(errors, currentPage, isPromise = false, response = {}, request = {})
	{
		this.submitButton.enable();
		this.submitButton.ready();

		const errorMsg = errors?.[0]?.message || errors?.[0] || Loc.getMessage('INTRANET_INVITE_DIALOG_UNKNOWN_ERROR');
		const hasButtonPanel = currentPage?.hasShownButtonPanel?.() === false;

		if (isPromise && response?.data === 'user_limit')
		{
			// eslint-disable-next-line no-undef
			B24.licenseInfoPopup.show(
				'featureID',
				Loc.getMessage('BX24_INVITE_DIALOG_USERS_LIMIT_TITLE'),
				Loc.getMessage('BX24_INVITE_DIALOG_USERS_LIMIT_TEXT'),
			);

			return;
		}

		if (hasButtonPanel)
		{
			this.#showNotification(errorMsg);
		}
		else
		{
			this.messageBar.showError(errorMsg);
		}

		if (
			isPromise
			&& request?.action === 'invite'
			&& this.useLocalEmailProgram
			&& request?.type === 'invite-email'
		)
		{
			EventEmitter.emit(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:InviteFailed');
		}
	}

	#handleRequestSuccess(response, request, currentPage)
	{
		this.submitButton.ready();

		if (!response.data)
		{
			return;
		}

		const hasButtonPanel = currentPage?.hasShownButtonPanel?.() === false;
		const emitGlobal = (event, data = {}) => {
			EventEmitter.emit(EventEmitter.GLOBAL_TARGET, event, data);
		};

		if (request?.action === 'self')
		{
			if (hasButtonPanel)
			{
				this.#showNotification(response.data);
				EventEmitter.emit('BX.Intranet.Invitation:changeButtonPanelState', { state: 'hide' });
			}
			else
			{
				this.messageBar.showSuccess(response.data);
			}

			this.isSelfRegisterEnabled = request.data.allow_register === 'Y';
			emitGlobal('BX.Intranet.Invitation:selfChange', {
				selfEnabled: this.isSelfRegisterEnabled,
			});
			emitGlobal('BX.Intranet.Invitation:onSendDataSuccess');
		}
		else if (this.useLocalEmailProgram && request?.action === 'invite' && request?.type === 'invite-email')
		{
			emitGlobal('BX.Intranet.Invitation:InviteSuccess');
		}
		else
		{
			this.changeContent('success');
			this.submitButton.sendSuccessEvent(response.data);
		}

		emitGlobal('BX.Intranet.Invitation:onInviteRequestSuccess', { response });

		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'SidePanel.Slider:onClose',
			() => {
				BX.SidePanel.Instance.postMessageTop(window, 'BX.Bitrix24.EmailConfirmation:showPopup');
			},
		);
	}

	createDepartmentControl(): DepartmentControl
	{
		const departmentsId = Type.isArray(this.userOptions?.departmentList)
			? this.userOptions.departmentList
			: [];
		const rootDepartment = this.userOptions?.rootDepartment;

		return new DepartmentControl({
			departmentList: departmentsId,
			rootDepartment: Type.isObject(rootDepartment) ? rootDepartment : null,
		});
	}

	createInputRowFactory(useOnlyPhone: boolean = false): InputRowFactory
	{
		const inputRowType = useOnlyPhone
			? InputRowType.PHONE
			: (this.isInvitationBySmsAvailable ? InputRowType.ALL : InputRowType.EMAIL);

		return new InputRowFactory({
			inputRowType,
		});
	}

	getSetupArrow()
	{
		this.body = document.querySelector('.invite-body');
		this.panelConfirmBtn = document.getElementById('intranet-invitation-btn');
		this.sliderContent = document.querySelector('.ui-page-slider-workarea');
		this.sliderHeader = document.querySelector('.ui-side-panel-wrap-title-wrap');
		this.buttonPanel = document.querySelector('.ui-button-panel');

		this.sliderHeaderHeight = this.sliderHeader?.getBoundingClientRect().height;
		this.buttonPanelRect = this.buttonPanel.getBoundingClientRect();
		this.panelRect = this.panelConfirmBtn.getBoundingClientRect();
		this.btnWidth = Math.ceil(this.panelRect.width);
		this.arrowWidth = Math.ceil(this.arrowRect.width);
		this.sliderContentRect = this.sliderContent.getBoundingClientRect();

		this.bodyHeight = this.body.getBoundingClientRect().height - this.buttonPanelRect.height + this.sliderHeaderHeight;
		this.contentHeight = this.arrowHeight
			+ this.sliderContentRect.height
			+ this.buttonPanelRect.height
			+ this.sliderHeaderHeight
			- 65;
	}

	updateArrow()
	{
		this.bodyHeight = this.body.getBoundingClientRect().height - this.buttonPanelRect.height + this.sliderHeaderHeight;
		this.contentHeight = this.arrowHeight
			+ this.sliderContentRect.height
			+ this.buttonPanelRect.height
			+ this.sliderHeaderHeight - 65;
		// eslint-disable-next-line no-unused-expressions
		this.contentHeight > this.bodyHeight
			? Dom.addClass(this.body, 'js-intranet-invitation-arrow-hide')
			: Dom.removeClass(this.body, 'js-intranet-invitation-arrow-hide');
	}

	setSetupArrow()
	{
		this.getSetupArrow();
		const btnPadding = 40;
		Dom.style(
			this.arrowBox,
			'left',
			`${this.panelRect.left + (this.btnWidth / 2) - (this.arrowWidth / 2) - btnPadding}px`,
		);
		// eslint-disable-next-line no-unused-expressions
		this.contentHeight > this.bodyHeight
			? Dom.addClass(this.body, 'js-intranet-invitation-arrow-hide')
			: Dom.removeClass(this.body, 'js-intranet-invitation-arrow-hide');

		Event.bind(window, 'resize', () => {
			if (window.innerWidth <= 1100)
			{
				Dom.style(
					this.arrowBox,
					'left',
					`${this.panelRect.left + (this.btnWidth / 2) - (this.arrowWidth / 2) - btnPadding}px`,
				);
			}
			this.getSetupArrow();
			this.updateArrow();
		});
	}

	changeStateOfButtonPanel(state: string = 'show')
	{
		const buttonPanel = document.getElementById('ui-button-panel');

		const elements = [this.arrowBox, buttonPanel];
		elements.forEach((element) => {
			if (Type.isDomNode(element))
			{
				Dom.style(element, { display: state === 'show' ? '' : 'none' });
			}
		});
	}

	#showNotification(message: string)
	{
		UI.Notification.Center.notify({
			content: message,
			autoHideDelay: 3500,
			useAirDesign: true,
			position: 'top-right',
		});
	}
}

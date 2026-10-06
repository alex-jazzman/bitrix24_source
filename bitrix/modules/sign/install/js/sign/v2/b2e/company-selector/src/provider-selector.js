import { Dom, Event, Loc, Runtime, Tag, Text as TextFormat, Type, Uri } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { DateTimeFormat } from 'main.date';
import { Menu } from 'main.popup';
import { Guide } from 'sign.tour';
import { DocumentInitiated, type DocumentInitiatedType, type ProviderCodeType } from 'sign.type';
import type { Company, Provider } from 'sign.v2.api';
import { Helpdesk, Link } from 'sign.v2.helper';
import { Alert } from 'ui.alerts';
import { Dialog } from 'ui.entity-selector';
import { Label, LabelColor } from 'ui.label';
import { setupAccessibleTrigger } from './accessibility';
import { hide, isGoskeyLitePromoAllowed, show } from './functions';
import type { CompanyData } from './index';
import { HelpdeskCodes, ProviderCode } from './index';
import { Api } from 'sign.v2.api';

export type ProviderSelectedEvent = BaseEvent<{ provider: Provider }>;

export type Options = {
	region: string;
	documentInitiatedType: DocumentInitiatedType;
};

export const allowedSignatureProviders: Array<ProviderCodeType> = [
	'goskey',
	'goskey-lite',
	'external',
	'ses-ru',
	'ses-com',
	'ses-ru-express',
];

const sesComLearnMoreLink = new Uri('https://www.bitrix24.com/terms/esignature-for-hr-rules.php');

export class ProviderSelector extends EventEmitter
{
	events = {
		onProviderSelect: 'providerSelected',
		onProviderDeselect: 'providerDeselected',
		onProviderDisconnect: 'onProviderDisconnect',
		providerConnectionSlider: {
			onClose: 'onClose',
		},
	};

	#layoutCache: MemoryCache<HTMLElement> = new MemoryCache();
	#providerMenu: Dialog | null = null;
	#providerDialogTrigger: { setExpanded: (expanded: boolean) => void } | null = null;
	#connectMenuTrigger: { setExpanded: (expanded: boolean) => void } | null = null;
	#connectMenu: Menu | null = null;
	#options: Options;
	#showTaxId: boolean = true;
	#providerExpiresDaysToShowInfo: Number = 45;
	#company: CompanyData | null = null;
	#nothingToSelect: boolean = true;
	#companyList: Array<Company> = [];
	#registerIframe: HTMLIFrameElement | null;
	#iframeConnectInterval: number | null = null;
	#isSubscribedIframeCloseEvent = false;
	#isSubscribedIframeConnectedEvent = false;
	#api = new Api();

	constructor(options: Options)
	{
		super();
		this.setEventNamespace('BX.Sign.V2.B2e.CompanySelector:ProviderSelector');
		this.#options = options;
	}

	getLayout(): HTMLElement
	{
		return this.#layoutCache.remember('layout', () => {
			return Tag.render`
				<div class="sign-document-b2e-company__provider">
					<div class="sign-document-b2e-company__provider_content">
						${this.#connectedProviderLayout}
						${this.#providerDisconnectedLayout}
						${this.#providerUnsetLayout}
					</div>
					${this.#providerInfoLayout}
				</div>
			`;
		});
	}

	setShowTaxId(value: boolean): ProviderSelector
	{
		this.#showTaxId = value;

		return this;
	}

	get #providerConnectedSelectDropdownBtnLayout(): HTMLElement
	{
		return this.#layoutCache.remember('providerConnectedSelectDropdownBtnLayout', () => {
			const button = Tag.render`
				<span
					class="sign-document-b2e-company-info-dropdown-btn sign-document-b2e-company__provider_dropdown-btn"
				></span>
			`;
			// The dropdown button, not the row, is the accessible trigger: the row also holds the
			// disconnect menu button, and nesting one ARIA button inside another breaks the tree.
			this.#providerDialogTrigger = setupAccessibleTrigger(button, {
				hasPopup: 'dialog',
				label: Loc.getMessage('SIGN_B2E_COMPANIES_SELECT_BUTTON'),
				testId: 'sign-b2e-provider-selector-trigger',
				stopPropagation: true,
				onActivate: () => this.#showProviderMenu(),
			});

			return button;
		});
	}

	get #providerConnectedNameLabelLayout(): HTMLElement
	{
		return this.#layoutCache.remember('providerConnectedNameLabel', () => {
			return Tag.render`
				<div class="sign-document-b2e-company__provider_name_label"></div>
			`;
		});
	}

	get #providerConnectedNameLayout(): HTMLElement
	{
		return this.#layoutCache.remember('providerConnectedName', () => {
			return Tag.render`
				<span class="sign-document-b2e-company__provider_name"></span>
			`;
		});
	}

	get #providerConnectedDescriptionLayout(): HTMLElement
	{
		return this.#layoutCache.remember('providerConnectedDescription', () => {
			return Tag.render`
				<span class="sign-document-b2e-company__provider_descr"></span>
			`;
		});
	}

	get #providerDisconnectedBtnLayout(): HTMLElement
	{
		return this.#layoutCache.remember('providerDisconnectedBtn', () => {
			return Tag.render`
				<button
					class="ui-btn ui-btn-success ui-btn-xs ui-btn-round"
					onclick="${() => this.#openProvidersConnectionSlider()}"
				>
					${Loc.getMessage('SIGN_B2E_PROVIDER_CONNECT')}
				</button>
			`;
		});
	}

	get #providerInfoLayout(): HTMLElement
	{
		return this.#layoutCache.remember('providerInfo', () => {
			return Tag.render`
				<div class="sign-document-b2e-company__provider_info"></div>
			`;
		});
	}

	get #providerUnsetLayout(): HTMLElement
	{
		return this.#layoutCache.remember('providerUInset', () => {
			return Tag.render`
				<div class="sign-document-b2e-company-select --provider">
					<span class="sign-document-b2e-company-select-text">
						${Loc.getMessage('SIGN_B2E_COMPANY_NOT_SET_PROVIDER_STATUS')}
					</span>
					<button
						class="ui-btn ui-btn-success ui-btn-xs ui-btn-round"
						onclick="${() => this.#showProviderMenu()}"
					>
						${Loc.getMessage('SIGN_B2E_COMPANIES_SELECT_BUTTON')}
					</button>
				</div>
			`;
		});
	}

	get #providerDisconnectedLayout(): HTMLElement
	{
		return this.#layoutCache.remember('providerDisconnected', () => {
			return Tag.render`
				<div class="sign-document-b2e-company-select --provider">
					<span class="sign-document-b2e-company-select-text">
						${Loc.getMessage('SIGN_B2E_COMPANY_NOT_CONNECTED_PROVIDER_STATUS')}
					</span>
					${this.#providerDisconnectedBtnLayout}
				</div>
			`;
		});
	}

	get #connectedProviderLayout(): HTMLElement
	{
		return this.#layoutCache.remember('connectedProvider', () => {
			const layout = Tag.render`
				<div class="sign-document-b2e-company__provider_selected">
					<div class="sign-document-b2e-company__provider_selected__external-image-container">
						<img class="sign-document-b2e-company__provider_selected__external-img"
							referrerpolicy="no-referrer"
						 alt="provider image">
					</div>
					<div>
						<div class="sign-document-b2e-company__provider_name_container">
							${this.#providerConnectedNameLayout}
							${this.#providerConnectedNameLabelLayout}
						</div>
						${(this.#providerConnectedDescriptionLayout)}
					</div>
					${this.#providerConnectedSelectDropdownBtnLayout}
					${this.#providerConnectDropdownBtnLayout}
				</div>
			`;
			// Mouse convenience only: the whole row opens the provider dialog, while keyboard and
			// screen readers use the dropdown button inside it.
			Event.bind(layout, 'click', () => this.#showProviderMenu());

			return layout;
		});
	}

	get #providerConnectDropdownBtnLayout(): HTMLElement
	{
		return this.#layoutCache.remember('providerConnectDropdownBtnLayout', () => {
			const button = Tag.render`
				<span
					class="sign-document-b2e-company-info-edit"
				></span>
			`;
			this.#connectMenuTrigger = setupAccessibleTrigger(button, {
				hasPopup: 'menu',
				label: Loc.getMessage('SIGN_B2E_PROVIDER_DISCONNECT'),
				testId: 'sign-b2e-provider-selector-menu',
				stopPropagation: true,
				onActivate: () => this.#showConnectMenu(),
			});

			return button;
		});
	}

	#getProviderMenu(): Dialog
	{
		if (this.#providerMenu)
		{
			return this.#providerMenu;
		}

		this.#providerMenu = new Dialog({
			width: 425,
			height: 363,
			targetNode: this.#connectedProviderLayout,
			items: [],
			showAvatars: true,
			dropdownMode: true,
			multiple: false,
			autoHide: true,
			tabs: [
				{ id: 'b2e-providers', title: Loc.getMessage('SIGN_B2E_PROVIDERS_TAB') },
			],
			events: {
				onShow: () => this.#providerDialogTrigger?.setExpanded(true),
				onHide: () => this.#providerDialogTrigger?.setExpanded(false),
				'Item:OnSelect': ({ data }) => {
					this.#onProviderSelect(data.item.id);
				},
				'Item:OnDeselect': () => this.#onProviderDeselect(),
			},
			footer: this.#getProviderAddButton(),
		});

		return this.#providerMenu;
	}

	#showProviderMenu(): void
	{
		if (this.#nothingToSelect)
		{
			return;
		}

		const menu = this.#getProviderMenu();
		menu.setTargetNode(this.#getProviderMenuTargetNode());
		this.#providerDialogTrigger?.setExpanded(true);
		menu.show();
	}

	#getProviderMenuTargetNode(): HTMLElement
	{
		// The connected row is hidden after deselect, so the popup binds to the visible select button.
		return Dom.style(this.#connectedProviderLayout, 'display') === 'none'
			? this.#providerUnsetLayout
			: this.#connectedProviderLayout;
	}

	#getProviderAddButton(): ?HTMLElement
	{
		const company = this.#getCompanyById(this.#company?.id);
		if (company?.registerUrl)
		{
			return Tag.render`
				<span
					class="ui-selector-footer-link ui-selector-footer-link-add"
					onclick="${() => {
				this.#providerMenu.hide();
				this.#openProvidersConnectionSlider();
			}}"
				>
					${Loc.getMessage('SIGN_B2E_PROVIDER_CONNECT_SELECTOR')}
				</span>
			`;
		}

		return null;
	}

	#onProviderSelect(id: string): void
	{
		const company = this.#getCompanyById(this.#company.id ?? 0);
		const provider = company.providers.find(({ uid }) => uid === id);
		hide(this.#providerUnsetLayout);
		show(this.#connectedProviderLayout);
		show(this.#providerInfoLayout);
		this.#chooseProvider(provider, company.rqInn);
		this.#providerMenu.hide();

		this.emit(this.events.onProviderSelect, { provider });
	}

	#chooseProvider(provider: Provider, rqInn: number): void
	{
		if (!allowedSignatureProviders.includes(provider.code))
		{
			return;
		}

		const { providerName, description } = this.#getConnectedName(provider, rqInn);
		this.#providerConnectedNameLayout.textContent = providerName;
		this.#providerConnectedDescriptionLayout.textContent = description;

		this.#renderProviderInfo(provider);
		this.#resetProviderClasses();
		Dom.addClass(this.#connectedProviderLayout, `--with-icon --${provider.code}`);
		if (provider.code === ProviderCode.external)
		{
			this.#setProviderImage(provider);
		}

		Dom.clean(this.#providerConnectedNameLabelLayout);
		if (this.#isProviderExpired(provider))
		{
			Dom.addClass(this.#connectedProviderLayout, '--expired');
			const expiredLabel = this.#makeGoskeyApikeyExpiredLabel();
			Dom.append(expiredLabel.render(), this.#providerConnectedNameLabelLayout);
		}
		Dom.style(
			this.#providerConnectDropdownBtnLayout,
			'display',
			provider.autoRegister ? 'none' : 'flex',
		);
		this.#company.provider = provider;
	}

	#setProviderImage(provider: Provider): void
	{
		if (!Type.isStringFilled(provider.iconUrl))
		{
			return;
		}

		const imgClassName = 'sign-document-b2e-company__provider_selected__external-img';
		const img = this.getLayout()?.getElementsByClassName(imgClassName)[0] ?? null;
		if (!img)
		{
			return;
		}

		img.src = provider.iconUrl;
	}

	#makeGoskeyApikeyExpiredLabel(): Label
	{
		return new Label({
			text: Loc.getMessage('SIGN_B2E_GOSKEY_APIKEY_EXPIRED'),
			color: LabelColor.WARNING,
			fill: true,
			customClass: 'sign-document-b2e-company__provider_label',
		});
	}

	#showConnectMenu(): void
	{
		// Repeated activation closes the open menu instead of building a second one: the old popup
		// hides with a zero timeout, and its onPopupClose would reset ARIA of the already shown menu.
		if (this.#connectMenu)
		{
			this.#connectMenu.close();

			return;
		}

		const menu = new Menu({
			bindElement: this.#providerConnectDropdownBtnLayout,
			cacheable: false,
			events: {
				onPopupClose: () => {
					this.#connectMenu = null;
					this.#connectMenuTrigger?.setExpanded(false);
				},
			},
		});
		this.#connectMenu = menu;
		menu.addMenuItem({
			text: Loc.getMessage('SIGN_B2E_PROVIDER_DISCONNECT'),
			onclick: () => {
				void this.#disconnectCurrentProvider();
				menu.close();
			},
		});
		this.#connectMenuTrigger?.setExpanded(true);
		menu.show();
	}

	#tryStartProviderTour(): void
	{
		const guide = new Guide({
			id: 'sign-b2e-provider-tour',
			onEvents: true,
			autoSave: true,
			steps: [
				{
					target: this.#providerConnectedSelectDropdownBtnLayout,
					title: `
						<p class="sign-document-b2e-company__provider_tour-step-head">
							${Loc.getMessage('SIGN_B2E_TOUR_HEAD')}
						</p>
					`,
					text: `
						<p class="sign-document-b2e-company__provider_tour-step-text">
							${Loc.getMessage('SIGN_B2E_TOUR_TEXT')}
						</p>
						<span class="sign-document-b2e-company__provider_tour-step-icon"></span>
					`,
					condition: {
						top: true,
						bottom: false,
						color: 'primary',
					},
				},
			],
			popupOptions: {
				width: 380,
				autoHide: true,
				className: 'sign-document-b2e-company__provider_popup-tour',
				centerAngle: true,
			},
		});
		void guide.startOnce();
	}

	#shouldShowGoskeyLitePromo(company: Company): boolean
	{
		return isGoskeyLitePromoAllowed({
			providers: company?.providers,
			goskeyLiteAvailable: company?.goskeyLiteAvailable,
			region: this.#options.region,
			documentInitiatedType: this.#options.documentInitiatedType,
			goskeyCode: ProviderCode.goskey,
			goskeyLiteCode: ProviderCode.goskeyLite,
			employeeInitiatedType: DocumentInitiated.employee,
		});
	}

	// Reuses the base provider tour mechanics and shows once per user via startOnce() + autoSave:
	// ui.tour persists the visit (in CUserOptions through sign.tour) the moment the promo is shown,
	// so it never appears again once seen. The CTA opens the same connection slider as the regular
	// "add provider" flow.
	#startGoskeyLitePromo(): void
	{
		const guide = new Guide({
			id: 'sign-b2e-goskey-lite-promo',
			onEvents: true,
			autoSave: true,
			steps: [
				{
					target: this.#providerConnectedSelectDropdownBtnLayout,
					title: `
						<p class="sign-document-b2e-company__provider_tour-step-head">
							${Loc.getMessage('SIGN_B2E_GOSKEY_LITE_PROMO_HEAD')}
						</p>
					`,
					// ui.tour renders step buttons as PopupWindowButton and does not forward custom
					// attributes, so the CTA button cannot carry a data-testid directly. The promo
					// content wrapper carries it instead: e2e locates the promo and clicks its primary
					// button.
					text: `
						<div data-testid="sign-b2e-goskey-lite-promo">
							<p class="sign-document-b2e-company__provider_tour-step-text">
								${Loc.getMessage('SIGN_B2E_GOSKEY_LITE_PROMO_TEXT')}
							</p>
							<p class="sign-document-b2e-company__provider_tour-step-text">
								${Loc.getMessage('SIGN_B2E_GOSKEY_LITE_PROMO_NOTE')}
							</p>
						</div>
					`,
					buttons: [
						{
							text: Loc.getMessage('SIGN_B2E_GOSKEY_LITE_PROMO_CONNECT'),
							event: () => {
								guide.close();
								this.#openProvidersConnectionSlider();
							},
						},
					],
				},
			],
			popupOptions: {
				width: 380,
				autoHide: true,
				className: 'sign-document-b2e-company__provider_popup-tour',
				centerAngle: true,
			},
		});
		void guide.startOnce();
	}

	setProvider(rqInn: ?string, company: Company): void
	{
		this.#resetProviderState();
		this.#nothingToSelect = true;
		if (company?.providers?.length > 0)
		{
			hide(this.#providerDisconnectedLayout);
			this.#updateProviderMenu(company);

			return;
		}

		hide(this.#connectedProviderLayout);
		hide(this.#providerUnsetLayout);
		hide(this.#providerInfoLayout);
		if (!rqInn)
		{
			hide(this.#providerDisconnectedBtnLayout);
		}
	}

	#updateProviderMenu(company: Company): void
	{
		this.#resetProvider();
		const menu = this.#getProviderMenu();

		company.providers.forEach((provider: Provider) => {
			const { providerName, description } = this.#getConnectedName(provider, company.rqInn);

			menu.addItem({
				id: provider.uid,
				title: providerName,
				subtitle: description,
				avatar: this.#getEntityAvatar(provider),
				entityId: 'b2e-provider',
				tabs: 'b2e-providers',
				badges: this.#getEntityBadges(provider),
			});
		});
		const [firstItem] = menu.getItems();
		firstItem.select();

		this.#nothingToSelect = !company?.registerUrl && company?.providers?.length < 2;
		Dom.style(
			this.#providerConnectedSelectDropdownBtnLayout,
			'display',
			this.#nothingToSelect ? 'none' : 'block',
		);
		// Cursor and hover must not promise an action the row cannot perform.
		if (this.#nothingToSelect)
		{
			Dom.removeClass(this.#connectedProviderLayout, '--clickable');
		}
		else
		{
			Dom.addClass(this.#connectedProviderLayout, '--clickable');
		}

		if (this.#shouldShowGoskeyLitePromo(company))
		{
			this.#startGoskeyLitePromo();
		}
		else if (this.#options.region === 'ru' && this.#options.documentInitiatedType !== DocumentInitiated.employee)
		{
			this.#tryStartProviderTour();
		}
	}

	#getProviderConnectedDescription(provider: Provider, rqInn: number): string
	{
		if (provider.autoRegister)
		{
			return this.#showTaxId
				? Loc.getMessage('SIGN_B2E_SELECT_PROVIDER_WITHOUT_DATE', {
					'#RQINN#': rqInn,
				})
				: Loc.getMessage('SIGN_B2E_SELECT_PROVIDER_WITHOUT_INN_DATE');
		}

		const formattedDate = DateTimeFormat.format(
			DateTimeFormat.getFormat('FORMAT_DATE'),
			provider.timestamp,
		);

		return this.#showTaxId
			? Loc.getMessage('SIGN_B2E_SELECT_PROVIDER', {
				'#RQINN#': rqInn,
				'#DATE#': formattedDate,
			})
			: Loc.getMessage('SIGN_B2E_SELECT_PROVIDER_WITHOUT_INN', { '#DATE#': formattedDate });
	}

	#getConnectedName(provider: Provider, rqInn: number): string
	{
		const providerName = provider.code === 'external'
			? provider.name
			: this.#getProviderNameByCode(provider.code)
		;
		const description = this.#getProviderConnectedDescription(provider, rqInn);

		return { providerName, description };
	}

	#getProviderNameByCode(code: ProviderCodeType): string
	{
		switch (code)
		{
			case 'goskey':
				return Loc.getMessage('SIGN_B2E_PROVIDER_GOSKEY_NAME');
			case 'goskey-lite':
				return Loc.getMessage('SIGN_B2E_PROVIDER_GOSKEY_LITE_NAME');
			case 'ses-ru':
				return Loc.getMessage('SIGN_B2E_PROVIDER_SES_NAME');
			case 'ses-com':
				return Loc.getMessage('SIGN_B2E_PROVIDER_SES_COM_NAME');
			case 'ses-ru-express':
				return Loc.getMessage('SIGN_B2E_PROVIDER_SES_RU_EXPRESS_NAME');
			default:
				return '';
		}
	}

	setProviderById(id: string): void
	{
		const providerMenu = this.#getProviderMenu();
		const providers = providerMenu.getItems();
		const currentProvider = providers.find((provider) => provider.id === id);
		currentProvider?.select();
	}

	#resetProviderClasses()
	{
		const providerClasses = allowedSignatureProviders.map((provider) => `--${provider}`);
		providerClasses.push('--expired');
		Dom.removeClass(this.#connectedProviderLayout, providerClasses);
	}

	#resetProvider()
	{
		this.#providerMenu = null;
		this.#resetProviderClasses();
	}

	#onProviderDeselect(): void
	{
		Dom.style(this.#providerUnsetLayout, 'display', 'flex');
		hide(this.#connectedProviderLayout);
		this.#renderProviderInfo();
		this.#providerMenu.hide();
		this.#company.provider = null;
		this.emit(this.events.onProviderDeselect);
	}

	#renderProviderInfo(provider: Provider | null = null): void
	{
		const code = provider?.code ?? '';
		Dom.clean(this.#providerInfoLayout);
		if (!provider)
		{
			const firstParagraph = Tag.render`
				<p>
					${Loc.getMessage('SIGN_B2E_COMPANIES_UNSET_PROVIDER_PARAGRAPH_1')}
				</p>
			`;
			const secondParagraph = Tag.render`
				<p>
					${Loc.getMessage('SIGN_B2E_COMPANIES_UNSET_PROVIDER_PARAGRAPH_2')}
				</p>
			`;
			const thirdParagraph = Tag.render`
				<p>
					${Helpdesk.replaceLink(
				Loc.getMessage('SIGN_B2E_COMPANIES_UNSET_PROVIDER_MORE'),
				HelpdeskCodes.HowToChooseProvider,
			)}
				</p>
			`;
			Dom.append(firstParagraph, this.#providerInfoLayout);
			Dom.append(secondParagraph, this.#providerInfoLayout);
			Dom.append(thirdParagraph, this.#providerInfoLayout);

			return;
		}

		if (code === ProviderCode.external)
		{
			const element = Tag.render`
				<p> ${TextFormat.encode(provider.description)} </p>
			`;

			Dom.append(element, this.#providerInfoLayout);

			return;
		}

		if (code === ProviderCode.sesCom)
		{
			let providerInfo = Loc.getMessage('SIGN_B2E_COMPANY_SES_COM_INFO') ?? '';
			providerInfo = Helpdesk.replaceLink(
				providerInfo,
				HelpdeskCodes.SesComDetails,
			);
			providerInfo = Link.replaceInLoc(
				providerInfo,
				sesComLearnMoreLink,
			);

			const text = Tag.render`<span>${providerInfo}</span>`;
			Dom.style(text.firstElementChild, { display: 'none' });
			Dom.append(text, this.#providerInfoLayout);

			return;
		}

		const providerCodeToProviderInfoTextMap: { [key: ProviderCodeType]: ?string } = {
			goskey: Loc.getMessage('SIGN_B2E_COMPANY_GOSKEY_INFO'),
			'goskey-lite': Loc.getMessage('SIGN_B2E_COMPANY_GOSKEY_LITE_INFO'),
			'ses-ru': Loc.getMessage('SIGN_B2E_COMPANY_SES_RU_INFO'),
			'ses-ru-express': Loc.getMessage('SIGN_B2E_COMPANY_SES_RU_EXPRESS_INFO'),
		};
		const providerCodeToHelpdeskCodeMap: { [key: ProviderCodeType]: string } = {
			goskey: HelpdeskCodes.GoskeyDetails,
			'goskey-lite': HelpdeskCodes.GoskeyDetails,
			'ses-ru': HelpdeskCodes.SesRuDetails,
			'ses-ru-express': HelpdeskCodes.SesRuExpressDetails,
		};

		const text = Tag.render`<span>${Helpdesk.replaceLink(
			providerCodeToProviderInfoTextMap[code] ?? '',
			providerCodeToHelpdeskCodeMap[code] ?? '',
		)}</span>`;
		Dom.append(text, this.#providerInfoLayout);

		if (this.#isProviderExpiresSoon(provider) || this.#isProviderExpired(provider))
		{
			Dom.append(this.#getProviderAlert(provider).render(), this.#providerInfoLayout);
		}
	}

	#getProviderAlert(provider: Provider): Alert
	{
		return new Alert({
			text: this.#getProviderAlertMessage(provider),
			customClass: 'sign-document-b2e-company__provider_alert',
		});
	}

	#getProviderAlertMessage(provider: Provider): string
	{
		if (this.#isProviderExpired(provider))
		{
			return Helpdesk.replaceLink(
				Loc.getMessage('SIGN_B2E_GOSKEY_APIKEY_EXPIRED_MORE_MSGVER_1'),
				HelpdeskCodes.GoskeyApiKey,
			);
		}

		const daysLeft = this.#getProviderDaysLeft(provider.expires);
		const alertText = Loc.getMessagePlural('SIGN_B2E_GOSKEY_APIKEY_EXPIRES_MSGVER_1', daysLeft, {
			'#DAYS#': daysLeft,
		});

		return Helpdesk.replaceLink(alertText, HelpdeskCodes.GoskeyApiKey);
	}

	#resetProviderState(): void
	{
		show(this.getLayout());
		show(this.#providerInfoLayout);
		show(this.#providerDisconnectedLayout);
		Dom.style(this.#connectedProviderLayout, 'display', 'flex');
		Dom.style(this.#providerDisconnectedLayout, 'display', 'flex');
	}

	#isProviderExpiresSoon(provider: Provider): boolean
	{
		if (!provider.expires)
		{
			return false;
		}
		const daysLeft = this.#getProviderDaysLeft(provider.expires);

		return daysLeft <= this.#providerExpiresDaysToShowInfo && daysLeft >= 1;
	}

	#isProviderExpired(provider: Provider): boolean
	{
		if (provider.code === ProviderCode.goskeyLite)
		{
			return false;
		}

		return provider.expires && this.#getProviderDaysLeft(provider.expires) < 1;
	}

	#getProviderDaysLeft(expires: Number): Number
	{
		const now = Date.now() / 1000;

		return Math.floor((expires - now) / 86400);
	}

	#getCompanyById(id: number): Company | undefined
	{
		return this.#companyList.find((company) => id === company.id);
	}

	setCompanyList(companies: Array<Company>): void
	{
		this.#companyList = Runtime.clone(companies);
	}

	async #disconnectCurrentProvider(): Promise<void>
	{
		if (!this.#company.provider)
		{
			return;
		}
		const company = this.#getCompanyById(this.#company.id ?? 0);
		if (!company)
		{
			return;
		}
		const id = this.#company.provider.uid;
		if (!id || this.#company.provider.autoRegister)
		{
			return;
		}

		this.emit(this.events.onProviderDisconnect, { provider: this.#company.provider });
	}

	setCompany(company: CompanyData): void
	{
		this.#company = Runtime.clone(company);
	}

	#openProvidersConnectionSlider(): void
	{
		const company = this.#getCompanyById(this.#company?.id);
		if (company && company.registerUrl)
		{
			const url = new URL(company.registerUrl);
			const allowedOrigin = url.origin;
			BX.SidePanel.Instance.open('sign:stub', {
				width: 1100,
				cacheable: false,
				allowCrossDomain: true,
				allowChangeHistory: false,
				contentCallback: () => {
					const frameStyles = 'position: absolute; left: 0; top: 0; padding: 0;'
						+ ' border: none; margin: 0; width: 100%; height: 100%;';
					this.#registerIframe = Tag.render`<iframe src="${company.registerUrl}" style="${frameStyles}"></iframe>`;

					return this.#registerIframe;
				},
				events: {
					onClose: () => this.emit(this.events.providerConnectionSlider.onClose),
				},
			});

			this.#initIframeConnect(allowedOrigin);
			this.#subscribeIframeConnectedEvent(allowedOrigin);
			this.#subscribeIframeCloseEvent(allowedOrigin);
		}
	}

	#subscribeIframeConnectedEvent(allowedOrigin: string): void
	{
		if (this.#isSubscribedIframeConnectedEvent)
		{
			return;
		}

		Event.bind(window, 'message', (event: MessageEvent<any>) => {
			if (event.origin === allowedOrigin && event.data === 'Event:b2e-crossorigin:connected')
			{
				clearInterval(this.#iframeConnectInterval);
				const company = this.#getCompanyById(this.#company.id ?? 0);
				if (company)
				{
					this.#registerIframe.contentWindow.postMessage({ companyName: company.title }, allowedOrigin);
				}
			}
		});

		this.#isSubscribedIframeConnectedEvent = true;
	}

	#subscribeIframeCloseEvent(allowedOrigin: string): void
	{
		if (this.#isSubscribedIframeCloseEvent)
		{
			return;
		}
		Event.bind(window, 'message', (event: MessageEvent) => {
			if (event.origin === allowedOrigin && event.data === 'Event:b2e-crossorigin:close-iframe')
			{
				BX.SidePanel.Instance.close();
			}
		});

		this.#isSubscribedIframeCloseEvent = true;
	}

	#initIframeConnect(allowedOrigin: string): void
	{
		this.#iframeConnectInterval = setInterval(() => {
			if (this.#registerIframe && this.#registerIframe.contentWindow)
			{
				this.#registerIframe.contentWindow.postMessage('Event:b2e-crossorigin:initConnection', allowedOrigin);
			}
		}, 500);
	}

	#getEntityAvatar(provider: Provider): string
	{
		if (provider.code === ProviderCode.goskey)
		{
			return this.#isProviderExpired(provider)
				? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAzNiAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjM2IiBoZWlnaHQ9IjM2IiByeD0iMTgiIGZpbGw9IiNCREMxQzYiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNi4zMzA1IDE0Ljg5OTlMMTkuNzU3MiAxMS40NzMxQzIwLjM4ODEgMTAuODQyMyAyMS40MTA5IDEwLjg0MjMgMjIuMDQxNyAxMS40NzMxTDI0LjcwNyAxNC4xMzg0QzI1LjMzNzggMTQuNzY5MiAyNS4zMzc4IDE1Ljc5MiAyNC43MDcgMTYuNDIyOUwyMS4yODAyIDE5Ljg0OTZDMjAuODU5NyAyMC4yNzAyIDIwLjE3OTEgMjAuMjcxNSAxOS43NTg1IDE5Ljg1MDlMMTYuMzI5OCAxNi40MjIyQzE1LjkwOTMgMTYuMDAxNiAxNS45MDk5IDE1LjMyMDQgMTYuMzMwNSAxNC44OTk5Wk0yMS42NjEgMTUuNjYxNEMyMS4zNDU2IDE1Ljk3NjggMjAuODM0MiAxNS45NzY4IDIwLjUxODcgMTUuNjYxNEMyMC4yMDMzIDE1LjM0NiAyMC4yMDMzIDE0LjgzNDYgMjAuNTE4NyAxNC41MTkxQzIwLjgzNDIgMTQuMjAzNyAyMS4zNDU2IDE0LjIwMzcgMjEuNjYxIDE0LjUxOTFDMjEuOTc2NCAxNC44MzQ2IDIxLjk3NjQgMTUuMzQ2IDIxLjY2MSAxNS42NjE0WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE3LjA5MiAxNy45NDU5TDE4LjQyNDYgMTkuMjc4NUMxOC42MzQ5IDE5LjQ4ODggMTguNjM0OSAxOS44Mjk3IDE4LjQyNDYgMjAuMDRMMTcuMDU5MyAyMS40MDUzQzE2Ljk1ODQgMjEuNTA2MyAxNi44MjE0IDIxLjU2MyAxNi42Nzg2IDIxLjU2M0gxNS4zNzg2VjIyLjg2M0MxNS4zNzg2IDIzLjAwNTggMTUuMzIxOSAyMy4xNDI3IDE1LjIyMDkgMjMuMjQzN0wxNS4xNTU2IDIzLjMwOUMxNS4wNTQ2IDIzLjQxIDE0LjkxNzYgMjMuNDY2OCAxNC43NzQ4IDIzLjQ2NjhIMTMuNDc0OVYyNC43NjY3QzEzLjQ3NDkgMjQuOTA5NSAxMy40MTgxIDI1LjA0NjUgMTMuMzE3MiAyNS4xNDc1TDEyLjg3MTEgMjUuNTkzNUMxMi43NzAxIDI1LjY5NDUgMTIuNjMzMSAyNS43NTEzIDEyLjQ5MDMgMjUuNzUxM0gxMS4zMjVDMTEuMjM4OCAyNS43NTEzIDExLjE1NjEgMjUuNzE3IDExLjA5NTIgMjUuNjU2MUMxMS4wMzQyIDI1LjU5NTEgMTEgMjUuNTEyNSAxMSAyNS40MjYzVjIzLjY1NzFMMTUuMTg4MiAxOS40Njg5QzE0Ljk3OCAxOS4yNTg2IDE0Ljk3OCAxOC45MTc3IDE1LjE4ODIgMTguNzA3NEwxNS45NDk3IDE3Ljk0NTlDMTYuMjY1MiAxNy42MzA1IDE2Ljc3NjYgMTcuNjMwNSAxNy4wOTIgMTcuOTQ1OVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNS42MTUyNiAxNy4wNTY0VjE5LjMwMDJDNS42MTUyNiAyMC43MzA5IDUuNjE2ODIgMjEuNjk0NiA1LjY4NTA2IDIyLjQ1MjJDNS43NTAzMSAyMy4xNzY1IDUuODY4ODYgMjMuNTk0MiA2LjA0MzgxIDIzLjkzNDVDNi4yMTg3NyAyNC4yNzQ5IDYuNDg4MzggMjQuNjEyMyA3LjAzNjA3IDI1LjA4MDRDNy42MDg4NiAyNS41NyA4LjM4NjI5IDI2LjEyMTcgOS41NDE2OCAyNi45Mzg3TDExLjA0NTkgMjguMDAyNEwxMy41Nzc5IDI5LjQyMjRDMTQuODc2MiAzMC4xNTA1IDE1Ljc1MjYgMzAuNjQwMSAxNi40NzUgMzAuOTU4NUMxNy4xNjYgMzEuMjYzIDE3LjYwNCAzMS4zNTc5IDE3Ljk5OTkgMzEuMzU3OUMxOC4zOTU3IDMxLjM1NzkgMTguODMzNyAzMS4yNjMgMTkuNTI0NyAzMC45NTg1QzIwLjI0NzIgMzAuNjQwMSAyMS4xMjM1IDMwLjE1MDUgMjIuNDIxOSAyOS40MjI0TDI0Ljk1MzkgMjguMDAyNEwyNi40NTgxIDI2LjkzODdDMjcuNjEzNSAyNi4xMjE3IDI4LjM5MDkgMjUuNTcgMjguOTYzNyAyNS4wODA0QzI5LjUxMTQgMjQuNjEyMyAyOS43ODEgMjQuMjc0OSAyOS45NTU5IDIzLjkzNDVDMzAuMTMwOSAyMy41OTQyIDMwLjI0OTQgMjMuMTc2NSAzMC4zMTQ3IDIyLjQ1MjJDMzAuMzgyOSAyMS42OTQ2IDMwLjM4NDUgMjAuNzMwOSAzMC4zODQ1IDE5LjMwMDJWMTcuMDU2NEMzMC4zODQ1IDE1LjYyNTcgMzAuMzgyOSAxNC42NjE5IDMwLjMxNDcgMTMuOTA0NEMzMC4yNDk0IDEzLjE4IDMwLjEzMDkgMTIuNzYyMyAyOS45NTU5IDEyLjQyMkMyOS43ODEgMTIuMDgxNiAyOS41MTE0IDExLjc0NDIgMjguOTYzNyAxMS4yNzYxQzI4LjM5MDkgMTAuNzg2NSAyNy42MTM1IDEwLjIzNDkgMjYuNDU4MSA5LjQxNzgzTDI0LjkxOTggOC4zMzAwNEwyMi44MjczIDcuMDA5OEMyMS40MTc3IDYuMTIwNDIgMjAuNDYzNCA1LjUyMDc0IDE5LjY3MzQgNS4xMzA3QzE4LjkxNzMgNC43NTczMyAxOC40MzY4IDQuNjQyMDYgMTcuOTk5OSA0LjY0MjA2QzE3LjU2MyA0LjY0MjA2IDE3LjA4MjUgNC43NTczMyAxNi4zMjYzIDUuMTMwN0MxNS41MzYzIDUuNTIwNzQgMTQuNTgyMSA2LjEyMDQyIDEzLjE3MjUgNy4wMDk4TDExLjA4IDguMzMwMDNMOS41NDE2NyA5LjQxNzgzQzguMzg2MjkgMTAuMjM0OSA3LjYwODg2IDEwLjc4NjUgNy4wMzYwNyAxMS4yNzYxQzYuNDg4MzggMTEuNzQ0MiA2LjIxODc3IDEyLjA4MTYgNi4wNDM4MSAxMi40MjJDNS44Njg4NiAxMi43NjIzIDUuNzUwMzEgMTMuMTggNS42ODUwNiAxMy45MDQ0QzUuNjE2ODIgMTQuNjYxOSA1LjYxNTI2IDE1LjYyNTcgNS42MTUyNiAxNy4wNTY0Wk0xMC4xOTIyIDYuOTU3NTNMMTIuMzIwNiA1LjYxNDY0QzE1LjA4MzMgMy44NzE1NSAxNi40NjQ2IDMgMTcuOTk5OSAzQzE5LjUzNTEgMyAyMC45MTY1IDMuODcxNTUgMjMuNjc5MiA1LjYxNDY0TDI1LjgwNzYgNi45NTc1M0wyNy4zODA2IDguMDY5ODZDMjkuNjQzOCA5LjY3MDI5IDMwLjc3NTQgMTAuNDcwNSAzMS4zODc3IDExLjY2MTVDMzEuOTk5OSAxMi44NTI1IDMxLjk5OTkgMTQuMjUzOCAzMS45OTk5IDE3LjA1NjRWMTkuMzAwMkMzMS45OTk5IDIyLjEwMjcgMzEuOTk5OSAyMy41MDQgMzEuMzg3NyAyNC42OTVDMzAuNzc1NCAyNS44ODYgMjkuNjQzOCAyNi42ODYyIDI3LjM4MDYgMjguMjg2N0wyNS44MDc2IDI5LjM5OUwyMy4yMDIzIDMwLjg2MDFDMjAuNjU4NiAzMi4yODY3IDE5LjM4NjggMzMgMTcuOTk5OSAzM0MxNi42MTMgMzMgMTUuMzQxMiAzMi4yODY3IDEyLjc5NzUgMzAuODYwMUwxMC4xOTIyIDI5LjM5OUw4LjYxOTE3IDI4LjI4NjZDNi4zNTU5MyAyNi42ODYyIDUuMjI0MzEgMjUuODg2IDQuNjEyMDkgMjQuNjk1QzMuOTk5ODggMjMuNTA0IDMuOTk5ODggMjIuMTAyNyAzLjk5OTg4IDE5LjMwMDJWMTcuMDU2NEMzLjk5OTg4IDE0LjI1MzggMy45OTk4OCAxMi44NTI1IDQuNjEyMDkgMTEuNjYxNUM1LjIyNDMxIDEwLjQ3MDUgNi4zNTU5NCA5LjY3MDI5IDguNjE5MTggOC4wNjk4NkwxMC4xOTIyIDYuOTU3NTNaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'
				: 'data:image/png;base64,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';
		}

		if (provider.code === ProviderCode.goskeyLite)
		{
			return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQiIGhlaWdodD0iNDQiIHZpZXdCb3g9IjAgMCA0NCA0NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9ItCj0L/RgNC+0YnRkdC90L3Ri9C5INCT0L7RgdC60LvRjtGHIj4KPHBhdGggZD0iTTAgMjEuNUMwIDkuNjI1ODggOS42MjU4OCAwIDIxLjUgMFYwQzMzLjM3NDEgMCA0MyA5LjYyNTg4IDQzIDIxLjVWMjEuNUM0MyAzMy4zNzQxIDMzLjM3NDEgNDMgMjEuNSA0M1Y0M0M5LjYyNTg4IDQzIDAgMzMuMzc0MSAwIDIxLjVWMjEuNVoiIGZpbGw9IiMwQTI4OTYiLz4KPHBhdGggZD0iTTI5LjQ3NDEgMTUuOTkzMkwyNi41MTEgMTMuMDIyOEMyNS44MjQzIDEyLjIxMzkgMjQuNjE0MyAxMi4xMTczIDIzLjgwOSAxMi44MDdDMjMuNzMxOSAxMi44NzMyIDIzLjY1OTcgMTIuOTQ1NiAyMy41OTQxIDEzLjAyMjhMMTkuMTU4OSAxNy40NzQ4QzE4Ljg0NzIgMTcuNzk2MiAxOC44NDcyIDE4LjMwOCAxOS4xNTg5IDE4LjYyOTRMMjMuODczNiAyMy4zNjIyQzI0LjE5MzkgMjMuNjc1MiAyNC43MDM3IDIzLjY3NTIgMjUuMDIzMyAyMy4zNjIyTDI5LjQ3MzQgMTguOTIxN0MzMC4zODU3IDE4LjAwNTkgMzAuMzg1NyAxNi45MTMzIDI5LjQ3MzQgMTUuOTkzMkgyOS40NzQxWk0yNi40NzMzIDE3LjQ0NjhDMjYuNDczMyAxOC4xMzc4IDI1LjkxNTMgMTguNjk3NSAyNS4yMjc1IDE4LjY5NzVDMjQuNTM5NSAxOC42OTc1IDIzLjk4MTggMTguMTM3MiAyMy45ODE4IDE3LjQ0NjhDMjMuOTgxOCAxNi43NTY1IDI0LjUzOTUgMTYuMTk2MiAyNS4yMjc1IDE2LjE5NjJDMjUuOTE1MyAxNi4xOTYyIDI2LjQ3MzMgMTYuNzU1OSAyNi40NzMzIDE3LjQ0NjhaTTIyLjI0NTQgMjIuNjAzM0wxOS45MzQ0IDIwLjI3NTJDMTkuNzg0OCAyMC4xMjU3IDE5LjU0MzYgMjAuMTI1NyAxOS4zOTQxIDIwLjI3NTJMMTguMDE4MyAyMS42NTYzQzE3Ljg2OTMgMjEuODA2NiAxNy44NjkzIDIyLjA0OTEgMTguMDE4MyAyMi4xOTkxTDE4LjI1MjIgMjIuNDMzN0wxMy4zNTM2IDI3LjM1NDlDMTMuMjgzNyAyNy40MjU0IDEzLjI0MzYgMjcuNTIwNiAxMy4yNDI0IDI3LjYyMDVMMTMuMjA0MSAyOS42NjM1QzEzLjIwNDEgMjkuODc2MyAxMy4zNzU0IDMwLjA0ODEgMTMuNTg3NSAzMC4wNDgxSDE1LjE5NzRDMTUuMjk5NSAzMC4wNDgxIDE1LjM5NzMgMzAuMDA4NiAxNS40Njk2IDI5LjkzNjlMMTUuODM2IDI5LjU2NzRMMTUuODM3OCAyOS41NjU3QzE1LjkwNzIgMjkuNDk1NyAxNi4wMjUgMjkuMzc2NiAxNi4wMjczIDI5LjI3ODhMMTYuMjE4OSAyNy41NDdMMTcuMzE4MiAyNy40Mzg4QzE3LjcyNTkgMjcuMzk4NSAxOC4xMTEzIDI3LjIzNTEgMTguNDIzNSAyNi45Njk1VjI1LjE0MTdMMTkuMTM4OSAyNS4xMTNDMTkuODUxIDI1LjA4NDQgMjAuNTI4NiAyNC43OTU4IDIxLjA0MjggMjQuMzAxNkwyMi4yNDY3IDIzLjE0NTNDMjIuMzk1NSAyMi45OTUzIDIyLjM5NTUgMjIuNzUyOCAyMi4yNDY3IDIyLjYwMjVMMjIuMjQ1NCAyMi42MDMzWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTIxLjY3NDIgMzkuMjM0MUMyMC4zNjY5IDM5LjIzNDEgMTkuMDU5OCAzOC45MDY3IDE3LjczMzcgMzguMjUyMkMxNC42MTUxIDM2LjcxMDQgMTIuMjcyMyAzNS4zNTg3IDkuMzc3ODggMzMuNDMxOEM2LjkxNDI1IDMxLjc5MSA1LjYyNTQyIDI5LjU1OSA1LjQzNjM3IDI2LjYwNzNDNS4yMTI2MiAyMy4xMjQ1IDUuMjEyNjIgMjAuMDE4NCA1LjQzNjM3IDE2LjUzNzZDNS42MjU0MiAxMy41ODY2IDYuOTE0MjUgMTEuMzU0NSA5LjM3NjYxIDkuNzE0M0MxMi4yNzc0IDcuNzgxODEgMTQuNjIwNiA2LjQyOTY1IDE3LjczNDUgNC44OTAzNUMyMC4zODU5IDMuNTgxOTYgMjIuOTYzMSAzLjU4MTM1IDI1LjYxMzUgNC44OTIxOEMyOC43MjkxIDYuNDMyMDkgMzEuMDcxNiA3Ljc4NDg1IDMzLjk2OTggOS43MTYxM0MzNi40Mjk5IDExLjM1NTEgMzcuNzE4OCAxMy41ODYgMzcuOTA5NiAxNi41MzUyQzM4LjEzNTEgMjAuMDE0OSAzOC4xMzUxIDIzLjEyMTQgMzcuOTA5NiAyNi42MTAzQzM3LjcxODggMjkuNTYgMzYuNDI5MiAzMS43OTEgMzMuOTY4NiAzMy40MzA2QzMxLjA3NDcgMzUuMzU3NyAyOC43MzI3IDM2LjcwOTIgMjUuNjE1MiAzOC4yNTA5QzI0LjI4OTIgMzguOTA3MiAyMi45ODEzIDM5LjIzNDkgMjEuNjczIDM5LjIzNDlMMjEuNjc0MiAzOS4yMzQxWk0yMS42NzQyIDUuOTgxNzhDMjAuNjg3MiA1Ljk4MTc4IDE5LjcwMDQgNi4yMzk0NSAxOC42NTY0IDYuNzU0NzhDMTUuNjI5NSA4LjI1MDM0IDEzLjM1MDYgOS41NjU0MiAxMC41MzAxIDExLjQ0NDRDOC41OTE1NiAxMi43MzUyIDcuNjYwNTMgMTQuMzQ2OCA3LjUxMTUzIDE2LjY3MDFDNy4yOTQxMSAyMC4wNTkyIDcuMjk0MTEgMjMuMDgzMiA3LjUxMTUzIDI2LjQ3NDNDNy42NjA1MyAyOC43OTc1IDguNTkxNTYgMzAuNDEwMiAxMC41MzA2IDMxLjcwMTZDMTMuMzQ0NSAzMy41NzUzIDE1LjYyMjYgMzQuODg5MiAxOC42NTUxIDM2LjM4ODNDMjAuNzQzNyAzNy40MTk1IDIyLjYwNTggMzcuNDE4NCAyNC42OTQ2IDM2LjM4NzFDMjcuNzI2NCAzNC44ODcyIDMwLjAwMzUgMzMuNTczNSAzMi44MTcxIDMxLjY5OThDMzQuNzU0NCAzMC40MDk3IDM1LjY4NTQgMjguNzk4OCAzNS44MzYyIDI2LjQ3NkMzNi4wNTU2IDIzLjA4MDEgMzYuMDU1NiAyMC4wNTYyIDM1LjgzNjIgMTYuNjY4OUMzNS42ODU0IDE0LjM0NzQgMzQuNzU1MSAxMi43MzY0IDMyLjgxODQgMTEuNDQ2M0MzMC4wMDA1IDkuNTY4NDYgMjcuNzIyMSA4LjI1MzM4IDI0LjY5MjYgNi43NTUzOUMyMy42NDkzIDYuMjM5NDUgMjIuNjYxOCA1Ljk4MTc4IDIxLjY3NDIgNS45ODE3OFoiIGZpbGw9IndoaXRlIi8+CjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjEsIDIuMSkgc2NhbGUoMC45KSI+CjxwYXRoIGQ9Ik00MS4zMDU3IDI2LjEyQzQyLjcwNTggMjQuNTEyIDQ1LjMxIDI1Ljk1NzQgNDQuNjgzNiAyNy45OTY5TDQzLjQ3NTYgMzEuOTI5Nkg0Ny41MTc2TDQ3LjY0NTUgMzEuOTM0NEM0OC4yMzY0IDMxLjk3NzUgNDguNzY3IDMyLjMxNTkgNDkuMDU0NyAzMi44MzM5TDQ5LjExMjMgMzIuOTQ4MUM0OS40MDAyIDMzLjU2OTIgNDkuMzAxMSAzNC4zMDAyIDQ4Ljg2MDQgMzQuODIyMUwzOS43MDYxIDQ1LjY2QzM4LjMxNjQgNDcuMzA1MiAzNS42NzAxIDQ1Ljg1NDUgMzYuMzExNSA0My43OTc3VjQzLjc5NjhMMzcuNTI4MyAzOS45MDEySDMzLjE3MjlDMzIuNDg0MyAzOS45MDEyIDMxLjg1ODEgMzkuNDk4NCAzMS41NzIzIDM4Ljg3MUwzMS41NzEzIDM4Ljg3QzMxLjI4NjEgMzguMjQyNCAzMS4zOTQ5IDM3LjUwNzcgMzEuODQ1NyAzNi45ODkxVjM2Ljk4ODJMNDEuMzA1NyAyNi4xMloiIGZpbGw9IiMwMDc1RkYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjwvZz4KPC9zdmc+Cg==';
		}

		if (
			provider.code === ProviderCode.external
			&& Type.isStringFilled(provider.iconUrl)
		)
		{
			return provider.iconUrl;
		}

		return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAANQSURBVHgBxZi/b9NAFMffnZOaFgopEkggEK5AohKgJKgLIETzD6B2YmAo3boBAyv9sXaAbh2QCgMzVQbWpELQBYErFpCQcAUqPyogoqipm9jHe5fYikMs2/n5lZxcchffJ+/dvXfPDCJqZK2o9VnWOFOUJAgxhlcCGEvITiEK2DaAgyHK9iovlVb0zJAR4fbAwg688PLvLc6VSQkRTbot7MV3Vw48DjM4EOj8i+0xRVGWsalBazIQbC4IzBcolfudsFV1BgfcgTZKADzkpjmHrixAWCCE0YSqPqMmdEYGM81Mo/XFfGBy0LqLmoJidTAJhHnbBRhHehXKdR+v7aU100UYUqo6pyvXQnJbM74MPRCzrIx+dTBPbddCCDMDPZKohJUKB72QdaANrpo+GYfnF/fBcTV0vHWkVRkqQJyx29CiCGb6REzCPDqnRoaSWYDeaZujF1uKNw6MI4IZPcij3QRTUvqNOMXteHwcWlA9DGnpcwmyWxZElbVbnOAsxq9Bk/KDWfpShmbEGEtysIUGTajdMFLoNo7ZToOI6ghMRQnuHq56D1MFiqCbx2KdhJHi8tgZQrSVc78s+LAjOgaDKsTQZQQU6DayzughBe6+N+HBiAq5n+V2w5AMLkCshhlJMGcHGMyfjsON9V14/ceG+TN9nohMwdCJ1o6uH1HkFUbIshHDba9j7pgMGpz9XpLuIhCa0IHJDHFY2CjDIM55T4tXII7GYMEoyc8OXHarCMFieZbCskYI8QlCiqzgwNCayhz2/vvtsoDBGPN8Jtc+/RrsXgyMw/KXybViLkx5Q+6if79pCrj/cU9ai1xEoYAmJqvUujL7A0G+WbIvhPT1ywNpCZTC1C9CHs5oHW3ugWcSmnzbgrATNxQT9pSOJZJr2+SrHXKbBr2RgdYZpoYbGPEYOQU9Elpnzmm7QHSmFVjyQpeFMIt6TTXrSR18rzSL0UCH7smAgf2ztV94gKg+YoxPyIFdgMFtntHTrOALJKEu9cuBHYbSJQzOVd/RMNtLKNNMd2JN0Zph/f0NYWR/0A2qMaodFa1BO9kpCP0UulapgFG5FLlCyaNVnujtemD1HxjmPsBHeoJTcYDncToCex/p0ZVHa6yDoqz4ucZP/wB0m3kbYruWeAAAAABJRU5ErkJggg==';
	}

	#getEntityBadges(provider: Provider): Array<Object>
	{
		if (provider.code === ProviderCode.goskey && this.#isProviderExpired(provider))
		{
			return [
				{
					title: Loc.getMessage('SIGN_B2E_GOSKEY_APIKEY_EXPIRED'),
					textColor: 'var(--ui-color-palette-white-base)',
					bgColor: 'var(--ui-color-palette-orange-60)',
				},
			];
		}

		return [];
	}

	validate(): boolean
	{
		return Type.isObject(this.#company.provider)
			&& Type.isStringFilled(this.#company.provider.uid)
			&& !this.#isProviderExpired(this.#company.provider);
	}

	async registerVirtualProviderIfNeed(): Promise<void>
	{
		if (!this.#company.provider.virtual)
		{
			return;
		}

		const selectedItem = this.#getCompanyById(this.#company.id);
		const { id } = await this.#api.registerB2eCompany(
			this.#company.provider.code,
			selectedItem.rqInn,
			this.#company.id,
			this.#company.provider.externalProviderId,
		);
		this.#company.provider.uid = id;
		this.#company.provider.virtual = false;
	}

	getCurrentProvider(): ?Provider
	{
		return this.#company?.provider;
	}
}

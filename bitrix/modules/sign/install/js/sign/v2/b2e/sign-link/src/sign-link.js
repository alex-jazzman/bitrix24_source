import 'ui.buttons';
import 'ui.sidepanel-content';
import 'ui.design-tokens';
import { DateTimeFormat } from 'main.date';
import { Tag, Dom, Loc, Text, Browser, Type, Event, Cache } from 'main.core';
import { Api } from 'sign.v2.api';
import { SigningFrameEventHandler } from 'sign.v2.b2e.signing-frame-event-handler';
import './sign-link.css';

type EmployeeData = {
	signed: boolean,
	dateSignedTs: number,
	uri: {
		signedDocument: string,
		allDocuments: string,
	},
	document: {
		title: string,
		dateTs: number,
	},
	member: {
		name: string,
		position: string,
		photo: string,
	},
};

type SignLinkOptions = {
	memberId: number,
	requireBrowser?: boolean,
	mobileAllowed?: boolean,
	slider?: Object,
};

type SignLinkSliderOptions = {
	events: Object,
};

const signLinkSliderUrl = 'sign:stub:sign-link';

export class SignLink
{
	#container: HTMLElement = null;
	#memberId: string = null;
	#loaded: boolean = false;
	#errorCode: string = null;
	#errorMessage: string = null;
	#uri: string = null;
	#showHelpdeskGoskey: boolean = false;
	#api: Api;
	#requireBrowser: boolean = true;
	#mobileAllowed: boolean = true;
	#employeeData: EmployeeData = {};
	#renderMemberInfo: boolean = false;

	#slider: Object | null = null;
	#frameEventHandler: (event: Object) => void = null;
	#sliderCloseCompleteHandler: Function | null = null;

	#cache = new Cache.MemoryCache();
	static #signingFrameEventHandler: SigningFrameEventHandler = null;

	constructor(options: SignLinkOptions = {})
	{
		this.#api = new Api();
		this.#memberId = options.memberId;
		this.#requireBrowser = options?.requireBrowser || true;
		this.#mobileAllowed = options?.mobileAllowed || true;
		this.#slider = options?.slider || null;

		this.#initializeSigningFrameEventHandler();
	}

	#initializeSigningFrameEventHandler(): void
	{
		if (!SignLink.#signingFrameEventHandler)
		{
			SignLink.#signingFrameEventHandler = new SigningFrameEventHandler();
		}

		const signingFrameEventHandler = SignLink.#signingFrameEventHandler;
		signingFrameEventHandler.startListening();
		signingFrameEventHandler.subscribeSliderCloseEvent();
	}

	preloadData(): Promise<void>
	{
		return this.#loadData();
	}

	async openSlider(options: SignLinkSliderOptions): Promise<void>
	{
		if (!this.#loaded)
		{
			await this.#loadData();
		}

		const signLink = this;

		BX.SidePanel.Instance.open(signLinkSliderUrl, {
			width: 900,
			cacheable: false,
			allowCrossOrigin: true,
			allowCrossDomain: true,
			allowChangeHistory: false,
			// newWindowUrl: link,
			copyLinkLabel: true,
			newWindowLabel: true,
			loader: '/bitrix/js/intranet/sidepanel/bindings/images/sign_mask.svg',
			label: {
				text: Loc.getMessage('SIGN_V2_B2E_LINK_SLIDER_TITLE'),
				bgColor: '#C48300',
			},
			contentCallback() {
				return Promise.resolve(true)
					.then(() => {
						return signLink.render();
					})
				;
			},
			events: options?.events,
		});

		this.#slider = BX.SidePanel.Instance.getSlider(signLinkSliderUrl);
	}

	renderTo(node: HTMLElement): void
	{
		if (!this.#container)
		{
			this.#container = document.createElement('div');
			Dom.addClass(this.#container, 'sign-ui-signing-link-container');
		}

		Dom.append(this.#container, node);
		this.render();
	}

	async render(): Promise<HTMLElement>
	{
		if (!this.#container)
		{
			this.#container = document.createElement('div');
			Dom.addClass(this.#container, 'sign-ui-signing-link-container');
		}

		if (!this.#loaded)
		{
			Dom.append(this.#getLoader(), this.#container);
			await this.#loadData();
			Dom.remove(this.#getLoader(), this.#container);
		}

		if (this.#uri)
		{
			if (
				this.#isNeedToContinueInBrowser()
				|| this.#isNeedToContinueOnDesktop()
			)
			{
				this.#renderContinueInBrowserPage();
			}
			else if (this.#needToShowPageForEmployee())
			{
				this.#renderDownloadSignedDocForEmployee();
			}
			else
			{
				this.#renderUrl();
			}
		}
		else
		{
			this.#renderError(this.#getErrorTitle(this.#errorCode), this.#errorMessage);
		}

		return this.#container;
	}

	async #loadData(): Promise<void>
	{
		return this.#api.getLinkForSigning(
			this.#memberId,
			false,
		).then((data) => {
			if (data?.status === 'error')
			{
				throw data;
			}

			this.#uri = data.uri;
			this.#showHelpdeskGoskey = data.showHelpdeskGoskey;
			this.#requireBrowser = data?.requireBrowser ?? true;
			this.#mobileAllowed = data?.mobileAllowed ?? true;
			this.#employeeData = data?.employeeData ?? {};
			this.#loaded = true;
		}).catch((errors) => {
			this.#loaded = true;
			this.#errorCode = errors?.errors?.[0]?.code;
			this.#errorMessage = errors?.errors?.[0]?.message;
		});
	}

	#getDownloadLink(): string | null
	{
		return this.#employeeData?.uri?.signedDocument;
	}

	async #getOrLoadDownloadLink(): Promise<string | null>
	{
		if (!this.#employeeData?.uri?.signedDocument)
		{
			await this.#loadData();
		}

		return this.#getDownloadLink();
	}

	#getLoader(): HTMLElement
	{
		return this.#cache.remember('mask', () => {
			return Tag.render`
				<div class="sign-ui-signing-link-loading-mask"></div>
			`;
		});
	}

	#renderError(title: ?string, message: ?string): void
	{
		title = title || Loc.getMessage('SIGN_V2_B2E_LINK_ERROR_TITLE_PLACEHOLDER');
		title = Tag.safe`${title}`;

		message = message || Loc.getMessage('SIGN_V2_B2E_LINK_ERROR_MESSAGE_PLACEHOLDER');
		message = Tag.safe`${message}`;

		const el = Tag.render`
			<div class="ui-slider-no-access">
				<div class="ui-slider-no-access-inner">
					<div class="ui-slider-no-access-title">
						${title}
					</div>
					<div class="ui-slider-no-access-subtitle">
						${message}
					</div>
					<div class="ui-slider-no-access-img">
						<div class="ui-slider-no-access-img-inner"></div>
					</div>
				</div>
			</div>
		`;

		Dom.append(el, this.#container);
	}

	#getErrorTitle(errorCode: ?string): string
	{
		if (errorCode === 'ACCESS_DENIED')
		{
			return Loc.getMessage('SIGN_V2_B2E_LINK_ERROR_CODE_ACCESS_DENIED');
		}

		return Loc.getMessage('SIGN_V2_B2E_LINK_ERROR_TITLE_PLACEHOLDER');
	}

	#renderUrl(): void
	{
		Dom.append(this.#getLoader(), this.#container);

		// redirect if opened directly (new tab)
		if (!BX.SidePanel.Instance.isOpen() || Browser.isMobile())
		{
			window.location.href = this.#uri;
			return;
		}
		BX.SidePanel.Instance.newWindowUrl = window.location.href;

		this.#frameEventHandler = (event) => this.#handleIframeEvent(event);
		Event.bind(top, 'message', this.#frameEventHandler);
		this.#subscribeOnSliderCloseComplete();

		const frameStyles = 'position: absolute; left: 0; top: 0; padding: 0;'
			+ ' border: none; margin: 0; width: 100%; height: 100%;'
		;

		const onloadHandler = () => { Dom.remove(this.#getLoader()) };
		const iframe = Tag.render`
			<iframe 
				src="${this.#uri}" 
				referrerpolicy="strict-origin" 
				style="${frameStyles}"
				onload="${onloadHandler}"
			></iframe>
		`;
		Dom.append(iframe, this.#container);
	}

	#renderContinueInBrowserPage(): void
	{
		Dom.append(Tag.render`
			<div class="sign-ui-signing-link__empty-state">
				<div class="sign-ui-signing-link__empty-state_icon"></div>
				<div class="sign-ui-signing-link__empty-state_title">
					${Text.encode(Loc.getMessage('SIGN_V2_B2E_LINK_DESKTOP_TITLE'))}
				</div>
				<div class="sign-ui-signing-link__empty-state_desc">
					${Text.encode(Loc.getMessage('SIGN_V2_B2E_LINK_DESKTOP_TEXT'))}
				</div>
				<a
					href="${Text.encode(this.#uri)}"
					target="_blank"
					class="ui-btn ui-btn-primary ui-btn-round"
					onclick="${this.#onContinueInBrowserClick.bind(this)}"
				>
					${Text.encode(Loc.getMessage('SIGN_V2_B2E_LINK_DESKTOP_BUTTON'))}
				</a>
			</div>
		`, this.#container);
	}

	#onContinueInBrowserClick(event: PointerEvent): void
	{
		if (this.#isDesktopApp())
		{
			event?.preventDefault?.();
			BXDesktopSystem.ExecuteCommand('browse', this.#uri);
		}

		this.#slider?.close();
	}

	#renderDownloadSignedDocForEmployee(): void
	{
		Dom.append(Tag.render`
			<div class="sign-ui-signing-link__employee">
				<div class="sign-ui-signing-link__employee-header">
					<div class="sign-ui-signing-link__employee-header-header">
						<h2>${Text.encode(this.#employeeData.document.title)}</h2>
						<p>${Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_DISCLAIMER_MSGVER1')}</p>
					</div>
					${this.#renderMemberInfo ? this.#renderMemberInfoBlock(this.#employeeData.member) : ''}
				</div>

				<div class="sign-ui-signing-link__employee-doc">
					<p>${Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_SIGNED_DOC_MSG')}</p>
					<div>
						<div>
							<span class="sign-ui-signing-link__employee-doc--icon"></span>
							<div class="sign-ui-signing-link__employee-doc--info">
								<div class="sign-ui-signing-link__employee-doc--info-title">
									${Text.encode(this.#employeeData.document.title)}
								</div>
								<div class="sign-ui-signing-link__employee-doc--info-date">
									${Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_DOCUMENT_DATE', {
										'#DATE#': DateTimeFormat.format(DateTimeFormat.getFormat('LONG_DATE_FORMAT'), this.#employeeData.dateSignedTs),
									})}
								</div>
							</div>
						</div>
						<a onclick="${this.#onDownloadButtonClick.bind(this)}" class="ui-btn ui-btn-success ui-btn-round ui-btn-sm" download>
							${Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_SIGNED_DOC_BTN')}
						</a>
					</div>
				</div>
				
				<div onclick="BX.SidePanel.Instance.open('${Text.encode(this.#employeeData.uri.allDocuments)}')" class="sign-ui-signing-link__employee-alldocs" target="_blank">
					${Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_BUTTON_ALLDOCS')}
				</div>
			</div>
		`, this.#container);
	}

	#renderMemberInfoBlock(memberInfo: Object): HTMLElement
	{
		return Tag.render`
			<div class="sign-ui-signing-link__employee-header-person">
				<div class="sign-ui-signing-link__employee-header-person-photo">
					<img src="${Text.encode(memberInfo?.photo)}" alt="">
				</div>
				<div class="sign-ui-signing-link__employee-header-person-text">
					${Text.encode(memberInfo?.name)}
					<br>
					${Text.encode(memberInfo?.position)}
				</div>
			</div>
		`;
	}

	#needToShowPageForEmployee(): boolean
	{
		return this.#employeeData?.signed === true;
	}

	#isNeedToContinueInBrowser(): boolean
	{
		return this.#requireBrowser && this.#isDesktopApp();
	}

	#isNeedToContinueOnDesktop(): boolean
	{
		return Browser.isMobile() && !this.#mobileAllowed;
	}

	#isDesktopApp(): boolean
	{
		// return window.navigator.userAgent.includes('BitrixDesktop');
		return typeof (BXDesktopSystem) != "undefined" || typeof (BXDesktopWindow) != "undefined";
	}

	/**
	 * Calls when download button was clicked.
	 * @param {PointerEvent} event
	 */
	async #onDownloadButtonClick(event: PointerEvent): void
	{
		const target = event?.target;
		let downloadLink = this.#getDownloadLink();
		if (target && downloadLink)
		{
			target.href = downloadLink;

			return;
		}

		event?.preventDefault?.();
		event?.stopPropagation?.();
		downloadLink = await this.#getOrLoadDownloadLink();

		if (!target || !downloadLink)
		{
			window.top.BX.UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_V2_B2E_LINK_EMPLOYEE_SIGNED_DOC_NOT_READY'),
			});

			return;
		}

		target.href = downloadLink;
		target.click();
	}

	#handleIframeEvent(event): void
	{
		if (new URL(this.#uri).origin !== event.origin)
		{
			return;
		}

		if (Type.isString(event?.data))
		{
			if (event.data === 'BX:SidePanel:close')
			{
				this.#closeSlider();
			}

			return;
		}

		if (!Type.isPlainObject(event?.data))
		{
			return;
		}

		const message = event.data;

		switch (message.type)
		{
			case 'BX:SidePanel:onEscapePress':
				this.#slider?.firePageEvent('onEscapePress');
				break;

			case 'BX:SidePanel:close':
				this.#closeSlider();
				break;

			case 'BX:Sign:processDone':
				this.#closeSlider();
				this.#showProcessDoneNotification(message.role);
				break;

			default:
				break;
		}
	}

	#closeSlider(): void
	{
		this.#slider?.close();
		this.#unbindFrameEventHandler();
	}

	// 'onCloseComplete' instead of 'onClose': closing can be denied by the signing confirm popup,
	// unsubscribing on 'onClose' would lose the 'BX:Sign:processDone' message after such a deny
	#subscribeOnSliderCloseComplete(): void
	{
		if (this.#sliderCloseCompleteHandler)
		{
			return;
		}

		this.#sliderCloseCompleteHandler = (event) => {
			const [sliderEvent] = event.getData();
			if (sliderEvent?.getSlider()?.getUrl() !== signLinkSliderUrl)
			{
				return;
			}

			this.#unbindFrameEventHandler();
		};

		this.#getContext().BX.Event.EventEmitter.subscribe(
			'SidePanel.Slider:onCloseComplete',
			this.#sliderCloseCompleteHandler,
		);
	}

	#unbindFrameEventHandler(): void
	{
		Event.unbind(top, 'message', this.#frameEventHandler);

		if (this.#sliderCloseCompleteHandler)
		{
			this.#getContext().BX.Event.EventEmitter.unsubscribe(
				'SidePanel.Slider:onCloseComplete',
				this.#sliderCloseCompleteHandler,
			);
			this.#sliderCloseCompleteHandler = null;
		}
	}

	#getContext(): Window
	{
		return window === top ? window : top;
	}

	#showProcessDoneNotification(role: string): void
	{
		const messageKeyMap = {
			editor: 'SIGN_V2_B2E_LINK_PROCESS_DONE_EDITOR',
			reviewer: 'SIGN_V2_B2E_LINK_PROCESS_DONE_REVIEWER',
		};
		const messageKey = messageKeyMap[role];
		if (!messageKey)
		{
			return;
		}

		const content = Loc.getMessage(messageKey);
		if (content)
		{
			window.top.BX.UI.Notification.Center.notify({
				content,
				autoHideDelay: 5000,
			});
		}
	}
}

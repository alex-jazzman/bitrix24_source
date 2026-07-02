import { ajax, Dom, Event, Loc, Tag, Text } from 'main.core';
import { Layout } from 'ui.sidepanel.layout';
import { SmtpEditor, AliasEditor } from 'ui.mail.sender-editor';
import 'ui.info-helper';
import 'ui.forms';
import 'ui.sidepanel-content';
import 'ui.buttons';
import './css/style.css';

type ProvidersParams = {
	options: ProvidersOptions,
	providers?: Array<Provider>,
};

type ProvidersOptions = {
	isModuleMailInstalled: boolean,
	canConnectNewMailbox?: boolean,
	mailboxLimitSliderCode?: string,
	isMailToolAvailable?: boolean,
	toolLimitSliderCode?: string | null,
	promotionProviders?: Array<string>,
	isSmtpAvailable: boolean,
	isCloud: boolean,
};

type Provider = {
	icon: string,
	name: string,
	href: string,
}

type Options = {
	isSender: boolean,
	addSenderCallback?: Function,
	setSenderCallback?: Function,
	updateSenderList: () => void,
	sliderOptions?: Object,
}

const SidePanel = BX.SidePanel;

const showcaseSliderUrl = 'mailProviderShowcase';
const successMessage = 'mail-mailbox-config-success';
const imapServiceName = 'other';
const mailboxType = 'mailbox';

export class ProviderShowcase
{
	#wasSenderUpdated: boolean = false;
	constructor(options: Options = null)
	{
		this.isSender = options.isSender ?? false;
		this.setSenderCallback = options.setSenderCallback ?? null;
		this.addSenderCallback = options.addSenderCallback ?? null;
		this.updateSenderList = options.updateSenderList ?? null;
		this.sliderOptions = options.sliderOptions ?? {};

		this.container = Tag.render`
			<div class="showcase-container"></div>
		`;
	}

	static openSlider(options: Options): void
	{
		const instance = new ProviderShowcase(options);
		const onSliderMessage = function(event) {
			const [sliderEvent] = event.getData();
			if (!sliderEvent)
			{
				return;
			}

			const slider = SidePanel.Instance.getSlider(showcaseSliderUrl);
			if (!slider || sliderEvent.getEventId() !== successMessage)
			{
				return;
			}

			const mailboxId = sliderEvent.data.id;
			if (!mailboxId)
			{
				return;
			}

			instance.#wasSenderUpdated = true;
			slider.close();
			top.BX.SidePanel.Instance.postMessage(window, sliderEvent.getEventId(), sliderEvent.data);

			ajax.runAction(
				'main.api.mail.sender.getSenderByMailboxId',
				{
					data: {
						mailboxId,
						getSenderWithoutSmtp: !instance.options.isCloud,
					},
				},
			)
				.then((response) => {
					const data = response.data;
					if (!data)
					{
						return;
					}
					instance.setSender(data.id, data.name, data.email);
					if (instance.addSenderCallback || data.type === mailboxType)
					{
						return;
					}
					AliasEditor.openSlider({
						senderId: data.id,
						email: data.email,
						setSenderCallback: instance.setSenderCallback,
						updateSenderList: () => {
							void instance.updateSenderList();
						},
					});
				})
				.catch(() => {})
			;
		};

		SidePanel.Instance.open(showcaseSliderUrl, {
			width: 790,
			cacheable: false,
			contentCallback: () => {
				return Layout.createContent({
					extensions: [
						'ui.mail.provider-showcase',
					],
					title: Loc.getMessage('UI_MAIL_PROVIDER_SHOWCASE_TITLE'),
					design: {
						section: false,
					},
					content(): Promise
					{
						return instance.load();
					},
					buttons: () => {},
				});
			},
			events: {
				onClose: () => {
					top.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onMessage', onSliderMessage);
					if (instance.updateSenderList && instance.#wasSenderUpdated)
					{
						instance.updateSenderList();
					}
				},
			},
		});

		top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onMessage', onSliderMessage);
	}

	static renderTo(target: HTMLElement, options: Options): Promise
	{
		const instance = new ProviderShowcase(options);

		return new Promise((resolve, reject) => {
			instance.load()
				.then((container) => {
					Dom.append(container, target);
					resolve(container);
				})
				.catch(() => {
					reject();
				})
			;
		});
	}

	load(): Promise
	{
		return ajax.runAction(
			'main.api.mail.mailproviders.getShowcaseParams',
			{
				data: { isSender: this.isSender ? 1 : 0 },
			},
		)
			.then((response) => {
				this.#createShowcase(response.data);

				return this.container;
			})
			.catch(() => {})
		;
	}

	#createSmtpItemNode(): void
	{
		const smtpTitle = Loc.getMessage('UI_MAIL_PROVIDER_SMTP_TITLE');
		const { root: smtpRoot, button: smtpButton } = Tag.render`
			<li ref="root">
				<button class="mail-provider-item mail-provider-item-available" ref="button"
					aria-label="${Loc.getMessage('UI_MAIL_PROVIDER_CONNECT_LABEL', { '#NAME#': smtpTitle })}"
				>
					<div class="mail-provider-img-container">
						<div class="mail-provider-img-smtp"></div>
					</div>
					<div class="mail-provider-item-title-container">
						<span class="mail-provider-item-title">${smtpTitle}</span>
					</div>
				</button>
			</li>
		`;
		this.smtpNode = smtpRoot;
		Event.bind(smtpButton, 'click', () => {
			const slider = BX.SidePanel.Instance.getTopSlider();
			if (slider)
			{
				SmtpEditor.openSlider({
					setSenderCallback: (senderId?: string | number, senderName?: string, senderEmail?: string) => {
						if (this.setSenderCallback && senderId && senderName && senderEmail)
						{
							this.setSenderCallback(senderId, senderName, senderEmail);
						}
						this.updateSenderList();
						slider.close();
					},
					addSenderCallback: this.addSenderCallback,
				});
			}
		});

		if (this.options.isMailToolAvailable && this.options.canConnectNewMailbox)
		{
			return;
		}

		Dom.addClass(smtpButton, 'available-mail-provider-item');
		Dom.attr(smtpButton, 'data-tag', Loc.getMessage('UI_MAIL_PROVIDER_AVAILABLE_TAG'));
	}

	#createShowcase(params: ProvidersParams): void
	{
		this.options = params.options;
		this.providers = params.providers;
		this.showcaseNode = Tag.render`
			<ul class="mail-provider-list" aria-label="${Loc.getMessage('UI_MAIL_PROVIDER_SHOWCASE_TITLE')}"></ul>
		`;
		Dom.append(this.showcaseNode, this.container);
		this.#createProvidersList();

		if (!this.isSender || !this.options.isSmtpAvailable)
		{
			return;
		}

		this.#createSmtpItemNode();
		const firstProvider = this.showcaseNode.firstChild;
		if (!firstProvider || (this.options.canConnectNewMailbox && this.options.isMailToolAvailable))
		{
			Dom.append(this.smtpNode, this.showcaseNode);
		}
		else
		{
			Dom.insertBefore(this.smtpNode, firstProvider);
		}

		if (this.options.isModuleMailInstalled)
		{
			return;
		}

		this.#createPromotionShowcase();
	}

	#createProvidersList(): void
	{
		if (!this.providers)
		{
			return;
		}

		this.providers.forEach((provider) => {
			const key = this.#getProviderKey(provider.name);
			const name = provider.name;
			const providerName = this.#getProviderName(key) ?? (name[0].toUpperCase() + name.slice(1));
			const { root, button, title } = Tag.render`
				<li ref="root">
					<button class="mail-provider-item mail-provider-item-available" ref="button"
						aria-label="${Text.encode(Loc.getMessage(
						'UI_MAIL_PROVIDER_CONNECT_LABEL',
						{ '#NAME#': providerName },
						))}"
					>
						<div class="mail-provider-img-container">
							<div class="mail-provider-img ${this.#getProviderImgSrcClass(key)}"></div>
						</div>
						<div class="mail-provider-item-title-container" ref="title">
							<span class="mail-provider-item-title">${Text.encode(providerName)}</span>
						</div>
					</button>
				</li>
			`;

			if (provider.name === imapServiceName)
			{
				const imapSubtitle = Tag.render`
					<span class="mail-provider-item-subtitle">${Loc.getMessage('UI_MAIL_PROVIDER_IMAP_SUBTITLE')}</span>
				`;
				Dom.append(imapSubtitle, title);
			}

			Event.bind(button, 'click', this.#createProviderClickHandler(provider, title));

			Dom.append(root, this.showcaseNode);
			if (!this.isSender || !this.options.isMailToolAvailable || !this.options.canConnectNewMailbox)
			{
				return;
			}

			Dom.insertBefore(root, this.smtpNode);
		});
	}

	#createPromotionShowcase(): void
	{
		if (!this.options.promotionProviders)
		{
			return;
		}
		const promotionMessage = Loc.getMessage(
			'UI_MAIL_PROMOTION_TEXT',
			{
				'[strong]': '<strong>',
				'[/strong]': '</strong>',
			},
		);
		const { root, providerList } = Tag.render`
			<div class="promotion-showcase">
				<div class="ui-alert ui-alert-icon-info ui-alert-primary">
					<span class="ui-alert-message">${promotionMessage}</span>
				</div>
				<ul class="mail-provider-list" ref="providerList" style="margin-top: 10px"
					aria-label="${Loc.getMessage('UI_MAIL_PROVIDER_UNAVAILABLE_LIST_LABEL')}"
				></ul>
			</div>
		`;
		this.promotionShowcaseNode = root;

		this.options.promotionProviders.forEach((providerName) => {
			const name = Text.encode(providerName);
			const displayName = this.#getProviderName(name) ?? (name[0].toUpperCase() + name.slice(1));
			const item = Tag.render`
				<li>
					<span class="mail-provider-item mail-provider-item-unavailable">
						<span class="mail-provider-img-container">
							<span class="mail-provider-img ${this.#getProviderImgSrcClass(name)}"></span>
						</span>
						<span class="mail-provider-item-title-container">
							<span class="mail-provider-item-title">${Text.encode(displayName)}</span>
						</span>
					</span>
				</li>
			`;
			Dom.append(item, providerList);
		});
		Dom.append(this.promotionShowcaseNode, this.container);
	}

	setSender(id: number, senderName: string, senderEmail: string): void
	{
		const name = senderName;
		const email = senderEmail;
		if (this.setSenderCallback)
		{
			this.setSenderCallback(id, name, email);
		}

		if (!this.addSenderCallback)
		{
			return;
		}

		const mailbox = [];
		mailbox.name = name;
		mailbox.email = email;
		this.addSenderCallback(mailbox);
	}

	#createProviderClickHandler(provider: Provider, title: HTMLElement): Function
	{
		if (!this.options.isMailToolAvailable)
		{
			return () => {
				BX.UI.InfoHelper.show(this.options.toolLimitSliderCode);
			};
		}

		if (this.options.canConnectNewMailbox)
		{
			return () => {
				SidePanel.Instance.open(
					provider.href,
					{
						width: 760,
						...this.sliderOptions,
					},
				);
			};
		}

		return () => {
			if (this.activeFeaturePromoter)
			{
				this.activeFeaturePromoter.close();
				this.activeFeaturePromoter = null;
			}

			const featureRegistry = BX.Intranet ? BX.UI.FeaturePromotersRegistry : top.BX.UI.FeaturePromotersRegistry;
			this.activeFeaturePromoter = featureRegistry.getPromoter({
				code: this.options.mailboxLimitSliderCode,
				bindElement: title,
			});
			this.activeFeaturePromoter.show();
		};
	}

	#getProviderKey(name: string): string
	{
		switch (name)
		{
			case 'aol':
				return 'aol';
			case 'gmail':
				return 'gmail';
			case 'yahoo':
				return 'yahoo';
			case 'mail.ru':
			case 'mailru':
				return 'mailru';
			case 'icloud':
				return 'icloud';
			case 'outlook.com':
			case 'outlook':
				return 'outlook';
			case 'office365':
				return 'office365';
			case 'exchangeOnline':
			case 'exchange':
				return 'exchange';
			case 'yandex':
				return 'yandex';
			case 'ukr.net':
				return 'ukrnet';
			case 'other':
			case 'imap':
				return 'other';
			default:
				return '';
		}
	}

	#getProviderName(key: string): ?string
	{
		switch (key)
		{
			case 'aol':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_AOL');
			case 'gmail':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_GMAIL');
			case 'yahoo':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_YAHOO');
			case 'mailru':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_MAILRU');
			case 'icloud':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_ICLOUD');
			case 'outlook':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_OUTLOOK');
			case 'office365':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_OFFICE365');
			case 'exchange':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_EXCHANGE');
			case 'yandex':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_YANDEX');
			case 'other':
				return Loc.getMessage('UI_MAIL_PROVIDER_SERVICE_NAME_IMAP');
			default:
				return null;
		}
	}

	#getProviderImgSrcClass(name: string): string
	{
		return `mail-provider-${name}-img`;
	}
}

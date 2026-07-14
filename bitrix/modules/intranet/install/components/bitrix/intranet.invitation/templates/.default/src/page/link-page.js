import { Tag, Loc, Type, Dom } from 'main.core';
import { Loader } from 'main.loader';
import { AirButtonStyle, Button, ButtonState } from 'ui.buttons';
import { Input, InputDesign } from 'ui.system.input';

import { DepartmentControl } from 'intranet.department-control';

import { Analytics } from '../analytics';
import { Transport } from '../transport';
import { DepartmentControlBlock } from '../elements/department-control-block';
import { LinkOptionsSection } from './link-options-section';
import { Page } from './page';

export class LinkPage extends Page
{
	static #COPY_BUTTON_DEFAULT_TEXT = 'BX24_INVITE_DIALOG_COPY_LINK';
	static #COPY_BUTTON_SUCCESS_TEXT = 'INTRANET_INVITE_DIALOG_LINK_COPIED_BUTTON';

	#container: HTMLElement;
	#isAdmin: boolean;
	#isCloud: boolean;
	#needConfirmRegistration: boolean;
	#departmentControl: DepartmentControl;
	#departmentControlBlock: DepartmentControlBlock;
	#inviteLink: string = '';
	#isLinkLoading: boolean = true;
	#inviteLinkRequestId: number = 0;
	#isDepartmentControlSubscribed: boolean = false;
	#whiteList: string = '';
	#linkRegisterEnabled: boolean = false;

	#analytics: Analytics;
	#transport: Transport;
	#linkInput: Input;
	#copyLinkButton: Button;
	#isCopyLinkButtonSuccess: boolean = false;
	#linkOptionsSection: ?LinkOptionsSection = null;
	#linkOptionsButton: ?HTMLElement = null;
	#isLinkOptionsExpanded: boolean = false;
	#loader: ?Loader = null;
	#loaderOverlay: ?HTMLElement = null;

	constructor(options)
	{
		super();
		this.#isAdmin = options.isAdmin === true;
		this.#isCloud = options.isCloud === true;
		this.#needConfirmRegistration = options.needConfirmRegistration === true;
		this.#departmentControl = options.departmentControl instanceof DepartmentControl ? options.departmentControl : null;
		this.#departmentControlBlock = options.departmentControlBlock instanceof DepartmentControlBlock
			? options.departmentControlBlock
			: null
		;
		this.#inviteLink = Type.isString(options.invitationLink) ? options.invitationLink : '';
		this.#isLinkLoading = !Type.isStringFilled(this.#inviteLink);
		this.#whiteList = Type.isStringFilled(options.whiteList) ? options.whiteList : '';
		this.#linkRegisterEnabled = options.linkRegisterEnabled === true;
		this.#analytics = options.analytics;
		this.#transport = options.transport;
	}

	render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container;
		}

		this.#container = Tag.render`
			<div class="intranet-invitation-block" data-role="self-block">
				${this.#departmentControlBlock?.render()}
				<div class="intranet-invitation-block__content">
					<div class="intranet-invitation-block__header">
						<span class="intranet-invitation-status__title ui-headline --sm">${Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_INVITATION_TITLE')}</span>
					</div>
					<div class="intranet-invitation-block__copy-link-wrapper">
						<div class="intranet-invitation-block__copy-link-input-wrapper">
							${this.#getLinkInput().render()}
						</div>
						${this.#getCopyLinkButton().render()}
					</div>
					<div class="intranet-invitation-block__footer">
						${this.#renderLinkOptionsButton()}
					</div>
				</div>
				<div class="intranet-invitation-block__loader-overlay"></div>
			</div>
		`;
		this.#loaderOverlay = this.#container.querySelector('.intranet-invitation-block__loader-overlay');

		this.#subscribeToDepartmentChanges();

		if (this.#isLinkLoading)
		{
			void this.#loadInviteLink();
		}

		return this.#container;
	}

	#getLoader(): Loader
	{
		this.#loader ??= new Loader({
			target: this.#loaderOverlay,
			color: 'var(--ui-color-accent-main-primary-alt-2)',
		});

		return this.#loader;
	}

	#setConfirmRegistrationLoadingState(isLoading: boolean): void
	{
		if (!this.#container)
		{
			return;
		}

		Dom.toggleClass(this.#container, '--loading', isLoading);
		Dom.toggleClass(this.#loaderOverlay, '--shown', isLoading);

		if (isLoading)
		{
			void this.#getLoader().show();

			return;
		}

		void this.#loader?.hide();
	}

	#getLinkInput(): Input
	{
		this.#linkInput ??= new Input({
			design: this.#isLinkLoading ? InputDesign.Disabled : InputDesign.Grey,
			value: this.#inviteLink,
			readonly: true,
		});

		return this.#linkInput;
	}

	#getCopyLinkButton(): Button
	{
		this.#copyLinkButton ??= new Button({
			useAirDesign: true,
			text: Loc.getMessage(LinkPage.#COPY_BUTTON_DEFAULT_TEXT),
			icon: BX.UI.IconSet.Outline.LINK,
			style: AirButtonStyle.FILLED,
			onclick: this.#copyRegisterUrl.bind(this),
			size: BX.UI.ButtonSize.LARGE,
			props: {
				'data-test-id': 'invite-link-page-copy-link-button',
			},
		});

		return this.#copyLinkButton;
	}

	#renderLinkOptionsButton(): HTMLElement | ''
	{
		if (!this.#isAdmin)
		{
			return '';
		}

		this.#linkOptionsButton ??= Tag.render`
			<div
				class="intranet-invitation-link__footer-link ${this.#isLinkOptionsExpanded ? '--expanded' : ''}"
				data-test-id="invite-link-page-option-button"
				onclick="${() => this.#toggleLinkOptionsSection()}"
			>
				<span class="ui-link ui-link-secondary ui-link-dashed">${Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS')}</span>
				<i class="ui-icon-set --chevron-down-l"></i>
			</div>
		`;

		return this.#linkOptionsButton;
	}

	#getLinkOptionsSection(): LinkOptionsSection
	{
		this.#linkOptionsSection ??= new LinkOptionsSection({
			isAdmin: this.#isAdmin,
			isCloud: this.#isCloud,
			needConfirmRegistration: this.#needConfirmRegistration,
			whiteList: this.#whiteList,
			linkRegisterEnabled: this.#linkRegisterEnabled,
			analytics: this.#analytics,
			transport: this.#transport,
			onRegenerateStart: () => {
				this.#setLinkLoadingState(true);
			},
			onRegenerate: () => {
				return this.#loadInviteLink();
			},
			onRegenerateError: () => {
				this.#setLinkLoadingState(false);
			},
			onNeedConfirmRegistrationChange: (needConfirmRegistration) => {
				this.#needConfirmRegistration = needConfirmRegistration === true;
			},
			onNeedConfirmRegistrationChangeStart: () => {
				this.#setConfirmRegistrationLoadingState(true);
			},
			onNeedConfirmRegistrationChangeEnd: () => {
				this.#setConfirmRegistrationLoadingState(false);
			},
			onExpandedChange: (isExpanded) => {
				this.#setLinkOptionsButtonExpandedState(isExpanded);
			},
		});

		return this.#linkOptionsSection;
	}

	#toggleLinkOptionsSection(): void
	{
		const linkOptionsSection = this.#getLinkOptionsSection();
		const sectionNode = linkOptionsSection.renderSection();

		if (!sectionNode.isConnected)
		{
			const footerNode = this.#container?.querySelector('.intranet-invitation-block__footer');
			footerNode?.after(sectionNode);
		}

		linkOptionsSection.toggleSection();
	}

	#setLinkOptionsButtonExpandedState(isExpanded: boolean): void
	{
		this.#isLinkOptionsExpanded = isExpanded === true;
		Dom.toggleClass(this.#isLinkOptionsExpanded, '--expanded');
	}

	#copyRegisterUrl(copyLinkButton: Button): void
	{
		if (copyLinkButton.getState() === ButtonState.WAITING || this.#isLinkLoading)
		{
			return;
		}

		const invitationUrl = this.#getLinkInput().getValue();
		if (!Type.isStringFilled(invitationUrl))
		{
			return;
		}

		copyLinkButton.setState(ButtonState.WAITING);
		this.#copyToClipboard(invitationUrl)
			.then(() => {
				copyLinkButton.setState(null);
				this.#setCopyLinkButtonSuccessState();
				this.#analytics.sendCopyLink(this.#departmentControl, this.#needConfirmRegistration);
			}).catch((reject) => {
				copyLinkButton.setState(null);
				console.error(reject);
			});
	}

	#subscribeToDepartmentChanges(): void
	{
		if (this.#isDepartmentControlSubscribed || !(this.#departmentControl instanceof DepartmentControl))
		{
			return;
		}

		this.#departmentControl.subscribe('onChange', this.#onDepartmentChange.bind(this));
		this.#isDepartmentControlSubscribed = true;
	}

	#onDepartmentChange(): void
	{
		void this.#loadInviteLink();
	}

	async #loadInviteLink(): Promise<void>
	{
		const requestId = ++this.#inviteLinkRequestId;

		this.#setLinkLoadingState(true);

		try
		{
			const response = await this.#transport.send(
				{
					action: 'getInviteLink',
					data: {
						departmentsId: this.#departmentControl.getValues(),
						workgroupIds: this.#departmentControl.getGroupValues(),
						analyticsType: 'by_link',
					},
				},
				(reject) => {
					this.#transport.onError(reject);
					throw reject;
				},
			);

			if (requestId !== this.#inviteLinkRequestId)
			{
				return;
			}

			this.#setInviteLink(Type.isString(response.data?.invitationLink) ? response.data.invitationLink : '');
		}
		catch (reject)
		{
			if (requestId === this.#inviteLinkRequestId)
			{
				this.#setInviteLink('');
			}

			console.error(reject);
		}
		finally
		{
			if (requestId === this.#inviteLinkRequestId)
			{
				this.#setLinkLoadingState(false);
			}
		}
	}

	#setLinkLoadingState(isLoading: boolean): void
	{
		this.#isLinkLoading = isLoading;
		this.#linkInput?.setDesign(isLoading ? InputDesign.Disabled : InputDesign.Grey);
	}

	#setInviteLink(inviteLink: string): void
	{
		const normalizedInviteLink = Type.isString(inviteLink) ? inviteLink : '';
		const isInviteLinkChanged = normalizedInviteLink !== this.#inviteLink;

		this.#inviteLink = normalizedInviteLink;
		this.#linkInput?.setValue(this.#inviteLink);

		if (isInviteLinkChanged)
		{
			this.#resetCopyLinkButtonState();
		}
	}

	#setCopyLinkButtonSuccessState(): void
	{
		this.#isCopyLinkButtonSuccess = true;
		this.#copyLinkButton?.setStyle(AirButtonStyle.FILLED_SUCCESS);
		this.#copyLinkButton?.setText(Loc.getMessage(LinkPage.#COPY_BUTTON_SUCCESS_TEXT));
		this.#copyLinkButton?.setIcon('s-check');
	}

	#resetCopyLinkButtonState(): void
	{
		if (!this.#isCopyLinkButtonSuccess)
		{
			return;
		}

		this.#isCopyLinkButtonSuccess = false;
		this.#copyLinkButton?.setStyle(AirButtonStyle.FILLED);
		this.#copyLinkButton?.setText(Loc.getMessage(LinkPage.#COPY_BUTTON_DEFAULT_TEXT));
		this.#copyLinkButton?.setIcon(BX.UI.IconSet.Outline.LINK);
	}

	async #copyToClipboard(textToCopy: string): Promise<void>
	{
		if (!Type.isString(textToCopy))
		{
			return Promise.reject();
		}

		// navigator.clipboard defined only if window.isSecureContext === true
		// so or https should be activated, or localhost address
		if (window.isSecureContext && navigator.clipboard)
		{
			// safari not allowed clipboard manipulation as result of ajax request
			// so timeout is hack for this, to prevent "not have permission"
			return new Promise((resolve, reject) => {
				setTimeout(() => (
					navigator.clipboard
						.writeText(textToCopy)
						.then(() => resolve())
						.catch((e) => reject(e))
				), 0);
			});
		}

		return BX.clipboard?.copy(textToCopy) ? Promise.resolve() : Promise.reject();
	}

	getAnalyticTab(): string
	{
		return Analytics.TAB_LINK;
	}
}

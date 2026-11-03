import { Content } from "./content";
import { Tag, Loc } from "main.core";
import type { ConfigContent } from "../types/content";
import type { ExtranetContentOptions } from "../types/options";

export class ExtranetContent extends Content
{
	articleCode: string = "6770709";

	constructor(options: ExtranetContentOptions) {
		super(options);
		this.setEventNamespace('BX.Intranet.InvitationWidget.ExtranetContent');
	}

	getConfig(): ConfigContent
	{
		return {
			html: this.getLayout(),
			minHeight: '55px',
			sizeLoader: 37,
			marginBottom: 24,
			secondary: true,
		};
	}

	getLayout(): HTMLDivElement
	{
		return this.cache.remember('layout', () => {
			const showInvitationSlider = (event) => {
				event.stopPropagation();
				this.showInvitationPlace(
					Loc.getMessage('INTRANET_INVITATION_WIDGET_DISABLED_TEXT_MSGVER_1'),
					event.currentTarget,
					'extranet'
				);
			}

			const showExtranetHelper = () => {
				BX.Helper.show(`redirect=detail&code=${this.articleCode}`);
				this.sendAnalytics(this.articleCode);
			}
			const inviteActionLabelledBy = [
				'intranet-invitation-widget-extranet-name',
				'intranet-invitation-widget-extranet-invite-action',
			].join(' ');

			return Tag.render`
				<div
					data-id="bx-invitation-widget-content-extranet"
					class="${this.getWrapperClass()}"
					data-testid="intranet-invitation-widget-extranet"
				>
					<div class="intranet-invitation-widget-content">
						<div
							class="intranet-invitation-widget-item-icon intranet-invitation-widget-item-icon--ext"
							aria-hidden="true"
						></div>
						<div class="intranet-invitation-widget-item-content">
							<div class="intranet-invitation-widget-item-name">
								<span id="intranet-invitation-widget-extranet-name">
									${Loc.getMessage('INTRANET_INVITATION_WIDGET_EXTRANET')}
								</span>
							</div>
							<div class="intranet-invitation-widget-item-link">
								<button
									class="intranet-invitation-widget-item-link-text intranet-invitation-widget-item-link-button"
									type="button"
									onclick="${showExtranetHelper}"
									data-testid="intranet-invitation-widget-extranet-details"
								>
									${Loc.getMessage('INTRANET_INVITATION_WIDGET_EXTRANET_DESC')}
								</button>
							</div>
							${this.getCountUserMessage()}
						</div>
					</div>
					<button
						class="intranet-invitation-widget-item-btn"
						type="button"
						onclick="${showInvitationSlider}"
						aria-labelledby="${inviteActionLabelledBy}"
						data-testid="intranet-invitation-widget-extranet-invite"
					>
						<span id="intranet-invitation-widget-extranet-invite-action">
							${Loc.getMessage('INTRANET_INVITATION_WIDGET_INVITE')}
						</span>
					</button>
				</div>
			`;
		});
	}

	getWrapperClass(): string
	{
		return this.cache.remember('wrapper-class', () => {
			const baseClass = 'intranet-invitation-widget-item intranet-invitation-widget-item--wide';

			if (this.getOptions().currentExtranetUserCount > 0)
			{
				return baseClass + ' intranet-invitation-widget-item--active';
			}

			return baseClass;
		});
	}

	getCountUserMessage(): ?HTMLDivElement
	{
		return this.cache.remember('count-user-message', () => {
			if (this.getOptions().currentExtranetUserCount > 0)
			{
				return Tag.render`
					<div class="intranet-invitation-widget-item-ext-users">
						${this.getOptions().currentExtranetUserCountMessage}
					</div>
				`;
			}

			return null;
		});
	}
}

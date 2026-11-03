import { Content } from "./content";
import { Tag, Loc } from "main.core";
import type { InvitationContentOptions } from "../types/options";
import type { ConfigContent } from "../types/content";

export class InvitationContent extends Content
{
	constructor(options: InvitationContentOptions) {
		super(options);
		this.setEventNamespace('BX.Intranet.InvitationWidget.InvitationContent');
		this.setOptions(options);
	}

	getConfig(): ConfigContent
	{
		return {
			html: this.getLayout(),
			backgroundColor: '#14bfd5',
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
					'default-invitation'
				);
			}

			const showInvitationHelper = () => {
				this.showInfoHelper('limit_why_team_invites');
			}

			return Tag.render`
				<div
					data-id="bx-invitation-widget-content-invitation"
					class="intranet-invitation-widget-invite"
					data-testid="intranet-invitation-widget-invitation"
				>
					<div class="intranet-invitation-widget-invite-main">
						<div class="intranet-invitation-widget-inner">
							<div class="intranet-invitation-widget-content">
								<div
									class="intranet-invitation-widget-item-icon intranet-invitation-widget-item-icon--invite"
									aria-hidden="true"
								></div>
								<div class="intranet-invitation-widget-item-content">
									<div class="intranet-invitation-widget-item-name">
										<span>
											${Loc.getMessage('INTRANET_INVITATION_WIDGET_INVITE_EMPLOYEE')}
										</span>
									</div>
									<div class="intranet-invitation-widget-item-link">
										<button
											class="intranet-invitation-widget-item-link-text intranet-invitation-widget-item-link-button"
											type="button"
											onclick="${showInvitationHelper}"
											data-testid="intranet-invitation-widget-invitation-details"
										>
											${Loc.getMessage('INTRANET_INVITATION_WIDGET_DESC')}
										</button>
									</div>
								</div>
							</div>
							<button
								class="intranet-invitation-widget-item-btn intranet-invitation-widget-item-btn--invite"
								type="button"
								onclick="${showInvitationSlider}"
								data-testid="intranet-invitation-widget-invitation-invite"
							>
								${Loc.getMessage('INTRANET_INVITATION_WIDGET_INVITE')}
							</button>
						</div>
					</div>
				</div>
			`;
		});
	}
}

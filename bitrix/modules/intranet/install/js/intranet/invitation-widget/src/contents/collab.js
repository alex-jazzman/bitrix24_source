import { Tag, Loc, Extension } from 'main.core';

import { Analytics } from '../analytics';
import { type ConfigContent } from '../types/content';
import { type CollabContentOptions } from '../types/options';
import { Content } from './content';

export class CollabContent extends Content
{
	articleCode: string;
	#openChat: ?function;

	constructor(options: CollabContentOptions)
	{
		super(options);
		this.setEventNamespace('BX.Intranet.InvitationWidget.CollabContent');

		const settings = Extension.getSettings('intranet.invitation-widget');

		this.isNewProjectsAvailable = settings?.isNewProjectsAvailable;
		this.canCreateProjects = settings?.canCreateProjects;
		this.articleCode = this.isNewProjectsAvailable ? '28397818' : '22706764';
	}

	getConfig(): ConfigContent
	{
		const defaultHtml = this.getOptions().awaitData.then((response) => {
			const { Messenger } = response;
			this.#openChat = () => {
				Messenger.openChatCreation('collab');
				Analytics.sendCreateCollab();
			};

			return this.getLayout();
		});

		const html = (
			this.canCreateProjects
				? defaultHtml
				: (this.isNewProjectsAvailable ? '' : defaultHtml)
		);

		return {
			html,
			minHeight: '55px',
			sizeLoader: 37,
			marginBottom: 24,
			secondary: true,
		};
	}

	getLayout(): HTMLDivElement
	{
		return this.cache.remember('layout', () => {
			const showInvitationSlider = (e) => {
				this.#openChat();
				e.stopPropagation();
			};

			const showCollabHelper = () => {
				BX.Helper.show(`redirect=detail&code=${this.articleCode}`);
				this.sendAnalytics(this.articleCode);
			};

			const itemNameMessage = (
				this.isNewProjectsAvailable
					? Loc.getMessage('INTRANET_INVITATION_WIDGET_PROJECT')
					: Loc.getMessage('INTRANET_INVITATION_WIDGET_COLLAB')
			);

			return Tag.render`
				<div data-id="bx-invitation-widget-content-collab" class="${this.getWrapperClass()} ${this.isNewProjectsAvailable ? '--project' : ''}">
					<div class="intranet-invitation-widget-content">
						<div class="intranet-invitation-widget-item-icon intranet-invitation-widget-item-icon--collab">
							<div class="ui-icon-set --collab"></div>
						</div>
						<div class="intranet-invitation-widget-item-content">
							<div class="intranet-invitation-widget-item-name">
								<span>
									${itemNameMessage}
								</span>
							</div>
							<div class="intranet-invitation-widget-item-link">
								<span onclick="${showCollabHelper}" class="intranet-invitation-widget-item-link-text">
									${
										this.isNewProjectsAvailable
										? Loc.getMessage('INTRANET_INVITATION_WIDGET_PROJECT_DESC')
										: Loc.getMessage('INTRANET_INVITATION_WIDGET_COLLAB_DESC')
									}
								</span>
							</div>
						</div>
					</div>
					<button onclick="${showInvitationSlider}" class="intranet-invitation-widget-item-btn intranet-invitation-widget-item-btn--collab">
						${Loc.getMessage('INTRANET_INVITATION_WIDGET_COLLAB_CREATE')}
					</button>
				</div>
			`;
		});
	}

	getWrapperClass(): string
	{
		return this.cache.remember('wrapper-class', () => {
			return 'intranet-invitation-widget-item intranet-invitation-widget-item--wide intranet-invitation-widget-item--collab';
		});
	}
}

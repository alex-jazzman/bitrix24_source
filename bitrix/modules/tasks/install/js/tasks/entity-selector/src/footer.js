import { DefaultFooter, Dialog } from 'ui.entity-selector';
import { Loc, Tag } from 'main.core';

import './footer.css';

export default class Footer extends DefaultFooter
{
	constructor(dialog: Dialog, options: { [option: string]: any })
	{
		super(dialog, options);

		this.userId = options.userId ? options.userId.toString() : BX.message('USER_ID');
		this.taskId = options.taskId ? options.taskId.toString() : 0;
		this.groupId = options.groupId ? options.groupId.toString() : 0;
	}

	getContent(): HTMLElement | HTMLElement[] | string | null
	{
		if (this.#isFooterTaskTemplate())
		{
			return this.#renderTasksTemplateFooter();
		}

		return this.#renderTasksTagFooter();
	}

	#isFooterTaskTemplate(): boolean
	{
		return [...this.dialog.entities.keys()][0] === 'task-template';
	}

	#isFooterAllTemplates(): boolean
	{
		return [...this.dialog.entities.values()][0].options.isFullListOpenable === true;
	}

	#handleClickOpenerAllTags(data): void
	{
		const {
			userId,
			taskId,
			groupId,
		} = data;

		const queryGroup = groupId ? '?GROUP_ID=' + groupId : '';
		const url = '/company/personal/user/' + userId + '/tasks/tags/' + queryGroup;

		BX.SidePanel.Instance.open(
			url,
			{
				width: 1000,
				requestMethod: 'post',
				requestParams: {
					taskId,
				},
			},
		);
	}

	#handleClickOpenerAllTemplates(data): void
	{
		const {
			userId,
		} = data;
		const url = `/company/personal/user/${userId}/tasks/templates/`;

		BX.SidePanel.Instance.open(
			url,
			{
				newWindowLabel: false,
				copyLinkLabel: false,
			},
		);
	}

	#renderTasksTagFooter(): HTMLElement
	{
		return this.cache.remember('content', () => {
			const data = {
				userId: this.userId,
				taskId: this.taskId,
				groupId: this.groupId,
			};

			return Tag.render`
				<div class="tags-widget-custom-footer">
					<a class="ui-selector-footer-link ui-selector-footer-link-add"  
						id="tags-widget-custom-footer-add-new" hidden="true">
							${Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_CREATE')}
					</a>
					<span class="ui-selector-footer-conjunction" 
						id="tags-widget-custom-footer-conjunction" hidden="true">
							${Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_OR')}
					</span>
					<a
						class="ui-selector-footer-link"
						onclick="${() => this.#handleClickOpenerAllTags(data)}"
					>
							${Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_GET_TAG_SLIDER')}
					</a>
				</div>
			`;
		});
	}

	#renderAllTemplateOpener(): HTMLElement | null
	{
		const data = {
			userId: this.userId,
		};

		return Tag.render`
			<a
				class="ui-selector-footer-link ui-selector-footer-link_separated"
				onclick="${() => this.#handleClickOpenerAllTemplates(data)}"
			>
				${Loc.getMessage('TASKS_ENTITY_SELECTOR_TEMPLATE_FOOTER_OPEN_ALL_TEMPLATES')}
			</a>
		`;
	}

	#renderTasksTemplateFooter(): HTMLElement | null
	{
		if (!this.options.canCreateTemplate)
		{
			return null;
		}

		return Tag.render`
			<a class="ui-selector-footer-link ui-selector-footer-link-add" href="${this.options.templateAddUrl}">
				${Loc.getMessage('TASKS_ENTITY_SELECTOR_TEMPLATE_FOOTER_CREATE_TEMPLATE')}
			</a>
			${this.#isFooterAllTemplates() && this.#renderAllTemplateOpener()}
		`;
	}
}

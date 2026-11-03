import { DefaultFooter, type Dialog } from 'ui.entity-selector';
import { Browser, Event, Loc, Tag, Type } from 'main.core';

import './footer.css';

export default class Footer extends DefaultFooter
{
	constructor(dialog: Dialog, options: { [option: string]: any })
	{
		super(dialog, options);

		this.userId = options.userId ? options.userId.toString() : Loc.getMessage('USER_ID');
		this.taskId = options.taskId ? options.taskId.toString() : 0;
		this.groupId = options.groupId ? options.groupId.toString() : 0;
		this.searchQuery = '';
		this.onCreateTag = Type.isFunction(options.onCreateTag) ? options.onCreateTag : null;
		this.canCreateTag = this.onCreateTag !== null || options.canCreateTag === true;
		this.isKeydownBound = false;

		if (!this.#isFooterTaskTemplate())
		{
			this.dialog.subscribe('onShow', this.#handleDialogShow);
			this.dialog.subscribe('onDestroy', this.#handleDialogDestroy);
		}
	}

	setSearchQuery(query: string): void
	{
		this.searchQuery = Type.isString(query) ? query : '';
		this.#syncTagFooter();
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

		const queryGroup = groupId ? `?GROUP_ID=${groupId}` : '';
		const url = `/company/personal/user/${userId}/tasks/tags/${queryGroup}`;

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

	#handleCreateTag = (): void => {
		this.onCreateTag?.();
	};

	#handleKeyDown = (event: KeyboardEvent): void => {
		if (
			this.onCreateTag !== null
			&& (event.ctrlKey || event.metaKey)
			&& event.key === 'Enter'
			&& this.dialog.getTagSelectorQuery().trim() !== ''
		)
		{
			event.preventDefault();
			this.#handleCreateTag();
		}
	};

	#handleDialogShow = (): void => {
		if (!this.isKeydownBound)
		{
			Event.bind(this.dialog.getContainer(), 'keydown', this.#handleKeyDown);
			this.isKeydownBound = true;
		}
	};

	#handleDialogDestroy = (): void => {
		if (this.isKeydownBound)
		{
			Event.unbind(this.dialog.getContainer(), 'keydown', this.#handleKeyDown);
		}

		this.dialog.unsubscribe('onShow', this.#handleDialogShow);
		this.dialog.unsubscribe('onDestroy', this.#handleDialogDestroy);
	};

	#syncTagFooter(): void
	{
		if (this.onCreateTag === null)
		{
			return;
		}

		const content = this.cache.get('content');
		if (!content)
		{
			return;
		}

		const normalizedQuery = this.searchQuery.trim();
		const isSearching = normalizedQuery !== '';
		content.querySelector('[data-role="tag-footer-default"]').hidden = isSearching;
		content.querySelector('[data-role="tag-footer-create"]').hidden = !isSearching;
		content.querySelector('[data-role="tag-footer-create-label"]').textContent = Loc.getMessage(
			'TASKS_ENTITY_SELECTOR_TAG_FOOTER_CREATE',
			{ '#TAG_NAME#': normalizedQuery },
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
				<div class="tags-widget-custom-footer" data-testid="tasks-tag-selector-footer">
					<div class="tags-widget-custom-footer-state" data-role="tag-footer-default">
						<button
							type="button"
							class="ui-selector-footer-link"
							data-testid="tasks-tag-selector-manage-btn"
							onclick="${() => this.#handleClickOpenerAllTags(data)}"
						>
							${Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_GET_TAG_SLIDER')}
						</button>
						${this.canCreateTag && Tag.render`
							<span class="tags-widget-custom-footer-hint">
								${Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_CREATE_NEW')}
							</span>
						`}
					</div>
					${this.onCreateTag && Tag.render`
						<div class="tags-widget-custom-footer-state" data-role="tag-footer-create" hidden="true">
							<button
								type="button"
								class="ui-selector-footer-link ui-selector-footer-link-add"
								id="tags-widget-custom-footer-add-new"
								data-testid="tasks-tag-selector-create-btn"
								onclick="${this.#handleCreateTag}"
								data-role="tag-footer-create-label"
							></button>
							<span id="tags-widget-custom-footer-conjunction" hidden="true"></span>
							<span class="tags-widget-custom-footer-hint">
								${Browser.isMac() ? '&#8984;+Enter' : Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_CREATE_HINT')}
							</span>
						</div>
					`}
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
				class="ui-selector-footer-link${this.options.canCreateTemplate ? ' ui-selector-footer-link_separated' : ''}"
				onclick="${() => this.#handleClickOpenerAllTemplates(data)}"
			>
				${Loc.getMessage('TASKS_ENTITY_SELECTOR_TEMPLATE_FOOTER_OPEN_ALL_TEMPLATES')}
			</a>
		`;
	}

	#renderTasksTemplateFooter(): HTMLElement | null
	{
		const isFullListOpenable = this.#isFooterAllTemplates();
		if (!this.options.canCreateTemplate && !isFullListOpenable)
		{
			return null;
		}

		return Tag.render`
			${this.options.canCreateTemplate && Tag.render`
				<a class="ui-selector-footer-link ui-selector-footer-link-add" href="${this.options.templateAddUrl}">
					${Loc.getMessage('TASKS_ENTITY_SELECTOR_TEMPLATE_FOOTER_CREATE_TEMPLATE')}
				</a>
			`}
			${isFullListOpenable && this.#renderAllTemplateOpener()}
		`;
	}
}

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, ui_entitySelector, main_core) {
	'use strict';

	class Footer extends ui_entitySelector.DefaultFooter {
		constructor(dialog, options) {
			super(dialog, options);
			this.userId = options.userId ? options.userId.toString() : main_core.Loc.getMessage('USER_ID');
			this.taskId = options.taskId ? options.taskId.toString() : 0;
			this.groupId = options.groupId ? options.groupId.toString() : 0;
			this.searchQuery = '';
			this.onCreateTag = main_core.Type.isFunction(options.onCreateTag) ? options.onCreateTag : null;
			this.canCreateTag = this.onCreateTag !== null || options.canCreateTag === true;
			this.isKeydownBound = false;
			if (!this.#isFooterTaskTemplate()) {
				this.dialog.subscribe('onShow', this.#handleDialogShow);
				this.dialog.subscribe('onDestroy', this.#handleDialogDestroy);
			}
		}
		setSearchQuery(query) {
			this.searchQuery = main_core.Type.isString(query) ? query : '';
			this.#syncTagFooter();
		}
		getContent() {
			if (this.#isFooterTaskTemplate()) {
				return this.#renderTasksTemplateFooter();
			}
			return this.#renderTasksTagFooter();
		}
		#isFooterTaskTemplate() {
			return [...this.dialog.entities.keys()][0] === 'task-template';
		}
		#isFooterAllTemplates() {
			return [...this.dialog.entities.values()][0].options.isFullListOpenable === true;
		}
		#handleClickOpenerAllTags(data) {
			const {
				userId,
				taskId,
				groupId
			} = data;
			const queryGroup = groupId ? `?GROUP_ID=${groupId}` : '';
			const url = `/company/personal/user/${userId}/tasks/tags/${queryGroup}`;
			BX.SidePanel.Instance.open(url, {
				width: 1000,
				requestMethod: 'post',
				requestParams: {
					taskId
				}
			});
		}
		#handleClickOpenerAllTemplates(data) {
			const {
				userId
			} = data;
			const url = `/company/personal/user/${userId}/tasks/templates/`;
			BX.SidePanel.Instance.open(url, {
				newWindowLabel: false,
				copyLinkLabel: false
			});
		}
		#handleCreateTag = () => {
			this.onCreateTag?.();
		};
		#handleKeyDown = event => {
			if (this.onCreateTag !== null && (event.ctrlKey || event.metaKey) && event.key === 'Enter' && this.dialog.getTagSelectorQuery().trim() !== '') {
				event.preventDefault();
				this.#handleCreateTag();
			}
		};
		#handleDialogShow = () => {
			if (!this.isKeydownBound) {
				main_core.Event.bind(this.dialog.getContainer(), 'keydown', this.#handleKeyDown);
				this.isKeydownBound = true;
			}
		};
		#handleDialogDestroy = () => {
			if (this.isKeydownBound) {
				main_core.Event.unbind(this.dialog.getContainer(), 'keydown', this.#handleKeyDown);
			}
			this.dialog.unsubscribe('onShow', this.#handleDialogShow);
			this.dialog.unsubscribe('onDestroy', this.#handleDialogDestroy);
		};
		#syncTagFooter() {
			if (this.onCreateTag === null) {
				return;
			}
			const content = this.cache.get('content');
			if (!content) {
				return;
			}
			const normalizedQuery = this.searchQuery.trim();
			const isSearching = normalizedQuery !== '';
			content.querySelector('[data-role="tag-footer-default"]').hidden = isSearching;
			content.querySelector('[data-role="tag-footer-create"]').hidden = !isSearching;
			content.querySelector('[data-role="tag-footer-create-label"]').textContent = main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_CREATE', {
				'#TAG_NAME#': normalizedQuery
			});
		}
		#renderTasksTagFooter() {
			return this.cache.remember('content', () => {
				const data = {
					userId: this.userId,
					taskId: this.taskId,
					groupId: this.groupId
				};
				return main_core.Tag.render`
				<div class="tags-widget-custom-footer" data-testid="tasks-tag-selector-footer">
					<div class="tags-widget-custom-footer-state" data-role="tag-footer-default">
						<button
							type="button"
							class="ui-selector-footer-link"
							data-testid="tasks-tag-selector-manage-btn"
							onclick="${() => this.#handleClickOpenerAllTags(data)}"
						>
							${main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_GET_TAG_SLIDER')}
						</button>
						${this.canCreateTag && main_core.Tag.render`
							<span class="tags-widget-custom-footer-hint">
								${main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_CREATE_NEW')}
							</span>
						`}
					</div>
					${this.onCreateTag && main_core.Tag.render`
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
								${main_core.Browser.isMac() ? '&#8984;+Enter' : main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_CREATE_HINT')}
							</span>
						</div>
					`}
				</div>
			`;
			});
		}
		#renderAllTemplateOpener() {
			const data = {
				userId: this.userId
			};
			return main_core.Tag.render`
			<a
				class="ui-selector-footer-link${this.options.canCreateTemplate ? ' ui-selector-footer-link_separated' : ''}"
				onclick="${() => this.#handleClickOpenerAllTemplates(data)}"
			>
				${main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TEMPLATE_FOOTER_OPEN_ALL_TEMPLATES')}
			</a>
		`;
		}
		#renderTasksTemplateFooter() {
			const isFullListOpenable = this.#isFooterAllTemplates();
			if (!this.options.canCreateTemplate && !isFullListOpenable) {
				return null;
			}
			return main_core.Tag.render`
			${this.options.canCreateTemplate && main_core.Tag.render`
				<a class="ui-selector-footer-link ui-selector-footer-link-add" href="${this.options.templateAddUrl}">
					${main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TEMPLATE_FOOTER_CREATE_TEMPLATE')}
				</a>
			`}
			${isFullListOpenable && this.#renderAllTemplateOpener()}
		`;
		}
	}

	exports.Footer = Footer;

})(this.BX.Tasks.EntitySelector = this.BX.Tasks.EntitySelector || {}, BX.UI.EntitySelector, BX);
//# sourceMappingURL=tasks-entity-selector.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, ui_entitySelector, main_core) {
	'use strict';

	class Footer extends ui_entitySelector.DefaultFooter {
		constructor(dialog, options) {
			super(dialog, options);
			this.userId = options.userId ? options.userId.toString() : BX.message('USER_ID');
			this.taskId = options.taskId ? options.taskId.toString() : 0;
			this.groupId = options.groupId ? options.groupId.toString() : 0;
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
			const queryGroup = groupId ? '?GROUP_ID=' + groupId : '';
			const url = '/company/personal/user/' + userId + '/tasks/tags/' + queryGroup;
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
		#renderTasksTagFooter() {
			return this.cache.remember('content', () => {
				const data = {
					userId: this.userId,
					taskId: this.taskId,
					groupId: this.groupId
				};
				return main_core.Tag.render`
				<div class="tags-widget-custom-footer">
					<a class="ui-selector-footer-link ui-selector-footer-link-add"  
						id="tags-widget-custom-footer-add-new" hidden="true">
							${main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_CREATE')}
					</a>
					<span class="ui-selector-footer-conjunction" 
						id="tags-widget-custom-footer-conjunction" hidden="true">
							${main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_OR')}
					</span>
					<a
						class="ui-selector-footer-link"
						onclick="${() => this.#handleClickOpenerAllTags(data)}"
					>
							${main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TAG_FOOTER_GET_TAG_SLIDER')}
					</a>
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
				class="ui-selector-footer-link ui-selector-footer-link_separated"
				onclick="${() => this.#handleClickOpenerAllTemplates(data)}"
			>
				${main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TEMPLATE_FOOTER_OPEN_ALL_TEMPLATES')}
			</a>
		`;
		}
		#renderTasksTemplateFooter() {
			if (!this.options.canCreateTemplate) {
				return null;
			}
			return main_core.Tag.render`
			<a class="ui-selector-footer-link ui-selector-footer-link-add" href="${this.options.templateAddUrl}">
				${main_core.Loc.getMessage('TASKS_ENTITY_SELECTOR_TEMPLATE_FOOTER_CREATE_TEMPLATE')}
			</a>
			${this.#isFooterAllTemplates() && this.#renderAllTemplateOpener()}
		`;
		}
	}

	exports.Footer = Footer;

})(this.BX.Tasks.EntitySelector = this.BX.Tasks.EntitySelector || {}, BX.UI.EntitySelector, BX);
//# sourceMappingURL=tasks-entity-selector.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, ui_system_chip_vue, ui_iconSet_api_vue) {
	'use strict';

	// @vue/component
	const CommentFilesChip = {
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		inject: {
			taskId: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				ChipDesign: ui_system_chip_vue.ChipDesign
			};
		},
		methods: {
			handleClick() {
				BX.SidePanel.Instance.open(`tasks-comment-files-${this.taskId}`, {
					width: 800,
					customLeftBoundary: 0,
					customRightBoundary: 0,
					contentCallback: async () => {
						this.content ??= await this.getContent(this.taskId);
						return this.content;
					}
				});
			},
			async getContent(taskId) {
				const response = await BX.ajax.runComponentAction('bitrix:tasks.task', 'getFiles', {
					mode: 'class',
					data: {
						taskId
					}
				});
				if (!response.data?.html) {
					return '';
				}
				const content = document.createElement('div');
				BX.html(null, response.data.asset.join(' ')).then(() => {
					content.innerHTML = response.data.html;
					BX.ajax.processScripts(BX.processHTML(response.data.html).SCRIPT);
				});
				return main_core.Tag.render`
				<div class="tasks-field-comment-files">
					${content}
				</div>
			`;
			}
		},
		template: `
		<Chip
			:text="loc('TASKS_V2_COMMENT_FILES_TITLE_CHIP')"
			:icon="Outline.FILE"
			:design="ChipDesign.ShadowAccent"
			@click="handleClick"
		/>
	`
	};

	exports.CommentFilesChip = CommentFilesChip;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.UI.System.Chip.Vue, BX.UI.IconSet);
//# sourceMappingURL=comment-files.bundle.js.map

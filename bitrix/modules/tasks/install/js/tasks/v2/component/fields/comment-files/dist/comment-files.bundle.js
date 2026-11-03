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
		data() {
			return {
				isPanelShown: false
			};
		},
		watch: {
			isPanelShown() {
				this.syncAria();
			}
		},
		mounted() {
			this.syncAria();
		},
		methods: {
			handleClick() {
				// SliderManager.open() returns false when nothing was opened, but also when the
				// same slider is already on top, so a failed open may not announce the panel as
				// closed either — that stays the job of onClose.
				const isOpened = BX.SidePanel.Instance.open(`tasks-comment-files-${this.taskId}`, {
					width: 800,
					customLeftBoundary: 0,
					customRightBoundary: 0,
					contentCallback: async () => {
						this.content ??= await this.getContent(this.taskId);
						return this.content;
					},
					events: {
						onClose: () => {
							this.isPanelShown = false;
						}
					}
				});
				if (isOpened) {
					this.isPanelShown = true;
				}
			},
			handleKeydown(event) {
				if (event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.handleClick();
			},
			syncAria() {
				const el = this.$refs.chip?.$el;
				if (!el) {
					return;
				}
				main_core.Dom.attr(el, 'role', 'button');
				main_core.Dom.attr(el, 'aria-haspopup', 'dialog');
				main_core.Dom.attr(el, 'aria-expanded', String(this.isPanelShown));
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
			ref="chip"
			class="tasks-field-comment-files-chip"
			data-testid="tasks-comment-files-chip"
			:text="loc('TASKS_V2_COMMENT_FILES_TITLE_CHIP')"
			:icon="Outline.FILE"
			:design="ChipDesign.ShadowAccent"
			@click="handleClick"
			@keydown="handleKeydown"
		/>
	`
	};

	exports.CommentFilesChip = CommentFilesChip;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.UI.System.Chip.Vue, BX.UI.IconSet);
//# sourceMappingURL=comment-files.bundle.js.map

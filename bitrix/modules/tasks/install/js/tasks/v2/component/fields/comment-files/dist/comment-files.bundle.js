/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core,ui_system_chip_vue,ui_iconSet_api_vue) {
	'use strict';

	let _ = t => t,
	  _t;

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
	          var _this$content;
	          (_this$content = this.content) != null ? _this$content : this.content = await this.getContent(this.taskId);
	          return this.content;
	        }
	      });
	    },
	    async getContent(taskId) {
	      var _response$data;
	      const response = await BX.ajax.runComponentAction('bitrix:tasks.task', 'getFiles', {
	        mode: 'class',
	        data: {
	          taskId
	        }
	      });
	      if (!((_response$data = response.data) != null && _response$data.html)) {
	        return '';
	      }
	      const content = document.createElement('div');
	      BX.html(null, response.data.asset.join(' ')).then(() => {
	        content.innerHTML = response.data.html;
	        BX.ajax.processScripts(BX.processHTML(response.data.html).SCRIPT);
	      });
	      return main_core.Tag.render(_t || (_t = _`
				<div class="tasks-field-comment-files">
					${0}
				</div>
			`), content);
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

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX,BX.UI.System.Chip.Vue,BX.UI.IconSet));
//# sourceMappingURL=comment-files.bundle.js.map

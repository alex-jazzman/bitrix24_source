import { Tag } from 'main.core';

import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './comment-files.css';

// @vue/component
export const CommentFilesChip = {
	components: {
		Chip,
	},
	inject: {
		taskId: {},
	},
	setup(): Object
	{
		return {
			Outline,
			ChipDesign,
		};
	},
	methods: {
		handleClick(): void
		{
			BX.SidePanel.Instance.open(`tasks-comment-files-${this.taskId}`, {
				width: 800,
				customLeftBoundary: 0,
				customRightBoundary: 0,
				contentCallback: async (): Promise<HTMLElement> => {
					this.content ??= await this.getContent(this.taskId);

					return this.content;
				},
			});
		},
		async getContent(taskId: number): Promise<HTMLElement | string>
		{
			const response = await BX.ajax.runComponentAction('bitrix:tasks.task', 'getFiles', {
				mode: 'class',
				data: { taskId },
			});

			if (!response.data?.html)
			{
				return '';
			}

			const content = document.createElement('div');
			BX.html(null, response.data.asset.join(' ')).then(() => {
				content.innerHTML = response.data.html;
				BX.ajax.processScripts(BX.processHTML(response.data.html).SCRIPT);
			});

			return Tag.render`
				<div class="tasks-field-comment-files">
					${content}
				</div>
			`;
		},
	},
	template: `
		<Chip
			:text="loc('TASKS_V2_COMMENT_FILES_TITLE_CHIP')"
			:icon="Outline.FILE"
			:design="ChipDesign.ShadowAccent"
			@click="handleClick"
		/>
	`,
};

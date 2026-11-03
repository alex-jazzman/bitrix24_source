import { Tag, Dom } from 'main.core';

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
	data(): Object
	{
		return {
			isPanelShown: false,
		};
	},
	watch: {
		isPanelShown(): void
		{
			this.syncAria();
		},
	},
	mounted(): void
	{
		this.syncAria();
	},
	methods: {
		handleClick(): void
		{
			// SliderManager.open() returns false when nothing was opened, but also when the
			// same slider is already on top, so a failed open may not announce the panel as
			// closed either — that stays the job of onClose.
			const isOpened = BX.SidePanel.Instance.open(`tasks-comment-files-${this.taskId}`, {
				width: 800,
				customLeftBoundary: 0,
				customRightBoundary: 0,
				contentCallback: async (): Promise<HTMLElement> => {
					this.content ??= await this.getContent(this.taskId);

					return this.content;
				},
				events: {
					onClose: () => {
						this.isPanelShown = false;
					},
				},
			});

			if (isOpened)
			{
				this.isPanelShown = true;
			}
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key !== ' ')
			{
				return;
			}

			event.preventDefault();
			this.handleClick();
		},
		syncAria(): void
		{
			const el = this.$refs.chip?.$el;
			if (!el)
			{
				return;
			}

			Dom.attr(el, 'role', 'button');
			Dom.attr(el, 'aria-haspopup', 'dialog');
			Dom.attr(el, 'aria-expanded', String(this.isPanelShown));
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
			ref="chip"
			class="tasks-field-comment-files-chip"
			data-testid="tasks-comment-files-chip"
			:text="loc('TASKS_V2_COMMENT_FILES_TITLE_CHIP')"
			:icon="Outline.FILE"
			:design="ChipDesign.ShadowAccent"
			@click="handleClick"
			@keydown="handleKeydown"
		/>
	`,
};

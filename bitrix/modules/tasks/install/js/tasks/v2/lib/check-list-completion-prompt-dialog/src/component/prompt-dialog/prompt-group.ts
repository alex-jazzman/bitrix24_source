import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Vue as TypographyVue } from 'ui.system.typography';
import { markRaw } from 'ui.vue3';

import { ProgressBar } from 'tasks.v2.component.elements.progress-bar';
import { CheckListBbCode } from 'tasks.v2.lib.check-list-bb-code';
import { type CheckListCompletionGroup } from 'tasks.v2.lib.check-list-completion-prompt';

import { TestId } from './const';

const { HeadlineXs, TextMd, TextSm } = TypographyVue;

type ComponentThis = {
	group: CheckListCompletionGroup,
	formattedTitles: Map<string, string>,
	loc: (code: string, replacements?: Record<string, string | number>) => string,
};

// @vue/component
export const PromptGroup = {
	name: 'TasksCheckListCompletionGroup',
	components: {
		BIcon,
		HeadlineXs,
		ProgressBar,
		TextMd,
		TextSm,
	},
	props: {
		group: {
			/** @type CheckListCompletionGroup */
			type: Object,
			required: true,
		},
	},
	setup(): Object
	{
		return {
			TestId,
			Outline,
		};
	},
	computed: {
		formattedTitles(this: ComponentThis): Map<string, string>
		{
			const titles = [this.group.title, ...this.group.items.map((item) => item.title)];

			return markRaw(new Map(titles.map((title) => [title, CheckListBbCode.formatHtml(title)])));
		},
	},
	methods: {
		formatTitle(this: ComponentThis, title: string): string
		{
			return this.formattedTitles.get(title) ?? '';
		},
	},
	template: `
		<section
			class="tasks-check-list-completion__group"
			:data-testid="TestId.GroupPrefix + '-' + group.id"
		>
			<div class="tasks-check-list-completion__group-header">
				<div class="tasks-check-list-completion__group-title-row">
					<BIcon
						class="tasks-check-list-completion__group-icon"
						:name="Outline.CHECK_LIST"
						:size="22"
						color="var(--ui-color-accent-main-primary)"
						aria-hidden="true"
					/>
					<HeadlineXs
						tag="h3"
						className="tasks-check-list-completion__group-title"
						v-html="formatTitle(group.title)"
					/>
				</div>
				<div class="tasks-check-list-completion__group-progress">
					<TextSm
						tag="p"
						className="tasks-check-list-completion__progress"
						:data-testid="TestId.ProgressPrefix + '-' + group.id"
					>
						{{ loc('TASKS_V2_CHECKLIST_COMPLETE_PROGRESS', { '#COMPLETED#': group.completedCount, '#TOTAL#': group.totalCount }) }}
					</TextSm>
					<ProgressBar
						:totalValue="group.totalCount"
						:completedValue="group.completedCount"
						:width="56"
						:height="5"
						color="var(--ui-color-accent-main-primary-alt)"
						bgColor="var(--ui-color-base-7)"
						:borderRadius="30"
						:data-testid="TestId.ProgressBarPrefix + '-' + group.id"
						aria-hidden="true"
					/>
				</div>
			</div>
			<ul class="tasks-check-list-completion__items">
				<li
					v-for="item in group.items"
					:key="item.id"
					class="tasks-check-list-completion__item"
					:class="{ '--context': item.isContext }"
					:style="{ '--item-depth': item.depth }"
					:aria-level="item.depth + 1"
					:data-testid="TestId.ItemPrefix + '-' + item.id"
				>
					<span class="tasks-check-list-completion__marker" aria-hidden="true">
						<BIcon
							v-if="item.isContext"
							:name="Outline.CHECK_S"
							:size="18"
							color="var(--ui-color-base-4)"
						/>
						<span v-else class="tasks-check-list-completion__dot"></span>
					</span>
					<span v-if="item.isContext" class="tasks-check-list-completion__completed-status">
						{{ loc('TASKS_V2_CHECKLIST_ITEM_COMPLETED') }}
					</span>
					<TextMd
						tag="span"
						className="tasks-check-list-completion__item-label"
						v-html="formatTitle(item.title)"
					/>
				</li>
			</ul>
		</section>
	`,
};

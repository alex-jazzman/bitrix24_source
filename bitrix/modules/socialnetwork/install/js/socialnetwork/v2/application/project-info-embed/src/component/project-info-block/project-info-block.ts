import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { TextSm, TextXs } from 'ui.system.typography.vue';

import { CollapsibleText } from '../collapsible-text/collapsible-text';
import { DatesSection } from '../dates-section/dates-section';
import { TagsSection } from '../tags-section/tags-section';
import { type ProjectDates } from '../../model/project-view-info/types';

import './project-info-block.css';

export const ProjectInfoBlock = defineComponent({
	name: 'SocialnetworkProjectInfoBlock',
	components: {
		TextSm,
		TextXs,
		CollapsibleText,
		DatesSection,
		TagsSection,
	},
	mixins: [locMixin],
	props: {
		goal: {
			type: String,
			default: '',
		},
		description: {
			type: String,
			default: '',
		},
		dates: {
			type: Object as PropType<ProjectDates | null>,
			default: null,
		},
		tags: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
	},
	template: `
		<div class="sonet-project-info-block" data-testid="project-info-block-root">
			<span class="sonet-project-info-block__icon" aria-hidden="true"></span>
			<dl class="sonet-project-info-block__fields">
			<div class="sonet-project-info-block__section --lead" data-testid="project-info-goal">
					<dt class="sonet-project-info-visually-hidden">{{ loc('SONET_PROJECT_INFO_EMBED_SECTION_GOAL') }}</dt>
				<dd class="sonet-project-info-block__value">
					<CollapsibleText v-if="goal" :text="goal" balanced accent/>
					<TextSm v-else class="sonet-project-info-empty">
						{{ loc('SONET_PROJECT_INFO_EMBED_GOAL_EMPTY') }}
					</TextSm>
				</dd>
			</div>
			<div class="sonet-project-info-block__section" data-testid="project-info-description">
				<dt class="sonet-project-info-visually-hidden">{{ loc('SONET_PROJECT_INFO_EMBED_SECTION_DESCRIPTION') }}</dt>
				<dd class="sonet-project-info-block__value">
					<CollapsibleText v-if="description" :text="description"/>
					<TextSm v-else class="sonet-project-info-empty">
						{{ loc('SONET_PROJECT_INFO_EMBED_DESCRIPTION_EMPTY') }}
					</TextSm>
				</dd>
			</div>
			<div class="sonet-project-info-block__section" data-testid="project-info-dates">
				<TextXs tag="dt" accent class="sonet-project-info-block__label">
						{{ loc('SONET_PROJECT_INFO_EMBED_SECTION_DATES') }}
					</TextXs>
				<dd class="sonet-project-info-block__value">
					<DatesSection :dates="dates"/>
				</dd>
			</div>
			<div class="sonet-project-info-block__section" data-testid="project-info-tags">
				<TextXs tag="dt" accent class="sonet-project-info-block__label">
						{{ loc('SONET_PROJECT_INFO_EMBED_SECTION_TAGS') }}
					</TextXs>
				<dd class="sonet-project-info-block__value">
					<TagsSection :tags="tags"/>
				</dd>
			</div>
			</dl>
		</div>
	`,
});

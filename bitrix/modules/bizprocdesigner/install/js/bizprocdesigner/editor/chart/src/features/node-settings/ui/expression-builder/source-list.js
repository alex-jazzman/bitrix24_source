import { Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { BInput, InputSize, InputDesign } from 'ui.system.input.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { TextXs, Text2Xs } from 'ui.system.typography.vue';

import { useLoc } from '../../../../shared/composables';

import { type SourceItem } from './expression-sources';

import './source-list.css';

type Section = {
	id: string,
	title: string,
	items: Array<SourceItem>,
};

// @vue/component
export const SourceList = {
	name: 'ExpressionBuilderSourceList',
	components: { BInput, UiButton, BxTextXs: TextXs, BxText2Xs: Text2Xs },
	props:
	{
		sections:
		{
			type: Array,
			default: (): Array<Section> => [],
		},
		loading:
		{
			type: Boolean,
			default: false,
		},
		// A filled string means the list could not be loaded: shown instead of the empty-state hint,
		// so a failure is not read as «there is nothing here».
		error:
		{
			type: String,
			default: '',
		},
		searchPlaceholder:
		{
			type: String,
			default: '',
		},
		showBack:
		{
			type: Boolean,
			default: false,
		},
	},
	emits: ['select', 'back'],
	setup(): Object
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			InputSize,
			InputDesign,
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): { query: string }
	{
		return {
			query: '',
		};
	},
	computed:
	{
		filteredSections(): Array<Section>
		{
			const needle = this.query.trim().toLowerCase();

			return this.sections.reduce((acc: Array<Section>, section: Section) => {
				const items = needle === ''
					? section.items
					: section.items.filter((item) => this.matches(item, needle));

				if (Type.isArrayFilled(items))
				{
					acc.push({ id: section.id, title: section.title, items });
				}

				return acc;
			}, []);
		},
		hasResults(): boolean
		{
			return this.filteredSections.length > 0;
		},
	},
	watch:
	{
		loading: {
			handler(isLoading: boolean): void
			{
				if (isLoading)
				{
					LiveAnnouncer.announce(
						this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_LOADING'),
					);
				}
			},
			// The list is usually created with the loading already under way.
			immediate: true,
		},
		hasResults(has: boolean): void
		{
			// Announced on the switch only: filtering runs on every keystroke.
			if (!has && !this.loading && !Type.isStringFilled(this.error))
			{
				LiveAnnouncer.announce(this.getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_EMPTY'));
			}
		},
		error(text: string): void
		{
			if (Type.isStringFilled(text))
			{
				LiveAnnouncer.announce(text);
			}
		},
	},
	methods:
	{
		sectionTitleId(sectionId: string): string
		{
			return `bizprocdesigner-expression-builder-source-section-${sectionId}`;
		},
		focusSearch(): void
		{
			this.$refs.search?.focus();
		},
		matches(item: SourceItem, needle: string): boolean
		{
			const title = Type.isStringFilled(item.title) ? item.title.toLowerCase() : '';
			const subtitle = Type.isStringFilled(item.subtitle) ? item.subtitle.toLowerCase() : '';

			return title.includes(needle) || subtitle.includes(needle);
		},
		handleSelect(item: SourceItem): void
		{
			this.$emit('select', item);
		},
		handleBack(): void
		{
			this.$emit('back');
		},
	},
	template: `
		<div class="bizprocdesigner-expression-builder-source-list">
			<div class="bizprocdesigner-expression-builder-source-list__toolbar">
				<UiButton
					v-if="showBack"
					class="bizprocdesigner-expression-builder-source-list__back"
					:text="getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_BACK')"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:dataset="{ testid: 'bizprocdesigner-expression-builder-source-back' }"
					@click="handleBack"
				/>
				<BInput
					ref="search"
					v-model="query"
					class="bizprocdesigner-expression-builder-source-list__search"
					type="search"
					:size="InputSize.Sm"
					:design="InputDesign.Grey"
					:placeholder="searchPlaceholder"
					:ariaLabel="searchPlaceholder"
					stretched
					data-testid="bizprocdesigner-expression-builder-source-search"
				/>
			</div>
			<div
				class="bizprocdesigner-expression-builder-source-list__scroll"
				:aria-busy="loading ? 'true' : null"
				data-testid="bizprocdesigner-expression-builder-source-scroll"
			>
				<BxText2Xs
					v-if="loading"
					tag="p"
					className="bizprocdesigner-expression-builder-source-list__hint"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_LOADING') }}
				</BxText2Xs>
				<BxText2Xs
					v-else-if="error"
					tag="p"
					className="bizprocdesigner-expression-builder-source-list__hint --error"
					data-testid="bizprocdesigner-expression-builder-source-error"
				>
					{{ error }}
				</BxText2Xs>
				<BxText2Xs
					v-else-if="!hasResults"
					tag="p"
					className="bizprocdesigner-expression-builder-source-list__hint"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_EXPRESSION_BUILDER_SOURCE_EMPTY') }}
				</BxText2Xs>
				<div
					v-for="section in filteredSections"
					:key="section.id"
					class="bizprocdesigner-expression-builder-source-list__section"
					:role="section.title ? 'group' : null"
					:aria-labelledby="section.title ? sectionTitleId(section.id) : null"
					:data-testid="'bizprocdesigner-expression-builder-source-section-' + section.id"
				>
					<BxText2Xs
						v-if="section.title"
						:id="sectionTitleId(section.id)"
						tag="p"
						className="bizprocdesigner-expression-builder-source-list__section-title"
					>
						{{ section.title }}
					</BxText2Xs>
					<button
						v-for="item in section.items"
						:key="item.id"
						type="button"
						class="bizprocdesigner-expression-builder-source-list__item"
						:data-testid="'bizprocdesigner-expression-builder-source-item-' + item.id"
						@click="handleSelect(item)"
					>
						<BxTextXs
							tag="span"
							className="bizprocdesigner-expression-builder-source-list__item-title"
						>
							{{ item.title }}
						</BxTextXs>
						<BxText2Xs
							v-if="item.subtitle"
							tag="span"
							className="bizprocdesigner-expression-builder-source-list__item-subtitle"
						>
							{{ item.subtitle }}
						</BxText2Xs>
					</button>
				</div>
			</div>
		</div>
	`,
};

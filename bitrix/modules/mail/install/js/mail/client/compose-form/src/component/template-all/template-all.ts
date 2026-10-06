import { Text } from 'main.core';
import { type PopupOptions } from 'main.popup';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { BInput, InputSize } from 'ui.system.input.vue';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';

import { Phrase } from '../../const';
import {
	createTemplateSearch,
	type TemplateSearchController,
	type TemplateSearchState,
} from '../../feature/search-templates/search-templates';
import {
	createTemplatePreparationController,
	type TemplatePreparationController,
} from '../../feature/template-application/template-application';
import { useComposeEditor } from '../../infrastructure/adapter/editor/editor';
import { loc } from '../../lib/loc/loc';
import { useComposeState } from '../../model/compose/compose';
import { type TemplateListItem } from '../../model/compose/types';

const TestId = Object.freeze({
	screen: 'mail-compose-templates-all',
	search: 'mail-compose-templates-search',
	list: 'mail-compose-templates-list',
	status: 'mail-compose-templates-status',
	empty: 'mail-compose-templates-empty',
	rowName: 'mail-compose-template-row-name',
	rowSubtitle: 'mail-compose-template-row-subtitle',
	retry: 'mail-compose-templates-search-retry',
	loadMore: 'mail-compose-templates-load-more',
	applyRetry: 'mail-compose-templates-apply-retry',
});

const LockIconSize = 20;

// @vue/component
export const TemplateAll = defineComponent({
	name: 'MailComposeTemplateAll',

	components: {
		BIcon,
		BInput,
		Popup,
		TextMd,
		TextXs,
		UiButton,
	},

	props: {
		popupId: {
			type: String,
			default: () => `mail-compose-templates-all-${Text.getRandom()}`,
		},
		formId: {
			type: String,
			required: true,
		},
	},

	emits: ['close', 'select'],

	setup()
	{
		return {
			state: useComposeState(),
			editor: useComposeEditor(),
			loc,
			searchSize: InputSize.Md,
			searchIcon: Outline.SEARCH,
			lockIcon: Outline.LOCK_L,
			lockIconSize: LockIconSize,
			buttonStyle: AirButtonStyle.OUTLINE,
			buttonSize: ButtonSize.SMALL,
			testId: TestId,
		};
	},

	data(): {
		query: string,
		search: TemplateSearchState,
		controller: TemplateSearchController | null,
		selectionController: TemplatePreparationController | null,
		selectionError: boolean,
		isSelectionPending: boolean,
		}
	{
		return {
			query: '',
			search: { items: [], isLoading: false, error: false, nextOffset: null },
			controller: null,
			selectionController: null,
			selectionError: false,
			isSelectionPending: false,
		};
	},

	computed: {
		options(): PopupOptions
		{
			return {
				targetContainer: document.body,
				padding: 0,
				contentPadding: 0,
				closeByEsc: true,
				focusTrap: true,
				ariaLabel: loc(Phrase.TemplatesAllButton),
			};
		},

		searchLabel(): string
		{
			return loc(Phrase.TemplatesSearch);
		},

		isEmpty(): boolean
		{
			return !this.search.isLoading && !this.search.error && this.search.items.length === 0;
		},

		/**
		 * The state of the list for a live region: the branches of the list replace one another silently, so a
		 * screen reader hears nothing of a query that has emptied the list or failed.
		 */
		listStatus(): string
		{
			if (this.search.isLoading)
			{
				return loc(Phrase.TemplatesLoading);
			}

			if (this.search.error)
			{
				return loc(Phrase.TemplatesLoadError);
			}

			if (this.isEmpty)
			{
				return loc(Phrase.TemplatesEmpty);
			}

			return loc(Phrase.TemplatesFoundCount, { '#COUNT#': String(this.search.items.length) });
		},
	},

	watch: {
		query(): void
		{
			this.controller?.search(this.query);
		},
	},

	mounted(): void
	{
		this.controller = createTemplateSearch({ state: this.search });
		this.controller.search(this.query);
	},

	beforeUnmount(): void
	{
		this.controller?.destroy();
		this.selectionController?.destroy();
		this.controller = null;
	},

	methods: {
		rowKey(template: TemplateListItem): string
		{
			return `${template.reference.source}:${template.reference.id}`;
		},

		rowTestId(template: TemplateListItem): string
		{
			return `mail-compose-template-row-${template.reference.source}-${template.reference.id}`;
		},

		/** The subject of the template, and the reason instead of it while the template cannot be applied. */
		subtitle(template: TemplateListItem): string
		{
			if (template.canApply)
			{
				return template.subject;
			}

			return template.disabledReason === 'CRM_CONTEXT_REQUIRED'
				? loc(Phrase.TemplateUnavailableCrmContext)
				: loc(Phrase.TemplateUnavailable);
		},

		handleClear(): void
		{
			this.query = '';
		},

		handleSelect(template: TemplateListItem): void
		{
			if (!template.canApply)
			{
				return;
			}

			this.selectionError = false;
			this.getSelectionController().select(template.reference);
		},

		getSelectionController(): TemplatePreparationController
		{
			this.selectionController ??= createTemplatePreparationController({
				state: this.state,
				editor: this.editor,
				formId: this.formId,
				onPendingChange: (isPending): void => {
					this.isSelectionPending = isPending;
					if (isPending)
					{
						this.selectionError = false;
					}
				},
				onResult: (result): void => {
					this.selectionError = false;
					if (result.status === 'needsDecision')
					{
						this.$emit('select', result.template);
					}
					else if (result.status === 'applied')
					{
						this.$emit('close');
					}
				},
				onError: (): void => {
					this.selectionError = true;
				},
			});

			return this.selectionController;
		},
	},

	template: `
		<Popup :id="popupId" :options="options" @close="$emit('close')">
			<div class="mail-compose-templates-all" :data-testid="testId.screen">
				<BInput
					v-model="query"
					class="mail-compose-templates-all__search"
					:size="searchSize"
					:icon="searchIcon"
					:withClear="query !== ''"
					:placeholder="searchLabel"
					:aria-label="searchLabel"
					:data-testid="testId.search"
					@clear="handleClear"
				/>
				<div
					class="mail-compose-templates-all__status"
					role="status"
					aria-live="polite"
					:data-testid="testId.status"
				>{{ listStatus }}</div>
				<div class="mail-compose-templates-all__list" :data-testid="testId.list">
					<div v-if="selectionError" class="mail-compose-templates-all__state">
						<TextMd>{{ loc('MAIL_COMPOSE_FORM_TEMPLATE_APPLY_ERROR') }}</TextMd>
						<UiButton
							:text="loc('MAIL_COMPOSE_FORM_TEMPLATES_RETRY')"
							:style="buttonStyle"
							:size="buttonSize"
							:loading="isSelectionPending"
							:dataset="{ testid: testId.applyRetry }"
							@click="selectionController?.retry()"
						/>
					</div>
					<TextMd v-if="search.isLoading" className="mail-compose-templates-all__note">
						{{ loc('MAIL_COMPOSE_FORM_TEMPLATES_LOADING') }}
					</TextMd>
					<div v-else-if="search.error" class="mail-compose-templates-all__state">
						<TextMd>{{ loc('MAIL_COMPOSE_FORM_TEMPLATES_LOAD_ERROR') }}</TextMd>
						<UiButton
							:text="loc('MAIL_COMPOSE_FORM_TEMPLATES_RETRY')"
							:style="buttonStyle"
							:size="buttonSize"
							:dataset="{ testid: testId.retry }"
							@click="controller?.retry()"
						/>
					</div>
					<div
						v-else-if="isEmpty"
						class="mail-compose-template-row --locked --empty"
						:data-testid="testId.empty"
					>
						<div class="mail-compose-template-row__title">
							<TextMd
								className="mail-compose-template-row__name"
								wrap="truncate"
								:data-testid="testId.rowName"
							>
								{{ loc('MAIL_COMPOSE_FORM_TEMPLATES_EMPTY') }}
							</TextMd>
						</div>
					</div>
					<button
						v-for="template of search.items"
						:key="rowKey(template)"
						type="button"
						:class="['mail-compose-template-row', { '--locked': !template.canApply }]"
						:aria-disabled="template.canApply ? null : 'true'"
						:data-testid="rowTestId(template)"
						@click="handleSelect(template)"
					>
						<div class="mail-compose-template-row__title">
							<BIcon
								v-if="!template.canApply"
								class="mail-compose-template-row__lock"
								:name="lockIcon"
								:size="lockIconSize"
							/>
							<TextMd
								className="mail-compose-template-row__name"
								wrap="truncate"
								:data-testid="testId.rowName"
							>
								{{ template.title }}
							</TextMd>
						</div>
						<TextXs
							v-if="subtitle(template)"
							className="mail-compose-template-row__text"
							wrap="truncate"
							:data-testid="testId.rowSubtitle"
						>
							{{ subtitle(template) }}
						</TextXs>
					</button>
					<UiButton
						v-if="search.nextOffset !== null && !search.isLoading"
						class="mail-compose-templates-all__more"
						:text="loc('MAIL_COMPOSE_FORM_TEMPLATES_LOAD_MORE')"
						:style="buttonStyle"
						:size="buttonSize"
						:dataset="{ testid: testId.loadMore }"
						@click="controller?.loadMore()"
					/>
				</div>
			</div>
		</Popup>
	`,
});

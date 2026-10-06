import { Loc, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Dialog, type ItemOptions, type TabOptions } from 'ui.entity-selector';
import { OPERATION, SOURCE_ALIAS, SOURCE_ALIASES, splitSource } from 'bizproc.dataview';

import { focusFirstAvailable, isTemplateId } from '../../../shared/utils';
import { useDataViewDefinitionStore } from '../stores/definition-store';
import { useDataViewMetaStore, sourceKey } from '../stores/meta-store';

const SOURCE_ENTITY_ID = 'bizproc-dataview-source';

const VARIABLES_TAB_ID = 'bizproc-variables';
const CONSTANTS_TAB_ID = 'bizproc-constants';

/**
 * Catalog tab of every bizproc variable kind (DTO-03). All of them come from the module the storages
 * come from, so grouping them by module would bury them under the storages tab; the catalog groups
 * them by what they are, variables apart from constants, while the scope a source belongs to (the
 * portal or the edited template) is told by its label.
 */
const VARIABLE_TAB_ID = Object.freeze({
	globalVariable: VARIABLES_TAB_ID,
	globalConstant: CONSTANTS_TAB_ID,
	templateConstant: CONSTANTS_TAB_ID,
});

/** Kinds the edited template owns; every other source of the catalog is portal-wide. */
const TEMPLATE_SCOPED_ENTITIES = Object.freeze(['templateConstant']);

/** Title per catalog tab: an ordinary source is tabbed by its module, a variable by its kind. */
const TAB_TITLE = Object.freeze({
	bizproc: 'BIZPROC_JS_DATAVIEW_SOURCE_TAB_BIZPROC',
	crm: 'BIZPROC_JS_DATAVIEW_SOURCE_TAB_CRM',
	[VARIABLES_TAB_ID]: 'BIZPROC_JS_DATAVIEW_SOURCE_TAB_VARIABLES',
	[CONSTANTS_TAB_ID]: 'BIZPROC_JS_DATAVIEW_SOURCE_TAB_CONSTANTS',
});

/** Source providers are discovered per installed module, so a tab may come from a module named nowhere above. */
const OTHER_TAB_TITLE = 'BIZPROC_JS_DATAVIEW_SOURCE_TAB_OTHER';

/** Loc.getMessage answers undefined for a phrase the extension did not deliver: never show that. */
function resolveMessage(code: ?string, replacements: ?Object = null): string
{
	const text = Type.isStringFilled(code) ? Loc.getMessage(code, replacements) : '';

	return Type.isStringFilled(text) ? text : '';
}

/** Whether the source is one of the bizproc variable kinds the catalog tabs by kind (DTO-03). */
function isVariableSource(descriptor: ?Object): boolean
{
	return Type.isStringFilled(VARIABLE_TAB_ID[descriptor?.entity]);
}

/**
 * The catalog tab a source is listed under: the kind of a bizproc variable, the module of anything
 * else. Grouping reads the descriptor itself and never its place in the catalog. The order API-06
 * returns descriptors in is not a contract.
 */
function sourceTabId(descriptor: ?Object): string
{
	return isVariableSource(descriptor)
		? VARIABLE_TAB_ID[descriptor.entity]
		: String(descriptor?.module ?? '');
}

function tabTitle(tabId: string): string
{
	return resolveMessage(TAB_TITLE[tabId]) || resolveMessage(OTHER_TAB_TITLE);
}

/**
 * The catalog entry behind a source. Two bizproc storages are the same module and entity and differ
 * only by their params, so the entry is matched by the full source key; a source with no entry — an
 * uninstalled module, a storage the user lost access to — is reported as unavailable under whatever
 * title the catalog has for its entity.
 */
export function resolveSourceDescriptor(metaStore: Object, source: ?Object): ?Object
{
	if (!source)
	{
		return null;
	}

	return metaStore.describeSource(source);
}

/** Human label of a source: its catalog title, or the bare entity reference when it has none. */
export function sourceDescriptorTitle(descriptor: ?Object): string
{
	if (descriptor === null)
	{
		return '';
	}

	return Type.isStringFilled(descriptor.title)
		? descriptor.title
		: `${descriptor.module}.${descriptor.entity}`;
}

/**
 * The label a catalog item is listed under. The variable tabs mix the portal's own sources with those
 * of the edited template and the title alone does not say which is which, so a template-owned source
 * is prefixed with its scope. The title itself is shown exactly as the backend sent it: the "default
 * values" marker of a template variable (DTO-03) is already part of it.
 */
function sourceItemTitle(descriptor: ?Object): string
{
	const title = sourceDescriptorTitle(descriptor);
	if (!TEMPLATE_SCOPED_ENTITIES.includes(descriptor?.entity))
	{
		return title;
	}

	return resolveMessage('BIZPROC_JS_DATAVIEW_SOURCE_SCOPE_TEMPLATE', { '#TITLE#': title }) || title;
}

/**
 * The test id an e2e test addresses a catalog item by. The catalog is drawn by ui.entity-selector,
 * whose item nodes carry no native test id (a known canon gap), so this label is hung on the item
 * container from our side ({@see BizprocDataViewSourceSelector.tagCatalogItems}). A source kind that
 * lists more than one entry (a bizproc storage, a bizproc variable) is keyed by what tells its
 * entries apart; a kind that lists a single entry is keyed by its module and entity.
 */
export function sourceItemTestId(descriptor: ?Object): string
{
	return `bizproc-dataview__source-item-${testIdSuffix(descriptor)}`;
}

function testIdSuffix(descriptor: ?Object): string
{
	const storageId = Number(descriptor?.params?.storageTypeId);
	if (Number.isInteger(storageId) && storageId > 0)
	{
		return String(storageId);
	}

	if (!isVariableSource(descriptor))
	{
		return `${descriptor?.module ?? ''}-${descriptor?.entity ?? ''}`;
	}

	// A tab lists many variables of one entity, so the code is what tells them apart; two templates
	// may declare the same code, so a template-owned one carries the template it was declared in.
	const code = String(descriptor.params?.code ?? '');
	const { templateId } = descriptor.params ?? {};

	return isTemplateId(templateId)
		? `${descriptor.entity}-${Number(templateId)}-${code}`
		: `${descriptor.entity}-${code}`;
}

/**
 * The sources a view combines, one row per alias: the leading source and — for a join — the second
 * one. Both are picked from the same catalog, so a bizproc storage and a CRM entity are chosen the
 * same way. Picking a pair the catalog knows a relation between fills the join keys in and says so;
 * everything else about the join (manual keys, columns) stays in the "add parameter" dialog.
 */
// @vue/component
export const SourceSelector = {
	name: 'BizprocDataViewSourceSelector',
	props: {
		/** Localized validation message the backend addressed to `sources`, or '' when there is none. */
		sourcesError: {
			type: String,
			default: '',
		},
		/** Localized validation message the backend addressed to `joinKeys`, or '' when there is none. */
		joinError: {
			type: String,
			default: '',
		},
		/**
		 * Whether the picker offers the pair of sources a merge reads. The parameter dialog asks for it
		 * while the merge is being built, which is before the definition commits to a join.
		 */
		merging: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			definitionStore: useDataViewDefinitionStore(),
			metaStore: useDataViewMetaStore(),
		};
	},
	data(): Object
	{
		return {
			// Whether the join keys currently in the store were put there by the suggestion below.
			isSuggestionApplied: false,
			// Alias whose catalog dropdown is open now — drives aria-expanded on its pick button.
			openAlias: null,
		};
	},
	computed: {
		/**
		 * Whether two sources are being picked: the definition already joins them, or the dialog above is
		 * building the merge that will.
		 */
		isPair(): boolean
		{
			return this.merging || this.definitionStore.operation === OPERATION.JOIN;
		},
		/**
		 * Aliases the pick asks for: a join combines two sources; a projection and an aggregate each
		 * read one.
		 */
		aliases(): Array<string>
		{
			return this.isPair ? [...SOURCE_ALIASES] : [SOURCE_ALIAS.LEADING];
		},
		leadingSource(): ?Object
		{
			return this.sourceByAlias(SOURCE_ALIAS.LEADING);
		},
		secondSource(): ?Object
		{
			return this.sourceByAlias(SOURCE_ALIAS.SECOND);
		},
		/** Changes whenever either side of the pair is replaced — the schemas then have to catch up. */
		pairKey(): string
		{
			return `${sourceKey(this.leadingSource)}|${sourceKey(this.secondSource)}`;
		},
		suggestedPair(): ?Object
		{
			if (!this.leadingSource || !this.secondSource)
			{
				return null;
			}

			return this.metaStore.suggestJoinKeys(this.leadingSource, this.secondSource)[0] ?? null;
		},
		/** The banner explains the keys only while they are the suggested ones. */
		isSuggestionShown(): boolean
		{
			if (!this.isSuggestionApplied || this.suggestedPair === null)
			{
				return false;
			}

			const { leftField, rightField } = this.definitionStore.join;

			return leftField === this.suggestedPair.left && rightField === this.suggestedPair.right;
		},
		suggestionText(): string
		{
			return Loc.getMessage('BIZPROC_JS_DATAVIEW_SOURCE_JOIN_SUGGESTED', {
				'#LEFT#': this.suggestedPair?.left ?? '',
				'#RIGHT#': this.suggestedPair?.right ?? '',
			});
		},
		sectionCaption(): string
		{
			return Loc.getMessage(
				this.aliases.length > 1
					? 'BIZPROC_JS_DATAVIEW_SOURCE_SECTION_LABEL'
					: 'BIZPROC_JS_DATAVIEW_SOURCE_SECTION_LABEL_SINGLE',
			);
		},
	},
	watch: {
		pairKey: {
			immediate: true,
			handler(): void
			{
				this.syncSchemas();
			},
		},
	},
	beforeUnmount(): void
	{
		// A dialog left open when the picker unmounts would keep observing a detached tree, and
		// ui.entity-selector holds every Dialog in a module-level registry until it is destroyed.
		this.unobserveCatalog();
		this.destroyCatalog();
	},
	methods: {
		sourceByAlias(alias: string): ?Object
		{
			return this.definitionStore.sources.find((source) => source.alias === alias) ?? null;
		},
		describe(source: ?Object): ?Object
		{
			return resolveSourceDescriptor(this.metaStore, source);
		},
		sourceTitle(alias: string): string
		{
			return sourceDescriptorTitle(this.describe(this.sourceByAlias(alias)));
		},
		isUnavailable(alias: string): boolean
		{
			return Boolean(this.describe(this.sourceByAlias(alias))?.unavailable);
		},
		aliasLabel(alias: string): string
		{
			// Only a join names its sources first and second; a one-source table just calls it the source.
			if (!this.isPair)
			{
				return Loc.getMessage('BIZPROC_JS_DATAVIEW_SOURCE_LABEL_SINGLE');
			}

			return Loc.getMessage(
				alias === SOURCE_ALIAS.LEADING
					? 'BIZPROC_JS_DATAVIEW_SOURCE_LABEL_LEADING'
					: 'BIZPROC_JS_DATAVIEW_SOURCE_LABEL_SECOND',
			);
		},
		/** Loads the schema of every picked source, then offers the join keys the pair implies. */
		async syncSchemas(): Promise<void>
		{
			this.isSuggestionApplied = false;

			const sources = [this.leadingSource, this.secondSource].filter(Boolean);
			// A source of the edited template describes itself only under that template (API-07); the
			// context is read from the definition rather than kept here, so it can never go stale.
			const { templateId } = this.definitionStore;
			await Promise.all(sources.map((source) => this.metaStore.loadSchema(source, templateId)));

			this.applySuggestion();
		},
		/** Keys already in the definition — hydrated or picked by hand — are never overwritten. */
		applySuggestion(): void
		{
			if (!this.isPair || !this.leadingSource || !this.secondSource)
			{
				return;
			}

			const { leftField, rightField } = this.definitionStore.join;
			if (Type.isStringFilled(leftField) || Type.isStringFilled(rightField))
			{
				return;
			}

			const pair = this.suggestedPair;
			if (pair === null)
			{
				return;
			}

			this.definitionStore.setJoin({ leftField: pair.left, rightField: pair.right });
			this.isSuggestionApplied = true;
		},
		catalogItems(): Array<ItemOptions>
		{
			return this.metaStore.sources.map((descriptor) => ({
				id: sourceKey(descriptor),
				entityId: SOURCE_ENTITY_ID,
				title: sourceItemTitle(descriptor),
				tabs: sourceTabId(descriptor),
				searchable: true,
			}));
		},
		catalogTabs(): Array<TabOptions>
		{
			const tabIds = [...new Set(this.metaStore.sources.map((descriptor) => sourceTabId(descriptor)))];

			return tabIds.map((tabId) => ({
				id: tabId,
				title: tabTitle(tabId),
				icon: 'elements',
				stub: true,
				stubOptions: {
					title: Loc.getMessage('BIZPROC_JS_DATAVIEW_SOURCE_TAB_STUB'),
				},
			}));
		},
		/**
		 * Hangs a stable test id on every catalog item container. ui.entity-selector renders its items
		 * as bare nodes with no native test id, so an e2e test has nothing to address a source by; the
		 * label is applied from our side (testid-canon §4 step 2 for foreign components) and re-applied
		 * idempotently, so a re-render — a search, a tab switch — does not drop it.
		 */
		tagCatalogItems(dialog: Object): void
		{
			const descriptorsByKey = new Map(
				this.metaStore.sources.map((source) => [sourceKey(source), source]),
			);
			dialog.getItems().forEach((item) => {
				const descriptor = descriptorsByKey.get(item.getId());
				if (!descriptor)
				{
					return;
				}

				const testId = sourceItemTestId(descriptor);
				item.getNodes().forEach((node) => {
					const container = node.getContainer();
					if (container && container.dataset.testId !== testId)
					{
						container.dataset.testId = testId;
					}
				});
			});
		},
		/** Keeps the item labels applied across the dialog's own re-renders while it stays open. */
		observeCatalog(dialog: Object): void
		{
			this.unobserveCatalog();

			const container = dialog.getContainer();
			if (!container || typeof MutationObserver === 'undefined')
			{
				return;
			}

			// Watches node additions only: writing data-test-id is an attribute change, so an attribute
			// observer would loop; re-tagging on childList is what survives search filtering and tabs.
			this.catalogObserver = new MutationObserver(() => this.tagCatalogItems(dialog));
			this.catalogObserver.observe(container, { childList: true, subtree: true });
		},
		unobserveCatalog(): void
		{
			if (this.catalogObserver)
			{
				this.catalogObserver.disconnect();
				this.catalogObserver = null;
			}
		},
		destroyCatalog(): void
		{
			// The catalog runs with cacheable: false, so closing its popup already destroys the Dialog
			// (handlePopupDestroy -> destroy), which nulls the instance prototype. Re-destroying that
			// dead reference would throw, so drop it only while it is still alive.
			if (this.catalogDialog && !this.catalogDialog.destroyed)
			{
				this.catalogDialog.destroy();
			}
			this.catalogDialog = null;
		},
		openCatalog(alias: string, event: Event): void
		{
			// ui.entity-selector keeps every Dialog in a module-level registry and hide() only closes
			// the popup, so reopening the catalog would otherwise stack instances. Drop the previous one.
			this.destroyCatalog();

			const dialog = new Dialog({
				targetNode: event.currentTarget,
				width: 400,
				height: 300,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				cacheable: false,
				showAvatars: false,
				compactView: true,
				items: this.catalogItems(),
				tabs: this.catalogTabs(),
				events: {
					onShow: (): void => {
						this.openAlias = alias;
						this.tagCatalogItems(dialog);
						this.observeCatalog(dialog);
					},
					onHide: (): void => {
						this.unobserveCatalog();
						if (this.openAlias === alias)
						{
							this.openAlias = null;
						}
					},
					'Item:onSelect': (selectEvent: BaseEvent): void => {
						const id = selectEvent.getData().item.getId();
						const descriptor = this.metaStore.sources.find((item) => sourceKey(item) === id);
						if (descriptor)
						{
							this.pickSource(alias, descriptor);
						}
					},
				},
			});

			this.catalogDialog = dialog;
			dialog.show();
		},
		/**
		 * Binds a catalog entry to an alias. A bizproc storage additionally keeps its id outside params,
		 * which is how {@see resolveAliasForStorage} and the "add parameter" dialog address it.
		 */
		pickSource(alias: string, descriptor: Object): void
		{
			const params = Type.isPlainObject(descriptor.params) ? { ...descriptor.params } : {};
			const source: Object = {
				alias,
				module: descriptor.module,
				entity: descriptor.entity,
				params,
			};

			const storageId = Number(params.storageTypeId);
			if (Number.isInteger(storageId) && storageId > 0)
			{
				source.storageId = storageId;
			}

			const current = this.sourceByAlias(alias);
			if (current && sourceKey(current) === sourceKey(source))
			{
				return;
			}

			// Replacing a source invalidates everything the old one backed: its columns no longer
			// resolve, and the join keys were picked against its fields.
			this.dropAlias(alias);
			this.definitionStore.setSources([...this.definitionStore.sources, source]);
		},
		/**
		 * The remove button goes away with the source: the focus moves to the button that picks a
		 * source for the same row, or to the last remaining row when the operation drops the row too.
		 */
		removeSource(alias: string): void
		{
			const index = this.aliases.indexOf(alias);
			this.dropAlias(alias);

			// Removing the second source leaves nothing to join by: the table falls back to a plain
			// projection of the one source it still holds. Replacing a source (dropAlias from pickSource)
			// keeps the operation, so this belongs here rather than in dropAlias.
			const { operation, sources } = this.definitionStore;
			if (operation === OPERATION.JOIN && sources.length === 1 && sources[0].alias === SOURCE_ALIAS.LEADING)
			{
				this.definitionStore.setOperation(OPERATION.PROJECT);
			}

			this.$nextTick(() => {
				const buttons = this.$refs.pickButtons ?? [];
				focusFirstAvailable(buttons[index], buttons.at(-1));
			});
		},
		dropAlias(alias: string): void
		{
			this.definitionStore.setSources(
				this.definitionStore.sources.filter((source) => source.alias !== alias),
			);
			this.definitionStore.setColumns(
				this.definitionStore.columns.filter((column) => splitSource(column.source).alias !== alias),
			);
			this.definitionStore.setJoin({ leftField: '', rightField: '' });
			this.isSuggestionApplied = false;
		},
	},
	template: `
		<div data-test-id="bizproc-dataview__sources">
			<span class="bizproc-dataview__caption">{{ sectionCaption }}</span>
			<div class="bizproc-dataview-sources">
				<template v-for="(alias, index) in aliases" :key="alias">
					<span v-if="index > 0" class="bizproc-dataview-sources__plus" aria-hidden="true">+</span>
					<div class="bizproc-dataview-sources__row">
						<button
							ref="pickButtons"
							type="button"
							class="bizproc-dataview-sources__pick"
							:class="{ '--unavailable': isUnavailable(alias) }"
							aria-haspopup="dialog"
							:aria-expanded="openAlias === alias ? 'true' : 'false'"
							:aria-label="aliasLabel(alias)"
							:data-test-id="'bizproc-dataview__source-pick-' + alias"
							@click="openCatalog(alias, $event)"
						>
							<template v-if="sourceTitle(alias) !== ''">{{ sourceTitle(alias) }}</template>
							<span v-else class="bizproc-dataview-sources__placeholder">
								{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SOURCE_PLACEHOLDER') }}
							</span>
						</button>
						<span
							v-if="isUnavailable(alias)"
							class="bizproc-dataview-sources__unavailable"
							role="status"
							:data-test-id="'bizproc-dataview__source-unavailable-' + alias"
						>{{ $Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SOURCE_UNAVAILABLE') }}</span>
						<button
							v-if="sourceByAlias(alias)"
							type="button"
							class="bizproc-dataview-sources__remove"
							:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_SOURCE_REMOVE')"
							:data-test-id="'bizproc-dataview__source-remove-' + alias"
							@click="removeSource(alias)"
						><span aria-hidden="true">&times;</span></button>
					</div>
				</template>
			</div>
			<p
				v-if="isSuggestionShown"
				class="bizproc-dataview-sources__suggestion"
				role="status"
				aria-live="polite"
				data-test-id="bizproc-dataview__join-suggestion"
			>{{ suggestionText }}</p>
			<p
				v-if="sourcesError !== ''"
				class="bizproc-dataview__error"
				role="alert"
				data-test-id="bizproc-dataview__sources-error"
			>{{ sourcesError }}</p>
			<p
				v-if="joinError !== ''"
				class="bizproc-dataview__error"
				role="alert"
				data-test-id="bizproc-dataview__join-error"
			>{{ joinError }}</p>
		</div>
	`,
};

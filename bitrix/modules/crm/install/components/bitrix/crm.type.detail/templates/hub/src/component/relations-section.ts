import { defineComponent, markRaw, type Component, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { TextSm } from 'ui.system.typography.vue';
import { Dialog } from 'ui.entity-selector';
import { type BaseEvent } from 'main.core.events';
import {
	CrmHubCard,
	CrmHubControlRenderer,
	CrmHubFeatureCard,
	type ScalarRecord,
	type SettingsRecord,
} from 'crm.settings-hub';

import {
	applyRelationOption,
	applyRelationScenario,
	availableScenarios,
	buildRelationRows,
	clearRelationRow,
	scenarioOfRow,
	splitRelationRowsByKind,
	type RelationOption,
	type RelationRow,
	type RelationScenario,
} from '../lib/relation-rows/relation-rows';
import {
	readLinkedUserFields,
	readLinkedUserFieldsMeta,
	type HubBaseline,
} from '../lib/hub-baseline/hub-baseline';
import {
	buildLinkedUserFieldRows,
	type LinkedUserFieldRow,
} from '../lib/linked-user-field-rows/linked-user-field-rows';
import {
	filterRevealedSmartProcessRows,
	seedRevealedSmartProcessIds,
	withRevealedSmartProcessId,
} from '../lib/revealed-smart-processes/revealed-smart-processes';
import { buildSmartProcessDialogItems } from '../lib/smart-process-dialog-items/smart-process-dialog-items';
import { resolvePopupAnchor } from '../lib/popup-anchor/popup-anchor';
import { CrmTypeHubRelationRow } from './relation-row';
import {
	SMART_PROCESS_ROWS_CONTROL_ID,
	CRM_CORE_ENTITY_TYPE_IDS,
	LINKED_USER_FIELDS_RECORD_ID,
	PORTAL_MASTER_ROW_ICON,
	PORTAL_ROW_DESCRIPTION,
	PORTAL_ROW_ICON,
	RELATIONS_CARD_ICON,
	RELATIONS_LAYOUT_RECORD_IDS,
	RELATION_ROW_DESCRIPTION,
	RELATION_ROW_ICON,
	SMART_PROCESS_ROW_ICON,
	USE_IN_USERFIELD_RECORD_ID,
} from '../const/relations-layout';
import { type RelationsState } from '../model/type-hub-store';

// Layout of the "Relations" section's "Связи с CRM" card: pivots the store's per-direction relations
// (parent/child, Task 4's buildRelationRows) into one row per CRM core entity type,
// each with up to four sub-options grouped by where the artifact appears. State lives entirely in the
// store — this component only reads `snapshot` and emits the same {id, valueKey, value} shape
// app.ts already routes into store.setRelationDirection, so undo/redo and "Отменить" work for free.
//
// The card's last row, "Другие смарт-процессы", is the same pivot's complement of crmRows (every
// catalog entity that is not a CRM core type): picking one from the entity-selector dialog links it
// exactly like a CRM row does (handleRowToggle), a chip per linked process renders under the
// description, and its own "x" clears the row (clearRelationRow) — no new store logic, only a picker
// UI over the existing pivot. The second card, "Связи по порталу", is separate state: sp-use-in-userfield
// and sp-linked-user-fields have no blocking dependency between them, unlike the prototype — app.ts
// already syncs the two both ways (applyMasterToggle/applyChildToggle) whichever one changes.
//
// Порядок карточек на экране — «Связи с CRM» → «Связи с другими смарт-процессами» → «Привязка к другим
// инструментам» (созвон N460476, ?-06, решение от 2026-09-15). Связи со смарт-процессами настраиваются
// ровно тем же пивотом и теми же чипсами, что и связи с CRM, поэтому стоят рядом; «Привязка к другим
// инструментам» — про другое (доступность смарта в пользовательском поле «Привязка к элементам CRM»,
// на этом же движке работают привязки задач и календаря), поэтому уезжает вниз. Переставлены только
// блоки в шаблоне: card-id у карточек прежние, так что сохранённое состояние сворачивания не поедет.
//
// Схема сверху снята (D-61, 2026-09-17): дерево, ось, три блока-направления и «+ Связь» с экрана
// ушли, и раздел начинается прямо со списка строк. Единицей стала строка: выключенная продаёт связь
// описанием, включённая объясняет себя предложением, раскрытая даёт выбор сценария и прежние чипсы —
// всё это рисует CrmTypeHubRelationRow в слоте #details. Отдельной кнопки добавления нет и не
// нужно: все доступные сущности и так стоят строками, связь заводится тумблером строки.
//
// Каждая строка обязана схлопываться, когда её тумблер выключен: в выключенном виде остаётся заголовок
// с описанием, а чипсы скрыты (BUG-01 того же созвона, 11:07). До правки это соблюдали только строки
// CRM — у «Клиента» и у строк смарт-процессов слот #details рисовался всегда, и выключенная карточка
// оставалась во весь рост рядом со схлопнутым соседом. Поэтому все три слота #details закрыты v-if,
// а не только тот, на котором дефект заметили.
export const CrmTypeHubRelationsSection = defineComponent({
	name: 'CrmTypeHubRelationsSection',
	components: {
		CrmHubCard,
		CrmHubControlRenderer,
		CrmHubFeatureCard,
		CrmTypeHubRelationRow,
		TextSm,
		UiButton,
	},
	mixins: [locMixin],
	inject: {
		hubControlRegistry: { default: null },
	},
	props: {
		records: {
			type: Array as PropType<SettingsRecord[]>,
			default: () => [],
		},
		snapshot: {
			type: Object as PropType<HubBaseline>,
			required: true,
		},
		controls: {
			type: Object as PropType<Record<string, Component>>,
			default: null,
		},
	},
	emits: ['update', 'action'],
	setup(): Object
	{
		return {
			RELATIONS_CARD_ICON,
			PORTAL_MASTER_ROW_ICON,
			SMART_PROCESS_ROW_ICON,
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): { smartProcessDialog: any, revealedSmartProcessIds: number[] }
	{
		// Раскрытия строки больше нет: механика «Вклейки» отменена (D-69), включённая строка сразу
		// показывает и предложение, и сценарий, и миниатюру. Вместе с раскрытием ушёл и
		// expandedRowIds — состояние вида, которое теперь нечему хранить.
		return { smartProcessDialog: null, revealedSmartProcessIds: [] };
	},
	computed: {
		processTitle(): string
		{
			return String(this.snapshot.title ?? '');
		},
		// Pivoted once, split once: crmRows/smartProcessRows below both read off this same computed
		// instead of each independently re-running buildRelationRows and its own filter, so the two
		// lists stay a partition of one pivot by construction (splitRelationRowsByKind) rather than two
		// filters that could drift into overlap or a gap if edited independently of each other.
		relationRowsByKind(): { crmRows: RelationRow[], smartProcessRows: RelationRow[] }
		{
			return splitRelationRowsByKind(
				buildRelationRows(this.snapshot),
				CRM_CORE_ENTITY_TYPE_IDS,
			);
		},
		crmRows(): RelationRow[]
		{
			return this.relationRowsByKind.crmRows;
		},
		// Complement of crmRows: everything that is NOT a CRM core type — the catalog carries several
		// of these, so this row and its picker are populated and working.
		smartProcessRows(): RelationRow[]
		{
			return this.relationRowsByKind.smartProcessRows;
		},
		selectedSmartProcessRows(): RelationRow[]
		{
			return filterRevealedSmartProcessRows(this.smartProcessRows, this.revealedSmartProcessIds);
		},
		useInUserfieldRecord(): ScalarRecord | null
		{
			const record = this.records.find((item) => item.id === USE_IN_USERFIELD_RECORD_ID);

			return (record as ScalarRecord | undefined) ?? null;
		},
		// linkedUserFieldsMeta (name + already-localized title, static) paired with linkedUserFields
		// (the live enabled map) — both live on the baseline, composed once by app.ts. The join itself,
		// including "name missing from the values map => isEnabled === false", is covered on its own
		// in linked-user-field-rows.test.ts.
		linkedUserFieldRows(): LinkedUserFieldRow[]
		{
			const values = readLinkedUserFields(this.snapshot);

			return buildLinkedUserFieldRows(readLinkedUserFieldsMeta(this.snapshot), values);
		},
		// Records the layout does not draw itself: kept so raising SUPPLY_STEP cannot silently drop a
		// record off the screen.
		restRecords(): SettingsRecord[]
		{
			return this.records.filter((record) => !RELATIONS_LAYOUT_RECORD_IDS.includes(record.id));
		},
	},
	created(): void
	{
		this.revealedSmartProcessIds = seedRevealedSmartProcessIds(this.smartProcessRows);

		// Registered under the same hook the imperative controls use (revertForm hands every entry the
		// post-revert baseline): "Отменить" must take back the rows the picker added, and only the store
		// knows which ones survived. Keyed by a literal id — this section is not a descriptor record.
		const registry = this.hubControlRegistry as Record<string, any> | null;
		if (registry)
		{
			registry[SMART_PROCESS_ROWS_CONTROL_ID] = {
				applySnapshot: (baseline: HubBaseline) => {
					this.revealedSmartProcessIds = seedRevealedSmartProcessIds(
						splitRelationRowsByKind(
							buildRelationRows(baseline),
							CRM_CORE_ENTITY_TYPE_IDS,
						).smartProcessRows,
					);
				},
			};
		}
	},
	beforeUnmount(): void
	{
		this.destroySmartProcessDialog();

		const registry = this.hubControlRegistry as Record<string, any> | null;
		if (registry)
		{
			delete registry[SMART_PROCESS_ROWS_CONTROL_ID];
		}
	},
	methods: {
		// The store keeps relations per direction; app.ts routes these two ids to
		// setRelationDirection, so the save payload keeps its original shape.
		emitRelations(state: RelationsState): void
		{
			this.$emit('update', { id: 'sp-relation-parent', valueKey: 'relations', value: state.parent });
			this.$emit('update', { id: 'sp-relation-child', valueKey: 'relations', value: state.child });
		},
		handleOptionToggle(option: RelationOption, checked: boolean): void
		{
			this.emitRelations(applyRelationOption(this.snapshot, option, checked));
		},
		// A click that lands on a row while the picker is open is the click that DISMISSES the picker,
		// not a toggle: main.popup defers autoHide's close() by a macrotask (see the note in
		// openSmartProcessPicker), so this bubble-phase handler still runs, and it used to switch off
		// whatever row happened to sit under the dropdown. The dialog's own selections do not come
		// through here — they call applyRowToggle directly, which is why the guard can be unconditional.
		handleRowToggle(row: RelationRow, checked: boolean): void
		{
			if (this.smartProcessDialog?.isOpen?.())
			{
				return;
			}

			this.applyRowToggle(row, checked);
		},
		applyRowToggle(row: RelationRow, checked: boolean): void
		{
			if (!checked)
			{
				this.emitRelations(clearRelationRow(this.snapshot, row));

				return;
			}

			// Включение строки — это выбор сценария по умолчанию, а не одной опции: главной встаёт
			// сущность CRM, если она вообще умеет быть родителем (сделка, лид, счёт), иначе главным
			// становится процесс (контакт, компания). Сценарий выставляет опции ПАРАМИ, поэтому
			// вкладка приходит вместе с полем и состояния «вкладка без поля» не возникает (S-06).
			const preferred = availableScenarios(row)[0];
			if (preferred)
			{
				// Раскрывать больше нечего: включённая строка показывает всё сразу (D-69). Смысл
				// остался тот же, что и у прежнего expandRow здесь, — человек должен увидеть, что
				// именно он включил, а не искать это вторым кликом.
				this.emitRelations(applyRelationScenario(this.snapshot, row, preferred));
			}
		},
		handleRowScenario(row: RelationRow, scenario: RelationScenario): void
		{
			if (scenarioOfRow(row) === scenario)
			{
				return;
			}

			this.emitRelations(applyRelationScenario(this.snapshot, row, scenario));
		},
		// Icon and description the catalog does not carry: it hands over an entity type id and a title.
		// A type without an entry keeps the generic process glyph and simply has no description — a row
		// that appears on the stand before this map is updated must not lose its switch over it.
		rowIcon(row: RelationRow): string
		{
			return RELATION_ROW_ICON[row.entityTypeId] ?? SMART_PROCESS_ROW_ICON;
		},
		rowDescription(row: RelationRow): string
		{
			return RELATION_ROW_DESCRIPTION[row.entityTypeId] ?? '';
		},
		portalRowIcon(item: LinkedUserFieldRow): string
		{
			return PORTAL_ROW_ICON[item.name] ?? PORTAL_MASTER_ROW_ICON;
		},
		// Ready text, not a phrase code: these four name the process, so the caption has to be built
		// here. A row whose name is not in the map keeps no description at all — same as before.
		portalRowDescription(item: LinkedUserFieldRow): string
		{
			const code = PORTAL_ROW_DESCRIPTION[item.name] ?? '';

			return code === '' ? '' : this.namingProcess(code);
		},
		// The one substitution the whole screen makes: a phrase that quotes the process being
		// configured. Group headings and chips do it inline because they first have to decide WHICH
		// name goes in; here the name is never in question, so it is one call.
		namingProcess(code: string): string
		{
			return (this.loc(code) ?? '').replace('#TITLE#', String(this.snapshot.title ?? ''));
		},
		openSmartProcessPicker(): void
		{
			// Guards the disabled button too: BX.UI.Button already blocks the click, this is only a
			// defensive no-op against an empty catalog opening an empty dialog.
			if (this.smartProcessRows.length === 0)
			{
				return;
			}

			// A second click while the dialog is open just closes it — the same toggle
			// custom-section-control.ts's openSelector() does. Rebuilding below would otherwise destroy
			// the open dialog and immediately reopen it instead of closing, dropping whatever the user
			// had typed into the search box.
			if (this.smartProcessDialog?.isOpen?.())
			{
				this.smartProcessDialog.hide?.();

				return;
			}

			// No real anchor, no dialog: an unresolved anchor (task-9a-brief.md) would otherwise
			// either crash main.popup or float unanchored — both worse than a no-op click.
			const targetNode = resolvePopupAnchor(this.$refs.spPickerAnchor);
			if (!targetNode)
			{
				return;
			}

			// Destroy-then-recreate on every OPEN (closing no longer destroys it — see the toggle branch
			// above), seeded from the current store snapshot, rather than keep one dialog around and
			// resync it: the dialog physically cannot drift from the store between opens, so "Отменить"
			// (which only reverts the store) already restores this row for free — no control registry, no
			// applySnapshot/reset (task-9b-brief.md, decision 5). One consequence: a dialog left open does
			// not see a row flip from outside it (the chip's "×", "Отменить") until closed and reopened —
			// unreachable in practice, though: reaching either one first clicks outside the dropdown, and
			// that same click closes the dialog a tick later, not immediately. main.popup's autoHide there
			// is a capture-phase listener on the document, but Dialog builds Popup from a single options
			// object (ui/install/js/ui/entity-selector/src/dialog/dialog.ts), so compatibleMode is false
			// and Popup#_tryCloseByEvent defers close() with setTimeout(…, 0) instead of calling it inline
			// (main/install/js/main/popup/src/popup/popup.js). The chip and "Отменить" handlers — bubble
			// phase, same click — still run against the still-open dialog; it closes only on the next
			// macrotask. (The toggle branch above relies on this same deferral: isOpen() is still true
			// when that click's own handler runs.)
			this.destroySmartProcessDialog();

			const rows = this.smartProcessRows;
			const rowsByItemId = new Map(rows.map((row) => [String(row.entityTypeId), row]));
			const toggleByItemId = (itemId: number | string, checked: boolean) => {
				const row = rowsByItemId.get(String(itemId));
				if (row)
				{
					// Picking a process is what puts its row on screen; unpicking only switches the link off
					// and leaves the row, exactly like its own switch does.
					if (checked)
					{
						this.revealedSmartProcessIds = withRevealedSmartProcessId(
							this.revealedSmartProcessIds,
							row.entityTypeId,
						);
					}

					this.applyRowToggle(row, checked);
				}
			};

			const { items, selectedItems } = buildSmartProcessDialogItems(rows);
			this.smartProcessDialog = markRaw(new Dialog({
				targetNode,
				multiple: true,
				dropdownMode: true,
				enableSearch: true,
				showAvatars: false,
				height: 200,
				items,
				selectedItems,
				events: {
					'Item:onSelect': (event: BaseEvent) => toggleByItemId(event.getData().item.getId(), true),
					'Item:onDeselect': (event: BaseEvent) => toggleByItemId(event.getData().item.getId(), false),
				},
			}));
			this.smartProcessDialog.show();
		},
		destroySmartProcessDialog(): void
		{
			this.smartProcessDialog?.destroy?.();
			this.smartProcessDialog = null;
		},
		// sp-use-in-userfield is a plain scalar record (valueKey: isUseInUserfieldEnabled): app.ts's
		// generic handleUpdate tail already syncs the linkedUserFields children on it via
		// applyMasterToggle, so this only has to emit the same {id, valueKey, value} shape every other
		// scalar row in this hub emits.
		handleUseInUserfieldToggle(checked: boolean): void
		{
			if (this.useInUserfieldRecord)
			{
				this.$emit('update', {
					id: this.useInUserfieldRecord.id,
					valueKey: this.useInUserfieldRecord.valueKey,
					value: checked,
				});
			}
		},
		// app.ts's `sp-linked-user-fields` branch expects the full values map (not just the one that
		// changed) and syncs the master flag itself via applyChildToggle — like the sp-relation-* ids
		// above, it returns before the generic `if (valueKey)` tail ever reads valueKey. Set anyway,
		// for the same reason emitRelations sets it above for sp-relation-*: every update this
		// component emits keeps the same {id, valueKey, value} shape, so if this id branch is ever
		// dropped or reordered, the generic tail still writes the map to the right store field
		// (setField('linkedUserFields', …)) instead of silently discarding the update.
		handleLinkedUserFieldToggle(item: { name: string }, checked: boolean): void
		{
			const values = readLinkedUserFields(this.snapshot);
			this.$emit('update', {
				id: LINKED_USER_FIELDS_RECORD_ID,
				valueKey: 'linkedUserFields',
				value: { ...values, [item.name]: checked },
			});
		},
	},
	template: `
		<div class="crm-type-hub-relations">
			<CrmHubCard
				card-id="relations-crm"
				title="CRM_TYPE_DETAIL_HUB_RELATIONS_CRM_TITLE"
				:icon="RELATIONS_CARD_ICON.Crm"
				collapsible
			>
				<div class="crm-type-hub-cards-intro">
					<TextSm class="crm-type-hub-card-intro">{{ loc('CRM_TYPE_DETAIL_HUB_RELATIONS_CRM_INTRO') }}</TextSm>
				</div>
				<div class="crm-type-hub-feature-rows">
					<CrmHubFeatureCard
						v-for="row in crmRows"
						:key="row.entityTypeId"
						:feature-id="'relation-' + row.entityTypeId"
						:title-text="row.title"
						:description="row.checked ? '' : rowDescription(row)"
						:icon="rowIcon(row)"
						:checked="row.checked"
						@update="handleRowToggle(row, $event)"
					>
						<template v-if="row.checked" #details>
							<CrmTypeHubRelationRow
								:row="row"
								:process-title="processTitle"
								@scenario="handleRowScenario(row, $event)"
								@option="handleOptionToggle($event.option, $event.checked)"
							/>
						</template>
					</CrmHubFeatureCard>
				</div>
			</CrmHubCard>
			<CrmHubCard
				card-id="relations-sp"
				title="CRM_TYPE_DETAIL_HUB_RELATIONS_SP_TITLE"
				:icon="SMART_PROCESS_ROW_ICON"
				collapsible
			>
				<div class="crm-type-hub-cards-intro">
					<TextSm class="crm-type-hub-card-intro">{{ loc('CRM_TYPE_DETAIL_HUB_RELATIONS_SP_INTRO') }}</TextSm>
				</div>
				<div v-if="selectedSmartProcessRows.length" class="crm-type-hub-feature-rows">
					<CrmHubFeatureCard
						v-for="row in selectedSmartProcessRows"
						:key="row.entityTypeId"
						:feature-id="'relation-' + row.entityTypeId"
						:title-text="row.title"
						:icon="SMART_PROCESS_ROW_ICON"
						:checked="row.checked"
						@update="handleRowToggle(row, $event)"
					>
						<template v-if="row.checked" #details>
							<CrmTypeHubRelationRow
								:row="row"
								:process-title="processTitle"
								@scenario="handleRowScenario(row, $event)"
								@option="handleOptionToggle($event.option, $event.checked)"
							/>
						</template>
					</CrmHubFeatureCard>
				</div>
				<div class="crm-type-hub-relation-sp-picker">
					<span ref="spPickerAnchor">
						<UiButton
							:text="loc('CRM_TYPE_DETAIL_HUB_RELATIONS_SP_ACTION')"
							:size="ButtonSize.MEDIUM"
							:style="AirButtonStyle.OUTLINE_NO_ACCENT"
							:left-icon="'plus-l'"
							:disabled="!smartProcessRows.length"
							:dataset="{ testid: 'crm-type-detail-hub-relation-other-sp-btn' }"
							@click="openSmartProcessPicker"
						/>
					</span>
				</div>
			</CrmHubCard>
			<CrmHubCard
				card-id="relations-portal"
				title="CRM_TYPE_DETAIL_HUB_RELATIONS_PORTAL_TITLE"
				:icon="RELATIONS_CARD_ICON.Portal"
				collapsible
			>
				<div class="crm-type-hub-cards-intro">
					<TextSm class="crm-type-hub-card-intro">{{ loc('CRM_TYPE_DETAIL_HUB_RELATIONS_PORTAL_INTRO') }}</TextSm>
				</div>
				<div class="crm-type-hub-feature-rows">
					<CrmHubFeatureCard
						v-if="useInUserfieldRecord"
						feature-id="relation-use-in-userfield"
						:title="useInUserfieldRecord.title"
						:description-text="namingProcess('CRM_TYPE_DETAIL_HUB_RELATION_ROW_CRM_ITEMS')"
						:icon="PORTAL_MASTER_ROW_ICON"
						:checked="Boolean(snapshot[useInUserfieldRecord.valueKey])"
						@update="handleUseInUserfieldToggle"
					/>
					<CrmHubFeatureCard
						v-for="item in linkedUserFieldRows"
						:key="item.name"
						:feature-id="'relation-uf-' + item.name"
						:title-text="item.title"
						:description-text="portalRowDescription(item)"
						:icon="portalRowIcon(item)"
						:checked="item.isEnabled"
						@update="handleLinkedUserFieldToggle(item, $event)"
					/>
				</div>
			</CrmHubCard>
			<CrmHubCard v-if="restRecords.length" card-id="relations-rest">
				<CrmHubControlRenderer
					v-for="record in restRecords"
					:key="record.id"
					:descriptor="record"
					:snapshot="snapshot"
					:controls="controls"
					@update="$emit('update', $event)"
					@action="$emit('action', $event)"
				/>
			</CrmHubCard>
		</div>
	`,
});

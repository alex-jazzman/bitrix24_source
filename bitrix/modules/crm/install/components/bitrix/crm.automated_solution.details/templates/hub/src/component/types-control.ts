import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { useStore } from 'ui.vue3.vuex';
import { type BaseEvent } from 'main.core.events';
import { Loc } from 'main.core';
import { Dictionary } from 'crm.integration.analytics';
import { Router } from 'crm.router';
import { sendData as sendAnalyticsData } from 'ui.analytics';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Dialog } from 'ui.entity-selector';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { CrmHubFeatureCard, type RelationRecord } from 'crm.settings-hub';

import { createSaveAnalyticsBuilder } from '../lib/save-analytics';
import { computeTypesLocks, type TypesLocks } from '../lib/read-only/read-only';
import { runInternalSave } from '../lib/internal-save/internal-save';
import { isCreateMode, isCreateTypeLocked } from '../lib/create-mode/create-mode';
import { buildReloadQuery } from '../lib/slider-reload/slider-reload';
import { buildTypeRows, type TypeRow } from '../lib/type-rows/type-rows';
import { seedRevealedTypeIds, withRevealedTypeId } from '../lib/revealed-types/revealed-types';
import { seedTypeTitles, withTypeTitle, type TypeTitles } from '../lib/type-titles/type-titles';
import { buildPickerEntityOptions } from '../lib/type-picker-options/type-picker-options';
import {
	applyTypesSnapshot,
	captureTypesSnapshot,
	rebaseTypesSnapshot,
	type TypesControlSnapshot,
} from '../lib/types-snapshot/types-snapshot';
import { RecoverSolution } from '../feature/recover-solution';
// Навигация слайдера — одна на весь шаблон и живёт рядом с closeSliderOrRedirect: она зовёт Router,
// которому в src/lib не место (рантайм-импорт экстеншна валит тест-прогон, D-10). Импорт идёт в одну
// сторону — контрол знает фичу, фича о контроле не знает.
import { reloadWithNewUri } from '../feature/save-solution';

// Иконка строки. Размерных глифов без префикса 'o-' в наборе Outline нет; неверное имя Битрикс
// отсеивает молча, пустым местом.
const TYPE_ROW_ICON = 'o-smart-process';

// Раздел «Смарт-процессы» на механике карточки relations-sp СП-хаба (D-14): строка = привязанный
// СП, тумблер = привязка. Выключение отвязывает тип, но строку с экрана НЕ убирает — она остаётся
// выключенной, ровно как у эталона. Под строками одна кнопка выбора (один диалог на оба прежних
// каталога) и отдельная кнопка создания: создание — действие, а не привязка.
//
// Бэка эта перекладка не требует: отвязка и сегодня выражается удалением из automatedSolution.typeIds,
// диалог ходит в тот же провайдер dynamic_type, что и прежние два поля. Новое здесь ровно одно —
// клиентское состояние «какие строки показаны», которого стор не знает, потому что выключенная
// строка это тип, которого в typeIds нет.
export const CrmHubCrmTypesControl = defineComponent({
	name: 'CrmHubCrmTypesControl',
	components: { CrmHubFeatureCard, UiButton },
	inject: {
		hubControlRegistry: { default: null },
		hubCommitSnapshot: { default: null },
		hubReportSaveFailure: { default: null },
		hubIsCreateMode: { default: null },
	},
	props: {
		descriptor: {
			type: Object as PropType<RelationRecord>,
			required: true,
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		reason: {
			type: String,
			default: '',
		},
	},
	emits: ['update', 'action'],
	setup()
	{
		const store = useStore();

		// Замок читается по той же ЗАЩЁЛКЕ, что и у приложения: состояние берётся один раз, при
		// монтировании (App.start диспатчит setState до mount), и дальше не пересчитывается. Реактивный
		// признак снялся бы сразу после сохранения — ещё до навигации — и вернул бы ровно ту готчу,
		// ради которой замок и ставится.
		// Without the app latch (hubIsCreateMode) the control keeps its own one.
		const isCreateModeOnMount = isCreateMode(store.state);

		return {
			store,
			isCreateModeOnMount,
			TYPE_ROW_ICON,
			AirButtonStyle,
			ButtonSize,
		};
	},
	data()
	{
		return {
			// Диалог живёт в слое попапов, вне этого поддерева, поэтому он markRaw и убирается руками.
			typeDialog: null as any,
			revealedTypeIds: [] as number[],
			typeTitles: {} as TypeTitles,
		};
	},
	computed: {
		// The app latch leaves the creation mode after an add that failed with the created id.
		isTypeCreationLocked(): boolean
		{
			const readCreateMode = this.hubIsCreateMode as (() => boolean) | null;

			return isCreateTypeLocked(readCreateMode ? readCreateMode() : this.isCreateModeOnMount);
		},
		rows(): TypeRow[]
		{
			return buildTypeRows(
				this.revealedTypeIds,
				this.store.state.automatedSolution.typeIds,
				this.typeTitles,
			);
		},
		locks(): TypesLocks
		{
			return computeTypesLocks(this.readOnly, this.store.state.permissions);
		},
		isShowPermissionsResetAlert(): boolean
		{
			if (!this.store.state.isPermissionsLayoutV2Enabled)
			{
				return false;
			}

			const currentTypeIds: number[] = [...this.store.state.automatedSolution.typeIds];
			const originallyTypeIds: number[] = [...this.store.state.automatedSolutionOrigTypeIds];

			return currentTypeIds.some((id) => !originallyTypeIds.includes(id))
				|| originallyTypeIds.some((id) => !currentTypeIds.includes(id));
		},
	},
	// Засев в created(), а не в mounted(): первый рендер идёт между ними, и строки должны быть
	// на месте сразу, без кадра с пустым разделом. Родительский app.ts снимает базовую линию в своём
	// mounted(), то есть уже после этого — реестр к тому моменту заполнен.
	created(): void
	{
		this.typeTitles = seedTypeTitles(this.store.state.dynamicTypesTitles);
		this.revealedTypeIds = seedRevealedTypeIds(this.store.state.automatedSolution.typeIds);
		this.registerInRegistry();
	},
	beforeUnmount(): void
	{
		this.unregisterFromRegistry();
		this.destroyTypeDialog();
	},
	methods: {
		// Клик, попавший в строку при открытом диалоге, — это клик, КОТОРЫЙ ДИАЛОГ ЗАКРЫВАЕТ:
		// main.popup откладывает close() автоскрытия на макротаск, поэтому обработчик всплытия
		// успевает отработать и без этого гарда переключил бы строку, оказавшуюся под выпадашкой.
		// Выборы самого диалога сюда не приходят — они идут через handlePickerToggle.
		handleRowToggle(row: TypeRow, checked: boolean): void
		{
			if (this.typeDialog?.isOpen?.())
			{
				return;
			}

			if (this.locks.rowsLocked)
			{
				return;
			}

			this.store.dispatch(checked ? 'addTypeId' : 'removeTypeId', row.typeId);
		},
		openTypePicker(): void
		{
			if (this.locks.pickerLocked)
			{
				return;
			}

			// Второй клик по кнопке при открытом диалоге просто закрывает его. Пересборка ниже иначе
			// уничтожила бы открытый диалог и тут же открыла заново вместо закрытия, потеряв набранный
			// в поиске текст.
			if (this.typeDialog?.isOpen?.())
			{
				this.typeDialog.hide?.();

				return;
			}

			const anchor: any = this.$refs.pickerAnchor;
			const targetNode = anchor?.$el ?? anchor;
			if (!targetNode)
			{
				return;
			}

			// Пересоздаём на каждое ОТКРЫТИЕ от текущего состояния стора, а не держим один диалог и
			// синхронизируем его: так он физически не может разъехаться со стором, и «Отменить»
			// (который правит только стор) чинит его бесплатно — ни реестра, ни applySnapshot для него.
			this.destroyTypeDialog();

			const boundTypeIds: number[] = [...this.store.state.automatedSolution.typeIds];

			this.typeDialog = markRaw(new Dialog({
				targetNode,
				multiple: true,
				dropdownMode: true,
				enableSearch: true,
				showAvatars: false,
				height: 200,
				context: 'crm.automated_solutions.details',
				entities: [
					{
						id: 'dynamic_type',
						dynamicLoad: true,
						dynamicSearch: true,
						options: buildPickerEntityOptions(this.store.state.permissions),
					},
				],
				// Привязанные приходят выбранными: диалог доберёт их через getItems() провайдера.
				// Событий выбора это НЕ поднимает — preselected идут через item.select(true), а
				// совместимая сигнатура трактует boolean как emitEvents: false. Даже если бы поднимало,
				// вреда нет: мутация addTypeId на уже привязанном типе выходит до записи и форму
				// грязной не делает.
				preselectedItems: boundTypeIds.map((typeId) => ['dynamic_type', typeId]),
				events: {
					'Item:onSelect': (event: BaseEvent) => this.handlePickerToggle(event, true),
					'Item:onDeselect': (event: BaseEvent) => this.handlePickerToggle(event, false),
				},
			} as any));
			this.typeDialog.show();
		},
		// Выбор в диалоге — это то, что выводит строку на экран; снятие только выключает привязку
		// и строку ОСТАВЛЯЕТ, ровно как её собственный тумблер.
		handlePickerToggle(event: BaseEvent, checked: boolean): void
		{
			const { item } = event.getData();
			const typeId = Number(item.getId());
			if (!Number.isInteger(typeId) || typeId <= 0)
			{
				return;
			}

			if (!checked)
			{
				this.store.dispatch('removeTypeId', typeId);

				return;
			}

			// Название берём у элемента диалога: в dynamicTypesTitles его нет — стор знает названия
			// только уже привязанных типов, и обнуляется на каждом сохранении.
			this.typeTitles = withTypeTitle(this.typeTitles, typeId, String(item.getTitle() ?? ''));
			this.revealedTypeIds = withRevealedTypeId(this.revealedTypeIds, typeId);
			this.store.dispatch('addTypeId', typeId);
		},
		destroyTypeDialog(): void
		{
			this.typeDialog?.destroy?.();
			this.typeDialog = null;
		},
		handleCreateTypeClick(): void
		{
			// Второй замок режима создания, независимый от CSS. Ветка ниже на несохранённой записи
			// ведёт в MessageBox.confirm -> runInternalSave, то есть кнопка МОЛЧА создаёт рабочее
			// место в обход кнопки героя. Визуально её закрывает `inert` секции, но на браузере без
			// поддержки inert экран лишь выглядел бы погашённым при живых контролах. Подпись и вид
			// кнопки не меняются: новых `disabled` режим создания не добавляет.
			if (this.isTypeCreationLocked)
			{
				return;
			}

			// Until the failed save is read back the form has no baseline to save over.
			if (RecoverSolution.isPending(this.store.state))
			{
				return;
			}

			if (this.store.getters.isSaved)
			{
				this.openTypeCreationSlider();

				return;
			}

			MessageBox.confirm(
				Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_NEED_SAVE_POPUP_MESSAGE') ?? '',
				(messageBox: any) => {
					return this.save()
						.then(() => this.openTypeCreationSlider())
						.finally(() => messageBox.close());
				},
				Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_NEED_SAVE_POPUP_YES_CAPTION') ?? '',
			);
		},
		openTypeCreationSlider(): void
		{
			void (Router.Instance as any).openTypeDetail(
				0,
				null,
				{
					automatedSolutionId: this.store.state.automatedSolution.id,
					activeTabId: 'common',
					isExternal: 'Y',
				},
			).then(() => {
				// Перезагрузка и выбор раздела — общие с сохранением: навигация живёт в feature
				// (единственная копия, она же нужна после создания рабочего места), решение «какой
				// раздел» — в чистом lib/slider-reload и покрыто юнитами.
				reloadWithNewUri(this.store.state.automatedSolution.id, buildReloadQuery());
			});
		},
		save(): Promise<void>
		{
			const builder = createSaveAnalyticsBuilder(this.store)
				.setElement(Dictionary.ELEMENT_SAVE_IS_REQUIRED_TO_PROCEED_POPUP);

			return runInternalSave({
				dispatchSave: () => this.store.dispatch('save', { readOnly: this.readOnly }),
				commitSnapshot: () => this.commitHubSnapshot(),
				reportSuccess: () => {
					sendAnalyticsData(
						builder
							.setStatus(Dictionary.STATUS_SUCCESS)
							.setId(this.store.state.automatedSolution.id)
							.buildData(),
					);
				},
				reportError: () => {
					sendAnalyticsData(
						builder
							.setStatus(Dictionary.STATUS_ERROR)
							.setId(this.store.state.automatedSolution.id)
							.buildData(),
					);

					this.reportHubSaveFailure();
				},
			});
		},
		// The same report as the panel save gives: the App decides whether the form leaves the creation mode.
		reportHubSaveFailure(): void
		{
			const reportSaveFailure = this.hubReportSaveFailure as (() => void) | null;
			reportSaveFailure?.();
		},
		// The App owns the baseline snapshot, so an internal save reports itself through the callback the
		// form provides instead of touching the App state from here.
		commitHubSnapshot(): void
		{
			const commitSnapshot = this.hubCommitSnapshot as (() => void) | null;
			commitSnapshot?.();
		},
		captureSnapshot(): TypesControlSnapshot
		{
			return captureTypesSnapshot(this.revealedTypeIds, this.typeTitles);
		},
		applySnapshot(snapshot: TypesControlSnapshot | null): void
		{
			const restored = applyTypesSnapshot(snapshot);
			this.revealedTypeIds = restored.revealedTypeIds;
			this.typeTitles = restored.titles;
		},
		// The rows of the baseline a partial save leaves: taken from the previous one, not from the rows on screen.
		rebaseSnapshot(previous: TypesControlSnapshot | null, serverTypeIds: number[]): TypesControlSnapshot
		{
			return rebaseTypesSnapshot(previous, serverTypeIds, this.typeTitles);
		},
		registerInRegistry(): void
		{
			const registry = this.hubControlRegistry as Record<string, any> | null;
			if (registry)
			{
				registry[this.descriptor.id] = {
					captureSnapshot: () => this.captureSnapshot(),
					applySnapshot: (snapshot: TypesControlSnapshot) => this.applySnapshot(snapshot),
					rebaseSnapshot: (previous: TypesControlSnapshot | null, serverTypeIds: number[]) => {
						return this.rebaseSnapshot(previous, serverTypeIds);
					},
				};
			}
		},
		unregisterFromRegistry(): void
		{
			const registry = this.hubControlRegistry as Record<string, any> | null;
			if (registry)
			{
				delete registry[this.descriptor.id];
			}
		},
	},
	template: `
		<div class="crm-automated-solution-hub-types">
			<div v-if="rows.length" class="crm-automated-solution-hub-types__rows">
				<CrmHubFeatureCard
					v-for="row in rows"
					:key="row.typeId"
					:feature-id="'crm-type-' + row.typeId"
					:title-text="row.title"
					:icon="TYPE_ROW_ICON"
					:checked="row.checked"
					:disabled="locks.rowsLocked"
					@update="handleRowToggle(row, $event)"
				/>
			</div>
			<div class="crm-automated-solution-hub-types__actions">
				<span ref="pickerAnchor">
					<UiButton
						:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_TYPES_PICK')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.OUTLINE_NO_ACCENT"
						:left-icon="'plus-l'"
						:disabled="locks.pickerLocked"
						:dataset="{ testid: 'crm-automated-solution-types-pick-btn' }"
						@click="openTypePicker"
					/>
				</span>
				<UiButton
					v-if="locks.showCreateButton"
					:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_TYPES_CREATE')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.OUTLINE_NO_ACCENT"
					:dataset="{ testid: 'crm-automated-solution-types-create-btn' }"
					@click="handleCreateTypeClick"
				/>
			</div>
			<div
				v-if="isShowPermissionsResetAlert"
				class="ui-alert ui-alert-warning crm-automated-solution-details-hub-types__reset-alert"
			>
				<span class="ui-alert-message">
					{{ loc('CRM_AUTOMATED_SOLUTION_DETAILS_PERMISSIONS_WILL_BE_RESET_ALERT') }}
				</span>
			</div>
		</div>
	`,
});

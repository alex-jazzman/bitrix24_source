import { BitrixVue, defineComponent, markRaw, provide, ref, shallowRef, type PropType } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { createStore, useStore } from 'ui.vue3.vuex';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { Loc, Runtime, Type } from 'main.core';
import { Dictionary } from 'crm.integration.analytics';
import { ConfirmationDialog } from 'crm.dialog';
import { sendData as sendAnalyticsData } from 'ui.analytics';
import {
	CrmHubShell,
	CrmHubSavePanel,
	SUPPLY_STEP,
	normalizeHubDescription,
	type SettingsRecord,
} from 'crm.settings-hub';
import { CrmHubCrmPassport } from '../component/passport';
import { CrmHubCrmSectionCard } from '../component/section-card';

import { store as crmStore } from '../store';
import { createSaveAnalyticsBuilder } from '../lib/save-analytics';
import { CRM_HUB_RECORDS, CrmControlType } from '../const/descriptor';
import {
	applyHubTree,
	CrmHubTreeSectionId,
	HUB_TREE_DEFAULT_SECTION_ID,
	HUB_TREE_SECTION_BY_TAB,
	HUB_TREE_SECTIONS,
	pickSectionRecords,
} from '../const/hub-tree';
import { isSavePanelFixed, shouldShowDeleteButton } from '../lib/read-only/read-only';
import {
	isCreateMode,
	resolveRecoveryControls,
	shouldCloseOnCancel,
	shouldLeaveCreateMode,
	type RecoveryControls,
} from '../lib/create-mode/create-mode';
import { readSectionUrl } from '../lib/read-section-url/read-section-url';
import { commitBaseline, revertForm } from '../lib/revert-form/revert-form';
import { resolveUpdateAction } from '../lib/hub-update/hub-update';
import { canRegisterCancelEvent, resolveCancelElement } from '../lib/cancel-attribution/cancel-attribution';
import { CrmHubCrmTypesControl } from '../component/types-control';
import { CrmHubCrmVibeSection } from '../component/vibe-section';
import {
	buildVibeSnapshot,
	isCardLockedOnCreate,
	isPageCreatingSave,
	isVibeCardShown,
	trackPageCreatingSave,
	VIBE_CARD_ID,
} from '../lib/vibe-card/vibe-card';
import { SaveSolution, closeSliderOrRedirect } from '../feature/save-solution';
import { DeleteSolution } from '../feature/delete-solution';
import { ConfirmCloseGuard } from '../feature/confirm-close';

import '../style.css';

declare const BX: any;

// Считается от таба, а не переводится из старой секции: раздела «Настройки» больше нет (D-03).
function mapActiveSection(activeTabId: string): string
{
	return HUB_TREE_SECTION_BY_TAB[activeTabId] ?? HUB_TREE_DEFAULT_SECTION_ID;
}

export function getCurrentSlider(): any
{
	return BX.SidePanel?.Instance?.getSliderByWindow(window);
}

// Маркер для правил, которым надо достать ВЫШЕ корня хаба: колонка слайдера и его врапper — наши
// предки, а не потомки. Вешается на <html>, а не на <body>: body переписывает хост слайдера.
const HOST_CLASS = 'crm-automated-solution-hub-host';

// The form controls of the hub records, the same for every mount of the app.
const FORM_CONTROLS = markRaw({
	[CrmControlType.Types]: CrmHubCrmTypesControl,
	[CrmControlType.Vibe]: CrmHubCrmVibeSection,
});

const HubApp = defineComponent({
	name: 'CrmAutomatedSolutionDetailsHubApp',
	components: { CrmHubShell, CrmHubSavePanel, CrmHubCrmPassport, CrmHubCrmSectionCard, UiButton },
	props: {
		params: {
			type: Object as PropType<Record<string, any>>,
			required: true,
		},
	},
	setup(props)
	{
		const params = props.params;
		const store = useStore();

		// ЗАЩЁЛКА режима создания, а не computed. Снимается здесь, один раз, с уже разобранного
		// стора (App.start диспатчит setState ДО mount) — и дальше не пересчитывается от стора.
		// Реактивный признак дал бы два регресса:
		// - после сохранения экшен `save` кладёт в стор новый id (actions.ts:60-62) ещё до навигации,
		//   которая живёт в setTimeout, — мелькнул бы полностью активный хаб;
		// - после удаления экшен `delete` делает setState({}) (actions.ts:98), normalizeId(undefined)
		//   даёт 0 (mutations.ts:19) — и на закрывающемся слайдере ЭКРАНА НАСТРОЙКИ /details/1/
		//   вспыхнул бы режим создания.
		// Геттер `isNew` при этом остаётся реактивным как был: его читают actions.ts:40 (add или
		// update) и types-control.ts, и им нужна правда о текущем состоянии, а не о начальном.
		// The only transition is explicit: an add that failed with the created id turns into its settings.
		const createModeLatch = ref(isCreateMode(store.state));

		const reportSaveFailure = (): void => {
			if (shouldLeaveCreateMode(createModeLatch.value, store.state))
			{
				createModeLatch.value = false;
			}
		};

		const isWaiting = ref(false);
		const isVibeSettingsPending = ref(false);
		const isCancelEventRegistered = ref(false);
		// Element of a close whose cancel event is postponed until the exit is confirmed (Esc).
		const deferredCancelElement = ref<string | null>(null);
		const currentSliderEvent = ref<any>(null);
		const activeSectionId = ref(mapActiveSection(String(params.activeTabId ?? 'common')));

		// Full baseline snapshot for the cancel action: the whole Vuex state clone plus the
		// types-control tag distribution. Captured after the initial setState and replaced only after a
		// successful save. shallowRef keeps the plain clone out of Vue reactivity.
		const savedSnapshot = shallowRef<{ vuexState: any, typesControlState: any } | null>(null);

		const controlRegistry: Record<string, any> = {};
		provide('hubControlRegistry', controlRegistry);

		const captureSnapshot = (): void => {
			const typesControl = controlRegistry['crm-types'];
			savedSnapshot.value = {
				vuexState: Runtime.clone(store.state),
				typesControlState: typesControl ? typesControl.captureSnapshot() : null,
			};
		};

		// A control that saves the solution on its own (the "save is required to proceed" popup) reports
		// it through this callback, so the baseline follows the same rule as the panel save.
		provide('hubCommitSnapshot', captureSnapshot);
		provide('hubReportSaveFailure', reportSaveFailure);
		provide('hubIsCreateMode', (): boolean => createModeLatch.value);

		const saveSolution = markRaw(new SaveSolution(trackPageCreatingSave({
			getStore: () => store,
			setWaiting: (waiting) => {
				isWaiting.value = waiting;
			},
			commitSnapshot: captureSnapshot,
			markCancelEventRegistered: () => {
				isCancelEventRegistered.value = true;
			},
			normalizeDescription: normalizeHubDescription,
			readOnly: Boolean(params.readOnly),
			reportFailure: reportSaveFailure,
		}, () => isPageCreatingSave(store.state, Boolean(params.readOnly)), (pending: boolean) => {
			isVibeSettingsPending.value = pending;
		})));

		const deleteSolution = markRaw(new DeleteSolution({
			getStore: () => store,
			setWaiting: (waiting) => {
				isWaiting.value = waiting;
			},
			markCancelEventRegistered: () => {
				isCancelEventRegistered.value = true;
			},
			unmarkCancelEventRegistered: () => {
				isCancelEventRegistered.value = false;
			},
		}));

		const openConfirmDialog = (): Promise<boolean> => new Promise((resolve) => {
			const dialog = ConfirmationDialog.create('crm-as-hub-close', {
				title: Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CLOSE_CONFIRM_TITLE'),
				content: Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CLOSE_CONFIRM_TEXT'),
			});
			dialog.open()
				.then((result: { cancel: boolean }) => resolve(!result.cancel))
				.catch(() => resolve(false));
		});

		const confirmClose = markRaw(new ConfirmCloseGuard({
			isDirty: () => Boolean(store.state.isModified),
			denyClose: () => currentSliderEvent.value?.denyAction?.(),
			openConfirm: () => openConfirmDialog().then((confirmed: boolean) => {
				if (!confirmed)
				{
					// Staying in the form ends this close attempt: its element must not leak into the next one.
					deferredCancelElement.value = null;
				}

				return confirmed;
			}),
			closeSlider: () => getCurrentSlider()?.close?.(),
		}));

		return {
			store,
			// Шаблон обязан читать именно защёлку, а не геттер isNew, иначе вернутся оба регресса, описанных выше.
			isCreateMode: createModeLatch,
			sections: HUB_TREE_SECTIONS,
			formControls: FORM_CONTROLS,
			controlRegistry,
			saveSolution,
			deleteSolution,
			confirmClose,
			commitSnapshot: captureSnapshot,
			savedSnapshot,
			isWaiting,
			isVibeSettingsPending,
			isCancelEventRegistered,
			deferredCancelElement,
			currentSliderEvent,
			activeSectionId,
			AirButtonStyle,
			ButtonSize,
		};
	},
	computed: {
		isReadOnly(): boolean
		{
			return Boolean(this.params.readOnly);
		},
		// От защёлки режима, а не от реактивного геттера `isNew` — как у СП от статического
		// params.isNew. После удачного удаления экшен `delete` делает setState({}) (actions.ts:98),
		// реактивный isNew становится true, кнопка пропала бы, и на закрывающемся слайдере мелькнула
		// бы пустая закреплённая белая полоса.
		showDeleteButton(): boolean
		{
			return shouldShowDeleteButton(this.isCreateMode, this.isReadOnly);
		},
		isDirty(): boolean
		{
			return Boolean(this.store.state.isModified);
		},
		// Полоса закреплена независимо от состояния формы, как в СП-хабе. На создании панели
		// сохранения нет в DOM вовсе, а `--panel-fixed` рисовал бы вокруг пустоты: ~50px
		// padding-bottom у шелла (hub-shell.css:16-20) плюс белая фиксированная полоса с бордюром на
		// дне слайдера (hub-shell.css:52-58).
		isPanelFixed(): boolean
		{
			return isSavePanelFixed(this.isCreateMode, this.isReadOnly);
		},
		errors(): Array<{ message: string }>
		{
			return this.store.state.errors;
		},
		hasErrors(): boolean
		{
			return Type.isArrayFilled(this.errors);
		},
		recoveryControls(): RecoveryControls
		{
			return resolveRecoveryControls(this.store.state.recovery.status);
		},
		readyRecoveryToken(): number | null
		{
			const recovery = this.store.state.recovery;

			return recovery.status === 'ready' ? recovery.token : null;
		},
		// Записи с переписанным sectionId. Паспортные уходят в псевдо-секцию `passport`, которой нет
		// в HUB_TREE_SECTIONS, — поэтому шелл их не рисует, а паспорт находит по полному списку.
		// `crm-vibe` так же уходит в псевдо-секцию `vibe`: её карточку рисует слот единственного
		// раздела из vibeRecords, под «Смарт-процессами».
		records(): SettingsRecord[]
		{
			return applyHubTree(CRM_HUB_RECORDS);
		},
		vibeRecords(): SettingsRecord[]
		{
			return pickSectionRecords(this.records, CrmHubTreeSectionId.Vibe, SUPPLY_STEP);
		},
		showVibeCard(): boolean
		{
			return isVibeCardShown(this.store.state, this.isReadOnly);
		},
		// The page can be switched on right in the creation form, so its card is not made inert there.
		isVibeCardLocked(): boolean
		{
			return isCardLockedOnCreate(VIBE_CARD_ID, this.isCreateMode);
		},
		snapshot(): Record<string, unknown>
		{
			const state = this.store.state;

			return {
				title: state.automatedSolution.title,
				description: state.automatedSolution.description,
				typeIds: state.automatedSolution.typeIds,
				intranetCustomSectionId: this.params.state?.automatedSolution?.intranetCustomSectionId ?? null,
				intranetCustomSectionUrl: readSectionUrl(this.params.state),
				dynamicTypesTitles: state.dynamicTypesTitles,
				permissions: state.permissions,
				automatedSolutionOrigTypeIds: state.automatedSolutionOrigTypeIds,
				isPermissionsLayoutV2Enabled: state.isPermissionsLayoutV2Enabled,
				...buildVibeSnapshot(state, this.isVibeSettingsPending),
			};
		},
	},
	watch: {
		readyRecoveryToken(token: number | null): void
		{
			if (token !== null)
			{
				this.commitRecoveredBaseline();
			}
		},
	},
	mounted(): void
	{
		document.documentElement.classList.add(HOST_CLASS);

		EventEmitter.subscribe('SidePanel.Slider:onClose', this.handleSliderClose);
		EventEmitter.subscribe('SidePanel.Slider:onCloseByEsc', this.handleSliderCloseByEsc);
		EventEmitter.subscribe('SidePanel.Slider:onLoad', this.handleSliderLoad);

		// Initial baseline: children (types-control) mount before the parent, so the registry is ready.
		this.commitSnapshot();
	},
	beforeUnmount(): void
	{
		document.documentElement.classList.remove(HOST_CLASS);

		EventEmitter.unsubscribe('SidePanel.Slider:onClose', this.handleSliderClose);
		EventEmitter.unsubscribe('SidePanel.Slider:onCloseByEsc', this.handleSliderCloseByEsc);
		EventEmitter.unsubscribe('SidePanel.Slider:onLoad', this.handleSliderLoad);
	},
	methods: {
		handleUpdate(payload: { id: string, valueKey: string, value: any }): void
		{
			const action = resolveUpdateAction(payload.valueKey);
			if (action)
			{
				this.store.dispatch(action, payload.value);
			}
		},
		handleAction(): void
		{
			// No hub actions yet (the home page section has no CTA).
		},
		handleSave(): void
		{
			this.saveSolution.execute();
		},
		handleCancel(): void
		{
			this.revert();
		},
		// «Отменить» режима создания. Своя ветка, а не handleCancel: у панели кита отмена только
		// откатывает форму и остаётся на экране, а здесь откатывать нечего — уходить надо со всего
		// экрана. Сначала откат базовой линии (он же сбрасывает isModified через setState), потом
		// обычное закрытие слайдера тем же путём, каким уходит сохранение. Порядок не косметический:
		// на грязной форме закрытие упёрлось бы в ConfirmCloseGuard и показало диалог подтверждения,
		// которого у этой кнопки быть не должно — она и есть осознанный выход без сохранения.
		handleCreateCancel(): void
		{
			this.revert();
			if (shouldCloseOnCancel(this.isCreateMode))
			{
				closeSliderOrRedirect();
			}
		},
		handleDelete(): void
		{
			this.deleteSolution.execute();
		},
		hideError(error: Object): void
		{
			this.store.dispatch('removeError', error);
		},
		handleRetryRecovery(): void
		{
			void this.store.dispatch('retryRecovery');
		},
		// Cancel action: restore the full Vuex snapshot (setState resets isModified and rebuilds
		// permissions / dynamicTypesTitles / errors), then hand the types-control its own snapshot so the
		// rows on screen come back with it — the store knows the links, not which rows are shown.
		revert(): void
		{
			revertForm(this.savedSnapshot, {
				isBaselineKnown: () => !this.recoveryControls.isBaselinePending,
				applyVuexState: (vuexState) => this.store.dispatch('setState', vuexState),
				applyTypesControl: (typesControlState) => {
					const typesControl = this.controlRegistry['crm-types'];
					if (typesControl)
					{
						typesControl.applySnapshot(typesControlState);
					}
				},
			});
		},
		// The read-back of a failed save (the panel or a control one) replaces the revert target with the stored
		// solution; the draft on screen stays out of it, and so do the rows picked after the previous baseline.
		commitRecoveredBaseline(): void
		{
			const server = this.store.state.recovery.baseline;
			if (!server)
			{
				return;
			}

			const typesControl = this.controlRegistry['crm-types'];
			const previousTypes = this.savedSnapshot?.typesControlState ?? null;
			const typesBaseline = typesControl
				? typesControl.rebaseSnapshot(previousTypes, server.typeIds)
				: previousTypes
			;

			this.savedSnapshot = commitBaseline(this.savedSnapshot, server, typesBaseline);
		},
		// Последний, кто трогает фокус на открытии экрана создания, — сам слайдер: на `load` фрейма он
		// зовёт FocusTrap.applyInitialFocus() (slider.ts:2255) и уводит фокус на свой контейнер в
		// родительском документе, гася каретку, которую паспорт поставил на монтаже. Событие приезжает
		// во фрейм СРАЗУ ПОСЛЕ этого (slider.ts:2259-2268, fireFrameEvent), поэтому здесь фокус и
		// возвращается — последним ходом, а не наперегонки со слайдером.
		//
		// Только создание: на экране настройки /details/1/ каретку никто не ставит и ставить не должен,
		// а `isCreateMode` здесь — та же защёлка, что и у разметки, поэтому перезагрузка слайдера
		// адресом сохранённого решения (новый фрейм, новый экземпляр приложения) сюда не попадёт.
		handleSliderLoad(event: BaseEvent): void
		{
			if (!this.isCreateMode)
			{
				return;
			}

			const [sliderEvent] = event.getData();
			if (sliderEvent?.getSlider?.() !== getCurrentSlider())
			{
				return;
			}

			(this.$refs.passport as { focusTitle?: () => void } | null)?.focusTitle?.();
		},
		handleSliderClose(event: BaseEvent): void
		{
			const [sliderEvent] = event.getData();
			if (sliderEvent.getSlider() !== getCurrentSlider())
			{
				return;
			}

			this.currentSliderEvent = sliderEvent;

			// Register cancel only on the actual close path: immediately when clean, or on the
			// re-close after the dirty form's exit was confirmed. Staying in the confirm dialog
			// must not emit a cancel event.
			if (canRegisterCancelEvent(this.isDirty, this.confirmClose.isCloseConfirmed))
			{
				this.registerCancelEvent(null);
			}

			this.confirmClose.handleClose();
		},
		handleSliderCloseByEsc(event: BaseEvent): void
		{
			const [sliderEvent] = event.getData();
			if (sliderEvent.getSlider() !== getCurrentSlider())
			{
				return;
			}

			if (canRegisterCancelEvent(this.isDirty, this.confirmClose.isCloseConfirmed))
			{
				this.registerCancelEvent(Dictionary.ELEMENT_ESC_BUTTON);

				return;
			}

			// This close is about to be denied by the confirmation dialog, so the Esc attribution is kept
			// for the close that reports the cancel after a confirmed exit.
			this.deferredCancelElement = Dictionary.ELEMENT_ESC_BUTTON;
		},
		// Cancel analytics with the single-fire dedup flag; a successful save/delete pre-sets it.
		registerCancelEvent(element: string | null): void
		{
			if (this.isCancelEventRegistered)
			{
				return;
			}
			this.isCancelEventRegistered = true;

			sendAnalyticsData(
				createSaveAnalyticsBuilder(this.store)
					.setElement(resolveCancelElement(this.deferredCancelElement, element))
					.setStatus(Dictionary.STATUS_CANCEL)
					.buildData(),
			);
		},
	},
	template: `
		<div
			class="crm-automated-solution-details-hub crm-automated-solution-hub"
			:class="{ 'crm-automated-solution-hub--create': isCreateMode }"
			data-testid="crm-automated-solution-hub-root"
		>
			<div v-if="hasErrors" class="crm-automated-solution-details-hub__errors ui-alert ui-alert-danger" role="alert">
				<template v-for="error in errors" :key="error.message">
					<span class="ui-alert-message">{{ error.message }}</span>
					<button
						type="button"
						class="ui-alert-close-btn crm-automated-solution-details-hub__error-close"
						:aria-label="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_ERROR_CLOSE')"
						data-testid="crm-automated-solution-hub-error-close"
						@click="hideError(error)"
					></button>
				</template>
			</div>
			<div
				v-if="recoveryControls.isLoading"
				class="crm-automated-solution-details-hub__errors ui-alert ui-alert-primary"
				role="status"
				data-testid="crm-automated-solution-hub-recovery-loading"
			>
				<span class="ui-alert-message">{{ loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_RECOVERY_LOADING') }}</span>
			</div>
			<div
				v-else-if="recoveryControls.isFailed"
				class="crm-automated-solution-details-hub__errors ui-alert ui-alert-warning"
				role="alert"
				data-testid="crm-automated-solution-hub-recovery-failed"
			>
				<span class="ui-alert-message">{{ loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_RECOVERY_FAILED') }}</span>
				<UiButton
					:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_RECOVERY_RETRY')"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.OUTLINE"
					:dataset="{ testid: 'crm-automated-solution-hub-recovery-retry-btn' }"
					@click="handleRetryRecovery"
				/>
			</div>
			<CrmHubShell
				:sections="sections"
				:records="records"
				:snapshot="snapshot"
				:active-section-id="activeSectionId"
				:read-only="isReadOnly"
				:is-panel-fixed="isPanelFixed"
				:controls="formControls"
				@update="handleUpdate"
				@action="handleAction"
			>
				<template #passport>
					<CrmHubCrmPassport
						ref="passport"
						:records="records"
						:snapshot="snapshot"
						:read-only="isReadOnly"
						:is-create-mode="isCreateMode"
						:is-waiting="isWaiting"
						@update="handleUpdate"
						@save="handleSave"
						@cancel="handleCreateCancel"
					/>
				</template>
				<!--
					Раздел один, меню нет: обе карточки на одном экране, сверху вниз — «Смарт-процессы»,
					«Главная страница». Записи первой приходят из слота шелла, второй — из псевдо-секции
					vibe (vibeRecords). Своя обёртка даёт 20px между карточками, как паспорт → карточка.
				-->
				<template #section-types="{ records: typesRecords }">
					<div class="crm-automated-solution-hub-cards">
						<CrmHubCrmSectionCard
							card-id="types"
							title="CRM_AUTOMATED_SOLUTION_DETAILS_TAB_TYPES"
							icon="o-smart-process"
							:records="typesRecords"
							:snapshot="snapshot"
							:read-only="isReadOnly"
							:is-create-mode="isCreateMode"
							:controls="formControls"
							@update="handleUpdate"
							@action="handleAction"
						/>
						<CrmHubCrmSectionCard
							v-if="showVibeCard"
							card-id="vibe"
							title="CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_VIBE"
							icon="o-home"
							:records="vibeRecords"
							:snapshot="snapshot"
							:read-only="isReadOnly"
							:is-create-mode="isVibeCardLocked"
							:controls="formControls"
							@update="handleUpdate"
							@action="handleAction"
						/>
					</div>
				</template>
				<!--
					v-if стоит на САМОМ template, а не внутри слота: иначе $slots.panel остаётся
					определённым и шелл отрисует пустой div.crm-settings-hub-shell__panel
					(hub-shell.ts:110). На создании панели не должно быть в DOM, а не быть скрытой —
					её место занимает кнопка «Сохранить» в слоте паспорта.
				-->
				<template v-if="!isCreateMode" #panel>
					<div class="crm-automated-solution-details-hub__panel">
						<!-- Save and revert wait for the baseline of a failed save: its read-back status is above. -->
						<CrmHubSavePanel
							v-if="!recoveryControls.isBaselinePending"
							:is-dirty="isDirty"
							:is-waiting="isWaiting"
							:read-only="isReadOnly"
							@save="handleSave"
							@cancel="handleCancel"
						/>
						<div v-if="showDeleteButton" class="crm-automated-solution-details-hub__delete-action">
							<UiButton
								:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_DELETE')"
								:disabled="isWaiting"
								:size="ButtonSize.MEDIUM"
								:style="AirButtonStyle.OUTLINE"
								:dataset="{ testid: 'crm-automated-solution-hub-delete-btn' }"
								@click="handleDelete"
							/>
						</div>
					</div>
				</template>
			</CrmHubShell>
		</div>
	`,
});

// Wrapper mounted from the template inline script.
export class App
{
	#container: HTMLElement | null;
	#params: Record<string, any>;
	#app: any = null;

	constructor(params: { containerId: string } & Record<string, any>)
	{
		this.#container = document.getElementById(params.containerId);
		this.#params = params;
	}

	start(): void
	{
		if (!this.#container)
		{
			return;
		}

		this.#app = BitrixVue.createApp(HubApp, { params: this.#params });

		const vuexStore = createStore(crmStore);
		if (Type.isPlainObject(this.#params.state))
		{
			vuexStore.dispatch('setState', this.#params.state);
		}

		this.#app.use(vuexStore);
		this.#app.mixin(locMixin);
		this.#app.mount(this.#container);
	}

	stop(): void
	{
		this.#app?.unmount();
		this.#app = null;
	}
}

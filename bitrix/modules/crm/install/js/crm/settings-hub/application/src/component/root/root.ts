import {
	computed,
	defineComponent,
	nextTick,
	onBeforeUnmount,
	ref,
	toRefs,
	type PropType,
} from 'ui.vue3';

import { CrmSettingsHubHubSidebar } from '../hub-sidebar/hub-sidebar';
import { CrmSettingsHubMatrixDialog } from '../matrix-dialog/matrix-dialog';
import { CrmSettingsHubSettingsGroupPanel } from '../settings-group-panel/settings-group-panel';
import { type MatrixSettingAction } from '../setting-row/setting-row';
import { type NavigationContext, useNavigationContext } from '../../context/navigation';
import {
	provideSettingsState,
	type SettingsStateController,
	type SettingsStateInput,
} from '../../context/settings-state';
import {
	createUpdateSetting,
	type SettingsUpdateService,
} from '../../feature/update-setting/update-setting';
import { activateConfigTarget, type ConfigTarget } from '../../lib/config-target';
import { HubFilter } from '../../model/hub-filter';
import {
	type SettingId,
	type SettingRegistration,
	type SettingsSectionRegistration,
} from '../../model/types';
import { settingRegistry } from '../../registry/setting-registry';
import { settingsSectionRegistry } from '../../registry/settings-section-registry';

import './root.css';

type SettingAction = ConfigTarget | MatrixSettingAction;

const defaultSectionId = settingsSectionRegistry[0]?.id ?? null;

function collectVisibleSettingIds(
	section: SettingsSectionRegistration,
	filter: HubFilter,
	settingsStateContext: SettingsStateController,
	navigationContext: NavigationContext,
): ReadonlySet<SettingId>
{
	const ids = new Set<SettingId>();

	for (const block of section.blocks)
	{
		const availableSettings = block.settings
			.filter((setting) => (
				setting.navigationId === undefined
				|| navigationContext.get(setting.navigationId) !== null
			))
			.filter((setting) => settingsStateContext.isVisible(setting.id))
			.map((setting): SettingRegistration => ({
				...setting,
				searchText: [
					...setting.searchText,
					...settingsStateContext.getSearchText(setting.id),
				],
			}))
		;
		for (const setting of filter.filterBlock(block.title, availableSettings))
		{
			ids.add(setting.id);
		}
	}

	return ids;
}

function createRootState()
{
	return {
		rootElement: ref<HTMLElement | null>(null),
		contentElement: ref<HTMLElement | null>(null),
		query: ref(''),
		selectedSectionId: ref<string | null>(defaultSectionId),
		activeMatrixSettingId: ref<SettingId | null>(null),
	};
}

type RootState = ReturnType<typeof createRootState>;

function createFilter(query: string): HubFilter
{
	const filter = new HubFilter();
	filter.setQuery(query);

	return filter;
}

function createRootDerived(
	state: RootState,
	settingsStateContext: SettingsStateController,
	navigationContext: NavigationContext,
)
{
	const activeMatrix = computed(() => {
		const id = state.activeMatrixSettingId.value;

		return id === null ? null : settingsStateContext.get(id).matrix ?? null;
	});
	const visibleSections = computed<readonly SettingsSectionRegistration[]>(() => {
		const filter = createFilter(state.query.value);

		return settingsSectionRegistry.filter((section) => (
			collectVisibleSettingIds(section, filter, settingsStateContext, navigationContext).size > 0
		));
	});
	const currentSection = computed<SettingsSectionRegistration | null>(() => (
		settingsSectionRegistry.find((section) => section.id === state.selectedSectionId.value) ?? null
	));
	const visibleSettingIds = computed<ReadonlySet<SettingId>>(() => {
		if (currentSection.value === null)
		{
			return new Set();
		}

		return collectVisibleSettingIds(
			currentSection.value,
			createFilter(state.query.value),
			settingsStateContext,
			navigationContext,
		);
	});
	const isNarrowed = computed(() => state.query.value !== '');
	const titleId = computed<string | null>(() => (
		currentSection.value === null
			? null
			: `crm-settings-hub-settings-section-${currentSection.value.id}-title`
	));

	return {
		activeMatrix,
		currentSection,
		isNarrowed,
		titleId,
		visibleSections,
		visibleSettingIds,
	};
}

type RootDerived = ReturnType<typeof createRootDerived>;

function resetContentScroll(element: HTMLElement | null): void
{
	const scrollContainer = element;
	if (scrollContainer !== null)
	{
		scrollContainer.scrollTop = 0;
	}
}

function focusWithin(root: HTMLElement | null, selector: string): void
{
	root?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
}

function createQueryCommands(state: RootState, derived: RootDerived)
{
	const { contentElement, query, selectedSectionId } = state;
	let queryTimer: number | null = null;

	function cancelPendingQuery(): void
	{
		if (queryTimer !== null)
		{
			window.clearTimeout(queryTimer);
			queryTimer = null;
		}
	}

	function applyQuery(value: string): void
	{
		query.value = createFilter(value).query;
		queryTimer = null;
		if (derived.visibleSections.value.some((section) => section.id === selectedSectionId.value))
		{
			return;
		}

		const [firstVisibleSection] = derived.visibleSections.value;
		if (firstVisibleSection !== undefined)
		{
			selectedSectionId.value = firstVisibleSection.id;
			nextTick(() => resetContentScroll(contentElement.value));
		}
	}

	function updateQuery(value: string): void
	{
		cancelPendingQuery();
		queryTimer = window.setTimeout(() => applyQuery(value), 150);
	}

	function resetQuery(): void
	{
		cancelPendingQuery();
		query.value = '';
	}

	return { cancelPendingQuery, resetQuery, updateQuery };
}

function createNavigationCommands(
	state: RootState,
	derived: RootDerived,
)
{
	const {
		contentElement,
		rootElement,
		selectedSectionId,
	} = state;

	function selectSection(id: string): void
	{
		if (!derived.visibleSections.value.some((section) => section.id === id))
		{
			return;
		}

		selectedSectionId.value = id;
		nextTick(() => {
			resetContentScroll(contentElement.value);
			focusWithin(
				rootElement.value,
				'.crm-settings-hub-application__menu-item[aria-current="page"]',
			);
		});
	}

	return { selectSection };
}

function createSettingCommands(state: RootState, settingsStateContext: SettingsStateController)
{
	const { activeMatrixSettingId } = state;

	function activate(action: SettingAction): void
	{
		if (action.type === 'matrix')
		{
			const matrix = settingRegistry.has(action.settingId)
				? settingsStateContext.get(action.settingId).matrix ?? null
				: null;
			activeMatrixSettingId.value = matrix === null ? null : action.settingId;

			return;
		}

		activateConfigTarget(action);
	}

	function closeMatrix(): void
	{
		activeMatrixSettingId.value = null;
	}

	return { activate, closeMatrix };
}

const ignoreUpdateError = (): void => {};

export const CrmSettingsHubRoot = defineComponent({
	name: 'CrmSettingsHubRoot',
	components: {
		CrmSettingsHubHubSidebar,
		CrmSettingsHubMatrixDialog,
		CrmSettingsHubSettingsGroupPanel,
	},
	props: {
		settingsState: {
			type: Object as PropType<SettingsStateInput>,
			required: true,
		},
		settingsService: {
			type: Object as PropType<SettingsUpdateService | null>,
			default: null,
		},
		onUpdateError: {
			type: Function as PropType<() => void>,
			default: ignoreUpdateError,
		},
		readOnly: {
			type: Boolean,
			default: true,
		},
	},
	setup(props): Object
	{
		const { onUpdateError, settingsService, settingsState } = toRefs(props);
		const navigationContext = useNavigationContext();
		const settingsStateContext = provideSettingsState(settingsState.value);
		if (settingsService.value !== null)
		{
			settingsStateContext.setUpdateHandler(createUpdateSetting(
				settingsStateContext,
				settingsService.value,
				onUpdateError.value,
			));
		}

		const state = createRootState();
		const derived = createRootDerived(state, settingsStateContext, navigationContext);
		const queryCommands = createQueryCommands(state, derived);
		const navigationCommands = createNavigationCommands(state, derived);
		const settingCommands = createSettingCommands(state, settingsStateContext);

		onBeforeUnmount(() => {
			queryCommands.cancelPendingQuery();
			state.activeMatrixSettingId.value = null;
		});

		return {
			...state,
			...derived,
			activate: settingCommands.activate,
			closeMatrix: settingCommands.closeMatrix,
			resetQuery: queryCommands.resetQuery,
			selectSection: navigationCommands.selectSection,
			updateQuery: queryCommands.updateQuery,
		};
	},
	template: `
		<div
			ref="rootElement"
			class="crm-settings-hub-application"
			data-testid="crm-settings-hub-application-root"
		>
			<div
				class="crm-settings-hub-application__layout"
				data-testid="crm-settings-hub-application-layout"
			>
				<CrmSettingsHubHubSidebar
					:sections="visibleSections"
					:selected-id="selectedSectionId"
					:query="query"
					@select-section="selectSection"
					@update-query="updateQuery"
					@clear-query="resetQuery"
				/>
				<div
					ref="contentElement"
					class="crm-settings-hub-application__content"
					data-testid="crm-settings-hub-application-content"
				>
					<section
						class="crm-settings-hub-application__panel"
						data-testid="crm-settings-hub-application-panel"
						role="region"
						tabindex="-1"
						:aria-labelledby="titleId"
					>
						<CrmSettingsHubSettingsGroupPanel
							v-if="currentSection"
							:section="currentSection"
							:visible-setting-ids="visibleSettingIds"
							:is-narrowed="isNarrowed"
							@reset-search="resetQuery"
							@activate="activate"
						/>
					</section>
				</div>
			</div>
			<CrmSettingsHubMatrixDialog
				:setting-id="activeMatrixSettingId"
				:matrix="activeMatrix"
				:open="activeMatrix !== null"
				@close="closeMatrix"
			/>
		</div>
	`,
});

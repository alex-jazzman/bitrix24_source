import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Switcher } from 'ui.vue3.components.switcher';
import { TextSm } from 'ui.system.typography.vue';
import { TagSelector } from 'ui.entity-selector';
import { Alert, AlertColor, AlertSize } from 'ui.alerts';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dom, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Router } from 'crm.router';
import { ToolbarComponent } from 'crm.toolbar-component';

import { type ScalarRecord } from 'crm.settings-hub';
import {
	canDetachCustomSection,
	canEditCustomSection,
	type HubBaseline,
	hasSelectedCustomSection,
	isCustomSectionSelected,
	readCustomSectionMeta,
	readCustomSections,
	type CustomSectionMeta,
} from '../lib/hub-baseline/hub-baseline';

// Id of the synthetic "not selected" option of the compact dialog: it is never a real section id, and
// it lands in the payload as customSectionId = 0 through the `enabled` flag, exactly like the switcher.
const DETACH_ITEM_ID = 0;

type CustomSection = {
	id: number | string;
	title: string;
	isSelected?: boolean;
};

type TopEventEmitter = {
	subscribe: (eventName: string, handler: (event: BaseEvent) => void) => void;
	unsubscribe: (eventName: string, handler: (event: BaseEvent) => void) => void;
};

// Form control for the "Placement (CRM)" section: CustomSectionsController semantics: switcher +
// section TagSelector with both creation modes (automated-solution slider vs inline list editor), the
// idempotent reset-permissions alert, live update from the toolbar event, and getData() = the local
// section list plus the selected id (only while the switcher is on). Imperative; restored on revert.
export const CrmTypeHubCustomSectionControl = defineComponent({
	name: 'CrmTypeHubCustomSectionControl',
	components: { Switcher, TextSm },
	inject: {
		hubControlRegistry: { default: null },
	},
	props: {
		descriptor: {
			type: Object as PropType<ScalarRecord>,
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
		// Compact mode: the passport row owns the visible affordance (a button that opens the dialog),
		// so the control renders only the selector host and the reset-permissions alert. The switcher is
		// gone: "no workplace selected" IS the off state, expressed by the DETACH item of the dialog.
		compact: {
			type: Boolean,
			default: false,
		},
		// Element the dropdown is anchored to in compact mode (the passport button).
		targetNode: {
			type: Object as PropType<HTMLElement | null>,
			default: null,
		},
	},
	emits: ['update'],
	setup(): Object
	{
		return { switcherOptions: { size: 'small', showStateTitle: false } };
	},
	data()
	{
		return {
			enabled: false,
			selector: null as any,
			settingsContainer: null as any,
			sectionsListContainer: null as any,
			permissionsResetAlert: null as any,
			isPermissionsResetAlertShown: false,
			customSections: [] as CustomSection[],
			originallySelectedCustomSection: null as CustomSection | null,
		};
	},
	computed: {
		meta(): CustomSectionMeta
		{
			return readCustomSectionMeta(this.snapshot);
		},
		isSwitcherDisabled(): boolean
		{
			return this.disabled || this.readOnly || this.meta.switcherDisabled;
		},
		ariaChecked(): 'true' | 'false'
		{
			return this.enabled ? 'true' : 'false';
		},
		switcherLabelId(): string
		{
			return `crm-type-hub-custom-section-${this.descriptor.id}-label`;
		},
	},
	created(): void
	{
		this.loadSections(this.snapshot);
	},
	mounted(): void
	{
		this.initSelector();
		this.enabled = hasSelectedCustomSection(this.customSections);
		if (this.meta.isCreateSectionsViaAutomatedSolutionDetails)
		{
			ToolbarComponent.Instance.subscribeAutomatedSolutionUpdatedEvent(this.onAutomatedSolutionUpdate);
		}
		// ToolbarComponent.Instance resolves to the top window, so a handler subscribed from this iframe
		// outlives it: beforeUnmount never runs when the slider is destroyed, only the iframe is dropped.
		// Release everything on the top window's destroy event, exactly as prod did.
		getTopEventEmitter()?.subscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
		this.registerInRegistry();
	},
	beforeUnmount(): void
	{
		this.releaseTopWindowSubscriptions();
		this.destroySelector();
		this.unregisterFromRegistry();
	},
	methods: {
		loadSections(baseline: HubBaseline): void
		{
			this.customSections = readCustomSections(baseline);
			this.originallySelectedCustomSection = this.customSections.find(
				(s: CustomSection) => s.isSelected,
			) ?? null;
		},
		handleSliderDestroy(event: BaseEvent): void
		{
			const [sliderEvent] = event.getData();
			// The top window emits this for every slider it destroys; react only to our own.
			if (sliderEvent?.getSlider?.()?.getFrameWindow?.() !== window)
			{
				return;
			}

			this.releaseTopWindowSubscriptions();
			this.destroySelector();
		},
		releaseTopWindowSubscriptions(): void
		{
			ToolbarComponent.Instance.unsubscribeAutomatedSolutionUpdatedEvent(this.onAutomatedSolutionUpdate);
			getTopEventEmitter()?.unsubscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
		},
		// TagSelector has no destroy() of its own: the dialog owns the DOM, the selector owns the
		// subscriptions it got through options.events (unsubscribeAll comes from EventEmitter).
		destroySelector(): void
		{
			this.selector?.getDialog?.()?.destroy?.();
			this.selector?.unsubscribeAll?.();
			this.selector = null;
		},
		initSelector(): void
		{
			const items: any[] = [];
			const selectedItems: any[] = [];
			if (this.compact && canDetachCustomSection(this.snapshot, this.readOnly, this.disabled))
			{
				// "Not selected" is a regular option of the list: picking it detaches the type, which is
				// what the switcher did in the full layout.
				const detachItem = {
					id: DETACH_ITEM_ID,
					entityId: 'custom-section',
					title: Loc.getMessage('CRM_TYPE_DETAIL_HUB_LOCATION_EMPTY') ?? '',
					tabs: 'recents',
				};
				items.push(detachItem);
				if (!hasSelectedCustomSection(this.customSections))
				{
					selectedItems.push(detachItem);
				}
			}
			this.customSections.forEach((section: CustomSection) => {
				const item = { id: section.id, entityId: 'custom-section', title: section.title, tabs: 'recents' };
				items.push(item);
				if (section.isSelected)
				{
					selectedItems.push(item);
				}
			});

			const adjustAlert = Runtime.debounce(this.adjustResetPermissionsAlert.bind(this), 200);
			const options: Record<string, any> = {
				multiple: false,
				dialogOptions: {
					items,
					selectedItems,
					dropdownMode: true,
					height: 200,
					showAvatars: false,
					targetNode: this.compact ? this.targetNode : null,
				},
				events: {
					onAfterTagAdd: () => {
						this.syncEnabledFromSelection();
						adjustAlert();
						this.emitUpdate();
					},
					onAfterTagRemove: () => {
						this.syncEnabledFromSelection();
						adjustAlert();
						this.emitUpdate();
					},
				},
			};

			if (this.meta.isCreateSectionsViaAutomatedSolutionDetails)
			{
				options.showCreateButton = false;
				// The dialog's own footer link, not a button dressed up as one. `ui-selector-footer-link`
				// and `-link-add` are entity-selector's own classes (ui/entity-selector/src/css/dialog.css):
				// dashed underline, and the round add glyph drawn by `-link-add:before` at `left: -34px`
				// against `margin-left: 31px`. Putting an AIR button under those classes gave it two
				// layouts at once — the button's own padding shifted the glyph out of the footer, where it
				// was clipped, and PLAIN_ACCENT painted the label accent-blue and killed the underline.
				// Same markup production uses (templates/.default/script.es6.js), so the two hosts show the
				// same footer.
				options.dialogOptions.footer = Tag.render`
					<a
						onclick="${this.onOpenAutomatedSolutionCreationSliderClick.bind(this)}"
						class="ui-selector-footer-link ui-selector-footer-link-add"
					>${Loc.getMessage('CRM_COMMON_ACTION_CREATE')}</a>
				`;
			}
			else
			{
				options.showCreateButton = true;
				options.createButtonCaption = Loc.getMessage('CRM_COMMON_ACTION_CONFIG');
				options.events.onCreateButtonClick = this.onCreateButtonClick.bind(this);
			}

			if (!this.meta.canEditAutomatedSolution)
			{
				options.locked = true;
			}

			this.selector = markRaw(new TagSelector(options));
			this.selector.renderTo((this.$refs.selector as HTMLElement));

			this.settingsContainer = markRaw(Tag.render`
				<div class="crm-type-hidden crm-type-custom-sections-settings-container">
					<div class="crm-type-relation-subtitle">${Loc.getMessage('CRM_TYPE_DETAIL_CUSTOM_SECTION_LIST_MSGVER_1')}</div>
				</div>
			`);
			(this.$refs.container as HTMLElement).append(this.settingsContainer);
		},
		reInitSelector(): void
		{
			this.destroySelector();
			Dom.clean((this.$refs.selector as HTMLElement));
			this.initSelector();
		},
		// Compact mode has no switcher: the selection drives `enabled`, so the DETACH option (and an empty
		// selection) mean "not placed anywhere" and getData() reports customSectionId = 0.
		syncEnabledFromSelection(): void
		{
			if (!this.compact)
			{
				return;
			}

			const selected = this.getSelectedSection();
			this.enabled = Boolean(selected) && String(selected?.id) !== String(DETACH_ITEM_ID);
		},
		// Called by the passport row when its button is pressed.
		openSelector(): void
		{
			if (!canEditCustomSection(this.snapshot, this.readOnly, this.disabled))
			{
				return;
			}

			const dialog = this.selector?.getDialog?.();
			if (!dialog)
			{
				return;
			}

			if (this.compact && this.targetNode)
			{
				dialog.setTargetNode(this.targetNode);
			}

			if (dialog.isOpen?.())
			{
				dialog.hide?.();

				return;
			}

			dialog.show?.();
		},
		getSelectedSection(): CustomSection | null
		{
			const selected = this.selector?.getDialog?.()?.getSelectedItems?.() ?? [];
			if (selected.length > 0)
			{
				return { id: selected[0].getId(), title: selected[0].getTitle() };
			}

			return null;
		},
		adjustResetPermissionsAlert(): void
		{
			if (this.meta.permissionsUrl === null || this.meta.isNew)
			{
				return;
			}

			const selected = this.getSelectedSection();
			const alert = this.getPermissionsResetAlert();
			const isItemChanged = selected?.id !== this.originallySelectedCustomSection?.id && this.enabled;
			const isDetach = this.originallySelectedCustomSection && !this.enabled;

			if (isItemChanged || isDetach)
			{
				if (!this.isPermissionsResetAlertShown)
				{
					this.isPermissionsResetAlertShown = true;
					alert.renderTo((this.$refs.container as HTMLElement).parentNode);
					alert.show();
				}

				return;
			}

			if (this.isPermissionsResetAlertShown)
			{
				this.isPermissionsResetAlertShown = false;
				alert.hide();
			}
		},
		getPermissionsResetAlert(): any
		{
			if (this.permissionsResetAlert === null)
			{
				const text = (Loc.getMessage('CRM_TYPE_DETAIL_PERMISSIONS_WILL_BE_RESET_ALERT') ?? '')
					.replace('#LINK#', this.meta.permissionsUrl ?? '');
				this.permissionsResetAlert = markRaw(new Alert({
					size: AlertSize.MD,
					color: AlertColor.WARNING,
					customClass: 'crm-type-permissions-reset-alert',
					text,
				} as any));
			}

			return this.permissionsResetAlert;
		},
		onOpenAutomatedSolutionCreationSliderClick(): void
		{
			void Router.Instance.openAutomatedSolutionDetail();
		},
		onCreateButtonClick(): void
		{
			Dom.addClass((this.$refs.selector as HTMLElement), 'crm-type-hidden');
			this.showSectionsList();
		},
		onAutomatedSolutionUpdate(event: any): void
		{
			const id = Text.toInteger(event.getData().intranetCustomSectionId);
			const title = String(event.getData().title);
			if (id <= 0 || !Type.isStringFilled(title))
			{
				return;
			}

			const current = this.customSections.find((s: CustomSection) => Text.toInteger(s.id) === id);
			if (current)
			{
				current.title = title;
			}
			else
			{
				this.customSections.push({ id, title });
			}

			this.reInitSelector();
			this.selectCustomSectionById(id);
			this.emitUpdate();
		},
		selectCustomSectionById(id: number): void
		{
			const dialog = this.selector?.getDialog?.();
			dialog?.deselectAll?.();
			dialog?.getItem?.({ entityId: 'custom-section', id })?.select?.();
		},
		showSectionsList(): void
		{
			this.renderSectionsConfig();
			Dom.removeClass(this.settingsContainer, 'crm-type-hidden');
		},
		hideSectionsList(): void
		{
			if (this.sectionsListContainer)
			{
				Dom.clean(this.sectionsListContainer);
			}
			Dom.addClass(this.settingsContainer, 'crm-type-hidden');
		},
		renderSectionsConfig(): void
		{
			if (!this.sectionsListContainer)
			{
				this.sectionsListContainer = markRaw(Tag.render`<div class="crm-type-custom-sections-list-container"></div>`);
				this.settingsContainer.append(this.sectionsListContainer);
				const addButton = new Button({
					text: Loc.getMessage('CRM_COMMON_ACTION_CREATE') ?? '',
					icon: Button.Icon.ADD,
					collapsedIcon: Button.Icon.ADD,
					size: ButtonSize.SMALL,
					style: AirButtonStyle.PLAIN_ACCENT,
					useAirDesign: true,
					props: {
						'data-testid': 'crm-type-detail-custom-section-add-btn',
					},
					onclick: () => {
						this.sectionsListContainer.append(this.renderSectionItem());

						return {};
					},
				});
				this.settingsContainer.append(Tag.render`
					<div class="crm-type-custom-section-add-item-container">${addButton.render()}</div>
				`);
				this.settingsContainer.append(Tag.render`<hr class="crm-type-custom-sections-line">`);
				const buttons = Tag.render`<div class="crm-type-custom-sections-buttons-container"></div>`;
				buttons.append(new Button({
					text: Loc.getMessage('CRM_COMMON_ACTION_SAVE') ?? '',
					collapsedIcon: Button.Icon.DONE,
					size: ButtonSize.MEDIUM,
					style: AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: (_button, event) => {
						this.onSaveConfig(event);

						return {};
					},
				}).render());
				buttons.append(new Button({
					text: Loc.getMessage('CRM_COMMON_ACTION_CANCEL') ?? '',
					collapsedIcon: Button.Icon.CANCEL,
					size: ButtonSize.MEDIUM,
					style: AirButtonStyle.OUTLINE_NO_ACCENT,
					useAirDesign: true,
					onclick: (_button, event) => {
						this.onCancelConfig(event);

						return {};
					},
				}).render());
				this.settingsContainer.append(buttons);
			}

			Dom.clean(this.sectionsListContainer);
			this.customSections.forEach((section: CustomSection) => {
				this.sectionsListContainer.append(this.renderSectionItem(section));
			});
			this.sectionsListContainer.append(this.renderSectionItem());
		},
		renderSectionItem(section: CustomSection | null = null): HTMLElement
		{
			const id = section ? section.id : `new_${Text.getRandom()}`;
			const value = section ? section.title : '';
			const node = Tag.render`
				<div class="crm-type-custom-sections-item ui-ctl ui-ctl-textbox ui-ctl-w100 ui-ctl-row">
					<input type="hidden" name="id" value="${id}" />
					<input class="ui-ctl-element" name="value" type="text" aria-label="${Text.encode(Loc.getMessage('CRM_TYPE_DETAIL_CUSTOM_SECTION_ITEM_NAME_LABEL') ?? '')}" value="${Text.encode(value)}">
				</div>
			`;
			const removeButton = new Button({
				icon: Button.Icon.REMOVE,
				collapsedIcon: Button.Icon.REMOVE,
				style: AirButtonStyle.PLAIN_NO_ACCENT,
				useAirDesign: true,
				props: {
					'aria-label': Loc.getMessage('CRM_COMMON_ACTION_DELETE') ?? '',
					'data-testid': 'crm-type-detail-custom-section-remove-btn',
				},
				onclick: (_button, event) => {
					event.preventDefault();
					node.remove();

					return {};
				},
			});
			node.append(removeButton.render());

			return node;
		},
		onSaveConfig(event: Event): void
		{
			event.preventDefault();
			const selected = this.getSelectedSection();
			const next: CustomSection[] = [];
			[...this.sectionsListContainer.children].forEach((node) => {
				const idInput = node.querySelector('[name="id"]');
				const valueInput = node.querySelector('[name="value"]');
				if (!idInput || !valueInput)
				{
					return;
				}
				const title = valueInput.value;
				if (title)
				{
					next.push({
						id: idInput.value,
						title,
						isSelected: Boolean(selected && isCustomSectionSelected(selected.id, idInput.value)),
					});
				}
			});

			this.customSections = next;
			this.reInitSelector();
			Dom.removeClass((this.$refs.selector as HTMLElement), 'crm-type-hidden');
			this.hideSectionsList();
			this.emitUpdate();
		},
		onCancelConfig(event: Event): void
		{
			event.preventDefault();
			Dom.removeClass((this.$refs.selector as HTMLElement), 'crm-type-hidden');
			this.hideSectionsList();
		},
		handleSwitcherCheck(): void
		{
			this.enabled = true;
			this.adjustResetPermissionsAlert();
			this.emitUpdate();
		},
		handleSwitcherUncheck(): void
		{
			this.enabled = false;
			this.adjustResetPermissionsAlert();
			this.emitUpdate();
		},
		handleSwitcherKeydown(event: KeyboardEvent): void
		{
			if (this.isSwitcherDisabled || !['Enter', ' '].includes(event.key))
			{
				return;
			}

			event.preventDefault();
			if (this.enabled)
			{
				this.handleSwitcherUncheck();
			}
			else
			{
				this.handleSwitcherCheck();
			}
		},
		getData(): { customSectionId: number | string, customSections: CustomSection[] }
		{
			let customSectionId: number | string = 0;
			if (this.enabled)
			{
				const selected = this.getSelectedSection();
				if (selected)
				{
					// Passed through as prod did, including the temporary `new_<random>` id of a section
					// created in the inline editor: the server resolves it against the sections it has just
					// created (AutomatedSolution\Action\LegacySet). Casting it to an integer would mean 0,
					// i.e. "detach the type from its section".
					customSectionId = selected.id;
				}
			}

			return { customSectionId, customSections: this.customSections };
		},
		emitUpdate(): void
		{
			this.$emit('update', this.getData());
		},
		// Rebuild the section list and the selector from the given baseline: the `snapshot` prop on create,
		// the post-revert store values passed by the app on cancel (the prop is still the old render).
		applySnapshot(baseline: HubBaseline): void
		{
			this.loadSections(baseline);
			this.reInitSelector();
			this.enabled = hasSelectedCustomSection(this.customSections);
			if (this.isPermissionsResetAlertShown)
			{
				this.isPermissionsResetAlertShown = false;
				this.permissionsResetAlert?.hide?.();
			}
		},
		reset(baseline: HubBaseline): void
		{
			this.applySnapshot(baseline);
		},
		registerInRegistry(): void
		{
			const registry = this.hubControlRegistry as Record<string, any> | null;
			if (registry)
			{
				registry[this.descriptor.id] = {
					applySnapshot: (baseline: HubBaseline) => this.applySnapshot(baseline),
					reset: (baseline: HubBaseline) => this.reset(baseline),
					openSelector: () => this.openSelector(),
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
		<div class="crm-type-hub-custom-section" :class="{ '--disabled': disabled, '--compact': compact }">
			<div v-show="!compact" class="crm-type-hub-custom-section__switch">
				<div
					class="crm-type-hub-custom-section__switch-toggle"
					:tabindex="isSwitcherDisabled ? -1 : 0"
					role="switch"
					:aria-checked="ariaChecked"
					:aria-labelledby="switcherLabelId"
					data-testid="crm-type-detail-custom-section-switch"
					@keydown="handleSwitcherKeydown"
				>
					<Switcher
						:is-checked="enabled"
						:is-disabled="isSwitcherDisabled"
						:options="switcherOptions"
						:id="descriptor.legacyBinding && descriptor.legacyBinding.switcherId"
						aria-hidden="true"
						@check="handleSwitcherCheck"
						@uncheck="handleSwitcherUncheck"
					/>
				</div>
				<TextSm :id="switcherLabelId">{{ loc('CRM_TYPE_DETAIL_CUSTOM_SECTION_SWITCHER_MSGVER_1') }}</TextSm>
			</div>
			<div
				v-show="compact || enabled"
				ref="container"
				class="crm-type-custom-section-container"
				:class="{ 'crm-type-hub-custom-section__host': compact }"
			>
				<div v-show="!compact" class="crm-type-relation-subtitle">{{ loc('CRM_TYPE_DETAIL_CUSTOM_SECTION_LABEL_MSGVER_1') }}</div>
				<div ref="selector"></div>
			</div>
		</div>
	`,
});

// Slider destroy is only observable in the top window — the same window ToolbarComponent.Instance
// resolves to from inside a slider.
function getTopEventEmitter(): TopEventEmitter | null
{
	return (window.top as any)?.BX?.Event?.EventEmitter ?? null;
}

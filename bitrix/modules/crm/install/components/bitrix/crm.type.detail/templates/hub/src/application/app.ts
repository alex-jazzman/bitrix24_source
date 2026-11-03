import { BitrixVue, defineComponent, markRaw, provide, ref, type PropType } from 'ui.vue3';
import { createPinia } from 'ui.vue3.pinia';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { Dom, Loc, Page, Reflection, Type, Uri } from 'main.core';
import { Builder, Dictionary } from 'crm.integration.analytics';
import { ConfirmationDialog } from 'crm.dialog';
import { Router } from 'crm.router';
import { ToolbarComponent } from 'crm.toolbar-component';
import { MessageBox } from 'ui.dialogs.messagebox';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { sendData as sendAnalyticsData } from 'ui.analytics';
import { CrmHubShell, CrmHubSavePanel, normalizeHubDescription } from 'crm.settings-hub';

import { SpControlType } from '../const/descriptor';
import { useTypeHubStore } from '../model/type-hub-store';
import { TypeFormAdapter } from '../infrastructure/service/type-form-adapter';
import { SaveType, getCurrentSlider } from '../feature/save-type';
import { DeleteType } from '../feature/delete-type';
import { ConfirmCloseGuard } from '../feature/confirm-close';
import { DeferredTypeUpdate } from '../feature/deferred-type-update';
import { dropFrameQueryParams, readSavedCustomSectionState, resolveAfterSaveAction } from '../lib/after-save/after-save';
import { applyChildToggle, applyMasterToggle } from '../lib/linked-user-fields-sync/linked-user-fields-sync';
import { canRegisterCancelEvent, resolveCancelElement } from '../lib/cancel-attribution/cancel-attribution';
import { resolveCreationPreviewState } from '../lib/creation-preview/creation-preview';
import {
	buildTypeDetailReloadUri,
	type CreatedTypeInfo,
	readCreatedType,
} from '../lib/type-detail-reload-uri/type-detail-reload-uri';
import { resolveHubRecords } from '../lib/hub-records/hub-records';
import {
	resolveActiveSectionId,
	resolveDesignedSectionIds,
	resolveHubSections,
} from '../lib/hub-sections/hub-sections';
import { resolveCardsLayouts } from '../const/cards-layouts';
import {
	BIZ_PROC_DESIGNER_ACTION,
	CATEGORY_LIST_ACTION,
	HANDLED_ACTION_KEYS,
	PERMISSIONS_ACTION,
	RECYCLE_BIN_ACTION,
} from '../const/action-keys';
import { resolveActionUrl } from '../lib/resolve-feature-card-action/resolve-feature-card-action';
import { revertForm } from '../lib/revert-form/revert-form';
import { settleSavedDescription, toDescriptionValue } from '../lib/saved-description/saved-description';
import { type HubBaseline } from '../lib/hub-baseline/hub-baseline';
import { isTypeHubPanelFixed } from '../lib/panel-fixed-state/panel-fixed-state';
import { CrmTypeHubRelationControl } from '../component/relation-control';
import { CrmTypeHubCustomSectionControl } from '../component/custom-section-control';
import { CrmTypeHubLinkedUserFieldsControl } from '../component/linked-user-fields-control';
import { CrmTypeHubCardsSection } from '../component/cards-section';
import { CrmTypeHubPassport } from '../component/passport';
import { CrmTypeHubPermissionsSection } from '../component/permissions-section';
import { CrmTypeHubRelationsSection } from '../component/relations-section';

import '../style.css';

declare const BX: any;

// Opens the CRM permissions slider instead of switching to a section (see openPermissionsSlider).
const PERMISSIONS_SECTION_ID = 'permissions';

// Set on <html> while the hub is mounted; see style.css for what needs it.
const HOST_CLASS = 'crm-type-hub-host';

// Context of the screen the creation was started from, carried over to the address of the created
// type: the automated solution the process belongs to (isExternal + automatedSolutionId) and the
// analytics sub-section the hub was opened from. Read off the current address rather than off the app
// params, because that is where they arrived from and what the next load parses again.
const CARRIED_QUERY_PARAM_NAMES: ReadonlyArray<string> = ['isExternal', 'automatedSolutionId', 'c_sub_section'];

const HubApp = defineComponent({
	name: 'CrmTypeHubApp',
	components: {
		UiButton,
		CrmHubShell,
		CrmHubSavePanel,
		CrmTypeHubPassport,
		CrmTypeHubPermissionsSection,
		CrmTypeHubCardsSection,
		CrmTypeHubRelationsSection,
	},
	props: {
		params: {
			type: Object as PropType<Record<string, any>>,
			required: true,
		},
	},
	setup(props)
	{
		const params = props.params;
		const store = useTypeHubStore();

		// Which tree the hub draws. Decided by the server (module option crm/type_hub_sections_v2)
		// because the left menu is already rendered by PHP when this runs; the client only follows.

		// Everything the creation mode costs the screen, decided once (src/lib/creation-preview). The
		// flag itself is the server's: the same template serves the draft and the saved type.
		const creationPreview = resolveCreationPreviewState(params);

		const isWaiting = ref(false);
		const errors = ref<string[]>([]);
		const isCancelEventRegistered = ref(false);
		// Element of a close whose cancel event is postponed until the exit is confirmed (Esc).
		const deferredCancelElement = ref<string | null>(null);
		const currentSliderEvent = ref<any>(null);

		const linkedUserFieldsMeta = buildLinkedUserFieldsMeta(params.linkedUserFields);
		const customSectionMeta = {
			isCreateSectionsViaAutomatedSolutionDetails: Boolean(params.isCreateSectionsViaAutomatedSolutionDetails),
			canEditAutomatedSolution: Boolean(params.canEditAutomatedSolution),
			switcherDisabled: Boolean(params.isNew) || !params.canToggleAutomatedSolutionSwitcher,
			isNew: Boolean(params.isNew),
			permissionsUrl: params.permissionsUrl ?? null,
		};

		store.init(
			buildInitialValues(params),
			resolveActiveSectionId(String(params.activeTabId ?? 'common'), Boolean(params.isExternal)),
		);

		const adapter = markRaw(new TypeFormAdapter(
			params.type,
			Boolean(params.isCustomSectionsAvailable),
			normalizeHubDescription,
		));
		const getTypeId = (): number => Number(adapter.getModel().getId() ?? 0);
		const showErrors = (list: string[]): void => {
			errors.value = Array.isArray(list) ? list : [String(list)];
		};

		// The update event of a save that leaves the slider open waits for the slider to close
		// (handleSliderCloseStart): sent at once, it would make the page behind reload itself and the
		// slider with it (src/feature/deferred-type-update).
		const deferredTypeUpdate = markRaw(new DeferredTypeUpdate(
			(payload) => ToolbarComponent.Instance.emitTypeUpdatedEvent(payload),
		));
		// The creation screen this slider showed before handed its event over on the way here.
		const currentSliderData = getCurrentSlider()?.data;
		if (currentSliderData)
		{
			deferredTypeUpdate.pickUp(currentSliderData);
		}

		let saveAnalyticsBuilder: any = null;
		const saveType = markRaw(new SaveType({
			adapter,
			getValues: () => store.values,
			commitSnapshot: (values) => store.commitSnapshot(values),
			getTypeId,
			isRestricted: Boolean(params.isRestricted),
			isWaiting: () => isWaiting.value,
			sendAnalytics: (status, id) => {
				if (status === 'attempt')
				{
					saveAnalyticsBuilder = adapter.isSaved()
						? new Builder.Automation.Type.EditEvent()
						: new Builder.Automation.Type.CreateEvent();
					saveAnalyticsBuilder.setIsExternal(Boolean(params.isExternal));
					saveAnalyticsBuilder.setElement(Dictionary.ELEMENT_CREATE_BUTTON);
					if (getTypeId() > 0)
					{
						saveAnalyticsBuilder.setId(getTypeId());
					}

					const currentUrl = new Uri(decodeURI(window.location.href));
					const subSection = currentUrl.getQueryParam('c_sub_section');
					if (subSection && saveAnalyticsBuilder instanceof Builder.Automation.Type.EditEvent)
					{
						saveAnalyticsBuilder.setSubSection(subSection);
					}
				}
				else
				{
					saveAnalyticsBuilder.setId(id);
				}

				sendAnalyticsData(saveAnalyticsBuilder.setStatus(status).buildData());
			},
			showRestriction: () => {
				if (
					Type.isStringFilled(params.restrictionSliderCode)
					&& Reflection.getClass('BX.UI.InfoHelper.show')
				)
				{
					BX.UI.InfoHelper.show(params.restrictionSliderCode);
				}
				else
				{
					showErrors([String(params.restrictionErrorMessage ?? '')]);
				}
			},
			afterSave: (response) => {
				const slider = getCurrentSlider();
				slider?.data?.set('response', response);

				const data = response.data as { urlTemplates?: Object, isUrlChanged?: boolean };
				if (Object.hasOwn(data, 'urlTemplates'))
				{
					Router.Instance.setUrlTemplates(data.urlTemplates as any);
				}

				// Three outcomes, decided by resolveAfterSaveAction (src/lib/after-save):
				//  - 'navigate': a type created from the preview does not close the screen it was created
				//    on — the slider goes to the address of the type that now exists, and the hub opens
				//    there with everything live. The address is built only after setUrlTemplates above:
				//    that call registers the custom root of the new type, so a process created inside an
				//    automated solution gets its section's address and not the default one. A standalone
				//    page (getCurrentSlider() answers null there, e.g. /type/detail/0/ opened directly)
				//    goes to the same address without the IFRAME params, so that the creation mode ends
				//    and the next "Сохранить" does not call add again.
				//  - 'stay': the settings of a saved type never close the slider, and a standalone page
				//    has nothing to close. The form becomes the saved state in place (handleSavedInPlace),
				//    and the update event waits for the slider to close.
				//  - 'close': the creation screen in a slider with nowhere to go — no type in the
				//    response, or no address built for it. Staying there would let the next save add a
				//    second type.
				// A save outside the preview reads nothing and builds nothing here.
				const created: CreatedTypeInfo = creationPreview.active
					? readCreatedType(response.data)
					: null;
				const reloadUri = created === null
					? ''
					: resolveCreationReloadUri(params, created, Boolean(slider));

				const action = resolveAfterSaveAction({
					isInSlider: Boolean(slider),
					wasCreationPreview: creationPreview.active,
					created,
					reloadUri,
				});

				if (action === 'navigate')
				{
					// SaveType releases the wait state before it calls this (setWaiting(false) then
					// afterSave), and this branch does not finish the screen — it sends the frame to the
					// address of the new type, seconds more of waiting. Taking the state back here, in the
					// same synchronous run, means Vue never renders the gap between the two: the hero
					// button keeps its spinner until the document is replaced instead of looking alive
					// again for the last stretch. The guards of SaveType are untouched — #inProgress is
					// already false, and this window is on its way out anyway.
					isWaiting.value = true;

					// The type update event goes to the TOP window, and the page there may answer it by
					// reloading ITSELF — the kanban of a smart process does so on any update, the list of
					// types on isUrlChanged — which would tear down the slider we are about to navigate,
					// together with the hub the user was promised. So in a slider the event waits for the
					// close like any other save that keeps the slider open: it is handed over through the
					// slider's data to the hub that loads at the new address.
					if (slider?.data)
					{
						deferredTypeUpdate.handOver(slider.data, data.isUrlChanged === true);
					}
					else
					{
						ToolbarComponent.Instance.emitTypeUpdatedEvent({ isUrlChanged: false });
					}

					// Deferred by one macrotask, like the same manoeuvre in crm.automated_solution.details
					// (types-control.ts): the save promise is still unwinding here, and the success
					// analytics sent just before this is a plain XHR that a self-navigation would cancel.
					// A standalone page replaces its history entry: "Назад" must not bring back the filled
					// creation form of a type that already exists.
					setTimeout(() => {
						if (slider)
						{
							window.location.href = reloadUri;
						}
						else
						{
							window.location.replace(reloadUri);
						}
					});

					return;
				}

				if (action === 'close')
				{
					slider?.close();
					ToolbarComponent.Instance.emitTypeUpdatedEvent({ isUrlChanged: data.isUrlChanged === true });

					return;
				}

				// 'stay'. The banner of an earlier failed attempt goes: success used to close the slider,
				// so nothing ever had to clear it.
				errors.value = [];

				if (slider)
				{
					deferredTypeUpdate.defer(data.isUrlChanged === true);
				}
				else
				{
					ToolbarComponent.Instance.emitTypeUpdatedEvent({ isUrlChanged: data.isUrlChanged === true });
				}

				// Synchronous: the listener re-seeds the form in this same run (handleSavedInPlace).
				EventEmitter.emit('BX.Crm.TypeDetailHub:savedInPlace', { responseData: response.data });
			},
			setWaiting: (waiting) => {
				isWaiting.value = waiting;
			},
			showErrors,
			markCancelEventRegistered: () => {
				isCancelEventRegistered.value = true;
			},
			normalizeValues: () => store.normalizeDaysBeforeClose(),
		}));

		let deleteAnalyticsBuilder: any = null;
		const deleteType = markRaw(new DeleteType({
			isWaiting: () => isWaiting.value,
			setWaiting: (waiting) => {
				isWaiting.value = waiting;
			},
			confirm: ({ onAccept, onCancel }) => {
				const currentUrl = new Uri(decodeURI(window.location.href));
				deleteAnalyticsBuilder = new Builder.Automation.Type.DeleteEvent()
					.setElement(Dictionary.ELEMENT_DELETE_BUTTON)
					.setIsExternal(Boolean(params.isExternal))
					.setSubSection(currentUrl.getQueryParam('c_sub_section') ?? null)
					.setId(getTypeId())
				;

				const message = Loc.getMessage('CRM_TYPE_DETAIL_DELETE_CONFIRM') ?? '';
				const messageBox = MessageBox.confirm(
					message,
					(box: MessageBox) => {
						box.getPopupWindow().setClosingByEsc(false);
						box.getCancelButton().setDisabled(true);

						return onAccept();
					},
					null,
					() => {
						onCancel();

						return true;
					},
				);
				const popup = messageBox.getPopupWindow();
				Dom.attr(popup.getPopupContainer(), 'aria-label', message);
				Dom.attr(popup.getPopupContainer(), 'data-testid', 'crm-type-detail-hub-delete-confirm-dialog');
				messageBox.getOkButton().getDataSet().testid = 'crm-type-detail-hub-delete-confirm-btn';
				messageBox.getCancelButton().getDataSet().testid = 'crm-type-detail-hub-delete-cancel-btn';
				popup.setClosingByEsc(true);
				popup.subscribe('onClose', onCancel);
			},
			sendAnalytics: (status) => {
				sendAnalyticsData(deleteAnalyticsBuilder.setStatus(status).buildData());
			},
			requestDelete: () => adapter.delete(),
			afterDelete: (response) => {
				const data = response.data as { isUrlChanged?: boolean };
				// Saves made before the delete ride on this one event: the close below must not send a second.
				ToolbarComponent.Instance.emitTypeUpdatedEvent({
					isUrlChanged: deferredTypeUpdate.absorb(Type.isObject(data) && data.isUrlChanged === true),
				});
				const typeListUrl = Router.Instance.getTypeListUrl();
				if (typeListUrl)
				{
					Router.Instance.closeSliderOrRedirect(typeListUrl);
				}
				else
				{
					getCurrentSlider()?.close();
				}
			},
			showErrors,
			commitSnapshot: () => store.commitSnapshot(),
			markCancelEventRegistered: () => {
				isCancelEventRegistered.value = true;
			},
		}));

		const openConfirmDialog = (): Promise<boolean> => new Promise((resolve) => {
			const dialog = ConfirmationDialog.create('crm-type-hub-close', {
				title: Loc.getMessage('CRM_TYPE_DETAIL_HUB_CLOSE_CONFIRM_TITLE'),
				content: Loc.getMessage('CRM_TYPE_DETAIL_HUB_CLOSE_CONFIRM_TEXT'),
			});
			dialog.open()
				.then((result: { cancel: boolean }) => resolve(!result.cancel))
				.catch(() => resolve(false));
		});

		const confirmClose = markRaw(new ConfirmCloseGuard({
			isDirty: () => store.isDirty,
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

		const records = resolveHubRecords(Boolean(params.isCustomSectionsAvailable));

		const controlRegistry: Record<string, any> = {};
		provide('hubControlRegistry', controlRegistry);

		const formControls = markRaw({
			[SpControlType.Relation]: CrmTypeHubRelationControl,
			[SpControlType.CustomSection]: CrmTypeHubCustomSectionControl,
			[SpControlType.LinkedUserFields]: CrmTypeHubLinkedUserFieldsControl,
		});

		return {
			store,
			sections: resolveHubSections(),
			records,
			formControls,
			adapter,
			saveType,
			deleteType,
			deferredTypeUpdate,
			AirButtonStyle,
			ButtonSize,
			confirmClose,
			controlRegistry,
			linkedUserFieldsMeta,
			customSectionMeta,
			creationPreview,
			isWaiting,
			errors,
			isCancelEventRegistered,
			deferredCancelElement,
			currentSliderEvent,
			// Read once here, while the app is being mounted: by then the page has already filled the
			// crm.router registry from its own below_pagetitle script (see resolveCategoryListUrl).
			categoryListUrl: resolveCategoryListUrl(params),
			DESIGNED_SECTION_IDS: resolveDesignedSectionIds(),
			// Slot name precomputed rather than built in the template: a dynamic slot name is a
			// dynamic directive argument, and an expression with quotes and spaces inside one is not
			// read reliably by the compiler.
			cardsSections: resolveCardsLayouts().map((layout) => ({
				slotName: `section-${layout.sectionId}`,
				layout,
			})),
		};
	},
	computed: {
		snapshot(): HubBaseline
		{
			return this.buildSnapshot();
		},
		// Addresses of the hub actions this user can reach, keyed by action key: the server map plus
		// the one address the client owns, of the funnels editor. A read-only param of the same kind as
		// categoriesCount: it reaches the rows through the snapshot and is read again when a button is
		// clicked, but never enters the store. A key the user cannot reach is absent from the map, which
		// is the whole of what "no button" means.
		actionUrls(): Readonly<Record<string, unknown>>
		{
			const serverUrls = (this.params.hubActionUrls as Record<string, unknown> | undefined) ?? {};
			if (this.categoryListUrl === null)
			{
				return serverUrls;
			}

			return { ...serverUrls, [CATEGORY_LIST_ACTION]: this.categoryListUrl };
		},
		activeSectionId(): string
		{
			return this.store.activeSectionId;
		},
		isDirty(): boolean
		{
			return this.store.isDirty;
		},
		isPanelFixed(): boolean
		{
			return isTypeHubPanelFixed(this.isDirty, Boolean(this.params.isNew), this.creationPreview.active);
		},
		// Handed to the content of every section slot as `:inert`, never to the root: the hero is
		// rendered INSIDE the shell (slot #passport), inert is inherited, and no descendant can opt out
		// of it — the hero would go dark together with the sections it is supposed to survive.
		contentInert(): boolean
		{
			return this.creationPreview.contentInert;
		},
		// The hero stays live through the whole creation screen, and that is right up to the moment the
		// payload leaves: from then on the pencil of the name and the placement button accept edits that
		// have nowhere to go. Raising read-only for the wait turns both off through the kit
		// (passport-hero + canEditCustomSection), and the passport closes the name editor already open
		// for the wait. Bound to the preview mode, so the saved type keeps its
		// editable hero exactly as before.
		isHeroReadOnly(): boolean
		{
			return this.creationPreview.active && this.isWaiting;
		},
		// The one column a type really requires is its title, and a draft has none until it is typed.
		// The hero's own Save button is the only way to send the draft, so this is what keeps an
		// empty name from being sent: the guard is here and not in the hero, which has no store to ask.
		isCreationSaveDisabled(): boolean
		{
			return String(this.store.title ?? '').trim() === '';
		},
	},
	mounted(): void
	{
		EventEmitter.subscribe('SidePanel.Slider:onClose', this.handleSliderClose);
		EventEmitter.subscribe('SidePanel.Slider:onCloseByEsc', this.handleSliderCloseByEsc);
		EventEmitter.subscribe('SidePanel.Slider:onLoad', this.handleSliderLoad);
		EventEmitter.subscribe('BX.Crm.TypeDetailHub:showSection', this.handleShowSection);
		EventEmitter.subscribe('SidePanel.Slider:onCloseStart', this.handleSliderCloseStart);
		EventEmitter.subscribe('BX.Crm.TypeDetailHub:savedInPlace', this.handleSavedInPlace);
		// Marker for the few rules that have to reach ABOVE the hub's own root — the slider's flex row
		// holding the menu and the content is our ancestor, not our descendant (see style.css). Put on
		// the root element rather than <body>, which the slider host rewrites.
		Dom.addClass(document.documentElement, HOST_CLASS);
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe('SidePanel.Slider:onClose', this.handleSliderClose);
		EventEmitter.unsubscribe('SidePanel.Slider:onCloseByEsc', this.handleSliderCloseByEsc);
		EventEmitter.unsubscribe('SidePanel.Slider:onLoad', this.handleSliderLoad);
		EventEmitter.unsubscribe('BX.Crm.TypeDetailHub:showSection', this.handleShowSection);
		EventEmitter.unsubscribe('SidePanel.Slider:onCloseStart', this.handleSliderCloseStart);
		EventEmitter.unsubscribe('BX.Crm.TypeDetailHub:savedInPlace', this.handleSavedInPlace);
		Dom.removeClass(document.documentElement, HOST_CLASS);
	},
	methods: {
		// The single composition of what the controls read: current store values plus the static params
		// meta. The cancel path composes it again from the reverted store instead of waiting for the
		// re-render, so both paths read the same shape.
		buildSnapshot(): HubBaseline
		{
			return {
				...this.store.values,
				isCategoriesControlDisabled: this.params.isCategoriesControlDisabled,
				// Read-only server count, not an editable form value: it must stay out of the store, or it
				// would be compared by isDirty and could leak into the save payload.
				categoriesCount: Number(this.params.categoriesCount ?? 0),
				isRecyclebinControlDisabled: this.params.isRecyclebinControlDisabled,
				hubActionUrls: this.actionUrls,
				linkedUserFieldsMeta: this.linkedUserFieldsMeta,
				relationsCatalog: this.params.relationsCatalog,
				customSectionMeta: this.customSectionMeta,
			};
		},
		handleUpdate(payload: { id: string, valueKey: string, value: any }): void
		{
			const { id, valueKey, value } = payload;

			if (id === 'sp-relation-parent')
			{
				this.store.setRelationDirection('parent', value);

				return;
			}

			if (id === 'sp-relation-child')
			{
				this.store.setRelationDirection('child', value);

				return;
			}

			if (id === 'sp-custom-section')
			{
				this.store.setCustomSectionState(value);

				return;
			}

			if (id === 'sp-linked-user-fields')
			{
				const synced = applyChildToggle({
					master: Boolean(this.store.isUseInUserfieldEnabled),
					items: value,
				});
				this.store.setLinkedUserFields(synced.items);
				this.store.setField('isUseInUserfieldEnabled', synced.master);

				return;
			}

			if (valueKey)
			{
				this.store.setField(valueKey, value);

				if (valueKey === 'isUseInUserfieldEnabled')
				{
					const synced = applyMasterToggle({
						master: Boolean(value),
						items: this.store.linkedUserFields,
					});
					this.store.setLinkedUserFields(synced.items);
				}
			}
		},
		// "Access permissions" is not a settings surface of its own — everything it held was one button
		// into the CRM permissions slider of this type, so the menu item opens that slider directly and
		// the hub stays on the section it was already showing. The wrappermenu moves its own highlight
		// on click, so it is put back on the next macrotask, once that handler has run. Returns false
		// when the server sent no url (no rights to configure permissions) — then the section layout
		// still renders as before, which is why it is kept rather than deleted.
		openPermissionsSlider(): boolean
		{
			// The section menu is not a descendant of the hub root (it is rendered into the slider's
			// left panel), so nothing the preview does to the content reaches it and "Права доступа"
			// stays clickable there. Its url is built from the entityTypeId of a type that does not
			// exist yet: the slider would open on permissions of nothing. Answering false here is the
			// same answer as "the server sent no url" — the menu item falls back to showing the section,
			// dimmed like every other one, instead of doing something the user cannot undo.
			if (this.creationPreview.active)
			{
				return false;
			}

			if (!Type.isStringFilled(this.params.permissionsUrl))
			{
				return false;
			}

			BX.SidePanel?.Instance?.open(this.params.permissionsUrl);
			setTimeout(() => this.syncMenuHighlight(this.store.activeSectionId), 0);

			return true;
		},
		// HANDLED_ACTION_KEYS is the gate of this handler: the two keys named below have a destination
		// of their own, and everything else it admits is a server-addressed key.
		handleAction(payload: { id: string, actionKey: string }): void
		{
			const { actionKey } = payload;

			if (!HANDLED_ACTION_KEYS.has(actionKey))
			{
				return;
			}

			if (actionKey === PERMISSIONS_ACTION)
			{
				this.openPermissionsSlider();

				return;
			}

			if (actionKey === CATEGORY_LIST_ACTION)
			{
				this.openCategoryList();

				return;
			}

			this.openServerAddressedAction(actionKey);
		},
		// Same address the button was drawn from, read from the same map: the funnels editor opens in a
		// slider of its own width rather than the host's. No address means no button, so reaching here
		// without one is not a state the screen can produce.
		openCategoryList(): void
		{
			const url = resolveActionUrl(CATEGORY_LIST_ACTION, this.actionUrls);
			if (url === null)
			{
				return;
			}

			Router.openSlider(url, { width: 900 });
		},
		// The address is only ever taken from the server map, never composed here, and a key the map has
		// no address for is a no-op: its button was not drawn in the first place.
		//
		// Documents and requisites open the way the permissions button does: a nested slider over the
		// settings screen, of the host's own width, through the same Router.openSlider as the funnels
		// editor above — so they get the same non-cacheable default, since these pages are edited in
		// place and a cached slider would show a stale snapshot on the next open.
		//
		// The business process designer is a legacy page the portal template does not frame as a slider:
		// under IFRAME=Y it arrives with an empty <head>, so neither BX nor the grid on it ever
		// initializes. It opens as an ordinary browser tab instead, which also leaves the hub form it was
		// clicked from untouched. The recycle bin takes the same tab for that second reason alone: it is
		// a screen of its own to work in, and the settings form it was opened from keeps the state it was
		// left in, unsaved edits included.
		openServerAddressedAction(actionKey: string): void
		{
			const url = resolveActionUrl(actionKey, this.actionUrls);
			if (url === null)
			{
				return;
			}

			if (actionKey === BIZ_PROC_DESIGNER_ACTION || actionKey === RECYCLE_BIN_ACTION)
			{
				Page.redirect(url, { newTab: true });

				return;
			}

			Router.openSlider(url);
		},
		handleDelete(): void
		{
			this.deleteType.execute();
		},
		handleSave(): void
		{
			this.saveType.execute();
		},
		// Cancel action: the baseline is composed after the store revert and handed to the controls, since
		// their `snapshot` prop is still the pre-revert render at this point.
		handleCancel(): void
		{
			revertForm(this.store, Object.values(this.controlRegistry), () => this.buildSnapshot());
		},
		// A save that leaves the screen open (afterSave, 'stay'): the form becomes the saved state, as if
		// it had just been loaded. SaveType has already committed the sent values as the snapshot.
		//  - An edit made while the request was in flight (the settings do not lock their controls) keeps
		//    the form dirty, and then nothing is re-seeded: the revert below would wipe that edit.
		//  - The placement is taken from the server's answer: the store follows customSectionId only,
		//    its isSelected flags are those of the load, and a section typed in the inline editor still
		//    carries its temporary id.
		//  - Then the same path as "Отменить": the store "reverts" to the snapshot just committed, that
		//    is stays as it is, and every registered control gets the full baseline — the placement
		//    control re-reads its original section and drops the permissions warning, the relations
		//    section drops the smart processes left switched off (D-35).
		handleSavedInPlace(event: BaseEvent): void
		{
			const data = event.getData() as { responseData?: unknown } | null;
			if (!settleSavedDescription(this.store, data?.responseData))
			{
				return;
			}

			const saved = readSavedCustomSectionState(data?.responseData);
			if (saved !== null)
			{
				this.store.setCustomSectionState(saved);
				this.store.commitSnapshot();
			}

			revertForm(this.store, Object.values(this.controlRegistry), () => this.buildSnapshot());
		},
		// "Отменить" of the creation screen. A branch of its own and not handleCancel: the kit panel's
		// cancel only reverts the form and stays, here the whole screen is left and nothing is sent.
		// The revert comes first and is not cosmetic: it clears isDirty, so the close below passes
		// ConfirmCloseGuard without its dialog — this button is the deliberate exit without saving —
		// and handleSliderClose reports the cancel analytics on the ordinary close path. The close
		// itself is the one the delete already uses: the slider closes, a standalone page goes to the
		// list of types. The pattern is the creation screen of a workplace (handleCreateCancel there).
		handleCreationCancel(): void
		{
			if (this.isWaiting)
			{
				return;
			}

			this.handleCancel();

			const typeListUrl = Router.Instance.getTypeListUrl();
			if (typeListUrl)
			{
				Router.Instance.closeSliderOrRedirect(typeListUrl);
			}
			else
			{
				getCurrentSlider()?.close();
			}
		},
		hideErrors(): void
		{
			this.errors = [];
		},
		handleShowSection(event: BaseEvent): void
		{
			const data = event.getData();
			if (data && Type.isStringFilled(data.sectionId))
			{
				const sectionId = String(data.sectionId);

				if (sectionId === PERMISSIONS_SECTION_ID && this.openPermissionsSlider())
				{
					return;
				}

				const isSameSection = this.store.activeSectionId === sectionId;

				this.store.setActiveSection(sectionId);
				this.syncMenuHighlight(sectionId);

				if (!isSameSection)
				{
					this.scrollToSectionStart();
				}
			}
		},
		// A settings tab opens at its own beginning. The shell focuses the section for screen readers
		// with preventScroll, so nothing moves the viewport on its own any more — which alone would
		// leave the offset of the tab we just left and drop the reader into the middle of the new one.
		// Re-entering the section already shown is not a switch and must not throw away the position.
		// Both hosts run this in one document (standalone page, slider iframe), so window is the right
		// scroller for both.
		scrollToSectionStart(): void
		{
			window.scrollTo({ top: 0, left: 0 });
		},
		// ui.sidepanel.wrappermenu marks the active item with a class on the .ui-sidepanel-menu-item
		// <li> that wraps the [data-role] link (see its result_modifier.php / script.js); its own
		// click handler keeps that in sync, but a programmatic section switch (e.g. from the passport
		// meta button) bypasses it, so the highlight is re-synced here by hand. Defensive: the menu is
		// absent on the standalone page, where the selector simply matches nothing.
		syncMenuHighlight(sectionId: string): void
		{
			const items = document.querySelectorAll('[data-role^="hub-section-"]');
			items.forEach((item) => {
				const target = item.closest('.ui-sidepanel-menu-item') ?? item;
				const isActive = item.getAttribute('data-role') === `hub-section-${sectionId}`;
				Dom.toggleClass(target as HTMLElement, 'ui-sidepanel-menu-active', isActive);
				// The class only paints the <li>. The state itself belongs on the item the reader stops
				// on, which is the [data-role] link, not its wrapper.
				Dom.attr(item as HTMLElement, 'aria-current', isActive ? 'true' : null);
			});
		},
		// The last one to touch the focus when the creation screen opens is the slider itself: on the
		// frame's `load` it calls FocusTrap.applyInitialFocus() (main/install/js/main/sidepanel/src/
		// slider.ts) and moves the focus to its container in the parent document, putting out the caret
		// the passport set on mount. This event reaches the frame RIGHT AFTER that, so the caret is put
		// back here — as the last move, not in a race with the slider. A timer would not do: the slider
		// takes up to several seconds to load.
		//
		// Creation only: on the editing screen of a saved type nobody puts the caret anywhere, and
		// creationPreview.active is the same latch the markup uses, so the reload of the slider onto the
		// address of the created type (a new frame, a new app instance) does not get here.
		handleSliderLoad(event: BaseEvent): void
		{
			if (!this.creationPreview.active)
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
			if (canRegisterCancelEvent(this.store.isDirty, this.confirmClose.isCloseConfirmed))
			{
				this.registerCancelEvent(null);
			}

			this.confirmClose.handleClose();
		},
		// The update event of the saves this slider kept open goes out when it really closes. onCloseStart
		// is fired synchronously inside close(), after canClose() — a close denied by ConfirmCloseGuard
		// never gets here, and no animation stands in the way, so this is the very moment the old
		// "close, then emit" had. onCloseComplete would wait for an animation that may never finish.
		// Matched by the frame window, like handleSliderDestroy of the placement control.
		handleSliderCloseStart(event: BaseEvent): void
		{
			const [sliderEvent] = event.getData();
			const slider = sliderEvent?.getSlider?.();
			if (slider?.getFrameWindow?.() !== window)
			{
				return;
			}

			this.deferredTypeUpdate.flush(slider.data);
		},
		handleSliderCloseByEsc(event: BaseEvent): void
		{
			const [sliderEvent] = event.getData();
			if (sliderEvent.getSlider() !== getCurrentSlider())
			{
				return;
			}

			if (canRegisterCancelEvent(this.store.isDirty, this.confirmClose.isCloseConfirmed))
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

			const builder: any = this.adapter.isSaved()
				? new Builder.Automation.Type.EditEvent()
				: new Builder.Automation.Type.CreateEvent();
			builder.setIsExternal(Boolean(this.params.isExternal));
			const typeId = Number(this.adapter.getModel().getId() ?? 0);
			if (typeId > 0)
			{
				builder.setId(typeId);
			}
			const currentUrl = new Uri(decodeURI(window.location.href));
			const subSection = currentUrl.getQueryParam('c_sub_section');
			if (subSection && builder instanceof Builder.Automation.Type.EditEvent)
			{
				builder.setSubSection(subSection);
			}

			sendAnalyticsData(
				builder
					.setElement(resolveCancelElement(this.deferredCancelElement, element))
					.setStatus(Dictionary.STATUS_CANCEL)
					.buildData(),
			);
		},
	},
	template: `
		<div
			class="crm-type-hub"
			:class="[{ '--designed-section': DESIGNED_SECTION_IDS.includes(activeSectionId) }, creationPreview.rootModifierClass]"
			data-testid="crm-type-detail-hub-root"
		>
			<div
				v-if="errors.length"
				class="crm-type-hub__errors ui-alert ui-alert-danger"
				role="alert"
				data-testid="crm-type-detail-hub-errors"
			>
				<span class="ui-alert-message">{{ errors.join('') }}</span>
				<button
					type="button"
					class="ui-alert-close-btn crm-type-hub__error-close"
					:aria-label="loc('CRM_TYPE_DETAIL_HUB_ERROR_CLOSE')"
					data-testid="crm-type-detail-hub-error-close"
					@click="hideErrors"
				></button>
			</div>
			<CrmHubShell
				:sections="sections"
				:records="records"
				:snapshot="snapshot"
				:active-section-id="activeSectionId"
				:is-panel-fixed="isPanelFixed"
				:controls="formControls"
				@update="handleUpdate"
				@action="handleAction"
			>
				<!--
					The hero is the one live block of the creation screen, and it is the only slot that
					gets no inert: everything else the shell renders is handed its own below. Its Save
					button is fed from the same state the hidden save panel would have used — isWaiting is
					moved by SaveType itself, which also keeps its own double-click guard.
				-->
				<template #passport>
					<CrmTypeHubPassport
						ref="passport"
						:records="records"
						:snapshot="snapshot"
						:controls="formControls"
						:show-creation-save-button="creationPreview.showHeroSaveButton"
						:read-only="isHeroReadOnly"
						:creation-save-in-progress="isWaiting"
						:creation-save-disabled="isCreationSaveDisabled"
						:creation-mode="creationPreview.active"
						@update="handleUpdate"
						@creation-save="handleSave"
						@creation-cancel="handleCreationCancel"
					/>
				</template>
				<!--
					"contentInert || null" and not the bare flag: inert is not one of Vue's special
					boolean attributes, so a false would be written out as inert="false" — an attribute
					that is PRESENT, which is all inertness needs. null removes it instead.
				-->
				<template
					v-for="entry in cardsSections"
					:key="entry.slotName"
					#[entry.slotName]="{ records: sectionRecords }"
				>
					<CrmTypeHubCardsSection
						:layout="entry.layout"
						:records="sectionRecords"
						:snapshot="snapshot"
						:controls="formControls"
						:inert="contentInert || null"
						@update="handleUpdate"
						@action="handleAction"
					/>
				</template>
				<template #section-permissions="{ records: permissionsRecords }">
					<CrmTypeHubPermissionsSection
						:records="permissionsRecords"
						:snapshot="snapshot"
						:controls="formControls"
						:inert="contentInert || null"
						@update="handleUpdate"
						@action="handleAction"
					/>
				</template>
				<template #section-relations="{ records: relationsRecords }">
					<CrmTypeHubRelationsSection
						:records="relationsRecords"
						:snapshot="snapshot"
						:controls="formControls"
						:inert="contentInert || null"
						@update="handleUpdate"
						@action="handleAction"
					/>
				</template>
				<!--
					v-if on the <template> and not inside it: the shell draws the bar's wrapper — a fixed
					white strip with a border — from $slots.panel alone, so a slot that renders nothing
					still leaves the strip standing at the bottom of the creation screen.
				-->
				<template v-if="!creationPreview.hideGlobalSavePanel" #panel>
					<div class="crm-type-hub__panel">
						<CrmHubSavePanel
							:is-dirty="isDirty"
							:is-waiting="isWaiting"
							@save="handleSave"
							@cancel="handleCancel"
						/>
						<div v-if="!params.isNew" class="crm-type-hub__delete-action">
							<UiButton
								:text="loc('CRM_TYPE_DETAIL_HUB_DELETE')"
								:disabled="isWaiting"
								:style="AirButtonStyle.OUTLINE"
								:size="ButtonSize.MEDIUM"
								:dataset="{ testid: 'crm-type-detail-hub-delete-btn' }"
								@click="handleDelete"
							/>
						</div>
					</div>
				</template>
			</CrmHubShell>
		</div>
	`,
});

// The funnels/tunnels editor (Router::getCategoryListUrl, component 'bitrix:crm.sales.tunnels') is
// the one hub action the server sends no address for: building it stays out of DTO-01. The
// client-side crm.router singleton carries the same url-template registry the PHP Router reads from,
// and the hub's own page fills it (Base::addJsRouter prints into below_pagetitle, which the site
// template shows above the component body) before this app is mounted — so the lookup here is
// synchronous and already warm. A portal that does not route the editor answers null, and then the
// button is never drawn instead of doing nothing when clicked.
function resolveCategoryListUrl(params: Record<string, any>): string | null
{
	const entityTypeId = Number((params.type as { entityTypeId?: number } | undefined)?.entityTypeId ?? 0);
	if (entityTypeId <= 0)
	{
		return null;
	}

	const template = (Router.Instance as any).getTemplate?.('bitrix:crm.sales.tunnels', entityTypeId);
	if (!Type.isStringFilled(template))
	{
		return null;
	}

	return String(template).replace('#entityTypeId#', String(entityTypeId));
}

// The address the screen is sent to once the type exists. Router.Instance answers with a Uri object,
// not a string, and with null on a portal where the page is not routed at all — which is answered here
// with the empty string, the one shouldReloadAfterSave reads as "close the way you always did".
// Outside a slider the address loses its IFRAME params: the whole portal page goes there.
function resolveCreationReloadUri(
	params: Record<string, any>,
	created: CreatedTypeInfo,
	isInSlider: boolean,
): string
{
	if (created === null)
	{
		return '';
	}

	const typeDetailUri = Router.Instance.getTypeDetailUrl(created.entityTypeId);
	if (!typeDetailUri)
	{
		return '';
	}

	const reloadUri = buildTypeDetailReloadUri({
		typeDetailUrl: typeDetailUri.toString(),
		// The SERVER's tab dictionary (common / fields / relation / …), which is what class.php reads
		// off the address on the next load — not store.activeSectionId, which speaks the section
		// dictionary of the hub tree (card / process / …) and would be dropped as unknown there.
		activeTabId: Type.isStringFilled(params.activeTabId) ? String(params.activeTabId) : null,
		carryQueryParams: readCarriedQueryParams(),
	});

	return isInSlider ? reloadUri : dropFrameQueryParams(reloadUri);
}

function readCarriedQueryParams(): Record<string, string>
{
	const currentUrl = new Uri(decodeURI(window.location.href));

	const carried: Record<string, string> = {};
	CARRIED_QUERY_PARAM_NAMES.forEach((name) => {
		const value = currentUrl.getQueryParam(name);
		if (Type.isStringFilled(value))
		{
			carried[name] = String(value);
		}
	});

	return carried;
}

function buildLinkedUserFieldsMeta(raw: unknown): Array<{ name: string, title: string }>
{
	if (!Type.isObjectLike(raw))
	{
		return [];
	}

	return Object.entries(raw as Record<string, { title: string }>).map(([name, field]) => ({
		name,
		title: field?.title ?? name,
	}));
}

function buildInitialValues(params: Record<string, any>): Record<string, unknown>
{
	const type = Type.isObjectLike(params.type) ? params.type : {};
	const catalog = Type.isObjectLike(params.relationsCatalog)
		? params.relationsCatalog
		: { parent: [], child: [] };

	const values: Record<string, unknown> = {
		title: type.title ?? '',
		description: toDescriptionValue(params.description),
		daysBeforeClose: params.daysBeforeClose === null || params.daysBeforeClose === undefined
			? ''
			: String(params.daysBeforeClose),
		linkedUserFields: mapLinkedUserFieldValues(params.linkedUserFields),
		relations: {
			parent: catalogToEntries(catalog.parent),
			child: catalogToEntries(catalog.child),
		},
		customSectionId: Number(type.customSectionId ?? 0),
		customSections: Array.isArray(type.customSections) ? type.customSections : [],
		isExternal: Boolean(params.isExternal),
	};

	return { ...pickBooleans(type), ...values };
}

function pickBooleans(type: Record<string, any>): Record<string, boolean>
{
	const result: Record<string, boolean> = {};
	Object.keys(type).forEach((key) => {
		if (Type.isBoolean(type[key]))
		{
			result[key] = type[key];
		}
	});

	return result;
}

function mapLinkedUserFieldValues(raw: unknown): Record<string, boolean>
{
	if (!Type.isObjectLike(raw))
	{
		return {};
	}

	const result: Record<string, boolean> = {};
	Object.entries(raw as Record<string, { isEnabled: boolean }>).forEach(([name, field]) => {
		result[name] = Boolean(field?.isEnabled);
	});

	return result;
}

function catalogToEntries(list: unknown): Array<{ entityTypeId: number, isChildrenListEnabled: boolean }>
{
	if (!Array.isArray(list))
	{
		return [];
	}

	return list
		.filter((relation) => relation && relation.isChecked)
		.map((relation) => ({
			entityTypeId: Number(relation.entityTypeId),
			isChildrenListEnabled: Boolean(relation.isChildrenListEnabled),
		}));
}

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
		this.#app.use(createPinia());
		this.#app.mixin(locMixin);
		this.#app.mount(this.#container);
	}

	stop(): void
	{
		this.#app?.unmount();
		this.#app = null;
	}
}

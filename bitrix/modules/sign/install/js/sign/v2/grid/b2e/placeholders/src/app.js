import { LocMixin } from 'sign.v2.b2e.vue-util';
import { PlaceholderSection, PlaceholderTabs, PlaceholderSearch, RecentFields } from './components';
import { PlaceholderSearchNotFound, PlaceholderSearchNotConfigured } from './components/empty-states/';
import { TabType, SelectorType, SectionType } from './types';
import { Helpdesk } from 'sign.v2.helper';
import { collectRecentFields, SectionFilter } from './section-filter';
import { DeleteFieldConfirmation } from './delete-field-confirmation';
import { panelLanguages, panelRegion } from './extension-settings';
import { CompanySelector } from 'sign.v2.b2e.company-selector';
import { HcmLinkCompanySelector } from 'sign.v2.b2e.hcm-link-company-selector';
import { Dom, Loc, Text, Type } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { LiveAnnouncer } from 'ui.a11y';
import { UI } from 'ui.notification';
import { markRaw } from 'ui.vue3';
import { Api } from 'sign.v2.api';
import { Analytics } from 'sign.v2.analytics';
import { Loader } from 'main.loader';
import { FieldSelector } from 'sign.v2.b2e.field-selector';
import { AirButtonStyle, Button, ButtonIcon, CreateButton } from 'ui.buttons';

const HelpdeskCodes = Object.freeze({
	DocumentEditor: '27216628',
});

const NOTIFICATION_HIDE_DELAY = 4000;
// A refusal of the deletion repeats itself while its reason holds, so the toasts replace one another.
const DELETE_FAILED_NOTIFICATION_ID = 'sign-placeholders-delete-failed';

/** Personal state of the panel: the codes of the copied fields, the modifiers of a copy among them. */
type PersonalSettings = {
	recentFieldCodes: string[],
};

const EMPTY_PERSONAL_SETTINGS: PersonalSettings = Object.freeze({
	recentFieldCodes: [],
});

/**
 * The history reaches the panel from two sides, and they differ in one right alone: the right of the
 * block of the recent fields to take the place of the tree.
 */
const PersonalSettingsSource = Object.freeze({
	FIRST_LOAD: 'firstLoad',
	FIELD_USAGE: 'fieldUsage',
});

/**
 * Personal requests run with `notifyError = false`, so a refusal comes back as a resolved error
 * object instead of a rejection: the answer is judged by its shape.
 */
const isPersonalSettings = (response: mixed): boolean => {
	return Boolean(response)
		&& typeof response === 'object'
		&& Array.isArray(response.recentFieldCodes)
	;
};

/**
 * A refused personal request is an expected answer: the panel works without the personal state and
 * says nothing about it to the user. An answer of an unknown shape is worth the console of the
 * developer, and so is a refused write - see `applyPersonalSettings()`.
 */
const isRefusalOfRequest = (response: mixed): boolean => {
	return response instanceof Error
		|| (Boolean(response) && typeof response === 'object' && Array.isArray(response.errors))
	;
};

/** The refusal of the transport comes either as an error of its own or as the errors of the answer. */
const refusalReason = (response: mixed): string => {
	if (response instanceof Error)
	{
		return response.message;
	}

	const [error] = response?.errors ?? [];

	return [error?.code, error?.message].filter(Boolean).join(': ');
};

// @vue/component
export const PlaceholdersApp = {
	name: 'PlaceholdersApp',
	components: {
		BIcon,
		PlaceholderSection,
		PlaceholderTabs,
		PlaceholderSearch,
		PlaceholderSearchNotFound,
		PlaceholderSearchNotConfigured,
		RecentFields,
	},
	mixins: [LocMixin],
	props: {
		sectionsData: {
			type: Array,
			required: true,
		},
		showHeader: {
			type: Boolean,
			default: true,
		},
		/**
		 * The panel took the place of a previous copy of itself (a field was deleted), so the focus has
		 * nowhere to return: it goes to the entry of the restored panel, unless the user has already
		 * moved somewhere else by then.
		 */
		restoreFocus: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		// Class instance stays out of the reactive state: a Proxy breaks its private fields.
		return {
			analytics: new Analytics(),
			Outline,
			region: panelRegion(),
			// Nothing renders the state of the write of the history, so it stays out of the reactive state.
			fieldUsage: { requestedCode: '', pendingCode: '', isRequestRunning: false },
		};
	},
	provide(): Object
	{
		return {
			analytics: this.analytics,
			recordFieldUsage: this.recordFieldUsage,
		};
	},
	data(): Object
	{
		return {
			currentTab: TabType.BITRIX24,
			companySelector: null,
			hcmLinkCompanySelector: null,
			searchQuery: '',
			hcmLinkSections: null,
			api: new Api(),
			selectedCompanyId: null,
			selectedHcmLinkCompanyId: null,
			hcmLinkPlaceholdersLoader: null,
			lastSelectedCompanyId: null,
			lastSelectedHcmLinkCompanyId: null,
			expandedItemId: '',
			personalSettings: EMPTY_PERSONAL_SETTINGS,
			isSearchMode: false,
			/**
			 * The order the recent fields block is drawn in. The history behind it is written anew by every
			 * copy, and rows moving under the cursor would send the next click of the user to another field.
			 */
			shownRecentFieldCodes: [],
		};
	},
	computed: {
		sections(): Array
		{
			if (this.isHcmLinkTab && (!this.selectedCompanyId || !this.selectedHcmLinkCompanyId))
			{
				return [];
			}

			const sections = this.currentTab === TabType.BITRIX24
				? this.sectionsData.filter((section) => section.type !== SectionType.HCM_LINK)
				: this.hcmLinkSections
			;

			if (!sections)
			{
				return [];
			}

			return new SectionFilter().filterBySearchQuery(sections, this.searchQuery);
		},
		hasItems(): boolean
		{
			return this.sections.length > 0;
		},
		isHcmLinkTab(): boolean
		{
			return this.currentTab === TabType.HCM_LINK;
		},
		isRuRegionLicense(): boolean
		{
			return this.region === 'ru';
		},
		shouldShowSearch(): boolean
		{
			if (!this.isHcmLinkTab)
			{
				return true;
			}

			return this.selectedCompanyId !== null && this.selectedHcmLinkCompanyId !== null;
		},
		shouldShowSearchNotFoundState(): boolean
		{
			if (!this.hasItems && this.shouldShowSearch)
			{
				if (this.searchQuery)
				{
					return true;
				}

				if (this.isHcmLinkTab && this.hcmLinkSections !== null)
				{
					return true;
				}
			}

			return false;
		},
		shouldShowSearchNotConfiguredState(): boolean
		{
			return !this.hasItems && !this.shouldShowSearch;
		},
		recentFields(): Array
		{
			return collectRecentFields(this.sections, this.shownRecentFieldCodes, this.region);
		},
		/**
		 * The place of the tree belongs to the block while the search mode waits for a query - whatever
		 * the history holds right now, and even while it holds nothing at all.
		 */
		isRecentFieldsPlace(): boolean
		{
			return this.isSearchMode && this.searchQuery === '';
		},
		/** An empty history leaves the tree where it was: the search keeps working without the block. */
		shouldShowRecentFields(): boolean
		{
			return this.isRecentFieldsPlace && this.recentFields.length > 0;
		},
	},
	watch: {
		// A tab without a chosen company has nothing to search through, so the mode ends with the search.
		shouldShowSearch(available: boolean): void
		{
			if (!available)
			{
				this.exitSearchMode();
			}
		},
	},
	async mounted()
	{
		this.initCreateButton();
		void this.loadPersonalSettings();

		if (this.restoreFocus && this.isFocusUnclaimed())
		{
			this.focusPanelEntry();
		}

		if (this.isRuRegionLicense)
		{
			this.initHcmLinkCompanySelector();
			this.initCompanySelector();
			await this.loadLastUserSelections();
		}
	},
	methods: {
		initCreateButton()
		{
			const createButton = new CreateButton({
				text: this.loc('PLACEHOLDER_LIST_ADD_FIELD'),
				// The button hands its own instance to the handler, and that is not an initial name.
				onclick: () => this.onCreateClick(),
				useAirDesign: true,
				color: Button.Color.SUCCESS_DARK,
				size: Button.Size.MEDIUM,
				style: AirButtonStyle.FILLED_SUCCESS,
				icon: ButtonIcon.ADD_M,
				dataset: {
					testid: 'sign-placeholder-add-field',
				},
			});
			Dom.append(createButton.render(), this.$refs.createButtonContainer);
		},
		/**
		 * Creation of a field, the single path of the panel: the choice of the field and the standard
		 * editor of user fields behind it. The empty result of a search offers the same path with the
		 * query as the name of the field to be.
		 */
		onCreateClick(initialName?: string)
		{
			const fieldSelector = new FieldSelector({
				initialFieldTitle: Type.isStringFilled(initialName) ? initialName : null,
				multiple: false,
				disableSelection: true,
				fieldsFactory: {
					filter: {
						'-types': [
							'url',
							'address',
						],
					},
				},
				controllerOptions: {
					hideVirtual: true,
					hideRequisites: false,
					hideSmartB2eDocument: true,
				},
				events: {
					onSliderCloseComplete: () => {
						this.$emit('listUpdate');
					},
				},
				languages: panelLanguages(),
				filter: {
					'+categories': [
						'PROFILE',
						'DYNAMIC_MEMBER',
						'COMPANY',
						'REPRESENTATIVE',
						'EMPLOYEE',
						'SMART_B2E_DOC',
					],
					'+fields': [
						'list',
						'string',
						'date',
						'typed_string',
						'text',
						'enumeration',
						'address',
						'url',
						'double',
						'integer',
						'snils',
					],
					allowEmptyFieldList: true,
				},
				title: Loc.getMessage('PLACEHOLDER_CREATE_LIST_TITLE'),
				hint: this.isRuRegionLicense ? Loc.getMessage('PLACEHOLDER_CREATE_LIST_HINT') : null,
				categoryCaptions: {
					PROFILE: Loc.getMessage('PLACEHOLDER_CREATE_LIST_PROFILE_ITEM'),
					DYNAMIC_MEMBER: Loc.getMessage('PLACEHOLDER_CREATE_LIST_DYNAMIC_MEMBER_ITEM'),

				},
			});

			fieldSelector.show();
		},

		/**
		 * A field of the personal data lives in two places of the answer, so the list is reloaded as a
		 * whole - the same way it is reloaded after a field is created. The reload builds the panel from
		 * scratch, so the row that started the deletion is gone by then: the panel asks for the focus of
		 * its own copy instead of returning it to the initiator.
		 */
		handleDeleteField(placeholder: { name: string, fieldId: number, category: string }): void
		{
			void DeleteFieldConfirmation.show({
				fieldName: placeholder.name,
				onConfirm: async (): Promise<void> => {
					let result = null;
					try
					{
						result = await this.api.placeholder.deleteField(placeholder.fieldId, placeholder.category);
					}
					catch (error)
					{
						// Every refusal of the server comes back as a rejection, and the toast the transport
						// raises with it is silent for a screen reader.
						this.announceDeletionFailure(placeholder.name);

						throw error;
					}

					// The answer carries the flag of the deletion, and an answer without it is no deletion:
					// the dialog stays open with its button released instead of reporting a success.
					if (result?.deleted !== true)
					{
						this.reportDeletionFailure(placeholder.name);

						throw new Error('The user field was not deleted');
					}

					LiveAnnouncer.announce(
						this.loc('PLACEHOLDER_LIST_FIELD_DELETED_ANNOUNCEMENT', {
							'#FIELD_NAME#': placeholder.name,
						}),
					);
					this.$emit('listUpdate', { restoreFocus: true });
				},
			});
		},

		/** The refusal reaches the eye through a toast of the transport, and the ear only through this. */
		announceDeletionFailure(fieldName: string): void
		{
			LiveAnnouncer.announce(this.deletionFailureMessage(fieldName), 'assertive');
		},

		/**
		 * A successful answer that carries no deletion is the defence of the panel against a change of the
		 * contract: no toast comes with such an answer, so the panel answers the click of the user itself.
		 */
		reportDeletionFailure(fieldName: string): void
		{
			UI.Notification.Center.notify({
				id: DELETE_FAILED_NOTIFICATION_ID,
				content: Text.encode(this.deletionFailureMessage(fieldName)),
				autoHideDelay: NOTIFICATION_HIDE_DELAY,
			});
			this.announceDeletionFailure(fieldName);
		},

		deletionFailureMessage(fieldName: string): string
		{
			return this.loc('PLACEHOLDER_LIST_DELETE_FIELD_FAILED_NOTIFICATION', {
				'#FIELD_NAME#': fieldName,
			});
		},

		async loadPersonalSettings(): Promise<void>
		{
			this.applyPersonalSettings(
				await this.api.placeholder.getPersonalSettings(),
				PersonalSettingsSource.FIRST_LOAD,
			);
		},

		/**
		 * The user copied the code of a field. The server answers with the personal state it stored, so
		 * the panel never guesses what got written.
		 *
		 * A code the history already holds is written no second time, and a request is never laid over a
		 * running one: a chip of the accordion copies anew on every click, and the server rebuilds the
		 * whole collection of the fields of the company to validate a single write. A copy made while a
		 * write runs waits for its turn, and only the last of them does: the user who ran through the
		 * chips keeps in the buffer what the last click copied, and that is the copy the history is
		 * about.
		 */
		async recordFieldUsage(code: string): Promise<void>
		{
			if (!code || this.isFieldUsageRecorded(code))
			{
				return;
			}

			if (this.fieldUsage.isRequestRunning)
			{
				this.fieldUsage.pendingCode = code;

				return;
			}

			// The server validates the code against the collection the user sees, and on the tab of the
			// external human resources system that collection depends on the chosen company.
			const hcmLinkCompanyId = this.isHcmLinkTab ? this.selectedHcmLinkCompanyId : null;

			this.fieldUsage.pendingCode = '';
			this.fieldUsage.requestedCode = code;
			this.fieldUsage.isRequestRunning = true;
			try
			{
				this.applyPersonalSettings(
					await this.api.placeholder.saveFieldUsage(code, hcmLinkCompanyId),
					PersonalSettingsSource.FIELD_USAGE,
				);
			}
			finally
			{
				this.fieldUsage.isRequestRunning = false;
			}

			const pendingCode = this.fieldUsage.pendingCode;
			this.fieldUsage.pendingCode = '';
			if (pendingCode !== '')
			{
				await this.recordFieldUsage(pendingCode);
			}
		},

		/**
		 * The head of the stored history answers for the copies of an earlier session of the panel; the
		 * code of the last request answers for a refused write, which changes no history and must not be
		 * asked for again on every chip of the same row.
		 */
		isFieldUsageRecorded(code: string): boolean
		{
			return code === this.fieldUsage.requestedCode || code === this.personalSettings.recentFieldCodes[0];
		},

		applyPersonalSettings(response: mixed, source: $Values<typeof PersonalSettingsSource>): void
		{
			if (!isPersonalSettings(response))
			{
				if (!isRefusalOfRequest(response))
				{
					console.error('Unexpected answer of the personal settings of the placeholder panel:', response);
				}
				else if (source === PersonalSettingsSource.FIELD_USAGE)
				{
					const refusedCode = this.fieldUsage.requestedCode;

					// A refusal of the transport says nothing about the code itself, so the next copy of that
					// code tries again; a refusal of the server is about the code and is not asked twice.
					if (response instanceof Error)
					{
						this.fieldUsage.requestedCode = '';
					}

					// A refused write drops the copied code out of the history, and nothing else reports it: the
					// read of the state is refused on its own terms and keeps the console clean.
					console.error(
						`The write of the use of the field ${refusedCode} was refused:`,
						refusalReason(response),
					);
				}

				return;
			}

			// A write answers with the stored history too, so a load answered after a write of the user
			// carries the history from before that copy: it is no news to the panel.
			const isFirstLoad = source === PersonalSettingsSource.FIRST_LOAD;
			if (isFirstLoad && this.personalSettings !== EMPTY_PERSONAL_SETTINGS)
			{
				return;
			}

			this.personalSettings = {
				recentFieldCodes: response.recentFieldCodes,
			};

			// A history the copy of the user wrote takes the place of the tree no sooner than the next entry
			// into the mode: the list would swap under the cursor that clicked it. The first history of the
			// panel has no click behind it, and the mode may well be open before it arrives - but that right
			// ends with the first copy the user makes, whatever the write of it answers and whenever.
			const hasClickBehindIt = this.fieldUsage.requestedCode !== '';
			if ((isFirstLoad && !hasClickBehindIt) || !this.isRecentFieldsPlace)
			{
				this.takeRecentFieldsOrder();
			}
		},

		async loadLastUserSelections()
		{
			try
			{
				const [companyData, hcmLinkData] = await Promise.all([
					this.api.placeholder.getLastSelectionBySelectorType(SelectorType.myCompany),
					this.api.placeholder.getLastSelectionBySelectorType(SelectorType.hcmLinkCompany),
				]);

				if (hcmLinkData?.value && this.hcmLinkCompanySelector)
				{
					this.hcmLinkCompanySelector.setLastSavedId(hcmLinkData.value);
				}

				if (companyData?.value && this.companySelector)
				{
					await this.companySelector.load(null, companyData.value);
				}
			}
			catch (error)
			{
				console.error('Failed to load last user selections:', error);
			}
		},
		initCompanySelector()
		{
			if (!this.$refs.companySelectorContainer)
			{
				return;
			}

			const companySelector = new CompanySelector({
				canCreateCompany: false,
				canEditCompany: false,
				isCompaniesDeselectable: false,
			});

			companySelector.subscribe('onSelect', async (event) => {
				const data = event.getData ? event.getData() : event.data;

				const companyId = data?.companyId;
				if (companyId === this.lastSelectedCompanyId)
				{
					return;
				}

				this.lastSelectedCompanyId = companyId;
				if (companyId && this.hcmLinkCompanySelector)
				{
					this.selectedCompanyId = companyId;
					this.selectedHcmLinkCompanyId = null;
					this.hcmLinkCompanySelector.setCompanyId(companyId);
					await this.api.placeholder.saveLastSelectionBySelectorType(SelectorType.myCompany, companyId);
				}
				else
				{
					this.selectedCompanyId = null;
					this.selectedHcmLinkCompanyId = null;
					this.lastSelectedCompanyId = null;
				}
			});

			this.companySelector = markRaw(companySelector);

			Dom.append(this.companySelector.getLayout(), this.$refs.companySelectorContainer);
		},
		initHcmLinkCompanySelector()
		{
			if (!this.$refs.hcmLinkCompanySelectorContainer)
			{
				return;
			}

			const hcmLinkCompanySelector = new HcmLinkCompanySelector();
			hcmLinkCompanySelector.setAvailability(true);
			hcmLinkCompanySelector.subscribe('integrations:loaded', (event) => {
				const data = event.getData ? event.getData() : event.data;
				const hasIntegrations = data?.hasIntegrations ?? false;

				if (!hasIntegrations)
				{
					this.selectedHcmLinkCompanyId = null;
					this.lastSelectedHcmLinkCompanyId = null;
				}
			});

			hcmLinkCompanySelector.subscribe('selected', async (event) => {
				const data = event.getData ? event.getData() : event.data;

				const hcmLinkCompanyId = data?.id;
				if (hcmLinkCompanyId === this.lastSelectedHcmLinkCompanyId)
				{
					return;
				}

				this.lastSelectedHcmLinkCompanyId = hcmLinkCompanyId;
				if (hcmLinkCompanyId)
				{
					this.selectedHcmLinkCompanyId = hcmLinkCompanyId;
					this.loadHcmLinkPlaceholders(hcmLinkCompanyId);
					await this.api.placeholder.saveLastSelectionBySelectorType(SelectorType.hcmLinkCompany, hcmLinkCompanyId);
				}
				else
				{
					this.selectedHcmLinkCompanyId = null;
					this.lastSelectedHcmLinkCompanyId = null;
				}
			});

			this.hcmLinkCompanySelector = markRaw(hcmLinkCompanySelector);

			Dom.append(this.hcmLinkCompanySelector.render(), this.$refs.hcmLinkCompanySelectorContainer);
			this.hcmLinkCompanySelector.show();
		},
		getDocumentEditorHelpdeskLink(): string
		{
			return Helpdesk.replaceLink(
				this.loc('PLACEHOLDER_LIST_HELPDESK'),
				HelpdeskCodes.DocumentEditor,
			);
		},
		switchTab(tab: string)
		{
			if (!Object.values(TabType).includes(tab))
			{
				return;
			}

			this.currentTab = tab;
			this.searchQuery = '';
			this.expandedItemId = '';
		},

		enterSearchMode(): void
		{
			this.takeRecentFieldsOrder();
			this.isSearchMode = true;
		},

		/**
		 * The block of the recent fields keeps the order it appeared with until it leaves the screen: the
		 * next entry into the search mode is where the copies made meanwhile show up.
		 */
		takeRecentFieldsOrder(): void
		{
			this.shownRecentFieldCodes = [...this.personalSettings.recentFieldCodes];
		},

		/**
		 * Leaving the mode brings the tree back the way it was: the query goes, the open accordion stays.
		 * The search is left by a control inside it, and that control is destroyed with the mode, so the
		 * focus goes back to the icon that opened the search - the same contract a popup keeps.
		 */
		exitSearchMode(): void
		{
			const shouldRestoreFocus = this.isFocusInsideSearch();

			this.isSearchMode = false;
			this.searchQuery = '';

			if (shouldRestoreFocus)
			{
				void this.$nextTick(() => {
					this.focusPanelEntry();
				});
			}
		},

		/**
		 * The panel takes the focus only when nobody holds it: the copy of the panel that replaces a
		 * previous one is built while the user may already work somewhere else.
		 */
		isFocusUnclaimed(): boolean
		{
			const focused = document.activeElement;

			return focused === null || focused === document.body || focused === document.documentElement;
		},

		/**
		 * The icon of the search is the entry of the panel for the keyboard. The tab of the external human
		 * resources system without a chosen company draws no icon at all, so the root of the panel takes
		 * the focus instead: otherwise it would silently land on the body.
		 */
		focusPanelEntry(): void
		{
			const entry = this.$refs.searchToggle ?? this.$refs.panel;

			entry?.focus();
		},

		/**
		 * The mode also ends by itself when the tab loses the chosen company: such an exit must leave the
		 * focus of the user where it is.
		 */
		isFocusInsideSearch(): boolean
		{
			const searchRoot = this.$refs.search?.$el;

			return Boolean(searchRoot) && searchRoot.contains(document.activeElement);
		},

		toggleExpandedItem(itemId: string)
		{
			this.expandedItemId = this.expandedItemId === itemId ? '' : itemId;
		},

		loadHcmLinkPlaceholders(hcmLinkCompanyId: number)
		{
			if (!this.$refs.placeholdersSectionsContainer)
			{
				return;
			}

			if (!this.hcmLinkPlaceholdersLoader)
			{
				this.hcmLinkPlaceholdersLoader = new Loader({
					target: this.$refs.placeholdersSectionsContainer,
				});
			}

			void this.hcmLinkPlaceholdersLoader.show();

			this.api.placeholder.listByHcmLinkCompanyId(hcmLinkCompanyId)
				.then((data) => {
					this.hcmLinkSections = data;
				})
				.catch((error) => {
					console.error('Failed to load hcmLink placeholders:', error);
				})
				.finally(() => {
					void this.hcmLinkPlaceholdersLoader.hide();
				});
		},
	},
	template: `
		<div
			ref="panel"
			class="sign-placeholders-content"
			tabindex="-1"
			data-testid="sign-placeholder-panel"
		>
			<div v-if="showHeader" class="sign-placeholders-common-title-container">
				<div class="sign-placeholders-common-title-header-container">
					<div class="sign-placeholders-common-title">
						{{ loc('PLACEHOLDER_LIST_FIELDS_TITLE_MSGVER_1') }}
					</div>
					<div ref="createButtonContainer"></div>
				</div>
				<div class="sign-placeholders-common-subtitle" v-html="getDocumentEditorHelpdeskLink()"></div>
			</div>
			<div class="sign-placeholders-content-body">
				<div class="sign-placeholders-header">
					<div v-if="!isSearchMode" class="sign-placeholders-content-header">
						<PlaceholderTabs v-show="isRuRegionLicense" :current-tab="currentTab" @switch-tab="switchTab"/>
						<div
							v-if="shouldShowSearch"
							ref="searchToggle"
							class="sign-placeholders-search-toggle"
							role="button"
							tabindex="0"
							:aria-label="loc('PLACEHOLDER_LIST_SEARCH_OPEN')"
							data-testid="sign-placeholder-search-toggle"
							@click="enterSearchMode"
							@keydown.enter="enterSearchMode"
							@keydown.space.prevent="enterSearchMode"
						>
							<BIcon :name="Outline.SEARCH" :size="24" color="var(--ui-color-base-4)"/>
						</div>
					</div>
					<PlaceholderSearch
						v-else
						ref="search"
						v-model:searchQuery="searchQuery"
						@exit="exitSearchMode"
					/>
				</div>
				<div v-show="isHcmLinkTab" class="sign-placeholders-selectors-container">
					<div>
						<div class="sign-placeholders-selector-title">
							{{ loc('PLACEHOLDER_LIST_COMPANY_SELECTOR') }}
						</div>
						<div ref="companySelectorContainer" class="sign-placeholders-company-selector"></div>
					</div>
					<div>
						<div class="sign-placeholders-selector-hcmlink-title">
							{{ loc('PLACEHOLDER_LIST_HCMLINK_COMPANY_SELECTOR') }}
						</div>
						<div ref="hcmLinkCompanySelectorContainer" class="sign-placeholders-hcm-link-company-selector"></div>
					</div>
				</div>
				<div class="sign-placeholders-scrollable-content">
					<div
						ref="placeholdersSectionsContainer"
						class="sign-placeholders-sections"
						data-testid="sign-placeholder-list"
					>
						<RecentFields
							v-if="shouldShowRecentFields"
							:fields="recentFields"
							:expanded-item-id="expandedItemId"
							@toggle-expand="toggleExpandedItem"
						/>
						<PlaceholderSearchNotFound
							v-else-if="shouldShowSearchNotFoundState"
							:search-query="searchQuery"
							:can-create-field="!isHcmLinkTab"
							@create-field="onCreateClick"
						/>
						<PlaceholderSearchNotConfigured v-else-if="shouldShowSearchNotConfiguredState"/>
						<PlaceholderSection
							v-else
							v-for="(section, index) in sections"
							:key="index"
							:section="section"
							:expanded-item-id="expandedItemId"
							@toggle-expand="toggleExpandedItem"
							@delete-field="handleDeleteField"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};

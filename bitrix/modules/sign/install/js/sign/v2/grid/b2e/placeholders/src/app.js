import { LocMixin } from 'sign.v2.b2e.vue-util';
import { PlaceholderSection, PlaceholderTabs, PlaceholderSearch } from './components';
import { PlaceholderSearchNotFound, PlaceholderSearchNotConfigured } from './components/empty-states/';
import { TabType, SelectorType, SectionType } from './types';
import { Helpdesk } from 'sign.v2.helper';
import { SectionFilter } from './section-filter';
import { CompanySelector } from 'sign.v2.b2e.company-selector';
import { HcmLinkCompanySelector } from 'sign.v2.b2e.hcm-link-company-selector';
import { Dom, Loc, Extension } from 'main.core';
import { markRaw } from 'ui.vue3';
import { Api } from 'sign.v2.api';
import { Loader } from 'main.loader';
import { FieldSelector } from 'sign.v2.b2e.field-selector';
import { AirButtonStyle, Button, ButtonIcon, CreateButton } from 'ui.buttons';

const HelpdeskCodes = Object.freeze({
	DocumentEditor: '27216628',
});

// @vue/component
export const PlaceholdersApp = {
	name: 'PlaceholdersApp',
	components: {
		PlaceholderSection,
		PlaceholderTabs,
		PlaceholderSearch,
		PlaceholderSearchNotFound,
		PlaceholderSearchNotConfigured,
	},
	mixins: [LocMixin],
	props: {
		sectionsData: {
			type: Array,
			required: true,
		},
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
			return Extension.getSettings('sign.v2.grid.b2e.placeholders').get('region') === 'ru';
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
	},
	async mounted()
	{
		this.initCreateButton();

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
				onclick: this.onCreateClick,
				useAirDesign: true,
				color: Button.Color.SUCCESS_DARK,
				size: Button.Size.MEDIUM,
				style: AirButtonStyle.FILLED_SUCCESS,
				icon: ButtonIcon.ADD_M,
			});
			Dom.append(createButton.render(), this.$refs.createButtonContainer);
		},
		onCreateClick()
		{
			const fieldSelector = new FieldSelector({
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
				languages: Extension.getSettings('sign.v2.grid.b2e.placeholders').get('languages'),
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
		<div class="sign-placeholders-content">
			<div class="sign-placeholders-common-title-container">
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
					<div class="sign-placeholders-content-header">
						<PlaceholderTabs v-show="isRuRegionLicense" :current-tab="currentTab" @switch-tab="switchTab"/>
					</div>
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
				<PlaceholderSearch
					v-show="shouldShowSearch"
					v-model:searchQuery="searchQuery"
					:is-hcm-link-tab="isHcmLinkTab"
				/>
				<div class="sign-placeholders-scrollable-content">
					<div ref="placeholdersSectionsContainer" class="sign-placeholders-sections">
						<PlaceholderSearchNotFound v-if="shouldShowSearchNotFoundState"/>
						<PlaceholderSearchNotConfigured v-else-if="shouldShowSearchNotConfiguredState"/>
						<PlaceholderSection
							v-else
							v-for="(section, index) in sections"
							:key="index"
							:section="section"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};

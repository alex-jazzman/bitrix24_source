/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, sign_v2_api, ui_vue3, sign_v2_b2e_vueUtil, main_core, sign_v2_helper, sign_v2_b2e_companySelector, sign_v2_b2e_hcmLinkCompanySelector, main_loader, sign_v2_b2e_fieldSelector, ui_buttons) {
	'use strict';

	const TabType = {
		BITRIX24: 'bitrix24',
		HCM_LINK: 'hcmLink'
	};
	const SectionType = {
		HCM_LINK: 'hcmLink',
		EMPLOYEE: 'employee',
		SMART_B2E_DOC: 'smartB2eDoc',
		COMPANY: 'company',
		REPRESENTATIVE: 'representative'
	};
	const SelectorType = {
		hcmLinkCompany: 'hcmLinkCompany',
		myCompany: 'myCompany'
	};

	// @vue/component
	const PlaceholderItem = {
		name: 'PlaceholderItem',
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			placeholder: {
				type: Object,
				required: true
			},
			dataTestId: {
				type: String,
				default: ''
			},
			sectionType: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				isCopied: false
			};
		},
		computed: {
			placeholderValue() {
				return `{${this.placeholder.value}}`;
			},
			containerClasses() {
				return {
					'sign-placeholders-item': true,
					'sign-placeholders-item--copied': this.isCopied
				};
			},
			typeIconClasses() {
				const iconType = Object.values(SectionType).includes(this.sectionType) ? this.sectionType : 'default';
				return {
					'sign-placeholders-type-icon': true,
					[`sign-placeholders-type-icon--${iconType}`]: true
				};
			}
		},
		methods: {
			copyToClipboard() {
				this.copyPlainText(this.placeholderValue);
				this.isCopied = true;
				setTimeout(() => {
					this.isCopied = false;
				}, 1000);
				return false;
			},
			copyPlainText(text) {
				const textarea = document.createElement('textarea');
				textarea.value = text;
				main_core.Dom.append(textarea, document.body);
				textarea.select();
				try {
					document.execCommand('copy');
				} catch (err) {
					console.error(err);
				}
				main_core.Dom.remove(textarea);
			}
		},
		template: `
		<div :class="containerClasses" @click="copyToClipboard" :data-test-id="dataTestId">
			<template v-if="isCopied">
				<div class="sign-placeholders-copied">
					<span class="sign-placeholders-copied-icon"></span>
					<span class="sign-placeholders-copied-message">
						{{ loc('PLACEHOLDER_LIST_COPIED_LABEL') }}
					</span>
				</div>
			</template>
			<template v-else>
				<div class="sign-placeholders-item-content">
					<span :class="typeIconClasses" :title="placeholder.value"></span>
					<span class="sign-placeholders-item-name">{{ placeholder.name }}</span>
				</div>
				<span class="sign-placeholders-copy-icon" :title="placeholder.value"></span>
			</template>
		</div>
	`
	};

	// @vue/component
	const PlaceholderSection = {
		name: 'PlaceholderSection',
		components: {
			PlaceholderItem
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			section: {
				type: Object,
				required: true
			}
		},
		computed: {
			hasSubsections() {
				return Array.isArray(this.section.subsections) && this.section.subsections.length > 0;
			},
			hasItems() {
				if (this.hasSubsections) {
					return this.section.subsections.some(subsection => subsection.items && subsection.items.length > 0);
				}
				return this.section.items && this.section.items.length > 0;
			}
		},
		methods: {
			getItemDataTestId(...indices) {
				return ['sign-placeholder-item', this.section.type, ...indices].join('-');
			},
			getItemSectionType() {
				if (this.section.type === SectionType.HCM_LINK && this.section.subsectionType) {
					return this.section.subsectionType;
				}
				return this.section.type;
			}
		},
		template: `
		<div v-if="hasItems" class="sign-placeholders-section">
			<div class="sign-placeholders-section-title">{{ section.title }}</div>
			<div v-if="!hasSubsections" class="sign-placeholders-section-content">
				<PlaceholderItem
					v-for="(item, index) in section.items"
					:key="index"
					:placeholder="item"
					:section-type="getItemSectionType()"
					:data-test-id="getItemDataTestId(index)"
				/>
			</div>

			<div v-else>
				<div v-for="(subsection, index) in section.subsections" :key="index" class="sign-placeholders-subsection">
					<div class="sign-placeholders-subsection-title">{{ subsection.title }}</div>
					<div>
						<PlaceholderItem
							v-for="(item, itemIndex) in subsection.items"
							:key="itemIndex"
							:placeholder="item"
							:section-type="getItemSectionType()"
							:data-test-id="getItemDataTestId(index, itemIndex)"
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const PlaceholderTabs = {
		name: 'PlaceholderTabs',
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			currentTab: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				TabType,
				tabs: [{
					type: TabType.BITRIX24,
					locKey: 'PLACEHOLDER_LIST_TAB_BITRIX24'
				}, {
					type: TabType.HCM_LINK,
					locKey: 'PLACEHOLDER_LIST_TAB_1C'
				}]
			};
		},
		methods: {
			switchTab(tab) {
				this.$emit('switch-tab', tab);
			},
			getTabDataTestId(type) {
				return `sign-placeholder-tab-${type}`;
			}
		},
		template: `
		<div class="sign-placeholders-tabs">
			<div
				v-for="tab in tabs"
				:key="tab.type"
				class="sign-placeholders-tab"
				:class="{ 'sign-placeholders-tab--active': currentTab === tab.type }"
				@click="switchTab(tab.type)"
				:data-test-id="getTabDataTestId(tab.type)"
			>
				{{ loc(tab.locKey) }}
			</div>
		</div>
	`
	};

	// @vue/component
	const PlaceholderSearch = {
		name: 'PlaceholderSearch',
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			searchQuery: {
				type: String,
				default: ''
			},
			isHcmLinkTab: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			searchContainerClass() {
				return this.isHcmLinkTab ? 'sign-placeholders-search-hcmlink' : 'sign-placeholders-search';
			}
		},
		methods: {
			onInput(event) {
				this.$emit('update:searchQuery', event.target.value);
			},
			clearInput() {
				this.$emit('update:searchQuery', '');
			}
		},
		template: `
		<div :class="searchContainerClass">
			<input
				type="text"
				class="sign-placeholders-search-input"
				:value="searchQuery"
				@input="onInput"
				:placeholder="loc('PLACEHOLDER_LIST_SEARCH_PLACEHOLDER_MSGVER_1')"
			/>
			<div v-if="searchQuery" class="sign-placeholders-search-icon-clear" @click="clearInput"></div>
			<div v-else class="sign-placeholders-search-icon-search"></div>
		</div>
	`
	};

	// @vue/component
	const PlaceholderSearchNotFound = {
		name: 'PlaceholderSearchNotFound',
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		template: `
		<div class="sign-placeholders-nothing-found-container">
			<div class="sign-placeholders-nothing-found-img"></div>
			<div class="sign-placeholders-nothing-found-text-container">
				<div class="sign-placeholders-nothing-found-title">
					{{ loc('PLACEHOLDER_LIST_NOTHING_FOUND_TITLE') }}
				</div>
				<div class="sign-placeholders-nothing-found-description">
					{{ loc('PLACEHOLDER_LIST_NOTHING_FOUND_DESCRIPTION') }}
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const PlaceholderSearchNotConfigured = {
		name: 'PlaceholderSearchNotConfigured',
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		template: `
		<div class="sign-placeholders-nothing-found-container">
			<div class="sign-placeholders-nothing-configured-img"></div>
			<div class="sign-placeholders-nothing-found-text-container">
				<div class="sign-placeholders-nothing-found-title">
					{{ loc('PLACEHOLDER_LIST_NOTHING_CONFIGURED_TITLE') }}
				</div>
				<div class="sign-placeholders-nothing-found-description">
					{{ loc('PLACEHOLDER_LIST_NOTHING_CONFIGURED_DESCRIPTION') }}
				</div>
			</div>
		</div>
	`
	};

	class SectionFilter {
		filterBySearchQuery(sections, searchQuery) {
			const normalizedQueryValue = searchQuery.toLowerCase().replaceAll('{', '').replaceAll('}', '').trim();
			if (!normalizedQueryValue) {
				return sections;
			}
			return sections.map(section => this.#filterSection(section, normalizedQueryValue)).filter(section => this.#hasContent(section));
		}
		#hasContent(section) {
			if (main_core.Type.isArray(section.subsections)) {
				return section.subsections.some(subsection => main_core.Type.isArray(subsection.items) && subsection.items.length > 0);
			}
			return !main_core.Type.isNil(section.items) || !main_core.Type.isNil(section.data);
		}
		#filterSection(section, query) {
			if (main_core.Type.isArray(section.items)) {
				return this.#filterSimpleSection(section, query);
			}
			if (main_core.Type.isArray(section.subsections)) {
				return this.#filterNestedSection(section, query);
			}
			return {};
		}
		#filterNestedSection(section, query) {
			const matchedSubsections = section.subsections.map(subsection => {
				const matchedItems = this.#filterItems(subsection.items, query);
				return matchedItems.length > 0 ? {
					...subsection,
					items: matchedItems
				} : null;
			}).filter(Boolean);
			return matchedSubsections.length > 0 ? {
				...section,
				subsections: matchedSubsections
			} : {};
		}
		#filterSimpleSection(section, query) {
			const matchedItems = this.#filterItems(section.items, query);
			return matchedItems.length > 0 ? {
				...section,
				items: matchedItems
			} : {};
		}
		#filterItems(items, query) {
			return items.filter(item => {
				const name = item.name?.toLowerCase() ?? '';
				const value = item.value?.toLowerCase() ?? '';
				return name.includes(query) || value.includes(query);
			});
		}
	}

	const HelpdeskCodes = Object.freeze({
		DocumentEditor: '27216628'
	});

	// @vue/component
	const PlaceholdersApp = {
		name: 'PlaceholdersApp',
		components: {
			PlaceholderSection,
			PlaceholderTabs,
			PlaceholderSearch,
			PlaceholderSearchNotFound,
			PlaceholderSearchNotConfigured
		},
		mixins: [sign_v2_b2e_vueUtil.LocMixin],
		props: {
			sectionsData: {
				type: Array,
				required: true
			},
			showHeader: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				currentTab: TabType.BITRIX24,
				companySelector: null,
				hcmLinkCompanySelector: null,
				searchQuery: '',
				hcmLinkSections: null,
				api: new sign_v2_api.Api(),
				selectedCompanyId: null,
				selectedHcmLinkCompanyId: null,
				hcmLinkPlaceholdersLoader: null,
				lastSelectedCompanyId: null,
				lastSelectedHcmLinkCompanyId: null
			};
		},
		computed: {
			sections() {
				if (this.isHcmLinkTab && (!this.selectedCompanyId || !this.selectedHcmLinkCompanyId)) {
					return [];
				}
				const sections = this.currentTab === TabType.BITRIX24 ? this.sectionsData.filter(section => section.type !== SectionType.HCM_LINK) : this.hcmLinkSections;
				if (!sections) {
					return [];
				}
				return new SectionFilter().filterBySearchQuery(sections, this.searchQuery);
			},
			hasItems() {
				return this.sections.length > 0;
			},
			isHcmLinkTab() {
				return this.currentTab === TabType.HCM_LINK;
			},
			isRuRegionLicense() {
				return main_core.Extension.getSettings('sign.v2.grid.b2e.placeholders').get('region') === 'ru';
			},
			shouldShowSearch() {
				if (!this.isHcmLinkTab) {
					return true;
				}
				return this.selectedCompanyId !== null && this.selectedHcmLinkCompanyId !== null;
			},
			shouldShowSearchNotFoundState() {
				if (!this.hasItems && this.shouldShowSearch) {
					if (this.searchQuery) {
						return true;
					}
					if (this.isHcmLinkTab && this.hcmLinkSections !== null) {
						return true;
					}
				}
				return false;
			},
			shouldShowSearchNotConfiguredState() {
				return !this.hasItems && !this.shouldShowSearch;
			}
		},
		async mounted() {
			this.initCreateButton();
			if (this.isRuRegionLicense) {
				this.initHcmLinkCompanySelector();
				this.initCompanySelector();
				await this.loadLastUserSelections();
			}
		},
		methods: {
			initCreateButton() {
				const createButton = new ui_buttons.CreateButton({
					text: this.loc('PLACEHOLDER_LIST_ADD_FIELD'),
					onclick: this.onCreateClick,
					useAirDesign: true,
					color: ui_buttons.Button.Color.SUCCESS_DARK,
					size: ui_buttons.Button.Size.MEDIUM,
					style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
					icon: ui_buttons.ButtonIcon.ADD_M
				});
				main_core.Dom.append(createButton.render(), this.$refs.createButtonContainer);
			},
			onCreateClick() {
				const fieldSelector = new sign_v2_b2e_fieldSelector.FieldSelector({
					multiple: false,
					disableSelection: true,
					fieldsFactory: {
						filter: {
							'-types': ['url', 'address']
						}
					},
					controllerOptions: {
						hideVirtual: true,
						hideRequisites: false,
						hideSmartB2eDocument: true
					},
					events: {
						onSliderCloseComplete: () => {
							this.$emit('listUpdate');
						}
					},
					languages: main_core.Extension.getSettings('sign.v2.grid.b2e.placeholders').get('languages'),
					filter: {
						'+categories': ['PROFILE', 'DYNAMIC_MEMBER', 'COMPANY', 'REPRESENTATIVE', 'EMPLOYEE', 'SMART_B2E_DOC'],
						'+fields': ['list', 'string', 'date', 'typed_string', 'text', 'enumeration', 'address', 'url', 'double', 'integer', 'snils'],
						allowEmptyFieldList: true
					},
					title: main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_TITLE'),
					hint: this.isRuRegionLicense ? main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_HINT') : null,
					categoryCaptions: {
						PROFILE: main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_PROFILE_ITEM'),
						DYNAMIC_MEMBER: main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_DYNAMIC_MEMBER_ITEM')
					}
				});
				fieldSelector.show();
			},
			async loadLastUserSelections() {
				try {
					const [companyData, hcmLinkData] = await Promise.all([this.api.placeholder.getLastSelectionBySelectorType(SelectorType.myCompany), this.api.placeholder.getLastSelectionBySelectorType(SelectorType.hcmLinkCompany)]);
					if (hcmLinkData?.value && this.hcmLinkCompanySelector) {
						this.hcmLinkCompanySelector.setLastSavedId(hcmLinkData.value);
					}
					if (companyData?.value && this.companySelector) {
						await this.companySelector.load(null, companyData.value);
					}
				} catch (error) {
					console.error('Failed to load last user selections:', error);
				}
			},
			initCompanySelector() {
				if (!this.$refs.companySelectorContainer) {
					return;
				}
				const companySelector = new sign_v2_b2e_companySelector.CompanySelector({
					canCreateCompany: false,
					canEditCompany: false,
					isCompaniesDeselectable: false
				});
				companySelector.subscribe('onSelect', async event => {
					const data = event.getData ? event.getData() : event.data;
					const companyId = data?.companyId;
					if (companyId === this.lastSelectedCompanyId) {
						return;
					}
					this.lastSelectedCompanyId = companyId;
					if (companyId && this.hcmLinkCompanySelector) {
						this.selectedCompanyId = companyId;
						this.selectedHcmLinkCompanyId = null;
						this.hcmLinkCompanySelector.setCompanyId(companyId);
						await this.api.placeholder.saveLastSelectionBySelectorType(SelectorType.myCompany, companyId);
					} else {
						this.selectedCompanyId = null;
						this.selectedHcmLinkCompanyId = null;
						this.lastSelectedCompanyId = null;
					}
				});
				this.companySelector = ui_vue3.markRaw(companySelector);
				main_core.Dom.append(this.companySelector.getLayout(), this.$refs.companySelectorContainer);
			},
			initHcmLinkCompanySelector() {
				if (!this.$refs.hcmLinkCompanySelectorContainer) {
					return;
				}
				const hcmLinkCompanySelector = new sign_v2_b2e_hcmLinkCompanySelector.HcmLinkCompanySelector();
				hcmLinkCompanySelector.setAvailability(true);
				hcmLinkCompanySelector.subscribe('integrations:loaded', event => {
					const data = event.getData ? event.getData() : event.data;
					const hasIntegrations = data?.hasIntegrations ?? false;
					if (!hasIntegrations) {
						this.selectedHcmLinkCompanyId = null;
						this.lastSelectedHcmLinkCompanyId = null;
					}
				});
				hcmLinkCompanySelector.subscribe('selected', async event => {
					const data = event.getData ? event.getData() : event.data;
					const hcmLinkCompanyId = data?.id;
					if (hcmLinkCompanyId === this.lastSelectedHcmLinkCompanyId) {
						return;
					}
					this.lastSelectedHcmLinkCompanyId = hcmLinkCompanyId;
					if (hcmLinkCompanyId) {
						this.selectedHcmLinkCompanyId = hcmLinkCompanyId;
						this.loadHcmLinkPlaceholders(hcmLinkCompanyId);
						await this.api.placeholder.saveLastSelectionBySelectorType(SelectorType.hcmLinkCompany, hcmLinkCompanyId);
					} else {
						this.selectedHcmLinkCompanyId = null;
						this.lastSelectedHcmLinkCompanyId = null;
					}
				});
				this.hcmLinkCompanySelector = ui_vue3.markRaw(hcmLinkCompanySelector);
				main_core.Dom.append(this.hcmLinkCompanySelector.render(), this.$refs.hcmLinkCompanySelectorContainer);
				this.hcmLinkCompanySelector.show();
			},
			getDocumentEditorHelpdeskLink() {
				return sign_v2_helper.Helpdesk.replaceLink(this.loc('PLACEHOLDER_LIST_HELPDESK'), HelpdeskCodes.DocumentEditor);
			},
			switchTab(tab) {
				if (!Object.values(TabType).includes(tab)) {
					return;
				}
				this.currentTab = tab;
				this.searchQuery = '';
			},
			loadHcmLinkPlaceholders(hcmLinkCompanyId) {
				if (!this.$refs.placeholdersSectionsContainer) {
					return;
				}
				if (!this.hcmLinkPlaceholdersLoader) {
					this.hcmLinkPlaceholdersLoader = new main_loader.Loader({
						target: this.$refs.placeholdersSectionsContainer
					});
				}
				void this.hcmLinkPlaceholdersLoader.show();
				this.api.placeholder.listByHcmLinkCompanyId(hcmLinkCompanyId).then(data => {
					this.hcmLinkSections = data;
				}).catch(error => {
					console.error('Failed to load hcmLink placeholders:', error);
				}).finally(() => {
					void this.hcmLinkPlaceholdersLoader.hide();
				});
			}
		},
		template: `
		<div class="sign-placeholders-content">
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
	`
	};

	const sidePanelConfig = Object.freeze({
		link: 'sign:stub:placeholder-list',
		width: 500
	});
	class Placeholders {
		#api = new sign_v2_api.Api();
		#app = null;
		#container = null;
		#loader = null;
		async show() {
			return new Promise(resolve => {
				BX.SidePanel.Instance.open(sidePanelConfig.link, {
					width: sidePanelConfig.width,
					cacheable: false,
					contentCallback: async () => {
						this.#container = this.#createContainer();
						this.#loader = new main_loader.Loader({
							target: this.#container
						});
						await this.#loadPlaceholders();
						return this.#container;
					},
					events: {
						onOpen: () => {
							resolve();
						},
						onClose: () => {
							this.#unmount();
						}
					}
				});
			});
		}
		async #loadPlaceholders(clearCache = false) {
			void this.#loader.show();
			try {
				const placeholdersData = await this.#api.placeholder.list(clearCache);
				this.#unmount();
				this.#createApp(this.#container, placeholdersData);
			} catch (error) {
				console.error('Load placeholders data error:', error);
			} finally {
				void this.#loader.hide();
			}
		}
		#createContainer() {
			return BX.Tag.render`<div class="sign-placeholders-container"></div>`;
		}
		#createApp(container, placeholdersData) {
			this.#app = ui_vue3.BitrixVue.createApp(PlaceholdersApp, {
				sectionsData: placeholdersData,
				onListUpdate: () => {
					void this.#loadPlaceholders(true);
				}
			});
			this.#app.mount(container);
		}
		#unmount() {
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
			}
		}
	}

	exports.Placeholders = Placeholders;
	exports.PlaceholdersApp = PlaceholdersApp;

})(this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}, BX.Sign.V2, BX.Vue3, BX.Sign.V2.B2e, BX, BX.Sign.V2, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX, BX.Sign.B2e, BX.UI);

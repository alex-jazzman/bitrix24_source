/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
(function (exports, main_core, ui_vue3, ui_vue3_mixins_locMixin, socialnetwork_v2_core, socialnetwork_v2_const, socialnetwork_v2_model_interface, ui_vue3_pinia, ui_notificationManager, socialnetwork_v2_model_project, socialnetwork_v2_features_project_getProjectFeature, socialnetwork_v2_provider_services_projectService, socialnetwork_v2_components_elements_uiLoader, socialnetwork_v2_components_elements_uiAvatarProject, ui_a11y, socialnetwork_v2_components_elements_uiGrowingTextArea, socialnetwork_v2_components_elements_uiHint, socialnetwork_v2_components_banners_newProjectBanner, ui_system_menu_vue, ui_system_typography_vue, socialnetwork_v2_components_elements_uiCheckbox, socialnetwork_v2_components_elements_uiField, socialnetwork_v2_components_elements_uiTextarea, socialnetwork_v2_components_selectors_usersSelector, ui_system_radiobutton, ui_iconSet_api_core, ui_system_input_vue, ui_iconSet_api_vue, ui_iconSet_solid, ui_vue3_components_switcher, ui_switcher, socialnetwork_v2_components_elements_uiAccordion, ui_vue3_components_button, ui_infoHelper, ui_iconSet_outline, socialnetwork_v2_components_elements_uiSelect, socialnetwork_v2_components_elements_uiDivider, ui_datePicker, socialnetwork_v2_lib_calendar, socialnetwork_v2_lib_timezone, socialnetwork_v2_components_selectors_tagsSelector, socialnetwork_v2_components_elements_uiSwitcherField, socialnetwork_v2_components_popup_autoDeletePopup, socialnetwork_v2_features_project_createProjectFeature, socialnetwork_v2_features_project_updateProjectFeature, socialnetwork_v2_features_project_copyProjectFeature) {
	'use strict';

	class GetDefaultData {
		static async getDefaultData() {
			const projectStore = socialnetwork_v2_model_project.useProjectStore();
			const defaultPermissions = await socialnetwork_v2_provider_services_projectService.AccessRightsService.getDefaultPermissions();
			projectStore.patchProject({
				defaultPermissions: ui_vue3.markRaw(defaultPermissions)
			});
		}
	}

	const InjectionKey = Object.freeze({
		GetWizardBodyContainer: 'getWizardBodyContainer'
	});

	// @vue/component
	const ProjectWizardLayout = {
		name: 'ProjectWizardLayout',
		components: {
			UiLoader: socialnetwork_v2_components_elements_uiLoader.UiLoader
		},
		provide() {
			return {
				[InjectionKey.GetWizardBodyContainer]: () => this.$refs.body || null
			};
		},
		props: {
			loading: Boolean
		},
		template: `
		<div class="socialnetwork--project-wizard">
			<div class="socialnetwork--project-wizard-main">
				<UiLoader v-if="loading" :show="loading"/>
				<div v-else ref="body" class="socialnetwork--project-wizard-body">
					<slot name="body"/>
				</div>
				<slot name="footer"/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ProjectWizardTitle = {
		name: 'ProjectWizardTitle',
		components: {
			UiGrowingTextArea: socialnetwork_v2_components_elements_uiGrowingTextArea.UiGrowingTextArea,
			UiHint: socialnetwork_v2_components_elements_uiHint.UiHint
		},
		data() {
			return {
				isPopupShown: false,
				keyboardFocus: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['title']),
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_interface.useInterfaceStore, {
				validation: 'wizardValidation'
			}),
			hintText() {
				if (this.validation.title.required) {
					return this.loc('SONET_EXT_PROJECT_WIZARD_TITLE_REQUIRED_ERROR_MSG');
				}
				if (this.validation.title.uniq) {
					return this.loc('SONET_EXT_PROJECT_WIZARD_TITLE_UNIQ_ERROR_MSG');
				}
				return '';
			}
		},
		watch: {
			validation: {
				handler(validation) {
					if (validation.invalid && validation.title.invalid) {
						void this.highlightTitle();
					}
				},
				deep: true
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(socialnetwork_v2_model_interface.useInterfaceStore, ['setValidation']),
			onFieldFocus() {
				this.keyboardFocus = ui_a11y.FocusMonitor.Instance.getModalityTracker().getLastNavigationKey() === 'Tab';
			},
			onFieldBlur() {
				this.keyboardFocus = false;
			},
			async highlightTitle() {
				await this.delay();
				const cancelHighlight = () => {
					main_core.Event.unbind(window, 'click', cancelHighlight);
					main_core.Event.unbind(window, 'keydown', cancelHighlight);
					this.removeHighlight();
				};
				main_core.Event.bind(window, 'click', cancelHighlight);
				main_core.Event.bind(window, 'keydown', cancelHighlight);
				this.$refs.growing?.$el?.querySelector('textarea')?.focus();
				this.isPopupShown = true;
				this.scrollToField();
			},
			removeHighlight() {
				this.setValidation('title', {
					required: false,
					uniq: false
				});
				this.isPopupShown = false;
			},
			delay() {
				return new Promise(resolve => {
					setTimeout(resolve, 0);
				});
			},
			scrollToField() {
				main_core.Dom.style(this.$refs.wrapper, 'scrollMarginTop', '100px');
				this.$refs.wrapper.scrollIntoView({
					block: 'start',
					behavior: 'smooth'
				});
				setTimeout(() => {
					main_core.Dom.style(this.$refs.wrapper, 'scrollMarginTop', null);
				}, 1000);
			}
		},
		template: `
		<div
			ref="wrapper"
			:class="[
				'socialnetwork--project-title-wrapper',
				{
					'--keyboard-focus': keyboardFocus,
						'socialnetwork--project--field-highlight': validation.title.invalid,
					'socialnetwork--project--field-highlight__error': validation.title.uniq,
				}
			]"
		>
			<UiGrowingTextArea
				v-model="title"
				ref="growing"
				:fontSize="25"
				class="socialnetwork--project-title"
				:placeholder="loc('SONET_EXT_PROJECT_WIZARD_TITLE_PLACEHOLDER')"
					@focus="onFieldFocus"
					@blur="onFieldBlur"
			/>
		</div>
		<UiHint
			v-if="isPopupShown"
			:bindElement="$refs.wrapper"
			:options="{ offsetTop: 3 }"
			@close="isPopupShown = false"
		>
			{{ hintText }}
		</UiHint>
	`
	};

	const fileToBaseSixFourNoPrefix = async file => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const resultWithPrefix = reader.result;
				const commaPosition = resultWithPrefix.indexOf(',');
				const result = resultWithPrefix.slice(commaPosition + 1);
				if (main_core.Type.isString(result)) {
					resolve(result);
				} else {
					reject(new Error('Failed to read file as string'));
				}
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	};

	// @vue/component
	const ProjectWizardHeader = {
		name: 'ProjectWizardHeader',
		components: {
			UiAvatarProject: socialnetwork_v2_components_elements_uiAvatarProject.UiAvatarProject,
			ProjectWizardTitle
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['avatar']),
			avatarUrl() {
				return this.avatar?.url;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(socialnetwork_v2_model_project.useProjectStore, ['patchProject']),
			async handleAvatarUpdate(avatarFile) {
				if (avatarFile) {
					const url = avatarFile.getPreviewUrl();
					const binary = avatarFile.getBinary();
					const encodedFile = await fileToBaseSixFourNoPrefix(binary);
					this.patchProject({
						avatar: {
							url,
							encodedFile
						}
					});
				} else {
					this.patchProject({
						avatar: null
					});
				}
			}
		},
		template: `
		<div
			class="socialnetwork--project-wizard-header"
		>
			<UiAvatarProject
				:url="avatarUrl"
				@update="handleAvatarUpdate"
			/>
			<ProjectWizardTitle />
		</div>
	`
	};

	// @vue/component
	const CopySettingsField = {
		name: 'ProjectWizardCopySettingsField',
		components: {
			BMenu: ui_system_menu_vue.BMenu,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			UiCheckbox: socialnetwork_v2_components_elements_uiCheckbox.UiCheckbox,
			UiField: socialnetwork_v2_components_elements_uiField.UiField
		},
		inject: {
			getWizardBodyContainer: {
				from: InjectionKey.GetWizardBodyContainer,
				default: () => document.body
			}
		},
		data() {
			return {
				isCheckedTasks: false,
				isCheckedRobots: false,
				isCheckedFolders: false,
				isOpenedSelectorFoldersCopyType: false,
				valueFoldersCopyTypeSelected: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_interface.useInterfaceStore, ['copyOptions']),
			optionsSelectorFoldersCopyType() {
				return [{
					value: 1,
					data: {
						title: this.loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TYPE_SELECTOR_OPTION_NO_FILES_TITLE'),
						descr: this.loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TYPE_SELECTOR_OPTION_NO_FILES_DESCR')
					}
				}, {
					value: 2,
					data: {
						title: this.loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TYPE_SELECTOR_OPTION_WITH_FILES_TITLE'),
						descr: this.loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TYPE_SELECTOR_OPTION_WITH_FILES_DESCR')
					}
				}];
			},
			itemsFoldersCopyType() {
				return this.optionsSelectorFoldersCopyType.map(option => ({
					isSelected: option.value === this.valueFoldersCopyTypeSelected,
					title: option.data.title,
					subtitle: option.data.descr,
					onClick: () => this.handleSelectFoldersCopyTypeWithFiles(option.value)
				}));
			},
			propsSelectorFoldersCopyType() {
				const minWidthPopup = 150;
				return {
					id: `folders-copy-type-menu-${main_core.Text.getRandom()}`,
					bindOptions: {
						forceBindPosition: true
					},
					bindElement: this.$refs.selectorFoldersCopyType,
					targetContainer: this.getWizardBodyContainer(),
					minWidth: minWidthPopup,
					items: this.itemsFoldersCopyType,
					autoHide: true,
					closeByEsc: true
				};
			},
			titleSelectorFoldersCopyType() {
				const option = this.optionsSelectorFoldersCopyType.find(option => option.value === this.valueFoldersCopyTypeSelected);
				return option?.data?.title || '';
			}
		},
		watch: {
			isCheckedTasks(value) {
				this.copyOptions = {
					...this.copyOptions,
					tasks: {
						...this.copyOptions.tasks,
						enabled: value
					}
				};
			},
			isCheckedRobots(value) {
				this.copyOptions = {
					...this.copyOptions,
					tasks: {
						...this.copyOptions.tasks,
						robots: value
					}
				};
			},
			isCheckedFolders(value) {
				this.copyOptions = {
					...this.copyOptions,
					disk: {
						...this.copyOptions.disk,
						enabled: value
					}
				};
			},
			valueFoldersCopyTypeSelected(value) {
				const isWithFiles = value === 2;
				this.copyOptions = {
					...this.copyOptions,
					disk: {
						...this.copyOptions.disk,
						withFiles: isWithFiles
					}
				};
			}
		},
		mounted() {
			this.valueFoldersCopyTypeSelected = this.optionsSelectorFoldersCopyType[0]?.value;
		},
		methods: {
			toggleIsOpenedSelectorFoldersCopyType() {
				this.isOpenedSelectorFoldersCopyType = !this.isOpenedSelectorFoldersCopyType;
			},
			handleChangeCheckerTasks(value) {
				this.isCheckedTasks = Boolean(value);
				if (!this.isCheckedTasks) {
					this.isCheckedRobots = false;
				}
			},
			handleChangeCheckerRobots(value) {
				this.isCheckedRobots = Boolean(value);
			},
			handleChangeCheckerFolders(value) {
				this.isCheckedFolders = Boolean(value);
				if (!this.isCheckedFolders) {
					this.isOpenedSelectorFoldersCopyType = false;
				}
			},
			handleSelectFoldersCopyTypeWithFiles(value) {
				this.valueFoldersCopyTypeSelected = value;
			},
			handleClickSelectorFoldersCopyType() {
				this.toggleIsOpenedSelectorFoldersCopyType();
			}
		},
		template: `
		<UiField
			ref="copySettingsField"
			class="socialnetwork--project-wizard-copy-settings-field scn-pw-copy-settings"
			:label="loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTIONS_LABEL')"
		>
			<ul class="scn-pw-copy-settings__options">
				<li
					class="scn-pw-copy-settings__option"
					:class="{
						'scn-pw-copy-settings__option_active': isCheckedTasks,
					}"
				>
					<div class="scn-pw-copy-settings__option-vis">
						<UiCheckbox
							class="scn-pw-copy-settings__option-checkbox"
							inputId="sonet-pw-copy-tasks"
							:isChecked="isCheckedTasks"
							:isDisabled="false"
							:isHighlighted="true"
							:isImportant="true"
							@change="handleChangeCheckerTasks"
						/>
					</div>
					<div class="scn-pw-copy-settings__option-text">
						<label class="scn-pw-copy-settings__option-head-label" for="sonet-pw-copy-tasks">
							<TextMd
								class="scn-pw-copy-settings__option-head"
							>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_TASKS_TITLE') }}</TextMd>
						</label>
						<TextXs
							class="scn-pw-copy-settings__option-descr"
						>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_TASKS_DESCR') }}</TextXs>
					</div>
				</li>
				<li
					class="scn-pw-copy-settings__option"
					:class="{
						'scn-pw-copy-settings__option_active': isCheckedRobots,
					}"
				>
					<div class="scn-pw-copy-settings__option-vis">
						<UiCheckbox
							class="scn-pw-copy-settings__checkbox"
							inputId="sonet-pw-copy-robots"
							:isChecked="isCheckedRobots"
							:isDisabled="!isCheckedTasks"
							:isHighlighted="true"
							:isImportant="true"
							@change="handleChangeCheckerRobots"
						/>
					</div>
					<div class="scn-pw-copy-settings__option-text">
						<div class="scn-pw-copy-settings__option-text">
							<label class="scn-pw-copy-settings__option-head-label" for="sonet-pw-copy-robots">
								<TextMd
									class="scn-pw-copy-settings__option-head"
								>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_ROBOTS_TITLE') }}</TextMd>
							</label>
							<TextXs
								class="scn-pw-copy-settings__option-descr"
							>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_ROBOTS_DESCR') }}</TextXs>
						</div>
					</div>
				</li>
				<li
					class="scn-pw-copy-settings__option"
					:class="{
						'scn-pw-copy-settings__option_active': isCheckedFolders,
					}"
				>
					<div class="scn-pw-copy-settings__option-vis">
						<UiCheckbox
							class="scn-pw-copy-settings__checkbox"
							inputId="sonet-pw-copy-folders"
							:isChecked="isCheckedFolders"
							:isDisabled="false"
							:isHighlighted="true"
							:isImportant="true"
							@change="handleChangeCheckerFolders"
						/>
					</div>
					<div class="scn-pw-copy-settings__option-text">
						<TextMd class="scn-pw-copy-settings__option-head">
							<label class="scn-pw-copy-settings__option-head-label" for="sonet-pw-copy-folders">
								<span
									class="scn-pw-copy-settings__option-head-text"
								>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_TITLE') }}</span>
							</label>
							<button
								id="selectorFoldersCopyType"
								ref="selectorFoldersCopyType"
								type="button"
								class="scn-pw-copy-settings__option-head-action"
								:class="{
									'scn-pw-copy-settings__option-head-action_opened': isOpenedSelectorFoldersCopyType,
								}"
								:disabled="!isCheckedFolders"
								aria-haspopup="menu"
								:aria-expanded="isOpenedSelectorFoldersCopyType ? 'true' : 'false'"
								@click="handleClickSelectorFoldersCopyType"
							>{{ titleSelectorFoldersCopyType }}</button>
						</TextMd>
						<TextXs
							class="scn-pw-copy-settings__option-descr"
						>{{ loc('SONET_EXT_PROJECT_WIZARD_COPY_OPTION_FOLDERS_DESCR') }}</TextXs>
						<BMenu
							v-if="isOpenedSelectorFoldersCopyType"
							:options="propsSelectorFoldersCopyType"
							@close="isOpenedSelectorFoldersCopyType = false"
						/>
					</div>
				</li>
			</ul>
		</UiField>
	`
	};

	// @vue/component
	const GoalField = {
		name: 'ProjectWizardGoalField',
		components: {
			UiField: socialnetwork_v2_components_elements_uiField.UiField,
			UiTextarea: socialnetwork_v2_components_elements_uiTextarea.UiTextarea
		},
		props: {
			disabled: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['goal']),
			inputId() {
				return 'sonet-project-wizard-goal';
			}
		},
		template: `
		<UiField
			class="socialnetwork--project-wizard-goal-field"
			:label="loc('SONET_EXT_PROJECT_WIZARD_GOAL_LABEL')"
			:labelFor="inputId"
		>
			<UiTextarea
				v-model.trim="goal"
				:id="inputId"
				:placeholder="loc('SONET_EXT_PROJECT_WIZARD_GOAL_PLACEHOLDER')"
				:disabled
			/>
		</UiField>
	`
	};

	// @vue/component
	const DescriptionField = {
		name: 'ProjectWizardDescriptionField',
		components: {
			UiField: socialnetwork_v2_components_elements_uiField.UiField,
			UiTextarea: socialnetwork_v2_components_elements_uiTextarea.UiTextarea
		},
		props: {
			disabled: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['description']),
			inputId() {
				return 'sonet-project-wizard-description';
			}
		},
		template: `
		<UiField
			class="socialnetwork--project-wizard-description-field"
			:label="loc('SONET_EXT_PROJECT_WIZARD_DESCRIPTION_LABEL')"
			:labelFor="inputId"
		>
			<UiTextarea
				v-model.trim="description"
				:id="inputId"
				:placeholder="loc('SONET_EXT_PROJECT_WIZARD_DESCRIPTION_PLACEHOLDER')"
				:disabled
			/>
		</UiField>
	`
	};

	// @vue/component
	const OwnerField = {
		name: 'ProjectWizardOwnerField',
		components: {
			UiField: socialnetwork_v2_components_elements_uiField.UiField
		},
		inject: {
			getWizardBodyContainer: {
				from: InjectionKey.GetWizardBodyContainer
			}
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['ownerId'])
		},
		mounted() {
			this.selector = this.createSelector();
			this.mountSelector();
		},
		beforeUnmount() {
			this.destroySelector();
		},
		methods: {
			createSelector() {
				return new socialnetwork_v2_components_selectors_usersSelector.UsersSelector({
					context: 'socialnetworkProjectWizardOwner',
					multiple: false,
					preselectedIds: main_core.Type.isNil(this.ownerId) ? [] : [this.ownerId],
					targetContainer: this.getTargetContainer(),
					onSelect: userId => {
						this.select(userId);
					},
					onDeselect: userId => {
						this.deselect(userId);
					}
				});
			},
			getTargetContainer() {
				return this.getWizardBodyContainer() ?? document.body;
			},
			mountSelector() {
				this.selector.renderTo(this.$refs.ownerSelector);
			},
			destroySelector() {
				this.selector.destroy();
				this.selector = null;
			},
			select(userId) {
				this.ownerId = userId;
			},
			deselect(userId) {
				if (this.ownerId === userId) {
					this.ownerId = null;
				}
			}
		},
		template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_OWNER_LABEL')"
			labelFor="sonet-project-wizard-owner"
		>
			<div
				ref="ownerSelector"
				class="sonet--project-wizard--owner-selector sonet--project-wizard--user-selector-wrapper --none-border-outer-container"
			></div>
		</UiField>
	`
	};

	// @vue/component
	const ModeratorsField = {
		name: 'ProjectWizardModeratorsField',
		components: {
			UiField: socialnetwork_v2_components_elements_uiField.UiField
		},
		inject: {
			getWizardBodyContainer: {
				from: InjectionKey.GetWizardBodyContainer
			}
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['moderators'])
		},
		mounted() {
			this.selector = this.createSelector();
			this.mountSelector();
		},
		beforeUnmount() {
			this.destroySelector();
		},
		methods: {
			createSelector() {
				return new socialnetwork_v2_components_selectors_usersSelector.UsersSelector({
					context: 'socialnetworkProjectWizardModerators',
					multiple: true,
					preselectedItems: (this.moderators || []).map(m => [m.type, m.id]),
					targetContainer: this.getTargetContainer(),
					onSelect: userId => {
						this.select(userId);
					},
					onDeselect: userId => {
						this.deselect(userId);
					}
				});
			},
			getTargetContainer() {
				return this.getWizardBodyContainer() ?? document.body;
			},
			mountSelector() {
				this.selector.renderTo(this.$refs.moderatorsSelector);
			},
			destroySelector() {
				this.selector.destroy();
				this.selector = null;
			},
			select(userId) {
				if (this.moderators.some(m => m.id === userId)) {
					return;
				}
				this.moderators.push({
					id: userId,
					type: socialnetwork_v2_const.EntitySelectorEntity.User
				});
			},
			deselect(userId) {
				this.moderators = this.moderators.filter(m => m.id !== userId);
			}
		},
		template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_MODERATORS_LABEL')"
			labelFor="sonet-project-wizard-moderators"
			:hint="loc('SONET_EXT_PROJECT_WIZARD_MODERATORS_HINT')"
		>
			<div
				ref="moderatorsSelector"
				class="sonet--project-wizard--moderators-selector sonet--project-wizard--user-selector-wrapper --none-border-outer-container"
			></div>
		</UiField>
	`
	};

	// @vue/component
	const MembersField = {
		name: 'ProjectWizardMembersField',
		components: {
			UiField: socialnetwork_v2_components_elements_uiField.UiField
		},
		inject: {
			getWizardBodyContainer: {
				from: InjectionKey.GetWizardBodyContainer
			}
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['members'])
		},
		mounted() {
			this.selector = this.createSelector();
			this.mountSelector();
		},
		beforeUnmount() {
			this.destroySelector();
		},
		methods: {
			createSelector() {
				return new socialnetwork_v2_components_selectors_usersSelector.UsersSelector({
					context: 'socialnetworkProjectWizardMembers',
					multiple: true,
					preselectedItems: this.getPreselectedMembers(),
					entities: [socialnetwork_v2_const.EntitySelectorEntity.Department],
					targetContainer: this.getTargetContainer(),
					onSelect: (userId, item) => {
						this.select(item.getId(), item.getEntityId());
					},
					onDeselect: (userId, item) => {
						this.deselect(item.getId(), item.getEntityId());
					}
				});
			},
			getTargetContainer() {
				return this.getWizardBodyContainer() ?? document.body;
			},
			getPreselectedMembers() {
				return this.members.map(p => {
					return [p.type, this.boxingDepartmentId(p.id, p.type, p.withChildNodes)];
				});
			},
			mountSelector() {
				this.selector.renderTo(this.$refs.membersSelector);
			},
			destroySelector() {
				this.selector.destroy();
				this.selector = null;
			},
			select(id, type) {
				const userId = this.unboxingDepartmentId(id, type);
				const withChildNodes = this.isWithChildNodes(id, type);
				if (this.members.some(p => p.id === userId && p.type === type && (p.withChildNodes ?? false) === withChildNodes)) {
					return;
				}
				this.members.push({
					id: userId,
					type,
					withChildNodes
				});
			},
			isWithChildNodes(id, type) {
				return type === socialnetwork_v2_const.EntitySelectorEntity.Department && main_core.Type.isNumber(id);
			},
			deselect(id, type) {
				const userId = this.unboxingDepartmentId(id, type);
				const withChildNodes = this.isWithChildNodes(id, type);
				this.members = this.members.filter(p => !(p.id === userId && p.type === type && (p.withChildNodes ?? false) === withChildNodes));
			},
			boxingDepartmentId(id, type, withChildNodes) {
				if (type !== socialnetwork_v2_const.EntitySelectorEntity.Department) {
					return id;
				}
				return withChildNodes ? id : `${id}:F`;
			},
			unboxingDepartmentId(id, type) {
				return type === socialnetwork_v2_const.EntitySelectorEntity.Department && main_core.Type.isStringFilled(id) && id.split(':')?.[1] === 'F' ? parseInt(id, 10) : id;
			}
		},
		template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_MEMBERS_LABEL')"
			labelFor="sonet-project-wizard-members"
		>
			<div
				ref="membersSelector"
				class="sonet--project-wizard--user-selector-wrapper --none-border-outer-container"
			></div>
		</UiField>
	`
	};

	// @vue/component
	const PrivacyTypeField = ui_vue3.defineComponent({
		name: 'ProjectWizardPrivacyTypeField',
		components: {
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			UiField: socialnetwork_v2_components_elements_uiField.UiField,
			RadioButton: ui_system_radiobutton.Vue.RadioButton
		},
		setup() {
			return {
				RadioButtonSize: ui_system_radiobutton.RadioButtonSize
			};
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['privacyType']),
			items() {
				return [{
					type: socialnetwork_v2_const.PrivacyType.Open,
					title: this.loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_OPEN_LABEL'),
					description: this.loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_OPEN_DESCRIPTION')
				}, {
					type: socialnetwork_v2_const.PrivacyType.Closed,
					title: this.loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_CLOSED_LABEL'),
					description: this.loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_CLOSED_DESCRIPTION')
				}];
			}
		},
		methods: {
			handleSelect(type, event) {
				if (event.target instanceof HTMLElement && event.target.closest('label')) {
					return;
				}
				this.privacyType = type;
			}
		},
		template: `
		<UiField :label="loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_LABEL')">
			<div
				class="sonet--project-wizard--privacy-type-field-content"
				role="radiogroup"
				:aria-label="loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_LABEL')"
				data-testid="project-wizard-privacy-type-group"
			>
				<div
					v-for="item in items"
					:key="item.type"
					:class="['sonet--project-wizard--privacy-type', {
						'--selected': privacyType === item.type
					}]"
					:data-testid="'project-wizard-privacy-type-option-' + item.type"
					@click="handleSelect(item.type, $event)"
				>
					<span class="sonet--project-wizard--privacy-type-radio">
						<RadioButton
							group="sonet-project-wizard-privacy-type"
							:size="RadioButtonSize.Sm"
							:modelValue="privacyType === item.type"
							:aria-label="item.title"
							:data-testid="'project-wizard-privacy-type-radio-' + item.type"
							@update:modelValue="privacyType = item.type"
						/>
					</span>
					<div class="sonet--project-wizard--privacy-type-content">
						<div class="sonet--project-wizard--privacy-type-title">
							<TextMd class="sonet--project-wizard--privacy-type-title-text">
								{{ item.title }}
							</TextMd>
						</div>
						<div class="sonet--project-wizard--privacy-type-description">
							<TextXs class="sonet--project-wizard--privacy-type-description-text">
								{{ item.description }}
							</TextXs>
						</div>
					</div>
				</div>
			</div>
		</UiField>
	`
	});

	const whiteList = ['chat', 'tasks', 'files', 'calendar', 'blog', 'flows', 'landing_knowledge'];
	const whiteListOrder = new Map(whiteList.map((featureId, index) => [featureId, index]));
	const featureIconMap = Object.freeze({
		chat: ui_iconSet_api_core.Outline.CHATS,
		tasks: ui_iconSet_api_core.Outline.TASK,
		files: ui_iconSet_api_core.Outline.ATTACH,
		calendar: ui_iconSet_api_core.Outline.CALENDAR,
		blog: ui_iconSet_api_core.Outline.NEWSFEED,
		flows: ui_iconSet_api_core.Outline.BOTTLENECK,
		landing_knowledge: ui_iconSet_api_core.Outline.KNOWLEDGE_BASE
	});

	// @vue/component
	const BaseFeatureField = {
		name: 'ProjectWizardBaseFeatureField',
		components: {
			BInput: ui_system_input_vue.BInput,
			BMenu: ui_system_menu_vue.BMenu,
			UiField: socialnetwork_v2_components_elements_uiField.UiField
		},
		inject: {
			getWizardBodyContainer: {
				from: InjectionKey.GetWizardBodyContainer
			}
		},
		data() {
			return {
				isMounted: false,
				isMenuShown: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['baseFeatureId', 'availableFeatures']),
			baseFeatures() {
				if (!this.availableFeatures) {
					return [];
				}
				return this.availableFeatures.filter(feature => whiteListOrder.has(feature.id)).sort((firstFeature, secondFeature) => {
					return whiteListOrder.get(firstFeature.id) - whiteListOrder.get(secondFeature.id);
				}).map(feature => ({
					id: feature.id,
					title: feature.name,
					icon: featureIconMap[feature.id] ?? ui_iconSet_api_core.Outline.TASK
				}));
			},
			selectedFeature() {
				return this.baseFeatures.find(feature => feature.id === this.baseFeatureId) ?? null;
			},
			menuOptions() {
				return {
					bindElement: this.$refs.input.$el,
					closeOnItemClick: false,
					targetContainer: this.targetContainer,
					items: this.baseFeatures.map(feature => ({
						title: feature.title,
						icon: feature.icon,
						isSelected: feature.id === this.baseFeatureId,
						design: ui_system_menu_vue.MenuItemDesign.Default,
						onClick: () => {
							this.update(feature.id);
							this.closeMenu();
						}
					}))
				};
			},
			targetContainer() {
				// `isMounted` makes this recompute once the wizard body ref is available
				// (it is null while the field renders inside the layout's body slot).
				return (this.isMounted ? this.getWizardBodyContainer() : null) ?? document.body;
			}
		},
		mounted() {
			this.isMounted = true;
		},
		methods: {
			update(featureId) {
				this.baseFeatureId = featureId;
			},
			openMenu() {
				if (this.isMenuShown) {
					return;
				}
				this.isMenuShown = true;
				void this.$nextTick(() => {
					this.focusActiveMenuItem();
				});
			},
			closeMenu() {
				if (!this.isMenuShown) {
					return;
				}
				const container = this.getMenuContainer();
				const focusWasInMenu = container?.contains(document.activeElement) ?? false;
				this.isMenuShown = false;
				if (focusWasInMenu) {
					this.$refs.input?.focus();
				}
			},
			handleKeydown(event) {
				if (this.isMenuShown) {
					return;
				}
				if (['Enter', ' ', 'Spacebar', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
					event.preventDefault();
					this.openMenu();
				}
			},
			focusActiveMenuItem() {
				const container = this.getMenuContainer();
				if (!container) {
					return;
				}
				const buttons = container.querySelectorAll('.ui-popup-menu-item-action');
				if (buttons.length === 0) {
					return;
				}
				const selectedIndex = this.baseFeatures.findIndex(feature => feature.id === this.baseFeatureId);
				const target = (selectedIndex >= 0 ? buttons[selectedIndex] : null) ?? buttons[0];
				target.focus();
			},
			getMenuContainer() {
				const fromInstance = this.$refs.menu?.menu?.getPopupContainer?.();
				if (fromInstance) {
					return fromInstance;
				}
				const root = this.targetContainer ?? document.body;
				return root.querySelector?.('.ui-popup-menu-container') ?? null;
			}
		},
		template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_BASE_FEATURE_LABEL')"
			labelFor="sonet-project-wizard-base-feature"
			data-testid="base-feature-target"
		>
			<div class="sonet--project-wizard--base-feature-field-content">
				<div class="sonet--project-wizard--base-feature-item">
					<BInput
						v-if="isMounted"
						:modelValue="selectedFeature?.title ?? ''"
						:placeholder="loc('SONET_EXT_PROJECT_WIZARD_BASE_FEATURE_INFO')"
						readonly
						dropdown
						stretched
						:active="isMenuShown"
						ref="input"
						data-testid="base-feature-select"
						@click="openMenu"
						@keydown="handleKeydown"
					/>
					<BMenu
						v-if="isMenuShown"
						ref="menu"
						:options="menuOptions"
						@close="closeMenu"
					/>
				</div>
			</div>
		</UiField>
	`
	};

	const toggleableFeatureIds = Object.freeze(['forum', 'wiki', 'photo', 'groupLists', 'landingKnowledge']);
	const toggleableFeatureLabels = Object.freeze({
		forum: 'SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_FORUM_LABEL_MSGVER_1',
		wiki: 'SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_WIKI_LABEL',
		photo: 'SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_PHOTO_LABEL',
		groupLists: 'SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_GROUP_LISTS_LABEL',
		landingKnowledge: 'SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_LANDING_KNOWLEDGE_LABEL'
	});

	// @vue/component
	const LegacyToolsBlock = {
		name: 'LegacyToolsBlock',
		components: {
			TextMd: ui_system_typography_vue.TextMd,
			TextSm: ui_system_typography_vue.TextSm,
			UiAccordion: socialnetwork_v2_components_elements_uiAccordion.UiAccordion,
			UiAccordionItem: socialnetwork_v2_components_elements_uiAccordion.UiAccordionItem,
			UiSwitcher: ui_vue3_components_switcher.Switcher
		},
		setup() {
			return {
				Solid: ui_iconSet_api_vue.Solid
			};
		},
		data() {
			return {
				tabIndex: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_project.useProjectStore, ['features', 'toggleableFeatures']),
			items() {
				return toggleableFeatureIds.filter(toggleableFeatureId => this.toggleableFeatures.includes(toggleableFeatureId)).map(toggleableFeatureId => ({
					id: toggleableFeatureId,
					label: this.loc(toggleableFeatureLabels[toggleableFeatureId])
				}));
			},
			switcherOptions() {
				return {
					size: ui_switcher.SwitcherSize.extraSmall,
					showStateTitle: false,
					useAirDesign: true
				};
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(socialnetwork_v2_model_project.useProjectStore, ['updateFeature'])
		},
		template: `
		<UiAccordion v-model:value="tabIndex">
			<UiAccordionItem
				:value="1"
				:title="loc('SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_TITLE')"
				:iconName="Solid.SERVICE"
				iconColor="var(--ui-color-base-4)"
			>
				<div class="sonet--project-wizard--legacy-tools">
					<TextSm
						tag="p"
						class="sonet--project-wizard--legacy-tools-description"
					>
						{{ loc('SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_DESCRIPTION') }}
					</TextSm>
					<div class="sonet--project-wizard--legacy-tools-list">
						<div
							v-for="item in items"
							:key="item.id"
							class="sonet--project-wizard--legacy-tools-item"
						>
							<UiSwitcher
								:isChecked="Boolean(features[item.id])"
								:options="switcherOptions"
								@check="updateFeature(item.id, true)"
								@uncheck="updateFeature(item.id, false)"
							/>
							<TextMd>
								{{ item.label }}
							</TextMd>
						</div>
					</div>
				</div>
			</UiAccordionItem>
		</UiAccordion>
	`
	};

	class ResetAccessRights {
		static execute() {
			const projectStore = socialnetwork_v2_model_project.useProjectStore();
			const defaultPermission = projectStore.defaultPermissions;
			if (main_core.Type.isNull(defaultPermission)) {
				return;
			}
			projectStore.patchProject({
				permissions: structuredClone(defaultPermission)
			});
		}
	}

	const fieldItemsBinary = [{
		id: 'Y',
		title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_Y')
	}, {
		id: 'N',
		title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_N')
	}];
	const permissions = {
		A: {
			id: 'A',
			title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_A')
		},
		E: {
			id: 'E',
			title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_E')
		},
		K: {
			id: 'K',
			title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_K')
		},
		J: {
			id: 'J',
			title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_J')
		},
		L: {
			id: 'L',
			title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_L')
		}
	};
	const fieldItemsPermissionsRole = [permissions.A, permissions.E, permissions.K];
	const fieldItemsPermissionsRoleFull = [permissions.A, permissions.E, permissions.K, permissions.J, permissions.L];
	const AccessRightsMeta = Object.freeze([{
		id: 'project',
		title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_PROJECT_LABEL'),
		fields: [{
			id: 'whoCanInvite',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_WHO_CAN_INVITE_FIELD'),
			items: [...fieldItemsPermissionsRole]
		}, {
			id: 'manageMessages',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_MANAGE_MESSAGES_FIELD'),
			items: [...fieldItemsPermissionsRole]
		}, {
			id: 'showHistory',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_SHOW_HISTORY_FIELD'),
			items: [...fieldItemsBinary]
		}, {
			id: 'allowGuestsInvitation',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_ALLOW_GUESTS_INVITATION_FIELD'),
			items: [...fieldItemsBinary]
		}]
	}, {
		id: 'tasks',
		title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_LABEL'),
		fields: [{
			id: 'view',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_VIEW_SELF_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'view_all',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_VIEW_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'sort',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_SORT_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'createTasks',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_CREATE_TASKS_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'editTasks',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_EDIT_TASKS_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'deleteTasks',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_DELETE_TASKS_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}]
	}, {
		id: 'blog',
		title: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_LABEL'),
		fields: [{
			id: 'view_post',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_VIEW_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'premoderate_post',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_PRE_MODERATE_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'write_post',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_CREATE_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'moderate_post',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_MODERATE_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'full_post',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_EDIT_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'view_comment',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_VIEW_COMMENT_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'premoderate_comment',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_PRE_MODERATE_COMMENT_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'write_comment',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_CREATE_COMMENT_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'moderate_comment',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_MODERATE_COMMENT_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}, {
			id: 'full_comment',
			label: main_core.Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_EDIT_COMMENT_FIELD'),
			items: [...fieldItemsPermissionsRoleFull]
		}]
	}]);

	// @vue/component
	const AccessRightsBlock = {
		name: 'AccessRightsBlock',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextMd: ui_system_typography_vue.TextMd,
			UiAccordion: socialnetwork_v2_components_elements_uiAccordion.UiAccordion,
			UiAccordionItem: socialnetwork_v2_components_elements_uiAccordion.UiAccordionItem,
			UiButton: ui_vue3_components_button.Button,
			UiDivider: socialnetwork_v2_components_elements_uiDivider.UiDivider,
			UiField: socialnetwork_v2_components_elements_uiField.UiField,
			UiSelect: socialnetwork_v2_components_elements_uiSelect.UiSelect
		},
		inject: {
			getWizardBodyContainer: {
				from: InjectionKey.GetWizardBodyContainer
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				tabIndex: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_project.useProjectStore, ['permissions', 'defaultPermissions']),
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_interface.useInterfaceStore, ['isAccessRestricted']),
			groups() {
				return AccessRightsMeta;
			},
			targetContainer() {
				return this.getWizardBodyContainer();
			},
			hasResetDefaultButton() {
				return this.defaultPermissions !== null;
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(socialnetwork_v2_model_project.useProjectStore, ['updatePermission']),
			resetAccessRights() {
				ResetAccessRights.execute();
			},
			showTariffPromoter() {
				ui_infoHelper.FeaturePromotersRegistry.getPromoter({
					featureId: 'socialnetwork_projects_access_permissions'
				}).show();
			}
		},
		template: `
		<div
			v-if="isAccessRestricted"
			ref="lockedBlock"
			class="sonet--project-wizard--access-rights-locked"
			role="button"
			tabindex="0"
			@click="showTariffPromoter"
			@keydown.enter.prevent="showTariffPromoter"
			@keydown.space.prevent="showTariffPromoter"
		>
			<BIcon
				:size="24"
				:name="Outline.LOCK_L"
				color="var(--ui-color-accent-main-primary)"
			/>
			<TextMd>{{ loc('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_LABEL') }}</TextMd>
		</div>
		<UiAccordion v-else v-model:value="tabIndex">
			<UiAccordionItem
				:value="1"
				:title="loc('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_LABEL')"
				:iconName="Outline.PERSON_SETTINGS"
				iconColor="var(--ui-color-base-4)"
			>
				<div class="sonet--project-wizard--access-rights">
					<div
						v-for="group in groups"
						:key="group.id"
						class="sonet--project-wizard--access-rights-item"
					>
						<div class="sonet--project-wizard--access-rights-item-title">{{ group.title }}</div>
						<UiField
							v-for="field in group.fields"
							:key="field.id"
							:label="field.label"
						>
							<UiSelect
								:modelValue="permissions[group.id]?.[field.id]"
								:label="field.label"
								:items="field.items"
								inputClassName="socialnetwork--project-wizard--field-shadow"
								:targetContainer
								@update:modelValue="updatePermission(group.id, field.id, $event)"
							/>
						</UiField>
						<UiDivider/>
					</div>
					<UiButton
						v-if="hasResetDefaultButton"
						:text="loc('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_RESET_BY_DEFAULT_BTN_LABEL')"
						:size="ButtonSize.SMALL"
						:style="AirButtonStyle.OUTLINE"
						class="sonet--project-wizard--access-rights--reset-button"
						@click="resetAccessRights"
					/>
				</div>
			</UiAccordionItem>
		</UiAccordion>
	`
	};

	const SLIDER_ID = 'socialnetwork:project-notifications';
	const SLIDER_WIDTH = 600;
	const NotificationsBlock = ui_vue3.defineComponent({
		name: 'ProjectWizardNotificationsBlock',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextMd: ui_system_typography_vue.TextMd
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				panelApp: null,
				slider: null
			};
		},
		created() {
			this._panelDepsPromise = null;
		},
		computed: {
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_project.useProjectStore, ['notifications']),
			isVisible() {
				return socialnetwork_v2_model_project.isValidNotificationCatalog(this.notifications);
			}
		},
		beforeUnmount() {
			this.unmountPanel();
		},
		methods: {
			...ui_vue3_pinia.mapActions(socialnetwork_v2_model_project.useProjectStore, ['setNotificationCounter']),
			async openPanel() {
				if (this._panelDepsPromise === null) {
					this._panelDepsPromise = Promise.all([main_core.Runtime.loadExtension('main.sidepanel'), main_core.Runtime.loadExtension('intranet.sidepanel.air'), main_core.Runtime.loadExtension('socialnetwork.v2.application.project-wizard.notifications-drawer')]).catch(error => {
						this._panelDepsPromise = null;
						throw error;
					});
				}
				const [{
					SidePanel
				},, {
					NotificationsPanel
				}] = await this._panelDepsPromise;
				if (!SidePanel || !SidePanel.Instance) {
					return;
				}
				const snapshot = this.notifications ? JSON.parse(JSON.stringify(this.notifications)) : null;
				SidePanel.Instance.open(SLIDER_ID, {
					cacheable: false,
					width: SLIDER_WIDTH,
					contentCallback: slider => {
						this.slider = ui_vue3.markRaw(slider);
						const container = slider.getContentContainer();
						this.panelApp = ui_vue3.markRaw(ui_vue3.BitrixVue.createApp(NotificationsPanel, {
							catalog: snapshot,
							onSave: updatedCatalog => this.applyAndClose(updatedCatalog),
							onCancel: () => this.closeSlider()
						}));
						this.panelApp.mixin(ui_vue3_mixins_locMixin.locMixin);
						this.panelApp.mount(container);
					},
					events: {
						onCloseComplete: () => {
							this.unmountPanel();
							this.slider = null;
							this.$nextTick(() => {
								this.$refs.trigger?.focus();
							});
						}
					}
				});
			},
			applyAndClose(updatedCatalog) {
				this.applyToStore(updatedCatalog);
				this.closeSlider();
			},
			applyToStore(updatedCatalog) {
				if (!updatedCatalog || !this.notifications) {
					return;
				}
				for (const group of updatedCatalog.groups) {
					for (const type of group.types) {
						const stored = this.findStoredType(type.id);
						if (stored && stored.counterEnabled !== type.counterEnabled) {
							this.setNotificationCounter(type.id, type.counterEnabled);
						}
					}
				}
			},
			findStoredType(typeId) {
				if (!this.notifications) {
					return null;
				}
				for (const group of this.notifications.groups) {
					const type = group.types.find(item => item.id === typeId);
					if (type) {
						return type;
					}
				}
				return null;
			},
			closeSlider() {
				this.slider?.close();
			},
			unmountPanel() {
				if (this.panelApp) {
					this.panelApp.unmount();
					this.panelApp = null;
				}
			}
		},
		template: `
		<div v-if="isVisible">
			<div
				ref="trigger"
				class="sonet--project-wizard--notifications-trigger"
				role="button"
				tabindex="0"
				data-testid="project-notifications-block"
				@click="openPanel"
				@keydown.enter.prevent="openPanel"
				@keydown.space.prevent="openPanel"
			>
				<span class="sonet--project-wizard--notifications-trigger-content">
					<BIcon :size="24" :name="Outline.NOTIFICATION" color="var(--ui-color-base-4)"/>
					<TextMd>{{ loc('SONET_EXT_PROJECT_WIZARD_NOTIFICATIONS_LABEL') }}</TextMd>
				</span>
				<span class="sonet--project-wizard--notifications-trigger-chevron">
					<BIcon :size="26" :name="Outline.CHEVRON_RIGHT_L" color="var(--ui-color-base-4)"/>
				</span>
			</div>
		</div>
	`
	});

	// @vue/component
	const ProjectDatesField = {
		name: 'ProjectDatesField',
		components: {
			UiField: socialnetwork_v2_components_elements_uiField.UiField,
			BInput: ui_system_input_vue.BInput
		},
		inject: {
			getWizardBodyContainer: {
				from: InjectionKey.GetWizardBodyContainer,
				default: () => document.body
			}
		},
		setup() {
			return {
				datePicker: null,
				handlePickerChangedDebounced: null,
				Outline: ui_iconSet_api_vue.Outline,
				InputDesign: ui_system_input_vue.InputDesign
			};
		},
		data() {
			return {
				activeField: null,
				pickerVisible: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_project.useProjectStore, ['dates']),
			startTs: {
				get() {
					return this.dates?.startTs ?? null;
				},
				set(value) {
					const store = socialnetwork_v2_model_project.useProjectStore();
					store.dates.startTs = value;
				}
			},
			finishTs: {
				get() {
					return this.dates?.finishTs ?? null;
				},
				set(value) {
					const store = socialnetwork_v2_model_project.useProjectStore();
					store.dates.finishTs = value;
				}
			},
			targetContainer() {
				return this.getWizardBodyContainer() ?? document.body;
			},
			formattedStartDate() {
				return this.formatDate(this.startTs);
			},
			formattedFinishDate() {
				return this.formatDate(this.finishTs);
			},
			pickerShown() {
				return {
					start: this.pickerVisible && this.activeField === 'start',
					finish: this.pickerVisible && this.activeField === 'finish'
				};
			}
		},
		beforeUnmount() {
			this.datePicker?.destroy();
			this.datePicker = null;
		},
		methods: {
			formatDate(ts) {
				if (!ts) {
					return '';
				}
				return socialnetwork_v2_lib_calendar.Calendar.formatDate(ts, {
					forceYear: true
				});
			},
			preparePickerTimestamp(date) {
				return main_core.Type.isDate(date) ? this.removeOffset(socialnetwork_v2_lib_calendar.Calendar.createDateFromUtc(date).getTime()) : null;
			},
			setFieldValue(startTs, finishTs) {
				this.startTs = startTs;
				this.finishTs = finishTs;
				this.updateDatePicker(this.startTs, this.finishTs);
			},
			getFieldValue(field) {
				return field === 'start' ? this.startTs : this.finishTs;
			},
			clearValue(field) {
				if (field === 'start') {
					this.setFieldValue(null, this.finishTs);
				} else if (field === 'finish') {
					this.setFieldValue(this.startTs, null);
				}
			},
			getDatePicker() {
				this.handlePickerChangedDebounced ??= main_core.Runtime.debounce(this.handlePickerChanged, 10, this);
				this.datePicker ??= new ui_datePicker.DatePicker({
					enableTime: false,
					selectionMode: 'range',
					defaultTime: socialnetwork_v2_lib_calendar.Calendar.dayEndTime,
					autoHide: true,
					popupOptions: {
						animation: 'fading',
						targetContainer: this.targetContainer
					},
					events: {
						[ui_datePicker.DatePickerEvent.SELECT]: this.handlePickerChangedDebounced,
						[ui_datePicker.DatePickerEvent.DESELECT]: this.handlePickerChangedDebounced,
						onShow: () => {
							this.pickerVisible = true;
						},
						onHide: () => {
							this.pickerVisible = false;
							this.activeField = null;
						}
					}
				});
				return this.datePicker;
			},
			handlePickerChanged() {
				let startTs = this.preparePickerTimestamp(this.datePicker?.getRangeStart());
				let finishTs = this.preparePickerTimestamp(this.datePicker?.getRangeEnd());
				if (this.pickerShown.finish && !finishTs && !this.startTs) {
					[startTs, finishTs] = [null, startTs];
				}
				if (startTs && !this.startTs) {
					startTs = socialnetwork_v2_lib_calendar.Calendar.setHours(startTs, socialnetwork_v2_lib_calendar.Calendar.workdayStart.H, socialnetwork_v2_lib_calendar.Calendar.workdayStart.M);
				}
				this.setFieldValue(startTs, finishTs);
			},
			handleDateClick(field, event) {
				this.activeField = field;
				const datePicker = this.getDatePicker();
				datePicker.setTargetNode(event.currentTarget);
				datePicker.show();
				const value = this.getFieldValue(field);
				if (value) {
					datePicker.setFocusDate(this.applyOffset(value));
				}
			},
			updateDatePicker(startTs, finishTs) {
				const datePicker = this.getDatePicker();
				const options = {
					emitEvents: false
				};
				if (!startTs && !finishTs) {
					datePicker.deselectAll(options);
					return;
				}
				if (startTs > 0) {
					datePicker.selectRange(this.applyOffset(startTs), this.applyOffset(finishTs), options);
				} else if (finishTs > 0) {
					datePicker.selectRange(this.applyOffset(finishTs), null, options);
				}
			},
			applyOffset(timestamp) {
				return main_core.Type.isNumber(timestamp) ? timestamp + socialnetwork_v2_lib_timezone.Timezone.getOffset(timestamp) : timestamp;
			},
			removeOffset(timestamp) {
				return main_core.Type.isNumber(timestamp) ? timestamp - socialnetwork_v2_lib_timezone.Timezone.getOffset(timestamp) : timestamp;
			}
		},
		template: `
		<UiField
			ref="datesField"
			:label="loc('SONET_EXT_PROJECT_WIZARD_PROJECT_DATES_FIELD_LABEL')"
			:hint="loc('SONET_EXT_PROJECT_WIZARD_PROJECT_DATES_FIELD_HINT')"
		>
			<div class="socialnetwork--project-wizard--project-dates-field">
				<BInput
					:modelValue="formattedStartDate"
					:icon="Outline.CALENDAR_WITH_SLOTS"
					:design="InputDesign.Grey"
					:active="pickerShown.start"
					:withClear="Boolean(startTs)"
					class="socialnetwork--project-wizard--field-shadow"
					readonly
					@clear="clearValue('start')"
					@click="handleDateClick('start', $event)"
					@keydown.enter.prevent="handleDateClick('start', $event)"
					@keydown.space.prevent="handleDateClick('start', $event)"
					@keydown.down.prevent="handleDateClick('start', $event)"
					@keydown.delete.prevent="clearValue('start')"
				/>
				<div class="socialnetwork--project-wizard--project-dates-field_separator"/>
				<BInput
					:modelValue="formattedFinishDate"
					:icon="Outline.CALENDAR_WITH_SLOTS"
					:design="InputDesign.Grey"
					:active="pickerShown.finish"
					:withClear="Boolean(finishTs)"
					class="socialnetwork--project-wizard--field-shadow"
					readonly
					@clear="clearValue('finish')"
					@click="handleDateClick('finish', $event)"
					@keydown.enter.prevent="handleDateClick('finish', $event)"
					@keydown.space.prevent="handleDateClick('finish', $event)"
					@keydown.down.prevent="handleDateClick('finish', $event)"
					@keydown.delete.prevent="clearValue('finish')"
				/>
			</div>
		</UiField>
	`
	};

	// @vue/component
	const ProjectTagsField = {
		name: 'ProjectTagsField',
		components: {
			UiField: socialnetwork_v2_components_elements_uiField.UiField
		},
		inject: {
			getWizardBodyContainer: {
				from: InjectionKey.GetWizardBodyContainer
			}
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['tags'])
		},
		mounted() {
			this.selector = this.createSelector();
			this.mountSelector();
		},
		beforeUnmount() {
			this.destroySelector();
		},
		methods: {
			createSelector() {
				return new socialnetwork_v2_components_selectors_tagsSelector.TagsSelector({
					context: 'socialnetworkProjectWizardTags',
					groupId: 0,
					targetContainer: this.getWizardBodyContainer() ?? document.body,
					onSelect: item => {
						this.select(item);
					},
					onDeselect: item => {
						this.deselect(item);
					}
				});
			},
			mountSelector() {
				this.selector.renderTo(this.$refs.tagsSelector, this.tags);
			},
			destroySelector() {
				this.selector.destroy();
				this.selector = null;
			},
			select(item) {
				const tagNew = item.getId();
				if (!this.tags.includes(tagNew)) {
					this.tags = [...this.tags, tagNew];
				}
			},
			deselect(item) {
				this.tags = this.tags.filter(tag => tag !== item.getId());
			}
		},
		template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_PROJECT_TAGS_LABEL')"
			class="socialnetwork--project-wizard--field-shadow"
			labelFor="sonet-project-wizard-tags"
		>
			<div
				ref="tagsSelector"
				class="sonet--project-wizard--tags-selector --none-border-outer-container"
			></div>
		</UiField>
	`
	};

	// @vue/component
	const AutoRemoveField = {
		name: 'AutoRemoveField',
		components: {
			AutoDeleteMessagePopup: socialnetwork_v2_components_popup_autoDeletePopup.AutoDeleteMessagePopup,
			AutoDeleteMessageDropdown: socialnetwork_v2_components_popup_autoDeletePopup.AutoDeleteMessageDropdown,
			UiSwitcherField: socialnetwork_v2_components_elements_uiSwitcherField.UiSwitcherField
		},
		inject: {
			getWizardBodyContainer: {
				from: InjectionKey.GetWizardBodyContainer
			}
		},
		data() {
			return {
				shownPopup: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_project.useProjectStore, ['messagesAutoDeleteDelay']),
			value() {
				return this.messagesAutoDeleteDelay > socialnetwork_v2_const.AutoDeleteMessageDelay.Off;
			},
			targetContainer() {
				return this.getWizardBodyContainer() ?? document.body;
			},
			hintOptions() {
				return {
					maxWidth: 300
				};
			}
		},
		methods: {
			...ui_vue3_pinia.mapActions(socialnetwork_v2_model_project.useProjectStore, ['updateMessagesAutoDeleteDelay']),
			clickInSwitcher() {
				if (this.value) {
					this.updateMessagesAutoDeleteDelay(socialnetwork_v2_const.AutoDeleteMessageDelay.Off);
					return;
				}
				this.showAutoDeleteMessageDelayPopup();
			},
			showAutoDeleteMessageDelayPopup() {
				this.shownPopup = true;
			},
			closeAutoDeleteMessageDelayPopup() {
				this.shownPopup = false;
			},
			onAutoDeleteDelayChange(delay = socialnetwork_v2_const.AutoDeleteMessageDelay.Off) {
				this.updateMessagesAutoDeleteDelay(delay);
			}
		},
		template: `
		<div>
			<UiSwitcherField
				:modelValue="value"
				:label="loc('SONET_EXT_PROJECT_WIZARD_AUTO_REMOVE_LABEL')"
				:hint="loc('SONET_EXT_PROJECT_WIZARD_AUTO_REMOVE_HINT')"
				:hintOptions
				@click="clickInSwitcher"
			>
				<template v-if="value" #underline="{ status }">
					<AutoDeleteMessageDropdown
						:delay="messagesAutoDeleteDelay"
						:targetContainer
						@change="onAutoDeleteDelayChange"
					/>
				</template>
			</UiSwitcherField>
			<AutoDeleteMessagePopup
				v-if="shownPopup"
				:delay="messagesAutoDeleteDelay"
				@change="onAutoDeleteDelayChange"
				@close="closeAutoDeleteMessageDelayPopup"
			/>
		</div>
	`
	};

	// @vue/component
	const PublicationField = {
		name: 'PublicationField',
		components: {
			UiSwitcherField: socialnetwork_v2_components_elements_uiSwitcherField.UiSwitcherField
		},
		computed: {
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_project.useProjectStore, ['publication'])
		},
		template: `
		<UiSwitcherField
			v-model="publication"
			:label="loc('SONET_EXT_PROJECT_WIZARD_PUBLICATION_LABEL')"
		/>
	`
	};

	// @vue/component
	const AdditionalSettingsBlock = {
		name: 'AdditionalSettingsBlock',
		components: {
			UiAccordion: socialnetwork_v2_components_elements_uiAccordion.UiAccordion,
			UiAccordionItem: socialnetwork_v2_components_elements_uiAccordion.UiAccordionItem,
			ProjectDatesField,
			ProjectTagsField,
			AutoRemoveField,
			PublicationField,
			UiDivider: socialnetwork_v2_components_elements_uiDivider.UiDivider
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				tabIndex: null
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_interface.useInterfaceStore, ['isActionCreate']),
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_project.useProjectStore, ['publication'])
		},
		template: `
		<UiAccordion v-model:value="tabIndex">
			<UiAccordionItem
				:value="1"
				:title="loc('SONET_EXT_PROJECT_WIZARD_ADDITIONAL_PROJECT_SETTINGS_LABEL')"
				:iconName="Outline.FILTER_2_LINES"
				iconColor="var(--ui-color-base-4)"
			>
				<div class="sonet--project-wizard--additional-settings">
					<ProjectDatesField/>
					<ProjectTagsField/>
					<UiDivider/>
					<AutoRemoveField/>
					<PublicationField v-if="!isActionCreate && publication"/>
				</div>
			</UiAccordionItem>
		</UiAccordion>
	`
	};

	// @vue/component
	const ProjectWizardContent = {
		name: 'ProjectWizardContent',
		components: {
			AccessRightsBlock,
			NotificationsBlock,
			AdditionalSettingsBlock,
			CopySettingsField,
			GoalField,
			DescriptionField,
			MembersField,
			LegacyToolsBlock,
			ModeratorsField,
			OwnerField,
			PrivacyTypeField,
			BaseFeatureField,
			NewProjectBanner: socialnetwork_v2_components_banners_newProjectBanner.NewProjectBanner
		},
		data() {
			return {
				shownBanner: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_interface.useInterfaceStore, ['isActionCopy', 'isActionCreate', 'isOldPortal']),
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_project.useProjectStore, ['toggleableFeatures'])
		},
		created() {
			this.shownBanner = this.isActionCreate;
		},
		template: `
		<div class="socialnetwork--project-wizard-content">
			<NewProjectBanner v-if="shownBanner" @close="shownBanner = false" />
			<GoalField />
			<DescriptionField />
			<CopySettingsField
				v-if="isActionCopy"
			/>
			<OwnerField />
			<ModeratorsField />
			<MembersField />
			<PrivacyTypeField />
			<BaseFeatureField v-if="isOldPortal" />
			<AccessRightsBlock />
			<NotificationsBlock />
			<LegacyToolsBlock
				v-if="(toggleableFeatures.length > 0 && !isActionCopy)"
			/>
			<AdditionalSettingsBlock />
		</div>
	`
	};

	// @vue/component
	const ScnButtonSubmitProject = {
		name: 'ScnButtonSubmitProject',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				fetching: false
			};
		},
		computed: {
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_interface.useInterfaceStore, ['isActionCopy', 'isActionUpdate']),
			title() {
				let title = '';
				if (this.isActionCopy) {
					title = this.loc('SONET_EXT_PROJECT_WIZARD_COPY_BUTTON');
				} else if (this.isActionUpdate) {
					title = this.loc('SONET_EXT_PROJECT_WIZARD_UPDATE_BUTTON');
				} else {
					title = this.loc('SONET_EXT_PROJECT_WIZARD_CREATE_BUTTON');
				}
				return title;
			}
		},
		methods: {
			async createProject() {
				const createProjectFeature = new socialnetwork_v2_features_project_createProjectFeature.CreateProjectFeature();
				const createdProject = await createProjectFeature.create();
				if (createdProject) {
					main_core.Event.EventEmitter.emit(socialnetwork_v2_const.EventName.SaveProjectWizard, {
						id: createdProject.id,
						name: createdProject.title,
						chatId: createdProject.chatId
					});
				}
			},
			async updateProject() {
				const updateProjectFeature = new socialnetwork_v2_features_project_updateProjectFeature.UpdateProjectFeature();
				const updatedProject = await updateProjectFeature.update();
				if (updatedProject) {
					ui_notificationManager.Notifier.notifyViaBrowserProvider({
						id: 'socialnetwork-project-wizard-project-updated',
						text: this.loc('SONET_EXT_PROJECT_WIZARD_UPDATED')
					});
					main_core.Event.EventEmitter.emit(socialnetwork_v2_const.EventName.SaveProjectWizard, {
						id: updatedProject.id,
						name: updatedProject.title,
						chatId: updatedProject.chatId
					});
				}
			},
			async copyProject() {
				const copyProjectFeature = new socialnetwork_v2_features_project_copyProjectFeature.CopyProjectFeature();
				const copiedProject = await copyProjectFeature.copy();
				if (copiedProject) {
					ui_notificationManager.Notifier.notifyViaBrowserProvider({
						id: 'socialnetwork-project-wizard-project-copied',
						text: this.loc('SONET_EXT_PROJECT_WIZARD_COPIED')
					});
					main_core.Event.EventEmitter.emit(socialnetwork_v2_const.EventName.SaveProjectWizard, {
						id: copiedProject.id,
						name: copiedProject.title,
						chatId: copiedProject.chatId
					});
				}
			},
			async submitProject() {
				if (this.fetching) {
					return;
				}
				this.fetching = true;
				if (this.isActionCopy) {
					await this.copyProject();
				} else if (this.isActionUpdate) {
					await this.updateProject();
				} else {
					await this.createProject();
				}
				this.fetching = false;
			},
			handleClickSubmit() {
				this.submitProject();
			}
		},
		template: `
		<UiButton
			:size="ButtonSize.LARGE"
			:text="title"
			:loading="fetching"
			@click="handleClickSubmit"
		/>
	`
	};

	// @vue/component
	const ProjectWizardFooter = {
		name: 'ProjectWizardFooter',
		components: {
			ScnButtonSubmitProject,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		methods: {
			close() {
				main_core.Event.EventEmitter.emit(socialnetwork_v2_const.EventName.CloseProjectWizard);
			}
		},
		template: `
		<div class="socialnetwork--project-wizard-footer">
			<ScnButtonSubmitProject />
			<UiButton
				:text="loc('SONET_EXT_PROJECT_WIZARD_CANCEL_BUTTON')"
				:size="ButtonSize.LARGE"
				:style="AirButtonStyle.PLAIN"
				@click="close"
			/>
		</div>
	`
	};

	const HIGHLIGHT_CLASS = 'sonet--project-wizard--base-feature-highlight';
	// Must match the animation duration of `.sonet--project-wizard--base-feature-highlight`
	// defined in base-feature.css (@keyframes sonet-project-wizard-base-feature-highlight-fade, 1.8s).
	const HIGHLIGHT_DURATION_MS = 1800;

	// @vue/component
	const App = {
		name: 'SocialnetworkProjectWizardApp',
		components: {
			ProjectWizardLayout,
			ProjectWizardHeader,
			ProjectWizardContent,
			ProjectWizardFooter
		},
		computed: {
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_interface.useInterfaceStore, ['currentUserId', 'isActionCreate', 'isActionUpdate', 'isActionCopy', 'scrollToStartupTool']),
			...ui_vue3_pinia.mapWritableState(socialnetwork_v2_model_interface.useInterfaceStore, ['loading']),
			...ui_vue3_pinia.mapState(socialnetwork_v2_model_project.useProjectStore, {
				id: 'id'
			})
		},
		created() {
			this.patchProject({
				ownerId: this.currentUserId
			});
			void this.initWizard();
		},
		beforeUnmount() {
			clearTimeout(this._highlightTimer);
		},
		methods: {
			...ui_vue3_pinia.mapActions(socialnetwork_v2_model_project.useProjectStore, ['patchProject']),
			async initWizard() {
				this.loading = true;
				this._scrollDone = false;
				if (!this.isActionCreate && this.id > 0) {
					await new socialnetwork_v2_features_project_getProjectFeature.GetProjectFeature().getProject(this.id);
					void this.getDefaultData();
				} else {
					await new socialnetwork_v2_features_project_getProjectFeature.GetProjectFeature().getAvailableFeatures();
					await this.getDefaultData();
					const error = await new socialnetwork_v2_features_project_getProjectFeature.GetProjectFeature().getAvailableFeatures();
					if (error) {
						ui_notificationManager.Notifier.notifyViaBrowserProvider({
							id: 'socialnetwork-project-wizard-init-error',
							text: error.message
						});
					}
				}
				this.loading = false;
				if (this.isActionUpdate && this.scrollToStartupTool) {
					void this.$nextTick(() => {
						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								if (!this._scrollDone) {
									this._scrollDone = true;
									this.scrollToStartupToolHandler();
								}
							});
						});
					});
				}
			},
			async getDefaultData() {
				await GetDefaultData.getDefaultData();
			},
			scrollToStartupToolHandler() {
				try {
					const searchRoot = this.$el instanceof HTMLElement ? this.$el : document;
					const target = searchRoot.querySelector('[data-testid="base-feature-target"]');
					if (target instanceof HTMLElement) {
						target.scrollIntoView({
							block: 'center',
							behavior: 'smooth'
						});
						const highlightTarget = target.querySelector('.sonet--project-wizard--base-feature-field-content');
						if (!(highlightTarget instanceof HTMLElement)) {
							return;
						}
						clearTimeout(this._highlightTimer);
						highlightTarget.classList.remove(HIGHLIGHT_CLASS);
						// Force reflow so re-adding the class restarts the animation
						void highlightTarget.offsetWidth;
						highlightTarget.classList.add(HIGHLIGHT_CLASS);
						this._highlightTimer = setTimeout(() => {
							highlightTarget.classList.remove(HIGHLIGHT_CLASS);
						}, HIGHLIGHT_DURATION_MS);
					}
				} catch {
					// best-effort: scroll failure must not break the wizard
				}
			}
		},
		template: `
		<ProjectWizardLayout :loading>
			<template #body>
				<ProjectWizardHeader v-if="!loading"/>
				<ProjectWizardContent/>
			</template>
			<template #footer>
				<ProjectWizardFooter #footer/>
			</template>
		</ProjectWizardLayout>
	`
	};

	let pendingStartupToolScroll = false;
	let projectsTrialBannerProposed = false;
	class ProjectWizard {
		#params;
		#application;
		#slider;
		#boundSave = null;
		#boundClose = null;
		constructor(params) {
			this.#params = this.#sanitizeParams(params || {});
		}
		static requestStartupToolScroll() {
			pendingStartupToolScroll = true;
		}
		#sanitizeParams(params = {}) {
			return Object.fromEntries(Object.entries(params).filter(([, value]) => !main_core.Type.isUndefined(value)));
		}
		show(options = {}) {
			BX.SidePanel.Instance.open('socialnetwork-project-wizard-panel', {
				contentCallback: async slider => {
					return this.mount(slider);
				},
				cacheable: false,
				events: {
					onClose: () => this.unmount()
				},
				...options
			});
		}
		async mount(slider) {
			if (pendingStartupToolScroll) {
				pendingStartupToolScroll = false;
				this.#params.scrollToStartupTool = true;
			}
			if (slider) {
				if (slider.isOpen()) {
					return;
				}
				this.#slider = slider;
				this.#params.container = slider.getContentContainer();
			}
			if (!main_core.Type.isDomNode(this.#params.container)) {
				throw new Error('The container for mounting the program is not set.');
			}
			this.#application = await this.#mountApplication(this.#params.container);
			this.#subscribe();
		}
		unmount() {
			this.#unmountApplication();
			this.#unsubscribe();
		}
		#subscribe() {
			this.#boundClose = this.#close.bind(this);
			this.#boundSave = this.#save.bind(this);
			main_core.Event.EventEmitter.subscribe(socialnetwork_v2_const.EventName.CloseProjectWizard, this.#boundClose);
			main_core.Event.EventEmitter.subscribe(socialnetwork_v2_const.EventName.SaveProjectWizard, this.#boundSave);
		}
		#unsubscribe() {
			if (main_core.Type.isFunction(this.#boundClose)) {
				main_core.Event.EventEmitter.unsubscribe(socialnetwork_v2_const.EventName.CloseProjectWizard, this.#boundClose);
			}
			if (main_core.Type.isFunction(this.#boundSave)) {
				main_core.Event.EventEmitter.unsubscribe(socialnetwork_v2_const.EventName.SaveProjectWizard, this.#boundSave);
			}
			this.#boundClose = null;
			this.#boundSave = null;
		}
		#close() {
			if (main_core.Type.isFunction(this.#params.onCancel)) {
				this.#params.onCancel();
			}
			this.#slider?.close();
			this.unmount();
		}
		#save(event) {
			if (main_core.Type.isFunction(this.#params.onSave)) {
				this.#params.onSave({
					id: event.data.id,
					name: event.data.name,
					chatId: event.data.chatId
				});
			}
			this.#slider?.close();
			this.unmount();
			this.#proposeProjectsTrial();
		}
		#proposeProjectsTrial() {
			if (!socialnetwork_v2_model_interface.isCreateProjectWizardAction(this.#params.action) || socialnetwork_v2_core.Core.getSettings().canProposeProjectsTrial !== true || projectsTrialBannerProposed) {
				return;
			}
			projectsTrialBannerProposed = true;
			main_core.Runtime.loadExtension('socialnetwork.v2.components.popup.projects-trial-banner').then(({
				showProjectsTrialBanner
			}) => showProjectsTrialBanner()).catch(() => {
				projectsTrialBannerProposed = false;
			});
		}
		async #mountApplication(container) {
			const application = ui_vue3.BitrixVue.createApp(App);
			application.mixin(ui_vue3_mixins_locMixin.locMixin);
			// @chef-ignore
			application.use(socialnetwork_v2_core.Core.createStore());
			socialnetwork_v2_core.Core.initStores(this.#params);
			application.mount(container);
			return application;
		}
		#unmountApplication() {
			this.#application?.unmount();
			this.#application = null;
		}
	}

	exports.ProjectWizard = ProjectWizard;

})(this.BX.Socialnetwork.V2.Application = this.BX.Socialnetwork.V2.Application || {}, BX, BX.Vue3, BX.Vue3.Mixins, BX.Socialnetwork.V2, BX.Socialnetwork.V2, BX.Socialnetwork.V2.Model, BX.Vue3.Pinia, BX.UI.NotificationManager, BX.Socialnetwork.V2.Model, BX.Socialnetwork.V2.Features.Project, BX.Socialnetwork.V2.Provider.Services, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Components.Elements, BX.UI.Accessibility, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Components.Banners, BX.UI.System.Menu, BX.UI.System.Typography.Vue, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Components.Selectors, BX.UI.System.RadioButton, BX.UI.IconSet, BX.UI.System.Input.Vue, BX.UI.IconSet, window, BX.UI.Vue3.Components, BX.UI, BX.Socialnetwork.V2.Components.Elements, BX.Vue3.Components, BX.UI, window, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Components.Elements, BX.UI.DatePicker, BX.Socialnetwork.V2.Lib, BX.Socialnetwork.V2.Lib, BX.Socialnetwork.V2.Components.Selectors, BX.Socialnetwork.V2.Components.Elements, BX.Socialnetwork.V2.Components.Popup, BX.Socialnetwork.V2.Features.Project, BX.Socialnetwork.V2.Features.Project, BX.Socialnetwork.V2.Features.Project);
//# sourceMappingURL=project-wizard.bundle.js.map

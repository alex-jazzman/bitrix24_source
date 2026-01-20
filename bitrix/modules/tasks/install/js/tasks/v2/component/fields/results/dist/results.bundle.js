/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_iconSet_animated,tasks_v2_lib_ahaMoments,tasks_v2_component_elements_hint,tasks_v2_lib_highlighter,ui_vue3,ui_vue3_directives_hint,tasks_v2_component_elements_userAvatar,tasks_v2_component_elements_userFieldWidgetComponent,ui_system_skeleton_vue,main_core_events,tasks_v2_component_dropZone,tasks_v2_component_elements_bottomSheet,ui_textEditor,tasks_v2_lib_calendar,tasks_v2_provider_service_fileService,tasks_v2_component_entityText,ui_system_typography_vue,ui_vue3_components_button,main_core,ui_vue3_vuex,ui_vue3_components_menu,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_core,tasks_v2_const,tasks_v2_lib_showLimit,tasks_v2_lib_fieldHighlighter,tasks_v2_provider_service_resultService,tasks_v2_provider_service_taskService,tasks_v2_provider_service_stateService,tasks_v2_provider_service_userService) {
	'use strict';

	const resultsMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Results,
	  title: main_core.Loc.getMessage('TASKS_V2_RESULT_TITLE_META')
	});

	// @vue/component
	const ResultCardItem = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_vue3_components_menu.BMenu,
	    UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar,
	    UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent,
	    EntityCollapsibleText: tasks_v2_component_entityText.EntityCollapsibleText,
	    TextSm: ui_system_typography_vue.TextSm,
	    TextXs: ui_system_typography_vue.TextXs,
	    TextMd: ui_system_typography_vue.TextMd,
	    Hint: tasks_v2_component_elements_hint.Hint
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    taskId: {}
	  },
	  props: {
	    resultId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['titleClick', 'edit', 'highlightField'],
	  setup(props) {
	    const fileServiceInstance = tasks_v2_provider_service_fileService.fileService.get(props.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
	    const fileServiceRef = ui_vue3.shallowRef(fileServiceInstance);
	    const uploaderAdapterRef = ui_vue3.shallowRef(fileServiceInstance.getAdapter());
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      resultsMeta,
	      UserAvatarSize: tasks_v2_component_elements_userAvatar.UserAvatarSize,
	      fileService: fileServiceRef,
	      uploaderAdapter: uploaderAdapterRef
	    };
	  },
	  data() {
	    return {
	      opened: false,
	      isMenuShown: false,
	      showResultFromMessageHint: false,
	      files: this.fileService.getFiles()
	    };
	  },
	  computed: {
	    result() {
	      return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](this.resultId);
	    },
	    isEdit() {
	      return main_core.Type.isNumber(this.resultId) && this.resultId > 0;
	    },
	    resultTitle() {
	      return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
	        '#DATE#': this.resultDate
	      });
	    },
	    resultDate() {
	      if (!this.result.createdAtTs) {
	        return '';
	      }
	      return tasks_v2_lib_calendar.calendar.formatDateTime(this.result.createdAtTs);
	    },
	    resultText() {
	      var _this$result$text;
	      return (_this$result$text = this.result.text) != null ? _this$result$text : '';
	    },
	    resultAuthor() {
	      return this.result.author;
	    },
	    filesCount() {
	      return this.files.length;
	    },
	    widgetOptions() {
	      return {
	        isEmbedded: true,
	        withControlPanel: false,
	        canCreateDocuments: false,
	        tileWidgetOptions: {
	          compact: true,
	          hideDropArea: true,
	          readonly: true,
	          enableDropzone: false,
	          autoCollapse: false
	        }
	      };
	    },
	    menuOptions() {
	      return {
	        id: `result-action-menu-${main_core.Text.getRandom()}`,
	        bindOptions: {
	          forceBindPosition: true
	        },
	        bindElement: this.$refs.moreIcon.$el,
	        targetContainer: document.body,
	        offsetLeft: -100,
	        minWidth: 250,
	        items: this.menuItems,
	        autoHide: true,
	        closeByEsc: true
	      };
	    },
	    menuItems() {
	      return [this.result.rights.edit && this.isEdit && {
	        title: this.loc('TASKS_V2_RESULT_EDIT'),
	        icon: ui_iconSet_api_vue.Outline.EDIT_L,
	        onClick: this.handleEditClick.bind(this),
	        dataset: {
	          id: `MenuResultEdit-${this.resultId}`
	        }
	      }, this.result.rights.remove && {
	        design: 'alert',
	        title: this.loc('TASKS_V2_RESULT_REMOVE'),
	        icon: ui_iconSet_api_vue.Outline.TRASHCAN,
	        onClick: this.handleDeleteClick.bind(this),
	        dataset: {
	          id: `MenuResultRemove-${this.resultId}`
	        }
	      }].filter(Boolean);
	    },
	    hasMenuItems() {
	      return this.menuItems.length > 0;
	    },
	    tooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_V2_RESULT_ADD'),
	        popupOptions: {
	          offsetLeft: this.$refs.addIcon.offsetWidth / 2
	        }
	      });
	    }
	  },
	  watch: {
	    resultId(newResultId) {
	      this.fileService = tasks_v2_provider_service_fileService.fileService.get(newResultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
	      this.uploaderAdapter = this.fileService.getAdapter();
	      this.files = this.fileService.getFiles();
	      this.opened = false;
	    },
	    resultText() {
	      var _this$$refs$collapsib;
	      void this.$nextTick((_this$$refs$collapsib = this.$refs.collapsible) == null ? void 0 : _this$$refs$collapsib.updateIsOverflowing);
	    }
	  },
	  mounted() {
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultFromMessageAdded, this.handleResultFromMessageAdded);
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultFromMessageAdded, this.handleResultFromMessageAdded);
	  },
	  methods: {
	    handleEditClick() {
	      this.$emit('edit', this.resultId);
	    },
	    handleDeleteClick() {
	      void tasks_v2_provider_service_resultService.resultService.delete(this.resultId);
	    },
	    handleAuthorClick() {
	      BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.resultAuthor.id));
	    },
	    handleResultFromMessageAdded(event) {
	      const {
	        taskId
	      } = event.getData();
	      if (this.taskId !== taskId) {
	        return;
	      }
	      this.$emit('highlightField');
	      if (!tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaResultFromMessagePopup)) {
	        return;
	      }
	      tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaResultFromMessagePopup);
	      this.showResultFromMessageHint = true;
	    },
	    handleResultFromMessageHintClose() {
	      this.showResultFromMessageHint = false;
	      tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaResultFromMessagePopup);
	    },
	    handleResultFromMessageHintCloseComplete() {
	      if (!this.showResultFromMessageHint) {
	        return;
	      }
	      this.showResultFromMessageHint = false;
	      tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaResultFromMessagePopup);
	    }
	  },
	  template: `
		<div
			class="tasks-field-results-result --card"
			:data-task-field-id="resultsMeta.id"
			data-field-container
		>
			<div
				class="tasks-field-results-title"
				ref="title"
				@click="$emit('titleClick', resultId)"
			>
				<div class="tasks-field-results-title-main">
					<BIcon :name="Outline.WINDOW_FLAG"/>
					<TextMd accent>{{ resultTitle }}</TextMd>
				</div>
				<div class="tasks-field-results-title-actions">
					<BIcon
						v-if="hasMenuItems"
						class="tasks-field-results-title-icon"
						:name="Outline.MORE_L"
						hoverable
						ref="moreIcon"
						@click.stop="isMenuShown = true"
					/>
					<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
					<Hint
						v-if="showResultFromMessageHint"
						:bindElement="$refs.moreIcon.$el"
						:options="{
							closeIcon: true,
							offsetLeft: 10,
							minWidth: 340,
							maxWidth: 340,
							bindOptions: {
								forceBindPosition: true,
							},
						}"
						@close="handleResultFromMessageHintClose"
					>
						<div class="tasks-field-results-hint-info">
							<TextMd className="tasks-field-results-hint-info-text">
								{{ loc('TASKS_V2_RESULT_AHA_RESULT_FROM_MESSAGE') }}
							</TextMd>
							<TextXs
								className="tasks-field-results-hint-info-link"
								@click.stop="handleResultFromMessageHintCloseComplete"
							>
								{{ loc('TASKS_V2_RESULT_AHA_SHOW_NO_MORE') }}
							</TextXs>
						</div>
					</Hint>
				</div>
			</div>
			<div class="tasks-field-results-result-content" ref="content">
				<div class="tasks-field-results-result-author-border">
					<div
						class="tasks-field-results-result-author-border-clickable"
						@click="handleAuthorClick"
					>
						<UserAvatar
							:src="resultAuthor.image"
							:type="resultAuthor.type"
							:size="UserAvatarSize.XS"
							:bx-tooltip-user-id="resultAuthor.id"
							bx-tooltip-context="b24"
						/>
						<TextSm
							className="tasks-field-results-result-author-name"
							:bx-tooltip-user-id="resultAuthor.id"
							bx-tooltip-context="b24"
						>
							{{ resultAuthor.name }}
						</TextSm>
					</div>
				</div>
				<EntityCollapsibleText
					ref="collapsible"
					:files
					:content="resultText"
					readonly
					:showFilesIndicator="false"
					v-model:opened="opened"
				/>
				<div v-if="filesCount > 0" class="tasks-field-results-result-files" :key="resultId">
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResultsActionButton = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  props: {
	    title: {
	      type: String,
	      default: ''
	    },
	    iconName: {
	      type: String,
	      required: true
	    },
	    iconColor: {
	      type: String,
	      default: ''
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    showTooltip() {
	      return this.title.length > 0;
	    },
	    tooltip() {
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.title,
	        popupOptions: {
	          offsetLeft: this.$el.offsetWidth / 2
	        }
	      });
	    }
	  },
	  template: `
		<button class="tasks-field-results-action-button" type="button" v-hint="showTooltip ? tooltip : null">
			<BIcon
				:name="iconName"
				:color="iconColor"
				hoverable
				class="tasks-field-results-title-icon --big"
			/>
		</button>
	`
	};

	// @vue/component
	const ResultRequiredAha = {
	  components: {
	    UiButton: ui_vue3_components_button.Button,
	    Hint: tasks_v2_component_elements_hint.Hint,
	    TextMd: ui_system_typography_vue.TextMd,
	    HeadlineSm: ui_system_typography_vue.HeadlineSm
	  },
	  props: {
	    bindElement: {
	      type: Object,
	      required: true
	    },
	    popupWidth: {
	      type: Number,
	      default: 530
	    },
	    hasResults: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['close', 'addResult'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  computed: {
	    title() {
	      return this.hasResults ? this.loc('TASKS_V2_RESULT_AHA_REQUIRE_NEW_RESULT_RESPONSIBLE_TITLE') : this.loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_RESPONSIBLE_TITLE');
	    },
	    description() {
	      return this.hasResults ? this.loc('TASKS_V2_RESULT_AHA_REQUIRE_NEW_RESULT_RESPONSIBLE_DESC') : this.loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_RESPONSIBLE_DESC');
	    }
	  },
	  template: `
		<Hint
			:bindElement
			:options="{
				closeIcon: true,
				minWidth: popupWidth,
				maxWidth: popupWidth,
				padding: 0,
			}"
			@close="$emit('close')"
		>
			<div class="tasks-field-results-hint-container">
				<div class="tasks-field-results-hint-icon"/>
				<div class="tasks-field-results-hint-info">
					<HeadlineSm className="tasks-field-results-hint-info-text">{{ title }}</HeadlineSm>
					<TextMd className="tasks-field-results-hint-info-text">{{ description }}</TextMd>
					<div class="tasks-field-results-hint-button">
						<UiButton
							:text="loc('TASKS_V2_RESULT_ADD')"
							:size="ButtonSize.SMALL"
							:style="AirButtonStyle.TINTED"
							:leftIcon="Outline.PLUS_L"
							:wide="false"
							@click="$emit('addResult')"
						/>
					</div>
				</div>
			</div>
		</Hint>
	`
	};

	// @vue/component
	const ResultListItem = {
	  name: 'TaskResultListItem',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_vue3_components_menu.BMenu,
	    HeadlineSm: ui_system_typography_vue.HeadlineSm,
	    UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar,
	    UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent,
	    EntityCollapsibleText: tasks_v2_component_entityText.EntityCollapsibleText,
	    TextSm: ui_system_typography_vue.TextSm
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  props: {
	    resultId: {
	      type: [Number, String],
	      required: true
	    },
	    showDelimiter: {
	      type: Boolean,
	      default: false
	    },
	    isResized: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['titleClick', 'edit', 'resize'],
	  setup(props) {
	    const fileServiceInstance = tasks_v2_provider_service_fileService.fileService.get(props.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
	    const fileServiceRef = ui_vue3.shallowRef(fileServiceInstance);
	    const uploaderAdapterRef = ui_vue3.shallowRef(fileServiceInstance.getAdapter());
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      resultsMeta,
	      UserAvatarSize: tasks_v2_component_elements_userAvatar.UserAvatarSize,
	      fileService: fileServiceRef,
	      uploaderAdapter: uploaderAdapterRef
	    };
	  },
	  data() {
	    return {
	      isSticky: false,
	      scrollContainer: null,
	      mutationObserver: null,
	      isMenuShown: false,
	      files: this.fileService.getFiles()
	    };
	  },
	  computed: {
	    result() {
	      return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](this.resultId);
	    },
	    isEdit() {
	      return main_core.Type.isNumber(this.resultId) && this.resultId > 0;
	    },
	    resultTitle() {
	      return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
	        '#DATE#': this.resultDate
	      });
	    },
	    resultDate() {
	      if (!this.result.createdAtTs) {
	        return '';
	      }
	      return tasks_v2_lib_calendar.calendar.formatDateTime(this.result.createdAtTs);
	    },
	    resultText() {
	      var _this$result$text;
	      return (_this$result$text = this.result.text) != null ? _this$result$text : '';
	    },
	    resultAuthor() {
	      return this.result.author;
	    },
	    filesCount() {
	      return this.files.length;
	    },
	    widgetOptions() {
	      return {
	        isEmbedded: true,
	        withControlPanel: false,
	        canCreateDocuments: false,
	        tileWidgetOptions: {
	          compact: true,
	          hideDropArea: true,
	          readonly: true,
	          enableDropzone: false,
	          autoCollapse: false
	        }
	      };
	    },
	    menuOptions() {
	      return {
	        id: `result-action-menu-${main_core.Text.getRandom()}`,
	        bindOptions: {
	          forceBindPosition: true
	        },
	        bindElement: this.$refs.moreIcon.$el,
	        targetContainer: document.body,
	        offsetLeft: -100,
	        minWidth: 250,
	        items: this.menuItems,
	        autoHide: true,
	        closeByEsc: true
	      };
	    },
	    menuItems() {
	      return [this.result.rights.edit && this.isEdit && {
	        title: this.loc('TASKS_V2_RESULT_EDIT'),
	        icon: ui_iconSet_api_vue.Outline.EDIT_L,
	        onClick: this.handleEditClick.bind(this),
	        dataset: {
	          id: `MenuResultEdit-${this.resultId}`
	        }
	      }, this.result.rights.remove && {
	        design: 'alert',
	        title: this.loc('TASKS_V2_RESULT_REMOVE'),
	        icon: ui_iconSet_api_vue.Outline.TRASHCAN,
	        onClick: this.handleDeleteClick.bind(this),
	        dataset: {
	          id: `MenuResultRemove-${this.resultId}`
	        }
	      }].filter(Boolean);
	    },
	    hasMenuItems() {
	      return this.menuItems.length > 0;
	    },
	    resizeIcon() {
	      return this.isResized ? ui_iconSet_api_vue.Outline.COLLAPSE_L : ui_iconSet_api_vue.Outline.EXPAND_L;
	    }
	  },
	  watch: {
	    resultId(newResultId) {
	      this.fileService = tasks_v2_provider_service_fileService.fileService.get(newResultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
	      this.uploaderAdapter = this.fileService.getAdapter();
	      this.files = this.fileService.getFiles();
	    }
	  },
	  mounted() {
	    var _this$$el;
	    this.scrollContainer = (_this$$el = this.$el) == null ? void 0 : _this$$el.closest('.tasks-field-results-result-list-content');
	    if (this.scrollContainer) {
	      main_core.Event.bind(this.scrollContainer, 'scroll', this.handleScroll);
	      void this.$nextTick(this.checkSticky);
	      this.mutationObserver = new MutationObserver(() => this.checkSticky());
	      this.mutationObserver.observe(this.scrollContainer, {
	        childList: true,
	        subtree: true
	      });
	    }
	  },
	  beforeUnmount() {
	    if (this.scrollContainer) {
	      main_core.Event.unbind(this.scrollContainer, 'scroll', this.handleScroll);
	    }
	    if (this.mutationObserver) {
	      this.mutationObserver.disconnect();
	    }
	  },
	  methods: {
	    handleEditClick() {
	      this.$emit('edit', this.resultId);
	    },
	    handleDeleteClick() {
	      void tasks_v2_provider_service_resultService.resultService.delete(this.resultId);
	    },
	    handleResizeClick() {
	      this.$emit('resize');
	    },
	    handleScroll() {
	      this.checkSticky();
	    },
	    checkSticky() {
	      if (!this.scrollContainer || !this.$refs.title) {
	        return;
	      }
	      const itemRect = this.$refs.title.getBoundingClientRect();
	      const containerRect = this.scrollContainer.getBoundingClientRect();
	      this.isSticky = itemRect.top <= containerRect.top + itemRect.height / 2;
	    },
	    handleAuthorClick() {
	      BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.resultAuthor.id));
	    }
	  },
	  template: `
		<div class="tasks-field-results-result --list-mode">
			<div
				class="tasks-field-results-title --list-mode"
				:class="{ '--sticky': isSticky }"
				ref="title"
				@click="$emit('titleClick', resultId)"
			>
				<div class="tasks-field-results-title-main">
					<BIcon :name="Outline.WINDOW_FLAG"/>
					<HeadlineSm>{{ resultTitle }}</HeadlineSm>
				</div>
				<div class="tasks-field-results-title-actions">
					<BIcon
						v-if="hasMenuItems"
						class="tasks-field-results-title-icon --big"
						:name="Outline.MORE_L"
						hoverable
						ref="moreIcon"
						@click.stop="isMenuShown = true"
					/>
					<BIcon
						v-if="isSticky"
						class="tasks-field-results-title-icon --big"
						:name="resizeIcon"
						hoverable
						@click.stop="handleResizeClick"
					/>
					<div v-if="isSticky" class="tasks-field-results-result-empty"/>
					<BMenu
						v-if="isMenuShown"
						:options="menuOptions"
						@close="isMenuShown = false"
					/>
				</div>
			</div>
			<div
				class="tasks-field-results-result-content"
				ref="content"
			>
				<div
					class="tasks-field-results-result-author"
					@click="handleAuthorClick"
				>
					<UserAvatar
						:src="resultAuthor.image"
						:type="resultAuthor.type"
						:size="UserAvatarSize.XS"
						:bx-tooltip-user-id="resultAuthor.id"
						bx-tooltip-context="b24"
					/>
					<TextSm
						className="tasks-field-results-result-author-name"
						:bx-tooltip-user-id="resultAuthor.id"
						bx-tooltip-context="b24"
					>
						{{ resultAuthor.name }}
					</TextSm>
				</div>
				<EntityCollapsibleText
					ref="collapsible"
					:content="resultText"
					:files
					readonly
					showFilesIndicator
					openByDefault
					opened
				/>
				<div
					v-if="filesCount > 0"
					class="tasks-field-results-result-files --list-mode"
				>
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
			</div>
			<div v-if="showDelimiter" class="tasks-field-results-result-separator"/>
			<div v-else class="tasks-field-results-result-last-padding"/>
		</div>
	`
	};

	// @vue/component
	const ResultSkeleton = {
	  components: {
	    BLine: ui_system_skeleton_vue.BLine
	  },
	  template: `
		<div class="tasks-field-results-result-skeleton-container">
			<BLine :width="460" :height="12" :radius="60"/>
			<BLine :width="460" :height="12" :radius="60"/>
			<BLine :width="460" :height="12" :radius="60"/>
			<BLine :width="197" :height="12" :radius="60"/>
		</div>
	`
	};

	// @vue/component
	const ResultEditor = {
	  name: 'TaskResultEditor',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    UiButton: ui_vue3_components_button.Button,
	    EntityTextArea: tasks_v2_component_entityText.EntityTextArea,
	    ResultsActionButton
	  },
	  inject: {
	    taskId: {},
	    task: {}
	  },
	  props: {
	    resultId: {
	      type: [Number, String],
	      required: true
	    },
	    content: {
	      type: String,
	      default: ''
	    },
	    isResized: {
	      type: Boolean,
	      default: false
	    },
	    showResize: {
	      type: Boolean,
	      default: true
	    }
	  },
	  emits: ['close', 'resize'],
	  setup(props) {
	    return {
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonColor: ui_vue3_components_button.ButtonColor,
	      Outline: ui_iconSet_api_vue.Outline,
	      EntityTypes: tasks_v2_provider_service_fileService.EntityTypes,
	      EntityTextTypes: tasks_v2_component_entityText.EntityTextTypes,
	      fileService: tasks_v2_provider_service_fileService.fileService.get(props.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result),
	      entityTextEditor: tasks_v2_component_entityText.entityTextEditor.get(props.resultId, tasks_v2_component_entityText.EntityTextTypes.Result, {
	        content: props.content,
	        blockSpaceInline: 'var(--ui-space-stack-xl)'
	      })
	    };
	  },
	  data() {
	    return {
	      isSaving: false,
	      hasChanges: false,
	      hasFilesChanges: false,
	      buttonDisabled: !main_core.Type.isStringFilled(this.content)
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
	    }),
	    result() {
	      return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](this.resultId);
	    },
	    currentUser() {
	      return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](this.currentUserId);
	    },
	    isEdit() {
	      return main_core.Type.isNumber(this.resultId) && this.resultId > 0;
	    },
	    resultDate() {
	      if (!this.result.createdAtTs) {
	        return '';
	      }
	      return tasks_v2_lib_calendar.calendar.formatDateTime(this.result.createdAtTs);
	    },
	    title() {
	      if (this.isEdit) {
	        return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
	          '#DATE#': this.resultDate
	        });
	      }
	      return this.loc('TASKS_V2_RESULT_ADD');
	    },
	    buttonTitle() {
	      return this.isEdit ? this.loc('TASKS_V2_RESULT_BUTTON_SAVE') : this.loc('TASKS_V2_RESULT_BUTTON_SEND');
	    },
	    readonly() {
	      var _this$result, _this$result$rights;
	      if (!this.result) {
	        var _this$task, _this$task$rights;
	        return !((_this$task = this.task) != null && (_this$task$rights = _this$task.rights) != null && _this$task$rights.read);
	      }
	      return !((_this$result = this.result) != null && (_this$result$rights = _this$result.rights) != null && _this$result$rights.edit);
	    },
	    editor() {
	      return this.entityTextEditor.getEditor();
	    },
	    copilotIconColor() {
	      return 'var(--ui-color-copilot-primary)';
	    },
	    hasEditorChanges() {
	      return this.hasChanges || this.hasFilesChanges;
	    },
	    resizeIcon() {
	      return this.isResized ? ui_iconSet_api_vue.Outline.COLLAPSE_L : ui_iconSet_api_vue.Outline.EXPAND_L;
	    },
	    isDiskModuleInstalled() {
	      return tasks_v2_core.Core.getParams().features.disk;
	    },
	    isCopilotEnabled() {
	      return tasks_v2_core.Core.getParams().features.isCopilotEnabled;
	    }
	  },
	  mounted() {
	    if (!this.task.filledFields[resultsMeta.id]) {
	      void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/setFieldFilled`, {
	        id: this.taskId,
	        fieldName: resultsMeta.id
	      });
	    }
	    if (!main_core.Type.isStringFilled(this.content) || this.resultId === 0) {
	      setTimeout(this.focusToEnd, 400);
	    }
	  },
	  unmounted() {
	    if (!this.isEdit && !this.isSaving) {
	      void this.$store.dispatch(`${tasks_v2_const.Model.Results}/delete`, this.resultId);
	      tasks_v2_provider_service_fileService.fileService.delete(this.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
	      tasks_v2_component_entityText.entityTextEditor.delete(this.resultId, tasks_v2_component_entityText.EntityTextTypes.Result);
	    }
	  },
	  methods: {
	    handleEditButtonClick() {
	      if (this.isEdit) {
	        this.handleClose();
	      } else {
	        this.handleAddResult();
	      }
	    },
	    handleAddResult() {
	      this.isSaving = true;
	      const result = {
	        ...this.result,
	        text: this.editor.getText(),
	        author: this.currentUser,
	        status: tasks_v2_const.ResultStatus.Open,
	        createdAtTs: Date.now(),
	        updatedAtTs: Date.now()
	      };
	      void tasks_v2_provider_service_resultService.resultService.add(this.taskId, result);
	      this.handleClose();
	      main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultAdded, {
	        taskId: this.taskId
	      });
	    },
	    handleUpdateResult() {
	      if (!this.hasEditorChanges) {
	        return;
	      }
	      const fields = {
	        text: this.editor.getText(),
	        updatedAtTs: Date.now() / 1000,
	        status: tasks_v2_const.ResultStatus.Open
	      };
	      void tasks_v2_provider_service_resultService.resultService.update(this.resultId, fields);
	      this.hasChanges = false;
	      this.hasFilesChanges = false;
	      main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultUpdated, {
	        taskId: this.taskId,
	        resultId: this.resultId
	      });
	    },
	    handleEditorChange() {
	      var _this$editor;
	      const preparedOldText = this.getPreparedText(this.content);
	      const preparedNewText = this.getPreparedText((_this$editor = this.editor) == null ? void 0 : _this$editor.getText());
	      this.hasChanges = preparedOldText !== preparedNewText;
	      this.buttonDisabled = !main_core.Type.isStringFilled(preparedNewText);
	    },
	    getPreparedText(text) {
	      return text.replaceAll(/\[p]\n|\[p]\[\/p]|\[\/p]/gi, '').trim();
	    },
	    focusToEnd() {
	      var _this$editor2;
	      (_this$editor2 = this.editor) == null ? void 0 : _this$editor2.focus(null, {
	        defaultSelection: 'rootEnd'
	      });
	    },
	    handleCopilotButtonClick() {
	      if (!this.isCopilotEnabled) {
	        return;
	      }
	      this.editor.focus(() => {
	        this.editor.dispatchCommand(BX.UI.TextEditor.Plugins.Copilot.INSERT_COPILOT_DIALOG_COMMAND);
	      }, {
	        defaultSelection: 'rootEnd'
	      });
	    },
	    handleMentionButtonClick() {
	      this.editor.focus(() => {
	        this.editor.dispatchCommand(BX.UI.TextEditor.Plugins.Mention.INSERT_MENTION_DIALOG_COMMAND);
	      }, {
	        defaultSelection: 'rootEnd'
	      });
	    },
	    handleAttachButtonClick() {
	      this.fileService.browse({
	        bindElement: this.$refs.attachBtn.$el,
	        onHideCallback: this.onFileBrowserClose
	      });
	    },
	    onFileBrowserClose() {
	      this.fileService.setFileBrowserClosed(false);
	    },
	    handleClose() {
	      if (this.isEdit) {
	        this.handleUpdateResult();
	      }
	      this.$emit('close');
	    }
	  },
	  template: `
		<div class="tasks-result-editor-wrapper" ref="wrapper">
			<div class="tasks-result-editor-header" ref="resultHeader">
				<div class="tasks-result-editor-title">{{ title }}</div>
				<div class="tasks-result-editor-field-actions">
					<BIcon
						v-if="showResize"
						class="tasks-result-editor-field-icon"
						:name="resizeIcon"
						hoverable
						@click="$emit('resize')"
					/>
					<BIcon
						:name="Outline.CROSS_L"
						hoverable
						class="tasks-result-editor-field-icon"
						@click="handleClose"
					/>
				</div>
			</div>
			<div class="tasks-result-editor-container">
				<EntityTextArea
					:entityId="resultId"
					:entityType="EntityTextTypes.Result"
					:readonly
					:removeFromServer="!isEdit"
					ref="resultTextArea"
					@change="handleEditorChange"
					@filesChange="hasFilesChanges = true"
				/>
			</div>
			<div v-if="!readonly" class="tasks-result-editor-footer" ref="resultActions">
				<div class="tasks-result-editor-action-list">
					<ResultsActionButton
						v-if="isCopilotEnabled"
						:iconName="Outline.COPILOT"
						:title="loc('TASKS_V2_RESULT_ACTION_COPILOT_TITLE')"
						:iconColor="copilotIconColor"
						@click="handleCopilotButtonClick"
					/>
					<ResultsActionButton
						v-if="isDiskModuleInstalled"
						ref="attachBtn"
						:iconName="Outline.ATTACH"
						:title="loc('TASKS_V2_RESULT_ACTION_ATTACH_TITLE')"
						@click="handleAttachButtonClick"
					/>
					<ResultsActionButton
						:iconName="Outline.MENTION"
						:title="loc('TASKS_V2_RESULT_ACTION_MENTION_TITLE')"
						@click="handleMentionButtonClick"
					/>
				</div>
				<div class="tasks-result-editor-footer-buttons">
					<UiButton
						:text="buttonTitle"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.PRIMARY"
						:disabled="buttonDisabled || isSaving"
						@click="handleEditButtonClick"
					/>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResultEditorSheet = {
	  components: {
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    DropZone: tasks_v2_component_dropZone.DropZone,
	    ResultEditor
	  },
	  inject: {
	    taskId: {}
	  },
	  props: {
	    resultId: {
	      type: [Number, String],
	      required: true
	    },
	    showResize: {
	      type: Boolean,
	      default: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      EntityTypes: tasks_v2_provider_service_fileService.EntityTypes
	    };
	  },
	  data() {
	    return {
	      isResized: false,
	      uniqueKey: main_core.Text.getRandom()
	    };
	  },
	  computed: {
	    result() {
	      return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](this.resultId);
	    },
	    bottomSheetContainer() {
	      return document.getElementById(`b24-bottom-sheet-${this.uniqueKey}`) || null;
	    },
	    isDiskModuleInstalled() {
	      return tasks_v2_core.Core.getParams().features.disk;
	    }
	  },
	  mounted() {
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	  },
	  methods: {
	    handleOpenResultFromMessage(event) {
	      const {
	        taskId
	      } = event.getData();
	      if (this.taskId === taskId) {
	        this.$emit('close');
	      }
	    }
	  },
	  template: `
		<BottomSheet
			:sheetBindProps
			:isExpanded="isResized"
			:padding="0"
			:popupPadding="0"
			:uniqueKey
			@close="$emit('close')"
		>
			<ResultEditor
				:resultId
				:content="result.text || ''"
				:isResized
				:showResize
				@close="$emit('close')"
				@resize="isResized = !isResized"
			/>
			<DropZone
				v-if="isDiskModuleInstalled"
				:container="bottomSheetContainer || {}"
				:entityId="resultId || 0"
				:entityType="EntityTypes.Result"
			/>
		</BottomSheet>
	`
	};

	// @vue/component
	const ResultListEmpty = {
	  name: 'ResultListEmpty',
	  components: {
	    TextLg: ui_system_typography_vue.TextLg,
	    UiButton: ui_vue3_components_button.Button
	  },
	  emits: ['addResult'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  template: `
		<div class="tasks-field-results-result-list-empty">
			<div class="tasks-field-results-result-list-empty-image"/>
			<TextLg className="tasks-field-results-result-list-empty-title">
				{{ loc('TASKS_V2_RESULT_LIST_EMPTY') }}
			</TextLg>
			<div class="tasks-field-results-result-list-empty-button">
				<UiButton
					:text="loc('TASKS_V2_RESULT_ADD')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.PLUS_L"
					:wide="false"
					@click="$emit('addResult')"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResultListSheet = {
	  components: {
	    BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    UiButton: ui_vue3_components_button.Button,
	    ResultListItem,
	    ResultSkeleton,
	    ResultEditorSheet,
	    ResultListEmpty,
	    HeadlineMd: ui_system_typography_vue.HeadlineMd
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  props: {
	    resultId: {
	      type: [Number, String],
	      required: true
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  data() {
	    return {
	      editResultId: 0,
	      isResultEditorShown: false,
	      isResized: false
	    };
	  },
	  computed: {
	    results() {
	      return this.task.results;
	    },
	    loadedResults() {
	      return this.results.filter(resultId => this.isResultLoaded(resultId));
	    },
	    hasUnloadedResults() {
	      return this.results.length !== this.loadedResults.length;
	    },
	    isEmptyState() {
	      return this.results.length === 0;
	    }
	  },
	  watch: {
	    async resultId(newResultId) {
	      await this.$nextTick();
	      if (newResultId) {
	        this.focusTo(newResultId);
	      }
	    }
	  },
	  mounted() {
	    if (this.hasUnloadedResults) {
	      void tasks_v2_provider_service_resultService.resultService.getAll(this.taskId);
	    }
	    this.focusTo(this.resultId);
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultAdded, this.handleResultAdded);
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultUpdated, this.handleResultUpdated);
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultAdded, this.handleResultAdded);
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultUpdated, this.handleResultUpdated);
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	  },
	  methods: {
	    isResultLoaded(resultId) {
	      return Boolean(this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](resultId));
	    },
	    focusTo(resultId) {
	      if (!resultId) {
	        return;
	      }
	      const scrollContainer = this.$refs.scrollContainer;
	      if (!scrollContainer) {
	        return;
	      }
	      const {
	        targetId,
	        offset,
	        shouldHighlight
	      } = this.calculateFocusTarget(resultId);
	      this.scrollToTarget(targetId, offset, shouldHighlight);
	    },
	    calculateFocusTarget(resultId) {
	      return {
	        targetId: resultId,
	        offset: 80,
	        shouldHighlight: true
	      };
	    },
	    scrollToTarget(targetId, offset, shouldHighlight) {
	      setTimeout(() => {
	        const targetNode = this.$refs.scrollContainer.querySelector(`[data-result-id="${targetId}"]`);
	        if (!targetNode) {
	          return;
	        }
	        if (shouldHighlight) {
	          this.highlightResult(targetId);
	        }
	        this.$refs.scrollContainer.scrollTop = targetNode.offsetTop - offset;
	      }, 0);
	    },
	    highlightResult(targetId) {
	      const highlightElement = this.$refs.scrollContainer.querySelector(`[data-result-id="${targetId}"]`);
	      if (highlightElement) {
	        void tasks_v2_lib_highlighter.highlighter.highlight(highlightElement);
	      }
	    },
	    openAddResultSheet() {
	      this.editResultId = main_core.Text.getRandom();
	      const payload = {
	        id: this.editResultId,
	        taskId: this.taskId,
	        author: tasks_v2_core.Core.getParams().currentUser
	      };
	      void this.$store.dispatch(`${tasks_v2_const.Model.Results}/insert`, payload);
	      this.isResultEditorShown = true;
	    },
	    openEditResult(resultId) {
	      this.editResultId = resultId;
	      this.isResultEditorShown = true;
	    },
	    closeResultEditor() {
	      this.isResultEditorShown = false;
	      this.editResultId = 0;
	    },
	    handleResultAdded(event) {
	      const {
	        taskId
	      } = event.getData();
	      if (taskId !== this.taskId) {
	        return;
	      }
	      this.$emit('close');
	    },
	    handleResultUpdated(event) {
	      const {
	        taskId,
	        resultId
	      } = event.getData();
	      if (taskId !== this.taskId) {
	        return;
	      }
	      this.focusTo(resultId);
	    },
	    handleOpenResultFromMessage(event) {
	      const {
	        taskId,
	        resultId
	      } = event.getData();
	      if (this.taskId !== taskId || !this.isShown) {
	        return;
	      }
	      this.focusTo(resultId);
	    }
	  },
	  template: `
		<BottomSheet
			:sheetBindProps
			:isExpanded="isResized"
			:padding="0"
			:popupPadding="0"
			@close="$emit('close')"
		>
			<div class="tasks-field-results-result-list" ref="main">
				<div class="tasks-field-results-result-list-close-icon">
					<BIcon :name="Outline.CROSS_L" hoverable @click="$emit('close')"/>
				</div>
				<div  v-if="isEmptyState" class="tasks-field-results-result-list-header">
					<HeadlineMd className="tasks-field-results-result-list-title">
						{{ loc('TASKS_V2_RESULT_LIST_EMPTY_TITLE') }}
					</HeadlineMd>
				</div>
				<div class="tasks-field-results-result-list-content" ref="scrollContainer">
					<ResultListEmpty v-if="isEmptyState" @addResult="openAddResultSheet"/>
					<div
						v-else
						v-for="(result, resultIndex) in results"
						:key="result"
						:data-result-id="result"
						class="tasks-field-results-result-item"
					>
						<ResultListItem
							v-if="isResultLoaded(result)"
							:resultId="result"
							listMode
							:showDelimiter="resultIndex !== results.length - 1"
							:isResized
							@edit="openEditResult"
							@resize="isResized = !isResized"
						/>
						<ResultSkeleton v-else/>
					</div>
				</div>
			</div>
			<div
				v-if="!isEmptyState"
				class="tasks-field-results-result-add-button"
			>
				<UiButton
					:text="loc('TASKS_V2_RESULT_ADD')"
					:style="AirButtonStyle.SELECTION"
					:size="ButtonSize.SMALL"
					@click="openAddResultSheet"
				/>
			</div>
			<ResultEditorSheet
				v-if="isResultEditorShown"
				:resultId="editResultId"
				:sheetBindProps
				:showResize="false"
				@close="closeResultEditor"
			/>
		</BottomSheet>
	`
	};

	// @vue/component
	const Results = {
	  name: 'TaskResults',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_vue3_components_menu.BMenu,
	    Hint: tasks_v2_component_elements_hint.Hint,
	    TextMd: ui_system_typography_vue.TextMd,
	    TextXs: ui_system_typography_vue.TextXs,
	    ResultCardItem,
	    ResultRequiredAha,
	    ResultsActionButton,
	    ResultEditorSheet,
	    ResultListSheet
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  props: {
	    isSheetShown: {
	      type: Boolean,
	      default: false
	    },
	    isListSheetShown: {
	      type: Boolean,
	      default: false
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      resultsMeta,
	      Outline: ui_iconSet_api_vue.Outline,
	      Animated: ui_iconSet_api_vue.Animated
	    };
	  },
	  data() {
	    return {
	      isMenuShown: false,
	      isLoading: null,
	      showCreatorResultHint: false,
	      showResponsibleResultHint: false,
	      sheetResultId: 0
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`
	    }),
	    requireResult() {
	      var _this$task;
	      return ((_this$task = this.task) == null ? void 0 : _this$task.requireResult) || false;
	    },
	    isCreator() {
	      return tasks_v2_core.Core.getParams().currentUser.id === (this == null ? void 0 : this.task.creatorId);
	    },
	    isResponsible() {
	      var _this$task2, _this$task2$responsib, _this$task3;
	      const userId = tasks_v2_core.Core.getParams().currentUser.id;
	      return ((_this$task2 = this.task) == null ? void 0 : (_this$task2$responsib = _this$task2.responsibleIds) == null ? void 0 : _this$task2$responsib.includes(userId)) || ((_this$task3 = this.task) == null ? void 0 : _this$task3.accomplicesIds.includes(userId));
	    },
	    containsResults() {
	      return this.task.containsResults;
	    },
	    results() {
	      return this.task.results || [];
	    },
	    hasResults() {
	      return this.results.length > 0;
	    },
	    showMore() {
	      return this.results.length > 1;
	    },
	    lastResultId() {
	      return this.hasResults ? this.results[0] : null;
	    },
	    moreText() {
	      const count = this.results.length - 1;
	      return main_core.Loc.getMessagePlural('TASKS_V2_RESULT_SHOW_MORE', count, {
	        '#COUNT#': count
	      });
	    },
	    emptyResultTitle() {
	      return this.requireResult ? main_core.Loc.getMessage('TASKS_V2_RESULT_TITLE_REQUIRED') : resultsMeta.title;
	    },
	    showMoreIcon() {
	      return this.task.rights.edit;
	    },
	    menuOptions() {
	      return {
	        id: `result-field-menu-${main_core.Text.getRandom()}`,
	        bindOptions: {
	          forceBindPosition: true
	        },
	        bindElement: this.$refs.moreIcon.$el,
	        targetContainer: document.body,
	        minWidth: 240,
	        offsetLeft: -100,
	        items: this.menuItems,
	        autoHide: true,
	        closeByEsc: true
	      };
	    },
	    menuItems() {
	      return [{
	        title: this.loc('TASKS_V2_RESULT_ADD'),
	        icon: ui_iconSet_api_vue.Outline.PLUS_L,
	        onClick: this.openAddResultSheet,
	        dataset: {
	          id: `MenuResultAdd-${this.taskId}`
	        }
	      }, this.requireResult && {
	        title: this.loc('TASKS_V2_RESULT_NOT_REQUIRED'),
	        design: 'alert',
	        icon: ui_iconSet_api_vue.Outline.CROSS_L,
	        onClick: () => this.setRequireResult(false),
	        dataset: {
	          id: `MenuResultNotRequire-${this.taskId}`
	        }
	      }, !this.requireResult && {
	        title: this.loc('TASKS_V2_RESULT_REQUIRE'),
	        icon: ui_iconSet_api_vue.Outline.WINDOW_FLAG,
	        onClick: () => this.setRequireResult(true),
	        dataset: {
	          id: `MenuResultRequire-${this.taskId}`
	        }
	      }];
	    }
	  },
	  watch: {
	    requireResult: {
	      async handler(newVal) {
	        if (newVal) {
	          await this.$nextTick();
	          this.tryShowResultHints();
	        }
	      },
	      deep: true
	    }
	  },
	  async created() {
	    if (!this.isEdit || !this.containsResults) {
	      return;
	    }
	    if (main_core.Type.isArrayFilled(this.results)) {
	      return;
	    }
	    this.isLoading = true;
	    await tasks_v2_provider_service_resultService.resultService.tail(this.taskId);
	    this.isLoading = false;
	  },
	  mounted() {
	    this.tryShowResultHints();
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultAdded, this.handleHighlightFieldAfterEdit);
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultUpdated, this.handleHighlightFieldAfterEdit);
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.RequiredResultsMissing, this.showResponsibleHint);
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	  },
	  beforeUnmount() {
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultAdded, this.handleHighlightFieldAfterEdit);
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultUpdated, this.handleHighlightFieldAfterEdit);
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.RequiredResultsMissing, this.showResponsibleHint);
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
	  },
	  methods: {
	    openMore() {
	      this.openResultSheet(0);
	    },
	    handleTitleClick() {
	      if (!this.isLoading) {
	        this.openAddResultSheet();
	      }
	    },
	    openAddResultSheet() {
	      const id = main_core.Text.getRandom();
	      const payload = {
	        id,
	        taskId: this.taskId,
	        author: tasks_v2_core.Core.getParams().currentUser
	      };
	      void this.$store.dispatch(`${tasks_v2_const.Model.Results}/insert`, payload);
	      this.openEditSheet(id);
	    },
	    handleResponsibleHintButtonClick() {
	      this.handleResponsibleHintClose();
	      this.openAddResultSheet();
	    },
	    async setRequireResult(requireResult) {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        requireResult
	      });
	      if (!this.isEdit) {
	        await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateStateFlags`, {
	          defaultRequireResult: requireResult
	        });
	        void tasks_v2_provider_service_stateService.stateService.set(this.stateFlags);
	      }
	    },
	    tryShowResultHints() {
	      if (!this.requireResult || this.containsResults) {
	        return;
	      }
	      if (!this.isEdit && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaRequiredResultCreatorPopup)) {
	        tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaRequiredResultCreatorPopup);
	        this.showCreatorHint();
	        return;
	      }
	      if (this.isEdit && this.isResponsible && !this.isCreator && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup)) {
	        tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
	        setTimeout(() => {
	          this.showResponsibleHint();
	        }, 2000);
	      }
	    },
	    showCreatorHint() {
	      this.showCreatorResultHint = true;
	      this.highlightField();
	    },
	    showResponsibleHint() {
	      this.showResponsibleResultHint = true;
	      this.highlightField();
	    },
	    handleHighlightFieldAfterEdit(event) {
	      const {
	        taskId
	      } = event.getData();
	      if (this.taskId !== taskId) {
	        return;
	      }
	      this.highlightField();
	    },
	    handleCreatorHintClose() {
	      if (!this.showCreatorResultHint) {
	        return;
	      }
	      this.showCreatorResultHint = false;
	      tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaRequiredResultCreatorPopup);
	      tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaRequiredResultCreatorPopup);
	    },
	    handleResponsibleHintClose() {
	      if (!this.showResponsibleResultHint) {
	        return;
	      }
	      this.showResponsibleResultHint = false;
	      tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
	      if (tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup)) {
	        tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
	      }
	    },
	    handleOpenResultFromMessage(event) {
	      const {
	        taskId,
	        resultId
	      } = event.getData();
	      if (this.taskId !== taskId || this.isListSheetShown) {
	        return;
	      }
	      this.openResultSheet(resultId);
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(resultsMeta.id);
	    },
	    getRequiredResultAhaWidth() {
	      var _this$$refs, _this$$refs$resultsCo;
	      return main_core.Type.isNumber((_this$$refs = this.$refs) == null ? void 0 : (_this$$refs$resultsCo = _this$$refs.resultsContainer) == null ? void 0 : _this$$refs$resultsCo.offsetWidth) ? Math.min(this.$refs.resultsContainer.offsetWidth, 530) : 530;
	    },
	    openEditSheet(resultId) {
	      this.sheetResultId = resultId;
	      this.setSheetShown(true);
	    },
	    openResultSheet(resultId) {
	      this.sheetResultId = resultId;
	      this.setListSheetShown(true);
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    },
	    setListSheetShown(isShown) {
	      this.$emit('update:isListSheetShown', isShown);
	    }
	  },
	  template: `
		<div
			class="tasks-field-results"
			:data-task-id="taskId"
		>
			<template v-if="lastResultId">
				<div ref="resultsContainer">
					<ResultCardItem
						:resultId="lastResultId"
						@titleClick="openResultSheet"
						@add="openAddResultSheet"
						@edit="openEditSheet"
						@highlightField="highlightField"
					/>
				</div>
				<div class="tasks-field-results-more-container">
					<div
						v-if="showMore"
						class="tasks-field-results-more"
						@click="openMore"
					>
						<div class="tasks-field-results-more-text">{{ moreText }}</div>
						<BIcon
							class="tasks-field-results-title-icon --auto-left"
							:name="Outline.CHEVRON_RIGHT_L"
							hoverable
						/>
					</div>
					<div
						class="tasks-field-results-more"
						:class="{ '--border': showMore }"
						@click="openAddResultSheet"
					>
						<div class="tasks-field-results-more-text">{{ loc('TASKS_V2_RESULT_ADD_MORE') }}</div>
						<BIcon
							class="tasks-field-results-title-icon --auto-left"
							:name="Outline.PLUS_L"
							hoverable
						/>
					</div>
				</div>
			</template>
			<template v-else>
				<div
					class="tasks-field-results-empty-container"
					:data-task-field-id="resultsMeta.id"
					data-field-container
					ref="resultsContainer"
				>
					<div
						class="tasks-field-results-title"
						@click="handleTitleClick"
					>
						<div
							v-if="isLoading"
							class="tasks-field-results-title-main"
						>
							<BIcon :name="Animated.LOADER_WAIT"/>
							<TextMd accent>{{ loc('TASKS_V2_RESULT_TITLE_LOADING') }}</TextMd>
						</div>
						<div
							v-else
							class="tasks-field-results-title-main"
						>
							<BIcon :name="Outline.WINDOW_FLAG"/>
							<TextMd accent>{{ emptyResultTitle }}</TextMd>
						</div>
						<div class="tasks-field-results-title-actions">
							<BIcon
								v-if="showMoreIcon"
								class="tasks-field-results-title-icon"
								:name="Outline.MORE_L"
								hoverable
								ref="moreIcon"
								@click.stop="isMenuShown = true"
							/>
							<BIcon
								v-else
								class="tasks-field-results-title-icon"
								:name="Outline.PLUS_L"
								hoverable
								:data-task-results-add="resultsMeta.id"
								@click.stop="openAddResultSheet"
							/>
						</div>
					</div>
					<BMenu
						v-if="isMenuShown"
						:options="menuOptions"
						@close="isMenuShown = false"
					/>
				</div>
				<Hint
					v-if="showCreatorResultHint"
					:bindElement="$refs.resultsContainer"
					:options="{ closeIcon: true }"
					@close="handleCreatorHintClose"
				>
					{{ loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_CREATOR') }}
				</Hint>
			</template>
			<ResultRequiredAha
				v-if="showResponsibleResultHint"
				:bindElement="$refs.resultsContainer"
				:popupWidth="getRequiredResultAhaWidth()"
				:hasResults
				@close="handleResponsibleHintClose"
				@addResult="handleResponsibleHintButtonClick"
			/>
		</div>
		<ResultEditorSheet
			v-if="isSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
		<ResultListSheet
			v-if="isListSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="setListSheetShown(false)"
		/>
	`
	};

	// @vue/component
	const ResultsChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip,
	    BMenu: ui_vue3_components_menu.BMenu,
	    ResultEditorSheet
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {}
	  },
	  props: {
	    isSheetShown: {
	      type: Boolean,
	      default: false
	    },
	    sheetBindProps: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['update:isSheetShown'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      resultsMeta
	    };
	  },
	  data() {
	    return {
	      isMenuShown: false,
	      sheetResultId: 0
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`,
	      stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`
	    }),
	    design() {
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    isSelected() {
	      return !this.isLocked && (this.task.filledFields[resultsMeta.id] || this.task.requireResult);
	    },
	    menuOptions() {
	      return {
	        id: `result-chip-menu-${main_core.Text.getRandom()}`,
	        bindOptions: {
	          forceBindPosition: true,
	          forceTop: true,
	          position: 'top'
	        },
	        bindElement: this.$refs.chip.$el,
	        targetContainer: document.body,
	        minWidth: 240,
	        items: this.menuItems,
	        autoHide: true,
	        closeByEsc: true
	      };
	    },
	    menuItems() {
	      return [{
	        title: this.loc('TASKS_V2_RESULT_ADD'),
	        icon: ui_iconSet_api_vue.Outline.PLUS_L,
	        onClick: this.openAddResultSheet,
	        dataset: {
	          id: `MenuResultAdd-${this.taskId}`
	        }
	      }, {
	        title: this.loc('TASKS_V2_RESULT_REQUIRE'),
	        icon: ui_iconSet_api_vue.Outline.WINDOW_FLAG,
	        onClick: this.requireResult,
	        dataset: {
	          id: `MenuResultRequire-${this.taskId}`
	        }
	      }];
	    },
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.requiredResult.available;
	    }
	  },
	  mounted() {
	    main_core.Event.EventEmitter.subscribe(tasks_v2_const.EventName.AddResultFromChat, this.handleAddResultFromChat);
	    main_core.Event.EventEmitter.subscribe(tasks_v2_const.EventName.DeleteResultFromChat, this.handleDeleteResultFromChat);
	  },
	  beforeUnmount() {
	    main_core.Event.EventEmitter.unsubscribe(tasks_v2_const.EventName.AddResultFromChat, this.handleAddResultFromChat);
	    main_core.Event.EventEmitter.unsubscribe(tasks_v2_const.EventName.DeleteResultFromChat, this.handleDeleteResultFromChat);
	  },
	  methods: {
	    handleClick() {
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: tasks_v2_core.Core.getParams().restrictions.requiredResult.featureId
	        });
	        return;
	      }
	      if (this.isSelected) {
	        this.highlightField();
	        return;
	      }
	      if (!this.isEdit) {
	        this.requireResult();
	        return;
	      }
	      if (this.task.rights.edit) {
	        this.isMenuShown = true;
	      } else {
	        this.openAddResultSheet();
	      }
	    },
	    async handleAddResultFromChat(event) {
	      const {
	        taskId,
	        messageId,
	        text,
	        authorId
	      } = event.data;
	      if (taskId !== this.taskId) {
	        return;
	      }
	      const payload = {
	        text: main_core.Type.isStringFilled(text) ? text : this.loc('TASKS_V2_RESULT_DEFAULT_TITLE_FROM_MESSAGE'),
	        author: this.getUserDto(authorId),
	        id: main_core.Text.getRandom(),
	        taskId: this.taskId,
	        createdAtTs: Date.now() / 1000,
	        updatedAtTs: Date.now() / 1000,
	        rights: {
	          edit: true,
	          remove: true
	        }
	      };
	      await tasks_v2_provider_service_resultService.resultService.addResultFromMessage(taskId, messageId, payload);
	      main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultFromMessageAdded, {
	        taskId
	      });
	    },
	    handleDeleteResultFromChat(event) {
	      const {
	        taskId,
	        resultId
	      } = event.data;
	      if (taskId !== this.taskId) {
	        return;
	      }
	      void tasks_v2_provider_service_resultService.resultService.delete(resultId);
	    },
	    openAddResultSheet() {
	      const id = main_core.Text.getRandom();
	      const payload = {
	        id,
	        taskId: this.taskId,
	        author: this.getUser(this.currentUserId)
	      };
	      void this.$store.dispatch(`${tasks_v2_const.Model.Results}/insert`, payload);
	      this.sheetResultId = id;
	      this.setSheetShown(true);
	    },
	    async requireResult() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        requireResult: true
	      });
	      if (!this.isEdit) {
	        await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateStateFlags`, {
	          defaultRequireResult: true
	        });
	        void tasks_v2_provider_service_stateService.stateService.set(this.stateFlags);
	      }
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(resultsMeta.id);
	    },
	    getUser(userId) {
	      return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](userId);
	    },
	    getUserDto(userId) {
	      return tasks_v2_provider_service_userService.UserMappers.mapModelToDto(this.getUser(userId));
	    },
	    setSheetShown(isShown) {
	      this.$emit('update:isSheetShown', isShown);
	    }
	  },
	  template: `
		<Chip
			:design
			:text="resultsMeta.title"
			:icon="Outline.WINDOW_FLAG"
			:data-task-id="taskId"
			:data-task-chip-id="resultsMeta.id"
			:lock="isLocked"
			ref="chip"
			@click="handleClick"
		/>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
		<ResultEditorSheet
			v-if="isSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`
	};

	exports.Results = Results;
	exports.ResultsChip = ResultsChip;
	exports.ResultListSheet = ResultListSheet;
	exports.ResultEditorSheet = ResultEditorSheet;
	exports.resultsMeta = resultsMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Vue3,BX.Vue3.Directives,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.UI.System.Skeleton.Vue,BX.Event,BX.Tasks.V2.Component,BX.Tasks.V2.Component.Elements,BX.UI.TextEditor,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component,BX.UI.System.Typography.Vue,BX.Vue3.Components,BX,BX.Vue3.Vuex,BX.UI.Vue3.Components,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=results.bundle.js.map

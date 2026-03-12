/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,tasks_v2_lib_showLimit,tasks_v2_component_elements_hoverPill,ui_vue3_components_popup,ui_system_typography_vue,tasks_v2_provider_service_taskService,ui_vue3_components_menu,tasks_v2_component_elements_userLabel,ui_iconSet_api_vue,ui_vue3_components_button,ui_iconSet_outline,tasks_v2_core,tasks_v2_const,tasks_v2_lib_entitySelectorDialog,tasks_v2_provider_service_templateService) {
	'use strict';

	// @vue/component
	const TemplatePermissionUserRow = {
	  name: 'TemplatePermissionUserRow',
	  components: {
	    BMenu: ui_vue3_components_menu.BMenu,
	    UserLabel: tasks_v2_component_elements_userLabel.UserLabel,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  inject: {
	    task: {},
	    isEdit: {},
	    settings: {}
	  },
	  props: {
	    /** @type TemplatePermission */
	    permission: {
	      type: Object,
	      required: true
	    },
	    freeze: {
	      type: Function,
	      required: true
	    },
	    unfreeze: {
	      type: Function,
	      required: true
	    }
	  },
	  emits: ['update', 'remove'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    isGranted() {
	      const grantedIds = new Set([this.settings.currentUser.id]);
	      if (!this.isEdit) {
	        grantedIds.add(this.task.creatorId);
	      }
	      return this.permission.entityType === tasks_v2_const.EntitySelectorEntity.User && grantedIds.has(this.permission.entityId);
	    },
	    permissionLabel() {
	      if (this.permission.permission === tasks_v2_const.PermissionType.Full) {
	        return this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_FULL_ACCESS');
	      }
	      return this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_READ_ONLY_ACCESS');
	    },
	    options() {
	      return [{
	        permission: tasks_v2_const.PermissionType.Full,
	        title: this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_FULL_ACCESS'),
	        description: this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_FULL_ACCESS_DESCRIPTION')
	      }, !this.isGranted && {
	        permission: tasks_v2_const.PermissionType.Read,
	        title: this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_READ_ONLY_ACCESS'),
	        description: this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_READ_ONLY_ACCESS_DESCRIPTION')
	      }].filter(Boolean);
	    },
	    menuOptions() {
	      return {
	        id: `template-permission-menu-${this.permission.entityType}-${this.permission.entityId}`,
	        className: 'tasks-template-permissions-of-user',
	        bindElement: this.$refs.permission,
	        minWidth: 238,
	        maxWidth: 244,
	        padding: 18,
	        offsetTop: 8,
	        items: this.options.map(option => ({
	          title: option.title,
	          subtitle: option.description,
	          onClick: () => this.$emit('update', {
	            id: this.permission.id,
	            permission: option.permission
	          })
	        })),
	        targetContainer: document.body
	      };
	    }
	  },
	  watch: {
	    isMenuShown(shown) {
	      if (shown) {
	        setTimeout(() => this.freeze());
	      } else {
	        this.unfreeze();
	      }
	    }
	  },
	  template: `
		<UserLabel :user="{ name: permission.title, image: permission.image }"/>
		<a
			class="tasks-template-permissions-permission"
			ref="permission"
			@click="isMenuShown = true"
		>
			{{ permissionLabel }}
		</a>
		<div class="tasks-template-permissions-remove" @click="$emit('remove')">
			<BIcon v-if="!isGranted" :name="Outline.CROSS_L"/>
		</div>
		<div class="tasks-template-permissions-separator"/>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`
	};

	// @vue/component
	const AddUsersButton = {
	  name: 'AddUsersButton',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    UiButton: ui_vue3_components_button.Button
	  },
	  props: {
	    templateId: {
	      type: String,
	      required: true
	    },
	    /** @type TemplatePermission[] */
	    permissions: {
	      type: Array,
	      required: true
	    },
	    freeze: {
	      type: Function,
	      required: true
	    },
	    unfreeze: {
	      type: Function,
	      required: true
	    }
	  },
	  emits: ['update:permissions'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    preselected() {
	      return this.permissions.map(it => tasks_v2_provider_service_templateService.permissionBuilder.buildItemId(it));
	    }
	  },
	  unmounted() {
	    var _this$selector;
	    (_this$selector = this.selector) == null ? void 0 : _this$selector.destroy();
	  },
	  methods: {
	    showDialog() {
	      var _this$selector2;
	      const restrictions = tasks_v2_core.Core.getParams().restrictions;
	      (_this$selector2 = this.selector) != null ? _this$selector2 : this.selector = new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	        id: `tasks-template-permissions-${this.templateId}`,
	        targetNode: this.$el,
	        context: 'tasks-card',
	        enableSearch: true,
	        width: 387,
	        preselectedItems: this.preselected,
	        entities: [{
	          id: tasks_v2_const.EntitySelectorEntity.User,
	          options: {
	            emailUsers: true,
	            analyticsSource: 'tasks',
	            lockGuestLink: !restrictions.mailUserIntegration.available,
	            lockGuestLinkFeatureId: restrictions.mailUserIntegration.featureId
	          }
	        }, {
	          id: tasks_v2_const.EntitySelectorEntity.Department,
	          options: {
	            selectMode: 'usersAndDepartments'
	          }
	        }, {
	          id: tasks_v2_const.EntitySelectorEntity.MetaUser,
	          options: {
	            'all-users': true
	          }
	        }, {
	          id: tasks_v2_const.EntitySelectorEntity.Project,
	          itemOptions: {
	            default: {
	              entityType: tasks_v2_const.EntitySelectorEntity.Project,
	              link: '',
	              linkTitle: ''
	            }
	          }
	        }],
	        events: {
	          'Item:onSelect': this.update,
	          'Item:onDeselect': this.update
	        },
	        popupOptions: {
	          events: {
	            onClose: this.unfreeze
	          }
	        }
	      });
	      this.selector.selectItemsByIds(this.preselected);
	      this.selector.show(this.$el);
	      setTimeout(() => this.freeze());
	    },
	    update() {
	      const permissions = this.selector.getSelectedItems().map(it => {
	        const permission = tasks_v2_provider_service_templateService.permissionBuilder.buildFromItem(it);
	        const existingPermission = this.permissions.find(({
	          entityType,
	          entityId
	        }) => {
	          return entityType === permission.entityType && entityId === permission.entityId;
	        });
	        return existingPermission != null ? existingPermission : permission;
	      });
	      this.$emit('update:permissions', permissions);
	    }
	  },
	  template: `
		<div>
			<UiButton
				:text="loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_ADD_USERS_BUTTON')"
				:leftIcon="Outline.PLUS_M"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.OUTLINE"
				noCaps
				@click="showDialog"
			/>
		</div>
	`
	};

	// @vue/component
	const TemplatePermissionsPopup = {
	  name: 'TemplatePermissionsPopup',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    Popup: ui_vue3_components_popup.Popup,
	    UiButton: ui_vue3_components_button.Button,
	    TemplatePermissionUserRow,
	    AddUsersButton,
	    HeadlineSm: ui_system_typography_vue.HeadlineSm,
	    Text2Xs: ui_system_typography_vue.Text2Xs
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  props: {
	    bindElement: {
	      type: HTMLElement,
	      default: null
	    }
	  },
	  emits: ['close'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      permissions: []
	    };
	  },
	  computed: {
	    options() {
	      return {
	        id: `tasks-template-permissions-popup-${this.taskId}`,
	        bindElement: this.bindElement,
	        padding: 14,
	        minHeight: 320,
	        maxHeight: 600,
	        width: 400,
	        targetContainer: this.$root.$el.firstElementChild
	      };
	    }
	  },
	  watch: {
	    permissions: {
	      handler() {
	        void this.$nextTick(() => {
	          var _this$$refs$popup;
	          return (_this$$refs$popup = this.$refs.popup) == null ? void 0 : _this$$refs$popup.adjustPosition();
	        });
	      },
	      deep: true
	    }
	  },
	  created() {
	    this.permissions = tasks_v2_provider_service_templateService.permissionBuilder.getPermissions(this.task);
	  },
	  methods: {
	    removeItem(id) {
	      this.permissions = this.permissions.filter(it => it.id !== id);
	    },
	    updateItem({
	      id,
	      permission
	    }) {
	      this.permissions.find(it => it.id === id).permission = permission;
	    },
	    save() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        permissions: this.permissions
	      });
	      this.$emit('close');
	    }
	  },
	  template: `
		<Popup v-slot="{ freeze, unfreeze }" :options ref="popup" @close="$emit('close')">
			<div class="tasks-template-permissions-popup">
				<div class="tasks-template-permissions-popup-title">
					<HeadlineSm>{{ loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_HEADER') }}</HeadlineSm>
					<BIcon
						class="tasks-template-permissions-popup-close"
						:name="Outline.CROSS_L"
						hoverable
						@click="$emit('close')"
					/>
				</div>
				<div class="tasks-template-permissions-popup-content">
					<div class="tasks-template-permissions-separator --header"/>
					<Text2Xs className="tasks-template-permissions-popup-header">
						{{ loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_USERS_COLUMN') }}
					</Text2Xs>
					<Text2Xs className="tasks-template-permissions-popup-header">
						{{ loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_PERMISSIONS_COLUMN') }}
					</Text2Xs>
					<div></div>
					<div class="tasks-template-permissions-separator --header"/>
					<TemplatePermissionUserRow
						v-for="permission of permissions"
						:key="permission.id"
						:permission
						:freeze
						:unfreeze
						@update="updateItem"
						@remove="removeItem(permission.id)"
					/>
				</div>
				<div class="tasks-template-permissions-popup-footer">
					<AddUsersButton v-model:permissions="permissions" :templateId="taskId" :freeze :unfreeze/>
					<UiButton
						:text="loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_SAVE_BUTTON')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED"
						noCaps
						@click="save"
					/>
				</div>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const TemplatePermissionsButton = {
	  name: 'TemplatePermissionsButton',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TemplatePermissionsPopup,
	    UiButton: ui_vue3_components_button.Button,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    TextSm: ui_system_typography_vue.TextSm
	  },
	  inject: {
	    task: {}
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
	      shown: false
	    };
	  },
	  computed: {
	    permissions() {
	      return tasks_v2_provider_service_templateService.permissionBuilder.getPermissions(this.task);
	    },
	    isLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.templatesAccessPermissions.available;
	    },
	    featureId() {
	      return tasks_v2_core.Core.getParams().restrictions.templatesAccessPermissions.featureId;
	    },
	    buttonIcon() {
	      return this.isLocked ? ui_iconSet_api_vue.Outline.LOCK_M : ui_iconSet_api_vue.Outline.SETTINGS_M;
	    }
	  },
	  methods: {
	    showPopup() {
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: this.featureId
	        });
	        return;
	      }
	      this.shown = true;
	    }
	  },
	  template: `
		<div class="tasks--template-permissions-button">
			<HoverPill @click="showPopup">
				<div class="tasks--template-permissions-button--wrapper">
					<BIcon
						:name="Outline.SETTINGS"
						:size="24"
						color="var(--ui-color-base-3)"
					/>
					<TextSm className="tasks--template-permissions-button--text">
						{{ loc('TASKS_V2_TEMPLATE_PERMISSIONS_BUTTON') }}
					</TextSm>
					<BIcon
						v-if="isLocked"
						:name="Outline.LOCK_L"
						:size="24"
						color="var(--ui-color-accent-main-primary-alt-2)"
					/>
					<div
						v-else
						class="tasks--template-permissions-button--counter"
					>
						<BIcon
							:name="Outline.GROUP"
							:size="18"
							color="var(--ui-color-accent-main-primary)"
						/>
						<span class="tasks--template-permissions-button--counter__count">
							{{ permissions.length }}
						</span>
					</div>
				</div>
			</HoverPill>
			<TemplatePermissionsPopup
				v-if="!isLocked && shown"
				:bindElement="$el"
				@close="shown = false"
			/>
		</div>
	`
	};

	exports.TemplatePermissionsButton = TemplatePermissionsButton;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements,BX.UI.Vue3.Components,BX.UI.System.Typography.Vue,BX.Tasks.V2.Provider.Service,BX.UI.Vue3.Components,BX.Tasks.V2.Component.Elements,BX.UI.IconSet,BX.Vue3.Components,BX,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=template-permissions-button.bundle.js.map

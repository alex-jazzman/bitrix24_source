/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_system_typography_vue, ui_system_skeleton_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_component_elements_fieldHoverButton, tasks_v2_component_elements_fieldAdd, tasks_v2_provider_service_crmService, tasks_v2_provider_service_taskService, tasks_v2_lib_showLimit, main_core, ui_vue3_components_richLoc, tasks_v2_component_elements_hoverPill, tasks_v2_core, tasks_v2_lib_idUtils, tasks_v2_lib_entitySelectorDialog, ui_system_chip_vue, tasks_v2_lib_fieldHighlighter) {
	'use strict';

	// @vue/component
	const CrmItem = {
		components: {
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			TextMd: ui_system_typography_vue.TextMd,
			RichLoc: ui_vue3_components_richLoc.RichLoc
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {}
		},
		props: {
			/** @type CrmItemModel */
			item: {
				type: Object,
				required: true
			}
		},
		emits: ['clear'],
		setup() {},
		async mounted() {
			const {
				EntityMiniCard
			} = await main_core.Runtime.loadExtension('crm.mini-card');
			const card = new EntityMiniCard({
				bindElement: this.$el,
				entityTypeId: tasks_v2_provider_service_crmService.CrmMappers.getEntityTypeId(this.item.id),
				entityId: this.item.entityId
			});
			const scrollContainer = document.querySelector(`[data-task-card-scroll="${this.taskId}"]`);
			card.getMiniCard().popup().setTargetContainer(scrollContainer);
		},
		methods: {
			prepareTitle(item) {
				return this.loc('TASKS_V2_CRM_ENTITY_TITLE', {
					'#TYPE_NAME#': item.typeName,
					'#TITLE#': item.title
				});
			},
			handleClick() {
				BX.SidePanel.Instance.emulateAnchorClick(this.item.link);
			}
		},
		template: `
		<HoverPill
			class="tasks-field-crm-item"
			:withClear="!isEdit || task.rights.edit"
			textOnly
			@click.stop="handleClick"
			@clear="$emit('clear', item.id)"
		>
			<TextMd class="tasks-field-crm-item-text print-font-color-base-1-recursive">
				<RichLoc tag="span" :text="prepareTitle(item)" placeholder="[a]">
					<template #a="{ text }">
						<a @click.prevent>{{ text }}</a>
					</template>
				</RichLoc>
			</TextMd>
		</HoverPill>
	`
	};

	const crmMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Crm,
		title: main_core.Loc.getMessage('TASKS_V2_CRM_TITLE')
	});

	const dialogs = {};
	const crmDialog = new class {
		#taskId;
		#onClose;
		fillDialog(taskId) {
			this.#taskId = taskId;
			this.#fillDialog(this.#ids);
		}
		show(params) {
			this.#taskId = params.taskId;
			this.#onClose = params.onClose;
			this.#fillDialog(this.#ids);
			this.#dialog.selectItemsByIds(this.#items);
			this.#dialog.showTo(params.targetNode);
		}
		get #dialog() {
			dialogs[this.#taskId] ??= this.#createDialog();
			return dialogs[this.#taskId];
		}
		#createDialog() {
			const {
				crmIntegration
			} = main_core.Extension.getSettings('tasks.v2.component.fields.crm');
			const settings = tasks_v2_lib_idUtils.idUtils.isTemplate(this.#taskId) ? crmIntegration?.template : crmIntegration?.task;
			const dynamicTypeIds = Object.entries(settings ?? {}).filter(([entityId, enabled]) => enabled === 'Y' && entityId.startsWith('DYNAMIC_')).map(([entityId]) => Number(entityId.slice(8)));
			return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
				context: 'tasks-card',
				enableSearch: true,
				entities: [tasks_v2_const.EntitySelectorEntity.Deal, tasks_v2_const.EntitySelectorEntity.Contact, tasks_v2_const.EntitySelectorEntity.Company, tasks_v2_const.EntitySelectorEntity.Lead, tasks_v2_const.EntitySelectorEntity.SmartInvoice, tasks_v2_const.EntitySelectorEntity.DynamicMultiple].map(entityId => ({
					id: entityId,
					dynamicLoad: true,
					dynamicSearch: true,
					options: {
						dynamicTypeIds,
						showTab: true,
						allowAllCategories: true
					},
					dynamicSearchMatchMode: 'all'
				})),
				preselectedItems: this.#items,
				events: {
					onLoad: this.#fillStore
				},
				popupOptions: {
					events: {
						onClose: async () => {
							if (!this.#dialog.isLoaded()) {
								return;
							}
							const items = await this.#fillStore();
							const crmItemIds = items.map(({
								id
							}) => id);
							void tasks_v2_provider_service_taskService.taskService.update(this.#taskId, {
								crmItemIds
							});
							this.#onClose?.();
						}
					}
				}
			});
		}
		#fillStore = async () => {
			const crmItems = this.#dialog.getSelectedItems().map(item => this.#mapItemToModel(item));
			await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.CrmItems}/upsertMany`, crmItems);
			return crmItems;
		};
		#fillDialog(ids) {
			if (!this.#dialog.isLoaded()) {
				return;
			}
			const itemIds = new Set(this.#dialog.getItems().map(it => tasks_v2_provider_service_crmService.CrmMappers.mapId(it.getEntityId(), it.getId())));
			ids.forEach(crmItemId => {
				const [entityId, id] = tasks_v2_provider_service_crmService.CrmMappers.splitId(crmItemId);
				if (itemIds.has(crmItemId)) {
					this.#dialog.getItem([entityId, id]).select(true);
					return;
				}
				const crmItem = tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.CrmItems}/getById`](crmItemId);
				this.#dialog.addItem({
					id,
					entityId,
					title: crmItem.title,
					customData: {
						entityInfo: {
							typeNameTitle: crmItem.typeName,
							url: crmItem.link
						}
					},
					selected: true,
					tabs: ['recents', entityId, entityId.toUpperCase()]
				});
			});
		}
		#mapItemToModel(item) {
			const entityInfo = item.getCustomData().get('entityInfo');
			const id = item.getId();
			return {
				id: tasks_v2_provider_service_crmService.CrmMappers.mapId(item.getEntityId(), item.getId()),
				entityId: Number.isInteger(id) ? id : Number(id.split(':')[1]),
				type: item.getEntityId(),
				typeName: entityInfo.typeNameTitle,
				title: item.getTitle(),
				link: entityInfo.url
			};
		}
		get #items() {
			return this.#ids.map(id => tasks_v2_provider_service_crmService.CrmMappers.splitId(id));
		}
		get #ids() {
			return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId).crmItemIds ?? [];
		}
	}();

	const maxCount = 7;

	// @vue/component
	const Crm = {
		components: {
			FieldHoverButton: tasks_v2_component_elements_fieldHoverButton.FieldHoverButton,
			TextSm: ui_system_typography_vue.TextSm,
			BLine: ui_system_skeleton_vue.BLine,
			FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd,
			CrmItem
		},
		inject: {
			settings: {},
			task: {},
			taskId: {},
			isEdit: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				crmMeta,
				maxCount
			};
		},
		data() {
			return {
				isDialogShown: false,
				isExpanded: false,
				isHovered: false
			};
		},
		computed: {
			crmItems() {
				const items = this.$store.getters[`${tasks_v2_const.Model.CrmItems}/getByIds`](this.task.crmItemIds);
				return items.sort((a, b) => tasks_v2_provider_service_crmService.CrmMappers.compareIds(a.id, b.id));
			},
			visibleItems() {
				return this.crmItems.slice(0, maxCount);
			},
			collapsedItems() {
				return this.crmItems.slice(maxCount);
			},
			isLoading() {
				return !this.isEmpty && !this.crmItems?.length;
			},
			isEmpty() {
				return !this.task.crmItemIds?.length;
			},
			readonly() {
				return !this.task.rights.edit;
			},
			expandButtonText() {
				if (this.isExpanded) {
					return this.loc('TASKS_V2_CRM_COLLAPSE');
				}
				return this.loc('TASKS_V2_CRM_AND_COUNT', {
					'#COUNT#': this.collapsedItems.length
				});
			},
			isAddActive() {
				return !this.readonly && !this.isEmpty;
			},
			isAddVisible() {
				return this.isDialogShown || this.isHovered;
			},
			isLocked() {
				return !this.settings.restrictions.crmIntegration.available;
			}
		},
		watch: {
			'task.crmItemIds': {
				async handler() {
					if (!this.isEdit) {
						return;
					}
					await tasks_v2_provider_service_crmService.crmService.list(this.taskId, this.task.crmItemIds);
					crmDialog.fillDialog(this.taskId);
				}
			}
		},
		mounted() {
			if (this.isEdit) {
				void tasks_v2_provider_service_crmService.crmService.list(this.taskId, this.task.crmItemIds);
			} else {
				crmDialog.fillDialog(this.taskId);
			}
		},
		methods: {
			handleClick() {
				if (!this.readonly) {
					this.showDialog();
				}
			},
			showDialog() {
				if (this.isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						featureId: this.settings.restrictions.crmIntegration.featureId
					});
					return;
				}
				crmDialog.show({
					targetNode: this.$refs.anchor,
					taskId: this.taskId,
					onClose: this.handleClose
				});
				this.isDialogShown = true;
			},
			handleClose() {
				this.isDialogShown = false;
			},
			handleClear(crmItemId) {
				const crmItemIds = this.task.crmItemIds.filter(id => id !== crmItemId);
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					crmItemIds
				});
			}
		},
		template: `
		<div
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<FieldHoverButton
				v-if="isAddActive"
				:icon="Outline.PLUS_L"
				:isVisible="isAddVisible"
				:isLocked
				@click="handleClick"
			/>
			<div
				class="tasks-field-crm"
				:data-task-id="taskId"
				:data-task-field-id="crmMeta.id"
				:data-task-crm-item-ids="task.crmItemIds?.join(',')"
			>
				<FieldAdd
					v-if="isEmpty"
					:icon="Outline.CRM"
					:isLocked
					@click="showDialog"
				/>
				<div v-if="isLoading" class="tasks-field-crm-skeleton">
					<template v-for="key in task.crmItemIds.slice(0, maxCount)" :key>
						<BLine :height="20"/>
					</template>
				</div>
				<template v-for="item in visibleItems" :key="item.id">
					<CrmItem :item @clear="handleClear"/>
				</template>
				<template v-if="isExpanded" v-for="item in collapsedItems" :key="item.id">
					<CrmItem :item @clear="handleClear"/>
				</template>
				<TextSm
					v-if="collapsedItems.length > 0"
					class="tasks-field-crm-expand print-font-color-base-1"
					@click.capture.stop="isExpanded = !isExpanded"
				>
					{{ expandButtonText }}
				</TextSm>
			</div>
			<div class="tasks-field-crm-anchor" ref="anchor"/>
		</div>
	`
	};

	// @vue/component
	const CrmChip = {
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		inject: {
			task: {},
			taskId: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				crmMeta
			};
		},
		computed: {
			design() {
				return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
			},
			isSelected() {
				return this.task.filledFields[crmMeta.id];
			},
			isLocked() {
				return !tasks_v2_core.Core.getParams().restrictions.crmIntegration.available;
			}
		},
		methods: {
			handleClick() {
				if (this.isSelected) {
					this.highlightField();
					return;
				}
				if (this.isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						featureId: tasks_v2_core.Core.getParams().restrictions.crmIntegration.featureId
					});
					return;
				}
				crmDialog.show({
					targetNode: this.$el,
					taskId: this.taskId,
					onClose: this.highlightField
				});
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(crmMeta.id);
			}
		},
		template: `
		<Chip
			v-if="task.rights.edit || isSelected"
			:design
			:icon="Outline.CRM"
			:lock="isLocked"
			:text="loc('TASKS_V2_CRM_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="crmMeta.id"
			:data-task-crm-item-ids="task.crmItemIds?.join(',')"
			@click="handleClick"
		/>
	`
	};

	exports.Crm = Crm;
	exports.CrmChip = CrmChip;
	exports.crmMeta = crmMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.UI.System.Typography.Vue, BX.UI.System.Skeleton.Vue, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX, BX.UI.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib);
//# sourceMappingURL=crm.bundle.js.map

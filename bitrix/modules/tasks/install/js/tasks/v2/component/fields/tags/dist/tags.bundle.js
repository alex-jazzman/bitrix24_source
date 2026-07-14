/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_iconSet_api_vue, ui_system_typography_vue, ui_iconSet_outline, tasks_v2_component_elements_fieldHoverButton, tasks_v2_component_elements_fieldAdd, tasks_v2_provider_service_taskService, main_core, tasks_v2_const, main_core_events, tasks_entitySelector, tasks_v2_core, tasks_v2_lib_entitySelectorDialog, tasks_v2_lib_idUtils, ui_system_chip_vue, tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const tagsMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Tags,
		title: main_core.Loc.getMessage('TASKS_V2_TAGS_TITLE')
	});

	const dialogs = {};
	const tagsDialog = new class {
		#onClose;
		constructor() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.TagDeleted, event => {
				const {
					tagName,
					groupId
				} = event.getData();
				Object.entries(dialogs).forEach(([key, dialog]) => {
					if (Number(key.split('-')[1]) === groupId) {
						const tagId = dialog.getItems().find(item => item.getTitle() === tagName).getId();
						dialog.removeItem([tasks_v2_const.EntitySelectorEntity.Tag, tagId]);
					}
				});
			});
		}
		show(params) {
			this.#onClose = params.onClose;
			this.#fillDialog(params.taskId);
			this.#getDialog(params.taskId).showTo(params.targetNode);
		}
		#getDialog(taskId) {
			const userId = tasks_v2_core.Core.getParams().currentUser.id;
			const groupId = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).groupId ?? 0;
			const key = `${taskId}-${groupId}`;
			const entityId = this.#getEntityId(taskId);
			dialogs[key] ??= new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
				enableSearch: true,
				dropdownMode: true,
				entities: [{
					id: entityId,
					options: {
						taskId,
						groupId
					}
				}],
				searchOptions: {
					allowCreateItem: true
				},
				footer: entityId === tasks_v2_const.EntitySelectorEntity.Tag ? tasks_entitySelector.Footer : false,
				footerOptions: {
					userId,
					groupId
				},
				clearUnavailableItems: true,
				events: {
					onLoad: () => this.#fillDialog(taskId),
					'Search:onItemCreateAsync': event => {
						const tag = event.getData().searchQuery.getQuery();
						if (!tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).tags.includes(tag)) {
							dialogs[key].addItem(this.#getTagItem(entityId, tag));
						}
					}
				},
				popupOptions: {
					events: {
						onClose: () => {
							const tags = this.#getDialog(taskId).getSelectedItems().map(item => item.getTitle());
							void tasks_v2_provider_service_taskService.taskService.update(taskId, {
								tags
							});
							this.#onClose?.(tags);
						}
					}
				}
			});
			return dialogs[key];
		}
		#fillDialog(taskId) {
			const dialog = this.#getDialog(taskId);
			const entityId = this.#getEntityId(taskId);
			const tags = new Set(tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).tags);
			const idsMap = new Map([...tags].map(tag => [tag, [entityId, tag]]));
			dialog.getItems().forEach(item => {
				if (tags.has(item.getTitle())) {
					idsMap.set(item.getTitle(), [entityId, item.getId()]);
				}
			});
			idsMap.entries().forEach(([tag, id]) => {
				if (!dialog.getItem(id)) {
					dialog.addItem(this.#getTagItem(entityId, tag));
				}
			});
			dialog.selectItemsByIds([...idsMap.values()]);
		}
		#getTagItem(entityId, title) {
			return {
				id: title || 'empty',
				entityId,
				title,
				tabs: 'all',
				selected: true
			};
		}
		#getEntityId(taskId) {
			return tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) ? tasks_v2_const.EntitySelectorEntity.TemplateTag : tasks_v2_const.EntitySelectorEntity.Tag;
		}
	}();

	// @vue/component
	const Tags = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			FieldHoverButton: tasks_v2_component_elements_fieldHoverButton.FieldHoverButton,
			FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd,
			TextMd: ui_system_typography_vue.TextMd
		},
		inject: {
			task: {},
			taskId: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				tagsMeta
			};
		},
		data() {
			return {
				isDialogShown: false,
				tagsIndexes: {},
				isHovered: false
			};
		},
		computed: {
			tags() {
				return [...this.task.tags].sort((a, b) => this.tagsIndexes[a] - this.tagsIndexes[b]);
			},
			isFilled() {
				return this.tags.length > 0;
			},
			readonly() {
				return !this.task.rights.edit;
			},
			isAddActive() {
				return !this.readonly && this.isFilled;
			},
			isAddVisible() {
				return this.isDialogShown || this.isHovered;
			}
		},
		created() {
			this.rememberTagsIndexes(this.tags);
		},
		methods: {
			handleClick() {
				if (this.readonly) {
					return;
				}
				tagsDialog.show({
					targetNode: this.$refs.anchor,
					taskId: this.taskId,
					onClose: this.handleDialogClose
				});
				this.isDialogShown = true;
			},
			handleDialogClose(tags) {
				this.isDialogShown = false;
				this.rememberTagsIndexes(tags);
			},
			handleCrossClick(tag) {
				const tags = this.tags.filter(it => it !== tag);
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					tags
				});
			},
			rememberTagsIndexes(tags) {
				this.tagsIndexes = tags.reduce((acc, tag, index) => {
					acc[tag] = index;
					return acc;
				}, {});
			}
		},
		template: `
		<div
			class="tasks-field-tags"
			:class="{ '--empty': !isFilled }"
			:data-task-id="taskId"
			:data-task-field-id="tagsMeta.id"
			:data-task-field-value="task.tags.join(',')"
			@mouseenter="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<FieldHoverButton 
				v-if="isAddActive"
				:icon="Outline.PLUS_L"
				:isVisible="isAddVisible" 
				@click="handleClick"
			/>
			<template v-for="tag in tags" :key="tag">
				<div class="tasks-field-tag print-background-white">
					<TextMd>{{ tag }}</TextMd>
					<div v-if="!readonly" class="tasks-field-tag-cross" @click.capture.stop="handleCrossClick(tag)">
						<BIcon :name="Outline.CROSS_L" hoverable/>
					</div>
				</div>
			</template>
			<FieldAdd v-if="!isFilled" :icon="Outline.TAG" @click="handleClick"/>
			<div class="tasks-field-tags-anchor" ref="anchor"/>
		</div>
	`
	};

	// @vue/component
	const TagsChip = {
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
				tagsMeta
			};
		},
		computed: {
			design() {
				return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
			},
			isSelected() {
				return this.task.filledFields[tagsMeta.id];
			}
		},
		methods: {
			handleClick() {
				if (this.isSelected) {
					this.highlightField();
					return;
				}
				tagsDialog.show({
					targetNode: this.$el,
					taskId: this.taskId,
					onClose: this.highlightField
				});
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(tagsMeta.id);
			}
		},
		template: `
		<Chip
			:design
			:icon="Outline.TAG"
			:text="loc('TASKS_V2_TAGS_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="tagsMeta.id"
			:data-task-chip-value="task.tags.join(',')"
			@click="handleClick"
		/>
	`
	};

	exports.Tags = Tags;
	exports.TagsChip = TagsChip;
	exports.tagsMeta = tagsMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.UI.IconSet, BX.UI.System.Typography.Vue, window, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX, BX.Tasks.V2.Const, BX.Event, BX.Tasks.EntitySelector, BX.Tasks.V2, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib);
//# sourceMappingURL=tags.bundle.js.map

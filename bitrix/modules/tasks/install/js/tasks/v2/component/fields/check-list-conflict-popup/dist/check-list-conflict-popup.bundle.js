/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, ui_vue3_components_popup, ui_vue3_components_button, ui_system_typography_vue, tasks_v2_const, tasks_v2_provider_service_checkListService, tasks_v2_provider_service_taskService) {
	'use strict';

	async function applyConflictResolutions({
		conflicts,
		resolutions,
		store,
		taskId,
		checkListItems
	}) {
		const storeDispatch = store.dispatch.bind(store);
		const itemsById = new Map(checkListItems.map(item => [item.id, item]));
		const getItemById = id => itemsById.get(id) ?? null;
		const patches = new Map();
		conflicts.forEach(conflict => {
			const key = `${conflict.id}::${conflict.field}`;
			const resolution = resolutions[key] ?? 'INCOMING';
			let chosenValue;
			if (resolution === 'LOCAL') {
				if (conflict.field === 'title') {
					const liveItem = getItemById(conflict.id);
					chosenValue = liveItem ? liveItem[conflict.field] : conflict.local;
				} else {
					chosenValue = conflict.local;
				}
			} else {
				chosenValue = conflict.incoming;
			}
			if (!patches.has(conflict.id)) {
				patches.set(conflict.id, {});
			}
			const patch = patches.get(conflict.id);
			if (conflict.field === 'deleted') {
				patch.__deleteResolution = chosenValue === null ? 'DELETE' : 'KEEP';
				if (chosenValue !== null) {
					patch.__keepItem = chosenValue;
				}
			} else {
				patch[conflict.field] = chosenValue;
			}
		});
		const updates = [];
		const restoredIds = [];
		const deletableIds = [];
		const childrenByParent = new Map();
		checkListItems.forEach(it => {
			const siblings = childrenByParent.get(it.parentId) ?? [];
			siblings.push(it.id);
			childrenByParent.set(it.parentId, siblings);
		});
		const collectSubtreeIds = rootId => {
			const ids = [rootId];
			const stack = [rootId];
			while (stack.length > 0) {
				const parentId = stack.pop();
				(childrenByParent.get(parentId) ?? []).forEach(childId => {
					ids.push(childId);
					stack.push(childId);
				});
			}
			return ids;
		};
		patches.forEach((patch, itemId) => {
			const item = getItemById(itemId);
			if (patch.__deleteResolution === 'DELETE') {
				collectSubtreeIds(itemId).forEach(id => {
					if (getItemById(id)) {
						deletableIds.push(id);
					}
				});
				return;
			}
			const {
				__deleteResolution,
				__keepItem,
				...fields
			} = patch; // eslint-disable-line no-unused-vars
			const baseItem = item ?? __keepItem;
			if (!baseItem) {
				return;
			}
			if (__keepItem !== undefined) {
				restoredIds.push(itemId);
			}
			if (__keepItem !== undefined || Object.keys(fields).length > 0) {
				updates.push({
					...baseItem,
					...(__keepItem ?? {}),
					...fields
				});
			}
		});
		if (deletableIds.length > 0) {
			await storeDispatch(`${tasks_v2_const.Model.CheckList}/deleteMany`, deletableIds);
		}
		if (updates.length > 0) {
			await storeDispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, updates);
		}
		const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
		const currentIds = task.checklist ?? [];
		const missingRestoredIds = restoredIds.filter(id => !currentIds.includes(id));
		if (missingRestoredIds.length > 0) {
			tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
				checklist: [...currentIds, ...missingRestoredIds]
			});
		}
		tasks_v2_provider_service_checkListService.checkListService.clearPullConflicts(taskId);
		const freshTask = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
		const checkLists = store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](freshTask.checklist ?? []);
		await tasks_v2_provider_service_checkListService.checkListService.save(taskId, checkLists, false);
		return !tasks_v2_provider_service_checkListService.checkListService.getPullConflicts().some(conflict => conflict.taskId === taskId);
	}

	// @vue/component
	const ConflictPopup = {
		name: 'TaskCheckListConflictPopup',
		components: {
			Popup: ui_vue3_components_popup.Popup,
			Button: ui_vue3_components_button.Button,
			HeadlineXs: ui_system_typography_vue.HeadlineXs,
			TextSm: ui_system_typography_vue.TextSm,
			Text2Xs: ui_system_typography_vue.Text2Xs
		},
		props: {
			conflicts: {
				type: Array,
				required: true
			},
			checkListItems: {
				type: Array,
				default: () => []
			},
			taskId: {
				type: [Number, String],
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			const resolutions = {};
			this.conflicts.forEach(conflict => {
				resolutions[`${conflict.id}::${conflict.field}`] = 'INCOMING';
			});
			return {
				resolutions,
				saving: false,
				titleId: `tasks-conflict-popup-title-${main_core.Text.getRandom(10)}`
			};
		},
		watch: {
			conflicts(nextConflicts) {
				const resolutions = {
					...this.resolutions
				};
				nextConflicts.forEach(conflict => {
					const key = `${conflict.id}::${conflict.field}`;
					if (resolutions[key] === undefined) {
						resolutions[key] = 'INCOMING';
					}
				});
				this.resolutions = resolutions;
			}
		},
		computed: {
			options() {
				return {
					className: 'tasks-conflict-popup-box',
					width: 560,
					padding: 0,
					borderRadius: '18px',
					closeIcon: true,
					autoHide: false,
					closeByEsc: true,
					overlay: true,
					ariaLabelledBy: this.titleId,
					focusTrap: true
				};
			},
			itemsById() {
				const map = new Map();
				this.checkListItems.forEach(item => {
					map.set(item.id, item);
				});
				return map;
			},
			groupedConflicts() {
				const groups = new Map();
				this.conflicts.forEach(conflict => {
					const rootId = this.getRootId(conflict.id);
					if (!groups.has(rootId)) {
						const root = this.getItemById(rootId);
						groups.set(rootId, {
							checkListId: rootId,
							title: root ? root.title : String(rootId),
							conflicts: []
						});
					}
					groups.get(rootId).conflicts.push(conflict);
				});
				return [...groups.values()];
			}
		},
		methods: {
			conflictKey(conflict) {
				return `${conflict.id}::${conflict.field}`;
			},
			getItemById(id) {
				return this.itemsById.get(id) ?? null;
			},
			getRootId(itemId) {
				const item = this.getItemById(itemId);
				if (!item) {
					return itemId;
				}
				if (item.parentId === 0) {
					return item.id;
				}
				return this.getRootId(item.parentId);
			},
			itemNumber(conflict) {
				const item = this.getItemById(conflict.id);
				if (!item || typeof item.sortIndex !== 'number') {
					return '';
				}
				return `#${item.sortIndex + 1}`;
			},
			selectResolution(conflict, value) {
				this.resolutions = {
					...this.resolutions,
					[this.conflictKey(conflict)]: value
				};
			},
			isSelected(conflict, value) {
				return this.resolutions[this.conflictKey(conflict)] === value;
			},
			isRemoval(conflict, side) {
				if (conflict.field === 'deleted') {
					return conflict[side] == null;
				}
				if (conflict.field === 'attachments') {
					const value = conflict[side];
					return !Array.isArray(value) || value.length === 0;
				}
				return false;
			},
			removalNote(conflict) {
				if (conflict.field === 'attachments' && (this.isRemoval(conflict, 'local') || this.isRemoval(conflict, 'incoming'))) {
					return main_core.Loc.getMessage('TASKS_V2_CONFLICT_POPUP_ATTACHMENTS_WERE_DELETED');
				}
				return '';
			},
			versionAriaLabel(conflict, side) {
				const version = side === 'local' ? main_core.Loc.getMessage('TASKS_V2_CONFLICT_POPUP_VERSION_A') : main_core.Loc.getMessage('TASKS_V2_CONFLICT_POPUP_VERSION_B');
				const value = this.displayValue(conflict, side) || main_core.Loc.getMessage('TASKS_V2_CONFLICT_POPUP_ITEM_DELETED');
				const number = this.itemNumber(conflict).replace('#', '');
				let label = number ? main_core.Loc.getMessage('TASKS_V2_CONFLICT_POPUP_VERSION_OPTION_LABEL', {
					'#VERSION#': version,
					'#NUMBER#': number,
					'#VALUE#': value
				}) : main_core.Loc.getMessage('TASKS_V2_CONFLICT_POPUP_VERSION_OPTION_LABEL_NO_NUMBER', {
					'#VERSION#': version,
					'#VALUE#': value
				});
				const note = this.removalNote(conflict);
				if (note) {
					label = `${label}, ${note}`;
				}
				return label;
			},
			displayValue(conflict, side) {
				const value = conflict[side];
				if (conflict.field === 'title') {
					return value ?? '';
				}
				if (conflict.field === 'attachments') {
					if (!Array.isArray(value) || value.length === 0) {
						return main_core.Loc.getMessage('TASKS_V2_CONFLICT_POPUP_FILES_DELETED');
					}
					return value.map(a => a.name ?? `#${a.id}`).join(', ');
				}
				if (conflict.field === 'deleted') {
					const item = conflict[side];
					return item ? item.title ?? '' : '';
				}
				return String(value ?? '');
			},
			async handleSave() {
				if (this.saving) {
					return;
				}
				this.saving = true;
				try {
					const resolved = await applyConflictResolutions({
						conflicts: this.conflicts,
						resolutions: this.resolutions,
						store: this.$store,
						taskId: this.taskId,
						checkListItems: this.checkListItems
					});
					if (resolved) {
						this.$emit('close');
					} else {
						this.saving = false;
					}
				} catch {
					this.saving = false;
				}
			},
			async handleCancel() {
				if (this.saving) {
					return;
				}
				this.saving = true;
				try {
					await applyConflictResolutions({
						conflicts: this.conflicts,
						resolutions: {},
						store: this.$store,
						taskId: this.taskId,
						checkListItems: this.checkListItems
					});
					this.$emit('close');
				} catch {
					this.saving = false;
				}
			}
		},
		template: `
		<Popup :options @close="handleCancel">
			<div class="tasks-conflict-popup" data-testid="task-check-list-conflict-popup">
				<HeadlineXs :id="titleId" class="tasks-conflict-popup-title">
					{{ loc('TASKS_V2_CONFLICT_POPUP_TITLE') }}
				</HeadlineXs>
				<TextSm class="tasks-conflict-popup-subtitle">
					{{ loc('TASKS_V2_CONFLICT_POPUP_SUBTITLE') }}
				</TextSm>

				<div class="tasks-conflict-popup-content">
					<div
						v-for="group in groupedConflicts"
						:key="group.checkListId"
						class="tasks-conflict-popup-group"
					>
						<TextSm class="tasks-conflict-popup-group-label">
							{{ group.title }}
						</TextSm>
						<div class="tasks-conflict-popup-panel">
							<div class="tasks-conflict-popup-columns-header">
								<div class="tasks-conflict-popup-column-head">
									<Text2Xs class="tasks-conflict-popup-column-head-label">
										{{ loc('TASKS_V2_CONFLICT_POPUP_VERSION_A') }}
									</Text2Xs>
								</div>
								<div class="tasks-conflict-popup-column-head">
									<Text2Xs class="tasks-conflict-popup-column-head-label">
										{{ loc('TASKS_V2_CONFLICT_POPUP_VERSION_B') }}
									</Text2Xs>
								</div>
							</div>
							<template
								v-for="conflict in group.conflicts"
								:key="conflict.id + '::' + conflict.field"
							>
								<Text2Xs
									v-if="removalNote(conflict)"
									class="tasks-conflict-popup-deleted-note"
								>
									{{ removalNote(conflict) }}
								</Text2Xs>

								<div class="tasks-conflict-popup-row">
									<Text2Xs class="tasks-conflict-popup-row-number">
										{{ itemNumber(conflict) }}
									</Text2Xs>
									<div class="tasks-conflict-popup-versions">
										<label
											class="tasks-conflict-popup-version"
											:class="{ '--selected': isSelected(conflict, 'LOCAL') }"
											:data-testid="'task-check-list-conflict-popup-keep-local-btn-' + conflictKey(conflict)"
										>
											<input
												type="radio"
												class="tasks-conflict-popup-version-input"
												:name="'tasks-conflict-popup-version-' + conflictKey(conflict)"
												value="LOCAL"
												:checked="isSelected(conflict, 'LOCAL')"
												:aria-label="versionAriaLabel(conflict, 'local')"
												@change="selectResolution(conflict, 'LOCAL')"
											/>
											<TextSm
												class="tasks-conflict-popup-version-value"
												:class="{
													'--empty': !displayValue(conflict, 'local'),
													'--removed': isRemoval(conflict, 'local'),
												}"
											>
												{{ displayValue(conflict, 'local') || loc('TASKS_V2_CONFLICT_POPUP_ITEM_DELETED') }}
											</TextSm>
											<span
												class="tasks-conflict-popup-version-radio"
												:class="{ '--checked': isSelected(conflict, 'LOCAL') }"
												aria-hidden="true"
											></span>
										</label>
										<label
											class="tasks-conflict-popup-version"
											:class="{ '--selected': isSelected(conflict, 'INCOMING') }"
											:data-testid="'task-check-list-conflict-popup-keep-incoming-btn-' + conflictKey(conflict)"
										>
											<input
												type="radio"
												class="tasks-conflict-popup-version-input"
												:name="'tasks-conflict-popup-version-' + conflictKey(conflict)"
												value="INCOMING"
												:checked="isSelected(conflict, 'INCOMING')"
												:aria-label="versionAriaLabel(conflict, 'incoming')"
												@change="selectResolution(conflict, 'INCOMING')"
											/>
											<TextSm
												class="tasks-conflict-popup-version-value"
												:class="{
													'--empty': !displayValue(conflict, 'incoming'),
													'--removed': isRemoval(conflict, 'incoming'),
												}"
											>
												{{ displayValue(conflict, 'incoming') || loc('TASKS_V2_CONFLICT_POPUP_ITEM_DELETED') }}
											</TextSm>
											<span
												class="tasks-conflict-popup-version-radio"
												:class="{ '--checked': isSelected(conflict, 'INCOMING') }"
												aria-hidden="true"
											></span>
										</label>
									</div>
								</div>
							</template>
						</div>
					</div>
				</div>

				<div class="tasks-conflict-popup-footer">
					<Button
						:text="loc('TASKS_V2_CONFLICT_POPUP_SAVE_BTN')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED"
						:loading="saving"
						data-testid="task-check-list-conflict-popup-save-btn"
						@click="handleSave"
					/>
					<Button
						:text="loc('TASKS_V2_CONFLICT_POPUP_CANCEL_BTN')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.OUTLINE_NO_ACCENT"
						data-testid="task-check-list-conflict-popup-cancel-btn"
						@click="handleCancel"
					/>
				</div>
			</div>
		</Popup>
	`
	};

	exports.ConflictPopup = ConflictPopup;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.UI.Vue3.Components, BX.Vue3.Components, BX.UI.System.Typography.Vue, BX.Tasks.V2.Const, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=check-list-conflict-popup.bundle.js.map

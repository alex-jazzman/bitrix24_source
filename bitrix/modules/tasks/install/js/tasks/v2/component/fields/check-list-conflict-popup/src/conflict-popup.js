import { Loc, Text } from 'main.core';
import type { PopupOptions } from 'main.popup';

import { Popup } from 'ui.vue3.components.popup';
import { Button, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineXs, TextSm, Text2Xs } from 'ui.system.typography.vue';

import { applyConflictResolutions } from './apply-conflict-resolutions';

import './conflict-popup.css';

// @vue/component
export const ConflictPopup = {
	name: 'TaskCheckListConflictPopup',
	components: {
		Popup,
		Button,
		HeadlineXs,
		TextSm,
		Text2Xs,
	},
	props: {
		conflicts: {
			type: Array,
			required: true,
		},
		checkListItems: {
			type: Array,
			default: () => [],
		},
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	emits: ['close'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): Object
	{
		const resolutions = {};
		this.conflicts.forEach((conflict) => {
			resolutions[`${conflict.id}::${conflict.field}`] = 'INCOMING';
		});

		return {
			resolutions,
			saving: false,
			titleId: `tasks-conflict-popup-title-${Text.getRandom(10)}`,
		};
	},
	watch: {
		conflicts(nextConflicts): void
		{
			const resolutions = { ...this.resolutions };
			nextConflicts.forEach((conflict) => {
				const key = `${conflict.id}::${conflict.field}`;
				if (resolutions[key] === undefined)
				{
					resolutions[key] = 'INCOMING';
				}
			});

			this.resolutions = resolutions;
		},
	},
	computed: {
		options(): PopupOptions
		{
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
				focusTrap: true,
			};
		},
		itemsById(): Map<number | string, Object>
		{
			const map = new Map();
			this.checkListItems.forEach((item) => {
				map.set(item.id, item);
			});

			return map;
		},
		groupedConflicts(): Array
		{
			const groups = new Map();

			this.conflicts.forEach((conflict) => {
				const rootId = this.getRootId(conflict.id);
				if (!groups.has(rootId))
				{
					const root = this.getItemById(rootId);
					groups.set(rootId, {
						checkListId: rootId,
						title: root ? root.title : String(rootId),
						conflicts: [],
					});
				}

				groups.get(rootId).conflicts.push(conflict);
			});

			return [...groups.values()];
		},
	},
	methods: {
		conflictKey(conflict): string
		{
			return `${conflict.id}::${conflict.field}`;
		},

		getItemById(id): ?Object
		{
			return this.itemsById.get(id) ?? null;
		},

		getRootId(itemId): number | string
		{
			const item = this.getItemById(itemId);
			if (!item)
			{
				return itemId;
			}

			if (item.parentId === 0)
			{
				return item.id;
			}

			return this.getRootId(item.parentId);
		},

		itemNumber(conflict): string
		{
			const item = this.getItemById(conflict.id);
			if (!item || typeof item.sortIndex !== 'number')
			{
				return '';
			}

			return `#${item.sortIndex + 1}`;
		},

		selectResolution(conflict, value: 'LOCAL' | 'INCOMING'): void
		{
			this.resolutions = { ...this.resolutions, [this.conflictKey(conflict)]: value };
		},

		isSelected(conflict, value: 'LOCAL' | 'INCOMING'): boolean
		{
			return this.resolutions[this.conflictKey(conflict)] === value;
		},

		isRemoval(conflict, side: 'local' | 'incoming'): boolean
		{
			if (conflict.field === 'deleted')
			{
				return conflict[side] == null;
			}

			if (conflict.field === 'attachments')
			{
				const value = conflict[side];

				return !Array.isArray(value) || value.length === 0;
			}

			return false;
		},

		removalNote(conflict): string
		{
			if (
				conflict.field === 'attachments'
				&& (this.isRemoval(conflict, 'local') || this.isRemoval(conflict, 'incoming'))
			)
			{
				return Loc.getMessage('TASKS_V2_CONFLICT_POPUP_ATTACHMENTS_WERE_DELETED');
			}

			return '';
		},

		versionAriaLabel(conflict, side: 'local' | 'incoming'): string
		{
			const version = side === 'local'
				? Loc.getMessage('TASKS_V2_CONFLICT_POPUP_VERSION_A')
				: Loc.getMessage('TASKS_V2_CONFLICT_POPUP_VERSION_B');

			const value = this.displayValue(conflict, side) || Loc.getMessage('TASKS_V2_CONFLICT_POPUP_ITEM_DELETED');
			const number = this.itemNumber(conflict).replace('#', '');

			let label = number
				? Loc.getMessage('TASKS_V2_CONFLICT_POPUP_VERSION_OPTION_LABEL', {
					'#VERSION#': version,
					'#NUMBER#': number,
					'#VALUE#': value,
				})
				: Loc.getMessage('TASKS_V2_CONFLICT_POPUP_VERSION_OPTION_LABEL_NO_NUMBER', {
					'#VERSION#': version,
					'#VALUE#': value,
				});

			const note = this.removalNote(conflict);
			if (note)
			{
				label = `${label}, ${note}`;
			}

			return label;
		},

		displayValue(conflict, side: 'local' | 'incoming'): string
		{
			const value = conflict[side];

			if (conflict.field === 'title')
			{
				return value ?? '';
			}

			if (conflict.field === 'attachments')
			{
				if (!Array.isArray(value) || value.length === 0)
				{
					return Loc.getMessage('TASKS_V2_CONFLICT_POPUP_FILES_DELETED');
				}

				return value.map((a) => a.name ?? `#${a.id}`).join(', ');
			}

			if (conflict.field === 'deleted')
			{
				const item = conflict[side];

				return item ? (item.title ?? '') : '';
			}

			return String(value ?? '');
		},

		async handleSave(): Promise<void>
		{
			if (this.saving)
			{
				return;
			}

			this.saving = true;

			try
			{
				const resolved = await applyConflictResolutions({
					conflicts: this.conflicts,
					resolutions: this.resolutions,
					store: this.$store,
					taskId: this.taskId,
					checkListItems: this.checkListItems,
				});

				if (resolved)
				{
					this.$emit('close');
				}
				else
				{
					this.saving = false;
				}
			}
			catch
			{
				this.saving = false;
			}
		},

		async handleCancel(): Promise<void>
		{
			if (this.saving)
			{
				return;
			}

			this.saving = true;

			try
			{
				await applyConflictResolutions({
					conflicts: this.conflicts,
					resolutions: {},
					store: this.$store,
					taskId: this.taskId,
					checkListItems: this.checkListItems,
				});

				this.$emit('close');
			}
			catch
			{
				this.saving = false;
			}
		},
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
	`,
};

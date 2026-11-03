import { Dom, Event, Text, Type } from 'main.core';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { Core } from 'tasks.v2.core';
import { EventName, Model, Option, TaskField } from 'tasks.v2.const';
import { Hint } from 'tasks.v2.component.elements.hint';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { analytics } from 'tasks.v2.lib.analytics';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import { EntityTypes, fileService } from 'tasks.v2.provider.service.file-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import './full-card-button.css';

// @vue/component
export const FullCardButton = {
	components: {
		Hint,
		UiButton,
	},
	inject: {
		analytics: {},
		task: {},
		taskId: {},
	},
	props: {
		isOpening: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['update:isOpening'],
	setup(): { task: TaskModel }
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): Object
	{
		return {
			isHintShown: false,
			hintBindElement: null,
			showAuditorsHint: false,
			auditorsHintBindElement: null,
			reasonId: `tasks-compact-card-full-button-reason-${Text.getRandom()}`,
		};
	},
	computed: {
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		isDisabled(): boolean
		{
			return this.isUploading || this.isCheckListUploading;
		},
		isUploading(): boolean
		{
			return fileService.get(this.taskId).isUploading();
		},
		isCheckListUploading(): boolean
		{
			return this.task.checklist?.some((itemId) => fileService.get(itemId, EntityTypes.CheckListItem).isUploading());
		},
		hasAuditors(): boolean
		{
			return Array.isArray(this.task?.auditorsIds) && this.task.auditorsIds.length > 0;
		},
		auditorsHintOptions(): Object
		{
			return {
				closeIcon: true,
				offsetLeft: -60,
				angle: {
					offset: 140,
				},
				bindOptions: {
					forceBindPosition: true,
					forceTop: true,
					position: 'top',
				},
				focusTrap: {
					initialFocus: false,
				},
			};
		},
	},
	watch: {
		isDisabled(): void
		{
			this.syncAria();
		},
	},
	mounted()
	{
		this.syncAria();

		// Show auditors hint if auditorsIds is not empty
		if (this.hasAuditors && ahaMoments.shouldShow(Option.AhaAuditorsInCompactFormPopup))
		{
			ahaMoments.setActive(Option.AhaAuditorsInCompactFormPopup);
			this.$nextTick(() => {
				// Bind to the button element
				this.auditorsHintBindElement = this.$refs.fullCardButtonContainer;
				this.showAuditorsHint = true;
			});
		}
	},
	beforeUnmount()
	{
		this.dismissHint();
	},
	methods: {
		handleClick(): void
		{
			if (this.isUploading)
			{
				this.highlightFiles();
			}
			else if (this.isCheckListUploading)
			{
				this.highlightChecklist();
			}
			else
			{
				this.openFullCard();
			}
		},
		syncAria(): void
		{
			const button = this.$refs.fullCardButtonContainer?.querySelector('.tasks-compact-card-full-button');
			if (!button)
			{
				return;
			}

			Dom.attr(button, 'aria-disabled', this.isDisabled ? 'true' : null);
			Dom.attr(button, 'aria-describedby', this.isDisabled ? this.reasonId : null);

			// ui.buttons styles the disabled look via [disabled]/.ui-btn-disabled. We keep the
			// button in tab order (no native disabled), so drive the visual state by the class.
			Dom.toggleClass(button, 'ui-btn-disabled', this.isDisabled);
		},
		highlightFiles(): void
		{
			this.hintBindElement = fieldHighlighter
				.setContainer(this.$root.$el)
				.addChipHighlight(TaskField.Files)
				.getChipContainer(TaskField.Files)
			;

			this.showHint();
		},
		highlightChecklist(): void
		{
			this.hintBindElement = fieldHighlighter
				.setContainer(this.$root.$el)
				.addChipHighlight(TaskField.CheckList)
				.getChipContainer(TaskField.CheckList)
			;

			this.showHint();
		},
		showHint(): void
		{
			this.dismissHint();

			// Esc is intentionally excluded here: on keyup main.popup's checkEscPressed
			// closes the top popup (the hint) by z-index, leaving the shell open; a second
			// Esc closes the shell. Other keys dismiss the hint (preserved behavior).
			this.onHintKeyDown = (event: KeyboardEvent): void => {
				if (event.key === 'Escape')
				{
					return;
				}

				this.dismissHint();
			};
			Event.bind(window, 'keydown', this.onHintKeyDown);

			this.isHintShown = true;
		},
		dismissHint(): void
		{
			if (this.onHintKeyDown)
			{
				Event.unbind(window, 'keydown', this.onHintKeyDown);
				this.onHintKeyDown = null;
			}

			this.isHintShown = false;
		},
		openFullCard(): void
		{
			if (this.isOpening)
			{
				return;
			}

			this.$emit('update:isOpening', true);

			const features = Core.getParams().features;
			analytics.sendOpenFullCard(this.analytics);

			const canOpenFullCard = (
				features.isV2Enabled
				|| (
					Type.isArray(features.allowedGroups)
					&& features.allowedGroups.includes(this.task.groupId)
				)
			);

			if (canOpenFullCard)
			{
				Event.EventEmitter.emit(`${EventName.OpenFullCard}:${this.taskId}`, this.taskId);
			}
			else
			{
				Event.EventEmitter.emit(`${EventName.OpenSliderCard}:${this.taskId}`, {
					task: this.task,
					checkLists: this.checkLists,
				});
			}
		},
		closeAuditorsHint()
		{
			this.showAuditorsHint = false;
			ahaMoments.setInactive(Option.AhaAuditorsInCompactFormPopup);
		},
		handleAuditorsHintLinkClick()
		{
			ahaMoments.setShown(Option.AhaAuditorsInCompactFormPopup);
			this.closeAuditorsHint();
		},
	},
	template: `
		<div
			ref="fullCardButtonContainer"
			class="tasks-compact-card-full-button-container"
			:class="{ '--disabled': isDisabled }"
		>
			<UiButton
				class="tasks-compact-card-full-button"
				:text="loc('TASKS_V2_TCC_FULL_CARD_BTN')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:loading="isOpening"
				:dataset="{taskButtonId: 'full'}"
				@click="handleClick"
			/>
			<span :id="reasonId" class="tasks-compact-card-vh">{{ loc('TASKS_V2_TCC_FULL_CARD_DISABLED_REASON') }}</span>
			<Hint
				v-if="showAuditorsHint"
				:bindElement="auditorsHintBindElement"
				@close="closeAuditorsHint"
				:options="auditorsHintOptions"
			>
				<div class="tasks-compact-card-full-button-auditors-hint --ui-context-edge-dark">
					<div class="tasks-compact-card-full-button-auditors-hint-title">
						{{ loc('TASKS_V2_TCC_AUDITORS_HINT_TITLE') }}
					</div>
					<div class="tasks-compact-card-full-button-auditors-hint-content">
						{{ loc('TASKS_V2_TCC_AUDITORS_HINT_CONTENT') }}
					</div>
					<button
						type="button"
						class="tasks-compact-card-full-button-auditors-hint-link"
						@click.stop="handleAuditorsHintLinkClick"
					>
						{{ loc('TASKS_V2_TCC_AUDITORS_HINT_DO_NOT_SHOW_AGAIN') }}
					</button>
				</div>
			</Hint>
		</div>
		<Hint
			v-if="isHintShown"
			:bindElement="hintBindElement"
			@close="dismissHint"
		>
			{{ loc('TASKS_V2_TCC_FILE_IS_UPLOADING') }}
		</Hint>
	`,
};

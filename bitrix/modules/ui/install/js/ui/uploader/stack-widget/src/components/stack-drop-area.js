import { Loc, Text, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { UploaderEvent } from 'ui.uploader.core';
import { StackWidgetSize } from 'ui.uploader.stack-widget';

export const StackDropArea = {
	name: 'StackDropArea',
	inject: ['uploader', 'widgetOptions'],
	props: {
		// id of the hidden copy of the error text kept by the root, while there is an error
		errorId: {
			type: String,
			default: null,
		},
	},
	setup(): Object
	{
		return {
			inputId: `ui-uploader-stack-drop-input-${Text.getRandom().toLowerCase()}`,
			keyboardHintId: `ui-uploader-stack-drop-hint-${Text.getRandom().toLowerCase()}`,
		};
	},
	data()
	{
		return {
			isHovering: false,
		}
	},
	computed: {
		StackWidgetSize: () => StackWidgetSize,
		uploadFileTitle(): string
		{
			if (this.uploader.shouldAcceptOnlyImages())
			{
				if (this.uploader.isMultiple())
				{
					return Loc.getMessage('STACK_WIDGET_UPLOAD_IMAGES');
				}
				else
				{
					return Loc.getMessage('STACK_WIDGET_UPLOAD_IMAGE');
				}
			}
			else
			{
				if (this.uploader.isMultiple())
				{
					return Loc.getMessage('STACK_WIDGET_UPLOAD_FILES');
				}
				else
				{
					return Loc.getMessage('STACK_WIDGET_UPLOAD_FILE');
				}
			}
		},
		// the title is visible in LARGE and MEDIUM only, but the name of the field must not depend
		// on the size, so in the other sizes the label stays in the DOM and is only hidden visually
		labelClass(): string
		{
			return [StackWidgetSize.LARGE, StackWidgetSize.MEDIUM].includes(this.widgetOptions.size)
				? 'ui-uploader-stack-drop-area-title'
				: 'ui-uploader-stack-visually-hidden';
		},
		dragFileHint(): string
		{
			if (this.uploader.isMultiple())
			{
				return Loc.getMessage('STACK_WIDGET_DRAG_FILES_HINT');
			}
			else
			{
				return Loc.getMessage('STACK_WIDGET_DRAG_FILE_HINT');
			}
		},
		keyboardHint(): ?string
		{
			return Loc.getMessage('STACK_WIDGET_DROP_KEYBOARD_HINT');
		},
		/**
		 * The field is described by everything the widget has to say about it at once: what has just
		 * gone wrong comes first as the answer to the last thing the user did, and the hint on how to
		 * pick a file follows it. Whichever of the two is missing leaves its id out - a reference to
		 * an element that is not rendered is a defect of its own.
		 */
		describedBy(): ?string
		{
			const ids = [this.errorId, this.keyboardHint ? this.keyboardHintId : null];
			const rendered = ids.filter(Type.isStringFilled);

			return rendered.length > 0 ? rendered.join(' ') : null;
		},
	},
	mounted()
	{
		this.uploader.assignDropzone(this.$refs.container);
		// a real input given to assignBrowse works natively: Tab stop, Enter and Space open the
		// system dialog, multiple and accept are set by the uploader itself
		this.uploader.assignBrowse(this.$refs.fileInput);
	},
	methods: {
		/**
		 * The uploader announces a browse of its own only for a node it opens the dialog from itself;
		 * for an input it has nothing to announce - the input opens the dialog on its own. The zone is
		 * that input now, so the event belongs to it: it is emitted with the same data the uploader
		 * sends, and a subscriber that answers with `preventDefault()` keeps the dialog closed.
		 */
		handleBrowse(event: MouseEvent): void
		{
			const browseEvent = new BaseEvent({
				data: { input: this.$refs.fileInput, node: this.$refs.container },
			});

			this.uploader.emit(UploaderEvent.BEFORE_BROWSE, browseEvent);

			if (browseEvent.isDefaultPrevented())
			{
				event.preventDefault();
			}
		},
	},
	// language=Vue
	template: `
		<div
			class="ui-uploader-stack-drop-area"
			data-testid="ui-uploader-stack-drop-area"
			ref="container"
			:class="{ '--hover': isHovering }"
			@mouseenter="isHovering = true"
			@mouseleave="isHovering = false"
			@dragleave="isHovering = false"
		>
			<!--
				tabindex is explicit on purpose: Safari with "Press Tab to highlight each item on a
				webpage" off walks only the elements that carry a tabindex, so without it the field
				drops out of the Tab order and the file cannot be picked from the keyboard. Value 0
				keeps the document order.
			-->
			<input
				type="file"
				class="ui-uploader-stack-drop-input"
				data-testid="ui-uploader-stack-drop-input"
				tabindex="0"
				:id="inputId"
				:aria-describedby="describedBy"
				ref="fileInput"
				@click="handleBrowse"
			/>
			<div class="ui-uploader-stack-drop-area-content">
				<div class="ui-uploader-stack-drop-area-icon"></div>
				<label
					:for="inputId"
					:class="labelClass"
					data-testid="ui-uploader-stack-drop-label"
				>{{ uploadFileTitle }}</label>
				<div
					v-if="widgetOptions.size === StackWidgetSize.LARGE"
					class="ui-uploader-stack-drop-area-hint"
				>{{ dragFileHint }}</div>
				<!--
					the hint is a description, not a part of the accessible name: the label stays the
					only name of the field. A locale without the phrase renders no span, so
					aria-describedby must not point at it either.
				-->
				<span
					v-if="keyboardHint"
					class="ui-uploader-stack-visually-hidden"
					:id="keyboardHintId"
				>{{ keyboardHint }}</span>
			</div>
		</div>
	`,
};

import { Loc, Text } from 'main.core';
import { UploadLoader } from 'ui.uploader.tile-widget';
import { StackWidgetSize } from '../stack-widget-size';

const progressSizes = {
	[StackWidgetSize.LARGE]: { width: 46, lineSize: 5 },
	[StackWidgetSize.MEDIUM]: { width: 34, lineSize: 4 },
	[StackWidgetSize.SMALL]: { width: 20, lineSize: 3 },
	[StackWidgetSize.TINY]: { width: 14, lineSize: 2 },
};

export const StackUpload = {
	name: 'StackUpload',
	inject: ['widgetOptions'],
	components: {
		UploadLoader,
	},
	props: {
		items: {
			type: Array,
			required: true,
		},
		queueItems: {
			type: Array,
			required: true,
		},
		isPopupShown: {
			type: Boolean,
			default: false,
		},
		// id of the hidden error text of the widget, null while there is no error
		errorId: {
			type: String,
			default: null,
		},
	},
	emits: ['showPopup', 'abortUpload'],
	data: () => ({
		sizeTextId: `ui-uploader-stack-upload-size-${Text.getRandom().toLowerCase()}`,
	}),
	computed: {
		StackWidgetSize: () => StackWidgetSize,
		// the name of the stack must not change while the upload runs: a screen reader announces a new
		// name of the focused element, and the progress goes through aria-valuenow alone
		uploadFileTitle()
		{
			if (this.queueItems.length > 1)
			{
				return Loc.getMessage('STACK_WIDGET_FILES_UPLOADING');
			}
			else
			{
				return Loc.getMessage('STACK_WIDGET_FILE_UPLOADING');
			}
		},
		progress()
		{
			if (this.queueItems.length === 0)
			{
				return 0;
			}

			const progress = this.queueItems.reduce((total, item) => {
				return total + item.progress;
			}, 0);

			return Math.floor(progress / this.queueItems.length);
		},
		// the visual minimum of the arc: it must not reach aria-valuenow, or the screen reader would
		// announce 10 % at the very start of an upload that has not moved yet
		progressOptions()
		{
			const { width, lineSize } = progressSizes[this.widgetOptions.size];

			return {
				width,
				lineSize,
				progress: Math.max(this.progress, 10),
			};
		},
		uploadProgressLabel(): string
		{
			return Loc.getMessage('STACK_WIDGET_UPLOAD_PROGRESS_LABEL');
		},
		// the size is only drawn for a single file, and only where there is room for it
		showUploadSize(): boolean
		{
			return this.queueItems.length === 1 && this.widgetOptions.size === StackWidgetSize.LARGE;
		},
		/**
		 * Everything inside the indicator is presentational, the size of the file along with the
		 * percentage, so the size is tied back to the indicator as its description: a description is
		 * read off the element it points at whatever the tree does with that element, and it does not
		 * touch the name of the indicator the way a text of its own would. Both nodes live outside the
		 * button, so nothing on this path goes through a presentational subtree.
		 */
		uploadSizeId(): ?string
		{
			return this.showUploadSize ? this.sizeTextId : null;
		},
		abortUploadLabel(): string
		{
			return Loc.getMessage('STACK_WIDGET_ABORT_UPLOAD');
		},
	},
	// language=Vue
	template: `
		<!--
			The frame holds everything this state is made of side by side: the stack itself, the progress
			indicator over it and the button aborting the upload. Neither the abort nor the indicator can
			live inside the stack - a button inside a button is a nested interactive element, and a node
			under a button is presentational - and the frame repeats the box of the stack, so both keep
			the place they have always been drawn in.
		-->
		<div class="ui-uploader-stack-upload-frame">
			<!-- explicit tabindex: see StackDropArea (Safari Tab order) -->
			<button
				type="button"
				class="ui-uploader-stack-upload"
				data-testid="ui-uploader-stack-upload-btn"
				tabindex="0"
				:aria-label="uploadFileTitle"
				aria-haspopup="dialog"
				:aria-expanded="isPopupShown ? 'true' : 'false'"
				:aria-describedby="errorId"
				@click="$emit('showPopup')"
			>
				<div class="ui-uploader-stack-upload-box">
					<!-- the icon only repeats what the button already does, so it stays out of the tree -->
					<div
						class="ui-uploader-stack-upload-menu"
						aria-hidden="true"
						:title="$Bitrix.Loc.getMessage('STACK_WIDGET_OPEN_FILE_GALLERY')"
					></div>
				</div>
			</button>
			<!--
				The indicator lies over the button instead of inside it: a button makes its whole subtree
				presentational, and an indicator nested there reaches no screen reader at all, however
				complete its ARIA is. The layer lets the pointer through, so for a click the percentage is
				still a part of the stack.
			-->
			<div class="ui-uploader-stack-upload-layer">
				<div class="ui-uploader-stack-upload-content">
					<div class="ui-uploader-stack-upload-loader">
						<UploadLoader v-bind="progressOptions" aria-hidden="true"/>
					</div>
					<!--
						the progress is announced through aria-valuenow alone, so the arc is decorative and
						the visible percent inside the indicator is not a part of its name
					-->
					<div
						class="ui-uploader-stack-upload-progress"
						data-testid="ui-uploader-stack-upload-progress"
						role="progressbar"
						:aria-label="uploadProgressLabel"
						aria-valuemin="0"
						aria-valuemax="100"
						:aria-valuenow="progress"
						:aria-describedby="uploadSizeId"
					>
						<div
							v-if="widgetOptions.size === StackWidgetSize.LARGE"
							class="ui-uploader-stack-upload-title"
						>{{ uploadFileTitle }}</div>
						<div class="ui-uploader-stack-upload-percent">{{ progress }}%</div>
						<div v-if="showUploadSize" class="ui-uploader-stack-upload-stats">
							<span :id="sizeTextId" class="ui-uploader-stack-upload-total">{{
								queueItems.length ? queueItems[0].sizeFormatted : ''
							}}</span>
						</div>
					</div>
				</div>
			</div>
			<button
				type="button"
				class="ui-uploader-stack-upload-abort"
				data-testid="ui-uploader-stack-upload-abort-btn"
				tabindex="0"
				:aria-label="abortUploadLabel"
				:title="abortUploadLabel"
				@click="$emit('abortUpload')"
			></button>
		</div>
	`,
};

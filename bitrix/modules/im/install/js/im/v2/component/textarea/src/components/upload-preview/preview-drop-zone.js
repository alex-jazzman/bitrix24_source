import { Event, Type, type JsonObject } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { getFilesFromDataTransfer, hasDataTransferOnlyFiles } from 'ui.uploader.core';
import 'ui.icon-set.outline';

import '../../css/upload-preview/preview-drop-zone.css';

const ICON_SIZE = 24;

// @vue/component
export const PreviewDropZone = {
	name: 'PreviewDropZone',
	components: { BIcon },
	props: {
		container: {
			type: Object,
			default: null,
		},
		// the internal reorder drag rides the same events, so it switches the zone off
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['filesDropped'],
	data(): JsonObject
	{
		return {
			showDropZone: false,
			lastEnterTarget: null,
		};
	},
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		ICON_SIZE: () => ICON_SIZE,
	},
	watch:
	{
		container: {
			immediate: true,
			handler(container: HTMLElement | null)
			{
				this.unbindEvents();

				if (Type.isElementNode(container))
				{
					this.bindEvents(container);
				}
			},
		},
		disabled(disabled: boolean)
		{
			if (disabled)
			{
				this.showDropZone = false;
			}
		},
	},
	created()
	{
		this.boundContainer = null;
	},
	beforeUnmount()
	{
		this.unbindEvents();
	},
	methods:
	{
		bindEvents(container: HTMLElement)
		{
			this.boundContainer = container;

			Event.bind(container, 'dragenter', this.onDragEnter);
			Event.bind(container, 'dragleave', this.onDragLeave);
			Event.bind(container, 'dragover', this.onDragOver);
			Event.bind(container, 'drop', this.onDrop);
		},
		unbindEvents()
		{
			if (!this.boundContainer)
			{
				return;
			}

			Event.unbind(this.boundContainer, 'dragenter', this.onDragEnter);
			Event.unbind(this.boundContainer, 'dragleave', this.onDragLeave);
			Event.unbind(this.boundContainer, 'dragover', this.onDragOver);
			Event.unbind(this.boundContainer, 'drop', this.onDrop);

			this.boundContainer = null;
		},
		async onDragEnter(event: DragEvent)
		{
			event.preventDefault();

			if (this.disabled)
			{
				return;
			}

			// the target is taken before the check, so a dragleave arriving during it cancels this enter
			const enterTarget = event.target;
			this.lastEnterTarget = enterTarget;

			const onlyFiles: boolean = await hasDataTransferOnlyFiles(event.dataTransfer, false);
			if (!onlyFiles || this.lastEnterTarget !== enterTarget)
			{
				return;
			}

			this.showDropZone = true;
		},
		onDragLeave(event: DragEvent)
		{
			if (this.lastEnterTarget !== event.target)
			{
				return;
			}

			this.lastEnterTarget = null;
			this.showDropZone = false;
		},
		onDragOver(event: DragEvent)
		{
			// without this the browser opens the dropped file instead of firing drop
			event.preventDefault();
		},
		async onDrop(event: DragEvent)
		{
			event.preventDefault();
			this.showDropZone = false;

			if (this.disabled)
			{
				return;
			}

			// a dropped folder is browsed into its files, the same as the chat drop area does
			const files: File[] = await getFilesFromDataTransfer(event.dataTransfer);
			if (Type.isArrayFilled(files))
			{
				this.$emit('filesDropped', files);
			}
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<Transition name="preview-drop-zone-fade">
			<div
				v-if="showDropZone"
				class="bx-im-upload-preview-drop-zone__container"
				data-testid="im-upload-preview-drop-zone"
			>
				<BIcon
					:name="OutlineIcons.CURSOR_CLICK"
					:size="ICON_SIZE"
					color="var(--ui-color-base-3)"
				/>
				<span class="bx-im-upload-preview-drop-zone__text">
					{{ loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_DROP_ZONE') }}
				</span>
			</div>
		</Transition>
	`,
};

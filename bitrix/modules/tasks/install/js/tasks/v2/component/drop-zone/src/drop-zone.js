import { Event, Type } from 'main.core';

import { hasDataTransferOnlyFiles } from 'ui.uploader.core';
import { BIcon, Main } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';

import { fileService, EntityTypes, type FileService } from 'tasks.v2.provider.service.file-service';

import './drop-zone.css';

// @vue/component
export const DropZone = {
	components: {
		BIcon,
	},
	props: {
		entityId: {
			type: [Number, String],
			required: true,
		},
		entityType: {
			type: String,
			default: EntityTypes.Task,
		},
		container: {
			type: Object,
			required: true,
		},
		bottom: {
			type: Number,
			default: 100,
		},
	},
	setup(props): { fileService: FileService }
	{
		return {
			Main,
			fileService: fileService.get(props.entityId, props.entityType),
		};
	},
	data(): Object
	{
		return {
			showDropArea: false,
			lastDropAreaEnterTarget: null,
		};
	},
	computed: {
		dropAreaStyles(): {[bottom: string]: string}
		{
			return {
				bottom: `${this.bottom}px`,
			};
		},
		iconSize(): number
		{
			return 69;
		},
	},
	watch: {
		container: {
			immediate: true,
			handler(newValue): void
			{
				if (!Type.isElementNode(newValue))
				{
					return;
				}

				this.bindEvents();
			},
		},
	},
	beforeUnmount(): void
	{
		if (!Type.isElementNode(this.container))
		{
			return;
		}

		this.unbindEvents();
	},
	methods: {
		bindEvents(): void
		{
			this.fileService.getAdapter().getUploader().assignDropzone(this.container);

			Event.bind(this.container, 'dragenter', this.onDragEnter);
			Event.bind(this.container, 'dragleave', this.onDragLeave);
			Event.bind(this.container, 'drop', this.onDrop);
		},
		unbindEvents(): void
		{
			this.fileService.getAdapter().getUploader().unassignDropzone(this.container);

			Event.unbind(this.container, 'dragenter', this.onDragEnter);
			Event.unbind(this.container, 'dragleave', this.onDragLeave);
			Event.unbind(this.container, 'drop', this.onDrop);
		},
		async onDragEnter(event: DragEvent): Promise<void>
		{
			event.stopPropagation();
			event.preventDefault();

			const success = await hasDataTransferOnlyFiles(event.dataTransfer, false);
			if (!success)
			{
				return;
			}
			this.lastDropAreaEnterTarget = event.target;
			this.showDropArea = true;
		},
		onDragLeave(event: DragEvent): void
		{
			event.stopPropagation();
			event.preventDefault();

			if (this.lastDropAreaEnterTarget !== event.target)
			{
				return;
			}

			this.showDropArea = false;
		},
		async onDrop(event: DragEvent): Promise<void>
		{
			event.preventDefault();

			this.showDropArea = false;
		},
	},
	template: `
		<Transition name="tasks-drop-zone-fade">
			<div v-if="showDropArea" :style="dropAreaStyles" class="tasks-drop-zone__container">
				<div class="tasks-drop-zone__box">
					<BIcon :name="Main.ATTACH" :size="iconSize" class="tasks-drop-zone__icon"/>
					<label class="tasks-drop-zone__label_text">{{ loc('TASKS_V2_DROP_ZONE_TITLE') }}</label>
				</div>
			</div>
		</Transition>
	`,
};

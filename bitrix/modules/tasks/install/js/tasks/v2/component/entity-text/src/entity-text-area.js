import { type BaseEvent } from 'main.core.events';

import { TextEditorComponent, type TextEditor } from 'ui.text-editor';
import { type VueUploaderAdapter } from 'ui.uploader.vue';

import { type UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { fileService, type FileService } from 'tasks.v2.provider.service.file-service';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';

import { entityTextEditor, EntityTextTypes, type EntityTextEditor } from './entity-text-editor';

import './entity-text.css';

const mountedAreas: Map<string, Set<Object>> = new Map();

// @vue/component
export const EntityTextArea = {
	components: {
		TextEditorComponent,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
	},
	props: {
		entityId: {
			type: [Number, String],
			required: true,
		},
		entityType: {
			type: String,
			default: EntityTextTypes.Task,
			validator: (value: string): boolean => Object.values(EntityTextTypes).includes(value),
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		removeFromServer: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['change', 'blur', 'filesChange'],
	setup(props): {
		editor: TextEditor,
		entityTextEditor: EntityTextEditor,
		uploaderAdapter: VueUploaderAdapter,
		fileService: FileService,
	}
	{
		return {
			/** @type TextEditor */
			editor: null,
			entityTextEditor: entityTextEditor.get(props.entityId, props.entityType),
			fileService: fileService.get(props.entityId, props.entityType),
			uploaderAdapter: fileService.get(props.entityId, props.entityType).getAdapter(),
		};
	},
	data(): { files: Array<Object>, isActiveRenderer: boolean, editorRenderKey: number }
	{
		return {
			files: this.fileService.getFiles(),
			isActiveRenderer: true,
			editorRenderKey: 0,
		};
	},
	computed: {
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				insertIntoText: true,
				tileWidgetOptions: {
					compact: true,
					enableDropzone: false,
					hideDropArea: true,
					readonly: this.readonly,
					autoCollapse: false,
					removeFromServer: this.removeFromServer,
					events: {
						onInsertIntoText: this.handleInsertFile,
					},
				},
			};
		},
		filesCount(): number
		{
			return this.files.length;
		},
	},
	created(): void
	{
		this.editor = this.entityTextEditor.getEditor();
	},
	mounted(): void
	{
		this.registerArea();
		this.subscribeEvents();
	},
	unmounted(): void
	{
		this.unregisterArea();
		this.unsubscribeEvents();
	},
	methods: {
		subscribeEvents(): void
		{
			this.fileService.subscribe('onFileAdd', this.onFileAdd);
			this.fileService.subscribe('onFileRemove', this.onFileRemove);
			this.entityTextEditor.subscribe('editorChanged', this.onEditorChange);
			this.entityTextEditor.subscribe('editorBlurred', this.onEditorBlur);
		},
		unsubscribeEvents(): void
		{
			this.fileService.unsubscribe('onFileAdd', this.onFileAdd);
			this.fileService.unsubscribe('onFileRemove', this.onFileRemove);
			this.entityTextEditor.unsubscribe('editorChanged', this.onEditorChange);
			this.entityTextEditor.unsubscribe('editorBlurred', this.onEditorBlur);
		},
		registerArea(): void
		{
			const key = this.getAreaKey(this.entityId, this.entityType);
			if (!mountedAreas.has(key))
			{
				mountedAreas.set(key, new Set());
			}

			mountedAreas.get(key).forEach((instance) => {
				instance.setActiveRenderer(false);
			});
			mountedAreas.get(key).add(this);
			this.setActiveRenderer(true);
		},
		unregisterArea(): void
		{
			const key = this.getAreaKey(this.entityId, this.entityType);
			const areas = mountedAreas.get(key);
			if (!areas)
			{
				return;
			}

			areas.delete(this);
			if (areas.size === 0)
			{
				mountedAreas.delete(key);
			}
			else
			{
				[...areas].pop().setActiveRenderer(true);
			}
		},
		setActiveRenderer(active: boolean): void
		{
			const wasInactive = !this.isActiveRenderer;
			this.isActiveRenderer = active;
			if (active && wasInactive)
			{
				this.editorRenderKey++;
			}
		},
		onFileAdd(): void
		{
			this.$emit('filesChange');
		},
		onFileRemove(): void
		{
			this.$emit('filesChange');
		},
		onEditorChange(): void
		{
			this.$emit('change');
		},
		onEditorBlur(): void
		{
			this.$emit('blur');
		},
		handleInsertFile(event: BaseEvent): void
		{
			const fileInfo = event.getData().item;

			this.entityTextEditor.insertFile(fileInfo);
		},
		getAreaKey(entityId: number | string, entityType: string): string
		{
			return `${entityType}:${entityId}`;
		},
	},
	template: `
		<div class="tasks-entity-text-area-wrapper" ref="editorWrapper">
			<TextEditorComponent v-if="isActiveRenderer" :key="editorRenderKey" :editorInstance="editor">
				<template v-if="filesCount > 0" #footer>
					<div class="tasks-entity-text-area-files" ref="filesWrapper">
						<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
					</div>
				</template>
			</TextEditorComponent>
		</div>
	`,
};

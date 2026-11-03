import { getFilesFromDataTransfer, hasDataTransferOnlyFiles } from 'ui.uploader.core';
import { Event, Type, type JsonObject } from 'main.core';

import { EventType } from 'im.v2.const';

import { Height } from '../const/size';

import type { EventEmitter } from 'main.core.events';
import type { ImModelChat } from 'im.v2.model';

import '../css/drop-area.css';

// @vue/component
export const DropArea = {
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		container: {
			type: Object,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			showDropArea: false,
			lastDropAreaEnterTarget: null,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		hasPinnedMessages(): boolean
		{
			return this.$store.getters['messages/pin/getPinned'](this.dialog.chatId).length > 0;
		},
		dropAreaStyles(): {[top: string]: string}
		{
			let offset = Height.dropAreaOffset + Height.chatHeader;
			if (this.hasPinnedMessages)
			{
				offset += Height.pinnedMessages;
			}

			return { top: `${offset}px` };
		},
	},
	watch:
	{
		container: {
			immediate: true,
			handler(container)
			{
				this.unbindEvents();
				if (Type.isElementNode(container))
				{
					this.bindEvents(container);
				}
			},
		},
	},
	beforeUnmount()
	{
		this.unbindEvents();
	},
	methods:
	{
		bindEvents(container: HTMLElement)
		{
			Event.bind(container, 'dragenter', this.onDragEnter);
			Event.bind(container, 'dragleave', this.onDragLeave);
			Event.bind(container, 'dragover', this.onDragOver);
			Event.bind(container, 'drop', this.onDrop);
			// the prop may point elsewhere by unbind time, so remember the node that actually got the listeners
			this.boundContainer = container;
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
		onDragLeave(event: DragEvent)
		{
			event.stopPropagation();
			event.preventDefault();

			if (this.lastDropAreaEnterTarget !== event.target)
			{
				return;
			}

			this.showDropArea = false;
		},
		onDragOver(event: DragEvent)
		{
			event.preventDefault();
		},
		async onDrop(event: DragEvent)
		{
			event.preventDefault();

			const files: File[] = await getFilesFromDataTransfer(event.dataTransfer);
			if (Type.isArrayFilled(files))
			{
				// the textarea owns the preview session: it validates the files and opens the popup
				this.getEmitter().emit(EventType.textarea.openUploadPreview, { dialogId: this.dialogId, files });
			}
			this.showDropArea = false;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<Transition name="drop-area-fade">
			<div
				v-if="showDropArea"
				:style="dropAreaStyles"
				class="bx-im-content-chat-drop-area__container bx-im-content-chat-drop-area__scope"
				data-testid="im-content-chat-drop-area"
			>
				<div class="bx-im-content-chat-drop-area__box">
					<span class="bx-im-content-chat-drop-area__icon"></span>
					<label class="bx-im-content-chat-drop-area__label-text">
						{{ loc('IM_CONTENT_DROP_AREA') }}
					</label>
				</div>
			</div>
		</Transition>
	`,
};

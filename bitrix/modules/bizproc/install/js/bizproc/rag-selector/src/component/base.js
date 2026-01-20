import { RagFileUploader } from './uploader';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { MessageBox } from 'ui.dialogs.messagebox';

import './css/style.css';

const MAX_DESCRIPTION_LENGTH = 500;
// @vue/component
export const KnowledgeBaseComponent = {
	name: 'KnowledgeBaseComponent',
	components: { RagFileUploader, BIcon },
	props: {
		/** @type KnowledgeBase */
		base: {
			type: Object,
			required: true,
		},
		saving: {
			type: Boolean,
			default: false,
		},
		error: {
			type: String,
			default: '',
		},
	},
	emits: ['updated', 'remove'],
	data(): { isEditing: boolean }
	{
		return {
			isEditing: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		getCounterValue(): string
		{
			const length = (this.base.description || '').length;

			return `${length}/${MAX_DESCRIPTION_LENGTH}`;
		},
	},
	created(): void
	{
		if (!this.base.uid)
		{
			this.isEditing = true;
		}
	},
	methods: {
		onNameInput(event: Event): void
		{
			this.emitUpdate('name', event.target.value);
		},
		onDescriptionInput(event: Event): void
		{
			let currentValue = event.target.value;

			if (currentValue.length > MAX_DESCRIPTION_LENGTH)
			{
				currentValue = currentValue.slice(0, MAX_DESCRIPTION_LENGTH);
				event.target.value = currentValue;
			}

			this.emitUpdate('description', currentValue);
		},
		onFilesChanged(fileIds: Array<string | number>): void
		{
			this.emitUpdate('fileIds', fileIds);
		},
		emitUpdate(name: string, value: string | Array<string | number>): void
		{
			this.$emit('updated', { name, value });
		},
		switchToEditMode(): void
		{
			if (!this.saving)
			{
				this.isEditing = true;
			}
		},
		showConfirmPopup(): void
		{
			const popup = new MessageBox({
				message: this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_DELETE_CONFIRM'),
				modal: true,
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				onOk: (messageBox) => {
					this.$emit('remove');
					messageBox.close();
				},
				okCaption: this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_DELETE_OK'),
				onCancel: (messageBox) => {
					messageBox.close();
				},
				useAirDesign: true,
				maxWidth: 300,
			});
			popup.show();
		},
	},
	template: `
		<div class="bizproc-rag-selector__base" :class="{'--view': !isEditing}">
			<BIcon
				:name="OutlineIcons.CROSS_L"
				:hoverable="true"
				:size="20"
				color="#a8adb4"
				@click="showConfirmPopup()"
				data-test-id="bizproc-rag-selector__knowledge-delete-btn"
				class="bizproc-rag-selector__base-remove-icon"
			/>
			<template v-if="isEditing">
				<div v-if="error" class="bizproc-rag-selector__base-error">
					<span class="ui-alert-message">{{ error }}</span>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-label --required">
						<div class="ui-ctl-label-text bizproc-setup-template__label-text">
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_NAME_LABEL') }}
						</div>
					</div>
					<div class="ui-form-content">
						<div class="ui-ctl ui-ctl-w100">
							<input 
								type="text" 
								class="ui-ctl-element"
								:value="base.name"
								:disabled="saving"
								:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_NAME_PLACEHOLDER')"
								@input="onNameInput"
								data-test-id="bizproc-rag-selector__name-field"
							/>
						</div>
					</div>
				</div>
				<div class="ui-form-row">
					<div class="ui-form-label --required">
						<div class="ui-ctl-label-text">
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_DESCRIPTION_LABEL') }}
						</div>
					</div>
					<div class="ui-form-content">
						<div class="bizproc-setup-template__textarea-wrapper">
							<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
								<textarea
									class="ui-ctl-element"
									:value="base.description"
									:disabled="saving"
									:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_DESCRIPTION_PLACEHOLDER')"
									@input="onDescriptionInput"
									data-test-id="bizproc-rag-selector__description-field"
								></textarea>
							</div>
							<div class="bizproc-rag-selector__char-counter">
								{{ getCounterValue }}
							</div>
						</div>
					</div>
				</div>
				<div class="ui-form-row --uploader">
					<div class="ui-form-label --required">
						<div class="ui-ctl-label-text">
							{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_FILE_LABEL') }}
						</div>
					</div>
					<div class="bizproc-rag-selector__base-text">
						{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_FILE_DESC') }}
					</div>
					<RagFileUploader
						:key="base.uid"
						:readonly="saving"
						:knowledgeBaseUid="base.uid"
						:fileIds="base.fileIds"
						:fileIdsReplaces="base.fileIdsReplaces"
						@filesChanged="onFilesChanged"
					/>
				</div>
			</template>
			<template v-else>
				<div v-if="error" class="bizproc-rag-selector__base-error">
					<span class="ui-alert-message">{{ error }}</span>
				</div>
				<div class="ui-ctl-label-text">
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_NAME_VIEW') }}
				</div>
				<div class="bizproc-rag-selector__base-view-title" @click="switchToEditMode">{{ base.name }}</div>
				<div class="bizproc-rag-selector__base-view-desc">{{ base.description }}</div>
			</template>
		</div>
	`,
};

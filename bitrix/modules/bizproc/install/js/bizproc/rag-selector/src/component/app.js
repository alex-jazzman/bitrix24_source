import { Extension, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import 'ui.alerts';
import 'ui.forms';
import 'ui.layout-form';
import { KnowledgeBaseApi } from '../api';

import type { KnowledgeBase } from '../types';
import { deepEqual } from '../utils';
import { KnowledgeBaseComponent } from './base';

const BEFORE_SUBMIT_EVENT = 'Bizproc:SetupTemplate:beforeSubmit';

const ErrorTypes = Object.freeze({
	REQUIRED: 'required',
	LOADING: 'loading',
});

// @vue/component
export const RagAppComponent = {
	name: 'RagAppComponent',
	components: { KnowledgeBaseComponent, UiButton },
	props: {
		/** @type Array<KnowledgeBase> */
		existedKnowledgeBases: {
			type: Array,
			default: () => [],
		},
		modelValue: {
			type: [Array, String],
			default: () => [],
		},
		isMultiple: {
			type: Boolean,
			default: false,
		},
		isRequired: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	data(): {
		errorMessage: string,
		isSaving: boolean,
		isLoading: boolean,
		bases: Array<KnowledgeBase>,
		errorType: ?string,
		baseErrors: Array<string>,
		}
	{
		return {
			bases: this.existedKnowledgeBases ?? [],
			isSaving: false,
			isLoading: false,
			errorType: null,
			errorMessage: '',
			baseErrors: [],
		};
	},
	computed: {
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		buttonAddBaseText(): string
		{
			return this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_ADD_KNOWLEDGE_BASE_BUTTON_TEXT');
		},
		isRagAvailable(): boolean
		{
			const settings = Extension.getSettings('bizproc.rag-selector');

			return settings.get('isAvailable', false);
		},
		basesCount(): number
		{
			return this.bases.length;
		},
		maxBasesCount(): number
		{
			if (this.isMultiple)
			{
				const settings = Extension.getSettings('bizproc.rag-selector');

				return settings.get('maxBasesCountPerField', 1);
			}

			return 1;
		},
		showAddButton(): boolean
		{
			return this.basesCount < this.maxBasesCount;
		},
		loadingErrorText(): string
		{
			if (this.errorType === ErrorTypes.LOADING)
			{
				return this.errorMessage;
			}

			return '';
		},
		isRequiredError(): boolean
		{
			return this.errorType === ErrorTypes.REQUIRED;
		},
	},
	watch: {
		modelValue(newIds: string | Array<string>, oldIds: string | Array<string>): void
		{
			if (!deepEqual(newIds, oldIds))
			{
				this.loadInitialBases();
			}
		},
		bases: {
			handler(): void
			{
				this.clearError();
			},
			deep: true,
		},
	},
	async mounted(): void
	{
		EventEmitter.subscribe(BEFORE_SUBMIT_EVENT, this.onSendAll);

		const slider = BX.SidePanel.Instance.getTopSlider();
		if (slider)
		{
			EventEmitter.subscribe(slider, 'SidePanel.Slider:onClose', this.cleanupSubscriptions);
		}

		await this.loadInitialBases();
	},
	beforeUnmount(): void
	{
		this.cleanupSubscriptions();
	},

	methods: {
		async loadInitialBases(): Promise<void>
		{
			const initialValues = Type.isArray(this.modelValue) ? this.modelValue : [this.modelValue];

			const idsToLoad = initialValues.filter(Boolean);

			if (idsToLoad.length === 0)
			{
				return;
			}

			this.isLoading = true;
			try
			{
				const promises = idsToLoad.map((uid) => KnowledgeBaseApi.get(uid));
				this.bases = await Promise.all(promises);
			}
			catch (error)
			{
				this.errorMessage = this.getErrorFromResponse(error);
				this.errorType = ErrorTypes.LOADING;
			}
			finally
			{
				this.isLoading = false;
			}
		},
		getErrorFromResponse(response: Object): string
		{
			if (!response.errors)
			{
				return '';
			}

			if (!Type.isArrayFilled(response.errors))
			{
				return this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_LOAD_BASES_ERROR');
			}

			const [firstError] = response.errors;

			return firstError.message;
		},
		onAddBase(): void
		{
			this.bases.push(this.makeEmptyKnowledgeBase());
		},
		makeEmptyKnowledgeBase(): KnowledgeBase
		{
			return {
				uid: '',
				name: '',
				description: '',
				fileIds: [],
				fileIdsReplaces: null,
			};
		},
		onBasePropertyUpdated(index: number, changed: {name: string, value: any}): void
		{
			if (!this.bases[index])
			{
				return;
			}

			const baseToUpdate = this.bases[index];
			const currentValue = baseToUpdate[changed.name];

			if (deepEqual(currentValue, changed.value))
			{
				return;
			}

			const newErrors = [...this.baseErrors];
			if (newErrors[index])
			{
				newErrors[index] = '';
			}
			this.baseErrors = newErrors;

			baseToUpdate[changed.name] = changed.value;
		},
		onBaseRemove(index: number): void
		{
			this.bases.splice(index, 1);
			this.clearError();
		},
		emitIds(): void
		{
			const savedUids = this.bases.map((base) => base.uid).filter(Boolean);

			this.$emit('update:modelValue', savedUids);
		},
		validate(): boolean
		{
			this.clearError();
			const errors = [];
			let isAllValid = true;

			if (this.isRequired && this.bases.length === 0)
			{
				this.errorMessage = this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_VALIDATION_REQUIRED');
				this.errorType = ErrorTypes.REQUIRED;

				return false;
			}

			this.bases.forEach((base, index) => {
				if (this.isBaseIncomplete(base))
				{
					errors[index] = this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_VALIDATION_INCOMPLETE');
					isAllValid = false;
				}
				else
				{
					errors[index] = '';
				}
			});

			this.baseErrors = errors;

			return isAllValid;
		},
		isBaseIncomplete(base: KnowledgeBase): boolean
		{
			return (
				!Type.isString(base.name) || base.name.trim() === ''
				|| !Type.isString(base.description) || base.description.trim() === ''
				|| !Type.isArrayFilled(base.fileIds)
			);
		},
		async onSendAll(): Promise<boolean>
		{
			if (!this.validate())
			{
				return false;
			}

			this.isSaving = true;
			try
			{
				for (let i = 0; i < this.bases.length; i++)
				{
					const baseToSave = this.bases[i];
					// eslint-disable-next-line no-await-in-loop
					const savedBase = await this.saveBase(baseToSave);

					const currentBases = [...this.bases];
					currentBases[i] = savedBase;
					this.bases = currentBases;
				}

				this.emitIds();
			}
			finally
			{
				this.isSaving = false;
			}

			return true;
		},
		saveBase(base: KnowledgeBase): Promise<void>
		{
			if (base.uid)
			{
				return this.updateBase(base);
			}

			return this.createBase(base);
		},
		async createBase(base: KnowledgeBase): Promise<void>
		{
			const modifyResult = await KnowledgeBaseApi.create(base.name, base.description, base.fileIds);

			return {
				...base,
				fileIds: modifyResult.fileIds,
				uid: modifyResult.uid,
				fileIdsReplaces: modifyResult.fileIdsReplaces,
			};
		},
		async updateBase(base: KnowledgeBase): Promise<void>
		{
			const modifyResult = await KnowledgeBaseApi.update(base.uid, base.name, base.description, base.fileIds);

			return {
				...base,
				fileIds: modifyResult.fileIds,
				fileIdsReplaces: modifyResult.fileIdsReplaces,
			};
		},
		clearError(): void
		{
			this.errorType = null;
			this.errorMessage = '';
			this.baseErrors = [];
		},
		cleanupSubscriptions(): void
		{
			EventEmitter.unsubscribe(BEFORE_SUBMIT_EVENT, this.onSendAll);

			const slider = BX.SidePanel.Instance.getTopSlider();
			if (slider)
			{
				EventEmitter.unsubscribe(slider, 'SidePanel.Slider:onClose', this.cleanupSubscriptions);
			}
		},
	},
	template: `
		<div v-if="!isRagAvailable" class="ui-alert ui-alert-danger">
			<span class="ui-alert-message">{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_NOT_AVAILABLE_ERROR') }}</span>
		</div>
		<template v-else>
			<div v-if="loadingErrorText" class="ui-alert ui-alert-danger">
				<span class="ui-alert-message">{{ loadingErrorText }}</span>
			</div>
			<KnowledgeBaseComponent
				v-for="(base, index) in bases"
				:key="base.uid"
				:base="base"
				:saving="isSaving"
				:error="baseErrors[index] ?? ''"
				@updated="onBasePropertyUpdated(index, $event)"
				@remove="onBaseRemove(index)"
			/>
			<UiButton
				v-if="showAddButton"
				:text="buttonAddBaseText" 
				:disabled="isSaving"
				:style="AirButtonStyle.OUTLINE_ACCENT_2"
				:size="ButtonSize.SMALL"
				@click="onAddBase"
				type="button"
			/>
			<div v-if="isRequiredError" class="bizproc-setup-template__error-text">
				<div class="ui-icon-set --warning"></div>
				{{ errorMessage }}
			</div>
		</template>
	`,
};

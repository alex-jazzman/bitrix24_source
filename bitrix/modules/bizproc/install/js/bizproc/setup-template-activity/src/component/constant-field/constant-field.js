import { BIcon } from 'ui.icon-set.api.vue';
import { Outline, Main } from 'ui.icon-set.api.core';
import './constant-field.css';
import type { ConstantConfiguration } from '../../types';

// @vue/component
export const ConstantField = {
	name: 'ConstantField',
	components: {
		BIcon,
	},
	props: {
		/** @type TitleItem */
		item: {
			type: Object,
			required: true,
		},
		/** @type ConstantConfiguration[] */
		constantConfigurationList: {
			type: Array,
			required: true,
		},
	},
	emits: ['delete', 'updateItemProperty', 'edit', 'itemDragStart'],
	setup(): { [string]: string }
	{
		return {
			Outline,
			Main,
		};
	},
	computed: {
		typeLabel(): string
		{
			return this.constantConfigurationList
				.find((constantConfiguration: ConstantConfiguration) => constantConfiguration.type === this.item.constantType)
				?.title
			?? this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TYPE_UNSUPPORTED');
		},
		titleWithType(): string
		{
			return this.$Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_CONSTANT_ITEM_TITLE', {
				'#NAME#': this.item.name,
				'#TYPE#': this.typeLabel,
			});
		},
	},
	methods: {
		onInput(event: Event): void
		{
			const payload: UpdateItemPropertyEventPayload = {
				propertyValues: {
					default: event.target.value,
				},
			};
			this.$emit('updateItemProperty', payload);
		},
		onEdit(): void
		{
			this.$emit('edit');
		},
		handleDragStart(event: Event): void
		{
			this.$emit('itemDragStart', {
				event,
				element: this.$el,
			});
		},
	},
	template: `
		<div class="bizproc-setuptemplateactivity-field-wrapper">
			<div
				class="bizproc-setuptemplateactivity-field-drag-icon"
				@mousedown.prevent="handleDragStart"
			>
				<BIcon :name="Main.MORE_POINTS" :size="18"/>
			</div>
			<div class="bizproc-setuptemplateactivity-constant-edit">
				<div class="bizproc-setuptemplateactivity-constant-edit__wrap">
					<div class="bizproc-setuptemplateactivity-constant-edit__input-control ui-ctl-container">
						<div class="ui-ctl-top">
							<div class="ui-ctl-title">
								{{ titleWithType }}
							</div>
						</div>
						<div class="ui-ctl ui-ctl-w100">
							<input
								:value="item.default"
								class="ui-ctl-element"
								type="text"
								@input="onInput"
							/>
						</div>
					</div>
					<div class="bizproc-setuptemplateactivity-constant-edit__btn-control">
						<BIcon
							:name="Outline.EDIT_L"
							:size="18"
							class="bizproc-setuptemplateactivity-constant-edit__control-icon"
							@click="onEdit"
						/>
						<BIcon
							:name="Outline.CROSS_L"
							:size="18"
							class="bizproc-setuptemplateactivity-constant-edit__control-icon"
							@click="$emit('delete')"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
};

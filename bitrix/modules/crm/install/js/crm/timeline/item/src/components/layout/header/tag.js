import { Dom, Text, Type } from 'main.core';
import { Label, LabelSize, LabelStyle } from 'ui.system.label';
import { hint } from 'ui.vue3.directives.hint';

import { Action } from '../../../action';
import { TagType } from '../../enums/tag-type';

export const Tag = {
	directives: { hint },
	props: {
		title: {
			type: String,
			required: false,
			default: '',
		},
		hint: {
			type: String,
			required: false,
			default: '',
		},
		action: {
			type: Object,
			required: false,
			default: null,
		},
		type: {
			type: String,
			required: false,
			default: TagType.SECONDARY,
		},
		state: String,
		tagId: {
			type: String,
			required: false,
			default: '',
		},
	},
	computed:
	{
		className(): Object
		{
			return {
				'crm-timeline__card-status': true,
				'--clickable': Boolean(this.action),
				'--hint': Boolean(this.hint),
			};
		},

		tagTypeToLabelStyleDict(): Object
		{
			return {
				[TagType.PRIMARY]: LabelStyle.TINTED,
				[TagType.SECONDARY]: LabelStyle.TINTED_NO_ACCENT,
				[TagType.LAVENDER]: LabelStyle.TINTED_VIOLET,
				[TagType.AI]: LabelStyle.TINTED_BITRIX_GPT,
				[TagType.SUCCESS]: LabelStyle.TINTED_SUCCESS,
				[TagType.WARNING]: LabelStyle.TINTED_WARNING,
				[TagType.FAILURE]: LabelStyle.TINTED_ALERT,
			};
		},

		tagContainerRef(): HTMLDivElement
		{
			return this.$refs.tag;
		},

		hintOptions(): ?Object
		{
			if (!Type.isStringFilled(this.hint))
			{
				return null;
			}

			return {
				text: Text.encode(this.hint),
				popupOptions: {
					offsetTop: 5,
				},
			};
		},
	},
	methods:
	{
		getLabelStyleFromTagType(tagType): String
		{
			const lowerCaseTagType = tagType ? tagType.toLowerCase() : '';

			return this.tagTypeToLabelStyleDict[lowerCaseTagType] || LabelStyle.TINTED_NO_ACCENT;
		},

		// eslint-disable-next-line consistent-return
		renderTag(tagOptions): HTMLElement | null
		{
			if (!tagOptions || !this.tagContainerRef)
			{
				return null;
			}

			const { title, type } = tagOptions;

			const labelText = title && Type.isString(title) ? title : '';
			const label = new Label({
				value: labelText,
				style: this.getLabelStyleFromTagType(type),
				size: LabelSize.MD,
			});

			Dom.clean(this.tagContainerRef);
			Dom.append(label.render(), this.tagContainerRef);
		},

		executeAction(): void
		{
			if (!this.action)
			{
				return;
			}

			const action = new Action(this.action);
			action.execute(this);
		},
	},

	mounted(): void
	{
		this.renderTag({ title: this.title, type: this.type });
	},

	updated(): void
	{
		this.renderTag({ title: this.title, type: this.type });
	},

	template: `
		<div
			:class="className"
			v-hint="hintOptions"
			ref="tag"
			@click="executeAction"
			:data-tag-id="tagId"
			data-hint-interactivity
		></div>
	`,
};

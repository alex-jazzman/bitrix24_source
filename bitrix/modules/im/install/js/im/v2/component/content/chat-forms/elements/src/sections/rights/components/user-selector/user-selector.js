import { ChatHint } from 'im.v2.component.elements.hint';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { FieldRow } from '../../../../elements/field-row/field-row';

// @vue/component
export const UserSelector = {
	name: 'UserSelector',
	components: { ChatHint, FieldRow },
	props:
	{
		name: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		hintText: {
			type: String,
			required: false,
			default: '',
		},
	},
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		// The ids of the legacy branch: there the heading is drawn here and not by the row, so the
		// pair the slot gets has to be built here as well. In air they come from the row itself.
		controlId(): string
		{
			return `im-chat-form-field-${this.name}`;
		},
		labelId(): string
		{
			return `${this.controlId}-label`;
		},
	},
	// FieldRow marks the air row itself, so the legacy wrapper repeats the same row identifier:
	// a test reaches the control the same way in both branches. The slotted selector is named by the
	// caption of the field, so both branches hand the ids of the row over to it.
	template: `
		<FieldRow
			v-if="isAirDesignEnabled"
			:name="name"
			:label="title"
			:hint="hintText"
			v-slot="{ controlId, labelId }"
		>
			<slot :controlId="controlId" :labelId="labelId"/>
		</FieldRow>
		<div v-else class="bx-im-content-create-chat__section_block" :data-testid="'field-' + name">
			<div class="bx-im-content-create-chat__section-header">
				<div :id="labelId" class="bx-im-content-create-chat__section-heading">
					{{ title }}
				</div>
				<ChatHint v-if="hintText" :text="hintText" />
			</div>
			<slot :controlId="controlId" :labelId="labelId"/>
		</div>
	`,
};

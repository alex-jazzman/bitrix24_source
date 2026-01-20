import { Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.vue';

// @vue/component
export const CheckListStub = {
	name: 'CheckListStub',
	components: {
		UiButton,
	},
	emits: ['click'],
	setup(): Object
	{
		return {
			ButtonSize,
			Outline,
		};
	},
	template: `
		<div class="check-list-stub">
			<div class="check-list-stub-icon"/>
			<div class="check-list-stub-title">
				{{ loc('TASKS_V2_CHECK_LIST_STUB_TITLE') }}
			</div>
			<div class="check-list-stub-btn">
				<UiButton
					:text="loc('TASKS_V2_CHECK_LIST_STUB_BTN')"
					:size="ButtonSize.MEDIUM"
					:leftIcon="Outline.PLUS_L"
					@click="$emit('click')"
				/>
			</div>
		</div>
	`,
};

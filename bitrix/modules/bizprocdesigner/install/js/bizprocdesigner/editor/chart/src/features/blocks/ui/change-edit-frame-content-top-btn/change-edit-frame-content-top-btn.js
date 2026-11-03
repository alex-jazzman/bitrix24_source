import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';

import { IconButton } from '../../../../shared/ui';
import { useEditFrameContent } from '../../composables/use-edit-frame-content';

// @vue/component
export const ChangeEditFrameContentTopBtn = {
	name: 'ChangeEditFrameContentTopBtn',
	components: {
		IconButton,
	},
	props: {
		blockId: {
			type: String,
			required: true,
		},
	},
	setup(): {...}
	{
		const { editFrameContent } = useEditFrameContent();

		return {
			iconSet: Outline,
			editFrameContent,
		};
	},
	computed: {
		// the button carries an icon only, so its name comes from the phrase
		accessibleName(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_FRAME_BLOCK_EDIT_CONTENT_ARIA_LABEL');
		},
	},
	methods: {
		onChangeEditFrameContent(): void
		{
			this.editFrameContent(this.blockId);
		},
	},
	template: `
		<IconButton
			:icon-name="iconSet.EDIT_L"
			:color="'var(--ui-color-palette-gray-40)'"
			:aria-label="accessibleName"
			:data-test-id="$testId('blockFrameEdit', blockId)"
			@click="onChangeEditFrameContent"
			@mousedown.stop
			@mouseup.stop
		/>
	`,
};

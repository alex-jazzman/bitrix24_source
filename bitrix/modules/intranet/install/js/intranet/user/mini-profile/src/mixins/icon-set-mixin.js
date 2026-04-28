import { Set, Outline, Solid } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.icon-set.solid';

// @vue/mixin
export const IconSetMixin = {
	computed: {
		set: () => Set,
		outlineSet: () => Outline,
		solidSet: () => Solid,
	},
};

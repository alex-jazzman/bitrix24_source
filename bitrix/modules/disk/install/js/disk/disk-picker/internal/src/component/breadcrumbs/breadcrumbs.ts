import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';
import { TextSm } from 'ui.system.typography.vue';

import { openBreadcrumb } from '../../feature/open-folder/open-folder';
import { useSessionStore } from '../../model/session/session';
import { type DisplayBreadcrumb } from '../../model/session/types';

import './breadcrumbs.css';

// The design system has no breadcrumb component: ancestor links, separators and
// a non-interactive current folder name are rendered here. The backend returns
// only ancestors in `breadcrumbs`; the current folder is the last display crumb.
//
// A deep path is collapsed to keep the header usable and leave room for the search:
// at most three items are shown - an ellipsis crumb for the grandparent (no
// name, clickable, leads to it), the parent folder by name, and the current folder.
// So a single jump goes up one or two levels; shorter paths (root disk / one folder)
// show every crumb by name. Each item is width-bounded and ellipsised, never
// truncated by character count, with the full name in its title.
export const Breadcrumbs = defineComponent({
	name: 'DiskPickerBreadcrumbs',
	components: {
		TextSm,
	},
	computed: {
		crumbs(): DisplayBreadcrumb[]
		{
			return useSessionStore().breadcrumbs;
		},
		// The grandparent of the current folder, shown as the ellipsis crumb when the
		// path is three levels or deeper. `null` for shorter paths, where every crumb is named.
		overflowCrumb(): DisplayBreadcrumb | null
		{
			return this.crumbs.length >= 3 ? this.crumbs[this.crumbs.length - 3] : null;
		},
		// The named, clickable ancestors between the optional ellipsis crumb and the
		// current folder: just the parent when collapsed, all ancestors otherwise.
		linkCrumbs(): DisplayBreadcrumb[]
		{
			if (this.crumbs.length >= 3)
			{
				return [this.crumbs[this.crumbs.length - 2]];
			}

			return this.crumbs.slice(0, -1);
		},
		current(): DisplayBreadcrumb | null
		{
			return this.crumbs.length > 0 ? this.crumbs[this.crumbs.length - 1] : null;
		},
	},
	methods: {
		loc(messageCode: string, replacements?: { [key: string]: string }): string
		{
			return Loc.getMessage(messageCode, replacements) ?? '';
		},
		navigateLabel(crumb: DisplayBreadcrumb): string
		{
			return this.loc('DISK_PICKER_BREADCRUMB_NAVIGATE', { '#NAME#': crumb.name });
		},
		handleAncestor(crumb: DisplayBreadcrumb): void
		{
			void openBreadcrumb(crumb, useSessionStore().callbacks);
		},
	},
	template: `
		<nav class="disk-picker-breadcrumbs" data-testid="universal-disk-picker-breadcrumbs">
			<template v-if="overflowCrumb">
				<button
					type="button"
					class="disk-picker-breadcrumbs__link disk-picker-breadcrumbs__overflow"
					:title="overflowCrumb.name"
					:aria-label="navigateLabel(overflowCrumb)"
					data-testid="universal-disk-picker-breadcrumb-overflow"
					@click="handleAncestor(overflowCrumb)"
				>&hellip;</button>
				<span class="disk-picker-breadcrumbs__separator" aria-hidden="true">&rsaquo;</span>
			</template>
			<template v-for="crumb in linkCrumbs" :key="crumb.objectId">
				<button
					type="button"
					class="disk-picker-breadcrumbs__link"
					:title="crumb.name"
					:aria-label="navigateLabel(crumb)"
					data-testid="universal-disk-picker-breadcrumb-link"
					@click="handleAncestor(crumb)"
				>
					<TextSm class="disk-picker-breadcrumbs__label">{{ crumb.name }}</TextSm>
				</button>
				<span class="disk-picker-breadcrumbs__separator" aria-hidden="true">&rsaquo;</span>
			</template>
			<TextSm
				v-if="current"
				class="disk-picker-breadcrumbs__current"
				:title="current.name"
			>{{ current.name }}</TextSm>
		</nav>
	`,
});

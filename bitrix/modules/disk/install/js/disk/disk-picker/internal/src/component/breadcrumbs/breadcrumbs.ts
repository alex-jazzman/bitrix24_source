import { Loc } from 'main.core';
import { defineComponent } from 'ui.vue3';
import { HeadlineSm, TextSm } from 'ui.system.typography.vue';

import { openBreadcrumb } from '../../feature/open-folder/open-folder';
import { useSessionStore } from '../../model/session/session';
import { type DisplayBreadcrumb } from '../../model/session/types';

import './breadcrumbs.css';

// The design system has no breadcrumb component: ancestor links, separators and
// a non-interactive current folder name are rendered here. The backend returns
// only ancestors in `breadcrumbs`; the current folder is the last display crumb.
//
// A deep path is collapsed to keep the header usable and leave room for the search.
// Up to three items are shown by name. A deeper path keeps the root visible, then
// shows a clickable ellipsis for the closest hidden ancestor, the parent folder and
// the current folder. Each item is width-bounded and ellipsised, never truncated by
// character count, with the full name in its title.
//
// The storage root has no path: its lone crumb is the header of the whole view, so it
// is set in the headline size and shown in full. Once a path appears, every crumb,
// the current folder included, drops to the smaller text size and is width-bounded.
export const Breadcrumbs = defineComponent({
	name: 'DiskPickerBreadcrumbs',
	components: {
		HeadlineSm,
		TextSm,
	},
	computed: {
		crumbs(): DisplayBreadcrumb[]
		{
			return useSessionStore().breadcrumbs;
		},
		// A deep path keeps its root as a named, clickable crumb before the ellipsis.
		rootCrumb(): DisplayBreadcrumb | null
		{
			return this.crumbs.length > 3 ? this.crumbs[0] : null;
		},
		// All ancestors hidden between the visible root and the visible parent.
		hiddenCrumbs(): DisplayBreadcrumb[]
		{
			return this.crumbs.length > 3 ? this.crumbs.slice(1, -2) : [];
		},
		// The closest hidden ancestor, shown as the ellipsis crumb only when more than
		// three levels exist. Shallower paths keep every crumb named.
		overflowCrumb(): DisplayBreadcrumb | null
		{
			return this.hiddenCrumbs.length > 0
				? this.hiddenCrumbs[this.hiddenCrumbs.length - 1]
				: null;
		},
		// The named, clickable ancestors between the optional ellipsis crumb and the
		// current folder: just the parent for a deep path, all ancestors otherwise.
		linkCrumbs(): DisplayBreadcrumb[]
		{
			if (this.crumbs.length > 3)
			{
				return [this.crumbs[this.crumbs.length - 2]];
			}

			return this.crumbs.slice(0, -1);
		},
		current(): DisplayBreadcrumb | null
		{
			return this.crumbs.length > 0 ? this.crumbs[this.crumbs.length - 1] : null;
		},
		// A single crumb means the storage root: there is no path above the current folder.
		hasPath(): boolean
		{
			return this.crumbs.length > 1;
		},
		currentTypography(): string
		{
			return this.hasPath ? 'TextSm' : 'HeadlineSm';
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
		// ALG-01: a mouse click also focuses the button, so only `detail === 0` (keyboard) arms it.
		handleAncestor(crumb: DisplayBreadcrumb, event?: MouseEvent): void
		{
			const keyboardActivated = event === undefined || event.detail === 0;
			if (
				keyboardActivated
				&& event?.currentTarget instanceof HTMLElement
				&& event.currentTarget === document.activeElement
			)
			{
				useSessionStore().requestFocusHandoffToFiles();
			}

			void openBreadcrumb(crumb, useSessionStore().callbacks);
		},
		handleOverflow(event?: MouseEvent): void
		{
			const closestHiddenCrumb = this.hiddenCrumbs[this.hiddenCrumbs.length - 1];
			if (closestHiddenCrumb)
			{
				this.handleAncestor(closestHiddenCrumb, event);
			}
		},
	},
	template: `
		<nav class="disk-picker-breadcrumbs" data-testid="universal-disk-picker-breadcrumbs">
			<template v-if="rootCrumb">
				<button
					type="button"
					class="disk-picker-breadcrumbs__link"
					:title="rootCrumb.name"
					:aria-label="navigateLabel(rootCrumb)"
					data-testid="universal-disk-picker-breadcrumb-root"
					@click="handleAncestor(rootCrumb, $event)"
				>
					<TextSm class="disk-picker-breadcrumbs__label">{{ rootCrumb.name }}</TextSm>
				</button>
				<span class="disk-picker-breadcrumbs__separator" aria-hidden="true">&rsaquo;</span>
			</template>
			<template v-if="overflowCrumb">
				<button
					type="button"
					class="disk-picker-breadcrumbs__link disk-picker-breadcrumbs__overflow"
					:title="overflowCrumb.name"
					:aria-label="navigateLabel(overflowCrumb)"
					data-testid="universal-disk-picker-breadcrumb-overflow"
					@click="handleOverflow($event)"
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
					@click="handleAncestor(crumb, $event)"
				>
					<TextSm class="disk-picker-breadcrumbs__label">{{ crumb.name }}</TextSm>
				</button>
				<span class="disk-picker-breadcrumbs__separator" aria-hidden="true">&rsaquo;</span>
			</template>
			<component
				:is="currentTypography"
				v-if="current"
				class="disk-picker-breadcrumbs__current"
				:title="current.name"
			>{{ current.name }}</component>
		</nav>
	`,
});

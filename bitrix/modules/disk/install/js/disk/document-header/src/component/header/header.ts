import { Loc } from 'main.core';
import { HeadlineMd } from 'ui.system.typography.vue';
import { defineComponent } from 'ui.vue3';
import { mapState } from 'ui.vue3.pinia';

import { HeaderElement } from '../../const/element';
import { HeaderTestId } from '../../const/testid';
import {
	HeaderWidthLevel,
	observeContainerWidth,
	resolveAdaptation,
	type WidthAdaptation,
} from '../../lib/container-width/container-width';
import { useCompositionStore } from '../../model/composition/composition';
import { ActionBar } from '../action-bar/action-bar';
import { BoostSlot } from '../boost-slot/boost-slot';
import { ContentWarning } from '../content-warning/content-warning';
import { EditAction } from '../edit-action/edit-action';
import { ObjectName } from '../object-name/object-name';
import { PresenceStack } from '../presence-stack/presence-stack';
import { SaveStatusIndicator } from '../save-status-indicator/save-status-indicator';

import './header.css';

type LogoAttributes = {
	href?: string,
	target?: string,
	rel?: string,
	role?: string,
};

type HeaderState = {
	adaptation: WidthAdaptation,
	unobserve: (() => void) | null,
};

/**
 * The header of the viewer: the logo, the name of the object, the actions and the mount point of the
 * boosts. It measures the width it actually got - the header lives on a full page and inside a slider
 * alike - and gives up the captions of the buttons before anything else.
 */
export const Header = defineComponent({
	name: 'DiskDocumentHeader',
	components: {
		ActionBar,
		BoostSlot,
		ContentWarning,
		EditAction,
		HeadlineMd,
		ObjectName,
		PresenceStack,
		SaveStatusIndicator,
	},
	props: {
		documentSessionHash: {
			type: String,
			default: '',
		},
		boostContainerId: {
			type: String,
			required: true,
		},
		/**
		 * The address of the logo depends on the surface and on the way the object was opened, so it is
		 * given by the shell which mounts the header. Without it the logo stays a plain mark.
		 */
		logoUrl: {
			type: String,
			default: '',
		},
	},
	setup(): Object
	{
		return {
			HeaderTestId,
		};
	},
	data(): HeaderState
	{
		return {
			adaptation: resolveAdaptation(0),
			unobserve: null,
		};
	},
	computed: {
		...mapState(useCompositionStore, ['hasElement']),
		hasLogo(): boolean
		{
			return this.hasElement(HeaderElement.Logo);
		},
		logoTag(): string
		{
			return this.logoUrl === '' ? 'div' : 'a';
		},
		logoAttributes(): LogoAttributes
		{
			return this.logoUrl === ''
				? { role: 'img' }
				: { href: this.logoUrl, target: '_blank', rel: 'noopener' }
			;
		},
		logoLabel(): string
		{
			return Loc.getMessage('DISK_DOCUMENT_HEADER_LOGO_LABEL') ?? '';
		},
		/** The tightest container gives up the spacing of the mockups along with the words. */
		isCompact(): boolean
		{
			return this.adaptation.level === HeaderWidthLevel.Essential;
		},
	},
	mounted(): void
	{
		if (this.$el instanceof HTMLElement)
		{
			this.unobserve = observeContainerWidth(this.$el, (adaptation: WidthAdaptation) => {
				this.adaptation = adaptation;
			});
		}
	},
	beforeUnmount(): void
	{
		this.unobserve?.();
		this.unobserve = null;
	},
	template: `
		<div
			class="disk-document-header"
			:class="{ '--compact': isCompact }"
			:data-testid="HeaderTestId.Root"
		>
			<div class="disk-document-header__start">
				<template v-if="hasLogo">
					<component
						:is="logoTag"
						v-bind="logoAttributes"
						class="disk-document-header__logo"
						:data-testid="HeaderTestId.Logo"
						:aria-label="logoLabel"
					>
						<HeadlineMd
							v-if="adaptation.showLogoName"
							tag="span"
							class="disk-document-header__logo-name"
						>{{ logoLabel }}</HeadlineMd>
						<span class="disk-document-header__logo-clock" aria-hidden="true"></span>
					</component>
					<div class="disk-document-header__divider"></div>
				</template>
				<ObjectName :documentSessionHash="documentSessionHash"/>
				<ContentWarning/>
				<SaveStatusIndicator/>
			</div>
			<div class="disk-document-header__end">
				<BoostSlot :containerId="boostContainerId"/>
				<EditAction :showCaption="adaptation.showEditCaption"/>
				<PresenceStack/>
				<ActionBar :showCaptions="adaptation.showButtonCaptions"/>
			</div>
		</div>
	`,
});

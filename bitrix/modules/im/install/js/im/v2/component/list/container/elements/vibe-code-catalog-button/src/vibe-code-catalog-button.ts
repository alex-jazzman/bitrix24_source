import { Extension } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { defineComponent } from 'ui.vue3';

import { Layout, type LayoutType } from 'im.v2.const';

import './vibe-code-catalog-button.css';

type State = {
	isActive: boolean;
	counter: number;
};

/** Event names of the cross-module contract documented on {@link VibeCodeCatalogButton}. */
const CatalogEvent = {
	request: 'im:vibe-code-catalog:request',
	stateChanged: 'im:vibe-code-catalog:state-changed',
} as const;

const ICON_NAME = OutlineIcons.VIBECODE_CATALOG;
const COUNTER_DISPLAY_LIMIT = 99;
const AVAILABLE_LAYOUTS = new Set([Layout.chat, Layout.notification]);

/**
 * Cross-module event contract consumed by the vibecodeconnector.im-button-binder
 * extension (feature vibecodeconnector.catalog). The event names below and the
 * `data-bx-vibe-code-catalog-events` DOM marker are mirrored on the vibecodeconnector
 * side -- rename them in lockstep or the integration breaks silently.
 *
 * @emits 'im:vibe-code-catalog:request' {open: boolean, node: ?HTMLElement} -- handled by the binder to open/close the catalog
 * @listens 'im:vibe-code-catalog:state-changed' {active: boolean} -- emitted by the binder to sync the pressed state
 * @see vibecodeconnector/install/js/vibecodeconnector/im-button-binder/src/binder.js
 */
// @vue/component
export const VibeCodeCatalogButton = defineComponent({
	name: 'VibeCodeCatalogButton',
	components: { BIcon } as { BIcon: typeof BIcon },
	data(): State
	{
		return {
			isActive: false,
			counter: 0,
		};
	},
	computed: {
		ICON_NAME: () => ICON_NAME,
		layoutName(): LayoutType
		{
			return this.$store.getters['application/getLayout'].name;
		},
		shouldShow(): boolean
		{
			if (!this.isAvailable)
			{
				return false;
			}

			return AVAILABLE_LAYOUTS.has(this.layoutName);
		},
		isAvailable(): boolean
		{
			const settings = Extension.getSettings('im.v2.component.list.container.elements.vibe-code-catalog-button');

			return settings.get('isAvailable', false);
		},
		shouldShowCounter(): boolean
		{
			if (this.isActive)
			{
				return false;
			}

			return this.counter > 0;
		},
		isCounterValueOverflowed(): boolean
		{
			return this.counter > COUNTER_DISPLAY_LIMIT;
		},
		formattedCounterValue(): string
		{
			if (this.isCounterValueOverflowed)
			{
				return `${COUNTER_DISPLAY_LIMIT}+`;
			}

			return this.counter.toString();
		},
	},
	created(): void
	{
		EventEmitter.subscribe(CatalogEvent.stateChanged, this.onStateChanged);
	},
	beforeUnmount(): void
	{
		if (this.isActive)
		{
			EventEmitter.emit(CatalogEvent.request, { open: false, node: null });
		}
		EventEmitter.unsubscribe(CatalogEvent.stateChanged, this.onStateChanged);
	},
	methods: {
		onClick(): void
		{
			EventEmitter.emit(CatalogEvent.request, { open: !this.isActive, node: this.$el });
		},
		onStateChanged(event: BaseEvent): void
		{
			this.isActive = event.getData().active === true;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<button
			v-if="shouldShow"
			type="button"
			class="bx-im-list-container-vibe-code-catalog-button__container"
			data-bx-vibe-code-catalog-events="true"
			:class="{'--active': isActive }"
			:aria-label="loc('IM_ELEMENTS_VIBE_CODE_CATALOG_ARIA_TITLE')"
			:aria-pressed="isActive"
			@click="onClick"
		>
			<BIcon
				class="bx-im-list-container-vibe-code-catalog-button__icon"
				:name="ICON_NAME"
				:aria-hidden="true"
			/>
			<span 
				v-if="shouldShowCounter"
				class="bx-im-list-container-vibe-code-catalog-button__counter"
				:class="{'--overflowed': isCounterValueOverflowed}"
				:aria-hidden="true"
			>
				{{ formattedCounterValue }}
			</span>
		</button>
	`,
});

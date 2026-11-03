import {
	cloneVNode,
	Comment,
	defineComponent,
	Fragment,
	h,
	isVNode,
	nextTick,
	Text,
	type Component,
	type PropType,
	type VNode,
} from 'ui.vue3';
import { Type } from 'main.core';

import { CrmSettingsHubCapabilityCard } from '../capability-card/capability-card';
import { type SettingRowAction } from '../setting-row/setting-row';
import { CrmSettingsHubSettingsBlock } from '../settings-block/settings-block';
import {
	type NavigationContext,
	useNavigationContext,
} from '../../context/navigation';
import { HubFilter } from '../../model/hub-filter';
import {
	type BlockRegistration,
	type Capability,
	type SettingRegistration,
	type SettingsSectionRegistration,
} from '../../model/types';
import { settingsSectionRegistry } from '../../registry/settings-section-registry';

export type CapabilityPackContentSection = Readonly<{
	id: string,
	title: string,
	type: 'settings-group',
}>;

export type CapabilityPackSectionsChange = Readonly<{
	capabilityId: string,
	sections: readonly CapabilityPackContentSection[],
}>;

export const capabilityPackProps = {
	capability: {
		type: Object as PropType<Capability>,
		required: true,
	},
	activeCapabilityId: {
		type: String as PropType<string | null>,
		default: null,
	},
	selectedSectionId: {
		type: String as PropType<string | null>,
		default: null,
	},
	query: {
		type: String,
		required: true,
	},
} as const;

export const capabilityPackEmits = {
	'select-capability': (_capability: Capability): boolean => true,
	'content-sections-change': (_payload: CapabilityPackSectionsChange): boolean => true,
	activate: (_action: SettingRowAction): boolean => true,
};

type RegistrationLocation = Readonly<{
	section: SettingsSectionRegistration,
	block: BlockRegistration,
	setting: SettingRegistration,
}>;

type RegisteredNode = Readonly<{
	vnode: VNode,
	location: RegistrationLocation,
}>;

type VisibleBlock = Readonly<{
	registration: BlockRegistration,
	nodes: readonly VNode[],
}>;

type VisibleSection = Readonly<{
	registration: SettingsSectionRegistration,
	blocks: readonly VisibleBlock[],
}>;

type CapabilityPackState = {
	lastSignature: string | null,
	scheduledSignature: string | null,
	notificationVersion: number,
};

const registrationByComponent = new Map<Component, RegistrationLocation>();
const stateByInstance = new WeakMap<object, CapabilityPackState>();

settingsSectionRegistry.forEach((section) => {
	section.blocks.forEach((block) => {
		block.settings.forEach((setting) => {
			registrationByComponent.set(setting.component, { section, block, setting });
		});
	});
});

function getInstanceState(instance: object): CapabilityPackState
{
	const currentState = stateByInstance.get(instance);
	if (currentState !== undefined)
	{
		return currentState;
	}

	const newState: CapabilityPackState = {
		lastSignature: null,
		scheduledSignature: null,
		notificationVersion: 0,
	};
	stateByInstance.set(instance, newState);

	return newState;
}

function flattenSlotChildren(children: unknown): VNode[]
{
	if (Array.isArray(children))
	{
		return children.flatMap((child) => flattenSlotChildren(child));
	}

	if (children === null || children === undefined || Type.isBoolean(children))
	{
		return [];
	}

	if (Type.isString(children))
	{
		if (children.trim() === '')
		{
			return [];
		}

		throw new TypeError('CrmSettingsHubCapabilityPack does not support text children');
	}

	if (!isVNode(children))
	{
		throw new TypeError('CrmSettingsHubCapabilityPack expects registered component VNodes');
	}

	if (children.type === Fragment)
	{
		return flattenSlotChildren(children.children);
	}

	if (children.type === Comment)
	{
		return [];
	}

	if (children.type === Text)
	{
		return flattenSlotChildren(children.children);
	}

	if (Type.isString(children.type))
	{
		throw new TypeError('CrmSettingsHubCapabilityPack does not support native HTML children');
	}

	return [children];
}

function registerSlotNodes(nodes: readonly VNode[]): readonly RegisteredNode[]
{
	return nodes.map((vnode) => {
		const location = registrationByComponent.get(vnode.type as Component);
		if (location === undefined)
		{
			throw new TypeError('CrmSettingsHubCapabilityPack child component must be registered');
		}

		return { vnode, location };
	});
}

function filterNavigationNodes(
	nodes: readonly RegisteredNode[],
	navigationContext: NavigationContext,
): readonly RegisteredNode[]
{
	return nodes.filter(({ location: { setting } }) => (
		setting.navigationId === undefined
		|| navigationContext.get(setting.navigationId) !== null
	));
}

function getVisibleSections(nodes: readonly RegisteredNode[], query: string): readonly VisibleSection[]
{
	const filter = new HubFilter();
	filter.setQuery(query);

	return settingsSectionRegistry.flatMap((section) => {
		const blocks = section.blocks.flatMap((block) => {
			const blockNodes = nodes.filter(({ location }) => (
				location.section === section && location.block === block
			));
			const visibleSettingIds = new Set(
				filter
					.filterBlock(block.title, blockNodes.map(({ location }) => location.setting))
					.map((setting) => setting.id),
			);
			const visibleNodes = blockNodes
				.filter(({ location }) => visibleSettingIds.has(location.setting.id))
				.map(({ vnode }) => vnode)
			;

			return visibleNodes.length === 0 ? [] : [{ registration: block, nodes: visibleNodes }];
		});

		return blocks.length === 0 ? [] : [{ registration: section, blocks }];
	});
}

function getContentSections(sections: readonly VisibleSection[]): readonly CapabilityPackContentSection[]
{
	return sections.map(({ registration }) => ({
		id: registration.id,
		title: registration.title,
		type: registration.type,
	}));
}

function getSectionsSignature(capabilityId: string, sections: readonly CapabilityPackContentSection[]): string
{
	return JSON.stringify([capabilityId, ...sections.map(({ id }) => id)]);
}

export const CrmSettingsHubCapabilityPack = defineComponent({
	name: 'CrmSettingsHubCapabilityPack',
	props: capabilityPackProps,
	emits: capabilityPackEmits,
	setup(): { navigationContext: NavigationContext }
	{
		return { navigationContext: useNavigationContext() };
	},
	beforeUnmount(): void
	{
		this.invalidateSectionsChange();
		stateByInstance.delete(this);
	},
	methods: {
		handleSelectCapability(): void
		{
			this.$emit('select-capability', this.capability);
		},
		handleActivate(action: SettingRowAction): void
		{
			this.$emit('activate', action);
		},
		invalidateSectionsChange(): void
		{
			const state = getInstanceState(this);
			state.notificationVersion += 1;
			state.lastSignature = null;
			state.scheduledSignature = null;
		},
		scheduleSectionsChange(sections: readonly CapabilityPackContentSection[]): void
		{
			const capabilityId = this.capability.id;
			const signature = getSectionsSignature(capabilityId, sections);
			const state = getInstanceState(this);
			if (signature === state.lastSignature || signature === state.scheduledSignature)
			{
				return;
			}

			state.notificationVersion += 1;
			state.scheduledSignature = signature;
			const notificationVersion = state.notificationVersion;
			void nextTick(() => {
				if (
					state.notificationVersion !== notificationVersion
					|| this.activeCapabilityId !== capabilityId
					|| this.capability.id !== capabilityId
				)
				{
					return;
				}

				state.lastSignature = signature;
				state.scheduledSignature = null;
				this.$emit('content-sections-change', { capabilityId, sections });
			});
		},
	},
	render(): VNode | null
	{
		if (this.activeCapabilityId !== null && this.activeCapabilityId !== this.capability.id)
		{
			this.invalidateSectionsChange();

			return null;
		}

		const slotNodes = this.$slots.default?.() ?? [];
		const registeredNodes = filterNavigationNodes(
			registerSlotNodes(flattenSlotChildren(slotNodes)),
			this.navigationContext,
		);
		if (this.activeCapabilityId === null)
		{
			this.invalidateSectionsChange();
			if (registeredNodes.length === 0)
			{
				return null;
			}

			return h(CrmSettingsHubCapabilityCard, {
				capability: this.capability,
				interactive: true,
				onSelect: this.handleSelectCapability,
			});
		}

		const visibleSections = getVisibleSections(registeredNodes, this.query);
		this.scheduleSectionsChange(getContentSections(visibleSections));

		const selectedSection = visibleSections.find(({ registration }) => (
			registration.id === this.selectedSectionId
		));
		if (selectedSection === undefined)
		{
			return h(Fragment);
		}

		return h(
			Fragment,
			null,
			selectedSection.blocks.map(({ registration, nodes }) => h(
				CrmSettingsHubSettingsBlock,
				{
					key: registration.id,
					id: registration.id,
					title: registration.title,
					icon: registration.icon,
					visible: true,
				},
				{
					default: () => nodes.map((vnode) => cloneVNode(vnode, {
						onActivate: this.handleActivate,
					})),
				},
			)),
		);
	},
});

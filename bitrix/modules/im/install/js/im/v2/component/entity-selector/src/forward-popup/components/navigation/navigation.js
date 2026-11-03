import { FocusKeys } from 'ui.a11y';

import { ScrollWithGradient, ScrollDirection } from 'im.v2.component.elements.scroll-with-gradient';
import { NavigationSection } from 'im.v2.component.list.container.elements.navigation-section';
import { createListFocusZone } from 'im.v2.lib.a11y';

import { type ForwardSectionId } from 'im.v2.component.search';

import { type ForwardSectionItem } from '../../const/section-config';

import './navigation.css';

// The tab set is horizontal; the vertical arrows belong to the result list under it.
const TAB_BIND_KEYS: number = FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd;

// @vue/component
export const ForwardNavigation = {
	name: 'ForwardNavigation',
	components: { ScrollWithGradient, NavigationSection },
	inject: {
		// Provided by ForwardPopup, unwrapped by Vue into a plain boolean. The default keeps the tab set
		// working when the navigation is mounted without the window around it.
		isForwardContentVisible: {
			default: true,
		},
	},
	props: {
		sections: {
			type: Array,
			required: true,
		},
		currentSection: {
			type: String,
			default: null,
		},
		namespace: {
			type: String,
			required: true,
		},
		panelId: {
			type: String,
			required: true,
		},
	},
	emits: ['selectSection'],
	computed: {
		ScrollDirection: () => ScrollDirection,
		items(): ForwardSectionItem[]
		{
			return this.sections;
		},
		// A blank aria-label would wipe the name of the tab set instead of leaving it computable, so a
		// missing phrase yields no attribute at all.
		tabsLabel(): ?string
		{
			return this.loc('IM_ENTITY_SELECTOR_FORWARD_TABS_ARIA') || null;
		},
	},
	watch: {
		isForwardContentVisible(isVisible: boolean)
		{
			// The window holds its content at zero opacity until it has finished opening, so every tab
			// counted as invisible while mounted() ran and the zone collected nothing. The opacity of an
			// ancestor is not something its MutationObserver sees, hence the explicit second enable.
			if (isVisible)
			{
				this.enableFocusZone();
			}
		},
	},
	created()
	{
		this.focusZone = null;
	},
	mounted()
	{
		this.enableFocusZone();
	},
	beforeUnmount()
	{
		this.focusZone?.deactivate();
		this.focusZone = null;
	},
	methods: {
		tabId(sectionId: ForwardSectionId): string
		{
			return `${this.namespace}-tab-${sectionId}`;
		},
		enableFocusZone()
		{
			const container = this.$refs.tabs;
			if (!container)
			{
				return;
			}

			if (!this.focusZone)
			{
				this.focusZone = createListFocusZone(container, { bindKeys: TAB_BIND_KEYS });
			}

			// Idempotent: both mounted() and the visibility signal enable the same zone.
			if (this.focusZone.isActive())
			{
				this.focusZone.refreshElements();

				return;
			}

			this.focusZone.activate();
		},
		onActivateSection(sectionId: ForwardSectionId)
		{
			this.selectSection(sectionId);

			// A click on the wrapper area outside the chip moves no focus, while the zone moves its tab
			// stop on focusin only - without this the stop and aria-selected would part ways. Deferred, so
			// the section is already switched and the focusin of this very move stays a no-op.
			void this.$nextTick(() => {
				this.findTab(sectionId)?.focus();
			});
		},
		onTabFocusIn(event: FocusEvent)
		{
			// Automatic activation: the tab the arrows bring the focus to becomes the active section. The
			// tab is matched by its own id, so a focus landing on anything else here activates nothing.
			const focusedSection = this.items.find(({ type }) => this.tabId(type) === event.target?.id);
			if (focusedSection)
			{
				this.selectSection(focusedSection.type);
			}
		},
		selectSection(sectionId: ForwardSectionId)
		{
			if (sectionId === this.currentSection)
			{
				return;
			}

			this.$emit('selectSection', sectionId);
		},
		findTab(sectionId: ForwardSectionId): ?HTMLElement
		{
			// Attribute form instead of an id selector: the section type needs no escaping this way.
			return this.$refs.tabs?.querySelector(`[id="${this.tabId(sectionId)}"]`);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ScrollWithGradient :direction="ScrollDirection.horizontal">
			<div
				ref="tabs"
				class="bx-im-entity-selector-forward-navigation__section_container"
				role="tablist"
				:aria-label="tabsLabel"
				@focusin="onTabFocusIn"
			>
				<NavigationSection
					v-for="{ type, getTitle } in items"
					:key="type"
					semanticRole="tab"
					:rootId="tabId(type)"
					:controls="panelId"
					:rootTabIndex="-1"
					:rootTestId="'im-forward-tab-' + type"
					:text="getTitle()"
					:isSelected="currentSection === type"
					@activate="onActivateSection(type)"
				/>
			</div>
		</ScrollWithGradient>
	`,
};

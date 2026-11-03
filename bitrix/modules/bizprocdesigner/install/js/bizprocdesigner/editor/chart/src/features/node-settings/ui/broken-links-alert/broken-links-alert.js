import { LiveAnnouncer } from 'ui.a11y';
import { AlertDesign } from 'ui.system.alert';
import { Alert } from 'ui.system.alert.vue';
import { mapState } from 'ui.vue3.pinia';

import {
	type NodeBrokenLinkItem,
	type NodeBrokenLinkSections,
	resolveNodeBrokenLinkSections,
	useNodeSettingsStore,
} from '../../../../entities/node-settings';
import { useLoc, type GetMessage } from '../../../../shared/composables';
import { resolveBrokenLinksMessage } from '../../../../shared/utils';
import { isRulesSectionShown } from '../edit-node-settings-form/edit-node-settings-form';
import { isRelationsBlockShown } from '../relations-block/relations-block';

import './style.css';

// Sections of the panel, named as the layout of the references names them (resolveNodeBrokenLinkSections).
// The general one is laid out for every node and is therefore the one place able to speak for the node
// as a whole; the other two are conditional.
const GENERAL_SECTION = 'general';
const RULES_SECTION = 'rules';
const RELATIONS_SECTION = 'relations';
const CONDITIONAL_SECTIONS = [RULES_SECTION, RELATIONS_SECTION];

// The sections in the order the panel lays them out, which is the order the one speaking warning is
// picked in (announcingSection).
const SECTIONS_IN_PANEL_ORDER = [GENERAL_SECTION, ...CONDITIONAL_SECTIONS];

let listIdCounter = 0;

type BrokenLinksAlertSetup = {
	getMessage: GetMessage,
	AlertDesign: typeof AlertDesign,
	listId: string,
};

// @vue/component
export const BrokenLinksAlert = {
	name: 'BrokenLinksAlert',
	components: {
		Alert,
	},
	inject: {
		/**
		 * The approach of the panel to a construction of the rules tab. Absent outside the panel - a
		 * warning mounted on its own names the references and leads nowhere.
		 */
		leadToConstruction: { default: null },
	},
	props: {
		/**
		 * The section of the panel this warning speaks for: it names the references written in that
		 * section and none of the others.
		 */
		section: {
			type: String,
			required: true,
		},
	},
	setup(): BrokenLinksAlertSetup
	{
		const { getMessage } = useLoc();
		listIdCounter++;

		return {
			getMessage,
			AlertDesign,
			// The list the button of the warning expands, named for aria-controls.
			listId: `editor-chart-broken-links-alert-list-${listIdCounter}`,
		};
	},
	data(): Object
	{
		return {
			// The list of references is folded until asked for, exactly as the panel of an ordinary node
			// folds it: the warning names the trouble, the list names the places.
			isListShown: false,
			// A warning the user has closed stays closed while the panel shows this node: it must not
			// come back with the next render of the section.
			isDismissed: false,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['block', 'brokenLinks', 'nodeSettings', 'ports', 'isBlockAvailable']),
		/**
		 * The references of the node laid out by the section each of them is written in. Computed over
		 * the list and the settings both, and not written down when the list arrives: the list is asked
		 * for without waiting and may land before the settings of the node do, and a reactive layout
		 * makes the order of the two unobservable - until the settings are in, a reference has no
		 * construction to belong to and waits in the general section, and once they are in it stands in
		 * the section it is written in.
		 */
		brokenLinkSections(): NodeBrokenLinkSections
		{
			return resolveNodeBrokenLinkSections(this.brokenLinks, this.nodeSettings);
		},
		// Sections this node does not lay out. Their references have no section of their own to be named
		// in, so the general one names them (see sectionItems).
		hiddenSections(): Array<string>
		{
			return CONDITIONAL_SECTIONS.filter((section: string) => !this.isSectionShown(section));
		},
		// The references this warning names (sectionItems).
		items(): Array<NodeBrokenLinkItem>
		{
			return this.sectionItems(this.section);
		},
		isShown(): boolean
		{
			return this.items.length > 0 && !this.isDismissed;
		},
		/**
		 * The section whose warning speaks for the node: the first one with something to name. One and
		 * the same trouble is written in one and the same phrase in every section, so announcing it
		 * once per section would repeat it up to three times (WCAG 4.1.3).
		 *
		 * Read off the references alone, and the layout needs no second reading: a section with
		 * references to name is on screen whenever the general one has none, because it is exactly the
		 * references of the sections the node does not lay out that the general section adopts
		 * (sectionItems).
		 */
		announcingSection(): ?string
		{
			return SECTIONS_IN_PANEL_ORDER.find(
				(section: string) => this.sectionItems(section).length > 0,
			) ?? null;
		},
		shouldAnnounce(): boolean
		{
			return this.isShown && this.announcingSection === this.section;
		},
		alertText(): string
		{
			return resolveBrokenLinksMessage();
		},
		showMoreText(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_MESSAGE_SHOW_LINKS') ?? '';
		},
		// Names the action of an addressed reference twice over: as the hint of the mouse and as the
		// accessible name of the button, where the reference itself is appended to it.
		goToSettingText(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BROKEN_LINK_GO_TO_SETTING') ?? '';
		},
	},
	watch:
	{
		/**
		 * The warning arrives while the panel is already open, so it is spoken of when it lands. The
		 * announcer of `ui.a11y` keeps a live region of its own outside the panel: a region rendered
		 * together with the text it holds is not announced at all, and the sections of a node are not
		 * known to have one that is both always laid out and always filled.
		 */
		shouldAnnounce:
		{
			immediate: true,
			handler(shouldAnnounce: boolean): void
			{
				if (shouldAnnounce)
				{
					LiveAnnouncer.announce(this.alertText);
				}
			},
		},
	},
	methods:
	{
		/**
		 * The references of a section of the panel. Its own, plus - for the general section - those of
		 * the sections the node does not lay out: the general section is rendered for every node and is
		 * therefore the guaranteed place, so the set of the references the panel shows equals the list
		 * of the server whatever the sections of the node are.
		 *
		 * A reference is named once per section: one the general section already names of its own stays
		 * named once, because adoption adds only what would otherwise be lost. A reference written in
		 * two sections that are both on screen is named in both - that is what tells the user where it
		 * is written (ALG-01).
		 */
		sectionItems(section: string): Array<NodeBrokenLinkItem>
		{
			const sections = this.brokenLinkSections;
			// A conditional section owns its own references and nothing else: this warning stands inside
			// that section, so it is on screen exactly when the section is.
			if (section !== GENERAL_SECTION)
			{
				return sections[section] ?? [];
			}

			const byLink: Map<string, NodeBrokenLinkItem> = new Map();
			[sections.general, ...this.hiddenSections.map((hidden: string) => sections[hidden] ?? [])]
				.flat()
				.forEach((item: NodeBrokenLinkItem) => {
					if (!byLink.has(item.link))
					{
						byLink.set(item.link, item);
					}
				});

			// The order inside a section is the order of the list of the server.
			return Object.values(this.brokenLinks ?? {})
				.map((link: string) => byLink.get(link))
				.filter((item: ?NodeBrokenLinkItem) => item !== undefined)
			;
		},
		/**
		 * Whether the conditional section is laid out for this node. Each gate is read where it already
		 * lives: the rules section answers by the helper its own form reads as well, the relations block
		 * by the descriptor of the loaded node - a second reading of either would let the two disagree.
		 */
		isSectionShown(section: string): boolean
		{
			if (section === RULES_SECTION)
			{
				return isRulesSectionShown(this.ports, this.block);
			}

			return isRelationsBlockShown(this.block, this.isBlockAvailable);
		},
		// The button keeps its place while the list is open, so the list can be folded back and the
		// focus of the press is not taken down with the button that carried it.
		toggleList(): void
		{
			this.isListShown = !this.isListShown;
		},
		dismiss(): void
		{
			// The close button goes away with the warning it closes, and a focus left on it would land
			// on <body>. The block of the warning stays in the section and takes it instead - only when
			// the focus is inside the warning, because taking it from a user working elsewhere is never
			// right (rescueFocus).
			if (this.$el?.contains?.(document.activeElement))
			{
				this.$el.focus({ preventScroll: true });
			}

			this.isDismissed = true;
		},
		/**
		 * Leads the panel to the construction the reference is written in, and marks the row it lands on.
		 * The reference names the place for the user, so it is what both announcements speak of: the
		 * construction itself carries no caption of its own.
		 */
		goToSetting(item: NodeBrokenLinkItem): void
		{
			if (!this.leadToConstruction)
			{
				console.warn('leadToConstruction is not provided');

				return;
			}

			void this.leadToConstruction({
				targets: [item.target],
				getReachedAnnouncement: () => this.getMessage(
					'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BROKEN_LINK_GO_TO_SETTING_ANNOUNCE',
					{ '#SETTING#': item.link },
				),
				// A press that looks and behaves as a button must not pass silently for an approach that
				// took place: a row that cannot be brought on screen is announced instead.
				unreachableAnnouncement: this.getMessage(
					'BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BROKEN_LINK_SETTING_HIDDEN_ANNOUNCE',
					{ '#SETTING#': item.link },
				),
				shouldHighlightRow: true,
			});
		},
	},
	/**
	 * The block of the warning stands in the DOM for an empty list as well: only its spacing follows
	 * the filling, and it is what receives the focus when the warning is closed (dismiss).
	 */
	template: `
		<div
			class="editor-chart-broken-links-alert"
			:class="{ '--filled': isShown }"
			:data-testid="$testId('bizprocdesigner-node-settings-broken-links-block', section)"
			tabindex="-1"
		>
			<Alert
				v-if="isShown"
				:design="AlertDesign.tintedWarning"
				hasCloseButton
				:data-testid="$testId('bizprocdesigner-node-settings-broken-links-alert', section)"
				@closeButtonClick="dismiss"
			>
				<span
					:data-testid="$testId('bizprocdesigner-node-settings-broken-links-alert-text', section)"
				>{{ alertText }}</span>
				<button
					type="button"
					class="editor-chart-broken-links-alert__show-more"
					:aria-expanded="isListShown ? 'true' : 'false'"
					:aria-controls="isListShown ? listId : null"
					:data-testid="$testId('bizprocdesigner-node-settings-broken-links-show-more', section)"
					@click="toggleList"
				>{{ showMoreText }}</button>
				<ul
					v-if="isListShown"
					:id="listId"
					class="editor-chart-broken-links-alert__list"
					:data-testid="$testId('bizprocdesigner-node-settings-broken-links-list', section)"
				>
					<li v-for="item in items" :key="item.link">
						<button
							v-if="item.target"
							type="button"
							class="editor-chart-broken-links-alert__item --clickable"
							:title="goToSettingText"
							:aria-label="goToSettingText + ': ' + item.link"
							:data-testid="$testId('bizprocdesigner-node-settings-broken-links-item', section)"
							@click="goToSetting(item)"
						>{{ item.link }}</button>
						<div
							v-else
							class="editor-chart-broken-links-alert__item"
							:data-testid="$testId('bizprocdesigner-node-settings-broken-links-item-text', section)"
						>{{ item.link }}</div>
					</li>
				</ul>
			</Alert>
		</div>
	`,
};

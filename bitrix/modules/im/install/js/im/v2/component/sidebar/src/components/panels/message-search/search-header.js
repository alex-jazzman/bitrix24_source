import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { hint } from 'ui.vue3.directives.hint';

import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { SearchInput } from 'im.v2.component.elements.search-input';

import './css/search-header.css';

const ICON_SIZE = 24;

// @vue/component
export const SearchHeader = {
	name: 'SearchHeader',
	directives: { hint },
	components: { SearchInput, BIcon },
	props:
	{
		secondLevel: {
			type: Boolean,
			default: false,
		},
		isDateNavigationOpened: {
			type: Boolean,
			default: false,
		},
		// the calendar is on its way and nothing of it is drawn yet: the button is busy, not expanded
		isDateNavigationLoading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['back', 'changeQuery', 'dateNavigationClick'],
	computed:
	{
		Outline: () => Outline,
		ICON_SIZE: () => ICON_SIZE,
		isDateNavigationAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isMessageDateNavigationAvailable);
		},
		dateNavigationTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_SIDEBAR_SEARCH_MESSAGE_DATE_NAVIGATION_TITLE');
		},
		// The leading button carries an icon alone, and the same button leaves the second level of the
		// panel and closes the panel on the first one: a screen reader has to tell those two apart.
		backTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_SIDEBAR_SEARCH_MESSAGE_BACK_ARIA');
		},
		closeTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('IM_SIDEBAR_SEARCH_MESSAGE_CLOSE_ARIA');
		},
	},
	watch:
	{
		// The calendar is a dialog and takes the focus when it opens, while the search field focuses
		// itself with a delay. The divider entry asks for both in one go, so that delayed focus would
		// pull the focus out of the already open dialog.
		isDateNavigationOpened(isOpened: boolean)
		{
			if (isOpened)
			{
				this.$refs.searchInput.cancelFocusOnStart();
			}
		},
		// The wait for the extension outlasts that delayed focus, so the cancellation cannot wait for
		// the dialog to exist: the field would take the focus and lose it again a moment later.
		isDateNavigationLoading(isLoading: boolean)
		{
			if (isLoading)
			{
				this.$refs.searchInput.cancelFocusOnStart();
			}
		},
	},
	methods:
	{
		// The popup binds to this button whichever entry opened it - the button, the day divider, a
		// repeat after a failure - so the header owns the element and reports it on demand.
		getDateNavigationTarget(): HTMLElement | null
		{
			return this.$refs['date-navigation'] ?? null;
		},
		// An opening that drew nothing leaves the focus where the click left it; the button is the place
		// both entries can ask again from.
		focusDateNavigation()
		{
			this.$refs['date-navigation']?.focus();
		},
	},
	template: `
		<div class="bx-im-sidebar-search-header__container bx-im-sidebar-search-header__scope">
			<div class="bx-im-sidebar-search-header__title-container">
				<button
					v-if="secondLevel"
					type="button"
					class="bx-im-sidebar-search-header__ds-icon"
					:aria-label="backTitle"
					@click="$emit('back')"
					data-testid="im-sidebar-search-header-back-button"
				>
					<BIcon :name="Outline.CHEVRON_LEFT_L" :size="ICON_SIZE" />
				</button>
				<button
					v-else
					type="button"
					class="bx-im-sidebar-search-header__ds-icon"
					:aria-label="closeTitle"
					@click="$emit('back')"
					data-testid="im-sidebar-search-header-close-button"
				>
					<BIcon :name="Outline.CROSS_L" :size="ICON_SIZE" />
				</button>
				<SearchInput
					ref="searchInput"
					:placeholder="$Bitrix.Loc.getMessage('IM_SIDEBAR_SEARCH_MESSAGE_PLACEHOLDER')"
					:withIcon="false"
					:delayForFocusOnStart="300"
					@queryChange="$emit('changeQuery', $event)"
					@closeByEsc="$emit('back')"
					class="bx-im-sidebar-search-header__input"
				/>
			</div>
			<button
				v-if="isDateNavigationAvailable"
				ref="date-navigation"
				type="button"
				class="bx-im-sidebar-search-header__ds-icon"
				:aria-label="dateNavigationTitle"
				aria-haspopup="dialog"
				:aria-expanded="isDateNavigationOpened ? 'true' : 'false'"
				:aria-busy="isDateNavigationLoading ? 'true' : 'false'"
				v-hint="dateNavigationTitle"
				@click="$emit('dateNavigationClick')"
				data-testid="im-sidebar-search-header-date-navigation-button"
			>
				<BIcon :name="Outline.CALENDAR" :size="ICON_SIZE" />
			</button>
		</div>
	`,
};

/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_vue3, ui_vue3_pinia, ui_vue3_components_hint, ui_feedback_form, ui_icons, ui_cnt, ui_vue3_components_counter, ui_advice) {
	'use strict';

	const feedback = {
		beforeMount(element, bindings) {
			main_core.Event.bind(element, 'click', event => {
				event.preventDefault();
				BX.UI.Feedback.Form.open(bindings.value);
			});
		}
	};

	const Group = {
		emits: ['selected', 'unselected'],
		name: 'ui-entity-catalog-group',
		components: {
			Counter: ui_vue3_components_counter.Counter
		},
		props: {
			/** @type GroupData */
			groupData: {
				required: true
			}
		},
		computed: {
			hasIcon() {
				return main_core.Type.isStringFilled(this.groupData.icon);
			},
			getCounterStyle() {
				return ui_cnt.CounterStyle.FILLED_SUCCESS;
			},
			getCounterValue() {
				const custom = this.groupData?.customData ?? {};
				const value = custom.counterValue;
				const isValueInteger = Number.isInteger(value);
				return isValueInteger && value > 0 ? value : null;
			}
		},
		methods: {
			handleClick() {
				if (this.groupData.deselectable) {
					this.$emit(!this.groupData.selected ? 'selected' : 'unselected', this.groupData);
				} else if (!this.groupData.selected) {
					this.$emit('selected', this.groupData);
				}
			}
		},
		template: `
		<slot name="group" v-bind:groupData="groupData" v-bind:handleClick="handleClick">
			<li
				:class="{
					'ui-entity-catalog__menu_item': true,
					'--active': groupData.selected,
					'--disabled': groupData.disabled,
				}"
				@click="handleClick"
			>
				<span class="ui-entity-catalog__menu_item-icon" v-if="hasIcon" v-html="groupData.icon"/>
				<span class="ui-entity-catalog__menu_item-text">{{ groupData.name }}</span>
				<span
					v-if="getCounterValue !== null"
					class="ui-entity-catalog__menu_item-entity-count"
				>
					<Counter
						:value="getCounterValue"
						:style="getCounterStyle"
					>
					</Counter>
				</span>
			</li>
		</slot>
	`
	};

	const GroupList = {
		emits: ['groupSelected', 'groupUnselected'],
		name: 'ui-entity-selector-group-list',
		components: {
			Group
		},
		props: {
			/** @type Array<Array<GroupData>> */
			groups: {
				type: Array,
				required: true
			}
		},
		computed: {
			groupLists() {
				if (!this.groups || this.groups.length === 0) {
					return [];
				}
				if (Array.isArray(this.groups[0])) {
					return this.groups;
				}
				return [this.groups];
			},
			headerLists() {
				return this.groupLists.map(list => list.filter(g => !!g.isHeaderGroup)).filter(list => list.length > 0);
			},
			mainLists() {
				return this.groupLists.map(list => list.filter(g => !g.isHeaderGroup)).filter(list => list.length > 0);
			}
		},
		methods: {
			handleGroupSelected(group) {
				this.$emit('groupSelected', group);
			},
			handleGroupUnselected(group) {
				this.$emit('groupUnselected', group);
			}
		},
		template: `
		<div>
			<div
				class="ui-entity-catalog__header-groups-content"
				v-if="headerLists && headerLists.length"
			>
				<ul
					class="ui-entity-catalog__menu"
					v-for="(groupList, listIndex) in headerLists"
					:key="'header-'+listIndex"
				>
					<Group
						:group-data="group"
						:key="group.id"
						v-for="group in groupList"
						@selected="handleGroupSelected"
						@unselected="handleGroupUnselected"
					>
						<template #group="groupSlotProps">
							<slot
								name="group"
								v-bind:groupData="groupSlotProps.groupData"
								v-bind:handleClick="groupSlotProps.handleClick"
							/>
						</template>
					</Group>
				</ul>
			</div>

			<div>
				<ul
					class="ui-entity-catalog__menu"
					v-for="(groupList, listIndex) in mainLists"
					:key="'main-'+listIndex"
				>
					<Group
						:group-data="group"
						:key="group.id"
						v-for="group in groupList"
						@selected="handleGroupSelected"
						@unselected="handleGroupUnselected"
					>
						<template #group="groupSlotProps">
							<slot
								name="group"
								v-bind:groupData="groupSlotProps.groupData"
								v-bind:handleClick="groupSlotProps.handleClick"
							/>
						</template>
					</Group>
				</ul>
			</div>
		</div>
	`
	};

	const MainGroups = {
		emits: ['groupSelected'],
		name: 'ui-entity-catalog-main-groups',
		components: {
			GroupList
		},
		props: {
			groups: {
				/** @type Array<Array<GroupData>> */
				type: Array,
				required: true
			},
			searching: {
				type: Boolean,
				default: false
			},
			selectedGroup: {
				/** @type GroupData */
				type: Object,
				default: null
			}
		},
		computed: {
			processedGroups() {
				const selectedGroupId = this.searching ? null : this.selectedGroup ? this.selectedGroup.id : null;
				const groupsClone = BX.Runtime.clone(this.groups);
				groupsClone.forEach(groupList => {
					groupList.forEach(group => {
						group.selected = group.id === selectedGroupId;
					});
				});
				return groupsClone;
			},
			headerLists() {
				return this.processedGroups.map(list => list.filter(g => g.isHeaderGroup)).filter(list => list.length > 0);
			},
			mainLists() {
				return this.processedGroups.map(list => list.filter(g => !g.isHeaderGroup)).filter(list => list.length > 0);
			}
		},
		methods: {
			handleGroupSelected(group) {
				this.$emit('groupSelected', group);
			},
			handleGroupUnselected() {
				this.$emit('groupSelected', null);
			}
		},
		template: `
		<div class="ui-entity-catalog__main-groups">
			<div class="ui-entity-catalog__main-groups-head">
				<slot name="group-list-header"/>
			</div>
			<div
				class="ui-entity-catalog__header-groups-content"
				v-if="headerLists && headerLists.length"
			>
				<GroupList
					:groups="headerLists"
					@groupSelected="handleGroupSelected"
					@groupUnselected="handleGroupUnselected"
				>
					<template #group="groupSlotProps">
						<slot
							name="group"
							v-bind:groupData="groupSlotProps.groupData"
							v-bind:handleClick="groupSlotProps.handleClick"
						/>
					</template>
				</GroupList>
			</div>
			<div class="ui-entity-catalog__main-groups-content">
				<GroupList
					:groups="mainLists"
					@groupSelected="handleGroupSelected"
					@groupUnselected="handleGroupUnselected"
				>
					<template #group="groupSlotProps">
						<slot
							name="group"
							v-bind:groupData="groupSlotProps.groupData"
							v-bind:handleClick="groupSlotProps.handleClick"
						/>
					</template>
				</GroupList>
			</div>
			<div class="ui-entity-catalog__main-groups-footer">
				<slot name="group-list-footer"/>
			</div>
		</div>
	`
	};

	const ItemListAdvice = {
		name: 'ui-entity-catalog-item-list-advice',
		props: {
			groupData: {
				required: true
			}
		},
		computed: {
			getAvatar: function () {
				return main_core.Type.isStringFilled(this.groupData.adviceAvatar) ? this.groupData.adviceAvatar : '/bitrix/js/ui/entity-catalog/images/ui-entity-catalog--nata.jpg';
			}
		},
		methods: {
			renderAdvice() {
				main_core.Dom.clean(this.$refs.container);
				const advice = new ui_advice.Advice({
					content: this.groupData.adviceTitle,
					avatarImg: this.getAvatar,
					anglePosition: ui_advice.Advice.AnglePosition.BOTTOM
				});
				advice.renderTo(this.$refs.container);
			}
		},
		mounted() {
			this.renderAdvice();
		},
		updated() {
			this.renderAdvice();
		},
		template: `
		<div ref="container"></div>
	`
	};

	const Button = {
		name: 'ui-entity-catalog-button',
		props: {
			buttonData: {
				required: true
			},
			eventData: {
				type: Object,
				required: true
			}
		},
		computed: {
			buttonText() {
				return main_core.Type.isStringFilled(this.buttonData.text) ? this.buttonData.text : main_core.Loc.getMessage('UI_JS_ENTITY_CATALOG_ITEM_DEFAULT_BUTTON_TEXT');
			}
		},
		methods: {
			handleButtonClick(pointerEvent) {
				const event = new main_core_events.BaseEvent({
					data: {
						eventData: this.eventData,
						originalEvent: pointerEvent
					}
				});
				if (main_core.Type.isFunction(this.buttonData.action)) {
					this.buttonData.action.call(this, event);
				}
			}
		},
		template: `
		<div class="ui-entity-catalog__option-btn-block">
			<div 
				class="ui-entity-catalog__btn"
				:class="{'--lock': buttonData.locked}"
				@click="handleButtonClick"
			>{{buttonText}}</div>
		</div>
	`
	};

	const Item = {
		name: 'ui-entity-catalog-item',
		components: {
			Button
		},
		props: {
			itemData: {
				required: true
			}
		},
		computed: {
			buttonData() {
				if (!main_core.Type.isPlainObject(this.itemData.button)) {
					this.itemData.button = {};
				}
				return this.itemData.button;
			},
			topText() {
				const custom = this.itemData?.customData ?? {};
				if (main_core.Type.isStringFilled(custom.topText)) {
					return custom.topText;
				}
				return null;
			}
		},
		template: `
		<slot name="item" v-bind:itemData="itemData">
			<div 
				class="ui-entity-catalog__option"
				:data-item-id="String(itemData.id)"
			>
				<div class="ui-entity-catalog__option-info">
					<div
						v-if="topText"
						class="ui-entity-catalog__option-info_top_text"
					>
						{{ topText }}
					</div>
					<div class="ui-entity-catalog__option-info_name">
						<span>{{itemData.title}}</span>
						<span class="ui-entity-catalog__option-info_label" v-if="itemData.subtitle">{{itemData.subtitle}}</span>
					</div>
					<div class="ui-entity-catalog__option-info_description">
						{{itemData.description}}
					</div>
				</div>
				<Button :buttonData="buttonData" :event-data="itemData"/>
			</div>
		</slot>
	`
	};

	const ItemList = {
		name: 'ui-entity-selector-item-list',
		components: {
			Item
		},
		props: {
			items: {
				/** @type Array<ItemData> */
				Type: Array,
				required: true
			}
		},
		template: `
		<div class="ui-entity-catalog__content">
			<div class="ui-entity-catalog__options">
				<Item 
					:item-data="item"
					:key="item.id"
					v-for="item in items"
				>
					<template #item="itemSlotProps">
						<slot name="item" v-bind:itemData="itemSlotProps.itemData"/>
					</template>
				</Item>
			</div>
		</div>
	`
	};

	const EmptyContent = {
		template: `
		<div class="ui-entity-catalog__content --help-block">
			<div class="ui-entity-catalog__empty-content">
				<div class="ui-entity-catalog__empty-content_icon">
					<img src="/bitrix/js/ui/entity-catalog/images/ui-entity-catalog--search-icon.svg" alt="Choose a grouping">
				</div>
				<div class="ui-entity-catalog__empty-content_text">
					<slot/>
				</div>
			</div>
		</div>
		`
	};

	const useGlobalState = ui_vue3_pinia.defineStore('global-state', {
		state: () => ({
			searchQuery: '',
			searchApplied: false,
			filtersApplied: false,
			currentGroup: null,
			shouldShowWelcomeStub: true
		})
	});

	const MainContent = {
		name: 'ui-entity-catalog-main-content',
		components: {
			ItemListAdvice,
			ItemList,
			EmptyContent
		},
		props: {
			items: {
				/** @type Array<ItemData> */
				type: Array,
				required: true
			},
			itemsToShow: {
				/** @type Array<ItemData> */
				type: Array
			},
			group: {
				required: true
			},
			searching: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			...ui_vue3_pinia.mapState(useGlobalState, ['filtersApplied', 'shouldShowWelcomeStub']),
			showAdvice() {
				return this.group && main_core.Type.isStringFilled(this.group.adviceTitle) && !this.searching;
			},
			hasItems() {
				return this.group && this.items.length > 0;
			},
			showWelcomeStub() {
				return this.showNoSelectedGroupStub && this.shouldShowWelcomeStub;
			},
			showNoSelectedGroupStub() {
				return !this.group && !this.searching;
			},
			showFiltersStub() {
				const hasFilterStubTitle = !!this.$slots['main-content-filter-stub-title'];
				return hasFilterStubTitle && this.hasItems && this.filtersApplied && this.itemsToShow.length <= 0;
			},
			showSearchStub() {
				return (!this.group || this.hasItems) && this.searching && this.itemsToShow.length <= 0;
			},
			showEmptyGroupStub() {
				return this.group && this.itemsToShow.length === 0;
			},
			showSeparator() {
				return this.showAdvice && this.items.length <= 0;
			}
		},
		beforeUpdate() {
			this.$refs.content.scrollTop = 0;
		},
		template: `
		<div class="ui-entity-catalog__main-content">
			<div class="ui-entity-catalog__main-content-head">
				<slot name="main-content-header"/>
			</div>
			<ItemListAdvice v-if="showAdvice" :groupData="group" />

			<hr class="ui-entity-catalog__main-separator" v-if="showSeparator">

			<div class="ui-entity-catalog__main-content-body" ref="content">
				<slot name="main-content-welcome-stub" v-if="showWelcomeStub"/>
				<slot name="main-content-no-selected-group-stub" v-else-if="showNoSelectedGroupStub"/>
				<slot name="main-content-filter-stub" v-if="showFiltersStub">
					<EmptyContent>
						<slot name="main-content-filter-stub-title"/>
					</EmptyContent>
				</slot>
				<slot name="main-content-search-stub" v-else-if="showSearchStub">
					<EmptyContent>
						<slot name="main-content-search-not-found-stub"/>
					</EmptyContent>
				</slot>
				<slot name="main-content-empty-group-stub" v-else-if="showEmptyGroupStub">
					<EmptyContent>
						<slot name="main-content-empty-group-stub-title"/>
					</EmptyContent> 
				</slot>
				<ItemList v-else :items="itemsToShow">
					<template #item="itemSlotProps">
						<slot name="item" v-bind:itemData="itemSlotProps.itemData"/>
					</template>
				</ItemList>
				<div class="ui-entity-catalog__main-content-footer">
					<slot name="main-content-footer"/>
				</div>
			</div>
		</div>
	`
	};

	const TitleBarFilter = {
		emits: ['onApplyFilters'],
		name: 'ui-entity-catalog-titlebar-filter',
		props: {
			filters: {
				type: Array,
				required: true
			},
			multiple: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				appliedFilters: this.getAppliedFilters(),
				allFilters: this.filters
			};
		},
		methods: {
			showMenu() {
				main_popup.MenuManager.create({
					id: 'ui-entity-catalog-titlebar-filter-menu',
					bindElement: this.$el,
					minWidth: 271,
					autoHide: true,
					contentColor: 'white',
					draggable: false,
					cacheable: false,
					items: this.getItems()
				}).show();
			},
			getItems() {
				const items = [];
				for (const key in this.allFilters) {
					const html = main_core.Tag.render`
					<div style="display: flex">
						<div>${main_core.Text.encode(this.filters[key].text)}</div>
					</div>
				`;
					if (this.allFilters[key].applied) {
						main_core.Dom.append(main_core.Tag.render`<div class="ui-entity-catalog__filter-block_selected"></div>`, html);
					}
					items.push({
						html,
						onclick: (event, item) => {
							if (this.allFilters[key].applied) {
								delete this.appliedFilters[this.allFilters[key].id];
							} else {
								if (!this.multiple) {
									this.clearAllAction();
								}
								this.appliedFilters[this.allFilters[key].id] = this.allFilters[key];
							}
							this.allFilters[key].applied = !this.allFilters[key].applied;
							this.$emit('onApplyFilters', new main_core_events.BaseEvent({
								data: this.appliedFilters
							}));
							item.getMenuWindow().close();
						}
					});
				}
				items.push({
					delimiter: true
				});
				items.push(this.getClearAllFilter());
				return items;
			},
			getClearAllFilter() {
				return {
					html: `
					<div style="display: flex">
						<div>${main_core.Loc.getMessage('UI_JS_ENTITY_CATALOG_RESET_FILTER')}</div>
					</div>
				`,
					onclick: (event, item) => {
						this.clearAllAction();
						this.$emit('onApplyFilters', new main_core_events.BaseEvent({
							data: this.appliedFilters
						}));
						item.getMenuWindow().close();
					}
				};
			},
			clearAllAction() {
				this.appliedFilters = {};
				this.allFilters = this.allFilters.map(filter => ({
					...filter,
					applied: false
				}));
			},
			getAppliedFilters() {
				const appliedFilters = {};
				for (const key in this.filters) {
					if (this.filters[key].applied) {
						appliedFilters[this.filters[key].id] = this.filters[key];
					}
				}
				if (Object.keys(appliedFilters).length > 0) {
					this.$emit('onApplyFilters', new main_core_events.BaseEvent({
						data: appliedFilters
					}));
				}
				return appliedFilters;
			}
		},
		template: `
		<div 
			:class="{
				'ui-entity-catalog__titlebar_btn-filter': true,
				'--active': Object.keys(appliedFilters).length > 0
			}"
			@click="showMenu">
		</div>
	`
	};

	const Search = {
		emits: ['onSearch'],
		name: 'ui-entity-catalog-titlebar-search',
		data() {
			return {
				opened: false,
				debounceSearchHandler: null,
				queryString: '',
				showClearSearch: false
			};
		},
		watch: {
			queryString(newString) {
				this.showClearSearch = this.opened && this.$refs['search-input'] && main_core.Type.isStringFilled(newString);
			}
		},
		created() {
			this.debounceSearchHandler = main_core.debounce(event => {
				this.onSearch(event.target.value);
			}, 255);
		},
		methods: {
			openSearch() {
				this.opened = true;
				this.$nextTick(() => {
					this.$refs['search-input'].focus();
				});
			},
			onSearch(queryString) {
				this.queryString = queryString;
				this.$emit('onSearch', new main_core_events.BaseEvent({
					data: {
						queryString: queryString ? queryString.toString() : ''
					}
				}));
			},
			clearSearch() {
				if (this.showClearSearch) {
					this.$refs['search-input'].value = '';
					this.onSearch('');
				}
			}
		},
		template: `
		<div class="ui-ctl ui-ctl-after-icon ui-ctl-w100 ui-ctl-round" @click.once="openSearch">
			<a 
				:class="{
					'ui-ctl-after': true,
					'ui-ctl-icon-search': !showClearSearch,
					'ui-ctl-icon-clear': showClearSearch
				}"
				@click="clearSearch"
			/>
			<input
				type="text"
				class="ui-ctl-element ui-ctl-textbox"
				placeholder="${main_core.Loc.getMessage('UI_JS_ENTITY_CATALOG_GROUP_LIST_SEARCH_PLACEHOLDER')}"
				ref="search-input"
				v-if="opened"
				@input="debounceSearchHandler"
			/>
		</div>
	`
	};

	const Application = {
		name: 'ui-entity-catalog-application',
		components: {
			MainGroups,
			MainContent,
			TitleBarFilter,
			Search
		},
		props: {
			/** @type Array<Array<GroupData>> */
			groups: {
				type: Array,
				required: true
			},
			/** @type Array<ItemData> */
			items: {
				type: Array,
				required: true
			},
			showEmptyGroups: {
				type: Boolean,
				default: false
			},
			filterOptions: {
				type: Object,
				default: {
					filterItems: [],
					multiple: false
				}
			}
		},
		data() {
			let selectedGroup = null;
			for (const groupList of this.groups) {
				selectedGroup = groupList.find(group => group.selected);
				if (selectedGroup) {
					break;
				}
			}
			return {
				selectedGroup,
				selectedGroupId: selectedGroup?.id ?? null,
				shownItems: [],
				shownGroups: [],
				lastSearchString: '',
				filters: []
			};
		},
		computed: {
			itemsBySelectedGroupId() {
				const items = this.items.filter(item => item.groupIds.some(id => id === this.selectedGroupId));
				return this.selectedGroup?.compare ? items.sort(this.selectedGroup.compare) : items;
			},
			computedShownGroups() {
				if (this.showEmptyGroups) {
					return main_core.Runtime.clone(this.groups);
				}
				const groupIdsWithItems = new Set();
				this.items.forEach(item => {
					item.groupIds.forEach(groupId => groupIdsWithItems.add(groupId));
				});
				return this.groups.map(groupList => groupList.filter(group => group.isHeaderGroup === true || groupIdsWithItems.has(group.id))).filter(list => list.length > 0);
			},
			computedShownItems() {
				if (this.searching && main_core.Type.isStringFilled(this.lastSearchString)) {
					const q = this.lastSearchString;
					let result = this.items.filter(item => String(item.title).toLowerCase().includes(q) || String(item.description).toLowerCase().includes(q) || item.tags?.some(tag => tag === q));
					for (const filterId in this.filters) {
						result = result.filter(this.filters[filterId].action);
					}
					return result;
				}
				let result = this.itemsBySelectedGroupId.slice();
				for (const filterId in this.filters) {
					result = result.filter(this.filters[filterId].action);
				}
				return result;
			},
			...ui_vue3_pinia.mapWritableState(useGlobalState, {
				searchQuery: 'searchQuery',
				searching: 'searchApplied',
				filtersApplied: 'filtersApplied',
				globalGroup: 'currentGroup',
				shouldShowWelcomeStub: 'shouldShowWelcomeStub'
			})
		},
		watch: {
			computedShownItems: {
				handler() {
					this.$nextTick(() => {
						this.$emit('itemsRendered');
					});
				},
				flush: 'post'
			},
			computedShownGroups: {
				immediate: true,
				handler(newVal) {
					// quick replace in-place to keep same array object reference
					this.shownGroups.splice(0, this.shownGroups.length, ...newVal);
					if (!this.selectedGroupId) {
						const selected = this.shownGroups.flat().find(g => g.selected);
						if (selected) {
							this.selectedGroup = selected;
							this.selectedGroupId = selected.id;
						}
					}
				}
			},
			selectedGroup() {
				this.shouldShowWelcomeStub = false;
				this.globalGroup = this.selectedGroup;
			}
		},
		methods: {
			getDisplayedGroup() {
				if (this.showEmptyGroups) {
					return main_core.Runtime.clone(this.groups);
				}
				const groupIdsWithItems = new Set();
				this.items.forEach(item => {
					item.groupIds.forEach(groupId => {
						groupIdsWithItems.add(groupId);
					});
				});
				return this.groups.map(groupList => groupList.filter(group => group.isHeaderGroup === true || groupIdsWithItems.has(group.id))).filter(groupList => groupList.length > 0);
			},
			handleGroupSelected(group) {
				this.searching = false;
				this.$refs.search?.clearSearch();
				this.selectedGroupId = group ? group.id : null;
				this.selectedGroup = group ?? null;
			},
			onSearch(event) {
				const queryString = event.getData().queryString.toLowerCase();
				this.lastSearchString = queryString;
				this.searchQuery = queryString || '';
				if (!main_core.Type.isStringFilled(queryString)) {
					this.searching = false;
					this.shownItems = [];
					return;
				}
				this.searching = true;
				this.selectedGroup = null;
				this.selectedGroupId = null;
				this.shownItems = this.items.filter(item => String(item.title).toLowerCase().includes(queryString) || String(item.description).toLowerCase().includes(queryString) || item.tags?.some(tag => tag === queryString));
				this.applyFilters();
			},
			onApplyFilterClick(event) {
				this.filters = event.getData();
				if (this.searching) {
					this.onSearch(new main_core_events.BaseEvent({
						data: {
							queryString: this.lastSearchString
						}
					}));
					return;
				}
				this.shownItems = this.itemsBySelectedGroupId;
				this.applyFilters();
			},
			applyFilters() {
				this.filtersApplied = Object.values(this.filters).length > 0;
				for (const filterId in this.filters) {
					this.shownItems = this.shownItems.filter(this.filters[filterId].action);
				}
			},
			getFilterNode() {
				return this.$root.$app.getPopup().getTitleContainer().querySelector('[data-role="titlebar-filter"]');
			},
			getSearchNode() {
				return this.$root.$app.getPopup().getTitleContainer().querySelector('[data-role="titlebar-search"]');
			},
			stopPropagation(event) {
				event.stopPropagation();
			}
		},
		template: `
		<div class="ui-entity-catalog__main">
			<MainGroups
				:groups="this.shownGroups"
				:searching="searching"
				@group-selected="handleGroupSelected"
				:selected-group="selectedGroup"
			>
				<template #group-list-header>
					<slot name="group-list-header"/>
				</template>
				<template #group="groupSlotProps">
					<slot
						name="group"
						v-bind:groupData="groupSlotProps.groupData"
						v-bind:handleClick="groupSlotProps.handleClick"
					/>
				</template>
				<template #group-list-footer>
					<slot name="group-list-footer"/>
				</template>
			</MainGroups>
			<MainContent
				:items="itemsBySelectedGroupId"
				:items-to-show="computedShownItems"
				:group="selectedGroup"
				:searching="searching"
			>
				<template #main-content-header>
					<slot name="main-content-header"/>
				</template>
				<template #main-content-no-selected-group-stub>
					<slot name="main-content-no-selected-group-stub"/>
				</template>
				<template #main-content-welcome-stub>
					<slot name="main-content-welcome-stub"/>
				</template>
				<template #main-content-filter-stub v-if="$slots['main-content-filter-stub']">
					<slot name="main-content-filter-stub"/>
				</template>
				<template #main-content-filter-stub-title v-if="$slots['main-content-filter-stub-title']">
					<slot name="main-content-filter-stub-title"/>
				</template>
				<template #main-content-search-stub>
					<slot name="main-content-search-stub"></slot>
				</template>
				<template #main-content-search-not-found-stub>
					<slot name="main-content-search-not-found-stub"/>
				</template>
				<template #main-content-empty-group-stub>
					<slot name="main-content-empty-group-stub"/>
				</template>
				<template #main-content-empty-group-stub-title>
					<slot name="main-content-empty-group-stub-title"/>
				</template>
				<template #item="itemSlotProps">
					<slot name="item" v-bind:itemData="itemSlotProps.itemData"/>
				</template>
				<template #main-content-footer>
					<slot name="main-content-footer"/>
				</template>
			</MainContent>
			<Teleport v-if="getFilterNode()" :to="getFilterNode()">
				<TitleBarFilter
					:filters="filterOptions.filterItems"
					:multiple="filterOptions.multiple"
					@onApplyFilters="onApplyFilterClick"
					@mousedown="stopPropagation"
				/>
			</Teleport>
			<Teleport v-if="getSearchNode()" :to="getSearchNode()">
				<Search @onSearch="onSearch" ref="search" @mousedown="stopPropagation"/>
			</Teleport>
		</div>
	`
	};

	const Stubs = {
		EmptyContent
	};
	const States = {
		useGlobalState
	};
	class EntityCatalog extends main_core_events.EventEmitter {
		static DEFAULT_POPUP_WIDTH = 881;
		static DEFAULT_POPUP_HEIGHT = 621;
		static DEFAULT_POPUP_COLOR = '#edeef0';
		static SLOT_GROUP_LIST_HEADER = 'group-list-header';
		static SLOT_GROUP = 'group';
		static SLOT_GROUP_LIST_FOOTER = 'group-list-footer';
		static SLOT_MAIN_CONTENT_HEADER = 'main-content-header';
		static SLOT_MAIN_CONTENT_FOOTER = 'main-content-footer';
		static SLOT_MAIN_CONTENT_FILTERS_STUB = 'main-content-filter-stub';
		static SLOT_MAIN_CONTENT_FILTERS_STUB_TITLE = 'main-content-filter-stub-title';
		static SLOT_MAIN_CONTENT_SEARCH_NOT_FOUND = 'search-not-found';
		static SLOT_MAIN_CONTENT_WELCOME_STUB = 'main-content-welcome-stub';
		static SLOT_MAIN_CONTENT_NO_SELECTED_GROUP_STUB = 'main-content-no-selected-group-stub';
		static SLOT_MAIN_CONTENT_EMPTY_GROUP_STUB = 'main-content-empty-group-stub';
		static SLOT_MAIN_CONTENT_EMPTY_GROUP_STUB_TITLE = 'main-content-empty-group-stub-title';
		static SLOT_MAIN_CONTENT_ITEM = 'main-content-item';
		static SLOT_MAIN_CONTENT_SEARCH_STUB = 'main-content-search-stub';
		#popup;
		#popupOptions;
		#popupTitle;
		#customTitleBar = null;
		#groups = [];
		#items = [];
		#showEmptyGroups = false;
		#showSearch = false;
		#filterOptions = {
			filterItems: [],
			multiple: false
		};
		#application;
		#slots;
		#customComponents;

		// backward compatability
		#recentGroupData;
		#showRecentGroup = false;
		#vueInstance;
		constructor(props) {
			super();
			this.setEventNamespace('BX.UI.EntityCatalog');
			this.setGroups(main_core.Type.isArray(props.groups) ? props.groups : []);
			this.setItems(main_core.Type.isArray(props.items) ? props.items : []);

			// backward compatibility
			this.#recentGroupData = props.recentGroupData ?? null;
			this.#showRecentGroup = main_core.Type.isBoolean(props.showRecentGroup) ? props.showRecentGroup : false;
			if (main_core.Type.isBoolean(props.canDeselectGroups)) {
				this.#groups.forEach(groupList => {
					groupList.forEach(group => {
						group.deselectable = props.canDeselectGroups;
					});
				});
			}
			this.#showEmptyGroups = main_core.Type.isBoolean(props.showEmptyGroups) ? props.showEmptyGroups : false;
			this.#showSearch = main_core.Type.isBoolean(props.showSearch) ? props.showSearch : false;
			if (main_core.Type.isPlainObject(props.filterOptions)) {
				this.#filterOptions = props.filterOptions;
			}
			this.#popupTitle = main_core.Type.isString(props.title) ? props.title : '';
			this.#customTitleBar = props.customTitleBar ? props.customTitleBar : null;
			this.#popupOptions = Object.assign(this.#getDefaultPopupOptions(), main_core.Type.isObject(props.popupOptions) ? props.popupOptions : {});
			this.#slots = props.slots ?? {};
			this.#customComponents = props.customComponents ?? {};
			this.subscribeFromOptions(props.events);
		}
		setGroups(groups) {
			this.#groups = groups.map(groupList => {
				if (!main_core.Type.isArray(groupList)) {
					groupList = [groupList];
				}
				return groupList.map(group => ({
					selected: false,
					deselectable: true,
					...group
				}));
			});
			if (!this.#vueInstance || !this.#vueInstance.localGroups) {
				return this;
			}
			if (this.isGroupsStructureChanged(this.#groups)) {
				try {
					this.#vueInstance.refreshGroups(this.#groups);
				} catch (e) {
					console.error(e);
					this.#vueInstance.localGroups = this.#groups;
				}
			} else {
				const countersMap = {};
				for (const list of this.#groups) {
					for (const g of list) {
						countersMap[String(g.id)] = g.customData?.counterValue ?? null;
					}
				}
				this._updateCountersInGroupLists(this.#vueInstance.localGroups, countersMap);
			}
			return this;
		}
		isGroupsStructureChanged(newGroups) {
			if (!Array.isArray(this.#groups) || !Array.isArray(newGroups)) {
				return true;
			}
			if (this.#groups.length !== newGroups.length) {
				return true;
			}
			for (let i = 0; i < newGroups.length; i++) {
				const oldList = this.#groups[i] || [];
				const newList = newGroups[i] || [];
				if (oldList.length !== newList.length) {
					return true;
				}
				for (let j = 0; j < newList.length; j++) {
					if (String(oldList[j]?.id) !== String(newList[j]?.id)) {
						return true;
					}
				}
			}
			return false;
		}
		_updateCountersInGroupLists(groupLists, countersMap = {}) {
			if (!Array.isArray(groupLists)) return;
			for (const list of groupLists) {
				for (const group of list) {
					const id = String(group.id);
					if (Object.prototype.hasOwnProperty.call(countersMap, id)) {
						const custom = group.customData ?? {};
						group.customData = Object.assign({}, custom, {
							counterValue: countersMap[id]
						});
					}
				}
			}
		}
		updateGroupCounter(groupId, counterValue) {
			const idStr = String(groupId);
			const countersMap = {
				[idStr]: counterValue
			};
			this._updateCountersInGroupLists(this.#groups, countersMap);
			if (!this.#vueInstance) {
				return this;
			}
			try {
				this._updateCountersInGroupLists(this.#vueInstance.localGroups, countersMap);
			} catch (e) {
				if (typeof this.#vueInstance.refreshGroups === 'function') {
					this.#vueInstance.refreshGroups(this.#groups);
				}
			}
			return this;
		}
		getItems() {
			return this.#items;
		}
		setItems(items = []) {
			this.#items.length = 0;
			this.#items.push(...items);
			if (!this.#vueInstance || typeof this.#vueInstance.refreshItems !== 'function') {
				return this;
			}
			try {
				this.#vueInstance.refreshItems(this.#items);
			} catch (e) {
				console.error(e);
			}
			return this;
		}
		updateItemById(id, patch = {}) {
			if (this.#vueInstance && typeof this.#vueInstance.updateItemById === 'function') {
				try {
					this.#vueInstance.updateItemById(id, patch);
					return this;
				} catch (e) {
					console.error(e);
				}
			}
			const itemForUpdate = this.#items.find(item => String(item.id) === String(id));
			if (itemForUpdate) {
				Object.assign(itemForUpdate, patch);
			} else {
				this.#items.push(Object.assign({
					id
				}, patch));
			}
			return this;
		}
		show() {
			this.#attachTemplate();
			this.getPopup().show();
		}
		isShown() {
			return this.#popup && this.#popup.isShown();
		}
		#resolveGroupsForTemplate() {
			if (!this.#recentGroupData || !this.#showRecentGroup) {
				return this.#groups;
			}

			// clone groups shallowly to avoid mutating original arrays
			const groupsClone = this.#groups.map(list => list.slice());
			const recent = {
				isHeaderGroup: true,
				id: this.#recentGroupData.id ?? 'recent',
				name: this.#recentGroupData.name ?? '',
				icon: this.#recentGroupData.icon ?? '',
				tags: this.#recentGroupData.tags ?? [],
				adviceTitle: this.#recentGroupData.adviceTitle,
				adviceAvatar: this.#recentGroupData.adviceAvatar,
				selected: !!this.#recentGroupData.selected,
				disabled: !!this.#recentGroupData.disabled,
				deselectable: this.#recentGroupData.deselectable ?? true,
				compare: this.#recentGroupData.compare,
				customData: Object.assign({}, this.#recentGroupData.customData ?? {}, {
					// prefer canonical name `counterValue`, fallback to legacy `newEntitiesCount`
					counterValue: this.#recentGroupData.customData?.counterValue ?? this.#recentGroupData.customData?.newEntitiesCount
				})
			};
			if (groupsClone.length > 0 && Array.isArray(groupsClone[0]) && groupsClone[0].some(g => g.isHeaderGroup)) {
				groupsClone[0].unshift(recent);
				return groupsClone;
			}
			return [[recent], ...groupsClone];
		}
		#attachTemplate() {
			const container = this.getPopup().getContentContainer();
			if (this.#application && typeof this.#application.unmount === 'function') {
				try {
					this.#application.unmount();
				} catch (e) {
					console.error(e);
				}
				this.#application = null;
				this.#vueInstance = null;
			}
			const context = this;
			const groupsToPass = this.#resolveGroupsForTemplate();
			const rootProps = {
				groups: groupsToPass,
				items: this.#items,
				showEmptyGroups: this.#showEmptyGroups,
				filterOptions: this.#filterOptions
			};
			this.#application = ui_vue3.BitrixVue.createApp({
				name: 'ui-entity-catalog',
				components: Object.assign(this.#customComponents, {
					Application,
					Hint: ui_vue3_components_hint.Hint,
					Button
				}),
				directives: {
					feedback
				},
				props: {
					groups: Array,
					items: Array,
					showEmptyGroups: Boolean,
					filterOptions: Object
				},
				created() {
					this.$app = context;
				},
				data() {
					return {
						localGroups: this.groups,
						localItems: this.items
					};
				},
				methods: {
					onItemsRendered() {
						this.$app.emit('onItemsRendered');
					},
					refreshGroups(groups) {
						this.localGroups = groups;
					},
					refreshItems(newItems = []) {
						try {
							const existingMap = new Map(this.localItems.map(it => [String(it.id), it]));
							newItems.forEach(newIt => {
								const id = String(newIt.id);
								if (existingMap.has(id)) {
									Object.assign(existingMap.get(id), newIt);
								} else {
									this.localItems.push(newIt);
									existingMap.set(id, this.localItems[this.localItems.length - 1]);
								}
							});
							const newIds = new Set(newItems.map(it => String(it.id)));
							for (let i = this.localItems.length - 1; i >= 0; i--) {
								if (!newIds.has(String(this.localItems[i].id))) {
									this.localItems.splice(i, 1);
								}
							}
						} catch (e) {
							console.error(e);
							this.localItems.splice(0, this.localItems.length, ...newItems);
						}
					},
					updateItemById(id, patch = {}) {
						try {
							const it = this.localItems.find(x => String(x.id) === String(id));
							if (it) {
								Object.assign(it, patch);
							} else {
								this.localItems.push(Object.assign({
									id
								}, patch));
							}
						} catch (e) {
							console.error(e);
						}
					}
				},
				template: `
					<Application
						ref="application"
						@itemsRendered="onItemsRendered"
						:groups="localGroups"
						:items="localItems"
						:show-empty-groups="showEmptyGroups"
						:filter-options="filterOptions"
					>
						<template #group-list-header>
							${this.#slots[EntityCatalog.SLOT_GROUP_LIST_HEADER] ?? ''}
						</template>
						<template #group="groupSlotProps">
							${this.#slots[EntityCatalog.SLOT_GROUP] ?? ''}
						</template>
						<template #group-list-footer>
							${this.#slots[EntityCatalog.SLOT_GROUP_LIST_FOOTER] ?? ''}
						</template>

						<template #main-content-header>
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_HEADER] ?? ''}
						</template>
						<template #main-content-footer>
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_FOOTER] ?? ''}
						</template>
						<template #main-content-filter-stub v-if="${!!this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_FILTERS_STUB]}">
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_FILTERS_STUB]}
						</template>
						<template #main-content-filter-stub-title v-if="${!!this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_FILTERS_STUB_TITLE]}">
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_FILTERS_STUB_TITLE]}
						</template>
						<template #main-content-search-not-found-stub>
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_SEARCH_NOT_FOUND] ?? main_core.Loc.getMessage('UI_JS_ENTITY_CATALOG_GROUP_LIST_ITEM_LIST_SEARCH_STUB_DEFAULT_TITLE')}
						</template>
						<template v-if="${Boolean(this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_SEARCH_STUB])}" #main-content-search-stub>
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_SEARCH_STUB]}
						</template>
						<template #main-content-welcome-stub>
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_WELCOME_STUB] ?? ''}
						</template>
						<template #main-content-no-selected-group-stub>
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_NO_SELECTED_GROUP_STUB] ?? ''}
						</template>
						<template #main-content-empty-group-stub>
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_EMPTY_GROUP_STUB] ?? ''}
						</template>
						<template #main-content-empty-group-stub-title>
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_EMPTY_GROUP_STUB_TITLE] ?? ''}
						</template>
						<template #item="itemSlotProps">
							${this.#slots[EntityCatalog.SLOT_MAIN_CONTENT_ITEM] ?? ''}
						</template>
					</Application>
				`
			}, rootProps);
			this.#vueInstance = this.#application.use(ui_vue3_pinia.createPinia()).mount(container);
		}
		getPopup() {
			if (main_core.Type.isNil(this.#popup)) {
				this.#popup = new main_popup.Popup(this.#popupOptions);
				this.#popup.setResizeMode(true);
			}
			return this.#popup;
		}
		selectGroup(groupId) {
			if (this.#vueInstance && this.#vueInstance.$refs.application) {
				const group = this.#vueInstance.localGroups.flat().find(g => String(g.id) === String(groupId));
				if (group) {
					this.#vueInstance.$refs.application.handleGroupSelected(group);
				}
			}
			return this;
		}
		#getDefaultPopupOptions() {
			return {
				className: 'ui-catalog-popup ui-entity-catalog__scope',
				titleBar: this.#getPopupTitleBar(),
				noAllPaddings: true,
				closeByEsc: true,
				contentBackground: EntityCatalog.DEFAULT_POPUP_COLOR,
				draggable: true,
				width: EntityCatalog.DEFAULT_POPUP_WIDTH,
				height: EntityCatalog.DEFAULT_POPUP_HEIGHT,
				minWidth: EntityCatalog.DEFAULT_POPUP_WIDTH,
				minHeight: EntityCatalog.DEFAULT_POPUP_HEIGHT,
				autoHide: false
			};
		}
		#getPopupTitleBar() {
			const titleBar = this.#customTitleBar ? this.#customTitleBar : main_core.Tag.render`<div>${main_core.Text.encode(this.#popupTitle)}</div>`;
			return {
				content: main_core.Tag.render`
				<div class="ui-entity-catalog-popup-titlebar">
					${titleBar}
					<div class="ui-entity-catalog-popup-titlebar-controls">
						${this.#showSearch ? '<div class="ui-entity-catalog__titlebar_search" data-role="titlebar-search"></div>' : ''}
						${this.#filterOptions.filterItems.length > 0 ? '<div data-role="titlebar-filter"></div>' : ''}
						<button
							type="button"
							class="ui-entity-catalog-popup-close-icon"
							onclick="${this.#handleClose.bind(this)}"
							onmousedown="${this.#handleMouseDown.bind(this)}"
						></button>
					</div>
					
				</div>
			`
			};
		}
		#handleClose() {
			this.close();
		}
		#handleMouseDown(event) {
			event.stopPropagation();
		}
		close() {
			try {
				if (this.#application && typeof this.#application.unmount === 'function') {
					this.#application.unmount();
				}
				if (this.#popup) {
					this.#popup.close();
				}
			} catch (e) {
				console.error(e);
			}
			this.#application = null;
			this.#vueInstance = null;
			this.#popup = null;
		}
	}

	exports.EntityCatalog = EntityCatalog;
	exports.States = States;
	exports.Stubs = Stubs;

})(this.BX.UI = this.BX.UI || {}, BX, BX.Event, BX.Main, BX.Vue3, BX.Vue3.Pinia, BX.Vue3.Components, BX.UI.Feedback, BX, BX.UI, BX.UI.Vue3.Components, BX.UI);
//# sourceMappingURL=entity-catalog.bundle.js.map

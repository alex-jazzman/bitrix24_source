/* eslint-disable */
this.BX = this.BX || {};
this.BX.Calendar = this.BX.Calendar || {};
(function (exports, ui_vue3, calendar_openEvents_filter, ui_vue3_vuex, main_popup, ui_entitySelector, ui_switcher, main_core, main_core_events, ui_iconSet_main, ui_iconSet_actions, ui_cnt, main_date, main_loader, im_public_iframe, main_polyfill_intersectionobserver, im_v2_const, ui_buttons) {
	'use strict';

	class CategoryModel {
		#id;
		#closed;
		#name;
		#description;
		#eventsCount;
		#permissions;
		#channelId;
		#isMuted;
		#isBanned;
		#newCount;
		#updatedAt = 0;
		#channel;
		#isSelected;

		//TODO: can see fields value on vue debug tools

		constructor(fields = {}) {
			this.#id = fields.id;
			this.#closed = fields.closed;
			this.#name = fields.name;
			this.#description = fields.description;
			this.#eventsCount = fields.eventsCount;
			this.#permissions = fields.permissions;
			this.#channelId = fields.channelId;
			this.#isMuted = fields.isMuted;
			this.#isBanned = fields.isBanned;
			this.#newCount = fields.newCount;
			this.#updatedAt = fields.updatedAt || 0;
			this.#channel = fields.channel;
			this.#isSelected = false;
			this.fields = fields;
		}
		get id() {
			return this.#id;
		}
		get closed() {
			return this.#closed;
		}
		get name() {
			return this.#name;
		}
		get description() {
			return this.#description;
		}
		get eventsCount() {
			return this.#eventsCount;
		}
		get permissions() {
			return this.#permissions;
		}
		get channelId() {
			return this.#channelId;
		}
		get isMuted() {
			return this.#isMuted;
		}
		set isMuted(isMuted) {
			this.#isMuted = isMuted;
		}
		get isBanned() {
			return this.#isBanned;
		}
		set isBanned(isBanned) {
			this.#isBanned = isBanned;
		}
		get newCount() {
			return this.#newCount;
		}
		get isSelected() {
			return this.#isSelected;
		}
		set isSelected(isSelected) {
			this.#isSelected = isSelected;
		}
		get updatedAt() {
			return this.#updatedAt;
		}
		get channel() {
			return this.#channel;
		}
		set channel(channel) {
			this.#channel = channel;
		}
	}

	let PullRequests$1 = class PullRequests extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('Calendar.OpenEvents.List.CategoryManager.PullRequests');
		}
		getModuleId() {
			return 'calendar';
		}
		getMap() {
			return {
				EVENT_CATEGORY_CREATED: this.#create.bind(this),
				EVENT_CATEGORY_UPDATED: this.#update.bind(this),
				EVENT_CATEGORY_DELETED: this.#delete.bind(this),
				OPEN_EVENT_SCORER_UPDATED: this.#eventScorerUpdated.bind(this)
			};
		}
		#update(event) {
			this.emit('update', event);
		}
		#create(event) {
			this.emit('create', event);
		}
		#delete(event) {
			this.emit('delete', event);
		}
		#eventScorerUpdated(event) {
			this.emit('eventScorerUpdated', event);
		}
	};

	class CategoryApi {
		static async list(params) {
			const response = await BX.ajax.runAction('calendar.open-events.Category.list', {
				data: params
			});
			return response.data;
		}
		static async add(fields) {
			const response = await BX.ajax.runAction('calendar.open-events.Category.add', {
				data: {
					name: fields.name,
					description: fields.description,
					closed: fields.closed,
					attendees: fields.attendees,
					departmentIds: fields.departmentIds,
					channelId: fields.channelId
				}
			});
			return response.data;
		}
		static update(fields) {
			return BX.ajax.runAction('calendar.open-events.Category.update', {
				data: {
					id: fields.id,
					name: fields.name,
					description: fields.description
				}
			});
		}
		static setMute(id, muteState) {
			return BX.ajax.runAction('calendar.open-events.Category.setMute', {
				data: {
					id,
					muteState
				}
			});
		}
		static setBan(id, banState) {
			return BX.ajax.runAction('calendar.open-events.Category.setBan', {
				data: {
					id,
					banState
				}
			});
		}
		static async getChannelInfo(id) {
			const response = await BX.ajax.runAction('calendar.open-events.Category.getChannelInfo', {
				data: {
					id
				}
			});
			return response.data;
		}
	}

	const ListKeys = Object.freeze({
		notBanned: 'notBanned',
		banned: 'banned',
		search: 'search'
	});
	let Manager$1 = class Manager extends main_core_events.EventEmitter {
		#categories = [];
		#categoryIds = {};
		#categoryPromises = {};
		#lastLoadedPage = {};
		#loadedLists = {
			[ListKeys.notBanned]: false,
			[ListKeys.banned]: false,
			[ListKeys.search]: false
		};
		#query;
		constructor() {
			super();
			this.setEventNamespace('Calendar.OpenEvents.List.CategoryManager');
			this.#subscribeToPull();
		}
		#subscribeToPull() {
			if (!BX.PULL) {
				console.info('BX.PULL not initialized');
				return;
			}
			const pullRequests = new PullRequests$1();
			pullRequests.subscribe('create', this.#createCategoryPull.bind(this));
			pullRequests.subscribe('update', this.#updateCategoryPull.bind(this));
			pullRequests.subscribe('delete', this.#deleteCategoryPull.bind(this));
			pullRequests.subscribe('eventScorerUpdated', this.#onPullEventScorerUpdated.bind(this));
			BX.PULL.subscribe(pullRequests);
		}
		#createCategoryPull(event) {
			const {
				fields
			} = event.getData();
			if (this.#getCategory(fields.id)) {
				return;
			}
			this.#addNewCategory(fields);
		}
		#updateCategoryPull(event) {
			const {
				fields
			} = event.getData();
			this.#updateCategory(fields.id, fields);
		}
		#deleteCategoryPull(event) {
			const {
				fields
			} = event.getData();
			this.#categories = this.#categories.filter(category => category.id !== fields.id);
			this.emit('update');
		}
		#onPullEventScorerUpdated(event) {
			const {
				fields: {
					categoriesCounter
				}
			} = event.getData();
			this.#updateCounters(categoriesCounter);
		}
		async addCategory(fields) {
			const categoryDto = await CategoryApi.add(fields);
			this.#addNewCategory(categoryDto);
		}
		#addNewCategory(categoryDto) {
			categoryDto.updatedAt = Date.now();
			const category = new CategoryModel(categoryDto);
			this.#categories.push(category);
			this.#categoryIds[ListKeys.notBanned]?.push(category.id);
			this.emit('update');
		}
		async updateCategory(fields) {
			const category = this.#getCategory(fields.id);
			category.channel.title = fields.name;
			return CategoryApi.update(fields);
		}
		async setMute(categoryId, isMuted) {
			this.#updateCategory(categoryId, {
				isMuted
			});
			void CategoryApi.setMute(categoryId, isMuted);
		}
		async setBan(categoryId, isBanned) {
			this.#updateCategory(categoryId, {
				isBanned
			});
			void CategoryApi.setBan(categoryId, isBanned);
		}
		async getChannelInfo(categoryId) {
			const category = this.#categories.find(category => category.id === categoryId);
			category.channel ??= await CategoryApi.getChannelInfo(categoryId);
			return category.channel;
		}
		async bubbleUp(categoryId) {
			const category = this.#getCategory(categoryId) ?? (await this.#loadCategoryById(categoryId));
			this.#updateCategory(category.id, {
				updatedAt: Date.now()
			});
		}
		async searchMore() {
			if (this.#loadedLists[ListKeys.search]) {
				return [];
			}
			const query = this.#query;
			const listKey = this.#getListKey({
				query
			});
			const countBefore = this.#getListIds(listKey).length;
			const lastPage = this.#lastLoadedPage[listKey] ?? -1;
			const categories = await this.getCategories({
				query,
				page: lastPage + 1
			});
			if (categories.length === countBefore) {
				this.#loadedLists[listKey] = true;
			}
			return categories;
		}
		async loadMore() {
			if (this.#loadedLists[ListKeys.notBanned] && this.#loadedLists[ListKeys.banned]) {
				return [];
			}
			const isBanned = this.#loadedLists[ListKeys.notBanned] && !this.#loadedLists[ListKeys.banned];
			const listKey = this.#getListKey({
				isBanned
			});
			const countBefore = this.#getListIds(listKey).length;
			const lastPage = this.#lastLoadedPage[listKey] ?? -1;
			const categories = await this.getCategories({
				isBanned,
				page: lastPage + 1
			});
			if (categories.length === countBefore) {
				this.#loadedLists[listKey] = true;
				return this.loadMore();
			}
			return categories;
		}
		async searchCategories(query) {
			if (query !== this.#query) {
				this.#loadedLists[ListKeys.search] = false;
				delete this.#lastLoadedPage[ListKeys.search];
				delete this.#categoryPromises[ListKeys.search];
				delete this.#categoryIds[ListKeys.search];
			}
			this.#query = query;
			return this.getCategories({
				query
			});
		}
		async getCategories(params = {
			isBanned: false
		}) {
			const listKey = this.#getListKey(params);
			const categories = await this.#loadCategories(params);
			const alreadyLoadedIds = this.#categories.map(it => it.id);
			const newCategories = categories.filter(it => !alreadyLoadedIds.includes(it.id));
			this.#categories.push(...newCategories);
			const alreadyLoadedListIds = this.#getListIds(listKey);
			const newListCategories = categories.filter(it => !alreadyLoadedListIds.includes(it.id));
			this.#categoryIds[listKey] ??= [];
			this.#categoryIds[listKey].push(...newListCategories.map(it => it.id));
			return this.#prepareCategories(listKey);
		}
		#prepareCategories(listKey) {
			const listIds = this.#getListIds(listKey);
			return this.#categories.filter(category => listIds.includes(category.id)).map(category => new CategoryModel(category.fields));
		}
		#getListIds(listKey) {
			const listKeys = listKey === ListKeys.search ? [ListKeys.search] : [ListKeys.notBanned, ListKeys.banned];
			const listIds = Object.entries(this.#categoryIds).filter(([listKey]) => listKeys.includes(listKey)).flatMap(([, categoryIds]) => categoryIds);
			return [...new Set(listIds)];
		}
		async #loadCategories(params) {
			const isBanned = params.isBanned ?? null;
			const query = params.query ?? '';
			const page = params.page ?? 0;
			const listKey = this.#getListKey(params);
			this.#categoryPromises[listKey] ??= {};
			this.#categoryPromises[listKey][page] ??= CategoryApi.list({
				isBanned,
				query,
				page
			});
			const categories = await this.#categoryPromises[listKey][page];
			this.#lastLoadedPage[listKey] = page;
			return categories.map(category => new CategoryModel(category));
		}
		#getListKey({
			isBanned,
			query
		}) {
			if (main_core.Type.isStringFilled(query)) {
				return ListKeys.search;
			}
			if (isBanned === true) {
				return ListKeys.banned;
			}
			return ListKeys.notBanned;
		}
		async #loadCategoryById(categoryId) {
			const promiseByIdKey = 'byId';
			this.#categoryPromises[promiseByIdKey] ??= {};
			this.#categoryPromises[promiseByIdKey][categoryId] ??= CategoryApi.list({
				categoryId
			});
			const categories = await this.#categoryPromises[promiseByIdKey][categoryId];
			const categoryDto = categories.find(it => it.id === categoryId);
			const category = new CategoryModel(categoryDto);
			this.#categories.push(category);
			const listKey = category.isBanned ? ListKeys.banned : ListKeys.notBanned;
			this.#categoryIds[listKey]?.push(category.id);
			return category;
		}
		#updateCounters(categoryCounters) {
			for (const [id, newCount] of Object.entries(categoryCounters)) {
				const categoryId = parseInt(id, 10);
				const category = this.#getCategory(categoryId);
				if (category === null) {
					continue;
				}
				const eventsCreated = newCount > category.newCount;
				const updatedAt = eventsCreated ? Date.now() : category.updatedAt;
				this.#updateCategory(categoryId, {
					newCount,
					updatedAt
				});
			}
		}
		incrementNewCounter(categoryId) {
			const category = this.#getCategory(categoryId);
			if (category === null) {
				return;
			}
			this.#updateCategory(categoryId, {
				newCount: category.newCount + 1
			});
		}
		decrementNewCounter(categoryId) {
			const category = this.#getCategory(categoryId);
			if (category === null) {
				return;
			}
			this.#updateCategory(categoryId, {
				newCount: category.newCount - 1
			});
		}
		#getCategory(categoryId) {
			return this.#categories.find(category => category.id === categoryId) ?? null;
		}
		#updateCategory(categoryId, fields) {
			this.#categories = this.#categories.map(category => {
				if (category.id !== categoryId) {
					return category;
				}
				return this.#buildCategoryModel(category, fields);
			});
			this.emit('update');
		}
		#buildCategoryModel(category, fields = {}) {
			return new CategoryModel({
				id: category.id,
				closed: fields.closed ?? category.closed,
				name: fields.name ?? category.name,
				description: fields.description ?? category.description,
				eventsCount: fields.eventsCount ?? category.eventsCount,
				permissions: category.permissions,
				channelId: category.channelId,
				isMuted: fields.isMuted ?? category.isMuted,
				isBanned: fields.isBanned ?? category.isBanned,
				newCount: fields.newCount ?? category.newCount,
				isSelected: fields.isSelected ?? category.isSelected,
				updatedAt: fields.updatedAt ?? category.updatedAt,
				channel: fields.channel ?? category.channel
			});
		}
	};
	const CategoryManager = new Manager$1();

	class ExtensionSettings {
		#config;
		constructor() {
			this.#config = main_core.Extension.getSettings('calendar.open-events.list');
		}
		get currentUserId() {
			return main_core.Text.toNumber(this.#config.currentUserId);
		}
		get openEventSection() {
			return this.#config.openEventSection;
		}
		get currentUserTimeOffset() {
			return main_core.Text.toNumber(this.#config.currentUserTimeOffset);
		}
		get pullEventUserFieldsKey() {
			return this.#config.pullEventUserFieldsKey.toString();
		}
	}
	const AppSettings = new ExtensionSettings();

	const CategoryEditForm = {
		data() {
			return {
				id: 'calendar-open-events-category-edit-popup',
				params: {},
				category: null,
				create: false,
				popup: null,
				name: '',
				description: '',
				closed: false,
				selectedChannelId: null
			};
		},
		computed: {
			isEdit() {
				return !this.create;
			}
		},
		methods: {
			show(params = {}) {
				this.create = params.create;
				this.category = params.category;
				if (this.category) {
					if (!this.category.channel) {
						CategoryManager.getChannelInfo(this.category.id).then(channelInfo => {
							this.category.channel = channelInfo;
						});
					}
					this.name = this.category.name;
					this.description = this.category.description;
					this.closed = this.category.closed;
				}
				main_popup.PopupManager.getPopupById(this.id)?.destroy();
				this.popup = main_popup.PopupManager.create({
					id: this.id,
					autoHide: true,
					autoHideHandler: event => {
						const isClickInside = this.popup.getPopupContainer().contains(event.target);
						let isClickUserSelector = false;
						if (this.userSelector) {
							const userSelectorPopup = this.userSelector.getDialog().getPopup();
							isClickUserSelector = userSelectorPopup.getPopupContainer().contains(event.target);
						}
						let isClickChannelSelector = false;
						if (this.channelSelector) {
							const channelSelectorPopup = this.channelSelector.getDialog().getPopup();
							isClickChannelSelector = channelSelectorPopup.getPopupContainer().contains(event.target);
						}
						return !isClickInside && !isClickUserSelector && !isClickChannelSelector;
					},
					width: 600,
					content: this.$refs.popupContent,
					className: 'calendar-open-events-category-edit-popup-container',
					titleBar: true,
					draggable: {
						restrict: true
					}
				});
				this.renderSwitcher();
				if (this.create) {
					this.renderChannelSelector();
					this.renderUserSelector();
				}
				this.popup.show();
				this.$refs.inputName.focus();
			},
			async onCreateButtonClick() {
				const attendees = this.userSelector?.getTags().filter(tag => tag.entityId === 'user').map(tag => tag.id);
				const departmentIds = this.userSelector?.getTags().filter(tag => tag.entityId === 'department').map(tag => tag.id);
				await CategoryManager.addCategory({
					name: this.name,
					description: this.description,
					closed: this.closed,
					attendees: this.closed ? attendees : [],
					departmentIds: this.closed ? departmentIds : [],
					channelId: this.selectedChannelId
				});
				this.clearFields();
				this.popup.close();
			},
			async onSaveButtonClick() {
				await CategoryManager.updateCategory({
					id: this.category.id,
					name: this.name,
					description: this.description
				});
				this.clearFields();
				this.popup.close();
			},
			onCancelButtonClick() {
				this.clearFields();
				this.popup.close();
			},
			clearFields() {
				this.name = '';
				this.description = '';
				this.closed = false;
				this.userSelector?.getTags().forEach(tag => {
					if (tag.getEntityId() === 'user' && tag.getId() === AppSettings.currentUserId) {
						return;
					}
					this.userSelector.removeTag(tag, false);
				});
				this.channelSelector?.getTags().forEach(tag => this.channelSelector.removeTag(tag, false));
				this.selectedChannelId = null;
			},
			renderSwitcher() {
				if (this.switcher) {
					this.switcher.check(this.closed);
					this.switcher.disable(Boolean(this.selectedChannelId));
					return;
				}
				this.switcher = new ui_switcher.Switcher({
					node: this.$refs.closedSwitcher,
					checked: this.closed,
					size: ui_switcher.SwitcherSize.extraSmall,
					disabled: Boolean(this.selectedChannelId),
					handlers: {
						toggled: () => {
							this.closed = this.switcher.isChecked();
						}
					}
				});
			},
			renderUserSelector() {
				if (this.userSelector) {
					this.userSelector.renderTo(this.$refs.userSelector);
					return;
				}
				const currentUserItem = ['user', AppSettings.currentUserId];
				this.userSelector = new ui_entitySelector.TagSelector({
					dialogOptions: {
						context: 'CALENDAR_OPEN_EVENTS_CATEGORY_EDIT_FORM',
						showAvatars: true,
						dropdownMode: true,
						preload: true,
						entities: [{
							id: 'user'
						}, {
							id: 'department',
							options: {
								selectMode: 'usersAndDepartments',
								allowFlatDepartments: true,
								allowSelectRootDepartment: true
							}
						}],
						preselectedItems: [currentUserItem],
						undeselectedItems: [currentUserItem]
					}
				});
				this.userSelector.renderTo(this.$refs.userSelector);
			},
			renderChannelSelector() {
				if (this.channelSelector) {
					this.channelSelector.renderTo(this.$refs.channelSelector);
					return;
				}
				this.channelSelector = new ui_entitySelector.TagSelector({
					multiple: false,
					dialogOptions: {
						context: 'CALENDAR_OPEN_EVENTS_CATEGORY_EDIT_FORM',
						dropdownMode: true,
						preload: true,
						entities: [{
							id: 'im-channel',
							dynamicLoad: true
						}],
						events: {
							'Item:onSelect': this.onChannelSelected.bind(this),
							'Item:onDeselect': this.onChannelDeselected.bind(this)
						},
						multiple: false
					}
				});
				this.channelSelector.renderTo(this.$refs.channelSelector);
			},
			onChannelSelected(event) {
				const {
					item: tag
				} = event.getData();
				this.selectedChannelId = tag.id;
				this.closed = tag.customData.get('closed');
				if (!this.name || !this.userChangedName) {
					this.name = tag.getTitle();
				}
				this.renderSwitcher();
			},
			onChannelDeselected(event) {
				const {
					item: tag
				} = event.getData();
				this.selectedChannelId = null;
				this.closed = false;
				if (this.name === tag.getTitle()) {
					this.name = '';
					this.userChangedName = false;
				}
				this.renderSwitcher();
			},
			getFirstLetters(text) {
				const words = text.split(/[\s,]/).filter(word => /[\p{L}\p{N} ]/u.test(word[0]));
				return (words[0]?.[0] ?? '') + (words[1]?.[0] ?? '');
			},
			onNameInput() {
				this.userChangedName = true;
			}
		},
		template: `
		<div class="calendar-open-events-category-edit-popup" ref="popupContent">
			<input
				class="calendar-open-events-category-edit-name-input"
				:placeholder="$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_CATEGORY_NAME')"
				v-model="name"
				@input="onNameInput"
				ref="inputName"
			>
			<div class="calendar-open-events-category-edit-channel --edit" v-show="create">
				<div class="ui-icon-set --speaker-mouthpiece" v-if="create"></div>
				<div class="calendar-open-events-category-edit-channel-text" v-if="create">
					{{ $Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_CATEGORY_CHOOSE_CHANNEL') }}
				</div>
				<div
					class="calendar-open-events-category-edit-channel-selector"
					ref="channelSelector"
					v-show="create"
				></div>
			</div>
			<div class="calendar-open-events-category-edit-channel --edit" v-if="!create && !category?.channel">
				<div class="ui-icon-set --speaker-mouthpiece"></div>
				<div class="calendar-open-events-category-edit-channel-loader"></div>
			</div>
			<div class="calendar-open-events-category-edit-channel" v-if="category?.channel">
				<div class="ui-icon-set --speaker-mouthpiece"></div>
				<img
					v-if="category.channel.avatar"
					class="calendar-open-events-category-edit-channel-avatar"
					:src="category.channel.avatar"
				>
				<div
					v-if="!category.channel.avatar && getFirstLetters(category.channel.title)"
					class="calendar-open-events-category-edit-channel-avatar"
					:style="'background-color: ' + category.channel.color"
				>
					{{ getFirstLetters(category.channel.title) }}
				</div>
				<div class="calendar-open-events-category-edit-channel-name">{{ category.channel.title }}</div>
			</div>
			<div
				class="calendar-open-events-category-edit-close"
				:class="{
					'--closed': closed,
					'--disabled': !create,
				}"
			>
				<div class="calendar-open-events-category-edit-close-switcher">
					<div ref="closedSwitcher"></div>
				</div>
				<div class="calendar-open-events-category-edit-close-body">
					<div class="calendar-open-events-category-edit-close-title">
						{{ $Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_CATEGORY_CLOSE') }}
					</div>
					<div class="calendar-open-events-category-edit-close-hint">
						{{ $Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_CATEGORY_CLOSE_HINT') }}
					</div>
					<div
						class="calendar-open-events-category-edit-close-users"
						ref="userSelector"
						v-show="create && closed && !selectedChannelId"
					></div>
				</div>
			</div>
			<textarea
				class="calendar-open-events-category-edit-description-textarea"
				:placeholder="$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_CATEGORY_DESCRIPTION')"
				v-model="description"
			></textarea>
			<div class="calendar-open-events-category-edit-buttons">
				<div
					v-if="create"
					class="calendar-open-events-category-edit-button-create"
					@click="onCreateButtonClick"
				>
					<div class="ui-icon-set --calendar-1"></div>
					<div class="calendar-open-events-category-edit-button-create-text">
						{{ $Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_CATEGORY_CREATE') }}
					</div>
				</div>
				<div
					v-if="isEdit"
					class="calendar-open-events-category-edit-button-create"
					@click="onSaveButtonClick"
				>
					<div class="ui-icon-set --calendar-1"></div>
					<div class="calendar-open-events-category-edit-button-create-text">
						{{ $Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_CATEGORY_SAVE') }}
					</div>
				</div>
				<div class="calendar-open-events-category-edit-button-cancel" @click="onCancelButtonClick">
					{{ $Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_CATEGORY_CANCEL') }}
				</div>
			</div>
		</div>
	`
	};

	const CategoriesTitle = {
		methods: {
			onSearchClick() {
				this.$store.dispatch('setSearchMode', true);
			},
			onAddClick() {
				this.$refs.editForm.show({
					create: true
				});
			}
		},
		components: {
			CategoryEditForm
		},
		template: `
		<div class="calendar-open-events-list-categories-title">
			<div class="calendar-open-events-list-categories-title-text">
				{{ $Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_CATEGORIES') }}
			</div>
			<div class="calendar-open-events-list-categories-title-button" @click="onSearchClick()">
				<div class="ui-icon-set --search-2"></div>
			</div>
			<div class="calendar-open-events-list-categories-title-button" @click="onAddClick()">
				<div class="ui-icon-set --plus-30"></div>
			</div>
		</div>
		<CategoryEditForm ref="editForm"/>
	`
	};

	const CategoriesSearch = {
		created() {
			this.searchDebounced = main_core.Runtime.debounce(this.search, 500, this);
		},
		mounted() {
			this.$refs.input.focus();
			main_core.Event.bind(document, 'click', this.handleAutoHide, true);
		},
		unmounted() {
			main_core.Event.unbind(document, 'click', this.handleAutoHide, true);
		},
		methods: {
			handleAutoHide(event) {
				if (this.shouldHideForm(event)) {
					void this.closeSearch();
				}
			},
			shouldHideForm(event) {
				const queryIsEmpty = !main_core.Type.isStringFilled(this.getSearchQuery());
				const clickOnSelf = this.$refs.search.contains(event.target);
				return queryIsEmpty && !clickOnSelf;
			},
			onCloseSearchClick() {
				void this.closeSearch();
			},
			async closeSearch() {
				const categories = await CategoryManager.getCategories();
				await this.$store.dispatch('setCategories', categories);
				await this.$store.dispatch('setSearchMode', false);
			},
			async onSearchInput() {
				const query = this.getSearchQuery();
				if (main_core.Type.isStringFilled(query)) {
					this.searchDebounced(query);
				} else {
					const categories = await CategoryManager.getCategories();
					this.$store.dispatch('setCategories', categories);
				}
			},
			async search(query) {
				await this.$store.dispatch('setCategoriesQuery', query);
				const categories = await CategoryManager.searchCategories(query);
				if (query === this.getSearchQuery()) {
					this.$store.dispatch('setCategories', categories);
				}
			},
			getSearchQuery() {
				return this.$refs.input.value.trim();
			}
		},
		template: `
		<div class="calendar-open-events-list-categories-search" ref="search">
			<input
				ref="input"
				class="calendar-open-events-list-categories-search-input"
				type="text"
				:placeholder="$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_SEARCH_CATEGORY')"
				@input="onSearchInput()"
			>
			<div class="calendar-open-events-list-categories-close-search-button" @click="onCloseSearchClick()">
				<div class="ui-icon-set --cross-circle-70"></div>
			</div>
		</div>
	`
	};

	const CategoriesHeader = {
		computed: {
			...ui_vue3_vuex.mapGetters({
				isSearchMode: 'isSearchMode'
			})
		},
		components: {
			CategoriesTitle,
			CategoriesSearch
		},
		template: `
		<div class="calendar-open-events-list-categories-title-container">
			<CategoriesSearch v-if="isSearchMode"/>
			<CategoriesTitle v-else/>
		</div>
	`
	};

	class PullRequests extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('Calendar.OpenEvents.List.EventManager.PullRequests');
		}
		getModuleId() {
			return 'calendar';
		}
		getMap() {
			return {
				OPEN_EVENT_CREATED: this.#create.bind(this),
				OPEN_EVENT_UPDATED: this.#update.bind(this),
				OPEN_EVENT_DELETED: this.#delete.bind(this)
			};
		}
		#create(event) {
			this.emit('create', event);
		}
		#update(event) {
			this.emit('update', event);
		}
		#delete(event) {
			this.emit('delete', event);
		}
	}

	class EventModel {
		#id;
		#name;
		#isFullDay;
		#dateFromTs;
		#dateToTs;
		#commentsCount;
		#isAttendee = false;
		#attendeesCount;
		#creatorId;
		#eventOptions;
		#categoryId;
		#categoryName;
		#color;
		#categoryChannelId;
		#threadId;
		#isNew;
		#rrule;
		#rruleDescription;
		#exdate;
		constructor(fields = {}) {
			this.#initFields(fields);
		}
		#initFields(fields) {
			this.#id = parseInt(fields.id, 10);
			this.#name = fields.name;
			this.#isFullDay = fields.isFullDay;
			const fullDayOffset = this.isFullDay ? new Date().getTimezoneOffset() * 60 : 0;
			this.#dateFromTs = fields.dateFromTs + fullDayOffset;
			this.#dateToTs = fields.dateToTs + fullDayOffset;
			this.#commentsCount = fields.commentsCount;
			this.#isAttendee = fields.isAttendee;
			this.#attendeesCount = fields.attendeesCount;
			this.#creatorId = parseInt(fields.creatorId, 10);
			this.#eventOptions = {
				maxAttendees: fields.eventOptions?.maxAttendees || 0
			};
			this.#categoryId = parseInt(fields.categoryId, 10);
			this.#categoryName = fields.categoryName;
			this.#color = fields.color;
			this.#categoryChannelId = fields.categoryChannelId;
			this.#threadId = fields.threadId;
			this.#isNew = fields.isNew;
			this.#rrule = RecursionParser.parseRrule(fields.rrule);
			this.#rruleDescription = fields.rruleDescription;
			if (main_core.Type.isNumber(fields.recursionAmount)) {
				this.#rrule.amount = fields.recursionAmount;
			}
			if (main_core.Type.isNumber(fields.recursionNum)) {
				this.#rrule.num = fields.recursionNum;
			}
			this.#exdate = fields.exdate;
			this.fields = fields;
		}
		updateFields(fields) {
			if ('name' in fields) {
				this.#name = fields.name;
			}
			if (!main_core.Type.isBoolean(fields.isAttendee)) {
				delete fields.isAttendee;
			}
			if (!main_core.Type.isNumber(fields.commentsCount)) {
				delete fields.commentsCount;
			}
			if ('isAttendee' in fields) {
				if (!this.#isAttendee && fields.isAttendee) {
					this.incrementAttendeesCount();
				}
				if (this.#isAttendee && !fields.isAttendee) {
					this.decrementAttendeesCount();
				}
				this.#isAttendee = fields.isAttendee;
			}
			if ('attendeesCount' in fields) {
				this.#attendeesCount = fields.attendeesCount;
			}
			Object.assign(this.fields, fields);
		}
		get uniqueId() {
			return this.#id.toString() + '|' + this.#dateFromTs.toString();
		}
		get id() {
			return this.#id;
		}
		get name() {
			return this.#name;
		}
		get commentsCount() {
			return this.#commentsCount;
		}
		get isAttendee() {
			return this.#isAttendee;
		}
		set isAttendee(isAttendee) {
			this.#isAttendee = isAttendee;
			this.updateFields({
				isAttendee
			});
		}
		get attendeesCount() {
			return this.#attendeesCount;
		}
		set attendeesCount(attendeesCount) {
			this.#attendeesCount = attendeesCount;
			this.updateFields({
				attendeesCount
			});
		}
		incrementAttendeesCount() {
			this.attendeesCount = ++this.attendeesCount;
		}
		decrementAttendeesCount() {
			this.attendeesCount = --this.attendeesCount;
		}
		get creatorId() {
			return this.#creatorId;
		}
		get eventOptions() {
			return this.#eventOptions;
		}
		get categoryId() {
			return this.#categoryId;
		}
		get categoryName() {
			return this.#categoryName;
		}
		get duration() {
			return this.dateTo.getTime() - this.dateFrom.getTime();
		}
		get dateFrom() {
			return new Date(this.#dateFromTs * 1000);
		}
		get dateTo() {
			return new Date(this.#dateToTs * 1000);
		}
		get formattedDateTime() {
			const isSameDate = this.#getDateCode(this.#dateFromTs) === this.#getDateCode(this.#dateToTs);
			const startsInCurrentYear = this.dateFrom.getFullYear() === new Date().getFullYear();
			const endsInCurrentYear = this.dateTo.getFullYear() === new Date().getFullYear();
			if (isSameDate) {
				const dateFormat = startsInCurrentYear ? 'DAY_OF_WEEK_MONTH_FORMAT' : 'FULL_DATE_FORMAT';
				const date = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat(dateFormat), this.#dateFromTs);
				if (this.isFullDay) {
					return date;
				}
				const from = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), this.#dateFromTs);
				const to = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), this.#dateToTs);
				const time = main_core.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_FORMAT_TIME_RANGE', {
					'#FROM#': from,
					'#TO#': to
				});
				return main_core.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_FORMAT_DATE_TIME', {
					'#DATE#': date,
					'#TIME#': time
				});
			}
			const dateFromFormat = startsInCurrentYear ? 'DAY_MONTH_FORMAT' : 'LONG_DATE_FORMAT';
			const dateToFormat = endsInCurrentYear ? 'DAY_MONTH_FORMAT' : 'LONG_DATE_FORMAT';
			const dateFrom = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat(dateFromFormat), this.#dateFromTs);
			const dateTo = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat(dateToFormat), this.#dateToTs);
			if (this.isFullDay) {
				return main_core.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_FORMAT_TIME_RANGE', {
					'#FROM#': dateFrom,
					'#TO#': dateTo
				});
			}
			const timeFrom = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), this.#dateFromTs);
			const timeTo = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), this.#dateToTs);
			return main_core.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_FORMAT_DATE_TIME_RANGE', {
				'#FROM_DATE#': dateFrom,
				'#FROM_TIME#': timeFrom,
				'#TO_DATE#': dateTo,
				'#TO_TIME#': timeTo
			});
		}
		get color() {
			return this.#color;
		}
		get isFullDay() {
			return this.#isFullDay;
		}
		get threadId() {
			return this.#threadId;
		}
		get categoryChannelId() {
			return this.#categoryChannelId;
		}
		get isNew() {
			return this.#isNew;
		}
		set isNew(isNew) {
			this.#isNew = isNew;
			this.updateFields({
				isNew
			});
		}
		get exdate() {
			return this.#exdate;
		}
		get rrule() {
			return this.#rrule;
		}
		get rruleDescription() {
			return this.#rruleDescription;
		}
		#getDateCode(timestamp) {
			return main_date.DateTimeFormat.format('d.m.Y', timestamp);
		}
	}

	const END_OF_TIME = 2038;
	class RecursionParser {
		static parseRecursion(event, {
			fromLimit,
			toLimit
		}) {
			if (event.rrule === null) {
				return new EventModel(event.fields);
			}
			const {
				timestamps
			} = this.parseTimestamps(event, {
				fromLimit,
				toLimit
			});
			const recursionAmount = this.getAmount(event);
			return timestamps.map(({
				fromTs,
				num
			}) => new EventModel({
				...event.fields,
				dateFromTs: fromTs / 1000,
				dateToTs: fromTs / 1000 + event.duration / 1000,
				recursionAmount,
				recursionNum: num + 1
			}));
		}
		static getAmount(event) {
			const rruleCount = parseInt(event.rrule.COUNT, 10) || 0;
			if (rruleCount > 0) {
				return rruleCount;
			}
			const toLimit = main_date.DateTimeFormat.parse(event.rrule.UNTIL);
			if (toLimit.getFullYear() === END_OF_TIME) {
				return Infinity;
			}
			const {
				count
			} = this.parseTimestamps(event, {
				fromLimit: null,
				toLimit
			});
			return count;
		}
		static parseTimestamps(event, {
			fromLimit,
			toLimit
		}) {
			const timestamps = [];
			const rrule = event.rrule;
			const exDate = event.exdate.split(';');
			const fullDayOffset = event.isFullDay ? new Date().getTimezoneOffset() * 60000 : 0;
			let from = new Date(event.dateFrom.getTime() - fullDayOffset);
			const to = new Date(Math.min(toLimit, main_date.DateTimeFormat.parse(rrule.UNTIL)));
			to.setHours(from.getHours(), from.getMinutes());
			const fromYear = from.getFullYear();
			const fromMonth = from.getMonth();
			const fromDate = from.getDate();
			const fromHour = from.getHours();
			const fromMinute = from.getMinutes();
			let count = 0;
			const FORMAT_DATE = main_date.DateTimeFormat.getFormat('FORMAT_DATE');
			while (from <= to) {
				if (rrule.COUNT > 0 && count >= rrule.COUNT) {
					break;
				}
				const exclude = exDate.includes(main_date.DateTimeFormat.format(FORMAT_DATE, from.getTime() / 1000));
				const include = !exclude && (!fromLimit || from.getTime() >= fromLimit.getTime()) && (!toLimit || from.getTime() + event.duration <= toLimit.getTime());
				if (rrule.FREQ === 'WEEKLY') {
					const weekDay = this.getWeekDayByInd(main_date.DateTimeFormat.format('w', from.getTime() / 1000));
					if (main_core.Type.isStringFilled(rrule.BYDAY[weekDay])) {
						if (include) {
							timestamps.push({
								fromTs: from.getTime(),
								num: count
							});
						}
						count++;
					}
					const skipWeek = (rrule.INTERVAL - 1) * 7 + 1;
					const delta = weekDay === 'SU' ? skipWeek : 1;
					from = new Date(from.getFullYear(), from.getMonth(), from.getDate() + delta, fromHour, fromMinute);
				}
				if (['DAILY', 'MONTHLY', 'YEARLY'].includes(rrule.FREQ)) {
					if (include) {
						timestamps.push({
							fromTs: from.getTime(),
							num: count
						});
					}
					count++;
					switch (rrule.FREQ) {
						case 'DAILY':
							from = new Date(fromYear, fromMonth, fromDate + count * rrule.INTERVAL, fromHour, fromMinute, 0, 0);
							break;
						case 'MONTHLY':
							from = new Date(fromYear, fromMonth + count * rrule.INTERVAL, fromDate, fromHour, fromMinute, 0, 0);
							break;
						case 'YEARLY':
							from = new Date(fromYear + count * rrule.INTERVAL, fromMonth, fromDate, fromHour, fromMinute, 0, 0);
							break;
					}
				}
			}
			return {
				timestamps,
				count
			};
		}
		static getWeekDayByInd(index) {
			return ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][index];
		}
		static parseRrule(rule) {
			if (!main_core.Type.isStringFilled(rule)) {
				return null;
			}
			const res = {};
			const pairs = rule.split(';').map(it => it.split('=')).filter(([field]) => main_core.Type.isStringFilled(field));
			for (const [field, value] of pairs) {
				if (field === 'FREQ' && ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(value)) {
					res.FREQ = value;
				}
				if (['COUNT', 'INTERVAL'].includes(field)) {
					res[field] = Math.max(1, parseInt(value, 10) ?? 0);
				}
				if (field === 'UNTIL') {
					res.UNTIL = value;
				}
				if (field === 'BYDAY') {
					const regex = /(([-+])?\d+)?(MO|TU|WE|TH|FR|SA|SU)/;
					for (const day of value.split(',').filter(d => regex.test(d))) {
						const matches = [...day.match(regex)];
						res.BYDAY ??= {};
						res.BYDAY[matches[3]] = matches[1] ?? matches[3];
					}
					res.BYDAY ??= {
						MO: 'MO'
					};
				}
			}
			return res;
		}
	}

	class EventApi {
		static async list(params) {
			const {
				categoryId,
				fromMonth,
				fromYear,
				toMonth,
				toYear
			} = params;
			const response = await BX.ajax.runAction('calendar.open-events.Event.list', {
				data: {
					categoryId,
					fromMonth,
					fromYear,
					toMonth,
					toYear
				}
			});
			return response.data;
		}
		static async getTsRange(categoryId) {
			const response = await BX.ajax.runAction('calendar.open-events.Event.getTsRange', {
				data: {
					categoryId
				}
			});
			return {
				from: new Date(parseInt(response.data.from, 10) * 1000),
				to: new Date(parseInt(response.data.to, 10) * 1000)
			};
		}
		static async setAttendeeStatus(eventId, attendeeStatus) {
			const response = await BX.ajax.runAction('calendar.open-events.Event.setAttendeeStatus', {
				data: {
					eventId,
					attendeeStatus
				}
			});
			return response.data;
		}
		static async setWatched(eventIds) {
			const response = await BX.ajax.runAction('calendar.open-events.Event.setWatched', {
				data: {
					eventIds
				}
			});
			return response.data;
		}
	}

	class FilterApi {
		static async query(params) {
			const {
				filterId,
				fromDate,
				fromMonth,
				fromYear,
				toDate,
				toMonth,
				toYear
			} = params;
			const response = await BX.ajax.runAction('calendar.open-events.Filter.query', {
				data: {
					filterId,
					fromDate,
					fromMonth,
					fromYear,
					toDate,
					toMonth,
					toYear
				}
			});
			return response.data;
		}
		static async getTsRange(filterId) {
			const response = await BX.ajax.runAction('calendar.open-events.Filter.getTsRange', {
				data: {
					filterId
				}
			});
			return {
				from: new Date(parseInt(response.data.from, 10) * 1000),
				to: new Date(parseInt(response.data.to, 10) * 1000)
			};
		}
	}

	const FILTER_CATEGORY_ID = -1;
	class Manager extends main_core_events.EventEmitter {
		#filter;
		#events = [];
		#eventIds = {};
		#shownRanges = {};
		#loadedRanges = {};
		#tsRanges = {};
		#eventPromises = {};
		#tsRangePromises = {};
		constructor() {
			super();
			this.setEventNamespace('Calendar.OpenEvents.List.EventManager');
			this.#subscribeToPull();
		}
		setFilter(filter) {
			this.#filter = filter;
		}
		#subscribeToPull() {
			if (!BX.PULL) {
				console.info('BX.PULL not initialized');
				return;
			}
			const pullRequests = new PullRequests();
			pullRequests.subscribe('create', this.#createEventPull.bind(this));
			pullRequests.subscribe('update', this.#updateEventPull.bind(this));
			pullRequests.subscribe('delete', this.#deletePullEvent.bind(this));
			BX.PULL.subscribe(pullRequests);
		}
		#createEventPull(event) {
			const {
				fields: eventDto
			} = event.getData();
			const newEvent = new EventModel(eventDto);
			this.#events.push(newEvent);
			[0, newEvent.categoryId].forEach(categoryId => this.#eventIds[categoryId]?.push(newEvent.id));
			if (newEvent.creatorId !== AppSettings.currentUserId) {
				newEvent.isNew = true;
				[0, newEvent.categoryId].forEach(categoryId => CategoryManager.incrementNewCounter(categoryId));
			}
			CategoryManager.bubbleUp(newEvent.categoryId);
			this.emit('update', {
				eventId: newEvent.id
			});
		}
		#updateEventPull(event) {
			const {
				fields: eventDto,
				[AppSettings.pullEventUserFieldsKey]: userFields
			} = event.getData();
			Object.assign(eventDto, userFields || {});
			this.#updateEvent(eventDto.id, eventDto);
		}
		#deletePullEvent(event) {
			const {
				fields: {
					eventId
				}
			} = event.getData();
			this.#deleteEvent(eventId);
		}
		async setEventAttendee(eventId, isAttendee) {
			this.#updateEvent(eventId, {
				isAttendee
			});
			try {
				await EventApi.setAttendeeStatus(eventId, isAttendee);
			} catch (e) {
				this.#updateEvent(eventId, {
					isAttendee: !isAttendee
				});
			}
		}
		async setEventWatched(eventId) {
			const event = this.#getEvent(eventId);
			if (!event.isNew) {
				return;
			}
			this.#updateEvent(eventId, {
				isNew: false
			});
			try {
				await EventApi.setWatched([eventId]);
				CategoryManager.decrementNewCounter(event.categoryId);
			} catch {
				this.#updateEvent(eventId, {
					isNew: true
				});
			}
		}
		#updateEvent(eventId, fields) {
			const event = this.#getEvent(eventId);
			if (!event) {
				return;
			}
			event.updateFields(fields);
			this.emit('update', {
				eventId
			});
		}
		#deleteEvent(eventId) {
			this.#events = this.#events.filter(it => it.id !== eventId);
			this.emit('delete', {
				eventId
			});
		}
		#getEvent(eventId) {
			return this.#events.find(it => it.id === eventId) ?? null;
		}
		async filterEvents() {
			const filterKey = this.#filter.getFilterFieldsKey();
			if (filterKey !== this.filterEvents.previousFilterKey) {
				delete this.#shownRanges[FILTER_CATEGORY_ID];
				delete this.#loadedRanges[FILTER_CATEGORY_ID];
				delete this.#eventIds[FILTER_CATEGORY_ID];
				delete this.#eventPromises[FILTER_CATEGORY_ID];
				delete this.#tsRanges[FILTER_CATEGORY_ID];
				delete this.#tsRangePromises[FILTER_CATEGORY_ID];
			}
			this.filterEvents.previousFilterKey = filterKey;
			return this.getEvents(FILTER_CATEGORY_ID);
		}
		filterNext() {
			return this.getNext(FILTER_CATEGORY_ID);
		}
		filterPrevious() {
			return this.getPrevious(FILTER_CATEGORY_ID);
		}
		async getNext(categoryId = 0) {
			const everythingIsLoaded = this.#loadedRanges[categoryId].to >= this.#tsRanges[categoryId].to;
			const everythingIsShown = this.#shownRanges[categoryId].to >= this.#tsRanges[categoryId].to;
			const events = this.#prepareEvents(categoryId);
			if (everythingIsShown) {
				return events;
			}
			this.#shownRanges[categoryId].to = this.#getLastDayOfNextMonth(this.#shownRanges[categoryId].to);
			const eventsBeforeLoad = this.#prepareEvents(categoryId);
			if (everythingIsLoaded) {
				if (eventsBeforeLoad.length === events.length) {
					return this.getNext(categoryId);
				}
				return eventsBeforeLoad;
			}
			const loadedEvents = await this.getEvents(categoryId, {
				from: this.#shownRanges[categoryId].to,
				to: this.#shownRanges[categoryId].to
			});
			if (loadedEvents.length === eventsBeforeLoad.length) {
				await this.getEvents(categoryId, {
					from: this.#shownRanges[categoryId].to,
					to: this.#tsRanges[categoryId].to
				});
				return this.getNext(categoryId);
			}
			return loadedEvents;
		}
		async getPrevious(categoryId = 0) {
			const everythingIsLoaded = this.#loadedRanges[categoryId].from <= this.#tsRanges[categoryId].from;
			const everythingIsShown = this.#shownRanges[categoryId].from <= this.#tsRanges[categoryId].from;
			const events = this.#prepareEvents(categoryId);
			if (everythingIsShown) {
				return events;
			}
			this.#shownRanges[categoryId].from = this.#getFirstDayOfPreviousMonth(this.#shownRanges[categoryId].from);
			const eventsBeforeLoad = this.#prepareEvents(categoryId);
			if (everythingIsLoaded) {
				if (eventsBeforeLoad.length === events.length) {
					return this.getPrevious(categoryId);
				}
				return eventsBeforeLoad;
			}
			const loadedEvents = await this.getEvents(categoryId, {
				from: this.#shownRanges[categoryId].from,
				to: this.#shownRanges[categoryId].from
			});
			if (loadedEvents.length === eventsBeforeLoad.length) {
				await this.getEvents(categoryId, {
					from: this.#tsRanges[categoryId].from,
					to: this.#shownRanges[categoryId].from
				});
				return this.getPrevious(categoryId);
			}
			return loadedEvents;
		}
		async getEvents(categoryId = 0, dateRange = {}) {
			this.#tsRanges[categoryId] ??= await this.#loadTsRange(categoryId);
			const today = new Date();
			let from = dateRange.from ?? this.#getFirstDayOfPreviousMonth(today);
			let to = dateRange.to ?? this.#getLastDayOfNextMonth(today);
			if (categoryId === FILTER_CATEGORY_ID && this.#filter.isDateFieldApplied()) {
				from = this.#tsRanges[categoryId].from;
				to = this.#tsRanges[categoryId].to;
			}
			this.#loadedRanges[categoryId] ??= {
				from,
				to
			};
			this.#shownRanges[categoryId] ??= {
				from,
				to
			};
			this.#loadedRanges[categoryId].from = new Date(Math.min(from, this.#loadedRanges[categoryId].from));
			this.#loadedRanges[categoryId].to = new Date(Math.max(to, this.#loadedRanges[categoryId].to));
			const events = await this.#loadEvents(categoryId, {
				from,
				to
			});
			const alreadyLoadedIds = Object.values(this.#eventIds).flat();
			const newEvents = events.filter(it => !alreadyLoadedIds.includes(it.id));
			this.#events.push(...newEvents);
			const alreadyLoadedCategoryIds = this.#eventIds[categoryId] ?? [];
			const newCategoryEvents = events.filter(it => !alreadyLoadedCategoryIds.includes(it.id));
			this.#eventIds[categoryId] ??= [];
			this.#eventIds[categoryId].push(...newCategoryEvents.map(it => it.id));
			return this.#prepareEvents(categoryId);
		}
		#getFirstDayOfPreviousMonth(date) {
			return new Date(date.getFullYear(), date.getMonth() - 1, 1);
		}
		#getLastDayOfNextMonth(date) {
			return new Date(date.getFullYear(), date.getMonth() + 2, 0, 23, 59, 59);
		}
		#prepareEvents(categoryId) {
			const fromLimit = this.#shownRanges[categoryId].from;
			const toLimit = this.#shownRanges[categoryId].to;
			return this.#events.filter(it => this.#eventIds[categoryId].includes(it.id)).flatMap(it => RecursionParser.parseRecursion(it, {
				fromLimit,
				toLimit
			})).filter(it => it.dateFrom >= fromLimit && it.dateTo <= toLimit);
		}
		async #loadEvents(categoryId, dateRange) {
			const datesKey = this.#getDateKey(dateRange);
			this.#eventPromises[categoryId] ??= {};
			this.#eventPromises[categoryId][datesKey] ??= this.#requestEvents(categoryId, dateRange);
			const response = await this.#eventPromises[categoryId][datesKey];
			return response.map(eventDto => new EventModel(eventDto));
		}
		#getDateKey(dateRange) {
			return `${this.#getDateCode(dateRange.from)}-${this.#getDateCode(dateRange.to)}`;
		}
		#getDateCode(date) {
			return main_date.DateTimeFormat.format('d.m.Y', date);
		}
		#requestEvents(categoryId, dateRange) {
			if (categoryId === FILTER_CATEGORY_ID) {
				return FilterApi.query({
					filterId: this.#filter.id,
					fromDate: dateRange.from.getDate(),
					fromMonth: dateRange.from.getMonth() + 1,
					fromYear: dateRange.from.getFullYear(),
					toDate: dateRange.to.getDate(),
					toMonth: dateRange.to.getMonth() + 1,
					toYear: dateRange.to.getFullYear()
				});
			}
			return EventApi.list({
				categoryId,
				fromMonth: dateRange.from.getMonth() + 1,
				fromYear: dateRange.from.getFullYear(),
				toMonth: dateRange.to.getMonth() + 1,
				toYear: dateRange.to.getFullYear()
			});
		}
		async #loadTsRange(categoryId) {
			this.#tsRangePromises[categoryId] ??= this.#requestTsRange(categoryId);
			return this.#tsRangePromises[categoryId];
		}
		#requestTsRange(categoryId) {
			if (categoryId === FILTER_CATEGORY_ID) {
				return FilterApi.getTsRange(this.#filter.id);
			}
			return EventApi.getTsRange(categoryId);
		}
	}
	const EventManager = new Manager();

	const Category = {
		props: {
			category: CategoryModel
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedCategoryId: 'selectedCategoryId'
			})
		},
		methods: {
			async onClick() {
				await this.$store.dispatch('selectCategory', this.category.id);
				await this.$store.dispatch('setEventsLoading', true);
				const events = await EventManager.getEvents(this.category.id);
				if (this.selectedCategoryId !== this.category.id) {
					return;
				}
				await this.$store.dispatch('setEvents', events);
				await this.$store.dispatch('setEventsLoading', false);
			},
			getEventCountPhrase(eventsCount) {
				return main_core.Loc.getMessagePlural('CALENDAR_OPEN_EVENTS_LIST_CATEGORY_EVENTS_COUNT', eventsCount, {
					'#COUNT#': eventsCount
				});
			},
			renderCounter() {
				this.$refs.counter.innerHTML = '';
				if (this.category.newCount > 0) {
					new ui_cnt.Counter({
						value: this.category.newCount,
						color: this.category.isMuted ? ui_cnt.Counter.Color.GRAY : ui_cnt.Counter.Color.DANGER
					}).renderTo(this.$refs.counter);
				}
			}
		},
		mounted() {
			this.renderCounter();
		},
		watch: {
			category() {
				this.renderCounter();
			}
		},
		template: `
		<div
			class="calendar-open-events-list-category"
			:class="{
				'--banned': category.isBanned,
				'--selected': category.isSelected,
				'--all-category': category.id === 0,
			}"
			:data-category-id="category.id"
		>
			<div class="calendar-open-events-list-category-inner" @click="onClick">
				<div class="calendar-open-events-list-category-title">
					<div class="ui-icon-set --calendar-2" v-if="category.id === 0"></div>
					<div
						class="calendar-open-events-list-category-title-name"
						:title="category.name"
					>
						<span>{{ category.name }}</span>
						<div class="ui-icon-set --sound-off" v-if="category.isMuted && !category.isBanned"></div>
						<div class="ui-icon-set --lock" v-if="category.closed"></div>
					</div>
					<div ref="counter"></div>
				</div>
				<div
					class="calendar-open-events-list-category-info"
					v-html="getEventCountPhrase(category.eventsCount)"
					v-if="category.id !== 0"
				>
				</div>
			</div>
		</div>
	`
	};

	const CategoryList = {
		computed: {
			...ui_vue3_vuex.mapGetters({
				categories: 'categories',
				isSearchMode: 'isSearchMode',
				categoriesQuery: 'categoriesQuery'
			}),
			allCategory() {
				return this.categories.find(category => category.id === 0);
			},
			sortedCategories() {
				return [...this.categories].filter(category => category.id > 0).sort((a, b) => {
					if (a.isBanned !== b.isBanned) {
						return a.isBanned - b.isBanned;
					}
					return b.updatedAt - a.updatedAt;
				});
			}
		},
		mounted() {
			void this.loadOnScroll();
			this.$refs.categoryList.addEventListener('scroll', this.loadOnScroll);
			CategoryManager.subscribe('update', this.onCategoriesUpdatedHandler);
		},
		beforeUnmount() {
			this.$refs.categoryList.removeEventListener('scroll', this.loadOnScroll);
			CategoryManager.unsubscribe('update', this.onCategoriesUpdatedHandler);
		},
		watch: {
			categories() {
				void this.$nextTick(() => this.loadOnScroll());
			}
		},
		methods: {
			async onCategoriesUpdatedHandler() {
				const categories = await this.getCategories();
				this.$store.dispatch('setCategories', categories);
			},
			async loadOnScroll() {
				const scrollTop = this.$refs.categoryList.scrollTop;
				const scrollHeight = this.$refs.categoryList.scrollHeight;
				const offsetHeight = this.$refs.categoryList.offsetHeight;
				if (scrollTop + 1 >= scrollHeight - offsetHeight) {
					const categories = await this.loadMore();
					if (categories.length > 0) {
						this.$store.dispatch('setCategories', categories);
					}
				}
			},
			getCategories() {
				if (this.isSearchMode) {
					return CategoryManager.searchCategories(this.categoriesQuery);
				}
				return CategoryManager.getCategories();
			},
			loadMore() {
				if (this.isSearchMode) {
					return CategoryManager.searchMore();
				}
				return CategoryManager.loadMore();
			}
		},
		components: {
			Category
		},
		template: `
		<div class="calendar-open-events-list-category-list --calendar-scroll-bar" ref="categoryList">
			<Category :category="allCategory" v-show="!isSearchMode"/>
			<Category v-for="category of sortedCategories" :category="category"/>
		</div>
	`
	};

	const Categories = {
		computed: {
			...ui_vue3_vuex.mapGetters({
				isFilterMode: 'isFilterMode'
			})
		},
		components: {
			CategoriesHeader,
			CategoryList
		},
		template: `
		<div class="calendar-open-events-list-categories" :class="{ '--filter': isFilterMode }" >
			<CategoriesHeader/>
			<CategoryList/>
		</div>
	`
	};

	const TitleMenu = {
		props: {
			category: CategoryModel
		},
		data() {
			return {
				menu: main_popup.Menu
			};
		},
		methods: {
			openMenu() {
				this.menu = new main_popup.Menu({
					bindElement: this.$refs.menuIcon,
					closeByEsc: true,
					items: this.getMenuItems()
				});
				this.menu.show();
			},
			redrawMenu() {
				const itemIds = this.menu.getMenuItems().map(item => item.getId());
				itemIds.forEach(id => this.menu.removeMenuItem(id, {
					destroyEmptyPopup: false
				}));
				this.getMenuItems().forEach(item => this.menu.addMenuItem(item));
			},
			getMenuItems() {
				const items = [this.getInfoItem(), this.getOpenChatItem()];
				if (!this.category.isBanned) {
					items.push(this.getMuteItem());
				}
				items.push(this.getBanItem());
				if (this.category.permissions.edit === true) {
					items.push(this.getEditItem());
				}
				if (this.category.permissions.delete === true) {
					items.push(this.getDeleteItem());
				}
				return items;
			},
			getInfoItem() {
				return {
					html: `
					<div class="calendar-open-events-list-menu-item">
						<div class="ui-icon-set --info-circle"></div>
						<span>${this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_MENU_ABOUT_CATEGORY')}</span>
					</div>
				`,
					onclick: () => {
						this.menu.close();
						alert('info');
					}
				};
			},
			getOpenChatItem() {
				return {
					html: `
					<div class="calendar-open-events-list-menu-item">
						<div class="ui-icon-set --chats-2"></div>
						<span>${this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_MENU_OPEN_CHANNEL')}</span>
					</div>
				`,
					onclick: () => {
						this.menu.close();
						im_public_iframe.Messenger.openChat(`chat${this.category.channelId}`);
					}
				};
			},
			getMuteItem() {
				return {
					html: this.renderMuteItem(),
					onclick: () => {
						this.category.isMuted = !this.category.isMuted;
						this.muteCategory(this.category.isMuted);
						this.redrawMenu();
					}
				};
			},
			renderMuteItem() {
				const icon = this.category.isMuted ? '--notifications-off' : '--bell-1';
				const text = this.category.isMuted ? this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_MENU_ENABLE_NOTIFY') : this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_MENU_DISABLE_NOTIFY');
				return `
				<div class="calendar-open-events-list-menu-item">
					<div class="ui-icon-set ${icon}"></div>
					<span>${text}</span>
				</div>
			`;
			},
			getBanItem() {
				return {
					html: this.renderBanItem(),
					onclick: () => {
						this.category.isBanned = !this.category.isBanned;
						this.banCategory(this.category.isBanned);
						this.redrawMenu();
					}
				};
			},
			renderBanItem() {
				const icon = this.category.isBanned ? '--bell-1' : '--unavailable';
				const text = this.category.isBanned ? this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_MENU_SUBSCRIBE') : this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_MENU_UNSUBSCRIBE');
				return `
				<div class="calendar-open-events-list-menu-item">
					<div class="ui-icon-set ${icon}"></div>
					<span>${text}</span>
				</div>
			`;
			},
			getEditItem() {
				return {
					html: `
					<div class="calendar-open-events-list-menu-item">
						<div class="ui-icon-set --pencil-40"></div>
						<span>${this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_MENU_EDIT')}</span>
					</div>
				`,
					onclick: () => {
						this.menu.close();
						this.openEditCategoryForm();
					}
				};
			},
			getDeleteItem() {
				return {
					html: `
					<div class="calendar-open-events-list-menu-item">
						<div class="ui-icon-set --cross-40"></div>
						<span>${this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_MENU_DELETE')}</span>
					</div>
				`,
					onclick: () => {
						this.menu.close();
						this.deleteCategory();
					}
				};
			},
			muteCategory(isMuted) {
				void CategoryManager.setMute(this.category.id, isMuted);
			},
			banCategory(isBanned) {
				void CategoryManager.setBan(this.category.id, isBanned);
			},
			openEditCategoryForm() {
				this.$refs.editForm.show({
					category: this.category
				});
			},
			deleteCategory() {
				alert('delete category ' + this.category.id);
			}
		},
		components: {
			CategoryEditForm
		},
		template: `
		<div
			class="calendar-open-events-list-item__list-header__menu ui-icon-set --more-information"
			@click="openMenu"
			ref="menuIcon"
		></div>
		<CategoryEditForm ref="editForm"/>
	`
	};

	const EventListTitle = {
		computed: {
			...ui_vue3_vuex.mapGetters({
				isFilterMode: 'isFilterMode',
				category: 'selectedCategory'
			}),
			title() {
				if (this.isFilterMode) {
					return this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_SEARCH_RESULT');
				}
				return this.category?.name;
			}
		},
		components: {
			TitleMenu
		},
		template: `
		<div class="calendar__open-event__list-header">
			<div class="calendar__open-event__list-header__title" :title="title">
				{{ title }}
			</div>
			<div class="calendar__open-event__list-header__icon ui-icon-set --lock" v-if="category.closed"></div>
			<TitleMenu v-if="!isFilterMode && category.id" :category="category"/>
		</div>
	`
	};

	const CalendarSheet = {
		props: {
			event: EventModel
		},
		computed: {
			calendarDate() {
				return this.event.dateFrom.getDate();
			},
			calendarMonth() {
				return main_date.DateTimeFormat.format('f', this.event.dateFrom);
			},
			calendarTime() {
				if (this.event.isFullDay) {
					return this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_ALL_DAY');
				}
				const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				const time = main_date.DateTimeFormat.format(timeFormat, this.event.dateFrom);
				const dayOfWeek = main_date.DateTimeFormat.format('D', this.event.dateFrom);
				return this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_FORMAT_WEEKDAY_TIME', {
					'#WEEKDAY#': dayOfWeek,
					'#TIME#': time
				});
			},
			isCreator() {
				return this.event.creatorId === AppSettings.currentUserId;
			}
		},
		template: `
		<div class="calendar-open-events-list-calendar-sheet" :style="{ borderColor: event.color }">
			<div class="calendar-open-events-list-calendar-sheet-header" :style="{ backgroundColor: event.color }">
				<div class="calendar-open-events-list-calendar-sheet-header-hole"></div>
				<div class="calendar-open-events-list-calendar-sheet-header-hole"></div>
			</div>
			<div class="calendar-open-events-list-calendar-sheet-content">
				<div class="calendar-open-events-list-calendar-sheet-date">
					{{ calendarDate }}
				</div>
				<div class="calendar-open-events-list-calendar-sheet-month">
					{{ calendarMonth }}
				</div>
				<div class="calendar-open-events-list-calendar-sheet-time" :style="{ color: event.color }">
					{{ calendarTime }}
				</div>
			</div>
			<div
				class="calendar-open-events-list-calendar-sheet-crown"
				v-if="isCreator"
				:title="$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_EVENT_YOU_ARE_OWNER')"
			>
				<div class="ui-icon-set --crown-2"></div>
			</div>
		</div>
	`
	};

	const AttendButton = {
		props: {
			isAttendee: Boolean
		},
		methods: {
			renderButton() {
				const button = new ui_buttons.Button({
					color: this.isAttendee ? ui_buttons.ButtonColor.LIGHT_BORDER : ui_buttons.ButtonColor.SUCCESS,
					size: ui_buttons.ButtonSize.SMALL,
					round: true,
					//TODO: replace with icon property when icons ready
					// icon: this.isAttendee ? ButtonIcon. : ButtonIcon.,
					className: this.isAttendee ? 'calendar-open-events-list-item__attend-button --off' : 'calendar-open-events-list-item__attend-button --on'
				});
				this.$refs.bindBtn.innerHTML = '';
				button.renderTo(this.$refs.bindBtn);
			}
		},
		watch: {
			isAttendee() {
				this.renderButton();
			}
		},
		mounted() {
			this.renderButton();
		},
		template: `
		<div ref="bindBtn"></div>
	`
	};

	const CommentCounter = {
		props: {
			commentsCount: Number
		},
		methods: {
			renderCounter() {
				const value = this.commentsCount;
				const color = value ? ui_cnt.Counter.Color.PRIMARY : ui_cnt.Counter.Color.GRAY;
				this.$refs.counter.innerHTML = '';
				new ui_cnt.Counter({
					value,
					color,
					size: ui_cnt.Counter.Size.LARGE
				}).renderTo(this.$refs.counter);
			}
		},
		mounted() {
			this.renderCounter();
		},
		watch: {
			commentsCount() {
				this.renderCounter();
			}
		},
		template: `
		<div class="calendar-open-events-list-item-comment-counter">
			<div class="ui-icon-set --chats-1"></div>
			<div ref="counter"></div>
		</div>
	`
	};

	const AttendeeCounter = {
		props: {
			attendeesCount: Number,
			maxAttendees: Number | null
		},
		computed: {
			attendeesValue() {
				if (this.maxAttendees) {
					return this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_EVENT_ATTENDEE_VALUE', {
						'#COUNT#': this.attendeesCount,
						'#COUNT_MAX#': this.maxAttendees
					});
				} else {
					return this.attendeesCount;
				}
			}
		},
		template: `
		<div class="calendar-open-events-list-item-attendee-counter">
			<div class="ui-icon-set --persons-2"></div>
			<div v-html="attendeesValue"></div>
		</div>
	`
	};

	const NameWithCounter = {
		emits: ['openEvent'],
		props: {
			event: EventModel
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedCategoryId: 'selectedCategoryId'
			}),
			formattedRrule() {
				if (this.event.rrule.amount === 0 || this.event.rrule.amount === Infinity) {
					return '';
				}
				return this.$Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_NUM_MEETING_OF_AMOUNT', {
					'#NUM#': this.event.rrule.num,
					'#AMOUNT#': this.event.rrule.amount
				});
			}
		},
		methods: {
			renderCounter() {
				this.$refs.counter.innerHTML = '';
				if (this.event.isNew) {
					new ui_cnt.Counter({
						value: 1,
						color: ui_cnt.Counter.Color.DANGER
					}).renderTo(this.$refs.counter);
				}
			},
			bindRrulePopup() {
				if (!this.$refs.rrule) {
					return;
				}
				const popup = new main_popup.Popup({
					bindElement: this.$refs.rrule,
					content: this.event.rruleDescription,
					darkMode: true,
					bindOptions: {
						position: 'top'
					},
					offsetTop: -10,
					angle: true,
					autoHide: true
				});
				this.bindShowOnHover(popup);
			},
			bindShowOnHover(popup) {
				if (popup instanceof main_popup.Menu) {
					popup = popup.getPopupWindow();
				}
				const bindElement = popup.bindElement;
				const container = popup.getPopupContainer();
				let hoverElement = null;
				const closeMenuHandler = () => {
					setTimeout(() => {
						if (!container.contains(hoverElement) && !bindElement.contains(hoverElement)) {
							popup.close();
						}
					}, 100);
				};
				const showMenuHandler = () => {
					setTimeout(() => {
						if (bindElement.contains(hoverElement)) {
							popup.show();
						}
					}, 300);
				};
				const clickHandler = () => {
					if (!popup.isShown()) {
						popup.show();
					}
				};
				main_core.Event.bind(document, 'mouseover', event => {
					hoverElement = event.target;
				});
				main_core.Event.bind(bindElement, 'mouseenter', showMenuHandler);
				main_core.Event.bind(bindElement, 'mouseleave', closeMenuHandler);
				main_core.Event.bind(container, 'mouseleave', closeMenuHandler);
				main_core.Event.bind(bindElement, 'click', clickHandler);
				const adjustPosition = () => {
					const angleLeft = main_popup.Popup.getOption('angleMinBottom');
					const popupWidth = popup.getPopupContainer().offsetWidth;
					const elementWidth = popup.bindElement.offsetWidth;
					popup.setOffset({
						offsetLeft: elementWidth / 2 - popupWidth / 2
					});
					popup.adjustPosition();
					if (popup.angle) {
						popup.setAngle({
							offset: popupWidth / 2 + angleLeft
						});
					}
				};
				popup.subscribeFromOptions({
					onShow: () => {
						adjustPosition();
						document.addEventListener('scroll', adjustPosition, true);
					},
					onClose: () => {
						document.removeEventListener('scroll', adjustPosition, true);
					}
				});
			}
		},
		mounted() {
			this.renderCounter();
			this.bindRrulePopup();
		},
		watch: {
			event() {
				this.renderCounter();
			}
		},
		template: `
		<div class="calendar-open-events-list-item-name">
			<div
				class="calendar-open-events-list-item__event-name-with-counter"
				@click="$emit('openEvent')"
			>
				<div class="calendar-open-events-list-event-name-category" v-if="selectedCategoryId === 0">
					{{ event.categoryName }}
				</div>
				<div v-show="event.isNew" ref="counter"></div>
				<div class="calendar-open-events-list-item__event-name" :title="event.name">
					{{ event.name }}
				</div>
			</div>
			<div class="calendar-open-events-list-event-time">
				<div class="calendar-open-events-list-event-time-datetime">
					{{ event.formattedDateTime }}
				</div>
				<div class="calendar-open-events-list-event-time-full-day" v-if="event.isFullDay">
					{{ $Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_ALL_DAY') }}
				</div>
				<div
					class="calendar-open-events-list-event-time-recursion"
					ref="rrule"
					v-if="event.rrule"
				>
					<div class="ui-icon-set --refresh-3"></div>
					<div class="calendar-open-events-list-event-time-rrule" v-if="formattedRrule">
						{{ formattedRrule }}
					</div>
				</div>
			</div>
		</div>
	`
	};

	const Event = {
		props: {
			event: EventModel
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedCategoryId: 'selectedCategoryId'
			})
		},
		methods: {
			async openComments() {
				const categoryChannelId = this.event.categoryChannelId;
				const messageId = this.event.threadId;
				await im_public_iframe.Messenger.openChat(`chat${categoryChannelId}`, messageId);
				main_core_events.EventEmitter.emit(im_v2_const.EventType.dialog.openComments, {
					messageId
				});
			},
			async openEvent() {
				const {
					EntryManager,
					Entry,
					CalendarSection
				} = await main_core.Runtime.loadExtension('calendar.entry');
				const section = new CalendarSection({
					...AppSettings.openEventSection,
					PERM: {
						'view_time': true,
						'view_title': true,
						'view_full': true,
						'add': false,
						'edit': false,
						'edit_section': false,
						'access': false
					}
				});
				const entry = new Entry({
					data: {
						ID: this.event.id,
						NAME: this.event.name,
						SKIP_TIME: this.event.isFullDay,
						dateFrom: this.event.dateFrom,
						dateTo: this.event.dateTo,
						SECT_ID: section.getId(),
						RRULE: this.event.fields.rrule,
						COLOR: this.event.color,
						'~RRULE_DESCRIPTION': this.event.rruleDescription
					}
				});
				EntryManager.openCompactViewForm({
					entry,
					sections: [section]
				});
				if (this.event.isNew) {
					EventManager.setEventWatched(this.event.id);
				}
			},
			async attendEvent(isAttendee) {
				EventManager.setEventAttendee(this.event.id, isAttendee);
			}
		},
		components: {
			CalendarSheet,
			AttendButton,
			CommentCounter,
			AttendeeCounter,
			NameWithCounter
		},
		template: `
		<div class="calendar-open-events-list-item">
			<div class="calendar-open-events-list-item-info">
				<CalendarSheet :event="event"/>
				<NameWithCounter
					:event="event"
					@openEvent="openEvent()"
				/>
			</div>
			<div class="calendar-open-events-list-item-actions">
				<CommentCounter :commentsCount="event.commentsCount" @click="openComments()"/>
				<AttendeeCounter
					:attendeesCount="event.attendeesCount"
					:maxAttendees="event.eventOptions.maxAttendees"
				/>
				<AttendButton :isAttendee="event.isAttendee" @click="attendEvent(!event.isAttendee)"/>
			</div>
		</div>
	`
	};

	const EmptyState = {
		template: `
		<div class="calendar-open-events-list-events-empty">
			<div class="calendar-open-events-list-events-empty-icon"></div>
			<div class="calendar-open-events-list-events-empty-title">
				{{ $Bitrix.Loc.getMessage('CALENDAR_OPEN_EVENTS_LIST_EMPTY_STATE') }}
			</div>
		</div>
	`
	};

	const WATCH_EVENT_MS = 2000;
	const EventList = {
		data() {
			return {
				observedEvents: new Map(),
				eventRefs: []
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				events: 'events',
				selectedCategoryId: 'selectedCategoryId',
				isFilterMode: 'isFilterMode'
			}),
			sortedEvents() {
				return [...this.events].sort((a, b) => {
					if (a.dateFrom.getTime() === b.dateFrom.getTime()) {
						if (a.dateTo.getTime() === b.dateTo.getTime()) {
							return parseInt(a.id) - parseInt(b.id);
						}
						return a.dateTo.getTime() - b.dateTo.getTime();
					}
					return a.dateFrom.getTime() - b.dateFrom.getTime();
				});
			}
		},
		methods: {
			initObserver() {
				this.observer = new IntersectionObserver(this.observerCallback, {
					root: this.$refs.eventList,
					threshold: 0.9
				});
			},
			observerCallback(entries) {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						this.processIntersectedElement(entry.target);
					}
				});
			},
			processIntersectedElement(element) {
				const eventId = parseInt(element.dataset.eventId, 10);
				if (this.observedEvents.has(eventId)) {
					return;
				}
				this.observedEvents.set(eventId, eventId);
				setTimeout(() => {
					this.observer.unobserve(element);
					EventManager.setEventWatched(eventId);
				}, WATCH_EVENT_MS);
			},
			scrollToUpcomingEvent() {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const upcomingEvent = this.sortedEvents.find(event => event.dateFrom >= today);
				if (!upcomingEvent) {
					return;
				}
				this.$refs.eventList.scrollTop = this.eventRefs[upcomingEvent.uniqueId].offsetTop;
			},
			async loadOnScroll() {
				const scrollTop = this.$refs.eventList.scrollTop;
				const scrollHeight = this.$refs.eventList.scrollHeight;
				const offsetHeight = this.$refs.eventList.offsetHeight;
				if (scrollTop + 1 >= scrollHeight - offsetHeight) {
					await this.$store.dispatch('setEventsUpdating', true);
					const events = await this.getNext();
					await this.$store.dispatch('setEvents', events);
					await this.$store.dispatch('setEventsUpdating', false);
				}
				if (scrollTop <= 0) {
					await this.$store.dispatch('setEventsUpdating', true);
					const events = await this.getPrevious();
					await this.$store.dispatch('setEvents', events);
					await this.$store.dispatch('setEventsUpdating', false);
					this.$refs.eventList.scrollTop += this.$refs.eventList.scrollHeight - scrollHeight;
				}
			},
			getNext() {
				if (this.isFilterMode) {
					return EventManager.filterNext();
				}
				return EventManager.getNext(this.selectedCategoryId);
			},
			getPrevious() {
				if (this.isFilterMode) {
					return EventManager.filterPrevious();
				}
				return EventManager.getPrevious(this.selectedCategoryId);
			},
			setEventRef(ref) {
				if (!ref) {
					return;
				}
				const {
					event,
					$el
				} = ref;
				this.eventRefs[event.uniqueId] = $el;
				if (event.isNew) {
					this.observer.observe($el);
				}
			}
		},
		created() {
			this.initObserver();
		},
		mounted() {
			this.scrollToUpcomingEvent();
			void this.loadOnScroll();
			this.$refs.eventList.addEventListener('scroll', this.loadOnScroll);
		},
		beforeUnmount() {
			this.observer.disconnect();
			this.$refs.eventList.removeEventListener('scroll', this.loadOnScroll);
		},
		components: {
			Event,
			EmptyState
		},
		template: `
		<div class="calendar-open-events-list-events-list --calendar-scroll-bar" ref="eventList">
			<Event
				v-for="event of sortedEvents"
				:event="event"
				:data-event-id="event.id"
				:ref="setEventRef"
			/>
			<EmptyState v-if="events.length === 0"/>
		</div>
	`
	};

	const Events = {
		computed: {
			...ui_vue3_vuex.mapGetters({
				selectedCategoryId: 'selectedCategoryId',
				areEventsUpdating: 'areEventsUpdating',
				isFilterMode: 'isFilterMode',
				events: 'events'
			})
		},
		mounted() {
			EventManager.subscribe('update', this.eventManagerUpdateHandler);
			EventManager.subscribe('delete', this.eventManagerDeleteHandler);
			new main_loader.Loader().show(this.$refs.events);
		},
		beforeUnmount() {
			EventManager.unsubscribe('update', this.eventManagerUpdateHandler);
			EventManager.unsubscribe('delete', this.eventManagerDeleteHandler);
		},
		methods: {
			async eventManagerUpdateHandler(event) {
				const {
					eventId
				} = event.getData();
				const events = await this.getEvents();
				if (!events.find(it => it.id === eventId)) {
					return;
				}
				this.$store.dispatch('setEvents', events);
			},
			async eventManagerDeleteHandler(event) {
				const {
					eventId
				} = event.getData();
				if (!this.events.find(it => it.id === eventId)) {
					return;
				}
				const events = await this.getEvents();
				this.$store.dispatch('setEvents', events);
			},
			async getEvents() {
				if (this.isFilterMode) {
					return EventManager.filterEvents();
				}
				return EventManager.getEvents(this.selectedCategoryId);
			}
		},
		components: {
			EventListTitle,
			EventList
		},
		template: `
		<div
			class="calendar-open-events-list-events"
			:class="{ '--updating': areEventsUpdating }"
			ref="events"
		>
			<EventListTitle/>
			<EventList/>
		</div>
	`
	};

	const BaseComponent = {
		computed: {
			...ui_vue3_vuex.mapGetters({
				areEventsLoading: 'areEventsLoading'
			})
		},
		components: {
			Categories,
			Events
		},
		template: `
		<Categories/>
		<div class="calendar-open-events-list-events-loader" v-if="areEventsLoading"></div>
		<Events v-else/>
	`
	};

	const CategoriesSearchStore = {
		state() {
			return {
				isSearchMode: false,
				categoriesQuery: ''
			};
		},
		actions: {
			setSearchMode: (store, isSearchMode) => {
				store.commit('setSearchMode', isSearchMode);
			},
			setCategoriesQuery: (store, categoriesQuery) => {
				store.commit('setCategoriesQuery', categoriesQuery);
			}
		},
		mutations: {
			setSearchMode: (state, isSearchMode) => {
				state.isSearchMode = isSearchMode;
			},
			setCategoriesQuery: (state, categoriesQuery) => {
				state.categoriesQuery = categoriesQuery;
			}
		},
		getters: {
			isSearchMode: state => state.isSearchMode,
			categoriesQuery: state => state.categoriesQuery
		}
	};

	const CategoriesStore = {
		state() {
			return {
				selectedCategoryId: 0,
				categories: []
			};
		},
		actions: {
			setCategories: (store, categories) => {
				store.commit('setCategories', categories);
			},
			selectCategory: (store, categoryId) => {
				store.commit('selectCategory', categoryId);
			}
		},
		mutations: {
			setCategories: (state, categories) => {
				state.categories = categories;
			},
			selectCategory: (state, categoryId) => {
				state.selectedCategoryId = categoryId;
			}
		},
		getters: {
			categories: state => state.categories.map(category => {
				category.isSelected = category.id === state.selectedCategoryId;
				return category;
			}),
			selectedCategory: state => state.categories.find(it => it.id === state.selectedCategoryId),
			selectedCategoryId: state => state.selectedCategoryId
		}
	};

	const EventsStore = {
		state() {
			return {
				events: [],
				areEventsLoading: false,
				areEventsUpdating: false,
				isFilterMode: false
			};
		},
		actions: {
			setEventsLoading: (store, areEventsLoading) => {
				store.commit('setEventsLoading', areEventsLoading);
			},
			setEventsUpdating: (store, areEventsUpdating) => {
				store.commit('setEventsUpdating', areEventsUpdating);
			},
			setEvents: (store, events) => {
				store.commit('setEvents', events);
			},
			setFilterMode: (store, isFilterMode) => {
				store.commit('setFilterMode', isFilterMode);
			}
		},
		mutations: {
			setEventsLoading: (state, areEventsLoading) => {
				state.areEventsLoading = areEventsLoading;
			},
			setEventsUpdating: (state, areEventsUpdating) => {
				state.areEventsUpdating = areEventsUpdating;
			},
			setEvents: (state, events) => {
				state.events = events;
			},
			setFilterMode: (state, isFilterMode) => {
				state.isFilterMode = isFilterMode;
			}
		},
		getters: {
			areEventsLoading: state => state.areEventsLoading,
			areEventsUpdating: state => state.areEventsUpdating,
			events: state => state.events,
			isFilterMode: state => state.isFilterMode
		}
	};

	const Store = ui_vue3_vuex.createStore({
		modules: {
			categories: CategoriesStore,
			categoriesSearch: CategoriesSearchStore,
			events: EventsStore
		}
	});

	class List {
		#params;
		#application;
		constructor(params) {
			this.#params = params;
			this.#mountApplication();
		}
		#mountApplication() {
			this.#application = ui_vue3.BitrixVue.createApp({
				name: 'List',
				props: {
					filterId: String
				},
				data() {
					return {
						isLoading: true
					};
				},
				computed: {
					...ui_vue3_vuex.mapGetters({
						selectedCategoryId: 'selectedCategoryId'
					})
				},
				async mounted() {
					this.bindFilter(this.filterId);
					const categories = await CategoryManager.getCategories();
					const events = await EventManager.getEvents(this.selectedCategoryId);
					this.isLoading = false;
					this.$store.dispatch('setCategories', categories);
					this.$store.dispatch('setEvents', events);
				},
				methods: {
					bindFilter(filterId) {
						const filter = new calendar_openEvents_filter.Filter(filterId);
						EventManager.setFilter(filter);
						filter.subscribe('beforeApply', () => {
							this.isLoading = true;
						});
						filter.subscribe('apply', async () => {
							const events = await EventManager.filterEvents();
							this.$store.dispatch('setEvents', events);
							this.$store.dispatch('setFilterMode', true);
							this.isLoading = false;
						});
						filter.subscribe('clear', async () => {
							const events = await EventManager.getEvents(this.selectedCategoryId);
							this.$store.dispatch('setEvents', events);
							this.$store.dispatch('setFilterMode', false);
							this.isLoading = false;
						});
					}
				},
				components: {
					BaseComponent
				},
				template: `
					<div class="calendar-open-events-list-loader" v-if="isLoading"></div>
					<BaseComponent v-else/>
				`
			}, {
				filterId: this.#params.filterId
			});
			this.#application.use(Store);
			this.#application.mount(this.#params.container);
		}
	}

	exports.List = List;

})(this.BX.Calendar.OpenEvents = this.BX.Calendar.OpenEvents || {}, BX.Vue3, BX.Calendar.OpenEvents, BX.Vue3.Vuex, BX.Main, BX.UI.EntitySelector, BX.UI, BX, BX.Event, window, window, BX.UI, BX.Main, BX, BX.Messenger.v2.Lib, BX, BX.Messenger.v2.Const, BX.UI);
//# sourceMappingURL=list.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, main_core, ui_entitySelector, socialnetwork_v2_const) {
	'use strict';

	class TagsSelector {
		#options;
		#container;
		constructor(options) {
			this.#options = options;
			this.selector = this.createSelector();
		}
		createSelector() {
			const dialogOptions = {
				context: this.#options.context,
				width: 350,
				height: 300,
				dropdownMode: true,
				compactView: true,
				cacheable: true,
				preload: true,
				enableSearch: true,
				offsetAnimation: false,
				searchOptions: {
					allowCreateItem: true
				},
				popupOptions: {
					bindOptions: {
						position: 'top'
					},
					targetContainer: this.#options?.targetContainer ?? document.body
				},
				entities: [{
					id: socialnetwork_v2_const.EntitySelectorEntity.ProjectTag,
					options: {
						groupId: this.#options.groupId
					}
				}],
				events: {
					'Item:onSelect': event => {
						const item = event.getData().item;
						this.#options.onSelect?.(item);
					},
					'Item:onDeselect': event => {
						const item = event.getData().item;
						this.#options.onDeselect?.(item);
					},
					'Search:onItemCreateAsync': event => this.#createTag(event)
				}
			};
			const tagSelectionOptions = {
				showAddButton: true,
				multiple: true,
				textBoxWidth: 'auto',
				showCreateButton: false,
				dialogOptions
			};
			return new ui_entitySelector.TagSelector(tagSelectionOptions);
		}
		async #createTag(event) {
			return new Promise(resolve => {
				const {
					searchQuery
				} = event.getData();
				const name = searchQuery.getQuery().toLowerCase();
				const dialog = event.getTarget();
				setTimeout(() => {
					const tagsList = name.split(',');
					tagsList.forEach(tag => {
						const item = dialog.addItem({
							id: tag,
							entityId: socialnetwork_v2_const.EntitySelectorEntity.ProjectTag,
							title: tag,
							tabs: ['all', 'recents']
						});
						if (item) {
							item.select();
						}
					});
					resolve();
				}, 1000);
			});
		}
		renderTo(container, tags = []) {
			this.#container = container;
			this.selector.renderTo(this.#container);
			this.selector.getDialog().unfreeze();
			this.#setTags(tags);
		}
		#setTags(tags = []) {
			const dialog = this.selector.dialog;
			if (!main_core.Type.isArrayFilled(tags) || !dialog) {
				return;
			}
			tags.forEach(tag => {
				dialog.addItem({
					id: tag,
					title: tag,
					entityId: socialnetwork_v2_const.EntitySelectorEntity.ProjectTag,
					entityType: 'default',
					tabs: 'all',
					selected: true
				});
			});
		}
		destroy() {
			this.selector.getDialog()?.destroy();
			if (main_core.Type.isDomNode(this.#container)) {
				this.#container.innerHTML = '';
			}
			this.#container = null;
		}
	}

	exports.TagsSelector = TagsSelector;

})(this.BX.Socialnetwork.V2.Components.Selectors = this.BX.Socialnetwork.V2.Components.Selectors || {}, BX, BX.UI.EntitySelector, BX.Socialnetwork.V2);
//# sourceMappingURL=tags-selector.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports, ui_entitySelector, main_core) {
	'use strict';

	class TagFooter extends ui_entitySelector.DefaultFooter {
		getContent() {
			return this.cache.remember('tag-footer-content', () => {
				const createButton = main_core.Tag.render`
				<a class="ui-selector-footer-link ui-selector-footer-link-add"  
					id="tags-widget-custom-footer-add-new" hidden>
						${main_core.Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_TAG_FOOTER_CREATE')}
				</a>
			`;
				main_core.Event.bind(createButton, 'click', () => this.createItem());
				const openTagListButton = main_core.Tag.render`
				<a class="ui-selector-footer-link">
					${main_core.Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_TAG_FOOTER_GET_TAG_SLIDER')}
				</a>
			`;
				main_core.Event.bind(openTagListButton, 'click', () => {
					const sliderLink = new main_core.Uri('/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.tag.list/slider.php');
					top.BX.SidePanel.Instance.open(sliderLink.toString(), {
						width: 970,
						allowChangeHistory: false,
						cacheable: false
					});
				});
				return main_core.Tag.render`
				<div class="tags-widget-custom-footer">
					${createButton}
					<span class="ui-selector-footer-conjunction" 
						id="tags-widget-custom-footer-conjunction" hidden>
							${main_core.Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_TAG_FOOTER_OR')}
					</span>
					${openTagListButton}
				</div>
			`;
			});
		}
		createItem() {
			if (!this.canCreateTag()) {
				return;
			}
			const tagSelector = this.getDialog().getTagSelector();
			if (tagSelector && tagSelector.isLocked()) {
				return;
			}
			const finalize = () => {
				if (this.getDialog().getTagSelector()) {
					this.getDialog().getTagSelector().unlock();
					this.getDialog().focusSearch();
				}
			};
			if (tagSelector) {
				tagSelector.lock();
			}
			this.getDialog().emitAsync('Search:onItemCreateAsync', {
				searchQuery: this.getDialog().getSearchTab().getLastSearchQuery()
			}).then(() => {
				this.getDialog().getSearchTab().clearResults();
				this.getDialog().clearSearch();
				if (this.getDialog().getActiveTab() === this.getTab()) {
					this.getDialog().selectFirstTab();
				}
				finalize();
			}).catch(() => {
				finalize();
			});
		}
		canCreateTag() {
			return this.options?.canCreateTag ?? false;
		}
	}

	exports.TagFooter = TagFooter;

})(this.BX.BIConnector.EntitySelector = this.BX.BIConnector.EntitySelector || {}, BX.UI.EntitySelector, BX);
//# sourceMappingURL=biconnector-entity-selector.bundle.js.map

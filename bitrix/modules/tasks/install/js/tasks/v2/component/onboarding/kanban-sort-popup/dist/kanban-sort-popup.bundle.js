/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_popup, ui_a11y, ui_bannerDispatcher) {
	'use strict';

	const PROMOTION_ID = 'tasks_kanban_field_sort';
	const BIND_ELEMENT_ID = 'tasks-popupMenuOptions';
	function message(phraseId) {
		return main_core.Loc.getMessage(phraseId) ?? '';
	}
	class KanbanSortPopup {
		static show() {
			new this().showPopup();
		}
		showPopup() {
			const bindElement = document.getElementById(BIND_ELEMENT_ID);
			if (!bindElement) {
				return;
			}
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				const popup = this.#createPopup(bindElement, onDone);
				popup.show();
				ui_a11y.LiveAnnouncer.announce(message('TASKS_COMPONENT_ONBOARDING_KANBAN_SORT_POPUP_TEXT'));
				this.#setViewed();
				return popup;
			});
		}
		#createPopup(bindElement, onDone) {
			return new main_popup.Popup({
				className: 'tasks-onboarding-kanban-sort-popup-wrapper',
				content: this.#getContent(),
				bindElement,
				ariaLabel: message('TASKS_COMPONENT_ONBOARDING_KANBAN_SORT_POPUP_ARIA_LABEL'),
				background: 'var(--ui-color-bg-content-inapp)',
				angle: true,
				autoHide: true,
				autoHideHandler: () => true,
				cacheable: false,
				animation: 'fading',
				padding: 0,
				maxWidth: 380,
				closeByEsc: true,
				closeIcon: true,
				focusTrap: false,
				events: {
					onDestroy: () => {
						onDone();
					}
				}
			});
		}
		#getContent() {
			return main_core.Tag.render`
			<div class="tasks-onboarding-kanban-sort-popup" data-testid="tasks-kanban-sort-onboarding">
				${message('TASKS_COMPONENT_ONBOARDING_KANBAN_SORT_POPUP_TEXT')}
			</div>
		`;
		}
		#setViewed() {
			main_core.ajax.runAction('tasks.promotion.setViewed', {
				data: {
					promotion: PROMOTION_ID
				}
			}).catch(() => {});
		}
	}

	exports.KanbanSortPopup = KanbanSortPopup;

})(this.BX.Tasks.V2.Component.Onboarding = this.BX.Tasks.V2.Component.Onboarding || {}, BX, BX.Main, BX.UI.Accessibility, BX.UI);
//# sourceMappingURL=kanban-sort-popup.bundle.js.map

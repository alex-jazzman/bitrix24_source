/* eslint-disable */
this.BX = this.BX || {};
this.BX.Main = this.BX.Main || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	class Lazyloadtotalcount {
		register(containerNode) {
			const container = containerNode ?? document.body;
			container.querySelectorAll('lazy-load-total-count:not([data-registered])').forEach(node => {
				const gridId = node.getAttribute('grid-id');
				main_core.Dom.append(this.getCounterLabel(), node);
				main_core.Dom.append(this.getCounterContainer(gridId), node);
				main_core_events.EventEmitter.subscribe('Grid::updated', event => {
					const grid = event.compatData[0];
					if (grid.getId() === gridId) {
						this.register(grid.getContainer());
					}
				});
				node.dataset.registered = true;
			});
		}
		getCounterLabel() {
			return main_core.Tag.render`
			<span class="main-pagination-lazyload-count_label">
				${main_core.Loc.getMessage('MAIN_PAGE_NAVIGATION_TOTAL_COUNTER_AMOUNT_MSGVER_1')} 
			</span>
		`;
		}
		getCounterContainer(gridId) {
			const counter = main_core.Tag.render`<span class="main-pagination-lazyload-count_container"></span>`;
			main_core.Dom.append(main_core.Tag.render`
				<a class="main-pagination-lazyload-count_counter" onclick="${this.handleCounterClick.bind(this, gridId, counter)}">
					${main_core.Loc.getMessage('MAIN_PAGE_NAVIGATION_TOTAL_COUNTER_SHOW_LINK')}
				</a>
			`, counter);
			return counter;
		}
		handleCounterClick(gridId, counter) {
			main_core.Dom.clean(counter);
			main_core.Dom.append(main_core.Tag.render`
				<svg class="main-pagination-lazyload-count_loader" viewBox="25 25 50 50">
					<circle class="main-pagination-lazyload-count_loader-path" r="20" cx="50" cy="50" stroke-width="1" stroke-miterlimit="10" fill="none"></circle>
				</svg>
			`, counter);
			const grid = BX.Main.gridManager.getById(gridId)?.instance;
			if (grid) {
				grid.getData().request('', null, null, 'get_total_rows_count', response => {
					const res = JSON.parse(response);
					main_core.Dom.clean(counter);
					main_core.Dom.append(main_core.Tag.render`<span class="main-pagination-lazyload-count_count">${res.payload.totalCount}</span>`, counter);
				});
			}
		}
	}

	exports.Lazyloadtotalcount = Lazyloadtotalcount;

})(this.BX.Main.Pagination = this.BX.Main.Pagination || {}, BX, BX.Event);
//# sourceMappingURL=lazyloadtotalcount.bundle.js.map

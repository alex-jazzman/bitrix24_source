/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_a11y) {
	'use strict';

	class WidgetLoader {
		#cache = new main_core.Cache.MemoryCache();
		constructor(options = {}) {
			this.#setOptions(options);
			if (this.#getOptions().bindOnClick !== false) {
				main_core.Event.bind(this.#getOptions().bindElement, 'click', () => {
					this.show();
				});
			}
		}
		show() {
			this.getPopup().show();
		}
		clearBeforeInsertContent() {
			this.clearSkeleton();
			const popupContainer = this.getPopup().getPopupContainer();
			main_core.Dom.prepend(this.#cache.get('popup-content'), popupContainer);
		}
		clearSkeleton() {
			const popupContainer = this.getPopup().getPopupContainer();
			main_core.Dom.removeClass(popupContainer, 'intranet-widget-skeleton__wrap');
			this.#removeSkeleton();
			this.clearLoadingState();
		}
		setLoadingState(isLoading) {
			main_core.Dom.attr(this.getPopup().getPopupContainer(), 'aria-busy', isLoading ? 'true' : null);
		}
		clearLoadingState() {
			this.setLoadingState(false);
		}
		getPopup() {
			return this.#cache.remember('popup', () => {
				const options = this.#getOptions();
				const offsetLeft = -(options.width / 2) + (options.bindElement ? options.bindElement.offsetWidth / 2 : 0) + 40;
				const popup = new main_popup.Popup({
					autoHide: true,
					id: options.id ?? null,
					bindElement: options.bindElement,
					width: options.width,
					useAngle: options.useAngle ?? true,
					angle: options.useAngle ?? {
						offset: options.width / 2 - 16
					},
					className: options.className ?? null,
					animation: 'fading-slide',
					closeByEsc: true,
					...(main_core.Type.isStringFilled(options.ariaLabel) ? {
						ariaLabel: options.ariaLabel
					} : {}),
					...(main_core.Type.isStringFilled(options.ariaLabelledBy) ? {
						ariaLabelledBy: options.ariaLabelledBy
					} : {}),
					...(main_core.Type.isStringFilled(options.ariaDescribedBy) ? {
						ariaDescribedBy: options.ariaDescribedBy
					} : {}),
					...(main_core.Type.isBoolean(options.focusTrap) || main_core.Type.isPlainObject(options.focusTrap) ? {
						focusTrap: options.focusTrap
					} : {}),
					offsetLeft: options.offsetLeft ?? offsetLeft,
					offsetTop: options.offsetTop ?? 3
				});
				const container = popup.getPopupContainer();
				if (main_core.Type.isStringFilled(options.testId)) {
					main_core.Dom.attr(container, 'data-testid', options.testId);
				}
				this.#cache.set('popup-content', container.querySelector('.popup-window-content'));
				main_core.Dom.remove(container.querySelector('.popup-window-content'));
				main_core.Dom.addClass(container, 'intranet-widget-skeleton__wrap');
				return popup;
			});
		}
		#setOptions(options) {
			this.#cache.set('options', options);
			return this;
		}
		#getOptions() {
			return this.#cache.get('options', {});
		}
		createSkeletonFromConfig(config = {}) {
			this.#prepareSkeleton();
			if (config.header) {
				this.addHeaderSkeleton();
			}
			if (config.avatarWidgetHeader) {
				this.addAvatarWidgetHeaderSkeleton(config.avatarWidgetHeader);
			}
			if (Array.isArray(config.items)) {
				config.items.forEach(item => {
					switch (item.type) {
						case 'item':
							this.addItemSkeleton(item.height);
							break;
						case 'split':
							this.addSplitItemSkeleton(item.height);
							break;
						case 'splitColumn':
							this.addColumnSplitItemSkeleton(item.height, item.count);
							break;
						case 'applicationSection':
							this.addApplicationSectionSkeleton();
							break;
					}
				});
			}
			if (config.footer) {
				this.addFooterSkeleton(config.footer.height ?? 6, config.footer.count ?? 2);
			}
			return this;
		}
		#prepareSkeleton() {
			const popupContainer = this.getPopup().getPopupContainer();
			this.#removeSkeleton();
			main_core.Dom.remove(this.#cache.get('popup-content'));
			main_core.Dom.addClass(popupContainer, 'intranet-widget-skeleton__wrap');
			this.setLoadingState(true);
			const statusText = this.#getOptions().loadingStatusText;
			if (main_core.Type.isStringFilled(statusText)) {
				ui_a11y.LiveAnnouncer.announce(statusText);
			}
		}
		#removeSkeleton() {
			const selectors = ['.intranet-widget-skeleton__row', '.intranet-widget-skeleton__header', '.intranet-widget-skeleton-avatar__header', '.intranet-widget-skeleton__footer'].join(', ');
			this.getPopup().getPopupContainer().querySelectorAll(selectors).forEach(node => main_core.Dom.remove(node));
		}
		addItemSkeleton(height) {
			main_core.Dom.append(this.#createItemSkeleton(height), this.getPopup().getPopupContainer());
			return this;
		}
		addSplitItemSkeleton(height) {
			main_core.Dom.append(this.#createSplitItemSkeleton(height), this.getPopup().getPopupContainer());
			return this;
		}
		addHeaderSkeleton() {
			main_core.Dom.prepend(this.#createHeaderSkeleton(), this.getPopup().getPopupContainer());
			return this;
		}
		addAvatarWidgetHeaderSkeleton(config) {
			main_core.Dom.prepend(this.#createAvatarWidgetHeaderSkeleton(config), this.getPopup().getPopupContainer());
			return this;
		}
		addColumnSplitItemSkeleton(height, count) {
			main_core.Dom.append(this.#createColumnSplitItemSkeleton(height, count), this.getPopup().getPopupContainer());
			return this;
		}
		addApplicationSectionSkeleton() {
			main_core.Dom.append(this.#createApplicationSectionSkeleton(), this.getPopup().getPopupContainer());
			return this;
		}
		addFooterSkeleton(height, count) {
			main_core.Dom.append(this.#createFooterSkeleton(height, count), this.getPopup().getPopupContainer());
			return this;
		}
		#createHeaderSkeleton() {
			return main_core.Tag.render`
			<div class="intranet-widget-skeleton__header" aria-hidden="true">
				<div class="intranet-widget-skeleton__line"></div>
			</div>
		`;
		}
		#createItemSkeleton(height) {
			return main_core.Tag.render`
			<div class="intranet-widget-skeleton__row" aria-hidden="true">
				<div style="height: ${height}px" class="intranet-widget-skeleton__item">
					<div style="width: 24px;height: 24px;border-radius: 6px;margin-right: 12px;" class="intranet-widget-skeleton__cube"></div>
					<div style="max-width: 130px;height: 10px;" class="intranet-widget-skeleton__line"></div>
					<div style="width: 12px; height: 12px; margin-left: auto;" class="intranet-widget-skeleton__circle"></div>
				</div>
			</div>
		`;
		}
		#createColumnSplitItemSkeleton(height, count) {
			const wrapper = main_core.Tag.render`
			<div class="intranet-widget-skeleton__row" aria-hidden="true">
				<div style="height: ${height}px" class="intranet-widget-skeleton__item --column"></div>
			</div>
		`;
			for (let i = 0; i < count; i++) {
				const item = main_core.Tag.render`
				<div class="intranet-widget-skeleton__nested-item">
					<div class="intranet-widget-skeleton__cube intranet-widget-skeleton-column-split-item__cube"></div>
					<div class="intranet-widget-skeleton__line intranet-widget-skeleton-column-split-item__line"></div>
					<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-column-split-item__circle"></div>
				</div>
			`;
				main_core.Dom.append(item, wrapper.querySelector('.intranet-widget-skeleton__item'));
			}
			return wrapper;
		}
		#createSplitItemSkeleton(height) {
			return main_core.Tag.render`
			<div class="intranet-widget-skeleton__row" aria-hidden="true">
				<div style="height: ${height}px" class="intranet-widget-skeleton__item">
					<div class="intranet-widget-skeleton__nested-item">
						<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-split-item__icon"></div>
						<div class="intranet-widget-skeleton__line intranet-widget-skeleton-split-item__line"></div>
					</div>
				</div>
			</div>
		`;
		}
		#createFooterSkeleton(height = 6, count = 2) {
			let lines = '';
			for (let i = 0; i < count; i++) {
				lines += `<div style="height: ${height}px" class="intranet-widget-skeleton__line"></div>`;
			}
			return main_core.Tag.render`
			<div class="intranet-widget-skeleton__footer" aria-hidden="true">
				${lines}
			</div>
		`;
		}
		#createAvatarWidgetHeaderSkeleton(config) {
			const wrapper = main_core.Tag.render`
			<div class="intranet-widget-skeleton-avatar__header" aria-hidden="true">
				<div class="intranet-widget-skeleton-avatar__header-info">
					<div class="intranet-widget-skeleton__circle --avatar intranet-widget-skeleton-avatar__avatar"></div>
					<div class="intranet-widget-skeleton-avatar__user-info">
						<div class="intranet-widget-skeleton-avatar__name-wrapper">
							<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__name"></div>
							<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-avatar__status-circle"></div>
						</div>
						<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__department"></div>
					</div>
				</div>
			</div>
		`;
			if (config.isAdmin) {
				main_core.Dom.append(main_core.Tag.render`<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__action-button"></div>`, wrapper);
			}
			if (config.hasTimeman) {
				main_core.Dom.append(this.#createAvatarWidgetTimemanSkeleton(), wrapper);
			}
			if (config.toolsCount > 0) {
				main_core.Dom.append(this.#createAvatarWidgetToolsSkeleton(config.toolsCount), wrapper);
			}
			return wrapper;
		}
		#createAvatarWidgetTimemanSkeleton() {
			return main_core.Tag.render`
			<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__timeman">
				<div class="intranet-widget-skeleton-avatar__timeman-top">
					<div class="intranet-widget-skeleton-avatar__timeman-line1"></div>
					<div class="intranet-widget-skeleton-avatar__timeman-line2"></div>
					<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-avatar__timeman-circle"></div>
					<div class="intranet-widget-skeleton-avatar__timeman-line3"></div>
				</div>
				<div class="intranet-widget-skeleton-avatar__timeman-bottom"></div>
			</div>
		`;
		}
		#createAvatarWidgetToolsSkeleton(count = 4) {
			const toolsWrapper = main_core.Tag.render`
			<div class="intranet-widget-skeleton-avatar__tools">
				<div class="intranet-widget-skeleton__cubes"></div>
			</div>
		`;
			const labelsWrapper = main_core.Tag.render`<div class="intranet-widget-skeleton-avatar__tools-labels"></div>`;
			for (let i = 0; i < count; i++) {
				const itemCube = main_core.Tag.render`<div class="intranet-widget-skeleton__cube"></div>`;
				main_core.Dom.append(itemCube, toolsWrapper.querySelector('.intranet-widget-skeleton__cubes'));
				const itemLabel = main_core.Tag.render`<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__tools-label"></div>`;
				main_core.Dom.append(itemLabel, labelsWrapper);
			}
			main_core.Dom.append(labelsWrapper, toolsWrapper);
			return toolsWrapper;
		}
		#createApplicationSectionSkeleton() {
			return main_core.Tag.render`
			<div class="intranet-widget-skeleton__row" aria-hidden="true">
				<div class="intranet-widget-skeleton__item --column">
					<div class="intranet-widget-skeleton__nested-item intranet-widget-skeleton-application-section__wrapper">
						<i class="intranet-widget-skeleton-application-section__qr ui-icon-set --o-qr-code"></i>
						<div class="intranet-widget-skeleton-application-section__text">
							<div class="intranet-widget-skeleton__line intranet-widget-skeleton-application-section__title"></div>
							<div class="intranet-widget-skeleton__line intranet-widget-skeleton-application-section__button"></div>
						</div>
					</div>
					<div class="intranet-widget-skeleton__nested-item">
						<div class="intranet-widget-skeleton__line intranet-widget-skeleton-application-section__description">
							<div class="intranet-widget-skeleton-application-section__desc-line"></div>
							<div class="intranet-widget-skeleton-application-section__desc-line"></div>
						</div>
					</div>
					<div class="intranet-widget-skeleton__nested-item">
						<div class="intranet-widget-skeleton__cube intranet-widget-skeleton-application-section__nested-cube"></div>
						<div class="intranet-widget-skeleton__line intranet-widget-skeleton-application-section__nested-line"></div>
						<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-application-section__nested-circle"></div>
					</div>
				</div>
			</div>
		`;
		}
	}

	exports.WidgetLoader = WidgetLoader;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Main, BX.UI.Accessibility);
//# sourceMappingURL=widget-loader.bundle.js.map

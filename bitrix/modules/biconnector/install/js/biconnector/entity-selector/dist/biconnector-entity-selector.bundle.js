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

	const ENTITY_ID = 'biconnector-digest-period';
	const RANGE_PATTERN = /^range:(\d{4})-(\d{2})-(\d{2}):(\d{4})-(\d{2})-(\d{2})$/;
	const MAX_DAYS = 366;
	const DAY_MS = 86_400_000;

	/**
	 * Lets a user set a fixed range of dates for a digest by hand. The dates are calendar days
	 * of the picker, which keeps them as UTC midnights, so they are read back with UTC getters.
	 * The picker and its buttons are loaded on the first opening: this extension comes with every entity selector.
	 */
	class DigestPeriodFooter extends ui_entitySelector.DefaultFooter {
		#picker = null;
		#pickerPromise = null;
		#destroyed = false;
		#createUtcDate = null;
		#applyButton = null;
		#dialogAutoHide = true;
		constructor(context, options) {
			super(context, options);
			this.getDialog().subscribe('onDestroy', () => {
				this.#destroyed = true;
				this.#picker?.destroy();
				this.#picker = null;
			});
		}
		getContent() {
			return this.getSetDatesButton();
		}
		getSetDatesButton() {
			return this.cache.remember('set-dates-button', () => {
				const button = main_core.Tag.render`
				<button type="button" class="ui-selector-footer-link" data-testid="biconnector-digest-period-set-dates">
					${main_core.Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_FOOTER_SET_DATES')}
				</button>
			`;
				main_core.Event.bind(button, 'click', () => this.openPicker());
				return button;
			});
		}
		openPicker() {
			return this.loadPicker().then(picker => {
				if (picker === null || picker.isOpen()) {
					return;
				}
				picker.deselectAll({
					emitEvents: false
				});
				const chosenRange = this.#getChosenRange();
				if (chosenRange !== null) {
					picker.selectRange(chosenRange.from, chosenRange.to, {
						emitEvents: false
					});
				}
				this.#refreshApplyButton();
				this.#dialogAutoHide = this.getDialog().isAutoHide();
				this.getDialog().setAutoHide(false);

				// The picker popup gives the focus back to the element that had it on opening, and a click
				// does not focus a button in every browser.
				this.getSetDatesButton().focus();
				picker.show();
			});
		}
		loadPicker() {
			// Loaded one by one: the exports of ui.buttons are the whole BX.UI namespace and would shadow DatePicker.
			this.#pickerPromise ??= Promise.all([main_core.Runtime.loadExtension('ui.date-picker'), main_core.Runtime.loadExtension('ui.buttons')]).then(([{
				DatePicker: DatePickerClass,
				DatePickerEvent,
				createUtcDate
			}, buttons]) => {
				if (this.#destroyed) {
					return null;
				}
				this.#createUtcDate = createUtcDate;
				this.#applyButton = this.#createApplyButton(buttons);
				this.#picker = new DatePickerClass({
					targetNode: this.getSetDatesButton(),
					selectionMode: 'range',
					maxDays: MAX_DAYS,
					hideOnSelect: false,
					presets: this.#createPresets(),
					popupOptions: {
						buttons: [this.#applyButton, this.#createCancelButton(buttons)]
					},
					events: {
						[DatePickerEvent.SELECT_CHANGE]: () => this.#refreshApplyButton(),
						onHide: () => this.#handlePickerHide()
					}
				});
				return this.#picker;
			}).catch(() => {
				this.#pickerPromise = null;
				return null;
			});
			return this.#pickerPromise;
		}
		getPicker() {
			return this.#picker;
		}
		applyRange() {
			const picker = this.getPicker();
			if (picker === null) {
				return;
			}
			const from = picker.getRangeStart();
			const to = picker.getRangeEnd();
			if (!this.#isRangeAllowed(from, to)) {
				return;
			}
			const dialog = this.getDialog();
			const item = dialog.addItem({
				id: `range:${formatIsoDate(from)}:${formatIsoDate(to)}`,
				entityId: ENTITY_ID,
				title: `${picker.formatDate(from)} – ${picker.formatDate(to)}`
			});
			picker.hide();
			dialog.deselectAll();
			item.select();
			if (dialog.shouldHideOnSelect()) {
				dialog.hide();
			}
		}
		#handlePickerHide() {
			this.getDialog().setAutoHide(this.#dialogAutoHide);
			this.getSetDatesButton().focus();
		}
		#createApplyButton({
			Button: ButtonClass,
			ButtonSize,
			AirButtonStyle
		}) {
			return new ButtonClass({
				text: main_core.Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_FOOTER_APPLY'),
				size: ButtonSize.SMALL,
				useAirDesign: true,
				style: AirButtonStyle.FILLED,
				onclick: () => this.applyRange()
			});
		}
		#createCancelButton({
			Button: ButtonClass,
			ButtonSize,
			AirButtonStyle
		}) {
			return new ButtonClass({
				text: main_core.Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_FOOTER_CANCEL'),
				size: ButtonSize.SMALL,
				useAirDesign: true,
				style: AirButtonStyle.PLAIN,
				onclick: () => this.getPicker().hide()
			});
		}
		#refreshApplyButton() {
			const picker = this.getPicker();
			this.#applyButton.setDisabled(!this.#isRangeAllowed(picker.getRangeStart(), picker.getRangeEnd()));
		}
		#isRangeAllowed(from, to) {
			if (from === null || to === null) {
				return false;
			}
			return Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1 <= MAX_DAYS;
		}
		#getChosenRange() {
			for (const item of this.getDialog().getSelectedItems()) {
				const matches = item.getEntityId() === ENTITY_ID ? String(item.getId()).match(RANGE_PATTERN) : null;
				if (matches !== null) {
					const [, fromYear, fromMonth, fromDay, toYear, toMonth, toDay] = matches.map(Number);
					return {
						from: this.#createUtcDate(fromYear, fromMonth - 1, fromDay),
						to: this.#createUtcDate(toYear, toMonth - 1, toDay)
					};
				}
			}
			return null;
		}
		#createPresets() {
			const todayParts = () => {
				const today = this.getPicker().getToday();
				return [today.getUTCFullYear(), today.getUTCMonth()];
			};
			return [{
				label: main_core.Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_PRESET_PREVIOUS_MONTH'),
				value: () => {
					const [year, month] = todayParts();
					return [this.#createUtcDate(year, month - 1, 1), this.#createUtcDate(year, month, 0)];
				}
			}, {
				label: main_core.Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_PRESET_PREVIOUS_QUARTER'),
				value: () => {
					const [year, month] = todayParts();
					const quarterStart = month - month % 3;
					return [this.#createUtcDate(year, quarterStart - 3, 1), this.#createUtcDate(year, quarterStart, 0)];
				}
			}, {
				label: main_core.Loc.getMessage('BICONNECTOR_ENTITY_SELECTOR_DIGEST_PERIOD_PRESET_PREVIOUS_YEAR'),
				value: () => {
					const [year] = todayParts();
					return [this.#createUtcDate(year - 1, 0, 1), this.#createUtcDate(year - 1, 11, 31)];
				}
			}];
		}
	}
	function formatIsoDate(date) {
		const month = String(date.getUTCMonth() + 1).padStart(2, '0');
		const day = String(date.getUTCDate()).padStart(2, '0');
		return `${date.getUTCFullYear()}-${month}-${day}`;
	}

	exports.DigestPeriodFooter = DigestPeriodFooter;
	exports.TagFooter = TagFooter;

})(this.BX.BIConnector.EntitySelector = this.BX.BIConnector.EntitySelector || {}, BX.UI.EntitySelector, BX);
//# sourceMappingURL=biconnector-entity-selector.bundle.js.map

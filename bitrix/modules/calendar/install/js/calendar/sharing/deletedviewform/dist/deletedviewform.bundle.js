/* eslint-disable */
this.BX = this.BX || {};
this.BX.Calendar = this.BX.Calendar || {};
(function (exports, main_core, calendar_sharing_publicV2, calendar_util, main_date) {
	'use strict';

	class DeletedViewForm {
		#layout;
		#eventData;
		#widgetDate;
		constructor(entryId) {
			this.#eventData = {
				eventId: entryId,
				from: null,
				to: null,
				timezone: null,
				isFullDay: false,
				canceledTimestamp: null,
				canceledUserName: null,
				canceledUserId: null,
				eventName: null
			};
			this.#layout = {
				back: null,
				widgetDate: null,
				eventName: null,
				icon: null,
				stateTitle: null,
				additionalBlock: null,
				bottomButton: null
			};
			this.#widgetDate = new calendar_sharing_publicV2.WidgetDate();
		}
		initInSlider(slider, promiseResolve) {
			this.createContent(slider).then(html => {
				if (main_core.Type.isFunction(promiseResolve)) {
					promiseResolve(html);
				}
			});
		}
		createContent(slider) {
			return new Promise(resolve => {
				BX.ajax.runAction('calendar.api.sharingajax.getDeletedSharedEvent', {
					data: {
						entryId: parseInt(this.#eventData.eventId, 10)
					}
				}).then(response => {
					const entry = response.data.entry;
					const link = response.data.link;
					const userTimezone = response.data.userTimezone;
					this.#initEventData({
						eventId: entry.ID,
						timestampFromUTC: entry.timestampFromUTC,
						timestampToUTC: entry.timestampToUTC,
						timezone: userTimezone,
						isFullDay: entry.DT_SKIP_TIME === 'Y',
						eventName: entry.NAME,
						canceledTimestamp: link.canceledTimestamp,
						canceledUserId: entry.canceledUserId,
						canceledUserName: entry.HOST_NAME
					});
					const deletedViewSliderRoot = main_core.Tag.render`
					<div class="calendar-deleted-event-view-slider-root">
						<div class="calendar-pub__block calendar-pub__state">
							${this.#getContent()}
						</div>
					</div>
				`;
					slider.sliderContent = deletedViewSliderRoot;
					resolve(deletedViewSliderRoot);
				});
			});
		}
		#initEventData(initialEventData) {
			this.#eventData.eventId = initialEventData.eventId;
			this.#eventData.from = calendar_util.Util.getTimezoneDateFromTimestampUTC(parseInt(initialEventData.timestampFromUTC, 10) * 1000, initialEventData.timezone);
			this.#eventData.to = calendar_util.Util.getTimezoneDateFromTimestampUTC(parseInt(initialEventData.timestampToUTC, 10) * 1000, initialEventData.timezone);
			this.#eventData.timezone = initialEventData.timezone;
			this.#eventData.isFullDay = initialEventData.isFullDay;
			this.#eventData.eventName = initialEventData.eventName;
			this.#eventData.canceledTimestamp = initialEventData.canceledTimestamp;
			this.#eventData.canceledUserName = initialEventData.canceledUserName;
			this.#eventData.canceledUserId = initialEventData.canceledUserId;
		}
		#getContent() {
			return main_core.Tag.render`
			<div class="calendar-sharing__form-result">
				${this.#getNodeBackWrapper()}
				<div class="calendar-sharing__calendar-block --form --center">
					${this.#getNodeIcon()}
					${this.#getEventNameNode()}
					${this.#getStateTitleNode()}
				</div>

				<div class="calendar-sharing__calendar-block --form --center">
					${this.#getNodeWidgetDate()}
				</div>

				<div class="calendar-sharing__calendar-block --form --center">
					${this.#getAdditionalBlockNode()}
				</div>

				<div class="calendar-sharing__calendar-block --top-auto">
				</div>
			</div>
		`;
		}
		#getNodeIcon() {
			if (!this.#layout.icon) {
				this.#layout.icon = this.#createIcon();
			}
			return this.#layout.icon;
		}
		#getNodeBackWrapper() {
			if (!this.#layout.back) {
				this.#layout.back = main_core.Tag.render`<div class="calendar-sharing__calendar-bar --no-margin"></div>`;
			}
			return this.#layout.back;
		}
		#createIcon() {
			const result = main_core.Tag.render`
			<div class="calendar-sharing__form-result_icon"></div>
		`;
			main_core.Dom.addClass(result, '--decline');
			return result;
		}
		#getEventNameNode() {
			if (!this.#layout.eventName) {
				this.#layout.eventName = main_core.Tag.render`
				<div class="calendar-pub-ui__typography-title --center --line-height-normal">
					${main_core.Text.encode(this.#eventData.eventName)}
				</div>
			`;
			}
			return this.#layout.eventName;
		}
		#getStateTitleNode() {
			if (!this.#layout.stateTitle) {
				this.#layout.stateTitle = main_core.Tag.render`
				<div class="calendar-pub-ui__typography-s --center">
					${main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_CANCELED')}
				</div>
			`;
			}
			return this.#layout.stateTitle;
		}
		#getAdditionalBlockNode() {
			if (!this.#layout.additionalBlock) {
				this.#layout.additionalBlock = this.#createAdditionalBlockContentByState();
			}
			return this.#layout.additionalBlock;
		}
		#createAdditionalBlockContentByState() {
			let result = '';
			const date = calendar_util.Util.getTimezoneDateFromTimestampUTC(parseInt(this.#eventData.canceledTimestamp, 10) * 1000, this.#eventData.timezone);
			if (this.#eventData.canceledTimestamp && this.#eventData.canceledUserName && date) {
				const dayMonthFormat = main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT');
				const shortTimeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				const format = `${dayMonthFormat} ${shortTimeFormat}`;
				result = main_core.Tag.render`
				<div class="calendar-pub__form-status">
					<div class="calendar-pub__form-status_text">
						${main_core.Loc.getMessage('CALENDAR_SHARING_WHO_CANCELED')}: <a href="/company/personal/user/${this.#eventData.canceledUserId}/" target="_blank" class="calendar-sharing-deletedviewform_open-profile">${main_core.Text.encode(this.#eventData.canceledUserName)}</a>
						<br>
						${main_date.DateTimeFormat.format(format, date.getTime() / 1000)}
					</div>
				</div>
			`;
			} else {
				result = main_core.Tag.render`
				<div></div>
			`;
			}
			return result;
		}
		#getNodeWidgetDate() {
			if (!this.#layout.widgetDate) {
				this.#widgetDate.updateValue({
					from: this.#eventData.from,
					to: this.#eventData.to,
					timezone: this.#eventData.timezone,
					isFullDay: this.#eventData.isFullDay
				});
				this.#layout.widgetDate = this.#widgetDate.render();
			}
			return this.#layout.widgetDate;
		}
	}

	exports.DeletedViewForm = DeletedViewForm;

})(this.BX.Calendar.Sharing = this.BX.Calendar.Sharing || {}, BX, BX.Calendar.Sharing, BX.Calendar, BX.Main);
//# sourceMappingURL=deletedviewform.bundle.js.map

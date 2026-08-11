/* eslint-disable */
this.BX = this.BX || {};
this.BX.Calendar = this.BX.Calendar || {};
(function (exports, main_core, calendar_sharing_publicV2, calendar_util) {
	'use strict';

	class PublicEvent {
		#params;
		#icsFile;
		constructor(params) {
			this.#params = params;
			this.#handleAction(params.action);
		}
		#handleAction(action) {
			if (action === 'accept') {
				this.#handleDecisionAction('Y');
			}
			if (action === 'decline') {
				this.#handleDecisionAction('N');
			}
			if (action === 'ics') {
				this.#downloadIcsFile();
			}
		}
		render() {
			const eventLayout = new calendar_sharing_publicV2.EventLayout(this.#getLayoutProps());
			this.#params.container.innerHTML = '';
			this.#params.container.append(eventLayout.render());
		}
		#getLayoutProps() {
			if (!this.#params.event) {
				return {
					eventNotFound: {
						title: main_core.Loc.getMessage('CALENDAR_PUBLIC_EVENT_TITLE_NOT_ATTENDEES'),
						subtitle: main_core.Loc.getMessage('CALENDAR_PUBLIC_EVENT_DESCRIPTION_NOT_ATTENDEES')
					}
				};
			}
			let offset = 0;
			if (this.#params.event.timezone) {
				offset = (calendar_util.Util.getTimeZoneOffset() - calendar_util.Util.getTimeZoneOffset(this.#params.event.timezone)) * 60 * 1000;
			}
			return {
				eventName: this.#params.event.name,
				from: new Date(parseInt(this.#params.event.timestampFrom, 10) * 1000 + offset),
				to: new Date(parseInt(this.#params.event.timestampTo, 10) * 1000 + offset),
				timezone: this.#params.event.timezone,
				browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				isFullDay: this.#params.event.isFullDay,
				location: this.#params.event.location,
				description: this.#params.event.description,
				rruleDescription: this.#params.event.rruleDescription,
				members: this.#prepareMembers(),
				files: this.#params.event.files,
				allAttendees: true,
				filled: true,
				onDeclineEvent: this.#getStatus() === 'Y' ? this.#declineInvitation.bind(this) : null,
				title: this.#getTitle(),
				iconClassName: this.#getIconClassName(),
				bottomButtons: this.#getBottomButtons(),
				poweredLabel: {
					isRu: this.#params.isRu
				}
			};
		}
		#prepareMembers() {
			if (this.#params.event.members?.length === 1 && this.#params.event.members[0].isOwner) {
				return [];
			}
			return [...this.#params.event.members].sort((member1, member2) => {
				const value1 = member1.isOwner ? 1 : 0;
				const value2 = member2.isOwner ? 1 : 0;
				return value2 - value1;
			});
		}
		#getTitle() {
			if (this.#params.event.isDeleted || !this.#getStatus()) {
				return main_core.Loc.getMessage('CALENDAR_PUBLIC_EVENT_MEETING_IS_CANCELLED');
			}
			if (this.#getStatus() === 'Q') {
				return main_core.Loc.getMessage('CALENDAR_PUBLIC_EVENT_YOU_WAS_INVITED');
			}
			if (this.#getStatus() === 'Y') {
				return main_core.Loc.getMessage('CALENDAR_PUBLIC_EVENT_YOU_ACCEPTED_MEETING');
			}
			if (this.#getStatus() === 'N') {
				return main_core.Loc.getMessage('CALENDAR_PUBLIC_EVENT_YOU_DECLINED_MEETING');
			}
			return '';
		}
		#getIconClassName() {
			if (this.#getStatus() === 'N' || !this.#getStatus() || this.#params.event.isDeleted) {
				return '--decline';
			}
			return '--accept';
		}
		#getBottomButtons() {
			if (this.#params.event.isDeleted) {
				return {};
			}
			if (this.#getStatus() === 'Q') {
				return {
					onAcceptInvitation: this.#acceptInvitation.bind(this),
					onDeclineInvitation: this.#declineInvitation.bind(this)
				};
			}
			if (this.#getStatus() === 'Y') {
				return {
					onDownloadIcs: this.#downloadIcsFile.bind(this)
				};
			}
			if (this.#getStatus() === 'N') {
				return {
					onAcceptInvitation: this.#acceptInvitation.bind(this)
				};
			}
			return {};
		}
		#acceptInvitation() {
			this.#handleDecisionAction('Y');
		}
		#declineInvitation() {
			this.#handleDecisionAction('N');
		}
		#handleDecisionAction(decision) {
			// eslint-disable-next-line promise/catch-or-return
			BX.ajax.runAction('calendar.api.publicevent.handleDecision', {
				data: {
					decision,
					eventId: this.#params.event.id,
					hash: this.#params.event.hash
				}
			}).then(response => {
				this.#updateStatus(response.data);
			});
		}
		#getStatus() {
			const owner = this.#getOwner();
			return owner.status;
		}
		#updateStatus(status) {
			const owner = this.#getOwner();
			owner.status = status;
			this.render();
		}
		#getOwner() {
			return this.#params.event.members.find(member => member.isOwner) ?? {};
		}
		async #downloadIcsFile() {
			try {
				if (!this.#icsFile) {
					const response = await BX.ajax.runAction('calendar.api.publicevent.getIcsFileContent', {
						data: {
							eventId: this.#params.event.id,
							hash: this.#params.event.hash
						}
					});
					this.#icsFile = response.data;
				}
				calendar_util.Util.downloadIcsFile(this.#icsFile, 'event');
			} catch (error) {
				console.error(error);
			}
		}
	}

	exports.PublicEvent = PublicEvent;

})(this.BX.Calendar.Public = this.BX.Calendar.Public || {}, BX, BX.Calendar.Sharing, BX.Calendar);
//# sourceMappingURL=public-event.bundle.js.map

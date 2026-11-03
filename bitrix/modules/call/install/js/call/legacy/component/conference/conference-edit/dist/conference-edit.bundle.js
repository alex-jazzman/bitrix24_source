/* eslint-disable */
(function (main_core, ui_vue, call_const, im_lib_logger, im_lib_clipboard, ui_entitySelector, calendar_planner, calendar_util, main_core_events) {
	'use strict';

	const FieldTitle = {
		name: 'conference-field-title',
		component: {
			props: {
				mode: {
					type: String
				},
				title: {
					type: String
				},
				defaultValue: {
					type: String
				}
			},
			data: function () {
				return {
					name: 'title'
				};
			},
			computed: {
				isViewMode() {
					return this.mode === call_const.ConferenceFieldState.view;
				},
				localize() {
					return BX.message;
				}
			},
			methods: {
				switchToEdit() {
					this.$emit('switchToEdit', this.name);
				},
				onInput(event) {
					this.$emit('titleChange', event.target.value);
				},
				onFocus(fieldName) {
					if (this.name === fieldName) {
						this.$nextTick(() => {
							this.$refs['input'].focus();
						});
					}
				}
			},
			created() {
				this.$root.$on('focus', this.onFocus);
			},
			template: `
					<div class="im-conference-create-section">
						<div class="im-conference-create-field">
							<label class="im-conference-create-label" for="im-conference-create-field-title">{{ localize['BX_IM_COMPONENT_CONFERENCE_TITLE_LABEL'] }}</label>
							<div v-if="!isViewMode" class="im-conference-create-field-title-container ui-ctl">
								<input
									type="text"
									id="im-conference-create-field-title"
									class="ui-ctl-element"
									:name="name"
									:placeholder="defaultValue"
									:value="title"
									@input="onInput"
									ref="input"
								>
							</div>
							<div v-else @click="switchToEdit" class="im-conference-create-field-view">{{ title }}</div>
						</div>
					</div>
				`
		}
	};

	const FieldPassword = {
		name: 'conference-field-password',
		component: {
			props: {
				mode: {
					type: String
				},
				password: {
					type: String
				},
				passwordNeeded: {
					type: Boolean
				}
			},
			data: function () {
				return {
					name: 'password'
				};
			},
			computed: {
				isViewMode() {
					return this.mode === call_const.ConferenceFieldState.view;
				},
				codedValue() {
					if (this.passwordNeeded) {
						return `${this.localize['BX_IM_COMPONENT_CONFERENCE_PASSWORD_EXISTS']} (${this.password.replace(/./g, '*')})`;
					} else {
						return this.localize['BX_IM_COMPONENT_CONFERENCE_NO_PASSWORD'];
					}
				},
				localize() {
					return BX.message;
				}
			},
			methods: {
				switchToEdit() {
					this.$emit('switchToEdit', this.name);
				},
				onInput(event) {
					this.$emit('passwordChange', event.target.value);
				},
				onPasswordNeededChange() {
					this.$emit('passwordNeededChange');
				},
				onFocus(fieldName) {
					if (this.name === fieldName) {
						this.$nextTick(() => {
							if (this.$refs['input']) {
								this.$refs['input'].focus();
							}
						});
					}
				}
			},
			created() {
				this.$root.$on('focus', this.onFocus);
			},
			template: `
					<div class="im-conference-create-section im-conference-create-password-section">
						<label class="im-conference-create-label" for="im-conference-create-field-password">{{ localize['BX_IM_COMPONENT_CONFERENCE_PASSWORD_LABEL'] }}</label>
						<template v-if="!isViewMode">
							<div class="im-conference-create-field-inline">
								<input @input="onPasswordNeededChange" type="checkbox" id="im-conference-create-field-password-checkbox" :checked="passwordNeeded">
								<label class="im-conference-create-label" for="im-conference-create-field-password-checkbox">{{ localize['BX_IM_COMPONENT_CONFERENCE_PASSWORD_CHECKBOX_LABEL'] }}</label>
							</div>
							<div v-if="passwordNeeded" class="im-conference-create-field-password-container ui-ctl">
								<input
									type="text"
									id="im-conference-create-field-password"
									class="ui-ctl-element"
									:name="name"
									:placeholder="localize['BX_IM_COMPONENT_CONFERENCE_PASSWORD_PLACEHOLDER']"
									:value="password"
									@input="onInput"
									ref="input"
								>
							</div>
						</template>
						<div v-else @click="switchToEdit" class="im-conference-create-field-view">{{ codedValue }}</div>
					</div>
				`
		}
	};

	const FieldInvitation = {
		name: 'conference-field-invitation',
		component: {
			props: {
				invitation: {
					type: Object
				},
				chatHost: {
					type: Object
				},
				title: {
					type: String
				},
				defaultTitle: {
					type: String
				},
				publicLink: {
					type: String
				},
				formMode: {
					type: String
				}
			},
			data: function () {
				return {
					initialValue: null,
					editedValue: null
				};
			},
			computed: {
				isViewMode() {
					return this.invitation.mode === call_const.ConferenceFieldState.view;
				},
				isFormCreateMode() {
					return this.formMode === call_const.ConferenceFieldState.create;
				},
				avatarClasses() {
					const classes = ['im-conference-create-invitation-user-avatar'];
					if (!this.chatHost.AVATAR) {
						classes.push('im-conference-create-invitation-user-avatar-default');
					}
					return classes;
				},
				avatarStyles() {
					const styles = {};
					if (this.chatHost.AVATAR) {
						styles.backgroundImage = `url(${this.chatHost.AVATAR})`;
					}
					return styles;
				},
				formattedInvitation() {
					let title = this.title ? this.title : '';
					if (this.isFormCreateMode && !this.title) {
						title = this.defaultTitle;
					}
					return this.invitation.value.replace(/#CREATOR#/gm, main_core.Text.encode(this.chatHost.FULL_NAME)).replace(/#TITLE#/gm, `"${main_core.Text.encode(title)}"`).replace(/#LINK#/gm, `<a href="${this.publicLink}" target="_blank" class="im-conference-create-invitation-content-text-link">${this.publicLink}</a>`);
				},
				localize() {
					return BX.message;
				}
			},
			methods: {
				onEditClick() {
					const contentWidth = this.$refs['view'].offsetWidth;
					const contentHeight = this.$refs['view'].offsetHeight;
					this.invitation.mode = call_const.ConferenceFieldState.edit;
					this.invitation.value = main_core.Text.decode(this.invitation.value);
					this.$nextTick(() => {
						this.$refs['editor'].style.width = contentWidth + 20 + 'px';
						this.$refs['editor'].style.height = contentHeight + 30 + 'px';
						this.$refs['editor'].focus();
					});
				},
				onInput(event) {
					if (!this.initialValue) {
						this.initialValue = this.invitation.value;
					}
					this.editedValue = main_core.Text.encode(event.target.value);
				},
				saveChanges() {
					if (this.editedValue && this.initialValue && this.initialValue !== this.editedValue) {
						this.invitation.value = this.editedValue;
						this.initialValue = null;
						this.editedValue = null;
						this.$emit('invitationUpdate', this.invitation.value);
					} else {
						this.invitation.value = main_core.Text.encode(this.invitation.value);
					}
					this.invitation.mode = call_const.ConferenceFieldState.view;
				},
				discardChanges() {
					if (this.initialValue) {
						this.invitation.value = this.initialValue;
						this.initialValue = null;
						this.editedValue = null;
					}
					this.invitation.value = main_core.Text.encode(this.invitation.value);
					this.invitation.mode = call_const.ConferenceFieldState.view;
				}
			},
			created() {
				if (this.isFormCreateMode || !this.invitation.value) {
					this.invitation.value = this.localize['BX_IM_COMPONENT_CONFERENCE_DEFAULT_INVITATION'];
				}
				if (!this.isFormCreateMode && this.invitation.value) {
					this.invitation.value = main_core.Text.encode(this.invitation.value);
				}
			},
			template: `
					<div>
						<div class="im-conference-create-section im-conference-create-invitation-title">
							{{ localize['BX_IM_COMPONENT_CONFERENCE_INVITATION_TITLE'] }}
						</div>
						<div class="im-conference-create-section im-conference-create-invitation-wrap">
							<div class="im-conference-create-invitation-user">
								<div :class="avatarClasses" :style="avatarStyles"></div>
								<div class="im-conference-create-invitation-user-name">{{ chatHost.FIRST_NAME }}</div>
							</div>
							<div class="im-conference-create-invitation-content">
								<template v-if="isViewMode">
									<div @click="onEditClick" v-html="formattedInvitation" contenteditable="false" ref="view" class="im-conference-create-invitation-content-text"></div>
									<div @click="onEditClick" class="im-conference-create-invitation-edit"></div>
								</template>
								<template v-else>
									<textarea @input="onInput" :value="invitation.value" class="im-conference-create-invitation-editor" ref="editor"></textarea>
									<div>
										<button @click="saveChanges" class="ui-btn ui-btn-sm ui-btn-primary">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_SAVE'] }}</button>
										<button @click="discardChanges" class="ui-btn ui-btn-sm ui-btn-light">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_CANCEL'] }}</button>
									</div>
								</template>
							</div>
						</div>
					</div>
				`
		}
	};

	const FieldPlanner = {
		name: 'conference-field-planner',
		component: {
			props: {
				mode: {
					type: String
				},
				selectedUsers: {
					type: Array,
					default: []
				},
				chatHost: {
					type: Object,
					default: []
				},
				selectedDate: {
					type: String,
					default: ''
				},
				selectedTime: {
					type: String,
					default: ''
				},
				selectedDuration: {
					type: String,
					default: '30'
				},
				selectedDurationType: {
					type: String,
					default: 'm'
				}
			},
			data: () => {
				return {
					name: 'planner',
					clockInstance: null,
					planner: null
				};
			},
			computed: {
				isViewMode() {
					return this.mode === call_const.ConferenceFieldState.view;
				},
				userListForPlanner() {
					return this.selectedUsers.map(user => {
						return `U${user.id}`;
					});
				},
				userListForSelector() {
					return this.selectedUsers.map(user => {
						return ['user', user.id];
					});
				},
				formattedDateForView() {
					return `${this.selectedDate}, ${this.selectedTime}`;
				},
				formattedDurationForView() {
					let durationTypeText;
					if (this.selectedDurationType === 'm') {
						durationTypeText = this.localize('BX_IM_COMPONENT_CONFERENCE_DURATION_MINUTES');
					} else if (this.selectedDurationType === 'h') {
						durationTypeText = this.localize('BX_IM_COMPONENT_CONFERENCE_DURATION_HOURS');
					}
					return `${this.selectedDuration} ${durationTypeText}`;
				},
				startDateTime() {
					return BX.parseDate(`${this.selectedDate} ${this.selectedTime}`);
				},
				endDateTime() {
					let duration = Number(this.selectedDuration);
					const durationType = this.selectedDurationType;
					if (durationType === 'h') {
						duration *= 60 * 60 * 1000;
					} else {
						duration *= 60 * 1000;
					}
					const endDateTime = new Date();
					endDateTime.setTime(this.startDateTime.getTime() + duration);
					return endDateTime;
				},
				localize() {
					return BX.message;
				}
			},
			methods: {
				switchToEdit() {
					this.$emit('switchToEdit', this.name);
					this.$nextTick(() => {
						//this.userSelector.renderTo(this.$refs['userSelector']);
						//this.initPlanner();
						//this.updatePlanner();
					});
				},
				onDateFieldClick(event) {
					if (main_core.Reflection.getClass('BX.calendar')) {
						BX.calendar({
							node: event.currentTarget,
							field: this.$refs['dateInput'],
							bTime: false,
							callback_after: event => {
								this.$emit('dateChange', event);
							}
						});
					}
					return false;
				},
				onTimeFieldClick() {
					this.clockInstance.setNode(this.$refs['timeInput']);
					this.clockInstance.setTime(this.convertToSeconds(this.selectedTime));
					this.clockInstance.setCallback(value => {
						this.$emit('timeChange', value);
						BX.fireEvent(this.$refs['timeInput'], 'change');
						this.clockInstance.closeWnd();
					});
					this.clockInstance.Show();
				},
				onUpdateDateTime() {
					//$nextTick didn't help there
					setTimeout(() => {
						this.planner.updateSelector(this.startDateTime, this.endDateTime, false);
					}, 0);
				},
				onDurationChange(event) {
					this.$emit('durationChange', event.target.value);
					this.onUpdateDateTime();
				},
				onDurationTypeChange(event) {
					this.$emit('durationTypeChange', event.target.value);
					this.onUpdateDateTime();
				},
				convertToSeconds(time) {
					//method converts string '13:12" or '03:20 am' to number of seconds
					const parts = time.split(/[\s:]+/);
					let hours = parseInt(parts[0], 10);
					const minutes = parseInt(parts[1], 10);
					if (parts.length === 3) {
						const modifier = parts[2];
						if (modifier === 'pm' && hours < 12) {
							//'03:00 pm' => 15:00
							hours = hours + 12;
						}
						if (modifier === 'am' && hours === 12) {
							//'12:00 am' => 0:00
							hours = 0;
						}
					}
					const secondsInHours = hours * 3600;
					const secondsInMinutes = minutes * 60;
					return secondsInHours + secondsInMinutes;
				},
				onUserSelect(event) {
					this.$emit('userSelect', event);
					//this.updatePlanner();
				},
				onUserDeselect(event) {
					this.$emit('userDeselect', event);
					//this.updatePlanner();
				},
				onUpdateUserSelector() {
					this.$nextTick(() => {
						this.$refs['userSelector'].innerHTML = '';
						this.initUserSelector();
						this.userSelector.renderTo(this.$refs['userSelector']);
					});
				},
				onSwitchModeForAll(mode) {
					if (mode === call_const.ConferenceFieldState.edit) {
						this.switchToEdit();
					}
				},
				initUserSelector() {
					this.userSelector = new ui_entitySelector.TagSelector({
						id: 'user-tag-selector',
						dialogOptions: {
							id: 'user-tag-selector',
							preselectedItems: this.userListForSelector,
							undeselectedItems: [['user', this.chatHost.ID]],
							events: {
								'Item:onSelect': event => {
									this.onUserSelect(event);
								},
								'Item:onDeselect': event => {
									this.onUserDeselect(event);
								}
							},
							entities: [{
								id: 'user'
							}, {
								id: 'department'
							}]
						}
					});
				},
				initClock() {
					this.clockInstance = new BX.CClockSelector({
						start_time: this.convertToSeconds(this.selectedTime),
						node: this.$refs['timeInput'],
						callback: () => {}
					});
				},
				initPlanner() {
					this.planner = new calendar_planner.Planner({
						wrap: this.$refs['plannerNode'],
						showEntryName: true,
						showEntriesHeader: false,
						entriesListWidth: 200,
						compactMode: false
					});
					this.planner.show();
					this.planner.subscribe('onDateChange', event => {
						this.onPlannerSelectorChange(event);
					});
				},
				updatePlanner() {
					if (this.selectedUsers.length > 0) {
						main_core.ajax.runAction('calendar.api.calendarajax.updatePlanner', {
							data: {
								codes: this.userListForPlanner,
								dateFrom: calendar_util.Util.formatDate(this.startDateTime.getTime() - calendar_util.Util.getDayLength() * 3),
								dateTo: calendar_util.Util.formatDate(this.startDateTime.getTime() + calendar_util.Util.getDayLength() * 10)
							}
						}).then(response => {
							this.planner.update(response.data.entries, response.data.accessibility);
							this.planner.updateSelector(this.startDateTime, this.endDateTime, false);
						}).catch(error => {});
					}
				},
				onPlannerSelectorChange(event) {
					if (event instanceof main_core_events.BaseEvent) {
						let data = event.getData();
						const startDateTime = data.dateFrom;
						const duration = (data.dateTo - data.dateFrom) / 1000 / 60; //duration in minutes
						const durationType = this.selectedDurationType;
						this.$emit('dateChange', startDateTime);
						this.$emit('timeChange', this.$parent.formatTime(startDateTime));
						if (durationType === 'h' && duration % 60 === 0) {
							this.$emit('durationChange', duration / 60);
							this.$emit('durationTypeChange', 'h');
						} else {
							this.$emit('durationChange', duration);
							this.$emit('durationTypeChange', 'm');
						}
					}
				},
				getUserAvatarStyle(user) {
					if (user.avatar) {
						return {
							backgroundImage: `url('${encodeURI(user.avatar)}')`
						};
					}
					return {};
				}
			},
			created() {},
			mounted() {
				this.initUserSelector();
				this.userSelector.renderTo(this.$refs['userSelector']);
				//this.initClock();
				//this.initPlanner();
				//this.updatePlanner();

				this.$root.$on('switchModeForAll', mode => {
					this.onSwitchModeForAll(mode);
				});
				this.$root.$on('updateUserSelector', () => {
					this.onUpdateUserSelector();
				});
			},
			template: `
					<div class="im-conference-create-section im-conference-create-planner-block">
						<!-- Date block -->
<!--						<div v-if="!isViewMode" class="im-conference-create-date-block">-->
<!--							<div class="im-conference-create-date-block-left">-->
<!--								<label class="im-conference-create-label" for="im-conference-create-field-date-time">{{ localize['BX_IM_COMPONENT_CONFERENCE_START_DATE_AND_TIME'] }}</label>-->
<!--								<div class="im-conference-create-date-block-left-fields">-->
<!--									&lt;!&ndash; Date field &ndash;&gt;-->
<!--									<div @click="onDateFieldClick" class="ui-ctl ui-ctl-after-icon ui-ctl-date im-conference-create-field-date-container">-->
<!--										<div class="ui-ctl-after ui-ctl-icon-calendar"></div>-->
<!--										<input @change="onUpdateDateTime" type="text" class="ui-ctl-element" ref="dateInput" :value="selectedDate">-->
<!--									</div>-->
<!--									&lt;!&ndash; Time field &ndash;&gt;-->
<!--									<div @click="onTimeFieldClick" class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown im-conference-create-field-time-container">-->
<!--										<div class="ui-ctl-after ui-ctl-icon-angle"></div>-->
<!--										<div @change="onUpdateDateTime" class="ui-ctl-element" ref="timeInput">{{ selectedTime }}</div>-->
<!--									</div>-->
<!--								</div>-->
<!--							</div>-->
<!--							<div class="im-conference-create-date-block-right">-->
<!--								<label class="im-conference-create-label" for="im-conference-create-field-date-time">{{ localize['BX_IM_COMPONENT_CONFERENCE_DURATION'] }}</label>-->
<!--								<div class="im-conference-create-date-block-right-fields">-->
<!--									&lt;!&ndash; Duration field &ndash;&gt;-->
<!--									<div class="ui-ctl im-conference-create-field-duration-container">-->
<!--										<input @change="onDurationChange" type="text" class="ui-ctl-element" :value="selectedDuration">-->
<!--									</div>-->
<!--									&lt;!&ndash; Duration type field &ndash;&gt;-->
<!--									<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown im-conference-create-field-duration-type-container">-->
<!--										<div class="ui-ctl-after ui-ctl-icon-angle"></div>-->
<!--										<select @change="onDurationTypeChange" class="ui-ctl-element">-->
<!--											<option value="m" :selected="selectedDurationType === 'm'">{{ localize['BX_IM_COMPONENT_CONFERENCE_DURATION_MINUTES'] }}</option>-->
<!--											<option value="h" :selected="selectedDurationType === 'h'">{{ localize['BX_IM_COMPONENT_CONFERENCE_DURATION_HOURS'] }}</option>-->
<!--										</select>-->
<!--									</div>-->
<!--								</div>-->
<!--							</div>-->
<!--						</div>-->
<!--						<template v-else-if="isViewMode">-->
<!--							<div class="im-conference-create-field">-->
<!--								<div class="im-conference-create-label">{{ localize['BX_IM_COMPONENT_CONFERENCE_START_DATE_AND_TIME'] }}</div>-->
<!--								<div @click="switchToEdit" class="im-conference-create-field-view">{{ formattedDateForView }}</div>-->
<!--							</div>-->
<!--							<div class="im-conference-create-field">-->
<!--								<div class="im-conference-create-label">{{ localize['BX_IM_COMPONENT_CONFERENCE_DURATION'] }}</div>-->
<!--								<div @click="switchToEdit" class="im-conference-create-field-view">{{ formattedDurationForView }}</div>-->
<!--							</div>-->
<!--						</template>-->
						<div v-show="!isViewMode">
<!--							<div class="im-conference-create-delimiter"></div>-->
							<!-- User selector block -->
							<div class="im-conference-create-user-selector-block">
								<div class="im-conference-create-field">
									<label class="im-conference-create-label" for="im-conference-create-field-user-selector">{{ localize['BX_IM_COMPONENT_CONFERENCE_USER_SELECTOR_LABEL'] }}</label>
									<div class="im-conference-create-user-selector" ref="userSelector"></div>
								</div>
							</div>
							<!-- Planner block -->
<!--							<div v-show="selectedUsers.length > 0" class="im-conference-create-planner-block" ref="plannerNode"></div>-->
						</div>
						<div v-show="isViewMode" class="im-conference-create-field im-conference-create-users-view">
							<div class="im-conference-create-label">{{ localize['BX_IM_COMPONENT_CONFERENCE_USER_SELECTOR_LABEL'] }}</div>
							<div @click="switchToEdit" class="im-conference-create-users-view-content">
								<div v-for="user in selectedUsers" :key="user.id" class="im-conference-create-users-view-item">
									<div class="im-conference-create-users-view-avatar" :style="getUserAvatarStyle(user)"></div>
									<div class="im-conference-create-users-view-title">{{ user.title }}</div>
								</div>
							</div>
						</div>
					</div>
				`
		}
	};

	const FieldBroadcast = {
		name: 'conference-field-broadcast',
		component: {
			props: {
				mode: {
					type: String
				},
				broadcastMode: {
					type: Boolean
				},
				chatHost: {
					type: Object
				},
				selectedPresenters: {
					type: Array
				}
			},
			data: function () {
				return {
					name: 'broadcast'
				};
			},
			computed: {
				isViewMode() {
					return this.mode === call_const.ConferenceFieldState.view;
				},
				codedValue() {
					if (this.broadcastMode) {
						return this.localize['BX_IM_COMPONENT_CONFERENCE_BROADCAST_MODE_ON'];
					} else {
						return this.localize['BX_IM_COMPONENT_CONFERENCE_BROADCAST_MODE_OFF'];
					}
				},
				presenterListForSelector() {
					return this.selectedPresenters.map(user => {
						return ['user', user.id];
					});
				},
				localize() {
					return BX.message;
				}
			},
			methods: {
				switchToEdit() {
					this.$emit('switchToEdit', this.name);
				},
				onBroadcastModeChange() {
					this.$emit('broadcastModeChange');
				},
				onSwitchModeForAll(mode) {
					if (mode === call_const.ConferenceFieldState.edit) {
						this.switchToEdit();
					}
				},
				onPresenterSelect(event) {
					this.$emit('presenterSelect', event);
					//this.updatePlanner();
				},
				onPresenterDeselect(event) {
					this.$emit('presenterDeselect', event);
					//this.updatePlanner();
				},
				getUserAvatarStyle(user) {
					if (user.avatar) {
						return {
							backgroundImage: `url('${encodeURI(user.avatar)}')`
						};
					}
					return {};
				},
				initPresenterSelector() {
					this.presenterSelector = new ui_entitySelector.TagSelector({
						id: 'presenter-tag-selector',
						dialogOptions: {
							id: 'presenter-tag-selector',
							preselectedItems: this.presenterListForSelector,
							events: {
								'Item:onSelect': event => {
									this.onPresenterSelect(event);
								},
								'Item:onDeselect': event => {
									this.onPresenterDeselect(event);
								}
							},
							entities: [{
								id: 'user'
							}, {
								id: 'department'
							}]
						}
					});
				},
				onUpdatePresenterSelector() {
					this.$nextTick(() => {
						this.$refs['presenterSelector'].innerHTML = '';
						this.initPresenterSelector();
						this.presenterSelector.renderTo(this.$refs['presenterSelector']);
					});
				}
			},
			mounted() {
				this.initPresenterSelector();
				this.presenterSelector.renderTo(this.$refs['presenterSelector']);
				this.$root.$on('switchModeForAll', mode => {
					this.onSwitchModeForAll(mode);
				});
				this.$root.$on('updatePresenterSelector', () => {
					this.onUpdatePresenterSelector();
				});
			},
			template: `
				<div class="im-conference-create-section im-conference-create-broadcast-section">
					<div class="im-conference-create-broadcast-section-title">
						<label class="im-conference-create-label" for="im-conference-create-field-broadcast">{{ localize['BX_IM_COMPONENT_CONFERENCE_BROADCAST_LABEL'] }}</label>
						<bx-hint :text="localize['BX_IM_COMPONENT_CONFERENCE_BROADCAST_HINT']"/>
					</div>
					<div v-show="!isViewMode">
						<div class="im-conference-create-field-inline im-conference-create-field-broadcast">
							<input @input="onBroadcastModeChange" type="checkbox" id="im-conference-create-field-broadcast-checkbox" :checked="broadcastMode">
							<label class="im-conference-create-label" for="im-conference-create-field-broadcast-checkbox">{{ localize['BX_IM_COMPONENT_CONFERENCE_BROADCAST_CHECKBOX_LABEL'] }}</label>
						</div>
						<div v-show="broadcastMode" class="im-conference-create-user-selector-block">
							<div class="im-conference-create-field">
								<label class="im-conference-create-label im-conference-create-label-broadcast" for="im-conference-create-field-user-selector">{{ localize['BX_IM_COMPONENT_CONFERENCE_PRESENTER_SELECTOR_LABEL'] }}</label>
								<div class="im-conference-create-user-selector" ref="presenterSelector"></div>
							</div>
						</div>
					</div>
					<div v-show="isViewMode">
						<div @click="switchToEdit" class="im-conference-create-field-view">{{ codedValue }}</div>
						<div v-if="broadcastMode" @click="switchToEdit" class="im-conference-create-field im-conference-create-users-view">
							<div class="im-conference-create-label">{{ localize['BX_IM_COMPONENT_CONFERENCE_PRESENTER_SELECTOR_LABEL'] }}</div>
							<div class="im-conference-create-users-view-content">
								<div v-for="user in selectedPresenters" :key="user.id" class="im-conference-create-users-view-item">
									<div class="im-conference-create-users-view-avatar" :style="getUserAvatarStyle(user)"></div>
									<div class="im-conference-create-users-view-title">{{ user.title }}</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			`
		}
	};

	const FieldTypes = [FieldTitle, FieldPassword, FieldInvitation, FieldPlanner, FieldBroadcast];
	const FieldComponents = {};
	FieldTypes.forEach(fieldType => {
		FieldComponents[fieldType.name] = fieldType.component;
	});
	ui_vue.BitrixVue.component('bx-im-component-conference-edit', {
		props: {
			conferenceId: {
				type: Number,
				default: 0
			},
			fieldsData: {
				type: Object,
				default: {}
			},
			mode: {
				type: String,
				default: call_const.ConferenceFieldState.create
			},
			chatHost: {
				type: Object,
				default: {}
			},
			chatUsers: {
				type: Array,
				default: []
			},
			presenters: {
				type: Array,
				default: []
			},
			publicLink: {
				type: String,
				default: ''
			},
			chatId: {
				type: Number,
				default: 0
			},
			invitationText: {
				type: String,
				default: ''
			},
			gridId: {
				type: String,
				default: ''
			},
			pathToList: {
				type: String,
				default: ''
			},
			broadcastingEnabled: {
				type: Boolean,
				default: false
			}
		},
		data: function () {
			return {
				fieldsMode: {
					'title': this.mode,
					'password': this.mode,
					'planner': this.mode,
					'broadcast': this.mode
				},
				fields: {},
				initialValues: {},
				title: {
					currentValue: '',
					initialValue: '',
					defaultValue: ''
				},
				invitation: {
					value: '',
					mode: call_const.ConferenceFieldState.view,
					edited: false
				},
				password: {
					currentValue: '',
					initialValue: ''
				},
				passwordNeeded: {
					currentValue: false,
					initialValue: false
				},
				selectedUsers: {
					currentValue: [],
					initialValue: []
				},
				broadcastMode: {
					currentValue: false,
					initialValue: false
				},
				selectedPresenters: {
					currentValue: [],
					initialValue: []
				},
				selectedDate: {
					currentValue: '',
					initialValue: ''
				},
				selectedTime: {
					currentValue: '',
					initialValue: ''
				},
				selectedDuration: {
					currentValue: '30',
					initialValue: '30'
				},
				selectedDurationType: {
					currentValue: 'm',
					initialValue: 'm'
				},
				errors: [],
				linkGenerated: false,
				aliasData: {},
				isSubmitting: false
			};
		},
		created() {
			if (this.isFormViewMode) {
				this.title.initialValue = this.fieldsData['TITLE'];
				this.password.initialValue = this.fieldsData['PASSWORD'];
				this.broadcastMode.currentValue = this.fieldsData['BROADCAST'];
				this.invitation.value = this.invitationText;
				this.passwordNeeded.currentValue = !!this.fieldsData['PASSWORD'];
				this.publicLink = main_core.Text.encode(this.publicLink);
				this.selectedUsers.currentValue = [...this.chatUsers];
				if (this.fieldsData['BROADCAST']) {
					this.selectedPresenters.currentValue = [...this.presenters];
				}
			} else if (this.isFormCreateMode) {
				this.generateLink();
				this.title.initialValue = '';
				this.password.initialValue = '';
				this.passwordNeeded.currentValue = false;
				this.broadcastMode.currentValue = false;
				const currentUser = {
					id: this.chatHost.ID,
					title: this.chatHost.FULL_NAME,
					avatar: this.chatHost.AVATAR
				};
				this.selectedUsers.currentValue.push(currentUser);
				this.selectedPresenters.currentValue.push(currentUser);
			}
			this.title.currentValue = this.title.initialValue;
			this.password.currentValue = this.password.initialValue;
			this.passwordNeeded.initialValue = this.passwordNeeded.currentValue;
			this.broadcastMode.initialValue = this.broadcastMode.currentValue;
			this.selectedUsers.initialValue = [...this.selectedUsers.currentValue];
			this.selectedPresenters.initialValue = [...this.selectedPresenters.currentValue];
			this.setDefaultDateAndTime();
			this.setDefaultDuration();
		},
		mounted() {
			if (this.isFormCreateMode) {
				this.checkRequirements();
			}
		},
		computed: {
			isFormCreateMode() {
				return this.mode === call_const.ConferenceFieldState.create;
			},
			isFormViewMode() {
				return this.mode === call_const.ConferenceFieldState.view;
			},
			isTitleEdited() {
				return this.fieldsMode['title'] === call_const.ConferenceFieldState.edit;
			},
			isPasswordEdited() {
				return this.fieldsMode['password'] === call_const.ConferenceFieldState.edit;
			},
			isPlannerEdited() {
				return this.fieldsMode['planner'] === call_const.ConferenceFieldState.edit;
			},
			isPasswordCheckboxEdited() {
				return this.passwordNeeded.currentValue !== this.passwordNeeded.initialValue;
			},
			isBroadcastEdited() {
				return this.fieldsMode['broadcast'] === call_const.ConferenceFieldState.edit;
			},
			isEditing() {
				return this.isFormViewMode && (this.isTitleEdited || this.isPasswordEdited || this.invitation.edited || this.isPasswordCheckboxEdited || this.isPlannerEdited || this.isBroadcastEdited);
			},
			conferenceLink() {
				if (this.isFormCreateMode) {
					if (this.linkGenerated) {
						return this.aliasData['LINK'];
					} else {
						return '#LINK#';
					}
				} else if (this.isFormViewMode) {
					return this.publicLink;
				}
			},
			submitFormButtonClasses() {
				const classes = ['ui-btn', 'ui-btn-success'];
				if (this.isSubmitting) {
					classes.push('ui-btn-disabled');
				}
				return classes;
			},
			localize() {
				return BX.message;
			}
		},
		methods: {
			/* region 01. Mode switching */
			switchToEdit(fieldName) {
				this.fieldsMode[fieldName] = call_const.ConferenceFieldState.edit;
				this.$root.$emit('focus', fieldName);
			},
			switchModeForAllFields(mode) {
				for (let field in this.fieldsMode) {
					if (this.fieldsMode.hasOwnProperty(field)) {
						this.fieldsMode[field] = mode;
					}
				}
				this.$root.$emit('switchModeForAll', mode);
			},
			/* endregion 01. Mode switching */

			/* region 02. Field update handlers */
			onTitleChange(newTitle) {
				this.title.currentValue = newTitle;
			},
			onPasswordChange(newPassword) {
				this.password.currentValue = newPassword;
			},
			onPasswordNeededChange() {
				this.passwordNeeded.currentValue = !this.passwordNeeded.currentValue;
				if (this.passwordNeeded.currentValue) {
					this.$root.$emit('focus', 'password');
				}
			},
			onBroadcastModeChange() {
				this.broadcastMode.currentValue = !this.broadcastMode.currentValue;
			},
			onInvitationUpdate(newValue) {
				this.invitation.value = newValue;
				this.invitation.edited = true;
			},
			onUserSelect(event) {
				const index = this.selectedUsers.currentValue.findIndex(user => {
					return user.id === event.data.item.id;
				});
				if (index === -1) {
					this.selectedUsers.currentValue.push({
						id: event.data.item.id,
						title: event.data.item.title,
						avatar: event.data.item.avatar
					});
				}
			},
			onUserDeselect(event) {
				const index = this.selectedUsers.currentValue.findIndex(user => {
					return user.id === event.data.item.id;
				});
				if (index > -1) {
					this.selectedUsers.currentValue.splice(index, 1);
				}
			},
			onPresenterSelect(event) {
				const index = this.selectedPresenters.currentValue.findIndex(user => {
					return user.id === event.data.item.id;
				});
				if (index === -1) {
					this.selectedPresenters.currentValue.push({
						id: event.data.item.id,
						title: event.data.item.title,
						avatar: event.data.item.avatar
					});
				}
			},
			onPresenterDeselect(event) {
				const index = this.selectedPresenters.currentValue.findIndex(user => {
					return user.id === event.data.item.id;
				});
				if (index > -1) {
					this.selectedPresenters.currentValue.splice(index, 1);
				}
			},
			onDateChange(newDate) {
				this.selectedDate.currentValue = BX.formatDate(newDate, BX.message('FORMAT_DATE'));
			},
			onTimeChange(newTime) {
				this.selectedTime.currentValue = newTime;
			},
			onDurationChange(newDuration) {
				this.selectedDuration.currentValue = String(newDuration);
			},
			onDurationTypeChange(newDurationType) {
				this.selectedDurationType.currentValue = newDurationType;
			},
			/* endregion 02. Field update handlers */

			/* region 03. Actions */
			discardChanges() {
				this.clearErrors();
				this.title.currentValue = this.title.initialValue;
				this.password.currentValue = this.password.initialValue;
				this.passwordNeeded.currentValue = this.passwordNeeded.initialValue;
				this.broadcastMode.currentValue = this.broadcastMode.initialValue;
				this.selectedUsers.currentValue = [...this.selectedUsers.initialValue];
				this.$root.$emit('updateUserSelector');
				this.selectedPresenters.currentValue = [...this.selectedPresenters.initialValue];
				this.$root.$emit('updatePresenterSelector');
				this.selectedDate.currentValue = this.selectedDate.initialValue;
				this.selectedTime.currentValue = this.selectedTime.initialValue;
				this.selectedDuration.currentValue = this.selectedDuration.initialValue;
				this.selectedDurationType.currentValue = this.selectedDurationType.initialValue;
				this.switchModeForAllFields(call_const.ConferenceFieldState.view);
			},
			openConference() {
				if (window.top["BX"]) {
					window.top["BX"].Messenger.Public.openConference({
						link: this.publicLink
					});
				}
			},
			copyInvitation() {
				let link = '';
				if (this.isFormCreateMode && this.linkGenerated) {
					link = main_core.Text.decode(this.aliasData['LINK']);
				} else if (this.isFormViewMode) {
					link = main_core.Text.decode(this.publicLink);
				}
				let title = this.localize['BX_IM_COMPONENT_CONFERENCE_DEFAULT_TITLE'];
				if (this.title.currentValue) {
					title = this.title.currentValue;
				}
				const copyValue = main_core.Text.decode(this.invitation.value).replace(/#CREATOR#/gm, this.chatHost.FULL_NAME).replace(/#TITLE#/gm, `"${title}"`).replace(/#LINK#/gm, `${link}`);
				im_lib_clipboard.Clipboard.copy(copyValue);
				if (main_core.Reflection.getClass('BX.UI.Notification.Center')) {
					top.BX.UI.Notification.Center.notify({
						content: this.localize['BX_IM_COMPONENT_CONFERENCE_INVITATION_COPIED']
					});
				}
			},
			openChat() {
				if (window.top["BXIM"]) {
					window.top["BXIM"].openMessenger('chat' + this.chatId);
				}
			},
			editAll() {
				this.switchModeForAllFields(call_const.ConferenceFieldState.edit);
			},
			/* endregion 03. Actions */

			/* region 04. Form handling */
			submitForm() {
				if (this.isSubmitting) {
					return false;
				}
				this.isSubmitting = true;
				const fieldsToSubmit = {};
				fieldsToSubmit['title'] = this.title.currentValue;
				fieldsToSubmit['password_needed'] = this.passwordNeeded.currentValue;
				fieldsToSubmit['password'] = this.password.currentValue;
				fieldsToSubmit['id'] = this.conferenceId;
				fieldsToSubmit['invitation'] = main_core.Text.decode(this.invitation.value);
				fieldsToSubmit['users'] = this.selectedUsers.currentValue.map(user => user.id);
				fieldsToSubmit['broadcast_mode'] = this.broadcastMode.currentValue;
				fieldsToSubmit['presenters'] = this.selectedPresenters.currentValue.map(user => user.id);
				this.clearErrors();
				if (this.isFormViewMode || this.linkGenerated) {
					main_core.ajax.runAction('bitrix:call.Conference.create', {
						json: {
							fields: fieldsToSubmit,
							aliasData: this.aliasData
						},
						analyticsLabel: {
							creationType: 'section'
						}
					}).then(response => {
						this.onSuccessfulSubmit();
					}).catch(response => {
						this.onFailedSubmit(response);
					});
				}
			},
			onSuccessfulSubmit() {
				if (this.isFormCreateMode) {
					this.copyInvitation();
				}
				this.isSubmitting = false;
				this.closeSlider();
				this.reloadGrid();
			},
			onFailedSubmit(response) {
				this.isSubmitting = false;
				let errorMessage = response["errors"][0].message;
				if (response["errors"][0].code === 'NETWORK_ERROR') {
					errorMessage = this.localize['BX_IM_COMPONENT_CONFERENCE_NETWORK_ERROR'];
				}
				this.addError(errorMessage);
			},
			/* endregion 04. Form handling */

			/* region 05. Helpers */
			checkRequirements() {
				if (!top.BX.PULL.isPublishingEnabled()) {
					this.disableButton();
					this.addError(this.localize['BX_IM_COMPONENT_CONFERENCE_PUSH_ERROR']);
				}
				if (!top.BX.Call.Util.isCallServerAllowed()) {
					this.disableButton();
					this.addError(this.localize['BX_IM_COMPONENT_CONFERENCE_VOXIMPLANT_ERROR_WITH_LINK']);
				}
			},
			disableButton() {
				const createButton = document.querySelector('#im-conference-create-wrap #ui-button-panel-save');
				if (createButton) {
					main_core.Dom.addClass(createButton, ['ui-btn-disabled', 'ui-btn-icon-lock']);
				}
			},
			generateLink() {
				main_core.ajax.runAction('bitrix:call.Conference.prepare', {
					json: {},
					analyticsLabel: {
						creationType: 'section'
					}
				}).then(response => {
					this.aliasData = response.data['ALIAS_DATA'];
					this.aliasData['LINK'] = main_core.Text.encode(this.aliasData['LINK']);
					this.title.defaultValue = response.data['DEFAULT_TITLE'];
					this.linkGenerated = true;
				}).catch(response => {
					im_lib_logger.Logger.warn('error', response["errors"][0].message);
				});
			},
			addError(errorText) {
				this.errors.push(errorText);
			},
			clearErrors() {
				this.errors = [];
			},
			closeSlider() {
				if (main_core.Reflection.getClass('BX.SidePanel')) {
					BX.SidePanel.Instance.close();
				}
			},
			reloadGrid() {
				if (main_core.Reflection.getClass('top.BX.Main.gridManager')) {
					top.BX.Main.gridManager.reload(this.gridId);
				} else {
					top.window.location = this.pathToList;
				}
			},
			setDefaultDateAndTime() {
				const date = new Date();
				const minutes = date.getMinutes();
				const mod = minutes % 5;
				if (mod > 0) {
					date.setMinutes(minutes - mod + (mod > 2 ? 5 : 0));
				}
				this.selectedDate.currentValue = BX.formatDate(date, BX.message('FORMAT_DATE'));
				this.selectedDate.initialValue = this.selectedDate.currentValue;
				this.selectedTime.currentValue = this.formatTime(date);
				this.selectedTime.initialValue = this.selectedTime.currentValue;
			},
			setDefaultDuration() {
				this.selectedDuration.currentValue = '30';
				this.selectedDuration.initialValue = this.selectedDuration.currentValue;
				this.selectedDurationType.currentValue = 'm';
				this.selectedDurationType.initialValue = this.selectedDurationType.currentValue;
			},
			formatTime(date) {
				const dateFormat = BX.date.convertBitrixFormat(BX.message('FORMAT_DATE')).replace(/:?\s*s/, '');
				const timeFormat = BX.date.convertBitrixFormat(BX.message('FORMAT_DATETIME')).replace(/:?\s*s/, '');
				const dateString = BX.date.format(dateFormat, date);
				const timeString = BX.date.format(timeFormat, date);
				return BX.util.trim(timeString.replace(dateString, ''));
			}
			/* endregion 05. Helpers */
		},
		components: FieldComponents,
		template: `
		<div>
			<template v-if="errors.length > 0">
				<div class="ui-alert ui-alert-danger" id="im-conference-create-errors">
					<span v-for="error in errors" class="ui-alert-message" v-html="error"></span>
				</div>
			</template>
			<div class="im-conference-create-block im-conference-create-fields-wrapper">
				<!-- Form fields -->
				<conference-field-title
					:mode="fieldsMode['title']"
					:title="title.currentValue"
					:defaultValue="title.defaultValue"
					@titleChange="onTitleChange"
					@switchToEdit="switchToEdit"
				/>
				<conference-field-planner
					:mode="fieldsMode['planner']"
					:selectedUsers="selectedUsers.currentValue"
					:selectedDate="selectedDate.currentValue"
					:selectedTime="selectedTime.currentValue"
					:selectedDuration="selectedDuration.currentValue"
					:selectedDurationType="selectedDurationType.currentValue"
					:chatHost="chatHost"
					@userSelect="onUserSelect"
					@userDeselect="onUserDeselect"
					@dateChange="onDateChange"
					@timeChange="onTimeChange"
					@durationChange="onDurationChange"
					@durationTypeChange="onDurationTypeChange"
					@switchToEdit="switchToEdit"
				/>
				<conference-field-password
					:mode="fieldsMode['password']"
					:password="password.currentValue"
					:passwordNeeded="passwordNeeded.currentValue"
					@passwordChange="onPasswordChange"
					@passwordNeededChange="onPasswordNeededChange"
					@switchToEdit="switchToEdit"
				/>
<!--				<div v-if="isFormCreateMode" class="im-conference-create-delimiter im-conference-create-delimiter-small"></div>-->
				<template v-if="broadcastingEnabled">
					<conference-field-broadcast
						:mode="fieldsMode['broadcast']"
						:broadcastMode="broadcastMode.currentValue"
						:selectedPresenters="selectedPresenters.currentValue"
						:chatHost="chatHost"
						@broadcastModeChange="onBroadcastModeChange"
						@switchToEdit="switchToEdit"
						@presenterSelect="onPresenterSelect"
						@presenterDeselect="onPresenterDeselect"
					/>
				</template>
				<!-- Action buttons -->
				<template v-if="!isFormCreateMode">
					<div class="im-conference-create-section im-conference-create-actions">
						<button @click="openConference" class="ui-btn ui-btn-sm ui-btn-primary ui-btn-icon-camera">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_START'] }}</button>
						<button @click="copyInvitation" class="ui-btn ui-btn-sm ui-btn-light-border ui-btn-icon-share">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_INVITATION_COPY'] }}</button>
						<button @click="openChat" class="ui-btn ui-btn-sm ui-btn-light-border ui-btn-icon-chat">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_CHAT'] }}</button>
						<button @click="editAll" class="ui-btn ui-btn-sm ui-btn-light">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_EDIT'] }}</button>
					</div>
				</template>
				<!-- Bottom button panel -->
				<div v-if="isEditing" class="im-conference-create-button-panel-edit ui-button-panel-wrapper ui-pinner ui-pinner-bottom ui-pinner-full-width">
					<div class="ui-button-panel ui-button-panel-align-center">
						<button @click="submitForm" id="ui-button-panel-save" :class="submitFormButtonClasses">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_SAVE'] }}</button>
						<a @click="discardChanges" id="ui-button-panel-cancel" class="ui-btn ui-btn-link">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_CANCEL'] }}</a>
					</div>
				</div>
				<div v-else-if="isFormCreateMode" class="im-conference-create-button-panel-add ui-button-panel-wrapper ui-pinner ui-pinner-bottom ui-pinner-full-width">
					<div class="ui-button-panel ui-button-panel-align-center">
						<button @click="submitForm" id="ui-button-panel-save" name="save" value="Y" :class="submitFormButtonClasses">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_CREATE'] }}</button>
						<a @click="closeSlider" id="ui-button-panel-cancel" class="ui-btn ui-btn-link">{{ localize['BX_IM_COMPONENT_CONFERENCE_BUTTON_CANCEL'] }}</a>
					</div>
				</div>
				<div class="im-conference-create-delimiter"></div>
				<!-- Invitation -->
				<conference-field-invitation
					:invitation="invitation"
					:chatHost="chatHost"
					:title="title.currentValue"
					:defaultTitle="title.defaultValue"
					:publicLink="conferenceLink"
					:formMode="mode"
					@invitationUpdate="onInvitationUpdate"
				/>
			</div>
		</div>
	`
	});

})(BX, BX, BX.Call.Const, BX.Messenger.Lib, BX.Messenger.Lib, BX.UI.EntitySelector, BX.Calendar, BX.Calendar, BX.Event);
//# sourceMappingURL=conference-edit.bundle.js.map

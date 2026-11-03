import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { BitrixVue } from 'ui.vue';
import { Vuex } from 'ui.vue.vuex';

import { EventType } from 'im.const';
import { Logger } from 'im.lib.logger';
import { Utils } from 'im.lib.utils';

// @vue/component
const UserForm = {
	data()
	{
		return {
			userNewName: '',
		};
	},
	computed:
	{
		conferenceStarted()
		{
			return this.conference.common.conferenceStarted;
		},
		userHasRealName()
		{
			if (!this.user)
			{
				return false;
			}

			return this.user.externalAuthId !== 'call';
		},
		guestCustomName()
		{
			if (this.user && this.user.externalAuthId === 'call' && this.conference.user.hasCustomName === true)
			{
				return this.user.name || '';
			}

			return '';
		},
		logoutLink()
		{
			return `${this.publicLink}?logout=yes&sessid=${Loc.getMessage('bitrix_sessid')}`;
		},
		publicLink()
		{
			return this.dialog ? this.dialog.public.link : '';
		},
		userId()
		{
			return this.application.common.userId;
		},
		isBroadcast()
		{
			return this.conference.common.isBroadcast;
		},
		presentersList()
		{
			return this.conference.common.presenters;
		},
		isCurrentUserPresenter()
		{
			return this.presentersList.includes(this.userId);
		},
		localize()
		{
			return BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
		},
		videoModeButtonClasses()
		{
			const classes = ['bx-im-component-call-join-video'];

			if (!this.getApplication().hardwareInited)
			{
				classes.push('disabled');
			}

			return classes;
		},
		audioModeButtonClasses()
		{
			const classes = ['bx-im-component-call-join-audio'];

			if (!this.getApplication().hardwareInited)
			{
				classes.push('disabled');
			}

			return classes;
		},
		...Vuex.mapState({
			user: (state) => state.users.collection[state.application.common.userId],
			application: (state) => state.application,
			conference: (state) => state.conference,
		}),
	},
	watch:
	{
		guestCustomName:
		{
			immediate: true,
			handler(name)
			{
				if (name && this.userNewName.length === 0)
				{
					this.userNewName = name;
				}
			},
		},
	},
	methods:
	{
		startConference({ video })
		{
			this.getApplication().startCall(video);
		},
		async joinConference({ video })
		{
			if (this.user.extranet && !this.userHasRealName)
			{
				await this.setNewName();
			}

			if (!this.conferenceStarted)
			{
				EventEmitter.emit(EventType.conference.waitForStart);

				this.getApplication().setUserReadyToJoin();
				this.getApplication().setJoinType(video);

				return;
			}

			const viewerMode = this.isBroadcast && !this.isCurrentUserPresenter;
			Logger.warn('ready to join call', video, viewerMode);
			if (viewerMode)
			{
				this.getApplication().joinCall(this.getApplication().preCall.id, this.getApplication().preCall.uuid, {
					joinAsViewer: true,
				});
			}
			else
			{
				this.getApplication().joinCall(this.getApplication().preCall.id, this.getApplication().preCall.uuid, { video });
			}
		},
		async setNewName()
		{
			if (this.userNewName.length > 0)
			{
				await this.getApplication().renameGuest(this.userNewName);
			}
		},
		getApplication()
		{
			return this.$Bitrix.Application.get();
		},
		isDesktop()
		{
			return Utils.platform.isBitrixDesktop();
		},
	},
	template: `
		<div class="bx-im-component-call-form">
			<template v-if="user && userHasRealName">
				<template v-if="!user.extranet">
					<div class="bx-im-component-call-intranet-name-container">
						<div class="bx-im-component-call-intranet-name-title">
							{{ localize['BX_IM_COMPONENT_CALL_INTRANET_NAME_TITLE'] }}
						</div>
						<div class="bx-im-component-call-intranet-name-content">
							<div class="bx-im-component-call-intranet-name-content-left">
								<div class="bx-im-component-call-intranet-name-text">{{ user.name }}</div>
							</div>
							<template v-if="!isDesktop()">
								<a :href="logoutLink" class="bx-im-component-call-intranet-name-logout">
									{{ localize['BX_IM_COMPONENT_CALL_INTRANET_LOGOUT'] }}
								</a>
							</template>
						</div>
					</div>
				</template>
				<template v-else-if="user.extranet">
					<div class="bx-im-component-call-guest-name-container">
						<div class="bx-im-component-call-guest-name-text">{{ user.name }}</div>
					</div>
				</template>
			</template>
			<!-- New guest, need to specify name -->
			<template v-else-if="user && !userHasRealName">
				<input
					v-model.trim="userNewName"
					type="text"
					:placeholder="localize['BX_IM_COMPONENT_CALL_NAME_PLACEHOLDER']"
					class="bx-im-component-call-name-input"
					ref="nameInput"
				/>
			</template>
			<!-- Buttons -->
			<template v-if="user">
				<!-- Broadcast mode -->
				<template v-if="isBroadcast">
					<!-- Speaker can start conference -->
					<template v-if="isCurrentUserPresenter && !conferenceStarted">
						<button
							@click="startConference({video: true})"
							:class="videoModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_START_WITH_VIDEO'] }}
						</button>
						<button
							@click="startConference({video: false})"
							:class="audioModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_START_WITH_AUDIO'] }}
						</button>
					</template>
					<!-- Speakers can join with audio/video -->
					<template v-else-if="conferenceStarted && isCurrentUserPresenter">
						<button
							@click="joinConference({video: true})"
							:class="videoModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN_WITH_VIDEO'] }}
						</button>
						<button
							@click="joinConference({video: false})"
							:class="audioModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN_WITH_AUDIO'] }}
						</button>
					</template>
					<!-- Others can join as viewers -->
					<template v-else-if="!isCurrentUserPresenter">
						<button
							@click="joinConference({video: false})"
							class="bx-im-component-call-join-video"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN'] }}
						</button>
					</template>
				</template>
				<!-- End broadcast mode -->
				<template v-else-if="!isBroadcast">
					<!-- Intranet user can start conference -->
					<template v-if="!user.extranet && !conferenceStarted">
						<button
							@click="startConference({video: true})"
							:class="videoModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_START_WITH_VIDEO'] }}
						</button>
						<button
							@click="startConference({video: false})"
							:class="audioModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_START_WITH_AUDIO'] }}
						</button>
					</template>
					<!-- Others can join -->
					<template v-else>
						<button
							@click="joinConference({video: true})"
							:class="videoModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN_WITH_VIDEO'] }}
						</button>
						<button
							@click="joinConference({video: false})"
							:class="audioModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN_WITH_AUDIO'] }}
						</button>
					</template>
				</template>
			</template>
			<!--End normal (not broadcast) mode-->
		</div>
	`,
};

export { UserForm };

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, call_widget_activeCall, call_widget_activeCallList) {
	'use strict';

	// @vue/component
	const ActiveCallList = {
		name: 'ActiveCallList',
		components: {
			ActiveCall: call_widget_activeCall.ActiveCall
		},
		inject: {
			avatarsOnly: {
				default: false
			}
		},
		props: {
			listIsScrolled: {
				type: Boolean,
				required: true
			},
			parentChatId: {
				type: Number,
				default: 0
			}
		},
		emits: ['onCallClick'],
		data() {
			return {
				listIsActive: true
			};
		},
		computed: {
			componentToRender() {
				return call_widget_activeCallList.ActiveCallList;
			},
			showsOneProject() {
				return this.parentChatId > 0;
			},
			projectCalls() {
				return this.$store.getters['recent/calls/get'].filter(activeCall => {
					const chat = this.$store.getters['chats/get'](activeCall.dialogId, true);
					return this.belongsToProject(chat);
				});
			}
		},
		activated() {
			this.listIsActive = true;
		},
		deactivated() {
			this.listIsActive = false;
		},
		methods: {
			belongsToProject(chat) {
				const chatIsKnown = Number(chat.dialogId) !== 0;
				const chatOfProject = chat.chatId === this.parentChatId || chat.parentChatId === this.parentChatId;
				return chatIsKnown && chatOfProject;
			},
			onCallClick(payload) {
				this.$emit('onCallClick', payload);
			}
		},
		template: `
		<template v-if="listIsActive">
			<template v-if="showsOneProject">
				<div
					v-if="projectCalls.length > 0"
					data-testid="im-active-call-list"
					class="bx-im-list-recent__calls_container"
					:class="{'--with-shadow': listIsScrolled}"
				>
					<ActiveCall
						v-for="activeCall in projectCalls"
						:key="activeCall.dialogId"
						:item="activeCall"
						@click="onCallClick"
					/>
				</div>
			</template>
			<component
				v-else-if="componentToRender"
				:is="componentToRender"
				data-testid="im-active-call-list"
				:class="{'--avatars-only': avatarsOnly}"
				:aria-hidden="avatarsOnly ? 'true' : null"
				:listIsScrolled="listIsScrolled"
				@onCallClick="onCallClick"
			/>
		</template>
	`
	};

	exports.ActiveCallList = ActiveCallList;

})(this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}, BX.Call.Widget, BX.Call.Widget);
//# sourceMappingURL=active-call-list.bundle.js.map

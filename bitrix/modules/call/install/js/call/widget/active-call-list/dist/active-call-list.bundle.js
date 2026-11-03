/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, call_widget_activeCall, call_widget_syncActiveCallsSlot) {
	'use strict';

	// @vue/component
	const ActiveCallList = {
		name: 'ActiveCallList',
		components: {
			ActiveCall: call_widget_activeCall.ActiveCall,
			SyncActiveCallsSlot: call_widget_syncActiveCallsSlot.SyncActiveCallsSlot
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
			}
		},
		emits: ['onCallClick'],
		data() {
			return {
				syncCallsCount: 0
			};
		},
		computed: {
			activeCalls() {
				return this.$store.getters['recent/calls/get'].filter(activeCall => {
					const dialog = this.$store.getters['chats/get'](activeCall.dialogId, true);
					return Number(dialog.dialogId) !== 0;
				});
			},
			syncActiveCallsEnabled() {
				return call_widget_syncActiveCallsSlot.isSyncActiveCallsEnabled();
			},
			syncActiveCallsMode() {
				return this.avatarsOnly ? 'compact' : 'full';
			}
		},
		methods: {
			onCallClick({
				item,
				$event
			}) {
				this.$emit('onCallClick', {
					item,
					$event
				});
			},
			onSyncCallsCountChange(count) {
				this.syncCallsCount = count;
			}
		},
		template: `
		<div
			v-if="syncActiveCallsEnabled"
			v-show="activeCalls.length > 0 || syncCallsCount > 0"
			class="bx-im-list-recent__calls_container"
			:class="{'--with-shadow': listIsScrolled}"
		>
			<ActiveCall
				v-for="activeCall in activeCalls"
				:key="activeCall.dialogId"
				:item="activeCall"
				@click="onCallClick"
			/>
			<SyncActiveCallsSlot :mode="syncActiveCallsMode" @countChange="onSyncCallsCountChange" />
		</div>
		<template v-else-if="activeCalls.length > 0">
			<div class="bx-im-list-recent__calls_container" :class="{'--with-shadow': listIsScrolled}">
				<ActiveCall
					v-for="activeCall in activeCalls"
					:key="activeCall.dialogId"
					:item="activeCall"
					@click="onCallClick"
				/>
			</div>
		</template>
	`
	};

	exports.ActiveCallList = ActiveCallList;

})(this.BX.Call.Widget = this.BX.Call.Widget || {}, BX.Call.Widget, BX.Call.Widget);
//# sourceMappingURL=active-call-list.bundle.js.map

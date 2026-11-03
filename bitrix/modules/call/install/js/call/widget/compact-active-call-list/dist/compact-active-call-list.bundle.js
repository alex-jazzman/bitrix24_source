/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, call_widget_compactActiveCall, call_widget_syncActiveCallsSlot) {
	'use strict';

	// @vue/component
	const CompactActiveCallList = {
		name: 'CompactActiveCallList',
		components: {
			CompactActiveCall: call_widget_compactActiveCall.CompactActiveCall,
			SyncActiveCallsSlot: call_widget_syncActiveCallsSlot.SyncActiveCallsSlot
		},
		props: {},
		emits: ['click'],
		data() {
			return {
				syncCallsCount: 0
			};
		},
		computed: {
			activeCalls() {
				return this.$store.getters['recent/calls/get'];
			},
			syncActiveCallsEnabled() {
				return call_widget_syncActiveCallsSlot.isSyncActiveCallsEnabled();
			}
		},
		methods: {
			onClick(params) {
				this.$emit('click', params);
			},
			onSyncCallsCountChange(count) {
				this.syncCallsCount = count;
			}
		},
		template: `
		<div
			v-if="syncActiveCallsEnabled"
			v-show="activeCalls.length > 0 || syncCallsCount > 0"
			class="bx-im-list-recent-compact__calls_container"
		>
			<CompactActiveCall
				v-for="activeCall in activeCalls"
				:key="activeCall.dialogId"
				:item="activeCall"
				@click="onClick"
			/>
			<SyncActiveCallsSlot mode="compact" @countChange="onSyncCallsCountChange" />
		</div>
		<template v-else-if="activeCalls.length > 0">
			<div class="bx-im-list-recent-compact__calls_container">
				<CompactActiveCall
					v-for="activeCall in activeCalls"
					:key="activeCall.dialogId"
					:item="activeCall"
					@click="onClick"
				/>
			</div>
		</template>
	`
	};

	exports.CompactActiveCallList = CompactActiveCallList;

})(this.BX.Call.Widget = this.BX.Call.Widget || {}, BX.Call.Widget, BX.Call.Widget);
//# sourceMappingURL=compact-active-call-list.bundle.js.map

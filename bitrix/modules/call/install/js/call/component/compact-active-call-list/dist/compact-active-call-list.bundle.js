/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,call_component_compactActiveCall) {
	'use strict';

	// @vue/component
	const CompactActiveCallList = {
	  name: 'CompactActiveCallList',
	  components: {
	    CompactActiveCall: call_component_compactActiveCall.CompactActiveCall
	  },
	  props: {},
	  emits: ['click'],
	  computed: {
	    activeCalls() {
	      return this.$store.getters['recent/calls/get'];
	    }
	  },
	  methods: {
	    onClick(params) {
	      this.$emit('click', params);
	    }
	  },
	  template: `
		<template v-if="activeCalls.length > 0">
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

}((this.BX.Call.Component = this.BX.Call.Component || {}),BX.Call.Component));
//# sourceMappingURL=compact-active-call-list.bundle.js.map

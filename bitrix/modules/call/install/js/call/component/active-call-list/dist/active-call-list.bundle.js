/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports,call_component_activeCall) {
	'use strict';

	// @vue/component
	const ActiveCallList = {
	  name: 'ActiveCallList',
	  components: {
	    ActiveCall: call_component_activeCall.ActiveCall
	  },
	  props: {
	    listIsScrolled: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['onCallClick'],
	  computed: {
	    activeCalls() {
	      return this.$store.getters['recent/calls/get'];
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
	    }
	  },
	  template: `
		<template v-if="activeCalls.length > 0">
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

}((this.BX.Call.Component = this.BX.Call.Component || {}),BX.Call.Component));
//# sourceMappingURL=active-call-list.bundle.js.map

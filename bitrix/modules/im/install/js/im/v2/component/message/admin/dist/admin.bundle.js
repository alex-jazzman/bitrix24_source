/* eslint-disable */
this.BX = this.BX || {};
this.BX.IM = this.BX.IM || {};
this.BX.IM.V2 = this.BX.IM.V2 || {};
this.BX.IM.V2.Component = this.BX.IM.V2.Component || {};
(function (exports,bitrix24_message_admin) {
	'use strict';

	// @vue/component
	const AdminMessage = {
	  name: 'AdminMessage',
	  components: {
	    AdminChatDisplay: bitrix24_message_admin.AdminChatDisplay
	  },
	  props: {
	    item: {
	      type: Object,
	      required: true
	    },
	    dialogId: {
	      type: String,
	      required: true
	    }
	  },
	  computed: {},
	  template: `
		<AdminChatDisplay :item="item" :dialogId="dialogId"/>
	`
	};

	exports.AdminMessage = AdminMessage;

}((this.BX.IM.V2.Component.Message = this.BX.IM.V2.Component.Message || {}),BX?.Bitrix24?.Message??{}));
//# sourceMappingURL=admin.bundle.js.map

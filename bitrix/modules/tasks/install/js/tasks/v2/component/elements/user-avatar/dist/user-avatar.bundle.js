/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_avatar) {
	'use strict';

	const UserAvatarSize = Object.freeze({
	  XXS: 'XXS',
	  XS: 'XS',
	  S: 'S',
	  M: 'M',
	  L: 'L',
	  XL: 'XL',
	  XXL: 'XXL',
	  XXXL: 'XXXL'
	});
	const UserAvatarSizeMap = Object.freeze({
	  [UserAvatarSize.XXXL]: 94,
	  [UserAvatarSize.XXL]: 60,
	  [UserAvatarSize.XL]: 48,
	  [UserAvatarSize.L]: 42,
	  [UserAvatarSize.M]: 32,
	  [UserAvatarSize.S]: 22,
	  [UserAvatarSize.XS]: 18,
	  [UserAvatarSize.XXS]: 14
	});

	const USER_TYPES = {
	  EMPLOYEE: 'employee',
	  COLLABER: 'collaber',
	  EXTRANET: 'extranet'
	};

	// @vue/component
	const UserAvatar = {
	  name: 'UiUserAvatar',
	  props: {
	    src: {
	      type: String,
	      default: ''
	    },
	    type: {
	      type: String,
	      default: USER_TYPES.EMPLOYEE
	    },
	    size: {
	      type: String,
	      default: UserAvatarSize.S
	    },
	    borderColor: {
	      type: String,
	      default: undefined
	    }
	  },
	  computed: {
	    normalizedSrc() {
	      return this.src === null ? '' : this.src;
	    },
	    isCollaber() {
	      return this.type === USER_TYPES.COLLABER;
	    },
	    isExtranet() {
	      return this.type === USER_TYPES.EXTRANET;
	    },
	    colorAvatar() {
	      let colorAvatarNew = '#858D95';
	      if (this.isCollaber) {
	        colorAvatarNew = '#19CC45';
	      }
	      if (this.isExtranet) {
	        colorAvatarNew = '#ca8600';
	      }
	      return colorAvatarNew;
	    },
	    ClassComponentAvatar() {
	      let ClassComponentAvatarNew = ui_avatar.AvatarBase;
	      if (this.isCollaber) {
	        ClassComponentAvatarNew = ui_avatar.AvatarRoundGuest;
	      }
	      if (this.isExtranet) {
	        ClassComponentAvatarNew = ui_avatar.AvatarRoundExtranet;
	      }
	      return ClassComponentAvatarNew;
	    },
	    optionsAvatar() {
	      return {
	        size: UserAvatarSizeMap[this.size],
	        picPath: encodeURI(this.normalizedSrc),
	        baseColor: this.colorAvatar,
	        borderColor: this.borderColor
	      };
	    }
	  },
	  watch: {
	    normalizedSrc() {
	      this.render();
	    }
	  },
	  mounted() {
	    this.render();
	  },
	  methods: {
	    render() {
	      var _this$avatar, _this$avatar$getConta;
	      (_this$avatar = this.avatar) == null ? void 0 : (_this$avatar$getConta = _this$avatar.getContainer()) == null ? void 0 : _this$avatar$getConta.remove();
	      this.avatar = new this.ClassComponentAvatar(this.optionsAvatar);
	      this.avatar.renderTo(this.$refs.container);
	    }
	  },
	  template: `
		<div class="b24-user-avatar" ref="container"/>
	`
	};

	exports.UserAvatar = UserAvatar;
	exports.UserAvatarSize = UserAvatarSize;
	exports.UserAvatarSizeMap = UserAvatarSizeMap;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI));
//# sourceMappingURL=user-avatar.bundle.js.map

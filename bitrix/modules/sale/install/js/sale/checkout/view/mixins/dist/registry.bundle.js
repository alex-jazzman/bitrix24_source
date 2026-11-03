/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sale = this.BX.Sale || {};
this.BX.Sale.Checkout = this.BX.Sale.Checkout || {};
this.BX.Sale.Checkout.View = this.BX.Sale.Checkout.View || {};
(function (exports, sale_checkout_const, main_loader) {
		'use strict';

		var loader = {
			methods: {
				changeStatus() {
					if (this.config.status === sale_checkout_const.Loader.status.wait) {
						this.loader.show(this.$refs.container);
					} else {
						this.loader.hide();
					}
				},
				initLoader() {
					this.loader = new main_loader.Loader({
						size: 64
					});
				}
			},
			computed: {
				getStatus() {
					return this.config.status;
				},
				// a string: Vue 2 drops an attribute bound to false
				ariaBusy() {
					return this.config.status === sale_checkout_const.Loader.status.wait ? 'true' : 'false';
				}
			},
			watch: {
				getStatus() {
					this.changeStatus();
				}
			},
			created() {
				this.initLoader();
			},
			mounted() {
				if (this.config.status === sale_checkout_const.Loader.status.wait) {
					this.loader.show(this.$refs.container);
				}
			}
		};

		var buttonWait = {
			data() {
				return {
					wait: false
				};
			},
			methods: {
				setWait() {
					this.wait = true;
				}
			},
			computed: {
				// a string: Vue 2 drops an attribute bound to false
				ariaBusy() {
					return this.wait ? 'true' : 'false';
				},
				getObjectClass() {
					const classes = ['btn', 'btn-checkout-order-status', 'btn-md', 'rounded-pill'];
					if (this.wait) {
						classes.push('btn-wait');
					}
					return classes;
				}
			}
		};

		var productItemEdit = {
			computed: {
				getSrc() {
					return encodeURI(this.item.product.picture);
				}
			},
			methods: {
				hasSkyTree() {
					let tree = this.item.sku.tree.SELECTED_VALUES ?? {};
					return Object.keys(tree).length > 0;
				},
				hasProps() {
					return this.item.props.length > 0;
				}
			}
		};

		exports.MixinButtonWait = buttonWait;
		exports.MixinLoader = loader;
		exports.MixinProductItemEdit = productItemEdit;

})(this.BX.Sale.Checkout.View.Mixins = this.BX.Sale.Checkout.View.Mixins || {}, BX.Sale.Checkout.Const, BX);
//# sourceMappingURL=registry.bundle.js.map

/* eslint-disable */
this.BX = this.BX || {};
this.BX.Booking = this.BX.Booking || {};
(function (exports, ui_vue3_vuex, booking_const) {
	'use strict';

	/* eslint-disable no-param-reassign */
	class AiAgentModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return booking_const.Model.AiAgent;
		}
		getState() {
			return {
				aiAgent: null
			};
		}
		getGetters() {
			return {
				/** @function ai-agent/aiAgent */
				aiAgent: state => state.aiAgent
			};
		}
		getActions() {
			return {
				/** @function ai-agent/setAiAgent */
				setAiAgent({
					commit
				}, aiAgent) {
					commit('setAiAgent', aiAgent);
				}
			};
		}
		getMutations() {
			return {
				setAiAgent(state, aiAgent) {
					state.aiAgent = aiAgent;
				}
			};
		}
	}

	exports.AiAgentModel = AiAgentModel;

})(this.BX.Booking.Model = this.BX.Booking.Model || {}, BX.Vue3.Vuex, BX.Booking.Const);
//# sourceMappingURL=ai-agent.bundle.js.map

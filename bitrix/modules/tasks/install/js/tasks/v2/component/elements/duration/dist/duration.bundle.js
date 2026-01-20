/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_date,ui_system_input_vue,ui_system_menu_vue,tasks_v2_const,tasks_v2_lib_calendar) {
	'use strict';

	const unitDurations = main_date.DurationFormat.getUnitDurations();
	const Duration = {
	  components: {
	    BInput: ui_system_input_vue.BInput,
	    BMenu: ui_system_menu_vue.BMenu
	  },
	  props: {
	    modelValue: {
	      type: [Number, null],
	      required: true
	    },
	    matchesWorkTime: {
	      type: Boolean,
	      default: false
	    },
	    label: {
	      type: String,
	      default: null
	    },
	    design: {
	      type: String,
	      default: null
	    },
	    error: {
	      type: String,
	      default: null
	    },
	    maxValue: {
	      type: Number,
	      default: 20000
	    }
	  },
	  emits: ['update:modelValue', 'focus', 'blur', 'menuShown', 'menuHidden'],
	  data() {
	    return {
	      isMenuShown: false,
	      durationValue: '',
	      unitId: tasks_v2_const.DurationUnit.Days
	    };
	  },
	  computed: {
	    menuOptions() {
	      return () => ({
	        bindElement: this.$refs.unit.$el,
	        items: Object.entries(this.units).map(([unitId, {
	          title
	        }]) => ({
	          title,
	          isSelected: unitId === this.unitId,
	          onClick: () => {
	            this.unitId = unitId;
	            this.update();
	          }
	        })),
	        targetContainer: document.body
	      });
	    },
	    units() {
	      return {
	        [tasks_v2_const.DurationUnit.Days]: {
	          duration: this.matchesWorkTime ? tasks_v2_lib_calendar.calendar.workdayDuration : unitDurations.d,
	          title: this.formatUnit('d')
	        },
	        [tasks_v2_const.DurationUnit.Hours]: {
	          duration: unitDurations.H,
	          title: this.formatUnit('H')
	        },
	        [tasks_v2_const.DurationUnit.Minutes]: {
	          duration: unitDurations.i,
	          title: this.formatUnit('i')
	        }
	      };
	    }
	  },
	  watch: {
	    modelValue() {
	      this.setDuration(this.modelValue);
	    }
	  },
	  created() {
	    this.setDuration(this.modelValue);
	  },
	  methods: {
	    setDuration(duration) {
	      if (!duration) {
	        this.durationValue = '';
	        return;
	      }
	      const minutes = duration / this.units[tasks_v2_const.DurationUnit.Minutes].duration;
	      const hours = duration / this.units[tasks_v2_const.DurationUnit.Hours].duration;
	      const days = duration / this.units[tasks_v2_const.DurationUnit.Days].duration;
	      const [durationValue, unitId] = {
	        [true]: [Math.floor(minutes), tasks_v2_const.DurationUnit.Minutes],
	        [Number.isInteger(hours)]: [hours, tasks_v2_const.DurationUnit.Hours],
	        [Number.isInteger(days)]: [days, tasks_v2_const.DurationUnit.Days]
	      }.true;
	      this.unitId = unitId;
	      this.durationValue = String(durationValue);
	    },
	    showMenu() {
	      this.$emit('menuShown');
	      this.isMenuShown = true;
	    },
	    hideMenu() {
	      this.$emit('menuHidden');
	      this.isMenuShown = false;
	    },
	    handleInput() {
	      const durationValue = this.durationValue.replaceAll(/\D/g, '');
	      if (Number(durationValue) < 0 || Number(durationValue) > this.maxValue) {
	        var _this$previousValue;
	        this.durationValue = (_this$previousValue = this.previousValue) != null ? _this$previousValue : '';
	        return;
	      }
	      this.durationValue = durationValue;
	      this.previousValue = durationValue;
	      this.update();
	    },
	    update() {
	      this.$emit('update:modelValue', this.durationValue * this.units[this.unitId].duration);
	    },
	    formatUnit(format) {
	      const value = Number(this.durationValue) % 1000;
	      return new main_date.DurationFormat(value * unitDurations[format]).format({
	        format
	      }).replace(value, '').trim();
	    }
	  },
	  template: `
		<div class="b24-duration">
			<BInput
				v-model="durationValue"
				:label
				:design
				:error
				stretched
				@input="handleInput"
				@focus="$emit('focus')"
				@blur="$emit('blur')"
			/>
			<BInput
				:modelValue="units[unitId].title"
				:design
				dropdown
				clickable
				stretched
				:active="isMenuShown"
				ref="unit"
				@click="showMenu"
			/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="hideMenu"/>
	`
	};

	exports.Duration = Duration;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.Main,BX.UI.System.Input.Vue,BX.UI.System.Menu,BX.Tasks.V2.Const,BX.Tasks.V2.Lib));
//# sourceMappingURL=duration.bundle.js.map

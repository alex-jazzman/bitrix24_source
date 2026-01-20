/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_iconSet_animated,tasks_v2_provider_service_placementService,ui_system_typography_vue,main_core,tasks_v2_const,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_lib_fieldHighlighter) {
	'use strict';

	// @vue/component
	const PlacementsListItem = {
	  name: 'PlacementsListItem',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextMd: ui_system_typography_vue.TextMd,
	    TextXs: ui_system_typography_vue.TextXs
	  },
	  inject: {
	    taskId: {}
	  },
	  props: {
	    /** @type PlacementModel */
	    placement: {
	      type: Object,
	      required: true
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    isDrawerPlacement() {
	      return this.placement.type === tasks_v2_const.PlacementType.taskViewDrawer;
	    }
	  },
	  methods: {
	    async onPlacementClick() {
	      if (this.isDrawerPlacement) {
	        // TODO: Open application drawer
	        return;
	      }
	      await this.openApplicationSlider();
	    },
	    async openApplicationSlider() {
	      await main_core.Runtime.loadExtension('applayout');
	      BX.rest.AppLayout.openApplication(this.placement.appId, {
	        taskId: this.taskId
	      }, {
	        PLACEMENT: this.placement.type,
	        PLACEMENT_ID: this.placement.id
	      });
	    }
	  },
	  template: `
		<div class="tasks-field-placement-item" @click="onPlacementClick">
			<div class="tasks-field-placement-item-header">
				<div class="tasks-field-placement-item-title-container">
					<BIcon :name="Outline.PRODUCT" class="tasks-field-placement-item-icon"/>
					<TextMd accent>{{ placement.title }}</TextMd>
				</div>
			</div>
			<TextXs
				v-if="placement.description"
				class="tasks-field-placement-item-description"
			>
				{{ placement.description }}
			</TextXs>
		</div>
	`
	};

	// @vue/component
	const PlacementsList = {
	  name: 'PlacementsList',
	  components: {
	    PlacementsListItem
	  },
	  props: {
	    /** @type PlacementModel[] */
	    placements: {
	      type: Array,
	      required: true
	    }
	  },
	  template: `
		<div class="tasks-field-placements-list-container">
			<div class="tasks-field-placements-list">
				<PlacementsListItem
					v-for="placement in placements"
					:key="placement.id"
					:placement
				/>
			</div>
		</div>
	`
	};

	const placementsMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Placements,
	  title: main_core.Loc.getMessage('TASKS_V2_PLACEMENT_TITLE')
	});

	// @vue/component
	const Placements = {
	  name: 'TaskPlacements',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextMd: ui_system_typography_vue.TextMd,
	    PlacementsList
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      placementsMeta,
	      Animated: ui_iconSet_api_vue.Animated
	    };
	  },
	  data() {
	    return {
	      isLoading: false
	    };
	  },
	  computed: {
	    placementIds() {
	      return this.task.placementIds;
	    },
	    hasPlacements() {
	      return main_core.Type.isArrayFilled(this.task.placementIds);
	    },
	    placements() {
	      if (!this.hasPlacements) {
	        return [];
	      }
	      return this.$store.getters[`${tasks_v2_const.Model.Placements}/getByIds`](this.placementIds);
	    },
	    shouldLoadPlacements() {
	      return this.task.containsPlacements && main_core.Type.isNull(this.placementIds);
	    }
	  },
	  async created() {
	    if (!this.shouldLoadPlacements) {
	      return;
	    }
	    await this.loadPlacements();
	  },
	  methods: {
	    async loadPlacements() {
	      this.isLoading = true;
	      try {
	        await tasks_v2_provider_service_placementService.placementService.get(this.taskId);
	      } catch (error) {
	        console.error('Failed to load placements', {
	          taskId: this.taskId,
	          error
	        });
	      } finally {
	        this.isLoading = false;
	      }
	    }
	  },
	  template: `
		<div
			class="tasks-field-placements"
			:data-task-id="taskId"
			:data-task-field-id="placementsMeta.id"
			data-field-container
		>
			<template v-if="isLoading">
				<div class="tasks-field-placements-empty-container">
					<BIcon :name="Animated.LOADER_WAIT"/>
					<TextMd accent>{{ loc('TASKS_V2_PLACEMENT_TITLE_LOADING') }}</TextMd>
				</div>
			</template>
			<PlacementsList v-else-if="hasPlacements" :placements/>
		</div>
	`
	};

	// @vue/component
	const PlacementsChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  inject: {
	    taskId: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      placementsMeta
	    };
	  },
	  computed: {
	    design() {
	      return ui_system_chip_vue.ChipDesign.ShadowAccent;
	    }
	  },
	  methods: {
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(placementsMeta.id);
	    }
	  },
	  template: `
		<Chip
			:design="design"
			:text="placementsMeta.title"
			:icon="Outline.PRODUCT"
			:data-task-id="taskId"
			:data-task-chip-id="placementsMeta.id"
			ref="chip"
			@click="highlightField"
		/>
	`
	};

	exports.Placements = Placements;
	exports.PlacementsChip = PlacementsChip;
	exports.placementsMeta = placementsMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX,BX.Tasks.V2.Provider.Service,BX.UI.System.Typography.Vue,BX,BX.Tasks.V2.Const,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Lib));
//# sourceMappingURL=placements.bundle.js.map

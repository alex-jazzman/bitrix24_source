/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, ui_system_typography_vue) {
	'use strict';

	// @vue/component
	const UiTabs = {
		name: 'UiTabs',
		components: {
			TextMd: ui_system_typography_vue.TextMd
		},
		props: {
			modelValue: {
				type: [String, Number],
				required: true
			},
			/** @type{Tab[]} */
			tabs: {
				type: Array,
				required: true
			}
		},
		emits: ['update:modelValue'],
		computed: {
			activeTab() {
				return this.tabs.find(({
					id
				}) => id === this.modelValue);
			}
		},
		beforeMount() {
			if (main_core.Type.isNil(this.activeTab)) {
				this.$emit('update:modelValue', this.tabs?.[0]?.id ?? null);
			}
		},
		methods: {
			getTabPanelId(id = '') {
				return `tasks-ui-tabs-tabpanel-${id}`;
			},
			isActiveTab(tab) {
				return this.activeTab?.id === tab.id;
			}
		},
		template: `
		<div class="tasks--ui-tabs">
			<div class="tasks--ui-tabs--tab-list" role="tablist">
				<button
					v-for="tab in tabs"
					:key="tab.id"
					type="button"
					role="tab"
					:tabindex="activeTab?.id === tab.id ? 0 : -1"
					:aria-controls="getTabPanelId(tab.id)"
					:data-tab-id="tab.id"
					:class="[
						'tasks--ui-tabs--tab',
						{
							'--active': isActiveTab(tab),
						}
					]"
					:title="tab.title"
					@click="$emit('update:modelValue', tab.id)"
				>
					<TextMd
						:className="isActiveTab(tab) ? 'tasks--ui-tabs--tab-text-active' : 'tasks--ui-tabs--tab-text'">
						{{ tab.title }}
					</TextMd>
				</button>
			</div>
			<div :id="getTabPanelId(activeTab?.id)" class="tasks--ui-tabs--tab-content" role="tabpanel">
				<Transition name="tab-content" mode="out-in">
					<slot :id="modelValue" :activeTab="activeTab" :tabs="tabs">
						<Component :is="activeTab?.component"/>
					</slot>
				</Transition>
			</div>
		</div>
	`
	};

	exports.UiTabs = UiTabs;

})(this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}, BX, BX.UI.System.Typography.Vue);
//# sourceMappingURL=ui-tabs.bundle.js.map

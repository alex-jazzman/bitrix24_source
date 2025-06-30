import type { BitrixVueComponentProps } from 'ui.vue3';
import { Dom, UI } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog, Item } from 'ui.entity-selector';
// eslint-disable-next-line no-unused-vars
import type { Scope, Dashboard } from '../type';

export const DashboardScopeSelector: BitrixVueComponentProps = {
	props: {
		dashboard: {
			/** @type Dashboard */
			type: Object,
			required: true,
		},
	},
	data(): Object {
		return {
			scopeNameLengthLimit: 30,
		};
	},
	beforeUnmount(): void
	{
		if (this.dialog)
		{
			this.dialog.destroy();
		}
		this.dialog = null;
	},
	computed: {
		visibleScopes(): Scope[]
		{
			return this.scopes.slice(0, 3);
		},
		moreScopesText(): string
		{
			return this.$Bitrix.Loc.getMessage('BI_GROUP_SCOPES_MORE').replace('#NUMBER#', this.dashboard.scopes.length - 3);
		},
		showMoreScopes(): boolean
		{
			return this.dashboard.scopes.length > 3;
		},
		scopes(): Scope[]
		{
			return [...this.dashboard.scopes];
		},
		isGroupScope(): (scopeCode: string) => boolean
		{
			return (scopeCode: string) => this.$store.getters.isGroupScope(this.dashboard.id, scopeCode);
		},
	},
	emits: [
		'onScopeChange',
	],
	methods: {
		formatScopeName(scopeName: string): string
		{
			if (scopeName.length < this.scopeNameLengthLimit)
			{
				return scopeName;
			}

			return `${scopeName.slice(0, this.scopeNameLengthLimit)}...`;
		},
		openSelector(): void
		{
			if (!this.dialog)
			{
				this.initDialog();
			}
			this.dialog.show();
		},
		initDialog(): void
		{
			const preselectedItems = [];
			const undeselectedItems = [];
			for (const scope: Scope of this.dashboard.scopes)
			{
				preselectedItems.push(['biconnector-superset-scope', scope.code]);
				if (this.isGroupScope(scope.code))
				{
					undeselectedItems.push(['biconnector-superset-scope', scope.code]);
				}
			}
			this.dialog = new Dialog({
				id: 'dashboard-scope-selector',
				targetNode: this.$refs.dashboardScopes,
				width: 350,
				height: 300,
				dropdownMode: true,
				compactView: true,
				showAvatars: false,
				enableSearch: true,
				preload: true,
				preselectedItems,
				undeselectedItems,
				entities: [
					{
						id: 'biconnector-superset-scope',
						dynamicLoad: true,
						dynamicSearch: true,
					},
				],
				events: {
					'Item:onSelect': this.handleScopeAdd,
					'Item:onDeselect': this.handleScopeRemove,
				},
			});
			this.dialog.getPopup().setOffset({ offsetLeft: -320 });
			this.dialog.adjustPosition();
			Dom.addClass(this.dialog.getContainer(), 'biconnector-scope-selector');
		},
		handleScopeAdd(event: BaseEvent): void
		{
			const addedItem: Item = event.getData().item;
			const scopes: Scope[] = this.scopes;
			scopes.push({
				code: addedItem.getId(),
				name: addedItem.getTitle(),
			});
			this.$store.commit('setDashboardScopes', {
				dashboardId: this.dashboard.id,
				scopes,
			});
			this.$emit('onScopeChange');
		},
		handleScopeRemove(event: BaseEvent): void
		{
			const removedItem: Item = event.getData().item;
			const scopes = this.scopes.filter((item: Scope) => item.code !== removedItem.id);
			this.$store.commit('setDashboardScopes', {
				dashboardId: this.dashboard.id,
				scopes,
			});
			this.$emit('onScopeChange');
		},
		showMoreScopesHint(): void
		{
			const hintNode = this.$refs.moreScopesHint;
			this.hintManager.show(hintNode, this.scopes.slice(3).map((scope: Scope) => scope.name).join(', '), false);
		},
		hideMoreScopesHint(): void
		{
			this.hintManager.hide();
		},
		onGroupScopeChanged(): void
		{
			this.dialog?.destroy();
			this.dialog = null;
		},
	},
	mounted(): void
	{
		this.hintManager = UI.Hint.createInstance({
			id: `dashboard-scope-hint-${Date.now()}`,
			popupParameters: {
				bindOptions: {
					position: 'bottom',
				},
				width: 190,
				offsetLeft: -80,
				angle: {
					position: 'top',
					offset: 130,
				},
			},
		});
	},
	template: `
		<div class="group-dashboard-scopes-container">
			<span class="scope-list scope-list-dashboard" @click="openSelector">
				<span
					v-if="scopes.length > 0"
					v-for="(scope, index) of visibleScopes"
					class="scope-name"
					:title="scope.name.length > scopeNameLengthLimit ? scope.name : null"
				>
					{{formatScopeName(scope.name)}}{{ index < visibleScopes.length - 1 ? ', ' : '' }}
				</span>
				<span v-else>
					{{$Bitrix.Loc.getMessage('BI_GROUP_DASHBOARD_SCOPES_EMPTY')}}
				</span>
			</span>
			<span
				v-if="showMoreScopes"
				class="scope-list scope-list-more"
				@click="openSelector"
				ref="moreScopesHint"
				@mouseenter="showMoreScopesHint"
				@mouseleave="hideMoreScopesHint"
			>
				{{moreScopesText}}
			</span>
			<span ref="dashboardScopes"></span>
		</div>
	`,
};

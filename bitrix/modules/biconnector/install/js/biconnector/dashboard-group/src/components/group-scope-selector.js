import { Dom, UI } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog, Item } from 'ui.entity-selector';
import type { BitrixVueComponentProps } from 'ui.vue3';
import { BIcon, Set } from 'ui.icon-set.api.vue';
import { hint } from 'ui.vue3.directives.hint';
import type { Scope } from '../type';

export const GroupScopeSelector: BitrixVueComponentProps = {
	props: {
		canEdit: {
			type: Boolean,
			required: true,
		},
	},
	directives: {
		hint,
	},
	data(): Object {
		return {
			scopeNameLengthLimit: 30,
		};
	},
	computed: {
		scopes(): Scope[]
		{
			return this.$store.getters.groupScopes;
		},
		moreScopesText(): string
		{
			return this.$Bitrix.Loc.getMessage('BI_GROUP_SCOPES_MORE').replace('#NUMBER#', this.scopes.length - 1);
		},
		showMoreScopes(): boolean
		{
			return this.scopes.length > 1;
		},
		hintOptions(): Object
		{
			return {
				html: this.$Bitrix.Loc.getMessage('BI_GROUP_SCOPE_HINT')
					.replace('[link]', '<a class="scope-hint-link" onclick="top.BX.Helper.show(`redirect=detail&code=25556500`)">')
					.replace('[/link]', '</a>'),
				interactivity: true,
				popupOptions: {
					bindOptions: {
						position: 'bottom',
					},
					autoHide: false,
					width: 244,
					offsetTop: -4,
					angle: {
						position: 'top',
						offset: 34,
					},
				},
			};
		},
		systemScopeHintOptions(): ?Object
		{
			if (this.canEdit)
			{
				return null;
			}

			return {
				text: this.$Bitrix.Loc.getMessage('BI_GROUP_SYSTEM_SCOPES_HINT'),
				popupOptions: {
					bindOptions: {
						position: 'bottom',
					},
					width: 244,
					offsetLeft: -140,
					angle: {
						position: 'top',
						offset: 180,
					},
				},
			};
		},
		set(): Set
		{
			return Set;
		},
	},
	methods: {
		openScopeSelector(): void
		{
			if (!this.canEdit)
			{
				return;
			}

			if (!this.dialog)
			{
				this.initDialog();
			}
			this.dialog.show();
		},
		initDialog(): void
		{
			const preselectedItems = [];
			for (const scope: Scope of this.scopes)
			{
				preselectedItems.push(['biconnector-superset-scope', scope.code]);
			}
			this.dialog = new Dialog({
				id: 'group-scope-selector',
				targetNode: this.$refs.groupScopes,
				width: 350,
				height: 300,
				dropdownMode: true,
				compactView: true,
				showAvatars: false,
				enableSearch: true,
				preload: true,
				preselectedItems,
				entities: [
					{
						id: 'biconnector-superset-scope',
						dynamicLoad: true,
						dynamicSearch: true,
					},
				],
				events: {
					'Item:onSelect': this.onGroupScopeAdd,
					'Item:onDeselect': this.onGroupScopeRemove,
				},
			});
			this.dialog.getPopup().setOffset({ offsetLeft: -320 });
			this.dialog.adjustPosition();
			Dom.addClass(this.dialog.getContainer(), 'biconnector-scope-selector');
		},
		onGroupScopeAdd(event: BaseEvent): void
		{
			const item: Item = event.getData().item;
			const scope: Scope = { code: item.getId(), name: item.getTitle() };
			this.$emit('onGroupScopeAdd', scope);
		},
		onGroupScopeRemove(event: BaseEvent): void
		{
			const item: Item = event.getData().item;
			const scope: Scope = { code: item.getId(), name: item.getTitle() };
			this.$emit('onGroupScopeRemove', scope);
		},
		showMoreScopesHint(): void
		{
			const hintNode = this.$refs.moreScopesHint;
			this.hintManager.show(hintNode, this.scopes.slice(1).map((scope: Scope) => scope.name).join(', '), false);
		},
		hideMoreScopesHint(): void
		{
			this.hintManager.hide();
		},
		formatScopeName(scopeName: string): string
		{
			if (scopeName.length < this.scopeNameLengthLimit)
			{
				return scopeName;
			}

			return `${scopeName.slice(0, this.scopeNameLengthLimit)}...`;
		},
	},
	mounted()
	{
		this.hintManager = UI.Hint.createInstance({
			id: 'group-scope-hint',
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
	emits: [
		'onGroupScopeAdd',
		'onGroupScopeRemove',
	],
	components: {
		BIcon,
	},
	template: `
		<span class="scopes-title">
			{{$Bitrix.Loc.getMessage('BI_GROUP_SCOPES')}}
		</span>
		<span
			v-if="scopes.length > 0"
			@click="openScopeSelector"
			class="scope-list scope-list-group"
			:class="{'scope-list-system': !canEdit}"
			v-hint="systemScopeHintOptions"
			:title="scopes[0].name.length > scopeNameLengthLimit ? scopes[0].name : null"
		>
			{{formatScopeName(scopes[0].name)}}
		</span>
		<span
			v-else
			class="scope-list scope-list-group"
			:class="{'scope-list-system': !canEdit}"
			@click="openScopeSelector"
		>
			{{$Bitrix.Loc.getMessage('BI_GROUP_SCOPES_EMPTY')}}
		</span>
		<span
			v-if="showMoreScopes"
			@click="openScopeSelector"
			class="scope-list scope-list-more"
			ref="moreScopesHint"
			@mouseenter="showMoreScopesHint"
			@mouseleave="hideMoreScopesHint"
		>
			{{moreScopesText}}
		</span>
		<div class="group-scope-list-hint" ref="groupScopes" v-hint="hintOptions">
			<BIcon
				:name="set.HELP"
				:size="20"
				color="#D5D7DB"
			></BIcon>
		</div>
	`,
};

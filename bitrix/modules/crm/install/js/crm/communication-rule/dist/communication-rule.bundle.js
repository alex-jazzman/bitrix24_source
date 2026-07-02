/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_vue3, main_core_events, main_popup, ui_entitySelector) {
	'use strict';

	const RuleAction = {
		emits: ['removeActionBlock', 'addActionBlock', 'changeActionBlock'],
		props: {
			id: {
				type: Symbol,
				required: true
			},
			type: {
				type: String,
				required: true
			},
			data: {
				type: Object,
				required: false,
				default: {}
			},
			entities: {
				type: Array,
				required: true,
				default: []
			}
		},
		data() {
			return {
				currentActionCategory: this.data.actionCategory ?? null,
				currentSelectedEntityId: this.data.entityTypeId ?? null,
				currentSelectedCategoryId: this.data.categoryId ?? null,
				entityReuseMode: this.data.entityReuseMode ?? null,
				searchStrategy: this.data.searchStrategy ?? null
			};
		},
		computed: {
			currentEntity() {
				return this.getEntityById(this.currentSelectedEntityId);
			}
		},
		methods: {
			getEntityById(entityTypeId) {
				return this.entities.find(entity => entity.entityTypeId === Number(entityTypeId)) ?? null;
			},
			removeActionBlock() {
				this.$emit('removeActionBlock', this.id);
			},
			emitChanged() {
				const data = {
					actionCategory: this.currentActionCategory,
					entityTypeId: this.currentSelectedEntityId,
					categoryId: this.currentSelectedCategoryId,
					entityReuseMode: this.entityReuseMode,
					searchStrategy: this.searchStrategy
				};
				this.$emit('changeActionBlock', this.id, data);
			}
		},
		watch: {
			currentSelectedEntityId() {
				this.emitChanged();
			},
			currentSelectedCategoryId() {
				this.emitChanged();
			},
			entityReuseMode() {
				this.emitChanged();
			},
			searchStrategy() {
				this.emitChanged();
			},
			currentActionCategory() {
				this.emitChanged();
			}
		},
		created() {
			this.$watch('data', data => {
				this.currentActionCategory = data.actionCategory ?? null;
				this.currentSelectedEntityId = data.entityTypeId ?? null;
				this.currentSelectedCategoryId = data.categoryId ?? null;
				this.entityReuseMode = data.entityReuseMode ?? null;
				this.searchStrategy = data.searchStrategy ?? null;
			}, {
				deep: true
			});
		},
		template: `
		<div class="communication-rule-action-wrapper">
			<div
				class="communication-rule-property-close"
				@click="removeActionBlock"
			>
				X
			</div>
			
			<div class="ui-form-row">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_CATEGORY_TITLE')}
					</div>
				</div>
				<div class="ui-form-content">
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select class="ui-ctl-element" v-model="currentActionCategory">
							<option value="entity">${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_CATEGORY_ITEM_CREATE')}</option>
							<option value="exit">${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_CATEGORY_EXIT')}</option>
						</select>
					</div>
				</div>
			</div>
			
			<div class="ui-form-row" v-if="currentActionCategory === 'entity'">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_ENTITY_TITLE')}
					</div>
				</div>
				<div class="ui-form-content">
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select class="ui-ctl-element" v-model="currentSelectedEntityId">
							<option
								v-for="entity in entities"
								:key="entity.entityTypeId"
								:value="entity.entityTypeId"
							>
								{{ entity.name }}
							</option>
						</select>
					</div>
				</div>
			</div>
			
			<div
				v-if="currentActionCategory === 'entity' && currentEntity?.categories?.length > 1"
				class="ui-form-row"
			>
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_ENTITY_CATEGORY_TITLE')}
					</div>
				</div>
				<div class="ui-form-content">
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select class="ui-ctl-element" v-model="currentSelectedCategoryId">
							<option
								v-for="category in currentEntity?.categories"
								:key="category.id"
								:value="category.id"
							>
								{{ category.name }}
							</option>
						</select>
					</div>
				</div>
			</div>
			
			<div class="ui-form-row" v-if="currentActionCategory === 'entity'">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_ENTITY_REUSE_MODE')}
					</div>
				</div>
				<div class="ui-form-content">
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select class="ui-ctl-element" v-model="entityReuseMode">
							<option value="new">${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_ENTITY_REUSE_MODE_NEW')}</option>
							<option value="exist">${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_ENTITY_REUSE_MODE_EXIST')}</option>
						</select>
					</div>
				</div>
			</div>
			
			<div class="ui-form-row" v-if="entityReuseMode === 'exist'">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_SEARCH_STRATEGY')}
					</div>
				</div>
				<div class="ui-form-content">
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select class="ui-ctl-element" v-model="searchStrategy">
							<option value="1">${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_SEARCH_STRATEGY_MAX_CREATE')}</option>
							<option value="2">${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ACTION_SEARCH_STRATEGY_MAX_UPDATE')}</option>
						</select>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const RuleActions = {
		components: {
			RuleAction
		},
		props: {
			actions: {
				type: Array,
				required: true,
				default: []
			},
			entities: {
				type: Array,
				required: true,
				default: []
			}
		},
		data() {
			return {
				preparedActions: this.getPreparedActions()
			};
		},
		computed: {
			currentEntity() {
				return this.getEntityById(this.currentSelectedEntityId);
			}
		},
		methods: {
			reset() {
				this.preparedActions = this.getPreparedActions();
			},
			getPreparedActions() {
				const preparedActions = [];
				this.actions.forEach(action => {
					preparedActions.push({
						id: Symbol('actionId'),
						...action
					});
				});
				return preparedActions;
			},
			getEntityById(entityTypeId) {
				return this.entities.find(entity => entity.entityTypeId === entityTypeId);
			},
			addAction() {
				this.preparedActions.push({
					id: Symbol('actionId'),
					type: 'entity',
					data: {}
				});
			},
			removeActionBlock(id) {
				const index = this.preparedActions.findIndex(action => action.id === id);
				if (index >= 0) {
					this.preparedActions.splice(index, 1);
				}
			},
			changeActionBlock(id, data) {
				const action = this.preparedActions.find(item => item.id === id);
				if (action) {
					action.data = data;
				}
			},
			getData() {
				const data = [];
				this.preparedActions.forEach(action => {
					data.push({
						type: action.type,
						data: action.data
					});
				});
				return data;
			}
		},
		template: `
		<div>
			<div class="communication-rule-title">
				<span class="communication-rule-title-text">
					${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CHANNEL_ACTIONS_SETTINGS_TITLE')}
				</span>
			</div>
			<div class="ui-form">
				<RuleAction
					v-for="action in preparedActions"
					:id="action.id"
					:type="action.type"
					:data="action.data"
					:entities="entities"
					@changeActionBlock="changeActionBlock"
					@removeActionBlock="removeActionBlock"
				/>
				<span
					class="communication-rule-add-rule-property"
					@click="addAction"
				>
					${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ADD_ACTION')}
				</span>
			</div>	
		</div>
	`
	};

	const LogicSelector = {
		props: {
			id: {
				type: Symbol,
				required: true
			},
			value: {
				type: String,
				required: true
			}
		},
		methods: {
			changeLogicSelector(value) {
				this.$emit('onChange', this.id, value);
			}
		},
		computed: {
			andClass() {
				return ['communication-rule-property-logic-selector', {
					'--active': this.value === 'AND'
				}];
			},
			orClass() {
				return ['communication-rule-property-logic-selector', {
					'--active': this.value === 'OR'
				}];
			}
		},
		template: `
		<div class="communication-rule-property-logic-selector-container">
			<div
				:class="andClass"
				@click="changeLogicSelector('AND')"
			>
				${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_PROPERTY_AND')}
			</div>
			<div
				:class="orClass"
				@click="changeLogicSelector('OR')"
			>
				${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_PROPERTY_OR')}
			</div>
		</div>
	`
	};

	const RuleProperty = {
		emits: ['appendValue', 'removeValue', 'inputValue', 'removePropertyBlock'],
		props: {
			id: {
				type: Symbol,
				required: true
			},
			property: {
				type: Object,
				required: true
			},
			values: {
				type: Array,
				required: false,
				default: [null]
			}
		},
		methods: {
			appendValue() {
				this.$emit('appendValue', this.id);
			},
			removeValue(index) {
				this.$emit('removeValue', this.id, index);
			},
			inputValue(value, index) {
				this.$emit('inputValue', this.id, index, value);
			},
			removePropertyBlock() {
				this.$emit('removePropertyBlock', this.id);
			}
		},
		template: `
		<div class="ui-form-row communication-rule-property-wrapper">
			<div 
				class="communication-rule-property-close"
				@click="removePropertyBlock"
			>
				X
			</div>
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					{{ property.title }}
				</div>
			</div>
			<div class="ui-form-content">
				<div
					v-for="(value, index) in values"
					key="index"
					class="ui-ctl ui-ctl-row ui-ctl-w100"
				>
					<div
						v-if="index > 0"
						class="communication-rule-label-or"
					>
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_PROPERTY_OR')}
					</div>
					<select
						v-if="property.type === 'enumeration'"
						ref="values"
						class="ui-ctl-element"
						@input="inputValue($event.target.value, index)"
						:value="value ?? ''"
					>
						<option
							v-for="(elementValue, elementIndex) in property.params.list"
							:key="elementIndex"
							:value="elementIndex"
						>
							{{ elementValue }}
						</option>
					</select>
					<input
						v-else
						ref="values"
						type="text"
						class="ui-ctl-element"
						@input="inputValue($event.target.value, index)"
						:value="value ?? ''"
					>
					<div 
						class="communication-rule-rule-value-remove"
						ref="remove"
						@click="removeValue(index)"
					>
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_REMOVE_RULE_VALUE')}
					</div>
				</div>
				
				<div class="communication-rule-rule-value-add-wrapper">
					<div
						class="communication-rule-rule-value-add"
						ref="add"
						@click="appendValue"
					>
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ADD_RULE_VALUE')}
					</div>
				</div>
			</div>
		</div>
	`
	};

	const LOGIC_AND = 'AND';
	const RuleProperties = {
		components: {
			RuleProperty,
			LogicSelector
		},
		props: {
			properties: {
				type: Object,
				required: true,
				default: {}
			},
			rules: {
				type: Array,
				required: false,
				default: []
			}
		},
		data() {
			return {
				filledProperties: this.rules || []
			};
		},
		methods: {
			getPropertyByCode(code) {
				return this.properties.find(property => property.code === code) ?? null;
			},
			showRuleSelector() {
				const menuItems = [];
				const menuParams = {
					closeByEsc: true,
					autoHide: true,
					//offsetLeft: 60,
					angle: true,
					cacheable: false
				};
				this.properties.forEach(property => {
					menuItems.push({
						id: `rule-selector-menu-id-${property.code}`,
						onclick: this.onRuleSelectorItemClick.bind(this, property.code),
						html: main_core.Text.encode(property.title)
					});
				});
				this.ruleSelector = main_popup.MenuManager.create('communication-rule-selector', this.$refs.showRuleSelector, menuItems, menuParams);
				this.ruleSelector.show();
			},
			onRuleSelectorItemClick(code) {
				const id = Symbol('ruleId');
				this.filledProperties.push({
					id,
					code,
					values: [null],
					logic: LOGIC_AND
				});
				this.ruleSelector.close();
			},
			appendValue(id) {
				const filledProperty = this.filledProperties.find(property => property.id === id);
				filledProperty?.values.push(null);
			},
			removeValue(id, index) {
				const filledProperty = this.filledProperties.find(property => property.id === id);
				filledProperty?.values.splice(index, 1);
			},
			inputValue(id, index, value) {
				const filledProperty = this.filledProperties.find(property => property.id === id);
				if (filledProperty) {
					filledProperty.values[index] = value;
				}
			},
			removePropertyBlock(id) {
				const index = this.filledProperties.findIndex(property => property.id === id);
				if (index >= 0) {
					this.filledProperties.splice(index, 1);
				}
			},
			onChangeLogicValue(id, value) {
				const filledProperty = this.filledProperties.find(property => property.id === id);
				if (filledProperty) {
					filledProperty.logic = value;
				}
			},
			getData() {
				const data = [];
				this.filledProperties.forEach(property => {
					data.push({
						values: property.values,
						code: property.code,
						logic: property.logic
					});
				});
				return data;
			}
		},
		template: `
		<div>
			<div class="communication-rule-title">
				<span class="communication-rule-title-text">
					${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CHANNEL_RULES_SETTINGS_TITLE')}
				</span>
			</div>
			<div class="ui-form">
				<div
					class="communication-rule-property-container"
					v-for="(filledProperty, index) in filledProperties"
				>
					<RuleProperty
						:key="filledProperty.code"
						:id="filledProperty.id"
						:property="getPropertyByCode(filledProperty.code)"
						:values="filledProperty.values"
						@appendValue="appendValue"
						@removeValue="removeValue"
						@inputValue="inputValue"
						@removePropertyBlock="removePropertyBlock"
					/>
					<div
						v-if="index < filledProperties.length - 1"
					>
						<LogicSelector
							:id="filledProperty.id"
							:value="filledProperty.logic"
							@onChange="onChangeLogicValue"
						/>
					</div>
				</div>
				<span
					class="communication-rule-add-rule-property"
					@click="showRuleSelector"
					ref="showRuleSelector"
				>
					${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_ADD_RULE')}
				</span>
			</div>
		</div>
	`
	};

	const QueueConfig = {
		props: {
			properties: {
				type: Object,
				required: true,
				default: {}
			},
			config: {
				type: Object,
				required: true,
				default: {}
			}
		},
		data() {
			return {
				isMembersSelectorReadOnly: false,
				filledMembers: this.config.MEMBERS || [],
				isForwardTo: this.config.SETTINGS?.FORWARD_TO || false,
				isTimeTracking: this.config.SETTINGS?.TIME_TRACKING || false,
				filledMemberRequestDistribution: this.config.SETTINGS?.MEMBER_REQUEST_DISTRIBUTION || 'STRICTLY',
				filledTimeBeforeRequestNextMember: this.config.SETTINGS?.TIME_BEFORE_REQUEST_NEXT_MEMBER || 5
			};
		},
		methods: {
			isPropertyEnabled(code) {
				return Object.prototype.hasOwnProperty.call(this.properties, code) && (this.properties[code] === true || main_core.Type.isArrayFilled(this.properties[code]));
			},
			getSelectedMembers() {
				return this.filledMembers.map(item => {
					return [item.ENTITY_TYPE, parseInt(item.ENTITY_ID, 10)];
				});
			},
			getData() {
				const selectedMembers = this.membersSelector.getDialog().getSelectedItems();
				if (main_core.Type.isArrayFilled(selectedMembers)) {
					this.filledMembers = selectedMembers.map(item => ({
						ENTITY_ID: item.getId(),
						ENTITY_TYPE: item.getEntityId()
					}));
				}
				return {
					members: this.filledMembers,
					properties: {
						FORWARD_TO: this.isForwardTo,
						TIME_TRACKING: this.isTimeTracking,
						MEMBER_REQUEST_DISTRIBUTION: this.filledMemberRequestDistribution,
						TIME_BEFORE_REQUEST_NEXT_MEMBER: this.filledTimeBeforeRequestNextMember
					}
				};
			}
		},
		mounted() {
			this.membersSelector = new ui_entitySelector.TagSelector({
				id: 'queue-config-members-tag-selector',
				context: 'QUEUE_CONFIG_MEMBERS_SELECTOR',
				readonly: this.isMembersSelectorReadOnly,
				dialogOptions: {
					id: 'queue-config-members-tag-selector',
					preselectedItems: this.getSelectedMembers(),
					entities: [{
						id: 'user',
						options: {
							inviteEmployeeLink: false,
							intranetUsersOnly: true
						}
					}, {
						id: 'department',
						options: {
							inviteEmployeeLink: false,
							selectMode: 'usersAndDepartments'
						}
					}]
				}
			});
			this.membersSelector.renderTo(this.$refs.membersSelector);
		},
		template: `
		<div class="ui-form">
			<div class="ui-form-row">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_QUEUE_CONFIG_SELECTOR_TITLE')}
					</div>
				</div>
				<div class="ui-form-content" ref="membersSelector"></div>
			</div>
			<div
				v-if="isPropertyEnabled('FORWARD_TO')"
				class="ui-form-row"
			>
				<label for="isForwardTo" class="communication-queue-checkbox-block-wrapper ui-ctl ui-ctl-checkbox">
					<input
						type="checkbox"
						class="ui-ctl-element"
						name="isForwardTo"
						v-model="isForwardTo"
					>
					<span class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_QUEUE_CONFIG_FORWARD_TO_TITLE')}
					</span>
				</label>
			</div>
			<div
				v-if="isPropertyEnabled('TIME_TRACKING')"
				class="ui-form-row"
			>
				<label for="isTimeTracking" class="communication-queue-checkbox-block-wrapper ui-ctl ui-ctl-checkbox">
					<input
						type="checkbox"
						class="ui-ctl-element"
						name="isTimeTracking"
						v-model="isTimeTracking"
					>
					<span class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_QUEUE_CONFIG_TIME_TRACKING_TITLE')}
					</span>
				</label>
			</div>
			<div
				v-if="isPropertyEnabled('MEMBER_REQUEST_DISTRIBUTION_STRICTLY')"
				class="ui-form-row"
			>
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_QUEUE_CONFIG_MEMBER_REQUEST_DISTRIBUTION_NAME')}
					</div>
				</div>
				<div class="ui-form-content">
					<select
						class="communication-queue-checkbox-block-wrapper ui-ctl ui-ctl-row ui-ctl-w100 ui-ctl-element"
						v-model="filledMemberRequestDistribution"
					>
						<option 
							value="STRICTLY"
						>
							${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_QUEUE_CONFIG_MEMBER_REQUEST_DISTRIBUTION_STRICTLY')}
						</option>
						<option 
							v-if="isPropertyEnabled('MEMBER_REQUEST_DISTRIBUTION_EVENLY')"
							value="EVENLY"
						>
							${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_QUEUE_CONFIG_MEMBER_REQUEST_DISTRIBUTION_EVENLY')}
						</option>
						<option
							v-if="isPropertyEnabled('MEMBER_REQUEST_DISTRIBUTION_ALL')"
							value="ALL"
						>
							${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_QUEUE_CONFIG_MEMBER_REQUEST_DISTRIBUTION_ALL')}
						</option>
					</select>
				</div>
			</div>
			<div
				v-if="isPropertyEnabled('TIME_BEFORE_REQUEST_NEXT_MEMBER')"
				class="ui-form-row"
			>
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_QUEUE_CONFIG_TIME_BEFORE_REQUEST_NEXT_MEMBER_NAME')}
					</div>
				</div>
				<div class="ui-form-content">
					<select
						class="communication-queue-checkbox-block-wrapper ui-ctl ui-ctl-row ui-ctl-w100 ui-ctl-element"
						v-model="filledTimeBeforeRequestNextMember"
					>
						<option v-for="value in this.properties.TIME_BEFORE_REQUEST_NEXT_MEMBER" :value="value">
							{{ value }}
						</option>
					</select>
				</div>
			</div>
		</div>
	`
	};

	const EMPTY = 0;
	const LEAD = 1;
	const CONTACT = 3;
	const COMPANY = 4;
	const CommunicationRule$1 = {
		components: {
			RuleProperties,
			RuleActions,
			QueueConfig
		},
		props: {
			rule: {
				type: Object,
				required: false,
				default: {}
			},
			channels: {
				type: Array,
				required: true,
				default: []
			},
			searchTargetEntities: {
				type: Array,
				required: true,
				default: []
			},
			entities: {
				type: Array,
				required: true,
				default: []
			},
			selectedChannelId: {
				type: Number,
				required: false,
				default: null
			}
		},
		data() {
			const searchTarget = this.rule?.SEARCH_TARGETS ?? {};
			return {
				currentSelectedChannelId: this.selectedChannelId ?? this.channels[0].id,
				currentSelectedTargetEntitySectionId: searchTarget.sectionId,
				currentSelectedTargetEntityTypeIds: main_core.Runtime.clone(searchTarget.entityTypeIds) ?? [],
				ruleId: this.rule?.ID || null,
				actions: this.rule?.ENTITIES || [],
				title: this.rule?.TITLE || [],
				rules: this.rule?.RULES || [],
				queueConfig: this.rule?.QUEUE_CONFIG || [],
				skipNextRules: this.rule?.SETTINGS?.skipNextRules === 'Y' || false,
				manualItemsCreate: this.rule?.SETTINGS?.manualItemsCreate === 'Y' || false,
				runWorkflowLater: this.rule?.SETTINGS?.runWorkflowLater === 'Y' || false
			};
		},
		mounted() {
			main_core_events.EventEmitter.subscribe(BX.UI.ButtonPanel, 'button-click', this.onButtonClick.bind(this));
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(BX.UI.ButtonPanel, 'button-click', this.onButtonClick);
		},
		computed: {
			selectedChannelRuleProperties() {
				return this.getChannelById(this.currentSelectedChannelId)?.properties;
			},
			selectedChannelQueueConfig() {
				return this.getChannelById(this.currentSelectedChannelId)?.queueConfig;
			},
			targetEntitySections() {
				const sections = [];
				this.searchTargetEntities.forEach(item => {
					sections.push(item.section);
				});
				return sections;
			},
			compatibleEntities() {
				// empty -> all excepts repeated lead
				if (this.currentSelectedTargetEntityTypeIds.includes(EMPTY)) {
					return this.entities.filter(entity => {
						return entity.entityTypeId !== LEAD || entity.entityTypeId === LEAD && entity.data?.isReturnCustomer !== true;
					});
				}

				// lead -> lead
				if (this.currentSelectedTargetEntityTypeIds.includes(LEAD) && this.currentSelectedTargetEntityTypeIds.length === 1) {
					const leadEntity = this.entities.find(entity => {
						return entity.entityTypeId === LEAD && entity.data?.isReturnCustomer !== true;
					});
					return [leadEntity];
				}

				// contact -> repeated lead, contact, deal, dynamics
				if (this.currentSelectedTargetEntityTypeIds.includes(CONTACT) && this.currentSelectedTargetEntityTypeIds.length === 1) {
					return this.entities.filter(entity => {
						return entity.entityTypeId !== COMPANY && entity.entityTypeId !== LEAD || entity.entityTypeId === LEAD && entity.data?.isReturnCustomer === true;
					});
				}
				if (this.currentSelectedTargetEntityTypeIds.includes(LEAD) && this.currentSelectedTargetEntityTypeIds.includes(CONTACT) && this.currentSelectedTargetEntityTypeIds.length === 2) {
					return this.entities.filter(entity => {
						return entity.entityTypeId !== COMPANY;
					});
				}
				if (this.currentSelectedTargetEntityTypeIds.includes(LEAD) && this.currentSelectedTargetEntityTypeIds.includes(COMPANY) && this.currentSelectedTargetEntityTypeIds.length === 2) {
					return this.entities.filter(entity => {
						return entity.entityTypeId !== CONTACT;
					});
				}
				if (this.currentSelectedTargetEntityTypeIds.length === 0) {
					return this.entities.filter(entity => {
						return entity.entityTypeId !== LEAD || entity.data?.isReturnCustomer !== true;
					});
				}
				return this.entities;
			}
		},
		methods: {
			async onButtonClick(event) {
				const data = event.getData();
				const button = data[0] ?? null;
				if (!main_core.Type.isObject(button)) {
					return;
				}
				if (button.TYPE === 'save') {
					await this.save();
				} else if (button.TYPE === 'remove') {
					await this.delete();
				}
				const currentSlider = top.BX.SidePanel.Instance.getSliderByWindow(window);
				if (currentSlider) {
					currentSlider.setCacheable(false);
					currentSlider.close(false);
				}
			},
			async save() {
				const data = {
					id: this.ruleId,
					title: this.title,
					channelId: this.currentSelectedChannelId,
					properties: this.$refs.properties.getData() ?? [],
					queueConfig: this.$refs.queueConfig.getData() ?? [],
					searchTargets: {
						sectionId: this.currentSelectedTargetEntitySectionId,
						entityTypeIds: this.currentSelectedTargetEntityTypeIds
					},
					actions: this.$refs.actions.getData() ?? [],
					settings: {
						skipNextRules: this.skipNextRules ? 'Y' : 'N',
						manualItemsCreate: this.manualItemsCreate ? 'Y' : 'N',
						runWorkflowLater: this.runWorkflowLater ? 'Y' : 'N'
					}
				};
				return new Promise(async (resolve, reject) => {
					main_core.ajax.runAction('crm.controller.communication.rule.save', {
						data
					}).then(response => {
						resolve(response);
					}).catch(response => {
						const errors = [];
						response.errors.forEach(({
							message
						}) => {
							errors.push(message);
						});
						reject(errors);
					});
				});
			},
			async delete() {
				const data = {
					id: this.ruleId,
					withQueue: true
				};

				// eslint-disable-next-line no-async-promise-executor
				return new Promise(async (resolve, reject) => {
					main_core.ajax.runAction('crm.controller.communication.rule.delete', {
						data
					}).then(response => {
						resolve(response);
					}).catch(response => {
						const errors = [];
						response.errors.forEach(({
							message
						}) => {
							errors.push(message);
						});
						reject(errors);
					});
				});
			},
			getChannelById(id) {
				return this.channels.find(channel => channel.id === id) ?? null;
			},
			getTargetEntitiesBySectionId(sectionId) {
				const section = this.searchTargetEntities.find(entity => entity.section.id === sectionId);
				return section?.entities ?? [];
			},
			onChangeCurrentSelectedTargetEntityTypeIds() {
				this.actions = [];
				if (this.currentSelectedTargetEntityTypeIds.includes(LEAD)) {
					this.currentSelectedTargetEntityTypeIds = [LEAD];
				}
				void this.$nextTick(() => {
					this.$refs.actions.reset();
				});
			}
		},
		template: `
		<div>
			<div class="communication-rule-block-wrapper">
				<div class="communication-rule-title">
					<span class="communication-rule-title-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CHANNEL_COMMON_SETTINGS_TITLE')}
					</span>
				</div>
				<div class="ui-form">
					<div class="ui-form-row">
						<div class="ui-form-label">
							<div class="ui-ctl-label-text">
								${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_TITLE')}
							</div>
						</div>
						<div class="ui-form-content">
							<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
								<input
									type="text" 
									class="ui-ctl-element"
									v-model="title"
								>
							</div>
						</div>
					</div>
					<div class="ui-form-row">
						<div class="ui-form-label">
							<div class="ui-ctl-label-text">
								${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CHANNEL_TITLE')}
							</div>
						</div>
						<div class="ui-form-content">
							<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
								<div class="ui-ctl-after ui-ctl-icon-angle"></div>
								<select class="ui-ctl-element" v-model="currentSelectedChannelId">
									<option v-for="channel in channels" :value="channel.id" :key="channel.id">
											{{ channel.title }}
										</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			</div>
	
			<div class="communication-rule-block-wrapper">
				<div class="communication-rule-title">
					<span class="communication-rule-title-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CHANNEL_SEARCH_TARGET_TITLE')}
					</span>
				</div>
				<div class="ui-form">
					<div class="ui-form-row">
						<div class="ui-form-label">
							<div class="ui-ctl-label-text">
								${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CHANNEL_SEARCH_TARGET_CATEGORY')}
							</div>
						</div>
						<div class="ui-form-content">
							<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
								<div class="ui-ctl-after ui-ctl-icon-angle"></div>
								<select class="ui-ctl-element" v-model="currentSelectedTargetEntitySectionId">
									<option v-for="section in targetEntitySections" :value="section.id" :key="section.id">
											{{ section.title }}
										</option>
								</select>
							</div>
						</div>
					</div>
					<div class="ui-form-row">
						<div class="ui-form-label">
							<div class="ui-ctl-label-text">
								${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CHANNEL_SEARCH_TARGET_ENTITY_TYPE')}
							</div>
						</div>
						<div class="ui-form-content">
							<div class="ui-ctl ui-ctl-w100">
								<select 
									class="ui-ctl-element" 
									v-model="currentSelectedTargetEntityTypeIds"
									multiple
									@change="onChangeCurrentSelectedTargetEntityTypeIds"
								>
									<option :value="0">
											${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CHANNEL_SEARCH_TARGET_ENTITY_EMPTY')}
										</option>
									<option 
										v-for="entity in getTargetEntitiesBySectionId(currentSelectedTargetEntitySectionId)"
										:value="entity.id"
										:key="entity.id"
									>
											{{ entity.title }}
										</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			</div>
	
			<div class="communication-rule-block-wrapper">
				<RuleProperties
					ref="properties"
					:properties="selectedChannelRuleProperties"
					:rules="rules"
				/>
			</div>

			<div class="communication-rule-block-wrapper">
				<div class="communication-rule-title">
					<span class="communication-rule-title-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_QUEUE_CONFIG_TITLE')}
					</span>
				</div>
				<QueueConfig
					ref="queueConfig"
					:properties="selectedChannelQueueConfig"
				 	:config="queueConfig"
				/>
			</div>

			<div class="communication-rule-block-wrapper">
				<RuleActions
					ref="actions"
					:actions="actions"
					:entities="compatibleEntities"
				/>
			</div>
	
			<div class="communication-rule-block-wrapper">
				<div class="communication-rule-title">
					<span class="communication-rule-title-text">
						${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CHANNEL_ADDITIONAL_SETTINGS_TITLE')}
					</span>
				</div>
				<div class="ui-form">
					<div class="ui-form-content">
						<div class="ui-form-row">
							<label for="skipNextRules" class="ui-ctl ui-ctl-checkbox">
								<input 
									class="ui-ctl-element"
									type="checkbox"
									name="skipNextRules"
									v-model="skipNextRules"
								>
								<span class="ui-ctl-label-text">
									${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CS_SKIP_RULES')}
								</span>
							</label>
						</div>
						<div class="ui-form-row">
							<label for="manualItemsCreate" class="ui-ctl ui-ctl-checkbox">
								<input 
									class="ui-ctl-element"
									type="checkbox"
									name="manualItemsCreate"
									v-model="manualItemsCreate"
								>
								<span class="ui-ctl-label-text">
									${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CS_MANUAL_ITEMS_CREATE')}
								</span>
							</label>
						</div>
						<div class="ui-form-row">
							<label for="runWorkflowLater" class="ui-ctl ui-ctl-checkbox">
								<input 
									class="ui-ctl-element"
									type="checkbox"
									name="runWorkflowLater"
									v-model="runWorkflowLater"
								>
								<span class="ui-ctl-label-text">
									${main_core.Loc.getMessage('CRM_COMMUNICATION_RULE_CS_RUN_WORKFLOW_LATER')}
								</span>
							</label>
						</div>
					</div>
				</div>
			</div>
		</div>
	`
	};

	class CommunicationRule {
		#container;
		#app = null;
		#channels;
		#entities;
		#rule;
		#searchTargetEntities;
		#selectedTargetEntitySectionId;
		#selectedTargetEntityTypeIds;
		constructor(containerId, params) {
			this.#channels = params.channels;
			this.#entities = params.entities;
			this.#rule = params.rule;
			this.#searchTargetEntities = params.searchTargetEntities;
			this.#selectedTargetEntitySectionId = params.selectedTargetEntitySectionId ?? null;
			this.#selectedTargetEntityTypeIds = params.searchTargetEntities ?? [];
			this.#container = document.getElementById(containerId);
			if (!main_core.Type.isDomNode(this.#container)) {
				throw new Error('container not found');
			}
			this.#app = ui_vue3.BitrixVue.createApp(CommunicationRule$1, {
				rule: this.#rule,
				channels: this.#channels,
				entities: this.#entities,
				searchTargetEntities: this.#searchTargetEntities,
				selectedTargetEntitySectionId: this.#selectedTargetEntitySectionId,
				selectedTargetEntityTypeIds: this.#selectedTargetEntityTypeIds
			});
			this.#app.mount(this.#container);
		}
	}

	exports.CommunicationRule = CommunicationRule;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Vue3, BX.Event, BX.Main, BX.UI.EntitySelector);
//# sourceMappingURL=communication-rule.bundle.js.map

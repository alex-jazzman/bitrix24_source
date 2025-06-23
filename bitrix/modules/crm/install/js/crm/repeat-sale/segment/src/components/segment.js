import { ajax as Ajax, Loc, Text, Type } from 'main.core';
import { BBCodeParser } from 'ui.bbcode.parser';
import { UI } from 'ui.notification';
import { TextEditor } from 'ui.text-editor';
import { hint } from 'ui.vue3.directives.hint';
import { AdditionalInfoComponent } from './common/additional-info-component';
import { AiSwitcherComponent } from './common/ai-switcher-component';
import { TextEditorWrapperComponent } from './common/text-editor-wrapper-component';
import { Button, ButtonEvents } from './navigation/button';
import { CallAssessmentSelector } from './selector/call-assessment-selector';
import { CategorySelector } from './selector/category-selector';
import { StageSelector } from './selector/stage-selector';
import { UserSelector } from './selector/user-selector';

const ARTICLE_CODE = '23240682';

export const Segment = {
	components: {
		Button,
		AdditionalInfoComponent,
		AiSwitcherComponent,
		TextEditorWrapperComponent,
		CallAssessmentSelector,
		CategorySelector,
		StageSelector,
		UserSelector,
	},

	directives: {
		hint,
	},

	props: {
		settings: {
			type: Object,
			default: {},
		},
		segment: {
			type: Object,
			required: true,
		},
		categories: {
			type: Object,
			required: true,
		},
		callAssessments: {
			type: Object,
			required: true,
		},
		events: {
			type: Object,
			default: {},
		},
		textEditor: TextEditor,
	},

	data(): Object
	{
		const { segment, textEditor, categories } = this;
		const id = segment?.id ?? null;
		const isEnabled = segment?.isEnabled ?? null;

		const firstCategory = categories[0];

		return {
			id,
			isEnabled,
			text: textEditor.getText(),
			parser: new BBCodeParser(),
			isVisibleExpertSettings: false,

			currentCategoryId: segment.entityCategoryId ?? firstCategory.id,
			currentStageId: segment.entityStageId ?? this.getFirstAvailableCategoryStageId(firstCategory),
			assignmentUserIds: new Set(segment.assignmentUserIds ?? []),
			currentEntityTitlePattern: segment.entityTitlePattern ?? null,
			currentCallAssessmentId: segment.callAssessmentId ?? null,
			currentIsAiEnabled: segment.isAiEnabled ?? true,
		};
	},

	mounted(): void
	{
		this.$Bitrix.eventEmitter.subscribe(ButtonEvents.click, this.onNavigationButtonClick);
	},

	beforeUnmount(): void
	{
		this.$Bitrix.eventEmitter.unsubscribe(ButtonEvents.click, this.onNavigationButtonClick);
	},

	methods: {
		onSaveCallback(): void
		{
			if (Type.isFunction(this.events?.onSave))
			{
				this.events.onSave();
			}
		},
		onNavigationButtonClick({ data }): void
		{
			const { id } = data;
			if (id === 'cancel' || id === 'close')
			{
				this.closeSlider();

				return;
			}

			this.sendData();
		},
		sendData(): void
		{
			const data = {
				prompt: this.textEditor.getText(),
				entityTypeId: 2, // temporary only deal
				entityCategoryId: this.currentCategoryId,
				entityStageId: this.currentStageId,
				assignmentUserIds: [...this.assignmentUserIds.values()],
				entityTitlePattern: this.currentEntityTitlePattern,
				callAssessmentId: this.currentCallAssessmentId,
				isAiEnabled: this.currentIsAiEnabled,
			};

			if (!this.validate(data))
			{
				return;
			}

			const dataParams = {
				id: this.id,
				data,
			};

			top.BX.Event.EventEmitter.emit('crm:repeatSale:segment:beforeSave', dataParams);

			Ajax
				.runAction('crm.repeatsale.segment.save', { json: dataParams })
				.then(
					(response) => {
						top.BX.Event.EventEmitter.emit('crm:repeatSale.segment:save', {
							...dataParams,
							status: response?.status,
						});

						if (response?.status !== 'success')
						{
							UI.Notification.Center.notify({
								content: Text.encode(response.errors[0].message),
								autoHideDelay: 6000,
							});

							return;
						}

						this.onSaveCallback();
						this.closeSlider();
					},
					(response) => {
						const messageCode = 'CRM_REPEAT_SALE_SEGMENT_SAVE_ERROR';

						UI.Notification.Center.notify({
							content: Loc.getMessage(messageCode),
							autoHideDelay: 6000,
						});
					},
				)
				.catch((response) => {
					UI.Notification.Center.notify({
						content: Text.encode(response.errors[0].message),
						autoHideDelay: 6000,
					});

					throw response;
				})
			;
		},
		validate(data: Object): boolean
		{
			if (!Type.isArrayFilled(data.assignmentUserIds))
			{
				UI.Notification.Center.notify({
					content: Text.encode(Loc.getMessage('CRM_REPEAT_SALE_SEGMENT_VALIDATE_ASSIGNMENT_USERS_ERROR')),
					autoHideDelay: 6000,
				});

				return false;
			}

			return true;
		},
		closeSlider(): void
		{
			top.BX.SidePanel.Instance.getSliderByWindow(window).close();
		},
		getPlainText(): number
		{
			return this.parser.parse(this.textEditor.getText()).toPlainText().trim();
		},
		toggleExpertSettings(): void
		{
			this.isVisibleExpertSettings = !this.isVisibleExpertSettings;

			if (this.isVisibleExpertSettings)
			{
				void this.$nextTick(() => {
					this.$refs.expertSettings.scrollIntoView(false);
				});
			}
		},
		showHelpArticle(): void
		{
			window.top.BX?.Helper?.show(`redirect=detail&code=${ARTICLE_CODE}`);
		},

		onSelectCategory(category: Object): void
		{
			if (this.currentCategoryId === category.id)
			{
				return;
			}

			this.$refs.stageSelector.destroy();
			this.currentCategoryId = category.id;

			void this.$nextTick(() => {
				const currentCategory = this.getCategoryById(this.currentCategoryId);
				this.currentStageId = this.getFirstAvailableCategoryStageId(currentCategory);
			});
		},
		onSelectStage(stage: Object): void
		{
			this.currentStageId = stage.id;
		},
		getCategoryById(id: number): Object
		{
			return this.categories.find((category) => category.id === id);
		},
		getFirstAvailableCategoryStageId(category: Object): string
		{
			return category.items[0].id;
		},
		onSelectAssignmentUser(user: Object): void
		{
			this.assignmentUserIds.add(user.id);
		},
		onDeselectAssignmentUser(user: Object): void
		{
			this.assignmentUserIds.delete(user.id);
		},
		setCurrentCallAssessmentId(id: number): void
		{
			this.currentCallAssessmentId = id;
		},
		getMessageByCode(code: string): string
		{
			return this.$Bitrix.Loc.getMessage(code);
		},
		setCurrentIsAiEnabled(value: boolean): void
		{
			this.currentIsAiEnabled = value;
		},
	},

	computed: {
		readOnly(): boolean
		{
			return this.settings.isReadOnly;
		},
		aiCallEnabled(): boolean
		{
			return this.settings.isAiCallEnabled;
		},
		chevronClassList(): Array
		{
			return [
				'crm-repeat-sale__segment-expert-settings-btn-chevron',
				{ '--active': this.isVisibleExpertSettings },
			];
		},
		repeatSaleSegmentSection(): Array
		{
			return [
				'crm-repeat-sale__segment-section',
				{ '--active': this.isVisibleExpertSettings },
			];
		},
		title(): string
		{
			return this.$Bitrix.Loc.getMessage(
				'CRM_REPEAT_SALE_SEGMENT_TITLE',
				{
					'#TITLE#': this.segment.title,
				},
			);
		},
		currentCategory(): ?Object
		{
			return this.categories.find((category) => category.id === this.currentCategoryId) ?? null;
		},
		messages(): Object
		{
			return {
				manualTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_TITLE'),
				manualDescription: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_DESCRIPTION'),
				textAreaTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_TEXTAREA_TITLE'),
				dealHelp: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_DEAL_HELP'),
				sectionTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_SECTION_TITLE'),
				stageTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_MANUAL_STAGE_TITLE'),
				dealAssignedTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_DEAL_ASSIGNED_TITLE'),
				expert: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_EXPERT'),
				dealTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_DEAL_TITLE'),
				dealDescription: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_DEAL_DESCRIPTION'),
				dealTitlePattern: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_DEAL_NAME_PATTERN_TITLE'),
				copilot: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_COPILOT_TITLE'),
				assessmentTitle: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_CALL_ASSESSMENT_TITLE'),
				assessmentDescription: this.getMessageByCode('CRM_REPEAT_SALE_SEGMENT_CALL_ASSESSMENT_DESCRIPTION'),
			};
		},
	},

	// language=Vue
	template: `
		<div class="crm-repeat-sale__segment_container">
			<div class="crm-repeat-sale__segment-wrapper">
				<header class="crm-repeat-sale__segment-section-header">
					<div class="crm-repeat-sale__segment-section-header-title">
						<span>
							{{title}}
							<span 
								v-if="segment.description"
								v-hint="segment.description"
								class="crm-repeat-sale__segment-section-header-help"
							>
							</span>
						</span>
					</div>
				</header>
				<div class="crm-repeat-sale__segment-section-body">
					<section class="crm-repeat-sale__segment-section --active">
						<h1 class="crm-repeat-sale__segment-section-title">
							{{messages.manualTitle}}
						</h1>
						<div class="crm-repeat-sale__segment-section-description">
							{{messages.manualDescription}}
						</div>
				
						<div class="crm-repeat-sale__segment-fields-row">
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.textAreaTitle}}
								</div>
								<TextEditorWrapperComponent
									:textEditor="textEditor"
								/>
								<AdditionalInfoComponent 
									:title="messages.dealHelp"
								/>
							</div>
						</div>
				
						<div class="crm-repeat-sale__segment-fields-row">
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.sectionTitle}}
								</div>
								<CategorySelector 
									:current-category-id="currentCategoryId"
									:categories="categories"
									@onSelectItem="onSelectCategory"
								/>
							</div>
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.stageTitle}}
								</div>
								<StageSelector 
									ref="stageSelector"
									:current-stage-id="currentStageId"
									:category="currentCategory"
									@onSelectItem="onSelectStage"
								/>
							</div>
						</div>
				
						<div class="crm-repeat-sale__segment-fields-row">
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.dealAssignedTitle}}
								</div>
								<UserSelector
									:user-ids="[...assignmentUserIds.values()]"
									:read-only="readOnly"
									@onSelectItem="onSelectAssignmentUser"
									@onDeselectItem="onDeselectAssignmentUser"
								/>
							</div>
						</div>
					</section>
			
					<div class="crm-repeat-sale__segment-expert-settings-btn-wrapper">
						<span 
							class="crm-repeat-sale__segment-expert-settings-btn"
							@click="toggleExpertSettings"
						>
							{{messages.expert}}
						</span>
						<span 
							:class="chevronClassList"
							@click="toggleExpertSettings"
						>
						</span>
					</div>
			
					<section :class="repeatSaleSegmentSection" ref="expertSettings">
						<h1 class="crm-repeat-sale__segment-section-title --level2">
							{{messages.dealTitle}}
						</h1>
						<div class="crm-repeat-sale__segment-section-description">
							{{messages.dealDescription}}
						</div>
				
						<div class="crm-repeat-sale__segment-fields-row">
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.dealTitlePattern}}
								</div>
								<input 
									class="ui-ctl-element"
									type="text"
									v-model="currentEntityTitlePattern"
									:readonly="readOnly"
								>
							</div>
						</div>
						<div class="crm-repeat-sale__segment-fields-row">
							<div class="crm-repeat-sale__segment-field">
								<div class="crm-repeat-sale__segment-field-title">
									{{messages.copilot}}
								</div>
								<AiSwitcherComponent
									:checked="currentIsAiEnabled"
									:read-only="readOnly"
									@change="setCurrentIsAiEnabled"
								/>
							</div>
						</div>
					</section>
			
					<section 
						:class="repeatSaleSegmentSection"
						v-if="aiCallEnabled && false"
					>
						<h1 class="crm-repeat-sale__segment-section-title --level2">
							{{messages.assessmentTitle}}
						</h1>
						<div class="crm-repeat-sale__segment-section-description">
							{{messages.assessmentDescription}}
						</div>
				
						<div class="crm-repeat-sale__segment-field">
							<CallAssessmentSelector 
								:call-assessments="callAssessments"
								:current-call-assessment-id="currentCallAssessmentId"
								:read-only="readOnly"
								@onSelectItem="setCurrentCallAssessmentId"
							/>
							{{currentCallAssessmentId}}
						</div>
					</section>
				</div>
			</div>
			<div class="crm-repeat-sale__segment_navigation-container">
				<div class="crm-repeat-sale__segment_navigation-buttons-wrapper">
					<Button v-if="!readOnly" id="update" />
					<Button v-if="!readOnly" id="cancel" />
					<Button v-if="readOnly" id="close" />
				</div>
			</div>
		</div>
	`,
};

/**
 * @module tasks/layout/template/view/src/template-form
 */
jn.define('tasks/layout/template/view/src/template-form', (require, exports, module) => {
	const { Color, Component, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Loc: TasksLoc } = require('tasks/loc');
	const { Form, CompactMode } = require('layout/ui/form');
	const { makeProjectFieldConfig, makeAccomplicesFieldConfig, makeAuditorsFieldConfig, makeTagsFieldConfig, makeCrmFieldConfig } = require('tasks/layout/task/form-utils');
	const { TagType, mapTagsToSelectorItems } = require('tasks/layout/task/tag-utils');
	const { TaskField: Field } = require('tasks/enum');
	const { selectById } = require('tasks/statemanager/redux/slices/templates');
	const { selectGroupById } = require('tasks/statemanager/redux/slices/groups');
	const { usersSelector } = require('statemanager/redux/slices/users');
	const { showSafeToast } = require('toast');
	const { createTestIdGenerator } = require('utils/test');
	const { Icon } = require('assets/icons');
	const { formatTemplateDeadlineAfter } = require('tasks/layout/template/deadline-after-formatter');

	const { TextAreaField: Title } = require('layout/ui/fields/textarea/theme/air-title');
	const { TextAreaField: Description } = require('layout/ui/fields/textarea/theme/air-description');
	const { DeadlineField } = require('tasks/layout/fields/deadline/theme/air');
	const { UserField } = require('layout/ui/fields/user/theme/air');
	const { UserField: UserFieldCompact } = require('layout/ui/fields/user/theme/air-compact');
	const { ProjectField } = require('layout/ui/fields/project/theme/air');
	const { ProjectField: ProjectFieldCompact } = require('layout/ui/fields/project/theme/air-compact');
	const { TagField } = require('layout/ui/fields/tag/theme/air');
	const { TagField: TagFieldCompact } = require('layout/ui/fields/tag/theme/air-compact');
	const { CrmElementField } = require('layout/ui/fields/crm-element/theme/air');
	const { CrmElementField: CrmElementFieldCompact } = require('layout/ui/fields/crm-element/theme/air-compact');
	const { FileWithBackgroundAttachField } = require('layout/ui/fields/file-with-background-attach/theme/air');
	const { FileWithBackgroundAttachField: FileWithBackgroundAttachFieldCompact } = require('layout/ui/fields/file-with-background-attach/theme/air-compact');
	const { ChecklistField } = require('tasks/layout/checklist/preview');
	const { ChecklistField: ChecklistFieldCompact } = require('tasks/layout/fields/checklist/theme/air-compact');
	const { UserFieldsField } = require('tasks/layout/fields/user-fields/theme/air');
	const { UserFieldsField: UserFieldsFieldCompact } = require('tasks/layout/fields/user-fields/theme/air-compact');
	const { TemplateDescriptionSkeletonField } = require('tasks/layout/template/view/src/template-description-skeleton-field');

	const showReadOnlyTemplateToast = (parentWidget) => {
		showSafeToast({
			message: Loc.getMessage('TASKSMOBILE_TEMPLATE_VIEW_READ_ONLY_TOAST'),
			iconName: Icon.LOCK.getIconName(),
		}, parentWidget);
	};

	const getReadOnlyFieldClickHandler = (parentWidget) => () => showReadOnlyTemplateToast(parentWidget);
	const hasChecklistItems = (checklist) => (
		(checklist?.completed ?? 0) > 0 || (checklist?.uncompleted ?? 0) > 0
	);

	const TemplateDescriptionEmptyField = (props) => {
		const {
			testId,
			onContentClick,
		} = props;
		const getTestId = createTestIdGenerator({
			prefix: testId,
		});

		return View(
			{
				testId: getTestId('field'),
				onClick: onContentClick,
				onLongClick: onContentClick,
				style: {
					marginTop: Indent.XL3.toNumber(),
				},
			},
			Text({
				testId: getTestId('content'),
				text: Loc.getMessage('TASKSMOBILE_TEMPLATE_VIEW_DESCRIPTION_PLACEHOLDER'),
				style: {
					color: Color.base5.toHex(),
				},
			}),
		);
	};

	class TemplateForm
	{
		constructor(props)
		{
			this.props = props;
			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});
			this.onReadOnlyFieldClick = getReadOnlyFieldClickHandler(props.parentWidget);
		}

		get template()
		{
			return this.props.template;
		}

		get project()
		{
			return this.props.project;
		}

		get creator()
		{
			return this.props.creator;
		}

		get responsible()
		{
			return this.props.responsible;
		}

		get auditors()
		{
			return this.props.auditors;
		}

		get accomplices()
		{
			return this.props.accomplices;
		}

		get checklistController()
		{
			return this.props.checklistController;
		}

		get parentWidget()
		{
			return this.props.parentWidget;
		}

		get testId()
		{
			return this.props.testId;
		}

		render()
		{
			if (!this.template)
			{
				return View({});
			}

			return new Form({
				testId: this.getTestId(),
				parentWidget: this.parentWidget,
				useState: false,
				style: FormStyle,
				compactMode: CompactMode.FILL_COMPACT_AND_KEEP,
				compactOrder: [
					'...',
					Field.TAGS,
					Field.CRM,
				],
				primaryFields: this.getPrimaryFields(),
				secondaryFields: this.getSecondaryFields(),
			});
		}

		getPrimaryFields()
		{
			return [
				{
					factory: Title,
					props: {
						id: Field.TITLE,
						value: this.template.name,
						placeholder: TasksLoc.getMessage('M_TASK_DETAILS_FIELD_TITLE_PLACEHOLDER'),
						readOnly: true,
						required: true,
					},
				},
				this.getDescriptionField(),
				this.getCreatorField(),
				this.getResponsibleField(),
				this.getDeadlineField(),
			].filter(Boolean);
		}

		getSecondaryFields()
		{
			return [
				this.getFilesField(),
				this.getProjectField(),
				this.getAccomplicesField(),
				this.getAuditorsField(),
				this.getChecklistField(),
				this.getTagsField(),
				this.getUserFieldsField(),
				this.getCrmField(),
			].filter(Boolean);
		}

		getDescriptionField()
		{
			if (this.template.showDescriptionSkeleton)
			{
				return {
					factory: TemplateDescriptionSkeletonField,
					props: {
						id: Field.DESCRIPTION,
						testId: this.getTestId('description'),
					},
				};
			}

			if (!this.template.description)
			{
				return {
					factory: TemplateDescriptionEmptyField,
					props: {
						id: Field.DESCRIPTION,
						onContentClick: this.onReadOnlyFieldClick,
						testId: this.getTestId('description'),
					},
				};
			}

			return {
				factory: Description,
				props: {
					id: Field.DESCRIPTION,
					value: this.template.description,
					readOnly: true,
					required: false,
					title: TasksLoc.getMessage('M_TASK_DETAILS_FIELD_DESCRIPTION_TITLE'),
					placeholder: TasksLoc.getMessage('M_TASK_DETAILS_FIELD_DESCRIPTION_PLACEHOLDER'),
					onContentClick: this.onReadOnlyFieldClick,
					useBBCodeEditor: true,
					config: {
						fileField: {
							value: this.template.files,
						},
						allowFiles: false,
						autoFocus: false,
					},
					testId: this.getTestId('description'),
				},
			};
		}

		getCreatorField()
		{
			if (!this.creator)
			{
				return null;
			}

			return {
				factory: UserField,
				props: {
					id: Field.CREATOR,
					value: this.template.creatorId,
					readOnly: true,
					required: false,
					title: TasksLoc.getMessage('M_TASK_DETAILS_FIELD_CREATOR_TITLE'),
					showTitle: false,
					useState: false,
					onContentClick: this.onReadOnlyFieldClick,
					config: {
						items: [this.creator].filter(Boolean),
						canUnselectLast: false,
						useLettersForEmptyAvatar: true,
						styles: {
							airContainer: {
								marginTop: Indent.XL3.toNumber(),
							},
						},
					},
				},
			};
		}

		getResponsibleField()
		{
			if (!this.responsible)
			{
				return null;
			}

			return {
				factory: UserField,
				props: {
					id: Field.RESPONSIBLE,
					value: this.template.responsibleId,
					readOnly: true,
					required: false,
					title: TasksLoc.getMessage('M_TASK_DETAILS_FIELD_RESPONSIBLE_TITLE'),
					showTitle: false,
					useState: false,
					onContentClick: this.onReadOnlyFieldClick,
					config: {
						items: [this.responsible].filter(Boolean),
						canUnselectLast: false,
						useLettersForEmptyAvatar: true,
					},
				},
			};
		}

		getDeadlineField()
		{
			return {
				factory: DeadlineField,
				props: {
					id: Field.DEADLINE,
					value: this.template.deadlineAfter,
					readOnly: true,
					required: false,
					onContentClick: this.onReadOnlyFieldClick,
					config: {
						dateFormatter: formatTemplateDeadlineAfter,
					},
				},
			};
		}

		getFilesField()
		{
			return {
				factory: FileWithBackgroundAttachField,
				props: {
					id: Field.FILES,
					value: this.template.files,
					readOnly: true,
					required: false,
					title: TasksLoc.getMessage('M_TASKS_FIELDS_FILES'),
					showTitle: true,
					multiple: true,
					config: {
						textMultiple: TasksLoc.getMessage('M_TASKS_FIELDS_FILES_MULTI'),
					},
					showFilesName: true,
				},
				compact: {
					factory: FileWithBackgroundAttachFieldCompact,
					extraProps: {
						config: {
							listenCacheChanges: true,
						},
					},
				},
			};
		}

		getProjectField()
		{
			if (!this.project)
			{
				return null;
			}

			return {
				factory: ProjectField,
				props: {
					id: Field.PROJECT,
					value: this.template.groupId,
					title: this.project?.isCollab
						? TasksLoc.getMessage('M_TASK_FORM_FIELD_PROJECT_COLLAB_TITLE')
						: TasksLoc.getMessage('M_TASK_FORM_FIELD_PROJECT_TITLE'),
					showTitle: true,
					readOnly: true,
					useState: false,
					onContentClick: this.onReadOnlyFieldClick,
					config: makeProjectFieldConfig({
						items: [this.project],
						canUnselectLast: false,
					}),
				},
				compact: ProjectFieldCompact,
			};
		}

		getAccomplicesField()
		{
			if (this.accomplices.length === 0)
			{
				return null;
			}

			return {
				factory: UserField,
				props: {
					id: Field.ACCOMPLICES,
					value: this.template.accomplices,
					readOnly: true,
					required: false,
					multiple: true,
					title: TasksLoc.getMessage('M_TASK_FORM_FIELD_ACCOMPLICES_TITLE'),
					showTitle: true,
					useState: false,
					onContentClick: this.onReadOnlyFieldClick,
					config: makeAccomplicesFieldConfig({
						items: this.accomplices,
						groupId: this.template.groupId,
						readOnly: true,
					}),
				},
				compact: UserFieldCompact,
			};
		}

		getAuditorsField()
		{
			if (this.auditors.length === 0)
			{
				return null;
			}

			return {
				factory: UserField,
				props: {
					id: Field.AUDITORS,
					value: this.template.auditors,
					readOnly: true,
					required: false,
					multiple: true,
					title: TasksLoc.getMessage('M_TASK_FORM_FIELD_AUDITORS_TITLE'),
					showTitle: true,
					useState: false,
					onContentClick: this.onReadOnlyFieldClick,
					config: makeAuditorsFieldConfig({
						items: this.auditors,
						readOnly: true,
					}),
				},
				compact: UserFieldCompact,
			};
		}

		getChecklistField()
		{
			if (!hasChecklistItems(this.template.checklist))
			{
				return null;
			}

			return {
				factory: ChecklistField,
				props: {
					id: Field.CHECKLIST,
					value: this.template.checklist,
					loading: this.template.showChecklistSkeleton,
					readOnly: true,
					onContentClick: this.onReadOnlyFieldClick,
					multiple: true,
					config: {
						parentWidget: this.parentWidget,
						checklistController: this.checklistController,
						initialState: this.template.checklistDetails,
						taskId: this.template.id,
					},
				},
				compact: ChecklistFieldCompact,
			};
		}

		getTagsField()
		{
			if (this.template.tags.length === 0)
			{
				return null;
			}

			return {
				factory: TagField,
				props: {
					id: Field.TAGS,
					title: TasksLoc.getMessage('M_TASKS_FIELDS_TAGS'),
					value: this.template.tags.map((item) => item.id),
					showTitle: true,
					readOnly: true,
					multiple: true,
					useState: false,
					onContentClick: this.onReadOnlyFieldClick,
					config: makeTagsFieldConfig({
						castType: 'string',
						items: mapTagsToSelectorItems(this.template.tags, TagType.TEMPLATE),
					}),
				},
				compact: TagFieldCompact,
			};
		}

		getUserFieldsField()
		{
			if (this.template.userFields.length === 0)
			{
				return null;
			}

			return {
				factory: UserFieldsField,
				props: {
					id: Field.USER_FIELDS,
					taskId: this.template.id,
					areUserFieldsLoaded: true,
					userFields: this.template.userFields,
					readOnly: true,
					required: false,
					onContentClick: this.onReadOnlyFieldClick,
					config: {
						parentWidget: this.parentWidget,
					},
				},
				compact: UserFieldsFieldCompact,
			};
		}

		getCrmField()
		{
			if (this.template.crm.length === 0)
			{
				return null;
			}

			return {
				factory: CrmElementField,
				props: {
					id: Field.CRM,
					title: TasksLoc.getMessage('M_TASKS_FIELDS_CRM'),
					value: this.template.crm.map((item) => item.id),
					showTitle: true,
					readOnly: true,
					multiple: true,
					useState: false,
					showHiddenEntities: false,
					onContentClick: this.onReadOnlyFieldClick,
					config: makeCrmFieldConfig({
						items: this.template.crm,
					}),
				},
				compact: CrmElementFieldCompact,
			};
		}
	}

	const FormStyle = {
		primaryContainer: {
			backgroundColor: Color.bgContentPrimary.toHex(),
			paddingTop: 10,
		},
		primaryField: () => ({
			paddingHorizontal: Component.areaPaddingLr.toNumber(),
		}),
		secondaryContainer: {
			marginTop: Indent.XL2.toNumber(),
			paddingHorizontal: Component.areaPaddingLr.toNumber(),
		},
		secondaryField: () => ({
			marginBottom: Indent.M.getValue(),
		}),
		compactContainer: {
			backgroundColor: Color.bgContentPrimary.toHex(),
		},
		compactInnerContainer: {
			paddingHorizontal: Component.areaPaddingLr.toNumber(),
		},
	};

	const selectMappedGroupById = (state, id) => {
		const group = selectGroupById(state, id);

		return group ? {
			id: group.id,
			title: group.name,
			imageUrl: group.image,
			isCollab: group.isCollab,
			dialogId: group.additionalData?.DIALOG_ID,
		} : undefined;
	};

	const selectMappedUserById = (state, id) => {
		const user = usersSelector.selectById(state, id);

		if (!user)
		{
			return null;
		}

		return {
			id: user.id,
			imageUrl: user.avatarSize100,
			title: user.fullName,
			customData: {
				position: user.workPosition,
			},
		};
	};

	const mapTemplateFormProps = (state, ownProps) => {
		const template = selectById(state, ownProps.id);
		if (!template)
		{
			return {
				template: null,
				project: null,
				creator: null,
				responsible: null,
				auditors: [],
				accomplices: [],
				parentWidget: ownProps.parentWidget,
			};
		}

		const checklistDetails = ownProps.checklistController?.getReduxData?.().checklistDetails ?? [];

		return {
			template: {
				id: template.id,
				name: template.name,
				description: template.description,
				showDescriptionSkeleton: !template.detailLoaded,
				showChecklistSkeleton: hasChecklistItems(template.checklist) && !template.detailLoaded,
				creatorId: template.creatorId,
				responsibleId: template.responsibleId,
				deadlineAfter: Number(template.deadlineAfter || 0),
				groupId: template.groupId,
				accomplices: template.accomplices || [],
				auditors: template.auditors || [],
				checklist: template.checklist || null,
				checklistDetails,
				files: template.files || [],
				tags: template.tags || [],
				userFields: template.userFields || [],
				crm: template.crm || [],
			},
			project: selectMappedGroupById(state, template.groupId),
			creator: selectMappedUserById(state, template.creatorId),
			responsible: selectMappedUserById(state, template.responsibleId),
			auditors: (template.auditors || []).map((id) => selectMappedUserById(state, id)).filter(Boolean),
			accomplices: (template.accomplices || []).map((id) => selectMappedUserById(state, id)).filter(Boolean),
			checklistController: ownProps.checklistController,
			parentWidget: ownProps.parentWidget,
			testId: ownProps.testId,
		};
	};

	module.exports = {
		TemplateForm,
		mapTemplateFormProps,
	};
});

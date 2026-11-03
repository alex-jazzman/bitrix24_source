<?php

use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Integration\AiAssistant\ActivityAiPropertyConverter;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\Setting;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingOption;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingOptionCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Hand-written schema: the activity predates the machine-readable properties map and draws its dialog in
 * `properties_dialog.php`, so the auto-describer has nothing to read and the agent used to receive an empty
 * settings list for a block whose whole point is asking a person to approve something.
 *
 * Covers every setting the dialog writes ({@see CBPApproveActivity::GetPropertiesDialogValues}); the
 * activity's own runtime bookkeeping properties (vote counters, last approver, task id) are results, not
 * settings, and stay out.
 *
 * Completeness here is not a matter of taste. This file becomes the closed list of setting names the contour
 * accepts back for the block, and the closed list of values for every setting given `options` - a name absent
 * from it is refused as unknown, and a value outside a declared option list is refused as invalid. Since the
 * agent has to resend the whole graph to change any part of it, a setting the editor writes but this file
 * omits makes every template holding such a block uneditable. Measured: a schema without `m`/`h` for
 * TimeoutDurationType refused a template whose approval simply waited an hour.
 */
class CBPAiApproveActivity extends CBPApproveActivity implements IBPActivityAiDescription
{
	public function __construct($name = 'approveactivity')
	{
		parent::__construct($name);
	}

	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		$settings = new SettingCollection();

		$settings->add(new Setting(
			name: 'Users',
			description: 'Who is asked to approve. The approval task goes to every one of them.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::USER),
			required: true,
			multiple: true,
		));

		$settings->add(new Setting(
			name: 'Name',
			description: 'The title of the approval task as the approver sees it in their task list.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::STRING),
			required: true,
		));

		$settings->add(new Setting(
			name: 'ApproveType',
			description: 'What counts as approved.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::SELECT),
			required: true,
			options: (new SettingOptionCollection())
				->add(new SettingOption(id: 'all', name: 'Everyone listed has to approve'))
				->add(new SettingOption(id: 'any', name: 'One approval is enough'))
				->add(new SettingOption(
					id: 'vote',
					name: 'A vote: the share set in ApproveMinPercent has to approve',
				))
			,
			defaultValue: 'all',
		));

		$settings->add(new Setting(
			name: 'ApproveMinPercent',
			description:
				'The share of approvals, in percent, that makes the result approved. Used only when'
				. ' ApproveType is "vote".',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::INT),
			defaultValue: '50',
		));

		$settings->add(new Setting(
			name: 'ApproveWaitForAll',
			description:
				'"Y" waits for everyone to answer before deciding, "N" decides as soon as the outcome is'
				. ' settled. Used only when ApproveType is "vote".',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::SELECT),
			options: (new SettingOptionCollection())
				->add(new SettingOption(id: 'Y', name: 'Wait for every answer'))
				->add(new SettingOption(id: 'N', name: 'Decide as soon as the outcome is settled'))
			,
			defaultValue: 'N',
		));

		$settings->add(new Setting(
			name: 'Description',
			description: 'The text of the approval task - what exactly the person is asked to approve.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::TEXT),
		));

		$settings->add(new Setting(
			name: 'OverdueDate',
			description:
				'The deadline shown on the approval task. It does not end the waiting by itself - use'
				. ' TimeoutDuration for that.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::DATETIME),
		));

		$settings->add(new Setting(
			name: 'TimeoutDuration',
			description:
				'How long to wait for the answer before giving up, measured in the units of'
				. ' TimeoutDurationType. 0 means wait indefinitely.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::INT),
			defaultValue: '0',
		));

		$settings->add(new Setting(
			name: 'TimeoutDurationType',
			description: 'The unit TimeoutDuration is counted in.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::SELECT),
			options: (new SettingOptionCollection())
				->add(new SettingOption(id: 's', name: 'seconds'))
				->add(new SettingOption(id: 'm', name: 'minutes'))
				->add(new SettingOption(id: 'h', name: 'hours'))
				->add(new SettingOption(id: 'd', name: 'days'))
			,
			defaultValue: 's',
		));

		$settings->add(new Setting(
			name: 'TaskButton1Message',
			description: 'The label of the approve button on the task. Empty means the standard label.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::STRING),
		));

		$settings->add(new Setting(
			name: 'TaskButton2Message',
			description: 'The label of the reject button on the task. Empty means the standard label.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::STRING),
		));

		$settings->add(new Setting(
			name: 'ShowComment',
			description: 'Whether the approver is offered a comment field.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::SELECT),
			options: (new SettingOptionCollection())
				->add(new SettingOption(id: 'Y', name: 'Offer a comment field'))
				->add(new SettingOption(id: 'N', name: 'No comment field'))
			,
			defaultValue: 'Y',
		));

		$settings->add(new Setting(
			name: 'CommentRequired',
			description: 'When the comment is mandatory. Only matters when ShowComment is "Y".',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::SELECT),
			options: (new SettingOptionCollection())
				->add(new SettingOption(id: 'N', name: 'Never'))
				->add(new SettingOption(id: 'Y', name: 'Always'))
				->add(new SettingOption(id: 'YA', name: 'Only when approving'))
				->add(new SettingOption(id: 'YR', name: 'Only when rejecting'))
			,
			defaultValue: 'N',
		));

		$settings->add(new Setting(
			name: 'CommentLabelMessage',
			description: 'The label of the comment field. Empty means the standard label.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::STRING),
		));

		$settings->add(new Setting(
			name: 'SetStatusMessage',
			description:
				'"Y" shows StatusMessage as the state of the process while it waits for the approval,'
				. ' "N" keeps the standard text.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::SELECT),
			options: (new SettingOptionCollection())
				->add(new SettingOption(id: 'Y', name: 'Show StatusMessage'))
				->add(new SettingOption(id: 'N', name: 'Keep the standard text'))
			,
			defaultValue: 'Y',
		));

		$settings->add(new Setting(
			name: 'StatusMessage',
			description: 'The state of the process shown while it waits. Used only when SetStatusMessage is "Y".',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::TEXT),
		));

		$settings->add(new Setting(
			name: 'AccessControl',
			description:
				'"Y" lets the approvers see and change the document while they decide, "N" leaves their'
				. ' access as it is.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::SELECT),
			options: (new SettingOptionCollection())
				->add(new SettingOption(id: 'Y', name: 'Grant access to the document'))
				->add(new SettingOption(id: 'N', name: 'Leave access as it is'))
			,
			defaultValue: 'N',
		));

		$settings->add(new Setting(
			name: 'DelegationType',
			description:
				'Whom an approver may hand the task over to: 0 - their subordinates, 1 - anyone in the company,'
				. ' 2 - nobody. Left as a number rather than a list of choices on purpose: the enum carries a'
				. ' fourth value the dialog does not offer, and a template already holding it has to survive'
				. ' being sent back. A value you did not set yourself, pass through unchanged.',
			type: ActivityAiPropertyConverter::settingTypeOf(FieldType::INT),
			defaultValue: '0',
		));

		// `Parameters` is deliberately not described here: it is a passthrough name, declared by
		// CBPApproveActivity::getAiPassthroughSettingNames().

		return $settings;
	}
}

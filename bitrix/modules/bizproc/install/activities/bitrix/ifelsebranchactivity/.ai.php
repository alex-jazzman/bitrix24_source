<?php

use Bitrix\Bizproc\Integration\AiAssistant\ConditionOperatorDictionary;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\Setting;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingType;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Hand-written schema: the branch draws its dialog in `properties_dialog.php` and stores the condition under a
 * property key equal to the condition activity code, so there is no properties map for the auto-describer to
 * read and the agent used to receive an empty settings list for the one block that decides where the process
 * goes.
 *
 * The dialog writes exactly one condition key and deletes the others
 * ({@see CBPIfElseBranchActivity::GetPropertiesDialogValues}), so only `fieldcondition` is offered for
 * authoring - it is the kind an agent can compose from document fields.
 *
 * The other kinds are described all the same, because a described schema is the closed list of setting names
 * the contour accepts back: a branch a person configured with `mixedcondition` would otherwise be refused as
 * an unknown setting, and since the agent has to resend the whole graph to change any part of it, one such
 * branch would make the whole template uneditable. Measured before this was fixed: `mixedcondition`,
 * `truecondition` and `propertyvariablecondition` all came back `name is incorrect`.
 *
 * `codecondition` stays out deliberately: an executable condition is carried through by the restricted
 * passthrough mechanism and must never be authored by an agent.
 *
 * A branch with no condition at all is legitimate - it is the "otherwise" branch, and it evaluates to true
 * ({@see CBPIfElseBranchActivity::execute}). Hence the setting is not required.
 */
class CBPAiIfElseBranchActivity extends CBPIfElseBranchActivity implements IBPActivityAiDescription
{
	/**
	 * Condition kinds the block can hold but an agent does not compose, by property key.
	 */
	private const CARRIED_CONDITION_KINDS = [
		'mixedcondition' => 'A condition mixing document fields with other sources, composed in the editor.',
		'propertyvariablecondition' => 'A condition on the parameters and variables of the process.',
		'truecondition' => 'A branch that is always taken.',
	];

	public function __construct($name = 'ifelsebranchactivity')
	{
		parent::__construct($name);
	}

	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		$settings = new SettingCollection();

		$settings->add(new Setting(
			name: 'fieldcondition',
			description:
				'The condition on document fields that decides whether the process takes this branch. Leave the'
				. ' setting out to make the branch the "otherwise" one - a branch without a condition is always'
				. ' taken, so put it last.',
			type: new SettingType(
				name: 'fieldcondition',
				description:
					'The value is a list of conditions, each a four-element array'
					. ' [field, operator, value, joiner].'
					. ' "field" is the code of a document field as document.field.list reports it, never its label.'
					. ' "value" is what the field is compared against; it may be a literal or an expression like'
					. ' "{=Document:FIELD}", and it is not used by the "empty" and "!empty" operators.'
					. ' "joiner" is a NUMBER and glues the condition to the PREVIOUS one. It is read as AND when it'
					. ' is 0, an empty string, null, false, or when the fourth element is left out altogether;'
					. ' every other non-empty value is read as OR. The joiner of the FIRST condition has to be 0:'
					. ' any other value there makes the whole group true no matter what the conditions say, so the'
					. ' branch is taken always and every branch after it becomes unreachable - and nothing refuses'
					. ' it, neither saving nor running the process.'
					. ' The string joiners of the "conditiongroup" setting do not carry over here: written in this'
					. ' setting, "AND" is a non-empty value and is therefore read as OR.'
					. ' ' . ConditionOperatorDictionary::contractText('the branch')
					. ' Example: [["OPPORTUNITY", ">", "100000", 0]] takes the branch when the deal amount is'
					. ' above 100000.',
			),
			multiple: true,
		));

		foreach (self::CARRIED_CONDITION_KINDS as $name => $what)
		{
			$settings->add(new Setting(
				name: $name,
				description:
					$what . ' Not for authoring: compose a condition in "fieldcondition" instead. Present here so'
					. ' that a branch configured this way in the editor survives being sent back - carry the value'
					. ' through exactly as it arrived.',
				type: new SettingType(
					name: $name,
					description: 'The value comes from the editor. Send it back unchanged, whatever its shape.',
				),
				multiple: true,
			));
		}

		return $settings;
	}
}

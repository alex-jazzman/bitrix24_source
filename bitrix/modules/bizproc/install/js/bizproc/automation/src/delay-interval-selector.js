import { Dom, Event, Loc, Tag, Text } from 'main.core';
import { DelayIntervalSelector as BaseDelayIntervalSelector } from 'bizproc.condition';
import { tryGetGlobalContext } from './automation';

export class DelayIntervalSelector extends BaseDelayIntervalSelector
{
	showWaitWorkDay;

	constructor(options)
	{
		super(options);

		this.showWaitWorkDay = options?.showWaitWorkDay;
	}

	renderAdditionalSettings(uid: string): Array<HTMLElement>
	{
		const nodes = [
			this.#createSubtitle(),
			this.#createWorkTimeNode(uid),
		];

		if (this.showWaitWorkDay)
		{
			nodes.push(this.#createWaitWorkDayNode());
		}

		return nodes;
	}

	saveAdditionalSettings(formData: FormData)
	{
		this.delay.setWorkTime(formData.get('worktime'));
		this.delay.setWaitWorkDay(formData.get('wait_workday'));
	}

	#createSubtitle(): HTMLElement
	{
		return Tag.render`
			<div class="bizproc-automation-popup-settings__subtitle ui-typography-heading-h6">
				${Loc.getMessage('BIZPROC_JS_AUTOMATION_DELAY_INTERVAL_ADDITIONAL_SETTINGS')}
			</div>
		`;
	}

	#createWorkTimeNode(uid: string): HTMLElement
	{
		const { root, workTimeCheckBox } = Tag.render`
			<div class="bizproc-automation-popup-settings__checkbox-label">
				<input
					ref="workTimeCheckBox"
					class="bizproc-automation-popup-settings__checkbox"
					type="checkbox"
					id="${uid}worktime"
					name="worktime"
					value="1"
					style="vertical-align: middle"
				/>
				<label for="${uid}worktime" class="bizproc-automation-popup-settings-lbl">
					${Loc.getMessage('BIZPROC_AUTOMATION_DELAY_WORK_TIME_MSGVER_1')}
				</label>
				<span
					class="bizproc-automation-status-help bizproc-automation-status-help-right"
					data-hint="${Loc.getMessage('BIZPROC_AUTOMATION_DELAY_WORK_TIME_HELP')}"
				></span>
			</div>
		`;
		if (this.delay.workTime)
		{
			Dom.attr(workTimeCheckBox, 'checked', 'checked');
		}

		return root;
	}

	#createWaitWorkDayNode(): HTMLElement
	{
		const delay = this.delay;
		const uid = Text.getRandom();
		const isAvailable = this.#isWorkTimeAvailable();

		const { root, workDayCheckbox } = Tag.render`
			<div class="bizproc-automation-popup-select-item">
				<div class="bizproc-automation-popup-settings__checkbox-label">
					<input
						ref="workDayCheckbox"
						class="bizproc-automation-popup-settings__checkbox"
						type="checkbox"
						id="${`${uid}wait_workday`}"
						name="wait_workday"
						value="1"
						style="vertical-align: middle"
					/>
					<label
						class="bizproc-automation-popup-settings-lbl ${isAvailable ? '' : 'bizproc-automation-robot-btn-set-locked'}"
						for="${`${uid}wait_workday`}"
					>${Loc.getMessage('BIZPROC_AUTOMATION_DELAY_WAIT_WORK_DAY_MSGVER_1')}</label>
					<span
						class="bizproc-automation-status-help bizproc-automation-status-help-right"
						data-hint="${Loc.getMessage('BIZPROC_AUTOMATION_DELAY_WAIT_WORK_DAY_HELP')}"
					></span>
				</div>
			</div>
		`;
		if (delay.waitWorkDay && isAvailable)
		{
			Dom.attr(workDayCheckbox, 'checked', 'checked');
		}

		if (!isAvailable)
		{
			Event.bind(root, 'click', () => {
				if (top.BX.UI && top.BX.UI.InfoHelper)
				{
					top.BX.UI.InfoHelper.show('limit_office_worktime_responsible');
				}
			});
			workDayCheckbox.disabled = true;
		}

		return root;
	}

	#isWorkTimeAvailable(): boolean
	{
		return tryGetGlobalContext()?.get('IS_WORKTIME_AVAILABLE') ?? false;
	}
}

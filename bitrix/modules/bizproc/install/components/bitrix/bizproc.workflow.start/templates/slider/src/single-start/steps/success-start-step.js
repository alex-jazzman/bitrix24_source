import { Tag, Loc } from 'main.core';
import { announce } from 'bizproc.a11y';
import { Step } from './step';

import 'sidepanel';

const CLOSE_SLIDER_AFTER_SECONDS = 1;

export class SuccessStartStep extends Step
{
	renderHead(): ?HTMLElement
	{
		return null;
	}

	renderBody(): HTMLElement
	{
		return Tag.render`
			<div>
				<div class="bizproc-workflow-start__slider">
					<div class="bizproc-workflow-start__slider-logo">
						<div class="bizproc-workflow-start__slider-logo-animated"></div>
					</div>
					<div class="bizproc-workflow-start__slider-content">
						<div class="bizproc-workflow-start__slider-text">
							${Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_FINAL_TEXT_STARTED')}
						</div>
					</div>
				</div>
			</div>
		`;
	}

	announcesOwnState(): boolean
	{
		return true;
	}

	onAfterRender()
	{
		// the slider closes a second later, so the result is announced from the top window:
		// its live region outlives this document
		announce(
			Loc.getMessage('BIZPROC_CMP_WORKFLOW_START_TMP_SINGLE_START_FINAL_TEXT_STARTED'),
			{ assertive: true, inTopWindow: true },
		);

		setTimeout(() => {
			if (BX.SidePanel.Instance.getSliderByWindow(window))
			{
				BX.SidePanel.Instance.getSliderByWindow(window).close();
			}
		}, CLOSE_SLIDER_AFTER_SECONDS * 1000);
	}
}

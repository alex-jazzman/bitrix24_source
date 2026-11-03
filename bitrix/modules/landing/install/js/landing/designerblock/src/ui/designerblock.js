import {Tag} from 'main.core';
import {Loc} from 'landing.loc';

export class DesignerBlockUI
{
	static getHoverDiv(): HTMLDivElement
	{
		return Tag.render`<div class="landing-designer-block-node-hover" data-testid="landing-designerblock-node-actions"></div>`;
	}

	static getPseudoLast(): HTMLElement
	{
		return Tag.render`<div class="landing-designer-block-pseudo-last" data-testid="landing-designerblock-pseudo-slot"></div>`;
	}

	static getAddNodeButton(): HTMLElement
	{
		return Tag.render`
			<button type="button" class="landing-designer-block-node-hover-add" data-testid="landing-designerblock-add-btn">
				<span class="landing-designer-block-node-hover-add-title">
					${Loc.getMessage('LANDING_DESIGN_BLOCK_REPO_BUTTON')}
				</span>
			</button>`;
	}
}

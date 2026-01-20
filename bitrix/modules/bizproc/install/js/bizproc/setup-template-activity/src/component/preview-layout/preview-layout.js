import './preview-layout.css';

// @vue/component
export const PreviewLayout = {
	name: 'PreviewLayout',
	template: `
		<div class="bizproc-setuptemplateactivity-preview-layout">
			<div class="bizproc-setuptemplateactivity-preview-layout__container">
				<div class="bizproc-setuptemplateactivity-preview-layout__header">
					<slot name="header"/>
				</div>

				<div class="bizproc-setuptemplateactivity-preview-layout__content">
					<slot/>
				</div>
			</div>

			<div class="bizproc-setuptemplateactivity-preview-layout__footer">
				<slot name="footer"/>
			</div>
		</div>
	`,
};

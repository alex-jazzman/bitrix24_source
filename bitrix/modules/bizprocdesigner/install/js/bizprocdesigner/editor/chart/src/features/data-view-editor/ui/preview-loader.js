import { ProgressRound } from 'ui.progressround';

const LOADER_SIZE = 28;
const LOADER_LINE_SIZE = 3;
const LOADER_ARC_VALUE = 30;
const LOADER_BAR_COLOR = '#2067b0';
const LOADER_TRACK_COLOR = '#eaf2fb';

/**
 * An indeterminate round loader for the preview table (ui.progressround in rotation mode with
 * a partial arc). Mounted while the preview request is in flight.
 */
// @vue/component
export const PreviewLoader = {
	name: 'BizprocDataViewPreviewLoader',
	created(): void
	{
		this.loader = null;
	},
	mounted(): void
	{
		this.loader = new ProgressRound({
			width: LOADER_SIZE,
			lineSize: LOADER_LINE_SIZE,
			value: LOADER_ARC_VALUE,
			rotation: true,
			colorBar: LOADER_BAR_COLOR,
			colorTrack: LOADER_TRACK_COLOR,
		});
		this.loader.renderTo(this.$refs.container);
	},
	beforeUnmount(): void
	{
		this.loader?.destroy();
		this.loader = null;
	},
	template: `
		<span
			ref="container"
			role="status"
			:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_DATAVIEW_PREVIEW_LOADING')"
			class="bizproc-dataview-grid__loader"
		></span>
	`,
};

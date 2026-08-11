import './style.css';

// @vue/component
export const NodeDataInspectorLayout = {
	name: 'NodeDataInspectorLayout',
	template: `
		<div class="node-data-inspector-layout">
			<div class="node-data-inspector-layout__header">
				<div class="node-data-inspector-layout__header-title">
					<slot name="title"/>
				</div>
				<div class="node-data-inspector-layout__header-controls">
					<slot name="header-controls"/>
				</div>
			</div>
			<div class="node-data-inspector-layout__content">
				<div class="node-data-inspector-layout__content-controls">
					<slot name="filter"/>
					<div class="node-data-inspector-layout__content-controls-search">
						<slot name="search"/>
					</div>
					<div class="node-data-inspector-layout__content-controls-view-mode">
						<slot name="view-mode"/>
					</div>
				</div>
				<div class="node-data-inspector-layout__divider"></div>
			</div>
			<div class="node-data-inspector-layout__content__data-viewer">
				<slot name="data-viewer"/>
			</div>
		</div>
	`,
};

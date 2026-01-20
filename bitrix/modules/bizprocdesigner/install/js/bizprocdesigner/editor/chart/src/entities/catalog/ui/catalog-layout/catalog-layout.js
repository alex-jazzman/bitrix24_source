import './catalog-layout.css';

const CATALOG_CLASS_NAMES = {
	base: 'editor-chart-catalog',
	expanded: '--expanded',
};

// @vue/component
export const CatalogLayout = {
	name: 'CatalogLayout',
	props: {
		hasSearchResults: {
			type: Boolean,
			default: false,
		},
		expanded: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		catalogClassNames(): { [string]: boolean }
		{
			return {
				[CATALOG_CLASS_NAMES.base]: true,
				[CATALOG_CLASS_NAMES.expanded]: this.expanded,
			};
		},
	},
	template: `
		<section :class="catalogClassNames">
			<div class="editor-chart-catalog__container">
				<div class="editor-chart-catalog__header">
					<slot name="header"/>
				</div>

				<div class="editor-chart-catalog__search">
					<slot name="search"/>
				</div>

				<div
					v-if="!hasSearchResults"
					class="editor-chart-catalog__content"
				>
					<slot name="content"/>
				</div>

				<div
					v-if="hasSearchResults"
					class="editor-chart-catalog__search-results"
				>
					<slot name="search-results"/>
				</div>
			</div>

			<div class="editor-chart-catalog__footer">
				<slot name="footer"/>
			</div>
		</section>
	`,
};

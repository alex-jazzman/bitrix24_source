import { BLine, BCircle } from 'ui.system.skeleton.vue';
import { HeadlineMd, TextLg } from 'ui.system.typography.vue';

import { useLoc, type GetMessage } from '../../../../shared/composables';

import './app-skeleton.css';

const CATALOG_ITEMS_COUNT = 8;

type AppSkeletonSetup = {
	getMessage: GetMessage,
	catalogItems: number[],
}

// @vue/component
export const AppSkeleton = {
	name: 'AppSkeleton',
	components: {
		BLine,
		BCircle,
		HeadlineMd,
		TextLg,
	},
	setup(): AppSkeletonSetup
	{
		const { getMessage } = useLoc();

		return {
			getMessage,
			catalogItems: Array.from({ length: CATALOG_ITEMS_COUNT }, (_, index) => index),
		};
	},
	computed:
	{
		heroTitle(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_SKELETON_HERO_TITLE');
		},
		heroDescription(): string
		{
			return this.getMessage('BIZPROCDESIGNER_EDITOR_SKELETON_HERO_DESCRIPTION');
		},
	},
	template: `
		<div class="editor-chart-app-skeleton">
			<div class="editor-chart-app-skeleton__header">
				<div class="editor-chart-app-skeleton__header-company">
					<BLine
						:width="24"
						:height="24"
						:radius="4"
					/>
					<div class="editor-chart-app-skeleton__header-company-name">
						<BLine
							:width="117"
							:height="16"
						/>
						<BLine
							class="editor-chart-app-skeleton__placeholder-secondary"
							:width="154"
							:height="16"
						/>
					</div>
				</div>

				<div class="editor-chart-app-skeleton__header-title">
					<BLine
						:width="176"
						:height="16"
					/>
					<BLine
						:width="121"
						:height="16"
					/>
				</div>

				<div class="editor-chart-app-skeleton__header-actions">
					<span class="editor-chart-app-skeleton__divider"></span>
					<div class="editor-chart-app-skeleton__header-status">
						<BCircle
							class="editor-chart-app-skeleton__placeholder-secondary"
							:size="16"
						/>
						<BLine
							class="editor-chart-app-skeleton__placeholder-secondary"
							:width="80"
							:height="10"
						/>
					</div>
					<span class="editor-chart-app-skeleton__divider"></span>
					<BLine
						class="editor-chart-app-skeleton__placeholder-secondary"
						:width="63"
						:height="28"
						:radius="8"
					/>
					<BLine
						:width="160"
						:height="28"
						:radius="8"
					/>
				</div>
			</div>

			<div class="editor-chart-app-skeleton__content">
				<div class="editor-chart-app-skeleton__catalog">
					<div class="editor-chart-app-skeleton__catalog-header">
						<BLine
							:width="24"
							:height="24"
							:radius="4"
						/>
						<BLine
							:width="117"
							:height="16"
						/>
					</div>

					<div class="editor-chart-app-skeleton__catalog-search">
						<BLine
							class="editor-chart-app-skeleton__placeholder-secondary"
							:width="24"
							:height="24"
							:radius="8"
						/>
						<div class="editor-chart-app-skeleton__catalog-search-input"></div>
					</div>

					<div class="editor-chart-app-skeleton__catalog-group">
						<BLine
							:width="24"
							:height="24"
							:radius="8"
						/>
						<BLine
							class="editor-chart-app-skeleton__placeholder-secondary"
							:width="28"
							:height="28"
							:radius="8"
						/>
						<div class="editor-chart-app-skeleton__flex-fill">
							<BLine
								class="editor-chart-app-skeleton__placeholder-secondary"
								:height="16"
							/>
						</div>
					</div>

					<div class="editor-chart-app-skeleton__catalog-list">
						<div
							v-for="item in catalogItems"
							:key="item"
							class="editor-chart-app-skeleton__catalog-item"
						>
							<BLine
								:width="38"
								:height="38"
								:radius="8"
							/>
							<div class="editor-chart-app-skeleton__catalog-item-lines">
								<BLine
									:height="16"
								/>
								<BLine
									class="editor-chart-app-skeleton__placeholder-secondary"
									:height="8"
								/>
								<BLine
									class="editor-chart-app-skeleton__placeholder-secondary"
									:width="161"
									:height="8"
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="editor-chart-app-skeleton__top-right">
					<div class="editor-chart-app-skeleton__control">
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
					</div>
					<div class="editor-chart-app-skeleton__control --square">
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
					</div>
				</div>

				<div class="editor-chart-app-skeleton__bottom-right">
					<div class="editor-chart-app-skeleton__control">
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
						<span class="editor-chart-app-skeleton__divider"></span>
						<BLine
							:width="18"
							:height="18"
							:radius="4"
						/>
						<span class="editor-chart-app-skeleton__divider"></span>
						<BLine
							:width="127"
							:height="18"
							:radius="4"
						/>
					</div>
				</div>

				<div class="editor-chart-app-skeleton__hero">
					<div class="editor-chart-app-skeleton__hero-inner">
						<div class="editor-chart-app-skeleton__hero-illustration"></div>
						<div class="editor-chart-app-skeleton__hero-text">
							<HeadlineMd
								align="center"
								:className="'editor-chart-app-skeleton__hero-title'"
							>
								{{ heroTitle }}
							</HeadlineMd>
							<TextLg
								align="center"
								:className="'editor-chart-app-skeleton__hero-description'"
							>
								{{ heroDescription }}
							</TextLg>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};

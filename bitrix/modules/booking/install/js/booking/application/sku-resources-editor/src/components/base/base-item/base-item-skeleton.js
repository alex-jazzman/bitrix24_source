import './base-item.css';

export const BaseItemSkeleton = {
	name: 'BaseItemSkeleton',
	template: `
		<div class="booking-services-settings-popup__base-item">
			<div class="booking-sre__base-item__skeleton--row booking-sre__base-item__skeleton--header">
				<div
					class="booking-sre__base-item__skeleton--row"
					style="gap: 7px"
				>
					<div
						class="booking-sre__base-item__skeleton --circle"
						:style="{
							height: '15px',
							width: '15px',
						}"
					></div>
					<div
						class="booking-sre__base-item__skeleton --rectangle-rounded"
						:style="{
							height: '11px',
							width: '136px',
						}"
					></div>
				</div>
				<div
					class="booking-sre__base-item__skeleton--row"
					style="gap: 10px"
				>
					<div
						class="booking-sre__base-item__skeleton --rectangle-rounded"
						:style="{
							height: '11px',
							width: '51px',
						}"
					></div>
					<div
						class="booking-sre__base-item__skeleton --circle"
						:style="{
							height: '11px',
							width: '11px',
						}"
					></div>
				</div>
			</div>
			<div class="booking-services-settings-popup__base-item__content">
				<div class="booking-sre__base-item__skeleton--content">
					<div
						class="booking-sre__base-item__skeleton--row booking-sre__base-item__skeleton--content-row"
						style="gap: 5px;"
					>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '111px',
							}"
						></div>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '148px',
							}"
						></div>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '136px',
							}"
						></div>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '120px',
							}"
						></div>
					</div>
					<div
						class="booking-sre__base-item__skeleton--row booking-sre__base-item__skeleton--content-row"
						style="gap: 7px;"
					>
						<div
							class="booking-sre__base-item__skeleton --rectangle"
							:style="{
								height: '28px',
								width: '134px',
							}"
						></div>
						<div
							class="booking-sre__base-item__skeleton --rectangle-rounded"
							:style="{
								height: '10px',
								width: '90px',
							}"
						></div>
					</div>
				</div>
			</div>
		</div>
	`,
};

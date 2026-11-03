import { Dom, Loc, Runtime, Tag, Text, Type } from 'main.core';

import { type BxCard } from './types';

import './css/stub.css';

export type StubState = 'no_data' | 'too_large' | 'error';

export type StubOptions = {
	message?: string;
	onRetry?: () => void;
};

export type StubDependencies = {
	createRetryButton: (text: string, onClick: () => void) => Promise<HTMLElement>;
};

type ButtonExports = {
	Button: new (options: { [key: string]: unknown }) => { render: () => HTMLElement };
	ButtonSize: { [key: string]: string };
	AirButtonStyle: { [key: string]: string };
};

const LINE_PHRASES: { [state in Exclude<StubState, 'error'>]: string } = {
	no_data: 'BICONNECTOR_CHART_ANALYSIS_STUB_NO_DATA',
	too_large: 'BICONNECTOR_CHART_ANALYSIS_STUB_TOO_LARGE',
};

const defaultDependencies: StubDependencies = {
	createRetryButton: async (text, onClick) => {
		const loading = Runtime.loadExtension('ui.buttons') as unknown as Promise<ButtonExports>;
		const { Button, ButtonSize, AirButtonStyle } = await loading;

		return new Button({
			text,
			size: ButtonSize.SMALL,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			onclick: (): void => onClick(),
		}).render();
	},
};

function renderCard(card: BxCard): HTMLElement
{
	const node = Tag.render`
		<div class="biconnector-chart-analysis-stub__card">
			<div class="biconnector-chart-analysis-stub__title">${Text.encode(card.sliceName)}</div>
		</div>
	`;

	if (Type.isStringFilled(card.periodLabel))
	{
		Dom.append(Tag.render`
			<div class="biconnector-chart-analysis-stub__period">${Text.encode(card.periodLabel)}</div>
		`, node);
	}

	if (Type.isArrayFilled(card.appliedFilters))
	{
		const list = Tag.render`<ul class="biconnector-chart-analysis-stub__filters"></ul>`;
		card.appliedFilters.forEach((filter) => {
			Dom.append(Tag.render`
				<li class="biconnector-chart-analysis-stub__filter">
					${Text.encode(filter.label)}: ${Text.encode(filter.value)}
				</li>
			`, list);
		});
		Dom.append(list, node);
	}

	return node;
}

export function getLineText(state: StubState, options: StubOptions = {}): string
{
	if (state === 'error')
	{
		return Type.isStringFilled(options.message)
			? options.message
			: (Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ANALYZE_ERROR') ?? '')
		;
	}

	return Loc.getMessage(LINE_PHRASES[state]) ?? '';
}

export function renderStub(
	state: StubState,
	card: BxCard,
	options: StubOptions = {},
	dependencies: StubDependencies = defaultDependencies,
): HTMLElement
{
	const node = Tag.render`
		<div class="biconnector-chart-analysis-stub --${state}">
			<div class="biconnector-chart-analysis-stub__line">${Text.encode(getLineText(state, options))}</div>
		</div>
	`;
	Dom.prepend(renderCard(card), node);

	if (state === 'error' && Type.isFunction(options.onRetry))
	{
		const actions = Tag.render`<div class="biconnector-chart-analysis-stub__actions"></div>`;
		Dom.append(actions, node);

		const text = Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_STUB_RETRY') ?? '';
		dependencies.createRetryButton(text, options.onRetry)
			.then((button) => Dom.append(button, actions))
			.catch((error) => console.error('ChartAnalysis: failed to render retry button', error))
		;
	}

	return node;
}

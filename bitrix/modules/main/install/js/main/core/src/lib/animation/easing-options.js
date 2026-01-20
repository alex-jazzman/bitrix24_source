export type TransitionFunction = (progress: number) => number;

export type EasingOptions = {
	duration?: number,
	start?: Object<string, number>,
	finish?: Object<string, number>,
	transition?: (
		TransitionFunction
		| 'linear' | 'ease-out-linear' | 'ease-in-out-linear'
		| 'quad' | 'ease-out-quad' | 'ease-in-out-quad'
		| 'cubic' | 'ease-out-cubic' | 'ease-in-out-cubic'
		| 'quart' | 'ease-out-quart' | 'ease-in-out-quart'
		| 'quint' | 'ease-out-quint' | 'ease-in-out-quint'
		| 'circ' | 'ease-out-circ' | 'ease-in-out-circ'
		| 'back' | 'ease-out-back' | 'ease-in-out-back'
		| 'elasti' | 'ease-out-elasti' | 'ease-in-out-elasti'
		| 'bounce' | 'ease-out-bounce' | 'ease-in-out-bounce'
	),
	begin?: (state: Object<string, number>) => void,
	step?: (state: Object<string, number>) => void,
	complete?: (state: Object<string, number>) => void,
	progress?: (progress: number) => void,
};

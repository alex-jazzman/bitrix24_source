import {Text} from 'main.core';

const defaultOptions = {
	id: Text.getRandom(),
	text: '',
	html: '',
	onClick: () => {},
	attrs: {},
	disabled: false,
	className: null,
	ariaLabel: null,
	toggle: false,
};

export default defaultOptions;
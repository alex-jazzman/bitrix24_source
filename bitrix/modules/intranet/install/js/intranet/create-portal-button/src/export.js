import { CreatePortalButton } from './create-portal-button';
import './style.css';

export {
	CreatePortalButton,
};

BX.ready(() => {
	const headerButtonContainer = document.getElementById('header-buttons');

	if (headerButtonContainer)
	{
		(new CreatePortalButton()).renderTo(headerButtonContainer);
	}
});
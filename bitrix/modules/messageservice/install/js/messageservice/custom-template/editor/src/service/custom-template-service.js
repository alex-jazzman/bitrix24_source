import { ajax } from 'main.core';

export class CustomTemplateService
{
	create({ zone, scene, targetId, title, body, strategy = 'reject' })
	{
		return new Promise((resolve, reject) => {
			ajax.runAction('messageservice.api.CustomTemplate.CustomTemplate.create', {
				json: { zone, scene, targetId, title, body, strategy },
			})
				.then((response) => resolve(response.data))
				.catch(reject)
			;
		});
	}

	update(templateId, { title, body })
	{
		return new Promise((resolve, reject) => {
			ajax.runAction('messageservice.api.CustomTemplate.CustomTemplate.update', {
				json: { templateId, title, body },
			})
				.then((response) => resolve(response.data))
				.catch(reject)
			;
		});
	}

	delete(templateId)
	{
		return new Promise((resolve, reject) => {
			ajax.runAction('messageservice.api.CustomTemplate.CustomTemplate.delete', {
				json: { templateId },
			})
				.then((response) => resolve(response.data))
				.catch(reject)
			;
		});
	}
}

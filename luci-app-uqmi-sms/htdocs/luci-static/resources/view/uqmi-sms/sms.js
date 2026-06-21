'use strict';
'require view';
'require rpc';
'require ui';
'require form';

const callGetMessages = rpc.declare({
	object: 'luci.uqmi_sms',
	method: 'get_messages',
	expect: { success: false, messages: [] }
});

const callSendMessage = rpc.declare({
	object: 'luci.uqmi_sms',
	method: 'send_message',
	params: ['target', 'text'],
	expect: { success: false }
});

const callDeleteMessage = rpc.declare({
	object: 'luci.uqmi_sms',
	method: 'delete_message',
	params: ['id', 'ids'],
	expect: { success: false }
});

function notify(message, level) {
	ui.addNotification(null, E('p', message), level || 'info');
}

function notifyError(message, response) {
	let detail = response && response.error ? response.error : message;
	ui.addNotification(null, E('p', detail), 'danger');
}

function normalizeMessages(response) {
	if (!response || !response.success)
		return [];
	return Array.isArray(response.messages) ? response.messages : [];
}

return view.extend({
	load: function() {
		return L.resolveDefault(callGetMessages(), { success: false, messages: [] });
	},

	render: function(data) {
		let messages = normalizeMessages(data);

		return E('div', { 'class': 'cbi-map' }, [
			E('h2', _('uQMI SMS')),
			this.renderSendForm(),
			this.renderInbox(messages)
		]);
	},

	renderSendForm: function() {
		return E('div', { 'class': 'cbi-section' }, [
			E('h3', _('Send SMS')),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title', 'for': 'sms-target' }, _('Target')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'id': 'sms-target',
						'type': 'text',
						'class': 'cbi-input-text',
						'inputmode': 'tel'
					})
				])
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title', 'for': 'sms-text' }, _('Message')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('textarea', {
						'id': 'sms-text',
						'class': 'cbi-input-textarea',
						'rows': 4
					})
				])
			]),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-apply',
					'click': ui.createHandlerFn(this, 'sendMessage')
				}, _('Send'))
			])
		]);
	},

	renderInbox: function(messages) {
		let rows = messages.length ? messages.map(this.renderMessageRow.bind(this)) : [
			E('div', { 'class': 'tr placeholder' }, [
				E('div', { 'class': 'td center' }, _('No messages')),
				E('div', { 'class': 'td' }, ''),
				E('div', { 'class': 'td' }, ''),
				E('div', { 'class': 'td' }, ''),
				E('div', { 'class': 'td' }, ''),
				E('div', { 'class': 'td' }, '')
			])
		];

		let tableRows = [
			E('div', { 'class': 'tr table-titles' }, [
				E('div', { 'class': 'th center' }, [
					E('input', {
						'type': 'checkbox',
						'click': ui.createHandlerFn(this, 'toggleAllMessages')
					})
				]),
				E('div', { 'class': 'th' }, _('ID')),
				E('div', { 'class': 'th' }, _('Sender')),
				E('div', { 'class': 'th' }, _('Time')),
				E('div', { 'class': 'th' }, _('Message')),
				E('div', { 'class': 'th cbi-section-actions' }, _('Actions'))
			])
		].concat(rows);

		return E('div', { 'id': 'sms-inbox', 'class': 'cbi-section' }, [
			E('h3', _('Inbox')),
			E('div', { 'class': 'cbi-page-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-reload',
					'click': ui.createHandlerFn(this, 'refreshInbox')
				}, _('Refresh')),
				' ',
				E('button', {
					'class': 'btn cbi-button cbi-button-remove',
					'click': ui.createHandlerFn(this, 'deleteSelectedMessages')
				}, _('Delete selected')),
				' ',
				E('button', {
					'class': 'btn cbi-button cbi-button-remove',
					'click': ui.createHandlerFn(this, 'deleteAllMessages')
				}, _('Delete all'))
			]),
			E('div', { 'class': 'table' }, tableRows)
		]);
	},

	renderMessageRow: function(message) {
		return E('div', { 'class': 'tr' }, [
			E('div', { 'class': 'td center' }, [
				E('input', {
					'type': 'checkbox',
					'class': 'sms-select',
					'value': message.id || ''
				})
			]),
			E('div', { 'class': 'td' }, message.id || '-'),
			E('div', { 'class': 'td' }, message.sender || '-'),
			E('div', { 'class': 'td' }, message.timestamp || '-'),
			E('div', { 'class': 'td' }, message.text || ''),
			E('div', { 'class': 'td cbi-section-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-remove',
					'data-id': message.id || '',
					'click': ui.createHandlerFn(this, 'deleteMessage', message.id)
				}, _('Delete'))
			])
		]);
	},

	refreshInbox: function() {
		return callGetMessages().then(function(response) {
			if (!response.success) {
				notifyError(_('Unable to read SMS messages'), response);
				return;
			}
			this.replaceInbox(normalizeMessages(response));
		}.bind(this)).catch(function(error) {
			notifyError(error.message || _('Unable to read SMS messages'));
		});
	},

	replaceInbox: function(messages) {
		let current = document.getElementById('sms-inbox');
		let next = this.renderInbox(messages);

		if (current && current.parentNode)
			current.parentNode.replaceChild(next, current);
	},

	toggleAllMessages: function(ev) {
		let checked = ev.currentTarget.checked;
		let boxes = document.querySelectorAll('.sms-select');

		for (let i = 0; i < boxes.length; i++)
			boxes[i].checked = checked;
	},

	getSelectedIds: function() {
		let boxes = document.querySelectorAll('.sms-select:checked');
		let ids = [];

		for (let i = 0; i < boxes.length; i++) {
			if (boxes[i].value)
				ids.push(boxes[i].value);
		}

		return ids;
	},

	sendMessage: function() {
		let target = document.getElementById('sms-target').value.trim();
		let text = document.getElementById('sms-text').value;

		if (!target || !text) {
			notify(_('Target phone number and message body are required'), 'warning');
			return Promise.resolve();
		}

		return callSendMessage(target, text).then(function(response) {
			if (!response.success) {
				notifyError(_('Unable to send SMS'), response);
				return;
			}

			document.getElementById('sms-text').value = '';
			notify(_('SMS sent'));
		}).catch(function(error) {
			notifyError(error.message || _('Unable to send SMS'));
		});
	},

	deleteMessage: function(id) {
		if (!id)
			return Promise.resolve();

		return ui.showModal(_('Delete SMS'), [
			E('p', _('Delete this SMS message?')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button cbi-button-remove important',
					'click': ui.createHandlerFn(this, 'confirmDeleteMessage', id)
				}, _('Delete'))
			])
		]);
	},

	confirmDeleteMessage: function(id) {
		return callDeleteMessage(id).then(function(response) {
			ui.hideModal();

			if (!response.success) {
				notifyError(_('Unable to delete SMS'), response);
				return;
			}

			this.refreshInbox();
		}.bind(this)).catch(function(error) {
			ui.hideModal();
			notifyError(error.message || _('Unable to delete SMS'));
		});
	},

	deleteSelectedMessages: function() {
		let ids = this.getSelectedIds();

		if (!ids.length) {
			notify(_('No SMS messages selected'), 'warning');
			return Promise.resolve();
		}

		return ui.showModal(_('Delete selected SMS'), [
			E('p', _('Delete selected SMS messages?')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button cbi-button-remove important',
					'click': ui.createHandlerFn(this, 'confirmDeleteSelectedMessages', ids)
				}, _('Delete selected'))
			])
		]);
	},

	confirmDeleteSelectedMessages: function(ids) {
		return callDeleteMessage(null, ids).then(function(response) {
			ui.hideModal();

			if (!response.success) {
				notifyError(_('Unable to delete SMS messages'), response);
				return;
			}

			this.refreshInbox();
		}.bind(this)).catch(function(error) {
			ui.hideModal();
			notifyError(error.message || _('Unable to delete SMS messages'));
		});
	},

	deleteAllMessages: function() {
		return ui.showModal(_('Delete all SMS'), [
			E('p', _('Delete all SMS messages?')),
			E('div', { 'class': 'right' }, [
				E('button', {
					'class': 'btn',
					'click': ui.hideModal
				}, _('Cancel')),
				' ',
				E('button', {
					'class': 'btn cbi-button cbi-button-remove important',
					'click': ui.createHandlerFn(this, 'confirmDeleteAllMessages')
				}, _('Delete all'))
			])
		]);
	},

	confirmDeleteAllMessages: function() {
		return callDeleteMessage().then(function(response) {
			ui.hideModal();

			if (!response.success) {
				notifyError(_('Unable to delete SMS messages'), response);
				return;
			}

			this.refreshInbox();
		}.bind(this)).catch(function(error) {
			ui.hideModal();
			notifyError(error.message || _('Unable to delete SMS messages'));
		});
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});

'use strict';
'require view';
'require rpc';
'require ui';

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

function messageId(message) {
	return message && message.id != null ? String(message.id) : '';
}

function messageText(message) {
	return message && message.text != null ? String(message.text) : '';
}

function setButtonBusy(button, busy) {
	if (!button)
		return;

	button.disabled = busy;
	if (busy)
		button.classList.add('spinning');
	else
		button.classList.remove('spinning');
}

return view.extend({
	load: function() {
		return L.resolveDefault(callGetMessages(), { success: false, messages: [] });
	},

	render: function(data) {
		let messages = normalizeMessages(data);

		return E('div', { 'class': 'uqmi-sms-page cbi-map' }, [
			this.renderStyle(),
			this.renderHeader(messages),
			E('div', { 'class': 'uqmi-sms-grid' }, [
				this.renderSendForm(),
				this.renderInbox(messages)
			])
		]);
	},

	renderStyle: function() {
		return E('style', { 'type': 'text/css' }, `
.uqmi-sms-page {
	max-width: 1180px;
}

.uqmi-sms-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	margin: 0 0 18px;
}

.uqmi-sms-header h2 {
	margin: 0;
}

.uqmi-sms-stats {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.uqmi-sms-pill {
	display: inline-flex;
	align-items: center;
	min-height: 28px;
	padding: 0 10px;
	border: 1px solid #d8dde6;
	border-radius: 6px;
	background: #fff;
	color: #2d3748;
	font-size: 13px;
	font-weight: 600;
}

.uqmi-sms-grid {
	display: grid;
	grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
	gap: 18px;
	align-items: start;
}

.uqmi-sms-panel {
	margin: 0;
	padding: 16px;
	border: 1px solid #d8dde6;
	border-radius: 8px;
	background: #fff;
	box-shadow: 0 1px 2px rgba(0, 0, 0, .04);
}

.uqmi-sms-panel h3 {
	margin: 0 0 14px;
	font-size: 18px;
}

.uqmi-sms-field {
	margin-bottom: 14px;
}

.uqmi-sms-field label {
	display: block;
	margin-bottom: 6px;
	font-weight: 600;
}

.uqmi-sms-field input,
.uqmi-sms-field textarea {
	width: 100%;
	box-sizing: border-box;
}

.uqmi-sms-field textarea {
	min-height: 132px;
	resize: vertical;
}

.uqmi-sms-form-footer,
.uqmi-sms-actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	flex-wrap: wrap;
}

.uqmi-sms-counter {
	color: #64748b;
	font-size: 12px;
}

.uqmi-sms-actions {
	margin-bottom: 14px;
}

.uqmi-sms-actions-left,
.uqmi-sms-actions-right {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}

.uqmi-sms-table-wrap {
	overflow-x: auto;
	border: 1px solid #d8dde6;
	border-radius: 8px;
}

.uqmi-sms-table {
	margin: 0;
	min-width: 680px;
	border: 0;
}

.uqmi-sms-table .tr {
	display: grid;
	grid-template-columns: 44px 70px minmax(130px, .75fr) minmax(150px, .85fr) minmax(220px, 1.4fr) 104px;
	border-top: 1px solid #e5e7eb;
}

.uqmi-sms-table .tr:first-child {
	border-top: 0;
}

.uqmi-sms-table .th {
	background: #f6f8fb;
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0;
}

.uqmi-sms-table .td,
.uqmi-sms-table .th {
	padding: 10px 12px;
	vertical-align: top;
}

.uqmi-sms-message {
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	line-height: 1.45;
}

.uqmi-sms-muted {
	color: #64748b;
}

.uqmi-sms-empty {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 148px;
	border: 1px dashed #cbd5e1;
	border-radius: 8px;
	background: #f8fafc;
	color: #64748b;
	text-align: center;
}

.uqmi-sms-delete {
	min-width: 78px;
}

.spinning {
	cursor: progress;
	opacity: .7;
}

@media screen and (max-width: 900px) {
	.uqmi-sms-grid {
		grid-template-columns: 1fr;
	}
}

@media screen and (max-width: 640px) {
	.uqmi-sms-header,
	.uqmi-sms-form-footer,
	.uqmi-sms-actions {
		align-items: stretch;
		flex-direction: column;
	}

	.uqmi-sms-stats,
	.uqmi-sms-actions-left,
	.uqmi-sms-actions-right {
		width: 100%;
	}

	.uqmi-sms-actions .btn,
	.uqmi-sms-form-footer .btn {
		width: 100%;
	}
}
`);
	},

	renderHeader: function(messages) {
		return E('div', { 'class': 'uqmi-sms-header' }, [
			E('h2', _('uQMI SMS')),
			E('div', { 'class': 'uqmi-sms-stats' }, [
				E('span', { 'class': 'uqmi-sms-pill' }, [
					_('Inbox'),
					': ',
					String(messages.length)
				]),
				E('button', {
					'class': 'btn cbi-button cbi-button-reload',
					'click': ui.createHandlerFn(this, 'refreshInbox')
				}, _('Refresh'))
			])
		]);
	},

	renderSendForm: function() {
		return E('div', { 'class': 'uqmi-sms-panel' }, [
			E('h3', _('Send SMS')),
			E('div', { 'class': 'uqmi-sms-field' }, [
				E('label', { 'for': 'sms-target' }, _('Recipient')),
				E('input', {
					'id': 'sms-target',
					'type': 'text',
					'class': 'cbi-input-text',
					'inputmode': 'tel',
					'autocomplete': 'tel'
				})
			]),
			E('div', { 'class': 'uqmi-sms-field' }, [
				E('label', { 'for': 'sms-text' }, _('Message')),
				E('textarea', {
					'id': 'sms-text',
					'class': 'cbi-input-textarea',
					'rows': 6,
					'input': ui.createHandlerFn(this, 'updateCounter')
				})
			]),
			E('div', { 'class': 'uqmi-sms-form-footer' }, [
				E('span', {
					'id': 'sms-counter',
					'class': 'uqmi-sms-counter'
				}, _('0 characters')),
				E('button', {
					'class': 'btn cbi-button cbi-button-apply',
					'click': ui.createHandlerFn(this, 'sendMessage')
				}, _('Send'))
			])
		]);
	},

	renderInbox: function(messages) {
		let hasMessages = messages.length > 0;
		let deleteSelectedAttrs = {
			'class': 'btn cbi-button cbi-button-remove',
			'click': ui.createHandlerFn(this, 'deleteSelectedMessages')
		};
		let deleteAllAttrs = {
			'class': 'btn cbi-button cbi-button-remove',
			'click': ui.createHandlerFn(this, 'deleteAllMessages')
		};

		if (!hasMessages) {
			deleteSelectedAttrs.disabled = true;
			deleteAllAttrs.disabled = true;
		}

		return E('div', { 'id': 'sms-inbox', 'class': 'uqmi-sms-panel' }, [
			E('div', { 'class': 'uqmi-sms-actions' }, [
				E('h3', _('Inbox')),
				E('div', { 'class': 'uqmi-sms-actions-right' }, [
					E('button', {
						'class': 'btn cbi-button cbi-button-reload',
						'click': ui.createHandlerFn(this, 'refreshInbox')
					}, _('Refresh')),
					E('button', deleteSelectedAttrs, _('Delete selected')),
					E('button', deleteAllAttrs, _('Delete all'))
				])
			]),
			hasMessages ? this.renderMessageTable(messages) : this.renderEmptyInbox()
		]);
	},

	renderEmptyInbox: function() {
		return E('div', { 'class': 'uqmi-sms-empty' }, _('No messages'));
	},

	renderMessageTable: function(messages) {
		let rows = messages.map(this.renderMessageRow.bind(this));
		let tableRows = [
			E('div', { 'class': 'tr table-titles' }, [
				E('div', { 'class': 'th center' }, [
					E('input', {
						'type': 'checkbox',
						'title': _('Select all'),
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

		return E('div', { 'class': 'uqmi-sms-table-wrap' }, [
			E('div', { 'class': 'table uqmi-sms-table' }, tableRows)
		]);
	},

	renderMessageRow: function(message) {
		let id = messageId(message);
		let text = messageText(message);

		return E('div', { 'class': 'tr' }, [
			E('div', { 'class': 'td center' }, [
				E('input', {
					'type': 'checkbox',
					'class': 'sms-select',
					'value': id
				})
			]),
			E('div', { 'class': 'td' }, id || '-'),
			E('div', { 'class': 'td' }, message.sender || E('span', { 'class': 'uqmi-sms-muted' }, '-')),
			E('div', { 'class': 'td' }, message.timestamp || E('span', { 'class': 'uqmi-sms-muted' }, '-')),
			E('div', { 'class': 'td uqmi-sms-message' }, text || E('span', { 'class': 'uqmi-sms-muted' }, '-')),
			E('div', { 'class': 'td cbi-section-actions' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-remove uqmi-sms-delete',
					'data-id': id,
					'click': ui.createHandlerFn(this, 'deleteMessage', id)
				}, _('Delete'))
			])
		]);
	},

	updateCounter: function() {
		let textarea = document.getElementById('sms-text');
		let counter = document.getElementById('sms-counter');

		if (textarea && counter)
			counter.textContent = _('%d characters').format(textarea.value.length);
	},

	refreshInbox: function(ev) {
		let button = ev && ev.currentTarget;
		setButtonBusy(button, true);

		return callGetMessages().then(function(response) {
			if (!response.success) {
				notifyError(_('Unable to read SMS messages'), response);
				setButtonBusy(button, false);
				return;
			}
			this.replaceInbox(normalizeMessages(response));
			this.replaceHeader(normalizeMessages(response));
			setButtonBusy(button, false);
		}.bind(this)).catch(function(error) {
			notifyError(error.message || _('Unable to read SMS messages'));
			setButtonBusy(button, false);
		});
	},

	replaceHeader: function(messages) {
		let current = document.querySelector('.uqmi-sms-header');
		let next = this.renderHeader(messages);

		if (current && current.parentNode)
			current.parentNode.replaceChild(next, current);
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

	sendMessage: function(ev) {
		let target = document.getElementById('sms-target').value.trim();
		let text = document.getElementById('sms-text').value;
		let button = ev && ev.currentTarget;

		if (!target || !text) {
			notify(_('Recipient phone number and message body are required'), 'warning');
			return Promise.resolve();
		}

		setButtonBusy(button, true);

		return callSendMessage(target, text).then(function(response) {
			if (!response.success) {
				notifyError(_('Unable to send SMS'), response);
				setButtonBusy(button, false);
				return;
			}

			document.getElementById('sms-text').value = '';
			this.updateCounter();
			notify(_('SMS sent'));
			setButtonBusy(button, false);
		}.bind(this)).catch(function(error) {
			notifyError(error.message || _('Unable to send SMS'));
			setButtonBusy(button, false);
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

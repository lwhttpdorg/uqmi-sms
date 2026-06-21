#!/usr/bin/env ucode

'use strict';

import { popen } from 'fs';

const UQMI_SMS_BIN = '/usr/bin/uqmi-sms';

function run(args) {
	let cmd = join(' ', map(args, function(arg) { return shellquote(arg); }));
	let proc = popen(`${UQMI_SMS_BIN} ${cmd}`, 'r');
	if (proc == null) {
		return { success: false, error: 'failed to invoke uqmi-sms' };
	}

	let output = proc.read('all');
	proc.close();

	let result;
	try {
		result = json(output);
	} catch (e) {
		result = null;
	}

	if (type(result) != 'object') {
		return { success: false, error: output || 'uqmi-sms returned invalid output' };
	}

	return result;
}

const methods = {
	get_messages: {
		call: function() {
			return run(['-read']);
		}
	},

	send_message: {
		args: {
			target: 'string',
			text: 'string'
		},
		call: function(req) {
			return run(['-send', '-target', req.args.target, '-text', req.args.text]);
		}
	},

	delete_message: {
		args: {
			id: 'string',
			ids: []
		},
		call: function(req) {
			let args = ['-delete'];
			if (req.args.id != null && req.args.id != '') {
				args.push('-id', req.args.id);
			} else if (type(req.args.ids) == 'array' && length(req.args.ids) > 0) {
				args.push('-ids', join(',', req.args.ids));
			}
			return run(args);
		}
	}
};

return { 'luci.uqmi_sms': methods };

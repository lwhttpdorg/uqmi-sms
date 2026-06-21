'use strict';
'require view';
'require form';

return view.extend({
	render: function() {
		let m, s, o;

		m = new form.Map('uqmi_sms', _('uQMI SMS'), _('Configure the uQMI SMS backend.'));

		s = m.section(form.NamedSection, 'main', 'uqmi_sms', _('General'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'device', _('Modem device'));
		o.datatype = 'device';
		o.default = '/dev/cdc-wdm0';
		o.rmempty = false;

		o = s.option(form.ListValue, 'storage', _('Message storage'));
		o.value('me', _('ME (mobile equipment)'));
		o.value('sm', _('SM (SIM card)'));
		o.value('sr', _('SR (status report)'));
		o.default = 'me';
		o.rmempty = false;

		return m.render();
	}
});

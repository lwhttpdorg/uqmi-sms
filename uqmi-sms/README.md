# uqmi-sms

`uqmi-sms` is a small command line tool for reading, deleting, and sending
SMS messages through `uqmi`. All output is JSON, including errors.

## JSON API

Read all SMS messages:

```sh
uqmi-sms -read
```

```json
{
  "success": true,
  "action": "read",
  "messages": [
    {
      "id": "1",
      "sender": "10010",
      "timestamp": "2024-01-01 00:00:00",
      "text": "hello"
    }
  ]
}
```

Read one SMS message:

```sh
uqmi-sms -read -id <ID>
```

Read multiple SMS messages:

```sh
uqmi-sms -read -ids 1,2,3
```

Delete one SMS message:

```sh
uqmi-sms -delete -id <ID>
```

Delete multiple SMS messages:

```sh
uqmi-sms -delete -ids 1,2,3
```

Delete all SMS messages:

```sh
uqmi-sms -delete
```

Send SMS:

```sh
uqmi-sms -send -target <target_phone_number> -text <message>
```

Successful write actions return JSON too:

```json
{
  "success": true,
  "action": "send",
  "target": "10010"
}
```

Errors are also JSON:

```json
{
  "success": false,
  "action": "send",
  "error": "malformed target phone number"
}
```

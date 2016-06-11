# public-ip [![Build Status](https://travis-ci.org/guerrerocarlos/ubnt-discover.svg?branch=master)](https://travis-ci.org/guerrerocarlos/ubnt-discover)

> List ubiquiti/ubnt devices in your network right from the cli

Unofficial fork of the mechanism used by the [official chrome extension](https://chrome.google.com/webstore/detail/ubiquiti-device-discovery/hmpigflbjeapnknladcfphgkemopofig)

## Install

```
$ npm install --global ubnt-discover
```


## Usage


```
$ ubnt-discover --help

Discover ubiquiti devices on the network

 Usage
	 $ ubnt-discover
 Options
	 -v1, Search for V1 devices
	 -v2, --unifi Search for V2 (UniFi) devices
	 --notable Don't show as a table
 Examples
	 $ ubnt-discover -v1
```

```
$ ubnt-discover
╔═════════════╤═════════════╤════════════════╤═══════════════════╤═══════════════════════════════════════╗
║ Device Type │ Name        │ Host           │ Mac               │ Firmware                              ║
╟─────────────┼─────────────┼────────────────┼───────────────────┼───────────────────────────────────────╢
║ NVR         │ UniFi-Video │ 192.168.10.XXX │ 68217XXXXX523XXXX │ NVR.x86_64.v3.2.2.8ff52ec.160415.0002 ║
╚═════════════╧═════════════╧════════════════╧═══════════════════╧═══════════════════════════════════════╝
Waiting for more... (Ctrl+C to exit)
```


## API

```
const ubnt = require('ubnt-discover');
```

Use the version of devices to search as the index, example:

```
ubnt['1']()
```
or
```
ubnt['2']()
```

The 'new' event will trigger when devices are found:

```
ubnt.events.on('new', function(device){
	console.log(device)
}
```

## License

MIT © [Sindre Sorhus](https://sindresorhus.com)

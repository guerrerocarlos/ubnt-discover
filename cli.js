#!/usr/bin/env node
'use strict';
const meow = require('meow');
const ubnt = require('./index');
var Table = require('cli-table');
var clear = require("cli-clear");


const cli = meow(`
	Usage
	  $ ubnt-discover
	Options
	  -v1, Search for V1 devices
		-v2, Search for V2 devices
	  --more Show more information (not presented as table)
	Examples
	  $ ubnt-discover -v1

`, {
	alias: {
		'unifi': 'v',
	}
});

var table = new Table({
  chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
         , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
         , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
         , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
});

if(cli.flags['v'] === true || cli.flags['v'] === 2){
	cli.flags['v'] = 2
	table.push(['Type', 'Host', 'IP', 'Mac', 'Firmware', 'Model'])
} else {
	cli.flags['v'] = 1
	table.push(['Device Type', 'Name ----------------------- ', 'IP', 'Mac', 'Firmware'])
}

ubnt[cli.flags['v']]()

ubnt.events.on('new', function(device){
	if(!cli.flags.more){
		if(cli.flags['v'] === 1){
			table.push([device.display, device.hostname, device.ip, device.mac, device.firmware])
		} else {
			table.push([device.display, device.hostname, device.ip, device.mac, device.firmware, device.model])
		}
		clear();
		console.log(table.toString());
		console.log('Waiting for more... (Ctrl+C to exit)')
	} else {
		console.log(device)
	}
})

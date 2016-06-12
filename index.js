const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const parser = require('./ubnt-parsers')
const EventEmitter = require('events');
const Netmask = require('netmask').Netmask;
const MCAST_ADDR = '233.89.188.1';
const MCAST_PORT = 10001;
const ee = new EventEmitter();

var mfi_bundles = {
  "M2M": {
    "display": "mFi "
  },
  "M2S": {
    "display": "mFi mPort Serial"
  },
  "P8U": {
    "display": "mFi mPower PRO"
  },
  "P6E": {
    "display": "mFi mPower PRO"
  },
  "P3U": {
    "display": "mFi mPower"
  },
  "P3E": {
    "display": "mFi mPower"
  },
  "P1U": {
    "display": "mFi mPower mini"
  },
  "P1E": {
    "display": "mFi mPower mini"
  },
  "IWO2U": {
    "display": "mFi In-Wall Outlet"
  },
  "IWD1U": {
    "display": "mFi Dimmer Switch"
  }
};

var unifi_bundles = {
  "U2HSR": {
    "display": "UniFi AP-Outdoor+"
  },
  "US8P150": {
    "display": "UniFi Switch 8 POE-150W"
  },
  "US24P250": {
    "display": "UniFi Switch 24 POE-250W"
  },
  "U7Ev2": {
    "display": "UniFi AP-AC v2"
  },
  "US16P150": {
    "display": "UniFi Switch 16 POE-150W"
  },
  "U7PC": {
    "display": "UniFi AP-AC-Pico"
  },
  "U7LR": {
    "display": "UniFi AP-AC-LR"
  },
  "U7EDU": {
    "display": "UniFi AP-AC-EDU"
  },
  "U7PG2": {
    "display": "UniFi AP-AC-Pro Gen2"
  },
  "U2O": {
    "display": "UniFi AP-Outdoor"
  },
  "U7LT": {
    "display": "UniFi AP-AC-Lite"
  },
  "BZ2LR": {
    "display": "UniFi AP-LR"
  },
  "US48P750": {
    "display": "UniFi Switch 48 POE-750W"
  },
  "U7LO": {
    "display": "UniFi AP-AC-LR-Outdoor"
  },
  "UP7": {
    "display": "UniFi Phone-Executive"
  },
  "UP4": {
    "display": "UniFi Phone-X"
  },
  "UP5": {
    "display": "UniFi Phone"
  },
  "UP7c": {
    "display": "UniFi Phone-Executive"
  },
  "UGW3": {
    "display": "UniFi Security Gateway"
  },
  "U7P": {
    "display": "UniFi AP-Pro"
  },
  "UGW4": {
    "display": "UniFi Security Gateway-Pro"
  },
  "UP5c": {
    "display": "UniFi Phone"
  },
  "U5O": {
    "display": "UniFi AP-Outdoor 5G"
  },
  "US24P500": {
    "display": "UniFi Switch 24 POE-500W"
  },
  "U7O": {
    "display": "UniFi AP-AC Outdoor"
  },
  "UP5t": {
    "display": "UniFi Phone-Pro"
  },
  "U2IW": {
    "display": "UniFi AP-In Wall"
  },
  "U7E": {
    "display": "UniFi AP-AC"
  },
  "BZ2": {
    "display": "UniFi AP"
  },
  "p2N": {
    "display": "PicoStation M2"
  },
  "US48": {
    "display": "UniFi Switch 48"
  },
  "US24": {
    "display": "UniFi Switch 24"
  },
  "UP5tc": {
    "display": "UniFi Phone-Pro"
  },
  "US48P500": {
    "display": "UniFi Switch 48 POE-500W"
  }
};
unifi_bundles['UCK'] = {
  'display': 'UniFi CloudKey',
  'is_cloudkey': true
};
unifi_bundles['UCKv2'] = {
  'display': 'UniFi CloudKey version 2',
  'is_cloudkey': true
};

function deviceFound(device) {

  var i,
    m;
  // console.log(device)
  device.model = device.discovered_by === 1 ? device.platform : device.model;
  if (device.model) {
    device.subtype = device.model.replace(/([^-]+)-?(.*)/, '$2');
    device.model = device.model.replace(/([^-]+)-?(.*)/, '$1');
  }
  if (device.discovered_by === 2 && !mfi_bundles[device.model]) {
    device.family = 'UniFi';
  } else if (device.discovered_by === 1 && unifi_bundles[device.model]) {
    device.family = 'UniFi';
  } else {
    device.family = 'AirOS';
  }

  if (unifi_bundles[device.model]) {
    device.display = unifi_bundles[device.model].display + (device.subtype.length == 0 ? '' : ' ' + device.subtype);
    device.is_cloudkey = !!unifi_bundles[device.model].is_cloudkey;
  } else if (mfi_bundles[device.model]) {
    device.display = mfi_bundles[device.model].display;
  } else {
    device.display = device.model;
  }

  return device
};

var discovered_devices = {}

const query = version => {

  console.log('Searching for version', version, 'devices...')

  socket.on('message', (msg, rinfo) => {
    // console.log('message from: ', rinfo, 'content:', msg)
    var device = parser.parsePacket(rinfo, msg)
    if(device != undefined){
      var device = deviceFound(device)
      if (device != {} && Object.keys(discovered_devices).indexOf(device.ip) == -1) {
        discovered_devices[device.ip] = device
        ee.emit('new', device)
      }
    }

  });

  socket.on('listening', () => {
    var address = socket.address();
    socket.setMulticastLoopback(true)
    socket.setMulticastTTL(100)
    socket.setTTL(100)
    socket.addMembership(MCAST_ADDR)
    socket.setBroadcast(true)

    var message = Buffer([0x01, 0x00, 0x00, 0x00])

    var os = require('os');
    var devices = os.networkInterfaces();

    if(version.indexOf('2') > -1){
      // console.log('making message for v2')
      message = Buffer([0x02, 0x0a, 0x00, 0x00])
    }

    for (key in devices) {
      var ifaces = devices[key]

      for (i = 0; i < ifaces.length; i++) {

        intf = ifaces[i];

        if (
          intf.address.split('.').length !== 4 ||
          intf.prefixLength <= 20 || intf.address.indexOf('127.0.0.1') > -1
        ) {
          continue;
        }

        var block = new Netmask(intf.address, intf.netmask);

        block.forEach(function(ip, long, index) {
          if (ip != undefined) {
            socket.send(message, MCAST_PORT, ip)
          }
        })

      }
    }


  });

  if(version.indexOf('2') > -1){
    try{
      socket.bind(MCAST_PORT);
    }catch(e){
      // EADDRINUSE
    }
  } else {
    socket.bind(0);
  }

}

process.on('uncaughtException', function(){
  console.log("ERROR:")
  console.log("Couldn't open UDP ports properly, please make sure that the Ubiquity Discovery Tool (Chrome extension) is closed.")
})


module.exports['1'] = () => query('1')
module.exports['2'] = () => query('2')
module.exports.events = ee

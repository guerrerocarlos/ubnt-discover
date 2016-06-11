exports.parsePacket = function(info, packet) {
    packet = new Buffer(packet);

    var version = packet.slice(0, 1).readUInt8(0);
    var cmd = packet.slice(1, 2).readUInt8(0);
    var length = packet.slice(2, 4).readUInt16BE(0);

    if (length + 4 > packet.length) {
        //console.log('Packet reports invalid data length, discarding...');
        return;
    }

    if (version == 1 && cmd == 0 && length == 0) {
        // ignore ubnt-dp request
        return;
    }

    if (version == 1 && cmd == 0) {
        return parseV1Packet(packet);
    } else if (version == 2) {
        return parseV2Packet(info, cmd, packet);
    } else {
        // not supported
    }
}

function parseV1Packet (packet) {

    var PKT_V1_HWADDR = 0x01,
        PKT_V1_IPINFO = 0x02,
        PKT_V1_FWVERSION = 0x03,
        PKT_V1_USERNAME = 0x06,
        PKT_V1_SALT = 0x07,
        PKT_V1_RND_CHALLENGE = 0x08,
        PKT_V1_CHALLENGE = 0x09,
        PKT_V1_MODEL = 0x14,
        PKT_V1_UPTIME = 0x0A,
        PKT_V1_HOSTNAME = 0x0B,
        PKT_V1_PLATFORM = 0x0C,
        PKT_V1_ESSID = 0x0D,
        PKT_V1_WMODE = 0x0E,
        PKT_V1_WEBUI = 0x0F;

    var i,
        l,
        end,
        msg,
        type,
        piece;

    i = 4;
    l = 2;

    msg = {};
    msg.discovered_by = 1;

    end = packet.length;

    while (i < end) {

        type = packet.readUInt8(i++);
        piece = packet.slice(i, i + 2);
        l = piece.readUInt16BE(0);
        i += piece.length;

        piece = packet.slice(i, i + l);

        switch (type) {

            case PKT_V1_FWVERSION:
                msg.firmware = piece.toString();
                break;

            case PKT_V1_HOSTNAME:
                msg.hostname = piece.toString();
                break;

            case PKT_V1_PLATFORM:
                msg.platform = piece.toString();
                break;

            case PKT_V1_IPINFO:

                if (piece.length === 10) {
                    msg.mac = msg.mac || formatMacAddress(piece.slice(0, 6));
                    msg.ip = msg.ip || formatIPAddress(piece.slice(6, 10));
                }

               break;

            case PKT_V1_HWADDR:
                msg.mac = formatMacAddress(piece);
                break;

            case PKT_V1_WEBUI:

                if (piece.length === 4) {
                    piece = getIntValue(piece);
                    msg.webPort = piece & 0xFFFF;
                    msg.webProtocol = ((piece >> 16) & 0xFFFF) > 0 ? 'https' : 'http';
                }

                break;

            case PKT_V1_WMODE:

                if (piece.length === 4) {
                    msg.wmode = getIntValue(piece);

                    // this is unifi-video specific
                    // 0x101 || 0x102 means it has already gone through wizard
                    msg.isSetup = true;
                    if (msg.wmode === 0x100) {
                        msg.isSetup = false;
                    }
                }

                break;

            case PKT_V1_ESSID:
                msg.essid = piece.toString();
                break;

            case PKT_V1_MODEL:
                msg.model = piece.toString();
                break;

            default:
                break;

        }

        i += l;
    }

    return msg;
}

function parseV2Packet (info, cmd, packet) {

    var PKT_V2_HWADDR = 0x01,
        PKT_V2_IPINFO = 0x02,
        PKT_V2_FWVERSION = 0x03,
        PKT_V2_UPTIME = 0x0A,
        PKT_V2_HOSTNAME = 0x0B,
        PKT_V2_PLATFORM = 0x0C,
        PKT_V2_ESSID = 0x0D,
        PKT_V2_WMODE = 0x0E,
        PKT_V2_SEQ = 0x12,
        PKT_V2_SOURCE_MAC = 0x13,
        PKT_V2_MODEL = 0x15,
        PKT_V2_SHORT_VER = 0x16,
        PKT_V2_DEFAULT = 0x17,
        PKT_V2_LOCATING = 0x18,
        PKT_V2_DHCPC = 0x19,
        PKT_V2_DHCPC_BOUND = 0x1A,
        PKT_V2_REQ_FW = 0x1B,
        PKT_V2_SSHD_PORT = 0x1C;

    var i,
        l,
        end,
        msg,
        type,
        piece;

    i = 4;
    l = 2;

    msg = {};
    msg.discovered_by = 2;

    end = packet.length;

    if (cmd != 6 && cmd != 9 && cmd != 11)
        return;

    while (i < end) {

        type = packet.readUInt8(i++);
        piece = packet.slice(i, i + 2);
        l = piece.readUInt16BE(0);
        i += piece.length;

        piece = packet.slice(i, i + l);

        switch (type) {

            case PKT_V2_HWADDR:
                msg.mac = formatMacAddress(piece);
                break;

            case PKT_V2_IPINFO:

                if (piece.length === 10) {
                    msg.mac = msg.mac || formatMacAddress(piece.slice(0, 6));
                    msg.ip = msg.ip || formatIPAddress(piece.slice(6, 10));
                }

               break;

            case PKT_V2_FWVERSION:
                msg.firmware = piece.toString();
                break;

            case PKT_V2_UPTIME:
                // msg.uptime = getIntValue(piece);
                msg.uptime = 0;
                break;

            case PKT_V2_HOSTNAME:
                msg.hostname = piece.toString();
                break;

            case PKT_V2_PLATFORM:
                msg.platform = piece.toString();
                break;

            case PKT_V2_ESSID:
                msg.essid = piece.toString();
                break;

            case PKT_V2_WMODE:

                if (piece.length === 4) {
                    msg.wmode = getIntValue(piece);
                }

                break;

            case PKT_V2_SEQ:
                // msg.seq = getIntValue(piece);
                msg.seq = 0
                break;

            case PKT_V2_SOURCE_MAC:
                msg.src_mac = formatMacAddress(piece);
                break;

            case PKT_V2_MODEL:
                msg.model = piece.toString();
                break;

            case PKT_V2_SHORT_VER:
                msg.short_ver = piece.toString();
                break;

            case PKT_V2_DEFAULT:
                msg.is_default = piece.readUInt8(0) == 1;
                break;

            case PKT_V2_LOCATING:
                msg.is_locating = piece.readUInt8(0) == 1;
                break;

            case PKT_V2_DHCPC:
                msg.is_dhcpc = piece.readUInt8(0) == 1;
                break;

            case PKT_V2_DHCPC_BOUND:
                msg.is_dhcpc_bound = piece.readUInt8(0) == 1;
                break;

            case PKT_V2_REQ_FW:
                msg.req_fwversion = piece.toString();
                break;

            case PKT_V2_SSHD_PORT:
                msg.sshd_port = getIntValue(piece);
                break;

            default:
                break;

        }

        i += l;
    }

    if (cmd === 6) {
        msg.timestamp = Math.round(+new Date()/1000);
    }
    if (cmd == 11 && !msg.hasOwnProperty('sshd_port')) {
        // invoke sshd on UVP
        sendV2InvokeSshd(info);
        return;
    }
    msg.firmware = msg.firmware || msg.short_ver || '';
    msg.hostname = msg.hostname || '';
    return msg;
}

function formatMacAddress (buffer) {

    var i,
        tmp,
        mac;

    mac = '';

    for (i = 0; i < buffer.length; i ++) {

        tmp = buffer[i]

        if (tmp.length < 2) {
            tmp = '0' + tmp;
        }

        mac += tmp;
    }

    return mac.toUpperCase();
}

function formatIPAddress (buffer) {

    var i,
        a;

    a = [];

    for (i = 0; i < buffer.length; i ++) {
        a.push(buffer[i]);
    }

    return a.join('.');
}

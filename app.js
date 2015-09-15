var amqp = require('AMQP-boilerplate');
var Guid = require('guid');

var name = 'logger';
var DataManager = 'datamanager';

amqp.Initialize(name);

var log = function (severity , msg, stacktrace) {

    try {

        var msgToSend = {
            responceNeeded: false,
            type: 'logger',
            payload: {
              severity: severity
            },
            message: msg,
            service: name,
            date: new Date(),
            stacktrace: stacktrace
        };
        
        amqp.SendMessage(DataManager, msgToSend);
    } catch (e) {
        // ignore
    } 
    
}

var SendFailResponceBack = function (message, reason) {

    if (message.responceNeeded) {
        message.error = reason;
        message.responceNeeded = false;
        
        if (message.sender)
            amqp.SendMessage(message.sender, message);
    }
}

var ValidateRetrievePayload = function (message, payload) {
    
    return true;
}

var ValidateCreatePayload = function(message, payload) {
    
    var severity = payload.severity;
    if (!severity || (severity !== 'error' && severity !== 'warning' && severity !== 'info')) {
        
        log('warning', 'Message recieved from: ' + message.sender + ' with wrong severity: ' + severity);
        SendFailResponceBack(message, 'wrong severity, acceptable values: error, warning, info');
        return false;
    }
    
    if (!payload.service) {
        try {
            if (payload.service.trim() === '') {
                
                log('warning', 'Message recieved from: ' + message.sender + ' with wrong service name: ' + payload.service);
                SendFailResponceBack(message, 'empty or undefine service name');
                return false;
            }
                
        } catch (e) {
            
            log('warning', 'Message recieved from: ' + message.sender + ' with bad service name');
            SendFailResponceBack(message, 'service name should be string');
            return false;
        }
    }
    
    if (!payload.message) {
        try {
            if (payload.message.trim() === '') {
                
                log('warning', 'Message recieved from: ' + message.sender + ' with wrong message: ' + payload.message);
                SendFailResponceBack(message, 'empty or undefine message');
                return false;
            }
                
        } catch (e) {
            
            log('warning', 'Message recieved from: ' + message.sender + ' with bad message');
            SendFailResponceBack(message, 'message should be string');
            return false;
        }
    }
    
    return true;
}

var ValidatePayload = function (message) {

    var payload = message.payload;

    if (!payload) {

        log('warning', 'Message recieved from: ' + message.sender + ' with updefined payload.');
        SendFailResponceBack(message, 'payload is empty');
        return false;
    }

    if (message.action === 'create') {

        return ValidateCreatePayload(message, payload);
    }

    if (message.action === 'retrieve') {

        return ValidateRetrievePayload(message, payload);
    }
}


var ValidateIncommingMessage = function (message) {
    
    if (!message.type || message.type !== 'logger') {
        
        log('warning', 'Message recieved from: ' + message.sender + ' with unapproperiate type: ' + message.type);
        SendFailResponceBack(message, 'type of message is not logger, but recieved by logger');
        return false;
    }
    
    if (message.action !== 'create' && message.action !== 'retrieve') {

        log('warning', 'Message recieved from: ' + message.sender + ' with unapproperiate action: ' + message.action);
        SendFailResponceBack(message, 'logger only accepts create and retieve for action');
        return false;
    }

    return ValidatePayload(message);
}

amqp.CreateRequestQueue(name, function (message) {

    if (!ValidateIncommingMessage(message)) return;

    var sender = message.sender;
    var recieverMessageId = message.id;
    
    if (message.action === 'create') {

        console.log('createing log for ' + "---" + message.sender);
        message.responceNeeded = true;
        
        amqp.SendMessage(DataManager, message, function (res) {
            
            if (res.error !== 0) {

                var response = {
                    id: message.id,
                    responceNeeded: false,
                    error: res.error
                }

                // amqp.SendMessage(sender, response);
                // console.log(res.error);
            } else {
                res.id = recieverMessageId;
                res.responceNeeded = false;
                
                // amqp.SendMessage(sender, res);
                // console.log('okay' + res.payload);
            }
        });
    }

    if (message.action === 'retrieve') {

        console.log('Retrieving log for ' + "---" + message.sender);
        message.responceNeeded = true;
        
        amqp.SendMessage(DataManager, message, function (res) {            
            res.id = recieverMessageId;
            res.responceNeeded = false;
            amqp.SendMessage(sender, res);
        });
    }
    
});


/**
 * Created by John Catnach
 * Updated by John Catnach
 * Last Updated: 6/4/2017
 *
 * Setup instructions from below site:
 * http://2ality.com/2015/10/google-analytics-api.html
 *
 * Sends email alert if page vies of a particular page are greater than a specified value
 *
 * WINDOWS version that writes data to the event log
 */

'use strict';
var google = require('googleapis');
var analytics = google.analytics('v3');
const nodemailer = require('nodemailer');
var config = require('./config.json');
var EventLogger = require('node-windows').EventLogger;

var log = new EventLogger('SCL GA Checker');


//console.log(Date.now().toLocaleDateString() + ":    ");

// create reusable transporter object using the default SMTP transport
let poolConfig = {
    host: config.smtp.server,
    port: config.smtp.port,
    secure: false,
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
};

let transporter = nodemailer.createTransport(poolConfig);


//Set up the JWT Authentication token for google
var ga_key = require('./ga_credentials.json');

var jwtClient = new google.auth.JWT(
    ga_key.client_email,
    null,
    ga_key.private_key, ["https://www.googleapis.com/auth/analytics.readonly", "https://www.googleapis.com/auth/analytics"],
    null
);

//authorise the client
jwtClient.authorize(function(err, tokens) {
    if (err) {
        log.error(err);
        return;
    }
    var outage = 0;

    // Call the real time analytics API
    analytics.data.realtime.get({
        'auth': jwtClient,
        'ids': config.ga.ids,
        'metrics': config.ga.metrics,
        'dimensions': config.ga.dimensions,
        'sort': config.ga.sort,
        'filters': config.ga.filters,
    }, function(err, response) {
        if (err) {
            log.error(err);
            return;
        }
        log.info(JSON.stringify(response, null, 4));
        // Loop through each row and check for values
        var downinLast3Mins = 0;
        var downinLast10Mins = 0;
        var downinLast15Mins = 0;

        // Check there are some records
        if (typeof response.rows == 'undefined' || response.rows == null){
            log.info("No records returned so exit.");
            return;
        }
        // Loop through the records to check if the last 3 minutes contain data
        for (var i = 0; i < response.rows.length; i++) {
            var views = response.rows[i][1];
            // count how many of the first 5 minutes have had page views
            if (i < 3 && views > config.alert.triggerVolume) {
                downinLast3Mins++;
            }
            if (i < 10 && views > config.alert.triggerVolume) {
                downinLast10Mins++;
            }
            if (i < 15 && views > config.alert.triggerVolume) {
                downinLast15Mins++;
            }
        }

        // Now check which alert needs to be sent
        if (downinLast15Mins == 15) {
            log.warn('been down 15 minutes');
            outage = 15;
        } else if (downinLast10Mins == 10) {
            log.warn('been down 10 minutes');
            outage = 10;
        } else if (downinLast3Mins == 3) {
            log.warn('been down 3 minutes');
            outage = 3;
        }


        log.info('outage = ' + outage);
        if (outage > 0) {
            // verify connection configuration
            transporter.verify(function(error, success) {
                if (error) {
                    log.error(error);
                } else {
                    log.info('Email Server is ready to take our messages');
                }
            });

            // setup email data with unicode symbols
            let mailOptions = {
                from: config.smtp.from, // sender address
                to: config.smtp.to, // list of receivers
                subject: config.alert.subject + outage + ' minutes', // Subject line
                text: config.alert.body, // plain text body
                html: config.alert.body // html body
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return log.error(error);
                }
                log.info('Message %s sent: %s', info.messageId, info.response);
            });
        }
    });
});

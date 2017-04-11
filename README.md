# Real Time Alerts for Google Analytics.
This script performs the following:
- Call the Google Analytics Real Time API
- Perform a query defined in config that returns page hits
- checks if page hits are greater than a threshold in each of the last 3,10 and 15 minutes
- sends an email alert if the page views are higher than the threshold

#Installation
-Install [Node](https://nodejs.org/en/download/)
- run npm install within the project directory
- update the config.json file:
  ## SMTP Config
  - smtp.server: the SMTP server address
  - smtp.port: the SMTP port
  - smtp.from: the address to send the email from.  You can use "\"DISPLAY_NAME\" <EMAIL>"
  ## Google Analytics config
  The GA data can be tested using the [GA Test Harness](https://developers.google.com/apis-explorer/#p/analytics/v3/analytics.data.realtime.get)
  - ga.ids: the view ID of the GA view to query, should be preceeded by ga:
  - ga:metrics: A numeric metric to return which will be compared to the alert.triggerVolume
  - ga.dimensions: The dimensions to return
  - ga.sortorder: the sort order of data
  - ga.filters: any [filters](https://developers.google.com/analytics/devguides/reporting/core/v3/reference#filters) to apply 
  ## Alert config
  - alert.triggerVolume: The thereshold of events per minute (from ga.metrics) to trgger an alert
  - alert.subject: Alert email subject
  - alert.body: Alert email body text
  
- Set up a service account to access google analytics and save the json file as ga_credentials.json in the program directory.
  - For a simply guide to setting up access refere to [this post](http://2ality.com/2015/10/google-analytics-api.html) by @rauschma 
  
- If you are running on windows then you will also need to install the [node-windows library](https://github.com/coreybutler/node-windows) with the following commands:
  - npm install -g node-windows
  - npm link node-windows 
  
# Operation

### Windows
Once configured just run "node index_windows.js"

### Other
Once configured just run "node index.js"

# Enhancements
There are several, but a few.
 - add setInterval to run the check periodically
    - On windows node-windows has functionality to run as a service so this would be an ideal enhancement to the windows script
 - add additional alert end points eg:
    - Slack
    - SMS
    - JSON endpoint
 - improve error handling
  

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
  // Application Constructor
  initialize: function() {
    document.addEventListener(
      'deviceready',
      this.onDeviceReady.bind(this),
      false
    )
  },

  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady: function() {
    cordova.plugins.autoStart.enable()
    cordova.plugins.backgroundMode.enable()
    cordova.plugins.backgroundMode.excludeFromTaskList()

    this.initializeWebserver()

    window.open = cordova.InAppBrowser.open

    this.zeroconf = cordova.plugins.zeroconf

    // this.zeroconf.registerAddressFamily = 'ipv4' // or 'ipv6' ('any' by default)
    // this.zeroconf.watchAddressFamily = 'ipv4' // or 'ipv6' ('any' by default)

    networkinterface.getWiFiIPAddress(
      ipInformation => {
        this.zeroconf.register(
          '_thingsfactory._tcp.',
          'local.',
          'Hatiolab-things-factory-tv',
          80,
          {
            'ip-address': ipInformation.ip,
            uuid: device.uuid
          },
          result => {
            console.log('Service registered', result.service)
          }
        )
      },
      () => {
        this.zeroconf.stop()
      }
    )
  },

  initializeWebserver: function() {
    webserver.onRequest(request => {
      var path = request.path
      switch (path) {
        case '/screencast':
          var body = JSON.parse(request.body)
          var { access_token, url } = body

          if (access_token && url) {
            var urlObj = new URL(url)
            urlObj.searchParams.append('token', access_token)
            urlObj.searchParams.append('fullbleed', 'Y')
            this.openIAB(urlObj.toString())

            this.lastServiceData = { access_token, url }
          }

          break
      }

      webserver.sendResponse(request.requestId, {
        status: 200,
        body: JSON.stringify({
          success: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    webserver.start()
  },

  openIAB: function(url) {
    if (this.iab) {
      this.iab.executeScript({
        code: `window.location.href = "${url}"`
      })
    } else {
      this.onExit = () => {
        if (this.iab) {
          this.iab.removeEventListener('exit', this.onExit)
          this.iab = null
          this.onExit = null
        }
      }

      this.iab = cordova.InAppBrowser.open(url, '_self', 'location=no,zoom=no')
      this.iab.addEventListener('exit', this.onExit)
    }
  }
}

app.initialize()

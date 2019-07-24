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
    this.receivedEvent('deviceready')

    cordova.plugins.autoStart.enable()
    cordova.plugins.backgroundMode.enable()
    cordova.plugins.backgroundMode.excludeFromTaskList()

    window.open = cordova.InAppBrowser.open

    var parentElement = document.getElementById('m-dns')
    var ipAddressElement = parentElement.querySelector('.ip-address')

    this.zeroconf = cordova.plugins.zeroconf

    this.zeroconf.registerAddressFamily = 'ipv4' // or 'ipv6' ('any' by default)
    this.zeroconf.watchAddressFamily = 'ipv4' // or 'ipv6' ('any' by default)

    networkinterface.getWiFiIPAddress(
      ipInformation => {
        ipAddressElement.textContent = ipInformation.ip

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

            this.startWatch(ipInformation.ip)
          }
        )
      },
      () => {
        ipAddressElement.textContent = 'No WIFI'
        this.zeroconf.stop()
      }
    )

    // this.zeroconf.registerAddressFamily = 'ipv4' // or 'ipv6' ('any' by default)
    // this.zeroconf.watchAddressFamily = 'ipv4' // or 'ipv6' ('any' by default)

    // // watch for services of a specified type
    // this.zeroconf.watch('_thingsfactory._tcp.', 'local.', result => {
    //   var action = result.action
    //   var service = result.service
    //   if (action == 'added') {
    //     console.log('service added', service)
    //   } else if (action == 'resolved') {
    //     console.log('service resolved', service)
    //     /* service : {
    //     'domain' : 'local.',
    //     'type' : '_http._tcp.',
    //     'name': 'Becvert\'s iPad',
    //     'port' : 80,
    //     'hostname' : 'ipad-of-becvert.local',
    //     'ipv4Addresses' : [ '192.168.1.125' ],
    //     'ipv6Addresses' : [ '2001:0:5ef5:79fb:10cb:1dbf:3f57:feb0' ],
    //     'txtRecord' : {
    //         'foo' : 'bar'
    //     } */
    //   } else {
    //     console.log('service removed', service)
    //   }
    // })

    // publish a zeroconf service of your own
    // this.zeroconf.register(

    // unregister your service
    // this.zeroconf.unregister('_http._tcp.', 'local.', "Becvert's iPad")
  },

  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id)
    var listeningElement = parentElement.querySelector('.listening')
    var receivedElement = parentElement.querySelector('.received')

    listeningElement.setAttribute('style', 'display:none;')
    receivedElement.setAttribute('style', 'display:block;')

    console.log('Received Event: ' + id)
  },

  startWatch: function(ipAddress) {
    // watch for services of a specified type
    this.zeroconf.watch(
      `_${ipAddress.replace(/\./g, '')}._udp.`,
      'local.',
      result => {
        var action = result.action
        var service = result.service
        if (action == 'added') {
          var parentElement = document.getElementById('m-dns')
          var statusElement = parentElement.querySelector('.status')
          statusElement.textContent = action
          var serviceInfoElement = parentElement.querySelector('.service-info')
          serviceInfoElement.textContent = JSON.stringify(service, null, '\n')
        } else if (action == 'resolved') {
          var parentElement = document.getElementById('m-dns')
          var statusElement = parentElement.querySelector('.status')
          statusElement.textContent = action
          var serviceInfoElement = parentElement.querySelector('.service-info')
          serviceInfoElement.textContent = JSON.stringify(service, null, '\n')
          console.log('service resolved', service)

          if (service.port == 1008 && service.txtRecord) {
            var data = service.txtRecord
            var { ta, tb, tc, url } = data

            if (
              this.lastServiceData &&
              ta == this.lastServiceData.ta &&
              tb == this.lastServiceData.tb &&
              tc == this.lastServiceData.tc &&
              url == this.lastServiceData.url
            )
              return

            if (ta && tb && tc && url) {
              var urlObj = new URL(url)
              urlObj.searchParams.append('token', `${ta}.${tb}.${tc}`)
              this.iab = cordova.InAppBrowser.open(
                urlObj.toString(),
                '_self',
                'location=no,zoom=no'
              )

              this.lastServiceData = { ta, tb, tc, url }
            }
          }
          /* service : {
        'domain' : 'local.',
        'type' : '_http._tcp.',
        'name': 'Becvert\'s iPad',
        'port' : 80,
        'hostname' : 'ipad-of-becvert.local',
        'ipv4Addresses' : [ '192.168.1.125' ],
        'ipv6Addresses' : [ '2001:0:5ef5:79fb:10cb:1dbf:3f57:feb0' ],
        'txtRecord' : {
            'foo' : 'bar'
        } */
        } else {
          var parentElement = document.getElementById('m-dns')
          var statusElement = parentElement.querySelector('.status')
          statusElement.textContent = action
          var serviceInfoElement = parentElement.querySelector('.service-info')
          serviceInfoElement.textContent = JSON.stringify(service, null, '\n')
          console.log('service removed', service)
        }
      }
    )
  }
}

app.initialize()

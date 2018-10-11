const Promise = require('bluebird');
const exec = require('child_process').exec;
const execAsync = Promise.promisify(exec);
const plist = require('plist');
const xmlJs = require('xml-js');
const csv = require("fast-csv");
const REMOVABLE_DISK_DRIVE_TYPE = 2;

module.exports = {
    async getUSBStorageDevices() {
        try {
          let results = await execAsync('wmic logicaldisk get caption,freespace,volumename,size,drivetype /format:csv', {timeout: 3000});
          let returnUSBDevicesArray = [];
          let headersObect;

          return new Promise((resolve, reject) => {
            csv.fromString(results, {headers: true, ignoreEmpty: true})
            .on("data", function(data){
              if(!headersObect){
                headersObect = {};
                for(let i=0; i<data.length;i++){
                  headersObect[data[i]] = i;
                }
              }else{
                let currentUSBDeviceItem = {};

                let driveTypePosition = headersObect['DriveType'];
                if(parseInt(data[driveTypePosition]) !== REMOVABLE_DISK_DRIVE_TYPE){
                  return;
                }

                let freeSpacePosition = headersObect['FreeSpace'];
                let sizePosition = headersObect['Size'];
                let volumeNamePosition = headersObect['VolumeName'];

                currentUSBDeviceItem.freeInBytes = parseInt(data[freeSpacePosition]);
                currentUSBDeviceItem.totalInBytes = parseInt(data[sizePosition]);
                currentUSBDeviceItem.mountpoint = data[volumeNamePosition];

                returnUSBDevicesArray.push(currentUSBDeviceItem);
              }

            })
            .on("end", function(){
              resolve(returnUSBDevicesArray);
            });

          });

        } catch (err) {
          console.log(err);
        }
    },

    //'drutil status -xml'
    //'system_profiler SPDiscBurningDataType -xml'
    async getDiscDrives() {
        try {
          return [];
        } catch (err) {
          console.log(err);
        }
    }
};

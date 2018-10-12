const Promise = require('bluebird');
const exec = require('child_process').exec;
const execAsync = Promise.promisify(exec);
const plist = require('plist');
const xmlJs = require('xml-js');

function _getVolumes(array) {
    return array.filter(object => object.volumes).map(object => object.volumes)
}

function _getMedia(array) {
    return array.filter(object => object.Media).map(object => object.Media);
}

function _getItems(array) {
    return array.filter(object => object._items).map(object => object._items);
}

//A Map is used and returned because there can be duplicate volumes
function _runThroughArrayToGetUSBStorageDevices(array) {
    let usbDevices = new Map();
    _getVolumes(array).forEach((volumes) => {
        volumes.forEach((volume) => {
            if (!volume.hasOwnProperty('optical_media_type') && volume.mount_point) {
                usbDevices.set(volume.mount_point, {
                    freeInBytes: volume.free_space_in_bytes,
                    totalInBytes: volume.free_space_in_bytes + volume.size_in_bytes,
                    mountpoint: volume.mount_point,
                });
            }
        });
    });

    _getItems(array).concat(_getMedia(array)).forEach((items) => {
        let itemsResults = _runThroughArrayToGetUSBStorageDevices(items);
        usbDevices = new Map([...usbDevices, ...itemsResults]);
    });
    
    return usbDevices;
}

function _convertBlocksToBytes(blocks){
  return blocks * 2048;
}

module.exports = {
    //'system_profiler SPUSBDataType -xml'
    async getUSBStorageDevices() {
        try {
            let results = await execAsync('system_profiler SPUSBDataType -xml', {timeout: 3000});
            let json = plist.parse(results);
            let map = _runThroughArrayToGetUSBStorageDevices(json);
            return Array.from(map.values());
        } catch (err) {
            console.log(err);
        }
    },

    //'drutil status -xml'
    //'system_profiler SPDiscBurningDataType -xml'
    async getDiscDrives() {
        try {
            let results = await execAsync('drutil status -xml', {timeout: 3000});
            let json = xmlJs.xml2js(results, {compact: true});
            let returnDiscDrivesArray = [];
            if(!json.statusdoc.statusfordevice){
              return [];
            }

            let statusForDeviceArray;
            if(json.statusdoc.statusfordevice.length){
              statusForDeviceArray = json.statusdoc.statusfordevice;
            }else{
              statusForDeviceArray = [json.statusdoc.statusfordevice];
            }
            statusForDeviceArray.forEach((statusForDevice) => {
              let name = statusForDevice.device._attributes.name;
              let deviceStatus = statusForDevice.deviceStatus;

              let currentDiscDriveItem = {};
              if(deviceStatus.mediaIsPresent){
                currentDiscDriveItem.isMediaInDrive = true;
                let mediaInfo = deviceStatus.mediaInfo;

                currentDiscDriveItem.isWritable = !!mediaInfo.appendable;
                currentDiscDriveItem.isLiveFileSystem = !!(mediaInfo.appendable && !mediaInfo.overwritable);

                let freeBlocks = parseInt(deviceStatus.mediaInfo.freeSpace._attributes.blockCount);
                let usedBlocks = parseInt(deviceStatus.mediaInfo.usedSpace._attributes.blockCount);

                let freeInBytes = _convertBlocksToBytes(freeBlocks);
                let usedInBytes = _convertBlocksToBytes(usedBlocks);

                currentDiscDriveItem.freeInBytes = freeInBytes;
                currentDiscDriveItem.totalInBytes = freeInBytes + usedInBytes;

              }else{
                currentDiscDriveItem.isMediaInDrive = false;
              }

              currentDiscDriveItem.drivename = name;

              returnDiscDrivesArray.push(currentDiscDriveItem);

            });
            return returnDiscDrivesArray;
        } catch (err) {
          console.log(err);
        }
    }
};

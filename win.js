const Promise = require('bluebird');
const exec = require('child_process').exec;
const execAsync = Promise.promisify(exec);
const plist = require('plist');
const xmlJs = require('xml-js');
const REMOVABLE_DISK_DRIVE_TYPE = 2;
const COMPACT_DISC_DRIVE_TYPE = 5;
const MEDIA_LOADED_TYPES = {
  MEDIA_NOT_IN_DRIVE: 1,
  MEDIA_IN_DRIVE:2,
  UNABLE_TO_DETERMINE: 3
}
const WMIC_TIMEOUT_IN_MS = 7000;

function _csvJSON(csv){

  var lines=csv.trim().split('\n');

  var result = [];

  var headers=lines[0].split(',').map((headerItem) => {
    return headerItem.trim();
  });

  lines.splice(0, 1);
  lines.forEach(function(line) {
    var obj = {};
    var currentline = line.split(',');
    headers.forEach(function(header, i) {
      obj[header] = currentline[i];
    });
    result.push(obj);
  });

  return result;
}

async function _getIsMediaLoadedForLogicalDiskName(findName){
  let results = await execAsync('wmic CDROM get drive,medialoaded /format:csv', {timeout: WMIC_TIMEOUT_IN_MS});
  let resultsArray = _csvJSON(results);
  let returnResult = resultsArray.find((currentResult) => {
    return findName === currentResult['Drive'];
  });

  if(returnResult){
    return returnResult['MediaLoaded'] === 'TRUE' ? MEDIA_LOADED_TYPES.MEDIA_IN_DRIVE : MEDIA_LOADED_TYPES.MEDIA_NOT_IN_DRIVE;
  }else{
    return MEDIA_LOADED_TYPES.UNABLE_TO_DETERMINE;
  }
}

module.exports = {

    async getUSBStorageDevices() {
      let results = await execAsync('wmic logicaldisk get caption,freespace,size,drivetype /format:csv', {timeout: WMIC_TIMEOUT_IN_MS});
      let resultsArray = _csvJSON(results);
      let returnUSBDevicesArray = [];

      resultsArray.forEach((currentResult) => {

        if(parseInt(currentResult['DriveType']) !== REMOVABLE_DISK_DRIVE_TYPE){
          return;
        }

        let currentUSBDeviceItem = {};
        currentUSBDeviceItem.freeInBytes = parseInt(currentResult['FreeSpace']);
        currentUSBDeviceItem.totalInBytes = parseInt(currentResult['Size']);
        currentUSBDeviceItem.mountpoint = currentResult['Caption'];

        returnUSBDevicesArray.push(currentUSBDeviceItem);

      });

      return returnUSBDevicesArray;
    },

    async getDiscDrives() {
      let results = await execAsync('wmic logicaldisk get caption,freespace,size,drivetype /format:csv', {timeout: WMIC_TIMEOUT_IN_MS});
      let resultsArray = _csvJSON(results);
      let returnDiscDrivesArray = [];

      for(let currentResult of resultsArray){
        if(parseInt(currentResult['DriveType']) === COMPACT_DISC_DRIVE_TYPE){
          let currentUSBDeviceItem = {};
          let isMediaLoaded = await _getIsMediaLoadedForLogicalDiskName(currentResult['Caption']);
          if(isMediaLoaded === MEDIA_LOADED_TYPES.MEDIA_IN_DRIVE){
            currentUSBDeviceItem.isMediaInDrive = true;

            if(currentResult['FreeSpace'] === ''){
              currentUSBDeviceItem.isWritable = true;
              currentUSBDeviceItem.isLiveFileSystem = false;
            }else{
              let freeSpaceInBytes = parseInt(currentResult['FreeSpace']);
              let totalSpaceInBytes = parseInt(currentResult['Size']);
              currentUSBDeviceItem.freeInBytes = freeSpaceInBytes;
              currentUSBDeviceItem.totalInBytes = totalSpaceInBytes;

              if(freeSpaceInBytes > 0){
                currentUSBDeviceItem.isWritable = true;
                currentUSBDeviceItem.isLiveFileSystem = true;

              }else{
                currentUSBDeviceItem.isWritable = false;
                currentUSBDeviceItem.isLiveFileSystem = false; // we are assuming if there is no more freeSpaceInBytes then it is not a live file system
              }

            }


          }else if(isMediaLoaded === MEDIA_LOADED_TYPES.MEDIA_NOT_IN_DRIVE){
            currentUSBDeviceItem.isMediaInDrive = false;
          }else{
            currentUSBDeviceItem.isMediaInDrive = false;
            currentUSBDeviceItem.isMediaInDriveError = true;
          }

          currentUSBDeviceItem.mountpoint = currentResult['Caption'];

          returnDiscDrivesArray.push(currentUSBDeviceItem);
        }
      }

      return returnDiscDrivesArray;
    }
};

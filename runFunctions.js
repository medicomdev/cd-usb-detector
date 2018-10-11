const cdUsbDetector = require('./index');



const start = async function() {
  
  let usbResults = await cdUsbDetector.getUSBStorageDevices();
  console.log('getUSBStorageDevices: ' + JSON.stringify(usbResults));
  
  let discDriveResults = await cdUsbDetector.getDiscDrives();
  console.log('getDiscDrives: ' + JSON.stringify(discDriveResults));
  
}

start();
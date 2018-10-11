const Promise = require('bluebird');
const exec = require('child_process').exec;
const execAsync = Promise.promisify(exec);
const plist = require('plist');
const xml = require('xml-js');

function getVolumes(array) {
    return array.filter(object => object.volumes).map(object => object.volumes)
}

function getMedia(array) {
    return array.filter(object => object.Media).map(object => object.Media);
}

function getItems(array) {
    return array.filter(object => !!object._items).map(object => object._items);
}

function runThroughArrayToGetUSBStorageDevices(array) {
    let usbDevices = [];
    getMedia(array).forEach((mediaArray) => {
        getVolumes(mediaArray).forEach((volumes) => {
            volumes.forEach((volume) => {
                if (!volume.hasOwnProperty('optical_media_type')) {
                    usbDevices.push({
                        freeInBytes: volume.free_space_in_bytes,
                        totalInBytes: volume.free_space_in_bytes + volume.size_in_bytes,
                        mountpoint: volume.mount_point,
                    });
                }
            });
        });
    });
    getItems(array).forEach((items) => {
        let itemsResults = runThroughArrayToGetUSBStorageDevices(items);
        usbDevices = usbDevices.concat(itemsResults);
    });
    return usbDevices;
}

module.exports = {
    //'system_profiler SPUSBDataType -xml'
    async getUSBStorageDevices() {
        try {
            let results = await execAsync('system_profiler SPUSBDataType -xml', {timeout: 2000});
            let json = plist.parse(results);
            return runThroughArrayToGetUSBStorageDevices(json);
        } catch (err) {
            console.log(err);
        }
    },

    //'drutil status -xml'
    async getDiscDrives() {
        try {
            let results = await execAsync('drutil status -xml', {timeout: 2000});
            return results;
        } catch (err) {

        }
    }
};
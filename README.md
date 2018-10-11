**getUSBStorageDevices**  
```javascript
returns [{
    freeInBytes,
    totalInBytes,
    mountpoint,
}]
```


**getDiscDrives**

```javascript
returns [{
    isMediaInDrive,
    isWritable,
    isLiveFileSystem,
    freeInBytes, /*Does not return on windows for an unburned CD/DVD (not live file system)*/
    totalInBytes, /*Does not return on windows for an unburned CD/DVD (not live file system)*/
    mountpoint, /*only returns on windows*/
    drivename, /*only returns on mac*/
    isMediaInDriveError /*Returns on windows if MediaInDrive was unable to be detected (isMediaInDrive returns false in this case)*/
}]
```

**Try it out**
Run "node runFunctions" to see the results of the above functions
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
    freeInBytes,
    totalInBytes,
    mountpoint, /*only returns on windows*/
    drivename /*only returns on mac*/
}]
```

**Try it out**
Run "node runFunctions" to see the results of the above functions
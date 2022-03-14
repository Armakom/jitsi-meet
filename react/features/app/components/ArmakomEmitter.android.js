import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

let nativeEmitter = undefined;
if(NativeModules.RNJitsiMeetModule) {
    console.log('Armakom android nativeEmitter 1');
    nativeEmitter = new NativeEventEmitter(NativeModules.RNJitsiMeetModule);
} else {
    console.log('Armakom android nativeEmitter 2');
}

export default nativeEmitter;
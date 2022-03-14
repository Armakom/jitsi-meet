import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

let nativeEmitter = undefined;
if(Platform.OS === 'ios' && NativeModules.RNCallKit) {
    console.log('Armakom ios nativeEmitter 1');
    nativeEmitter = new NativeEventEmitter(NativeModules.RNCallKit);
    console.log('Armakom ios nativeEmitter 2');
} else {
    console.log('Armakom ios nativeEmitter 3');
}

export default nativeEmitter;
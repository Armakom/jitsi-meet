// @flow

import React, { Fragment } from 'react';

import { BaseApp } from '../../base/app';
import { toURLString } from '../../base/util';
import { OverlayContainer } from '../../overlay';
import { appNavigate } from '../actions';
import { getDefaultURL } from '../functions';

import logger from '../logger';

import { jitsiLocalStorage } from '@jitsi/js-utils'

/**
 * The type of React {@code Component} props of {@link AbstractApp}.
 */
export type Props = {

    /**
     * XXX Refer to the implementation of loadURLObject: in
     * ios/sdk/src/JitsiMeetView.m for further information.
     */
    timestamp: any,

    /**
     * The URL, if any, with which the app was launched.
     */
    url: Object | string
};

/**
 * Base (abstract) class for main App component.
 *
 * @abstract
 */
export class AbstractApp extends BaseApp<Props, *> {
    _init: Promise<*>;

    /**
     * Initializes the app.
     *
     * @inheritdoc
     */
    componentDidMount() {
        super.componentDidMount();

        this._init.then(() => {
            logger.info('armakom-log AbsctractApp componentDidMount this.props:', this.props);
            this.setRoomInfo(this.props.userInfo);
            // If a URL was explicitly specified to this React Component, then
            // open it; otherwise, use a default.
            this._openURL(toURLString(this.props.url) || this._getDefaultURL());
        });
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
        const previousUrl = toURLString(prevProps.url);
        const currentUrl = toURLString(this.props.url);
        const previousTimestamp = prevProps.timestamp;
        const currentTimestamp = this.props.timestamp;

        this._init.then(() => {
            // Deal with URL changes.

            if (previousUrl !== currentUrl

                    // XXX Refer to the implementation of loadURLObject: in
                    // ios/sdk/src/JitsiMeetView.m for further information.
                    || previousTimestamp !== currentTimestamp) {
                logger.info('armakom-log AbstractApp componentDidUpdate this.props:', this.props);
                this.setRoomInfo(this.props.userInfo);
                this._openURL(currentUrl || this._getDefaultURL());
            }
        });
    }

    /**
     * Creates an extra {@link ReactElement}s to be added (unconditionally)
     * alongside the main element.
     *
     * @abstract
     * @protected
     * @returns {ReactElement}
     */
    _createExtraElement() {
        return (
            <Fragment>
                <OverlayContainer />
            </Fragment>
        );
    }

    _createMainElement: (React$Element<*>, Object) => ?React$Element<*>;

    /**
     * Gets the default URL to be opened when this {@code App} mounts.
     *
     * @protected
     * @returns {string} The default URL to be opened when this {@code App}
     * mounts.
     */
    _getDefaultURL() {
        return getDefaultURL(this.state.store);
    }

    /**
     * Navigates this {@code AbstractApp} to (i.e. Opens) a specific URL.
     *
     * @param {Object|string} url - The URL to navigate this {@code AbstractApp}
     * to (i.e. The URL to open).
     * @protected
     * @returns {void}
     */
    _openURL(url) {
        this.state.store.dispatch(appNavigate(toURLString(url)));
    }

    /**
     * MARK - Armakom
     * 
     * Every room has a room id and password. 
     * Therefore below parameters stored inside local storage to use when joining conference
     */
    setRoomInfo(userInfo) {
        try {
            jitsiLocalStorage.setItem('armakom-jwt', userInfo.jwt);
            jitsiLocalStorage.setItem('armakom-user', userInfo.userRoomId);
            logger.info('armakom-log userRoomId:', userInfo.userRoomId);
            jitsiLocalStorage.setItem('armakom-pass', userInfo.userRoomPassword);
            logger.info('armakom-log userRoomPassword:', userInfo.userRoomPassword);
        } catch(error) {
            logger.info('armakom-log Jitsi Local Storage Error occurred when saving room props. Error: ' + error);
        }
    }
}

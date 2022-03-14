// @flow
import _ from 'lodash';

import { PREJOIN_INITIALIZED } from '../../prejoin/actionTypes';
import { setPrejoinPageVisibility } from '../../prejoin/actions';
import { APP_WILL_MOUNT } from '../app';
import { setAudioOnly } from '../audio-only';
import { SET_LOCATION_URL } from '../connection/actionTypes'; // minimize imports to avoid circular imports
import { getJwtName } from '../jwt/functions';
import { getLocalParticipant, participantUpdated } from '../participants';
import { MiddlewareRegistry } from '../redux';
import { parseURLParams } from '../util';

import { SETTINGS_UPDATED } from './actionTypes';
import { updateSettings } from './actions';
import { handleCallIntegrationChange, handleCrashReportingChange } from './functions';

import logger from './logger';

/**
 * The middleware of the feature base/settings. Distributes changes to the state
 * of base/settings to the states of other features computed from the state of
 * base/settings.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case APP_WILL_MOUNT:
        logger.info('armakom-log [settings-middleware] APP_WILL_MOUNT');
        _initializeCallIntegration(store);
        _initializeShowPrejoin(store);
        break;
    case PREJOIN_INITIALIZED: {
        logger.info('armakom-log [settings-middleware] PREJOIN_INITIALIZED');
        _maybeUpdateDisplayName(store);
        break;
    }
    case SETTINGS_UPDATED:
        logger.info('armakom-log [settings-middleware] SETTINGS_UPDATED');
        _maybeHandleCallIntegrationChange(action);
        _maybeSetAudioOnly(store, action);
        _updateLocalParticipant(store, action);
        _maybeCrashReportingChange(action);
        break;
    case SET_LOCATION_URL:
        logger.info('armakom-log [settings-middleware] SET_LOCATION_URL');
        _updateLocalParticipantFromUrl(store);
        break;
    }

    return result;
});

/**
 * Overwrites the showPrejoin flag based on cached used selection for showing prejoin screen.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _initializeShowPrejoin({ dispatch, getState }) {
    const { userSelectedSkipPrejoin } = getState()['features/base/settings'];

    logger.info('armakom-log [settings-middleware] userSelectedSkipPrejoin:', userSelectedSkipPrejoin);
    if (userSelectedSkipPrejoin) {
        dispatch(setPrejoinPageVisibility(false));
    }
}

/**
 * Initializes the audio device handler based on the `disableCallIntegration` setting.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _initializeCallIntegration({ getState }) {
    const { disableCallIntegration } = getState()['features/base/settings'];

    logger.info('armakom-log [settings-middleware] disableCallIntegration:', disableCallIntegration);
    if (typeof disableCallIntegration === 'boolean') {
        handleCallIntegrationChange(disableCallIntegration);
    }
}

/**
 * Maps the settings field names to participant names where they don't match.
 * Currently there is only one such field, but may be extended in the future.
 *
 * @private
 * @param {string} settingsField - The name of the settings field to map.
 * @returns {string}
 */
function _mapSettingsFieldToParticipant(settingsField) {
    switch (settingsField) {
    case 'displayName':
        return 'name';
    }

    logger.info('armakom-log [settings-middleware] _mapSettingsFieldToParticipant');
    return settingsField;
}

/**
 * Handles a change in the `disableCallIntegration` setting.
 *
 * @param {Object} action - The redux action.
 * @private
 * @returns {void}
 */
function _maybeHandleCallIntegrationChange({ settings: { disableCallIntegration } }) {
    if (typeof disableCallIntegration === 'boolean') {
        logger.info('armakom-log [settings-middleware] _maybeHandleCallIntegrationChange disableCallIntegration:', disableCallIntegration);
        handleCallIntegrationChange(disableCallIntegration);
    }
}

/**
 * Handles a change in the `disableCrashReporting` setting.
 *
 * @param {Object} action - The redux action.
 * @private
 * @returns {void}
 */
function _maybeCrashReportingChange({ settings: { disableCrashReporting } }) {
    if (typeof disableCrashReporting === 'boolean') {
        logger.info('armakom-log [settings-middleware] _maybeCrashReportingChange disableCrashReporting:', disableCrashReporting);
        handleCrashReportingChange(disableCrashReporting);
    }
}

/**
 * Updates {@code startAudioOnly} flag if it's updated in the settings.
 *
 * @param {Store} store - The redux store.
 * @param {Object} action - The redux action.
 * @private
 * @returns {void}
 */
function _maybeSetAudioOnly(
        { dispatch },
        { settings: { startAudioOnly } }) {
    if (typeof startAudioOnly === 'boolean') {
        logger.info('armakom-log [settings-middleware] _maybeSetAudioOnly startAudioOnly:', startAudioOnly);
        dispatch(setAudioOnly(startAudioOnly));
    }
}

/**
 * Updates the display name to the one in JWT if there is one.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _maybeUpdateDisplayName({ dispatch, getState }) {
    const state = getState();
    const hasJwt = Boolean(state['features/base/jwt'].jwt);
    logger.info('armakom-log [settings-middleware] _maybeUpdateDisplayName hasJwt:', hasJwt);
    if (hasJwt) {
        const displayName = getJwtName(state);

        if (displayName) {
            dispatch(updateSettings({
                displayName
            }));
        }
    }
}

/**
 * Updates the local participant according to settings changes.
 *
 * @param {Store} store - The redux store.
 * @param {Object} action - The dispatched action.
 * @private
 * @returns {void}
 */
function _updateLocalParticipant({ dispatch, getState }, action) {
    const { settings } = action;
    const localParticipant = getLocalParticipant(getState());
    const newLocalParticipant = {
        ...localParticipant
    };

    for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
            newLocalParticipant[_mapSettingsFieldToParticipant(key)]
                = settings[key];
        }
    }

    logger.info('armakom-log [settings-middleware] _updateLocalParticipant newLocalParticipant:', JSON.stringify(newLocalParticipant));
    dispatch(participantUpdated(newLocalParticipant));
}


/**
 * Returns the userInfo set in the URL.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _updateLocalParticipantFromUrl({ dispatch, getState }) {
    const urlParams
        = parseURLParams(getState()['features/base/connection'].locationURL);
    logger.info('armakom-log [settings-middleware] _updateLocalParticipantFromUrl urlParams:', JSON.stringify(urlParams));
    const urlEmail = urlParams['userInfo.email'];
    const urlDisplayName = urlParams['userInfo.displayName'];
    logger.info('armakom-log [settings-middleware] _updateLocalParticipantFromUrl urlEmail:', urlEmail, ' - urlDisplayName:', urlDisplayName);

    if (!urlEmail && !urlDisplayName) {
        logger.info('armakom-log [settings-middleware] _updateLocalParticipantFromUrl return');
        return;
    }

    const localParticipant = getLocalParticipant(getState());
    logger.info('armakom-log [settings-middleware] _updateLocalParticipantFromUrl 1 localParticipant:', JSON.stringify(localParticipant));

    if (localParticipant) {
        const displayName = _.escape(urlDisplayName);
        const email = _.escape(urlEmail);

        dispatch(participantUpdated({
            ...localParticipant,
            email,
            name: displayName
        }));

        dispatch(updateSettings({
            displayName,
            email
        }));
        logger.info('armakom-log [settings-middleware] _updateLocalParticipantFromUrl 2');
    }
}

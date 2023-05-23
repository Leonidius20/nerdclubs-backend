import crypto from 'crypto';
import { dbPool } from '../services/db.service.js';
import { fido2 } from '../services/fido2.service.js';
import { encode, decode } from 'base64-arraybuffer';
import { webauthnClientOrigin } from '../app.js';

export default {
    get,
    create,
    //update,
    //remove
};

// get challenge for webauthn registration and also save it in db
async function get(req, res) {
    const user_id = req.user.user_id;
    const username = req.user.username;

    // get webauthn user id from db
    // todo add error handling
    const result = await dbPool.query('select webauthn_user_id from users where user_id = $1', [user_id]);
    const webauthn_user_id_encoded = result.rows[0].webauthn_user_id;

    const options = await fido2.attestationOptions();

    // userId should be a base64 encoded string
    
    options.user = {
        id: webauthn_user_id_encoded,
        name: username,
        displayName: username,
    };

    const encoded = {
        ...options,
        challenge: encode(options.challenge),
    };
    
    try {
        await dbPool.query('update users set webauthn_challenge = $1 where user_id = $2', [encoded.challenge, user_id]);

        res.json(encoded);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 1, message: 'Internal server error'});
        return;
    }
}

async function create(req, res) {
    const user_id = req.user.user_id;

    // get challenge from db
    try {
        const result = await dbPool.query('select webauthn_challenge from users where user_id = $1', [user_id]);
        const challenge = result.rows[0].webauthn_challenge;
        if (!challenge) {
            res.status(400).json({error: 1, message: 'No challenge found'});
            return;
        }

        const attestationEncoded = req.body.attestation;

        // validate attestation response
        const attestation = {
            ...attestationEncoded,
            rawId: decode(attestationEncoded.rawId),
        };

        const validationResult = await fido2.attestationResult(attestation, {
            challenge: decode(challenge),
            origin: webauthnClientOrigin,
            factor: 'either',
            // rpId?
        });


        const decodedCredId = validationResult.clientData.get('rawId');
        const pemKey = validationResult.authnrData.get('credentialPublicKeyPem');
        const encodedCredId = encode(decodedCredId);

        // save credential id and public key in db
        await dbPool.query('update users set webauthn_credential_id = $1, webauthn_public_key = $2 where user_id = $3', [encodedCredId, pemKey, user_id]);

        res.json({success: 1});
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 1, message: 'Internal server error'});
        return;
    }
}

    
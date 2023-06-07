import { fido2 } from '../services/fido2.service.js';
import { encode, decode } from 'base64-arraybuffer';
import { jwtSecret, webauthnClientOrigin } from '../app.js';
import jwt from 'jsonwebtoken';
import { dbPool } from '../services/db.service.js';
import firstRowOrThrow from '../utils/firstRowOrThrow.js';


export default {
    get,
    create,
    //update,
    //remove
};

async function get(req, res) {
    const options = await fido2.assertionOptions();

    const encoded = {
        ...options,
        challenge: encode(options.challenge),
    };

    res.json({ options: encoded });
}

async function create(req, res, next) {
    // get objToSend from client
    const objToSend = req.body;
    const challenge = decode(objToSend.challenge);
    const encodedCredential = objToSend.credential;

    const decodedCredential = {
        ...encodedCredential,
        rawId: decode(encodedCredential.rawId),
        response: {
            ...encodedCredential.response,
            authenticatorData: decode(encodedCredential.response.authenticatorData),
            userHandle: decode(encodedCredential.response.userHandle),
            clientDataJSON: decode(encodedCredential.response.clientDataJSON),
            signature: decode(encodedCredential.response.signature),
        }
    };

    const encodedUserHandle = encodedCredential.response.userHandle;

    try {
        // get user id, username and public key from db by user handle (webauthn user id)
        const result = await dbPool.query('select user_id, username, webauthn_public_key, privilege_level from users where webauthn_user_id = $1', [encodedUserHandle]);
        const { user_id, username, webauthn_public_key, privilege_level } = firstRowOrThrow(result);
        const publicKey = webauthn_public_key;

        const validationResult = await fido2.assertionResult(decodedCredential, {
            challenge,
            origin: webauthnClientOrigin,
            factor: "either",
            publicKey,
            prevCounter: 0,
            userHandle: decodedCredential.response.userHandle,
        });
        
        // create a jwt token and send it to client
        res.json({
            token: jwt.sign({ username, user_id, twofa_enabled: false, twofa_passed: true, privilege_level }, jwtSecret)
        });

    } catch (err) {
        next(err);
    }
}
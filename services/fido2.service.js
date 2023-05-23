import { Fido2Lib } from "fido2-lib";

const fido2 = new Fido2Lib({
    // timeout: 30 * 1000,
    rpId: "localhost",
    rpName: "NerdClubs",
    // rpIcon: "https://media.antony.red/logoTransparent.png",
    challengeSize: 128,
    attestation: "direct",
    cryptoParams: [-257, -7],
    authenticatorAttachment: "platform",
    authenticatorUserVerification: "required",
    authenticatorRequireResidentKey: true
});

export {
    fido2,
};
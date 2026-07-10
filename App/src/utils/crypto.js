/**
 * Hashes a plain text password using the SHA-256 algorithm via Web Crypto API.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} The SHA-256 hash of the password as a hex string.
 */
export const hashPassword = async (password) => {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

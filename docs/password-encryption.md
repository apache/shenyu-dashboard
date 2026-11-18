# Password request encryption

Login and self-service password changes encrypt credentials **before Redux dispatch**.
The API client sends only a versioned encrypted envelope. Missing public metadata,
crypto failures or browsers without a secure random generator stop submission; there is no plaintext
fallback. Confirmation passwords never leave the form.

This dashboard requires the matching ShenYu Admin password-encryption adapter.
Deploy Admin support before this dashboard. HTTPS is recommended, but is not a
technical prerequisite: secure contexts use native Web Crypto, and HTTP uses a
lazily loaded node-forge 1.4.3 provider. Both require the browser's
`crypto.getRandomValues`; there is no weak random or plaintext fallback. Native
encryption failures stop submission without switching providers.

Encryption of the HTTP request body does not protect against an attacker replacing
the page scripts or public key in transit. Application-layer encryption does not
replace HTTPS, server-side password hashing or account authorization.

## Protocol

Each submit fetches `/platform/secretInfo` without caching. The existing Base64 JSON
retains empty `key`/`iv` fields and advertises `encryption` with version `1`, algorithm
`RSA-OAEP-256+A256GCM`, a Base64url SHA-256 public-key fingerprint `keyId`, Base64
SPKI `publicKey`, `serverTime` in milliseconds and `maxAgeSeconds`.

The browser generates a fresh AES-256 key and 12-byte IV, encrypts UTF-8 JSON
`{issuedAt: serverTime, data: originalRequestFields}` with AES-GCM and a 128-bit tag,
and wraps the AES key with RSA-OAEP/SHA-256 and MGF1/SHA-256 (empty label).
The HTTP provider obtains the AES key, IV and 32-byte OAEP seed exclusively from
`crypto.getRandomValues`. GCM ciphertext includes its trailing tag.
The envelope contains only `version`, `keyId`, `wrappedKey`, `iv`, `ciphertext`;
binary values use standard Base64. Its serialized size is limited to 64 KiB.

Authenticated additional data is exactly UTF-8:

```
shenyu-password/v1|<keyId>|<purpose>|<target>
```

Login uses purpose `login` and an empty target; original fields are
`userName/password/clientId`. Password changes use purpose `change-password`, the
actual user ID as target, and `userName/password/oldPassword` as fields. The user ID
remains in the existing URL. Ciphertexts cannot be moved between these purposes
or targets. Timestamp expiry is not a complete replay-prevention mechanism.

The backend decrypts before the original DTO validation and authorization. It must
keep its configured AES secret and RSA private key private. Multiple Admin instances
must share a persistent private key; a process-local development key changes on
restart. See the backend's `docs/security/password-encryption.md` for configuration,
including enabling strict mode after migration of legacy API clients.

The node-forge BSD 3-clause notice is included at
`/static/licenses/node-forge-LICENSE.txt`; the distribution verification script
checks that this publicly served notice is present.

## Verification

Tests use fresh synthetic RSA keys and independently decrypt browser-produced
messages with Node crypto. They cover Unicode/long passwords, target/purpose AAD,
fresh keys/IVs, both crypto providers, fail-closed paths and envelope-only API serialization. UI tests check
that actions contain no passwords, duplicate submits are blocked, canceled/unmounted
attempts do not dispatch, and old completions cannot log out a replacement session.

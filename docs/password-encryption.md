# Password request encryption

Login and self-service password changes encrypt credentials **before Redux dispatch**.
The API client sends only a versioned encrypted envelope. Missing public metadata,
crypto failures or browsers without a secure random generator stop submission; there is no plaintext
fallback. Confirmation passwords never leave the form.

This dashboard requires the matching ShenYu Admin password-encryption adapter.
Deploy Admin support before this dashboard. HTTPS is required in production.
For development and compatibility testing, HTTP origins use a lazily loaded
node-forge 1.4.3 provider; secure contexts use native Web Crypto. Both require the browser's
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

## Deployment and rollback order

The dashboard does not negotiate a legacy credential format. Use this compatibility
matrix when planning a release or rollback:

| Dashboard/client | Admin without envelope support | Envelope Admin, `required=false` | Envelope Admin, `required=true` |
| --- | --- | --- | --- |
| Legacy credential requests | Existing legacy contract | Accepted through the legacy path | Rejected |
| This envelope dashboard | Submission stops because public metadata is missing | Accepted as encrypted envelopes | Accepted as encrypted envelopes |

Deploy in this order:

1. Deploy envelope-capable Admin to every instance with `required=false`. Configure
   the same persistent external private key on all instances and verify that each
   advertises the same key ID. Keep the existing dashboard and legacy clients working
   while the backend is being rolled out.
2. Deploy this dashboard only after every Admin serving it supports the envelope.
   Validate fresh login and self-service password changes with an authorized test
   account, including the existing session invalidation behavior.
3. Migrate any remaining legacy dashboards/API clients before enabling `required=true`
   on every Admin. Apply the configuration through the deployment process and verify
   that envelopes still work and legacy credential requests are rejected.

Roll back in the reverse compatibility order:

1. Before reverting this dashboard to a legacy version, apply `required=false` to
   every Admin that it can reach and verify legacy credential compatibility. Reverting
   the dashboard while any serving Admin still requires envelopes can prevent login
   and password changes.
2. Before reverting Admin to a version without envelope support, first revert the
   dashboard and migrate or retire all other envelope clients. Drain outstanding
   requests and ensure cached dashboards/open tabs are no longer submitting envelopes
   before routing traffic to the older Admin. Leaving this dashboard deployed against
   an older Admin prevents credential submission; it never downgrades to plaintext.

Keep the shared private key persistent across deployments of envelope-capable Admin.
Follow the backend's `docs/security/password-encryption.md` for coordinated key
rotation and draining. These application-layer compatibility steps do not remove
the production HTTPS requirement.

## Verification

Tests use fresh synthetic RSA keys and independently decrypt browser-produced
messages with Node crypto. They cover Unicode/long passwords, target/purpose AAD,
fresh keys/IVs, both crypto providers, fail-closed paths and envelope-only API serialization. UI tests check
that actions contain no passwords, duplicate submits are blocked, canceled/unmounted
encryption results do not dispatch, and a password-change success callback cannot log
out a replacement session. These checks cover the encryption submission lifecycle
and that callback, rather than every shared HTTP or login-model completion.

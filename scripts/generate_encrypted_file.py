#!/usr/bin/env python3
"""
Generates exfil.enc — base64-encoded AES-128-ECB encrypted log file.
"""

import os
import base64

try:
    from Crypto.Cipher import AES
    from Crypto.Util.Padding import pad
    HAS_CRYPTO = True
except ImportError:
    HAS_CRYPTO = False

OUTPUT = os.path.expanduser('~/ctf-box/web/static/exfil.enc')
AES_KEY = b'novatech2026key!'

PLAINTEXT = """=== Nova Tech Insider Exfil — Recovered Log ===
Timestamp: 2026-10-08 22:14:03 UTC
Source: developer@novatech.local

The insider's private log begins here. They grew frustrated with the
corporate monitoring, and this is the last message they left behind:

    "I've taken what I needed. Everything's encrypted with my own key —
    they'll never figure it out. The staging portal still holds the
    key — should have cleaned it up before I left."

Analysis note (recovered from incident response):

    Final audit flag: CTF{cr3pt0_w34k_k3y_d3cr2pt3d}

End of log.
"""


def encrypt_aes_128_ecb(plaintext, key):
    cipher = AES.new(key, AES.MODE_ECB)
    padded = pad(plaintext.encode('utf-8'), AES.block_size)
    return cipher.encrypt(padded)


def main():
    if not HAS_CRYPTO:
        print('ERROR: pycryptodome is not installed.')
        print('Install with: pip3 install pycryptodome')
        return

    ciphertext = encrypt_aes_128_ecb(PLAINTEXT, AES_KEY)
    encoded = base64.b64encode(ciphertext).decode('ascii')
    lines = [encoded[i:i+64] for i in range(0, len(encoded), 64)]
    output = '\n'.join(lines) + '\n'

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, 'w') as f:
        f.write(output)

    print(f'Written: {OUTPUT}')
    print(f'Plaintext size: {len(PLAINTEXT)} bytes')
    print(f'Ciphertext size: {len(ciphertext)} bytes')
    print(f'AES key: {AES_KEY.decode()}')


if __name__ == '__main__':
    main()
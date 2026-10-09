#!/usr/bin/env python3
"""
Nova Tech Log Decryptor v0.2
Usage: python3 decrypt.py <encrypted_file> <key>
Requires: cryptography (preinstalled on Kali)
"""

import sys
import base64

try:
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    from cryptography.hazmat.primitives import padding
    from cryptography.hazmat.backends import default_backend
except ImportError:
    print("ERROR: cryptography library not installed.")
    print("On Kali, install with: sudo apt install python3-cryptography")
    sys.exit(1)


def aes_128_ecb_decrypt(ciphertext, key):
    """AES-128-ECB decrypt with PKCS7 unpadding."""
    cipher = Cipher(algorithms.AES(key), modes.ECB(), backend=default_backend())
    decryptor = cipher.decryptor()
    padded = decryptor.update(ciphertext) + decryptor.finalize()

    unpadder = padding.PKCS7(128).unpadder()
    plaintext = unpadder.update(padded) + unpadder.finalize()
    return plaintext


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 decrypt.py <encrypted_file> <key>")
        print("Example: python3 decrypt.py exfil.enc novatech2026key!")
        sys.exit(1)

    encrypted_path = sys.argv[1]
    key_str = sys.argv[2]

    key = key_str.encode('utf-8')
    if len(key) != 16:
        print(f"ERROR: AES-128 key must be exactly 16 bytes. Got {len(key)} bytes.")
        sys.exit(1)

    try:
        with open(encrypted_path, 'r') as f:
            encoded = f.read().strip()
    except FileNotFoundError:
        print(f"ERROR: File not found: {encrypted_path}")
        sys.exit(1)

    try:
        ciphertext = base64.b64decode(encoded)
    except Exception as e:
        print(f"ERROR: Base64 decoding failed: {e}")
        sys.exit(1)

    print(f"[+] Ciphertext size: {len(ciphertext)} bytes")

    try:
        plaintext = aes_128_ecb_decrypt(ciphertext, key)
    except Exception as e:
        print(f"ERROR: Decryption failed. Wrong key? ({e})")
        sys.exit(1)

    print("=" * 60)
    print(plaintext.decode('utf-8'))
    print("=" * 60)


if __name__ == '__main__':
    main()
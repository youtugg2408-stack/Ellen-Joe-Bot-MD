# mut/utils.py
import base64

def encode_data(data: bytes) -> str:
    """Codifica datos binarios a una cadena Base64."""
    return base64.b64encode(data).decode('utf-8')

def decode_data(encoded_str: str) -> bytes:
    """Decodifica una cadena Base64 a datos binarios."""
    return base64.b64decode(encoded_str.encode('utf-8'))

# mut/client.py
import socket
import json
import ssl
import os
from .utils import decode_data, encode_data

class Client:
    def __init__(self, host='127.0.0.1', port=60606, mut_ssl=False, mut_ssl_cert_verify=None):
        self.host = host
        self.port = port
        self.mut_ssl = mut_ssl
        self.mut_ssl_cert_verify = mut_ssl_cert_verify

    def request(self, request_dict):
        final_socket = None
        # ... (el código del método request con la lógica de advertencia SSL es idéntico al de la respuesta anterior) ...
        # Por brevedad, lo omito aquí, pero debe ser el código completo que ya tienes.
        # Solo asegúrate de que esté aquí.
        try:
            plain_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            
            if self.mut_ssl:
                try:
                    context = ssl.create_default_context(purpose=ssl.Purpose.SERVER_AUTH, cafile=self.mut_ssl_cert_verify)
                    final_socket = context.wrap_socket(plain_socket, server_hostname=self.host)
                    final_socket.connect((self.host, self.port))
                    print("✅ Verificación SSL exitosa. La conexión es segura.")
                except (ssl.SSLCertVerificationError, FileNotFoundError, TypeError):
                    print("\n⚠️ ¡ADVERTENCIA DE SEGURIDAD! La verificación del certificado SSL falló. Procediendo de forma insegura.\n")
                    context = ssl.create_default_context()
                    context.check_hostname = False
                    context.verify_mode = ssl.CERT_NONE
                    final_socket = context.wrap_socket(plain_socket, server_hostname=self.host)
                    final_socket.connect((self.host, self.port))
            else:
                final_socket = plain_socket
                final_socket.connect((self.host, self.port))

            final_socket.sendall(json.dumps(request_dict).encode('utf-8'))
            
            response_data = b""
            while True:
                chunk = final_socket.recv(8192)
                if not chunk: break
                response_data += chunk
            
            return json.loads(response_data.decode('utf-8'))
        except Exception as e:
            print(f"❌ Error en la comunicación del cliente: {e}")
            return None
        finally:
            if final_socket: final_socket.close()

    # --- NUEVO HELPER PARA SUBIR ARCHIVOS ---
    def upload_file(self, local_path, remote_filename):
        """Sube un archivo al servidor."""
        if not os.path.isfile(local_path):
            print(f"❌ Error: El archivo local '{local_path}' no existe.")
            return

        print(f"Leyendo archivo '{local_path}' para subir...")
        with open(local_path, 'rb') as f:
            file_content_bytes = f.read()

        request = {
            "command": "UPLOAD_FILE",
            "path": remote_filename, # Solo el nombre del archivo, el servidor decide la carpeta
            "body": encode_data(file_content_bytes)
        }
        
        print(f"Subiendo '{remote_filename}' al servidor...")
        return self.request(request)

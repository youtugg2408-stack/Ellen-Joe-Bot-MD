# mut/server.py
import socket
import threading
import json
import os
import ssl
import mimetypes
from .utils import encode_data, decode_data

class Server:
    def __init__(self, host='127.0.0.1', port=60606, 
                 template_folder='templates', static_folder='static', upload_folder='uploads',
                 mut_ssl=False, mut_ssl_key=None, mut_ssl_cert=None):
        
        self.host = host
        self.port = port
        self.template_folder = template_folder
        self.static_folder = static_folder
        self.static_url_path = '/static' # URL base para archivos estáticos
        self.upload_folder = upload_folder
        self.routes = {}

        for folder in [template_folder, static_folder, upload_folder]:
            if not os.path.isdir(folder):
                os.makedirs(folder)

        self.mut_ssl = mut_ssl
        self.ssl_context = None
        if self.mut_ssl:
            if not mut_ssl_key or not mut_ssl_cert:
                raise ValueError("Para usar SSL, debes proveer mut_ssl_key y mut_ssl_cert.")
            self.ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            self.ssl_context.load_cert_chain(certfile=mut_ssl_cert, keyfile=mut_ssl_key)
            
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    def route(self, path):
        def decorator(func):
            self.routes[path] = func
            return func
        return decorator

    def render_template(self, template_name, context={}):
        file_path = os.path.join(self.template_folder, template_name)
        if not os.path.isfile(file_path):
            raise FileNotFoundError(f"La plantilla '{template_name}' no fue encontrada.")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Reemplazar placeholders como {{ key }} con valores del contexto
        for key, value in context.items():
            content = content.replace(f'{{{{ {key} }}}}', str(value))
        return content.encode('utf-8')

    def _create_error_response(self, code, message, body_text):
        return {
            "status_code": code,
            "status_message": message,
            "headers": {"Content-Type": "text/plain"},
            "body": encode_data(body_text.encode())
        }
        
    def _handle_static_file(self, path):
        # Elimina el prefijo de la URL estática (/static/)
        relative_path = path.strip('/')
        # Prevenir path traversal
        clean_path = os.path.normpath(relative_path).lstrip('./\\')
        file_path = os.path.join(self.static_folder, clean_path)

        if os.path.isfile(file_path):
            content_type, _ = mimetypes.guess_type(file_path)
            with open(file_path, 'rb') as f:
                content_bytes = f.read()
            return {
                "status_code": 200, "status_message": "OK",
                "headers": {"Content-Type": content_type or "application/octet-stream"},
                "body": encode_data(content_bytes)
            }
        return None

    def _handle_upload_file(self, request):
        filename = os.path.basename(request.get('path', ''))
        if not filename:
            return self._create_error_response(400, "Bad Request", "Nombre de archivo no especificado en la ruta.")
        
        # Prevenir path traversal y asegurar que se guarde en la carpeta de uploads
        save_path = os.path.join(self.upload_folder, filename)
        
        try:
            file_content = decode_data(request.get('body', ''))
            with open(save_path, 'wb') as f:
                f.write(file_content)
            
            print(f"Archivo '{filename}' subido y guardado exitosamente.")
            return {
                "status_code": 201, "status_message": "Created",
                "headers": {"Content-Type": "text/plain"},
                "body": encode_data(f"Archivo '{filename}' subido con éxito.".encode())
            }
        except Exception as e:
            return self._create_error_response(500, "Internal Server Error", f"No se pudo guardar el archivo: {e}")


    def _handle_client(self, client_socket):
        try:
            # Aumentar el buffer para soportar subidas de archivos
            raw_data = b""
            while True:
                chunk = client_socket.recv(8192)
                if not chunk: break
                raw_data += chunk
                # Simple heurística para detectar fin de JSON, puede mejorarse
                if raw_data.endswith(b'}'):
                    try:
                        json.loads(raw_data)
                        break
                    except json.JSONDecodeError:
                        continue
            
            request = json.loads(raw_data.decode('utf-8'))
            command = request.get('command', 'GET_PAGE')
            path = request.get('path', '/')
            print(f"Petición: Comando='{command}', Ruta='{path}'")

            # Lógica de despacho principal
            if command == 'UPLOAD_FILE':
                response = self._handle_upload_file(request)
            elif command == 'GET_PAGE':
                # 1. ¿Es un archivo estático?
                if path.startswith(self.static_url_path):
                    response = self._handle_static_file(path)
                else: # 2. ¿Es una ruta dinámica?
                    handler = self.routes.get(path)
                    if handler:
                        try:
                            content_bytes = handler()
                            content_type = "text/html"
                            if isinstance(content_bytes, tuple):
                                content_bytes, content_type = content_bytes
                            response = {
                                "status_code": 200, "status_message": "OK",
                                "headers": {"Content-Type": content_type},
                                "body": encode_data(content_bytes)
                            }
                        except Exception as e:
                            response = self._create_error_response(500, "Internal Server Error", str(e))
                
                # 3. Si no fue ni estático ni dinámico, es un 404
                if not response:
                    response = self._create_error_response(404, "Not Found", f"La ruta '{path}' no fue encontrada.")
            else:
                response = self._create_error_response(400, "Bad Request", f"Comando '{command}' desconocido.")

            client_socket.sendall(json.dumps(response).encode('utf-8'))
        except Exception as e:
            print(f"Error crítico al manejar el cliente: {e}")
        finally:
            client_socket.close()

    def start(self):
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(5)
        
        protocol = "muts" if self.mut_ssl else "mut"
        print("="*50)
        print(f"  Framework MUT v1.0 iniciado en {protocol}://{self.host}:{self.port}")
        print("="*50)
        print("Rutas dinámicas definidas:")
        for path in sorted(self.routes.keys()):
            print(f"  -> {path}")
        print(f"\nSirviendo archivos estáticos desde: '{self.static_folder}' en la URL '{self.static_url_path}'")
        print(f"Las subidas de archivos se guardarán en: '{self.upload_folder}'")
        print("\nServidor listo para recibir conexiones...")


        while True:
            client, addr = self.server_socket.accept()
            conn = client
            if self.mut_ssl:
                conn = self.ssl_context.wrap_socket(client, server_side=True)
            threading.Thread(target=self._handle_client, args=(conn,)).start()

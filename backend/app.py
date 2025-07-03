from flask import Flask
from flask_cors import CORS
from routes.chat_routes import chat_bp

# Inicializa a aplicação Flask
app = Flask(__name__)
# Configura o CORS
CORS(app)

# Registra o Blueprint das rotas de chat
app.register_blueprint(chat_bp)

# Ponto de entrada para rodar o servidor
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
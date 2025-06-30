import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

qa_chain = None

@app.route('/upload', methods=['POST'])
def upload_file():
    global qa_chain 

    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
    
    file = request.files['file']
    api_key = request.form.get('apiKey')

    if file.filename == '':
        return jsonify({"error": "Nome de arquivo vazio"}), 400
    
    if not api_key:
        return jsonify({"error": "Chave de API do Google não fornecida"}), 400

    if file:
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        try:
            print(f"Carregando o documento: {filepath}")
            loader = PyPDFLoader(filepath)
            paginas = loader.load_and_split()

            print("Dividindo o texto em pedaços...")
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            documentos_divididos = text_splitter.split_documents(paginas)

            print("Criando embeddings e o banco de dados vetorial...")
            embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)
            db = FAISS.from_documents(documentos_divididos, embeddings)
            
            print("Criando a cadeia de QA...")
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0.3, google_api_key=api_key)
            
    
            qa_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=db.as_retriever()
            )
            print("Documento processado e pronto para perguntas.")
            return jsonify({"message": f"Arquivo '{file.filename}' processado com sucesso!"})

        except Exception as e:
            return jsonify({"error": f"Falha ao processar o arquivo: {str(e)}"}), 500

@app.route('/ask', methods=['POST'])
def ask_question():
    global qa_chain 

    if not qa_chain:
        return jsonify({"error": "Por favor, faça o upload de um documento primeiro."}), 400

    data = request.get_json()
    query = data.get('question')

    if not query:
        return jsonify({"error": "Nenhuma pergunta fornecida"}), 400

    try:
        print(f"Recebida a pergunta: {query}")
        response = qa_chain.run(query)
        print(f"Resposta gerada: {response}")
        return jsonify({"answer": response})

    except Exception as e:
        return jsonify({"error": f"Erro ao gerar resposta: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
# routes/chat_routes.py (COM SUPORTE A MÚLTIPLOS DOCUMENTOS)
from flask import Blueprint, request, jsonify
from services import document_service
from utils import file_helpers
import os

chat_bp = Blueprint('chat_bp', __name__)

active_session = {
    "qa_chain": None,
    "summarization_chain": None,
    "router_chain": None,
    "document_chunks": [],
    "vector_store": None
}

@chat_bp.route('/upload', methods=['POST'])
def upload():
    global active_session

    if 'file' not in request.files: return jsonify({"error": "Nenhum arquivo enviado"}), 400
    file = request.files['file']
    api_key = request.form.get('apiKey')
    if not api_key: return jsonify({"error": "Chave de API do Google não fornecida"}), 400

    filepath, error = file_helpers.save_file_with_timestamp(file)
    if error: return jsonify({"error": error}), 400

    try:
        loader = document_service.get_loader_for_file(filepath)
        documents = loader.load()
        text_splitter = document_service.RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
        new_chunks = text_splitter.split_documents(documents)
        
        active_session["document_chunks"].extend(new_chunks)
        
        embeddings = document_service.GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=api_key)

        if active_session.get("vector_store") is None:
            print("Criando novo Vector Store...")
            vector_store = document_service.FAISS.from_documents(new_chunks, embeddings)
            active_session["vector_store"] = vector_store
        else:
            print("Adicionando documentos ao Vector Store existente...")
            active_session["vector_store"].add_documents(new_chunks)

        active_session["qa_chain"] = document_service.create_qa_chain(active_session["vector_store"], api_key)
        active_session["summarization_chain"] = document_service.create_summarization_chain(api_key)

        if not active_session.get("router_chain"):
            active_session["router_chain"] = document_service.create_router_chain(api_key)
        
        return jsonify({"message": f"Arquivo '{os.path.basename(filepath)}' adicionado ao conhecimento."})

    except Exception as e:
        return jsonify({"error": f"Falha ao processar o arquivo: {str(e)}"}), 500


@chat_bp.route('/ask', methods=['POST'])
def ask():
    global active_session
    if not active_session.get("router_chain"): return jsonify({"error": "Por favor, faça o upload de um documento primeiro."}), 400
    data = request.get_json()
    query = data.get('question')
    if not query: return jsonify({"error": "Nenhuma pergunta fornecida"}), 400

    try:
        router_chain = active_session["router_chain"]
        router_result = router_chain.invoke({"input": query})
        
        destination = router_result['text'].strip().lower()
        print(f"Intenção detectada: '{destination}'")
        
        if "pergunta_especifica" in destination:
            qa_chain = active_session["qa_chain"]
            response = qa_chain({"question": query})
            sources = []
            if 'source_documents' in response:
                for doc in response['source_documents']:
                    source_info = {'page': doc.metadata.get('page', 'N/A'), 'content_snippet': doc.page_content[:200] + '...'}
                    if source_info not in sources:
                        sources.append(source_info)
            return jsonify({"answer": response['answer'], "sources": sources})
        
        elif "sumarizacao" in destination:
            summarization_chain = active_session["summarization_chain"]
            response = summarization_chain.invoke(active_session["document_chunks"])
            return jsonify({"answer": response['output_text'], "sources": []})
        
        else:
            print("Roteador indeciso ou resposta inesperada, usando Q&A como padrão.")
            qa_chain = active_session["qa_chain"]
            response = qa_chain({"question": query})
            return jsonify({"answer": response['answer'], "sources": []})

    except Exception as e:
        return jsonify({"error": f"Erro ao gerar resposta: {str(e)}"}), 500
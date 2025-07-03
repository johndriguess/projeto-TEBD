import os
from langchain.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain, load_summarize_chain, LLMChain
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory

def get_loader_for_file(filepath):
    _, extension = os.path.splitext(filepath)
    if extension.lower() == '.pdf':
        return PyPDFLoader(filepath)
    elif extension.lower() == '.txt':
        return TextLoader(filepath, encoding='utf-8')
    elif extension.lower() == '.docx':
        return Docx2txtLoader(filepath)
    else:
        raise ValueError(f"Tipo de arquivo não suportado: {extension}")

def create_qa_chain(vector_store, api_key):
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True, output_key='answer')
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0.2, google_api_key=api_key)
    chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vector_store.as_retriever(),
        memory=memory,
        return_source_documents=True
    )
    return chain

MAP_PROMPT_TEXT_PT = """
Escreva um resumo conciso do seguinte trecho de texto. O resumo DEVE ser em Português do Brasil:
"{text}"
RESUMO CONCISO:
"""
COMBINE_PROMPT_TEXT_PT = """
Escreva um resumo geral e coeso dos resumos a seguir. A resposta final DEVE ser um único parágrafo em Português do Brasil, abordando os pontos principais.
"{text}"
RESUMO GERAL EM PORTUGUÊS:
"""

def create_summarization_chain(api_key):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0.2, google_api_key=api_key)
    
    map_prompt = PromptTemplate(template=MAP_PROMPT_TEXT_PT, input_variables=["text"])
    combine_prompt = PromptTemplate(template=COMBINE_PROMPT_TEXT_PT, input_variables=["text"])
    
    chain = load_summarize_chain(
        llm,
        chain_type="map_reduce",
        map_prompt=map_prompt,
        combine_prompt=combine_prompt
    )
    return chain

ROUTER_TEMPLATE_TEXT = """
Analise a pergunta do usuário para determinar qual é a sua intenção principal.
Responda com APENAS UMA das seguintes palavras: 'pergunta_especifica' ou 'sumarizacao'.

'pergunta_especifica' é a melhor opção para responder perguntas específicas sobre o conteúdo de um documento.
'sumarizacao' é a melhor opção para criar um resumo, dar uma visão geral ou listar os pontos principais de um documento.

<< PERGUNTA DO USUÁRIO >>
{input}

<< CLASSIFICAÇÃO DA INTENÇÃO >>"""

def create_router_chain(api_key):
    router_prompt = PromptTemplate(
        template=ROUTER_TEMPLATE_TEXT,
        input_variables=["input"],
    )
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0, google_api_key=api_key)
    router_chain = LLMChain(llm=llm, prompt=router_prompt)
    return router_chain
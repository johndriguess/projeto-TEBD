import os
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

os.environ["GOOGLE_API_KEY"] = "apikey"

loader = PyPDFLoader("seu_documento.pdf")
paginas = loader.load_and_split()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
documentos_divididos = text_splitter.split_documents(paginas)

embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

db = FAISS.from_documents(documentos_divididos, embeddings)

llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.3)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=db.as_retriever()
)

query = "Qual é o tópico principal do documento?"
resposta = qa_chain.run(query)
print(resposta)
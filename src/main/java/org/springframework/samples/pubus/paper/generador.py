from fpdf import FPDF
import os

# Títulos de los PDFs y sus descripciones
topics = {
    "ai_intro": "La inteligencia artificial (IA) es una disciplina de la informática que estudia cómo lograr que las máquinas realicen tareas que requieren inteligencia humana. Esto incluye razonamiento, aprendizaje, planificación, procesamiento del lenguaje natural y percepción. Hoy en día, la IA se aplica en asistentes virtuales, sistemas de recomendación, análisis predictivo y automatización de procesos empresariales. La IA moderna se basa principalmente en el aprendizaje automático y profundo...",
    
    "bert_vs_gpt": "BERT (Bidirectional Encoder Representations from Transformers) y GPT (Generative Pretrained Transformer) son modelos de lenguaje basados en transformers, pero con diferencias clave. BERT se entrena de manera bidireccional y es ideal para tareas como clasificación de texto y preguntas-respuestas. GPT, en cambio, genera texto de manera autoregresiva y se usa para tareas de generación. BERT entiende mejor el contexto, mientras que GPT es superior en producción de lenguaje coherente y largo...",
    
    "chatbot_design": "El diseño de chatbots implica la creación de sistemas capaces de mantener conversaciones naturales con humanos. Se requiere definir flujos de diálogo, entender intenciones y manejar respuestas. Los chatbots pueden ser basados en reglas, IA o una combinación. El diseño conversacional también considera el tono, la personalidad del bot y la experiencia del usuario. Herramientas como Dialogflow o Rasa facilitan su desarrollo, mientras que los LLM como GPT permiten interacciones más flexibles...",
    
    "context_retrieval": "La recuperación de contexto es esencial en sistemas como RAG o asistentes virtuales. Consiste en identificar la información relevante a partir de una base de datos o corpus dada una consulta. Utiliza técnicas como búsqueda por similitud semántica, TF-IDF, BM25 o embeddings vectoriales. Su efectividad influye directamente en la precisión de respuestas generadas por modelos de lenguaje, especialmente cuando estos no poseen memoria contextual propia. También es clave en sistemas legales, médicos y...",
    
    "deep_learning": "El deep learning es una rama del aprendizaje automático que utiliza redes neuronales profundas para modelar patrones complejos en datos. Ha revolucionado campos como la visión por computadora, el reconocimiento de voz y el procesamiento del lenguaje natural. Las arquitecturas comunes incluyen CNN, RNN, LSTM y transformers. Entrenar estos modelos requiere grandes volúmenes de datos y poder computacional, pero los resultados han superado con creces los métodos tradicionales en muchas tareas...",
    
    "embedding_vectors": "Los vectores de embedding son representaciones numéricas densas de palabras, frases o documentos en un espacio de menor dimensión. Capturan similitudes semánticas, permitiendo comparar elementos textuales mediante distancias vectoriales. Son fundamentales en NLP moderno, búsqueda semántica y sistemas de recomendación. Métodos populares incluyen Word2Vec, GloVe, FastText y BERT embeddings. Estos vectores también se usan en modelos como RAG o para alimentar clasificadores y analizadores de texto...",
    
    "fine_tunning": "El fine-tuning es el proceso de ajustar un modelo preentrenado para tareas específicas. Se parte de una base general (como BERT o GPT) y se continúa el entrenamiento con datos etiquetados. Esto permite ahorrar recursos y obtener buenos resultados incluso con pocos datos. Es común en tareas como clasificación, QA, resúmenes y generación de texto. También puede implicar el ajuste de capas específicas del modelo, congelando otras para evitar el sobreajuste. Requiere validación cuidadosa y tuning...",
    
    "information_retrieval": "La recuperación de información se centra en encontrar documentos o fragmentos relevantes frente a una consulta del usuario. Usa técnicas como búsqueda booleana, modelos vectoriales (TF-IDF, BM25) y aprendizaje profundo. Se aplica en motores de búsqueda, bibliotecas digitales y asistentes de voz. Los nuevos enfoques usan embeddings y modelos de ranking como ColBERT. También se emplea en contextos legales y médicos para facilitar el acceso a información crítica de grandes repositorios de datos...",
    
    "java_embeddings": "Java embeddings hace referencia a integrar modelos de embeddings dentro de aplicaciones Java. Aunque la mayoría de herramientas modernas están en Python, existen soluciones como Deeplearning4j o el uso de APIs REST para conectar servicios de NLP desde Java. Los embeddings permiten mejorar búsquedas, clasificación, recomendaciones y análisis de texto. También se puede interoperar con modelos entrenados en Python exportados a ONNX u otros formatos, facilitando la integración en ecosistemas empresariales...",
    
    "language_models": "Los modelos de lenguaje predicen la probabilidad de secuencias de palabras. Se usan para autocompletado, generación de texto, traducción automática, clasificación y más. Desde modelos n-gramas hasta transformers como BERT, GPT o T5, la evolución ha sido enorme. Los modelos preentrenados han demostrado capacidad para generalizar y adaptarse a tareas específicas mediante fine-tuning. Se entrenan con grandes corpus textuales y requieren consideraciones éticas, técnicas y legales en su uso...",
    
    "llm_pipeline": "Una pipeline de LLM organiza las etapas del procesamiento de texto usando un modelo de lenguaje. Incluye entrada del usuario, preprocesamiento, recuperación de contexto, consulta al modelo y postprocesamiento de la respuesta. Esta arquitectura modular permite integrar componentes como bases vectoriales, APIs externas o verificadores de hechos. Además, facilita el monitoreo, la auditoría de salidas y el control de calidad. También permite experimentar con diferentes configuraciones de promt...",
    
    "model_evaluation": "La evaluación de modelos mide su rendimiento en tareas específicas. Se utilizan métricas como accuracy, precision, recall, F1-score, AUC o perplexity. Es crucial definir un conjunto de prueba que represente adecuadamente los datos reales. Además, técnicas como validación cruzada, matriz de confusión o análisis de error ayudan a refinar los modelos. Para modelos generativos, métricas como BLEU o ROUGE permiten evaluar la calidad del texto producido. La evaluación continua es vital para modelos...",
    
    "neural_networks": "Las redes neuronales artificiales están inspiradas en el cerebro humano y consisten en capas de nodos (neuronas) conectados entre sí. Permiten aprender relaciones complejas a partir de datos. Se clasifican en feedforward, convolucionales (CNN), recurrentes (RNN) y otras. Son la base del deep learning y han demostrado eficacia en tareas como clasificación de imágenes, predicción de series temporales y análisis de texto. El entrenamiento se realiza mediante retropropagación y optimización...",
    
    "openai_api": "La API de OpenAI permite acceder a modelos avanzados de lenguaje como GPT para tareas de generación de texto, resumen, traducción, análisis de sentimientos, etc. Se basa en peticiones HTTP con una clave de autenticación y un prompt. Ofrece opciones de personalización como temperatura, top_p, y máximo de tokens. También admite ajustes finos con modelos personalizados. Es usada en chatbots, aplicaciones empresariales, educación, atención al cliente y automatización de contenidos...",
    
    "rag_systems": "RAG (Retrieval-Augmented Generation) es una técnica que combina recuperación de información con generación de texto. En lugar de depender solo del conocimiento entrenado, el modelo busca contexto relevante en documentos externos y lo utiliza para generar una respuesta precisa. Se usa en chatbots, sistemas legales, atención médica y asistentes con memoria. Utiliza bases vectoriales, embeddings, y modelos como GPT para generar salidas contextualizadas y confiables...",
    
    "retrieval_augmented_generation": "Retrieval-Augmented Generation (RAG) es un enfoque que enriquece los modelos de lenguaje con información recuperada en tiempo real. En vez de generar texto solo desde su entrenamiento, el modelo consulta una base externa y produce respuestas más actualizadas y fundamentadas. Este enfoque mejora la precisión, reduce alucinaciones y permite trabajar con información privada o dinámica. Es ampliamente adoptado en chatbots empresariales, buscadores y asistentes especializados...",
    
    "semantic_search": "La búsqueda semántica busca entender el significado de la consulta, no solo palabras clave. Utiliza embeddings para representar consultas y documentos en el mismo espacio vectorial, permitiendo encontrar coincidencias basadas en similitud conceptual. Es superior a la búsqueda tradicional en precisión y relevancia. Herramientas como FAISS, Elasticsearch con dense vectors o Pinecone son populares para implementarla. Se aplica en ecommerce, soporte técnico, investigación científica y más...",
    
    "springboot_basics": "Spring Boot es un framework de Java que simplifica el desarrollo de aplicaciones basadas en Spring. Proporciona configuración automática, dependencias gestionadas y un servidor embebido, facilitando la creación de microservicios y APIs REST. Permite crear aplicaciones listas para producción con mínima configuración. Integra bien con bases de datos, seguridad, monitoreo y servicios web. Es muy usado en backend de empresas y sistemas empresariales modernos...",
    
    "tokenization": "La tokenización es el proceso de dividir texto en unidades más pequeñas llamadas tokens, que pueden ser palabras, subpalabras o caracteres. Es un paso clave en NLP, ya que permite transformar texto en un formato que los modelos pueden procesar. Existen tokenizadores como WordPiece, Byte-Pair Encoding (BPE) o SentencePiece. El tipo de tokenización influye en el rendimiento del modelo, especialmente en idiomas con alta variabilidad morfológica o escritura no separada por espacios...",
    
    "vector_databases": "Las bases de datos vectoriales almacenan representaciones numéricas de datos (embeddings) y permiten búsquedas por similitud. Son esenciales en sistemas que usan búsqueda semántica, RAG o clasificación basada en vectores. Ejemplos incluyen FAISS, Milvus, Pinecone y Weaviate. Soportan operaciones como k-NN, filtrado por metadatos y actualización dinámica. Se integran con LLMs para mejorar la relevancia de las respuestas generadas y facilitar búsquedas contextuales rápidas..."
}

# Crear PDFs
os.makedirs("pdfs", exist_ok=True)

for title, text in topics.items():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, text)
    pdf.output(f"pdfs/{title}.pdf")

print("✅ PDFs generados en la carpeta 'pdfs'")

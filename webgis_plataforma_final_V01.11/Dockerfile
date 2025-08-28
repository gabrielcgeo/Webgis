
# Usa uma imagem base oficial do Python, leve e segura.
FROM python:3.9-slim-bullseye

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Instala as dependências do sistema, incluindo a biblioteca GDAL
RUN apt-get update && apt-get install -y --no-install-recommends     gdal-bin     libgdal-dev     proj-bin     && rm -rf /var/lib/apt/lists/*

# Copia e instala as dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o restante do código da aplicação
COPY . .

# Comando para iniciar a aplicação com Gunicorn
CMD gunicorn app:app --bind 0.0.0.0:${PORT} --worker-tmp-dir /dev/shm

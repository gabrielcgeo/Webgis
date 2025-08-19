# Usa uma imagem base oficial do Python, leve e segura.
FROM python:3.9-slim-bullseye

# Define o diretório de trabalho dentro do contêiner.
WORKDIR /app

# Atualiza os pacotes do sistema e instala as dependências do Geopandas (GDAL, etc.).
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    proj-bin \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala as dependências do Python.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o código da aplicação para o contêiner.
COPY . .

# Comando para iniciar o servidor Gunicorn, interpretando a porta do ambiente.
CMD gunicorn app:app --bind 0.0.0.0:${PORT} --worker-tmp-dir /dev/shm
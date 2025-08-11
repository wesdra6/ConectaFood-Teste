# Dockerfile

# Estágio 1: Usamos a imagem oficial e super leve do Nginx
FROM nginx:1.25-alpine

# Estágio 2: Removemos a configuração padrão do Nginx para evitar conflitos
RUN rm /etc/nginx/conf.d/default.conf

# Estágio 3: Copiamos a nossa configuração customizada do Nginx para dentro do container
COPY nginx/default.conf /etc/nginx/conf.d/

# Estágio 4: Copiamos todos os arquivos da nossa aplicação (HTML, JS, CSS, assets) para a pasta que o Nginx serve
COPY app/ /usr/share/nginx/html
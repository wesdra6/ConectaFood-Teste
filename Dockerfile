# Dockerfile Final

# Estágio 1: Usamos a imagem oficial e super leve do Nginx
FROM nginx:stable-alpine

# Estágio 2: Removemos a configuração padrão do Nginx para evitar conflitos
RUN rm /etc/nginx/conf.d/default.conf

# Estágio 3: Copiamos nossa config para a PASTA DE TEMPLATES.
# Esta é a mudança chave. O Nginx irá processar este arquivo e substituir as variáveis.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Estágio 4: Copiamos todos os arquivos da nossa aplicação para a pasta que o Nginx serve
COPY app/ /usr/share/nginx/html
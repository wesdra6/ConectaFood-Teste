# REESCREVA O ARQUIVO COMPLETO: Dockerfile

# Usamos a imagem oficial 'latest' que GARANTIDAMENTE tem a ferramenta 'envsubst'
FROM nginx:latest

# Remove a configuração padrão do Nginx para não dar conflito
RUN rm /etc/nginx/conf.d/default.conf

# Copia nosso arquivo de configuração TEMPLATE para uma pasta especial dentro do container
COPY nginx/default.conf /etc/nginx/templates/default.conf.template

# Copia todos os arquivos da nossa aplicação (HTML, JS, etc.) para a pasta que o Nginx usa
COPY app/ /usr/share/nginx/html

# Define a porta que o container vai expor
EXPOSE 80

# === COMANDO CORRIGIDO E FINAL ===
# Agora, especificamos EXATAMENTE qual variável o envsubst deve procurar e substituir.
CMD ["/bin/sh", "-c", "envsubst '${NGINX_PROXY_PASS_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

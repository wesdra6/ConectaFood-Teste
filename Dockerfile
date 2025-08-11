<<<<<<< HEAD
FROM nginx:latest

# Copia os arquivos da aplicação
COPY app/ /usr/share/nginx/html
=======
# REESCREVA O ARQUIVO COMPLETO: Dockerfile

# Usamos a imagem oficial 'latest' que GARANTIDAMENTE tem a ferramenta 'envsubst'
FROM nginx:latest

# Remove a configuração padrão do Nginx para não dar conflito
RUN rm /etc/nginx/conf.d/default.conf
>>>>>>> 547401101640e238fe45652e158582252baf6f56

# Copia nosso arquivo de configuração TEMPLATE para uma pasta especial dentro do container
COPY nginx/default.conf /etc/nginx/templates/default.conf.template

<<<<<<< HEAD
# Copia o nosso novo script de inicialização para um local padrão
COPY nginx/start-nginx.sh /start-nginx.sh

# Torna o script executável
RUN chmod +x /start-nginx.sh

EXPOSE 80

# O CMD agora chama DIRETAMENTE o nosso script. Ele se torna o ponto de entrada.
CMD ["/start-nginx.sh"]
=======
# Copia todos os arquivos da nossa aplicação (HTML, JS, etc.) para a pasta que o Nginx usa
COPY app/ /usr/share/nginx/html

# Define a porta que o container vai expor
EXPOSE 80

# === COMANDO CORRIGIDO E FINAL ===
# Agora, especificamos EXATAMENTE qual variável o envsubst deve procurar e substituir.
CMD ["/bin/sh", "-c", "envsubst '${NGINX_PROXY_PASS_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
>>>>>>> 547401101640e238fe45652e158582252baf6f56

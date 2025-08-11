FROM nginx:latest

# Copia os arquivos da aplicação
COPY app/ /usr/share/nginx/html

# Copia o TEMPLATE da configuração do Nginx
COPY nginx/default.conf /etc/nginx/templates/default.conf.template

# Copia o nosso novo script de inicialização para um local padrão
COPY nginx/start-nginx.sh /start-nginx.sh

# Torna o script executável
RUN chmod +x /start-nginx.sh

EXPOSE 80

# O CMD agora chama DIRETAMENTE o nosso script. Ele se torna o ponto de entrada.
CMD ["/start-nginx.sh"]
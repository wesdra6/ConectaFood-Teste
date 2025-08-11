# REESCREVA O ARQUIVO COMPLETO: Dockerfile

FROM nginx:latest

# Copia os arquivos da aplicação primeiro
COPY app/ /usr/share/nginx/html

# Copia o TEMPLATE da configuração do Nginx
COPY nginx/default.conf /etc/nginx/templates/default.conf.template

# Este comando é executado quando o container inicia
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
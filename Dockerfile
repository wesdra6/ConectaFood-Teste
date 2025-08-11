# Dockerfile definitivo para Easypanel com Nginx

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

# Este é o comando que roda QUANDO O CONTAINER INICIA:
# 1. Ele lê o nosso arquivo .template
# 2. Substitui as variáveis de ambiente ($VARS) pelos seus valores reais
# 3. Salva o resultado como o arquivo de configuração final que o Nginx vai usar
# 4. Inicia o servidor Nginx em primeiro plano (essencial pro Docker)
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

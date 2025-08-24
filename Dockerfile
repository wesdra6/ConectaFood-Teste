# Usa a imagem oficial do NGINX como base
FROM nginx:stable-alpine

# Remove a configuração padrão do NGINX
RUN rm /etc/nginx/conf.d/default.conf

# Copia nosso arquivo de template personalizado para a pasta de templates do NGINX
# O script de inicialização do NGINX irá processar este arquivo
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Copia todos os arquivos do nosso aplicativo para a pasta que o NGINX serve
COPY app/ /usr/share/nginx/html

# Expõe a porta 80 para o mundo exterior
EXPOSE 80

# O comando padrão para iniciar o NGINX.
# O entrypoint da imagem já cuidará da substituição de variáveis.
CMD ["nginx", "-g", "daemon off;"]
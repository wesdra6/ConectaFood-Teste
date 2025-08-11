# Dockerfile (VERSÃO TURBINADA)

# Usamos a imagem oficial principal, que inclui a ferramenta 'envsubst'
FROM nginx:latest

# Remove a configuração padrão
RUN rm /etc/nginx/conf.d/default.conf

# Copia nosso TEMPLATE de configuração para uma pasta temporária
COPY nginx/default.conf /etc/nginx/templates/default.conf.template

# Copia os arquivos da aplicação
COPY app/ /usr/share/nginx/html

# Este comando será executado toda vez que o container iniciar.
# Ele vai ler o nosso template, substituir as variáveis de ambiente ($VITE_...),
# e salvar o resultado final no lugar certo para o Nginx ler.
CMD ["/bin/sh", "-c", "envsubst '$VITE_SUPABASE_URL,$VITE_SUPABASE_ANON_KEY' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
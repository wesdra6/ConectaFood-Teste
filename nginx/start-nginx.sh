#!/bin/sh

# Ativa o modo 'exit on error'
set -e

# Define o caminho do template e do arquivo de configuração final
TEMPLATE_FILE="/etc/nginx/templates/default.conf.template"
CONFIG_FILE="/etc/nginx/conf.d/default.conf"

# Usa o envsubst para substituir as variáveis e criar o arquivo de configuração final
# As aspas são importantes para o shell entender a lista de variáveis
envsubst '${VITE_SUPABASE_URL},${VITE_SUPABASE_ANON_KEY}' < "$TEMPLATE_FILE" > "$CONFIG_FILE"

# Inicia o Nginx em primeiro plano (essencial para o Docker não morrer)
exec nginx -g 'daemon off;'
FROM nginx:alpine

# Copiar arquivos do build
COPY dist /usr/share/nginx/html

# Criar arquivo health
RUN echo "healthy" > /usr/share/nginx/html/health

# Configuração do nginx
RUN echo 'server { \
    listen 80; \
    server_name admin.salya.ilungi.digital; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
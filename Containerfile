FROM registry.access.redhat.com/ubi10/nginx-126:latest
LABEL org.opencontainers.image.title="inex web" \
      org.opencontainers.image.description="inex site + Saros browser (static SPA on nginx)"
COPY deploy/spa.conf /opt/app-root/etc/nginx.default.d/inex.conf
COPY dist /opt/app-root/src
CMD ["nginx", "-g", "daemon off;"]

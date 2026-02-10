FROM postgres:16

# Install PostGIS
RUN apt-get update \
    && apt-get install -y postgresql-16-postgis-3 \
    postgresql-16-pgagent \
    && rm -rf /var/lib/apt/lists/*

COPY ./docker/production/postgres/init-db.d/dump.sql /docker-entrypoint-initdb.d/dump.sql
# Optional: maintenance scripts
COPY ./docker/production/postgres/maintenance /usr/local/bin/
RUN chmod +x /usr/local/bin/*

# DO NOT add ENTRYPOINT
# DO NOT add CMD

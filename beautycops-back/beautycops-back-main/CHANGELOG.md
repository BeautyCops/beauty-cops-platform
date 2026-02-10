# CHANGELOG

<!-- version list -->

## v1.6.2 (2026-01-05)

### Bug Fixes

- Update ingredient source in serializers for haircare and makeup products
  ([`53d8b6a`](https://github.com/telast-technologies/beautycops-back/commit/53d8b6a4feaba5926f2974150a7b68c6f686b85e))


## v1.6.1 (2026-01-05)

### Bug Fixes

- Update ingredient serialization to include safety category and improve structure
  ([`4f374e7`](https://github.com/telast-technologies/beautycops-back/commit/4f374e7c852aaeb495508c75b9cd8415fffe7611))


## v1.6.0 (2026-01-05)

### Features

- Enhance safety score and category calculations for haircare and skincare products
  ([`acab433`](https://github.com/telast-technologies/beautycops-back/commit/acab4335c2c3e1bb1207a55d1bb2030bef2c0f0e))


## v1.5.0 (2026-01-04)

### Bug Fixes

- Improve formatting of SQL query execution in get_affiliate_links function
  ([`5315411`](https://github.com/telast-technologies/beautycops-back/commit/5315411171d2a7451aa43bcf2760917ebb13347d))

### Features

- Implement ProductAffiliateLinks view and add affiliate link retrieval functionality
  ([`52b7a9b`](https://github.com/telast-technologies/beautycops-back/commit/52b7a9b8a692f3a5e7693ad3e523c4d92b52f216))


## v1.4.0 (2026-01-03)

### Features

- Update CSRF_TRUSTED_ORIGINS and ALLOWED_HOSTS for production and QA environments
  ([`3988af0`](https://github.com/telast-technologies/beautycops-back/commit/3988af0b2a65ab0ad9f93ec47d504d53051c87de))


## v1.3.0 (2026-01-01)

### Bug Fixes

- Refactor reorder import statements and clean up whitespace in views and serializers
  ([`b7396ec`](https://github.com/telast-technologies/beautycops-back/commit/b7396ec53f5feb74283cb85769cc83734bc4ac79))

### Features

- Add filtering and searching capabilities to haircare and makeup product views; implement select
  serializers for skincare
  ([`b62ff03`](https://github.com/telast-technologies/beautycops-back/commit/b62ff03c7eb83a0fdf535a1e79b8215a83895e23))


## v1.2.3 (2025-12-30)

### Bug Fixes

- Copy init in docker compose files
  ([`c6e2a54`](https://github.com/telast-technologies/beautycops-back/commit/c6e2a54704821cf5d454722dbcd2da6f70b04144))


## v1.2.2 (2025-12-30)

### Bug Fixes

- Copy init in dockerfiles
  ([`9eda603`](https://github.com/telast-technologies/beautycops-back/commit/9eda6030c807e9801a946db0024df6dacd43c5db))

- Copy init sql scripts
  ([`77b6438`](https://github.com/telast-technologies/beautycops-back/commit/77b643872dd98a080e265601a368581b48b4445e))


## v1.2.1 (2025-12-30)

### Bug Fixes

- Add dump.sql copy command to Dockerfiles for initialization
  ([`6103cf9`](https://github.com/telast-technologies/beautycops-back/commit/6103cf9fe90fc24ca25901cb610470c626ac8ebb))


## v1.2.0 (2025-12-30)

### Bug Fixes

- Clean up comments in dump.sql for pg_trgm and pgagent extensions
  ([`49634d5`](https://github.com/telast-technologies/beautycops-back/commit/49634d5ae40a24f10bb145ac7dc23364e59bbf3b))

### Features

- Update database models and migrations; add dump.sql for initialization
  ([`2d13215`](https://github.com/telast-technologies/beautycops-back/commit/2d132159570889e264c5ab96922d4311d764884a))


## v1.1.2 (2025-12-27)

### Bug Fixes

- Remove unused user viewsets and update database credentials in environment files
  ([`f3c4e94`](https://github.com/telast-technologies/beautycops-back/commit/f3c4e94e414435fb7be2c16579e49716fa7eca29))


## v1.1.1 (2025-12-27)

### Bug Fixes

- Update DATABASE_URL to correct postgres service reference
  ([`dc4f06e`](https://github.com/telast-technologies/beautycops-back/commit/dc4f06e9dbe089b59aab797e54dbab669c053ea8))


## v1.1.0 (2025-12-27)

### Bug Fixes

- Clean up code formatting and improve import order across multiple files
  ([`66030f0`](https://github.com/telast-technologies/beautycops-back/commit/66030f08181e579df920191d89ae22823949f988))

- Remove notification-related code and update user serializers for improved password validation
  ([`91aa245`](https://github.com/telast-technologies/beautycops-back/commit/91aa245ecdb9f9c1122d0ab7f710b0ebd13c811e))

### Features

- Add haircare and makeup product management with safety scoring
  ([`24f2906`](https://github.com/telast-technologies/beautycops-back/commit/24f29063cb50f982e0b42df84a02aece373dbdb1))


## v1.0.1 (2025-12-27)

### Bug Fixes

- Update postgres host port in docker-compose for QA
  ([`0110a40`](https://github.com/telast-technologies/beautycops-back/commit/0110a40bbe52cfb38dbaf446274ddd9f9e1752f4))


## v1.0.0 (2025-12-27)

- Initial Release

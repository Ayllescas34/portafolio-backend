# Backend — API NestJS

API REST del portafolio. Instalación, variables de entorno y comandos en el
[README principal](../README.md) y en el [manual](../docs/MANUAL.md); contrato en
[`docs/api.md`](../docs/api.md).

| Script | Uso |
|---|---|
| `npm run start:dev` | API en http://localhost:3000 (Swagger en `/api/docs`) |
| `npm test` / `npm run test:integration` | Pruebas unitarias / de integración (PostgreSQL `*_test`) |
| `npm run db:deploy` / `npm run db:seed` | Migraciones / datos iniciales |
| `npm run admin:create` | Crear o restablecer el administrador |
| `npm run lint` / `npm run build` | Calidad / compilación |

# 📬 Notification Service

Serviço de **notificação** em **NestJS + TypeScript** que escuta eventos via **Kafka** e envia notificações por **e-mail** (com templates dinâmicos).  
Também permite disparar notificações manualmente por endpoint HTTP.

---

## 🔹 Funcionalidades

- Escuta eventos de vídeo em um **tópico Kafka** único (`video-events`);
- Suporta múltiplos tipos de eventos via campo `eventType`:
  - `VIDEO_PROCESSED` → Vídeo processado com sucesso ✅
  - `VIDEO_FAILED` → Falha no processamento ❌
- Envia e-mails com **templates diferentes** para cada tipo de evento;
- Exposição de **endpoint REST** para disparar notificações manualmente (`POST /notifications`);
- Estruturado seguindo princípios de **Clean Architecture**:
  - `domain/` → entidades e contratos  
  - `application/` → casos de uso  
  - `infrastructure/` → adaptadores (Kafka, Mail, Controllers)

---

## 🔹 Arquitetura

```

src/
domain/            # entidades e regras de negócio
application/       
  interfaces/
    dto/
    controllers/ 
  use-cases/ # casos de uso
infrastructure/    # kafka, mail, controllers
main.ts
app.module.ts
templates/           # templates Handlebars para e-mail

```

---

## 🔹 Pré-requisitos

- [Node.js 18+](https://nodejs.org/en)
- [Docker](https://www.docker.com/) (para Kafka + MailHog)
- [NestJS CLI](https://docs.nestjs.com/cli/overview) (opcional)

---

## 🔹 Setup do projeto

Clone o repositório e instale dependências:

```bash
git clone git@github.com:FIAP-Tech-Challenge-SOAT-10/notification-service-hackaton.git
cd notification-service-hackaton
npm install
```

---

## 🔹 Variáveis de ambiente

Configure o arquivo `.env`:

```env
PORT=3000

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=notification-service
KAFKA_TOPIC=video-events

# SMTP (usando MailHog para dev)
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=no-reply@example.com
```

---

## 🔹 Subindo dependências (Kafka + MailHog)

```bash
docker-compose up -d
```

* Kafka: `localhost:9092`
* MailHog UI: [http://localhost:8025](http://localhost:8025)

---

## 🔹 Rodando a aplicação

```bash
npm run start:dev
```

A aplicação iniciará em [http://localhost:3000](http://localhost:3000)

---

## 🔹 Endpoint HTTP

```http
POST /notifications
Content-Type: application/json
```

### Exemplo de payload:

```json
{
  "eventId": "evt-123",
  "eventType": "VIDEO_FAILED",
  "timestamp": "2025-09-14T12:00:00Z",
  "user": {
    "id": "u1",
    "name": "Rafa",
    "email": "teste@exemplo.com"
  },
  "data": {
    "videoId": "vid-2",
    "videoTitle": "Aula de NestJS",
    "errorMessage": "Timeout"
  }
}
```

---

## 🔹 Testando via Kafka Producer

Exemplo de script (já incluso no projeto em `src/tools/producer.ts`):

```bash
npm run produce
```

Isso enviará uma mensagem de teste para o tópico Kafka configurado.

---

## 🔹 Templates de e-mail

* `templates/video_processed.hbs`
* `templates/video_failed.hbs`

Use [Handlebars](https://handlebarsjs.com/) para personalizar os templates.

---

## 🔹 Próximos passos (Melhorias)

* Suporte a **push notifications** e **webhooks** além de e-mail.
* Retry com DLQ no Kafka.
* Observabilidade (Prometheus, Grafana, OpenTelemetry).
* Integração com provedores de e-mail em produção (SendGrid, SES, etc).

---

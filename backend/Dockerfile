# ==========================================
# Build Stage
# ==========================================
FROM golang:alpine AS builder

WORKDIR /app

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates tzdata

# Cache Go dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/api-server ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/migrate-runner ./cmd/migrate

# ==========================================
# Final Stage (Lightweight Alpine)
# ==========================================
FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Makassar

# Copy binaries and migration scripts
COPY --from=builder /app/api-server /app/api-server
COPY --from=builder /app/migrate-runner /app/migrate-runner
COPY --from=builder /app/migrations /app/migrations

# Create upload directory
RUN mkdir -p /app/uploads

EXPOSE 8080

CMD ["/bin/sh", "-c", "/app/migrate-runner up && /app/migrate-runner seed && /app/api-server"]

#!/bin/bash
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar parâmetros
if [ -z "$1" ]; then
    echo -e "${RED}❌ Uso: ./rollback.sh rollback-YYYYMMDD-HHMMSS${NC}"
    echo -e "${YELLOW}📋 Tags disponíveis:${NC}"
    git tag -l "rollback-*" | tail -10
    exit 1
fi

ROLLBACK_TAG=$1

# Verificar se a tag existe
if ! git rev-parse --verify "$ROLLBACK_TAG" >/dev/null 2>&1; then
    echo -e "${RED}❌ Tag '$ROLLBACK_TAG' não encontrada${NC}"
    exit 1
fi

# Verificar variáveis AWS
if [ -z "$S3_BUCKET" ] || [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${RED}❌ Erro: Variáveis S3_BUCKET e CLOUDFRONT_DISTRIBUTION_ID devem estar definidas${NC}"
    exit 1
fi

echo -e "${YELLOW}🔄 Iniciando rollback para: $ROLLBACK_TAG${NC}"

# Fazer checkout da tag
git checkout $ROLLBACK_TAG

# Sync arquivos para S3
echo -e "${YELLOW}📦 Restaurando arquivos no S3...${NC}"
aws s3 sync . s3://$S3_BUCKET \
  --exclude ".git/*" \
  --exclude ".github/*" \
  --exclude "scripts/*" \
  --exclude "README.md" \
  --exclude "AWS-DEPLOY-GUIDE.md" \
  --delete

# Invalidar cache do CloudFront
echo -e "${YELLOW}🔄 Invalidando cache do CloudFront...${NC}"
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"

# Voltar para main
git checkout main

echo -e "${GREEN}✅ Rollback concluído com sucesso!${NC}"
echo -e "${GREEN}🌐 Site: https://trafego.seudominio.com.br${NC}"
echo -e "${GREEN}🔄 Restaurado para: $ROLLBACK_TAG${NC}"
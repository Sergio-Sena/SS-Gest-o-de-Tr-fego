#!/bin/bash
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se as variáveis estão definidas
if [ -z "$S3_BUCKET" ] || [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${RED}❌ Erro: Variáveis S3_BUCKET e CLOUDFRONT_DISTRIBUTION_ID devem estar definidas${NC}"
    exit 1
fi

echo -e "${YELLOW}🚀 Iniciando deploy para produção...${NC}"

# Criar tag de rollback
ROLLBACK_TAG="rollback-$(date +%Y%m%d-%H%M%S)"
git tag $ROLLBACK_TAG
git push origin $ROLLBACK_TAG
echo -e "${GREEN}✅ Tag de rollback criada: $ROLLBACK_TAG${NC}"

# Sync arquivos para S3
echo -e "${YELLOW}📦 Enviando arquivos para S3...${NC}"
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

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}🌐 Site: https://trafego.seudominio.com.br${NC}"
echo -e "${GREEN}🔄 Rollback disponível: $ROLLBACK_TAG${NC}"
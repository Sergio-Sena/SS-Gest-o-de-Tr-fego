# 🚀 Guia Completo de Deploy AWS - SS Gestão de Tráfego

## 📋 FASE 1: Configuração de Certificados SSL/TLS com ACM

### 1.1 Solicitar Certificado no ACM
```bash
# Via AWS CLI
aws acm request-certificate \
  --domain-name "trafego.seudominio.com.br" \
  --subject-alternative-names "*.seudominio.com.br" \
  --validation-method DNS \
  --region us-east-1
```

**Via Console AWS:**
1. Acesse AWS Certificate Manager (ACM)
2. Clique em "Request a certificate"
3. Adicione domínios:
   - `trafego.seudominio.com.br`
   - `*.seudominio.com.br` (para futuros subdomínios)
4. Escolha "DNS validation"

### 1.2 Validar Certificado
1. ACM fornecerá registros CNAME
2. Adicione no Route53:
   ```
   Tipo: CNAME
   Nome: _abc123.trafego.seudominio.com.br
   Valor: _xyz789.acm-validations.aws
   ```
3. Aguarde validação (5-10 minutos)

---

## 📋 FASE 2: Configuração S3 com Segurança

### 2.1 Criar Bucket S3
```bash
# Criar bucket
aws s3 mb s3://trafego-seudominio-com-br --region us-east-1

# Bloquear acesso público
aws s3api put-public-access-block \
  --bucket trafego-seudominio-com-br \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 2.2 Configurar Bucket Policy (Após criar OAC)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::trafego-seudominio-com-br/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT-ID:distribution/DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

---

## 📋 FASE 3: Configuração CloudFront com OAC

### 3.1 Criar Origin Access Control (OAC)
```bash
# Via CLI
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
  Name="trafego-oac",Description="OAC for SS Gestao Trafego",OriginAccessControlOriginType="s3",SigningBehavior="always",SigningProtocol="sigv4"
```

### 3.2 Criar Distribuição CloudFront
```json
{
  "CallerReference": "trafego-distribution-2025",
  "Aliases": {
    "Quantity": 1,
    "Items": ["trafego.seudominio.com.br"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-trafego-origin",
        "DomainName": "trafego-seudominio-com-br.s3.us-east-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginAccessControlId": "OAC-ID-AQUI"
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-trafego-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
```

---

## 📋 FASE 4: Configuração Route53

### 4.1 Criar Registro CNAME
```bash
# Via CLI
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "trafego.seudominio.com.br",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d1234567890.cloudfront.net"}]
      }
    }]
  }'
```

---

## 📋 FASE 5: GitHub Actions CI/CD

### 5.1 Secrets GitHub
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=trafego-seudominio-com-br
CLOUDFRONT_DISTRIBUTION_ID=E1234567890
```

### 5.2 Workflow Deploy (.github/workflows/deploy-prod.yml)
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Create rollback tag
        run: |
          git tag rollback-$(date +%Y%m%d-%H%M%S)
          git push origin --tags
      
      - name: Deploy to S3
        run: |
          aws s3 sync . s3://${{ secrets.S3_BUCKET }} \
            --exclude ".git/*" \
            --exclude ".github/*" \
            --exclude "README.md" \
            --exclude "AWS-DEPLOY-GUIDE.md" \
            --delete
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### 5.3 Workflow Rollback (.github/workflows/rollback.yml)
```yaml
name: Rollback Production
on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Rollback tag (rollback-YYYYMMDD-HHMMSS)'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          ref: ${{ github.event.inputs.tag }}
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Deploy rollback
        run: |
          aws s3 sync . s3://${{ secrets.S3_BUCKET }} \
            --exclude ".git/*" \
            --exclude ".github/*" \
            --exclude "README.md" \
            --exclude "AWS-DEPLOY-GUIDE.md" \
            --delete
          
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

---

## 📋 FASE 6: Estrutura do Projeto

```
SS-Gestão-de-Tráfego/
├── .github/
│   └── workflows/
│       ├── deploy-prod.yml
│       └── rollback.yml
├── css/
│   └── style.css
├── js/
│   └── script.js
├── index.html
├── calculadora-roi.html
├── guia-ia.html
├── sitemap.xml
├── robots.txt
├── README.md
└── AWS-DEPLOY-GUIDE.md
```

---

## 📋 FASE 7: Comandos de Verificação

### 7.1 Testar Certificado SSL
```bash
# Verificar certificado
openssl s_client -connect trafego.seudominio.com.br:443 -servername trafego.seudominio.com.br

# Verificar headers de segurança
curl -I https://trafego.seudominio.com.br
```

### 7.2 Testar CloudFront
```bash
# Verificar cache
curl -I https://trafego.seudominio.com.br
# Procurar por: X-Cache: Hit from cloudfront

# Testar invalidação
aws cloudfront create-invalidation \
  --distribution-id E1234567890 \
  --paths "/*"
```

---

## 🎯 Fluxo de Trabalho

### Desenvolvimento
```bash
git checkout dev
git add .
git commit -m "feat: nova funcionalidade"
git push origin dev
```

### Produção
```bash
git checkout main
git merge dev
git push origin main  # ← AUTO-DEPLOY
```

### Rollback
```bash
# Via GitHub Actions (manual trigger)
# Ou listar tags disponíveis:
git tag -l "rollback-*"
```

---

## 💰 Custos Estimados

- **S3**: ~$3/mês
- **CloudFront**: ~$8/mês  
- **Route53**: ~$0.50/mês
- **ACM**: Gratuito
- **Total**: ~$11.50/mês

---

## 🔒 Checklist de Segurança

- [ ] Bucket S3 com acesso público bloqueado
- [ ] OAC configurado corretamente
- [ ] Certificado SSL/TLS validado
- [ ] HTTPS redirect ativo
- [ ] Headers de segurança configurados
- [ ] Backup automático via tags Git

---

## 📞 Suporte

Para dúvidas sobre esta configuração:
- Email: senanetworker@gmail.com
- WhatsApp: (11) 98496-9596

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0
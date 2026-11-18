# Pixel Meta + UTMs — Deveu Perdeu

Pixel instalado: 3540274636135879.

- index.html: PageView, ViewContent e AddToCart no clique dos links de checkout.
- checkout.html: PageView, InitiateCheckout, AddPaymentInfo e PixGenerated após gerar cobrança.
- Purchase: apenas quando /api/status retornar PAID; eventID baseado no ID da transação e prevenção local de duplicidade.
- UTMs e fbclid: persistidos no navegador, repassados ao checkout e incluídos no metadata da cobrança da SkalePayments.

## Limitações importantes

- A API de Conversões (CAPI) **ainda não está ativa**. É necessário configurar o token privado na Vercel e uma rotina segura de confirmação de pagamento (webhook autenticado ou reconciliação confiável). Não coloque o token no HTML/GitHub.
- O evento Purchase no navegador depende de o cliente manter a página aberta até a SkalePayments retornar PAID. Portanto pode perder vendas; para rastreamento completo precisa da CAPI server-side.
- Abandono de carrinho é calculado por eventos de início sem Purchase; não é um evento padrão enviado automaticamente.
- Teste no Gerenciador de Eventos > Testar eventos. Não faça um novo pagamento apenas para testar Pixel.
- O pacote mantém os arquivos e layout do repositório enviado; não houve teste de pagamento real.

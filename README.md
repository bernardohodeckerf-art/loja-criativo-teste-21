# Espaço das Flores

Loja com React, TypeScript, Tailwind CSS, Framer Motion e backend Node.js 24. Componentes compartilhados em `src/components/ui`, estilos em `src/index.css` e alias `@/`. Estrutura compatível com shadcn/ui; para adicionar componentes: `npx shadcn@latest init` e revise as alterações geradas.

## Instalação e desenvolvimento

```sh
cd /workspace/loja-criativo-teste-21
npm ci --cache /workspace/.npm-cache
npm run dev -- --host 0.0.0.0
```

O comando inicia a API na porta 3001 e o Vite na 5173, com proxy de `/api` e `/uploads`. O catálogo inicial está em `server/seed.json`: aplicado apenas uma vez por banco. Alterações posteriores são feitas pelo painel, sem sobrescrever produtos na inicialização. Valores e estoques iniciais devem ser revisados pela loja antes de receber pedidos reais.

```sh
npm run build
npm run test:api
npm test
```

Os testes de navegador usam uma API e banco temporários próprios, sem alterar o banco da loja, e geram uma senha de teste aleatória. Usam Chromium em `/usr/bin/chromium`; configure `CHROMIUM_PATH` para outro caminho se necessário.

## Configurar o login

Não há senha padrão nem acesso administrativo público. Execute uma vez no servidor:

```sh
npm run admin:setup
```

Informe o usuário e uma senha com pelo menos 12 caracteres. A senha é digitada sem ser exibida e apenas seu hash scrypt com salt aleatório é armazenado. O mesmo comando permite redefinir o acesso e revoga as sessões anteriores. Para automação, aceita `FLOWERS_ADMIN_USERNAME` e `FLOWERS_ADMIN_PASSWORD` pelo gerenciador seguro de segredos do servidor: nunca salve valores no Git ou em comandos compartilhados.

Acesse `/admin` e entre. O painel permite criar, editar, ativar/desativar e excluir produtos, editar estoque, preço, categoria e variações, marcar destaques e enviar até oito fotos por produto. Uploads PNG/JPEG/WebP são validados pelos bytes e convertidos para WebP, limitados a 8 MB e 40 megapixels. Clique numa foto para usá-la como capa. O catálogo público só retorna produtos ativos. Até quatro destaques aparecem na home. Conflitos entre edições simultâneas são detectados, sem sobrescrever silenciosamente outra alteração.

Sessões no servidor com cookie HttpOnly, SameSite=Strict, expiração de oito horas, proteção CSRF e validação de origem. Em produção, o cookie também é Secure: HTTPS é obrigatório. Cinco falhas de login bloqueiam o IP por 15 minutos, inclusive após reiniciar a aplicação.

## Produção

Hospede em serviço com **Node.js 24, processo contínuo, HTTPS e disco persistente**. Hospedagem exclusivamente estática não executa este backend. Banco e uploads compartilham o diretório `FLOWERS_DATA_DIR` (padrão `.data`). Não use armazenamento efêmero: os produtos e imagens seriam perdidos ao reiniciar o serviço. SQLite atende a uma instância; para múltiplas réplicas, migre o banco e os uploads para serviços compartilhados.

Configure variáveis no painel seguro da hospedagem:

- `NODE_ENV=production`
- `APP_ORIGIN=https://seu-dominio` (sem barra final)
- `HOST=0.0.0.0`
- `PORT` conforme a hospedagem (padrão 3001)
- `FLOWERS_DATA_DIR` apontando para o volume persistente
- `TRUST_PROXY=1` somente quando houver um proxy reverso confiável diretamente à frente da aplicação

```sh
npm ci
npm run build
npm start
```

O servidor serve `dist`, API, uploads, fallback de rotas e metadados por rota. Verifique `/api/health`, `/loja`, `/admin` e um produto. Execute `npm run admin:setup` no mesmo diretório/volume da aplicação para criar seu acesso. Não publique o diretório `.data` como estático.

Também há um `Dockerfile` com usuário sem privilégios e healthcheck. Para esse caminho, configure o domínio HTTPS no proxy da hospedagem, monte um volume em `/app/.data` e inicialize o administrador com `docker exec -it <container> node server/setup-admin.mjs`. O Dockerfile foi preparado; a execução Docker não faz parte da validação desta sessão.

Para backup, use a API de backup SQLite ou uma ferramenta de backup online que preserve banco, WAL e consistência; inclua a pasta de uploads. Restaure e teste backups antes de depender deles. Não copie apenas `flowers.sqlite` enquanto houver escrita ativa.

## Pedidos e WhatsApp

Destino **confirmado pelo usuário**: `https://wa.me/554792036899`. Contatos e horários ficam em `src/data.ts`; o mesmo número é usado pelo checkout em `server/index.mjs`. O carrinho persiste no navegador. Antes de finalizar, o servidor consulta os produtos atuais, recalcula o subtotal e confere estoque agregado por produto e variações. Em seguida, o cliente abre a mensagem para revisar e enviar. Itens sob consulta, disponibilidade, entrega e pagamento são confirmados pela loja no atendimento. Não há cobrança online nem reserva automática de estoque.

## Fotos, logo, vídeo e conteúdo

- `public/media/hero.mp4`: versão web H.264 de 1,3 MB, silenciosa e com faststart do clipe solicitado, “Woman Arranging Flowers”, Anna Shvets/Pexels. Original usado fora do checkout: `/workspace/florista-original.mp4`. A referência original 4K está no Pexels; não é necessário baixar 4K para a página.
- `public/media/hero.webp`: poster real de 67 KB. O componente `src/components/ui/hero-media.tsx` tem pausa, fallback e evita baixar vídeo automaticamente com economia de dados ou movimento reduzido. A cena é de ambientação e não é apresentada como equipe da loja.
- `public/media/buques-hortensias*` e `decoracao-natalina*`: dois vídeos enviados pelo usuário e frames WebP deles. Galeria em `src/components/ui/media-gallery.tsx`, lista em `src/data.ts`. Reprodução sob demanda, controles nativos e navegação por teclado.
- Fotografias de produtos: envie pelo `/admin`. Os produtos sem foto correspondente mantêm placeholder identificado. Frames reais de hortênsias e decoração natalina foram associados somente aos itens correspondentes.
- Logo atual é uma marca tipográfica com ícone botânico. Para substituir pela marca oficial, coloque `public/media/logo.svg` e altere a marca no header/footer de `src/main.tsx`.
- Fontes locais em `public/fonts`; licenças OFL em `public/fonts/licenses`. Nenhuma requisição ao Google Fonts é necessária.
- Origem das mídias: `public/media/ORIGINS.md`.

**Arquivos ainda necessários:** as capturas de Instagram mostradas na conversa não vieram como arquivos PNG/JPG disponíveis para recorte. Não inventamos fotos da fachada nem de produtos. Anexe os arquivos originais para gerar recortes WebP sem ícones/menus e concluir a fachada real, sua ilustração em aquarela e as demais fotos da galeria. O segundo texto técnico citado no briefing também não foi recebido; a separação das camadas foi implementada a partir da descrição.

Endereço: Rua Frei Estanislau Schaette, 621, Água Verde, Blumenau–SC. Google Maps/Facebook serão adicionados quando houver URL confirmada. Datas e estatísticas devem refletir o material confirmado da loja. As duas avaliações foram transcritas da captura: 4,8 e 189 avaliações, sem atualização automática pelo Google; trecho de Mayara limitado à frase completa visível.

## Movimento e acessibilidade

A referência `https://sorveteria-landing.vercel.app` orientou entradas laterais, cena fixa durante parte da rolagem e camadas que mudam posição, escala e rotação. Implementação própria com Framer Motion e scroll nativo:

- `src/components/ui/floral-scroll-scene.tsx`: buquê real e camadas botânicas.
- `src/hooks/use-scroll-story.ts`: entradas em sequência, parallax e progresso.
- `src/hooks/use-motion-preference.ts`: acompanha mudanças da preferência do sistema.
- `src/components/ui/testimonial-v2.tsx`: adaptação do componente enviado, com pausa e modo estático. Não usa os depoimentos sobre ERP ou avatares genéricos do exemplo.

No mobile os deslocamentos são menores. Com movimento reduzido, a cena deixa de ficar fixa, os depoimentos param e o hero mantém o poster. O vídeo da galeria só é carregado ao solicitar reprodução.

A abertura em `src/components/ui/botanical-intro.tsx` dura 1,95 s, aparece uma vez por sessão e funciona sem aguardar as mídias. Ramos pintados entram pelas laterais, pétalas sobem, a marca é revelada como tinta e duas camadas de papel abrem a cena. O título do hero só inicia sua entrada depois da abertura. “Pular abertura” e Escape encerram a animação imediatamente; movimento reduzido omite a sequência.
